-- Add user profile fields
ALTER TABLE users
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '';

-- Update existing users with email from auth.users
UPDATE users
SET email = au.email
FROM auth.users au
WHERE users.id = au.id
AND users.email = '';

-- Create function to update user profile
CREATE OR REPLACE FUNCTION update_user_profile(
  p_user_id uuid,
  p_first_name text,
  p_last_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET 
    first_name = p_first_name,
    last_name = p_last_name,
    updated_at = NOW()
  WHERE id = p_user_id
  AND auth.uid() = id;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_profile TO authenticated;