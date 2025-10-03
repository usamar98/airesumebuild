import { Request, Response } from 'express';
import OpenAI from 'openai';
import { ResumeData } from '../../src/types';
import { SupabaseAuthenticatedRequest } from '../middleware/supabaseAuth.js';

// Global OpenAI client with optimized configuration
let openaiClient: OpenAI | null = null;

const getOpenAIClient = (): OpenAI => {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000,
      maxRetries: 1,
      defaultHeaders: {
        'Connection': 'keep-alive',
      },
    });
  }
  return openaiClient;
};

interface ProposalTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  keywords: string[];
}

interface ToneOption {
  id: string;
  name: string;
  description: string;
}

interface LengthOption {
  id: string;
  name: string;
  description: string;
  range: string;
  wordCount: { min: number; max: number };
}

const proposalTemplates: ProposalTemplate[] = [
  { 
    id: 'web-dev', 
    name: 'Web Development', 
    description: 'Full-stack web applications, responsive design, modern frameworks', 
    category: 'Development',
    keywords: ['React', 'Node.js', 'JavaScript', 'TypeScript', 'API', 'responsive', 'modern']
  },
  { 
    id: 'mobile-dev', 
    name: 'Mobile Development', 
    description: 'iOS/Android apps, React Native, Flutter development', 
    category: 'Development',
    keywords: ['React Native', 'Flutter', 'iOS', 'Android', 'mobile', 'app store']
  },
  { 
    id: 'design', 
    name: 'UI/UX Design', 
    description: 'User interface design, user experience optimization, prototyping', 
    category: 'Design',
    keywords: ['Figma', 'Adobe', 'prototype', 'user experience', 'interface', 'design system']
  },
  { 
    id: 'writing', 
    name: 'Content Writing', 
    description: 'Blog posts, copywriting, technical documentation, SEO content', 
    category: 'Writing',
    keywords: ['SEO', 'copywriting', 'blog', 'content strategy', 'technical writing']
  },
  { 
    id: 'marketing', 
    name: 'Digital Marketing', 
    description: 'Social media, PPC campaigns, email marketing, analytics', 
    category: 'Marketing',
    keywords: ['Google Ads', 'Facebook Ads', 'social media', 'analytics', 'conversion']
  },
  { 
    id: 'data', 
    name: 'Data Analysis', 
    description: 'Data visualization, machine learning, statistical analysis', 
    category: 'Data',
    keywords: ['Python', 'SQL', 'machine learning', 'visualization', 'statistics']
  },
  { 
    id: 'consulting', 
    name: 'Business Consulting', 
    description: 'Strategy development, process optimization, market research', 
    category: 'Business',
    keywords: ['strategy', 'optimization', 'market research', 'business analysis']
  },
  { 
    id: 'general', 
    name: 'General Purpose', 
    description: 'Versatile template adaptable to any project type', 
    category: 'General',
    keywords: ['versatile', 'adaptable', 'professional', 'reliable']
  }
];

const toneOptions: ToneOption[] = [
  { id: 'professional', name: 'Professional', description: 'Formal, business-focused, authoritative' },
  { id: 'friendly', name: 'Friendly', description: 'Warm, approachable, conversational' },
  { id: 'technical', name: 'Technical', description: 'Detail-oriented, precise, expertise-focused' },
  { id: 'creative', name: 'Creative', description: 'Innovative, expressive, unique approach' }
];

const lengthOptions: LengthOption[] = [
  { id: 'concise', name: 'Concise', description: '150-200 words', range: '150-200', wordCount: { min: 150, max: 200 } },
  { id: 'standard', name: 'Standard', description: '250-350 words', range: '250-350', wordCount: { min: 250, max: 350 } },
  { id: 'detailed', name: 'Detailed', description: '400-500 words', range: '400-500', wordCount: { min: 400, max: 500 } }
];

// Word count validation and enforcement
const enforceWordCount = (text: string, minWords: number, maxWords: number): string => {
  const words = text.trim().split(/\s+/);
  const wordCount = words.length;
  
  console.log(`[${new Date().toISOString()}] Word count validation: ${wordCount} words (target: ${minWords}-${maxWords})`);
  
  if (wordCount > maxWords) {
    // Truncate to max words while preserving sentence structure
    const truncatedWords = words.slice(0, maxWords);
    let truncatedText = truncatedWords.join(' ');
    
    // Try to end at a sentence boundary
    const lastSentenceEnd = Math.max(
      truncatedText.lastIndexOf('.'),
      truncatedText.lastIndexOf('!'),
      truncatedText.lastIndexOf('?')
    );
    
    if (lastSentenceEnd > truncatedText.length * 0.8) {
      truncatedText = truncatedText.substring(0, lastSentenceEnd + 1);
    }
    
    console.log(`[${new Date().toISOString()}] Truncated from ${wordCount} to ${truncatedText.split(/\s+/).length} words`);
    return truncatedText;
  }
  
  if (wordCount < minWords) {
    // Add a professional closing if under word count
    const additionalContent = " I'm confident in my ability to deliver exceptional results for your project. I'd be happy to discuss your requirements in detail and provide a customized approach that meets your specific needs. Please feel free to reach out with any questions.";
    const expandedText = text + additionalContent;
    const expandedWords = expandedText.split(/\s+/);
    
    if (expandedWords.length <= maxWords) {
      console.log(`[${new Date().toISOString()}] Expanded from ${wordCount} to ${expandedWords.length} words`);
      return expandedText;
    }
  }
  
  return text;
};

// Template-based fallback for proposals
const generateFallbackProposal = (
  resumeData: ResumeData,
  projectTitle: string,
  clientName: string,
  projectDescription: string,
  template: ProposalTemplate,
  tone: ToneOption,
  length: LengthOption
): string => {
  const name = resumeData.personalInfo?.fullName || 'Professional';
  const experience = resumeData.workExperience?.[0];
  const skills = (resumeData.skills || []).slice(0, 3).join(', ');
  
  let greeting = '';
  let approach = '';
  let closing = '';
  
  // Customize based on tone
  switch (tone.id) {
    case 'friendly':
      greeting = `Hi ${clientName || 'there'}!`;
      approach = "I'd love to help you with";
      closing = "I'm excited to discuss this project with you!";
      break;
    case 'technical':
      greeting = `Dear ${clientName || 'Client'},`;
      approach = "I can provide technical expertise for";
      closing = "I look forward to discussing the technical requirements in detail.";
      break;
    case 'creative':
      greeting = `Hello ${clientName || 'there'}!`;
      approach = "I'm excited to bring creative solutions to";
      closing = "Let's create something amazing together!";
      break;
    default: // professional
      greeting = `Dear ${clientName || 'Hiring Manager'},`;
      approach = "I am writing to express my interest in";
      closing = "I look forward to discussing how I can contribute to your project's success.";
  }
  
  let proposal = `${greeting}\n\n`;
  proposal += `${approach} your ${projectTitle} project. `;
  
  // Add template-specific content
  if (template.id !== 'general') {
    proposal += `With my expertise in ${template.name.toLowerCase()}, I understand the importance of ${template.description.toLowerCase()}. `;
  }
  
  proposal += `My experience includes ${experience?.jobTitle || 'relevant work'} and proficiency in ${skills || 'key technologies'}.\n\n`;
  
  // Add approach based on length
  if (length.id === 'detailed') {
    proposal += `My approach to this project would involve:\n`;
    proposal += `• Thorough analysis of your requirements\n`;
    proposal += `• Strategic planning and timeline development\n`;
    proposal += `• Regular communication and progress updates\n`;
    proposal += `• Quality assurance and testing\n\n`;
    proposal += `I believe in delivering high-quality results that exceed expectations. `;
  } else if (length.id === 'standard') {
    proposal += `I would approach this project with careful planning, clear communication, and a focus on delivering quality results. `;
  }
  
  proposal += `${closing}\n\nBest regards,\n${name}`;
  
  // Enforce word count for fallback proposals too
  return enforceWordCount(proposal, length.wordCount.min, length.wordCount.max);
};

interface GenerateUpworkProposalRequest {
  resumeData: ResumeData;
  projectTitle: string;
  clientName?: string;
  projectDescription: string;
  budgetRange?: string;
  projectDuration?: string;
  hourlyRate?: string;
  selectedTemplate: string;
  selectedTone: string;
  selectedLength: string;
}

interface GenerateUpworkProposalResponse {
  success: boolean;
  proposal?: string;
  error?: string;
  warning?: string;
}

export const generateUpworkProposal = async (
  req: SupabaseAuthenticatedRequest,
  res: Response<GenerateUpworkProposalResponse>
): Promise<void> => {
  try {
    const { 
      resumeData, 
      projectTitle, 
      clientName, 
      projectDescription, 
      budgetRange, 
      projectDuration, 
      hourlyRate,
      selectedTemplate,
      selectedTone,
      selectedLength
    } = req.body;

    if (!resumeData || !projectTitle || !projectDescription) {
      res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: resumeData, projectTitle, projectDescription' 
      });
      return;
    }

    console.log(`[${new Date().toISOString()}] Starting Upwork proposal generation for ${projectTitle}`);
    
    // Find the selected options
    const template = proposalTemplates.find(t => t.id === selectedTemplate) || proposalTemplates.find(t => t.id === 'general')!;
    const tone = toneOptions.find(t => t.id === selectedTone) || toneOptions.find(t => t.id === 'professional')!;
    const length = lengthOptions.find(l => l.id === selectedLength) || lengthOptions.find(l => l.id === 'standard')!;

    // Prepare optimized resume summary
    const resumeSummary = {
      name: resumeData.personalInfo?.fullName || '',
      summary: (resumeData.personalInfo?.professionalSummary || '').substring(0, 300),
      experience: (resumeData.workExperience || []).slice(0, 3).map(exp => ({
        company: exp.company || '',
        position: exp.jobTitle || '',
        duration: `${exp.startDate || ''} - ${exp.endDate || 'Present'}`,
        achievements: (exp.achievements || []).slice(0, 3)
      })),
      skills: (resumeData.skills || []).slice(0, 8),
      education: (resumeData.education || []).slice(0, 2).map(edu => ({
        degree: edu.degree || '',
        institution: edu.institution || ''
      }))
    };

    let proposal: string | null = null;

    // Try AI generation if OpenAI API key is available
    if (process.env.OPENAI_API_KEY) {
      try {
        console.log(`[${new Date().toISOString()}] Attempting AI generation with specific settings`);
        
        // Create a detailed prompt that incorporates all user settings
        const prompt = `You are an expert Upwork proposal writer. Create a professional proposal that STRICTLY adheres to the word count limit.

🎯 CRITICAL WORD COUNT REQUIREMENT:
- MUST be exactly between ${length.wordCount.min}-${length.wordCount.max} words
- Count every single word carefully
- If you exceed ${length.wordCount.max} words, you MUST cut content
- If you're under ${length.wordCount.min} words, you MUST add relevant content
- This is NON-NEGOTIABLE

PROJECT INFORMATION:
- Title: ${projectTitle}
- Client: ${clientName || 'the client'}
- Description: ${projectDescription}
${budgetRange ? `- Budget: ${budgetRange}` : ''}
${projectDuration ? `- Duration: ${projectDuration}` : ''}
${hourlyRate ? `- My Rate: $${hourlyRate}/hour` : ''}

PROPOSAL REQUIREMENTS:
- Template: ${template.name} (${template.description})
- Tone: ${tone.name} (${tone.description})
- Length: EXACTLY ${length.wordCount.min}-${length.wordCount.max} words (${length.name})
- Keywords to include: ${template.keywords.slice(0, 5).join(', ')}

TONE GUIDELINES:
${tone.id === 'professional' ? '- Formal language, business terminology, authoritative voice' : ''}
${tone.id === 'friendly' ? '- Warm, approachable language, conversational tone' : ''}
${tone.id === 'technical' ? '- Precise, detail-oriented language, technical expertise focus' : ''}
${tone.id === 'creative' ? '- Innovative, expressive language, unique approach' : ''}

STRUCTURE (MANDATORY):
1. Personalized greeting addressing the client
2. Clear understanding of project requirements
3. Relevant experience and skills from resume
4. Approach and methodology
5. Value proposition and results focus
6. Professional closing with call to action

FREELANCER PROFILE:
${JSON.stringify(resumeSummary, null, 2)}

⚠️ FINAL REMINDER:
- Word count: ${length.wordCount.min}-${length.wordCount.max} words EXACTLY
- Count words before responding
- If over limit: cut unnecessary content
- If under limit: add value-driven details
- NO placeholder text or generic content
- Make every word count for maximum impact`;

        const openai = getOpenAIClient();
        
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are an expert Upwork proposal writer. You MUST follow the exact specifications provided, especially word count and tone requirements. Create compelling, personalized proposals that win projects.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: length.wordCount.max * 2, // Allow enough tokens for the response
          temperature: tone.id === 'creative' ? 0.7 : 0.3,
          stream: false,
        });
        
        proposal = completion.choices[0]?.message?.content;
        console.log(`[${new Date().toISOString()}] AI generation successful`);
        
        // Enforce word count limits
        if (proposal) {
          proposal = enforceWordCount(proposal, length.wordCount.min, length.wordCount.max);
        }
        
      } catch (aiError: any) {
        console.log(`[${new Date().toISOString()}] AI generation failed:`, aiError.message);
        proposal = null;
      }
    }

    // Use fallback if AI generation failed or no API key
    if (!proposal) {
      console.log(`[${new Date().toISOString()}] Using template-based fallback generation`);
      proposal = generateFallbackProposal(resumeData, projectTitle, clientName || '', projectDescription, template, tone, length);
    }

    // Ensure we have valid content
    if (!proposal || proposal.trim() === '') {
      console.log(`[${new Date().toISOString()}] Empty proposal detected, using basic fallback`);
      proposal = generateFallbackProposal(resumeData, projectTitle, clientName || '', projectDescription, template, tone, length);
    }

    // Final safety check
    const finalProposal = proposal.trim();
    if (!finalProposal) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate proposal content'
      });
      return;
    }

    console.log(`[${new Date().toISOString()}] Upwork proposal generation completed successfully`);
    
    res.status(200).json({
      success: true,
      proposal: finalProposal
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Upwork proposal generation error:`, error);
    
    // Last resort: try basic fallback generation
    try {
      const { resumeData, projectTitle, clientName, projectDescription, selectedTemplate, selectedTone, selectedLength } = req.body;
      if (resumeData && projectTitle && projectDescription) {
        console.log(`[${new Date().toISOString()}] Attempting basic fallback generation`);
        
        const template = proposalTemplates.find(t => t.id === selectedTemplate) || proposalTemplates.find(t => t.id === 'general')!;
        const tone = toneOptions.find(t => t.id === selectedTone) || toneOptions.find(t => t.id === 'professional')!;
        const length = lengthOptions.find(l => l.id === selectedLength) || lengthOptions.find(l => l.id === 'standard')!;
        
        const fallbackProposal = generateFallbackProposal(resumeData, projectTitle, clientName || '', projectDescription, template, tone, length);
        
        if (fallbackProposal && fallbackProposal.trim()) {
          res.status(200).json({
            success: true,
            proposal: fallbackProposal.trim(),
            warning: 'Generated using template due to AI service issues'
          });
          return;
        }
      }
    } catch (fallbackError) {
      console.error(`[${new Date().toISOString()}] Fallback generation also failed:`, fallbackError);
    }
    
    let errorMessage = 'Unknown error';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message?.includes('API key')) {
        errorMessage = 'OpenAI API key not configured';
        statusCode = 500;
      } else if (error.message?.includes('quota')) {
        errorMessage = 'API quota exceeded';
        statusCode = 429;
      } else if (error.message?.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded, please try again later';
        statusCode = 429;
      } else if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT') || error.message?.includes('ECONNRESET')) {
        errorMessage = 'Request timed out. Please try with a shorter project description or try again later.';
        statusCode = 408;
      } else if (error.message?.includes('network') || error.message?.includes('ENOTFOUND') || error.message?.includes('ECONNREFUSED')) {
        errorMessage = 'Network error. Please check your connection and try again.';
        statusCode = 503;
      } else {
        errorMessage = error.message;
      }
    }

    // Ensure we always return valid JSON
    res.status(statusCode).json({
      success: false,
      error: errorMessage
    });
  }
};