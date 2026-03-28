-- 024_admin_policies.sql
-- Add RLS policies for admin access to profiles, events, and reports.

-- Allow admins to view ALL profiles (bypass active/ghost restrictions)
CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Allow admins to update any profile (change role, status, etc.)
CREATE POLICY "Admins can update any profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Allow admins to manage all events (cancel, delete, etc.)
CREATE POLICY "Admins can manage all events"
    ON events FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
