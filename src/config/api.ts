// API Configuration
// Use relative URLs in development to leverage Vite proxy, absolute URLs in production
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
const API_BASE_URL = isDevelopment 
  ? '' // Empty string for relative URLs in development
  : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001');

// Helper function to create API URLs
export const createApiUrl = (endpoint: string): string => {
  // In development, return the endpoint as-is to use Vite proxy
  if (isDevelopment) {
    return endpoint;
  }
  
  // In production, use the full URL
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    PROFILE: '/api/auth/profile',
    VERIFY: '/api/auth/verify',
    VERIFY_EMAIL: '/api/auth/verify-email',
    RESEND_VERIFICATION: '/api/auth/resend-verification',
  },
  // Job endpoints
  JOBS: {
    LIST: '/api/job-postings',
    CREATE: '/api/job-postings',
    DETAILS: (id: string) => `/api/job-postings/${id}`,
    UPDATE: (id: string) => `/api/job-postings/${id}`,
    DELETE: (id: string) => `/api/job-postings/${id}`,
    UPDATE_STATUS: (id: string) => `/api/job-postings/${id}/status`,
    APPLY: (id: string) => `/api/job-postings/${id}/apply`,
    MY_POSTS: '/api/job-postings/my/posts',
  },
  // AI endpoints
  AI: {
    OPTIMIZE_JOB_POSTING: '/api/ai-assistance/optimize-job-posting',
    GENERATE_COVER_LETTER: '/api/ai-assistance/generate-cover-letter',
    GENERATE_JOB_DESCRIPTION: '/api/ai-assistance/generate-job-description',
    GENERATE_RESPONSIBILITIES: '/api/ai-assistance/generate-responsibilities',
    GENERATE_REQUIREMENTS: '/api/ai-assistance/generate-requirements',
    INTERVIEW_PREP: '/api/ai-assistance/interview-prep',
    RESUME_OPTIMIZATION: '/api/ai-assistance/resume-optimization',
    CAREER_ADVICE: '/api/ai-assistance/career-advice',
    SALARY_ESTIMATE: '/api/ai-assistance/salary-estimate',
    JOB_MATCHING: '/api/ai-assistance/job-matching',
    OPTIMIZE_JOB_TITLE: '/api/ai-assistance/optimize-job-title',
    GENERATE_INTERVIEW_QUESTIONS: '/api/ai-assistance/generate-interview-questions',
    SUGGEST_SKILLS: '/api/ai-assistance/suggest-skills',
    CLASSIFY_JOB_CATEGORY: '/api/ai-assistance/classify-job-category',
  },
  // Applicant endpoints
  APPLICANT: {
    STATS: '/api/applicant/stats',
    APPLICATIONS: '/api/applicant/applications',
    PROFILE: '/api/applicant/profile',
    SAVED_JOBS: '/api/applicant/saved-jobs',
  },
  // Employer endpoints
  EMPLOYER: {
    STATS: '/api/employer/stats',
    JOBS: '/api/employer/jobs',
    APPLICATIONS: '/api/employer/applications',
  },
  // Admin endpoints
  ADMIN: {
    USERS: '/api/admin/users',
    STATS: '/api/admin/stats',
  },
  // Job bookmarks
  BOOKMARKS: {
    LIST: '/api/job-bookmarks',
    ADD: '/api/job-bookmarks',
    REMOVE: (id: string) => `/api/job-bookmarks/${id}`,
  },
};

// Global token storage for API calls
let globalAuthToken: string | null = null;

// Function to set the global auth token
export const setGlobalAuthToken = (token: string | null) => {
  globalAuthToken = token;
  console.log('🔑 Global auth token updated:', token ? 'Set' : 'Cleared');
};

// Function to get the current auth token
export const getGlobalAuthToken = (): string | null => {
  return globalAuthToken;
};

// Helper function to make API calls with automatic authentication
export const apiCall = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const url = createApiUrl(endpoint);
  console.log(`🔧 API Call: ${endpoint} -> ${url} (DEV: ${isDevelopment})`);
  
  // Prepare headers with automatic authentication
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  // Add authentication header if token is available and not already provided
  if (globalAuthToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${globalAuthToken}`;
    console.log('🔑 Added auth header to API call');
  }

  const defaultOptions: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, defaultOptions);
    console.log(`📡 API Response: ${response.status} ${response.statusText}`);
    return response;
  } catch (error) {
    console.error(`API call failed for ${url}:`, error);
    throw error;
  }
};

// Helper function for authenticated API calls (explicit token passing)
export const authenticatedApiCall = async (
  endpoint: string, 
  token: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const url = createApiUrl(endpoint);
  console.log(`🔧 Authenticated API Call: ${endpoint} -> ${url}`);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers as Record<string, string>,
  };

  const defaultOptions: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, defaultOptions);
    console.log(`📡 Authenticated API Response: ${response.status} ${response.statusText}`);
    return response;
  } catch (error) {
    console.error(`Authenticated API call failed for ${url}:`, error);
    throw error;
  }
};

export default {
  createApiUrl,
  API_ENDPOINTS,
  apiCall,
  authenticatedApiCall,
  setGlobalAuthToken,
  getGlobalAuthToken,
};