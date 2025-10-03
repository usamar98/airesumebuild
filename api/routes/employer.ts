import { Router, Request, Response } from 'express';
import { supabase } from '../database/supabase';
import { authenticateSupabaseToken, SupabaseAuthenticatedRequest } from '../middleware/supabaseAuth';

const router = Router();

// GET /api/employer/stats - Get employer dashboard statistics
router.get('/stats', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    // Get total jobs count
    const { count: totalJobs, error: totalError } = await supabase
      .from('job_postings')
      .select('*', { count: 'exact', head: true })
      .eq('posted_by', req.user.id);

    if (totalError) {
      console.error('Error fetching total jobs:', totalError);
      return res.status(500).json({ error: 'Failed to fetch statistics' });
    }

    // Get active jobs count
    const { count: activeJobs, error: activeError } = await supabase
      .from('job_postings')
      .select('*', { count: 'exact', head: true })
      .eq('posted_by', req.user.id)
      .eq('status', 'published');

    if (activeError) {
      console.error('Error fetching active jobs:', activeError);
      return res.status(500).json({ error: 'Failed to fetch statistics' });
    }

    // Get total applications count for employer's jobs
    const { count: totalApplications, error: applicationsError } = await supabase
      .from('applications')
      .select('*, job_postings!inner(*)', { count: 'exact', head: true })
      .eq('job_postings.posted_by', req.user.id);

    if (applicationsError) {
      console.error('Error fetching total applications:', applicationsError);
      return res.status(500).json({ error: 'Failed to fetch statistics' });
    }

    // Get pending applications count for employer's jobs
    const { count: pendingApplications, error: pendingError } = await supabase
      .from('applications')
      .select('*, job_postings!inner(*)', { count: 'exact', head: true })
      .eq('job_postings.posted_by', req.user.id)
      .eq('status', 'pending');

    if (pendingError) {
      console.error('Error fetching pending applications:', pendingError);
      return res.status(500).json({ error: 'Failed to fetch statistics' });
    }

    res.json({
      total_jobs: totalJobs || 0,
      active_jobs: activeJobs || 0,
      total_applications: totalApplications || 0,
      pending_applications: pendingApplications || 0
    });
  } catch (error) {
    console.error('Error in GET /employer/stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/employer/jobs - Get employer's job postings
router.get('/jobs', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const { data: jobs, error } = await supabase
      .from('job_postings')
      .select(`
        id,
        title,
        company_name,
        location,
        location_type,
        job_type,
        salary_min,
        salary_max,
        status,
        created_at,
        application_deadline,
        view_count,
        applications:applications(count)
      `)
      .eq('posted_by', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching employer jobs:', error);
      return res.status(500).json({ error: 'Failed to fetch jobs' });
    }

    // Transform the data to match the expected format
    const transformedJobs = jobs?.map(job => ({
      id: job.id,
      title: job.title,
      company_name: job.company_name,
      location: job.location,
      location_type: job.location_type,
      job_type: job.job_type,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      status: job.status,
      applications_count: job.applications?.[0]?.count || 0,
      created_at: job.created_at,
      application_deadline: job.application_deadline,
      views_count: job.view_count || 0
    })) || [];

    res.json(transformedJobs);
  } catch (error) {
    console.error('Error in GET /employer/jobs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/employer/applications - Get applications for employer's jobs
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
          company_name
        ),
        users!applications_applicant_id_fkey(
          id,
          email,
          name
        )
      `)
      .eq('job_postings.posted_by', req.user.id)
      .order('applied_at', { ascending: false });

    if (error) {
      console.error('Error fetching employer applications:', error);
      return res.status(500).json({ error: 'Failed to fetch applications' });
    }

    // Transform the data to match the expected format
    const transformedApplications = applications?.map(app => ({
      id: app.id,
      job_id: app.job_postings?.id,
      job_title: app.job_postings?.title,
      applicant_name: app.users?.name || app.users?.email?.split('@')[0] || 'Unknown',
      applicant_email: app.users?.email,
      status: app.status,
      applied_at: app.applied_at,
      cover_letter: app.cover_letter,
      resume_url: app.resume_url
    })) || [];

    res.json(transformedApplications);
  } catch (error) {
    console.error('Error in GET /employer/applications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;