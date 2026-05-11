-- 051_admin_delete_user.sql
-- Admin-only hard delete for a user account.
--
-- profiles.id FK -> auth.users(id) ON DELETE CASCADE, and almost every
-- per-user public table CASCADEs from profiles. So a DELETE on auth.users
-- tears down the whole graph for us.
--
-- The only tables that need pre-cleanup are the ones with NO ACTION FKs
-- back to profiles (reports, admin_audit_log, announcements, feature_flags).
--
-- Safety rails: caller must be admin, cannot delete self, cannot delete
-- another admin (revoke role first so the action is explicit + auditable).

CREATE OR REPLACE FUNCTION admin_delete_user_account(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  target_role public.user_role;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: not authenticated';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  IF auth.uid() = target_user_id THEN
    RAISE EXCEPTION 'Cannot delete your own account from the admin panel';
  END IF;

  SELECT role INTO target_role FROM public.profiles WHERE id = target_user_id;
  IF target_role IS NULL THEN
    -- No profile row, but auth.users might still exist (orphan signup) — try delete anyway
    DELETE FROM auth.users WHERE id = target_user_id;
    RETURN;
  END IF;

  IF target_role = 'admin' THEN
    RAISE EXCEPTION 'Cannot delete another admin — revoke admin role first';
  END IF;

  -- NO ACTION FKs -> must pre-delete to avoid blocking the cascade
  DELETE FROM public.reports
    WHERE reporter_id = target_user_id
       OR reported_user_id = target_user_id
       OR reviewed_by = target_user_id;

  -- These only apply if target was ever an admin (now demoted)
  DELETE FROM public.admin_audit_log WHERE admin_id = target_user_id;
  DELETE FROM public.announcements WHERE created_by = target_user_id;
  UPDATE public.feature_flags SET updated_by = NULL WHERE updated_by = target_user_id;

  -- Profile + every CASCADEing table goes with the auth.users row
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_user_account(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_user_account(uuid) TO authenticated;
