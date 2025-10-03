import { createClient } from '@supabase/supabase-js';

// Rate limiting configuration
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

// Platform configuration interface
export interface PlatformConfig {
  id: string;
  user_id: string;
  platform_type: string;
  platform_name: string;
  config_data: Record<string, any>;
  is_active: boolean;
  last_sync_at?: string;
  created_at?: string;
  updated_at?: string;
}

// Analytics data interface
export interface AnalyticsData {
  platform_type: string;
  platform_name: string;
  job_posting_id?: string;
  metric_name: string;
  metric_value: number;
  metadata?: Record<string, any>;
  recorded_at: string;
}

// Aggregated analytics interface
export interface AggregatedAnalytics {
  user_id: string;
  platform_type: string;
  platform_name: string;
  job_posting_id?: string;
  period_type: 'daily' | 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  total_applications: number;
  total_views: number;
  total_clicks: number;
  conversion_rate: number;
  metadata?: Record<string, any>;
}

// Service response interface
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}

// Rate limiter class
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(private config: RateLimitConfig) {}

  async checkLimit(key: string): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const userRequests = this.requests.get(key)!;
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    this.requests.set(key, validRequests);

    // Check if under limit
    if (validRequests.length >= this.config.maxRequests) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    return true;
  }

  getRemainingRequests(key: string): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    if (!this.requests.has(key)) {
      return this.config.maxRequests;
    }

    const userRequests = this.requests.get(key)!;
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    return Math.max(0, this.config.maxRequests - validRequests.length);
  }
}

// Abstract base class for all platform services
export abstract class BasePlatformService {
  private _supabase: any = null;
  
  protected get supabase() {
    if (!this._supabase) {
      this._supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
    }
    return this._supabase;
  }
  
  protected rateLimiter: RateLimiter;
  protected platformType: string;
  protected platformName: string;

  constructor(
    platformType: string,
    platformName: string,
    rateLimitConfig: RateLimitConfig = { maxRequests: 100, windowMs: 60000 } // 100 requests per minute default
  ) {
    this.platformType = platformType;
    this.platformName = platformName;
    this.rateLimiter = new RateLimiter(rateLimitConfig);
  }

  // Abstract methods that must be implemented by concrete services
  abstract initialize(config: Record<string, any>): Promise<ServiceResponse>;
  abstract fetchAnalytics(userId: string, dateRange?: { start: string; end: string }): Promise<ServiceResponse<AnalyticsData[]>>;
  abstract validateConfig(config: Record<string, any>): Promise<ServiceResponse<boolean>>;

  // Common methods for all platform services
  
  /**
   * Check rate limit for a user
   */
  protected async checkRateLimit(userId: string): Promise<boolean> {
    return this.rateLimiter.checkLimit(userId);
  }

  /**
   * Get remaining requests for a user
   */
  protected getRemainingRequests(userId: string): number {
    return this.rateLimiter.getRemainingRequests(userId);
  }

  /**
   * Save platform configuration
   */
  async savePlatformConfig(config: PlatformConfig): Promise<ServiceResponse<PlatformConfig>> {
    try {
      const { data, error } = await this.supabase
        .from('platform_configs')
        .upsert({
          id: config.id,
          user_id: config.user_id,
          platform_type: this.platformType,
          platform_name: this.platformName,
          config_data: config.config_data,
          is_active: config.is_active,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error(`Error saving platform config for ${this.platformName}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get platform configuration for a user
   */
  async getPlatformConfig(userId: string): Promise<ServiceResponse<PlatformConfig>> {
    try {
      const { data, error } = await this.supabase
        .from('platform_configs')
        .select('*')
        .eq('user_id', userId)
        .eq('platform_type', this.platformType)
        .eq('platform_name', this.platformName)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }

      return { success: true, data: data || null };
    } catch (error) {
      console.error(`Error getting platform config for ${this.platformName}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Save raw analytics data
   */
  async saveAnalyticsData(userId: string, analyticsData: AnalyticsData[]): Promise<ServiceResponse> {
    try {
      // Check rate limit
      if (!(await this.checkRateLimit(userId))) {
        return {
          success: false,
          error: 'Rate limit exceeded',
          metadata: { remainingRequests: this.getRemainingRequests(userId) }
        };
      }

      const records = analyticsData.map(data => ({
        user_id: userId,
        platform_type: this.platformType,
        platform_name: this.platformName,
        job_posting_id: data.job_posting_id,
        metric_name: data.metric_name,
        metric_value: data.metric_value,
        metadata: data.metadata,
        recorded_at: data.recorded_at,
        created_at: new Date().toISOString()
      }));

      const { error } = await this.supabase
        .from('platform_analytics_raw')
        .insert(records);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error(`Error saving analytics data for ${this.platformName}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Update last sync timestamp
   */
  async updateLastSync(userId: string): Promise<ServiceResponse> {
    try {
      const { error } = await this.supabase
        .from('platform_configs')
        .update({ 
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('platform_type', this.platformType)
        .eq('platform_name', this.platformName);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error(`Error updating last sync for ${this.platformName}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get sync job status
   */
  async getSyncJobStatus(userId: string): Promise<ServiceResponse> {
    try {
      // First get the platform config ID
      const { data: configData, error: configError } = await this.supabase
        .from('platform_configs')
        .select('id')
        .eq('user_id', userId)
        .eq('platform_type', this.platformType)
        .eq('platform_name', this.platformName)
        .single();

      if (configError && configError.code !== 'PGRST116') {
        throw configError;
      }

      if (!configData) {
        return { success: true, data: null };
      }

      // Get sync job status using platform_config_id
      const { data, error } = await this.supabase
        .from('platform_sync_jobs')
        .select(`
          *,
          platform_configs!inner(platform_type, platform_name)
        `)
        .eq('user_id', userId)
        .eq('platform_config_id', configData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return { success: true, data: data || null };
    } catch (error) {
      console.error(`Error getting sync job status for ${this.platformName}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Create sync job record
   */
  async createSyncJob(userId: string, jobData: Record<string, any> = {}): Promise<ServiceResponse> {
    try {
      // First get the platform config ID
      const { data: configData, error: configError } = await this.supabase
        .from('platform_configs')
        .select('id')
        .eq('user_id', userId)
        .eq('platform_type', this.platformType)
        .eq('platform_name', this.platformName)
        .single();

      if (configError) {
        throw configError;
      }

      if (!configData) {
        throw new Error(`Platform configuration not found for ${this.platformType}/${this.platformName}`);
      }

      const { data, error } = await this.supabase
        .from('platform_sync_jobs')
        .insert({
          user_id: userId,
          platform_config_id: configData.id,
          job_type: 'sync',
          status: 'pending',
          metadata: jobData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error(`Error creating sync job for ${this.platformName}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Update sync job status
   */
  async updateSyncJob(jobId: string, status: string, result?: Record<string, any>, error?: string): Promise<ServiceResponse> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (result) {
        updateData.result = result;
      }

      if (error) {
        updateData.error_message = error;
      }

      if (status === 'completed' || status === 'failed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error: updateError } = await this.supabase
        .from('platform_sync_jobs')
        .update(updateData)
        .eq('id', jobId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      return { success: true, data };
    } catch (error) {
      console.error(`Error updating sync job for ${this.platformName}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Handle errors with consistent logging and response format
   */
  protected handleError(error: any, operation: string): ServiceResponse {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`${this.platformName} - ${operation} error:`, error);
    
    return {
      success: false,
      error: errorMessage,
      metadata: {
        platform: this.platformName,
        operation,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Validate required environment variables
   */
  protected validateEnvironment(requiredVars: string[]): ServiceResponse<boolean> {
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      return {
        success: false,
        error: `Missing required environment variables: ${missing.join(', ')}`,
        data: false
      };
    }

    return { success: true, data: true };
  }

  /**
   * Get platform type
   */
  getPlatformType(): string {
    return this.platformType;
  }

  /**
   * Get platform name
   */
  getPlatformName(): string {
    return this.platformName;
  }
}