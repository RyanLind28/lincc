-- 038: Allow a signed-in user to read their own waitlist row
-- Purpose: show an "early access member" badge in the app for users who joined
-- the waitlist before signing up. Matches by auth.email() so each user can
-- only see their own row (no enumeration of other signups).

CREATE POLICY "Users can view their own waitlist row"
  ON public.waitlist FOR SELECT
  TO authenticated
  USING (email = auth.email());
