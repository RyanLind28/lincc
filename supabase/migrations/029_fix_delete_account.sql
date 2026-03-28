-- 029_fix_delete_account.sql
-- Fix column name mismatches in delete_user_account function.

CREATE OR REPLACE FUNCTION delete_user_account(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security: only the authenticated user can delete their own account
  IF auth.uid() IS NULL OR auth.uid() != target_user_id THEN
    RAISE EXCEPTION 'Unauthorized: you can only delete your own account';
  END IF;

  -- Delete direct messages sent by user
  DELETE FROM direct_messages WHERE sender_id = target_user_id;

  -- Delete conversations where user is a participant (fixed column names)
  DELETE FROM conversations
    WHERE participant_one = target_user_id OR participant_two = target_user_id;

  -- Delete event chat messages sent by user
  DELETE FROM messages WHERE user_id = target_user_id;

  -- Delete event participation records
  DELETE FROM event_participants WHERE user_id = target_user_id;

  -- Delete events hosted by user
  DELETE FROM events WHERE host_id = target_user_id;

  -- Delete saved events
  DELETE FROM saved_events WHERE user_id = target_user_id;

  -- Delete follow relationships (both directions)
  DELETE FROM follows WHERE follower_id = target_user_id OR following_id = target_user_id;

  -- Delete blocks (both directions)
  DELETE FROM blocks WHERE blocker_id = target_user_id OR blocked_id = target_user_id;

  -- Delete reports filed by or against user (fixed column name)
  DELETE FROM reports WHERE reporter_id = target_user_id OR reported_user_id = target_user_id;

  -- Delete notifications
  DELETE FROM notifications WHERE user_id = target_user_id;

  -- Delete push subscriptions
  DELETE FROM push_subscriptions WHERE user_id = target_user_id;

  -- Delete voucher redemptions
  DELETE FROM voucher_redemptions WHERE user_id = target_user_id;

  -- Delete vouchers created by user
  DELETE FROM vouchers WHERE business_id = target_user_id;

  -- Delete event reviews
  DELETE FROM event_reviews WHERE user_id = target_user_id;

  -- Delete feedback
  DELETE FROM feedback WHERE user_id = target_user_id;

  -- Delete the profile
  DELETE FROM profiles WHERE id = target_user_id;
END;
$$;

-- Restrict function access
REVOKE ALL ON FUNCTION delete_user_account FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_user_account TO authenticated;
