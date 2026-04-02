-- 028_reviews_and_admin_roles.sql
-- Event reviews system + admin role tiers.

-- Expand admin roles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
DO $$ BEGIN
    -- Drop old enum type if it exists and recreate
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'moderator';
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'support';
    END IF;
END $$;

-- Event reviews
CREATE TABLE IF NOT EXISTS event_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(event_id, user_id)
);

CREATE INDEX idx_reviews_event ON event_reviews(event_id);
CREATE INDEX idx_reviews_user ON event_reviews(user_id);

ALTER TABLE event_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reviews for events they participated in"
    ON event_reviews FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create one review per event"
    ON event_reviews FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM event_participants
            WHERE event_id = event_reviews.event_id
            AND user_id = auth.uid()
            AND status = 'approved'
        )
    );

CREATE POLICY "Admins can manage reviews"
    ON event_reviews FOR ALL
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
