-- 067_email_exists.sql
-- Lets the signup form tell a returning user "you already have an account —
-- sign in" before the password-confirmation check can mask the real issue.
--
-- Supabase deliberately hides email existence (anti-enumeration), so signUp()
-- only reveals a duplicate after the password fields match. This SECURITY
-- DEFINER lookup surfaces it up front. NOTE: granting this to anon does allow
-- email enumeration — an accepted product trade-off for the clearer signup UX.
create or replace function public.email_exists(p_email text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from auth.users
    where lower(email) = lower(trim(p_email))
  );
$$;

revoke all on function public.email_exists(text) from public;
grant execute on function public.email_exists(text) to anon, authenticated;
