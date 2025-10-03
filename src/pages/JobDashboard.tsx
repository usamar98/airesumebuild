import React, { useState, useEffect } from 'react';
import { Search, Filter, Briefcase, DollarSign, Clock, MapPin, Star, Users, ExternalLink, Plus, Building2, Calendar, Eye, Bookmark, BookmarkCheck, Send, GraduationCap } from 'lucide-react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface Job {
  id: string;
  external_id: string;
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
  // New fields for posted jobs
  company_name?: string;
  company_logo?: string;
  location_type?: 'remote' | 'on-site' | 'hybrid';
  salary_min?: number;
  salary_max?: number;
  application_deadline?: string;
  is_posted_job?: boolean;
  applications_count?: number;
  is_bookmarked?: boolean;
}

interface JobFilters {
  keywords: string;
  budget_type: 'all' | 'fixed' | 'hourly';
  experience_level: 'all' | 'entry' | 'intermediate' | 'expert';
  min_budget: string;
  max_budget: string;
}

const JobDashboard: React.FC = () => {
  const { user } = useSupabaseAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

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
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'posted'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'budget_high' | 'budget_low'>('newest');
  const jobsPerPage = 10;

  // Sort jobs helper function
  const sortJobs = (jobs: Job[], sortBy: string) => {
    return [...jobs].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime();
        case 'oldest':
          return new Date(a.posted_date).getTime() - new Date(b.posted_date).getTime();
        case 'budget_high':
          const aBudget = a.budget_max || a.hourly_rate_max || a.salary_max || 0;
          const bBudget = b.budget_max || b.hourly_rate_max || b.salary_max || 0;
          return bBudget - aBudget;
        case 'budget_low':
          const aMinBudget = a.budget_min || a.hourly_rate_min || a.salary_min || 0;
          const bMinBudget = b.budget_min || b.hourly_rate_min || b.salary_min || 0;
          return aMinBudget - bMinBudget;
        default:
          return 0;
      }
    });
  };

  // Fetch jobs from API
  const fetchJobs = async (page: number = 1) => {
    setLoading(true);
    try {
      let queryParams = new URLSearchParams({
        page: page.toString(),
        limit: jobsPerPage.toString(),
        ...(filters.keywords && { keywords: filters.keywords }),
        ...(filters.budget_type !== 'all' && { budget_type: filters.budget_type }),
        ...(filters.experience_level !== 'all' && { experience_level: filters.experience_level }),
        ...(filters.min_budget && { min_budget: filters.min_budget }),
        ...(filters.max_budget && { max_budget: filters.max_budget }),
        ...(filters.job_type !== 'all' && { job_type: filters.job_type }),
        ...(filters.location_type !== 'all' && { location_type: filters.location_type }),
        ...(sortBy && { sort: sortBy })
      });

      // Fetch posted jobs only
      const response = await fetch(`/api/job-postings?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch jobs');
      
      const data = await response.json();
      const jobsWithSource = (data.jobs || []).map((job: Job) => ({
        ...job,
        is_posted_job: true
      }));
      
      const sortedJobs = sortJobs(jobsWithSource, sortBy);
      setJobs(sortedJobs);
      setTotalJobs(data.total || 0);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to fetch jobs');
      setJobs([]);
      setTotalJobs(0);
    } finally {
      setLoading(false);
    }
  };



  // Toggle job bookmark
  const toggleBookmark = async (jobId: string, isBookmarked: boolean) => {
    if (!user) {
      toast.error('Please log in to bookmark jobs');
      return;
    }

    try {
      const endpoint = isBookmarked ? '/api/job-bookmarks' : '/api/job-bookmarks';
      const method = isBookmarked ? 'DELETE' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`
        },
        body: JSON.stringify({ job_id: jobId })
      });

      if (response.ok) {
        // Update the job in the local state
        setJobs(prevJobs => 
          prevJobs.map(job => 
            job.id === jobId 
              ? { ...job, is_bookmarked: !isBookmarked }
              : job
          )
        );
        toast.success(isBookmarked ? 'Bookmark removed' : 'Job bookmarked!');
      } else {
        toast.error('Failed to update bookmark');
      }
    } catch (error) {
      console.error('Error updating bookmark:', error);
      toast.error('Error updating bookmark');
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof JobFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Apply filters
  const applyFilters = () => {
    setCurrentPage(1);
    fetchJobs(1);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      keywords: '',
      budget_type: 'all',
      experience_level: 'all',
      min_budget: '',
      max_budget: ''
    });
    setCurrentPage(1);
    fetchJobs(1);
  };

  // Format budget display
  const formatBudget = (job: Job) => {
    if (job.budget_type === 'fixed') {
      return `$${job.budget?.toLocaleString()}`;
    } else if (job.budget_type === 'hourly') {
      return `$${job.budget}/hr`;
    }
    return 'Budget not specified';
  };

  // Format posted date
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

  useEffect(() => {
    fetchJobs(1);
  }, []);

  const totalPages = Math.ceil(totalJobs / jobsPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Briefcase className="h-8 w-8 text-blue-600" />
                Job Marketplace
              </h1>
              <p className="text-gray-600 mt-1">Discover opportunities and connect with talent</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/post-job"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Post a Job
              </Link>

            </div>
          </div>
          
          {/* View Mode Toggles */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">View:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('all')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'all'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All Jobs
                </button>
                <button
                  onClick={() => setViewMode('posted')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'posted'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Posted Jobs
                </button>

              </div>
            </div>
            
            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="budget_high">Highest Budget</option>
                <option value="budget_low">Lowest Budget</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-80">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </h2>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden text-blue-600 hover:text-blue-700"
                >
                  {showFilters ? 'Hide' : 'Show'}
                </button>
              </div>
              
              <div className={`space-y-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                {/* Keywords */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords
                  </label>
                  <input
                    type="text"
                    value={filters.keywords}
                    onChange={(e) => handleFilterChange('keywords', e.target.value)}
                    placeholder="e.g., React, Node.js, Python"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Budget Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Type
                  </label>
                  <select
                    value={filters.budget_type}
                    onChange={(e) => handleFilterChange('budget_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="fixed">Fixed Price</option>
                    <option value="hourly">Hourly Rate</option>
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
                    <option value="intermediate">Intermediate</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>

                {/* Budget Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Range
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={filters.min_budget}
                      onChange={(e) => handleFilterChange('min_budget', e.target.value)}
                      placeholder="Min"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      value={filters.max_budget}
                      onChange={(e) => handleFilterChange('max_budget', e.target.value)}
                      placeholder="Max"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
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

                {/* Source Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Source
                  </label>
                  <select
                    value={filters.source}
                    onChange={(e) => handleFilterChange('source', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Sources</option>
                    <option value="posted">Posted Jobs</option>
                    <option value="scraped">Scraped Jobs</option>
                  </select>
                </div>

                {/* Filter Actions */}
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={applyFilters}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Apply
                  </button>
                  <button
                    onClick={resetFilters}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Job Listings */}
          <div className="flex-1">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters or post a new job</p>
                <Link
                  to="/post-job"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 inline-flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Post a Job
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Results Header */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-gray-600">
                      Showing {((currentPage - 1) * jobsPerPage) + 1}-{Math.min(currentPage * jobsPerPage, totalJobs)} of {totalJobs} jobs
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Page {currentPage} of {totalPages}</span>
                    </div>
                  </div>
                </div>

                {/* Job Cards */}
                {jobs.map((job) => (
                  <div key={job.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                    <div className="p-6">
                      {/* Job Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-2">
                            {/* Company Logo for Posted Jobs */}
                            {job.is_posted_job && job.company_logo && (
                              <img
                                src={job.company_logo}
                                alt={job.company_name || 'Company'}
                                className="w-12 h-12 rounded-lg object-cover border"
                              />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-xl font-semibold text-gray-900">
                                  {job.title}
                                </h3>
                                {/* Job Source Badge */}
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                  Posted
                                </span>
                              </div>
                              {/* Company Name for Posted Jobs */}
                              {job.is_posted_job && job.company_name && (
                                <div className="flex items-center gap-1 mb-2">
                                  <Building2 className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm font-medium text-gray-700">
                                    {job.company_name}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3 flex-wrap">
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {formatBudget(job)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatPostedDate(job.posted_date)}
                            </span>
                            {/* Location for Posted Jobs */}
                            {job.location_type && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {job.location_type.charAt(0).toUpperCase() + job.location_type.slice(1)}
                              </span>
                            )}
                            {/* Application Deadline for Posted Jobs */}
                            {job.is_posted_job && job.application_deadline && (
                              <span className="flex items-center gap-1 text-orange-600">
                                <Calendar className="h-4 w-4" />
                                Deadline: {new Date(job.application_deadline).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Apply Button for Posted Jobs */}
                          {job.is_posted_job && (
                            <Link
                              to={`/apply/${job.id}`}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                              <Send className="h-4 w-4" />
                              Apply Now
                            </Link>
                          )}
                          <button
                            onClick={() => toggleBookmark(job.id, job.is_bookmarked || false)}
                            className={`p-2 rounded-lg transition-colors ${
                              job.is_bookmarked
                                ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100'
                                : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                            }`}
                            title={job.is_bookmarked ? 'Remove bookmark' : 'Bookmark job'}
                          >
                            {job.is_bookmarked ? (
                              <BookmarkCheck className="h-5 w-5" />
                            ) : (
                              <Bookmark className="h-5 w-5" />
                            )}
                          </button>
                          {/* External Link for Scraped Jobs */}
                          {!job.is_posted_job && job.source_url && (
                            <a
                              href={job.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View on Upwork"
                            >
                              <ExternalLink className="h-5 w-5" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Job Description */}
                      <div className="mb-4">
                        <p className="text-gray-700 leading-relaxed">
                          {job.description && job.description.length > 200
                            ? `${job.description.substring(0, 200)}...`
                            : job.description || 'No description available'}
                        </p>
                      </div>

                      {/* Job Type and Requirements for Posted Jobs */}
                      {job.is_posted_job && (
                        <div className="mb-4">
                          <div className="flex items-center gap-4 text-sm">
                            {job.job_type && (
                              <span className="flex items-center gap-1 text-gray-600">
                                <Briefcase className="h-4 w-4" />
                                {job.job_type.charAt(0).toUpperCase() + job.job_type.slice(1)}
                              </span>
                            )}
                            {job.experience_level && (
                              <span className="flex items-center gap-1 text-gray-600">
                                <GraduationCap className="h-4 w-4" />
                                {job.experience_level.charAt(0).toUpperCase() + job.experience_level.slice(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Skills */}
                      {job.skills && job.skills.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2">
                            {job.skills.slice(0, 6).map((skill, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                            {job.skills.length > 6 && (
                              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                                +{job.skills.length - 6} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Client/Company Info & Job Stats */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-4">
                          {/* For Posted Jobs - Company Info */}
                          {job.is_posted_job && job.company_name && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {job.company_name}
                              </span>
                            </div>
                          )}
                          {/* For Scraped Jobs - Client Info */}
                          {!job.is_posted_job && job.client_name && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {job.client_name}
                              </span>
                              {job.client_rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                  <span className="text-sm text-gray-600">
                                    {job.client_rating.toFixed(1)}
                                  </span>
                                </div>
                              )}
                              {job.client_reviews_count && (
                                <span className="text-sm text-gray-500">
                                  ({job.client_reviews_count} reviews)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {/* Application Count for Posted Jobs */}
                          {job.is_posted_job && job.applications_count !== undefined && (
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {job.applications_count} applications
                            </span>
                          )}
                          {/* Proposal Count for Scraped Jobs */}
                          {!job.is_posted_job && job.proposals_count !== undefined && (
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {job.proposals_count} proposals
                            </span>
                          )}
                          {job.is_posted_job ? (
                            <Link
                              to={`/job/${job.id}`}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              View Details
                            </Link>
                          ) : (
                            <button 
                              onClick={() => window.open(job.source_url, '_blank')}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              View on Original Site
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setCurrentPage(prev => Math.max(1, prev - 1));
                          fetchJobs(Math.max(1, currentPage - 1));
                        }}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => {
                              setCurrentPage(pageNum);
                              fetchJobs(pageNum);
                            }}
                            className={`px-3 py-2 rounded-md ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => {
                          setCurrentPage(prev => Math.min(totalPages, prev + 1));
                          fetchJobs(Math.min(totalPages, currentPage + 1));
                        }}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDashboard;