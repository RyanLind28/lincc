-- 062_admin_push_broadcast.sql
-- Admin push tooling:
--   1. get_push_stats()             — subscription counts for the admin panel
--   2. admin_broadcast_notification — send a notification (in-app + push) to
--      personal users, businesses, or everyone.
-- Both are SECURITY DEFINER with an internal is_admin() gate, matching the
-- existing admin RPC pattern. The broadcast reuses create_notification(), which
-- already inserts the in-app row AND fires the push edge function per user, so
-- non-subscribers still see it in their bell and subscribers also get a push.

-- ── Subscription stats ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_push_stats()
RETURNS TABLE (
  total_devices            bigint,
  subscribed_users         bigint,
  subscribed_personal      bigint,
  subscribed_business      bigint,
  total_active_personal    bigint,
  total_active_business    bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can view push stats';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT count(*) FROM push_subscriptions),
    (SELECT count(DISTINCT user_id) FROM push_subscriptions),
    (SELECT count(DISTINCT ps.user_id)
       FROM push_subscriptions ps
       JOIN profiles p ON p.id = ps.user_id
      WHERE p.account_type = 'personal'),
    (SELECT count(DISTINCT ps.user_id)
       FROM push_subscriptions ps
       JOIN profiles p ON p.id = ps.user_id
      WHERE p.account_type = 'business'),
    (SELECT count(*) FROM profiles WHERE status = 'active' AND account_type = 'personal'),
    (SELECT count(*) FROM profiles WHERE status = 'active' AND account_type = 'business');
END;
$$;

-- REVOKE from PUBLIC alone leaves the implicit CREATE FUNCTION grant on anon
-- (see migration 060); revoke anon explicitly so only authenticated (gated by
-- is_admin() inside) can call it.
REVOKE EXECUTE ON FUNCTION get_push_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION get_push_stats() TO authenticated;

-- ── Broadcast ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_broadcast_notification(
  p_audience text,            -- 'users' | 'businesses' | 'all'
  p_title    text,
  p_body     text,
  p_url      text DEFAULT NULL -- optional deep link opened on tap
)
RETURNS integer               -- number of recipients
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_recipient RECORD;
  v_count     integer := 0;
  v_data      jsonb;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can broadcast notifications';
  END IF;

  IF p_audience NOT IN ('users', 'businesses', 'all') THEN
    RAISE EXCEPTION 'Invalid audience: %', p_audience;
  END IF;

  IF coalesce(btrim(p_title), '') = '' OR coalesce(btrim(p_body), '') = '' THEN
    RAISE EXCEPTION 'Title and body are required';
  END IF;

  v_data := jsonb_build_object('broadcast', true);
  IF p_url IS NOT NULL AND btrim(p_url) <> '' THEN
    v_data := v_data || jsonb_build_object('url', btrim(p_url));
  END IF;

  FOR v_recipient IN
    SELECT id FROM profiles
    WHERE status = 'active'
      AND (
        p_audience = 'all'
        OR (p_audience = 'users'      AND account_type = 'personal')
        OR (p_audience = 'businesses' AND account_type = 'business')
      )
  LOOP
    PERFORM create_notification(
      v_recipient.id,
      'admin_broadcast',
      p_title,
      p_body,
      v_data
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_broadcast_notification(text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION admin_broadcast_notification(text, text, text, text) TO authenticated;
