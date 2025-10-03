/**
 * Company Analytics Dashboard Component
 * Advanced analytics dashboard with real platform integration, interactive charts, performance metrics, and real-time updates
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useRoleManagement } from '../hooks/useRoleManagement';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  TimeScale
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UsersIcon,
  BriefcaseIcon,
  ClockIcon,
  CurrencyDollarIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  CalendarDaysIcon,
  AdjustmentsHorizontalIcon,
  EyeIcon,
  ShareIcon,
  CheckBadgeIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon as ClockIconSolid,
  Cog6ToothIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  TimeScale
);

interface AnalyticsMetric {
  id: string;
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ComponentType<any>;
  color: string;
}

interface ChartData {
  labels: string[];
  datasets: any[];
}

interface PlatformConfig {
  id: string;
  platform_type: string;
  platform_name: string;
  is_active: boolean;
  last_sync: string | null;
  config: any;
}

interface SyncStatus {
  platform_type: string;
  platform_name: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  last_sync: string | null;
  next_sync: string | null;
  error_message?: string;
}

interface DashboardData {
  period: string;
  aggregation: string;
  date_range: {
    start: string;
    end: string;
  };
  aggregated_data: any[];
  platform_breakdown: any[];
  sync_statuses: SyncStatus[];
}

const CompanyAnalyticsDashboard: React.FC = () => {
  const { user, supabase } = useSupabaseAuth();
  const { userRole, canAccessFeature } = useRoleManagement();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('30d');
  const [aggregation, setAggregation] = useState('daily');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['applications', 'views', 'hires']);

  // Analytics data state
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [applicationTrends, setApplicationTrends] = useState<ChartData | null>(null);
  const [sourceBreakdown, setSourceBreakdown] = useState<ChartData | null>(null);
  const [hiringFunnel, setHiringFunnel] = useState<ChartData | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<ChartData | null>(null);
  
  // Platform integration state
  const [platformConfigs, setPlatformConfigs] = useState<PlatformConfig[]>([]);
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Auto-refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && !loading) {
        fetchDashboardData(true); // Silent refresh
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [user, loading, dateRange, aggregation]);

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user, dateRange, aggregation]);

  const fetchPlatformConfigs = async () => {
    try {
      if (!supabase) {
        console.warn('Supabase client not available yet');
        return;
      }
      
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return;

      const response = await fetch('/api/platform-analytics/configs', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPlatformConfigs(data.configs || []);
      }
    } catch (error) {
      console.error('Error fetching platform configs:', error);
    }
  };

  const fetchDashboardData = async (silent = false) => {
    try {
      if (!supabase) {
        console.warn('Supabase client not available yet');
        return;
      }
      
      if (!silent) setRefreshing(true);
      
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return;

      const params = new URLSearchParams({
        period: dateRange,
        aggregation: aggregation
      });

      const response = await fetch(`/api/platform-analytics/dashboard?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data: DashboardData = await response.json();
        setDashboardData(data);
        setSyncStatuses(data.sync_statuses || []);
        setLastUpdated(new Date());
        
        // Process dashboard data into chart formats
        processDashboardData(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      if (!silent) setRefreshing(false);
    }
  };

  const processDashboardData = (data: DashboardData) => {
    // Process aggregated data into metrics
    const processedMetrics: AnalyticsMetric[] = [
      {
        id: 'total-applications',
        title: 'Total Applications',
        value: data.aggregated_data.reduce((sum, item) => sum + (item.applications || 0), 0),
        change: calculateChange(data.aggregated_data, 'applications'),
        changeType: calculateChange(data.aggregated_data, 'applications') >= 0 ? 'increase' : 'decrease',
        icon: UsersIcon,
        color: 'blue'
      },
      {
        id: 'website-views',
        title: 'Website Views',
        value: data.aggregated_data.reduce((sum, item) => sum + (item.page_views || 0), 0),
        change: calculateChange(data.aggregated_data, 'page_views'),
        changeType: calculateChange(data.aggregated_data, 'page_views') >= 0 ? 'increase' : 'decrease',
        icon: EyeIcon,
        color: 'green'
      },
      {
        id: 'referrals',
        title: 'Referrals',
        value: data.aggregated_data.reduce((sum, item) => sum + (item.referrals || 0), 0),
        change: calculateChange(data.aggregated_data, 'referrals'),
        changeType: calculateChange(data.aggregated_data, 'referrals') >= 0 ? 'increase' : 'decrease',
        icon: ShareIcon,
        color: 'purple'
      },
      {
        id: 'conversion-rate',
        title: 'Conversion Rate',
        value: calculateConversionRate(data.aggregated_data) + '%',
        change: calculateConversionChange(data.aggregated_data),
        changeType: calculateConversionChange(data.aggregated_data) >= 0 ? 'increase' : 'decrease',
        icon: FunnelIcon,
        color: 'yellow'
      },
      {
        id: 'active-platforms',
        title: 'Active Platforms',
        value: data.sync_statuses.filter(s => s.status !== 'failed').length,
        change: 0,
        changeType: 'neutral',
        icon: Cog6ToothIcon,
        color: 'indigo'
      },
      {
        id: 'last-sync',
        title: 'Last Sync',
        value: getLastSyncTime(data.sync_statuses),
        change: 0,
        changeType: 'neutral',
        icon: ClockIconSolid,
        color: 'gray'
      }
    ];

    setMetrics(processedMetrics);

    // Process trends data
    const trendLabels = data.aggregated_data.map(item => 
      new Date(item.period_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );

    const trendsData: ChartData = {
      labels: trendLabels,
      datasets: [
        {
          label: 'Website Views',
          data: data.aggregated_data.map(item => item.page_views || 0),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        },
        {
          label: 'Applications',
          data: data.aggregated_data.map(item => item.applications || 0),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4
        },
        {
          label: 'Referrals',
          data: data.aggregated_data.map(item => item.referrals || 0),
          borderColor: 'rgb(139, 92, 246)',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          tension: 0.4
        }
      ]
    };

    setApplicationTrends(trendsData);

    // Process platform breakdown
    const platformData: ChartData = {
      labels: data.platform_breakdown.map(item => item.platform_name),
      datasets: [
        {
          data: data.platform_breakdown.map(item => item.total_events || 0),
          backgroundColor: [
            '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }
      ]
    };

    setSourceBreakdown(platformData);
  };

  const calculateChange = (data: any[], field: string): number => {
    if (data.length < 2) return 0;
    const current = data[data.length - 1][field] || 0;
    const previous = data[data.length - 2][field] || 0;
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const calculateConversionRate = (data: any[]): string => {
    const totalViews = data.reduce((sum, item) => sum + (item.page_views || 0), 0);
    const totalApplications = data.reduce((sum, item) => sum + (item.applications || 0), 0);
    if (totalViews === 0) return '0.0';
    return ((totalApplications / totalViews) * 100).toFixed(1);
  };

  const calculateConversionChange = (data: any[]): number => {
    if (data.length < 2) return 0;
    const currentRate = calculateConversionRate([data[data.length - 1]]);
    const previousRate = calculateConversionRate([data[data.length - 2]]);
    return parseFloat(currentRate) - parseFloat(previousRate);
  };

  const getLastSyncTime = (statuses: SyncStatus[]): string => {
    const lastSync = statuses
      .filter(s => s.last_sync)
      .sort((a, b) => new Date(b.last_sync!).getTime() - new Date(a.last_sync!).getTime())[0];
    
    if (!lastSync) return 'Never';
    
    const diff = Date.now() - new Date(lastSync.last_sync!).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const fetchAnalyticsData = async () => {
    try {
      if (!supabase) {
        console.warn('Supabase client not available yet');
        return;
      }
      
      setLoading(true);
      await Promise.all([
        fetchPlatformConfigs(),
        fetchDashboardData()
      ]);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async (platformType: string, platformName: string) => {
    try {
      if (!supabase) {
        console.warn('Supabase client not available yet');
        return;
      }
      
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return;

      const response = await fetch(`/api/platform-analytics/sync/${platformType}/${platformName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Update sync status to running
        setSyncStatuses(prev => prev.map(status => 
          status.platform_type === platformType && status.platform_name === platformName
            ? { ...status, status: 'running' }
            : status
        ));
        
        // Refresh data after a short delay
        setTimeout(() => fetchDashboardData(true), 2000);
      }
    } catch (error) {
      console.error('Error triggering manual sync:', error);
    }
  };

  const getPlatformStatusIcon = (status: SyncStatus) => {
    switch (status.status) {
      case 'running':
        return <ArrowPathIcon className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircleIcon className="h-4 w-4 text-red-600" />;
      default:
        return <ClockIconSolid className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPlatformStatusColor = (status: SyncStatus) => {
    switch (status.status) {
      case 'running':
        return 'bg-blue-50 border-blue-200';
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getMetricIcon = (metric: AnalyticsMetric) => {
    const Icon = metric.icon;
    const colorClasses = {
      blue: 'text-blue-600 bg-blue-100',
      green: 'text-green-600 bg-green-100',
      yellow: 'text-yellow-600 bg-yellow-100',
      purple: 'text-purple-600 bg-purple-100',
      red: 'text-red-600 bg-red-100',
      indigo: 'text-indigo-600 bg-indigo-100',
      gray: 'text-gray-600 bg-gray-100'
    };

    return (
      <div className={`p-3 rounded-lg ${colorClasses[metric.color as keyof typeof colorClasses]}`}>
        <Icon className="h-6 w-6" />
      </div>
    );
  };

  const getChangeIndicator = (metric: AnalyticsMetric) => {
    if (metric.changeType === 'neutral') {
      return <div className="text-gray-500 text-sm">-</div>;
    }
    
    const isPositive = metric.changeType === 'increase';
    const Icon = isPositive ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
    const colorClass = isPositive ? 'text-green-600' : 'text-red-600';

    return (
      <div className={`flex items-center gap-1 ${colorClass}`}>
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{Math.abs(metric.change).toFixed(1)}%</span>
      </div>
    );
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
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
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Platform Analytics Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Track your platform performance and optimize your recruitment strategy
              </p>
              {lastUpdated && (
                <p className="mt-1 text-xs text-gray-400">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <select
                value={aggregation}
                onChange={(e) => setAggregation(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <button 
                onClick={() => fetchDashboardData()}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Platform Status Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Platform Status</h2>
            <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Platform
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {syncStatuses.map((status) => (
              <div key={`${status.platform_type}-${status.platform_name}`} 
                   className={`border rounded-lg p-4 ${getPlatformStatusColor(status)}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getPlatformStatusIcon(status)}
                    <span className="font-medium text-gray-900 capitalize">
                      {status.platform_name.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 capitalize">{status.platform_type}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Status: <span className="capitalize">{status.status}</span></p>
                  {status.last_sync && (
                    <p>Last sync: {new Date(status.last_sync).toLocaleString()}</p>
                  )}
                  {status.error_message && (
                    <p className="text-red-600 text-xs mt-1">{status.error_message}</p>
                  )}
                </div>
                {status.status !== 'running' && (
                  <button
                    onClick={() => handleManualSync(status.platform_type, status.platform_name)}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Sync Now
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          {metrics.map((metric) => (
            <div key={metric.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                {getMetricIcon(metric)}
                {getChangeIndicator(metric)}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                <p className="text-sm text-gray-500">{metric.title}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Platform Trends */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Platform Performance Trends</h3>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View Details
              </button>
            </div>
            <div className="h-80">
              {applicationTrends && (
                <Line data={applicationTrends} options={chartOptions} />
              )}
            </div>
          </div>

          {/* Platform Breakdown */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Platform Activity Breakdown</h3>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View Details
              </button>
            </div>
            <div className="h-80">
              {sourceBreakdown && (
                <Doughnut data={sourceBreakdown} options={doughnutOptions} />
              )}
            </div>
          </div>
        </div>

        {/* Real-time Activity Feed */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Real-time Platform Activity</h3>
          <div className="space-y-4">
            {dashboardData?.aggregated_data.slice(-5).reverse().map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <ChartBarIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Platform activity recorded
                  </p>
                  <p className="text-xs text-gray-500">
                    {activity.page_views || 0} views, {activity.applications || 0} applications • {new Date(activity.period_start).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )) || (
              <div className="text-center py-8 text-gray-500">
                <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No recent activity data available</p>
                <p className="text-sm">Configure your platforms to start tracking analytics</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyAnalyticsDashboard;