// Export all platform services
export { BasePlatformService } from './BasePlatformService.ts';
export { PlatformServiceFactory, platformServiceFactory } from './PlatformServiceFactory.ts';
export { CompanyWebsiteService } from './CompanyWebsiteService.ts';
export { ReferralsService } from './ReferralsService.ts';
export { DataAggregator } from './DataAggregator.ts';

// Initialize platform services
import { CompanyWebsiteService } from './CompanyWebsiteService.ts';
import { ReferralsService } from './ReferralsService.ts';
import { PlatformServiceFactory } from './PlatformServiceFactory.ts';

// Register all platform services
export function registerPlatformServices(): void {
  // Register Company Website service
  PlatformServiceFactory.registerService('website', 'company_website', CompanyWebsiteService);
  
  // Register Referrals service
  PlatformServiceFactory.registerService('referral', 'internal_referrals', ReferralsService);
  
  console.log('Platform services registered successfully');
}

// Auto-register services when module is imported
registerPlatformServices();