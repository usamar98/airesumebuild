-- Check current users in the Supabase users table
SELECT 
  id,
  name,
  email,
  role,
  created_at
FROM users
ORDER BY created_at DESC;

-- Also check auth.users table for user metadata
SELECT 
  id,
  email,
  raw_user_meta_data,
  email_confirmed_at,
  created_at
FROM auth.users
ORDER BY created_at DESC;