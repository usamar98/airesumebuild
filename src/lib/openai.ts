import { ImproveTextRequest, ImproveTextResponse, AnalyzeResumeRequest, AnalyzeResumeResponse } from '../types';

// Base API URL - will be automatically handled by Vite proxy in development
const API_BASE_URL = '/api';

// Improve text using OpenAI
export const improveText = async (text: string, section: 'personal' | 'experience' | 'skills'): Promise<ImproveTextResponse> => {
  try {
    const request: ImproveTextRequest = {
      text,
      section
    };

    const response = await fetch(`${API_BASE_URL}/improve-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data: ImproveTextResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error improving text:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to improve text',
      improvedText: text // Return original text as fallback
    };
  }
};

// Analyze resume using OpenAI
export const analyzeResume = async (resumeText: string, fileName: string): Promise<AnalyzeResumeResponse> => {
  try {
    const request: AnalyzeResumeRequest = {
      resumeText,
      fileName
    };

    const response = await fetch(`${API_BASE_URL}/analyze-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data: AnalyzeResumeResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error analyzing resume:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze resume',
      overallScore: 0,
      contentScore: 0,
      formattingScore: 0,
      keywordScore: 0,
      atsScore: 0,
      strengths: [],
      weaknesses: [],
      missingKeywords: [],
      suggestions: []
    };
  }
};

// Check if OpenAI API is available
export const checkAPIHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

// Utility function to handle API errors gracefully
export const handleAPIError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
};

// Retry function for API calls
export const retryAPICall = async <T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 1,
  delay: number = 1000
): Promise<T> => {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};