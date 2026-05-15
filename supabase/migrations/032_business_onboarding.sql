-- 032_business_onboarding.sql
-- Track when a business account has completed the multi-step onboarding wizard
-- (welcome → verify → logo+bio → location+hours → install PWA). The Verify
-- Business *submission* status lives on business_verifications; this column
-- gates whether the user has walked through the full wizard at least once.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS business_onboarding_completed_at timestamptz;

COMMENT ON COLUMN public.profiles.business_onboarding_completed_at IS
  'Set when a business owner finishes the /onboarding/business wizard. NULL = still in onboarding.';
