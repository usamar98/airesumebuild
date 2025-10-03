-- Add company_logo column to job_postings table
-- This column will store the URL or path to the company logo image

ALTER TABLE job_postings 
ADD COLUMN company_logo TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN job_postings.company_logo IS 'URL or path to the company logo image';