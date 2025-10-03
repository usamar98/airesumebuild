import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, DollarSign, Clock, MapPin, Star, Users, ExternalLink, Copy, FileText, Zap, CheckCircle, Send, Building2, Calendar, Briefcase, GraduationCap } from 'lucide-react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

interface Job {
  id: string;
  external_id?: string;
  title: string;
  description: string;
  budget_min?: number;
  budget_max?: number;
  hourly_rate_min?: number;
  hourly_rate_max?: number;
  budget_type: 'fixed' | 'hourly';
  skills: string[];
  client_name?: string;
  client_rating?: number;
  client_reviews_count?: number;
  client_location?: string;
  client_payment_verified?: boolean;
  posted_date: string;
  proposals_count?: number;
  job_type?: string;
  duration?: string;
  experience_level?: string;
  source: string;
  source_url?: string;
  created_at: string;
  // Posted job fields
  company_name?: string;
  company_size?: string;
  company_website?: string;
  location_type?: 'remote' | 'on-site' | 'hybrid';
  salary_min?: number;
  salary_max?: number;
  requirements?: string;
  responsibilities?: string;
  benefits?: string[];
  application_deadline?: string;
  applications_count?: number;
  is_posted_job?: boolean;
}

interface Proposal {
  id: string;
  job_id: string;
  user_id: string;
  content: string;
  estimated_hours?: number;
  proposed_rate?: number;
  tone: string;
  key_points: string[];
  call_to_action: string;
  created_at: string;
}

interface ProposalParams {
  tone: 'professional' | 'friendly' | 'confident' | 'enthusiastic';
  include_resume: boolean;
  focus_areas: string[];
  estimated_hours?: number;
  proposed_rate?: number;
}

const JobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalParams, setProposalParams] = useState<ProposalParams>({
    tone: 'professional',
    include_resume: true,
    focus_areas: [],
    estimated_hours: undefined,
    proposed_rate: undefined
  });

  // Fetch job details
  const fetchJob = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      // Try fetching from posted jobs first
      let response = await fetch(`/api/job-postings/${id}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Posted job data:', data);
        // Normalize posted job data to match Job interface
        const normalizedJob = {
          ...data,
          is_posted_job: true,
          budget_type: 'fixed' as const, // Posted jobs are typically salary-based
          skills: data.skills || [],
          posted_date: data.created_at || new Date().toISOString(),
          source: 'posted_job'
        };
        setJob(normalizedJob);
      } else {
        // If not found in posted jobs, try scraped jobs
        response = await fetch(`/api/jobs/${id}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Scraped job data:', data);
          // Normalize scraped job data
          const normalizedJob = {
            ...data,
            is_posted_job: false,
            budget_type: data.budget_type || 'fixed' as const,
            skills: data.skills || [],
            posted_date: data.posted_date || data.created_at || new Date().toISOString(),
            source: data.source || 'scraped'
          };
          setJob(normalizedJob);
        } else {
          const errorData = await response.json();
          console.error('Job not found:', errorData);
          toast.error('Job not found');
          navigate('/jobs-hub?view=browse');
        }
      }
    } catch (error) {
      console.error('Error fetching job:', error);
      toast.error('Error fetching job details');
      navigate('/jobs-hub?view=browse');
    } finally {
      setLoading(false);
    }
  };

  // Generate AI proposal
  const generateProposal = async () => {
    if (!user || !job) {
      toast.error('Please login to generate proposals');
      return;
    }

    try {
      setGenerating(true);
      const response = await fetch('/api/proposals/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`
        },
        body: JSON.stringify({
          job_id: job.id,
          ...proposalParams
        })
      });

      const data = await response.json();

      if (response.ok) {
        setProposal(data.proposal);
        setShowProposalForm(false);
        toast.success('Proposal generated successfully!');
      } else {
        toast.error(data.error || 'Failed to generate proposal');
      }
    } catch (error) {
      console.error('Error generating proposal:', error);
      toast.error('Error generating proposal');
    } finally {
      setGenerating(false);
    }
  };

  // Save job to favorites
  const saveJob = async () => {
    if (!user || !job) {
      toast.error('Please login to save jobs');
      return;
    }

    try {
      const response = await fetch('/api/saved-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`
        },
        body: JSON.stringify({ job_id: job.id })
      });

      if (response.ok) {
        toast.success('Job saved to favorites!');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to save job');
      }
    } catch (error) {
      console.error('Error saving job:', error);
      toast.error('Error saving job');
    }
  };

  // Copy proposal to clipboard
  const copyProposal = async () => {
    if (!proposal) return;
    
    try {
      await navigator.clipboard.writeText(proposal.content);
      toast.success('Proposal copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy proposal');
    }
  };

  // Format budget display
  const formatBudget = (job: Job) => {
    if (job.is_posted_job) {
      // Posted job - show salary range
      if (job.salary_min && job.salary_max) {
        return `$${job.salary_min.toLocaleString()}-$${job.salary_max.toLocaleString()}/year`;
      }
      return 'Salary not specified';
    } else {
      // Scraped job - show hourly/fixed budget
      if (job.budget_type === 'hourly' && job.hourly_rate_min && job.hourly_rate_max) {
        return `$${job.hourly_rate_min}-$${job.hourly_rate_max}/hr`;
      } else if (job.budget_type === 'fixed' && job.budget_min && job.budget_max) {
        return `$${job.budget_min.toLocaleString()}-$${job.budget_max.toLocaleString()}`;
      }
      return 'Budget not specified';
    }
  };

  // Format posted date
  const formatPostedDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  // Handle focus area toggle
  const toggleFocusArea = (area: string) => {
    setProposalParams(prev => ({
      ...prev,
      focus_areas: prev.focus_areas.includes(area)
        ? prev.focus_areas.filter(a => a !== area)
        : [...prev.focus_areas, area]
    }));
  };

  useEffect(() => {
    fetchJob();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Job not found</h2>
          <p className="text-gray-600 mb-4">The job you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/jobs-hub?view=browse')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/jobs-hub?view=browse')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Job Details</h1>
              <p className="text-gray-600">Review job requirements and generate proposals</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Job Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    {job.title}
                  </h2>
                  <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {formatBudget(job)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatPostedDate(job.posted_date)}
                    </span>
                    {(job.client_location || job.location_type) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.is_posted_job ? job.location_type : job.client_location}
                      </span>
                    )}
                    {(job.applications_count || job.proposals_count) && (
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {job.is_posted_job ? `${job.applications_count || 0} applications` : `${job.proposals_count} proposals`}
                      </span>
                    )}
                    {job.application_deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Apply by {new Date(job.application_deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={saveJob}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                  >
                    <Star className="h-4 w-4" />
                    Save Job
                  </button>
                  {job.is_posted_job ? (
                    <Link
                      to={`/apply/${job.id}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Apply Now
                    </Link>
                  ) : (
                    job.source_url && (
                      <a
                        href={job.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View on Upwork
                      </a>
                    )
                  )}
                </div>
              </div>

              {/* Job Meta Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                {job.job_type && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      Job Type
                    </span>
                    <p className="text-sm text-gray-900 capitalize">{job.job_type}</p>
                  </div>
                )}
                {job.experience_level && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" />
                      Experience
                    </span>
                    <p className="text-sm text-gray-900 capitalize">{job.experience_level}</p>
                  </div>
                )}
                {job.is_posted_job ? (
                  <>
                    {job.location_type && (
                      <div>
                        <span className="text-sm font-medium text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Location
                        </span>
                        <p className="text-sm text-gray-900 capitalize">{job.location_type}</p>
                      </div>
                    )}
                    {job.company_size && (
                      <div>
                        <span className="text-sm font-medium text-gray-500 flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          Company Size
                        </span>
                        <p className="text-sm text-gray-900">{job.company_size}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {job.duration && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Duration</span>
                        <p className="text-sm text-gray-900">{job.duration}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-medium text-gray-500">Budget Type</span>
                      <p className="text-sm text-gray-900 capitalize">{job.budget_type}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Job Description */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h3>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
              </div>
            </div>

            {/* Requirements (Posted Jobs Only) */}
            {job.is_posted_job && job.requirements && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h3>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{job.requirements}</p>
                </div>
              </div>
            )}

            {/* Responsibilities (Posted Jobs Only) */}
            {job.is_posted_job && job.responsibilities && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Responsibilities</h3>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{job.responsibilities}</p>
                </div>
              </div>
            )}

            {/* Benefits (Posted Jobs Only) */}
            {job.is_posted_job && job.benefits && job.benefits.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Benefits</h3>
                <ul className="space-y-2">
                  {job.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-2 text-gray-700">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Skills Required */}
            {job.skills && job.skills.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills Required</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Company/Client Information */}
            {(job.company_name || job.client_name) && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {job.is_posted_job ? 'Company Information' : 'Client Information'}
                </h3>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium text-gray-900">
                      {job.is_posted_job ? job.company_name : job.client_name}
                    </p>
                    {job.is_posted_job ? (
                      <>
                        {job.company_size && (
                          <p className="text-sm text-gray-600 mt-1">
                            Company Size: {job.company_size}
                          </p>
                        )}
                        {job.company_website && (
                          <a
                            href={job.company_website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Visit Website
                          </a>
                        )}
                      </>
                    ) : (
                      job.client_rating && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600">
                              {job.client_rating.toFixed(1)}
                            </span>
                          </div>
                          {job.client_reviews_count && (
                            <span className="text-sm text-gray-500">
                              ({job.client_reviews_count} reviews)
                            </span>
                          )}
                        </div>
                      )
                    )}
                  </div>
                  {job.client_payment_verified && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Payment Verified</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Proposal Generator Sidebar (Scraped Jobs Only) */}
          {!job.is_posted_job && (
            <div className="space-y-6">
              {/* Generate Proposal */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  AI Proposal Generator
                </h3>
                
                {!showProposalForm ? (
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">
                      Generate a personalized proposal using AI based on your profile and this job requirements.
                    </p>
                    <button
                      onClick={() => setShowProposalForm(true)}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Zap className="h-4 w-4" />
                      Generate Proposal
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Tone Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tone
                      </label>
                      <select
                        value={proposalParams.tone}
                        onChange={(e) => setProposalParams(prev => ({ ...prev, tone: e.target.value as any }))}
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
                        id="include_resume"
                        checked={proposalParams.include_resume}
                        onChange={(e) => setProposalParams(prev => ({ ...prev, include_resume: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="include_resume" className="ml-2 text-sm text-gray-700">
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
                                id={`skill-${index}`}
                                checked={proposalParams.focus_areas.includes(skill)}
                                onChange={() => toggleFocusArea(skill)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label htmlFor={`skill-${index}`} className="ml-2 text-sm text-gray-700">
                                {skill}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Estimated Hours */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estimated Hours (optional)
                      </label>
                      <input
                        type="number"
                        value={proposalParams.estimated_hours || ''}
                        onChange={(e) => setProposalParams(prev => ({ ...prev, estimated_hours: e.target.value ? parseInt(e.target.value) : undefined }))}
                        placeholder="e.g., 40"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Proposed Rate */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Proposed Rate (optional)
                      </label>
                      <input
                        type="number"
                        value={proposalParams.proposed_rate || ''}
                        onChange={(e) => setProposalParams(prev => ({ ...prev, proposed_rate: e.target.value ? parseFloat(e.target.value) : undefined }))}
                        placeholder={job.budget_type === 'hourly' ? 'e.g., 50' : 'e.g., 2500'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowProposalForm(false)}
                        className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={generateProposal}
                        disabled={generating}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                      >
                        {generating ? (
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
                )}
              </div>

              {/* Generated Proposal */}
              {proposal && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      Generated Proposal
                    </h3>
                    <button
                      onClick={copyProposal}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1 text-sm"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Proposal Content */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {proposal.content}
                      </p>
                    </div>
                    
                    {/* Proposal Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {proposal.estimated_hours && (
                        <div>
                          <span className="font-medium text-gray-500">Estimated Hours:</span>
                          <p className="text-gray-900">{proposal.estimated_hours}h</p>
                        </div>
                      )}
                      {proposal.proposed_rate && (
                        <div>
                          <span className="font-medium text-gray-500">Proposed Rate:</span>
                          <p className="text-gray-900">${proposal.proposed_rate}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Key Points */}
                    {proposal.key_points && proposal.key_points.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Key Points:</span>
                        <ul className="mt-1 text-sm text-gray-700 list-disc list-inside space-y-1">
                          {proposal.key_points.map((point, index) => (
                            <li key={index}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Call to Action */}
                    {proposal.call_to_action && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Call to Action:</span>
                        <p className="mt-1 text-sm text-gray-700">{proposal.call_to_action}</p>
                      </div>
                    )}
                    
                    <button
                      onClick={() => setShowProposalForm(true)}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      Generate New Proposal
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetails;