-- Add missing email column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email text;

-- Add last_login column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login timestamp with time zone;

-- Create index on email for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Grant permissions to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE ON users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;