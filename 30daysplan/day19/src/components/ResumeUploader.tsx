import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FileUpload from './FileUpload';
import { ParsedResumeData } from '../../api/services/resumeParser';
import { ResumeData } from '../types';
import { CloudArrowUpIcon, DocumentCheckIcon, PaintBrushIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface ResumeUploaderProps {
  onDataParsed?: (data: ResumeData) => void;
  className?: string;
}

// Color schemes for resume customization
const colorSchemes = [
  { primary: '#2563eb', secondary: '#1e40af', accent: '#3b82f6', name: 'Professional Blue' },
  { primary: '#059669', secondary: '#047857', accent: '#10b981', name: 'Success Green' },
  { primary: '#7c3aed', secondary: '#6d28d9', accent: '#8b5cf6', name: 'Creative Purple' },
  { primary: '#dc2626', secondary: '#b91c1c', accent: '#ef4444', name: 'Bold Red' },
  { primary: '#1f2937', secondary: '#374151', accent: '#6b7280', name: 'Classic Gray' },
  { primary: '#7c2d12', secondary: '#92400e', accent: '#d97706', name: 'Warm Orange' }
];

export default function ResumeUploader({ onDataParsed, className = '' }: ResumeUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedColorScheme, setSelectedColorScheme] = useState(0);

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific error responses from the backend
        const errorMessage = result.message || result.error || `Upload failed: ${response.statusText}`;
        throw new Error(errorMessage);
      }
      
      if (result.success && result.parsedData) {
        // Validate that we have some meaningful data
        const hasPersonalInfo = result.parsedData.personalInfo?.fullName || result.parsedData.personalInfo?.email;
        const hasWorkExperience = result.parsedData.workExperience?.length > 0;
        const hasEducation = result.parsedData.education?.length > 0;
        const hasSkills = result.parsedData.skills?.length > 0;
        
        if (!hasPersonalInfo && !hasWorkExperience && !hasEducation && !hasSkills) {
          throw new Error('No meaningful resume data could be extracted from the file. Please ensure your resume contains clear, readable text.');
        }
        
        const resumeData = convertParsedDataToResumeData(result.parsedData);
        
        // Include selected color scheme
        const selectedColors = colorSchemes[selectedColorScheme];
        const resumeDataWithColors = {
          ...resumeData,
          selectedColorScheme: selectedColors,
          uploadMetadata: {
            fileName: result.fileName,
            fileSize: result.fileSize,
            mimeType: result.mimeType,
            extractedLength: result.extractedLength,
            processingTime: result.processingTime
          }
        };
        
        // Store the parsed data in localStorage for the resume builder
        localStorage.setItem('updatedResumeData', JSON.stringify(resumeDataWithColors));
        
        setUploadSuccess(true);
        
        if (onDataParsed) {
          onDataParsed(resumeData);
        }
        
        // Navigate to resume builder after a short delay
        setTimeout(() => {
          navigate('/resume-builder?updated=true');
        }, 1500);
      } else {
        throw new Error(result.message || 'Failed to parse resume data from the uploaded file.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      let errorMessage = 'Upload failed. Please try again.';
      let suggestions: string[] = [];
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Try to parse enhanced error response
        try {
          const errorData = JSON.parse(error.message);
          if (errorData.message) {
            errorMessage = errorData.message;
          }
          if (errorData.suggestions && Array.isArray(errorData.suggestions)) {
            suggestions = errorData.suggestions;
          }
        } catch {
          // If not JSON, use the original message
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Provide helpful error messages for common issues
      if (errorMessage.includes('NetworkError') || errorMessage.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
        suggestions = ['Check your internet connection', 'Try again in a few moments', 'Contact support if the issue persists'];
      } else if (errorMessage.includes('413') || errorMessage.includes('too large')) {
        errorMessage = 'File is too large. Please upload a file smaller than 10MB.';
        suggestions = ['Compress your PDF file', 'Convert to a more efficient format', 'Remove unnecessary images or content'];
      } else if (errorMessage.includes('415') || errorMessage.includes('Unsupported')) {
        errorMessage = 'Unsupported file format. Please upload a PDF, DOC, or DOCX file.';
        suggestions = ['Convert your file to PDF format', 'Save as .docx from Word', 'Ensure the file extension is correct'];
      }
      
      // Store suggestions for display
      if (suggestions.length > 0) {
        setUploadError(`${errorMessage}\n\nSuggestions:\n${suggestions.map(s => `• ${s}`).join('\n')}`);
      } else {
        setUploadError(errorMessage);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const convertParsedDataToResumeData = (parsedData: ParsedResumeData): ResumeData => {
    return {
      personalInfo: {
        fullName: parsedData.personalInfo.fullName || '',
        email: parsedData.personalInfo.email || '',
        phone: parsedData.personalInfo.phone || '',
        linkedin: parsedData.personalInfo.linkedin || '',
        github: parsedData.personalInfo.github || '',
        portfolio: parsedData.personalInfo.portfolio || '',
        address: parsedData.personalInfo.address || '',
        dateOfBirth: parsedData.personalInfo.dateOfBirth || '',
        nationality: parsedData.personalInfo.nationality || '',
        languages: parsedData.personalInfo.languages || [],
        professionalSummary: parsedData.personalInfo.professionalSummary || ''
      },
      workExperience: parsedData.workExperience.map((exp, index) => ({
        id: exp.id || `work-${index}`,
        jobTitle: exp.jobTitle || '',
        company: exp.company || '',
        companySize: exp.companySize || '',
        industry: exp.industry || '',
        startDate: exp.startDate || '',
        endDate: exp.endDate || '',
        achievements: exp.achievements || [],
        technologies: exp.technologies || [],
        teamSize: exp.teamSize || '',
        location: exp.location || ''
      })),
      education: parsedData.education.map((edu, index) => ({
        id: edu.id || `edu-${index}`,
        degree: edu.degree || '',
        institution: edu.institution || '',
        location: edu.location || '',
        startDate: edu.startDate || '',
        endDate: edu.endDate || '',
        gpa: edu.gpa || '',
        relevantCoursework: edu.relevantCoursework || [],
        honors: edu.honors || [],
        thesis: edu.thesis || ''
      })),
      skills: parsedData.skills || [],
      certifications: parsedData.certifications.map((cert, index) => ({
        id: cert.id || `cert-${index}`,
        name: cert.name || '',
        issuingOrganization: cert.issuingOrganization || '',
        issueDate: cert.issueDate || '',
        expirationDate: cert.expirationDate || '',
        credentialId: cert.credentialId || '',
        credentialUrl: cert.credentialUrl || ''
      })),
      projects: parsedData.projects.map((proj, index) => ({
        id: proj.id || `proj-${index}`,
        name: proj.name || '',
        description: proj.description || '',
        technologies: proj.technologies || [],
        startDate: proj.startDate || '',
        endDate: proj.endDate || '',
        githubUrl: proj.githubUrl || '',
        liveUrl: proj.liveUrl || '',
        highlights: proj.highlights || []
      })),
      volunteerExperience: parsedData.volunteerExperience.map((vol, index) => ({
        id: vol.id || `vol-${index}`,
        role: vol.role || '',
        organization: vol.organization || '',
        location: vol.location || '',
        startDate: vol.startDate || '',
        endDate: vol.endDate || '',
        current: vol.current || false,
        description: vol.description || '',
        achievements: vol.achievements || [],
        impact: vol.impact || '',
        hoursPerWeek: vol.hoursPerWeek || 0,
        totalHours: vol.totalHours || 0
      })),
      awards: parsedData.awards.map((award, index) => ({
        id: award.id || `award-${index}`,
        name: award.name || '',
        organization: award.organization || '',
        date: award.date || '',
        description: award.description || '',
        category: award.category || 'other'
      })),
      languageSkills: parsedData.languages.map((lang, index) => ({
        id: lang.id || `lang-${index}`,
        name: lang.name || '',
        proficiency: lang.proficiency || 'beginner',
        certifications: lang.certifications || [],
        certification: lang.certification || ''
      })),
      references: parsedData.references.map((ref, index) => ({
        id: ref.id || `ref-${index}`,
        name: ref.name || '',
        title: ref.title || '',
        company: ref.company || '',
        email: ref.email || '',
        phone: ref.phone || '',
        relationship: ref.relationship || '',
        yearsKnown: ref.yearsKnown || 0
      })),
      publications: [],
      patents: [],
      speakingEngagements: [],
      professionalMemberships: [],
      hobbies: [],
      availableOnRequest: false
    };
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-blue-500" />
        <h2 className="mt-4 text-2xl font-bold text-gray-900">
          {t('upload.title', 'Upload Your Resume')}
        </h2>
        <p className="mt-2 text-gray-600">
          {t('upload.description', 'Upload your existing resume and we\'ll extract the information to help you build a better one.')}
        </p>
      </div>

      {/* File Upload */}
      <div className="max-w-md mx-auto">
        <FileUpload
          onFileSelect={handleFileSelect}
          acceptedTypes={['.pdf', '.doc', '.docx']}
          maxSize={10}
          disabled={isUploading}
        />
      </div>

      {/* Loading State */}
      {isUploading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-blue-500 bg-blue-100 transition ease-in-out duration-150">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {t('upload.processing', 'Processing your resume...')}
          </div>
        </div>
      )}

      {/* Success State */}
      {uploadSuccess && (
        <div className="text-center py-8">
          <DocumentCheckIcon className="mx-auto h-12 w-12 text-green-500" />
          <h3 className="mt-4 text-lg font-medium text-green-900">
            {t('upload.success', 'Resume uploaded successfully!')}
          </h3>
          <p className="mt-2 text-green-700">
            {t('upload.redirecting', 'Redirecting to resume builder...')}
          </p>
          
          {/* Color Scheme Selection */}
          <div className="mt-6">
            <div className="flex items-center justify-center mb-4">
              <PaintBrushIcon className="w-5 h-5 text-gray-600 mr-2" />
              <h4 className="text-md font-medium text-gray-900">
                Choose Color Scheme
              </h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-md mx-auto">
              {colorSchemes.map((scheme, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedColorScheme(index)}
                  className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                    selectedColorScheme === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  title={scheme.name}
                >
                  <div className="flex space-x-1 mb-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: scheme.primary }}
                    />
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: scheme.secondary }}
                    />
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: scheme.accent }}
                    />
                  </div>
                  <p className="text-xs font-medium text-gray-700">
                    {scheme.name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {t('upload.error', 'Upload Error')}
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{uploadError}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Color Scheme Selection */}
      {!isUploading && !uploadSuccess && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <PaintBrushIcon className="h-5 w-5 text-gray-600 mr-2" />
            <h4 className="text-sm font-medium text-gray-900">
              {t('upload.colorScheme.title', 'Choose a color scheme for your resume:')}
            </h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {colorSchemes.map((scheme, index) => (
              <button
                key={index}
                onClick={() => setSelectedColorScheme(index)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedColorScheme === index
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: scheme.primary }}
                  />
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: scheme.secondary }}
                  />
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: scheme.accent }}
                  />
                </div>
                <p className="text-xs font-medium text-gray-700">{scheme.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          {t('upload.tips.title', 'Tips for best results:')}
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• {t('upload.tips.format', 'Use a well-formatted resume with clear sections')}</li>
          <li>• {t('upload.tips.text', 'Ensure text is selectable (not scanned images)')}</li>
          <li>• {t('upload.tips.sections', 'Include standard sections like Experience, Education, Skills')}</li>
          <li>• {t('upload.tips.size', 'Keep file size under 10MB')}</li>
        </ul>
      </div>
    </div>
  );
}