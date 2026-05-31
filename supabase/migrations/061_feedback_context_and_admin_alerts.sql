-- 061_feedback_context_and_admin_alerts.sql
-- Two changes for the user-facing "report a problem" feature:
--   1. Add a `context` jsonb column to `feedback` so reports carry the screen,
--      device/user-agent, viewport, build mode and Sentry event id automatically
--      (so a stuck user doesn't have to describe their setup).
--   2. Alert admins when a bug/support report lands, reusing the existing
--      notification -> web-push pipeline (create_notification from migration 014).

ALTER TABLE feedback ADD COLUMN IF NOT EXISTS context jsonb;

-- Runs as the function owner (postgres) so it can call create_notification(),
-- which is locked away from anon/authenticated by migrations 059/060.
-- create_notification inserts the in-app notification AND fires the
-- send-push-notification edge function, so admins get the bell + a push with no
-- extra plumbing here. Only fires for problem reports, not generic feedback or
-- feature requests, to keep the noise down.
CREATE OR REPLACE FUNCTION notify_admins_of_feedback()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin RECORD;
  v_preview text;
BEGIN
  IF NEW.type NOT IN ('bug', 'support') THEN
    RETURN NEW;
  END IF;

  v_preview := left(coalesce(NULLIF(NEW.body, ''), NEW.subject, 'A user reported a problem'), 140);

  FOR v_admin IN SELECT id FROM profiles WHERE role = 'admin' LOOP
    PERFORM create_notification(
      v_admin.id,
      'feedback',
      'New problem report',
      v_preview,
      jsonb_build_object('feedback_id', NEW.id, 'feedback_type', NEW.type)
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Trigger functions fire regardless of EXECUTE grants; revoke anyway to match
-- the security-hardening pattern in 059/060.
REVOKE EXECUTE ON FUNCTION notify_admins_of_feedback() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION notify_admins_of_feedback() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_notify_admins_of_feedback ON feedback;
CREATE TRIGGER trg_notify_admins_of_feedback
  AFTER INSERT ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_of_feedback();
