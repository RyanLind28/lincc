-- 041: Welcomed_at column on profiles
-- Tracks when a user received their "Welcome to Lincc" email, so the
-- send-welcome-email Edge Function can make the send idempotent (never twice).
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS welcomed_at TIMESTAMPTZ;
