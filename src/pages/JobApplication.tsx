import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, Zap, Send, CheckCircle, AlertCircle, Building2, MapPin, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { apiCall, API_ENDPOINTS } from '../config/api';

interface Job {
  id: string;
  title: string;
  company_name: string;
  company_size?: string;
  location?: string;
  location_type?: string;
  job_type?: string;
  experience_level?: string;
  salary_min?: number;
  salary_max?: number;
  description: string;
  requirements?: string;
  responsibilities?: string;
  benefits?: string;
  skills?: string[];
  application_deadline?: string;
  applications_count?: number;
}

interface Application {
  id: string;
  status: string;
  applied_at: string;
}

const JobApplication: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token, getAccessToken } = useSupabaseAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [existingApplication, setExistingApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false);
  
  // Form state
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState('');
  
  // Cover letter generation parameters
  const [showCoverLetterForm, setShowCoverLetterForm] = useState(false);
  const [coverLetterParams, setCoverLetterParams] = useState({
    tone: 'professional' as 'professional' | 'friendly' | 'confident' | 'enthusiastic',
    include_resume: true,
    focus_areas: [] as string[],
    custom_message: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchJobAndApplication();
  }, [id, user]);

  const fetchJobAndApplication = async () => {
    try {
      setLoading(true);
      
      // Fetch job details
      const jobResponse = await apiCall(API_ENDPOINTS.JOBS.DETAILS(id!));
      if (!jobResponse.ok) {
        throw new Error('Job not found');
      }
      const jobData = await jobResponse.json();
      setJob(jobData);
      
      // Check for existing application
      const checkResponse = await apiCall(`/api/applications/check/${id}`, {
        headers: {
          'Authorization': `Bearer ${user?.session?.access_token}`
        }
      });

      if (checkResponse.application) {
        setExistingApplication(checkResponse.application);
      }
    } catch (error) {
      console.error('Error fetching job:', error);
      toast.error('Failed to load job details');
      navigate('/jobs-hub?view=browse');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF or Word document');
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }
    
    setResumeFile(file);
    toast.success('Resume uploaded successfully');
  };

  const generateCoverLetter = async () => {
    if (!job) return;
    
    try {
      setGeneratingCoverLetter(true);
      
      // Create a basic resume data structure from available user info
      const resumeData = {
        personalInfo: {
          fullName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Applicant',
          email: user?.email || '',
          professionalSummary: coverLetterParams.custom_message || ''
        },
        workExperience: [],
        skills: job.skills || [],
        education: []
      };
      
      const response = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          resumeData,
          jobDescription: job.description + (job.requirements ? '\n\nRequirements:\n' + job.requirements : ''),
          companyName: job.company_name,
          positionTitle: job.title,
          type: 'generate'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate cover letter');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate cover letter');
      }
      
      setCoverLetter(data.coverLetter || '');
      setShowCoverLetterForm(false);
      toast.success('Cover letter generated successfully!');
    } catch (error) {
      console.error('Error generating cover letter:', error);
      toast.error('Failed to generate cover letter');
    } finally {
      setGeneratingCoverLetter(false);
    }
  };

  const toggleFocusArea = (skill: string) => {
    setCoverLetterParams(prev => ({
      ...prev,
      focus_areas: prev.focus_areas.includes(skill)
        ? prev.focus_areas.filter(s => s !== skill)
        : [...prev.focus_areas, skill]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resumeFile) {
      toast.error('Please upload your resume');
      return;
    }
    
    if (!coverLetter.trim()) {
      toast.error('Please write a cover letter or generate one using AI');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const formData = new FormData();
      formData.append('job_posting_id', id!);
      formData.append('cover_letter', coverLetter);
      formData.append('notes', additionalNotes);
      formData.append('resume', resumeFile);
      
      const response = await apiCall('/api/applications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit application');
      }
      
      toast.success('Application submitted successfully!');
      navigate('/jobs-hub?view=browse');
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Salary not specified';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `From $${min.toLocaleString()}`;
    return `Up to $${max!.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h2>
          <Link to="/jobs-hub?view=browse" className="text-blue-600 hover:text-blue-700">
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  if (existingApplication) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Application Already Submitted</h2>
            <p className="text-gray-600 mb-6">
              You have already applied for this position on {new Date(existingApplication.applied_at).toLocaleDateString()}.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Status: <span className="font-medium capitalize">{existingApplication.status}</span>
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                to="/dashboard/applications"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View My Applications
              </Link>
              <Link
                to="/jobs"
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Browse More Jobs
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to={`/job/${id}`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Job Details
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Apply for Position</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Job Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{job.title}</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span>{job.company_name}</span>
                  {job.company_size && (
                    <span className="text-gray-500">({job.company_size})</span>
                  )}
                </div>
                
                {job.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{job.location}</span>
                    {job.location_type && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                        {job.location_type}
                      </span>
                    )}
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span>{formatSalary(job.salary_min, job.salary_max)}</span>
                </div>
                
                {job.application_deadline && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Apply by {new Date(job.application_deadline).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              
              {job.skills && job.skills.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.slice(0, 6).map((skill, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.skills.length > 6 && (
                      <span className="text-xs text-gray-500">+{job.skills.length - 6} more</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Application Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Resume Upload */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Upload className="h-5 w-5 text-blue-600" />
                  Upload Resume
                </h3>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {resumeFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">{resumeFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setResumeFile(null)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">Upload your resume</p>
                      <p className="text-sm text-gray-500 mb-4">
                        PDF or Word document, max 5MB
                      </p>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="resume-upload"
                      />
                      <label
                        htmlFor="resume-upload"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer inline-block transition-colors"
                      >
                        Choose File
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Cover Letter */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Cover Letter
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowCoverLetterForm(true)}
                    className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200 transition-colors flex items-center gap-1 text-sm"
                  >
                    <Zap className="h-4 w-4" />
                    Generate with AI
                  </button>
                </div>
                
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Write your cover letter here or generate one using AI..."
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Additional Notes */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes (Optional)</h3>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Any additional information you'd like to share..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Submit Button */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <button
                  type="submit"
                  disabled={submitting || !resumeFile || !coverLetter.trim()}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Submitting Application...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Submit Application
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* AI Cover Letter Generator Modal */}
        {showCoverLetterForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Zap className="h-6 w-6 text-blue-600" />
                    Generate Cover Letter with AI
                  </h3>
                  <button
                    onClick={() => setShowCoverLetterForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Tone Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tone
                    </label>
                    <select
                      value={coverLetterParams.tone}
                      onChange={(e) => setCoverLetterParams(prev => ({ ...prev, tone: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="professional">Professional</option>
                      <option value="friendly">Friendly</option>
                      <option value="confident">Confident</option>
                      <option value="enthusiastic">Enthusiastic</option>
                    </select>
                  </div>

                  {/* Include Resume */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="include_resume_cl"
                      checked={coverLetterParams.include_resume}
                      onChange={(e) => setCoverLetterParams(prev => ({ ...prev, include_resume: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="include_resume_cl" className="ml-2 text-sm text-gray-700">
                      Include resume data
                    </label>
                  </div>

                  {/* Focus Areas */}
                  {job.skills && job.skills.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Focus on these skills
                      </label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {job.skills.map((skill, index) => (
                          <div key={index} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`skill-cl-${index}`}
                              checked={coverLetterParams.focus_areas.includes(skill)}
                              onChange={() => toggleFocusArea(skill)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`skill-cl-${index}`} className="ml-2 text-sm text-gray-700">
                              {skill}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Message (Optional)
                    </label>
                    <textarea
                      value={coverLetterParams.custom_message}
                      onChange={(e) => setCoverLetterParams(prev => ({ ...prev, custom_message: e.target.value }))}
                      placeholder="Any specific points you'd like to highlight..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowCoverLetterForm(false)}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={generateCoverLetter}
                      disabled={generatingCoverLetter}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {generatingCoverLetter ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4" />
                          Generate
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobApplication;