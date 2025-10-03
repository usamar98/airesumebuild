-- Phase 1: Complete Supabase Migration Schema
-- This migration creates all required tables for the job seeker platform
-- Based on the Supabase Migration Plan

-- =====================================================
-- 1. USERS TABLE (Extended from auth.users)
-- =====================================================

-- Drop existing users table if it exists to recreate with new schema
DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'job_seeker' CHECK (role IN ('job_seeker', 'job_poster', 'admin')),
    plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium')),
    usage_count INTEGER DEFAULT 0,
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    email_verification_expires TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. USER PROFILES TABLE
-- =====================================================

CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    location VARCHAR(255),
    bio TEXT,
    skills JSONB DEFAULT '[]',
    experience_level VARCHAR(50),
    portfolio_url VARCHAR(500),
    linkedin_url VARCHAR(500),
    github_url VARCHAR(500),
    avatar_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- =====================================================
-- 3. RESUME TEMPLATES TABLE
-- =====================================================

CREATE TABLE public.resume_templates (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    template_data JSONB NOT NULL,
    preview_image VARCHAR(500),
    is_premium BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. RESUMES TABLE
-- =====================================================

CREATE TABLE public.resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    template_id VARCHAR(100) REFERENCES public.resume_templates(id),
    content JSONB NOT NULL,
    pdf_url VARCHAR(500),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. ANALYTICS EVENTS TABLE
-- =====================================================

CREATE TABLE public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    feature_name VARCHAR(100),
    action VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. UPWORK PROPOSALS TABLE
-- =====================================================

CREATE TABLE public.upwork_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    job_title VARCHAR(500) NOT NULL,
    job_description TEXT,
    proposal_content TEXT NOT NULL,
    settings JSONB DEFAULT '{}',
    word_count INTEGER,
    character_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. SAVED JOBS TABLE
-- =====================================================

CREATE TABLE public.saved_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    job_title VARCHAR(500) NOT NULL,
    company VARCHAR(255),
    job_url VARCHAR(1000),
    description TEXT,
    salary_range VARCHAR(100),
    location VARCHAR(255),
    job_type VARCHAR(100),
    tags JSONB DEFAULT '[]',
    notes TEXT,
    status VARCHAR(50) DEFAULT 'saved' CHECK (status IN ('saved', 'applied', 'interview', 'rejected', 'offer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. PERFORMANCE INDEXES
-- =====================================================

-- Users table indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_created_at ON public.users(created_at DESC);

-- User profiles indexes
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);

-- Resumes indexes
CREATE INDEX idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX idx_resumes_template_id ON public.resume_templates(id);
CREATE INDEX idx_resumes_created_at ON public.resumes(created_at DESC);

-- Analytics indexes
CREATE INDEX idx_analytics_user_id ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_event_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX idx_analytics_feature_action ON public.analytics_events(feature_name, action);

-- Upwork proposals indexes
CREATE INDEX idx_upwork_proposals_user_id ON public.upwork_proposals(user_id);
CREATE INDEX idx_upwork_proposals_created_at ON public.upwork_proposals(created_at DESC);

-- Saved jobs indexes
CREATE INDEX idx_saved_jobs_user_id ON public.saved_jobs(user_id);
CREATE INDEX idx_saved_jobs_status ON public.saved_jobs(status);
CREATE INDEX idx_saved_jobs_created_at ON public.saved_jobs(created_at DESC);

-- =====================================================
-- 9. UPDATED_AT TRIGGERS
-- =====================================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resume_templates_updated_at BEFORE UPDATE ON public.resume_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resumes_updated_at BEFORE UPDATE ON public.resumes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_upwork_proposals_updated_at BEFORE UPDATE ON public.upwork_proposals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_jobs_updated_at BEFORE UPDATE ON public.saved_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 10. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upwork_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- User profiles policies
CREATE POLICY "Users can manage their own profile" ON public.user_profiles
    FOR ALL USING (auth.uid() = user_id);

-- Resume templates policies (public read, admin write)
CREATE POLICY "Anyone can view active templates" ON public.resume_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage templates" ON public.resume_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Resumes policies
CREATE POLICY "Users can manage their own resumes" ON public.resumes
    FOR ALL USING (auth.uid() = user_id);

-- Analytics events policies
CREATE POLICY "Users can view their own analytics" ON public.analytics_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert analytics" ON public.analytics_events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all analytics" ON public.analytics_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Upwork proposals policies
CREATE POLICY "Users can manage their own proposals" ON public.upwork_proposals
    FOR ALL USING (auth.uid() = user_id);

-- Saved jobs policies
CREATE POLICY "Users can manage their own saved jobs" ON public.saved_jobs
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- 11. GRANT PERMISSIONS TO ROLES
-- =====================================================

-- Grant permissions to anon role (for public access)
GRANT SELECT ON public.resume_templates TO anon;

-- Grant permissions to authenticated role
GRANT ALL PRIVILEGES ON public.users TO authenticated;
GRANT ALL PRIVILEGES ON public.user_profiles TO authenticated;
GRANT SELECT ON public.resume_templates TO authenticated;
GRANT ALL PRIVILEGES ON public.resumes TO authenticated;
GRANT INSERT, SELECT ON public.analytics_events TO authenticated;
GRANT ALL PRIVILEGES ON public.upwork_proposals TO authenticated;
GRANT ALL PRIVILEGES ON public.saved_jobs TO authenticated;

-- =====================================================
-- 12. INSERT DEFAULT RESUME TEMPLATES
-- =====================================================

INSERT INTO public.resume_templates (id, name, category, description, template_data, is_premium) VALUES
('modern-professional', 'Modern Professional', 'Professional', 'Clean and modern design perfect for corporate roles', '{"layout": "single-column", "colors": {"primary": "#2563eb", "secondary": "#64748b"}, "fonts": {"heading": "Inter", "body": "Inter"}}', false),
('creative-designer', 'Creative Designer', 'Creative', 'Bold and creative template for design professionals', '{"layout": "two-column", "colors": {"primary": "#7c3aed", "secondary": "#a855f7"}, "fonts": {"heading": "Poppins", "body": "Open Sans"}}', false),
('tech-minimal', 'Tech Minimal', 'Technology', 'Minimalist design perfect for tech professionals', '{"layout": "single-column", "colors": {"primary": "#059669", "secondary": "#6b7280"}, "fonts": {"heading": "JetBrains Mono", "body": "Inter"}}', false),
('executive-premium', 'Executive Premium', 'Executive', 'Premium template for senior executives', '{"layout": "two-column", "colors": {"primary": "#dc2626", "secondary": "#991b1b"}, "fonts": {"heading": "Playfair Display", "body": "Source Sans Pro"}}', true),
('academic-scholar', 'Academic Scholar', 'Academic', 'Perfect for academic and research positions', '{"layout": "single-column", "colors": {"primary": "#1e40af", "secondary": "#3b82f6"}, "fonts": {"heading": "Crimson Text", "body": "Source Serif Pro"}}', false);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Add comment to track migration
COMMENT ON SCHEMA public IS 'Phase 1 Complete Schema Migration - Job Seeker Platform';