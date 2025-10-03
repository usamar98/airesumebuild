-- Comprehensive migration to add ALL missing columns to job_postings table
-- This ensures the database schema matches all frontend and backend requirements

-- Add company_size column for company size information
ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS company_size TEXT;

-- Add company_website column for company website URL
ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS company_website TEXT;

-- Add responsibilities column for job responsibilities
ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS responsibilities TEXT;

-- Add location_type column for remote/hybrid/onsite specification
ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS location_type TEXT 
CHECK (location_type IN ('remote', 'hybrid', 'on-site', 'onsite'));

-- Add currency column for salary currency
ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Add comments to document the new columns
COMMENT ON COLUMN job_postings.company_size IS 'Size of the company (e.g., 1-10, 11-50, 51-200, 201-500, 500+)';
COMMENT ON COLUMN job_postings.company_website IS 'Company website URL';
COMMENT ON COLUMN job_postings.responsibilities IS 'Job responsibilities and duties';
COMMENT ON COLUMN job_postings.location_type IS 'Type of work location: remote, hybrid, or on-site';
COMMENT ON COLUMN job_postings.currency IS 'Currency for salary range (default: USD)';

-- Create indexes for better query performance on new searchable columns
CREATE INDEX IF NOT EXISTS idx_job_postings_company_size ON job_postings(company_size);
CREATE INDEX IF NOT EXISTS idx_job_postings_location_type ON job_postings(location_type);
CREATE INDEX IF NOT EXISTS idx_job_postings_currency ON job_postings(currency);