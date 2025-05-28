-- Add favorites and deleted items support
ALTER TABLE generations
ADD COLUMN is_favorite boolean DEFAULT false,
ADD COLUMN deleted_at timestamptz DEFAULT null;

-- Add index for faster queries
CREATE INDEX idx_generations_is_favorite ON generations(is_favorite) WHERE is_favorite = true;
CREATE INDEX idx_generations_deleted_at ON generations(deleted_at) WHERE deleted_at IS NOT NULL;