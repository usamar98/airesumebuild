-- Add professional columns to enhance job posting functionality
-- These columns provide comprehensive job posting capabilities

-- Add interview process information
ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS interview_process TEXT;

-- Add education requirements
ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS education_requirements TEXT;

-- Add work authorization requirements
ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS work_authorization TEXT;

-- Add travel requirements
ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS travel_requirements TEXT;

-- Add department information
ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS department TEXT;

-- Add reporting structure
ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS reporting_to TEXT;

-- Add company description
ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS company_description TEXT;

-- Add job category for better organization
ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS job_category TEXT;

-- Add employment type for more specific classification
ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS employment_type TEXT 
CHECK (employment_type IN ('permanent', 'temporary', 'contract', 'internship', 'volunteer'));

-- Add urgency level
ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS urgency_level TEXT 
CHECK (urgency_level IN ('low', 'medium', 'high', 'urgent'));

-- Add comments to document the new columns
COMMENT ON COLUMN job_postings.interview_process IS 'Description of the interview process and stages';
COMMENT ON COLUMN job_postings.education_requirements IS 'Required education level and qualifications';
COMMENT ON COLUMN job_postings.work_authorization IS 'Work authorization requirements (visa, citizenship, etc.)';
COMMENT ON COLUMN job_postings.travel_requirements IS 'Travel requirements and frequency';
COMMENT ON COLUMN job_postings.department IS 'Department or team the position belongs to';
COMMENT ON COLUMN job_postings.reporting_to IS 'Position or person this role reports to';
COMMENT ON COLUMN job_postings.company_description IS 'Brief description of the company';
COMMENT ON COLUMN job_postings.job_category IS 'Category or field of the job (e.g., Technology, Marketing, Sales)';
COMMENT ON COLUMN job_postings.employment_type IS 'Type of employment arrangement';
COMMENT ON COLUMN job_postings.urgency_level IS 'Urgency level for filling the position';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_job_postings_department ON job_postings(department);
CREATE INDEX IF NOT EXISTS idx_job_postings_job_category ON job_postings(job_category);
CREATE INDEX IF NOT EXISTS idx_job_postings_employment_type ON job_postings(employment_type);
CREATE INDEX IF NOT EXISTS idx_job_postings_urgency_level ON job_postings(urgency_level);