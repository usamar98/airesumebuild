import { Router, Request, Response } from 'express';
import { supabase } from '../database/supabase';
import { authenticateSupabaseToken, SupabaseAuthenticatedRequest } from '../middleware/supabaseAuth';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

interface Application {
  id?: string;
  job_posting_id: string;
  applicant_id: string;
  cover_letter?: string;
  resume_url?: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired';
  applied_at?: string;
  notes?: string;
}

// GET /api/applications - Get applications (different views for employers vs applicants)
router.get('/', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      job_posting_id,
      status,
      sort_by = 'applied_at',
      sort_order = 'desc',
      view = 'applicant' // 'applicant' or 'employer'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('applications')
      .select(`
        *,
        job_postings!applications_job_posting_id_fkey(
          id,
          title,
          company_name,
          location,
          job_type,
          status
        ),
        user_profiles!applications_applicant_id_fkey(
          full_name,
          email,
          phone,
          location
        )
      `, { count: 'exact' });

    if (view === 'applicant') {
      // Show applications made by the current user
      query = query.eq('applicant_id', req.user.id);
    } else if (view === 'employer') {
      // Show applications for jobs posted by the current user
      query = query.eq('job_postings.posted_by', req.user.id);
    }

    // Apply filters
    if (job_posting_id) {
      query = query.eq('job_posting_id', job_posting_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Apply sorting
    query = query.order(sort_by as string, { ascending: sort_order === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + Number(limit) - 1);

    const { data: applications, error, count } = await query;

    if (error) {
      console.error('Error fetching applications:', error);
      return res.status(500).json({ error: 'Failed to fetch applications' });
    }

    res.json({
      applications: applications || [],
      total: count || 0,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    console.error('Error in GET /applications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check if user has already applied for a job
router.get('/check/:job_id', async (req, res) => {
  try {
    const { job_id } = req.params;
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { data: application, error } = await supabase
      .from('applications')
      .select('id, status, applied_at')
      .eq('job_posting_id', job_id)
      .eq('applicant_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error;
    }

    res.json({ application: application || null });
  } catch (error) {
    console.error('Error checking application:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/applications/:id - Get specific application details
router.get('/:id', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: application, error } = await supabase
      .from('applications')
      .select(`
        *,
        job_postings!applications_job_posting_id_fkey(
          id,
          title,
          company_name,
          location,
          job_type,
          description,
          posted_by
        ),
        user_profiles!applications_applicant_id_fkey(
          full_name,
          email,
          phone,
          location,
          bio,
          skills,
          experience_years
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Application not found' });
      }
      console.error('Error fetching application:', error);
      return res.status(500).json({ error: 'Failed to fetch application' });
    }

    // Check if user has permission to view this application
    const isApplicant = application.applicant_id === req.user.id;
    const isEmployer = application.job_postings?.posted_by === req.user.id;

    if (!isApplicant && !isEmployer) {
      return res.status(403).json({ error: 'Not authorized to view this application' });
    }

    res.json(application);
  } catch (error) {
    console.error('Error in GET /applications/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/applications - Submit new job application (protected)
router.post('/', authenticateSupabaseToken, upload.single('resume'), async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const { job_posting_id, cover_letter } = req.body;
    const resumeFile = req.file;

    if (!job_posting_id) {
      return res.status(400).json({ error: 'Job posting ID is required' });
    }

    // Check if job posting exists and is published
    const { data: jobPosting, error: jobError } = await supabase
      .from('job_postings')
      .select('id, status, application_deadline, posted_by')
      .eq('id', job_posting_id)
      .eq('status', 'published')
      .single();

    if (jobError || !jobPosting) {
      return res.status(404).json({ error: 'Job posting not found or not available for applications' });
    }

    // Check if application deadline has passed
    if (jobPosting.application_deadline) {
      const deadline = new Date(jobPosting.application_deadline);
      if (new Date() > deadline) {
        return res.status(400).json({ error: 'Application deadline has passed' });
      }
    }

    // Check if user has already applied to this job
    const { data: existingApplication } = await supabase
      .from('applications')
      .select('id')
      .eq('job_posting_id', job_posting_id)
      .eq('applicant_id', req.user.id)
      .single();

    if (existingApplication) {
      return res.status(400).json({ error: 'You have already applied to this job' });
    }

    let resumeUrl = null;

    // Upload resume file if provided
    if (resumeFile) {
      const fileName = `resumes/${req.user.id}/${Date.now()}-${resumeFile.originalname}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('applications')
        .upload(fileName, resumeFile.buffer, {
          contentType: resumeFile.mimetype,
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading resume:', uploadError);
        return res.status(500).json({ error: 'Failed to upload resume' });
      }

      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('applications')
        .getPublicUrl(fileName);

      resumeUrl = urlData.publicUrl;
    }

    // Create the application
    const applicationData = {
      job_posting_id,
      applicant_id: req.user.id,
      cover_letter,
      resume_url: resumeUrl,
      status: 'pending' as const
    };

    const { data: application, error } = await supabase
      .from('applications')
      .insert([applicationData])
      .select(`
        *,
        job_postings!applications_job_posting_id_fkey(
          title,
          company_name
        )
      `)
      .single();

    if (error) {
      console.error('Error creating application:', error);
      return res.status(500).json({ error: 'Failed to submit application' });
    }

    // Create notification for the employer
    await supabase
      .from('notifications')
      .insert({
        user_id: jobPosting.posted_by,
        type: 'new_application',
        title: 'New Job Application',
        message: `You have received a new application for ${application.job_postings?.title}`,
        data: { application_id: application.id, job_posting_id }
      });

    res.status(201).json(application);
  } catch (error) {
    console.error('Error in POST /applications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/applications/:id/status - Update application status (employer only)
router.put('/:id/status', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Check if user is the employer for this application
    const { data: application, error: fetchError } = await supabase
      .from('applications')
      .select(`
        *,
        job_postings!applications_job_posting_id_fkey(
          posted_by,
          title
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Application not found' });
      }
      return res.status(500).json({ error: 'Failed to fetch application' });
    }

    if (application.job_postings?.posted_by !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this application' });
    }

    const { data: updatedApplication, error } = await supabase
      .from('applications')
      .update({ status, notes })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating application status:', error);
      return res.status(500).json({ error: 'Failed to update application status' });
    }

    // Create notification for the applicant
    const statusMessages = {
      reviewed: 'Your application is being reviewed',
      shortlisted: 'Congratulations! You have been shortlisted',
      rejected: 'Your application was not selected this time',
      hired: 'Congratulations! You have been selected for the position'
    };

    if (status !== 'pending') {
      await supabase
        .from('notifications')
        .insert({
          user_id: application.applicant_id,
          type: 'application_status_update',
          title: 'Application Status Update',
          message: `${statusMessages[status as keyof typeof statusMessages]} for ${application.job_postings?.title}`,
          data: { application_id: id, status }
        });
    }

    res.json(updatedApplication);
  } catch (error) {
    console.error('Error in PUT /applications/:id/status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/applications/:id - Withdraw application (applicant only)
router.delete('/:id', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user owns this application
    const { data: application, error: fetchError } = await supabase
      .from('applications')
      .select('applicant_id, resume_url')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Application not found' });
      }
      return res.status(500).json({ error: 'Failed to fetch application' });
    }

    if (application.applicant_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to withdraw this application' });
    }

    // Delete the application
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting application:', error);
      return res.status(500).json({ error: 'Failed to withdraw application' });
    }

    // Optionally delete the resume file from storage
    if (application.resume_url) {
      const fileName = application.resume_url.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('applications')
          .remove([`resumes/${req.user.id}/${fileName}`]);
      }
    }

    res.json({ success: true, message: 'Application withdrawn successfully' });
  } catch (error) {
    console.error('Error in DELETE /applications/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/applications/stats/employer - Get application statistics for employer
router.get('/stats/employer', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    // Get all job postings by the current user
    const { data: jobPostings, error: jobError } = await supabase
      .from('job_postings')
      .select('id')
      .eq('posted_by', req.user.id);

    if (jobError) {
      console.error('Error fetching job postings:', jobError);
      return res.status(500).json({ error: 'Failed to fetch statistics' });
    }

    const jobIds = jobPostings?.map(job => job.id) || [];

    if (jobIds.length === 0) {
      return res.json({
        total_applications: 0,
        pending: 0,
        reviewed: 0,
        shortlisted: 0,
        rejected: 0,
        hired: 0
      });
    }

    // Get application statistics
    const { data: stats, error: statsError } = await supabase
      .from('applications')
      .select('status')
      .in('job_posting_id', jobIds);

    if (statsError) {
      console.error('Error fetching application stats:', statsError);
      return res.status(500).json({ error: 'Failed to fetch statistics' });
    }

    const statusCounts = {
      total_applications: stats?.length || 0,
      pending: 0,
      reviewed: 0,
      shortlisted: 0,
      rejected: 0,
      hired: 0
    };

    stats?.forEach(app => {
      if (app.status in statusCounts) {
        statusCounts[app.status as keyof typeof statusCounts]++;
      }
    });

    res.json(statusCounts);
  } catch (error) {
    console.error('Error in GET /applications/stats/employer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;