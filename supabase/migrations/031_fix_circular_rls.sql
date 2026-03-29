-- 031_fix_circular_rls.sql
-- Fix circular RLS policies that caused 500 errors.
-- These were applied live already — this file is for reference.

-- Helper function to check admin role without triggering RLS recursion
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Helper function to check event participation without circular RLS
CREATE OR REPLACE FUNCTION user_is_event_participant(event_uuid uuid) RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM event_participants
    WHERE event_id = event_uuid
    AND user_id = auth.uid()
    AND status = 'approved'
  );
$$;

-- Recreate admin policies using is_admin() to avoid recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile"
    ON profiles FOR UPDATE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage all events" ON events;
CREATE POLICY "Admins can manage all events"
    ON events FOR ALL TO authenticated USING (is_admin());

-- Recreate participant view policy using helper function
DROP POLICY IF EXISTS "Participants can view joined events" ON events;
CREATE POLICY "Participants can view joined events"
    ON events FOR SELECT TO authenticated USING (user_is_event_participant(id));
