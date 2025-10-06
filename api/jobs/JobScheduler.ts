/**
 * Job Scheduler for Platform Analytics
 * Handles automated data collection, sync jobs, and background processing
 */
import { createClient } from '@supabase/supabase-js';
import { PlatformServiceFactory } from '../services/platforms/PlatformServiceFactory';
import { DataAggregator } from '../services/platforms/DataAggregator';

interface JobConfig {
  id: string;
  name: string;
  schedule: string; // cron expression
  enabled: boolean;
  platform_type?: string;
  platform_name?: string;
  last_run?: Date;
  next_run?: Date;
  retry_count: number;
  max_retries: number;
  timeout_ms: number;
}

interface JobExecution {
  id: string;
  job_id: string;
  status: 'running' | 'completed' | 'failed' | 'timeout';
  started_at: Date;
  completed_at?: Date;
  error_message?: string;
  retry_attempt: number;
  execution_time_ms?: number;
  result?: any;
}

interface JobResult {
  success: boolean;
  data?: any;
  error?: string;
  execution_time_ms: number;
}

export class JobScheduler {
  private supabase: any;
  private dataAggregator: DataAggregator;
  private jobs: Map<string, JobConfig> = new Map();
  private runningJobs: Map<string, NodeJS.Timeout> = new Map();
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.dataAggregator = new DataAggregator({
      batchSize: 1000,
      maxRetries: 3,
      retryDelayMs: 5000,
      enableRealTimeUpdates: true
    });
  }

  /**
   * Initialize the job scheduler
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing Job Scheduler...');
      
      // Load job configurations from database
      await this.loadJobConfigurations();
      
      // Platform services will be initialized when needed during job execution
      console.log('Job Scheduler initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Job Scheduler:', error);
      throw error;
    }
  }

  /**
   * Load job configurations from database
   */
  private async loadJobConfigurations(): Promise<void> {
    try {
      // Create default job configurations if they don't exist
      await this.createDefaultJobs();
      
      const { data: jobConfigs, error } = await this.supabase
        .from('job_configurations')
        .select('*')
        .eq('enabled', true);

      if (error) throw error;

      this.jobs.clear();
      for (const config of jobConfigs || []) {
        this.jobs.set(config.id, {
          id: config.id,
          name: config.name,
          schedule: config.schedule,
          enabled: config.enabled,
          platform_type: config.platform_type,
          platform_name: config.platform_name,
          last_run: config.last_run ? new Date(config.last_run) : undefined,
          next_run: config.next_run ? new Date(config.next_run) : undefined,
          retry_count: config.retry_count || 0,
          max_retries: config.max_retries || 3,
          timeout_ms: config.timeout_ms || 300000 // 5 minutes default
        });
      }

      console.log(`Loaded ${this.jobs.size} job configurations`);
    } catch (error) {
      console.error('Error loading job configurations:', error);
      throw error;
    }
  }

  /**
   * Create default job configurations
   */
  private async createDefaultJobs(): Promise<void> {
    const defaultJobs = [
      {
        id: 'sync-website-analytics',
        name: 'Sync Website Analytics',
        schedule: '0 */15 * * * *', // Every 15 minutes
        enabled: true,
        platform_type: 'website',
        platform_name: 'company_website',
        max_retries: 3,
        timeout_ms: 300000
      },
      {
        id: 'sync-referrals',
        name: 'Sync Referrals Data',
        schedule: '0 */30 * * * *', // Every 30 minutes
        enabled: true,
        platform_type: 'referrals',
        platform_name: 'internal_referrals',
        max_retries: 3,
        timeout_ms: 180000
      },
      {
        id: 'aggregate-daily-data',
        name: 'Aggregate Daily Analytics',
        schedule: '0 0 1 * * *', // Daily at 1 AM
        enabled: true,
        max_retries: 2,
        timeout_ms: 600000
      },
      {
        id: 'aggregate-weekly-data',
        name: 'Aggregate Weekly Analytics',
        schedule: '0 0 2 * * 1', // Weekly on Monday at 2 AM
        enabled: true,
        max_retries: 2,
        timeout_ms: 900000
      },
      {
        id: 'aggregate-monthly-data',
        name: 'Aggregate Monthly Analytics',
        schedule: '0 0 3 1 * *', // Monthly on 1st at 3 AM
        enabled: true,
        max_retries: 2,
        timeout_ms: 1800000
      },
      {
        id: 'cleanup-old-data',
        name: 'Cleanup Old Analytics Data',
        schedule: '0 0 4 * * 0', // Weekly on Sunday at 4 AM
        enabled: true,
        max_retries: 1,
        timeout_ms: 1200000
      }
    ];

    for (const job of defaultJobs) {
      const { error } = await this.supabase
        .from('job_configurations')
        .upsert(job, { onConflict: 'id' });

      if (error) {
        console.error(`Error creating default job ${job.id}:`, error);
      }
    }
  }

  /**
   * Schedule all enabled jobs
   */
  private async scheduleAllJobs(): Promise<void> {
    for (const [jobId, config] of this.jobs) {
      if (config.enabled) {
        await this.scheduleJob(jobId);
      }
    }
  }

  /**
   * Schedule a specific job
   */
  private async scheduleJob(jobId: string): Promise<void> {
    const config = this.jobs.get(jobId);
    if (!config) return;

    try {
      // Parse cron expression and calculate next run time
      const nextRun = this.calculateNextRun(config.schedule);
      const delay = nextRun.getTime() - Date.now();

      // Ensure delay is within 32-bit signed integer limits (2^31 - 1 = 2147483647)
      const MAX_TIMEOUT = 2147483647;
      const safeDelay = Math.min(Math.max(delay, 0), MAX_TIMEOUT);

      if (safeDelay > 0) {
        const timeout = setTimeout(async () => {
          await this.executeJob(jobId);
          // Reschedule for next run
          await this.scheduleJob(jobId);
        }, safeDelay);

        this.scheduledJobs.set(jobId, timeout);
        
        // Update next run time in database
        await this.updateJobNextRun(jobId, nextRun);
        
        console.log(`Scheduled job ${config.name} to run at ${nextRun.toISOString()} (delay: ${safeDelay}ms)`);
      } else {
        console.log(`Job ${config.name} is scheduled for the past, running immediately`);
        await this.executeJob(jobId);
        await this.scheduleJob(jobId);
      }
    } catch (error) {
      console.error(`Error scheduling job ${jobId}:`, error);
    }
  }

  /**
   * Execute a job
   */
  async executeJob(jobId: string): Promise<JobResult> {
    const config = this.jobs.get(jobId);
    if (!config) {
      throw new Error(`Job configuration not found: ${jobId}`);
    }

    const executionId = `${jobId}-${Date.now()}`;
    const startTime = Date.now();

    try {
      console.log(`Starting job execution: ${config.name} (${executionId})`);

      // Create job execution record
      await this.createJobExecution(executionId, jobId, 'running');

      // Set timeout for job execution
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Job execution timeout')), config.timeout_ms);
      });

      // Execute the actual job
      const jobPromise = this.runJobLogic(config);

      // Race between job execution and timeout
      const result = await Promise.race([jobPromise, timeoutPromise]);

      const executionTime = Date.now() - startTime;

      // Update job execution as completed
      await this.updateJobExecution(executionId, 'completed', undefined, result, executionTime);

      // Update last run time
      await this.updateJobLastRun(jobId, new Date());

      // Reset retry count on success
      await this.resetJobRetryCount(jobId);

      console.log(`Job completed successfully: ${config.name} (${executionTime}ms)`);

      return {
        success: true,
        data: result,
        execution_time_ms: executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      console.error(`Job failed: ${config.name} - ${errorMessage}`);

      // Update job execution as failed
      await this.updateJobExecution(executionId, 'failed', errorMessage, undefined, executionTime);

      // Handle retry logic
      await this.handleJobRetry(jobId, errorMessage);

      return {
        success: false,
        error: errorMessage,
        execution_time_ms: executionTime
      };
    }
  }

  /**
   * Run the actual job logic based on job type
   */
  private async runJobLogic(config: JobConfig): Promise<any> {
    switch (config.id) {
      case 'sync-website-analytics':
        return await this.syncPlatformData('website', 'company_website');
      
      case 'sync-referrals':
        return await this.syncPlatformData('referrals', 'internal_referrals');
      
      case 'aggregate-daily-data':
        return await this.aggregateDataForAllUsers('daily');
      
      case 'aggregate-weekly-data':
        return await this.aggregateDataForAllUsers('weekly');
      
      case 'aggregate-monthly-data':
        return await this.aggregateDataForAllUsers('monthly');
      
      case 'cleanup-old-data':
        return await this.cleanupOldData();
      
      default:
        if (config.platform_type && config.platform_name) {
          return await this.syncPlatformData(config.platform_type, config.platform_name);
        }
        throw new Error(`Unknown job type: ${config.id}`);
    }
  }

  /**
   * Sync data from a specific platform
   */
  private async syncPlatformData(platformType: string, platformName: string, userId?: string): Promise<any> {
    const service = PlatformServiceFactory.getService(platformType, platformName);
    if (!service) {
      throw new Error(`Platform service not found: ${platformType}/${platformName}`);
    }

    // Fetch analytics data - provide userId and optional date range
    const analytics = await service.fetchAnalytics(userId || 'system', {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString()
    });
    
    // Process and save the data using the correct method
    const processedData = await this.dataAggregator.aggregateAllData({
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString()
    });
    
    return {
      platform_type: platformType,
      platform_name: platformName,
      records_processed: processedData.data?.length || 0,
      sync_timestamp: new Date().toISOString()
    };
  }

  /**
   * Aggregate data for all users for a specific period
   */
  private async aggregateDataForAllUsers(periodType: 'daily' | 'weekly' | 'monthly'): Promise<any> {
    try {
      const now = new Date();
      let startDate: string;
      let endDate: string;

      // Calculate date range based on period type
      switch (periodType) {
        case 'daily':
          // Aggregate yesterday's data
          const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          startDate = yesterday.toISOString().split('T')[0];
          endDate = yesterday.toISOString().split('T')[0];
          break;
        case 'weekly':
          // Aggregate last week's data
          const lastWeekEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const lastWeekStart = new Date(lastWeekEnd.getTime() - 6 * 24 * 60 * 60 * 1000);
          startDate = lastWeekStart.toISOString().split('T')[0];
          endDate = lastWeekEnd.toISOString().split('T')[0];
          break;
        case 'monthly':
          // Aggregate last month's data
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
          startDate = lastMonth.toISOString().split('T')[0];
          endDate = lastMonthEnd.toISOString().split('T')[0];
          break;
        default:
          throw new Error(`Unsupported period type: ${periodType}`);
      }

      console.log(`Starting ${periodType} aggregation for all users from ${startDate} to ${endDate}`);

      // Use the DataAggregator's aggregateAllData method
      const result = await this.dataAggregator.aggregateAllData({ start: startDate, end: endDate });

      if (!result.success) {
        throw new Error(result.error || 'Aggregation failed');
      }

      return {
        period_type: periodType,
        start_date: startDate,
        end_date: endDate,
        results_processed: result.data?.length || 0,
        aggregation_results: result.data
      };
    } catch (error) {
      console.error(`Error in ${periodType} aggregation:`, error);
      throw error;
    }
  }

  /**
   * Cleanup old analytics data
   */
  private async cleanupOldData(): Promise<any> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90); // Keep 90 days of raw data

    const { data, error } = await this.supabase
      .from('platform_analytics_raw')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (error) throw error;

    return {
      cutoff_date: cutoffDate.toISOString(),
      records_deleted: data?.length || 0
    };
  }

  /**
   * Handle job retry logic
   */
  private async handleJobRetry(jobId: string, errorMessage: string): Promise<void> {
    const config = this.jobs.get(jobId);
    if (!config) return;

    const newRetryCount = config.retry_count + 1;

    if (newRetryCount <= config.max_retries) {
      // Schedule retry with exponential backoff
      const retryDelay = Math.min(1000 * Math.pow(2, newRetryCount), 300000); // Max 5 minutes
      
      setTimeout(async () => {
        console.log(`Retrying job ${config.name} (attempt ${newRetryCount}/${config.max_retries})`);
        await this.executeJob(jobId);
      }, retryDelay);

      // Update retry count
      await this.updateJobRetryCount(jobId, newRetryCount);
    } else {
      console.error(`Job ${config.name} failed after ${config.max_retries} retries: ${errorMessage}`);
      
      // Send alert or notification about job failure
      await this.sendJobFailureAlert(jobId, errorMessage);
    }
  }

  /**
   * Calculate next run time based on cron expression
   */
  private calculateNextRun(cronExpression: string): Date {
    // Simple cron parser for basic expressions
    // Format: second minute hour day month dayOfWeek
    const parts = cronExpression.split(' ');
    if (parts.length !== 6) {
      throw new Error(`Invalid cron expression: ${cronExpression}`);
    }

    const now = new Date();
    const next = new Date(now);

    // For simplicity, handle common patterns
    if (cronExpression === '0 */15 * * * *') { // Every 15 minutes
      const currentMinutes = now.getMinutes();
      const nextMinutes = Math.ceil((currentMinutes + 1) / 15) * 15;
      if (nextMinutes >= 60) {
        next.setHours(next.getHours() + 1, 0, 0, 0);
      } else {
        next.setMinutes(nextMinutes, 0, 0);
      }
    } else if (cronExpression === '0 */30 * * * *') { // Every 30 minutes
      const currentMinutes = now.getMinutes();
      const nextMinutes = Math.ceil((currentMinutes + 1) / 30) * 30;
      if (nextMinutes >= 60) {
        next.setHours(next.getHours() + 1, 0, 0, 0);
      } else {
        next.setMinutes(nextMinutes, 0, 0);
      }
    } else if (cronExpression === '0 0 1 * * *') { // Daily at 1 AM
      next.setHours(1, 0, 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
    } else if (cronExpression === '0 0 2 * * 1') { // Weekly on Monday at 2 AM
      next.setHours(2, 0, 0, 0);
      const daysUntilMonday = (1 - next.getDay() + 7) % 7;
      if (daysUntilMonday === 0 && next <= now) {
        next.setDate(next.getDate() + 7);
      } else {
        next.setDate(next.getDate() + daysUntilMonday);
      }
    } else if (cronExpression === '0 0 3 1 * *') { // Monthly on 1st at 3 AM
      next.setHours(3, 0, 0, 0);
      next.setDate(1);
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
      }
    } else if (cronExpression === '0 0 4 * * 0') { // Weekly on Sunday at 4 AM
      next.setHours(4, 0, 0, 0);
      const daysUntilSunday = (7 - next.getDay()) % 7;
      if (daysUntilSunday === 0 && next <= now) {
        next.setDate(next.getDate() + 7);
      } else {
        next.setDate(next.getDate() + daysUntilSunday);
      }
    } else {
      // Default to 1 hour from now for unknown patterns
      next.setHours(next.getHours() + 1, 0, 0, 0);
    }

    // Ensure the next run is always in the future
    if (next <= now) {
      // Add minimum interval based on cron type
      if (cronExpression.includes('*/15')) {
        next.setMinutes(next.getMinutes() + 15);
      } else if (cronExpression.includes('*/30')) {
        next.setMinutes(next.getMinutes() + 30);
      } else {
        next.setHours(next.getHours() + 1);
      }
    }

    return next;
  }

  /**
   * Database operations for job management
   */
  private async createJobExecution(executionId: string, jobId: string, status: string): Promise<void> {
    const { error } = await this.supabase
      .from('job_executions')
      .insert({
        id: executionId,
        job_id: jobId,
        status,
        started_at: new Date().toISOString(),
        retry_attempt: this.jobs.get(jobId)?.retry_count || 0
      });

    if (error) {
      console.error('Error creating job execution:', error);
    }
  }

  private async updateJobExecution(
    executionId: string, 
    status: string, 
    errorMessage?: string, 
    result?: any,
    executionTimeMs?: number
  ): Promise<void> {
    const updateData: any = {
      status,
      completed_at: new Date().toISOString()
    };

    if (errorMessage) updateData.error_message = errorMessage;
    if (result) updateData.result = result;
    if (executionTimeMs) updateData.execution_time_ms = executionTimeMs;

    const { error } = await this.supabase
      .from('job_executions')
      .update(updateData)
      .eq('id', executionId);

    if (error) {
      console.error('Error updating job execution:', error);
    }
  }

  private async updateJobLastRun(jobId: string, lastRun: Date): Promise<void> {
    const { error } = await this.supabase
      .from('job_configurations')
      .update({ last_run: lastRun.toISOString() })
      .eq('id', jobId);

    if (error) {
      console.error('Error updating job last run:', error);
    }

    // Update local cache
    const config = this.jobs.get(jobId);
    if (config) {
      config.last_run = lastRun;
    }
  }

  private async updateJobNextRun(jobId: string, nextRun: Date): Promise<void> {
    const { error } = await this.supabase
      .from('job_configurations')
      .update({ next_run: nextRun.toISOString() })
      .eq('id', jobId);

    if (error) {
      console.error('Error updating job next run:', error);
    }

    // Update local cache
    const config = this.jobs.get(jobId);
    if (config) {
      config.next_run = nextRun;
    }
  }

  private async updateJobRetryCount(jobId: string, retryCount: number): Promise<void> {
    const { error } = await this.supabase
      .from('job_configurations')
      .update({ retry_count: retryCount })
      .eq('id', jobId);

    if (error) {
      console.error('Error updating job retry count:', error);
    }

    // Update local cache
    const config = this.jobs.get(jobId);
    if (config) {
      config.retry_count = retryCount;
    }
  }

  private async resetJobRetryCount(jobId: string): Promise<void> {
    await this.updateJobRetryCount(jobId, 0);
  }

  private async sendJobFailureAlert(jobId: string, errorMessage: string): Promise<void> {
    // Implementation for sending alerts (email, Slack, etc.)
    console.error(`ALERT: Job ${jobId} failed permanently: ${errorMessage}`);
    
    // Could integrate with notification services here
    // await this.notificationService.sendAlert({
    //   type: 'job_failure',
    //   jobId,
    //   errorMessage,
    //   timestamp: new Date()
    // });
  }

  /**
   * Public methods for job management
   */
  async getJobStatus(jobId: string): Promise<JobConfig | null> {
    return this.jobs.get(jobId) || null;
  }

  async getAllJobs(): Promise<JobConfig[]> {
    return Array.from(this.jobs.values());
  }

  async getJobExecutions(jobId: string, limit = 10): Promise<JobExecution[]> {
    const { data, error } = await this.supabase
      .from('job_executions')
      .select('*')
      .eq('job_id', jobId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching job executions:', error);
      return [];
    }

    return data || [];
  }

  async enableJob(jobId: string): Promise<void> {
    const { error } = await this.supabase
      .from('job_configurations')
      .update({ enabled: true })
      .eq('id', jobId);

    if (error) throw error;

    // Reload configuration and reschedule
    await this.loadJobConfigurations();
    await this.scheduleJob(jobId);
  }

  async disableJob(jobId: string): Promise<void> {
    const { error } = await this.supabase
      .from('job_configurations')
      .update({ enabled: false })
      .eq('id', jobId);

    if (error) throw error;

    // Cancel scheduled job
    const timeout = this.scheduledJobs.get(jobId);
    if (timeout) {
      clearTimeout(timeout);
      this.scheduledJobs.delete(jobId);
    }

    // Remove from local cache
    this.jobs.delete(jobId);
  }

  async triggerJob(jobId: string): Promise<JobResult> {
    return await this.executeJob(jobId);
  }

  /**
   * Start the scheduler (called after initialization)
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Job Scheduler is already running');
      return;
    }

    console.log('Starting Job Scheduler...');
    this.isRunning = true;
    
    // Schedule all enabled jobs
    await this.scheduleAllJobs();
    
    console.log('Job Scheduler started successfully');
  }

  /**
   * Stop the scheduler
   */
  async stop(): Promise<void> {
    await this.shutdown();
  }

  /**
   * Shutdown the scheduler
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down Job Scheduler...');
    
    this.isRunning = false;

    // Cancel all scheduled jobs
    for (const timeout of this.scheduledJobs.values()) {
      clearTimeout(timeout);
    }
    this.scheduledJobs.clear();

    // Wait for running jobs to complete (with timeout)
    const shutdownTimeout = 30000; // 30 seconds
    const startTime = Date.now();
    
    while (this.runningJobs.size > 0 && (Date.now() - startTime) < shutdownTimeout) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('Job Scheduler shutdown complete');
  }
}

export default JobScheduler;