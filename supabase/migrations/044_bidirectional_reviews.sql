-- 044_bidirectional_reviews.sql
-- Bidirectional reviews: guest reviews host (rates host AND event), host reviews guest.
-- Auto-prompt notifications when an event expires.

-- ============= 1. Rename event_reviews → host_reviews; restructure columns =============

-- Drop the trigger so we can mutate the function safely
DROP TRIGGER IF EXISTS event_reviews_dispute_trg ON event_reviews;

ALTER TABLE event_reviews RENAME TO host_reviews;
ALTER INDEX idx_reviews_event RENAME TO idx_host_reviews_event;
ALTER INDEX idx_reviews_user RENAME TO idx_host_reviews_user;

ALTER TABLE host_reviews RENAME COLUMN user_id TO guest_id;
ALTER TABLE host_reviews RENAME COLUMN rating TO host_rating;

ALTER TABLE host_reviews
  ADD COLUMN event_rating integer CHECK (event_rating >= 1 AND event_rating <= 5);
UPDATE host_reviews SET event_rating = host_rating WHERE event_rating IS NULL;
ALTER TABLE host_reviews ALTER COLUMN event_rating SET NOT NULL;

-- Rename FK constraints so PostgREST relation hints stay sensible
ALTER TABLE host_reviews RENAME CONSTRAINT event_reviews_event_id_fkey TO host_reviews_event_id_fkey;
ALTER TABLE host_reviews RENAME CONSTRAINT event_reviews_user_id_fkey TO host_reviews_guest_id_fkey;
ALTER TABLE host_reviews RENAME CONSTRAINT event_reviews_event_id_user_id_key TO host_reviews_event_id_guest_id_key;

-- Rename the dispute fields' FK
ALTER TABLE host_reviews RENAME CONSTRAINT event_reviews_disputed_by_fkey TO host_reviews_disputed_by_fkey;

-- ============= 2. Refresh policies on host_reviews =============

DROP POLICY IF EXISTS "Users can view reviews for events they participated in" ON host_reviews;
DROP POLICY IF EXISTS "Guests can create one review per event" ON host_reviews;
DROP POLICY IF EXISTS "Host can reply once" ON host_reviews;
DROP POLICY IF EXISTS "Reviewer or host can dispute once" ON host_reviews;
DROP POLICY IF EXISTS "Admins can manage reviews" ON host_reviews;

CREATE POLICY "Reviews are viewable by authenticated users"
    ON host_reviews FOR SELECT TO authenticated USING (true);

CREATE POLICY "Guests can create one review per event"
    ON host_reviews FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = guest_id
        AND host_reply IS NULL
        AND is_disputed = false
        AND EXISTS (
            SELECT 1 FROM event_participants ep
            WHERE ep.event_id = host_reviews.event_id
              AND ep.user_id = auth.uid()
              AND ep.status = 'approved'
        )
        AND NOT EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = host_reviews.event_id
              AND e.host_id = auth.uid()
        )
    );

CREATE POLICY "Host can reply once"
    ON host_reviews FOR UPDATE TO authenticated
    USING (
        host_reply IS NULL
        AND EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = host_reviews.event_id
              AND e.host_id = auth.uid()
        )
    )
    WITH CHECK (
        host_reply IS NOT NULL
        AND host_replied_at IS NOT NULL
    );

CREATE POLICY "Reviewer or host can dispute once"
    ON host_reviews FOR UPDATE TO authenticated
    USING (
        is_disputed = false
        AND (
            guest_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM events e
                WHERE e.id = host_reviews.event_id
                  AND e.host_id = auth.uid()
            )
        )
    )
    WITH CHECK (
        is_disputed = true
        AND disputed_by = auth.uid()
        AND disputed_at IS NOT NULL
    );

CREATE POLICY "Admins can manage host reviews"
    ON host_reviews FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============= 3. reports.review_id → host_review_id; add guest_review_id =============

ALTER TABLE reports RENAME COLUMN review_id TO host_review_id;
ALTER TABLE reports RENAME CONSTRAINT reports_review_id_fkey TO reports_host_review_id_fkey;
ALTER INDEX idx_reports_review_id RENAME TO idx_reports_host_review_id;

-- ============= 4. New guest_reviews table =============

CREATE TABLE guest_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    host_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    guest_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    guest_rating integer NOT NULL CHECK (guest_rating >= 1 AND guest_rating <= 5),
    comment text,
    created_at timestamptz DEFAULT now(),
    guest_reply text,
    guest_replied_at timestamptz,
    is_disputed boolean NOT NULL DEFAULT false,
    disputed_at timestamptz,
    disputed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    dispute_reason text,
    UNIQUE(event_id, guest_id)
);

CREATE INDEX idx_guest_reviews_event ON guest_reviews(event_id);
CREATE INDEX idx_guest_reviews_host ON guest_reviews(host_id);
CREATE INDEX idx_guest_reviews_guest ON guest_reviews(guest_id);

ALTER TABLE guest_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guest reviews are viewable by authenticated users"
    ON guest_reviews FOR SELECT TO authenticated USING (true);

CREATE POLICY "Host can review approved guests once"
    ON guest_reviews FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = host_id
        AND host_id <> guest_id
        AND guest_reply IS NULL
        AND is_disputed = false
        AND EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = guest_reviews.event_id
              AND e.host_id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM event_participants ep
            WHERE ep.event_id = guest_reviews.event_id
              AND ep.user_id = guest_reviews.guest_id
              AND ep.status = 'approved'
        )
    );

CREATE POLICY "Guest can reply once"
    ON guest_reviews FOR UPDATE TO authenticated
    USING (auth.uid() = guest_id AND guest_reply IS NULL)
    WITH CHECK (guest_reply IS NOT NULL AND guest_replied_at IS NOT NULL);

CREATE POLICY "Host or guest can dispute once"
    ON guest_reviews FOR UPDATE TO authenticated
    USING (
        is_disputed = false
        AND (auth.uid() = host_id OR auth.uid() = guest_id)
    )
    WITH CHECK (
        is_disputed = true
        AND disputed_by = auth.uid()
        AND disputed_at IS NOT NULL
    );

CREATE POLICY "Admins can manage guest reviews"
    ON guest_reviews FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Add guest_review_id to reports
ALTER TABLE reports
  ADD COLUMN guest_review_id uuid REFERENCES guest_reviews(id) ON DELETE SET NULL;
CREATE INDEX idx_reports_guest_review_id ON reports(guest_review_id);

-- ============= 5. Dispute triggers =============

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
      v_reported_id := NEW.guest_id;
    ELSE
      v_reported_id := v_host_id;
    END IF;

    INSERT INTO reports (
      reporter_id, reported_user_id, event_id, host_review_id, reason, details
    ) VALUES (
      NEW.disputed_by, v_reported_id, NEW.event_id, NEW.id,
      'review_dispute', NEW.dispute_reason
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER host_reviews_dispute_trg
AFTER UPDATE ON host_reviews
FOR EACH ROW
EXECUTE FUNCTION create_dispute_report();

CREATE OR REPLACE FUNCTION create_guest_review_dispute_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reported_id uuid;
BEGIN
  IF NEW.is_disputed = true AND OLD.is_disputed IS DISTINCT FROM true THEN
    IF NEW.disputed_by = NEW.host_id THEN
      v_reported_id := NEW.guest_id;
    ELSE
      v_reported_id := NEW.host_id;
    END IF;

    INSERT INTO reports (
      reporter_id, reported_user_id, event_id, guest_review_id, reason, details
    ) VALUES (
      NEW.disputed_by, v_reported_id, NEW.event_id, NEW.id,
      'review_dispute', NEW.dispute_reason
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER guest_reviews_dispute_trg
AFTER UPDATE ON guest_reviews
FOR EACH ROW
EXECUTE FUNCTION create_guest_review_dispute_report();

-- ============= 6. Auto-prompt notifications when event expires =============

CREATE OR REPLACE FUNCTION notify_review_prompts_on_expiry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_participant record;
  v_has_guests boolean;
BEGIN
  IF NEW.status = 'expired' AND OLD.status IS DISTINCT FROM 'expired' THEN
    -- Notify each approved guest to review the host + event
    FOR v_participant IN
      SELECT ep.user_id
      FROM event_participants ep
      WHERE ep.event_id = NEW.id
        AND ep.status = 'approved'
        AND ep.user_id <> NEW.host_id
    LOOP
      INSERT INTO notifications (user_id, type, title, body, data, is_read)
      VALUES (
        v_participant.user_id,
        'review_prompt',
        'How was the event?',
        'Rate your host and ' || NEW.title || '.',
        jsonb_build_object('event_id', NEW.id, 'kind', 'host'),
        false
      );
    END LOOP;

    -- One host-side notification per event (modal walks all approved guests)
    SELECT EXISTS (
      SELECT 1 FROM event_participants
      WHERE event_id = NEW.id AND status = 'approved' AND user_id <> NEW.host_id
    ) INTO v_has_guests;

    IF v_has_guests THEN
      INSERT INTO notifications (user_id, type, title, body, data, is_read)
      VALUES (
        NEW.host_id,
        'review_prompt',
        'Rate your guests',
        'Your event ' || NEW.title || ' just ended. Rate the people who came.',
        jsonb_build_object('event_id', NEW.id, 'kind', 'guest'),
        false
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS events_review_prompt_trg ON events;
CREATE TRIGGER events_review_prompt_trg
AFTER UPDATE OF status ON events
FOR EACH ROW
EXECUTE FUNCTION notify_review_prompts_on_expiry();
