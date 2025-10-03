-- Job Posting Platform Database Schema Migration
-- This migration transforms the existing job scraping platform into a comprehensive job posting platform

-- First, drop the existing role constraint to allow updates
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Update existing users to use new role format
UPDATE public.users SET role = 'job_seeker' WHERE role = 'user' OR role IS NULL OR role NOT IN ('job_poster', 'job_seeker', 'admin');
UPDATE public.users SET role = 'job_poster' WHERE role = 'admin';

-- Now add the new role constraint
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
CHECK (role IN ('job_poster', 'job_seeker', 'admin'));

-- Add new columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Create user_profiles table for extended user information
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    website VARCHAR(255),
    bio TEXT,
    location VARCHAR(255),
    skills JSONB DEFAULT '[]'::jsonb,
    resume_url TEXT,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can manage their own profile" ON public.user_profiles
    FOR ALL USING (auth.uid() = user_id);

-- Create new jobs table with proper structure for job posting platform
CREATE TABLE IF NOT EXISTS public.job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    posted_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements JSONB DEFAULT '[]'::jsonb,
    salary_min INTEGER,
    salary_max INTEGER,
    location VARCHAR(255) NOT NULL,
    job_type VARCHAR(20) NOT NULL CHECK (job_type IN ('full_time', 'part_time', 'contract', 'freelance')),
    experience_level VARCHAR(20) NOT NULL CHECK (experience_level IN ('entry', 'mid', 'senior', 'executive')),
    skills JSONB DEFAULT '[]'::jsonb,
    remote_allowed BOOLEAN DEFAULT false,
    application_deadline TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed', 'draft')),
    view_count INTEGER DEFAULT 0,
    application_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for job_postings
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

-- Create policies for job_postings
CREATE POLICY "Anyone can view active jobs" ON public.job_postings
    FOR SELECT USING (status = 'active');

CREATE POLICY "Job posters can manage their jobs" ON public.job_postings
    FOR ALL USING (auth.uid() = posted_by);

-- Create indexes for job_postings
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON public.job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_location ON public.job_postings(location);
CREATE INDEX IF NOT EXISTS idx_job_postings_job_type ON public.job_postings(job_type);
CREATE INDEX IF NOT EXISTS idx_job_postings_created_at ON public.job_postings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_postings_skills ON public.job_postings USING GIN(skills);

-- Create applications table
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.job_postings(id) ON DELETE CASCADE,
    applicant_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    cover_letter TEXT,
    resume_url TEXT NOT NULL,
    additional_info TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'rejected', 'hired')),
    ai_match_score INTEGER CHECK (ai_match_score >= 0 AND ai_match_score <= 100),
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, applicant_id)
);

-- Enable RLS for applications
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Create policies for applications
CREATE POLICY "Applicants can view their own applications" ON public.applications
    FOR SELECT USING (auth.uid() = applicant_id);

CREATE POLICY "Job posters can view applications for their jobs" ON public.applications
    FOR SELECT USING (auth.uid() IN (
        SELECT posted_by FROM public.job_postings WHERE id = job_id
    ));

CREATE POLICY "Applicants can create applications" ON public.applications
    FOR INSERT WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Job posters can update application status" ON public.applications
    FOR UPDATE USING (auth.uid() IN (
        SELECT posted_by FROM public.job_postings WHERE id = job_id
    ));

-- Create indexes for applications
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON public.applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant_id ON public.applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);

-- Create new saved_jobs table that references job_postings
CREATE TABLE IF NOT EXISTS public.job_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.job_postings(id) ON DELETE CASCADE,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

-- Enable RLS for job_bookmarks
ALTER TABLE public.job_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their bookmarked jobs" ON public.job_bookmarks
    FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_job_bookmarks_user_id ON public.job_bookmarks(user_id);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Create application_messages table for communication
CREATE TABLE IF NOT EXISTS public.application_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for application_messages
ALTER TABLE public.application_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages for their applications" ON public.application_messages
    FOR SELECT USING (
        auth.uid() = sender_id OR 
        auth.uid() IN (
            SELECT applicant_id FROM public.applications WHERE id = application_id
            UNION
            SELECT posted_by FROM public.job_postings jp 
            JOIN public.applications a ON jp.id = a.job_id 
            WHERE a.id = application_id
        )
    );

CREATE POLICY "Users can create messages for their applications" ON public.application_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        auth.uid() IN (
            SELECT applicant_id FROM public.applications WHERE id = application_id
            UNION
            SELECT posted_by FROM public.job_postings jp 
            JOIN public.applications a ON jp.id = a.job_id 
            WHERE a.id = application_id
        )
    );

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON public.users TO anon, authenticated;
GRANT ALL PRIVILEGES ON public.users TO authenticated;

GRANT SELECT ON public.user_profiles TO anon, authenticated;
GRANT ALL PRIVILEGES ON public.user_profiles TO authenticated;

GRANT SELECT ON public.job_postings TO anon, authenticated;
GRANT ALL PRIVILEGES ON public.job_postings TO authenticated;

GRANT SELECT ON public.applications TO anon, authenticated;
GRANT ALL PRIVILEGES ON public.applications TO authenticated;

GRANT SELECT ON public.job_bookmarks TO anon, authenticated;
GRANT ALL PRIVILEGES ON public.job_bookmarks TO authenticated;

GRANT SELECT ON public.notifications TO anon, authenticated;
GRANT ALL PRIVILEGES ON public.notifications TO authenticated;

GRANT SELECT ON public.application_messages TO anon, authenticated;
GRANT ALL PRIVILEGES ON public.application_messages TO authenticated;

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_postings_updated_at BEFORE UPDATE ON public.job_postings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();