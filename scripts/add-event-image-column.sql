-- Add image_url column to special_events table
-- Run once via Neon SQL Editor

ALTER TABLE special_events
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'special_events' ORDER BY ordinal_position;
