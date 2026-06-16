-- 074: Fire the waitlist confirmation email from the database, not the client.
--
-- Until now the "thanks for joining the waitlist" email was sent by a fetch() in
-- the client AFTER the insert succeeded. That left gaps: the in-app Contact page
-- form never called it at all, and any future signup surface has to remember to.
--
-- This makes the email a guaranteed side effect of the INSERT itself: an AFTER
-- INSERT trigger on `waitlist` POSTs to the send-waitlist-email Edge Function via
-- pg_net, using the service_role key from Vault. Same mechanism as
-- 072_feedback_email_alert / 066_welcome_email_cron. The HTTP call is
-- fire-and-forget so a slow/down Edge Function never blocks (or fails) the signup.
--
-- The `waitlist.email` UNIQUE constraint means a repeat signup raises a conflict
-- and the trigger never fires, so no duplicate emails on re-submit. Once this is
-- live, the client-side fetch() calls are redundant and are removed from the
-- landing pages to avoid sending twice.

create or replace function public.send_waitlist_confirmation()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_service_key text;
begin
  select decrypted_secret into v_service_key
  from vault.decrypted_secrets
  where name = 'service_role_key';

  -- No key configured → skip silently rather than erroring the signup. (Same
  -- safe no-op posture as the welcome-email cron before its secret is set.)
  if v_service_key is not null then
    perform net.http_post(
      url := 'https://srrubyupwiiqnehshszd.supabase.co/functions/v1/send-waitlist-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_key
      ),
      body := jsonb_build_object(
        'email', NEW.email,
        'name', NEW.name
      ),
      timeout_milliseconds := 15000
    );
  end if;

  return NEW;
end;
$function$;

-- Trigger functions don't need to be callable directly; lock it down like the
-- other internal SECURITY DEFINER functions (059/060).
revoke all on function public.send_waitlist_confirmation() from public, anon, authenticated;

drop trigger if exists trg_send_waitlist_confirmation on public.waitlist;
create trigger trg_send_waitlist_confirmation
  after insert on public.waitlist
  for each row
  execute function public.send_waitlist_confirmation();
