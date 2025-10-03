import { Router, Request, Response } from 'express';
import { supabase } from '../database/supabase.js';
import { authenticateSupabaseToken, SupabaseAuthenticatedRequest } from '../middleware/supabaseAuth';
import { openaiService } from '../services/openaiService';

const router = Router();

interface JobPosting {
  id?: string;
  title: string;
  description: string;
  company_name: string;
  company_logo?: string;
  company_website?: string;
  company_size?: string;
  company_description?: string;
  location: string;
  location_type?: 'remote' | 'hybrid' | 'on-site' | 'onsite';
  job_type: 'full_time' | 'part_time' | 'contract' | 'freelance';
  employment_type?: 'permanent' | 'temporary' | 'contract' | 'internship';
  experience_level: 'entry' | 'mid' | 'senior' | 'executive';
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  skills?: string[];
  requirements?: any;
  responsibilities?: string;
  benefits?: string[];
  remote_allowed?: boolean;
  application_deadline?: string;
  interview_process?: string;
  education_requirements?: string;
  work_authorization?: string;
  travel_requirements?: string;
  department?: string;
  reporting_to?: string;
  job_category?: string;
  urgency_level?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'active' | 'paused' | 'closed' | 'draft';
  posted_by?: string;
}

// GET /api/job-postings - Get all published job postings with pagination and filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      location,
      job_type,
      experience_level,
      location_type,
      remote_allowed,
      skills,
      salary_min,
      salary_max,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('job_postings')
      .select(`
        *,
        users!job_postings_posted_by_fkey(
          id,
          email,
          full_name
        )
      `, { count: 'exact' })
      .eq('status', 'active');

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,company_name.ilike.%${search}%`);
    }

    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    if (job_type) {
      query = query.eq('job_type', job_type);
    }

    if (experience_level) {
      query = query.eq('experience_level', experience_level);
    }

    if (location_type) {
      query = query.eq('location_type', location_type);
    }

    if (remote_allowed === 'true') {
      query = query.eq('remote_allowed', true);
    }

    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      query = query.overlaps('skills_required', skillsArray);
    }

    if (salary_min) {
      query = query.gte('salary_min', Number(salary_min));
    }

    if (salary_max) {
      query = query.lte('salary_max', Number(salary_max));
    }

    // Apply sorting
    query = query.order(sort_by as string, { ascending: sort_order === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + Number(limit) - 1);

    const { data: jobPostings, error, count } = await query;

    if (error) {
      console.error('Error fetching job postings:', error);
      return res.status(500).json({ error: 'Failed to fetch job postings' });
    }

    res.json({
      jobs: jobPostings || [],
      total: count || 0,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    console.error('Error in GET /job-postings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/job-postings/stats - Get job statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Get total jobs count
    const { count: totalJobs } = await supabase
      .from('job_postings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Get unique companies count
    const { data: companies } = await supabase
      .from('job_postings')
      .select('company_name')
      .eq('status', 'active');
    
    const uniqueCompanies = new Set(companies?.map(job => job.company_name)).size;

    // Get remote jobs count
    const { count: remoteJobs } = await supabase
      .from('job_postings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('location_type', 'remote');

    // Get jobs posted today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: newToday } = await supabase
      .from('job_postings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .gte('created_at', today.toISOString());

    res.json({
      totalJobs: totalJobs || 0,
      companies: uniqueCompanies || 0,
      remoteJobs: remoteJobs || 0,
      newToday: newToday || 0
    });
  } catch (error) {
    console.error('Error fetching job stats:', error);
    res.status(500).json({ error: 'Failed to fetch job statistics' });
  }
});

// GET /api/job-postings/:id - Get specific job posting details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: jobPosting, error } = await supabase
      .from('job_postings')
      .select(`
        *,
        users!job_postings_posted_by_fkey(
          id,
          email,
          full_name
        )
      `)
      .eq('id', id)
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Job posting not found' });
      }
      console.error('Error fetching job posting:', error);
      return res.status(500).json({ error: 'Failed to fetch job posting' });
    }

    res.json(jobPosting);
  } catch (error) {
    console.error('Error in GET /job-postings/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/job-postings - Create new job posting (protected)
router.post('/', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  console.log('=== POST /api/job-postings route handler called ===');
  try {
    console.log('Received job posting data:', req.body);
    
    const {
      title,
      description,
      company_name,
      company_logo,
      company_website,
      company_size,
      company_description,
      requirements,
      responsibilities,
      job_type,
      employment_type,
      location_type,
      location,
      salary_min,
      salary_max,
      currency,
      experience_level,
      skills,
      benefits,
      application_deadline,
      interview_process,
      education_requirements,
      work_authorization,
      travel_requirements,
      department,
      reporting_to,
      job_category,
      urgency_level,
      status
    } = req.body;
    
    console.log('Extracted location_type:', location_type);
    console.log('Extracted location:', location);
    
    // Validate required fields
    if (!title || !description || !company_name) {
      return res.status(400).json({ 
        error: 'Missing required fields: title, description, and company_name are required' 
      });
    }

    // Ensure location_type is provided (required for location mapping)
    const finalLocationValue = location_type || location || 'remote';
    console.log('Final location value:', finalLocationValue);
    if (!finalLocationValue) {
      return res.status(400).json({ 
        error: 'Missing required field: location_type or location must be provided' 
      });
    }

    // Map frontend data to backend schema
    const newJobPosting = {
      title: title.trim(),
      description: description.trim(),
      company_name: company_name.trim(),
      company_logo: company_logo || null,
      company_website: company_website || null,
      company_size: company_size || null,
      company_description: company_description || null,
      requirements: requirements || '',
      responsibilities: responsibilities || '',
      // Map location_type to location field for database compatibility
      location: finalLocationValue,
      location_type: location_type || 'remote',
      // Convert job_type format (frontend uses hyphens, backend uses underscores)
      job_type: job_type?.replace('-', '_') || 'full_time',
      employment_type: employment_type || 'permanent',
      // Set default experience level if not provided
      experience_level: experience_level || 'mid',
      salary_min: salary_min ? Number(salary_min) : null,
      salary_max: salary_max ? Number(salary_max) : null,
      currency: currency || 'USD',
      // Handle skills array
      skills: Array.isArray(skills) ? skills : [],
      // Handle benefits array
      benefits: Array.isArray(benefits) ? benefits : [],
      // Set remote_allowed based on location_type
      remote_allowed: location_type === 'remote' || location_type === 'hybrid',
      application_deadline: application_deadline || null,
      interview_process: interview_process || null,
      education_requirements: education_requirements || null,
      work_authorization: work_authorization || null,
      travel_requirements: travel_requirements || null,
      department: department || null,
      reporting_to: reporting_to || null,
      job_category: job_category || null,
      urgency_level: urgency_level || 'medium',
      status: status || 'active',
      posted_by: req.user?.id || null
    };

    console.log('Mapped job posting data for database:', newJobPosting);
    console.log('About to insert job posting:', newJobPosting);
    console.log('Location field in newJobPosting:', newJobPosting.location);

    const { data: jobPosting, error } = await supabase
      .from('job_postings')
      .insert([newJobPosting])
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating job posting:', error);
      return res.status(500).json({ 
        error: 'Failed to create job posting', 
        details: error.message 
      });
    }

    console.log('Job posting created successfully:', jobPosting);
    res.status(201).json({
      success: true,
      message: 'Job posted successfully!',
      job: jobPosting
    });
  } catch (error) {
    console.error('Error in POST /job-postings:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/job-postings/:id - Update job posting (protected)
router.put('/:id', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if user owns this job posting
    const { data: existingJob, error: fetchError } = await supabase
      .from('job_postings')
      .select('posted_by')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Job posting not found' });
      }
      return res.status(500).json({ error: 'Failed to fetch job posting' });
    }

    if (existingJob.posted_by !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this job posting' });
    }

    const { data: updatedJob, error } = await supabase
      .from('job_postings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating job posting:', error);
      return res.status(500).json({ error: 'Failed to update job posting' });
    }

    res.json(updatedJob);
  } catch (error) {
    console.error('Error in PUT /job-postings/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/job-postings/:id - Delete job posting (protected)
router.delete('/:id', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user owns this job posting
    const { data: existingJob, error: fetchError } = await supabase
      .from('job_postings')
      .select('posted_by')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Job posting not found' });
      }
      return res.status(500).json({ error: 'Failed to fetch job posting' });
    }

    if (existingJob.posted_by !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this job posting' });
    }

    const { error } = await supabase
      .from('job_postings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting job posting:', error);
      return res.status(500).json({ error: 'Failed to delete job posting' });
    }

    res.json({ success: true, message: 'Job posting deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /job-postings/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/job-postings/:id/status - Update job posting status (protected)
router.patch('/:id/status', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['active', 'paused', 'closed', 'draft'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be one of: active, paused, closed, draft' 
      });
    }

    // Check if user owns this job posting
    const { data: existingJob, error: fetchError } = await supabase
      .from('job_postings')
      .select('posted_by, status')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Job posting not found' });
      }
      return res.status(500).json({ error: 'Failed to fetch job posting' });
    }

    if (existingJob.posted_by !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this job posting' });
    }

    // Update the status
    const { data: updatedJob, error } = await supabase
      .from('job_postings')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating job status:', error);
      return res.status(500).json({ error: 'Failed to update job status' });
    }

    res.json({
      success: true,
      message: `Job status updated to ${status}`,
      job: updatedJob
    });
  } catch (error) {
    console.error('Error in PATCH /job-postings/:id/status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/job-postings/my/posts - Get current user's job postings (protected)
router.get('/my/posts', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('job_postings')
      .select('*', { count: 'exact' })
      .eq('posted_by', req.user.id);

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order(sort_by as string, { ascending: sort_order === 'asc' });
    query = query.range(offset, offset + Number(limit) - 1);

    const { data: jobPostings, error, count } = await query;

    if (error) {
      console.error('Error fetching user job postings:', error);
      return res.status(500).json({ error: 'Failed to fetch job postings' });
    }

    res.json({
      job_postings: jobPostings || [],
      total: count || 0,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    console.error('Error in GET /job-postings/my/posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/job-postings/ai/optimize - AI-powered job posting optimization (protected)
router.post('/ai/optimize', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const { title, description, company_name, job_type, experience_level } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const prompt = `
Optimize this job posting to be more attractive to candidates and improve application rates:

Title: ${title}
Company: ${company_name}
Job Type: ${job_type}
Experience Level: ${experience_level}
Description: ${description}

Please provide:
1. An improved, more compelling job title
2. An optimized job description that:
   - Clearly outlines responsibilities
   - Highlights growth opportunities
   - Includes company culture elements
   - Uses inclusive language
   - Has a clear call-to-action
3. Suggested skills and qualifications
4. Recommended benefits to highlight

Format the response as JSON with keys: optimized_title, optimized_description, suggested_skills, recommended_benefits
`;

    const optimizedContent = await openaiService.generateText(prompt);
    
    try {
      const parsedContent = JSON.parse(optimizedContent);
      res.json(parsedContent);
    } catch (parseError) {
      // If JSON parsing fails, return the raw content
      res.json({ 
        optimized_content: optimizedContent,
        note: 'Content could not be parsed as JSON, returning raw optimization suggestions'
      });
    }
  } catch (error) {
    console.error('Error in POST /job-postings/ai/optimize:', error);
    res.status(500).json({ error: 'Failed to optimize job posting' });
  }
});

export default router;