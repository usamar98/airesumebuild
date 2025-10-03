/**
 * Job Seeker Applications Dashboard Component
 * Advanced application management with filtering, sorting, status tracking, analytics, and bulk operations
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useRoleManagement } from '../hooks/useRoleManagement';
import { isFeatureEnabled } from '../config/featureFlags';
import ComingSoon from '../components/ComingSoon';
import {
  BriefcaseIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  DocumentTextIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  PencilIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  StarIcon,
  PlusIcon,
  ArrowPathIcon,
  Bars3Icon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { toast } from 'sonner';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  salary?: string;
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
  status: 'pending' | 'reviewed' | 'shortlisted' | 'interview' | 'offer' | 'rejected' | 'withdrawn';
  appliedAt: string;
  lastUpdated: string;
  coverLetter?: string;
  resumeUrl?: string;
  notes?: string;
  interviewDate?: string;
  followUpDate?: string;
  priority: 'low' | 'medium' | 'high';
  source: 'direct' | 'referral' | 'job_board' | 'company_website';
  skills: string[];
  matchScore?: number;
}

interface ApplicationStats {
  total: number;
  pending: number;
  reviewed: number;
  shortlisted: number;
  interview: number;
  offer: number;
  rejected: number;
  responseRate: number;
  avgResponseTime: number;
}

interface FilterOptions {
  status: string;
  jobType: string;
  dateRange: string;
  priority: string;
  source: string;
  company: string;
}

const JobSeekerApplicationsDashboard: React.FC = () => {
  const { user } = useSupabaseAuth();
  const { userRole } = useRoleManagement();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'company' | 'priority'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    jobType: 'all',
    dateRange: 'all',
    priority: 'all',
    source: 'all',
    company: 'all'
  });

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [applications, searchTerm, filters, sortBy, sortOrder]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      
      // Mock data - replace with actual Supabase calls
      const mockApplications: Application[] = [
        {
          id: '1',
          jobId: 'job1',
          jobTitle: 'Senior Frontend Developer',
          company: 'TechCorp',
          location: 'San Francisco, CA',
          salary: '$120k - $150k',
          jobType: 'full-time',
          status: 'interview',
          appliedAt: '2024-01-20T10:00:00Z',
          lastUpdated: '2024-01-22T14:30:00Z',
          priority: 'high',
          source: 'direct',
          skills: ['React', 'TypeScript', 'Node.js'],
          matchScore: 95,
          interviewDate: '2024-01-25T15:00:00Z',
          notes: 'Great company culture, exciting projects'
        },
        {
          id: '2',
          jobId: 'job2',
          jobTitle: 'Full Stack Engineer',
          company: 'StartupXYZ',
          location: 'Remote',
          salary: '$100k - $130k',
          jobType: 'full-time',
          status: 'shortlisted',
          appliedAt: '2024-01-19T09:15:00Z',
          lastUpdated: '2024-01-21T11:20:00Z',
          priority: 'high',
          source: 'job_board',
          skills: ['JavaScript', 'Python', 'AWS'],
          matchScore: 88,
          followUpDate: '2024-01-26T10:00:00Z'
        },
        {
          id: '3',
          jobId: 'job3',
          jobTitle: 'React Developer',
          company: 'Digital Agency',
          location: 'New York, NY',
          salary: '$90k - $110k',
          jobType: 'contract',
          status: 'pending',
          appliedAt: '2024-01-18T16:45:00Z',
          lastUpdated: '2024-01-18T16:45:00Z',
          priority: 'medium',
          source: 'company_website',
          skills: ['React', 'Redux', 'CSS'],
          matchScore: 82
        },
        {
          id: '4',
          jobId: 'job4',
          jobTitle: 'Backend Developer',
          company: 'CloudTech',
          location: 'Austin, TX',
          salary: '$110k - $140k',
          jobType: 'full-time',
          status: 'rejected',
          appliedAt: '2024-01-15T13:20:00Z',
          lastUpdated: '2024-01-20T09:10:00Z',
          priority: 'medium',
          source: 'referral',
          skills: ['Node.js', 'MongoDB', 'Docker'],
          matchScore: 75
        },
        {
          id: '5',
          jobId: 'job5',
          jobTitle: 'Frontend Intern',
          company: 'InnovateLab',
          location: 'Boston, MA',
          salary: '$20/hour',
          jobType: 'internship',
          status: 'offer',
          appliedAt: '2024-01-12T11:30:00Z',
          lastUpdated: '2024-01-23T16:00:00Z',
          priority: 'low',
          source: 'job_board',
          skills: ['HTML', 'CSS', 'JavaScript'],
          matchScore: 70
        }
      ];

      const mockStats: ApplicationStats = {
        total: mockApplications.length,
        pending: mockApplications.filter(app => app.status === 'pending').length,
        reviewed: mockApplications.filter(app => app.status === 'reviewed').length,
        shortlisted: mockApplications.filter(app => app.status === 'shortlisted').length,
        interview: mockApplications.filter(app => app.status === 'interview').length,
        offer: mockApplications.filter(app => app.status === 'offer').length,
        rejected: mockApplications.filter(app => app.status === 'rejected').length,
        responseRate: 80,
        avgResponseTime: 3.2
      };

      setApplications(mockApplications);
      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = applications.filter(app => {
      const matchesSearch = app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           app.company.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filters.status === 'all' || app.status === filters.status;
      const matchesJobType = filters.jobType === 'all' || app.jobType === filters.jobType;
      const matchesPriority = filters.priority === 'all' || app.priority === filters.priority;
      const matchesSource = filters.source === 'all' || app.source === filters.source;
      const matchesCompany = filters.company === 'all' || app.company === filters.company;

      return matchesSearch && matchesStatus && matchesJobType && matchesPriority && matchesSource && matchesCompany;
    });

    // Sort applications
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'company':
          comparison = a.company.localeCompare(b.company);
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    setFilteredApplications(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'shortlisted': return 'bg-purple-100 text-purple-800';
      case 'interview': return 'bg-indigo-100 text-indigo-800';
      case 'offer': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'withdrawn': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <ClockIcon className="h-4 w-4" />;
      case 'reviewed': return <EyeIcon className="h-4 w-4" />;
      case 'shortlisted': return <StarIcon className="h-4 w-4" />;
      case 'interview': return <CalendarIcon className="h-4 w-4" />;
      case 'offer': return <CheckCircleIcon className="h-4 w-4" />;
      case 'rejected': return <XCircleIcon className="h-4 w-4" />;
      case 'withdrawn': return <ExclamationTriangleIcon className="h-4 w-4" />;
      default: return <ClockIcon className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedApplications.length === 0) {
      toast.error('Please select applications first');
      return;
    }

    switch (action) {
      case 'delete':
        // Handle bulk delete
        toast.success(`Deleted ${selectedApplications.length} applications`);
        break;
      case 'export':
        // Handle bulk export
        toast.success(`Exported ${selectedApplications.length} applications`);
        break;
      case 'follow-up':
        // Handle bulk follow-up
        toast.success(`Set follow-up for ${selectedApplications.length} applications`);
        break;
    }
    setSelectedApplications([]);
  };

  const toggleApplicationSelection = (id: string) => {
    setSelectedApplications(prev => 
      prev.includes(id) 
        ? prev.filter(appId => appId !== id)
        : [...prev, id]
    );
  };

  const selectAllApplications = () => {
    if (selectedApplications.length === filteredApplications.length) {
      setSelectedApplications([]);
    } else {
      setSelectedApplications(filteredApplications.map(app => app.id));
    }
  };

  // Application trends chart data
  const applicationTrendsData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Applications Sent',
        data: [3, 7, 5, 9],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      },
      {
        label: 'Responses Received',
        data: [1, 2, 2, 3],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4
      }
    ]
  };

  // Status distribution chart data
  const statusDistributionData = {
    labels: ['Pending', 'Reviewed', 'Shortlisted', 'Interview', 'Offer', 'Rejected'],
    datasets: [
      {
        label: 'Applications',
        data: [
          stats?.pending || 0,
          stats?.reviewed || 0,
          stats?.shortlisted || 0,
          stats?.interview || 0,
          stats?.offer || 0,
          stats?.rejected || 0
        ],
        backgroundColor: [
          '#fbbf24',
          '#3b82f6',
          '#8b5cf6',
          '#6366f1',
          '#10b981',
          '#ef4444'
        ]
      }
    ]
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Coming Soon Overlay */}
      {!isFeatureEnabled('jobSeekerApplications') && (
        <ComingSoon
          title="Applications Dashboard"
          description="Your comprehensive applications management dashboard is coming soon! Track your job applications, view status updates, and manage your job search pipeline."
          variant="overlay"
        />
      )}
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
              <p className="text-gray-600 mt-1">Track and manage your job applications</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/jobs-hub"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                Apply to Jobs
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
              </div>
              <BriefcaseIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Response Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.responseRate || 0}%</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Interviews</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.interview || 0}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Offers</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.offer || 0}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Trends</h3>
            <div className="h-64">
              <Line 
                data={applicationTrendsData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
            <div className="h-64">
              <Bar 
                data={statusDistributionData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search applications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <FunnelIcon className="h-5 w-5" />
                Filters
              </button>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Sort by Date</option>
                <option value="status">Sort by Status</option>
                <option value="company">Sort by Company</option>
                <option value="priority">Sort by Priority</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <ArrowPathIcon className={`h-5 w-5 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
              </button>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                >
                  <Bars3Icon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                >
                  <Squares2X2Icon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="interview">Interview</option>
                  <option value="offer">Offer</option>
                  <option value="rejected">Rejected</option>
                </select>
                <select
                  value={filters.jobType}
                  onChange={(e) => setFilters({...filters, jobType: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({...filters, priority: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select
                  value={filters.source}
                  onChange={(e) => setFilters({...filters, source: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Sources</option>
                  <option value="direct">Direct</option>
                  <option value="referral">Referral</option>
                  <option value="job_board">Job Board</option>
                  <option value="company_website">Company Website</option>
                </select>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                </select>
                <button
                  onClick={() => setFilters({
                    status: 'all',
                    jobType: 'all',
                    dateRange: 'all',
                    priority: 'all',
                    source: 'all',
                    company: 'all'
                  })}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedApplications.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-blue-800 font-medium">
                {selectedApplications.length} application{selectedApplications.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkAction('follow-up')}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Set Follow-up
                </button>
                <button
                  onClick={() => handleBulkAction('export')}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Export
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Applications List/Grid */}
        <div className="bg-white rounded-lg shadow-sm">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selectedApplications.length === filteredApplications.length && filteredApplications.length > 0}
                  onChange={selectAllApplications}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Applications */}
          <div className="divide-y divide-gray-200">
            {filteredApplications.map((application) => (
              <div key={application.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedApplications.includes(application.id)}
                    onChange={() => toggleApplicationSelection(application.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-gray-900">{application.jobTitle}</h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                            {getStatusIcon(application.status)}
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </span>
                          <span className={`text-xs font-medium ${getPriorityColor(application.priority)}`}>
                            {application.priority.toUpperCase()}
                          </span>
                          {application.matchScore && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                              {application.matchScore}% match
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <BuildingOfficeIcon className="h-4 w-4" />
                            {application.company}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPinIcon className="h-4 w-4" />
                            {application.location}
                          </div>
                          {application.salary && (
                            <div className="flex items-center gap-1">
                              <CurrencyDollarIcon className="h-4 w-4" />
                              {application.salary}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            Applied {new Date(application.appliedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {application.skills.slice(0, 3).map((skill, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                          {application.skills.length > 3 && (
                            <span className="text-xs text-gray-500">+{application.skills.length - 3} more</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Link
                          to={`/job-details/${application.jobId}`}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="View Job"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                        <button
                          className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                          title="Edit Application"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete Application"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredApplications.length === 0 && (
            <div className="px-6 py-12 text-center">
              <BriefcaseIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || Object.values(filters).some(f => f !== 'all') 
                  ? 'Try adjusting your search or filters'
                  : 'Start applying to jobs to see your applications here'
                }
              </p>
              <Link
                to="/jobs-hub"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                Browse Jobs
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobSeekerApplicationsDashboard;