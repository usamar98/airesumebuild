-- Create test user for authentication testing
-- This will be executed via Supabase Auth API, not direct SQL

-- Note: This SQL file is for documentation purposes.
-- The actual user creation should be done via Supabase Auth API or dashboard.

-- Test user credentials:
-- Email: testuser@gmail.com
-- Password: TestPassword123!

-- To create this user programmatically, use:
-- supabase.auth.signUp({
--   email: 'testuser@gmail.com',
--   password: 'TestPassword123!'
-- })

-- Or create via Supabase dashboard:
-- 1. Go to Authentication > Users
-- 2. Click "Add user"
-- 3. Enter email: testuser@gmail.com
-- 4. Enter password: TestPassword123!
-- 5. Set email_confirmed: true

-- Verify user exists in auth.users table
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'testuser@gmail.com';

-- If user exists, ensure they have a corresponding record in public.users
INSERT INTO public.users (id, name, email, role)
SELECT 
    auth_user.id,
    'Test User',
    auth_user.email,
    'user'
FROM auth.users auth_user
WHERE auth_user.email = 'testuser@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.users pub_user 
    WHERE pub_user.id = auth_user.id
  );