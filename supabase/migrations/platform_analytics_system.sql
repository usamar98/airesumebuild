-- Platform Analytics System Migration
-- This migration creates the database schema for the platform analytics system

-- Create platform_configs table to store configuration for different platforms
CREATE TABLE platform_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform_type VARCHAR(50) NOT NULL CHECK (platform_type IN ('company_website', 'linkedin', 'indeed', 'referrals', 'job_boards', 'social_media')),
    platform_name VARCHAR(100) NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    api_credentials JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    sync_frequency VARCHAR(20) DEFAULT 'daily' CHECK (sync_frequency IN ('hourly', 'daily', 'weekly')),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, platform_type, platform_name)
);

-- Create platform_analytics_raw table to store raw data from platforms
CREATE TABLE platform_analytics_raw (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_config_id UUID NOT NULL REFERENCES platform_configs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data_type VARCHAR(50) NOT NULL, -- 'application', 'view', 'click', 'conversion', etc.
    raw_data JSONB NOT NULL,
    source_id VARCHAR(255), -- External ID from the platform
    collected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create platform_analytics_aggregated table for processed analytics
CREATE TABLE platform_analytics_aggregated (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform_type VARCHAR(50) NOT NULL,
    platform_name VARCHAR(100) NOT NULL,
    job_posting_id UUID REFERENCES job_postings(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL,
    metric_value INTEGER NOT NULL DEFAULT 0,
    aggregation_period VARCHAR(20) NOT NULL CHECK (aggregation_period IN ('hourly', 'daily', 'weekly', 'monthly')),
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referrals table for internal referral tracking
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referrer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    job_posting_id UUID REFERENCES job_postings(id) ON DELETE CASCADE,
    referral_code VARCHAR(50) UNIQUE NOT NULL,
    candidate_email VARCHAR(255),
    candidate_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'hired', 'rejected')),
    reward_amount DECIMAL(10,2),
    reward_status VARCHAR(20) DEFAULT 'pending' CHECK (reward_status IN ('pending', 'approved', 'paid')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create platform_sync_jobs table for tracking sync operations
CREATE TABLE platform_sync_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_config_id UUID NOT NULL REFERENCES platform_configs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    records_processed INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create website_analytics table for company website tracking
CREATE TABLE website_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    page_url VARCHAR(500) NOT NULL,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_term VARCHAR(100),
    utm_content VARCHAR(100),
    visitor_id VARCHAR(255),
    session_id VARCHAR(255),
    event_type VARCHAR(50) NOT NULL, -- 'page_view', 'job_view', 'application_start', 'application_complete'
    job_posting_id UUID REFERENCES job_postings(id) ON DELETE SET NULL,
    user_agent TEXT,
    ip_address INET,
    referrer_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_platform_configs_user_active ON platform_configs(user_id, is_active);
CREATE INDEX idx_platform_configs_platform_user ON platform_configs(platform_type, user_id);

CREATE INDEX idx_platform_analytics_raw_config_date ON platform_analytics_raw(platform_config_id, collected_at);
CREATE INDEX idx_platform_analytics_raw_user_date ON platform_analytics_raw(user_id, collected_at);
CREATE INDEX idx_platform_analytics_raw_processed ON platform_analytics_raw(processed, created_at);

CREATE INDEX idx_platform_analytics_aggregated_user_period ON platform_analytics_aggregated(user_id, period_start, period_end);
CREATE INDEX idx_platform_analytics_aggregated_platform_period ON platform_analytics_aggregated(platform_type, period_start, period_end);
CREATE INDEX idx_platform_analytics_aggregated_job_period ON platform_analytics_aggregated(job_posting_id, period_start, period_end);

CREATE INDEX idx_referrals_user_status ON referrals(user_id, status);
CREATE INDEX idx_referrals_referrer_status ON referrals(referrer_id, status);
CREATE INDEX idx_referrals_job_posting ON referrals(job_posting_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);

CREATE INDEX idx_platform_sync_jobs_config_status ON platform_sync_jobs(platform_config_id, status);
CREATE INDEX idx_platform_sync_jobs_user_created ON platform_sync_jobs(user_id, created_at);

CREATE INDEX idx_website_analytics_user_date ON website_analytics(user_id, created_at);
CREATE INDEX idx_website_analytics_job_posting ON website_analytics(job_posting_id, created_at);
CREATE INDEX idx_website_analytics_utm_source ON website_analytics(utm_source, created_at);

-- Enable Row Level Security
ALTER TABLE platform_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_analytics_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_analytics_aggregated ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for platform_configs
CREATE POLICY "Users can manage their own platform configs" ON platform_configs
    FOR ALL USING (user_id = auth.uid());

-- RLS Policies for platform_analytics_raw
CREATE POLICY "Users can view their own analytics raw data" ON platform_analytics_raw
    FOR ALL USING (user_id = auth.uid());

-- RLS Policies for platform_analytics_aggregated
CREATE POLICY "Users can view their own aggregated analytics" ON platform_analytics_aggregated
    FOR ALL USING (user_id = auth.uid());

-- RLS Policies for referrals
CREATE POLICY "Users can manage their own referrals" ON referrals
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Referrers can view referrals they created" ON referrals
    FOR SELECT USING (referrer_id = auth.uid());

-- RLS Policies for platform_sync_jobs
CREATE POLICY "Users can view their own sync jobs" ON platform_sync_jobs
    FOR ALL USING (user_id = auth.uid());

-- RLS Policies for website_analytics
CREATE POLICY "Users can view their own website analytics" ON website_analytics
    FOR ALL USING (user_id = auth.uid());

-- Grant permissions to authenticated users
GRANT ALL ON platform_configs TO authenticated;
GRANT ALL ON platform_analytics_raw TO authenticated;
GRANT ALL ON platform_analytics_aggregated TO authenticated;
GRANT ALL ON referrals TO authenticated;
GRANT ALL ON platform_sync_jobs TO authenticated;
GRANT ALL ON website_analytics TO authenticated;

-- Grant permissions to anon users for website analytics tracking
GRANT INSERT ON website_analytics TO anon;

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_platform_configs_updated_at BEFORE UPDATE ON platform_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_analytics_aggregated_updated_at BEFORE UPDATE ON platform_analytics_aggregated
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON referrals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate referral codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
BEGIN
    RETURN 'REF-' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8));
END;
$$ LANGUAGE plpgsql;

-- Function to aggregate platform analytics
CREATE OR REPLACE FUNCTION aggregate_platform_analytics(
    p_user_id UUID,
    p_platform_type VARCHAR(50),
    p_period_start TIMESTAMP WITH TIME ZONE,
    p_period_end TIMESTAMP WITH TIME ZONE,
    p_aggregation_period VARCHAR(20)
)
RETURNS VOID AS $$
BEGIN
    -- Delete existing aggregated data for this period
    DELETE FROM platform_analytics_aggregated 
    WHERE user_id = p_user_id 
      AND platform_type = p_platform_type 
      AND period_start = p_period_start 
      AND period_end = p_period_end
      AND aggregation_period = p_aggregation_period;

    -- Insert aggregated data
    INSERT INTO platform_analytics_aggregated (
        user_id, platform_type, platform_name, job_posting_id, metric_type, 
        metric_value, aggregation_period, period_start, period_end, metadata
    )
    SELECT 
        p_user_id,
        p_platform_type,
        pc.platform_name,
        COALESCE((raw_data->>'job_posting_id')::UUID, NULL) as job_posting_id,
        par.data_type as metric_type,
        COUNT(*) as metric_value,
        p_aggregation_period,
        p_period_start,
        p_period_end,
        jsonb_build_object('source_count', COUNT(DISTINCT par.source_id)) as metadata
    FROM platform_analytics_raw par
    JOIN platform_configs pc ON par.platform_config_id = pc.id
    WHERE pc.user_id = p_user_id
      AND pc.platform_type = p_platform_type
      AND par.collected_at >= p_period_start
      AND par.collected_at < p_period_end
      AND par.processed = false
    GROUP BY pc.platform_name, (raw_data->>'job_posting_id')::UUID, par.data_type;

    -- Mark raw data as processed
    UPDATE platform_analytics_raw 
    SET processed = true
    WHERE platform_config_id IN (
        SELECT id FROM platform_configs 
        WHERE user_id = p_user_id AND platform_type = p_platform_type
    )
    AND collected_at >= p_period_start
    AND collected_at < p_period_end
    AND processed = false;
END;
$$ LANGUAGE plpgsql;