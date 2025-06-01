-- Update handle_new_user function to include user details
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    credits,
    subscription_tier,
    created_at,
    updated_at,
    first_name,
    last_name,
    email
  )
  VALUES (
    NEW.id,
    10, -- Default credits
    'free', -- Default subscription tier
    NOW(),
    NOW(),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();