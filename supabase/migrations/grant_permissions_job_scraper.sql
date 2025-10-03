-- Grant permissions for job scraper tables to anon and authenticated roles

-- Grant permissions for jobs table
GRANT SELECT ON jobs TO anon;
GRANT ALL PRIVILEGES ON jobs TO authenticated;

-- Grant permissions for saved_jobs table
GRANT SELECT ON saved_jobs TO anon;
GRANT ALL PRIVILEGES ON saved_jobs TO authenticated;

-- Grant permissions for proposals table
GRANT SELECT ON proposals TO anon;
GRANT ALL PRIVILEGES ON proposals TO authenticated;

-- Check current permissions (for verification)
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name IN ('jobs', 'saved_jobs', 'proposals') 
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;