-- 054_allow_dms_global_and_chat_archive.sql
-- Two related enforcement gaps the UI had been carrying alone:
--
--  A. allow_dms moves from per-event (events.allow_dms) to per-host
--     (profiles.allow_dms). Hosts now have a single global preference;
--     when off, no one can open a new DM thread with them.
--
--  B. Event chats become inaccessible 24h after the event ends.
--     Realtime SELECT is gated by the cutoff; INSERT is blocked once the
--     event itself has ended (no posting in a dead chat). Admin ALL policy
--     already bypasses both.
--
-- Messages stay in the DB so reports + moderation can still reference them
-- by ID -- this is a privacy/UX gate, not a delete.

-- =====================================================================
-- A. profiles.allow_dms + conversations gate
-- =====================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS allow_dms BOOLEAN NOT NULL DEFAULT TRUE;

-- One-shot backfill: if a host has events and EVERY one of them has
-- allow_dms = false, mirror that into the profile-level toggle so the
-- new global semantics match the user's stated intent.
UPDATE public.profiles p
SET allow_dms = false
WHERE EXISTS (SELECT 1 FROM public.events e WHERE e.host_id = p.id AND e.allow_dms = false)
  AND NOT EXISTS (SELECT 1 FROM public.events e WHERE e.host_id = p.id AND COALESCE(e.allow_dms, true) = true);

-- Replace conversations INSERT policy with one that checks the recipient's
-- profile-level allow_dms. Existing conversations keep working because
-- direct_messages INSERT only requires conversation membership.
DROP POLICY IF EXISTS "Users can create own conversations" ON public.conversations;
CREATE POLICY "Users can create own conversations" ON public.conversations
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (participant_one, participant_two)
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = CASE
        WHEN auth.uid() = participant_one THEN participant_two
        ELSE participant_one
      END
      AND p.allow_dms = true
    )
  );

-- =====================================================================
-- B. messages: 24h read-window + can't post after event end
-- =====================================================================

-- SELECT: original participant/host check + must be within 24h of expiry.
-- Admin "Admins can manage messages" ALL policy already bypasses this.
DROP POLICY IF EXISTS "Messages are viewable by event participants" ON public.messages;
CREATE POLICY "Messages are viewable by event participants" ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = messages.event_id
        AND e.expires_at + INTERVAL '24 hours' > NOW()
    )
    AND (
      EXISTS (
        SELECT 1 FROM public.event_participants ep
        WHERE ep.event_id = messages.event_id
          AND ep.user_id = auth.uid()
          AND ep.status = 'approved'
      )
      OR EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = messages.event_id
          AND e.host_id = auth.uid()
      )
    )
  );

-- INSERT: same membership check plus event must not have ended yet.
-- No new messages in a chat whose event has already ended.
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
CREATE POLICY "Participants can send messages" ON public.messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = messages.event_id
        AND e.expires_at > NOW()
    )
    AND (
      EXISTS (
        SELECT 1 FROM public.event_participants ep
        WHERE ep.event_id = messages.event_id
          AND ep.user_id = auth.uid()
          AND ep.status = 'approved'
      )
      OR EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = messages.event_id
          AND e.host_id = auth.uid()
      )
    )
  );
