-- Update test user to have verified email
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'testuser@gmail.com' AND email_confirmed_at IS NULL;

-- Verify the update
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'testuser@gmail.com';