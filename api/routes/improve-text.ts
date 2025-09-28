import { Request, Response } from 'express';
import OpenAI from 'openai';
import { ImproveTextRequest, ImproveTextResponse } from '../../src/types';

const SYSTEM_PROMPT = "You are a professional resume coach. Rewrite the following resume section to be concise, action-oriented, and ATS-friendly. Keep it in first-person neutral (no 'I'). Return improved bullet points or sentences directly.";

// Fallback improvement function
const getFallbackImprovement = (text: string, section: string): string => {
  // Basic text improvements without AI
  let improved = text.trim();
  
  // Remove redundant words and improve formatting
  improved = improved.replace(/\b(very|really|quite|extremely)\s+/gi, '');
  improved = improved.replace(/\s+/g, ' ');
  
  // Add action verbs for different sections
  if (section === 'professionalSummary') {
    if (!improved.match(/^(Experienced|Skilled|Dedicated|Results-driven|Professional)/i)) {
      improved = `Experienced professional with ${improved.toLowerCase()}`;
    }
  }
  
  return improved;
};

export const improveText = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, section }: ImproveTextRequest = req.body;

    // Validate input
    if (!text || !section) {
      res.status(400).json({
        success: false,
        error: 'Text and section are required',
        improvedText: ''
      } as ImproveTextResponse);
      return;
    }

    if (!process.env.OPENAI_API_KEY) {
      res.status(500).json({
        success: false,
        error: 'OpenAI API key not configured',
        improvedText: ''
      } as ImproveTextResponse);
      return;
    }

    // Initialize OpenAI client with increased timeout configuration
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 60000, // 60 seconds timeout
      maxRetries: 3,
    });

    // Call OpenAI API with enhanced retry logic and fallback
    let completion;
    let improvedText = text;
    
    try {
      completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: `Section: ${section}\n\nText to improve: ${text}`
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });
      
      improvedText = completion.choices[0]?.message?.content?.trim() || text;
      
    } catch (openaiError: any) {
      console.error('OpenAI API error:', openaiError);
      
      // Check if it's a timeout or connection error
      if (openaiError.code === 'timeout' || openaiError.message?.includes('timeout') || 
          openaiError.name === 'APIConnectionTimeoutError') {
        console.log('API timeout detected, using fallback improvement');
        improvedText = getFallbackImprovement(text, section);
        
        res.json({
          success: true,
          improvedText,
          fallback: true,
          message: 'AI service was slow, used basic improvement. You can try again for AI-enhanced results.'
        } as ImproveTextResponse);
        return;
      }
      
      // For other errors, try one more time with shorter timeout
      try {
        const quickOpenai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
          timeout: 20000, // 20 seconds for retry
          maxRetries: 1,
        });
        
        completion = await quickOpenai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: SYSTEM_PROMPT
            },
            {
              role: 'user',
              content: `Section: ${section}\n\nText to improve: ${text}`
            }
          ],
          max_tokens: 300, // Reduced tokens for faster response
          temperature: 0.7,
        });
        
        improvedText = completion.choices[0]?.message?.content?.trim() || text;
        
      } catch (retryError: any) {
        console.error('OpenAI API error after retry:', retryError);
        
        // Use fallback improvement
        improvedText = getFallbackImprovement(text, section);
        
        res.json({
          success: true,
          improvedText,
          fallback: true,
          message: 'AI service is currently unavailable. Used basic improvement instead.'
        } as ImproveTextResponse);
        return;
      }
    }

    res.json({
      success: true,
      improvedText,
    } as ImproveTextResponse);

  } catch (error) {
    console.error('Error improving text:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      improvedText: ''
    } as ImproveTextResponse);
  }
};