import { BasePlatformService, ServiceResponse, AnalyticsData } from './BasePlatformService.ts';

// Referral configuration interface
interface ReferralConfig {
  enableReferralProgram: boolean;
  referralReward: number;
  referralCurrency: string;
  maxReferralsPerUser: number;
  referralExpiryDays: number;
  autoApproveReferrals: boolean;
  trackingDomains: string[];
}

// Referral interface
interface Referral {
  id: string;
  user_id: string;
  referrer_user_id?: string;
  referral_code: string;
  referral_source: string;
  job_posting_id?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  reward_amount?: number;
  reward_currency?: string;
  metadata?: Record<string, any>;
  referred_at: string;
  approved_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

// Referral analytics data
interface ReferralAnalyticsData {
  totalReferrals: number;
  approvedReferrals: number;
  pendingReferrals: number;
  rejectedReferrals: number;
  totalRewardsPaid: number;
  conversionRate: number;
  topReferrers: Array<{ user_id: string; referrals: number; rewards: number }>;
  referralSources: Array<{ source: string; count: number; conversion_rate: number }>;
  monthlyTrends: Array<{ month: string; referrals: number; conversions: number }>;
}

export class ReferralsService extends BasePlatformService {
  private config: ReferralConfig | null = null;

  constructor() {
    super('referral', 'internal_referrals', { maxRequests: 200, windowMs: 60000 }); // 200 requests per minute
  }

  /**
   * Initialize the referrals service
   */
  async initialize(config: Record<string, any>): Promise<ServiceResponse> {
    try {
      // Validate environment variables
      const envValidation = this.validateEnvironment(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
      if (!envValidation.success) {
        return envValidation;
      }

      this.config = config as ReferralConfig;

      return { success: true };
    } catch (error) {
      return this.handleError(error, 'initialize');
    }
  }

  /**
   * Validate the referral configuration
   */
  async validateConfig(config: Record<string, any>): Promise<ServiceResponse<boolean>> {
    try {
      const referralConfig = config as ReferralConfig;

      // Validate required fields
      if (typeof referralConfig.enableReferralProgram !== 'boolean') {
        return {
          success: false,
          error: 'enableReferralProgram must be a boolean',
          data: false
        };
      }

      if (referralConfig.enableReferralProgram) {
        if (!referralConfig.referralReward || referralConfig.referralReward <= 0) {
          return {
            success: false,
            error: 'referralReward must be a positive number when referral program is enabled',
            data: false
          };
        }

        if (!referralConfig.referralCurrency || referralConfig.referralCurrency.length !== 3) {
          return {
            success: false,
            error: 'referralCurrency must be a valid 3-letter currency code',
            data: false
          };
        }

        if (!referralConfig.maxReferralsPerUser || referralConfig.maxReferralsPerUser <= 0) {
          return {
            success: false,
            error: 'maxReferralsPerUser must be a positive number',
            data: false
          };
        }

        if (!referralConfig.referralExpiryDays || referralConfig.referralExpiryDays <= 0) {
          return {
            success: false,
            error: 'referralExpiryDays must be a positive number',
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
   * Fetch referral analytics data
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
      const startDate = dateRange?.start || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = dateRange?.end || now.toISOString();

      // Fetch referral analytics
      const referralAnalytics = await this.getReferralAnalytics(userId, startDate, endDate);
      if (referralAnalytics.success && referralAnalytics.data) {
        analyticsData.push(...this.convertReferralDataToAnalytics(referralAnalytics.data, now.toISOString()));
      }

      return { success: true, data: analyticsData };
    } catch (error) {
      return this.handleError(error, 'fetchAnalytics');
    }
  }

  /**
   * Create a new referral
   */
  async createReferral(
    userId: string,
    referralData: {
      referrer_user_id?: string;
      referral_source: string;
      job_posting_id?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<ServiceResponse<Referral>> {
    try {
      if (!this.config?.enableReferralProgram) {
        return {
          success: false,
          error: 'Referral program is not enabled'
        };
      }

      // Check rate limit
      if (!(await this.checkRateLimit(userId))) {
        return {
          success: false,
          error: 'Rate limit exceeded',
          metadata: { remainingRequests: this.getRemainingRequests(userId) }
        };
      }

      // Check if user has exceeded max referrals
      if (referralData.referrer_user_id) {
        const existingReferrals = await this.getUserReferralCount(referralData.referrer_user_id);
        if (existingReferrals >= this.config.maxReferralsPerUser) {
          return {
            success: false,
            error: 'Maximum referrals per user exceeded'
          };
        }
      }

      // Generate referral code
      const referralCode = await this.generateReferralCode();

      // Calculate expiry date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.config.referralExpiryDays);

      const referralRecord = {
        user_id: userId,
        referrer_user_id: referralData.referrer_user_id,
        referral_code: referralCode,
        referral_source: referralData.referral_source,
        job_posting_id: referralData.job_posting_id,
        status: this.config.autoApproveReferrals ? 'approved' : 'pending',
        reward_amount: this.config.referralReward,
        reward_currency: this.config.referralCurrency,
        metadata: referralData.metadata || {},
        referred_at: new Date().toISOString(),
        approved_at: this.config.autoApproveReferrals ? new Date().toISOString() : undefined,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('referrals')
        .insert(referralRecord)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      return this.handleError(error, 'createReferral');
    }
  }

  /**
   * Get referral by code
   */
  async getReferralByCode(referralCode: string): Promise<ServiceResponse<Referral>> {
    try {
      const { data, error } = await this.supabase
        .from('referrals')
        .select('*')
        .eq('referral_code', referralCode)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return { success: true, data: data || null };
    } catch (error) {
      return this.handleError(error, 'getReferralByCode');
    }
  }

  /**
   * Get user's referrals
   */
  async getUserReferrals(userId: string, status?: string): Promise<ServiceResponse<Referral[]>> {
    try {
      let query = this.supabase
        .from('referrals')
        .select('*')
        .eq('referrer_user_id', userId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return this.handleError(error, 'getUserReferrals');
    }
  }

  /**
   * Update referral status
   */
  async updateReferralStatus(
    referralId: string,
    status: 'approved' | 'rejected',
    adminUserId: string
  ): Promise<ServiceResponse<Referral>> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'approved') {
        updateData.approved_at = new Date().toISOString();
      }

      const { data, error } = await this.supabase
        .from('referrals')
        .update(updateData)
        .eq('id', referralId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      return this.handleError(error, 'updateReferralStatus');
    }
  }

  /**
   * Get referral analytics
   */
  async getReferralAnalytics(userId: string, startDate: string, endDate: string): Promise<ServiceResponse<ReferralAnalyticsData>> {
    try {
      // Get all referrals for the user in the date range
      const { data: referrals, error } = await this.supabase
        .from('referrals')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (error) {
        throw error;
      }

      const referralData = referrals || [];

      // Calculate analytics
      const totalReferrals = referralData.length;
      const approvedReferrals = referralData.filter(r => r.status === 'approved').length;
      const pendingReferrals = referralData.filter(r => r.status === 'pending').length;
      const rejectedReferrals = referralData.filter(r => r.status === 'rejected').length;

      const totalRewardsPaid = referralData
        .filter(r => r.status === 'approved')
        .reduce((sum, r) => sum + (r.reward_amount || 0), 0);

      const conversionRate = totalReferrals > 0 ? (approvedReferrals / totalReferrals) * 100 : 0;

      // Top referrers
      const referrerMap = new Map<string, { referrals: number; rewards: number }>();
      referralData.forEach(r => {
        if (r.referrer_user_id) {
          const existing = referrerMap.get(r.referrer_user_id) || { referrals: 0, rewards: 0 };
          existing.referrals += 1;
          if (r.status === 'approved') {
            existing.rewards += r.reward_amount || 0;
          }
          referrerMap.set(r.referrer_user_id, existing);
        }
      });

      const topReferrers = Array.from(referrerMap.entries())
        .map(([user_id, stats]) => ({ user_id, ...stats }))
        .sort((a, b) => b.referrals - a.referrals)
        .slice(0, 10);

      // Referral sources
      const sourceMap = new Map<string, { count: number; approved: number }>();
      referralData.forEach(r => {
        const existing = sourceMap.get(r.referral_source) || { count: 0, approved: 0 };
        existing.count += 1;
        if (r.status === 'approved') {
          existing.approved += 1;
        }
        sourceMap.set(r.referral_source, existing);
      });

      const referralSources = Array.from(sourceMap.entries())
        .map(([source, stats]) => ({
          source,
          count: stats.count,
          conversion_rate: stats.count > 0 ? (stats.approved / stats.count) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count);

      // Monthly trends (simplified for last 12 months)
      const monthlyTrends: Array<{ month: string; referrals: number; conversions: number }> = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const monthReferrals = referralData.filter(r => {
          const createdAt = new Date(r.created_at);
          return createdAt >= monthStart && createdAt <= monthEnd;
        });

        monthlyTrends.push({
          month: monthStart.toISOString().substring(0, 7), // YYYY-MM format
          referrals: monthReferrals.length,
          conversions: monthReferrals.filter(r => r.status === 'approved').length
        });
      }

      const analytics: ReferralAnalyticsData = {
        totalReferrals,
        approvedReferrals,
        pendingReferrals,
        rejectedReferrals,
        totalRewardsPaid,
        conversionRate,
        topReferrers,
        referralSources,
        monthlyTrends
      };

      return { success: true, data: analytics };
    } catch (error) {
      return this.handleError(error, 'getReferralAnalytics');
    }
  }

  /**
   * Generate referral tracking URL
   */
  generateReferralUrl(baseUrl: string, referralCode: string, jobPostingId?: string): string {
    const url = new URL(baseUrl);
    url.searchParams.set('ref', referralCode);
    url.searchParams.set('utm_source', 'referral');
    url.searchParams.set('utm_medium', 'referral_link');
    url.searchParams.set('utm_campaign', 'employee_referral');

    if (jobPostingId) {
      url.searchParams.set('job_id', jobPostingId);
    }

    return url.toString();
  }

  /**
   * Process referral from URL parameters
   */
  async processReferralFromUrl(
    userId: string,
    urlParams: Record<string, string>,
    jobPostingId?: string
  ): Promise<ServiceResponse<Referral>> {
    try {
      const referralCode = urlParams.ref;
      if (!referralCode) {
        return {
          success: false,
          error: 'No referral code found in URL parameters'
        };
      }

      // Get the referral record
      const referralResponse = await this.getReferralByCode(referralCode);
      if (!referralResponse.success || !referralResponse.data) {
        return {
          success: false,
          error: 'Invalid referral code'
        };
      }

      const referral = referralResponse.data;

      // Check if referral is still valid
      if (referral.expires_at && new Date(referral.expires_at) < new Date()) {
        return {
          success: false,
          error: 'Referral code has expired'
        };
      }

      // Create new referral for the referred user
      return this.createReferral(userId, {
        referrer_user_id: referral.referrer_user_id,
        referral_source: 'referral_link',
        job_posting_id: jobPostingId,
        metadata: {
          original_referral_code: referralCode,
          utm_source: urlParams.utm_source,
          utm_medium: urlParams.utm_medium,
          utm_campaign: urlParams.utm_campaign
        }
      });
    } catch (error) {
      return this.handleError(error, 'processReferralFromUrl');
    }
  }

  /**
   * Get user referral count
   */
  private async getUserReferralCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_user_id', userId);

    if (error) {
      console.error('Error getting user referral count:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Generate unique referral code
   */
  private async generateReferralCode(): Promise<string> {
    // Use the function from the database migration
    const { data, error } = await this.supabase.rpc('generate_referral_code');
    
    if (error) {
      console.error('Error generating referral code:', error);
      // Fallback to simple random code
      return Math.random().toString(36).substring(2, 10).toUpperCase();
    }

    return data;
  }

  /**
   * Convert referral analytics data to AnalyticsData format
   */
  private convertReferralDataToAnalytics(referralData: ReferralAnalyticsData, recordedAt: string): AnalyticsData[] {
    const analyticsData: AnalyticsData[] = [
      {
        platform_type: 'referral',
        platform_name: 'internal_referrals',
        metric_name: 'total_referrals',
        metric_value: referralData.totalReferrals,
        recorded_at: recordedAt
      },
      {
        platform_type: 'referral',
        platform_name: 'internal_referrals',
        metric_name: 'approved_referrals',
        metric_value: referralData.approvedReferrals,
        recorded_at: recordedAt
      },
      {
        platform_type: 'referral',
        platform_name: 'internal_referrals',
        metric_name: 'pending_referrals',
        metric_value: referralData.pendingReferrals,
        recorded_at: recordedAt
      },
      {
        platform_type: 'referral',
        platform_name: 'internal_referrals',
        metric_name: 'conversion_rate',
        metric_value: referralData.conversionRate,
        recorded_at: recordedAt
      },
      {
        platform_type: 'referral',
        platform_name: 'internal_referrals',
        metric_name: 'total_rewards_paid',
        metric_value: referralData.totalRewardsPaid,
        recorded_at: recordedAt
      }
    ];

    // Add source breakdown data
    referralData.referralSources.forEach(source => {
      analyticsData.push({
        platform_type: 'referral',
        platform_name: 'internal_referrals',
        metric_name: 'source_referrals',
        metric_value: source.count,
        metadata: {
          source: source.source,
          conversion_rate: source.conversion_rate
        },
        recorded_at: recordedAt
      });
    });

    return analyticsData;
  }
}