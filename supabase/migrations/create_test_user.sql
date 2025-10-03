-- Create a test user directly in the users table
INSERT INTO public.users (id, email, name, role, created_at, updated_at, email_verified)
VALUES (
  gen_random_uuid(),
  'testuser@demo.com',
  'Test User',
  'job_seeker',
  now(),
  now(),
  true
);