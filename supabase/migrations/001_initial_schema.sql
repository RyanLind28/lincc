-- Lincc Initial Schema
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_gender AS ENUM ('man', 'woman', 'non-binary');
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'banned');
CREATE TYPE event_status AS ENUM ('active', 'full', 'expired', 'cancelled', 'deleted');
CREATE TYPE join_mode AS ENUM ('request', 'auto');
CREATE TYPE audience_type AS ENUM ('everyone', 'women', 'men');
CREATE TYPE participant_status AS ENUM ('pending', 'approved', 'rejected', 'left');
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'dismissed', 'actioned');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT NOT NULL,
    dob DATE NOT NULL,
    gender user_gender NOT NULL,
    avatar_url TEXT,
    bio TEXT CHECK (char_length(bio) <= 140),
    tags TEXT[] DEFAULT '{}' CHECK (array_length(tags, 1) <= 3 OR tags = '{}'),
    settings_radius INTEGER DEFAULT 10 CHECK (settings_radius >= 1 AND settings_radius <= 20),
    is_ghost_mode BOOLEAN DEFAULT FALSE,
    is_women_only_mode BOOLEAN DEFAULT FALSE,
    terms_accepted_at TIMESTAMPTZ,
    role user_role DEFAULT 'user',
    status user_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    icon TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id),
    title TEXT NOT NULL CHECK (char_length(title) >= 3 AND char_length(title) <= 100),
    description TEXT CHECK (char_length(description) <= 280),
    venue_name TEXT NOT NULL,
    venue_address TEXT NOT NULL,
    venue_lat DOUBLE PRECISION NOT NULL,
    venue_lng DOUBLE PRECISION NOT NULL,
    venue_place_id TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity >= 1 AND capacity <= 3),
    join_mode join_mode NOT NULL DEFAULT 'request',
    audience audience_type NOT NULL DEFAULT 'everyone',
    status event_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ GENERATED ALWAYS AS (start_time + INTERVAL '2 hours') STORED
);

-- Event participants table
CREATE TABLE event_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status participant_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) <= 1000),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES profiles(id),
    reported_user_id UUID NOT NULL REFERENCES profiles(id),
    event_id UUID REFERENCES events(id),
    reason TEXT NOT NULL,
    details TEXT,
    status report_status DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES profiles(id)
);

-- Blocks table
CREATE TABLE blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_gender ON profiles(gender);
CREATE INDEX idx_events_host_id ON events(host_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_location ON events(venue_lat, venue_lng);
CREATE INDEX idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX idx_event_participants_user_id ON event_participants(user_id);
CREATE INDEX idx_messages_event_id ON messages(event_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_participants_updated_at
    BEFORE UPDATE ON event_participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Age calculation function
CREATE OR REPLACE FUNCTION calculate_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM AGE(NOW(), birth_date));
END;
$$ LANGUAGE plpgsql;

-- Insert default categories
INSERT INTO categories (name, icon, sort_order) VALUES
    ('Coffee', '☕', 1),
    ('Food & Drinks', '🍽️', 2),
    ('Sports', '⚽', 3),
    ('Fitness', '💪', 4),
    ('Walking', '🚶', 5),
    ('Hiking', '🥾', 6),
    ('Running', '🏃', 7),
    ('Cycling', '🚴', 8),
    ('Gaming', '🎮', 9),
    ('Movies', '🎬', 10),
    ('Music', '🎵', 11),
    ('Art & Culture', '🎨', 12),
    ('Study & Work', '📚', 13),
    ('Language Exchange', '🗣️', 14),
    ('Board Games', '🎲', 15),
    ('Yoga & Wellness', '🧘', 16),
    ('Pets', '🐕', 17),
    ('Photography', '📷', 18),
    ('Shopping', '🛍️', 19),
    ('Beach', '🏖️', 20),
    ('Other', '📌', 21);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by authenticated users"
    ON profiles FOR SELECT
    TO authenticated
    USING (status = 'active' AND is_ghost_mode = FALSE);

CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Categories policies
CREATE POLICY "Categories are viewable by all authenticated users"
    ON categories FOR SELECT
    TO authenticated
    USING (is_active = TRUE);

CREATE POLICY "Admins can manage categories"
    ON categories FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Events policies
CREATE POLICY "Active events are viewable by authenticated users"
    ON events FOR SELECT
    TO authenticated
    USING (status = 'active');

CREATE POLICY "Users can create events"
    ON events FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their own events"
    ON events FOR UPDATE
    TO authenticated
    USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete their own events"
    ON events FOR DELETE
    TO authenticated
    USING (auth.uid() = host_id);

-- Event participants policies
CREATE POLICY "Participants are viewable by event host and participants"
    ON event_participants FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = event_participants.event_id AND events.host_id = auth.uid()
        )
    );

CREATE POLICY "Users can request to join events"
    ON event_participants FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Hosts can update participant status"
    ON event_participants FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = event_participants.event_id AND events.host_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own participation"
    ON event_participants FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- Messages policies
CREATE POLICY "Messages are viewable by event participants"
    ON messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM event_participants
            WHERE event_participants.event_id = messages.event_id
            AND event_participants.user_id = auth.uid()
            AND event_participants.status = 'approved'
        ) OR
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = messages.event_id AND events.host_id = auth.uid()
        )
    );

CREATE POLICY "Participants can send messages"
    ON messages FOR INSERT
    TO authenticated
    WITH CHECK (
        sender_id = auth.uid() AND
        (
            EXISTS (
                SELECT 1 FROM event_participants
                WHERE event_participants.event_id = messages.event_id
                AND event_participants.user_id = auth.uid()
                AND event_participants.status = 'approved'
            ) OR
            EXISTS (
                SELECT 1 FROM events
                WHERE events.id = messages.event_id AND events.host_id = auth.uid()
            )
        )
    );

-- Reports policies
CREATE POLICY "Users can create reports"
    ON reports FOR INSERT
    TO authenticated
    WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Admins can view and manage reports"
    ON reports FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Blocks policies
CREATE POLICY "Users can view their own blocks"
    ON blocks FOR SELECT
    TO authenticated
    USING (blocker_id = auth.uid());

CREATE POLICY "Users can create blocks"
    ON blocks FOR INSERT
    TO authenticated
    WITH CHECK (blocker_id = auth.uid());

CREATE POLICY "Users can delete their own blocks"
    ON blocks FOR DELETE
    TO authenticated
    USING (blocker_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'avatars' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update their own avatar"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'avatars' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete their own avatar"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'avatars' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Enable realtime for messages and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE event_participants;
