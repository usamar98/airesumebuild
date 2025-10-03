-- Create job management tables for background job scheduling and monitoring

-- Job configurations table
CREATE TABLE IF NOT EXISTS job_configurations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    schedule TEXT NOT NULL, -- cron expression
    enabled BOOLEAN DEFAULT true,
    platform_type TEXT,
    platform_name TEXT,
    last_run TIMESTAMPTZ,
    next_run TIMESTAMPTZ,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    timeout_ms INTEGER DEFAULT 300000, -- 5 minutes default
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job executions table for tracking individual job runs
CREATE TABLE IF NOT EXISTS job_executions (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL REFERENCES job_configurations(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'timeout')),
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    retry_attempt INTEGER DEFAULT 0,
    execution_time_ms INTEGER,
    result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job logs table for detailed logging
CREATE TABLE IF NOT EXISTS job_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id TEXT NOT NULL REFERENCES job_executions(id) ON DELETE CASCADE,
    level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_configurations_enabled ON job_configurations(enabled);
CREATE INDEX IF NOT EXISTS idx_job_configurations_next_run ON job_configurations(next_run) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_job_configurations_platform ON job_configurations(platform_type, platform_name);

CREATE INDEX IF NOT EXISTS idx_job_executions_job_id ON job_executions(job_id);
CREATE INDEX IF NOT EXISTS idx_job_executions_status ON job_executions(status);
CREATE INDEX IF NOT EXISTS idx_job_executions_started_at ON job_executions(started_at);

CREATE INDEX IF NOT EXISTS idx_job_logs_execution_id ON job_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_job_logs_level ON job_logs(level);
CREATE INDEX IF NOT EXISTS idx_job_logs_created_at ON job_logs(created_at);

-- Create updated_at trigger for job_configurations
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_job_configurations_updated_at 
    BEFORE UPDATE ON job_configurations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default job configurations
INSERT INTO job_configurations (id, name, description, schedule, enabled, platform_type, platform_name, max_retries, timeout_ms) VALUES
('sync-website-analytics', 'Sync Website Analytics', 'Collect website analytics data from Google Analytics and internal tracking', '0 */15 * * * *', true, 'website', 'company_website', 3, 300000),
('sync-referrals', 'Sync Referrals Data', 'Collect and process internal referral tracking data', '0 */30 * * * *', true, 'referrals', 'internal_referrals', 3, 180000),
('aggregate-daily-data', 'Aggregate Daily Analytics', 'Process and aggregate daily analytics data from all platforms', '0 0 1 * * *', true, NULL, NULL, 2, 600000),
('aggregate-weekly-data', 'Aggregate Weekly Analytics', 'Process and aggregate weekly analytics data from all platforms', '0 0 2 * * 1', true, NULL, NULL, 2, 900000),
('aggregate-monthly-data', 'Aggregate Monthly Analytics', 'Process and aggregate monthly analytics data from all platforms', '0 0 3 1 * *', true, NULL, NULL, 2, 1800000),
('cleanup-old-data', 'Cleanup Old Analytics Data', 'Remove old raw analytics data to maintain database performance', '0 0 4 * * 0', true, NULL, NULL, 1, 1200000)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    schedule = EXCLUDED.schedule,
    max_retries = EXCLUDED.max_retries,
    timeout_ms = EXCLUDED.timeout_ms,
    updated_at = NOW();

-- Grant permissions to authenticated users for read access
GRANT SELECT ON job_configurations TO authenticated;
GRANT SELECT ON job_executions TO authenticated;
GRANT SELECT ON job_logs TO authenticated;

-- Grant permissions to service role for full access
GRANT ALL ON job_configurations TO service_role;
GRANT ALL ON job_executions TO service_role;
GRANT ALL ON job_logs TO service_role;

-- Create RLS policies
ALTER TABLE job_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_logs ENABLE ROW LEVEL SECURITY;

-- Policy for job_configurations - authenticated users can read all
CREATE POLICY "Allow authenticated users to read job configurations" ON job_configurations
    FOR SELECT TO authenticated USING (true);

-- Policy for job_executions - authenticated users can read all
CREATE POLICY "Allow authenticated users to read job executions" ON job_executions
    FOR SELECT TO authenticated USING (true);

-- Policy for job_logs - authenticated users can read all
CREATE POLICY "Allow authenticated users to read job logs" ON job_logs
    FOR SELECT TO authenticated USING (true);

-- Service role can do everything
CREATE POLICY "Allow service role full access to job_configurations" ON job_configurations
    FOR ALL TO service_role USING (true);

CREATE POLICY "Allow service role full access to job_executions" ON job_executions
    FOR ALL TO service_role USING (true);

CREATE POLICY "Allow service role full access to job_logs" ON job_logs
    FOR ALL TO service_role USING (true);

-- Create a view for job status summary
CREATE OR REPLACE VIEW job_status_summary AS
SELECT 
    jc.id,
    jc.name,
    jc.enabled,
    jc.last_run,
    jc.next_run,
    jc.retry_count,
    jc.max_retries,
    jc.platform_type,
    jc.platform_name,
    COALESCE(latest_execution.status, 'idle') as latest_status,
    latest_execution.started_at as latest_execution_started,
    latest_execution.completed_at as latest_execution_completed,
    latest_execution.error_message as latest_error,
    latest_execution.execution_time_ms as latest_execution_time,
    CASE 
        WHEN jc.enabled = false THEN 'disabled'
        WHEN latest_execution.status = 'running' THEN 'running'
        WHEN latest_execution.status = 'failed' AND jc.retry_count >= jc.max_retries THEN 'failed'
        WHEN jc.next_run IS NOT NULL AND jc.next_run > NOW() THEN 'scheduled'
        ELSE 'idle'
    END as overall_status
FROM job_configurations jc
LEFT JOIN LATERAL (
    SELECT *
    FROM job_executions je
    WHERE je.job_id = jc.id
    ORDER BY je.started_at DESC
    LIMIT 1
) latest_execution ON true;

-- Grant access to the view
GRANT SELECT ON job_status_summary TO authenticated;
GRANT SELECT ON job_status_summary TO service_role;