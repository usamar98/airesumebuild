import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Briefcase, 
  Users, 
  FileText, 
  Sparkles, 
  Save, 
  Eye, 
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle,
  Circle,
  Upload,
  Globe,
  GraduationCap,
  Plane,
  UserCheck,
  Target,
  Clock,
  Zap
} from 'lucide-react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';
import { apiCall, API_ENDPOINTS } from '@/config/api';

interface JobFormData {
  // Basic Information
  title: string;
  company_name: string;
  company_logo?: string;
  company_description?: string;
  company_website?: string;
  company_size?: string;
  department?: string;
  
  // Job Details
  description: string;
  requirements: string;
  responsibilities: string;
  job_type: 'full-time' | 'part-time' | 'contract' | 'freelance';
  employment_type: 'permanent' | 'temporary' | 'contract' | 'internship' | 'volunteer';
  location_type: 'remote' | 'on-site' | 'hybrid';
  location?: string;
  experience_level: 'entry' | 'mid' | 'senior' | 'executive';
  job_category?: string;
  
  // Compensation & Benefits
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  benefits: string[];
  
  // Requirements & Qualifications
  skills: string[];
  education_requirements?: string;
  work_authorization?: string;
  travel_requirements?: string;
  
  // Application Process
  application_deadline?: string;
  interview_process?: string;
  reporting_to?: string;
  urgency_level?: 'low' | 'medium' | 'high' | 'urgent';
}

const STEPS = [
  { id: 1, title: 'Basic Information', icon: Building2 },
  { id: 2, title: 'Job Details', icon: Briefcase },
  { id: 3, title: 'Compensation', icon: DollarSign },
  { id: 4, title: 'Requirements', icon: GraduationCap },
  { id: 5, title: 'Application Process', icon: FileText },
  { id: 6, title: 'Review & Publish', icon: Eye }
];

const PostJob: React.FC = () => {
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useSupabaseAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  
  // AI Loading States
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isGeneratingRequirements, setIsGeneratingRequirements] = useState(false);
  const [isGeneratingResponsibilities, setIsGeneratingResponsibilities] = useState(false);
  const [isGeneratingSalary, setIsGeneratingSalary] = useState(false);
  const [isOptimizingJob, setIsOptimizingJob] = useState(false);
  const [isGeneratingInterviewQuestions, setIsGeneratingInterviewQuestions] = useState(false);
  const [isOptimizingTitle, setIsOptimizingTitle] = useState(false);
  const [isSuggestingSkills, setIsSuggestingSkills] = useState(false);

  const [skillInput, setSkillInput] = useState('');
  const [benefitInput, setBenefitInput] = useState('');
  
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    company_name: '',
    description: '',
    requirements: '',
    responsibilities: '',
    job_type: 'full-time',
    employment_type: 'permanent',
    location_type: 'remote',
    experience_level: 'mid',
    currency: 'USD',
    skills: [],
    benefits: [],
    urgency_level: 'medium'
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Form validation
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};
    
    switch (step) {
      case 1:
        if (!formData.title.trim()) errors.title = 'Job title is required';
        if (!formData.company_name.trim()) errors.company_name = 'Company name is required';
        break;
      case 2:
        if (!formData.description.trim()) errors.description = 'Job description is required';
        if (!formData.responsibilities.trim()) errors.responsibilities = 'Job responsibilities are required';
        break;
      case 3:
        if (formData.salary_min && formData.salary_max && formData.salary_min > formData.salary_max) {
          errors.salary = 'Minimum salary cannot be greater than maximum salary';
        }
        break;
      case 4:
        if (!formData.requirements.trim()) errors.requirements = 'Job requirements are required';
        if (formData.skills.length === 0) errors.skills = 'At least one skill is required';
        break;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof JobFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const addBenefit = () => {
    if (benefitInput.trim() && !formData.benefits.includes(benefitInput.trim())) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, benefitInput.trim()]
      }));
      setBenefitInput('');
    }
  };

  const removeBenefit = (benefit: string) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter(b => b !== benefit)
    }));
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // AI Functions
  const optimizeJobTitle = async () => {
    if (!formData.title) {
      toast.error('Please provide a job title first');
      return;
    }

    setIsOptimizingTitle(true);
    try {
      const response = await apiCall(API_ENDPOINTS.AI.OPTIMIZE_JOB_TITLE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          job_title: formData.title,
          company_name: formData.company_name,
          industry: formData.job_category || 'Technology'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, title: data.optimized_title || prev.title }));
        toast.success('Job title optimized successfully!');
      }
    } catch (error) {
      console.error('Error optimizing title:', error);
      toast.error('Failed to optimize job title');
    } finally {
      setIsOptimizingTitle(false);
    }
  };

  const generateDescription = async () => {
    if (!formData.title) {
      toast.error('Please provide a job title first');
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const response = await apiCall(API_ENDPOINTS.AI.GENERATE_DESCRIPTION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          job_title: formData.title,
          company_name: formData.company_name,
          job_type: formData.job_type,
          experience_level: formData.experience_level
        })
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, description: data.generated_content || '' }));
        toast.success('Job description generated successfully!');
      }
    } catch (error) {
      console.error('Error generating description:', error);
      toast.error('Failed to generate job description');
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const generateResponsibilities = async () => {
    if (!formData.title) {
      toast.error('Please provide a job title first');
      return;
    }

    setIsGeneratingResponsibilities(true);
    try {
      const response = await apiCall(API_ENDPOINTS.AI.GENERATE_RESPONSIBILITIES, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          job_title: formData.title,
          company_name: formData.company_name,
          job_description: formData.description || 'Not provided'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, responsibilities: data.generated_content || '' }));
        toast.success('Key responsibilities generated successfully!');
      }
    } catch (error) {
      console.error('Error generating responsibilities:', error);
      toast.error('Failed to generate responsibilities');
    } finally {
      setIsGeneratingResponsibilities(false);
    }
  };

  const generateRequirements = async () => {
    if (!formData.title) {
      toast.error('Please provide a job title first');
      return;
    }

    setIsGeneratingRequirements(true);
    try {
      const response = await apiCall(API_ENDPOINTS.AI.GENERATE_REQUIREMENTS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          job_title: formData.title,
          company_name: formData.company_name,
          job_description: formData.description || 'Not provided'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, requirements: data.generated_content || '' }));
        toast.success('Requirements & qualifications generated successfully!');
      }
    } catch (error) {
      console.error('Error generating requirements:', error);
      toast.error('Failed to generate requirements');
    } finally {
      setIsGeneratingRequirements(false);
    }
  };

  const generateSalaryEstimate = async () => {
    if (!formData.title) {
      toast.error('Please provide a job title first');
      return;
    }

    setIsGeneratingSalary(true);
    try {
      const response = await apiCall(API_ENDPOINTS.AI.GENERATE_SALARY_ESTIMATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          job_title: formData.title,
          location: formData.location || 'Remote',
          experience_level: formData.experience_level,
          job_type: formData.job_type
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.salary_min && data.salary_max) {
          setFormData(prev => ({
            ...prev,
            salary_min: data.salary_min,
            salary_max: data.salary_max
          }));
          toast.success('Salary estimate generated successfully!');
        }
      }
    } catch (error) {
      console.error('Error generating salary estimate:', error);
      toast.error('Failed to generate salary estimate');
    } finally {
      setIsGeneratingSalary(false);
    }
  };

  const suggestSkills = async () => {
    if (!formData.title) {
      toast.error('Please provide a job title first');
      return;
    }

    setIsSuggestingSkills(true);
    try {
      const response = await apiCall(API_ENDPOINTS.AI.SUGGEST_SKILLS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          job_title: formData.title,
          industry: formData.job_category || 'Technology',
          experience_level: formData.experience_level
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.essential_technical && Array.isArray(data.essential_technical)) {
          const newSkills = data.essential_technical.filter((skill: string) => !formData.skills.includes(skill));
          setFormData(prev => ({
            ...prev,
            skills: [...prev.skills, ...newSkills.slice(0, 5)] // Add top 5 suggested skills
          }));
          toast.success('Skills suggested successfully!');
        }
      }
    } catch (error) {
      console.error('Error suggesting skills:', error);
      toast.error('Failed to suggest skills');
    } finally {
      setIsSuggestingSkills(false);
    }
  };

  const generateInterviewQuestions = async () => {
    if (!formData.title) {
      toast.error('Please provide a job title first');
      return;
    }

    setIsGeneratingInterviewQuestions(true);
    try {
      const response = await apiCall(API_ENDPOINTS.AI.GENERATE_INTERVIEW_QUESTIONS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          job_title: formData.title,
          company_name: formData.company_name,
          job_description: formData.description || 'Not provided',
          experience_level: formData.experience_level
        })
      });

      if (response.ok) {
        const data = await response.json();
        const questionsText = data.interview_questions?.map((q: any) => `${q.question}\n${q.purpose}`).join('\n\n') || '';
        setFormData(prev => ({ ...prev, interview_process: questionsText }));
        toast.success('Interview questions generated successfully!');
      }
    } catch (error) {
      console.error('Error generating interview questions:', error);
      toast.error('Failed to generate interview questions');
    } finally {
      setIsGeneratingInterviewQuestions(false);
    }
  };

  const saveDraft = async () => {
    setIsLoading(true);
    setIsDraft(true);
    
    try {
      const jobData = {
        ...formData,
        status: 'draft',
        posted_by: user?.id
      };

      const response = await apiCall(API_ENDPOINTS.JOB_POSTINGS.CREATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(jobData)
      });

      if (response.ok) {
        toast.success('Draft saved successfully!');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to save draft');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setIsLoading(false);
      setIsDraft(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsLoading(true);
    
    try {
      const jobData = {
        ...formData,
        status: 'active',
        posted_by: user?.id
      };

      const response = await apiCall(API_ENDPOINTS.JOB_POSTINGS.CREATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(jobData)
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Job posted successfully!');
        
        setTimeout(() => {
          navigate('/employer-dashboard', {
            state: {
              message: `Your job "${formData.title}" has been posted successfully!`,
              jobId: data.job?.id,
              showPostedJob: true
            }
          });
        }, 1500);
        
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to post job');
      }
    } catch (error) {
      console.error('Error posting job:', error);
      toast.error('Failed to post job');
    } finally {
      setIsLoading(false);
    }
  };

  // Step Components
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g. Senior Software Engineer"
                  />
                  <button
                    type="button"
                    onClick={optimizeJobTitle}
                    disabled={isOptimizingTitle || !formData.title}
                    className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isOptimizingTitle ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                  </button>
                </div>
                {formErrors.title && <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.company_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Your company name"
                />
                {formErrors.company_name && <p className="text-red-500 text-sm mt-1">{formErrors.company_name}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Website
                </label>
                <input
                  type="url"
                  value={formData.company_website || ''}
                  onChange={(e) => handleInputChange('company_website', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://yourcompany.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Size
                </label>
                <select
                  value={formData.company_size || ''}
                  onChange={(e) => handleInputChange('company_size', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select company size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Description
              </label>
              <textarea
                value={formData.company_description || ''}
                onChange={(e) => handleInputChange('company_description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of your company..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department || ''}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. Engineering, Marketing, Sales"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Category
                </label>
                <select
                  value={formData.job_category || ''}
                  onChange={(e) => handleInputChange('job_category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select category</option>
                  <option value="Technology">Technology</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="Design">Design</option>
                  <option value="Finance">Finance</option>
                  <option value="Operations">Operations</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Customer Service">Customer Service</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Type
                </label>
                <select
                  value={formData.job_type}
                  onChange={(e) => handleInputChange('job_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="freelance">Freelance</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employment Type
                </label>
                <select
                  value={formData.employment_type}
                  onChange={(e) => handleInputChange('employment_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="permanent">Permanent</option>
                  <option value="temporary">Temporary</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                  <option value="volunteer">Volunteer</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level
                </label>
                <select
                  value={formData.experience_level}
                  onChange={(e) => handleInputChange('experience_level', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                  <option value="executive">Executive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location Type
                </label>
                <select
                  value={formData.location_type}
                  onChange={(e) => handleInputChange('location_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="remote">Remote</option>
                  <option value="on-site">On-site</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              
              {formData.location_type !== 'remote' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. New York, NY"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description *
              </label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={generateDescription}
                  disabled={isGeneratingDescription || !formData.title}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                >
                  {isGeneratingDescription ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  AI Generate
                </button>
              </div>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={6}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formErrors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe the role, what the candidate will be doing, and what makes this opportunity exciting..."
              />
              {formErrors.description && <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Responsibilities *
              </label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={generateResponsibilities}
                  disabled={isGeneratingResponsibilities || !formData.title}
                  className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                >
                  {isGeneratingResponsibilities ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  AI Generate
                </button>
              </div>
              <textarea
                value={formData.responsibilities}
                onChange={(e) => handleInputChange('responsibilities', e.target.value)}
                rows={5}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formErrors.responsibilities ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="List the main responsibilities and duties for this position..."
              />
              {formErrors.responsibilities && <p className="text-red-500 text-sm mt-1">{formErrors.responsibilities}</p>}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={formData.currency || 'USD'}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD (C$)</option>
                  <option value="AUD">AUD (A$)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Salary
                </label>
                <input
                  type="number"
                  value={formData.salary_min || ''}
                  onChange={(e) => handleInputChange('salary_min', parseInt(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="50000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Salary
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.salary_max || ''}
                    onChange={(e) => handleInputChange('salary_max', parseInt(e.target.value) || undefined)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="80000"
                  />
                  <button
                    type="button"
                    onClick={generateSalaryEstimate}
                    disabled={isGeneratingSalary || !formData.title}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {isGeneratingSalary ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            
            {formErrors.salary && <p className="text-red-500 text-sm">{formErrors.salary}</p>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Benefits & Perks
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={benefitInput}
                  onChange={(e) => setBenefitInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. Health insurance, Remote work, Flexible hours"
                />
                <button
                  type="button"
                  onClick={addBenefit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.benefits.map((benefit, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                  >
                    {benefit}
                    <button
                      type="button"
                      onClick={() => removeBenefit(benefit)}
                      className="text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requirements & Qualifications *
              </label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={generateRequirements}
                  disabled={isGeneratingRequirements || !formData.title}
                  className="flex items-center gap-2 px-3 py-1 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm"
                >
                  {isGeneratingRequirements ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  AI Generate
                </button>
              </div>
              <textarea
                value={formData.requirements}
                onChange={(e) => handleInputChange('requirements', e.target.value)}
                rows={5}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formErrors.requirements ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="List the required qualifications, experience, and skills..."
              />
              {formErrors.requirements && <p className="text-red-500 text-sm mt-1">{formErrors.requirements}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Skills *
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. JavaScript, React, Node.js"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={suggestSkills}
                  disabled={isSuggestingSkills || !formData.title}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {isSuggestingSkills ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              {formErrors.skills && <p className="text-red-500 text-sm">{formErrors.skills}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Education Requirements
                </label>
                <textarea
                  value={formData.education_requirements || ''}
                  onChange={(e) => handleInputChange('education_requirements', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. Bachelor's degree in Computer Science or related field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Authorization
                </label>
                <textarea
                  value={formData.work_authorization || ''}
                  onChange={(e) => handleInputChange('work_authorization', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. Must be authorized to work in the US"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Travel Requirements
              </label>
              <input
                type="text"
                value={formData.travel_requirements || ''}
                onChange={(e) => handleInputChange('travel_requirements', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. 10% travel required, No travel required"
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Application Deadline
                </label>
                <input
                  type="date"
                  value={formData.application_deadline || ''}
                  onChange={(e) => handleInputChange('application_deadline', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urgency Level
                </label>
                <select
                  value={formData.urgency_level || 'medium'}
                  onChange={(e) => handleInputChange('urgency_level', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reporting Structure
              </label>
              <input
                type="text"
                value={formData.reporting_to || ''}
                onChange={(e) => handleInputChange('reporting_to', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Reports to Engineering Manager"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interview Process
              </label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={generateInterviewQuestions}
                  disabled={isGeneratingInterviewQuestions || !formData.title}
                  className="flex items-center gap-2 px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm"
                >
                  {isGeneratingInterviewQuestions ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  AI Generate Questions
                </button>
              </div>
              <textarea
                value={formData.interview_process || ''}
                onChange={(e) => handleInputChange('interview_process', e.target.value)}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the interview process, stages, and what candidates can expect..."
              />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Job Posting Preview</h3>
              
              <div className="bg-white rounded-lg p-6 border">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{formData.title}</h1>
                    <div className="flex items-center gap-4 text-gray-600 text-sm">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {formData.company_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {formData.location_type.charAt(0).toUpperCase() + formData.location_type.slice(1)}
                        {formData.location && ` • ${formData.location}`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {formData.job_type.charAt(0).toUpperCase() + formData.job_type.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  {(formData.salary_min || formData.salary_max) && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-green-900 text-sm">
                          {formData.currency} {formData.salary_min?.toLocaleString()} - {formData.salary_max?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {formData.description && (
                    <div>
                      <h3 className="font-semibold mb-2">Job Description</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">{formData.description}</p>
                    </div>
                  )}

                  {formData.responsibilities && (
                    <div>
                      <h3 className="font-semibold mb-2">Key Responsibilities</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">{formData.responsibilities}</p>
                    </div>
                  )}

                  {formData.requirements && (
                    <div>
                      <h3 className="font-semibold mb-2">Requirements</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">{formData.requirements}</p>
                    </div>
                  )}

                  {formData.skills.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Required Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {formData.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.benefits.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Benefits</h3>
                      <div className="flex flex-wrap gap-2">
                        {formData.benefits.map((benefit, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                          >
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : isActive 
                        ? 'bg-blue-500 border-blue-500 text-white' 
                        : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="ml-3 hidden md:block">
                    <p className={`text-sm font-medium ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`hidden md:block w-16 h-0.5 ml-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {STEPS[currentStep - 1]?.title}
                </h1>
                <p className="text-gray-600 mt-1">
                  Step {currentStep} of {STEPS.length}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveDraft}
                  disabled={isDraft}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  {isDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Draft
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </button>

            <div className="flex gap-3">
              {currentStep < STEPS.length ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Publish Job
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostJob;