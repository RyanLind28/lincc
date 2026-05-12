-- 053_gdpr_export_user_data.sql
-- GDPR data portability: hand the caller a JSON blob of every row that
-- belongs to them, so they can download a copy before deletion.
--
-- SECURITY DEFINER + auth.uid() gate -- callers can only export their own
-- data. We deliberately exclude reciprocal data (people who blocked YOU,
-- reports filed AGAINST you) because that's other users' data, not yours.

CREATE OR REPLACE FUNCTION export_user_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_result jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'export_version', 1,
    'exported_at', NOW(),
    'user_id', v_user_id,
    'profile', (SELECT row_to_json(p) FROM profiles p WHERE p.id = v_user_id),
    'business', (SELECT row_to_json(b) FROM businesses b WHERE b.owner_id = v_user_id),
    'events_hosted', COALESCE(
      (SELECT jsonb_agg(row_to_json(e)) FROM events e WHERE e.host_id = v_user_id), '[]'::jsonb),
    'events_joined', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'event_id', ep.event_id,
        'status', ep.status,
        'joined_at', ep.created_at
      )) FROM event_participants ep WHERE ep.user_id = v_user_id), '[]'::jsonb),
    'messages_sent', COALESCE(
      (SELECT jsonb_agg(row_to_json(m)) FROM messages m WHERE m.sender_id = v_user_id), '[]'::jsonb),
    'direct_messages_sent', COALESCE(
      (SELECT jsonb_agg(row_to_json(dm)) FROM direct_messages dm WHERE dm.sender_id = v_user_id), '[]'::jsonb),
    'follows', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('followed_id', followed_id, 'created_at', created_at))
       FROM follows WHERE follower_id = v_user_id), '[]'::jsonb),
    'blocks', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('blocked_id', blocked_id, 'created_at', created_at))
       FROM blocks WHERE blocker_id = v_user_id), '[]'::jsonb),
    'saved_events', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('event_id', event_id, 'saved_at', created_at))
       FROM saved_events WHERE user_id = v_user_id), '[]'::jsonb),
    'voucher_redemptions', COALESCE(
      (SELECT jsonb_agg(row_to_json(vr)) FROM voucher_redemptions vr WHERE vr.user_id = v_user_id), '[]'::jsonb),
    'host_reviews_written', COALESCE(
      (SELECT jsonb_agg(row_to_json(hr)) FROM host_reviews hr WHERE hr.guest_id = v_user_id), '[]'::jsonb),
    'guest_reviews_written', COALESCE(
      (SELECT jsonb_agg(row_to_json(gr)) FROM guest_reviews gr WHERE gr.host_id = v_user_id), '[]'::jsonb),
    'reports_filed', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'reason', reason, 'details', details, 'status', status, 'created_at', created_at
      )) FROM reports WHERE reporter_id = v_user_id), '[]'::jsonb),
    'notifications', COALESCE(
      (SELECT jsonb_agg(row_to_json(n)) FROM (
        SELECT type, title, body, is_read, created_at
        FROM notifications WHERE user_id = v_user_id
        ORDER BY created_at DESC LIMIT 500
      ) n), '[]'::jsonb),
    'feedback', COALESCE(
      (SELECT jsonb_agg(row_to_json(f)) FROM feedback f WHERE f.user_id = v_user_id), '[]'::jsonb)
  )
  INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.export_user_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.export_user_data() TO authenticated;
