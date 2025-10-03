-- Company Dashboard Professional Features Migration
-- This migration adds comprehensive company management, analytics, and team features

-- Create companies table for enhanced company profiles
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    cover_image_url VARCHAR(500),
    industry VARCHAR(100) NOT NULL,
    company_size VARCHAR(50) NOT NULL,
    website VARCHAR(255),
    social_links JSONB DEFAULT '{}',
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for companies
CREATE INDEX IF NOT EXISTS idx_companies_industry ON public.companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_verification_status ON public.companies(verification_status);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON public.companies(created_at DESC);

-- Enable RLS for companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Create policies for companies
CREATE POLICY "Anyone can view verified companies" ON public.companies
    FOR SELECT USING (verification_status = 'verified');

CREATE POLICY "Company members can manage their company" ON public.companies
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM public.team_members WHERE company_id = id AND status = 'active'
        )
    );

-- Update job_postings table to reference companies
ALTER TABLE public.job_postings 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Create index for company_id in job_postings
CREATE INDEX IF NOT EXISTS idx_job_postings_company_id ON public.job_postings(company_id);

-- Create team_members table for company team management
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'hr_manager', 'recruiter', 'hiring_manager')),
    permissions JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    joined_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(company_id, user_id)
);

-- Create indexes for team_members
CREATE INDEX IF NOT EXISTS idx_team_members_company_id ON public.team_members(company_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON public.team_members(role);

-- Enable RLS for team_members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Create policies for team_members
CREATE POLICY "Team members can view their company team" ON public.team_members
    FOR SELECT USING (
        auth.uid() = user_id OR
        auth.uid() IN (
            SELECT user_id FROM public.team_members tm2 
            WHERE tm2.company_id = company_id AND tm2.status = 'active'
        )
    );

CREATE POLICY "Company admins can manage team members" ON public.team_members
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM public.team_members 
            WHERE company_id = team_members.company_id 
            AND role = 'admin' 
            AND status = 'active'
        )
    );

-- Create interviews table for interview scheduling
CREATE TABLE IF NOT EXISTS public.interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    interviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    meeting_link VARCHAR(500),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
    feedback JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for interviews
CREATE INDEX IF NOT EXISTS idx_interviews_application_id ON public.interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_interviewer_id ON public.interviews(interviewer_id);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_at ON public.interviews(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON public.interviews(status);

-- Enable RLS for interviews
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- Create policies for interviews
CREATE POLICY "Interviewers can manage their interviews" ON public.interviews
    FOR ALL USING (auth.uid() = interviewer_id);

CREATE POLICY "Applicants can view their interviews" ON public.interviews
    FOR SELECT USING (
        auth.uid() IN (
            SELECT applicant_id FROM public.applications WHERE id = application_id
        )
    );

CREATE POLICY "Company team can manage interviews for their jobs" ON public.interviews
    FOR ALL USING (
        auth.uid() IN (
            SELECT tm.user_id FROM public.team_members tm
            JOIN public.job_postings jp ON tm.company_id = jp.company_id
            JOIN public.applications a ON jp.id = a.job_id
            WHERE a.id = application_id AND tm.status = 'active'
        )
    );

-- Create company_analytics table for analytics data
CREATE TABLE IF NOT EXISTS public.company_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    analytics_date DATE NOT NULL,
    metrics_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, analytics_date)
);

-- Create indexes for company_analytics
CREATE INDEX IF NOT EXISTS idx_company_analytics_company_id ON public.company_analytics(company_id);
CREATE INDEX IF NOT EXISTS idx_company_analytics_date ON public.company_analytics(analytics_date DESC);

-- Enable RLS for company_analytics
ALTER TABLE public.company_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for company_analytics
CREATE POLICY "Company team can view their analytics" ON public.company_analytics
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM public.team_members 
            WHERE company_id = company_analytics.company_id AND status = 'active'
        )
    );

CREATE POLICY "Company team can manage their analytics" ON public.company_analytics
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM public.team_members 
            WHERE company_id = company_analytics.company_id 
            AND role IN ('admin', 'hr_manager') 
            AND status = 'active'
        )
    );

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON public.companies TO anon;
GRANT ALL PRIVILEGES ON public.companies TO authenticated;

GRANT SELECT ON public.team_members TO anon;
GRANT ALL PRIVILEGES ON public.team_members TO authenticated;

GRANT SELECT ON public.interviews TO anon;
GRANT ALL PRIVILEGES ON public.interviews TO authenticated;

GRANT SELECT ON public.company_analytics TO anon;
GRANT ALL PRIVILEGES ON public.company_analytics TO authenticated;

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON public.companies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interviews_updated_at 
    BEFORE UPDATE ON public.interviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample company data
INSERT INTO public.companies (name, description, industry, company_size, website, verification_status)
VALUES 
('TechCorp Solutions', 'Leading technology solutions provider specializing in enterprise software development and digital transformation.', 'Technology', '100-500', 'https://techcorp.com', 'verified'),
('InnovateLabs', 'Innovation-driven software development company focused on cutting-edge web and mobile applications.', 'Software', '50-100', 'https://innovatelabs.com', 'pending'),
('DataDriven Analytics', 'Advanced data analytics and business intelligence solutions for modern enterprises.', 'Data & Analytics', '25-50', 'https://datadriven.com', 'verified')
ON CONFLICT DO NOTHING;

-- Insert sample job data linked to companies
INSERT INTO public.job_postings (company_id, posted_by, title, description, location, job_type, status, requirements, skills)
SELECT 
    c.id,
    (SELECT id FROM public.users WHERE role = 'job_poster' LIMIT 1),
    'Senior Software Engineer',
    'We are looking for an experienced software engineer to join our dynamic team and help build next-generation applications.',
    'San Francisco, CA',
    'full_time',
    'active',
    '["5+ years of software development experience", "Strong knowledge of React and Node.js", "Experience with cloud platforms", "Excellent problem-solving skills"]'::jsonb,
    '["React", "Node.js", "TypeScript", "AWS", "PostgreSQL"]'::jsonb
FROM public.companies c 
WHERE c.name = 'TechCorp Solutions'
ON CONFLICT DO NOTHING;

INSERT INTO public.job_postings (company_id, posted_by, title, description, location, job_type, status, requirements, skills)
SELECT 
    c.id,
    (SELECT id FROM public.users WHERE role = 'job_poster' LIMIT 1),
    'Frontend Developer',
    'Join our innovative team to create beautiful and responsive user interfaces for our cutting-edge applications.',
    'Remote',
    'full_time',
    'active',
    '["3+ years of frontend development experience", "Proficiency in React and modern JavaScript", "Experience with responsive design", "Knowledge of UI/UX principles"]'::jsonb,
    '["React", "JavaScript", "CSS", "HTML", "Figma"]'::jsonb
FROM public.companies c 
WHERE c.name = 'InnovateLabs'
ON CONFLICT DO NOTHING;

-- Insert sample analytics data
INSERT INTO public.company_analytics (company_id, analytics_date, metrics_data)
SELECT 
    c.id,
    CURRENT_DATE - INTERVAL '1 day',
    '{
        "job_views": 245,
        "applications_received": 18,
        "conversion_rate": 7.3,
        "time_to_hire": 21,
        "cost_per_hire": 2500,
        "source_breakdown": [
            {"source": "LinkedIn", "count": 8},
            {"source": "Indeed", "count": 5},
            {"source": "Company Website", "count": 3},
            {"source": "Referral", "count": 2}
        ]
    }'::jsonb
FROM public.companies c 
WHERE c.verification_status = 'verified'
ON CONFLICT (company_id, analytics_date) DO NOTHING;