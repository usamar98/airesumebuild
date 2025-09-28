import { Request, Response } from 'express';
import OpenAI from 'openai';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { AnalyzeResumeRequest, AnalyzeResumeResponse } from '../../src/types';

const ANALYSIS_SYSTEM_PROMPT = `You are a senior recruiter and ATS expert. Analyze the resume below. Return JSON with the following fields:
- overall_score (0–100, based on clarity, structure, ATS keyword match, and grammar)
- strengths (list of 3–5 strong points)
- weaknesses (list of 3–5 weak points)
- ats_keywords_missing (list of keywords relevant to the candidate's field that are missing)
- suggestions (actionable bullet points to improve the resume)

Return only valid JSON without any additional text or formatting.`;

export const analyzeResume = async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file;
    
    // Validate file upload
    if (!file) {
      res.status(400).json({
          success: false,
          error: 'No file uploaded',
          overallScore: 0,
          contentScore: 0,
          formattingScore: 0,
          keywordScore: 0,
          atsScore: 0,
          strengths: [],
          weaknesses: [],
          missingKeywords: [],
          suggestions: []
        } as AnalyzeResumeResponse);
      return;
    }

    // Extract text from uploaded file
    let resumeText: string;
    try {
      if (file.mimetype === 'application/pdf') {
        resumeText = await extractTextFromPDF(file.buffer);
      } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        resumeText = await extractTextFromDOCX(file.buffer);
      } else {
        res.status(400).json({
          success: false,
          error: 'Unsupported file type. Please upload a PDF or DOCX file.',
          overallScore: 0,
          contentScore: 0,
          formattingScore: 0,
          keywordScore: 0,
          atsScore: 0,
          strengths: [],
          weaknesses: [],
          missingKeywords: [],
          suggestions: []
        } as AnalyzeResumeResponse);
        return;
      }
    } catch (extractError) {
      console.error('Error extracting text from file:', extractError);
      res.status(500).json({
        success: false,
        error: 'Failed to extract text from file',
        overallScore: 0,
        contentScore: 0,
        formattingScore: 0,
        keywordScore: 0,
        atsScore: 0,
        strengths: [],
        weaknesses: [],
        missingKeywords: [],
        suggestions: []
      } as AnalyzeResumeResponse);
      return;
    }

    // Validate extracted text
    if (!resumeText || resumeText.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'No text could be extracted from the file',
        overallScore: 0,
        contentScore: 0,
        formattingScore: 0,
        keywordScore: 0,
        atsScore: 0,
        strengths: [],
        weaknesses: [],
        missingKeywords: [],
        suggestions: []
      } as AnalyzeResumeResponse);
      return;
    }

    if (!process.env.OPENAI_API_KEY) {
      res.status(500).json({
        success: false,
        error: 'OpenAI API key not configured',
        overallScore: 0,
        contentScore: 0,
        formattingScore: 0,
        keywordScore: 0,
        atsScore: 0,
        strengths: [],
        weaknesses: [],
        missingKeywords: [],
        suggestions: []
      } as AnalyzeResumeResponse);
      return;
    }

    // Initialize OpenAI client with optimized timeout configuration
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 20000, // Reduced to 20 seconds timeout
      maxRetries: 1, // Reduced retries for faster fallback
    });

    // Log analysis attempt
    console.log(`[${new Date().toISOString()}] Starting resume analysis`);
    console.log(`[${new Date().toISOString()}] Resume text length: ${resumeText.length} characters`);
    
    // Truncate resume text if too long to avoid timeout
    const maxResumeLength = 3000;
    const truncatedResumeText = resumeText.length > maxResumeLength 
      ? resumeText.substring(0, maxResumeLength) + '\n\n[Text truncated for analysis]'
      : resumeText;

    // Call OpenAI API with optimized parameters
    let completion;
    try {
      console.log(`[${new Date().toISOString()}] Attempting AI analysis with gpt-4o-mini`);
      completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: ANALYSIS_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: `Resume to analyze:\n\n${truncatedResumeText}`
          }
        ],
        max_tokens: 800, // Reduced token limit
        temperature: 0.2, // Lower temperature for consistency
      });
      console.log(`[${new Date().toISOString()}] AI analysis completed successfully`);
    } catch (openaiError) {
      console.error(`[${new Date().toISOString()}] AI analysis failed:`, openaiError instanceof Error ? openaiError.message : 'Unknown error');
      
      // Use fallback analysis instead of retry
      console.log(`[${new Date().toISOString()}] Using fallback analysis`);
      const fallbackAnalysis = generateFallbackAnalysis(resumeText);
      
      res.json({
        success: true,
        overallScore: fallbackAnalysis.overall_score,
        contentScore: fallbackAnalysis.overall_score,
        formattingScore: fallbackAnalysis.overall_score,
        keywordScore: fallbackAnalysis.overall_score,
        atsScore: fallbackAnalysis.overall_score,
        strengths: fallbackAnalysis.strengths,
        weaknesses: fallbackAnalysis.weaknesses,
        missingKeywords: fallbackAnalysis.ats_keywords_missing,
        suggestions: fallbackAnalysis.suggestions
      } as AnalyzeResumeResponse);
      return;
    }

    const analysisText = completion.choices[0]?.message?.content?.trim();
    
    if (!analysisText) {
      res.status(500).json({
        success: false,
        error: 'Unable to analyze this resume. Please try again.',
        overallScore: 0,
        contentScore: 0,
        formattingScore: 0,
        keywordScore: 0,
        atsScore: 0,
        strengths: [],
        weaknesses: [],
        missingKeywords: [],
        suggestions: []
      } as AnalyzeResumeResponse);
      return;
    }

    // Parse the JSON response from OpenAI
    let analysisResult;
    try {
      analysisResult = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      res.status(500).json({
        success: false,
        error: 'Unable to analyze this resume. Please try again.',
        overallScore: 0,
        contentScore: 0,
        formattingScore: 0,
        keywordScore: 0,
        atsScore: 0,
        strengths: [],
        weaknesses: [],
        missingKeywords: [],
        suggestions: []
      } as AnalyzeResumeResponse);
      return;
    }

    // Validate the analysis result structure
    const {
      overall_score = 0,
      strengths = [],
      weaknesses = [],
      ats_keywords_missing = [],
      suggestions = []
    } = analysisResult;

    res.json({
      success: true,
      overallScore: Math.min(Math.max(overall_score, 0), 100), // Ensure score is between 0-100
      contentScore: Math.min(Math.max(overall_score, 0), 100),
      formattingScore: Math.min(Math.max(overall_score, 0), 100),
      keywordScore: Math.min(Math.max(overall_score, 0), 100),
      atsScore: Math.min(Math.max(overall_score, 0), 100),
      strengths: Array.isArray(strengths) ? strengths : [],
      weaknesses: Array.isArray(weaknesses) ? weaknesses : [],
      missingKeywords: Array.isArray(ats_keywords_missing) ? ats_keywords_missing : [],
      suggestions: Array.isArray(suggestions) ? suggestions : []
    } as AnalyzeResumeResponse);

  } catch (error) {
    console.error('Error analyzing resume:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      overallScore: 0,
      contentScore: 0,
      formattingScore: 0,
      keywordScore: 0,
      atsScore: 0,
      strengths: [],
      weaknesses: [],
      missingKeywords: [],
      suggestions: []
    } as AnalyzeResumeResponse);
  }
};

// Helper function to extract text from PDF with multiple fallback methods
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  let lastError: Error | null = null;
  
  // Method 1: Try pdf-parse first (most reliable for text-based PDFs)
  try {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    if (data.text && data.text.trim().length > 0) {
      console.log('PDF text extracted successfully using pdf-parse');
      return data.text.trim();
    }
  } catch (error) {
    console.log('pdf-parse failed:', error);
    lastError = error as Error;
  }
  
  // Method 2: Try pdfjs-dist as fallback
  try {
    const uint8Array = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({ 
      data: uint8Array,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true
    });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    if (fullText.trim().length > 0) {
      console.log('PDF text extracted successfully using pdfjs-dist');
      return fullText.trim();
    }
  } catch (error) {
    console.log('pdfjs-dist failed, trying alternative method:', error);
    lastError = error as Error;
  }
  
  // Method 3: Basic buffer text extraction as last resort
  try {
    const bufferText = buffer.toString('utf8');
    const textMatch = bufferText.match(/BT\s+.*?ET/gs);
    if (textMatch && textMatch.length > 0) {
      const extractedText = textMatch.join(' ').replace(/[\x00-\x1F\x7F-\x9F]/g, ' ').trim();
      if (extractedText.length > 50) {
        console.log('PDF text extracted using basic buffer method');
        return extractedText;
      }
    }
  } catch (error) {
    console.log('Basic buffer extraction failed:', error);
    lastError = error as Error;
  }
  
  // If all methods fail, throw detailed error
  console.error('All PDF extraction methods failed. Last error:', lastError);
  throw new Error(`Failed to extract text from PDF. The file may be image-based, corrupted, or password-protected. Last error: ${lastError?.message || 'Unknown error'}`);
}

// Helper function to extract text from DOCX buffer
export const extractTextFromDOCX = async (buffer: Buffer): Promise<string> => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw new Error('Failed to extract text from DOCX');
  }
};

// Fallback analysis function when OpenAI API fails
function generateFallbackAnalysis(resumeText: string) {
  const wordCount = resumeText.split(/\s+/).length;
  const hasContactInfo = /\b(?:email|phone|linkedin|github)\b/i.test(resumeText);
  const hasExperience = /\b(?:experience|work|job|position|role)\b/i.test(resumeText);
  const hasEducation = /\b(?:education|degree|university|college|school)\b/i.test(resumeText);
  const hasSkills = /\b(?:skills|technologies|programming|software)\b/i.test(resumeText);
  
  // Calculate basic score based on content presence
  let score = 50; // Base score
  if (hasContactInfo) score += 10;
  if (hasExperience) score += 15;
  if (hasEducation) score += 10;
  if (hasSkills) score += 10;
  if (wordCount > 200) score += 5;
  
  return {
    overall_score: Math.min(score, 85), // Cap at 85 for fallback
    strengths: [
      hasContactInfo ? "Contact information is present" : "Resume structure is readable",
      hasExperience ? "Work experience section included" : "Content is well-organized",
      hasSkills ? "Technical skills are mentioned" : "Professional presentation"
    ].filter(Boolean),
    weaknesses: [
      !hasContactInfo ? "Missing or unclear contact information" : null,
      !hasExperience ? "Work experience section needs improvement" : null,
      !hasEducation ? "Education section could be enhanced" : null,
      wordCount < 200 ? "Resume content appears too brief" : null
    ].filter(Boolean),
    ats_keywords_missing: [
      "industry-specific keywords",
      "technical skills",
      "action verbs",
      "quantifiable achievements"
    ],
    suggestions: [
      "Add more specific technical skills relevant to your target role",
      "Include quantifiable achievements with numbers and percentages",
      "Use strong action verbs to describe your accomplishments",
      "Ensure all contact information is clearly visible",
      "Tailor keywords to match job descriptions in your field"
    ]
  };
}