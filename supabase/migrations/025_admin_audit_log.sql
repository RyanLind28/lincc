-- 025_admin_audit_log.sql
-- Audit log for tracking admin actions + content moderation flag on events/profiles.

-- Audit log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid NOT NULL REFERENCES profiles(id),
    action text NOT NULL,
    target_type text NOT NULL, -- 'user', 'event', 'report', 'category'
    target_id uuid,
    details jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_audit_log_admin ON admin_audit_log(admin_id);
CREATE INDEX idx_audit_log_created ON admin_audit_log(created_at DESC);

-- RLS: only admins can read/write audit log
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
    ON admin_audit_log FOR SELECT
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can insert audit log"
    ON admin_audit_log FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Content moderation: add is_flagged column to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_flagged boolean DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS flag_reason text;

-- Content moderation: add is_flagged column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_flagged boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS flag_reason text;
