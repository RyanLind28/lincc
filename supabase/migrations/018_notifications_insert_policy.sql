-- Allow authenticated users to create notifications
-- Previously only SELECT and UPDATE policies existed, blocking client-side inserts
-- (e.g. voucher sharing, event sharing)

CREATE POLICY "Authenticated users can create notifications"
    ON notifications FOR INSERT
    TO authenticated
    WITH CHECK (true);
