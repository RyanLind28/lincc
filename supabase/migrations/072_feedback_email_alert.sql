-- 072_feedback_email_alert.sql
-- Layer an admin email on top of the in-app notification fired by the existing
-- trg_notify_admins_of_feedback trigger. In-app notification scope is unchanged
-- (bug / support only). Email scope is broader: ALL feedback types so general
-- "Other" reports also reach hello@lincc.live, where the user-visible support
-- address already lives.
--
-- Mechanism: pg_net POSTs to the send-feedback-alert Edge Function with the
-- service_role key from vault (same pattern as 066_welcome_email_cron). The
-- HTTP call is fire-and-forget so a slow/down Edge Function never blocks the
-- feedback insert.

create or replace function public.notify_admins_of_feedback()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_admin record;
  v_preview text;
  v_first_name text;
  v_email text;
  v_path text;
  v_user_agent text;
  v_source text;
  v_service_key text;
begin
  v_preview := left(coalesce(nullif(NEW.body, ''), NEW.subject, 'A user reported a problem'), 140);

  -- In-app: bug + support only (unchanged from prior behaviour).
  if NEW.type in ('bug', 'support') then
    for v_admin in select id from profiles where role = 'admin' loop
      perform create_notification(
        v_admin.id,
        'feedback',
        'New problem report',
        v_preview,
        jsonb_build_object('feedback_id', NEW.id, 'feedback_type', NEW.type)
      );
    end loop;
  end if;

  -- Email: fires for every category. Pull user details + context fields so the
  -- alert email is self-contained and admins don't need to open the dashboard
  -- just to know who reported it.
  select p.first_name, coalesce(p.email, u.email)
    into v_first_name, v_email
  from public.profiles p
  left join auth.users u on u.id = p.id
  where p.id = NEW.user_id;

  v_source     := NEW.context->>'source';
  v_path       := NEW.context->>'path';
  v_user_agent := NEW.context->>'user_agent';

  select decrypted_secret into v_service_key
  from vault.decrypted_secrets
  where name = 'service_role_key';

  if v_service_key is not null then
    perform net.http_post(
      url := 'https://srrubyupwiiqnehshszd.supabase.co/functions/v1/send-feedback-alert',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_key
      ),
      body := jsonb_build_object(
        'feedback_id',     NEW.id,
        'type',            NEW.type,
        'subject',         NEW.subject,
        'body',            NEW.body,
        'user_first_name', v_first_name,
        'user_email',      v_email,
        'source',          v_source,
        'path',            v_path,
        'user_agent',      v_user_agent
      ),
      timeout_milliseconds := 15000
    );
  end if;

  return NEW;
end;
$function$;
