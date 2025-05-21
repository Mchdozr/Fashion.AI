/*
  # Initial Schema Setup for FashnAI Studio

  1. New Tables
    - `users`
      - `id` (uuid, matches auth.users)
      - `credits` (integer, default 10)
      - `subscription_tier` (text, default 'free')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `generations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `model_image_url` (text)
      - `garment_image_url` (text)
      - `result_image_url` (text)
      - `category` (text)
      - `performance_mode` (text)
      - `num_samples` (integer)
      - `seed` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  credits integer DEFAULT 10 NOT NULL,
  subscription_tier text DEFAULT 'free' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT credits_non_negative CHECK (credits >= 0),
  CONSTRAINT valid_subscription_tier CHECK (subscription_tier IN ('free', 'pro', 'enterprise'))
);

-- Create generations table
CREATE TABLE IF NOT EXISTS generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  model_image_url text NOT NULL,
  garment_image_url text NOT NULL,
  result_image_url text,
  category text NOT NULL,
  performance_mode text NOT NULL,
  num_samples integer NOT NULL,
  seed integer NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT valid_category CHECK (category IN ('top', 'bottom', 'full-body')),
  CONSTRAINT valid_performance_mode CHECK (performance_mode IN ('performance', 'balanced', 'quality')),
  CONSTRAINT valid_num_samples CHECK (num_samples BETWEEN 1 AND 5)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create policies for generations table
CREATE POLICY "Users can read own generations"
  ON generations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own generations"
  ON generations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create function to update user credits
CREATE OR REPLACE FUNCTION decrement_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET credits = credits - 1,
      updated_at = now()
  WHERE id = NEW.user_id
  AND credits > 0;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to decrement credits on generation
CREATE TRIGGER decrement_credits_on_generation
  BEFORE INSERT ON generations
  FOR EACH ROW
  EXECUTE FUNCTION decrement_user_credits();

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();