-- Schema Enhancements
-- Adds geospatial support, auto-profile creation, and utility functions
-- Run AFTER 001_initial_schema.sql

-- ===========================================
-- GEOSPATIAL SUPPORT
-- ===========================================

-- Enable PostGIS for location-based queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geography column to events for efficient distance queries
ALTER TABLE events ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT, 4326);

-- Add participant_count cache column
ALTER TABLE events ADD COLUMN IF NOT EXISTS participant_count INTEGER DEFAULT 0;

-- Create spatial index
CREATE INDEX IF NOT EXISTS idx_events_location_geo ON events USING GIST(location);

-- Trigger to auto-populate location from lat/lng
CREATE OR REPLACE FUNCTION set_event_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location = ST_SetSRID(ST_MakePoint(NEW.venue_lng, NEW.venue_lat), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS events_set_location ON events;
CREATE TRIGGER events_set_location
  BEFORE INSERT OR UPDATE OF venue_lat, venue_lng ON events
  FOR EACH ROW EXECUTE FUNCTION set_event_location();

-- Backfill existing events with location data
UPDATE events SET location = ST_SetSRID(ST_MakePoint(venue_lng, venue_lat), 4326)::geography
WHERE location IS NULL;

-- Function to find nearby events
CREATE OR REPLACE FUNCTION nearby_events(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 10,
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  host_id UUID,
  category_id UUID,
  title TEXT,
  description TEXT,
  venue_name TEXT,
  venue_address TEXT,
  venue_lat DOUBLE PRECISION,
  venue_lng DOUBLE PRECISION,
  start_time TIMESTAMPTZ,
  capacity INTEGER,
  join_mode join_mode,
  audience audience_type,
  status event_status,
  participant_count INTEGER,
  distance_km DOUBLE PRECISION
)
LANGUAGE sql STABLE
AS $$
  SELECT
    e.id,
    e.host_id,
    e.category_id,
    e.title,
    e.description,
    e.venue_name,
    e.venue_address,
    e.venue_lat,
    e.venue_lng,
    e.start_time,
    e.capacity,
    e.join_mode,
    e.audience,
    e.status,
    COALESCE(e.participant_count, 0),
    ST_Distance(
      e.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) / 1000 AS distance_km
  FROM events e
  WHERE e.status = 'active'
    AND e.start_time > NOW()
    AND ST_DWithin(
      e.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      radius_km * 1000
    )
  ORDER BY distance_km ASC
  LIMIT limit_count;
$$;

-- ===========================================
-- AUTO PROFILE CREATION
-- ===========================================

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, dob, gender)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'dob')::DATE, '2000-01-01'),
    COALESCE((NEW.raw_user_meta_data->>'gender')::user_gender, 'non-binary')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ===========================================
-- PARTICIPANT COUNT TRACKING
-- ===========================================

-- Trigger to update event participant_count
CREATE OR REPLACE FUNCTION update_participant_count()
RETURNS TRIGGER AS $$
DECLARE
  v_event_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_event_id := OLD.event_id;
  ELSE
    v_event_id := NEW.event_id;
  END IF;

  UPDATE events SET participant_count = (
    SELECT COUNT(*) FROM event_participants
    WHERE event_id = v_event_id AND status = 'approved'
  ) WHERE id = v_event_id;

  -- Auto-set event to 'full' if at capacity
  UPDATE events SET status = 'full'
  WHERE id = v_event_id
    AND status = 'active'
    AND participant_count >= capacity;

  -- Revert 'full' status if no longer at capacity
  UPDATE events SET status = 'active'
  WHERE id = v_event_id
    AND status = 'full'
    AND participant_count < capacity;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS participants_count_trigger ON event_participants;
CREATE TRIGGER participants_count_trigger
  AFTER INSERT OR UPDATE OF status OR DELETE ON event_participants
  FOR EACH ROW EXECUTE FUNCTION update_participant_count();

-- ===========================================
-- NOTIFICATION HELPERS
-- ===========================================

-- Function to create a notification (security definer for triggers)
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT '{}'
)
RETURNS notifications
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_notification notifications;
BEGIN
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (p_user_id, p_type, p_title, p_body, p_data)
  RETURNING * INTO v_notification;
  RETURN v_notification;
END;
$$;

-- Trigger to notify host of join requests
CREATE OR REPLACE FUNCTION notify_join_request()
RETURNS TRIGGER AS $$
DECLARE
  v_event events;
  v_user profiles;
BEGIN
  IF NEW.status = 'pending' THEN
    SELECT * INTO v_event FROM events WHERE id = NEW.event_id;
    SELECT * INTO v_user FROM profiles WHERE id = NEW.user_id;

    PERFORM create_notification(
      v_event.host_id,
      'join_request',
      'New join request',
      v_user.first_name || ' wants to join ' || v_event.title,
      jsonb_build_object('event_id', NEW.event_id, 'user_id', NEW.user_id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_join_request ON event_participants;
CREATE TRIGGER on_join_request
  AFTER INSERT ON event_participants
  FOR EACH ROW EXECUTE FUNCTION notify_join_request();

-- Trigger to notify user when request is approved/rejected
CREATE OR REPLACE FUNCTION notify_request_response()
RETURNS TRIGGER AS $$
DECLARE
  v_event events;
BEGIN
  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
    SELECT * INTO v_event FROM events WHERE id = NEW.event_id;

    IF NEW.status = 'approved' THEN
      PERFORM create_notification(
        NEW.user_id,
        'request_approved',
        'Request approved!',
        'You''re in! See you at ' || v_event.title,
        jsonb_build_object('event_id', NEW.event_id)
      );
    ELSE
      PERFORM create_notification(
        NEW.user_id,
        'request_declined',
        'Request declined',
        'Your request to join ' || v_event.title || ' was declined',
        jsonb_build_object('event_id', NEW.event_id)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_request_response ON event_participants;
CREATE TRIGGER on_request_response
  AFTER UPDATE OF status ON event_participants
  FOR EACH ROW EXECUTE FUNCTION notify_request_response();

-- ===========================================
-- UTILITY FUNCTIONS
-- ===========================================

-- Function to expire past events (call via cron or edge function)
CREATE OR REPLACE FUNCTION expire_past_events()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE events
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at < NOW();
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Function to check if user is blocked
CREATE OR REPLACE FUNCTION is_blocked(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM blocks
    WHERE (blocker_id = auth.uid() AND blocked_id = check_user_id)
       OR (blocker_id = check_user_id AND blocked_id = auth.uid())
  );
$$;

-- Function to get user's upcoming events
CREATE OR REPLACE FUNCTION my_upcoming_events()
RETURNS TABLE (
  id UUID,
  title TEXT,
  venue_name TEXT,
  start_time TIMESTAMPTZ,
  is_host BOOLEAN,
  participant_status participant_status
)
LANGUAGE sql STABLE
AS $$
  SELECT e.id, e.title, e.venue_name, e.start_time, TRUE, NULL::participant_status
  FROM events e
  WHERE e.host_id = auth.uid() AND e.status = 'active' AND e.start_time > NOW()
  UNION ALL
  SELECT e.id, e.title, e.venue_name, e.start_time, FALSE, ep.status
  FROM events e
  INNER JOIN event_participants ep ON ep.event_id = e.id
  WHERE ep.user_id = auth.uid()
    AND ep.status IN ('pending', 'approved')
    AND e.status = 'active'
    AND e.start_time > NOW()
  ORDER BY start_time ASC;
$$;

-- ===========================================
-- CATEGORY VALUE COLUMN (for frontend mapping)
-- ===========================================

-- Add value column to categories if not exists
ALTER TABLE categories ADD COLUMN IF NOT EXISTS value TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id);

-- Update existing categories with values
UPDATE categories SET value = LOWER(REPLACE(name, ' & ', '-')) WHERE value IS NULL;
UPDATE categories SET value = 'food' WHERE name = 'Food & Drinks';
UPDATE categories SET value = 'art' WHERE name = 'Art & Culture';
UPDATE categories SET value = 'learning' WHERE name = 'Study & Work';
UPDATE categories SET value = 'wellness' WHERE name = 'Yoga & Wellness';

-- Add unique constraint on value
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_value ON categories(value);

-- ===========================================
-- EVENT IMAGES STORAGE
-- ===========================================

-- Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for event images
CREATE POLICY "event_image_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-images');

CREATE POLICY "event_image_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'event-images' AND auth.uid() IS NOT NULL);
