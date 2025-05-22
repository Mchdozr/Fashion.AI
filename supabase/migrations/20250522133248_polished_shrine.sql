/*
  # Fix API Integration Functions

  1. Changes
    - Drop existing functions before recreating them
    - Add check_generation_status function
    - Add start_generation function
    - Add performance indexes
    - Add updated_at column to generations table
  
  2. Security
    - Grant execute permissions to authenticated users
*/

-- Drop existing functions first
DROP FUNCTION IF EXISTS public.check_generation_status(text);
DROP FUNCTION IF EXISTS public.start_generation(text, text, text, uuid);

-- Create the check_generation_status function
CREATE OR REPLACE FUNCTION public.check_generation_status(
  p_task_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_generation_record generations;
BEGIN
  -- Get the generation record
  SELECT * INTO v_generation_record
  FROM generations
  WHERE task_id = p_task_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Generation not found';
  END IF;

  -- Return the status and result URL if available
  RETURN jsonb_build_object(
    'success', true,
    'status', v_generation_record.status,
    'resultUrl', v_generation_record.result_image_url
  );
END;
$$;

-- Create the start_generation function
CREATE OR REPLACE FUNCTION public.start_generation(
  p_model_image text,
  p_garment_image text,
  p_category text,
  p_generation_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task_id text;
  v_generation_record generations;
BEGIN
  -- Input validation
  IF p_model_image IS NULL OR p_garment_image IS NULL OR p_category IS NULL OR p_generation_id IS NULL THEN
    RAISE EXCEPTION 'All parameters are required';
  END IF;

  -- Get the generation record
  SELECT * INTO v_generation_record
  FROM generations
  WHERE id = p_generation_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Generation not found';
  END IF;

  -- Generate a unique task ID
  v_task_id := encode(gen_random_bytes(16), 'hex');

  -- Update the generation record with the task ID
  UPDATE generations
  SET 
    task_id = v_task_id,
    status = 'processing',
    updated_at = NOW()
  WHERE id = p_generation_id;

  -- Return the task ID
  RETURN jsonb_build_object(
    'success', true,
    'taskId', v_task_id
  );
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.check_generation_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_generation TO authenticated;

-- Add better indexes for performance
CREATE INDEX IF NOT EXISTS idx_generations_task_id ON generations(task_id);
CREATE INDEX IF NOT EXISTS idx_generations_user_status ON generations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations(created_at DESC);

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generations' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE generations 
    ADD COLUMN updated_at timestamptz DEFAULT now() NOT NULL;
  END IF;
END $$;