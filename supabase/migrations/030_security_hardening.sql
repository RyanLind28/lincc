-- 030_security_hardening.sql
-- Fix overly permissive notifications INSERT, event-images storage, and events host visibility.

-- Fix: Restrict notifications INSERT so users can only create notifications for themselves
-- (Server-side triggers use SECURITY DEFINER and bypass RLS, so they still work)
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON notifications;
CREATE POLICY "Users can create notifications for themselves"
    ON notifications FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Fix: Event-images storage bucket — restrict uploads to user's own folder
DROP POLICY IF EXISTS "event_image_insert" ON storage.objects;
CREATE POLICY "event_image_insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'event-images'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Add update/delete policies for event-images
CREATE POLICY "event_image_update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'event-images'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "event_image_delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'event-images'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Fix: Allow hosts to view their own events regardless of status
CREATE POLICY "Hosts can view own events"
    ON events FOR SELECT
    TO authenticated
    USING (host_id = auth.uid());

-- Fix: Allow participants to view events they joined (even after expiry)
CREATE POLICY "Participants can view joined events"
    ON events FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM event_participants
            WHERE event_id = events.id
            AND user_id = auth.uid()
            AND status = 'approved'
        )
    );
