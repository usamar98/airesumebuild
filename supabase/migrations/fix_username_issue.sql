-- Fix username display issue
-- First, let's check and clean any problematic data

-- Update any users with 'usama' name to use their email prefix instead
UPDATE users 
SET name = SPLIT_PART(email, '@', 1)
WHERE name = 'usama' AND email IS NOT NULL;

-- Update the handle_new_user function to better handle name extraction
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_name text;
BEGIN
  -- Extract name from user metadata with better fallback logic
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    SPLIT_PART(NEW.email, '@', 1)
  );
  
  -- Ensure we don't insert empty or null names
  IF user_name IS NULL OR user_name = '' THEN
    user_name := SPLIT_PART(NEW.email, '@', 1);
  END IF;
  
  INSERT INTO public.users (id, name, email, role)
  VALUES (
    NEW.id,
    user_name,
    NEW.email,
    'user'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Clean up any existing users with missing or incorrect names
UPDATE users 
SET name = SPLIT_PART(email, '@', 1)
WHERE (name IS NULL OR name = '' OR name = 'usama') AND email IS NOT NULL;

-- Verify the changes
SELECT id, name, email, created_at FROM users ORDER BY created_at DESC LIMIT 10;