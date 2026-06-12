# Database Performance Audit

**Date**: 12 June 2026
**Source**: Supabase Performance Advisor (`get_advisors`)
**Status**: No user-facing impact at current data volume. All items below are about staying fast as the user base grows. Recommended order of work: Issue 1 first (biggest win), then 2, then 3 and 4 together in one cleanup migration.

---

## Issue 1: RLS policies re-evaluate `auth.uid()` per row (72 policies)

**What it is**: Policies written as `owner_id = auth.uid()` call the function once for every row scanned. Wrapping it as `owner_id = (SELECT auth.uid())` makes Postgres evaluate it once per query instead. On a 10,000-row table that is 1 call instead of 10,000.

**Impact**: The single biggest scaling risk in the database. Affects almost every table, worst on the hot paths: `events`, `event_participants`, `messages`, `notifications`, `profiles`.

**Affected tables (policy count)**:

| Table | Policies | Table | Policies |
|---|---|---|---|
| events | 4 | businesses | 4 |
| event_participants | 5 | vouchers | 4 |
| notifications | 4 | business_locations | 4 |
| host_reviews | 4 | business_verifications | 4 |
| guest_reviews | 4 | profiles | 3 |
| blocks | 3 | saved_events | 3 |
| follows | 3 | feedback | 3 |
| push_subscriptions | 3 | messages | 2 |
| direct_messages | 2 | conversations | 2 |
| voucher_redemptions | 2 | reports | 2 |
| admin_audit_log | 2 | + 7 more with 1 each | |

**Fix**: One migration that recreates each policy with `(SELECT auth.uid())` in place of `auth.uid()`. Mechanical change, no behaviour difference. Same applies to `is_admin()` calls inside policies: `(SELECT public.is_admin())`.

**Reference**: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

---

## Issue 2: Multiple permissive policies per action (35 warnings)

**What it is**: When a table has two or more permissive policies for the same role and action (typically "Admins can manage X" FOR ALL + a user-facing policy), Postgres evaluates **every** policy on **every** row. The admin policy's `EXISTS (SELECT ... FROM profiles ...)` subquery runs for every user's query, even though they are not admins.

**Impact**: Compounds Issue 1. Worst on `events` and `event_participants` (4 actions each affected) — the two hottest tables in the app.

**Affected tables**: events, event_participants, business_verifications, businesses, host_reviews, guest_reviews, messages, direct_messages, feedback, profiles, announcements, business_locations, categories, feature_flags, reports, vouchers, waitlist.

**Fix options** (in preference order):
1. Cheapest: fix Issue 1 first — `(SELECT is_admin())` makes the extra policy cost one cached check per query instead of per row. May be enough.
2. Proper: merge the admin condition into the user policy with `OR`, e.g. `USING (owner_id = (SELECT auth.uid()) OR (SELECT is_admin()))`, and drop the separate admin policy. More invasive, only worth it on `events`, `event_participants`, `messages`, `notifications`.

---

## Issue 3: Unindexed foreign keys (16)

**What it is**: Foreign key columns without a covering index. Joins and cascading deletes on these columns require sequential scans.

**Priority ones** (queried in app code):

| Table | Column | Why it matters |
|---|---|---|
| messages | sender_id | Chat queries join sender profile constantly |
| events | category_id | Category filtering on the home feed |
| vouchers | category_id, location_id, business_id | Business directory and voucher filtering |
| reports | reporter_id, reported_user_id, event_id, reviewed_by | Admin report queue |
| blocks | blocked_id | Block checks on every feed/profile load |

**Low priority** (admin-only or rarely joined): announcements.created_by, feature_flags.updated_by, businesses.reviewed_by, business_verifications.reviewed_by, host_reviews.disputed_by, guest_reviews.disputed_by.

**Fix**: `CREATE INDEX idx_<table>_<column> ON <table>(<column>);` for the priority list. Each index also adds a small write cost, so skip the low-priority ones until they show up in slow queries.

---

## Issue 4: Unused indexes (13)

**What it is**: Indexes that have never been used by any query. They cost write performance and storage for nothing.

**Caveat**: "Never used" reflects current traffic, which is pre-launch. Some of these will start being used once real traffic arrives. **Do not drop these yet** — review again 4-6 weeks after launch.

| Index | Table | Likely verdict |
|---|---|---|
| idx_events_search | events | Keep — powers full-text search, will be used |
| idx_events_location | events | Keep — map/radius queries, will be used |
| idx_notifications_is_read | notifications | Keep — unread badge counts |
| idx_reports_status | reports | Keep — admin queue filtering |
| idx_vouchers_expires | vouchers | Keep — expiry filtering |
| idx_businesses_status | businesses | Review after launch |
| idx_businesses_category | businesses | Review after launch |
| idx_businesses_slug | businesses | Review after launch |
| idx_businesses_verified | businesses | Review after launch |
| idx_profiles_status | profiles | Review after launch |
| idx_vouchers_location | vouchers | Review after launch |
| idx_feedback_created | feedback | Probably droppable |
| idx_reports_guest_review_id | reports | Probably droppable |

---

## Recommended plan

1. **Migration A (do now)**: Recreate all 72 RLS policies with `(SELECT auth.uid())` / `(SELECT is_admin())`. Zero behaviour change, biggest win.
2. **Migration B (do now)**: Add indexes for the priority foreign keys in Issue 3 (~10 indexes).
3. **After Migration A**: Re-run the performance advisor. If `multiple_permissive_policies` warnings on `events`/`event_participants` still show real cost in `EXPLAIN ANALYZE`, merge admin policies into user policies (Issue 2, option 2).
4. **4-6 weeks after launch**: Re-check unused indexes (Issue 4) against real traffic and drop the genuinely dead ones.

To re-run the audit: Supabase Dashboard → Advisors → Performance, or `get_advisors` via MCP.
