-- Complete RLS fix for users table
-- First, disable RLS temporarily to clear all policies
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON users';
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
-- Policy for SELECT: users can read their own data
CREATE POLICY "users_select_policy" ON users
  FOR SELECT
  USING (id = auth.uid());

-- Policy for INSERT: users can insert their own data
CREATE POLICY "users_insert_policy" ON users
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- Policy for UPDATE: users can update their own data
CREATE POLICY "users_update_policy" ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Grant permissions to roles
GRANT SELECT ON users TO anon;
GRANT ALL PRIVILEGES ON users TO authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Verify policies are created correctly
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';