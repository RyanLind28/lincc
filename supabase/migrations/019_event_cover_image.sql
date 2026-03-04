-- Add cover image URL to events
-- Allows events to have a custom cover image (uploaded or from subcategory defaults)
ALTER TABLE events ADD COLUMN cover_image_url TEXT;
