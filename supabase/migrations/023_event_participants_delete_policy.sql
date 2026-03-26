-- 023: Add DELETE policy for event_participants
-- Allows users to leave events and cancel their own join requests.
-- This was missing from the initial schema, causing silent failures on leave/cancel.

CREATE POLICY "Users can leave events or cancel their own requests"
    ON event_participants FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());
