-- Check existing users in the database
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.created_at,
  u.last_login,
  au.email_confirmed_at
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
ORDER BY u.created_at DESC
LIMIT 10;