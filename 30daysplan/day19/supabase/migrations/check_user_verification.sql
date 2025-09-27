-- Check test user email verification status
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users 
WHERE email = 'testuser@gmail.com';

-- Also check if user exists in public.users table
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  au.email_confirmed_at
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE u.email = 'testuser@gmail.com';