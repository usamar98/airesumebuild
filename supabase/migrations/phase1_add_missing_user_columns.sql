-- Phase 1: Add missing columns to users table for JSON migration
-- This migration adds columns needed for migrating from JSON-based user data

-- =====================================================
-- 1. ADD MISSING COLUMNS TO USERS TABLE
-- =====================================================

-- Add password_hash column (for storing bcrypt hashed passwords)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE public.users ADD COLUMN password_hash TEXT;
        COMMENT ON COLUMN public.users.password_hash IS 'Bcrypt hashed password from JSON migration';
    END IF;
END $$;

-- Add password reset columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password_reset_token'
    ) THEN
        ALTER TABLE public.users ADD COLUMN password_reset_token TEXT;
        COMMENT ON COLUMN public.users.password_reset_token IS 'Token for password reset functionality';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password_reset_expires'
    ) THEN
        ALTER TABLE public.users ADD COLUMN password_reset_expires TIMESTAMPTZ;
        COMMENT ON COLUMN public.users.password_reset_expires IS 'Expiration time for password reset token';
    END IF;
END $$;

-- =====================================================
-- 2. CREATE FUNCTION TO GENERATE UUID FROM INTEGER
-- =====================================================

-- Function to generate deterministic UUIDs from integer IDs
-- This ensures consistent mapping between JSON integer IDs and Supabase UUIDs
CREATE OR REPLACE FUNCTION generate_uuid_from_int(input_int INTEGER)
RETURNS UUID AS $$
BEGIN
    -- Create a deterministic UUID based on the integer input
    -- Using MD5 hash of a namespace + integer to create UUID v4-like format
    RETURN (
        'a0eebc99-9c0b-4ef8-bb6d-' || 
        LPAD(TO_HEX(input_int), 12, '0')
    )::UUID;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 3. CREATE MAPPING TABLE FOR ID CONVERSION
-- =====================================================

-- Create a table to track the mapping between old integer IDs and new UUIDs
CREATE TABLE IF NOT EXISTS public.user_id_mapping (
    old_id INTEGER PRIMARY KEY,
    new_id UUID NOT NULL UNIQUE,
    migrated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE public.user_id_mapping IS 'Mapping table for converting JSON integer IDs to Supabase UUIDs';

-- =====================================================
-- 4. UPDATE RLS POLICIES FOR NEW COLUMNS
-- =====================================================

-- The existing RLS policies should still work, but let's ensure they're compatible
-- with the new columns by refreshing the policies

-- Drop and recreate the user data access policy to include new columns
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
CREATE POLICY "Users can view their own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
CREATE POLICY "Users can update their own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Index on password_hash for authentication queries
CREATE INDEX IF NOT EXISTS idx_users_password_hash ON public.users(password_hash);

-- Index on email for login queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Index on password reset token
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON public.users(password_reset_token);

-- Index on email verification token
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON public.users(email_verification_token);

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions on the new mapping table
GRANT SELECT ON public.user_id_mapping TO authenticated;
GRANT SELECT ON public.user_id_mapping TO anon;

-- Grant usage on the UUID generation function
GRANT EXECUTE ON FUNCTION generate_uuid_from_int(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_uuid_from_int(INTEGER) TO anon;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Add comment to track this migration
COMMENT ON SCHEMA public IS 'Phase 1 User Columns Migration - Added password_hash and UUID mapping support';