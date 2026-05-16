-- ============================================================================
-- 060_revoke_public_execute_on_internal_functions
-- ============================================================================
-- Follow-up to 059: REVOKE EXECUTE ... FROM anon, authenticated is a no-op
-- when CREATE FUNCTION's implicit grant to PUBLIC is still in place, because
-- the PUBLIC grant covers every role transitively. This migration revokes
-- PUBLIC explicitly so anon/authenticated truly cannot call these functions.
--
-- is_admin() and user_is_event_participant(uuid) intentionally keep the PUBLIC
-- grant because they are referenced inside RLS USING clauses; revoking would
-- break table reads for every signed-in user.
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.handle_new_user()                          FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_event_cancelled()                   FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_join_request()                      FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_nearby_event()                      FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_new_message()                       FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_request_response()                  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_review_prompts_on_expiry()          FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_voucher_redeemed()                  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_conversation_last_message()         FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_event_search_vector()               FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_participant_count()                 FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.events_publish_gate()                      FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.vouchers_publish_gate()                    FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.send_event_reminders()                     FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_dispute_report()                    FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_guest_review_dispute_report()       FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, jsonb) FROM PUBLIC;

-- search_events and suggest_users keep their explicit authenticated grant
-- (set in 059); revoking PUBLIC removes the residual anon access.
REVOKE EXECUTE ON FUNCTION public.search_events(text, integer)               FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.suggest_users(uuid, integer)               FROM PUBLIC;
