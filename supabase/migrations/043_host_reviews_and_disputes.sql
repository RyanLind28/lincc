-- 043_host_reviews_and_disputes.sql
-- Reframe event_reviews as guest-of-host reviews:
--   * host cannot review their own event
--   * host can post one reply per review
--   * reviewer or host can raise a dispute, which lands in the admin reports queue

-- 1. Columns on event_reviews
ALTER TABLE event_reviews
  ADD COLUMN IF NOT EXISTS host_reply text,
  ADD COLUMN IF NOT EXISTS host_replied_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_disputed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS disputed_at timestamptz,
  ADD COLUMN IF NOT EXISTS disputed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS dispute_reason text;

-- 2. Link reports back to a specific review (when reason = 'review_dispute')
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS review_id uuid REFERENCES event_reviews(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reports_review_id ON reports(review_id);

-- 3. Replace the INSERT policy: guest only (host cannot review own event)
DROP POLICY IF EXISTS "Users can create one review per event" ON event_reviews;
CREATE POLICY "Guests can create one review per event"
    ON event_reviews FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND host_reply IS NULL
        AND is_disputed = false
        AND EXISTS (
            SELECT 1 FROM event_participants ep
            WHERE ep.event_id = event_reviews.event_id
              AND ep.user_id = auth.uid()
              AND ep.status = 'approved'
        )
        AND NOT EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = event_reviews.event_id
              AND e.host_id = auth.uid()
        )
    );

-- 4. Host can post exactly one reply per review
CREATE POLICY "Host can reply once"
    ON event_reviews FOR UPDATE
    TO authenticated
    USING (
        host_reply IS NULL
        AND EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = event_reviews.event_id
              AND e.host_id = auth.uid()
        )
    )
    WITH CHECK (
        host_reply IS NOT NULL
        AND host_replied_at IS NOT NULL
    );

-- 5. Reviewer or host can raise one dispute per review
CREATE POLICY "Reviewer or host can dispute once"
    ON event_reviews FOR UPDATE
    TO authenticated
    USING (
        is_disputed = false
        AND (
            user_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM events e
                WHERE e.id = event_reviews.event_id
                  AND e.host_id = auth.uid()
            )
        )
    )
    WITH CHECK (
        is_disputed = true
        AND disputed_by = auth.uid()
        AND disputed_at IS NOT NULL
    );

-- 6. Trigger: when a review flips to disputed, file an admin report
CREATE OR REPLACE FUNCTION create_dispute_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_host_id uuid;
  v_reported_id uuid;
BEGIN
  IF NEW.is_disputed = true AND OLD.is_disputed IS DISTINCT FROM true THEN
    SELECT host_id INTO v_host_id FROM events WHERE id = NEW.event_id;

    IF NEW.disputed_by = v_host_id THEN
      v_reported_id := NEW.user_id;
    ELSE
      v_reported_id := v_host_id;
    END IF;

    INSERT INTO reports (
      reporter_id, reported_user_id, event_id, review_id, reason, details
    ) VALUES (
      NEW.disputed_by, v_reported_id, NEW.event_id, NEW.id,
      'review_dispute', NEW.dispute_reason
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS event_reviews_dispute_trg ON event_reviews;
CREATE TRIGGER event_reviews_dispute_trg
AFTER UPDATE ON event_reviews
FOR EACH ROW
EXECUTE FUNCTION create_dispute_report();
