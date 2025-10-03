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
      timeout: 25000, // Reduced to 25 seconds for faster fallback
      maxRetries: 1, // Only 1 retry
      defaultHeaders: {
        'Connection': 'keep-alive',
      },
    });
  }
  return openaiClient;
};

// Template-based fallback for cover letters
const generateFallbackCoverLetter = (
  resumeData: ResumeData,
  companyName: string,
  positionTitle: string,
  jobDescription: string
): string => {
  const name = resumeData.personalInfo?.fullName || 'Candidate';
  const experience = resumeData.workExperience?.[0];
  const skills = (resumeData.skills || []).slice(0, 3).join(', ');
  
  return `Dear Hiring Manager,

I am writing to express my strong interest in the ${positionTitle} position at ${companyName}. With my background in ${experience?.jobTitle || 'relevant experience'} and expertise in ${skills || 'key technologies'}, I am confident I would be a valuable addition to your team.

In my previous role${experience ? ` at ${experience.company}` : ''}, I have developed strong skills that align well with your requirements. My experience includes working with various technologies and delivering results that drive business success.

I am particularly drawn to ${companyName} because of your reputation for innovation and excellence. I would welcome the opportunity to discuss how my skills and enthusiasm can contribute to your team's continued success.

Thank you for considering my application. I look forward to hearing from you.

Sincerely,
${name}`;
};

// Chunk large prompts to reduce processing time
const chunkPrompt = (prompt: string, maxLength: number = 3000): string[] => {
  if (prompt.length <= maxLength) {
    return [prompt];
  }
  
  const chunks: string[] = [];
  let currentChunk = '';
  const sentences = prompt.split('. ');
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxLength && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence + '. ';
    } else {
      currentChunk += sentence + '. ';
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
};

interface GenerateCoverLetterRequest {
  resumeData: ResumeData;
  jobDescription: string;
  companyName: string;
  positionTitle: string;
  existingContent?: string;
  type: 'enhance' | 'generate' | 'full';
}

interface GenerateCoverLetterResponse {
  success: boolean;
  coverLetter?: string;
  error?: string;
  warning?: string;
}

export const generateCoverLetter = async (
  req: SupabaseAuthenticatedRequest,
  res: Response<GenerateCoverLetterResponse>
): Promise<void> => {
  try {
    const { resumeData, jobDescription, companyName, positionTitle, existingContent, type } = req.body;

    if (!resumeData || !jobDescription || !companyName || !positionTitle) {
      res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: resumeData, jobDescription, companyName, positionTitle' 
      });
      return;
    }

    if (!process.env.OPENAI_API_KEY) {
      res.status(500).json({
        success: false,
        error: 'OpenAI API key not configured'
      });
      return;
    }

    console.log(`[${new Date().toISOString()}] Starting cover letter generation for ${positionTitle} at ${companyName}`);
    
    // Prepare optimized resume summary for the AI (reduced data to minimize token usage)
    const resumeSummary = {
      name: resumeData.personalInfo?.fullName || '',
      summary: (resumeData.personalInfo?.professionalSummary || '').substring(0, 200), // Limit summary length
      experience: (resumeData.workExperience || []).slice(0, 2).map(exp => ({ // Only top 2 experiences
        company: exp.company || '',
        position: exp.jobTitle || '',
        duration: `${exp.startDate || ''} - ${exp.endDate || 'Present'}`,
        achievements: (exp.achievements || []).slice(0, 2) // Top 2 achievements only
      })),
      skills: (resumeData.skills || []).slice(0, 5), // Top 5 skills
      education: (resumeData.education || []).slice(0, 1).map(edu => ({ // Only most recent education
        degree: edu.degree || '',
        institution: edu.institution || ''
      }))
    };

    // Create optimized, shorter prompts to reduce processing time
    let prompt: string;
    const jobDescriptionShort = jobDescription.substring(0, 500); // Limit job description length
    
    if (type === 'enhance') {
      // Shorter enhancement prompt
      prompt = `Enhance this cover letter for ${positionTitle} at ${companyName}.

Job: ${jobDescriptionShort}
Resume: ${JSON.stringify(resumeSummary)}
Draft: ${existingContent}

Improve language, highlight relevant experience, and ensure professional tone. Return only the enhanced cover letter.`;
    } else if (type === 'generate' || type === 'full') {
      // Shorter generation prompt
      prompt = `Create a professional cover letter for ${positionTitle} at ${companyName}.

Job: ${jobDescriptionShort}
Candidate: ${JSON.stringify(resumeSummary)}

Write 3-4 paragraphs highlighting relevant experience and enthusiasm. Use actual name, no placeholders. Return only the cover letter text.`;
    } else {
      throw new Error('Invalid type parameter. Must be "enhance", "generate", or "full"');
    }

    console.log(`[${new Date().toISOString()}] Prompt length: ${prompt.length} characters`);
    
    // Use optimized OpenAI client
    const openai = getOpenAIClient();
    
    let completion;
    let coverLetter: string | null = null;
    
    try {
      // Try AI generation with optimized settings
      console.log(`[${new Date().toISOString()}] Attempting AI generation with gpt-4o-mini`);
      
      completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Faster model
        messages: [
          {
            role: 'system',
            content: 'You are a professional cover letter writer. Be concise and effective.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 400, // Further reduced for speed
        temperature: 0.3, // Lower temperature for faster responses
        stream: false,
      });
      
      coverLetter = completion.choices[0]?.message?.content;
      console.log(`[${new Date().toISOString()}] AI generation successful`);
      
    } catch (aiError: any) {
      console.log(`[${new Date().toISOString()}] AI generation failed:`, aiError.message);
      
      // Immediate fallback to template-based generation
      console.log(`[${new Date().toISOString()}] Using fallback template generation`);
      coverLetter = generateFallbackCoverLetter(resumeData, companyName, positionTitle, jobDescription);
      
      // Return immediately with fallback result
      res.json({
        success: true,
        coverLetter: coverLetter
      });
      return;
    }

    if (!coverLetter) {
      console.log(`[${new Date().toISOString()}] No cover letter generated, using fallback`);
      coverLetter = generateFallbackCoverLetter(resumeData, companyName, positionTitle, jobDescription);
    }

    console.log(`[${new Date().toISOString()}] Cover letter generation completed successfully`);
    
    // Ensure we have valid content before sending response
    if (!coverLetter || coverLetter.trim() === '') {
      console.log(`[${new Date().toISOString()}] Empty cover letter detected, using fallback`);
      coverLetter = generateFallbackCoverLetter(resumeData, companyName, positionTitle, jobDescription);
    }
    
    // Final safety check
    const finalCoverLetter = coverLetter.trim();
    if (!finalCoverLetter) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate cover letter content'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      coverLetter: finalCoverLetter
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Cover letter generation error:`, error);
    
    // Last resort: try fallback generation
    try {
      const { resumeData, companyName, positionTitle, jobDescription } = req.body;
      if (resumeData && companyName && positionTitle && jobDescription) {
        console.log(`[${new Date().toISOString()}] Attempting fallback generation`);
        const fallbackCoverLetter = generateFallbackCoverLetter(resumeData, companyName, positionTitle, jobDescription);
        
        if (fallbackCoverLetter && fallbackCoverLetter.trim()) {
          res.status(200).json({
            success: true,
            coverLetter: fallbackCoverLetter.trim(),
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
        errorMessage = 'Request timed out. Please try with a shorter job description or try again later.';
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