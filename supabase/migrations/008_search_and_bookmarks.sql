-- 008: Full-text search on events + saved_events (bookmarks) table
-- Required by: Phase 8 Search & Discovery

-- 1. Add full-text search vector column to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 2. Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_events_search ON events USING GIN (search_vector);

-- 3. Function to update search vector on insert/update
CREATE OR REPLACE FUNCTION update_event_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.venue_name, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Trigger to auto-update search vector
DROP TRIGGER IF EXISTS update_event_search ON events;
CREATE TRIGGER update_event_search
  BEFORE INSERT OR UPDATE OF title, description, venue_name ON events
  FOR EACH ROW EXECUTE FUNCTION update_event_search_vector();

-- 5. Backfill existing events with search vectors
UPDATE events SET search_vector =
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(venue_name, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'C');

-- 6. Create saved_events (bookmarks) table
CREATE TABLE IF NOT EXISTS saved_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- 7. Indexes for saved_events
CREATE INDEX IF NOT EXISTS idx_saved_events_user ON saved_events(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_events_event ON saved_events(event_id);

-- 8. RLS for saved_events
ALTER TABLE saved_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own saved events
CREATE POLICY "Users can view own saved events"
  ON saved_events FOR SELECT
  USING (auth.uid() = user_id);

-- Users can save events
CREATE POLICY "Users can save events"
  ON saved_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can unsave their own events
CREATE POLICY "Users can unsave own events"
  ON saved_events FOR DELETE
  USING (auth.uid() = user_id);

-- 9. Database function for full-text search with ranking
CREATE OR REPLACE FUNCTION search_events(
  search_query TEXT,
  max_results INTEGER DEFAULT 20
)
RETURNS TABLE (
  event_id UUID,
  rank REAL,
  title TEXT,
  venue_name TEXT,
  category_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id AS event_id,
    ts_rank(e.search_vector, websearch_to_tsquery('english', search_query)) AS rank,
    e.title,
    e.venue_name,
    c.name AS category_name
  FROM events e
  LEFT JOIN categories c ON e.category_id = c.id
  WHERE e.search_vector @@ websearch_to_tsquery('english', search_query)
    AND e.status = 'active'
    AND e.expires_at >= NOW()
  ORDER BY rank DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
