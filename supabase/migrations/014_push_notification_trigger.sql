-- 014: Push notification delivery via Edge Function
-- Modifies create_notification() to also trigger Web Push via pg_net
-- Adds triggers: event_cancelled, new_message, event_starting reminders

-- ===========================================
-- ENSURE pg_net IS ENABLED
-- ===========================================
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ===========================================
-- UPDATE create_notification() TO TRIGGER PUSH
-- ===========================================
-- This replaces the existing function from 002_enhancements.sql
-- After inserting the notification row, it fires an async HTTP POST
-- to the Edge Function via pg_net

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
  -- Insert notification row (existing behavior)
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (p_user_id, p_type, p_title, p_body, p_data)
  RETURNING * INTO v_notification;

  -- Trigger push notification delivery via Edge Function
  -- Uses pg_net for async HTTP (non-blocking)
  -- Secret is hardcoded here; function is SECURITY DEFINER so source is protected
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

  RETURN v_notification;
END;
$$;

-- ===========================================
-- TRIGGER: EVENT CANCELLED
-- ===========================================
-- When an event status changes to 'cancelled', notify all approved participants

CREATE OR REPLACE FUNCTION notify_event_cancelled()
RETURNS TRIGGER AS $$
DECLARE
  v_participant RECORD;
BEGIN
  -- Only fire when status changes TO 'cancelled'
  IF NEW.status = 'cancelled' AND (OLD.status IS DISTINCT FROM 'cancelled') THEN
    -- Notify all approved participants (not the host)
    FOR v_participant IN
      SELECT user_id FROM event_participants
      WHERE event_id = NEW.id AND status = 'approved' AND user_id != NEW.host_id
    LOOP
      PERFORM create_notification(
        v_participant.user_id,
        'event_cancelled',
        'Event cancelled',
        NEW.title || ' has been cancelled',
        jsonb_build_object('event_id', NEW.id)
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_event_cancelled ON events;
CREATE TRIGGER on_event_cancelled
  AFTER UPDATE OF status ON events
  FOR EACH ROW EXECUTE FUNCTION notify_event_cancelled();

-- ===========================================
-- TRIGGER: NEW MESSAGE
-- ===========================================
-- When a new message is sent, notify all participants in the event
-- EXCEPT the sender. Throttled: skip if same user+event got a
-- new_message notification in the last 5 minutes.

CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  v_event events;
  v_sender profiles;
  v_recipient RECORD;
  v_recent_count INTEGER;
BEGIN
  -- Get event and sender info
  SELECT * INTO v_event FROM events WHERE id = NEW.event_id;
  SELECT * INTO v_sender FROM profiles WHERE id = NEW.sender_id;

  -- Notify host if they're not the sender
  IF v_event.host_id != NEW.sender_id THEN
    -- Check throttle: was a new_message notification sent to this user
    -- for this event in the last 5 minutes?
    SELECT COUNT(*) INTO v_recent_count
    FROM notifications
    WHERE user_id = v_event.host_id
      AND type = 'new_message'
      AND data->>'event_id' = NEW.event_id::text
      AND created_at > NOW() - INTERVAL '5 minutes';

    IF v_recent_count = 0 THEN
      PERFORM create_notification(
        v_event.host_id,
        'new_message',
        'New message in ' || v_event.title,
        v_sender.first_name || ': ' || LEFT(NEW.content, 50),
        jsonb_build_object('event_id', NEW.event_id, 'sender_id', NEW.sender_id)
      );
    END IF;
  END IF;

  -- Notify approved participants (excluding sender)
  FOR v_recipient IN
    SELECT user_id FROM event_participants
    WHERE event_id = NEW.event_id
      AND status = 'approved'
      AND user_id != NEW.sender_id
      AND user_id != v_event.host_id  -- host already handled above
  LOOP
    -- Check throttle per recipient
    SELECT COUNT(*) INTO v_recent_count
    FROM notifications
    WHERE user_id = v_recipient.user_id
      AND type = 'new_message'
      AND data->>'event_id' = NEW.event_id::text
      AND created_at > NOW() - INTERVAL '5 minutes';

    IF v_recent_count = 0 THEN
      PERFORM create_notification(
        v_recipient.user_id,
        'new_message',
        'New message in ' || v_event.title,
        v_sender.first_name || ': ' || LEFT(NEW.content, 50),
        jsonb_build_object('event_id', NEW.event_id, 'sender_id', NEW.sender_id)
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_message ON messages;
CREATE TRIGGER on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION notify_new_message();

-- ===========================================
-- CRON: EVENT STARTING REMINDERS
-- ===========================================
-- Runs every 5 minutes, finds events starting within the next hour
-- that haven't had a reminder sent yet, and creates event_starting
-- notifications for the host and all approved participants.

CREATE OR REPLACE FUNCTION send_event_reminders()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_event RECORD;
  v_participant RECORD;
  v_reminder_count INTEGER := 0;
  v_already_sent BOOLEAN;
BEGIN
  -- Find active events starting within the next hour
  FOR v_event IN
    SELECT id, host_id, title, start_time
    FROM events
    WHERE status = 'active'
      AND start_time > NOW()
      AND start_time <= NOW() + INTERVAL '1 hour'
  LOOP
    -- Check if we already sent a reminder for this event to the host
    SELECT EXISTS(
      SELECT 1 FROM notifications
      WHERE user_id = v_event.host_id
        AND type = 'event_starting'
        AND data->>'event_id' = v_event.id::text
    ) INTO v_already_sent;

    IF NOT v_already_sent THEN
      -- Notify the host
      PERFORM create_notification(
        v_event.host_id,
        'event_starting',
        'Event starting soon!',
        v_event.title || ' starts in less than an hour',
        jsonb_build_object('event_id', v_event.id)
      );
      v_reminder_count := v_reminder_count + 1;

      -- Notify all approved participants
      FOR v_participant IN
        SELECT user_id FROM event_participants
        WHERE event_id = v_event.id AND status = 'approved'
      LOOP
        PERFORM create_notification(
          v_participant.user_id,
          'event_starting',
          'Event starting soon!',
          v_event.title || ' starts in less than an hour',
          jsonb_build_object('event_id', v_event.id)
        );
        v_reminder_count := v_reminder_count + 1;
      END LOOP;
    END IF;
  END LOOP;

  RETURN v_reminder_count;
END;
$$;

-- Schedule the reminder cron job (every 5 minutes)
DO $outer$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Remove if already exists (ignore error if not found)
    BEGIN
      PERFORM cron.unschedule('send-event-reminders');
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
    PERFORM cron.schedule(
      'send-event-reminders',
      '*/5 * * * *',
      $cron$SELECT send_event_reminders()$cron$
    );
  END IF;
END
$outer$;
