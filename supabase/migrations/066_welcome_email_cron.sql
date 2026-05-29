-- 066_welcome_email_cron.sql
-- Reliable, server-side welcome emails.
--
-- Until now the welcome email only fired from the client app (AuthContext) when
-- a confirmed user actually loaded the SPA with a live session. Users who
-- confirmed via a mail-provider link scanner (e.g. Outlook/Hotmail "Safe Links")
-- or who simply never reopened the app never triggered it, so welcomed_at stayed
-- null and they got no welcome (the "+alias" users were a red herring — sending
-- works fine; the trigger just never ran for them).
--
-- This adds a server-side safety net: a SECURITY DEFINER function that lists
-- confirmed-but-unwelcomed users, plus a pg_cron job that pokes the
-- send-welcome-email Edge Function every few minutes to flush them. The Edge
-- Function remains the single source of truth for the email template and the
-- welcomed_at idempotency guard, so a user is still only ever welcomed once even
-- if both the client and the cron race.

-- 1. Pending-welcome lookup. Joins auth.users (email_confirmed_at) with profiles
--    (welcomed_at). SECURITY DEFINER so the service role can read auth.users;
--    locked down to service_role only since it exposes user emails.
create or replace function public.get_pending_welcome_users()
returns table (id uuid, email text, first_name text)
language sql
security definer
set search_path = public
as $$
  select p.id, coalesce(p.email, u.email) as email, p.first_name
  from public.profiles p
  join auth.users u on u.id = p.id
  where u.email_confirmed_at is not null
    and p.welcomed_at is null
    and coalesce(p.email, u.email) is not null
  order by p.created_at
  limit 200;
$$;

revoke all on function public.get_pending_welcome_users() from public, anon, authenticated;
grant execute on function public.get_pending_welcome_users() to service_role;

-- 2. Cron: every 3 minutes, ask the Edge Function to flush pending welcomes.
--    Auth uses the service_role key stored in Vault under 'service_role_key'.
--    Until that secret is created the Authorization is empty and the call simply
--    401s — a harmless no-op — so this migration is safe to apply on its own.
select cron.unschedule('send-welcome-emails')
where exists (select 1 from cron.job where jobname = 'send-welcome-emails');

select cron.schedule(
  'send-welcome-emails',
  '*/3 * * * *',
  $$
  select net.http_post(
    url := 'https://srrubyupwiiqnehshszd.supabase.co/functions/v1/send-welcome-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(
        (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
        ''
      )
    ),
    body := '{}'::jsonb
  );
  $$
);
