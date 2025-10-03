/**
 * Feature Flags Configuration
 * Centralized control for enabling/disabling features
 * Set to false to show "Coming Soon" messages
 */

export interface FeatureFlags {
  // Employer Features
  employerRegistration: boolean;
  employerDashboard: boolean;
  
  // Job Seeker Features
  browseJobs: boolean;
  savedJobs: boolean;
  jobSeekerOverview: boolean;
  jobSeekerApplications: boolean;
  jobSeekerProfile: boolean;
}

export const featureFlags: FeatureFlags = {
  // Employer Features - Set to false to show "Coming Soon"
  employerRegistration: false,
  employerDashboard: false,
  
  // Job Seeker Features - Set to false to show "Coming Soon"
  browseJobs: false,
  savedJobs: false,
  jobSeekerOverview: false,
  jobSeekerApplications: false,
  jobSeekerProfile: false,
};

/**
 * Check if a feature is enabled
 */
export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  return featureFlags[feature];
};

/**
 * Get all disabled features (for debugging)
 */
export const getDisabledFeatures = (): string[] => {
  return Object.entries(featureFlags)
    .filter(([_, enabled]) => !enabled)
    .map(([feature, _]) => feature);
};