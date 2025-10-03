/**
 * Job Seeker Overview Dashboard Component
 * Professional overview with career metrics, application insights, job recommendations, and progress tracking
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useRoleManagement } from '../hooks/useRoleManagement';
import { isFeatureEnabled } from '../config/featureFlags';
import ComingSoon from '../components/ComingSoon';
import {
  BriefcaseIcon,
  ChartBarIcon,
  UserIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  StarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  PlusIcon,
  BellIcon,
  CalendarIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  LightBulbIcon,
  FlagIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

interface DashboardStats {
  totalApplications: number;
  pendingApplications: number;
  shortlistedApplications: number;
  rejectedApplications: number;
  savedJobs: number;
  profileViews: number;
  responseRate: number;
  avgResponseTime: number;
}

interface JobRecommendation {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  matchScore: number;
  postedDate: string;
  jobType: string;
  skills: string[];
}

interface ActivityItem {
  id: string;
  type: 'application' | 'view' | 'save' | 'interview' | 'offer';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
}

interface CareerMetric {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ComponentType<any>;
}

interface SkillProgress {
  skill: string;
  proficiency: number;
  marketDemand: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
}

const JobSeekerOverviewDashboard: React.FC = () => {
  const { user } = useSupabaseAuth();
  const { userRole } = useRoleManagement();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [jobRecommendations, setJobRecommendations] = useState<JobRecommendation[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [skillProgress, setSkillProgress] = useState<SkillProgress[]>([]);
  const [profileCompletion, setProfileCompletion] = useState(75);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Mock data - replace with actual Supabase calls
      const mockStats: DashboardStats = {
        totalApplications: 24,
        pendingApplications: 8,
        shortlistedApplications: 5,
        rejectedApplications: 11,
        savedJobs: 12,
        profileViews: 156,
        responseRate: 33.3,
        avgResponseTime: 3.2
      };

      const mockRecommendations: JobRecommendation[] = [
        {
          id: '1',
          title: 'Senior Frontend Developer',
          company: 'TechCorp',
          location: 'San Francisco, CA',
          salary: '$120k - $150k',
          matchScore: 95,
          postedDate: '2024-01-20',
          jobType: 'Full-time',
          skills: ['React', 'TypeScript', 'Node.js']
        },
        {
          id: '2',
          title: 'Full Stack Engineer',
          company: 'StartupXYZ',
          location: 'Remote',
          salary: '$100k - $130k',
          matchScore: 88,
          postedDate: '2024-01-19',
          jobType: 'Full-time',
          skills: ['JavaScript', 'Python', 'AWS']
        },
        {
          id: '3',
          title: 'React Developer',
          company: 'Digital Agency',
          location: 'New York, NY',
          salary: '$90k - $110k',
          matchScore: 82,
          postedDate: '2024-01-18',
          jobType: 'Contract',
          skills: ['React', 'Redux', 'CSS']
        }
      ];

      const mockActivities: ActivityItem[] = [
        {
          id: '1',
          type: 'application',
          title: 'Applied to Senior Frontend Developer',
          description: 'TechCorp - San Francisco, CA',
          timestamp: '2024-01-20T10:30:00Z',
          status: 'pending'
        },
        {
          id: '2',
          type: 'interview',
          title: 'Interview scheduled',
          description: 'StartupXYZ - Technical Interview',
          timestamp: '2024-01-19T15:00:00Z',
          status: 'scheduled'
        },
        {
          id: '3',
          type: 'view',
          title: 'Profile viewed by recruiter',
          description: 'Digital Agency HR Team',
          timestamp: '2024-01-19T09:15:00Z'
        },
        {
          id: '4',
          type: 'save',
          title: 'Saved job',
          description: 'Backend Developer at CloudTech',
          timestamp: '2024-01-18T14:20:00Z'
        }
      ];

      const mockSkillProgress: SkillProgress[] = [
        { skill: 'React', proficiency: 85, marketDemand: 'critical', progress: 15 },
        { skill: 'TypeScript', proficiency: 70, marketDemand: 'high', progress: 25 },
        { skill: 'Node.js', proficiency: 60, marketDemand: 'high', progress: 30 },
        { skill: 'Python', proficiency: 45, marketDemand: 'medium', progress: 40 }
      ];

      setStats(mockStats);
      setJobRecommendations(mockRecommendations);
      setRecentActivities(mockActivities);
      setSkillProgress(mockSkillProgress);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const careerMetrics: CareerMetric[] = [
    {
      label: 'Applications',
      value: stats?.totalApplications || 0,
      change: 12,
      trend: 'up',
      icon: BriefcaseIcon
    },
    {
      label: 'Response Rate',
      value: stats?.responseRate || 0,
      change: 5.2,
      trend: 'up',
      icon: ChartBarIcon
    },
    {
      label: 'Profile Views',
      value: stats?.profileViews || 0,
      change: 23,
      trend: 'up',
      icon: EyeIcon
    },
    {
      label: 'Saved Jobs',
      value: stats?.savedJobs || 0,
      change: -2,
      trend: 'down',
      icon: StarIcon
    }
  ];

  // Application status chart data
  const applicationStatusData = {
    labels: ['Pending', 'Shortlisted', 'Rejected'],
    datasets: [
      {
        data: [
          stats?.pendingApplications || 0,
          stats?.shortlistedApplications || 0,
          stats?.rejectedApplications || 0
        ],
        backgroundColor: ['#fbbf24', '#10b981', '#ef4444'],
        borderWidth: 0
      }
    ]
  };

  // Application trends chart data
  const applicationTrendsData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Applications',
        data: [3, 7, 5, 9],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      },
      {
        label: 'Responses',
        data: [1, 2, 2, 3],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4
      }
    ]
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getMarketDemandColor = (demand: string) => {
    switch (demand) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
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
      {!isFeatureEnabled('jobSeekerOverview') && (
        <ComingSoon
          title="Overview Dashboard"
          description="Your comprehensive career overview dashboard is coming soon! Track your job search progress, view analytics, and get personalized insights."
          variant="overlay"
        />
      )}
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Career Overview</h1>
              <p className="text-gray-600 mt-1">Track your job search progress and discover new opportunities</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">Profile Completion</div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${profileCompletion}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{profileCompletion}%</span>
                </div>
              </div>
              <Link
                to="/dashboard/profile"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Complete Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Career Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {careerMetrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{metric.label}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metric.label.includes('Rate') ? `${metric.value}%` : metric.value}
                  </p>
                  <div className={`flex items-center gap-1 text-sm ${
                    metric.trend === 'up' ? 'text-green-600' : 
                    metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    <ArrowTrendingUpIcon className={`h-4 w-4 ${metric.trend === 'down' ? 'rotate-180' : ''}`} />
                    <span>{metric.change > 0 ? '+' : ''}{metric.change}%</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <metric.icon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Application Analytics */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Application Analytics</h2>
                <Link 
                  to="/dashboard/applications"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                >
                  View All <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Application Status</h3>
                  <div className="h-48">
                    <Doughnut 
                      data={applicationStatusData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom'
                          }
                        }
                      }}
                    />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Weekly Trends</h3>
                  <div className="h-48">
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
              </div>
            </div>

            {/* Job Recommendations */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Recommended Jobs</h2>
                <Link 
                  to="/jobs-hub"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                >
                  Browse All <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
              <div className="space-y-4">
                {jobRecommendations.map((job) => (
                  <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-gray-900">{job.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchScoreColor(job.matchScore)}`}>
                            {job.matchScore}% match
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <BuildingOfficeIcon className="h-4 w-4" />
                            {job.company}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPinIcon className="h-4 w-4" />
                            {job.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <CurrencyDollarIcon className="h-4 w-4" />
                            {job.salary}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {job.skills.slice(0, 3).map((skill, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                          {job.skills.length > 3 && (
                            <span className="text-xs text-gray-500">+{job.skills.length - 3} more</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                          <StarIcon className="h-5 w-5" />
                        </button>
                        <Link
                          to={`/job-details/${job.id}`}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Apply
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Development */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Skill Development</h2>
                <Link 
                  to="/dashboard/profile"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                >
                  Manage Skills <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
              <div className="space-y-4">
                {skillProgress.map((skill, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-gray-900">{skill.skill}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMarketDemandColor(skill.marketDemand)}`}>
                          {skill.marketDemand} demand
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">{skill.proficiency}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${skill.proficiency}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Current Level</span>
                      <span>{skill.progress}% to next level</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  to="/dashboard/applications"
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <BriefcaseIcon className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-900">View Applications</span>
                </Link>
                <Link
                  to="/jobs-hub"
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <FireIcon className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-gray-900">Browse Jobs</span>
                </Link>
                <Link
                  to="/dashboard/profile"
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <UserIcon className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-gray-900">Update Profile</span>
                </Link>
                <Link
                  to="/ai-assistant"
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <LightBulbIcon className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-gray-900">AI Assistant</span>
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      activity.type === 'application' ? 'bg-blue-100' :
                      activity.type === 'interview' ? 'bg-green-100' :
                      activity.type === 'view' ? 'bg-purple-100' :
                      'bg-gray-100'
                    }`}>
                      {activity.type === 'application' && <BriefcaseIcon className="h-4 w-4 text-blue-600" />}
                      {activity.type === 'interview' && <CalendarIcon className="h-4 w-4 text-green-600" />}
                      {activity.type === 'view' && <EyeIcon className="h-4 w-4 text-purple-600" />}
                      {activity.type === 'save' && <StarIcon className="h-4 w-4 text-gray-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Career Goals */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Career Goals</h2>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FlagIcon className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Target Role</span>
                  </div>
                  <p className="text-sm text-blue-800">Senior Frontend Developer</p>
                  <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full w-3/4"></div>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">75% progress</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900">Salary Goal</span>
                  </div>
                  <p className="text-sm text-green-800">$120k - $150k</p>
                  <p className="text-xs text-green-700 mt-1">Current market range</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobSeekerOverviewDashboard;