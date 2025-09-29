-- Comprehensive permission fix for all tables
-- This migration ensures proper permissions for authentication to work on Railway

-- Grant permissions for users table
GRANT SELECT ON public.users TO anon;
GRANT ALL PRIVILEGES ON public.users TO authenticated;
GRANT ALL PRIVILEGES ON public.users TO service_role;

-- Grant permissions for analytics table
GRANT SELECT, INSERT ON public.analytics TO anon;
GRANT ALL PRIVILEGES ON public.analytics TO authenticated;
GRANT ALL PRIVILEGES ON public.analytics TO service_role;

-- Grant sequence permissions for analytics
GRANT USAGE, SELECT ON SEQUENCE public.analytics_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.analytics_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.analytics_id_seq TO service_role;

-- Ensure schema permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Drop and recreate users table policies to avoid conflicts
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to read all profiles" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can manage users" ON public.users;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Create simple, working RLS policies for users
CREATE POLICY "users_select_all" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "users_insert_own" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "service_role_full_access" ON public.users
    FOR ALL USING (auth.role() = 'service_role');

-- Verify users table permissions
SELECT 'Users table permissions:' as info;
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'users'
AND grantee IN ('anon', 'authenticated', 'service_role') 
ORDER BY table_name, grantee;

-- Verify analytics table permissions
SELECT 'Analytics table permissions:' as info;
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'analytics'
AND grantee IN ('anon', 'authenticated', 'service_role') 
ORDER BY table_name, grantee;

-- Verify RLS policies
SELECT 'Users table policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users';

SELECT 'Analytics table policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'analytics';