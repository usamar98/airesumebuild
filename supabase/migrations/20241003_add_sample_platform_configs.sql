-- Add sample platform configurations for testing
-- This migration adds default platform configurations that the job scheduler can use

-- First, let's create platform configurations for existing users
-- Insert sample platform configurations for different platform types for each existing user
INSERT INTO platform_configs (
  user_id,
  platform_type,
  platform_name,
  config,
  api_credentials,
  is_active,
  sync_frequency
)
SELECT 
  u.id as user_id,
  'company_website' as platform_type,
  'company_website' as platform_name,
  '{"url": "https://example.com", "tracking_enabled": true}' as config,
  '{}' as api_credentials,
  true as is_active,
  'daily' as sync_frequency
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM platform_configs pc 
  WHERE pc.user_id = u.id 
  AND pc.platform_type = 'company_website' 
  AND pc.platform_name = 'company_website'
);

-- Insert internal referrals configuration for each user
INSERT INTO platform_configs (
  user_id,
  platform_type,
  platform_name,
  config,
  api_credentials,
  is_active,
  sync_frequency
)
SELECT 
  u.id as user_id,
  'referrals' as platform_type,
  'internal_referrals' as platform_name,
  '{"source": "internal", "tracking_enabled": true}' as config,
  '{}' as api_credentials,
  true as is_active,
  'daily' as sync_frequency
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM platform_configs pc 
  WHERE pc.user_id = u.id 
  AND pc.platform_type = 'referrals' 
  AND pc.platform_name = 'internal_referrals'
);

-- Update existing platform_sync_jobs to use the new platform_config_id if they exist
-- This is a cleanup operation for any existing sync jobs
UPDATE platform_sync_jobs 
SET platform_config_id = (
  SELECT id FROM platform_configs 
  WHERE platform_configs.user_id = platform_sync_jobs.user_id 
  AND platform_configs.platform_type = 'company_website'
  AND platform_configs.platform_name = 'company_website'
  LIMIT 1
)
WHERE platform_config_id IS NULL 
AND EXISTS (
  SELECT 1 FROM platform_configs 
  WHERE platform_configs.user_id = platform_sync_jobs.user_id 
  AND platform_configs.platform_type = 'company_website'
  AND platform_configs.platform_name = 'company_website'
);