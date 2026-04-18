-- Fix participant_count drift: the trigger function update_participant_count() was
-- SECURITY INVOKER, so when a non-host user joined or left an event the inner
-- `UPDATE events SET participant_count = ...` was silently blocked by the events
-- RLS policy (only hosts/admins can UPDATE events). The result was an events row
-- whose cached participant_count diverged from the actual count of approved rows.
--
-- Switching to SECURITY DEFINER lets the trigger update the events cache regardless
-- of which user triggered the DML on event_participants. The function's own logic
-- is unchanged.

ALTER FUNCTION public.update_participant_count() SECURITY DEFINER;

-- One-time backfill to correct any rows that drifted under the old behaviour.
UPDATE events e
SET participant_count = COALESCE(c.approved_count, 0)
FROM (
  SELECT event_id, COUNT(*) AS approved_count
  FROM event_participants
  WHERE status = 'approved'
  GROUP BY event_id
) c
WHERE e.id = c.event_id
  AND e.participant_count IS DISTINCT FROM c.approved_count;

UPDATE events
SET participant_count = 0
WHERE participant_count > 0
  AND id NOT IN (SELECT DISTINCT event_id FROM event_participants WHERE status = 'approved');
