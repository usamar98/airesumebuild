-- Confirm the test user's email to enable login testing
-- This is for development/testing purposes only

-- Update the test user's email confirmation in auth.users
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'testuser@gmail.com';

-- Also create the user profile in public.users if it doesn't exist
INSERT INTO public.users (id, email, name, role, created_at, updated_at)
SELECT 
  id,
  email,
  'Test User' as name,
  'user' as role,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users 
WHERE email = 'testuser@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- Verify the user is properly set up
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  pu.name,
  pu.role
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'testuser@gmail.com';