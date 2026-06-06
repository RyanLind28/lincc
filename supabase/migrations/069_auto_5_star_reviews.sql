-- 069: Auto-submit 5-star reviews 72h after event expiry
--
-- Product call: "we want positive vibes on this app". If a guest or host
-- doesn't get round to rating each other within 72 hours of the event
-- ending, we silently fill in a 5-star review on their behalf. Comment is
-- left NULL so the public surface shows the rating without a fake quote.
--
-- Safety:
--   * Only touches events with status='expired' AND expires_at < now()-72h.
--   * ON CONFLICT DO NOTHING uses the existing UNIQUE (event_id, guest_id)
--     constraints on both tables, so anything the user has already
--     submitted (or auto-filled from a previous run) is left alone.
--   * SECURITY DEFINER so it can write across the relevant rows; PUBLIC
--     EXECUTE is revoked. Only cron / service_role can invoke it.

CREATE OR REPLACE FUNCTION public.auto_submit_default_reviews()
RETURNS TABLE(host_reviews_inserted integer, guest_reviews_inserted integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_host_inserts integer := 0;
  v_guest_inserts integer := 0;
BEGIN
  -- Guests rate the host + event (one row per approved participant per event)
  WITH inserted AS (
    INSERT INTO host_reviews (event_id, guest_id, host_rating, event_rating, comment)
    SELECT e.id, ep.user_id, 5, 5, NULL
    FROM events e
    JOIN event_participants ep ON ep.event_id = e.id
    WHERE e.status = 'expired'
      AND e.expires_at < now() - interval '72 hours'
      AND ep.status = 'approved'
      AND ep.user_id <> e.host_id
    ON CONFLICT (event_id, guest_id) DO NOTHING
    RETURNING 1
  )
  SELECT count(*) INTO v_host_inserts FROM inserted;

  -- Host rates each approved guest (one row per (event, guest))
  WITH inserted AS (
    INSERT INTO guest_reviews (event_id, host_id, guest_id, guest_rating, comment)
    SELECT e.id, e.host_id, ep.user_id, 5, NULL
    FROM events e
    JOIN event_participants ep ON ep.event_id = e.id
    WHERE e.status = 'expired'
      AND e.expires_at < now() - interval '72 hours'
      AND ep.status = 'approved'
      AND ep.user_id <> e.host_id
    ON CONFLICT (event_id, guest_id) DO NOTHING
    RETURNING 1
  )
  SELECT count(*) INTO v_guest_inserts FROM inserted;

  host_reviews_inserted := v_host_inserts;
  guest_reviews_inserted := v_guest_inserts;
  RETURN NEXT;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.auto_submit_default_reviews() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_submit_default_reviews() FROM anon, authenticated;

-- Schedule it every 15 minutes via pg_cron. Sits alongside the existing
-- expire-past-events and expire-past-vouchers jobs.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Unschedule any previous run of this job before re-creating, so
    -- re-applying the migration stays idempotent.
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-submit-default-reviews') THEN
      PERFORM cron.unschedule('auto-submit-default-reviews');
    END IF;

    PERFORM cron.schedule(
      'auto-submit-default-reviews',
      '*/15 * * * *',
      $sql$SELECT public.auto_submit_default_reviews()$sql$
    );
  END IF;
END
$$;
