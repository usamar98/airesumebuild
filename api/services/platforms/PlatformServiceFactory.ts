import { BasePlatformService, ServiceResponse } from './BasePlatformService.ts';

// Platform service registry
export class PlatformServiceFactory {
  private static services: Map<string, typeof BasePlatformService> = new Map();
  private static instances: Map<string, BasePlatformService> = new Map();

  /**
   * Register a platform service class
   */
  static registerService(platformType: string, platformName: string, serviceClass: typeof BasePlatformService): void {
    const key = this.getServiceKey(platformType, platformName);
    this.services.set(key, serviceClass);
  }

  /**
   * Get a platform service instance
   */
  static getService(platformType: string, platformName: string): BasePlatformService | null {
    const key = this.getServiceKey(platformType, platformName);
    
    // Return existing instance if available
    if (this.instances.has(key)) {
      return this.instances.get(key)!;
    }

    // Create new instance if service is registered
    const ServiceClass = this.services.get(key);
    if (ServiceClass) {
      const instance = new (ServiceClass as any)(platformType, platformName);
      this.instances.set(key, instance);
      return instance;
    }

    return null;
  }

  /**
   * Get all registered platform types
   */
  static getRegisteredPlatforms(): Array<{ platformType: string; platformName: string }> {
    return Array.from(this.services.keys()).map(key => {
      const [platformType, platformName] = key.split(':');
      return { platformType, platformName };
    });
  }

  /**
   * Check if a platform service is registered
   */
  static isServiceRegistered(platformType: string, platformName: string): boolean {
    const key = this.getServiceKey(platformType, platformName);
    return this.services.has(key);
  }

  /**
   * Initialize all registered services for a user
   */
  static async initializeUserServices(userId: string): Promise<ServiceResponse[]> {
    const results: ServiceResponse[] = [];
    
    for (const [key, ServiceClass] of this.services.entries()) {
      try {
        const [platformType, platformName] = key.split(':');
        const service = this.getService(platformType, platformName);
        
        if (service) {
          // Get user's platform config
          const configResponse = await service.getPlatformConfig(userId);
          
          if (configResponse.success && configResponse.data && configResponse.data.is_active) {
            // Initialize service with user's config
            const initResponse = await service.initialize(configResponse.data.config_data);
            results.push({
              ...initResponse,
              metadata: {
                ...initResponse.metadata,
                platformType,
                platformName
              }
            });
          }
        }
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          metadata: { key }
        });
      }
    }
    
    return results;
  }

  /**
   * Sync analytics for all active platforms for a user
   */
  static async syncAllPlatforms(userId: string, dateRange?: { start: string; end: string }): Promise<ServiceResponse[]> {
    const results: ServiceResponse[] = [];
    
    for (const [key] of this.services.entries()) {
      try {
        const [platformType, platformName] = key.split(':');
        const service = this.getService(platformType, platformName);
        
        if (service) {
          // Check if platform is configured and active
          const configResponse = await service.getPlatformConfig(userId);
          
          if (configResponse.success && configResponse.data && configResponse.data.is_active) {
            // Create sync job
            const syncJobResponse = await service.createSyncJob(userId, { dateRange });
            
            if (syncJobResponse.success) {
              try {
                // Initialize service
                await service.initialize(configResponse.data.config_data);
                
                // Fetch analytics
                const analyticsResponse = await service.fetchAnalytics(userId, dateRange);
                
                if (analyticsResponse.success && analyticsResponse.data) {
                  // Save analytics data
                  await service.saveAnalyticsData(userId, analyticsResponse.data);
                  
                  // Update last sync
                  await service.updateLastSync(userId);
                  
                  // Update sync job as completed
                  await service.updateSyncJob(
                    syncJobResponse.data.id,
                    'completed',
                    { recordsProcessed: analyticsResponse.data.length }
                  );
                  
                  results.push({
                    success: true,
                    data: analyticsResponse.data,
                    metadata: { platformType, platformName, recordsProcessed: analyticsResponse.data.length }
                  });
                } else {
                  // Update sync job as failed
                  await service.updateSyncJob(
                    syncJobResponse.data.id,
                    'failed',
                    undefined,
                    analyticsResponse.error || 'Failed to fetch analytics'
                  );
                  
                  results.push({
                    success: false,
                    error: analyticsResponse.error || 'Failed to fetch analytics',
                    metadata: { platformType, platformName }
                  });
                }
              } catch (error) {
                // Update sync job as failed
                await service.updateSyncJob(
                  syncJobResponse.data.id,
                  'failed',
                  undefined,
                  error instanceof Error ? error.message : 'Unknown error'
                );
                
                results.push({
                  success: false,
                  error: error instanceof Error ? error.message : 'Unknown error',
                  metadata: { platformType, platformName }
                });
              }
            }
          }
        }
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          metadata: { key }
        });
      }
    }
    
    return results;
  }

  /**
   * Get sync status for all platforms for a user
   */
  static async getAllSyncStatuses(userId: string): Promise<ServiceResponse[]> {
    const results: ServiceResponse[] = [];
    
    for (const [key] of this.services.entries()) {
      try {
        const [platformType, platformName] = key.split(':');
        const service = this.getService(platformType, platformName);
        
        if (service) {
          const statusResponse = await service.getSyncJobStatus(userId);
          results.push({
            ...statusResponse,
            metadata: {
              ...statusResponse.metadata,
              platformType,
              platformName
            }
          });
        }
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          metadata: { key }
        });
      }
    }
    
    return results;
  }

  /**
   * Get all platform configurations for a user
   */
  static async getUserConfigs(userId: string): Promise<any[]> {
    try {
      // Get a service instance to access supabase
      const firstService = Array.from(this.instances.values())[0];
      let supabase;
      
      if (firstService) {
        supabase = (firstService as any).supabase;
      } else {
        // Create a temporary service instance to get supabase client
        const { createClient } = await import('@supabase/supabase-js');
        supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
      }

      const { data, error } = await supabase
        .from('platform_configs')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching user configs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserConfigs:', error);
      return [];
    }
  }

  /**
   * Validate configuration for a specific platform
   */
  static async validatePlatformConfig(
    platformType: string, 
    platformName: string, 
    config: Record<string, any>
  ): Promise<ServiceResponse<boolean>> {
    const service = this.getService(platformType, platformName);
    
    if (!service) {
      return {
        success: false,
        error: `Service not found for platform: ${platformType}:${platformName}`,
        data: false
      };
    }

    return service.validateConfig(config);
  }

  /**
   * Clear all service instances (useful for testing)
   */
  static clearInstances(): void {
    this.instances.clear();
  }

  /**
   * Generate service key from platform type and name
   */
  private static getServiceKey(platformType: string, platformName: string): string {
    return `${platformType}:${platformName}`;
  }
}

// Export singleton instance
export const platformServiceFactory = PlatformServiceFactory;