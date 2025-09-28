import { Request, Response } from 'express';
import OpenAI from 'openai';

interface GenerateWorkSuggestionsRequest {
  jobTitle: string;
  company: string;
  type: 'achievements' | 'technologies';
  industry?: string;
}

interface GenerateWorkSuggestionsResponse {
  suggestions: string[];
  error?: string;
}

export async function generateWorkSuggestions(
  req: Request<{}, GenerateWorkSuggestionsResponse, GenerateWorkSuggestionsRequest>,
  res: Response<GenerateWorkSuggestionsResponse>
) {
  try {
    const { jobTitle, company, industry, type } = req.body;

    if (!jobTitle || !company || !type) {
      return res.status(400).json({
        suggestions: [],
        error: 'Missing required fields: jobTitle, company, or type'
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      return res.status(500).json({
        suggestions: [],
        error: 'AI service not configured'
      });
    }

    const suggestions = await generateAISuggestions(jobTitle, company, type, industry);

    res.json({
      suggestions
    });
  } catch (error) {
    console.error('Error generating work suggestions:', error);
    res.status(500).json({
      suggestions: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}

async function generateAISuggestions(
  jobTitle: string,
  company: string,
  type: 'achievements' | 'technologies',
  industry?: string
): Promise<string[]> {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000, // 30 seconds timeout
      maxRetries: 2,
    });
    
    let prompt = '';
    
    if (type === 'achievements') {
      prompt = `Generate 5 professional achievement bullet points for a ${jobTitle} position at ${company}${industry ? ` in the ${industry} industry` : ''}. 
      
Requirements:
      - Use action verbs and quantifiable results when possible
      - Focus on impact, leadership, and technical accomplishments
      - Keep each point concise (1-2 lines)
      - Make them specific to the role and industry
      - Use professional language
      
      Return only the bullet points, one per line, without bullet symbols or numbers.`;
    } else {
      prompt = `Generate 5-8 relevant technologies and tools for a ${jobTitle} position at ${company}${industry ? ` in the ${industry} industry` : ''}.
      
      Requirements:
      - Include programming languages, frameworks, tools, and platforms
      - Focus on current, industry-standard technologies
      - Consider the specific role and company context
      - Include both technical and soft skills where appropriate
      
      Return only the technology names, one per line, without descriptions.`;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a professional resume writer and career advisor. Provide accurate, relevant, and professional suggestions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Split by lines and filter out empty lines
    const suggestions = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .slice(0, type === 'achievements' ? 5 : 8);

    return suggestions;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate AI suggestions');
  }
}