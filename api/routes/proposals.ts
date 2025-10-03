import { Router, Request, Response } from 'express';
import { supabase } from '../database/supabase';
import { authenticateSupabaseToken } from '../middleware/supabaseAuth';
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
    budget?: string;
    skills?: string[];
    client_info?: any;
    source: string;
  };
}

interface GenerateProposalRequest {
  job_id: string;
  tone?: 'professional' | 'friendly' | 'confident' | 'casual';
  length?: 'short' | 'medium' | 'long';
  custom_instructions?: string;
}

// GET /api/proposals - Get user's proposals
router.get('/', authenticateSupabaseToken, async (req: Request, res: Response) => {
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
      `, { count: 'exact' })
      .eq('user_id', userId);

    if (job_id) {
      query = query.eq('job_id', job_id);
    }

    query = query
      .order('generated_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    const { data: proposals, error, count } = await query;

    if (error) {
      console.error('Error fetching proposals:', error);
      return res.status(500).json({ error: 'Failed to fetch proposals' });
    }

    res.json({
      proposals: proposals || [],
      total: count || 0,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    console.error('Error in GET /proposals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/proposals/generate - Generate AI proposal
router.post('/generate', authenticateSupabaseToken, async (req: Request, res: Response) => {
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

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Get user's resume data (assuming it's stored in users table or separate resume table)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('resume_data, full_name, email')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return res.status(500).json({ error: 'Failed to fetch user data' });
    }

    // Get user profile and resume data if requested
    let userProfile = null;
    let userResume = null;

    if (include_resume) {
      // Try to get user profile from users table or auth metadata
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      userProfile = profile;

      // Try to get latest resume data (assuming there's a resumes table)
      const { data: resume } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      userResume = resume;
    }

    // Prepare parameters for AI proposal generation
    const proposalParams = {
      jobTitle: job.title,
      jobDescription: job.description,
      jobSkills: job.skills || [],
      jobBudget: job.budget_min && job.budget_max ? 
        `$${job.budget_min}-$${job.budget_max}` : 
        job.hourly_rate_min && job.hourly_rate_max ? 
        `$${job.hourly_rate_min}-$${job.hourly_rate_max}/hour` : 
        undefined,
      clientInfo: {
        name: job.client_name,
        rating: job.client_rating,
        location: job.client_location
      },
      userProfile: userProfile ? {
        name: userProfile.full_name || userProfile.name,
        title: userProfile.title,
        bio: userProfile.bio,
        skills: userProfile.skills
      } : undefined,
      userResume: userResume ? {
        name: userResume.personal_info?.name,
        email: userResume.personal_info?.email,
        phone: userResume.personal_info?.phone,
        summary: userResume.summary,
        experience: userResume.experience,
        education: userResume.education,
        skills: userResume.skills,
        certifications: userResume.certifications
      } : undefined
    };

    // Generate proposal using AI service
    const generatedProposal = await openaiService.generateProposal(proposalParams);

    // Add custom message if provided
    let finalContent = generatedProposal.content;
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
        confidence_score: generatedProposal.confidence_score || Math.random() * 0.3 + 0.7
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
router.get('/:id', authenticateSupabaseToken, async (req: Request, res: Response) => {
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
router.delete('/:id', authenticateSupabaseToken, async (req: Request, res: Response) => {
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
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete the proposal
    const { error } = await supabase
      .from('proposals')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting proposal:', error);
      return res.status(500).json({ error: 'Failed to delete proposal' });
    }

    res.json({ message: 'Proposal deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /proposals/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to generate mock proposal (will be replaced with actual AI generation)
function generateMockProposal(
  job: any,
  user: any,
  tone: string,
  length: string,
  customInstructions?: string
) {
  const toneMap = {
    professional: 'Dear Hiring Manager',
    friendly: 'Hello there!',
    confident: 'Greetings!',
    casual: 'Hi!'
  };

  const greeting = toneMap[tone as keyof typeof toneMap] || toneMap.professional;
  
  const lengthMap = {
    short: 150,
    medium: 300,
    long: 500
  };

  const targetLength = lengthMap[length as keyof typeof lengthMap] || lengthMap.medium;

  let proposal = `${greeting}\n\n`;
  proposal += `I am excited to apply for the "${job.title}" position. `;
  proposal += `With my experience in ${job.skills?.slice(0, 3).join(', ') || 'relevant technologies'}, I am confident I can deliver exceptional results for your project.\n\n`;
  
  if (job.description) {
    proposal += `I have carefully reviewed your project requirements and understand that you need ${job.description.substring(0, 100)}... `;
    proposal += `My approach would be to leverage my expertise to ensure high-quality deliverables within your timeline.\n\n`;
  }

  if (customInstructions) {
    proposal += `${customInstructions}\n\n`;
  }

  proposal += `I would love to discuss how I can contribute to your project's success. Please feel free to reach out to discuss further.\n\n`;
  proposal += `Best regards,\n${user.full_name || 'Your Name'}`;

  // Adjust length based on target
  if (proposal.length > targetLength) {
    proposal = proposal.substring(0, targetLength - 3) + '...';
  }

  return {
    text: proposal,
    confidence_score: Math.random() * 0.3 + 0.7 // Random score between 0.7-1.0
  };
}

export default router;