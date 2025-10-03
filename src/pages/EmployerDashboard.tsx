import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Eye, Users, Calendar, DollarSign, MapPin, Building2, Search, Filter, MoreVertical, Edit, Trash2, CheckCircle, Clock, XCircle, User, FileText, Download, Play, Pause, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { apiCall, API_ENDPOINTS } from '../config/api';

interface JobPosting {
  id: string;
  title: string;
  company_name: string;
  location?: string;
  location_type?: string;
  job_type?: string;
  salary_min?: number;
  salary_max?: number;
  status: 'draft' | 'active' | 'paused' | 'closed';
  applications_count: number;
  created_at: string;
  application_deadline?: string;
  views_count?: number;
}

interface Application {
  id: string;
  job_id: string;
  job_title: string;
  applicant_name: string;
  applicant_email: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired';
  applied_at: string;
  cover_letter: string;
  resume_url?: string;
  additional_notes?: string;
}

interface DashboardStats {
  total_jobs: number;
  active_jobs: number;
  total_applications: number;
  pending_applications: number;
}

const EmployerDashboard: React.FC = () => {
  const { user, token } = useSupabaseAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'jobs' | 'applications'>('jobs');
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedJob, setSelectedJob] = useState<string>('all');
  const [showJobActions, setShowJobActions] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsResponse = await apiCall(API_ENDPOINTS.EMPLOYER.STATS, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
      
      // Fetch jobs
      const jobsResponse = await apiCall(API_ENDPOINTS.EMPLOYER.JOBS, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        setJobs(jobsData);
      }
      
      // Fetch applications
      const applicationsResponse = await apiCall(API_ENDPOINTS.EMPLOYER.APPLICATIONS, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (applicationsResponse.ok) {
        const applicationsData = await applicationsResponse.json();
        setApplications(applicationsData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (jobId: string, status: 'active' | 'paused' | 'closed') => {
    try {
      const response = await apiCall(`/api/job-postings/${jobId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update job status');
      }
      
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status } : job
      ));
      
      const statusMessages = {
        active: 'activated',
        paused: 'paused',
        closed: 'closed'
      };
      
      toast.success(`Job ${statusMessages[status]} successfully`);
    } catch (error) {
      console.error('Error updating job status:', error);
      toast.error('Failed to update job status');
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job posting?')) {
      return;
    }
    
    try {
      const response = await apiCall(`/api/job-postings/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete job');
      }
      
      setJobs(prev => prev.filter(job => job.id !== jobId));
      toast.success('Job deleted successfully');
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete job');
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: Application['status']) => {
    try {
      const response = await apiCall(`/api/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update application status');
      }
      
      setApplications(prev => prev.map(app => 
        app.id === applicationId ? { ...app, status } : app
      ));
      
      toast.success('Application status updated successfully');
    } catch (error) {
      console.error('Error updating application status:', error);
      toast.error('Failed to update application status');
    }
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Not specified';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `From $${min.toLocaleString()}`;
    return `Up to $${max!.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-600';
      case 'closed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'reviewed': return 'bg-purple-100 text-purple-800';
      case 'shortlisted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'hired': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      case 'draft': return <Clock className="h-4 w-4" />;
      case 'closed': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.applicant_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesJob = selectedJob === 'all' || app.job_id === selectedJob;
    return matchesSearch && matchesStatus && matchesJob;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employer Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your job postings and applications</p>
          </div>
          <Link
            to="/post-job"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Post New Job
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Jobs</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_jobs}</p>
                </div>
                <Building2 className="h-12 w-12 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Jobs</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.active_jobs}</p>
                </div>
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Applications</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_applications}</p>
                </div>
                <Users className="h-12 w-12 text-purple-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Reviews</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.pending_applications}</p>
                </div>
                <Clock className="h-12 w-12 text-orange-600" />
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('jobs')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'jobs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Job Postings ({jobs.length})
              </button>
              <button
                onClick={() => setActiveTab('applications')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'applications'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Applications ({applications.length})
              </button>
            </nav>
          </div>

          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={activeTab === 'jobs' ? 'Search jobs...' : 'Search applications...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  {activeTab === 'jobs' ? (
                    <>
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="closed">Closed</option>
                    </>
                  ) : (
                    <>
                      <option value="pending">Pending</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="rejected">Rejected</option>
                      <option value="hired">Hired</option>
                    </>
                  )}
                </select>
                
                {activeTab === 'applications' && (
                  <select
                    value={selectedJob}
                    onChange={(e) => setSelectedJob(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Jobs</option>
                    {jobs.map(job => (
                      <option key={job.id} value={job.id}>{job.title}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'jobs' ? (
              <div className="space-y-4">
                {filteredJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                    <p className="text-gray-600 mb-4">Get started by posting your first job.</p>
                    <Link
                      to="/post-job"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Post Job
                    </Link>
                  </div>
                ) : (
                  filteredJobs.map(job => (
                    <div key={job.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(job.status)}`}>
                              {getStatusIcon(job.status)}
                              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              {job.company_name}
                            </div>
                            {job.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {job.location}
                                {job.location_type && (
                                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs ml-1">
                                    {job.location_type}
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {formatSalary(job.salary_min, job.salary_max)}
                            </div>
                            {job.application_deadline && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Deadline: {new Date(job.application_deadline).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-6 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {job.applications_count} applications
                            </span>
                            {job.views_count && (
                              <span className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                {job.views_count} views
                              </span>
                            )}
                            <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="relative">
                          <button
                            onClick={() => setShowJobActions(showJobActions === job.id ? null : job.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>
                          
                          {showJobActions === job.id && (
                            <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
                              <Link
                                to={`/job/${job.id}`}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Eye className="h-4 w-4" />
                                View Details
                              </Link>
                              <Link
                                to={`/post-job?edit=${job.id}`}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Edit className="h-4 w-4" />
                                Edit
                              </Link>
                              {job.status === 'draft' && (
                                <button
                                  onClick={() => updateJobStatus(job.id, 'active')}
                                  className="flex items-center gap-2 px-4 py-2 text-sm text-green-700 hover:bg-gray-50 w-full text-left"
                                >
                                  <Play className="h-4 w-4" />
                                  Activate
                                </button>
                              )}
                              {job.status === 'active' && (
                                <button
                                  onClick={() => updateJobStatus(job.id, 'paused')}
                                  className="flex items-center gap-2 px-4 py-2 text-sm text-yellow-700 hover:bg-gray-50 w-full text-left"
                                >
                                  <Pause className="h-4 w-4" />
                                  Pause
                                </button>
                              )}
                              {job.status === 'paused' && (
                                <button
                                  onClick={() => updateJobStatus(job.id, 'active')}
                                  className="flex items-center gap-2 px-4 py-2 text-sm text-green-700 hover:bg-gray-50 w-full text-left"
                                >
                                  <Play className="h-4 w-4" />
                                  Activate
                                </button>
                              )}
                              {(job.status === 'active' || job.status === 'paused') && (
                                <button
                                  onClick={() => updateJobStatus(job.id, 'closed')}
                                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-700 hover:bg-gray-50 w-full text-left"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Close
                                </button>
                              )}
                              <button
                                onClick={() => deleteJob(job.id)}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-red-700 hover:bg-gray-50 w-full text-left"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApplications.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
                    <p className="text-gray-600">Applications will appear here when candidates apply to your jobs.</p>
                  </div>
                ) : (
                  filteredApplications.map(application => (
                    <div key={application.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{application.applicant_name}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <span className="font-medium">{application.job_title}</span>
                            <span>•</span>
                            <span>{application.applicant_email}</span>
                            <span>•</span>
                            <span>Applied {new Date(application.applied_at).toLocaleDateString()}</span>
                          </div>
                          
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {application.cover_letter}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          {application.resume_url && (
                            <a
                              href={application.resume_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-600 hover:text-blue-700 rounded-lg hover:bg-blue-50"
                              title="Download Resume"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          )}
                          
                          <select
                            value={application.status}
                            onChange={(e) => updateApplicationStatus(application.id, e.target.value as Application['status'])}
                            className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="rejected">Rejected</option>
                            <option value="hired">Hired</option>
                          </select>
                        </div>
                      </div>
                      
                      {application.additional_notes && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Additional Notes:</h4>
                          <p className="text-sm text-gray-600">{application.additional_notes}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerDashboard;