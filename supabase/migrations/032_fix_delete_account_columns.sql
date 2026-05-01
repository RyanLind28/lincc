-- 032_fix_delete_account_columns.sql
-- Fixes column name bugs in delete_user_account that were causing the entire
-- transaction to roll back, leaving accounts undeleted:
--   * messages.user_id      -> sender_id
--   * follows.following_id  -> followed_id
--   * removes event_reviews delete (table never existed in this project)
--   * adds reports.reviewed_by (NO ACTION FK that would block profile delete)
--
-- Most other tables CASCADE from profiles, so they get cleaned up automatically
-- when the profile row is deleted. Only NO ACTION FKs need manual handling.

CREATE OR REPLACE FUNCTION delete_user_account(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != target_user_id THEN
    RAISE EXCEPTION 'Unauthorized: you can only delete your own account';
  END IF;

  DELETE FROM direct_messages WHERE sender_id = target_user_id;

  DELETE FROM conversations
    WHERE participant_one = target_user_id OR participant_two = target_user_id;

  DELETE FROM messages WHERE sender_id = target_user_id;

  DELETE FROM event_participants WHERE user_id = target_user_id;

  DELETE FROM events WHERE host_id = target_user_id;

  DELETE FROM saved_events WHERE user_id = target_user_id;

  DELETE FROM follows WHERE follower_id = target_user_id OR followed_id = target_user_id;

  DELETE FROM blocks WHERE blocker_id = target_user_id OR blocked_id = target_user_id;

  -- reports has NO ACTION FK on all three columns -> blocks profile delete unless cleared
  DELETE FROM reports
    WHERE reporter_id = target_user_id
       OR reported_user_id = target_user_id
       OR reviewed_by = target_user_id;

  DELETE FROM notifications WHERE user_id = target_user_id;

  DELETE FROM push_subscriptions WHERE user_id = target_user_id;

  DELETE FROM voucher_redemptions WHERE user_id = target_user_id;

  DELETE FROM vouchers WHERE business_id = target_user_id;

  DELETE FROM feedback WHERE user_id = target_user_id;

  DELETE FROM profiles WHERE id = target_user_id;
END;
$$;

REVOKE ALL ON FUNCTION delete_user_account FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_user_account TO authenticated;
