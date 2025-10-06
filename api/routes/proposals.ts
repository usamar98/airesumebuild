import { Router, Request, Response } from 'express';
import { supabase } from '../database/supabase';
import { authenticateSupabaseToken, SupabaseAuthenticatedRequest } from '../middleware/supabaseAuth';
import openaiService from '../services/openaiService.js';

const router = Router();

interface Proposal {
  id: string;
  user_id: string;
  job_id: string;
  proposal_text: string;
  tone: string;
  length: string;
  confidence_score?: number;
  generated_at: string;
  job?: {
    id: string;
    title: string;
    description?: string;
    company?: string;
    location?: string;
    salary_range?: string;
    requirements?: string[];
  };
}

interface GenerateProposalRequest {
  job_id: string;
  tone?: 'professional' | 'friendly' | 'confident' | 'casual';
  length?: 'short' | 'medium' | 'long';
  custom_instructions?: string;
}

// GET /api/proposals - Get user's proposals
router.get('/', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { job_id, page = 1, limit = 20 } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('proposals')
      .select(`
        *,
        job:jobs(*)
      `)
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (job_id) {
      query = query.eq('job_id', job_id);
    }

    const { data: proposals, error, count } = await query;

    if (error) {
      console.error('Error fetching proposals:', error);
      return res.status(500).json({ error: 'Failed to fetch proposals' });
    }

    res.json({
      proposals: proposals || [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error in GET /proposals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/proposals/generate - Generate AI proposal
router.post('/generate', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const {
      job_id,
      tone = 'professional',
      length = 'medium',
      custom_instructions,
      include_resume = true
    }: GenerateProposalRequest & { include_resume?: boolean } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!job_id) {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    // Fetch job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Fetch user profile if including resume
    let userProfile = null;
    if (include_resume) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      userProfile = profile;
    }

    // Generate proposal using OpenAI
    const generatedProposal = await openaiService.generateProposal({
      jobTitle: job.title,
      jobDescription: job.description,
      jobSkills: job.skills || [],
      jobBudget: job.salary_range,
      clientInfo: {
        name: job.company,
        location: job.location
      },
      userProfile: userProfile ? {
        name: userProfile.full_name,
        title: userProfile.professional_title,
        bio: userProfile.bio,
        skills: userProfile.skills || []
      } : undefined,
      tone,
      length,
      custom_instructions
    });

    if (!generatedProposal) {
      return res.status(500).json({ error: 'Failed to generate proposal' });
    }

    // Prepare final content
    let finalContent = generatedProposal.content;
    
    // Add custom instructions if provided
    if (custom_instructions) {
      finalContent += `\n\nAdditional Note:\n${custom_instructions}`;
    }

    // Save the generated proposal
    const { data: savedProposal, error: saveError } = await supabase
      .from('proposals')
      .insert({
        user_id: userId,
        job_id,
        proposal_text: finalContent,
        tone,
        length,
        confidence_score: Math.random() * 0.3 + 0.7 // Generate a random confidence score
      })
      .select(`
        *,
        job:jobs(*)
      `)
      .single();

    if (saveError) {
      console.error('Error saving proposal:', saveError);
      return res.status(500).json({ error: 'Failed to save proposal' });
    }

    res.json({
      message: 'Proposal generated successfully',
      proposal: savedProposal,
      ai_generated: true,
      key_points: generatedProposal.key_points
    });
  } catch (error) {
    console.error('Error in POST /proposals/generate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/proposals/:id - Get specific proposal
router.get('/:id', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { data: proposal, error } = await supabase
      .from('proposals')
      .select(`
        *,
        job:jobs(*)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Proposal not found' });
      }
      console.error('Error fetching proposal:', error);
      return res.status(500).json({ error: 'Failed to fetch proposal' });
    }

    res.json(proposal);
  } catch (error) {
    console.error('Error in GET /proposals/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/proposals/:id - Delete proposal
router.delete('/:id', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify ownership
    const { data: proposal, error: fetchError } = await supabase
      .from('proposals')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    if (proposal.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this proposal' });
    }

    // Delete the proposal
    const { error: deleteError } = await supabase
      .from('proposals')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting proposal:', deleteError);
      return res.status(500).json({ error: 'Failed to delete proposal' });
    }

    res.json({ message: 'Proposal deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /proposals/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/proposals/:id - Update proposal
router.put('/:id', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { proposal_text, tone, length } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!proposal_text) {
      return res.status(400).json({ error: 'Proposal text is required' });
    }

    // Verify ownership
    const { data: existingProposal, error: fetchError } = await supabase
      .from('proposals')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingProposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    if (existingProposal.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to update this proposal' });
    }

    // Update the proposal
    const { data: updatedProposal, error: updateError } = await supabase
      .from('proposals')
      .update({
        proposal_text,
        tone,
        length,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        job:jobs(*)
      `)
      .single();

    if (updateError) {
      console.error('Error updating proposal:', updateError);
      return res.status(500).json({ error: 'Failed to update proposal' });
    }

    res.json({
      message: 'Proposal updated successfully',
      proposal: updatedProposal
    });
  } catch (error) {
    console.error('Error in PUT /proposals/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/proposals/:id/variations - Generate variations of existing proposal
router.post('/:id/variations', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { count = 3, tone, length } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Fetch the original proposal
    const { data: originalProposal, error: fetchError } = await supabase
      .from('proposals')
      .select(`
        *,
        job:jobs(*)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !originalProposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Generate variations using OpenAI
    const variations = await openaiService.generateProposalVariations({
      jobTitle: originalProposal.job?.title || '',
      jobDescription: originalProposal.job?.description || '',
      jobSkills: originalProposal.job?.requirements || [],
      job: {
        title: originalProposal.job?.title,
        description: originalProposal.job?.description,
        company: originalProposal.job?.company,
        requirements: originalProposal.job?.requirements || [],
        salary_range: originalProposal.job?.salary_range
      },
      tone: tone || originalProposal.tone,
      length: length || originalProposal.length
    }, count);

    res.json({
      message: 'Proposal variations generated successfully',
      variations,
      original_proposal: originalProposal
    });
  } catch (error) {
    console.error('Error in POST /proposals/:id/variations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;