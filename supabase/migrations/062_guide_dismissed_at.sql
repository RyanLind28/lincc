-- 062: Split the in-app tour flag off welcomed_at
--
-- welcomed_at was doing two unrelated jobs:
--   1. send-welcome-email Edge Function idempotency guard ("email sent?")
--   2. WelcomeGuide dismissal flag ("has the user dismissed the tour?")
--
-- Because the tour wrote welcomed_at on dismiss, a fast click-through during a
-- cold start could stamp it before the email function read it, permanently
-- suppressing the welcome email. This adds a dedicated column for the tour so
-- the two concerns stop sharing one flag. welcomed_at now means only "welcome
-- email sent".
--
-- Backfill: anyone already welcomed has effectively been onboarded, so seed
-- guide_dismissed_at from welcomed_at to avoid re-showing the tour to them.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS guide_dismissed_at TIMESTAMPTZ;

UPDATE public.profiles
SET guide_dismissed_at = welcomed_at
WHERE welcomed_at IS NOT NULL AND guide_dismissed_at IS NULL;
