/*
  # Add AI generations support

  1. Changes
    - Add `status` column to generations table
    - Add `task_id` column to generations table
    - Add indexes for better query performance
  
  2. Security
    - Update RLS policies to reflect new columns
*/

ALTER TABLE generations
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS task_id text;

-- Add index for faster status lookups
CREATE INDEX IF NOT EXISTS generations_status_idx ON generations(status);

-- Add index for task_id lookups
CREATE INDEX IF NOT EXISTS generations_task_id_idx ON generations(task_id);

-- Update RLS policies
ALTER POLICY "Users can read own generations"
ON generations
USING (auth.uid() = user_id);

ALTER POLICY "Users can create own generations"
ON generations
WITH CHECK (auth.uid() = user_id);