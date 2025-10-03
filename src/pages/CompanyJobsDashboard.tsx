/**
 * Company Jobs Dashboard Component
 * Sophisticated job management with ATS, candidate pipeline, interview scheduling, and workflows
 */
import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useRoleManagement } from '../hooks/useRoleManagement';
import {
  BriefcaseIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ShareIcon,
  ChartBarIcon,
  ArrowPathIcon,
  StarIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  PhoneIcon,
  VideoCameraIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'full_time' | 'part_time' | 'contract' | 'internship';
  status: 'draft' | 'active' | 'paused' | 'closed';
  applications_count: number;
  views_count: number;
  posted_date: string;
  deadline?: string;
  salary_range?: string;
  priority: 'low' | 'medium' | 'high';
}

interface Application {
  id: string;
  job_id: string;
  candidate_name: string;
  candidate_email: string;
  status: 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  applied_date: string;
  rating?: number;
  notes?: string;
  resume_url?: string;
  stage: string;
}

interface Interview {
  id: string;
  application_id: string;
  candidate_name: string;
  job_title: string;
  scheduled_at: string;
  interviewer: string;
  type: 'phone' | 'video' | 'in_person';
  status: 'scheduled' | 'completed' | 'cancelled';
}

const CompanyJobsDashboard: React.FC = () => {
  const { user } = useSupabaseAuth();
  const { userRole, canAccessFeature } = useRoleManagement();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('jobs');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  // Data state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);

  useEffect(() => {
    if (user) {
      fetchJobsData();
      fetchApplicationsData();
      fetchInterviewsData();
    }
  }, [user]);

  const fetchJobsData = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual Supabase calls
      const mockJobs: Job[] = [
        {
          id: '1',
          title: 'Senior Software Engineer',
          department: 'Engineering',
          location: 'San Francisco, CA',
          type: 'full_time',
          status: 'active',
          applications_count: 45,
          views_count: 234,
          posted_date: '2024-01-15',
          deadline: '2024-02-15',
          salary_range: '$120k - $160k',
          priority: 'high'
        },
        {
          id: '2',
          title: 'Product Manager',
          department: 'Product',
          location: 'Remote',
          type: 'full_time',
          status: 'active',
          applications_count: 32,
          views_count: 189,
          posted_date: '2024-01-18',
          deadline: '2024-02-18',
          salary_range: '$100k - $140k',
          priority: 'medium'
        },
        {
          id: '3',
          title: 'UX Designer',
          department: 'Design',
          location: 'New York, NY',
          type: 'full_time',
          status: 'paused',
          applications_count: 28,
          views_count: 156,
          posted_date: '2024-01-12',
          salary_range: '$80k - $110k',
          priority: 'low'
        },
        {
          id: '4',
          title: 'Frontend Developer Intern',
          department: 'Engineering',
          location: 'San Francisco, CA',
          type: 'internship',
          status: 'draft',
          applications_count: 0,
          views_count: 0,
          posted_date: '2024-01-20',
          priority: 'medium'
        }
      ];
      setJobs(mockJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicationsData = async () => {
    try {
      // Mock data - replace with actual Supabase calls
      const mockApplications: Application[] = [
        {
          id: '1',
          job_id: '1',
          candidate_name: 'Alice Johnson',
          candidate_email: 'alice@example.com',
          status: 'interview',
          applied_date: '2024-01-16',
          rating: 4,
          stage: 'Technical Interview',
          notes: 'Strong technical background, good communication skills'
        },
        {
          id: '2',
          job_id: '1',
          candidate_name: 'Bob Smith',
          candidate_email: 'bob@example.com',
          status: 'screening',
          applied_date: '2024-01-17',
          rating: 3,
          stage: 'Initial Screening'
        },
        {
          id: '3',
          job_id: '2',
          candidate_name: 'Carol Davis',
          candidate_email: 'carol@example.com',
          status: 'offer',
          applied_date: '2024-01-19',
          rating: 5,
          stage: 'Final Decision',
          notes: 'Excellent fit for the role, strong product sense'
        },
        {
          id: '4',
          job_id: '1',
          candidate_name: 'David Wilson',
          candidate_email: 'david@example.com',
          status: 'new',
          applied_date: '2024-01-20',
          stage: 'Application Review'
        }
      ];
      setApplications(mockApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const fetchInterviewsData = async () => {
    try {
      // Mock data - replace with actual Supabase calls
      const mockInterviews: Interview[] = [
        {
          id: '1',
          application_id: '1',
          candidate_name: 'Alice Johnson',
          job_title: 'Senior Software Engineer',
          scheduled_at: '2024-01-22T14:00:00Z',
          interviewer: 'John Doe',
          type: 'video',
          status: 'scheduled'
        },
        {
          id: '2',
          application_id: '3',
          candidate_name: 'Carol Davis',
          job_title: 'Product Manager',
          scheduled_at: '2024-01-23T10:00:00Z',
          interviewer: 'Sarah Johnson',
          type: 'in_person',
          status: 'scheduled'
        },
        {
          id: '3',
          application_id: '2',
          candidate_name: 'Bob Smith',
          job_title: 'Senior Software Engineer',
          scheduled_at: '2024-01-21T16:00:00Z',
          interviewer: 'Mike Wilson',
          type: 'phone',
          status: 'completed'
        }
      ];
      setInterviews(mockInterviews);
    } catch (error) {
      console.error('Error fetching interviews:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      paused: { color: 'bg-yellow-100 text-yellow-800', label: 'Paused' },
      closed: { color: 'bg-red-100 text-red-800', label: 'Closed' },
      new: { color: 'bg-blue-100 text-blue-800', label: 'New' },
      screening: { color: 'bg-yellow-100 text-yellow-800', label: 'Screening' },
      interview: { color: 'bg-purple-100 text-purple-800', label: 'Interview' },
      offer: { color: 'bg-green-100 text-green-800', label: 'Offer' },
      hired: { color: 'bg-green-100 text-green-800', label: 'Hired' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
      scheduled: { color: 'bg-blue-100 text-blue-800', label: 'Scheduled' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.new;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      high: { color: 'bg-red-100 text-red-800', label: 'High' },
      medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
      low: { color: 'bg-gray-100 text-gray-800', label: 'Low' }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig];
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getInterviewIcon = (type: string) => {
    switch (type) {
      case 'phone':
        return <PhoneIcon className="h-4 w-4" />;
      case 'video':
        return <VideoCameraIcon className="h-4 w-4" />;
      case 'in_person':
        return <UserGroupIcon className="h-4 w-4" />;
      default:
        return <CalendarDaysIcon className="h-4 w-4" />;
    }
  };

  const renderStarRating = (rating?: number) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIconSolid
            key={star}
            className={`h-4 w-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredApplications = applications.filter(app => {
    if (selectedJob) {
      return app.job_id === selectedJob;
    }
    return true;
  });

  const tabs = [
    { id: 'jobs', name: 'Jobs', icon: BriefcaseIcon, count: jobs.length },
    { id: 'applications', name: 'Applications', icon: UserGroupIcon, count: applications.length },
    { id: 'interviews', name: 'Interviews', icon: CalendarDaysIcon, count: interviews.length },
    { id: 'pipeline', name: 'Pipeline', icon: FunnelIcon, count: 0 }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Jobs Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage job postings, track applications, and streamline your hiring process
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                Templates
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                <PlusIcon className="h-4 w-4 mr-2" />
                Post New Job
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{jobs.filter(j => j.status === 'active').length}</p>
                <p className="text-sm text-gray-500">Active Jobs</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <BriefcaseIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
                <p className="text-sm text-gray-500">Total Applications</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{interviews.filter(i => i.status === 'scheduled').length}</p>
                <p className="text-sm text-gray-500">Scheduled Interviews</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <CalendarDaysIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{applications.filter(a => a.status === 'hired').length}</p>
                <p className="text-sm text-gray-500">Successful Hires</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                  {tab.count > 0 && (
                    <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs, candidates, or departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="paused">Paused</option>
            <option value="closed">Closed</option>
          </select>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <FunnelIcon className="h-4 w-4 mr-2" />
            More Filters
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'jobs' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applications
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{job.title}</div>
                          <div className="text-sm text-gray-500">{job.location} • {job.type.replace('_', ' ')}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {job.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(job.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button
                          onClick={() => {
                            setSelectedJob(job.id);
                            setActiveTab('applications');
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {job.applications_count}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {job.views_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPriorityBadge(job.priority)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button className="text-blue-600 hover:text-blue-800">
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-800">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-800">
                            <ShareIcon className="h-4 w-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-800">
                            <EllipsisVerticalIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="space-y-6">
            {selectedJob && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-blue-800">
                    Showing applications for: <span className="font-medium">{jobs.find(j => j.id === selectedJob)?.title}</span>
                  </p>
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View All Applications
                  </button>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {filteredApplications.map((application) => (
                <div key={application.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {application.candidate_name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{application.candidate_name}</h3>
                        <p className="text-xs text-gray-500">{application.candidate_email}</p>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <EllipsisVerticalIcon className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Status</span>
                      {getStatusBadge(application.status)}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Stage</span>
                      <span className="text-xs text-gray-900">{application.stage}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Applied</span>
                      <span className="text-xs text-gray-900">
                        {new Date(application.applied_date).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {application.rating && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Rating</span>
                        {renderStarRating(application.rating)}
                      </div>
                    )}
                  </div>
                  
                  {application.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600">{application.notes}</p>
                    </div>
                  )}
                  
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 text-xs bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700">
                      Review
                    </button>
                    <button className="text-xs border border-gray-300 text-gray-700 py-2 px-3 rounded-md hover:bg-gray-50">
                      Schedule
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'interviews' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date &amp; Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Interviewer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {interviews.map((interview) => (
                    <tr key={interview.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{interview.candidate_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {interview.job_title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(interview.scheduled_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {interview.interviewer}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getInterviewIcon(interview.type)}
                          <span className="text-sm text-gray-900 capitalize">{interview.type.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(interview.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button className="text-blue-600 hover:text-blue-800">
                            <CalendarDaysIcon className="h-4 w-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-800">
                            <ChatBubbleLeftRightIcon className="h-4 w-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-800">
                            <EllipsisVerticalIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'pipeline' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Candidate Pipeline</h3>
            <p className="text-gray-500">Visual candidate pipeline with drag-and-drop functionality coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyJobsDashboard;