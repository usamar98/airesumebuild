-- Fix the default role value in users table
ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'job_se