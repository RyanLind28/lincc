-- 026_announcements_and_feature_flags.sql
-- Announcements table for admin broadcasts + feature flags table.

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    body text NOT NULL,
    type text NOT NULL DEFAULT 'info', -- info, warning, maintenance
    is_active boolean DEFAULT true,
    created_by uuid REFERENCES profiles(id),
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz
);

CREATE INDEX idx_announcements_active ON announcements(is_active, created_at DESC);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view active announcements"
    ON announcements FOR SELECT
    TO authenticated
    USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Admins can manage announcements"
    ON announcements FOR ALL
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Feature flags
CREATE TABLE IF NOT EXISTS feature_flags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text UNIQUE NOT NULL,
    description text,
    is_enabled boolean DEFAULT false,
    updated_at timestamptz DEFAULT now(),
    updated_by uuid REFERENCES profiles(id)
);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view feature flags"
    ON feature_flags FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage feature flags"
    ON feature_flags FOR ALL
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Seed default feature flags
INSERT INTO feature_flags (key, description, is_enabled) VALUES
    ('dark_mode', 'Enable dark mode theme toggle', false),
    ('social_login', 'Enable Google/Apple sign-in', false),
    ('event_reviews', 'Enable post-event reviews', false),
    ('recurring_events', 'Enable recurring event creation', false),
    ('infinite_scroll', 'Enable infinite scroll on home feed', false)
ON CONFLICT (key) DO NOTHING;
