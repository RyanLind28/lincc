-- 050_waitlist_admin_select.sql
--
-- Lets admins read every waitlist row from the admin dashboard. Existing RLS
-- on `waitlist` only had:
--   - "Waitlist insert with valid email" (anon + authenticated INSERT)
--   - "Users can view their own waitlist row" (authenticated SELECT by email)
-- so admins couldn't see the queue without a service role key.

CREATE POLICY "Admins can view all waitlist rows"
  ON waitlist FOR SELECT
  TO authenticated
  USING (public.is_admin());
