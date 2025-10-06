/**
 * Smart Dashboard Component
 * Auto-redirects and displays role-specific dashboard content
 * Job seeker view: applications, saved jobs, profile
 * Employer view: posted jobs, applicant management, analytics
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useRoleManagement } from '../hooks/useRoleManagement';
import {
  BriefcaseIcon,
  UserIcon,
  ChartBarIcon,
  DocumentTextIcon,
  HeartIcon,
  ClockIcon,
  EyeIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalApplications?: number;
  savedJobs?: number;
  profileViews?: number;
  postedJobs?: number;
  totalApplicants?: number;
  activeJobs?: number;
}

interface DashboardWidget {
  id: string;
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const SmartDashboard: React.FC = () => {
  const { user } = useSupabaseAuth();
  const { userRole, canAccessFeature } = useRoleManagement();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);

  const currentView = searchParams.get('view') || 'overview';

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Auto-redirect based on role if no specific view is requested
    if (currentView === 'overview' && userRole) {
      const defaultView = getDefaultViewForRole(userRole);
      if (defaultView !== 'overview') {
        navigate(`/dashboard?view=${defaultView}`, { replace: true });
        return;
      }
    }

    fetchDashboardStats();
  }, [user, userRole, currentView, navigate]);

  const getDefaultViewForRole = (role: string): string => {
    switch (role) {
      case 'job_seeker':
        return 'applications';
      case 'employer':
        return 'jobs';
      case 'dual':
        return 'overview';
      default:
        return 'overview';
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API calls
      const mockStats: DashboardStats = {
        totalApplications: 12,
        savedJobs: 8,
        profileViews: 45,
        postedJobs: 3,
        totalApplicants: 28,
        activeJobs: 2
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getJobSeekerWidgets = (): DashboardWidget[] => [
    {
      id: 'applications',
      title: 'Total Applications',
      value: stats.totalApplications || 0,
      icon: BriefcaseIcon,
      color: 'blue',
      trend: { value: 12, isPositive: true }
    },
    {
      id: 'saved-jobs',
      title: 'Saved Jobs',
      value: stats.savedJobs || 0,
      icon: HeartIcon,
      color: 'red',
      trend: { value: 3, isPositive: true }
    },
    {
      id: 'profile-views',
      title: 'Profile Views',
      value: stats.profileViews || 0,
      icon: EyeIcon,
      color: 'green',
      trend: { value: 8, isPositive: true }
    },
    {
      id: 'interviews',
      title: 'Interviews Scheduled',
      value: 2,
      icon: ClockIcon,
      color: 'purple'
    }
  ];

  const getEmployerWidgets = (): DashboardWidget[] => [
    {
      id: 'posted-jobs',
      title: 'Posted Jobs',
      value: stats.postedJobs || 0,
      icon: BriefcaseIcon,
      color: 'blue',
      trend: { value: 1, isPositive: true }
    },
    {
      id: 'total-applicants',
      title: 'Total Applicants',
      value: stats.totalApplicants || 0,
      icon: UserIcon,
      color: 'green',
      trend: { value: 15, isPositive: true }
    },
    {
      id: 'active-jobs',
      title: 'Active Jobs',
      value: stats.activeJobs || 0,
      icon: ChartBarIcon,
      color: 'yellow'
    },
    {
      id: 'interviews',
      title: 'Interviews This Week',
      value: 5,
      icon: ClockIcon,
      color: 'purple'
    }
  ];

  const getDualRoleWidgets = (): DashboardWidget[] => [
    ...getJobSeekerWidgets().slice(0, 2),
    ...getEmployerWidgets().slice(0, 2)
  ];

  const getWidgetsForRole = (): DashboardWidget[] => {
    switch (userRole) {
      case 'job_seeker':
        return getJobSeekerWidgets();
      case 'employer':
        return getEmployerWidgets();
      case 'dual':
        return getDualRoleWidgets();
      default:
        return [];
    }
  };

  const getQuickActions = () => {
    const actions = [];
    
    if (canAccessFeature('canBrowseJobs')) {
      actions.push({
        title: 'Browse Jobs',
        description: 'Find your next opportunity',
        icon: BriefcaseIcon,
        color: 'blue',
        action: () => navigate('/jobs-hub?view=browse')
      });
    }

    if (canAccessFeature('canPostJobs')) {
      actions.push({
        title: 'Post New Job',
        description: 'Find the perfect candidate',
        icon: PlusIcon,
        color: 'green',
        action: () => navigate('/jobs-hub?view=post')
      });
    }

    actions.push({
      title: 'Update Profile',
      description: 'Keep your information current',
      icon: UserIcon,
      color: 'purple',
      action: () => navigate('/dashboard?view=profile')
    });

    actions.push({
      title: 'AI Assistant',
      description: 'Get help with your career',
      icon: DocumentTextIcon,
      color: 'indigo',
      action: () => navigate('/ai-assistant')
    });

    return actions;
  };

  const renderOverviewContent = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getWidgetsForRole().map((widget) => (
          <div key={widget.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-2 rounded-md bg-${widget.color}-100`}>
                <widget.icon className={`h-6 w-6 text-${widget.color}-600`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{widget.title}</p>
                <p className="text-2xl font-semibold text-gray-900">{widget.value}</p>
                {widget.trend && (
                  <p className={`text-sm ${widget.trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {widget.trend.isPositive ? '+' : '-'}{widget.trend.value}% from last month
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {getQuickActions().map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className={`p-4 rounded-lg border-2 border-dashed border-${action.color}-200 hover:border-${action.color}-400 hover:bg-${action.color}-50 transition-colors`}
            >
              <action.icon className={`h-8 w-8 text-${action.color}-600 mx-auto mb-2`} />
              <h4 className="font-medium text-gray-900">{action.title}</h4>
              <p className="text-sm text-gray-600">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {userRole === 'job_seeker' && (
            <>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Applied to Software Engineer at TechCorp</span>
                <span className="text-xs text-gray-400">2 hours ago</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Saved Frontend Developer position</span>
                <span className="text-xs text-gray-400">1 day ago</span>
              </div>
            </>
          )}
          {/* COMMENTED OUT FOR CORE FEATURES FOCUS */}
          {/* {userRole === 'employer' && (
            <>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">New application for Senior Developer role</span>
                <span className="text-xs text-gray-400">1 hour ago</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Posted new Marketing Manager position</span>
                <span className="text-xs text-gray-400">3 hours ago</span>
              </div>
            </>
          )} */}
        </div>
      </div>
    </div>
  );

  const renderApplicationsContent = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">My Applications</h3>
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-gray-900">Software Engineer</h4>
              <p className="text-sm text-gray-600">TechCorp Inc.</p>
              <p className="text-xs text-gray-500">Applied 2 days ago</p>
            </div>
            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
              Under Review
            </span>
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-gray-900">Frontend Developer</h4>
              <p className="text-sm text-gray-600">StartupXYZ</p>
              <p className="text-xs text-gray-500">Applied 1 week ago</p>
            </div>
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
              Interview Scheduled
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderJobsContent = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">My Posted Jobs</h3>
        <button
          onClick={() => navigate('/jobs-hub?view=post')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Post New Job
        </button>
      </div>
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-gray-900">Senior Developer</h4>
              <p className="text-sm text-gray-600">15 applications</p>
              <p className="text-xs text-gray-500">Posted 1 week ago</p>
            </div>
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
              Active
            </span>
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-gray-900">Marketing Manager</h4>
              <p className="text-sm text-gray-600">8 applications</p>
              <p className="text-xs text-gray-500">Posted 3 days ago</p>
            </div>
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfileContent = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Settings</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={user?.name || ''}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={user?.email || ''}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Role</label>
          <input
            type="text"
            value={userRole || 'Not set'}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            readOnly
          />
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'applications':
        return renderApplicationsContent();
      case 'jobs':
        return renderJobsContent();
      case 'profile':
        return renderProfileContent();
      case 'analytics':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Analytics</h3>
            <p className="text-gray-600">Analytics dashboard coming soon...</p>
          </div>
        );
      default:
        return renderOverviewContent();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name || 'User'}!
          </h1>
          <p className="mt-2 text-gray-600">
            {userRole === 'job_seeker' && 'Track your job applications and discover new opportunities.'}
            {/* COMMENTED OUT FOR CORE FEATURES FOCUS */}
            {/* {userRole === 'employer' && 'Manage your job postings and find the perfect candidates.'} */}
            {/* {userRole === 'dual' && 'Manage both your job search and recruitment activities.'} */}
          </p>
        </div>

        {renderContent()}
      </div>
    </div>
  );
};

export default SmartDashboard;