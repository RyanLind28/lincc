-- 007: Enable realtime for events table + schedule event expiry
-- Required by: Phase 3 real-time subscriptions, Phase 5 event expiry

-- 1. Add events table to realtime publication
-- This allows frontend Supabase channels to receive INSERT/UPDATE/DELETE on events
ALTER PUBLICATION supabase_realtime ADD TABLE events;

-- 2. Schedule expire_past_events() to run every 5 minutes via pg_cron
-- The function already exists from 002_enhancements.sql
-- pg_cron is available on Supabase Pro plans. If not available, use Supabase Edge Functions or external cron.
DO $$
BEGIN
  -- Only create the cron job if pg_cron extension is available
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'expire-past-events',
      '*/5 * * * *',  -- every 5 minutes
      $$SELECT expire_past_events()$$
    );
  END IF;
END
$$;
