import { createClient } from '@supabase/supabase-js';
import { AggregatedAnalytics, ServiceResponse } from './BasePlatformService.ts';

// Aggregation period types
type AggregationPeriod = 'daily' | 'weekly' | 'monthly';

// Raw analytics data from database
interface RawAnalyticsRecord {
  id: string;
  user_id: string;
  platform_type: string;
  platform_name: string;
  job_posting_id?: string;
  metric_name: string;
  metric_value: number;
  metadata?: Record<string, any>;
  recorded_at: string;
  created_at: string;
}

// Aggregation configuration
interface AggregationConfig {
  batchSize: number;
  maxRetries: number;
  retryDelayMs: number;
  enableRealTimeUpdates: boolean;
}

// Aggregation result
interface AggregationResult {
  processed: number;
  errors: number;
  skipped: number;
  duration: number;
  periodType: AggregationPeriod;
  startDate: string;
  endDate: string;
}

export class DataAggregator {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  private config: AggregationConfig;

  constructor(config: Partial<AggregationConfig> = {}) {
    this.config = {
      batchSize: config.batchSize || 1000,
      maxRetries: config.maxRetries || 3,
      retryDelayMs: config.retryDelayMs || 1000,
      enableRealTimeUpdates: config.enableRealTimeUpdates || true
    };
  }

  /**
   * Aggregate analytics data for a specific period
   */
  async aggregateData(
    userId: string,
    periodType: AggregationPeriod,
    startDate: string,
    endDate: string
  ): Promise<ServiceResponse<AggregationResult>> {
    const startTime = Date.now();
    let processed = 0;
    let errors = 0;
    let skipped = 0;

    try {
      console.log(`Starting ${periodType} aggregation for user ${userId} from ${startDate} to ${endDate}`);

      // Get raw analytics data for the period
      const rawDataResponse = await this.getRawAnalyticsData(userId, startDate, endDate);
      if (!rawDataResponse.success || !rawDataResponse.data) {
        return {
          success: false,
          error: rawDataResponse.error || 'Failed to fetch raw analytics data'
        };
      }

      const rawData = rawDataResponse.data;
      console.log(`Found ${rawData.length} raw analytics records to process`);

      // Group data by platform and job posting
      const groupedData = this.groupRawData(rawData, periodType, startDate, endDate);

      // Process each group
      for (const group of groupedData) {
        try {
          const aggregationResponse = await this.processAggregationGroup(group);
          if (aggregationResponse.success) {
            processed++;
          } else {
            errors++;
            console.error(`Failed to process aggregation group:`, aggregationResponse.error);
          }
        } catch (error) {
          errors++;
          console.error(`Error processing aggregation group:`, error);
        }
      }

      const duration = Date.now() - startTime;
      const result: AggregationResult = {
        processed,
        errors,
        skipped,
        duration,
        periodType,
        startDate,
        endDate
      };

      console.log(`Aggregation completed:`, result);

      return { success: true, data: result };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Aggregation failed after ${duration}ms:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown aggregation error',
        metadata: { processed, errors, skipped, duration }
      };
    }
  }

  /**
   * Aggregate data for all users and all periods
   */
  async aggregateAllData(dateRange?: { start: string; end: string }): Promise<ServiceResponse<AggregationResult[]>> {
    try {
      const results: AggregationResult[] = [];
      const now = new Date();
      const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const defaultEndDate = now.toISOString().split('T')[0];

      const startDate = dateRange?.start || defaultStartDate;
      const endDate = dateRange?.end || defaultEndDate;

      // Get all users with analytics data
      const usersResponse = await this.getUsersWithAnalyticsData(startDate, endDate);
      if (!usersResponse.success || !usersResponse.data) {
        return {
          success: false,
          error: usersResponse.error || 'Failed to get users with analytics data'
        };
      }

      const users = usersResponse.data;
      console.log(`Found ${users.length} users with analytics data to aggregate`);

      // Process each user for each period type
      const periods: AggregationPeriod[] = ['daily', 'weekly', 'monthly'];
      
      for (const userId of users) {
        for (const periodType of periods) {
          try {
            const aggregationResponse = await this.aggregateData(userId, periodType, startDate, endDate);
            if (aggregationResponse.success && aggregationResponse.data) {
              results.push(aggregationResponse.data);
            }
          } catch (error) {
            console.error(`Failed to aggregate ${periodType} data for user ${userId}:`, error);
          }
        }
      }

      return { success: true, data: results };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in aggregateAllData'
      };
    }
  }

  /**
   * Get aggregated analytics for dashboard consumption
   */
  async getAggregatedAnalytics(
    userId: string,
    periodType: AggregationPeriod,
    dateRange?: { start: string; end: string }
  ): Promise<ServiceResponse<AggregatedAnalytics[]>> {
    try {
      const now = new Date();
      const startDate = dateRange?.start || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = dateRange?.end || now.toISOString();

      const { data, error } = await this.supabase
        .from('platform_analytics_aggregated')
        .select('*')
        .eq('user_id', userId)
        .eq('period_type', periodType)
        .gte('period_start', startDate)
        .lte('period_end', endDate)
        .order('period_start', { ascending: false });

      if (error) {
        throw error;
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get aggregated analytics'
      };
    }
  }

  /**
   * Get platform breakdown for dashboard
   */
  async getPlatformBreakdown(
    userId: string,
    dateRange?: { start: string; end: string }
  ): Promise<ServiceResponse<Array<{ platform_name: string; applications: number; percentage: number }>>> {
    try {
      const now = new Date();
      const startDate = dateRange?.start || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = dateRange?.end || now.toISOString();

      const { data, error } = await this.supabase
        .from('platform_analytics_aggregated')
        .select('platform_name, total_applications')
        .eq('user_id', userId)
        .eq('period_type', 'daily')
        .gte('period_start', startDate)
        .lte('period_end', endDate);

      if (error) {
        throw error;
      }

      // Aggregate by platform
      const platformMap = new Map<string, number>();
      let totalApplications = 0;

      (data || []).forEach(record => {
        const existing = platformMap.get(record.platform_name) || 0;
        const applications = record.total_applications || 0;
        platformMap.set(record.platform_name, existing + applications);
        totalApplications += applications;
      });

      // Convert to array with percentages
      const breakdown = Array.from(platformMap.entries()).map(([platform_name, applications]) => ({
        platform_name,
        applications,
        percentage: totalApplications > 0 ? (applications / totalApplications) * 100 : 0
      })).sort((a, b) => b.applications - a.applications);

      return { success: true, data: breakdown };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get platform breakdown'
      };
    }
  }

  /**
   * Update real-time analytics
   */
  async updateRealTimeAnalytics(
    userId: string,
    platformType: string,
    platformName: string,
    metricName: string,
    metricValue: number,
    jobPostingId?: string
  ): Promise<ServiceResponse> {
    try {
      if (!this.config.enableRealTimeUpdates) {
        return { success: true }; // Skip if real-time updates are disabled
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];

      // Get or create today's aggregated record
      const { data: existingRecord, error: fetchError } = await this.supabase
        .from('platform_analytics_aggregated')
        .select('*')
        .eq('user_id', userId)
        .eq('platform_type', platformType)
        .eq('platform_name', platformName)
        .eq('period_type', 'daily')
        .eq('period_start', today)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (existingRecord) {
        // Update existing record
        const updates: any = { updated_at: now.toISOString() };

        switch (metricName) {
          case 'applications':
          case 'total_applications':
            updates.total_applications = (existingRecord.total_applications || 0) + metricValue;
            break;
          case 'views':
          case 'total_views':
            updates.total_views = (existingRecord.total_views || 0) + metricValue;
            break;
          case 'clicks':
          case 'total_clicks':
            updates.total_clicks = (existingRecord.total_clicks || 0) + metricValue;
            break;
        }

        // Recalculate conversion rate
        if (updates.total_views && updates.total_applications) {
          updates.conversion_rate = (updates.total_applications / updates.total_views) * 100;
        }

        const { error: updateError } = await this.supabase
          .from('platform_analytics_aggregated')
          .update(updates)
          .eq('id', existingRecord.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        // Create new record
        const newRecord = {
          user_id: userId,
          platform_type: platformType,
          platform_name: platformName,
          job_posting_id: jobPostingId,
          period_type: 'daily' as const,
          period_start: today,
          period_end: today,
          total_applications: metricName.includes('application') ? metricValue : 0,
          total_views: metricName.includes('view') ? metricValue : 0,
          total_clicks: metricName.includes('click') ? metricValue : 0,
          conversion_rate: 0,
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        };

        const { error: insertError } = await this.supabase
          .from('platform_analytics_aggregated')
          .insert(newRecord);

        if (insertError) {
          throw insertError;
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update real-time analytics'
      };
    }
  }

  /**
   * Get raw analytics data for a period
   */
  private async getRawAnalyticsData(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<ServiceResponse<RawAnalyticsRecord[]>> {
    try {
      const { data, error } = await this.supabase
        .from('platform_analytics_raw')
        .select('*')
        .eq('user_id', userId)
        .gte('recorded_at', startDate)
        .lte('recorded_at', endDate)
        .order('recorded_at', { ascending: true });

      if (error) {
        throw error;
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get raw analytics data'
      };
    }
  }

  /**
   * Group raw data for aggregation
   */
  private groupRawData(
    rawData: RawAnalyticsRecord[],
    periodType: AggregationPeriod,
    startDate: string,
    endDate: string
  ): Array<{
    user_id: string;
    platform_type: string;
    platform_name: string;
    job_posting_id?: string;
    period_start: string;
    period_end: string;
    records: RawAnalyticsRecord[];
  }> {
    const groups = new Map<string, {
      user_id: string;
      platform_type: string;
      platform_name: string;
      job_posting_id?: string;
      period_start: string;
      period_end: string;
      records: RawAnalyticsRecord[];
    }>();

    rawData.forEach(record => {
      const periodDates = this.calculatePeriodDates(record.recorded_at, periodType);
      const groupKey = `${record.user_id}:${record.platform_type}:${record.platform_name}:${record.job_posting_id || 'null'}:${periodDates.start}`;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          user_id: record.user_id,
          platform_type: record.platform_type,
          platform_name: record.platform_name,
          job_posting_id: record.job_posting_id,
          period_start: periodDates.start,
          period_end: periodDates.end,
          records: []
        });
      }

      groups.get(groupKey)!.records.push(record);
    });

    return Array.from(groups.values());
  }

  /**
   * Process a single aggregation group
   */
  private async processAggregationGroup(group: {
    user_id: string;
    platform_type: string;
    platform_name: string;
    job_posting_id?: string;
    period_start: string;
    period_end: string;
    records: RawAnalyticsRecord[];
  }): Promise<ServiceResponse> {
    try {
      // Calculate aggregated metrics
      const metrics = {
        total_applications: 0,
        total_views: 0,
        total_clicks: 0,
        conversion_rate: 0
      };

      const metadata: Record<string, any> = {};

      group.records.forEach(record => {
        switch (record.metric_name) {
          case 'applications':
          case 'total_applications':
            metrics.total_applications += record.metric_value;
            break;
          case 'views':
          case 'total_views':
            metrics.total_views += record.metric_value;
            break;
          case 'clicks':
          case 'total_clicks':
            metrics.total_clicks += record.metric_value;
            break;
        }

        // Merge metadata
        if (record.metadata) {
          Object.assign(metadata, record.metadata);
        }
      });

      // Calculate conversion rate
      if (metrics.total_views > 0) {
        metrics.conversion_rate = (metrics.total_applications / metrics.total_views) * 100;
      }

      // Check if record already exists
      const { data: existingRecord, error: fetchError } = await this.supabase
        .from('platform_analytics_aggregated')
        .select('id')
        .eq('user_id', group.user_id)
        .eq('platform_type', group.platform_type)
        .eq('platform_name', group.platform_name)
        .eq('period_start', group.period_start)
        .eq('period_end', group.period_end)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      const aggregatedRecord = {
        user_id: group.user_id,
        platform_type: group.platform_type,
        platform_name: group.platform_name,
        job_posting_id: group.job_posting_id,
        period_type: this.getPeriodTypeFromDates(group.period_start, group.period_end),
        period_start: group.period_start,
        period_end: group.period_end,
        ...metrics,
        metadata,
        updated_at: new Date().toISOString()
      };

      if (existingRecord) {
        // Update existing record
        const { error: updateError } = await this.supabase
          .from('platform_analytics_aggregated')
          .update(aggregatedRecord)
          .eq('id', existingRecord.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        // Insert new record
        const { error: insertError } = await this.supabase
          .from('platform_analytics_aggregated')
          .insert({
            ...aggregatedRecord,
            created_at: new Date().toISOString()
          });

        if (insertError) {
          throw insertError;
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process aggregation group'
      };
    }
  }

  /**
   * Calculate period start and end dates
   */
  private calculatePeriodDates(recordedAt: string, periodType: AggregationPeriod): { start: string; end: string } {
    const date = new Date(recordedAt);

    switch (periodType) {
      case 'daily':
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
        return {
          start: dayStart.toISOString().split('T')[0],
          end: dayEnd.toISOString().split('T')[0]
        };

      case 'weekly':
        const dayOfWeek = date.getDay();
        const weekStart = new Date(date.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
        return {
          start: weekStart.toISOString().split('T')[0],
          end: weekEnd.toISOString().split('T')[0]
        };

      case 'monthly':
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        return {
          start: monthStart.toISOString().split('T')[0],
          end: monthEnd.toISOString().split('T')[0]
        };

      default:
        throw new Error(`Unsupported period type: ${periodType}`);
    }
  }

  /**
   * Determine period type from date range
   */
  private getPeriodTypeFromDates(startDate: string, endDate: string): AggregationPeriod {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return 'daily';
    if (diffDays <= 7) return 'weekly';
    return 'monthly';
  }

  /**
   * Get users with analytics data in the specified period
   */
  private async getUsersWithAnalyticsData(startDate: string, endDate: string): Promise<ServiceResponse<string[]>> {
    try {
      const { data, error } = await this.supabase
        .from('platform_analytics_raw')
        .select('user_id')
        .gte('recorded_at', startDate)
        .lte('recorded_at', endDate);

      if (error) {
        throw error;
      }

      // Get unique user IDs
      const uniqueUserIds = [...new Set((data || []).map(record => record.user_id))];

      return { success: true, data: uniqueUserIds };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get users with analytics data'
      };
    }
  }
}