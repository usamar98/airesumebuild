-- Grant permissions for users table to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE ON public.users TO anon;
GRANT ALL PRIVILEGES ON public.users TO authenticated;