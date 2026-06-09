-- 070_notifications_delete_policy.sql
-- Allow users to delete their own notifications.
--
-- The notifications table had RLS enabled with SELECT/INSERT/UPDATE policies
-- but no DELETE policy. With RLS on, a client DELETE silently matched zero
-- rows and Supabase returned no error, so the UI optimistically removed the
-- notification — then it reappeared on next page load because the row was
-- never actually deleted from the database.

CREATE POLICY "Users can delete their own notifications"
    ON notifications FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());
