# LINCC TODO

Last updated: 2026-05-29

---

## Service Monitoring (backlog, P2)

Follow-ups from the admin System Status widget (`src/components/admin/SystemStatus.tsx` + `src/services/statusService.ts`). The live panel is point-in-time only — it shows status now, with no memory. These add persistence and proactive alerting. Raised 2026-05-29.

- [ ] **Incident history / uptime** — persist each health-check run (or just status transitions) to a table; surface "uptime % (7d/30d)" and a last-incident timestamp in the admin panel. Needs a `service_health_log` table + a writer (a cron job pinging `health-check`, or client-side logging on each run). Currently nothing is recorded, so an overnight outage leaves no trace.
- [ ] **Outage alerts** — when a service flips to `down`, notify admins via the existing push/email pipeline (see `create_notification` + `send-push-notification`) so detection doesn't depend on someone watching the panel. Debounce/flap-guard so a service bouncing up/down doesn't spam.

---

## UI/UX Overhaul (P1, COMPLETE — 2026-05-25)

Big polish + key-screen rework pass. 80+ files changed across foundations, component unification, screen rework, desktop layout, accessibility, and visual verification.

### Foundations
- [x] **Design token audit** — z-index scale (`--z-base` through `--z-tooltip`), motion tokens (4 durations + 3 easings), component sizing tokens (input/button heights, tap targets), icon size tokens, focus ring utility. All animation utilities reference tokens. (2026-05-25)
- [x] **Typography pass** — type scale tokens defined (display/page-title/section-title/card-title/body/body-sm/caption/micro) with line-heights and weights. `.text-section-label` utility for the repeated uppercase section heading pattern. (2026-05-25)
- [x] **Colour pass** — zero raw `gray-*`/`zinc-*`/`green-*`/`red-*` classes remaining. All replaced with semantic tokens (`bg-success`, `text-error`, etc.) across 30+ files including admin pages. `--color-text-light` darkened from `#9CA3AF` to `#737882` to pass WCAG AA (was 2.85:1, now 4.6:1). Dark mode verified on all key screens. (2026-05-25)
- [x] **Motion language** — duration tokens (fast 150ms / normal 200ms / slow 300ms / sheet 350ms) + easings (default / spring / out). All animation utilities updated to use tokens. `prefers-reduced-motion` already respected. (2026-05-25)
- [x] **Accessibility sweep** — focus traps added to Modal + BottomSheet. Focus ring utility (`.focus-ring`). `aria-pressed` on FilterPills + ChipGroup. `role="search"` on SearchBar. `aria-label` on BottomNav, SideNav, Toggle. Semantic landmarks on LandingPage (`<header>`, `<main>`, `<footer>`). Lighthouse accessibility: 96/100. (2026-05-25)

### Key screen rework
- [x] **Home feed (`HomePage`)** — FilterSheet extracted to own component (180 lines out of HomePage). SectionHeader component created for consistent icon/title/badge pattern. Sticky filter bar. `max-w-6xl` constraint. Desktop padding `lg:p-6`. (2026-05-25)
- [x] **Event detail (`EventDetailPage`)** — sticky bottom action bar with safe-area. Raw `<input>`/`<textarea>` in edit sheet replaced with `Input`/`TextArea` components. Cover image taller on desktop (`lg:h-64`). Section labels use `.text-section-label`. Desktop spacing increased. (2026-05-25)
- [x] **Profile (personal + business)** — `profile_name` displayed instead of `first_name`. Share + Find People moved from header to content area (header was too crowded). Tab pills use consistent height tokens + press-effect. `max-w-5xl` standardised. Business page empty state redesigned (owner gets setup checklist + CTAs; visitors get "Coming soon"). (2026-05-25)
- [x] **Onboarding** — refactored from 1006 to 605 lines. 7 step components extracted (PhotoStep, BasicInfoStep, InterestsStep, BioStep, InstallStep, LocationStep, NotificationStep). Each uses updated design system components. (2026-05-25)
- [x] **Chat (event + DM)** — same-sender messages grouped tighter (`space-y-1` + `mt-3` between different senders). `max-w-5xl` on ChatRoomPage, `max-w-3xl` on DMChatRoomPage. Composer has safe-area. (2026-05-25)
- [x] **Landing page** — full desktop rework: step cards with borders/shadow, feature cards with border + hover, 3-column footer with IG/TikTok social links, waitlist form with design system inputs, hero gradient fade fixed for dark mode, em dashes removed, heading order fixed. (2026-05-25)

### Components
- [x] **Buttons** — Button + GradientButton unified: same height tokens (`--height-button-sm/md/lg`), `rounded-xl`, `font-semibold`, `press-effect`, `focus-visible` ring. Button gained `fullWidth` prop. (2026-05-25)
- [x] **Inputs** — Input, TextArea, Select aligned: `rounded-xl`, height token (`--height-input` = 44px), `focus-visible:ring-coral` with offset. Consistent across all three. (2026-05-25)
- [x] **Cards** — Card gained `interactive` variant with hover shadow + press-effect. Radius standardised to `rounded-2xl`. (2026-05-25)
- [x] **BottomSheet / Modal** — focus trap (Tab/Shift+Tab cycling, focus restore on close). Z-index uses `--z-modal` token. Modal animation fixed. Close buttons use `focus-ring`. (2026-05-25)
- [x] **Toast** — Lucide icons per type (CheckCircle/AlertCircle/AlertTriangle/Info). Inline SVG close replaced with Lucide X. `safe-bottom` on container. Z-index token. Stagger offset for multiple toasts. `rounded-xl`. (2026-05-25)
- [x] **Header rightContent** — consistent across all pages: settings gear + notifications bell. Profile page no longer has 4 icons crammed in header. ROOT_TABS expanded to include `/notifications`, `/vouchers`, `/settings`, `/saved`, `/businesses`, `/people`. "Alerts" renamed to "Notifications" in SideNav. (2026-05-25)
- [x] **Filter pills + chips** — tap target bumped to 44px (`--height-tap-target`). `aria-pressed` + `role="group"`. `press-effect`. Chip selected variant uses `gradient-primary` (was flat `bg-primary`). (2026-05-25)
- [x] **Cookie consent banner** — redesigned: compact inline bar, doesn't overlap bottom nav or page content. Sits at `bottom-16` on mobile (above nav), `bottom-0` on desktop. (2026-05-25)
- [x] **ImagePickerButtons** — new shared component: "Choose from gallery" + "Take a photo" (camera capture) on every image upload point (onboarding avatar, edit profile, edit business, create event, create voucher, verification slots). (2026-05-25)

### Polish details
- [x] **Page transitions** — `PageTransition` upgraded from `animate-fade-in` to `animate-slide-up-sm` (8px slide + fade). Respects `prefers-reduced-motion`. (2026-05-25)
- [x] **Image handling** — `loading="lazy"` added to content images across BusinessPage, BusinessDashboardPage, BusinessDirectoryPage, TopList. Above-the-fold images kept eager. (2026-05-25)
- [x] **Spacing rhythm** — desktop padding upgraded from `p-4` to `p-4 lg:p-6` on key pages (Chats, MyEvents, Notifications, Saved, Explore, Settings, EventDetail). (2026-05-25)
- [x] **Mobile vs desktop** — all pages verified at 375px, 390px, 768px, 1280px, 1536px via Playwright screenshots. Max-width standardised: `max-w-6xl` for feeds, `max-w-5xl` for content/detail, `max-w-2xl` for forms. Sidebar has border + shadow. No pages missing max-width (except DemoPage). (2026-05-25)
- [x] **Microinteractions** — `press-effect` on VoucherTile, all tab buttons, FilterPills, Chips. (2026-05-25)
- [x] **Bottom safe area** — audited all `fixed bottom-0` elements; all have `safe-bottom`. No gaps. (2026-05-25)
- [x] **Z-index cleanup** — all ad-hoc values (`z-[60]`, `z-[100]`, `z-50`) replaced with tokens (`--z-header`, `--z-overlay`, `--z-modal`, `--z-toast`, `--z-tooltip`). (2026-05-25)
- [x] **Em dashes** — zero user-facing em dashes remaining across all pages. (2026-05-25)

### QA + ship
- [x] **Visual regression pass** — Playwright screenshots captured for all key screens at mobile + desktop, light + dark. Verified authenticated screens (home, profile, chats, my-events, settings, explore, notifications, vouchers, businesses, business detail). (2026-05-25)
- [x] **Lighthouse re-run** — landing page accessibility: 96/100 (target was 95). Contrast fix, heading order fix, DMARC label fix applied to reach score. (2026-05-25)
- [ ] **Browser matrix** — Safari iOS, Chrome Android, Samsung Internet, Chrome desktop, Safari desktop, Firefox desktop. Quick smoke on each.
- [ ] **Update changelog + release notes** for users when shipped.

---

## Image upload resilience (backlog, P2)

Raised 2026-05-31 while fixing Samsung/Android image upload failures (cloud-offloaded photos return a `content://` reference whose bytes the browser can't read). The read pipeline (`src/lib/imageCompression.ts`) was simplified and image upload is now skippable on every flow step via the shared `UploadErrorNotice` (onboarding avatar, business onboarding logo, create event, create voucher) so a broken upload never blocks or loses a task.

- [ ] **"Something's not working" reporter** — User-facing problem reporter for when a flow breaks or a user gets stuck. One tap to report; auto-captures context (current screen/route, device + user agent, the last error message, and the Sentry event/trace id) and files to the `feedback` table. Surface it inline on upload failures and onboarding steps, plus a persistent entry point in Settings.
- [ ] **Camera parity on business logo** — the business-onboarding logo picker is gallery-only; add a camera-capture option (the reliable path on Samsung) like the other upload surfaces.

---

## Meeting 2026-05-08 — Action Items (with Thameena)

Source: `docs/Meeting started 2026_05_08 16_34 BST – Notes by Gemini.pdf`. Thameena needs a working waitlist + welcome email in 3–4 days to start Sheffield business outreach, so the waitlist + email items are the launch blockers.

### Decisions aligned (apply across the work below)
- Sign-up captures **first name + last name** (legal records); a separate user-facing **profile name** field is added and defaults to the real name. Profile name is **mandatory**.
- Event discovery is capped at a **100 km radius** with farther events relegated to a secondary section.
- All waitlist CTAs ("Join Waitlist", "Coming Soon", bottom nav tab) link directly to the signup form.
- Staged rollout: **businesses onboard and post first**, then general users.
- Business monetisation: **1 month free** → subscription or pay-per-post.
- Market focus: **Sheffield student population + local niche orgs** (Manchester next).

### P0 — Waitlist + welcome email (COMPLETE)
- [x] Waitlist submit fix, CTAs, social links, verification link, Outlook button — all done 2026-05-09.
- [x] **Email DNS** — SPF, DKIM, DMARC all verified on `system.lincc.live` and root `lincc.live`. Fixed 2026-05-25.

### P1 — Onboarding stability (COMPLETE)
- [x] First/last name capture, profile name, personalised prompt, tooltip gate, resume on interruption — all done 2026-05-09.

### P2 — Samsung/Android image uploads (COMPLETE)
- [x] Validation hardening, HEIC conversion, PWA install fallback — done 2026-05-09. Camera capture + 2 new recovery stages added 2026-05-25.

### P3 — Discovery + content (COMPLETE)
- [x] 100km radius, filter sheet location prompt, demo video — all done.

### P4 — Outreach support (COMPLETE)
- [x] Amy's contact sent to Thameena — done.

---

## Pre-Launch

- [ ] **Supabase Pro upgrade** — required before launch for:
  - Custom auth hostname (`auth.lincc.live`) so verification email links match the brand instead of showing `srrubyupwiiqnehshszd.supabase.co`
  - Optional: change sender from `noreply@system.lincc.live` to `hello@system.lincc.live` (2 min, Supabase Dashboard + edge function secrets)
  - HaveIBeenPwned password checks (Pro-tier feature)
- [ ] **Browser matrix testing** — Safari iOS, Chrome Android, Samsung Internet, Chrome desktop, Safari desktop, Firefox desktop. Quick smoke on each.

---

## Session Changelog — 2026-05-25

Largest single session: full UI/UX overhaul + desktop layout pass + image upload hardening + email DNS fixes. 80+ files changed, +900/-1300 lines net.

### UI/UX Overhaul — 76 files, design system through to visual verification

**Design system foundations:**
- Added z-index scale, motion tokens, component sizing, icon sizes, typography scale, focus ring utility, `.text-section-label` utility to `src/index.css`
- `--color-text-light` darkened to pass WCAG AA contrast (2.85:1 to 4.6:1)
- All raw colour classes eliminated: 0 remaining `gray-*`, `green-*`, `red-*` across entire codebase (replaced with `bg-success`, `text-error`, etc.)
- All user-facing em dashes removed (111 instances across 28 files)

**Component unification:**
- Button + GradientButton: unified heights, radii, focus rings, press-effect
- Input / TextArea / Select: aligned to `rounded-xl`, 44px height, consistent focus-visible ring
- Modal + BottomSheet: focus trap (Tab cycling + focus restore), z-index tokens
- Toast: Lucide icons per type, safe-bottom, z-index token, rounded-xl
- Card: new `interactive` variant with hover shadow
- FilterPills + Chips: 44px tap targets, aria-pressed, press-effect, gradient selected state
- Cookie consent banner: compact inline bar, no longer covers bottom nav
- New `SectionHeader` component for consistent feed section headings
- New `ImagePickerButtons` component: "Choose from gallery" + "Take a photo" on every upload point
- New `FilterSheet` component: extracted 180 lines from HomePage

**Screen rework:**
- Landing page: full desktop rework (step cards with borders, feature cards, 3-column footer with IG/TikTok, dark mode support, Lighthouse 96/100)
- HomePage: FilterSheet extraction, SectionHeader, sticky filter bar
- EventDetailPage: sticky bottom CTA bar, design system inputs, desktop spacing
- OnboardingPage: refactored 1006 to 605 lines, 7 step components extracted
- ProfilePage: profile_name display, header decluttered, actions moved to content area
- BusinessPage: rich empty states (owner gets setup checklist; visitors get "Coming soon")
- ChatRoomPage: same-sender message grouping, max-width constraint

**Desktop layout:**
- Sidebar: border + shadow for visual separation
- Max-width standardised across all pages: `max-w-6xl` for feeds, `max-w-5xl` for content, `max-w-2xl` for forms, `max-w-7xl` for explore grid
- Desktop padding: `p-4 lg:p-6` on key pages
- Header consistency: all pages show settings + notifications; ROOT_TABS expanded; "Alerts" renamed to "Notifications"
- Responsive verified at 375px, 390px, 768px, 1280px, 1536px
- Dark mode verified on all authenticated screens

**Accessibility:**
- Focus traps on Modal + BottomSheet
- ARIA: `role="search"`, `aria-pressed`, `aria-label` on nav elements, `role="group"` on pill/chip groups
- Semantic landmarks on landing page
- Focus ring on Toggle
- Lighthouse accessibility: 96/100

### Image upload hardening

Driven by Sentry issue JAVASCRIPT-REACT-6: same Bahrain user failing 5 times over 16 days on Android 10 / Chrome Mobile. All 4 recovery stages exhausted every time.

- **New recovery stage: `file.stream()`** — ReadableStream API, goes through different Chrome I/O pipe. Added between FileReader and Response in the cascade (now 5 recovery paths)
- **New pre-cascade step: `file.slice()` re-read** — slices entire Blob and reads the slice, which on some Android versions forces a fresh ContentProvider read
- **Camera capture on every upload point** — new `ImagePickerButtons` component with "Choose from gallery" + "Take a photo" buttons. Applied to: onboarding avatar, edit profile, edit business logo, business onboarding logo, create event cover, create voucher cover, verification slots (selfie/ID/selfie-with-ID)
- **Verification doc removal** — X button on uploaded verification documents (operator selfie, ID, selfie with ID). New `removeVerificationDoc` service function clears DB path + deletes storage file
- **Better error message** — changed from "Try Share then Lincc" to explaining cloud storage and suggesting camera

### Email DNS

- Fixed DMARC records on Namecheap (host field had `.lincc.live` suffix causing double-domain)
- Added SPF record for `system.lincc.live`
- Verified: DMARC resolving on both `_dmarc.lincc.live` and `_dmarc.system.lincc.live`, SPF on `system.lincc.live`

### Sentry triage

- 4 unresolved issues reviewed via MCP
- JAVASCRIPT-REACT-6/5/A: image validation rejections from Bahrain Samsung user — addressed with recovery hardening + camera fallback
- JAVASCRIPT-REACT-9: AbortError in Supabase auth locks — bot noise from Virginia data centre, not a real user bug

---

## Session Changelog — 2026-05-16

Sentry triage drove an instrumentation enhancement on the image upload pipeline. Supabase advisor audit found one real bug (`create_notification` was open to spoofing) plus a long tail of hygiene issues; two migrations applied live (059 + 060) cleared 56 of 75 advisor findings.

### Image upload pipeline — per-stage recovery telemetry

Sentry showed three `*-logo: validation rejected file` events from a Bahrain Samsung user (Android 10, Chrome 148) hitting both `/business/edit` and `/onboarding/business` within 6 minutes — both ~1–3 MB JPEGs, both reaching the cascade-exhausted failure path. The instrumentation only told us "everything failed"; we couldn't tell which read API (arrayBuffer / ImageBitmap / FileReader / Response.arrayBuffer / `<img>`) was the actual blocker, so we couldn't decide whether to add a 5th recovery path or accept the file as genuinely unreadable.

- **`src/lib/imageCompression.ts` refactored** — `withTimeout` (which silently swallowed both timeouts and rejections into `null`) replaced with `raceTimeout` (throws on either, with a `TimeoutError` sentinel so the cascade can distinguish the two). Each `recoverVia*` helper now returns a `RecoveryStageResult` carrying `{ outcome: 'recovered' | 'timeout' | 'unsupported' | 'null-result' | 'error', detail? }` plus a short `summariseError()` string for thrown errors. `runRecoveryCascade` collects per-stage `RecoveryAttempt[]`. `validateImageDetailed` now surfaces `arrayBufferError?` (what `file.arrayBuffer()` threw before the cascade ran) and `recoveryAttempts?` on the result.
- **Seven call sites updated** to include `arrayBufferError` + `recoveryAttempts` in Sentry extras on both the rejection capture and the recovered-file capture: `EditBusinessProfilePage`, `BusinessOnboardingPage`, `CreateEventPage`, `CreateVoucherPage`, `EditProfilePage`, `OnboardingPage` (avatar), `VerificationSlots`.
- **`BusinessOnboardingPage` gained the missing `recovered unreadable file` capture** — the edit-business equivalent had it from day one; onboarding never did. Recovery-rate parity restored.
- **Audited every image upload entry point**: 7 `<input type="file">` elements + 7 Supabase storage upload call sites + no drag-drop, paste, camera-capture, or indirect picker abstractions in the app. All flows now go through the hardened pipeline.
- `npx tsc --noEmit` clean. `npm run test:run` 57/57 pass.

### Supabase security advisor pass — 75 → 19 findings

Real bug: **`create_notification` had no auth check and was callable by any authenticated user** via `/rest/v1/rpc/create_notification`. Anyone could spoof a notification (and the function's `pg_net` push call) into any user's inbox. No frontend caller — only triggers and service_role legitimately invoke it.

- **Migration `059_security_advisor_fixes.sql`**:
  - Revoke EXECUTE from anon + authenticated on 16 trigger / pg_cron-only functions (`handle_new_user`, all `notify_*`, all `update_*`, `events_publish_gate`, `vouchers_publish_gate`, `send_event_reminders`, the two dispute triggers).
  - Revoke EXECUTE on `create_notification` from anon + authenticated.
  - Revoke from anon on 7 auth-required RPCs (`admin_delete_user_account`, `delete_user_account`, `convert_to_business`, `export_user_data`, `redeem_voucher`, `suggest_users`, `search_events`) — defense in depth; each already raises on null `auth.uid()`.
  - Pin `search_path = public, pg_temp` on 8 functions flagged by advisor 0011.
  - Drop the four broad `bucket_id = '<name>'` public SELECT policies on `storage.objects`; replace with owner-scoped SELECT (matches the existing UPDATE/DELETE pattern). Add the three missing admin SELECT policies (`admin_business_logo_select`, `admin_event_image_select`, `admin_voucher_cover_select`). Public URL reads continue to work because all four buckets have `bucket.public = true`.
- **Migration `060_revoke_public_execute_on_internal_functions.sql`** — caught mid-flight: `REVOKE FROM anon, authenticated` is a **no-op** while `CREATE FUNCTION`'s implicit `GRANT EXECUTE TO PUBLIC` is intact (the PUBLIC grant covers every role transitively). 060 revokes EXECUTE from PUBLIC on the 19 functions that still had it, so the 059 intent actually applies. `is_admin()` and `user_is_event_participant()` keep PUBLIC EXECUTE deliberately — both are referenced inside RLS USING clauses; revoking would break every signed-in table read.

### Remaining advisor findings (19, all explainable)
- 5 PostGIS-related (extension in `public`, `spatial_ref_sys` RLS, 3× `st_estimatedextent` SECURITY DEFINER) — deferred; moving PostGIS to `extensions` schema touches every spatial column + function call site.
- 4 false positives on `is_admin()` / `user_is_event_participant()` — kept by design (used in RLS).
- 8 intentional `authenticated_security_definer_function_executable` flags on RPCs with verified internal auth checks (`admin_delete_user_account`, `convert_to_business`, `delete_user_account`, `export_user_data`, `get_cron_health`, `redeem_voucher`, `search_events`, `suggest_users`). Switching to `SECURITY INVOKER` would break their elevated-privilege needs.
- 1 `business_waitlist` always-true INSERT — intentional for anonymous waitlist submission.
- 1 HaveIBeenPwned check disabled — Supabase Pro-tier feature; bundling with password length/complexity rules at Pro upgrade.

### Sentry status after pass
- `JAVASCRIPT-REACT-4` (`Error: Rejected` / service worker register at `/business/verify`) — bot noise; user agent is `Google-Read-Aloud`. Not fixed; consider filtering bot UAs in Sentry `beforeSend`.
- `JAVASCRIPT-REACT-5` + `JAVASCRIPT-REACT-A` — now decorated with the new `arrayBufferError` + `recoveryAttempts` metadata; next firing will tell us which read path the Samsung Content URI actually refuses.

### Migrations applied today
- 059 — security_advisor_fixes
- 060 — revoke_public_execute_on_internal_functions

---

## Session Changelog — 2026-05-06

Two production fixes — one auth regression, one image-upload reliability pass driven by a real Sentry event from a Samsung user. Migration 047 applied live, no TypeScript regressions.

### Business signup regression — `handle_new_user` trigger restored
- **Root cause** — the May 4 `handle_new_user_oauth_name` migration (applied live, no local file) overwrote the function from 045 and dropped the branches that read `raw_user_meta_data->>'account_type'` and inserted the pending `businesses` row. Result: every business signup since 4 May landed as `account_type='personal'` with no business record. Confirmed against `tami+ryantest@lincc.live` (signed up 06:30 UTC today as a business, came out as personal).
- **Migration 047 — `047_fix_handle_new_user_account_type.sql`** — merged both code paths back: OAuth-name resolution (`contact_name` → `full_name` → `name`) **plus** account_type resolution (`account_type` → legacy `is_business` → default `personal`) **plus** pending `businesses` row creation with auto-slug for business signups. Applied live via Supabase MCP.
- **Backfill** — DO block in the same migration flips any `auth.users.raw_user_meta_data` saying business but `profiles.account_type='personal'` over to business and creates the missing pending business row. Restored `tami+ryantest@lincc.live` → `account_type='business'` + new `Test Business` business in `pending_approval`.
- **Cleanup** — deleted the abandoned `dannybomaths@gmail.com` signup (had only legacy `is_business: true` in metadata, no contact_name / business_name / terms_accepted_at — stuck mid-onboarding). Confirmed `Danny's Maths-Hub` business is owned by `d.bohannan@nadeenschool.com` (likely the same person).

### Image upload reliability — Samsung NotReadableError fix + general hardening
Driven by Sentry issue `JAVASCRIPT-REACT-3` (`NotReadableError: The requested file could not be read…`) reported on an older Samsung device. Root cause: the photo was a **Samsung Cloud / Google Photos placeholder** — the picker hands us a content URI but the bytes aren't on the device. `file.slice(0, 16).arrayBuffer()` in `detectImageFormat` failed; with no try/catch the error bubbled up as an unhandled rejection and the user just saw the upload silently fail.

All changes in `src/lib/imageCompression.ts`:

- **New `FileReadError`** typed error wraps NotReadableError thrown from the magic-byte read; `validateImageDetailed` catches it and surfaces a tailored toast: *"Couldn't read this photo. It might be saved to cloud storage (Samsung Cloud, Google Photos) — open it in your gallery to download it to your device, then try again."* Existing Sentry capture in upload pages picks up the typed error so we can track this case separately.
- **`MAX_INPUT_SIZE` raised 10MB → 25MB** — Samsung high-MP cameras commonly produce 12–18MB JPEGs at full res; we previously rejected them outright. Output is canvas-recompressed to ~150KB regardless of input size, so the larger cap doesn't change storage cost.
- **`ALLOWED_TYPES` extended** with `image/jpg` (Samsung Gallery and several older Android pickers emit this — no "e") and `image/pjpeg` (legacy progressive JPEG MIME).
- **Magic bytes are now authoritative** — `validateImageDetailed` no longer rejects a file because of its MIME if the first 16 bytes match a recognised image format. MIME is checked only as a fallback when detection comes back null. Removes the "wrong MIME → instant reject" failure mode for Android pickers that mis-label otherwise valid JPEGs.

`npx tsc --noEmit` clean. `npm run test:run` 56/57 pass; the one failure is a pre-existing `VoucherCard.test.tsx` clock flake (`6h left` vs `5h left`) unrelated to this work.

---

## Session Changelog — 2026-04-29

Massive day. Architecture-level shifts plus polish. ~50 items closed, 5 migrations applied (043 → 049). All TypeScript clean.

### Account model rewrite — Personal vs Business
- **Account types as a first-class concept** (migration 045) — `profiles.account_type` (`'personal' | 'business'`), drop deprecated `is_business` + `business_*` columns from profiles, businesses now a sibling entity (one per owner), pre-existing live businesses auto-approved
- **Business approval workflow** — `businesses.status` enum extended to `pending_approval | approved | rejected | suspended | inactive | archived`; `rejection_reason`, `reviewed_at`, `reviewed_by` columns
- **Signup chooser** — two-card Personal / Business picker on `SignupPage`. Business path collects contact name, business name, category. `handle_new_user` trigger now creates the linked `businesses` row with auto-generated unique slug
- **PendingApprovalPage** with re-submit on rejection
- **Soft-gate**: pending business accounts roam the app freely (no redirect lock-in) with a persistent `BusinessApprovalBanner`. Publishing is blocked at the DB level via `events_publish_gate` and `vouchers_publish_gate` BEFORE INSERT triggers
- **Friendly Create Event / Create Voucher gates** when business is unapproved (CTA → `/business/verify`)
- **Admin business applications page** (`/admin/business-applications`) with reason filter, audit log, owner notifications

### Business verification (blue tick)
- **Migration 047** adds `business_verifications` table (4 doc paths + status + reviewer notes) and `businesses.verified` + `verified_at`
- **Private storage bucket** `business-verification-docs` with RLS (owner read+write own folder; admin read all)
- **`/business/verify` page** with 4 doc upload slots (operator selfie, ID document, selfie with ID, business registration), live preview via signed URLs, status banner, re-submit on rejection
- **Admin doc review** — thumbnails of submitted docs in the applications queue (signed URLs); "Approve & verify" auto-flips `verified=true` when verification submitted
- **`<VerifiedTick />`** badge rendered next to business name on BusinessPage, BusinessDashboard, EventCard, EventDetailPage, VoucherDetailPage

### Bidirectional reviews + dispute flow
- **Migration 044** — renamed `event_reviews` → `host_reviews`; new columns `host_rating` + `event_rating` + `host_reply` + `is_disputed`; new `guest_reviews` table for host-rates-guest; reports gain `host_review_id` + `guest_review_id`
- **`review_prompt` notification type** — fires on event expiry (cron + trigger) for each approved guest and the host
- **Uber-style auto-prompt modal** on HomePage walks the user through pending reviews; "Skip for now" (sessionStorage) and "Don't ask again" (localStorage)
- **EventReviewsSection** on detail pages — split into `HostReviewsList` + `GuestReviewsList`, each with reply + dispute flows
- **`<RatingBadges />`** on UserProfilePage shows host avg + guest avg with counts
- Dispute → admin reports queue with full review context + Approve/Reject (with reason)

### Chat reporting + admin moderation toolkit
- **Migration 049** — `reports.message_id` + `reports.dm_message_id` FKs (cascade)
- **Flag pill on every non-own message** in event chat + DMs → opens `<ReportMessageDialog />` with chat-tailored reasons (harassment / inappropriate / spam / hate / safety / other) + message preview
- **Admin reports modal** now surfaces chat context with deep links (Open thread →, Open conversation →)
- **Real moderation actions** in the admin Reports modal: **Warn** (notification), **Suspend** (with duration), **Ban**, **Delete message**, **Remove from event**, **Cancel event** — every action writes to `admin_audit_log` and notifies the user

### Subcategories + categories
- **Subcategory schema seeded** — `categories.parent_id` self-reference + 69 subcategories backfilled from the static frontend list
- **Admin Categories page rewritten** as expandable parent → child tree, add-subcategory inline button per parent, parent dropdown in the modal, cascade delete
- **Subcategory unique constraint** — partial unique on `(parent_id, name)` so siblings under different parents can share names
- Fixed render bug where icon **name** displayed next to category name (looked like duplicates)

### Admin panel polish
- **Dashboard tile-grid** for Manage moved front and centre with count badges (pending applications, pending verifications, pending reports, flagged users, flagged events)
- **Activity feed** — paginated (8/page from a 60-pool) with click-through to the right detail page (user / event / report)
- **Desktop-friendly layout**: 4-col stat cards, side-by-side charts, 3-col top-lists
- **All admin sub-pages** capped to sensible widths (`max-w-7xl` for lists, smaller for detail/forms)
- **Admin link** added to Settings → Developer
- **Admin SELECT policy on businesses** — pending applications now actually appear in the queue (was hidden by RLS)
- **Notifications**: `business_approved` / `business_rejected` types added with icons + path

### Public business profile + dashboard
- **BusinessPage redesigned** — cover hero (blurred logo + gradient), floating logo card, name + verified tick + ★ rating + open-now status, stats strip (Events / Vouchers / Locations / Reviews), grids for what's-on + deals, locations + hours grid, **socials block** (website / IG / FB / X / TikTok / LinkedIn / YouTube / WhatsApp / phone / email), public reviews carousel, past events
- **BusinessDashboardPage** rewritten with hero, performance stats (active events, vouchers, redemptions, avg rating), quick actions, tabbed sections (Overview, Events, Vouchers, Locations, Reviews, Profile)
- **Business slug URLs** — `/business/dannys-maths-hub` works alongside `/business/<uuid>` (UUID-or-slug fetcher)
- **Calendar-style EventTile** + fluid voucher cards (image-left, progress bar)
- **Operator-by attribution removed** from public business pages (businesses are self-contained)
- **Edit business page** uses `PlacesAutocomplete` for the address now
- Migration adds `businesses.social_links jsonb`

### Voucher detail
- **Hero with discount badge + category chip overlay**, title + description
- **Status chips** — expiring soon / almost gone / 1-per-customer / business offer
- **"Offered by" business card** with verified tick + category
- **"You save" card** computed from original/discounted prices with % off
- **Stock availability bar** (claimed / limit + "X still available")
- **Quick facts grid**, **Where to redeem** (primary venue + every business location, all open Google Maps)
- **More from <Business>** carousel of other live vouchers

### Personal profile redesign
- **Cover band + floating avatar + identity row** mirrors the business page exactly
- **Stats strip** — Followers / Following / Hosted / Joined
- **Status chips** for Early access, Ghost mode, Women-only
- **Share button** in the header (native share / clipboard fallback)
- Personal-page-only — business accounts redirected to their dashboard
- **`<InstallAppCard />`** mounted on profile — uses `BeforeInstallPrompt` on Android/Chrome/Edge, falls back to manual "Add to Home Screen" instructions on iOS Safari, dismissable per-device

### Profile photo upload
- **Avatar cropper** (round + square crops via `react-easy-crop`) with drag-to-position + zoom slider
- **HEIC detection** with explicit error message ("iPhone HEIC photos aren't supported, switch to Most Compatible…")
- **Magic-byte validation** (was only size before)
- **Specific Supabase error messages** surfaced (was always generic "Failed to upload")
- **Upload-then-delete** instead of delete-then-upload — no more lost avatars on failed uploads

### Theme + Safari chrome
- **Dark mode bug fixed app-wide** — `--color-muted` token added; swept ~30 hardcoded `bg-gray-200/300` across skeletons, avatars, toggles, dots, drag handles, etc. → `bg-muted`
- **Dark class applied at app boot** (`main.tsx`) instead of only when SettingsPage mounted
- **`color-scheme: dark`** on `html.dark` so native form controls + scrollbars match
- **Safari "big bars" fixed** — `theme-color` now matches the page bg (`#FAFAFA` light, `#0F0F1A` dark) via media-query meta tags; `apple-mobile-web-app-status-bar-style: black-translucent`; manifest theme/background colors aligned; in-app dark mode toggle re-paints theme-color at runtime

### Plumbing
- **Google Analytics 4** integrated — measurement id `G-8NHZY93N9K`, env-gated (no-op without var), SPA route tracking, `user_id` stitching after sign-in
- **Cookie consent banner** — bottom-of-screen Accept / Decline; GA only loads after Accept; localStorage-persisted decision
- **Update prompt redesigned** — full-screen non-dismissable overlay (was a toast). Mounted at App root so it covers chats, landing, etc.
- **Persistent SideNav across full-screen routes** — chat, create event, create voucher, business dashboard, etc., now keep the desktop sidebar (was disappearing). MainLayout split `showSideNav` from `showBottomNav`
- **Vouchers tab** in desktop side nav (was missing); side nav icons left-aligned when expanded

### Misc UI
- **Em-dashes removed** from PendingApprovalPage UI strings (per memory)
- **App-wide full-width desktop layouts** — list pages drop `max-w-5xl` caps so content fills the room next to the sidebar
- **Larger event grids on `xl`** — MyEvents, Vouchers, Saved
- **Profile page** drops "My Businesses" link, redirects business accounts to dashboard

### Data fixes
- Spread Danny's Maths-Hub demo data: 3 locations, 4 vouchers (incl. "30-min free intro lesson"), 3 events + reviews + redemptions
- Reset Ryan's account back to personal; deleted +1/+2/lindustries test users; deleted orphan Ryan's Cafe business
- All 22 active events spread across `now → +13 days` so the home feed is populated within the 14-day visibility window

### Migrations applied today
- `043_host_reviews_and_disputes` — host reviews + dispute trigger + reports.review_id
- `044_bidirectional_reviews` — host_reviews / guest_reviews split + review_prompt notifications
- `045_account_types_and_approval` — profiles.account_type, business approval workflow, publish gates
- `047_business_verifications` — verifications table + private storage bucket + RLS
- `049_chat_reports` — reports.message_id + dm_message_id (FKs cascade)
- Plus several smaller policy / index / seed migrations (admin RLS on businesses; `business_categories`; subcategories backfill; cascade on `categories.parent_id`; `businesses.social_links`; `businesses.verified` + `verified_at`; `categories.kind` plus seeded business categories)

---

## Session Changelog — 2026-04-17

Big push day. ~25 items closed end-to-end. Details inline below — this is the headline list for reviewers.

### Auth & Signup
- **Duplicate signup with same email** — detected via Supabase's empty `identities[]` anti-enumeration signal; user is redirected to `/login?email=...` (prefilled)
- **First-time login fails after email confirm** — removed the aggressive `email_confirmed_at` sign-out check (JWT doesn't carry that field, so the check was spuriously signing people out who'd just confirmed)
- **Resend confirmation button** on the verify-email screen with 60s cooldown + spam-folder hint
- **Two-checkbox signup consent** (T&C + 18+) — migration 036 copies consent into profile via `handle_new_user` trigger so the /terms page is skipped
- **Profile picture optional in onboarding** — `checkProfileComplete` no longer requires avatar; default initial-based Avatar handles `src={null}`
- **OAuth Google button wired** (waiting on Supabase Dashboard credentials to activate)
- **Google OAuth activated** (2026-04-18) — Google Cloud project `lincc-prod`, OAuth client "Lincc Web", consent screen published with `lincc.live` as authorised domain. Redirect URI: `https://srrubyupwiiqnehshszd.supabase.co/auth/v1/callback`. JS origins: localhost:5173, lincc.live, lincc-six.vercel.app. Pasted Client ID + Secret into Supabase and enabled the provider. See Known Limitations for the consent-screen branding note.

### Events & Discovery
- **Duplicate event** action on EventDetailPage — writes event data to `sessionStorage` and navigates to `/event/new` pre-filled
- **Save as Draft** on CreateEventPage — migration 037 adds `'draft'` to `event_status` enum; new Drafts tab on MyEventsPage with Publish/Delete
- **14-day upcoming-window filter** on home feed, map, search, explore — hides stale 2027 seed events while leaving real user events visible (was 24h/7d at first)
- **Hide expired events** on MyEventsPage and SavedEventsPage (filter: `status ∈ ('active','full') AND expires_at ≥ now`)
- **Past events toggle** on profile page with Upcoming/Past pill (both full-width)
- **Business events show business name + logo** — joined `business:businesses!business_id(*)` across queries, new `business` field on EventWithDetails/ScoredEvent

### Chat
- **Past-event chats filtered** per PRD rule (`expires_at >= now - 24h`)
- **Chat archive countdown** — new `<ChatStatusPill>` shows "Live now" / "Archives in 23h 45m" etc. on both chat list rows and in the chat room banner, ticking every 30s via `useNow` hook
- **Chat row UI polish** — event cover image replaces gradient icon when available; larger avatars for Friends tab

### UI / Navigation
- **Bottom nav rewrite** — scrapped the broken SVG-gradient-stroke trick that made icons invisible; now solid coral/muted with labels under each icon. Map/globe toggle icon no longer disappears on map view.
- **Vouchers tab** added to bottom nav + new `/vouchers` page with grid, search, category filter
- **Profile menu moved** from Header `rightContent` into the profile card itself (Follow / Message / Share / More⋮ row)
- **Header logo always visible** and clickable as full-width home link (no more overlap with action buttons)
- **EventCardMini polished** — 64x64 cover image, coral time, venue with pin, "X/Y going" — consistent with chat rows
- **MyEventsPage EventRow** redesigned to match EventCardMini
- **Duplicate/Chat/Manage buttons** on event detail — no more 2-line text wrap
- **Profile page avatar action** — Follow/Message/Share/More moved inline, separator dots added

### Social / Discovery
- **Find People suggestions** — migration 039/040 `suggest_users()` SECURITY DEFINER function does friends-of-friends with popular-users fallback for sparse graphs. Reusable `<FollowButton>` with optimistic UI.
- **Waitlist badge** — "Early access member" sparkle pill on ProfilePage for users whose email is in the waitlist. Migration 038 adds RLS so users can read their own waitlist row.

### Bugs
- **Directions link** on event detail — was `maps/place/` (shows place), now `maps/dir/?api=1&destination=...` (actual turn-by-turn)
- **Find My Location** on MapView — was failing silently; now shows toast with the specific reason (permission denied / timeout / etc.) + 10s timeout
- **Pull-to-refresh** extended to ChatsPage
- **Support email unified** to `hello@lincc.live` across app, landing, email templates

### Email infrastructure
- **Custom SMTP live via Resend** — sender: `Lincc <noreply@system.lincc.live>`, domain verified
- **15 Lincc-branded email templates**: confirm-signup, magic-link, reset-password, change-email, invite, reauthentication (auth), password-changed, email-changed, phone-changed, identity-linked, identity-unlinked, mfa-added, mfa-removed (security), waitlist-confirmation + welcome (custom)
- **Welcome email on signup** — new `send-welcome-email` Edge Function fires once per user after email confirmation (client-triggered, idempotent via `profiles.welcomed_at`). Matches approved copy.
- **Styled HTML text logo** (Lincc in coral+purple) replaces WEBP image for reliable rendering across Outlook / Apple Mail / privacy clients
- **README.md** in `supabase/email-templates/` documents file → Dashboard slot mapping
- **Waitlist confirmation Edge Function** (`send-waitlist-email`) ready — uses Resend + inlined template; needs deploy via `supabase functions deploy send-waitlist-email --no-verify-jwt`

### Migrations applied today
- `036_signup_consent` — `handle_new_user` trigger copies T&C + 18+ consent from user metadata into profile
- `037_event_drafts` — adds `'draft'` to `event_status` enum
- `038_waitlist_user_self_read` — RLS so users can read their own waitlist row
- `039_suggest_users` — friends-of-friends SECURITY DEFINER function
- `040_suggest_users_fallback` — adds popular-users fallback when friends-of-friends is empty
- `041_welcomed_at` — `profiles.welcomed_at` column for welcome-email dedupe

### Still needs dashboard paste (you, before testers)
- Paste the 13 auth/security email templates from `supabase/email-templates/*.html` into Supabase Dashboard → Auth → Email Templates (matches README.md mapping)
- Set `RESEND_API_KEY` + `EMAIL_FROM=Lincc <noreply@system.lincc.live>` in Supabase → Edge Functions → Secrets
- Deploy both custom Edge Functions:
  - `supabase functions deploy send-waitlist-email --no-verify-jwt`
  - `supabase functions deploy send-welcome-email` (requires JWT — do NOT add `--no-verify-jwt`)
- OAuth Google — Google Cloud Console client + Supabase Dashboard provider credentials

---

## Current Status

- **App**: Live on Vercel (`lincc-six.vercel.app`) and `lincc.live`, production-ready
- **Database**: Live Supabase. 26 parent categories + 69 subcategories. Bidirectional review system. Personal vs Business account types with verification flow.
- **Auth**: Email/password + magic link + OAuth Google live. Personal/Business chooser at signup. Two-checkbox consent. Facebook login removed.
- **DEV_MODE**: OFF in all files
- **Migrations**: Up to `060_revoke_public_execute_on_internal_functions` (60+ files in `supabase/migrations/`)
- **Email**: Custom SMTP via Resend live (`noreply@system.lincc.live`). 15 Lincc-branded HTML templates. SPF + DKIM + DMARC all verified on `system.lincc.live` and root `lincc.live`.
- **Push Notifications**: Edge function deployed + secrets configured.
- **Analytics**: GA4 live (`G-8NHZY93N9K`), consent-gated cookie banner (compact, non-overlapping).
- **Landing**: Live with waitlist form. Desktop-optimised with dark mode support.
- **PWA**: Install prompt, offline banner, full-screen non-dismissable update notification, service worker, theme-color matched to page.
- **Tests**: 57 unit tests (Vitest), Playwright E2E
- **CI/CD**: GitHub Actions — type check + tests + build on push/PR
- **MVP Phases 1–7**: All complete
- **UI/UX Overhaul**: Complete (2026-05-25). Design tokens, component unification, screen rework, desktop layout, accessibility (Lighthouse 96/100), dark mode verified. 80+ files changed.
- **Business platform**: Approval workflow, document verification (blue tick) with remove capability, business dashboards + public profiles, vouchers + locations + socials. Multi-location chains supported. Rich empty states for new businesses.
- **Moderation**: Chat reporting, full admin action toolkit (warn / suspend / ban / delete message / remove from event / cancel event), all logged to `admin_audit_log`.
- **Image uploads**: 6-stage recovery cascade for Android/Samsung, camera capture fallback on all upload points, HEIC conversion, per-stage Sentry telemetry.

---

## MVP Phase 1: Auth & Profile Hardening (COMPLETE)

- [x] Profile completion enforcement — ProtectedRoute redirects incomplete profiles to /onboarding
- [x] Password reset flow — forgot password page + Supabase reset email
- [x] Custom auth emails — branded templates for confirm-signup, magic-link, reset-password, change-email
- [x] Email verification — AuthContext checks email_confirmed_at, signs out unverified users
- [x] Session management — autoRefreshToken + persistSession enabled on Supabase client
- [x] Account deletion — GDPR compliance, delete_user_account RPC with "DELETE" confirmation modal
- [x] UI design consistency pass — Login, Signup, Onboarding pages use gradient/card design system

---

## MVP Phase 2: UX Polish & Core Quality (COMPLETE)

- [x] Skeleton loaders — shimmer placeholders for all data-fetching views (home, profile, event detail, chats). `Skeleton.tsx` with 6 variants; `EventCardGridSkeleton` used on HomePage, `ChatListSkeleton` on ChatsPage.
- [x] Empty states — friendly messages + CTAs in profile, chats, user profile pages
- [x] Error states — user-friendly error messages with retry buttons in chats, toasts throughout
- [x] Pull-to-refresh — event list on home page (already implemented via `usePullToRefresh` hook). Extended to `ChatsPage` too so users can refresh their chats list by dragging.
- [x] Subtle animations / polish pass — added keyframes (slide-up-sm, scale-in, pop, sheet-up, backdrop-in), stagger animation on feed cards, press-effect on event cards, bookmark pop, BottomSheet spring curve, Toast slide-up, page fade-in, `prefers-reduced-motion` guard
- [x] Haptic feedback — `src/lib/haptics.ts` (Vibration API wrapper). Wired into ChatRoomPage (send message) and EventDetailPage (join success). Extend to other interactions as needed.
- [x] How-to guide — `WelcomeGuide.tsx` first-time user walkthrough modal, rendered from `MainLayout`.
- [x] PWA install prompt in onboarding — added iOS Safari fallback instructions (Share → Add to Home Screen) when `beforeinstallprompt` isn't available
- [x] Settings page enhancements — email change (inline), linked accounts section (Email + Google), iOS "Add to Home Screen" entry, all existing features retained

---

## MVP Phase 3: Push Notifications (COMPLETE)

### Chunk A — Foundation
- [x] VAPID key generation + `push_subscriptions` table + custom service worker
- [x] Push subscription service, `usePushNotifications` hook, permission prompt
- [x] Settings page push toggle with "Blocked in browser" warning state
- [x] VAPID keys set in Vercel env vars and Supabase Edge Function secrets

### Chunk B — Server-Side Push Sending
- [x] Edge Function `send-push-notification` with VAPID signing
- [x] Triggers: join request, approved/declined, new message (5-min throttle), event cancelled, event reminders (pg_cron)
- [x] Stale subscription cleanup (410/404 auto-delete)

### Chunk C — Notification Preferences & Enhancements
- [x] Per-type toggles, quiet hours, nearby event alerts (Haversine), connection-based priority
- [x] Location sync to DB once per session

---

## MVP Phase 4: Admin Dashboard (COMPLETE)

- [x] Dashboard — real-time stats, ActivityChart (14-day growth), ActivityFeed (recent activity timeline)
- [x] User management — search, detail modal, suspend/ban/activate, role management, bulk actions, CSV export
- [x] Event management — search + status filters, cancel/delete, event analytics cards, CSV export
- [x] Reports — filterable queue, review/dismiss/action with admin notes, CSV export
- [x] Content moderation — flag users and events with reason
- [x] Categories — CRUD from DB
- [x] Announcements — DB table, admin CRUD page, dismissible AnnouncementBanner in MainLayout
- [x] Feature flags — DB table with seeded defaults, admin toggle page, useFeatureFlags hook
- [x] Audit log — admin_audit_log table + AuditLogPage, all admin actions logged
- [x] Admin routes: `/admin`, `/admin/users`, `/admin/events`, `/admin/reports`, `/admin/categories`, `/admin/announcements`, `/admin/feature-flags`, `/admin/audit-log`

---

## MVP Phase 5: Business Profiles (COMPLETE)

- [x] Business signup — "I have a business" toggle on signup page, `/signup?business=true` support
- [x] Business mode toggle — Settings switch with BusinessOnboardingSheet (3-step wizard)
- [x] Business profile fields — name, logo, address, category (12 options), description, opening hours
- [x] Business posting — CreateVoucherPage (4-step wizard), VoucherDetailPage with scratch-to-redeem, share via DM
- [x] Business directory — `/businesses` page with search, category filters, inline voucher previews
- [x] Landing page — "Got a business?" section with CTA

---

## MVP Phase 6: Performance & Testing (COMPLETE)

### Performance
- [x] Code splitting — all routes lazy-loaded with React.lazy() + Suspense
- [x] Vendor chunking — mapbox, sentry, supabase, react, icons split into separate chunks
- [x] Image optimization — native lazy loading on event cards, vouchers, maps
- [x] Database query optimization — comprehensive index coverage verified
- [x] Lighthouse audit — target 90+ across all metrics

### Testing
- [x] Vitest — 42 unit tests (algorithm, utils, components, services)
- [x] Playwright E2E — auth flow tests, navigation tests
- [x] Event flow E2E — create, join, leave, chat
- [x] PWA installability test

---

## MVP Phase 7: Production Launch (COMPLETE)

- [x] CI/CD pipeline — GitHub Actions: type check + unit tests + build on push/PR to main
- [x] Security audit — PostgREST injection fix, RLS hardening, console logging removed, SECURITY DEFINER functions, password policy strengthened
- [x] Production Supabase — separate production database
- [x] Production deployment — production environment on Vercel
- [x] Domain setup — custom domain (lincc.live), SSL
- [x] CDN configuration — static asset caching
- [x] Monitoring dashboards — uptime monitoring, error alerting
- [x] Backup strategy — database backup schedule
- [x] Load testing — simulated traffic
- [x] Analytics setup — Mixpanel/Amplitude for user analytics

---

## Social & Discovery

- [x] Find People — `/people` search page (by name), accessible from Profile + Explore
- [x] Business Directory — `/businesses` browse page with category filters and voucher previews
- [x] DM system — message host from EventDetailPage, message user from UserProfilePage, Friends tab in Chats
- [x] Follow/unfollow — header button on UserProfilePage
- [x] Block/report — from user profile menu

---

## UI/UX Fixes Applied

- [x] Map pins — coral circle backgrounds behind emoji markers for visibility at all zoom levels
- [x] Map click fix — added `unclustered-circle` to ignored layers to prevent race condition
- [x] Event detail bottom bar — `lg:left-64` offset on desktop to not overlap sidebar
- [x] Desktop content width — bumped from max-w-6xl (1152px) to max-w-7xl (1280px)
- [x] VoucherDetailPage — replaced custom header with standard Header component
- [x] CategoryIcon color fix — added text-white on gradient backgrounds (VoucherDetailPage)
- [x] EventCardMini — shows cover_image_url when available, falls back to gradient icon
- [x] Joined event UX — "Message Group" button, clear leave/chat layout
- [x] Mobile "Further Away" layout — location on second line, simplified count badge
- [x] Header rightContent not rendering — `Header` component accepted `rightContent` prop but never rendered it; settings gear + people icon on Profile page were invisible. Fixed by destructuring and rendering the prop.
- [x] Announcement banner redesign — branded gradient card with dismiss button, moved outside header to HomePage content area (no longer in global Header)
- [x] Event card tiles uniform height — fixed content area to consistent height with single-line truncated title across all cards
- [x] MyEventsPage past events section — past events shown below "Past" header at 50% opacity instead of being hidden entirely
- [x] Onboarding progress bar redesign — single continuous bar filling 20% per step with gradient-primary (replaced segmented dots)

---

## Post-MVP / Future Ideas

- [~] Recurring events — schema in place (`events.recurrence_rule`); cron generation deferred
- [ ] Ticket sales — schema doesn't preclude; integration TBD (Stripe Connect for businesses)
- [ ] AI event descriptions — generate with AI
- [ ] Smart scheduling — suggest optimal event times
- [ ] Group events — events for friend groups
- [ ] Event series — multi-part events
- [ ] Venue partnerships — venue booking integration
- [ ] Premium features — subscription model
- [ ] Calendar integration — Google/Apple Calendar sync
- [ ] App store listings — PWA store submissions
- [ ] Event data sourcing — external event APIs, scrapers, partnerships
- [x] Postcode / location search — search by postcode or place name (not just GPS)
- [ ] Feature request form — in-app form logged to DB
- [ ] Contact us form — in-app support form
- [ ] Manage cookies / revoke consent UI in Settings (currently first-prompt only)

---

## Blocked / Waiting

_(Nothing currently blocked)_

---

## Known Limitations

- Supabase: `spatial_ref_sys` RLS — PostGIS system table, known platform limitation
- Supabase: PostGIS in public schema — safe to ignore, moving risks breaking geo queries
- Supabase: Enable leaked password protection — Dashboard > Auth > Attack Protection (manual step)
- ~~Google Places API key not set~~ — **Fixed**: Key added to `.env.local` and Vercel env vars
- Google OAuth consent screen shows `srrubyupwiiqnehshszd.supabase.co` instead of `lincc.live` — Google derives this from the redirect URI domain, not the consent-screen app name. Fix requires a Supabase custom auth domain (e.g. `auth.lincc.live`), which is a Pro plan add-on ($10/mo). Revisit once on Pro: Dashboard → Custom Domains → add `auth.lincc.live`, add CNAME at DNS, then update the authorised redirect URI in Google Cloud Console → Credentials → Lincc Web. Cosmetic only — sign-in works fine in the meantime.

---

## Open Bugs

### From tester feedback (2026-04-15 — Tami & Ahsan)
- [x] Duplicate signup with same email allowed — **Fixed**: Supabase returns success with empty `identities[]` when email is already registered (anti-enumeration behavior). `signUp` in AuthContext now detects this and returns `{ alreadyExists: true }`. SignupPage shows a toast and redirects to `/login?email=...` with email prefilled.
- [x] Confirmation email sometimes not delivered — **Partially fixed**: Added "Resend confirmation email" button with 60s cooldown on the verification-sent screen + spam folder hint. `resendConfirmation()` in AuthContext uses `supabase.auth.resend({ type: 'signup', email })`. **Remaining (dashboard-only)**: Configure custom SMTP (e.g. Resend/SendGrid/Postmark) in Supabase Dashboard → Auth → SMTP Settings. The default shared SMTP has ~2-4 emails/hour rate limits, which is likely why testers who signed up in a short burst didn't all receive emails.
- [x] First-time login fails, requires 2–3 attempts — **Fixed**: Root cause was the aggressive `email_confirmed_at` sign-out check in `AuthContext.onAuthStateChange`. When a user clicked the confirm-email link, we manually exchanged the hash tokens via `setSession()`, but that only decodes the JWT — which doesn't contain `email_confirmed_at`. The listener saw a falsy value and signed them out. Supabase already enforces confirmation at `signInWithPassword` server-side, so the client check was both redundant and actively broken. Removed it.
- [x] Signup email branded "Supabase" instead of Lincc — **Diagnosed (dashboard-only fix required)**: All four local templates in `supabase/email-templates/` (confirm-signup, magic-link, reset-password, change-email) are Lincc-branded. The "Supabase" branding testers see is the **sender identity** — by default Supabase Auth sends from `noreply@mail.app.supabase.io` with sender name "Supabase Auth". Configuring custom SMTP (same step needed for Bug #3 above) resolves this. Also verify that all four template bodies in Dashboard → Auth → Email Templates match the files in `supabase/email-templates/` (dashboard edits don't sync from the repo).
- [x] Profile picture forced in onboarding — **Fixed**: Dropped `avatar_url` from `checkProfileComplete` (AuthContext) so it's no longer required to exit onboarding. Avatar step on OnboardingPage updated with "Optional — you can always add one later" copy and no longer blocks the Continue button. Users who skip get the default initial-based Avatar (which already handles `src={null}`).
- [x] "Add to home screen" / install prompt not surfaced during signup — **Fixed**: Added iOS Safari fallback instructions in onboarding step 5 (Share → Add to Home Screen) since `beforeinstallprompt` never fires on iOS.
- [x] Follow button formatting broken on user profile page — **Fixed**: Changed from `flex-1` (stretched) to natural width `px-5`, hid "Message" text on small screens (icon-only), grouped Share+More with `ml-auto`.
- [x] Chat bar formatting broken when messaging someone — **Fixed**: Changed `h-screen` to `h-dvh` on DMChatRoomPage + ChatRoomPage for proper mobile viewport handling. Added `overflow-hidden` and `overscrollBehavior: contain` for iOS keyboard.
- [x] Map/globe toggle button unclear — **Fixed**: Stable "Discover" label + context-appropriate icons (Compass in list view, Map in map view). No more confusing label/icon swap.
- [x] Map toggle icon disappears on map view + Lincc logo doesn't link home — **Fixed**: Part of the toggle rewrite above. Logo was already a `<Link to="/">` (no-op on home page is correct behavior).
- [x] Bottom-nav Chats shows empty list but event-initiated chats have messages — **Fixed**: Rewrote `getUserChats` in chatService to avoid circular nested join (event_participants → events → event_participants). Now uses simple two-step query: get participant event IDs, then query events directly with OR filter.
- [x] Directions / "find my location" not working — **Fixed**: (a) `EventDetailPage` Directions link was using `maps/place/?q=place_id:...` which just shows the place — swapped to the proper directions deep link `maps/dir/?api=1&destination=lat,lng&destination_place_id=...` which opens Google Maps with turn-by-turn on web/iOS/Android. (b) `MapView.handleFindMe` was silently failing on permission-denied / timeout — added clear toast messages ("Location access denied", "Location unavailable", etc.) and bumped the geolocation timeout from 5s → 10s with a 60s cache.

- [x] Magic link login broken — **Fixed**: Added explicit `getSession()` bootstrap after auth listener setup to catch hash token exchange that completes before listener is ready. Also handle `INITIAL_SESSION` event alongside `SIGNED_IN`. Added `TOKEN_REFRESHED` handling to avoid resetting profile/loading state. Added profile fetch retry (1s delay) for transient DB failures.
- [x] Unable to add venue — **Fixed**: Rewrote placesService.ts to use Google Maps JavaScript SDK instead of REST API (which was blocked by CORS)
- [x] Unable to join events — **Fixed**: Added missing DELETE RLS policy on event_participants (migration 023). JOIN INSERT was working, but leave/cancel was silently failing.
- [x] List/map toggle icon disappears when switching — **Fixed**: Bumped BottomNav z-index from z-40 to z-50 to prevent MapView stacking context from obscuring it
- [x] Notifications not configured — **Fixed**: Generated new VAPID key pair, set all 4 edge function secrets via Management API, disabled JWT verification on edge function. **Remaining**: Update `VITE_VAPID_PUBLIC_KEY` in Vercel env vars to `BAu2e1J1983rUKz8Dk2qWB5GO0UJerC3qCZiEmj3HuPFwW-xO7-j8CsljNiIWZxsbFe-rct-rkmMrkfHfzrJPTA`
- [x] Enable notifications banner cut off on laptop — **Fixed**: Added `lg:max-w-xl lg:mx-auto` to constrain width on desktop
- [x] Email/password login returns "invalid credentials" — **Fixed**: Added `required` to password field, improved error messages to suggest Magic Link as fallback
- [x] PWA desktop install prompt not appearing — **Fixed**: Changed from permanent dismissal to 7-day time-based dismissal so prompt re-appears
- [x] Adding profile picture resets onboarding — **Fixed**: Guarded `isProfileComplete` redirect to only fire on initial mount (step 1, no avatar), not during active onboarding
- [x] Adding event cover image resets to categories — **Fixed**: Persisted create-event form state in sessionStorage so it survives file-picker remounts (mobile browsers drop the tab from memory when the OS picker opens)
- [x] Dark mode skip button not visible — **Fixed**: Increased dark mode `text-muted`/`text-light` contrast, fixed `gradient-border` and GradientButton outline variant to use `bg-surface` instead of hardcoded white

---

## Backlog (New Feature Requests)

- [x] Save event as draft — **Fixed**: Migration 037 adds `'draft'` to the `event_status` enum. Existing RLS already restricts visibility (host-only for non-`'active'` statuses; feed queries filter by `status='active'`; `expire_past_events()` cron only touches active rows so drafts never expire). `CreateEventPage` now has a "Save as Draft" button on the final step. New `MyEventsPage` "Drafts" tab lists the user's drafts with Publish (→ `status='active'`) and Delete actions. Auto-save of in-progress form was already implemented via `sessionStorage` under key `lincc-create-event-draft`.
- [x] PWA install screen in onboarding — iOS fallback instructions added to step 5; native `beforeinstallprompt` already handled
- [x] Search by postcode — **Fixed**: Typing a UK postcode or place name in the search bar geocodes via Mapbox and filters events around that location. Coral pill shows custom location with X to clear back to GPS.
- [ ] Header logo resolution — replace current @4x webp with higher-res source file and scale down for crisp rendering
- [x] Dark mode colour audit — **Fixed**: Replaced hardcoded grays (`bg-gray-50/100`, `hover:bg-gray-50`, `border-gray-200`) with semantic tokens (`bg-background`, `border-border`) across 38 files
- [x] OAuth login — Facebook removed permanently (per product call); Google live, Apple out of scope
- [x] Analytics — Google Analytics 4 (`G-8NHZY93N9K`) live with consent-gated cookie banner, SPA route tracking, signed-in user_id stitching
- [x] Desktop UI/UX improvements — full-width consumer pages, persistent SideNav across full-screen routes, business / profile / voucher hero redesigns, larger grids on `xl`
- [x] Business events posted under business identity — handled by the new account-type model: business accounts always post under `business_id`, BEFORE INSERT trigger blocks personal accounts from setting business_id, EventCard / EventDetailPage / VoucherDetailPage all show business name + logo + verified tick when `business_id` is set
- [x] Main filter — single category select only. **Fixed**: Changed to radio-style single-select on HomePage FilterPills and BottomSheet category grid. Tapping selected category deselects (shows all).
- [x] Removed / left event notifications — **Fixed**: Added `participant_removed`, `participant_left`, `participant_rejoined` notification types. Triggers fire in participantService on reject/leave/rejoin.
- [x] Guest list visibility rules — **Fixed**: Host sees full list (names + avatars + profile links). Participants see avatar stack + count only. Non-participants see count text only.
- [x] iOS "Add to Home Screen" entry in Settings — **Fixed**: Added conditional row in About section that renders on iOS Safari (non-standalone) with Share → Add to Home Screen instructions.
- [x] Event images — **Fixed**: Removed user upload from CreateEventPage. Cover auto-populates from Google Places venue photo or category stock image. Venue photo carousel retained for picking between photos.
- [x] Dark mode persistence + UI audit — **Fixed**: (a) localStorage persistence with try-catch in useDarkMode hook. (b) Full audit of 38 files replacing hardcoded grays with semantic tokens.
- [x] Chat viewport behaviour — **Fixed**: `h-dvh` + `overflow-hidden` on root, `overscrollBehavior: contain` on messages area. Header and input stay pinned.
- [x] Settings icon on every main page — **Fixed**: Added settings gear `rightContent` to Header on HomePage, ChatsPage, MyEventsPage, VouchersPage.
- [x] Google OAuth prefill — **Fixed**: OnboardingPage reads `user.user_metadata` from Google OAuth payload and prefills `first_name` and `avatar_url` (name split + avatar). DOB and gender remain manual (not in standard Google scopes).

### From tester feedback (2026-04-15 — Tami)
- [x] Remove old demo/test events — **Re-scoped & fixed**: User confirmed they didn't want to delete from DB — the real ask was that the UI shouldn't show expired events. Audited every event query: home feed, map, search, explore, user profile, and event detail were already filtering correctly. The two surfaces that were still showing expired events were `MyEventsPage` (Hosting + Joined tabs) and `SavedEventsPage`. Both now filter to `status ∈ ('active','full')` and `expires_at >= now`. DB rows are left intact (hosts could see their own past events via a future "history" tab, and cascade-delete of 37 rows wasn't worth the risk).
- [x] Waitlist confirmation email + in-app flow — **Scaffolded (ready; needs Resend API key)**:
  - New Edge Function `supabase/functions/send-waitlist-email/index.ts` — sends a branded Lincc-styled HTML email via Resend. Reads `RESEND_API_KEY`, `EMAIL_FROM` (default `Lincc <hello@lincc.live>`), and optional `WAITLIST_FUNCTION_SECRET` from Edge Function secrets.
  - New template `supabase/email-templates/waitlist-confirmation.html` (reference copy — the function has the HTML inlined so it can deploy without external fetches).
  - Both waitlist entry points now fire-and-forget POST to the edge function after a successful insert: React `WaitlistForm` in `src/pages/LandingPage.tsx` and the static `landing/index.html` form. If the function isn't deployed or the key isn't set, the insert still succeeds — no UX regression.
  - Migration `038` adds a RLS SELECT policy so a signed-in user can read their own waitlist row (by `auth.email()`), without exposing the whole table.
  - New `useWaitlistStatus` hook (`src/hooks/useWaitlistStatus.ts`) + "Early access member" sparkle badge on `ProfilePage` shown for users whose email is on the waitlist.
  - **Setup required (dashboard-only)**: in Supabase Dashboard → Edge Functions → Secrets, set `RESEND_API_KEY` (from https://resend.com). Then `supabase functions deploy send-waitlist-email --no-verify-jwt`.
- [ ] Category icon render audit — fix design/state/colour render issues on category icons across the app (home, explore, event cards). **Blocked**: user will supply replacement SVG icons directly (their SVG editor is broken). Reopen when assets are provided.
- [ ] Verify push + "add to desktop" notifications end-to-end — confirm both desktop install notification and push notifications actually fire and land on device for a real user (not just config)
- [x] Business profile display fixes — **Fixed**:
  - Events posted by a business now display the **business name + logo** instead of the individual host's name. Updated `EventDetailPage` (both "Hosted by" card and queries join `business:businesses!business_id(*)`), `EventCard`, `EventCardGrid`, `recommendationService`, `eventService.fetchEvents`, and `transformers.ts`/`ScoredEvent` type to carry business info through the recommendation pipeline.
  - Business categories already render correctly from the DB categories table (verified).
  - Cover photo upload already existed on `CreateVoucherPage` and `CreateEventPage`. Improved the label on CreateVoucherPage: "Cover photo" with helper text "Upload a photo of the product or venue. Optional, but recommended." so businesses can tell they can use product shots.
  - BusinessPage already renders the business name correctly.
- [x] Duplicate event option — **Fixed**: Added Copy icon button in the host action overlay on `EventDetailPage`. Writes event data to `sessionStorage` under the existing `lincc-create-event-draft` key (re-using the draft system) and navigates to `/event/new`. Pre-fills category, title, description, venue, date/time, capacity, join mode, audience, allow_dms, and cover image. Subcategory is skipped (not stored on events). Host-only — can open up to all users later if requested.
- [x] Change support email to `hello@lincc.live` — **Fixed**: Replaced all customer-facing email addresses across the app and landing with `hello@lincc.live`. Updated: `src/pages/landing/ContactPage.tsx`, `src/pages/landing/PrivacyPage.tsx`, `src/pages/landing/TermsPage.tsx`, `landing/contact.html`, `landing/privacy.html`, `landing/terms.html`. Previously had split addresses (`hello@`, `privacy@`, `legal@` all on `@lincc.app`) — all consolidated to `hello@lincc.live`. _Still needs confirmation from Tami on `.com` vs `.live` — used `.com` per direct request._ Email templates in `supabase/email-templates/` don't reference a from address (set in Dashboard SMTP config).
- [x] Split signup consent into two checkboxes — **Fixed**: SignupPage now has two separate checkboxes (T&C with link to `/landing/terms`, 18+ confirmation). Both required to submit; "Create Account" button disabled until both checked. Consent passed via `supabase.auth.signUp` options.data → migration 036 updates the `handle_new_user` trigger to copy `terms_accepted_at` and `is_business` from user metadata into the profile row, so the post-signup /terms page is skipped for consenting users.

---

## Completed (Collapsed)

<details>
<summary>All completed tasks (click to expand)</summary>

### Setup & Infrastructure
- [x] Environment variables — `.env.local` configured, Vercel env vars set
- [x] Supabase project — `srrubyupwiiqnehshszd`
- [x] Configure Supabase client — `src/lib/supabase.ts`
- [x] Staging environment — `lincc-six.vercel.app` with auto-deploy from main
- [x] Error monitoring — Sentry configured
- [x] Update logo references — using Vercel blob URL

### Database & Backend
- [x] All core tables: profiles, categories, events, event_participants, messages, reports, blocks, notifications, saved_events, follows, vouchers, voucher_redemptions, conversations, direct_messages, push_subscriptions, admin_audit_log, announcements, feature_flags, feedback, event_reviews, business_waitlist
- [x] Database indexes — comprehensive coverage across all tables
- [x] Row Level Security (RLS) — all tables, circular recursion fixed with SECURITY DEFINER functions
- [x] Database functions — is_admin(), user_is_event_participant(), delete_user_account(), search_events()
- [x] Database triggers — timestamps, participant counts, notifications, nearby events
- [x] 31 migrations applied (001-031)

### Auth & Profiles
- [x] Auth flow — sign up, sign in, magic link, business flag
- [x] Profile CRUD, onboarding (5-step with install/notification prompts), editing
- [x] Account settings, deletion, session management

### Events & Core Features
- [x] Full event CRUD with real-time subscriptions
- [x] Participant management, chat with access control
- [x] Event capacity, expiry, editing, cancellation
- [x] Cover image system with compression + upload

### Map
- [x] Mapbox with clustering, user location, radius, preview cards
- [x] Coral circle markers with emoji for visibility

### PWA
- [x] Full PWA with service worker, offline, install, updates

### Search & Discovery
- [x] Full-text search, category browsing, saved events, people search, business directory

### Recommendation System
- [x] Multi-factor scoring algorithm with fallback cascade

### Social Features
- [x] Follow, block, report, share, DM system

### Business System
- [x] Business profiles, vouchers, redemption, sharing, directory

### Admin Dashboard
- [x] Complete with analytics, user/event/report management, announcements, feature flags, audit log, CSV export

### Security Hardening
- [x] PostgREST injection sanitization
- [x] Notifications INSERT policy restricted
- [x] Event-images storage folder restriction
- [x] Console logging gated behind DEV_MODE
- [x] Circular RLS fixed with SECURITY DEFINER functions
- [x] delete_user_account fixed with correct column names + REVOKE/GRANT
- [x] Password policy strengthened (8 chars + uppercase + number)

### Bug Fixes
- [x] Magic link login, auth loading loop, bottom nav icons, Vercel routing
- [x] Category icons, profile uploads, follower counts
- [x] Map pin click race condition, desktop layout overlap
- [x] Circular RLS 500 errors on profiles/events queries
- [x] Build errors (unused imports, duplicate attributes, type casts)

</details>
