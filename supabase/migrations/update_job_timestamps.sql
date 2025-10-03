-- Update existing jobs to have recent timestamps (within last 6 hours)
-- This makes the jobs appear more recent instead of showing "1 day ago"

UPDATE jobs 
SET posted_date = (
  NOW() - INTERVAL '1 hour' * (RANDOM() * 6)
)::timestamp with time zone
WHERE posted_date < NOW() - INTERVAL '12 hours';

-- Update scraped_at timestamp as well to be consistent
UPDATE jobs 
SET scraped_at = NOW()
WHERE scraped_at IS NULL OR scraped_at < NOW() - INTERVAL '12 hours';