-- Add company_name field to job_postings table
ALTER TABLE job_postings ADD COLUMN company_name VARCHAR(255) NOT NULL DEFAULT 'Unknown Company';

-- Update existing records to have a default company name
UPDATE job_postings SET company_name = 'Tech Company' WHERE company_name IS NULL;

-- Remove the default constraint after updating existing records
ALTER TABLE job_postings ALTER COLUMN company_name DROP DEFAULT;