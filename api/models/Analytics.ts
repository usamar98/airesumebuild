import { supabase } from '../database/supabase.js';

export interface AnalyticsEvent {
  id?: number;
  user_id?: string;
  event_type?: string;
  feature_name: string;
  action: string;
  metadata?: string; // JSON string
  created_at?: string;
}

export interface FeatureUsageStats {
  feature_name: string;
  total_usage: number;
  unique_users: number;
  last_used: string;
}

export interface UserEngagementStats {
  user_id: string;
  user_email: string;
  user_name: string;
  total_actions: number;
  last_activity: string;
  favorite_features: string[];
}

export class AnalyticsModel {
  static async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      const { user_id, feature_name, action, metadata } = event;
      
      const { error } = await supabase
        .from('analytics_events')
        .insert({
          user_id: user_id || null,
          feature_name,
          action,
          metadata: metadata ? JSON.parse(metadata) : null
        });
      
      if (error) {
        console.error('Error tracking analytics event:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to track analytics event:', error);
      // Don't throw error to prevent breaking the main flow
    }
  }

  static async getFeatureUsageStats(days = 30): Promise<FeatureUsageStats[]> {
    try {
      
      const { data, error } = await supabase
        .from('analytics_events')
        .select('feature_name, created_at, user_id')
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());
      
      if (error) throw error;
      
      // Process data to get stats
      const statsMap = new Map<string, { total_usage: number; unique_users: Set<string>; last_used: string }>();
      
      data?.forEach(row => {
        const existing = statsMap.get(row.feature_name) || {
          total_usage: 0,
          unique_users: new Set(),
          last_used: row.created_at
        };
        
        existing.total_usage++;
        if (row.user_id) existing.unique_users.add(row.user_id);
        if (row.created_at > existing.last_used) existing.last_used = row.created_at;
        
        statsMap.set(row.feature_name, existing);
      });
      
      return Array.from(statsMap.entries())
        .map(([feature_name, stats]) => ({
          feature_name,
          total_usage: stats.total_usage,
          unique_users: stats.unique_users.size,
          last_used: stats.last_used
        }))
        .sort((a, b) => b.total_usage - a.total_usage);
    } catch (error) {
      console.error('Error getting feature usage stats:', error);
      return [];
    }
  }

  static async getUserEngagementStats(limit = 50): Promise<UserEngagementStats[]> {
    try {
      
      // Get users from auth.users table
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
      if (usersError) throw usersError;
      
      // Get analytics data
      const { data: analytics, error: analyticsError } = await supabase
        .from('analytics_events')
        .select('user_id, feature_name, created_at');
      if (analyticsError) throw analyticsError;
      
      // Process user engagement stats
      const userStats = users.users.slice(0, limit).map(user => {
        const userAnalytics = analytics?.filter(a => a.user_id === user.id) || [];
        const featureCount = new Map<string, number>();
        
        userAnalytics.forEach(a => {
          featureCount.set(a.feature_name, (featureCount.get(a.feature_name) || 0) + 1);
        });
        
        const favoriteFeatures = Array.from(featureCount.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([feature]) => feature);
        
        const lastActivity = userAnalytics.length > 0 
          ? Math.max(...userAnalytics.map(a => new Date(a.created_at).getTime()))
          : 0;
        
        return {
          user_id: user.id,
          user_email: user.email || '',
          user_name: user.user_metadata?.name || user.email || '',
          total_actions: userAnalytics.length,
          last_activity: lastActivity > 0 ? new Date(lastActivity).toISOString() : '',
          favorite_features: favoriteFeatures
        };
      });
      
      return userStats.sort((a, b) => b.total_actions - a.total_actions);
    } catch (error) {
      console.error('Error getting user engagement stats:', error);
      return [];
    }
  }

  static async getPopularTemplates(days = 30): Promise<Array<{template_name: string; usage_count: number}>> {
    try {
      
      const { data, error } = await supabase
        .from('analytics_events')
        .select('metadata')
        .eq('feature_name', 'template_usage')
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());
      
      if (error) throw error;
      
      const templateCount = new Map<string, number>();
      
      data?.forEach(row => {
        if (row.metadata && typeof row.metadata === 'object' && 'template_name' in row.metadata) {
          const templateName = row.metadata.template_name as string;
          templateCount.set(templateName, (templateCount.get(templateName) || 0) + 1);
        }
      });
      
      return Array.from(templateCount.entries())
        .map(([template_name, usage_count]) => ({ template_name, usage_count }))
        .sort((a, b) => b.usage_count - a.usage_count)
        .slice(0, 10);
    } catch (error) {
      console.error('Error getting popular templates:', error);
      return [];
    }
  }

  static async getPopularIndustries(days = 30): Promise<Array<{industry: string; usage_count: number}>> {
    try {
      
      const { data, error } = await supabase
        .from('analytics_events')
        .select('metadata')
        .in('feature_name', ['template_usage', 'resume_generation'])
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());
      
      if (error) throw error;
      
      const industryCount = new Map<string, number>();
      
      data?.forEach(row => {
        if (row.metadata && typeof row.metadata === 'object' && 'industry' in row.metadata) {
          const industry = row.metadata.industry as string;
          industryCount.set(industry, (industryCount.get(industry) || 0) + 1);
        }
      });
      
      return Array.from(industryCount.entries())
        .map(([industry, usage_count]) => ({ industry, usage_count }))
        .sort((a, b) => b.usage_count - a.usage_count)
        .slice(0, 10);
    } catch (error) {
      console.error('Error getting popular industries:', error);
      return [];
    }
  }

  static async getDailyActiveUsers(days = 30): Promise<Array<{date: string; active_users: number}>> {
    try {
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('analytics_events')
        .select('user_id, created_at')
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());
      
      if (error) throw error;
      
      const dailyUsers = new Map<string, Set<string>>();
      
      data?.forEach(row => {
        const date = new Date(row.created_at).toISOString().split('T')[0];
        if (!dailyUsers.has(date)) {
          dailyUsers.set(date, new Set());
        }
        dailyUsers.get(date)?.add(row.user_id);
      });
      
      return Array.from(dailyUsers.entries())
        .map(([date, userSet]) => ({ date, active_users: userSet.size }))
        .sort((a, b) => b.date.localeCompare(a.date));
    } catch (error) {
      console.error('Error getting daily active users:', error);
      return [];
    }
  }

  static async getFeatureAdoptionRate(feature: string, days = 30): Promise<{adoption_rate: number; total_users: number; users_using_feature: number}> {
    try {
      const supabase = getSupabaseClient();
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      
      // Get total unique users
      const { data: totalUsersData, error: totalError } = await supabase
        .from('analytics_events')
        .select('user_id')
        .gte('created_at', startDate);
      
      if (totalError) throw totalError;
      
      const totalUsers = new Set(totalUsersData?.map(row => row.user_id) || []).size;
      
      // Get users using specific feature
      const { data: featureUsersData, error: featureError } = await supabase
        .from('analytics_events')
        .select('user_id')
        .eq('feature_name', feature)
        .gte('created_at', startDate);
      
      if (featureError) throw featureError;
      
      const usersUsingFeature = new Set(featureUsersData?.map(row => row.user_id) || []).size;
      
      const adoption_rate = totalUsers > 0 ? (usersUsingFeature / totalUsers) * 100 : 0;
      
      return {
        adoption_rate,
        total_users: totalUsers,
        users_using_feature: usersUsingFeature
      };
    } catch (error) {
      console.error('Error getting feature adoption rate:', error);
      return {
        adoption_rate: 0,
        total_users: 0,
        users_using_feature: 0
      };
    }
  }

  static async getRecentActivity(limit = 50): Promise<Array<AnalyticsEvent>> {
    try {
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('analytics_events')
        .select('id, user_id, feature_name, action, metadata, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return (data || []).map(activity => ({
        ...activity,
        metadata: typeof activity.metadata === 'string' ? JSON.parse(activity.metadata) : activity.metadata
      })) as AnalyticsEvent[];
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }
  }

  static async exportUserData(userId: string): Promise<{
    user_info: any;
    analytics_data: AnalyticsEvent[];
  }> {
    try {
      const supabase = getSupabaseClient();
      
      // Get user info from auth.users
      const { data: userInfo, error: userError } = await supabase.auth.admin.getUserById(userId);
      
      if (userError) {
        console.error('Error getting user info:', userError);
      }
      
      // Get user's analytics data
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('analytics_events')
        .select('id, user_id, feature_name, action, metadata, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (analyticsError) throw analyticsError;
      
      return {
        user_info: userInfo?.user || null,
        analytics_data: (analyticsData || []).map(activity => ({
          ...activity,
          metadata: typeof activity.metadata === 'string' ? JSON.parse(activity.metadata) : activity.metadata
        })) as AnalyticsEvent[]
      };
    } catch (error) {
      console.error('Error exporting user data:', error);
      return {
        user_info: null,
        analytics_data: []
      };
    }
  }
}