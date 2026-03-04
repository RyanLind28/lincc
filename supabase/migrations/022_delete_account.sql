-- 022_delete_account.sql
-- Hard-delete account RPC function for GDPR compliance.
-- Deletes all user data from every table, then deletes the profile row.
-- Note: auth.users row cannot be deleted from an RPC (requires admin API).
-- The profile deletion effectively orphans the auth row; a cleanup job or
-- manual admin step can remove it, or the user simply cannot log in.

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

  -- Delete conversations where user is a participant
  DELETE FROM conversations
    WHERE user1_id = target_user_id OR user2_id = target_user_id;

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

  -- Delete reports filed by or against user
  DELETE FROM reports WHERE reporter_id = target_user_id OR reported_id = target_user_id;

  -- Delete notifications
  DELETE FROM notifications WHERE user_id = target_user_id;

  -- Delete push subscriptions
  DELETE FROM push_subscriptions WHERE user_id = target_user_id;

  -- Delete vouchers created by user
  DELETE FROM vouchers WHERE created_by = target_user_id;

  -- Delete the profile (this is the "soft" auth deletion — the auth.users row remains
  -- but the user has no profile and cannot use the app)
  DELETE FROM profiles WHERE id = target_user_id;
END;
$$;
