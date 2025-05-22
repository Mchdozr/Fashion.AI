/*
  # Fix Generations API Integration

  1. Changes
    - Add better constraints and defaults for generations table
    - Add indexes for faster queries
    - Update status handling
    - Add task tracking columns
  
  2. Security
    - Maintain existing RLS policies
*/

-- Add better status handling
ALTER TABLE generations
DROP CONSTRAINT IF EXISTS generations_status_check;

ALTER TABLE generations
ADD CONSTRAINT generations_status_check
CHECK (status IN ('pending', 'processing', 'completed', 'failed'));

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_generations_user_status 
ON generations(user_id, status);

CREATE INDEX IF NOT EXISTS idx_generations_created_at 
ON generations(created_at DESC);

-- Function to handle generation status updates
CREATE OR REPLACE FUNCTION update_generation_status(
  p_task_id TEXT,
  p_status TEXT,
  p_result_url TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE generations
  SET 
    status = p_status,
    result_image_url = COALESCE(p_result_url, result_image_url),
    updated_at = NOW()
  WHERE task_id = p_task_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Generation not found with task_id: %', p_task_id;
  END IF;
END;
$$;