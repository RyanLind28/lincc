-- ============================================================================
-- 059_security_advisor_fixes
-- ============================================================================
-- Resolves Supabase security advisor findings:
--   * SECURITY DEFINER RPCs exposed to anon/authenticated (advisor 0028/0029)
--   * Function search_path mutable (advisor 0011)
--   * Public buckets allow listing (advisor 0025)
--
-- Real bug fix: create_notification had no auth check and was callable by any
-- authenticated user, allowing notification + push-notification spoofing into
-- any user's inbox. Only triggers and service_role need to call it.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Revoke EXECUTE on trigger and pg_cron-only functions
-- ----------------------------------------------------------------------------
-- Trigger functions run with the table owner's privileges regardless of who
-- updated the row, so anon/authenticated EXECUTE grants are pure noise.
-- send_event_reminders is called by pg_cron as postgres. None of these are
-- invoked as RPCs from the frontend (verified by grep).
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                       FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_event_cancelled()                FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_join_request()                   FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_nearby_event()                   FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_message()                    FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_request_response()               FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_review_prompts_on_expiry()       FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_voucher_redeemed()               FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_conversation_last_message()      FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_event_search_vector()            FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_participant_count()              FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.events_publish_gate()                   FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.vouchers_publish_gate()                 FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.send_event_reminders()                  FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_dispute_report()                 FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_guest_review_dispute_report()    FROM anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2. Lock down create_notification (real bug — was callable by anon/authd)
-- ----------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, jsonb)
  FROM anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3. Revoke EXECUTE from anon on RPCs that already require auth.uid()
-- ----------------------------------------------------------------------------
-- Each function already raises 'not authenticated' when auth.uid() is null,
-- so revoking from anon is defense in depth; the call would fail anyway.
REVOKE EXECUTE ON FUNCTION public.admin_delete_user_account(uuid)  FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_user_account(uuid)        FROM anon;
REVOKE EXECUTE ON FUNCTION public.convert_to_business(text, text)  FROM anon;
REVOKE EXECUTE ON FUNCTION public.export_user_data()               FROM anon;
REVOKE EXECUTE ON FUNCTION public.redeem_voucher(uuid)             FROM anon;
REVOKE EXECUTE ON FUNCTION public.suggest_users(uuid, integer)     FROM anon;
REVOKE EXECUTE ON FUNCTION public.search_events(text, integer)     FROM anon;

-- is_admin() and user_is_event_participant(uuid) intentionally retain EXECUTE
-- for anon + authenticated because they are referenced inside RLS USING
-- clauses; revoking would break table reads.

-- ----------------------------------------------------------------------------
-- 4. Pin search_path on functions flagged by advisor 0011
-- ----------------------------------------------------------------------------
ALTER FUNCTION public.send_event_reminders()                                 SET search_path = public, pg_temp;
ALTER FUNCTION public.expire_past_vouchers()                                 SET search_path = public, pg_temp;
ALTER FUNCTION public.notify_nearby_event()                                  SET search_path = public, pg_temp;
ALTER FUNCTION public.set_business_verifications_updated_at()                SET search_path = public, pg_temp;
ALTER FUNCTION public.notify_voucher_redeemed()                              SET search_path = public, pg_temp;
ALTER FUNCTION public.create_notification(uuid, text, text, text, jsonb)     SET search_path = public, pg_temp;
ALTER FUNCTION public.notify_event_cancelled()                               SET search_path = public, pg_temp;
ALTER FUNCTION public.notify_new_message()                                   SET search_path = public, pg_temp;

-- ----------------------------------------------------------------------------
-- 5. Storage bucket listing — owner-scoped SELECT instead of public listing
-- ----------------------------------------------------------------------------
-- All four buckets have bucket.public = true, so anonymous URL reads of files
-- continue to work without any RLS policy. The broad SELECT policies were
-- only allowing storage.objects LISTING, which leaks every user's UUID and
-- filenames. Replace with owner-scoped policies; add admin SELECT for the
-- three buckets that were missing it.

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public read business logos"            ON storage.objects;
DROP POLICY IF EXISTS "event_image_select"                    ON storage.objects;
DROP POLICY IF EXISTS "voucher_cover_select"                  ON storage.objects;

-- Owner-scoped SELECT (matches existing UPDATE/DELETE pattern for each bucket)
CREATE POLICY "Users list own avatars"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid())::text);

CREATE POLICY "Users list own business logos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'business-logos' AND (storage.foldername(name))[1] = (select auth.uid())::text);

CREATE POLICY "Users list own event images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'event-images' AND (storage.foldername(name))[1] = (select auth.uid())::text);

CREATE POLICY "Users list own voucher covers"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'voucher-covers' AND (storage.foldername(name))[1] = (select auth.uid())::text);

-- Admin SELECT for buckets that were missing it (avatars already has it)
CREATE POLICY "admin_business_logo_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'business-logos' AND public.is_admin());

CREATE POLICY "admin_event_image_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'event-images' AND public.is_admin());

CREATE POLICY "admin_voucher_cover_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'voucher-covers' AND public.is_admin());
