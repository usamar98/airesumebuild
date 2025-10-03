-- Add benefits column to job_postings table
-- This column will store an array of benefit strings as JSONB

ALTER TABLE job_postings 
ADD COLUMN benefits JSONB DEFAULT '[]'::jsonb;

-- Add a comment to document the column
COMMENT ON COLUMN job_postings.benefits IS 'Array of benefit strings offered for the job position';

-- Create an index on the benefits column for better query performance
CREATE INDEX idx_job_postings_benefits ON job_postings USING GIN (benefits);