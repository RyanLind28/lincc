-- Security Fixes
-- Resolves Supabase linter warnings

-- ===========================================
-- FIX FUNCTION SEARCH PATHS
-- ===========================================

-- Trigger functions
ALTER FUNCTION public.notify_join_request() SET search_path = public;
ALTER FUNCTION public.notify_request_response() SET search_path = public;
ALTER FUNCTION public.set_event_location() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.set_event_expires_at() SET search_path = public;
ALTER FUNCTION public.update_participant_count() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- Utility functions
ALTER FUNCTION public.calculate_age(DATE) SET search_path = public;
ALTER FUNCTION public.expire_past_events() SET search_path = public;
ALTER FUNCTION public.create_notification(UUID, TEXT, TEXT, TEXT, JSONB) SET search_path = public;
ALTER FUNCTION public.is_blocked(UUID) SET search_path = public;
ALTER FUNCTION public.my_upcoming_events() SET search_path = public;
ALTER FUNCTION public.nearby_events(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, INTEGER) SET search_path = public;

-- ===========================================
-- FIX WAITLIST RLS POLICY
-- ===========================================

-- Replace overly permissive INSERT policy with one that requires a valid email
DROP POLICY IF EXISTS "Enable insert for anon" ON public.waitlist;
CREATE POLICY "Waitlist insert with valid email"
  ON public.waitlist FOR INSERT
  TO anon, authenticated
  WITH CHECK (email IS NOT NULL AND email <> '');

-- ===========================================
-- FIX spatial_ref_sys RLS (PostGIS system table)
-- NOTE: Must be run from Supabase Dashboard SQL Editor (requires postgres role)
-- ===========================================
-- ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;
