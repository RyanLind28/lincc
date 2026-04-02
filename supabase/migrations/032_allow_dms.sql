-- Add allow_dms column to events table
-- Controls whether attendees can DM the host about the event
ALTER TABLE events ADD COLUMN IF NOT EXISTS allow_dms BOOLEAN DEFAULT TRUE;
