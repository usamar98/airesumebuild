import { db } from '../database/database.js';

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
    const { user_id, feature_name, action, metadata } = event;
    
    db.prepare(
      'INSERT INTO analytics (user_id, feature_name, action, metadata) VALUES (?, ?, ?, ?)'
    ).run(user_id || null, feature_name, action, metadata || null);
  }

  static async getFeatureUsageStats(days = 30): Promise<FeatureUsageStats[]> {
    const stats = db.prepare(`
      SELECT 
        feature_name,
        COUNT(*) as total_usage,
        COUNT(DISTINCT user_id) as unique_users,
        MAX(created_at) as last_used
      FROM analytics 
      WHERE created_at >= DATE('now', '-${days} days')
      GROUP BY feature_name
      ORDER BY total_usage DESC
    `).all();
    
    return stats as FeatureUsageStats[];
  }

  static async getUserEngagementStats(limit = 50): Promise<UserEngagementStats[]> {
    const stats = db.prepare(`
      SELECT 
        u.id as user_id,
        u.email as user_email,
        u.name as user_name,
        COUNT(a.id) as total_actions,
        MAX(a.created_at) as last_activity
      FROM users u
      LEFT JOIN analytics a ON u.id = a.user_id
      GROUP BY u.id, u.email, u.name
      ORDER BY total_actions DESC
      LIMIT ?
    `).all(limit);
    
    // Get favorite features for each user
    const enrichedStats = await Promise.all(
      (stats as any[]).map(async (stat) => {
        const favoriteFeatures = db.prepare(`
          SELECT feature_name, COUNT(*) as usage_count
          FROM analytics 
          WHERE user_id = ?
          GROUP BY feature_name
          ORDER BY usage_count DESC
          LIMIT 3
        `).all(stat.user_id);
        
        return {
          ...stat,
          favorite_features: (favoriteFeatures as any[]).map(f => f.feature_name)
        };
      })
    );
    
    return enrichedStats as UserEngagementStats[];
  }

  static async getPopularTemplates(days = 30): Promise<Array<{template_name: string; usage_count: number}>> {
    const templates = db.prepare(`
      SELECT 
        JSON_EXTRACT(metadata, '$.template_name') as template_name,
        COUNT(*) as usage_count
      FROM analytics 
      WHERE feature_name = 'template_usage' 
        AND created_at >= DATE('now', '-${days} days')
        AND JSON_EXTRACT(metadata, '$.template_name') IS NOT NULL
      GROUP BY template_name
      ORDER BY usage_count DESC
      LIMIT 10
    `).all();
    
    return templates as Array<{template_name: string; usage_count: number}>;
  }

  static async getPopularIndustries(days = 30): Promise<Array<{industry: string; usage_count: number}>> {
    const industries = db.prepare(`
      SELECT 
        JSON_EXTRACT(metadata, '$.industry') as industry,
        COUNT(*) as usage_count
      FROM analytics 
      WHERE feature_name IN ('template_usage', 'resume_generation')
        AND created_at >= DATE('now', '-${days} days')
        AND JSON_EXTRACT(metadata, '$.industry') IS NOT NULL
      GROUP BY industry
      ORDER BY usage_count DESC
      LIMIT 10
    `).all();
    
    return industries as Array<{industry: string; usage_count: number}>;
  }

  static async getDailyActiveUsers(days = 30): Promise<Array<{date: string; active_users: number}>> {
    const dailyStats = db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(DISTINCT user_id) as active_users
      FROM analytics 
      WHERE created_at >= DATE('now', '-${days} days')
        AND user_id IS NOT NULL
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `).all();
    
    return dailyStats as Array<{date: string; active_users: number}>;
  }

  static async getFeatureAdoptionRate(): Promise<Array<{feature_name: string; adoption_rate: number; total_users: number}>> {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').get();
    const totalUserCount = (totalUsers as any).count;
    
    const featureAdoption = db.prepare(`
      SELECT 
        feature_name,
        COUNT(DISTINCT user_id) as unique_users
      FROM analytics 
      WHERE user_id IS NOT NULL
      GROUP BY feature_name
      ORDER BY unique_users DESC
    `).all();
    
    return (featureAdoption as any[]).map(feature => ({
      feature_name: feature.feature_name,
      adoption_rate: totalUserCount > 0 ? (feature.unique_users / totalUserCount) * 100 : 0,
      total_users: feature.unique_users
    }));
  }

  static async getRecentActivity(limit = 100): Promise<Array<{
    id: number;
    user_email: string;
    user_name: string;
    feature_name: string;
    action: string;
    created_at: string;
    metadata?: any;
  }>> {
    const activities = db.prepare(`
      SELECT 
        a.id,
        u.email as user_email,
        u.name as user_name,
        a.feature_name,
        a.action,
        a.created_at,
        a.metadata
      FROM analytics a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT ?
    `).all(limit);
    
    return (activities as any[]).map(activity => ({
      ...activity,
      metadata: activity.metadata ? JSON.parse(activity.metadata) : null
    }));
  }

  static async exportUserData(userId: string): Promise<{
    user: any;
    analytics: AnalyticsEvent[];
  }> {
    const user = db.prepare('SELECT id, email, name, role, created_at, last_login FROM users WHERE id = ?').get(userId);
    const analytics = db.prepare('SELECT * FROM analytics WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    
    return {
      user,
      analytics: analytics as AnalyticsEvent[]
    };
  }
}