-- List all users in both public.users and auth.users tables
SELECT 
  u.id,
  u.name,
  u.email as public_email,
  u.role,
  u.created_at as public_created_at,
  au.email as auth_email,
  au.email_confirmed_at,
  au.created_at as auth_created_at
FROM public.users u
FULL OUTER JOIN auth.users au ON u.id = au.id
ORDER BY COALESCE(u.created_at, au.created_at) DESC;