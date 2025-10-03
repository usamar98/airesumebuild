-- Phase 1: Add Missing Tables and Columns for Complete Migration
-- This migration adds the missing tables and columns needed for the job seeker platform

-- =====================================================
-- 1. ADD MISSING COLUMNS TO EXISTING USERS TABLE
-- =====================================================

-- Add missing columns to users table
DO $$ 
BEGIN
    -- Add plan column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'plan') THEN
        ALTER TABLE public.users ADD COLUMN plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium'));
    END IF;
    
    -- Add usage_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'usage_count') THEN
        ALTER TABLE public.users ADD COLUMN usage_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add email_verification_token column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verification_token') THEN
        ALTER TABLE public.users ADD COLUMN email_verification_token VARCHAR(255);
    END IF;
    
    -- Add email_verification_expires column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verification_expires') THEN
        ALTER TABLE public.users ADD COLUMN email_verification_expires TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_active') THEN
        ALTER TABLE public.users ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- =====================================================
-- 2. ADD MISSING COLUMNS TO USER_PROFILES TABLE
-- =====================================================

DO $$ 
BEGIN
    -- Add phone column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'phone') THEN
        ALTER TABLE public.user_profiles ADD COLUMN phone VARCHAR(20);
    END IF;
    
    -- Add experience_level column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'experience_level') THEN
        ALTER TABLE public.user_profiles ADD COLUMN experience_level VARCHAR(50);
    END IF;
    
    -- Add portfolio_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'portfolio_url') THEN
        ALTER TABLE public.user_profiles ADD COLUMN portfolio_url VARCHAR(500);
    END IF;
    
    -- Add linkedin_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'linkedin_url') THEN
        ALTER TABLE public.user_profiles ADD COLUMN linkedin_url VARCHAR(500);
    END IF;
    
    -- Add github_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'github_url') THEN
        ALTER TABLE public.user_profiles ADD COLUMN github_url VARCHAR(500);
    END IF;
    
    -- Add full_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'full_name') THEN
        ALTER TABLE public.user_profiles ADD COLUMN full_name VARCHAR(255);
    END IF;
    
    -- Add avatar_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.user_profiles ADD COLUMN avatar_url VARCHAR(500);
    END IF;
END $$;

-- =====================================================
-- 3. CREATE RESUME TEMPLATES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.resume_templates (
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
-- 4. CREATE RESUMES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.resumes (
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
-- 5. CREATE ANALYTICS EVENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.analytics_events (
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
-- 6. CREATE UPWORK PROPOSALS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.upwork_proposals (
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
-- 7. UPDATE SAVED JOBS TABLE STRUCTURE
-- =====================================================

DO $$ 
BEGIN
    -- Add job_title column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saved_jobs' AND column_name = 'job_title') THEN
        ALTER TABLE public.saved_jobs ADD COLUMN job_title VARCHAR(500);
    END IF;
    
    -- Add company column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saved_jobs' AND column_name = 'company') THEN
        ALTER TABLE public.saved_jobs ADD COLUMN company VARCHAR(255);
    END IF;
    
    -- Add job_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saved_jobs' AND column_name = 'job_url') THEN
        ALTER TABLE public.saved_jobs ADD COLUMN job_url VARCHAR(1000);
    END IF;
    
    -- Add description column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saved_jobs' AND column_name = 'description') THEN
        ALTER TABLE public.saved_jobs ADD COLUMN description TEXT;
    END IF;
    
    -- Add salary_range column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saved_jobs' AND column_name = 'salary_range') THEN
        ALTER TABLE public.saved_jobs ADD COLUMN salary_range VARCHAR(100);
    END IF;
    
    -- Add location column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saved_jobs' AND column_name = 'location') THEN
        ALTER TABLE public.saved_jobs ADD COLUMN location VARCHAR(255);
    END IF;
    
    -- Add job_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saved_jobs' AND column_name = 'job_type') THEN
        ALTER TABLE public.saved_jobs ADD COLUMN job_type VARCHAR(100);
    END IF;
    
    -- Add tags column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saved_jobs' AND column_name = 'tags') THEN
        ALTER TABLE public.saved_jobs ADD COLUMN tags JSONB DEFAULT '[]';
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saved_jobs' AND column_name = 'created_at') THEN
        ALTER TABLE public.saved_jobs ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saved_jobs' AND column_name = 'updated_at') THEN
        ALTER TABLE public.saved_jobs ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- =====================================================
-- 8. CREATE PERFORMANCE INDEXES
-- =====================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_plan ON public.users(plan);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);

-- Resume templates indexes
CREATE INDEX IF NOT EXISTS idx_resume_templates_category ON public.resume_templates(category);
CREATE INDEX IF NOT EXISTS idx_resume_templates_is_premium ON public.resume_templates(is_premium);

-- Resumes indexes
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_template_id ON public.resumes(template_id);
CREATE INDEX IF NOT EXISTS idx_resumes_created_at ON public.resumes(created_at DESC);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_feature_action ON public.analytics_events(feature_name, action);

-- Upwork proposals indexes
CREATE INDEX IF NOT EXISTS idx_upwork_proposals_user_id ON public.upwork_proposals(user_id);
CREATE INDEX IF NOT EXISTS idx_upwork_proposals_created_at ON public.upwork_proposals(created_at DESC);

-- Saved jobs indexes
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON public.saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_status ON public.saved_jobs(status);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_created_at ON public.saved_jobs(created_at DESC);

-- =====================================================
-- 9. CREATE OR UPDATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_resume_templates_updated_at ON public.resume_templates;
CREATE TRIGGER update_resume_templates_updated_at BEFORE UPDATE ON public.resume_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_resumes_updated_at ON public.resumes;
CREATE TRIGGER update_resumes_updated_at BEFORE UPDATE ON public.resumes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_upwork_proposals_updated_at ON public.upwork_proposals;
CREATE TRIGGER update_upwork_proposals_updated_at BEFORE UPDATE ON public.upwork_proposals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_saved_jobs_updated_at ON public.saved_jobs;
CREATE TRIGGER update_saved_jobs_updated_at BEFORE UPDATE ON public.saved_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 10. INSERT DEFAULT RESUME TEMPLATES
-- =====================================================

INSERT INTO public.resume_templates (id, name, category, description, template_data, is_premium) VALUES
('modern-professional', 'Modern Professional', 'Professional', 'Clean and modern design perfect for corporate roles', '{"layout": "single-column", "colors": {"primary": "#2563eb", "secondary": "#64748b"}, "fonts": {"heading": "Inter", "body": "Inter"}}', false),
('creative-designer', 'Creative Designer', 'Creative', 'Bold and creative template for design professionals', '{"layout": "two-column", "colors": {"primary": "#7c3aed", "secondary": "#a855f7"}, "fonts": {"heading": "Poppins", "body": "Open Sans"}}', false),
('tech-minimal', 'Tech Minimal', 'Technology', 'Minimalist design perfect for tech professionals', '{"layout": "single-column", "colors": {"primary": "#059669", "secondary": "#6b7280"}, "fonts": {"heading": "JetBrains Mono", "body": "Inter"}}', false),
('executive-premium', 'Executive Premium', 'Executive', 'Premium template for senior executives', '{"layout": "two-column", "colors": {"primary": "#dc2626", "secondary": "#991b1b"}, "fonts": {"heading": "Playfair Display", "body": "Source Sans Pro"}}', true),
('academic-scholar', 'Academic Scholar', 'Academic', 'Perfect for academic and research positions', '{"layout": "single-column", "colors": {"primary": "#1e40af", "secondary": "#3b82f6"}, "fonts": {"heading": "Crimson Text", "body": "Source Serif Pro"}}', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Add comment to track migration
COMMENT ON SCHEMA public IS 'Phase 1 Missing Tables Migration - Job Seeker Platform';