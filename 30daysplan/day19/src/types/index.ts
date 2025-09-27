// Core data interfaces
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
  last_login: string;
  email_verified: boolean;
}

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  profileImage?: string; // Base64 encoded image or URL
  portfolio: string;
  address: string;
  dateOfBirth: string;
  nationality: string;
  languages: string[];
  professionalSummary: string;
}

export interface WorkExperience {
  id: string;
  jobTitle: string;
  company: string;
  companySize: string;
  industry: string;
  startDate: string;
  endDate: string;
  achievements: string[];
  technologies: string[];
  teamSize: string;
  location: string;
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  relevantCoursework: string[];
  honors: string[];
  thesis?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expirationDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  startDate: string;
  endDate?: string;
  githubUrl?: string;
  liveUrl?: string;
  highlights: string[];
}

export interface VolunteerExperience {
  id: string;
  role: string;
  organization: string;
  location: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description: string;
  achievements: string[];
  impact?: string;
  hoursPerWeek?: number;
  totalHours?: number;
}

export interface Award {
  id: string;
  name: string;
  organization: string;
  date: string;
  description: string;
  category: 'academic' | 'professional' | 'personal' | 'leadership' | 'community' | 'technical' | 'creative' | 'sports' | 'volunteer' | 'other';
}

export interface Language {
  id: string;
  name: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'native';
  certifications?: string[];
  certification?: string;
}

export interface Reference {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  relationship: string;
  yearsKnown?: number;
}

export interface Publication {
  id: string;
  title: string;
  authors: string[];
  publication: string;
  journal?: string;
  date: string;
  year: number;
  url?: string;
  doi?: string;
  abstract?: string;
}

export interface Patent {
  id: string;
  title: string;
  patentNumber: string;
  date: string;
  filingDate: string;
  grantDate: string;
  description: string;
  inventors: string[];
  status: 'pending' | 'granted' | 'expired';
}

export interface SpeakingEngagement {
  id: string;
  title: string;
  event: string;
  location: string;
  date: string;
  description: string;
  audience?: string;
  audienceSize?: number;
  type: 'conference' | 'workshop' | 'webinar' | 'panel' | 'keynote' | 'other';
}

export interface ProfessionalMembership {
  id: string;
  organization: string;
  role?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  name: string;
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  workExperience: WorkExperience[];
  skills: string[];
  education: Education[];
  certifications: Certification[];
  projects: Project[];
  volunteerExperience: VolunteerExperience[];
  awards: Award[];
  languages: Language[];
  languageSkills: Language[]; // Alias for backward compatibility
  references: Reference[];
  publications: Publication[];
  patents: Patent[];
  speakingEngagements: SpeakingEngagement[];
  professionalMemberships: ProfessionalMembership[];
  hobbies: string[];
  availableOnRequest: boolean;
  selectedColorScheme?: ColorScheme; // Color scheme from resume upload
}

export interface AnalysisResult {
  overallScore: number;
  contentScore: number;
  formattingScore: number;
  keywordScore: number;
  atsScore: number;
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  suggestions: string[];
  detailedAnalysis?: string;
}

// API request/response interfaces
export interface ImproveTextRequest {
  text: string;
  section: 'personal' | 'experience' | 'skills';
}

export interface ImproveTextResponse {
  improvedText: string;
  success: boolean;
  error?: string;
  fallback?: boolean;
  message?: string;
}

export interface AnalyzeResumeRequest {
  resumeText: string;
  fileName: string;
}

export interface AnalyzeResumeResponse extends AnalysisResult {
  success: boolean;
  error?: string;
}

// Form step types
export type FormStep = 'personal' | 'experience' | 'skills' | 'preview';

// File upload types
export interface UploadedFile {
  file: File;
  name: string;
  size: number;
  type: string;
}