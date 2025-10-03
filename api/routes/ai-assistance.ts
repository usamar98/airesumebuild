import { Router, Request, Response } from 'express';
import { supabase } from '../database/supabase';
import { authenticateSupabaseToken, SupabaseAuthenticatedRequest } from '../middleware/supabaseAuth';
import OpenAI from 'openai';

const router = Router();

// Initialize OpenAI client lazily
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

interface JobOptimizationRequest {
  title: string;
  description: string;
  requirements?: string[];
  benefits?: string[];
  company_name?: string;
  location?: string;
  job_type?: string;
  salary_range?: string;
}

interface CoverLetterRequest {
  job_title: string;
  company_name: string;
  job_description: string;
  user_experience?: string;
  user_skills?: string[];
  tone?: 'professional' | 'casual' | 'enthusiastic';
}

interface InterviewPrepRequest {
  job_title: string;
  company_name: string;
  job_description: string;
  user_background?: string;
  interview_type?: 'technical' | 'behavioral' | 'general';
}

// POST /api/ai-assistance/optimize-job-posting - Optimize job posting with AI
router.post('/optimize-job-posting', /* authenticateSupabaseToken, */ async (req: Request, res: Response) => {
  try {
    console.log('=== AI Assistance Debug ===');
    console.log('OpenAI API Key available:', !!process.env.OPENAI_API_KEY);
    console.log('OpenAI API Key length:', process.env.OPENAI_API_KEY?.length || 0);
    console.log('Request body:', req.body);
    // console.log('User:', req.user?.email); // Temporarily disabled for testing
    
    const { title, description, requirements, benefits, company_name, location, job_type, salary_range }: JobOptimizationRequest = req.body;

    if (!title || !description) {
      console.log('Missing required fields - title:', !!title, 'description:', !!description);
      return res.status(400).json({ error: 'Job title and description are required' });
    }

    const prompt = `
As an expert HR professional and job posting specialist, please optimize the following job posting to make it more attractive to qualified candidates and improve its visibility on job boards.

Original Job Details:
- Title: ${title}
- Description: ${description}
- Requirements: ${requirements?.join(', ') || 'Not specified'}
- Benefits: ${benefits?.join(', ') || 'Not specified'}
- Company: ${company_name || 'Not specified'}
- Location: ${location || 'Not specified'}
- Job Type: ${job_type || 'Not specified'}
- Salary Range: ${salary_range || 'Not specified'}

Please provide:
1. An optimized job title that's clear, specific, and searchable
2. An improved job description that's engaging and comprehensive
3. Enhanced requirements list that's realistic and well-structured
4. Improved benefits section that highlights value proposition
5. SEO-friendly keywords to include
6. Suggestions for improving candidate attraction

Format your response as JSON with the following structure:
{
  "optimized_title": "string",
  "optimized_description": "string",
  "optimized_requirements": ["requirement1", "requirement2"],
  "optimized_benefits": ["benefit1", "benefit2"],
  "seo_keywords": ["keyword1", "keyword2"],
  "improvement_suggestions": ["suggestion1", "suggestion2"],
  "tone_analysis": "string describing the tone and how it was improved"
}
`;

    const openaiClient = getOpenAIClient();
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert HR professional specializing in creating compelling job postings that attract top talent. Always respond with valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      return res.status(500).json({ error: 'Failed to generate AI response' });
    }

    try {
      const optimizedJob = JSON.parse(aiResponse);
      res.json(optimizedJob);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      res.status(500).json({ error: 'Failed to parse AI response' });
    }
  } catch (error) {
    console.error('Error in POST /ai-assistance/optimize-job-posting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/ai-assistance/generate-cover-letter - Generate personalized cover letter
router.post('/generate-cover-letter', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const { job_title, company_name, job_description, user_experience, user_skills, tone = 'professional' }: CoverLetterRequest = req.body;

    if (!job_title || !company_name || !job_description) {
      return res.status(400).json({ error: 'Job title, company name, and job description are required' });
    }

    // Get user profile for personalization
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('full_name, bio, skills, work_experience, education')
      .eq('user_id', req.user.id)
      .single();

    const prompt = `
As an expert career counselor and professional writer, create a compelling cover letter for the following job application.

Job Details:
- Position: ${job_title}
- Company: ${company_name}
- Job Description: ${job_description}

Candidate Information:
- Name: ${userProfile?.full_name || 'Candidate'}
- Bio: ${userProfile?.bio || 'Not provided'}
- Skills: ${user_skills?.join(', ') || userProfile?.skills?.join(', ') || 'Not specified'}
- Experience: ${user_experience || 'Not specified'}
- Work History: ${userProfile?.work_experience ? JSON.stringify(userProfile.work_experience) : 'Not provided'}
- Education: ${userProfile?.education ? JSON.stringify(userProfile.education) : 'Not provided'}

Tone: ${tone}

Please create a personalized cover letter that:
1. Opens with a strong hook that shows genuine interest
2. Highlights relevant skills and experiences that match the job requirements
3. Demonstrates knowledge about the company
4. Shows enthusiasm and cultural fit
5. Includes a compelling call to action
6. Maintains the requested tone throughout
7. Is concise but comprehensive (3-4 paragraphs)

Format your response as JSON:
{
  "cover_letter": "The complete cover letter text",
  "key_highlights": ["highlight1", "highlight2"],
  "personalization_notes": "How the letter was personalized",
  "suggestions": ["suggestion1", "suggestion2"]
}
`;

    const openaiClient = getOpenAIClient();
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert career counselor and professional writer specializing in creating compelling cover letters that help candidates stand out. Always respond with valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      return res.status(500).json({ error: 'Failed to generate AI response' });
    }

    try {
      const coverLetterData = JSON.parse(aiResponse);
      res.json(coverLetterData);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      res.status(500).json({ error: 'Failed to parse AI response' });
    }
  } catch (error) {
    console.error('Error in POST /ai-assistance/generate-cover-letter:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/ai-assistance/interview-preparation - Generate interview preparation materials
router.post('/interview-preparation', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const { job_title, company_name, job_description, user_background, interview_type = 'general' }: InterviewPrepRequest = req.body;

    if (!job_title || !company_name || !job_description) {
      return res.status(400).json({ error: 'Job title, company name, and job description are required' });
    }

    // Get user profile for personalization
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('full_name, bio, skills, work_experience, education')
      .eq('user_id', req.user.id)
      .single();

    const prompt = `
As an expert career coach and interview specialist, create comprehensive interview preparation materials for the following job interview.

Job Details:
- Position: ${job_title}
- Company: ${company_name}
- Job Description: ${job_description}
- Interview Type: ${interview_type}

Candidate Information:
- Background: ${user_background || userProfile?.bio || 'Not provided'}
- Skills: ${userProfile?.skills?.join(', ') || 'Not specified'}
- Work Experience: ${userProfile?.work_experience ? JSON.stringify(userProfile.work_experience) : 'Not provided'}
- Education: ${userProfile?.education ? JSON.stringify(userProfile.education) : 'Not provided'}

Please provide:
1. 10-15 likely interview questions specific to this role and company
2. Suggested answers or talking points for each question
3. Questions the candidate should ask the interviewer
4. Key points to research about the company
5. Skills and experiences to highlight
6. Common mistakes to avoid
7. Tips for the specific interview type

Format your response as JSON:
{
  "interview_questions": [
    {
      "question": "string",
      "suggested_answer": "string",
      "tips": "string"
    }
  ],
  "questions_to_ask": ["question1", "question2"],
  "company_research_points": ["point1", "point2"],
  "key_highlights": ["highlight1", "highlight2"],
  "common_mistakes": ["mistake1", "mistake2"],
  "interview_tips": ["tip1", "tip2"],
  "preparation_checklist": ["item1", "item2"]
}
`;

    const openaiClient = getOpenAIClient();
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert career coach specializing in interview preparation. You help candidates succeed by providing comprehensive, personalized interview guidance. Always respond with valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      return res.status(500).json({ error: 'Failed to generate AI response' });
    }

    try {
      const interviewPrep = JSON.parse(aiResponse);
      res.json(interviewPrep);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      res.status(500).json({ error: 'Failed to parse AI response' });
    }
  } catch (error) {
    console.error('Error in POST /ai-assistance/interview-preparation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/ai-assistance/resume-optimization - Optimize resume for specific job
router.post('/resume-optimization', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const { job_title, job_description, current_resume } = req.body;

    if (!job_title || !job_description) {
      return res.status(400).json({ error: 'Job title and job description are required' });
    }

    // Get user profile if resume not provided
    let resumeData = current_resume;
    if (!resumeData) {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', req.user.id)
        .single();
      
      resumeData = {
        name: userProfile?.full_name,
        bio: userProfile?.bio,
        skills: userProfile?.skills,
        experience: userProfile?.work_experience,
        education: userProfile?.education
      };
    }

    const prompt = `
As an expert resume writer and ATS optimization specialist, analyze and optimize the following resume for the specific job posting.

Target Job:
- Title: ${job_title}
- Description: ${job_description}

Current Resume Data:
${JSON.stringify(resumeData, null, 2)}

Please provide:
1. ATS optimization suggestions
2. Keywords to include from the job description
3. Skills to emphasize or add
4. Experience points to highlight or rewrite
5. Overall structure improvements
6. Industry-specific recommendations
7. Quantifiable achievements to add

Format your response as JSON:
{
  "ats_score": "number (1-100)",
  "missing_keywords": ["keyword1", "keyword2"],
  "recommended_skills": ["skill1", "skill2"],
  "experience_improvements": [
    {
      "original": "string",
      "improved": "string",
      "reason": "string"
    }
  ],
  "structure_suggestions": ["suggestion1", "suggestion2"],
  "industry_tips": ["tip1", "tip2"],
  "achievement_suggestions": ["achievement1", "achievement2"],
  "overall_feedback": "string"
}
`;

    const openaiClient = getOpenAIClient();
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert resume writer and ATS optimization specialist. You help job seekers optimize their resumes for specific positions and improve their chances of getting interviews. Always respond with valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2500
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      return res.status(500).json({ error: 'Failed to generate AI response' });
    }

    try {
      const resumeOptimization = JSON.parse(aiResponse);
      res.json(resumeOptimization);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      res.status(500).json({ error: 'Failed to parse AI response' });
    }
  } catch (error) {
    console.error('Error in POST /ai-assistance/resume-optimization:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/ai-assistance/salary-negotiation - Get salary negotiation advice
router.post('/salary-negotiation', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const { job_title, company_name, offered_salary, desired_salary, location, experience_years, industry } = req.body;

    if (!job_title || !offered_salary) {
      return res.status(400).json({ error: 'Job title and offered salary are required' });
    }

    const prompt = `
As an expert salary negotiation coach and compensation specialist, provide comprehensive salary negotiation advice for the following situation.

Negotiation Details:
- Job Title: ${job_title}
- Company: ${company_name || 'Not specified'}
- Offered Salary: ${offered_salary}
- Desired Salary: ${desired_salary || 'Not specified'}
- Location: ${location || 'Not specified'}
- Experience Years: ${experience_years || 'Not specified'}
- Industry: ${industry || 'Not specified'}

Please provide:
1. Market salary analysis and benchmarking
2. Negotiation strategy and talking points
3. Non-salary benefits to consider
4. Scripts for different negotiation scenarios
5. Common mistakes to avoid
6. Timeline and process recommendations
7. Backup plans if negotiation fails

Format your response as JSON:
{
  "market_analysis": {
    "salary_range": "string",
    "market_position": "string",
    "factors_affecting_salary": ["factor1", "factor2"]
  },
  "negotiation_strategy": {
    "approach": "string",
    "key_points": ["point1", "point2"],
    "timing": "string"
  },
  "conversation_scripts": [
    {
      "scenario": "string",
      "script": "string"
    }
  ],
  "alternative_benefits": ["benefit1", "benefit2"],
  "common_mistakes": ["mistake1", "mistake2"],
  "success_tips": ["tip1", "tip2"],
  "backup_strategies": ["strategy1", "strategy2"]
}
`;

    const openaiClient = getOpenAIClient();
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert salary negotiation coach with extensive experience in compensation analysis and negotiation strategies. You help professionals maximize their earning potential while maintaining positive relationships. Always respond with valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2500
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      return res.status(500).json({ error: 'Failed to generate AI response' });
    }

    try {
      const negotiationAdvice = JSON.parse(aiResponse);
      res.json(negotiationAdvice);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      res.status(500).json({ error: 'Failed to parse AI response' });
    }
  } catch (error) {
    console.error('Error in POST /ai-assistance/salary-negotiation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/ai-assistance/career-advice - Get personalized career advice
router.post('/career-advice', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const { question, career_stage, industry, goals } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const prompt = `
As an expert career counselor and professional development coach, provide comprehensive career advice for the following question.

Career Context:
- Question: ${question}
- Career Stage: ${career_stage || 'Not specified'}
- Industry: ${industry || 'Not specified'}
- Goals: ${goals || 'Not specified'}

Please provide:
1. Direct answer to the question
2. Actionable steps and recommendations
3. Industry-specific insights
4. Potential challenges and how to overcome them
5. Resources for further learning
6. Timeline for implementation

Format your response as JSON:
{
  "answer": "string",
  "action_steps": ["step1", "step2"],
  "industry_insights": ["insight1", "insight2"],
  "challenges": [
    {
      "challenge": "string",
      "solution": "string"
    }
  ],
  "resources": ["resource1", "resource2"],
  "timeline": "string",
  "additional_tips": ["tip1", "tip2"]
}
`;

    const openaiClient = getOpenAIClient();
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert career counselor with extensive experience in professional development across various industries. You provide practical, actionable advice to help professionals advance their careers. Always respond with valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      return res.status(500).json({ error: 'Failed to generate AI response' });
    }

    try {
      const careerAdvice = JSON.parse(aiResponse);
      res.json(careerAdvice);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      res.status(500).json({ error: 'Failed to parse AI response' });
    }
  } catch (error) {
    console.error('Error in POST /ai-assistance/career-advice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/ai-assistance/industry-insights - Get industry insights and trends
router.post('/industry-insights', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const { industry, role, location } = req.body;

    if (!industry) {
      return res.status(400).json({ error: 'Industry is required' });
    }

    const prompt = `
As an industry analyst and market research expert, provide comprehensive insights about the following industry.

Industry Context:
- Industry: ${industry}
- Role/Position: ${role || 'General'}
- Location: ${location || 'Global'}

Please provide:
1. Current industry trends and developments
2. Growth opportunities and emerging areas
3. Key challenges facing the industry
4. Skills in high demand
5. Salary trends and compensation insights
6. Future outlook and predictions
7. Top companies and employers

Format your response as JSON:
{
  "industry_overview": "string",
  "current_trends": ["trend1", "trend2"],
  "growth_opportunities": ["opportunity1", "opportunity2"],
  "key_challenges": ["challenge1", "challenge2"],
  "in_demand_skills": ["skill1", "skill2"],
  "salary_insights": {
    "average_range": "string",
    "factors_affecting_salary": ["factor1", "factor2"]
  },
  "future_outlook": "string",
  "top_companies": ["company1", "company2"],
  "career_advice": ["advice1", "advice2"]
}
`;

    const openaiClient = getOpenAIClient();
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert industry analyst with deep knowledge of market trends, employment patterns, and industry developments across various sectors. You provide data-driven insights and strategic advice. Always respond with valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      return res.status(500).json({ error: 'Failed to generate AI response' });
    }

    try {
      const industryInsights = JSON.parse(aiResponse);
      res.json(industryInsights);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      res.status(500).json({ error: 'Failed to parse AI response' });
    }
  } catch (error) {
    console.error('Error in POST /ai-assistance/industry-insights:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/ai-assistance/networking-tips - Get networking advice and strategies
router.post('/networking-tips', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const { situation, industry, career_level, goals } = req.body;

    const prompt = `
As a professional networking expert and relationship building coach, provide comprehensive networking advice.

Networking Context:
- Situation: ${situation || 'General networking advice'}
- Industry: ${industry || 'Not specified'}
- Career Level: ${career_level || 'Not specified'}
- Goals: ${goals || 'Not specified'}

Please provide:
1. Networking strategies for the specific situation
2. Best platforms and venues for networking
3. Conversation starters and talking points
4. Follow-up strategies
5. Common networking mistakes to avoid
6. Industry-specific networking tips
7. Building long-term professional relationships

Format your response as JSON:
{
  "networking_strategies": ["strategy1", "strategy2"],
  "best_platforms": [
    {
      "platform": "string",
      "description": "string",
      "best_for": "string"
    }
  ],
  "conversation_starters": ["starter1", "starter2"],
  "follow_up_tips": ["tip1", "tip2"],
  "common_mistakes": ["mistake1", "mistake2"],
  "industry_specific_tips": ["tip1", "tip2"],
  "relationship_building": ["advice1", "advice2"],
  "success_metrics": ["metric1", "metric2"]
}
`;

    const openaiClient = getOpenAIClient();
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a professional networking expert with extensive experience in relationship building, career development, and professional communication. You help professionals build meaningful connections and advance their careers through strategic networking. Always respond with valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      return res.status(500).json({ error: 'Failed to generate AI response' });
    }

    try {
      const networkingTips = JSON.parse(aiResponse);
      res.json(networkingTips);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      res.status(500).json({ error: 'Failed to parse AI response' });
    }
  } catch (error) {
    console.error('Error in POST /ai-assistance/networking-tips:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/ai-assistance/generate-job-description - Generate job description with AI
router.post('/generate-job-description', /* authenticateSupabaseToken, */ async (req: Request, res: Response) => {
  try {
    const { job_title, company_name, job_description } = req.body;

    if (!job_title) {
      return res.status(400).json({ error: 'Job title is required' });
    }

    const prompt = `
As an expert HR professional and job posting specialist, generate a compelling and comprehensive job description for the following position.

Job Details:
- Title: ${job_title}
- Company: ${company_name || 'Not specified'}
- Current Description: ${job_description || 'Generate from scratch'}

Please create a professional job description that includes:
1. An engaging overview of the role
2. Key responsibilities and duties
3. What the candidate will accomplish
4. Growth opportunities
5. Company culture fit

The description should be:
- Professional yet engaging
- Clear and specific
- Attractive to qualified candidates
- 2-3 paragraphs in length

Format your response as JSON:
{
  "generated_content": "The complete job description text",
  "key_points": ["point1", "point2"],
  "tone": "Description of the tone used"
}
`;

    const openaiClient = getOpenAIClient();
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert HR professional specializing in creating compelling job descriptions that attract top talent. Always respond with valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      return res.status(500).json({ error: 'Failed to generate AI response' });
    }

    try {
      const generatedDescription = JSON.parse(aiResponse);
      res.json(generatedDescription);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      res.status(500).json({ error: 'Failed to parse AI response' });
    }
  } catch (error) {
    console.error('Error in POST /ai-assistance/generate-job-description:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/ai-assistance/generate-requirements - Generate job requirements with AI
router.post('/generate-requirements', /* authenticateSupabaseToken, */ async (req: Request, res: Response) => {
  try {
    const { job_title, company_name, job_description } = req.body;

    if (!job_title) {
      return res.status(400).json({ error: 'Job title is required' });
    }

    const prompt = `
As an expert HR professional and job posting specialist, generate comprehensive requirements and qualifications for the following position.

Job Details:
- Title: ${job_title}
- Company: ${company_name || 'Not specified'}
- Job Description: ${job_description || 'Not provided'}

Please create a well-structured requirements section that includes:
1. Essential qualifications (must-haves)
2. Preferred qualifications (nice-to-haves)
3. Technical skills required
4. Soft skills needed
5. Experience level expectations
6. Education requirements

The requirements should be:
- Realistic and achievable
- Clearly categorized
- Specific but not overly restrictive
- Attractive to qualified candidates

Format your response as JSON:
{
  "generated_content": "The complete requirements text formatted as a clear list",
  "essential_requirements": ["requirement1", "requirement2"],
  "preferred_requirements": ["requirement1", "requirement2"],
  "technical_skills": ["skill1", "skill2"],
  "soft_skills": ["skill1", "skill2"]
}
`;

    const openaiClient = getOpenAIClient();
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert HR professional specializing in defining job requirements that attract qualified candidates while maintaining realistic expectations. Always respond with valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      return res.status(500).json({ error: 'Failed to generate AI response' });
    }

    try {
      const generatedRequirements = JSON.parse(aiResponse);
      res.json(generatedRequirements);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      res.status(500).json({ error: 'Failed to parse AI response' });
    }
  } catch (error) {
    console.error('Error in POST /ai-assistance/generate-requirements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/ai-assistance/generate-responsibilities - Generate job responsibilities with AI
router.post('/generate-responsibilities', /* authenticateSupabaseToken, */ async (req: Request, res: Response) => {
  try {
    const { job_title, company_name, job_description } = req.body;

    if (!job_title) {
      return res.status(400).json({ error: 'Job title is required' });
    }

    const prompt = `
As an expert HR professional and job posting specialist, generate comprehensive key responsibilities for the following position.

Job Details:
- Title: ${job_title}
- Company: ${company_name || 'Not specified'}
- Job Description: ${job_description || 'Not provided'}

Please create a well-structured responsibilities section that includes:
1. Primary duties and responsibilities
2. Day-to-day tasks and activities
3. Key deliverables and outcomes
4. Collaboration and teamwork aspects
5. Leadership or mentoring responsibilities (if applicable)
6. Strategic or project-based responsibilities

The responsibilities should be:
- Clear and actionable
- Specific to the role and industry
- Realistic and achievable
- Engaging and motivating for candidates

Format your response as JSON:
{
  "generated_content": "The complete responsibilities text formatted as a clear list",
  "primary_responsibilities": ["responsibility1", "responsibility2"],
  "daily_tasks": ["task1", "task2"],
  "key_deliverables": ["deliverable1", "deliverable2"],
  "collaboration_aspects": ["aspect1", "aspect2"]
}
`;

    const openaiClient = getOpenAIClient();
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert HR professional specializing in defining clear, actionable job responsibilities that help candidates understand their role and impact. Always respond with valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      return res.status(500).json({ error: 'Failed to generate AI response' });
    }

    try {
      const generatedResponsibilities = JSON.parse(aiResponse);
      res.json(generatedResponsibilities);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      res.status(500).json({ error: 'Failed to parse AI response' });
    }
  } catch (error) {
    console.error('Error in POST /ai-assistance/generate-responsibilities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/ai-assistance/salary-estimate - Generate salary estimation with AI
router.post('/salary-estimate', /* authenticateSupabaseToken, */ async (req: Request, res: Response) => {
  try {
    const { job_title, location, experience_years, skills, company_size, industry } = req.body;

    if (!job_title) {
      return res.status(400).json({ error: 'Job title is required' });
    }

    const prompt = `
As an expert compensation analyst and salary benchmarking specialist, provide a comprehensive salary estimation for the following position.

Position Details:
- Job Title: ${job_title}
- Location: ${location || 'Not specified'}
- Experience Level: ${experience_years || 'Not specified'} years
- Skills: ${skills?.join(', ') || 'Not specified'}
- Company Size: ${company_size || 'Not specified'}
- Industry: ${industry || 'Not specified'}

Please provide:
1. Salary range estimation (min, max, median)
2. Factors affecting the salary
3. Market trends for this role
4. Comparison with similar roles
5. Negotiation tips
6. Benefits and compensation package insights

Consider current market conditions, location cost of living, and industry standards.

Format your response as JSON:
{
  "salary_range": {
    "min": "number",
    "max": "number", 
    "median": "number",
    "currency": "USD"
  },
  "confidence_level": "High/Medium/Low",
  "factors_affecting_salary": ["factor1", "factor2"],
  "market_trends": "string describing current trends",
  "similar_roles": [
    {
      "title": "string",
      "salary_range": "string"
    }
  ],
  "negotiation_tips": ["tip1", "tip2"],
  "benefits_insights": ["insight1", "insight2"],
  "location_adjustment": "string describing location impact",
  "experience_impact": "string describing experience level impact"
}
`;

    const openaiClient = getOpenAIClient();
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert compensation analyst with extensive knowledge of salary benchmarking, market trends, and compensation packages across various industries and locations. Always respond with valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      return res.status(500).json({ error: 'Failed to generate AI response' });
    }

    try {
      const salaryEstimate = JSON.parse(aiResponse);
      res.json(salaryEstimate);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      res.status(500).json({ error: 'Failed to parse AI response' });
    }
  } catch (error) {
    console.error('Error in POST /ai-assistance/salary-estimate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/ai-assistance/job-matching - AI-powered job matching
router.post('/job-matching', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const { user_skills, experience_level, preferred_location, job_type, salary_expectations } = req.body;

    // Get user profile for better matching
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    // Get available jobs from database
    const { data: jobs } = await supabase
      .from('job_postings')
      .select('*')
      .eq('status', 'active')
      .limit(50);

    if (!jobs || jobs.length === 0) {
      return res.json({ matched_jobs: [], recommendations: [] });
    }

    const prompt = `
As an expert career counselor and job matching specialist, analyze the following candidate profile and available jobs to provide intelligent job matching recommendations.

Candidate Profile:
- Skills: ${user_skills?.join(', ') || userProfile?.skills?.join(', ') || 'Not specified'}
- Experience Level: ${experience_level || 'Not specified'}
- Preferred Location: ${preferred_location || 'Not specified'}
- Job Type: ${job_type || 'Not specified'}
- Salary Expectations: ${salary_expectations || 'Not specified'}
- Bio: ${userProfile?.bio || 'Not provided'}
- Work Experience: ${userProfile?.work_experience ? JSON.stringify(userProfile.work_experience) : 'Not provided'}

Available Jobs:
${jobs.map(job => `
- ID: ${job.id}
- Title: ${job.title}
- Description: ${job.description?.substring(0, 200)}...
- Skills Required: ${job.skills?.join(', ') || 'Not specified'}
- Location: ${job.location || job.location_type}
- Salary: ${job.salary_min && job.salary_max ? `$${job.salary_min}-$${job.salary_max}` : 'Not specified'}
- Company: ${job.company_name}
`).join('\n')}

Please provide:
1. Top 10 best matching jobs with match scores (0-100)
2. Reasons for each match
3. Skills gaps to address
4. Career development recommendations

Format your response as JSON:
{
  "matched_jobs": [
    {
      "job_id": "string",
      "match_score": "number (0-100)",
      "match_reasons": ["reason1", "reason2"],
      "skills_match": ["skill1", "skill2"],
      "skills_gap": ["missing_skill1", "missing_skill2"]
    }
  ],
  "recommendations": {
    "skills_to_develop": ["skill1", "skill2"],
    "career_paths": ["path1", "path2"],
    "learning_resources": ["resource1", "resource2"],
    "networking_suggestions": ["suggestion1", "suggestion2"]
  },
  "market_insights": "string with market analysis",
  "next_steps": ["step1", "step2"]
}
`;

    const openaiClient = getOpenAIClient();
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert career counselor and job matching specialist with deep knowledge of various industries, skills requirements, and career development paths. Always respond with valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      return res.status(500).json({ error: 'Failed to generate AI response' });
    }

    try {
      const jobMatching = JSON.parse(aiResponse);
      res.json(jobMatching);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      res.status(500).json({ error: 'Failed to parse AI response' });
    }
  } catch (error) {
    console.error('Error in POST /ai-assistance/job-matching:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/ai-assistance/optimize-job-title - Optimize job title with AI
router.post('/optimize-job-title', /* authenticateSupabaseToken, */ async (req: Request, res: Response) => {
  try {
    const { job_title, company_name, industry, job_level } = req.body;

    if (!job_title) {
      return res.status(400).json({ error: 'Job title is required' });
    }

    const prompt = `
As an expert HR professional and job posting specialist, optimize the following job title to make it more attractive, searchable, and industry-standard.

Current Job Title: ${job_title}
Company: ${company_name || 'Not specified'}
Industry: ${industry || 'Not specified'}
Job Level: ${job_level || 'Not specified'}

Please provide:
1. An optimized version of the job title
2. Alternative title suggestions
3. Keywords that should be included
4. Industry-standard variations
5. SEO-friendly versions

The optimized title should be:
- Clear and professional
- Industry-standard terminology
- Attractive to qualified candidates
- Searchable on job boards
- Appropriate for the seniority level

Format your response as JSON:
{
  "optimized_title": "The best optimized version",
  "alternative_titles": ["title1", "title2", "title3"],
  "keywords": ["keyword1", "keyword2"],
  "industry_variations": ["variation1", "variation2"],
  "seo_friendly": "SEO optimized version",
  "explanation": "Brief explanation of changes made"
}
`;

    const openaiClient = getOpenAIClient();
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert HR professional specializing in job title optimization and recruitment best practices. Always respond with valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      return res.status(500).json({ error: 'Failed to generate AI response' });
    }

    try {
      const titleOptimization = JSON.parse(aiResponse);
      res.json(titleOptimization);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      res.status(500).json({ error: 'Failed to parse AI response' });
    }
  } catch (error) {
    console.error('Error in POST /ai-assistance/optimize-job-title:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/ai-assistance/generate-interview-questions - Generate interview questions with AI
router.post('/generate-interview-questions', /* authenticateSupabaseToken, */ async (req: Request, res: Response) => {
  try {
    const { job_title, job_description, company_name, interview_type, experience_level } = req.body;

    if (!job_title) {
      return res.status(400).json({ error: 'Job title is required' });
    }

    const prompt = `
As an expert HR professional and interview specialist, generate comprehensive interview questions for the following position.

Position Details:
- Job Title: ${job_title}
- Company: ${company_name || 'Not specified'}
- Job Description: ${job_description || 'Not provided'}
- Interview Type: ${interview_type || 'general'}
- Experience Level: ${experience_level || 'Not specified'}

Please create a comprehensive set of interview questions including:
1. General/behavioral questions
2. Technical/role-specific questions
3. Company culture fit questions
4. Situational/scenario-based questions
5. Questions about experience and background

The questions should be:
- Relevant to the specific role and level
- Designed to assess both technical and soft skills
- Progressive in difficulty
- Inclusive and unbiased
- Practical and actionable

Format your response as JSON:
{
  "interview_questions": {
    "behavioral": ["question1", "question2"],
    "technical": ["question1", "question2"],
    "situational": ["question1", "question2"],
    "experience": ["question1", "question2"],
    "culture_fit": ["question1", "question2"]
  },
  "evaluation_criteria": ["criteria1", "criteria2"],
  "interview_tips": ["tip1", "tip2"],
  "red_flags": ["flag1", "flag2"]
}
`;

    const openaiClient = getOpenAIClient();
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert HR professional and interview specialist with extensive experience in candidate assessment and hiring best practices. Always respond with valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      return res.status(500).json({ error: 'Failed to generate AI response' });
    }

    try {
      const interviewQuestions = JSON.parse(aiResponse);
      res.json(interviewQuestions);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      res.status(500).json({ error: 'Failed to parse AI response' });
    }
  } catch (error) {
    console.error('Error in POST /ai-assistance/generate-interview-questions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/ai-assistance/suggest-skills - Suggest skills for job posting with AI
router.post('/suggest-skills', /* authenticateSupabaseToken, */ async (req: Request, res: Response) => {
  try {
    const { job_title, job_description, industry, experience_level } = req.body;

    if (!job_title) {
      return res.status(400).json({ error: 'Job title is required' });
    }

    const prompt = `
As an expert HR professional and skills assessment specialist, suggest comprehensive skills requirements for the following position.

Position Details:
- Job Title: ${job_title}
- Job Description: ${job_description || 'Not provided'}
- Industry: ${industry || 'Not specified'}
- Experience Level: ${experience_level || 'Not specified'}

Please provide a comprehensive skills breakdown including:
1. Essential technical skills (must-haves)
2. Preferred technical skills (nice-to-haves)
3. Essential soft skills
4. Industry-specific skills
5. Tools and technologies
6. Certifications that would be valuable

The skills should be:
- Relevant to the specific role and industry
- Appropriate for the experience level
- Current and in-demand
- Realistic and achievable
- Categorized clearly

Format your response as JSON:
{
  "essential_technical": ["skill1", "skill2"],
  "preferred_technical": ["skill1", "skill2"],
  "essential_soft": ["skill1", "skill2"],
  "industry_specific": ["skill1", "skill2"],
  "tools_technologies": ["tool1", "tool2"],
  "certifications": ["cert1", "cert2"],
  "trending_skills": ["skill1", "skill2"],
  "skill_categories": {
    "programming": ["skill1", "skill2"],
    "frameworks": ["framework1", "framework2"],
    "databases": ["db1", "db2"],
    "cloud": ["platform1", "platform2"]
  }
}
`;

    const openaiClient = getOpenAIClient();
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert HR professional and skills assessment specialist with deep knowledge of current industry trends and skill requirements across various fields. Always respond with valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      return res.status(500).json({ error: 'Failed to generate AI response' });
    }

    try {
      const skillSuggestions = JSON.parse(aiResponse);
      res.json(skillSuggestions);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      res.status(500).json({ error: 'Failed to parse AI response' });
    }
  } catch (error) {
    console.error('Error in POST /ai-assistance/suggest-skills:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/ai-assistance/classify-job-category - Classify job category with AI
router.post('/classify-job-category', /* authenticateSupabaseToken, */ async (req: Request, res: Response) => {
  try {
    const { job_title, job_description, company_name, industry } = req.body;

    if (!job_title) {
      return res.status(400).json({ error: 'Job title is required' });
    }

    const prompt = `
As an expert job classification specialist and industry analyst, classify the following job posting into appropriate categories and provide detailed analysis.

Job Details:
- Job Title: ${job_title}
- Job Description: ${job_description || 'Not provided'}
- Company: ${company_name || 'Not specified'}
- Industry: ${industry || 'Not specified'}

Please provide:
1. Primary job category
2. Secondary categories
3. Industry classification
4. Department/function
5. Career level
6. Job family
7. Skills category
8. Work type classification

Use standard industry classifications and be specific but practical.

Format your response as JSON:
{
  "primary_category": "Main category",
  "secondary_categories": ["category1", "category2"],
  "industry_classification": "Industry type",
  "department": "Department/Function",
  "career_level": "Entry/Mid/Senior/Executive",
  "job_family": "Job family classification",
  "skills_category": "Primary skills area",
  "work_type": "Full-time/Part-time/Contract/Freelance",
  "remote_compatibility": "Remote/Hybrid/On-site",
  "salary_range_category": "Entry/Mid/Senior level range",
  "growth_potential": "Career growth assessment",
  "market_demand": "High/Medium/Low demand",
  "related_roles": ["role1", "role2"],
  "career_progression": ["next_role1", "next_role2"]
}
`;

    const openaiClient = getOpenAIClient();
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert job classification specialist and industry analyst with comprehensive knowledge of job categories, career paths, and industry standards. Always respond with valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1200
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      return res.status(500).json({ error: 'Failed to generate AI response' });
    }

    try {
      const jobClassification = JSON.parse(aiResponse);
      res.json(jobClassification);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      res.status(500).json({ error: 'Failed to parse AI response' });
    }
  } catch (error) {
    console.error('Error in POST /ai-assistance/classify-job-category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;