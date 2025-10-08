-- AI Personal Site Generator Database Schema
-- This migration creates all tables needed for the AI Personal Site Generator feature

-- Resume Parses Table
CREATE TABLE IF NOT EXISTS resume_parses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    parsed_data JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Personal Sites Table
CREATE TABLE IF NOT EXISTS personal_sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    parse_id UUID REFERENCES resume_parses(id) ON DELETE SET NULL,
    site_name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    custom_domain VARCHAR(255) UNIQUE,
    theme_id UUID,
    customizations JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Site Content Table
CREATE TABLE IF NOT EXISTS site_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID REFERENCES personal_sites(id) ON DELETE CASCADE,
    sections JSONB NOT NULL DEFAULT '{}',
    generated_content JSONB NOT NULL DEFAULT '{}',
    user_edits JSONB DEFAULT '{}',
    version INTEGER DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Site Themes Table
CREATE TABLE IF NOT EXISTS site_themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    template_config JSONB NOT NULL,
    preview_image_url TEXT,
    is_premium BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Site Analytics Table
CREATE TABLE IF NOT EXISTS site_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID REFERENCES personal_sites(id) ON DELETE CASCADE,
    page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    visitor_data JSONB DEFAULT '{}',
    referrer_data JSONB DEFAULT '{}',
    analytics_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_resume_parses_user_id ON resume_parses(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_parses_status ON resume_parses(status);
CREATE INDEX IF NOT EXISTS idx_resume_parses_created_at ON resume_parses(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_personal_sites_user_id ON personal_sites(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_sites_subdomain ON personal_sites(subdomain);
CREATE INDEX IF NOT EXISTS idx_personal_sites_status ON personal_sites(status);

CREATE INDEX IF NOT EXISTS idx_site_content_site_id ON site_content(site_id);

CREATE INDEX IF NOT EXISTS idx_site_analytics_site_id ON site_analytics(site_id);
CREATE INDEX IF NOT EXISTS idx_site_analytics_date ON site_analytics(analytics_date DESC);

-- Insert Default Themes
INSERT INTO site_themes (name, category, description, template_config, is_premium) VALUES
('Minimalist Pro', 'professional', 'Clean and professional design perfect for corporate professionals', 
 '{"layout": "single-column", "colors": {"primary": "#1e40af", "secondary": "#64748b", "background": "#ffffff", "text": "#374151"}, "fonts": {"heading": "Inter", "body": "Open Sans"}, "sections": ["hero", "about", "experience", "education", "skills", "contact"]}', false),
('Creative Portfolio', 'creative', 'Bold and vibrant design for creative professionals and artists', 
 '{"layout": "grid", "colors": {"primary": "#7c3aed", "secondary": "#f59e0b", "background": "#fafafa", "text": "#1f2937"}, "fonts": {"heading": "Poppins", "body": "Roboto"}, "sections": ["hero", "portfolio", "about", "skills", "experience", "contact"]}', true),
('Corporate Executive', 'corporate', 'Sophisticated design for executives and senior professionals', 
 '{"layout": "sidebar", "colors": {"primary": "#059669", "secondary": "#374151", "background": "#f8fafc", "text": "#111827"}, "fonts": {"heading": "Playfair Display", "body": "Source Sans Pro"}, "sections": ["hero", "summary", "experience", "achievements", "education", "contact"]}', true),
('Tech Developer', 'technology', 'Modern design tailored for software developers and tech professionals', 
 '{"layout": "split", "colors": {"primary": "#0ea5e9", "secondary": "#64748b", "background": "#ffffff", "text": "#334155"}, "fonts": {"heading": "JetBrains Mono", "body": "Inter"}, "sections": ["hero", "projects", "skills", "experience", "education", "contact"]}', false),
('Freelancer Hub', 'freelance', 'Versatile design perfect for freelancers and consultants', 
 '{"layout": "masonry", "colors": {"primary": "#dc2626", "secondary": "#9ca3af", "background": "#ffffff", "text": "#374151"}, "fonts": {"heading": "Montserrat", "body": "Lato"}, "sections": ["hero", "services", "portfolio", "testimonials", "about", "contact"]}', false)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE resume_parses ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for resume_parses
CREATE POLICY "Users can view own resume parses" ON resume_parses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own resume parses" ON resume_parses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own resume parses" ON resume_parses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own resume parses" ON resume_parses FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for personal_sites
CREATE POLICY "Users can view own sites" ON personal_sites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sites" ON personal_sites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sites" ON personal_sites FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sites" ON personal_sites FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for site_content
CREATE POLICY "Users can view own site content" ON site_content FOR SELECT USING (
    EXISTS (SELECT 1 FROM personal_sites WHERE id = site_content.site_id AND user_id = auth.uid())
);
CREATE POLICY "Users can modify own site content" ON site_content FOR ALL USING (
    EXISTS (SELECT 1 FROM personal_sites WHERE id = site_content.site_id AND user_id = auth.uid())
);

-- RLS Policies for site_analytics
CREATE POLICY "Users can view own site analytics" ON site_analytics FOR SELECT USING (
    EXISTS (SELECT 1 FROM personal_sites WHERE id = site_analytics.site_id AND user_id = auth.uid())
);
CREATE POLICY "Users can modify own site analytics" ON site_analytics FOR ALL USING (
    EXISTS (SELECT 1 FROM personal_sites WHERE id = site_analytics.site_id AND user_id = auth.uid())
);

-- Public access for site_themes
CREATE POLICY "Anyone can view active themes" ON site_themes FOR SELECT USING (is_active = true);

-- Grant Permissions
GRANT SELECT ON site_themes TO anon;
GRANT SELECT ON site_themes TO authenticated;

GRANT ALL PRIVILEGES ON resume_parses TO authenticated;
GRANT ALL PRIVILEGES ON personal_sites TO authenticated;
GRANT ALL PRIVILEGES ON site_content TO authenticated;
GRANT ALL PRIVILEGES ON site_analytics TO authenticated;

-- Add subscription tier column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_tier') THEN
        ALTER TABLE users ADD COLUMN subscription_tier VARCHAR(20) DEFAULT 'free';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'sites_created') THEN
        ALTER TABLE users ADD COLUMN sites_created INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_resume_parses_updated_at BEFORE UPDATE ON resume_parses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_personal_sites_updated_at BEFORE UPDATE ON personal_sites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_site_content_updated_at BEFORE UPDATE ON site_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();