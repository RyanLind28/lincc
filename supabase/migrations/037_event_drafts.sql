-- 037: Add 'draft' event status
-- Drafts are in-progress events saved by the host to publish later.
-- Visibility: existing RLS "Hosts can view own events" (host_id = auth.uid()) covers host access;
-- "Active events are viewable by authenticated users" already filters by status='active' so
-- drafts are invisible to everyone else. No new RLS needed.
-- The expire_past_events() cron only touches status='active' rows, so drafts are never auto-expired.

ALTER TYPE event_status ADD VALUE IF NOT EXISTS 'draft' BEFORE 'active';
