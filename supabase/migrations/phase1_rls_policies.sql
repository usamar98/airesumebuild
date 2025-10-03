-- Phase 1: Row Level Security (RLS) Policies Setup
-- This migration sets up comprehensive RLS policies for all tables

-- =====================================================
-- 1. ENABLE RLS ON ALL TABLES
-- =====================================================

-- Enable RLS on all tables (some may already be enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upwork_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. DROP EXISTING POLICIES (IF ANY)
-- =====================================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Anyone can view active templates" ON public.resume_templates;
DROP POLICY IF EXISTS "Admins can manage templates" ON public.resume_templates;
DROP POLICY IF EXISTS "Users can manage their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can view their own analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "System can insert analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "Admins can view all analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can manage their own proposals" ON public.upwork_proposals;
DROP POLICY IF EXISTS "Users can manage their own saved jobs" ON public.saved_jobs;

-- =====================================================
-- 3. USERS TABLE POLICIES
-- =====================================================

-- Users can view their own data
CREATE POLICY "Users can view their own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update their own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own data (for registration)
CREATE POLICY "Users can insert their own data" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can manage all users
CREATE POLICY "Admins can manage all users" ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- 4. USER PROFILES TABLE POLICIES
-- =====================================================

-- Users can manage their own profile
CREATE POLICY "Users can manage their own profile" ON public.user_profiles
    FOR ALL USING (auth.uid() = user_id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- 5. RESUME TEMPLATES TABLE POLICIES
-- =====================================================

-- Anyone can view active templates (public access)
CREATE POLICY "Anyone can view active templates" ON public.resume_templates
    FOR SELECT USING (is_active = true);

-- Authenticated users can view all templates
CREATE POLICY "Authenticated users can view all templates" ON public.resume_templates
    FOR SELECT USING (auth.role() = 'authenticated');

-- Admins can manage templates
CREATE POLICY "Admins can manage templates" ON public.resume_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- 6. RESUMES TABLE POLICIES
-- =====================================================

-- Users can manage their own resumes
CREATE POLICY "Users can manage their own resumes" ON public.resumes
    FOR ALL USING (auth.uid() = user_id);

-- Admins can view all resumes
CREATE POLICY "Admins can view all resumes" ON public.resumes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- 7. ANALYTICS EVENTS TABLE POLICIES
-- =====================================================

-- Users can view their own analytics
CREATE POLICY "Users can view their own analytics" ON public.analytics_events
    FOR SELECT USING (auth.uid() = user_id);

-- System can insert analytics (for tracking)
CREATE POLICY "System can insert analytics" ON public.analytics_events
    FOR INSERT WITH CHECK (true);

-- Authenticated users can insert their own analytics
CREATE POLICY "Users can insert their own analytics" ON public.analytics_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all analytics
CREATE POLICY "Admins can view all analytics" ON public.analytics_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- 8. UPWORK PROPOSALS TABLE POLICIES
-- =====================================================

-- Users can manage their own proposals
CREATE POLICY "Users can manage their own proposals" ON public.upwork_proposals
    FOR ALL USING (auth.uid() = user_id);

-- Admins can view all proposals
CREATE POLICY "Admins can view all proposals" ON public.upwork_proposals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- 9. SAVED JOBS TABLE POLICIES
-- =====================================================

-- Users can manage their own saved jobs
CREATE POLICY "Users can manage their own saved jobs" ON public.saved_jobs
    FOR ALL USING (auth.uid() = user_id);

-- Admins can view all saved jobs
CREATE POLICY "Admins can view all saved jobs" ON public.saved_jobs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- 10. GRANT PERMISSIONS TO ROLES
-- =====================================================

-- Grant permissions to anon role (for public access)
GRANT SELECT ON public.resume_templates TO anon;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions to authenticated role
GRANT ALL PRIVILEGES ON public.users TO authenticated;
GRANT ALL PRIVILEGES ON public.user_profiles TO authenticated;
GRANT SELECT ON public.resume_templates TO authenticated;
GRANT ALL PRIVILEGES ON public.resumes TO authenticated;
GRANT INSERT, SELECT ON public.analytics_events TO authenticated;
GRANT ALL PRIVILEGES ON public.upwork_proposals TO authenticated;
GRANT ALL PRIVILEGES ON public.saved_jobs TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant sequence permissions for UUID generation
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- =====================================================
-- 11. ADDITIONAL SECURITY CONSTRAINTS
-- =====================================================

-- Add email validation constraint if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'valid_email' AND table_name = 'users'
    ) THEN
        ALTER TABLE public.users ADD CONSTRAINT valid_email 
            CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    END IF;
END $$;

-- Add content validation for resumes
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'valid_content' AND table_name = 'resumes'
    ) THEN
        ALTER TABLE public.resumes ADD CONSTRAINT valid_content 
            CHECK (jsonb_typeof(content) = 'object');
    END IF;
END $$;

-- =====================================================
-- RLS POLICIES SETUP COMPLETE
-- =====================================================

-- Add comment to track migration
COMMENT ON SCHEMA public IS 'Phase 1 RLS Policies Setup - Job Seeker Platform';