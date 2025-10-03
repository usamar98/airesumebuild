import React, { useState, useEffect } from 'react';
import { 
  MdWork as BriefcaseIcon, 
  MdSearch as Search, 
  MdBookmark as Bookmark, 
  MdBookmarkBorder as BookmarkCheck, 
  MdAdd as Plus, 
  MdBusiness as Building2, 
  MdPeople as Users, 
  MdAccessTime as Clock, 
  MdEdit as Edit, 
  MdKeyboardArrowLeft as KeyboardArrowLeft, 
  MdSave as Save, 
  MdFilterList as Filter, 
  MdLocationOn as MapPin, 
  MdAttachMoney as DollarSign, 
  MdStar as Star, 
  MdVisibility as Eye, 
  MdAutoAwesome as Sparkles, 
  MdCalendarToday as Calendar, 
  MdPlayArrow as Play, 
  MdPause as Pause, 
  MdClose as X 
} from 'react-icons/md';
import { TailSpin as Loader2 } from 'react-loader-spinner';
import { toast } from 'sonner';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useRoleManagement } from '../hooks/useRoleManagement';

import { API_ENDPOINTS, apiCall } from '../config/api';

interface Job {
  id: string,
  title: string,
  company_name: string,
  description: string,
  requirements: string,
  responsibilities: string,
  job_type: string,
  location_type: string,
  experience_level: string,
  skills: string[],
  benefits: string[],
  salary_min: number,
  salary_max: number,
  salary_type: string,
  posted_by: string,
  is_bookmarked: boolean,
  status: string,
  proposals_count: number,
  applications_count: number,
  posted_date: string
};

interface JobFormData {
  title: string,
  company_name: string,
  description: string,
  requirements: string,
  responsibilities: string,
  job_type: string,
  location_type: string,
  experience_level: string,
  skills: string[],
  benefits: string[]
};

const JobsHub = () => {
  const { user, token } = useSupabaseAuth();
  const { userRole, canAccessFeature } = useRoleManagement();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentView, setCurrentView] = useState('browse');
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isGeneratingSalary, setIsGeneratingSalary] = useState(false);
  const [isGeneratingRequirements, setIsGeneratingRequirements] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [bookmarkingJobs, setBookmarkingJobs] = useState<Set<string>>(new Set());
  const [updatingJobStatus, setUpdatingJobStatus] = useState<string | null>(null);

  // Job browsing state
  const [filters, setFilters] = useState({
    keywords: '',
    budget_type: 'all',
    experience_level: 'all',
    min_budget: '',
    max_budget: '',
    job_type: 'all',
    location_type: 'all'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'budget_high' | 'budget_low'>('newest');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Job posting state
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    company_name: '',
    description: '',
    requirements: '',
    responsibilities: '',
    job_type: 'full-time',
    location_type: 'remote',
    experience_level: 'mid',
    skills: [],
    benefits: []
  });
  const [skillInput, setSkillInput] = useState('');
  const [benefitInput, setBenefitInput] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  
  // Job statistics state
  const [jobStats, setJobStats] = useState({
    totalJobs: 0,
    companies: 0,
    remoteJobs: 0,
    newToday: 0
  });

  const jobsPerPage = 10;

  // Determine available views based on user role
  const getAvailableViews = () => {
    const views = [
      { id: 'browse', label: 'Browse Jobs', icon: Search, available: canAccessFeature('canBrowseJobs') }
    ];

    if (canAccessFeature('canSaveJobs')) {
      views.push({ id: 'saved', label: 'Saved Jobs', icon: Bookmark, available: true });
    }

    if (canAccessFeature('canPostJobs')) {
      views.push({ id: 'post', label: 'Post Job', icon: Plus, available: true });
      views.push({ id: 'manage', label: 'Manage Jobs', icon: Building2, available: true });
    }

    return views.filter(view => view.available);
  };

  // Fetch jobs based on current view
  const fetchJobs = async (page: number = 1) => {
    setLoading(true);
    try {
      let endpoint = '/api/job-postings';
      let queryParams = new URLSearchParams({
        page: page.toString(),
        limit: jobsPerPage.toString(),
        ...(sortBy && { sort: sortBy })
      });

      // Add filters for browse view
      if (currentView === 'browse') {
        if (filters.keywords) queryParams.append('search', filters.keywords);
        if (filters.experience_level !== 'all') queryParams.append('experience_level', filters.experience_level);
        if (filters.min_budget) queryParams.append('salary_min', filters.min_budget);
        if (filters.max_budget) queryParams.append('salary_max', filters.max_budget);
        if (filters.job_type !== 'all') {
          // Map frontend job_type values to backend values
          const jobTypeMap: { [key: string]: string } = {
            'full-time': 'full_time',
            'part-time': 'part_time',
            'contract': 'contract',
            'freelance': 'freelance'
          };
          queryParams.append('job_type', jobTypeMap[filters.job_type] || filters.job_type);
        }
        if (filters.location_type !== 'all') {
          // Map location_type to remote_allowed for backend compatibility
          if (filters.location_type === 'remote') {
            queryParams.append('remote_allowed', 'true');
          }
          // For hybrid and on-site, we'll use location_type directly if backend supports it
          // or we can add location_type as a separate filter
          queryParams.append('location_type', filters.location_type);
        }
      }

      // Modify endpoint for different views
      if (currentView === 'saved') {
        endpoint = '/api/job-bookmarks';
      } else if (currentView === 'manage' && user) {
        endpoint = `/api/employer/jobs`;
        queryParams.append('posted_by', user.id);
      }

      // Prepare headers for authenticated requests
      const headers: HeadersInit = {};
      
      // Add Authorization header for authenticated endpoints
      if ((currentView === 'saved' || currentView === 'manage') && token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${endpoint}?${queryParams}`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Please log in to access this feature');
          return;
        }
        throw new Error('Failed to fetch jobs');
      }
      
      const data = await response.json();
      // Handle different response formats for different views
      const jobsData = currentView === 'manage' ? data : (data.jobs || data.bookmarks || []);
      
      setJobs(jobsData);
      // For manage view, the total is the length of the array since it's not paginated
      setTotalJobs(currentView === 'manage' ? jobsData.length : (data.total || 0));
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to fetch jobs');
      setJobs([]);
      setTotalJobs(0);
    } finally {
      setLoading(false);
    }
  };

  // Toggle job bookmark with enhanced synchronization
  const toggleBookmark = async (jobId: string, isBookmarked: boolean) => {
    if (!user) {
      toast.error('Please log in to bookmark jobs');
      return;
    }

    // Prevent multiple simultaneous bookmark operations on the same job
    if (bookmarkingJobs.has(jobId)) {
      return;
    }

    // Add job to bookmarking set
    setBookmarkingJobs(prev => new Set(prev).add(jobId));

    try {
      const endpoint = '/api/job-bookmarks';
      const method = isBookmarked ? 'DELETE' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ job_id: jobId })
      });

      if (response.ok) {
        // Update job list immediately for better UX
        setJobs(prevJobs => {
          const updatedJobs = prevJobs.map(job => 
            job.id === jobId 
              ? { ...job, is_bookmarked: !isBookmarked }
              : job
          );

          // If we're in the saved view and removing a bookmark, remove the job from the list
          if (currentView === 'saved' && isBookmarked) {
            return updatedJobs.filter(job => job.id !== jobId);
          }

          return updatedJobs;
        });

        // Update total jobs count if we're in saved view
        if (currentView === 'saved' && isBookmarked) {
          setTotalJobs(prev => Math.max(0, prev - 1));
        }

        toast.success(isBookmarked ? 'Bookmark removed' : 'Job bookmarked!');

        // Update saved jobs count in localStorage for other components
        const savedJobsCount = localStorage.getItem('savedJobsCount');
        const currentCount = savedJobsCount ? parseInt(savedJobsCount) : 0;
        const newCount = isBookmarked ? Math.max(0, currentCount - 1) : currentCount + 1;
        localStorage.setItem('savedJobsCount', newCount.toString());

      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update bookmark');
      }
    } catch (error) {
      console.error('Error updating bookmark:', error);
      toast.error('Error updating bookmark');
    } finally {
      // Remove job from bookmarking set
      setBookmarkingJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  };

  // Debounced search function for real-time filtering
  const debouncedSearch = (searchTerm: string) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      setCurrentPage(1);
      fetchJobs(1);
    }, 500); // 500ms delay
    
    setSearchTimeout(timeout);
  };

  // Handle filter changes with automatic refetch
  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1);
    
    // For dropdown filters, refetch immediately
    if (field !== 'keywords' && field !== 'min_budget' && field !== 'max_budget') {
      fetchJobs(1);
    }
  };

  // Job posting functions
  const handleInputChange = (field: keyof JobFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const generateJobDescription = async () => {
    console.log('🔵 generateJobDescription called');
    if (!formData.title || !formData.company_name) {
      toast.error('Please enter job title and company name first');
      return;
    }

    console.log('🔵 Setting isGeneratingDescription to true');
    setIsGeneratingDescription(true);
    try {
      const response = await apiCall(API_ENDPOINTS.AI.GENERATE_JOB_DESCRIPTION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          job_title: formData.title,
          company_name: formData.company_name,
          existing_description: formData.description
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Generate Job Description Response:', data);
        
        if (data.generated_content) {
          setFormData(prev => ({
            ...prev,
            description: data.generated_content
          }));
          toast.success('Job description generated successfully!');
        } else {
          toast.error('No job description content generated');
        }
      } else {
        const errorData = await response.json();
        console.error('Generate Job Description failed:', errorData);
        toast.error(errorData.error || 'Failed to generate job description');
      }
    } catch (error) {
      console.error('Error generating job description:', error);
      toast.error('Failed to generate job description');
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  // AI Job Matching
  const getAIJobRecommendations = async () => {
    if (!user) {
      toast.error('Please log in to get AI recommendations');
      return;
    }

    setLoading(true);
    try {
      const response = await apiCall(API_ENDPOINTS.AI.JOB_MATCHING, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_skills: user.user_metadata?.skills || [],
          experience_level: filters.experience_level || 'mid',
          preferred_location: filters.location || 'Remote',
          job_type: filters.job_type || 'full-time',
          salary_expectations: filters.salary_min ? `$${filters.salary_min}-$${filters.salary_max || filters.salary_min + 50000}` : undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('AI Job Matching Response:', data);
        
        if (data.matched_jobs && data.matched_jobs.length > 0) {
          // Map the matched jobs to our job format
          const matchedJobIds = data.matched_jobs.map((match: any) => match.job_id);
          
          // Fetch the actual job details for the matched jobs
          const jobsResponse = await apiCall(API_ENDPOINTS.JOBS.LIST, {
            method: 'GET'
          });
          
          if (jobsResponse.ok) {
            const allJobs = await jobsResponse.json();
            const matchedJobs = allJobs.jobs?.filter((job: Job) => 
              matchedJobIds.includes(job.id)
            ) || [];
            
            setJobs(matchedJobs);
            setTotalJobs(matchedJobs.length);
            toast.success(`Found ${matchedJobs.length} AI-recommended jobs for you!`);
          }
        } else {
          toast.info('No matching jobs found. Try adjusting your filters.');
        }
      } else {
        const errorData = await response.json();
        console.error('AI Job Matching failed:', errorData);
        toast.error(errorData.error || 'Failed to get AI recommendations');
      }
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
      toast.error('Failed to get AI recommendations');
    } finally {
      setLoading(false);
    }
  };

  // AI Requirements Generation
  const generateRequirements = async () => {
    console.log('🟠 generateRequirements called');
    if (!formData.title || !formData.company_name) {
      toast.error('Please enter job title and company name first');
      return;
    }

    console.log('🟠 Setting isGeneratingRequirements to true');
    setIsGeneratingRequirements(true);
    try {
      const response = await apiCall(API_ENDPOINTS.AI.GENERATE_REQUIREMENTS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          job_title: formData.title,
          company_name: formData.company_name,
          job_description: formData.description || 'Not provided'
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Generate Requirements Response:', data);
        
        if (data.generated_content) {
          setFormData(prev => ({
            ...prev,
            requirements: data.generated_content
          }));
          toast.success('Requirements generated successfully!');
        } else {
          toast.error('No requirements content generated');
        }
      } else {
        const errorData = await response.json();
        console.error('Generate Requirements failed:', errorData);
        toast.error(errorData.error || 'Failed to generate requirements');
      }
    } catch (error) {
      console.error('Error generating requirements:', error);
      toast.error('Failed to generate requirements');
    } finally {
      setIsGeneratingRequirements(false);
    }
  };

  // AI Salary Estimation
  const generateSalaryEstimate = async () => {
    console.log('🟢 generateSalaryEstimate called');
    if (!formData.title) {
      toast.error('Please enter job title first');
      return;
    }

    console.log('🟢 Setting isGeneratingSalary to true');
    setIsGeneratingSalary(true);
    try {
      const response = await apiCall(API_ENDPOINTS.AI.SALARY_ESTIMATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          job_title: formData.title,
          location: formData.location || 'Remote',
          experience_years: formData.experience_level === 'entry' ? 1 : 
                           formData.experience_level === 'mid' ? 3 : 
                           formData.experience_level === 'senior' ? 7 : 10,
          skills: formData.skills,
          company_size: formData.company_size,
          industry: 'Technology'
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Salary Estimate Response:', data);
        
        if (data.salary_range) {
          setFormData(prev => ({
            ...prev,
            salary_min: parseInt(data.salary_range.min) || prev.salary_min,
            salary_max: parseInt(data.salary_range.max) || prev.salary_max
          }));
          
          toast.success(
            `💰 Salary estimate: $${data.salary_range.min} - $${data.salary_range.max} (${data.confidence_level} confidence)`,
            { duration: 6000 }
          );
        } else {
          toast.success('Salary estimation completed!');
        }
      } else {
        const errorData = await response.json();
        console.error('Salary Estimate failed:', errorData);
        toast.error(errorData.error || 'Failed to generate salary estimate');
      }
    } catch (error) {
      console.error('Error generating salary estimate:', error);
      toast.error('Failed to generate salary estimate');
    } finally {
      setIsGeneratingSalary(false);
    }
  };

  // Fetch job statistics
  const fetchJobStats = async () => {
    try {
      const response = await fetch('/api/job-postings/stats');
      if (response.ok) {
        const stats = await response.json();
        setJobStats(stats);
      } else {
        throw new Error('Failed to fetch job statistics');
      }
    } catch (error) {
      console.error('Error fetching job stats:', error);
      // Don't show toast for stats error as it's not critical for user experience
      // Just log the error and continue with default stats
    }
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.title.trim()) errors.push('Job title is required');
    if (!formData.company_name.trim()) errors.push('Company name is required');
    if (!formData.description.trim()) errors.push('Job description is required');
    if (formData.description.length < 50) errors.push('Job description should be at least 50 characters');
    if (formData.salary_min && formData.salary_max && formData.salary_min >= formData.salary_max) {
      errors.push('Maximum salary should be greater than minimum salary');
    }
    
    return errors;
  };

  const submitJob = async () => {
    if (!user) {
      toast.error('Please log in to post a job');
      return;
    }

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }

    setIsPosting(true);
    try {
      const jobData = {
        ...formData,
        posted_by: user.id,
        title: formData.title.trim(),
        company_name: formData.company_name.trim(),
        description: formData.description.trim(),
        requirements: formData.requirements.trim(),
        responsibilities: formData.responsibilities.trim()
      };

      const response = await fetch('/api/job-postings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(jobData)
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Job posted successfully! 🎉');
        setCurrentView('manage');
        
        // Reset form
        setFormData({
          title: '',
          company_name: '',
          description: '',
          requirements: '',
          responsibilities: '',
          job_type: 'full-time',
          location_type: 'remote',
          experience_level: 'mid',
          skills: [],
          benefits: []
        });
        
        // Refresh jobs list
        fetchJobs(1);
      } else {
        const errorData = await response.json();
        console.error('Job posting error:', errorData);
        toast.error(errorData.error || 'Failed to post job. Please try again.');
      }
    } catch (error) {
      console.error('Error posting job:', error);
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setIsPosting(false);
    }
  };

  // Format functions
  const formatBudget = (job: Job) => {
    if (job.salary_min && job.salary_max) {
      return `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`;
    }
    if (job.budget_type === 'fixed' && job.budget_min) {
      return `$${job.budget_min.toLocaleString()}`;
    }
    if (job.budget_type === 'hourly' && job.hourly_rate_min) {
      return `$${job.hourly_rate_min}/hr`;
    }
    return 'Budget not specified';
  };

  const formatPostedDate = (dateString: string) => {
    if (!dateString) return 'Date not available';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        return '1 day ago';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      return 'Date not available';
    }
  };

  // Job management functions
  const updateJobStatus = async (jobId: string, newStatus: 'active' | 'paused' | 'closed' | 'draft') => {
    if (!token) {
      toast.error('Please log in to update job status');
      return;
    }

    setUpdatingJobStatus(jobId);
    try {
      const response = await apiCall(API_ENDPOINTS.JOBS.UPDATE_STATUS(jobId), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const data = await response.json();
        setJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, status: newStatus } : job
        ));
        toast.success(`Job ${newStatus === 'active' ? 'activated' : newStatus === 'paused' ? 'paused' : newStatus === 'closed' ? 'closed' : 'saved as draft'} successfully`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update job status');
      }
    } catch (error) {
      console.error('Error updating job status:', error);
      toast.error('Failed to update job status');
    } finally {
      setUpdatingJobStatus(null);
    }
  };

  const handleEditJob = (jobId: string) => {
    // Navigate to PostJob component with edit mode
    navigate(`/post-job?edit=${jobId}`);
  };

  const handleViewApplications = (jobId: string) => {
    // Navigate to applications view for this job
    navigate(`/employer/applications?job=${jobId}`);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-blue-100 text-blue-800';
      default: return 'bg-green-100 text-green-800'; // Default to active
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'active': return <Play className="h-3 w-3" />;
      case 'paused': return <Pause className="h-3 w-3" />;
      case 'closed': return <X className="h-3 w-3" />;
      case 'draft': return <Edit className="h-3 w-3" />;
      default: return <Play className="h-3 w-3" />;
    }
  };

  // Handle success message from navigation state
  useEffect(() => {
    if (location.state?.message) {
      toast.success(location.state.message, { duration: 5000 });
      
      // If there's a specific job to show, switch to manage view to see posted jobs
      if (location.state.showPostedJob) {
        setCurrentView('manage');
      }
      
      // Clear the state to prevent showing the message again
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Initialize data
  useEffect(() => {
    fetchJobs(1);
    if (currentView === 'browse') {
      fetchJobStats();
    }
  }, [currentView, sortBy, user, token]);

  const availableViews = getAvailableViews();
  const totalPages = Math.ceil(totalJobs / jobsPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <BriefcaseIcon className="h-8 w-8 text-blue-600" />
                Jobs Hub
              </h1>
              <p className="text-gray-600 mt-1">
                {userRole === 'employer' ? 'Manage your job postings and find talent' : 
                 userRole === 'dual' ? 'Browse jobs and manage your postings' :
                 'Discover opportunities and advance your career'}
              </p>
            </div>
            
            {/* Role indicator */}
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {userRole === 'job_seeker' ? 'Job Seeker' : 
                 userRole === 'employer' ? 'Employer' : 'Dual Role'}
              </div>
            </div>
          </div>
          
          {/* View Navigation */}
          <div className="mt-6">
            <div className="flex flex-wrap gap-2">
              {availableViews.map((view) => {
                const IconComponent = view.icon;
                return (
                  <button
                    key={view.id}
                    onClick={() => setCurrentView(view.id as ViewMode)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      currentView === view.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    {view.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Job Statistics */}
        {currentView === 'browse' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BriefcaseIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{totalJobs}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Companies</p>
                  <p className="text-2xl font-bold text-gray-900">{jobStats.companies}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MapPin className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Remote Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{jobStats.remoteJobs}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">New Today</p>
                  <p className="text-2xl font-bold text-gray-900">{jobStats.newToday}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Browse Jobs View */}
        {currentView === 'browse' && (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Mobile Filter Toggle Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
              >
                <Filter className="h-5 w-5" />
                <span className="font-medium">
                  {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
                </span>
              </button>
            </div>

            {/* Filters Sidebar */}
            <div className={`lg:w-80 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filters
                  </h2>
                  <button
                    onClick={() => {
                      setFilters({
                        keywords: '',
                        budget_type: 'all',
                        experience_level: 'all',
                        min_budget: '',
                        max_budget: '',
                        job_type: 'all',
                        location_type: 'all'
                      });
                      fetchJobs(1);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Clear All
                  </button>
                </div>
                
                <div className="space-y-4">
                    {/* Keywords */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Keywords
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="text"
                          value={filters.keywords}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFilters(prev => ({ ...prev, keywords: value }));
                            debouncedSearch(value);
                          }}
                          onKeyPress={(e) => e.key === 'Enter' && fetchJobs(1)}
                          placeholder="e.g., React, Node.js, Python"
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                    </div>

                  {/* Job Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Type
                    </label>
                    <select
                      value={filters.job_type}
                      onChange={(e) => handleFilterChange('job_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Types</option>
                      <option value="full-time">Full Time</option>
                      <option value="part-time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="freelance">Freelance</option>
                    </select>
                  </div>

                  {/* Location Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location Type
                    </label>
                    <select
                      value={filters.location_type}
                      onChange={(e) => handleFilterChange('location_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Locations</option>
                      <option value="remote">Remote</option>
                      <option value="on-site">On-site</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>

                  {/* Experience Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Experience Level
                    </label>
                    <select
                      value={filters.experience_level}
                      onChange={(e) => handleFilterChange('experience_level', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Levels</option>
                      <option value="entry">Entry Level</option>
                      <option value="mid">Mid Level</option>
                      <option value="senior">Senior Level</option>
                      <option value="executive">Executive</option>
                    </select>
                  </div>

                  {/* Budget Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Salary Range
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <input
                          type="number"
                          value={filters.min_budget}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFilters(prev => ({ ...prev, min_budget: value }));
                            debouncedSearch(value);
                          }}
                          placeholder="Min"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          value={filters.max_budget}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFilters(prev => ({ ...prev, max_budget: value }));
                            debouncedSearch(value);
                          }}
                          placeholder="Max"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Jobs List */}
            <div className="flex-1">
              {/* Sort Options */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div className="text-sm text-gray-600">
                  {totalJobs} jobs found
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <button
                    onClick={getAIJobRecommendations}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-sm w-full sm:w-auto justify-center"
                  >
                    <Sparkles className="h-4 w-4" />
                    {loading ? 'Getting AI Recommendations...' : 'AI Recommendations'}
                  </button>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        const newSortBy = e.target.value as any;
                        setSortBy(newSortBy);
                        setCurrentPage(1); // Reset to first page when sorting changes
                        fetchJobs(1); // Automatically refetch with new sort
                      }}
                      className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="budget_high">Highest Budget</option>
                      <option value="budget_low">Lowest Budget</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Jobs Grid */}
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 height="32" width="32" color="#2563eb" />
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-12">
                  <BriefcaseIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                  <p className="text-gray-600">Try adjusting your filters or search terms.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div key={job.id} className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 hover:shadow-md hover:border-blue-200 transition-all duration-200">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {job.title}
                              </h3>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-600 mb-3">
                                {job.company_name && (
                                  <div className="flex items-center gap-1">
                                    <Building2 className="h-4 w-4 flex-shrink-0" />
                                    <span className="truncate">{job.company_name}</span>
                                  </div>
                                )}
                                {job.location_type && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4 flex-shrink-0" />
                                    <span>{job.location_type}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4 flex-shrink-0" />
                                  <span>{formatBudget(job)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4 flex-shrink-0" />
                                  <span>{formatPostedDate(job.posted_date)}</span>
                                </div>
                              </div>
                            </div>
                            
                            {canAccessFeature('canSaveJobs') && (
                              <button
                                onClick={() => toggleBookmark(job.id, job.is_bookmarked || false)}
                                disabled={bookmarkingJobs.has(job.id)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed self-start"
                              >
                                {bookmarkingJobs.has(job.id) ? (
                                  <Loader2 height="20" width="20" color="#2563eb" />
                                ) : job.is_bookmarked ? (
                                  <BookmarkCheck className="h-5 w-5 text-blue-600" />
                                ) : (
                                  <Bookmark className="h-5 w-5" />
                                )}
                              </button>
                            )}
                          </div>
                          
                          <p className="text-gray-700 mb-4 line-clamp-3 text-sm sm:text-base">
                            {job.description}
                          </p>
                          
                          {job.skills && job.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {job.skills.slice(0, 5).map((skill, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                >
                                  {skill}
                                </span>
                              ))}
                              {job.skills.length > 5 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                  +{job.skills.length - 5} more
                                </span>
                              )}
                            </div>
                          )}
                          
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-600">
                              {job.applications_count !== undefined && (
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4 flex-shrink-0" />
                                  <span>{job.applications_count} applications</span>
                                </div>
                              )}
                              {job.experience_level && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 flex-shrink-0" />
                                  <span>{job.experience_level}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              <Link
                                to={`/job-details/${job.id}`}
                                className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 hover:border-blue-700 transition-all duration-200 text-center text-sm font-medium"
                              >
                                View Details
                              </Link>
                              <Link
                                to={`/apply/${job.id}`}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 hover:shadow-md transition-all duration-200 text-center text-sm font-medium"
                              >
                                Apply Now
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => {
                      const newPage = Math.max(1, currentPage - 1);
                      setCurrentPage(newPage);
                      fetchJobs(newPage);
                    }}
                    disabled={currentPage === 1}
                    className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-1 overflow-x-auto">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => {
                            setCurrentPage(page);
                            fetchJobs(page);
                          }}
                          className={`px-3 py-2 border rounded-md text-sm flex-shrink-0 ${
                            currentPage === page
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => {
                      const newPage = Math.min(totalPages, currentPage + 1);
                      setCurrentPage(newPage);
                      fetchJobs(newPage);
                    }}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Post Job View */}
        {currentView === 'post' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Post a New Job</h2>
                  <p className="text-gray-600 mt-1">Fill in the details to create your job posting</p>
                </div>
                <button
                  onClick={() => setCurrentView('browse')}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <KeyboardArrowLeft className="h-4 w-4" />
                  Back to Jobs
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="e.g., Senior React Developer"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => handleInputChange('company_name', e.target.value)}
                      placeholder="e.g., Tech Corp"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Job Description */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Job Description *
                    </label>
                    <button
                      onClick={generateJobDescription}
                      disabled={isGeneratingDescription || !formData.title}
                      className="flex items-center gap-2 px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingDescription ? (
                        <Loader2 height="16" width="16" color="#6b7280" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      AI Generate
                    </button>
                  </div>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the role, responsibilities, and what you're looking for..."
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Job Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Type
                    </label>
                    <select
                      value={formData.job_type}
                      onChange={(e) => handleInputChange('job_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="full-time">Full Time</option>
                      <option value="part-time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="freelance">Freelance</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location Type
                    </label>
                    <select
                      value={formData.location_type}
                      onChange={(e) => handleInputChange('location_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="remote">Remote</option>
                      <option value="on-site">On-site</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Experience Level
                    </label>
                    <select
                      value={formData.experience_level}
                      onChange={(e) => handleInputChange('experience_level', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="entry">Entry Level</option>
                      <option value="mid">Mid Level</option>
                      <option value="senior">Senior Level</option>
                      <option value="executive">Executive</option>
                    </select>
                  </div>
                </div>

                {/* Salary Range */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Salary Range
                    </label>
                    <button
                      onClick={generateSalaryEstimate}
                      disabled={isGeneratingSalary || !formData.title}
                      className="flex items-center gap-2 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingSalary ? (
                        <Loader2 height="16" width="16" color="#6b7280" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      AI Estimate
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Salary
                      </label>
                      <input
                        type="number"
                        value={formData.salary_min || ''}
                        onChange={(e) => handleInputChange('salary_min', parseInt(e.target.value) || undefined)}
                        placeholder="e.g., 80000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Salary
                      </label>
                      <input
                        type="number"
                        value={formData.salary_max || ''}
                        onChange={(e) => handleInputChange('salary_max', parseInt(e.target.value) || undefined)}
                        placeholder="e.g., 120000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Skills
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                      placeholder="Add a skill and press Enter"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={addSkill}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                      >
                        {skill}
                        <button
                          onClick={() => removeSkill(skill)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Requirements
                    </label>
                    <button
                      onClick={generateRequirements}
                      disabled={isGeneratingRequirements || !formData.title}
                      className="flex items-center gap-2 px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingRequirements ? (
                        <Loader2 height="16" width="16" color="#6b7280" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      AI Generate
                    </button>
                  </div>
                  <textarea
                    value={formData.requirements}
                    onChange={(e) => handleInputChange('requirements', e.target.value)}
                    placeholder="List the key requirements for this position..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-6 border-t">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <Eye className="h-4 w-4" />
                    {showPreview ? 'Hide Preview' : 'Preview'}
                  </button>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCurrentView('browse')}
                      className="px-6 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitJob}
                      disabled={isPosting || !formData.title || !formData.description || !formData.company_name}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPosting ? (
                        <Loader2 height="16" width="16" color="#ffffff" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {isPosting ? 'Posting...' : 'Post Job'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Saved Jobs View */}
        {currentView === 'saved' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Saved Jobs</h2>
              <p className="text-gray-600">Jobs you've bookmarked for later</p>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 height="32" width="32" color="#2563eb" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12">
                <Bookmark className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No saved jobs</h3>
                <p className="text-gray-600 mb-4">Start browsing jobs and save the ones you're interested in.</p>
                <button
                  onClick={() => setCurrentView('browse')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Browse Jobs
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div key={job.id} className="bg-white rounded-lg shadow-sm border p-6">
                    {/* Similar job card structure as browse view */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {job.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          {job.company_name && (
                            <div className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              {job.company_name}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {formatBudget(job)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatPostedDate(job.posted_date)}
                          </div>
                        </div>
                        <p className="text-gray-700 mb-4 line-clamp-2">
                          {job.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-2">
                            {job.skills?.slice(0, 3).map((skill, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleBookmark(job.id, true)}
                              disabled={bookmarkingJobs.has(job.id)}
                              className="p-2 text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {bookmarkingJobs.has(job.id) ? (
                                <Loader2 height="20" width="20" color="#ef4444" />
                              ) : (
                                <BookmarkCheck className="h-5 w-5" />
                              )}
                            </button>
                            <Link
                              to={`/apply/${job.id}`}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                              Apply Now
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Manage Jobs View */}
        {currentView === 'manage' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Manage Jobs</h2>
                <p className="text-gray-600">View and manage your job postings</p>
              </div>
              <button
                onClick={() => setCurrentView('post')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Post New Job
              </button>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 height="32" width="32" color="#2563eb" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No job postings</h3>
                <p className="text-gray-600 mb-4">You haven't posted any jobs yet. Create your first job posting to get started.</p>
                <button
                  onClick={() => setCurrentView('post')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Post Your First Job
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div key={job.id} className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {job.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${getStatusColor(job.status)}`}>
                              {getStatusIcon(job.status)}
                              {job.status ? job.status.charAt(0).toUpperCase() + job.status.slice(1) : 'Active'}
                            </span>
                            {/* Status Toggle Buttons */}
                            <div className="flex items-center gap-1">
                              {job.status !== 'active' && (
                                <button
                                  onClick={() => updateJobStatus(job.id, 'active')}
                                  disabled={updatingJobStatus === job.id}
                                  className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                                  title="Activate Job"
                                >
                                  <Play className="h-3 w-3" />
                                </button>
                              )}
                              {job.status !== 'paused' && job.status !== 'closed' && (
                                <button
                                  onClick={() => updateJobStatus(job.id, 'paused')}
                                  disabled={updatingJobStatus === job.id}
                                  className="p-1 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded"
                                  title="Pause Job"
                                >
                                  <Pause className="h-3 w-3" />
                                </button>
                              )}
                              {job.status !== 'closed' && (
                                <button
                                  onClick={() => updateJobStatus(job.id, 'closed')}
                                  disabled={updatingJobStatus === job.id}
                                  className="p-1 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded"
                                  title="Close Job"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {job.company_name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {job.applications_count || 0} applications
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Posted {formatPostedDate(job.posted_date)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex flex-wrap gap-2">
                            {job.skills?.slice(0, 3).map((skill, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditJob(job.id)}
                              className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-all duration-200"
                              title="Edit Job"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleViewApplications(job.id)}
                              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                            >
                              View Applications ({job.applications_count || 0})
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobsHub;