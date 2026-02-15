-- 011: Follows table for user-to-user follow system

CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    followed_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, followed_id),
    CHECK (follower_id != followed_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_followed ON follows(followed_id);

-- RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Users can view follows involving them
CREATE POLICY "Users can view own follows"
    ON follows FOR SELECT
    USING (follower_id = auth.uid() OR followed_id = auth.uid());

-- Users can follow others
CREATE POLICY "Users can follow"
    ON follows FOR INSERT
    WITH CHECK (follower_id = auth.uid());

-- Users can unfollow
CREATE POLICY "Users can unfollow"
    ON follows FOR DELETE
    USING (follower_id = auth.uid());
