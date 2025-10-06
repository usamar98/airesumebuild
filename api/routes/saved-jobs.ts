import { Router, Request, Response } from 'express';
import { supabase } from '../database/supabase';
import { authenticateSupabaseToken, SupabaseAuthenticatedRequest } from '../middleware/supabaseAuth';

const router = Router();

interface SavedJob {
  id: string;
  user_id: string;
  job_id: string;
  notes?: string;
  status: 'saved' | 'applied' | 'rejected' | 'interview';
  saved_at: string;
  job?: {
    id: string;
    title: string;
    description?: string;
    budget?: string;
    skills?: string[];
    client_info?: any;
    source: string;
    posted_date?: string;
  };
}

// GET /api/saved-jobs - Get user's saved jobs
router.get('/', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { status, page = 1, limit = 20 } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('saved_jobs')
      .select(`
        *,
        job:jobs(*)
      `, { count: 'exact' })
      .eq('user_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    query = query
      .order('saved_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    const { data: savedJobs, error, count } = await query;

    if (error) {
      console.error('Error fetching saved jobs:', error);
      return res.status(500).json({ error: 'Failed to fetch saved jobs' });
    }

    res.json({
      saved_jobs: savedJobs || [],
      total: count || 0,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    console.error('Error in GET /saved-jobs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/saved-jobs - Save a job
router.post('/', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { job_id, notes, status = 'saved' } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!job_id) {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    // Check if job exists
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if already saved
    const { data: existingSave } = await supabase
      .from('saved_jobs')
      .select('id')
      .eq('user_id', userId)
      .eq('job_id', job_id)
      .single();

    if (existingSave) {
      return res.status(409).json({ error: 'Job already saved' });
    }

    // Save the job
    const { data: savedJob, error } = await supabase
      .from('saved_jobs')
      .insert({
        user_id: userId,
        job_id,
        notes,
        status
      })
      .select(`
        *,
        job:jobs(*)
      `)
      .single();

    if (error) {
      console.error('Error saving job:', error);
      return res.status(500).json({ error: 'Failed to save job' });
    }

    res.status(201).json({
      message: 'Job saved successfully',
      saved_job: savedJob
    });
  } catch (error) {
    console.error('Error in POST /saved-jobs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/saved-jobs/:id - Update saved job
router.put('/:id', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { notes, status } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify ownership
    const { data: savedJob, error: fetchError } = await supabase
      .from('saved_jobs')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !savedJob) {
      return res.status(404).json({ error: 'Saved job not found' });
    }

    if (savedJob.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update the saved job
    const updateData: any = {};
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    const { data: updatedJob, error } = await supabase
      .from('saved_jobs')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        job:jobs(*)
      `)
      .single();

    if (error) {
      console.error('Error updating saved job:', error);
      return res.status(500).json({ error: 'Failed to update saved job' });
    }

    res.json({
      message: 'Saved job updated successfully',
      saved_job: updatedJob
    });
  } catch (error) {
    console.error('Error in PUT /saved-jobs/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/saved-jobs/:id - Remove saved job
router.delete('/:id', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify ownership
    const { data: savedJob, error: fetchError } = await supabase
      .from('saved_jobs')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !savedJob) {
      return res.status(404).json({ error: 'Saved job not found' });
    }

    if (savedJob.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete the saved job
    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting saved job:', error);
      return res.status(500).json({ error: 'Failed to delete saved job' });
    }

    res.json({ message: 'Saved job removed successfully' });
  } catch (error) {
    console.error('Error in DELETE /saved-jobs/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;