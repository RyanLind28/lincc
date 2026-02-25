-- 015: Notification preferences, quiet hours, nearby event alerts, connection-based priority
-- Chunk C of Phase 3: Push Notifications

-- ===========================================
-- ADD notification_preferences TO profiles
-- ===========================================
-- JSONB column storing per-type push toggles, quiet hours, and nearby alerts config
-- Default: all notification types enabled, quiet hours disabled, nearby alerts enabled

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT jsonb_build_object(
  'join_request', true,
  'request_approved', true,
  'request_declined', true,
  'new_message', true,
  'event_cancelled', true,
  'event_starting', true,
  'nearby_event', true,
  'quiet_hours_enabled', false,
  'quiet_hours_start', '22:00',
  'quiet_hours_end', '07:00'
);

-- ===========================================
-- ADD last known location TO profiles
-- ===========================================
-- Nullable lat/lng updated periodically from the frontend
-- Used by nearby event alerts trigger

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS last_lng DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS idx_profiles_location
ON profiles(last_lat, last_lng)
WHERE last_lat IS NOT NULL AND last_lng IS NOT NULL;

-- ===========================================
-- UPDATE create_notification() — CHECK PREFERENCES + QUIET HOURS
-- ===========================================
-- Still always creates the in-app notification row.
-- Only skips the push (pg_net call) if:
--   1. The notification type is disabled in user preferences, OR
--   2. Quiet hours are active (unless sender is a "connection" with 3+ shared events)

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
  v_prefs JSONB;
  v_type_enabled BOOLEAN;
  v_quiet_enabled BOOLEAN;
  v_quiet_start TIME;
  v_quiet_end TIME;
  v_now TIME;
  v_in_quiet_hours BOOLEAN := FALSE;
  v_is_connection BOOLEAN := FALSE;
  v_sender_id UUID;
  v_should_push BOOLEAN := TRUE;
BEGIN
  -- Insert notification row (always — in-app notifications are never suppressed)
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (p_user_id, p_type, p_title, p_body, p_data)
  RETURNING * INTO v_notification;

  -- Fetch user notification preferences
  SELECT COALESCE(notification_preferences, '{}'::jsonb)
  INTO v_prefs
  FROM profiles
  WHERE id = p_user_id;

  -- Check if this notification type is enabled (default true if not set)
  v_type_enabled := COALESCE((v_prefs->>p_type)::boolean, true);

  IF NOT v_type_enabled THEN
    v_should_push := FALSE;
  END IF;

  -- Check quiet hours
  IF v_should_push THEN
    v_quiet_enabled := COALESCE((v_prefs->>'quiet_hours_enabled')::boolean, false);

    IF v_quiet_enabled THEN
      v_quiet_start := COALESCE((v_prefs->>'quiet_hours_start')::time, '22:00'::time);
      v_quiet_end := COALESCE((v_prefs->>'quiet_hours_end')::time, '07:00'::time);
      v_now := LOCALTIME;

      -- Handle overnight quiet hours (e.g., 22:00 to 07:00)
      IF v_quiet_start > v_quiet_end THEN
        v_in_quiet_hours := (v_now >= v_quiet_start OR v_now < v_quiet_end);
      ELSE
        v_in_quiet_hours := (v_now >= v_quiet_start AND v_now < v_quiet_end);
      END IF;

      -- Connection check: if sender has 3+ shared events, bypass quiet hours
      IF v_in_quiet_hours AND p_data ? 'sender_id' THEN
        v_sender_id := (p_data->>'sender_id')::uuid;
        IF v_sender_id IS NOT NULL THEN
          v_is_connection := (
            SELECT COUNT(*) >= 3
            FROM (
              -- Events where both users participated (as host or approved participant)
              SELECT e.id
              FROM events e
              WHERE (
                e.host_id = p_user_id
                OR EXISTS (SELECT 1 FROM event_participants ep WHERE ep.event_id = e.id AND ep.user_id = p_user_id AND ep.status = 'approved')
              )
              AND (
                e.host_id = v_sender_id
                OR EXISTS (SELECT 1 FROM event_participants ep2 WHERE ep2.event_id = e.id AND ep2.user_id = v_sender_id AND ep2.status = 'approved')
              )
              AND e.status IN ('active', 'full', 'expired')
            ) shared
          );
        END IF;
      END IF;

      IF v_in_quiet_hours AND NOT v_is_connection THEN
        v_should_push := FALSE;
      END IF;
    END IF;
  END IF;

  -- Send push notification if not suppressed
  IF v_should_push THEN
    PERFORM net.http_post(
      url := 'https://srrubyupwiiqnehshszd.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer 6ff20c7a9b51ff9cd1dc1f7851f686ba9bf05de19fb378b921be3cfe83c824cc'
      ),
      body := jsonb_build_object(
        'user_id', p_user_id,
        'title', p_title,
        'body', p_body,
        'type', p_type,
        'data', p_data
      )
    );
  END IF;

  RETURN v_notification;
END;
$$;

-- ===========================================
-- TRIGGER: NEARBY EVENT ALERTS
-- ===========================================
-- When a new active event is created, notify users who:
--   1. Have a known location (last_lat/last_lng not null)
--   2. Are within their settings_radius of the event
--   3. Have nearby_event notifications enabled
--   4. Are not the host
-- Uses Haversine formula for distance calculation.

CREATE OR REPLACE FUNCTION notify_nearby_event()
RETURNS TRIGGER AS $$
DECLARE
  v_user RECORD;
  v_distance DOUBLE PRECISION;
BEGIN
  -- Only on new active events
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    FOR v_user IN
      SELECT id, first_name, last_lat, last_lng, settings_radius,
             COALESCE(notification_preferences, '{}'::jsonb) AS prefs
      FROM profiles
      WHERE id != NEW.host_id
        AND status = 'active'
        AND last_lat IS NOT NULL
        AND last_lng IS NOT NULL
        AND COALESCE((notification_preferences->>'nearby_event')::boolean, true) = true
    LOOP
      -- Haversine distance in km
      v_distance := 6371 * ACOS(
        LEAST(1.0, GREATEST(-1.0,
          COS(RADIANS(v_user.last_lat)) * COS(RADIANS(NEW.venue_lat)) *
          COS(RADIANS(NEW.venue_lng) - RADIANS(v_user.last_lng)) +
          SIN(RADIANS(v_user.last_lat)) * SIN(RADIANS(NEW.venue_lat))
        ))
      );

      -- Only notify if event is within user's search radius
      IF v_distance <= COALESCE(v_user.settings_radius, 10) THEN
        PERFORM create_notification(
          v_user.id,
          'nearby_event',
          'New event near you!',
          NEW.title || ' is happening ' || ROUND(v_distance::numeric, 1) || ' km away',
          jsonb_build_object('event_id', NEW.id, 'distance_km', ROUND(v_distance::numeric, 1))
        );
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_nearby_event ON events;
CREATE TRIGGER on_nearby_event
  AFTER INSERT ON events
  FOR EACH ROW EXECUTE FUNCTION notify_nearby_event();
