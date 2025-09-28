-- Create analytics table for tracking user events and feature usage
CREATE TABLE IF NOT EXISTS public.analytics (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    feature_name TEXT NOT NULL,
    action TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON public.analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_feature_name ON public.analytics(feature_name);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics(created_at);

-- Enable Row Level Security
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own analytics" ON public.analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics" ON public.analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can access all analytics" ON public.analytics
    FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions to authenticated users
GRANT SELECT, INSERT ON public.analytics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analytics TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.analytics_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.analytics_id_seq TO service_role;