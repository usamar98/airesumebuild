import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { BasePlatformService, ServiceResponse, AnalyticsData } from './BasePlatformService.ts';

// Google Analytics configuration interface
interface GoogleAnalyticsConfig {
  propertyId: string;
  serviceAccountEmail: string;
  serviceAccountKey: string; // Base64 encoded private key
  viewId?: string; // For Universal Analytics (GA3)
}

// Website analytics configuration
interface WebsiteAnalyticsConfig {
  googleAnalytics?: GoogleAnalyticsConfig;
  utmTracking: boolean;
  customDomains: string[];
  trackingPixel?: string;
}

// UTM parameters interface
interface UTMParameters {
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content?: string;
}

// Website analytics data interface
interface WebsiteAnalyticsData {
  sessions: number;
  pageviews: number;
  users: number;
  bounceRate: number;
  avgSessionDuration: number;
  conversions: number;
  conversionRate: number;
  topPages: Array<{ page: string; views: number; conversions: number }>;
  trafficSources: Array<{ source: string; sessions: number; conversions: number }>;
  utmData: Array<{ 
    source: string; 
    medium: string; 
    campaign: string; 
    sessions: number; 
    conversions: number; 
  }>;
}

export class CompanyWebsiteService extends BasePlatformService {
  private analyticsClient: any = null;
  private config: WebsiteAnalyticsConfig | null = null;

  constructor() {
    super('website', 'company_website', { maxRequests: 50, windowMs: 60000 }); // 50 requests per minute
  }

  /**
   * Initialize the service with Google Analytics configuration
   */
  async initialize(config: Record<string, any>): Promise<ServiceResponse> {
    try {
      // Validate environment variables
      const envValidation = this.validateEnvironment(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
      if (!envValidation.success) {
        return envValidation;
      }

      this.config = config as WebsiteAnalyticsConfig;

      // Initialize Google Analytics if configured
      if (this.config.googleAnalytics) {
        const gaConfig = this.config.googleAnalytics;
        
        // Decode the service account key
        let serviceAccountKey;
        try {
          serviceAccountKey = JSON.parse(Buffer.from(gaConfig.serviceAccountKey, 'base64').toString());
        } catch (error) {
          return {
            success: false,
            error: 'Invalid service account key format. Must be base64 encoded JSON.'
          };
        }

        // Create JWT client
        const jwtClient = new JWT({
          email: gaConfig.serviceAccountEmail,
          key: serviceAccountKey.private_key,
          scopes: ['https://www.googleapis.com/auth/analytics.readonly']
        });

        // Initialize Analytics client
        this.analyticsClient = google.analyticsdata({ version: 'v1beta', auth: jwtClient });

        // Test the connection
        try {
          await this.analyticsClient.properties.getMetadata({
            name: `properties/${gaConfig.propertyId}/metadata`
          });
        } catch (error) {
          return {
            success: false,
            error: `Failed to connect to Google Analytics: ${error instanceof Error ? error.message : 'Unknown error'}`
          };
        }
      }

      return { success: true };
    } catch (error) {
      return this.handleError(error, 'initialize');
    }
  }

  /**
   * Validate the configuration
   */
  async validateConfig(config: Record<string, any>): Promise<ServiceResponse<boolean>> {
    try {
      const websiteConfig = config as WebsiteAnalyticsConfig;

      // Validate required fields
      if (!websiteConfig.customDomains || websiteConfig.customDomains.length === 0) {
        return {
          success: false,
          error: 'At least one custom domain is required',
          data: false
        };
      }

      // Validate Google Analytics config if provided
      if (websiteConfig.googleAnalytics) {
        const gaConfig = websiteConfig.googleAnalytics;
        
        if (!gaConfig.propertyId || !gaConfig.serviceAccountEmail || !gaConfig.serviceAccountKey) {
          return {
            success: false,
            error: 'Google Analytics configuration requires propertyId, serviceAccountEmail, and serviceAccountKey',
            data: false
          };
        }

        // Validate service account key format
        try {
          const decoded = Buffer.from(gaConfig.serviceAccountKey, 'base64').toString();
          const keyData = JSON.parse(decoded);
          
          if (!keyData.private_key || !keyData.client_email) {
            return {
              success: false,
              error: 'Invalid service account key format',
              data: false
            };
          }
        } catch (error) {
          return {
            success: false,
            error: 'Service account key must be valid base64 encoded JSON',
            data: false
          };
        }
      }

      return { success: true, data: true };
    } catch (error) {
      return this.handleError(error, 'validateConfig');
    }
  }

  /**
   * Fetch analytics data from Google Analytics and website tracking
   */
  async fetchAnalytics(userId: string, dateRange?: { start: string; end: string }): Promise<ServiceResponse<AnalyticsData[]>> {
    try {
      if (!this.config) {
        return {
          success: false,
          error: 'Service not initialized. Call initialize() first.'
        };
      }

      const analyticsData: AnalyticsData[] = [];
      const now = new Date();
      const startDate = dateRange?.start || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = dateRange?.end || now.toISOString().split('T')[0];

      // Fetch Google Analytics data if configured
      if (this.config.googleAnalytics && this.analyticsClient) {
        const gaData = await this.fetchGoogleAnalyticsData(startDate, endDate);
        if (gaData.success && gaData.data) {
          analyticsData.push(...this.convertGADataToAnalytics(gaData.data, now.toISOString()));
        }
      }

      // Fetch website analytics data from our database
      const websiteData = await this.fetchWebsiteAnalyticsData(userId, startDate, endDate);
      if (websiteData.success && websiteData.data) {
        analyticsData.push(...websiteData.data);
      }

      return { success: true, data: analyticsData };
    } catch (error) {
      return this.handleError(error, 'fetchAnalytics');
    }
  }

  /**
   * Fetch data from Google Analytics
   */
  private async fetchGoogleAnalyticsData(startDate: string, endDate: string): Promise<ServiceResponse<WebsiteAnalyticsData>> {
    try {
      if (!this.analyticsClient || !this.config?.googleAnalytics) {
        return { success: false, error: 'Google Analytics not configured' };
      }

      const propertyId = this.config.googleAnalytics.propertyId;

      // Fetch basic metrics
      const basicMetricsResponse = await this.analyticsClient.properties.runReport({
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          metrics: [
            { name: 'sessions' },
            { name: 'screenPageViews' },
            { name: 'totalUsers' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' },
            { name: 'conversions' }
          ]
        }
      });

      // Fetch traffic sources
      const trafficSourcesResponse = await this.analyticsClient.properties.runReport({
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'sessionSource' }],
          metrics: [
            { name: 'sessions' },
            { name: 'conversions' }
          ],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 10
        }
      });

      // Fetch UTM data
      const utmDataResponse = await this.analyticsClient.properties.runReport({
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [
            { name: 'sessionSource' },
            { name: 'sessionMedium' },
            { name: 'sessionCampaignName' }
          ],
          metrics: [
            { name: 'sessions' },
            { name: 'conversions' }
          ],
          dimensionFilter: {
            filter: {
              fieldName: 'sessionMedium',
              stringFilter: {
                matchType: 'EXACT',
                value: 'job_posting'
              }
            }
          }
        }
      });

      // Fetch top pages
      const topPagesResponse = await this.analyticsClient.properties.runReport({
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [
            { name: 'screenPageViews' },
            { name: 'conversions' }
          ],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: 10
        }
      });

      // Process the data
      const basicMetrics = basicMetricsResponse.data.rows?.[0]?.metricValues || [];
      const sessions = parseInt(basicMetrics[0]?.value || '0');
      const pageviews = parseInt(basicMetrics[1]?.value || '0');
      const users = parseInt(basicMetrics[2]?.value || '0');
      const bounceRate = parseFloat(basicMetrics[3]?.value || '0');
      const avgSessionDuration = parseFloat(basicMetrics[4]?.value || '0');
      const conversions = parseInt(basicMetrics[5]?.value || '0');

      const trafficSources = trafficSourcesResponse.data.rows?.map(row => ({
        source: row.dimensionValues?.[0]?.value || 'Unknown',
        sessions: parseInt(row.metricValues?.[0]?.value || '0'),
        conversions: parseInt(row.metricValues?.[1]?.value || '0')
      })) || [];

      const utmData = utmDataResponse.data.rows?.map(row => ({
        source: row.dimensionValues?.[0]?.value || 'Unknown',
        medium: row.dimensionValues?.[1]?.value || 'Unknown',
        campaign: row.dimensionValues?.[2]?.value || 'Unknown',
        sessions: parseInt(row.metricValues?.[0]?.value || '0'),
        conversions: parseInt(row.metricValues?.[1]?.value || '0')
      })) || [];

      const topPages = topPagesResponse.data.rows?.map(row => ({
        page: row.dimensionValues?.[0]?.value || 'Unknown',
        views: parseInt(row.metricValues?.[0]?.value || '0'),
        conversions: parseInt(row.metricValues?.[1]?.value || '0')
      })) || [];

      const websiteAnalyticsData: WebsiteAnalyticsData = {
        sessions,
        pageviews,
        users,
        bounceRate,
        avgSessionDuration,
        conversions,
        conversionRate: sessions > 0 ? (conversions / sessions) * 100 : 0,
        topPages,
        trafficSources,
        utmData
      };

      return { success: true, data: websiteAnalyticsData };
    } catch (error) {
      return this.handleError(error, 'fetchGoogleAnalyticsData');
    }
  }

  /**
   * Fetch website analytics data from our database
   */
  private async fetchWebsiteAnalyticsData(userId: string, startDate: string, endDate: string): Promise<ServiceResponse<AnalyticsData[]>> {
    try {
      const { data, error } = await this.supabase
        .from('website_analytics')
        .select('*')
        .eq('user_id', userId)
        .gte('recorded_at', startDate)
        .lte('recorded_at', endDate)
        .order('recorded_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Convert database records to AnalyticsData format
      const analyticsData: AnalyticsData[] = (data || []).map(record => ({
        platform_type: 'website',
        platform_name: 'company_website',
        job_posting_id: record.job_posting_id,
        metric_name: record.metric_name,
        metric_value: record.metric_value,
        metadata: record.metadata,
        recorded_at: record.recorded_at
      }));

      return { success: true, data: analyticsData };
    } catch (error) {
      return this.handleError(error, 'fetchWebsiteAnalyticsData');
    }
  }

  /**
   * Convert Google Analytics data to our AnalyticsData format
   */
  private convertGADataToAnalytics(gaData: WebsiteAnalyticsData, recordedAt: string): AnalyticsData[] {
    const analyticsData: AnalyticsData[] = [
      {
        platform_type: 'website',
        platform_name: 'company_website',
        metric_name: 'sessions',
        metric_value: gaData.sessions,
        recorded_at: recordedAt
      },
      {
        platform_type: 'website',
        platform_name: 'company_website',
        metric_name: 'pageviews',
        metric_value: gaData.pageviews,
        recorded_at: recordedAt
      },
      {
        platform_type: 'website',
        platform_name: 'company_website',
        metric_name: 'users',
        metric_value: gaData.users,
        recorded_at: recordedAt
      },
      {
        platform_type: 'website',
        platform_name: 'company_website',
        metric_name: 'conversions',
        metric_value: gaData.conversions,
        recorded_at: recordedAt
      },
      {
        platform_type: 'website',
        platform_name: 'company_website',
        metric_name: 'conversion_rate',
        metric_value: gaData.conversionRate,
        recorded_at: recordedAt
      }
    ];

    // Add UTM tracking data
    gaData.utmData.forEach(utm => {
      analyticsData.push({
        platform_type: 'website',
        platform_name: 'company_website',
        metric_name: 'utm_sessions',
        metric_value: utm.sessions,
        metadata: {
          source: utm.source,
          medium: utm.medium,
          campaign: utm.campaign,
          conversions: utm.conversions
        },
        recorded_at: recordedAt
      });
    });

    return analyticsData;
  }

  /**
   * Generate UTM tracking URL
   */
  generateUTMUrl(baseUrl: string, utmParams: UTMParameters, jobPostingId?: string): string {
    const url = new URL(baseUrl);
    
    url.searchParams.set('utm_source', utmParams.source);
    url.searchParams.set('utm_medium', utmParams.medium);
    url.searchParams.set('utm_campaign', utmParams.campaign);
    
    if (utmParams.term) {
      url.searchParams.set('utm_term', utmParams.term);
    }
    
    if (utmParams.content) {
      url.searchParams.set('utm_content', utmParams.content);
    }

    if (jobPostingId) {
      url.searchParams.set('job_id', jobPostingId);
    }

    return url.toString();
  }

  /**
   * Track website event (for custom tracking)
   */
  async trackWebsiteEvent(
    userId: string,
    eventName: string,
    eventValue: number,
    metadata?: Record<string, any>
  ): Promise<ServiceResponse> {
    try {
      const { error } = await this.supabase
        .from('website_analytics')
        .insert({
          user_id: userId,
          metric_name: eventName,
          metric_value: eventValue,
          metadata: metadata || {},
          recorded_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      return this.handleError(error, 'trackWebsiteEvent');
    }
  }

  /**
   * Get website analytics summary
   */
  async getAnalyticsSummary(userId: string, dateRange?: { start: string; end: string }): Promise<ServiceResponse> {
    try {
      const analyticsResponse = await this.fetchAnalytics(userId, dateRange);
      
      if (!analyticsResponse.success || !analyticsResponse.data) {
        return analyticsResponse;
      }

      // Aggregate the data
      const summary = {
        totalSessions: 0,
        totalPageviews: 0,
        totalUsers: 0,
        totalConversions: 0,
        conversionRate: 0,
        topSources: new Map<string, number>(),
        utmCampaigns: new Map<string, { sessions: number; conversions: number }>()
      };

      analyticsResponse.data.forEach(item => {
        switch (item.metric_name) {
          case 'sessions':
            summary.totalSessions += item.metric_value;
            break;
          case 'pageviews':
            summary.totalPageviews += item.metric_value;
            break;
          case 'users':
            summary.totalUsers += item.metric_value;
            break;
          case 'conversions':
            summary.totalConversions += item.metric_value;
            break;
          case 'utm_sessions':
            if (item.metadata?.campaign) {
              const existing = summary.utmCampaigns.get(item.metadata.campaign) || { sessions: 0, conversions: 0 };
              existing.sessions += item.metric_value;
              existing.conversions += item.metadata.conversions || 0;
              summary.utmCampaigns.set(item.metadata.campaign, existing);
            }
            break;
        }
      });

      summary.conversionRate = summary.totalSessions > 0 ? (summary.totalConversions / summary.totalSessions) * 100 : 0;

      return {
        success: true,
        data: {
          ...summary,
          utmCampaigns: Object.fromEntries(summary.utmCampaigns),
          topSources: Object.fromEntries(summary.topSources)
        }
      };
    } catch (error) {
      return this.handleError(error, 'getAnalyticsSummary');
    }
  }
}