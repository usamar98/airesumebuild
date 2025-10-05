import { Router, Request, Response } from 'express';
import { supabase } from '../database/supabase';
import { authenticateSupabaseToken, SupabaseAuthenticatedRequest } from '../middleware/supabaseAuth';

const router = Router();

// GET /api/applicant/stats - Get applicant dashboard statistics
router.get('/stats', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    // Get total applications count
    const { count: totalApplications, error: totalError } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('applicant_id', req.user.id);

    if (totalError) {
      console.error('Error fetching total applications:', totalError);
      return res.status(500).json({ error: 'Failed to fetch statistics' });
    }

    // Get pending applications count
    const { count: pendingApplications, error: pendingError } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('applicant_id', req.user.id)
      .eq('status', 'pending');

    if (pendingError) {
      console.error('Error fetching pending applications:', pendingError);
      return res.status(500).json({ error: 'Failed to fetch statistics' });
    }

    // Get shortlisted applications count
    const { count: shortlistedApplications, error: shortlistedError } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('applicant_id', req.user.id)
      .eq('status', 'shortlisted');

    if (shortlistedError) {
      console.error('Error fetching shortlisted applications:', shortlistedError);
      return res.status(500).json({ error: 'Failed to fetch statistics' });
    }

    // Get saved jobs count
    const { count: savedJobs, error: savedError } = await supabase
      .from('saved_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id);

    if (savedError) {
      console.error('Error fetching saved jobs:', savedError);
      return res.status(500).json({ error: 'Failed to fetch statistics' });
    }

    res.json({
      total_applications: totalApplications || 0,
      pending_applications: pendingApplications || 0,
      shortlisted_applications: shortlistedApplications || 0,
      saved_jobs: savedJobs || 0
    });
  } catch (error) {
    console.error('Error in GET /applicant/stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/applicant/applications - Get applicant's applications with job details
router.get('/applications', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const { data: applications, error } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        applied_at,
        cover_letter,
        resume_url,
        job_postings!applications_job_posting_id_fkey(
          id,
          title,
          company_name,
          location,
          job_type,
          salary_min,
          salary_max
        )
      `)
      .eq('applicant_id', req.user.id)
      .order('applied_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
      return res.status(500).json({ error: 'Failed to fetch applications' });
    }

    // Transform the data to match the expected format
    const transformedApplications = applications?.map(app => {
      // Handle case where job_postings might be an array or single object
      const jobPosting = Array.isArray(app.job_postings) ? app.job_postings[0] : app.job_postings;
      
      return {
        id: app.id,
        job_id: jobPosting?.id,
        job_title: jobPosting?.title,
        company_name: jobPosting?.company_name,
        status: app.status,
        applied_at: app.applied_at,
        cover_letter: app.cover_letter,
        resume_url: app.resume_url,
        job_location: jobPosting?.location,
        job_type: jobPosting?.job_type,
        salary_range: jobPosting?.salary_min && jobPosting?.salary_max 
          ? `$${jobPosting.salary_min} - $${jobPosting.salary_max}`
          : null
      };
    }) || [];

    res.json(transformedApplications);
  } catch (error) {
    console.error('Error in GET /applicant/applications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/applicant/profile - Get applicant's profile
router.get('/profile', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Profile doesn't exist, return default structure
        return res.json({
          id: null,
          full_name: req.user.email?.split('@')[0] || '',
          email: req.user.email || '',
          phone: '',
          location: '',
          bio: '',
          skills: [],
          experience_level: '',
          resume_url: '',
          portfolio_url: '',
          linkedin_url: '',
          github_url: ''
        });
      }
      console.error('Error fetching profile:', error);
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }

    res.json({
      id: profile.id,
      full_name: profile.full_name || '',
      email: req.user.email || '',
      phone: profile.phone || '',
      location: profile.location || '',
      bio: profile.bio || '',
      skills: profile.skills || [],
      experience_level: profile.experience_level || '',
      resume_url: profile.resume_url || '',
      portfolio_url: profile.portfolio_url || '',
      linkedin_url: profile.linkedin_url || '',
      github_url: profile.github_url || ''
    });
  } catch (error) {
    console.error('Error in GET /applicant/profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/applicant/profile - Update applicant's profile
router.put('/profile', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const {
      full_name,
      phone,
      location,
      bio,
      skills,
      experience_level,
      resume_url,
      portfolio_url,
      linkedin_url,
      github_url
    } = req.body;

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    let result;
    if (existingProfile) {
      // Update existing profile
      result = await supabase
        .from('user_profiles')
        .update({
          full_name,
          phone,
          location,
          bio,
          skills,
          experience_level,
          resume_url,
          portfolio_url,
          linkedin_url,
          github_url,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', req.user.id)
        .select()
        .single();
    } else {
      // Create new profile
      result = await supabase
        .from('user_profiles')
        .insert({
          user_id: req.user.id,
          full_name,
          phone,
          location,
          bio,
          skills,
          experience_level,
          resume_url,
          portfolio_url,
          linkedin_url,
          github_url
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error('Error updating profile:', result.error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    res.json({
      id: result.data.id,
      full_name: result.data.full_name || '',
      email: req.user.email || '',
      phone: result.data.phone || '',
      location: result.data.location || '',
      bio: result.data.bio || '',
      skills: result.data.skills || [],
      experience_level: result.data.experience_level || '',
      resume_url: result.data.resume_url || '',
      portfolio_url: result.data.portfolio_url || '',
      linkedin_url: result.data.linkedin_url || '',
      github_url: result.data.github_url || ''
    });
  } catch (error) {
    console.error('Error in PUT /applicant/profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/applicant/saved-jobs - Get applicant's saved jobs
router.get('/saved-jobs', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const { data: savedJobs, error } = await supabase
      .from('saved_jobs')
      .select(`
        id,
        job_id,
        saved_at,
        job_postings!saved_jobs_job_id_fkey(
          id,
          title,
          company_name,
          location,
          salary_min,
          salary_max,
          posted_date
        )
      `)
      .eq('user_id', req.user.id)
      .order('saved_at', { ascending: false });

    if (error) {
      console.error('Error fetching saved jobs:', error);
      return res.status(500).json({ error: 'Failed to fetch saved jobs' });
    }

    // Transform the data to match the expected format
    const transformedSavedJobs = savedJobs?.map(savedJob => {
      // Handle case where job_postings might be an array or single object
      const jobPosting = Array.isArray(savedJob.job_postings) ? savedJob.job_postings[0] : savedJob.job_postings;
      
      return {
        id: savedJob.id,
        job_id: savedJob.job_id,
        title: jobPosting?.title || '',
        company_name: jobPosting?.company_name || '',
        location: jobPosting?.location || '',
        budget: jobPosting?.salary_min && jobPosting?.salary_max 
          ? `$${jobPosting.salary_min} - $${jobPosting.salary_max}`
          : '',
        posted_date: jobPosting?.posted_date || '',
        saved_at: savedJob.saved_at,
        is_posted_job: true,
        source_url: null
      };
    }) || [];

    res.json(transformedSavedJobs);
  } catch (error) {
    console.error('Error in GET /applicant/saved-jobs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;