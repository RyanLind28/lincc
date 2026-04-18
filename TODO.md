# LINCC TODO

Last updated: 2026-04-17

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

- **App**: Pre-launch, demo-ready on Vercel (`lincc-six.vercel.app`)
- **Database**: Live Supabase, 26 categories, realistic event dataset (2027 demo events now hidden by 14-day window filter)
- **Auth**: Email/password + magic link + OAuth Google (button wired, awaiting provider creds). Two-checkbox signup consent (T&C + 18+) active.
- **DEV_MODE**: OFF in all files
- **Migrations**: All up to `040` applied to live Supabase
- **Email**: Custom SMTP via Resend live (`noreply@system.lincc.live`). 14 Lincc-branded HTML templates ready to paste into Dashboard.
- **Push Notifications**: Edge function deployed + secrets configured. VAPID key update pending in Vercel.
- **Landing**: Live with waitlist form. Confirmation email Edge Function ready to deploy.
- **PWA**: Configured with install prompt, offline banner, update notification, service worker
- **Tests**: 42 unit tests (Vitest), Playwright E2E configured
- **CI/CD**: GitHub Actions — type check + tests + build on push/PR

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

- [ ] Skeleton loaders — shimmer placeholders for all data-fetching views (home, profile, event detail, chats)
- [x] Empty states — friendly messages + CTAs in profile, chats, user profile pages
- [x] Error states — user-friendly error messages with retry buttons in chats, toasts throughout
- [x] Pull-to-refresh — event list on home page (already implemented via `usePullToRefresh` hook). Extended to `ChatsPage` too so users can refresh their chats list by dragging.
- [ ] Animations — smooth page transitions and micro-interactions
- [ ] Haptic feedback — key interactions on mobile (join, like, send message)
- [ ] How-to guide — in-app walkthrough/tutorial for new users explaining key features
- [ ] PWA install prompt in onboarding — prompt users to add to home screen during onboarding flow
- [ ] Settings page enhancements — comprehensive settings hub: account management (email, password change), app preferences (language, theme), linked accounts, about/version info, help & support links, clear cache, notification sounds

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

## MVP Phase 6: Performance & Testing (MOSTLY COMPLETE)

### Performance
- [x] Code splitting — all routes lazy-loaded with React.lazy() + Suspense
- [x] Vendor chunking — mapbox, sentry, supabase, react, icons split into separate chunks
- [x] Image optimization — native lazy loading on event cards, vouchers, maps
- [x] Database query optimization — comprehensive index coverage verified
- [ ] Lighthouse audit — target 90+ across all metrics

### Testing
- [x] Vitest — 42 unit tests (algorithm, utils, components, services)
- [x] Playwright E2E — auth flow tests, navigation tests
- [ ] Event flow E2E — create, join, leave, chat (requires authenticated session)
- [ ] PWA installability test

---

## MVP Phase 7: Production Launch

- [x] CI/CD pipeline — GitHub Actions: type check + unit tests + build on push/PR to main
- [x] Security audit — PostgREST injection fix, RLS hardening, console logging removed, SECURITY DEFINER functions, password policy strengthened
- [ ] Production Supabase — separate production database
- [ ] Production deployment — production environment on Vercel
- [ ] Domain setup — custom domain (lincc.live), SSL
- [ ] CDN configuration — static asset caching
- [ ] Monitoring dashboards — uptime monitoring, error alerting
- [ ] Backup strategy — database backup schedule
- [ ] Load testing — simulated traffic
- [ ] Analytics setup — Mixpanel/Amplitude for user analytics

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

---

## Post-MVP / Future Ideas

- [ ] Social login — Google/Apple sign-in
- [ ] Recurring events — weekly/monthly repeat
- [ ] AI event descriptions — generate with AI
- [ ] Smart scheduling — suggest optimal event times
- [ ] Group events — events for friend groups
- [ ] Event series — multi-part events
- [ ] Venue partnerships — venue booking integration
- [ ] Premium features — subscription model
- [ ] Calendar integration — Google/Apple Calendar sync
- [ ] App store listings — PWA store submissions
- [ ] Event data sourcing — external event APIs, scrapers, partnerships
- [x] Postcode / location search — search by postcode or place name (not just GPS) _(moved to Backlog)_
- [ ] Feature request form — in-app form logged to DB
- [ ] Contact us form — in-app support form

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
- [ ] "Add to home screen" / install prompt not surfaced during signup — new testers never saw the PWA install step. Ensure `InstallBanner` / install step fires in onboarding flow on mobile.
- [ ] Follow button formatting broken on user profile page — visual/layout issue with the follow button on `/user/:id`. Screenshot from Ahsan 2026-04-15 17:40.
- [ ] Chat bar formatting broken when messaging someone — layout issue in DM chat room. Screenshot from Ahsan 2026-04-15 17:45.
- [ ] Map/globe toggle button unclear — pressing it takes users to the globe/map view correctly, but the affordance isn't obvious. Improve icon label/tooltip.
- [ ] Map toggle icon disappears on map view + Lincc logo doesn't link home — on the map view the toggle icon vanishes, and the header Lincc logo doesn't navigate back to the home page on that specific page.
- [ ] Bottom-nav Chats shows empty list but event-initiated chats have messages — messages appear when entering chat from an event, but the Chats tab shows no messages. Likely a query/filter mismatch between the two entry points (event-scoped vs. user-scoped chat fetch).
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
- [ ] Message host option — let hosts opt in/out of direct messages from users when creating an event
- [ ] Join without group chat — participants can join an event but opt out of the group chat, with a DM-to-host option instead
- [ ] PWA install screen in onboarding — dedicated step in onboarding flow prompting users to install the app to their home screen / desktop
- [ ] Search by postcode — add postcode/location search to the filter (not just GPS)
- [ ] Header logo resolution — replace current @4x webp with higher-res source file and scale down for crisp rendering
- [ ] Dark mode colour audit — review all text/button colours (skip, secondary actions, etc.) for proper contrast in dark mode
- [ ] OAuth login — Google, Apple, Facebook buttons added to UI (disabled with "not set up" label), needs provider credentials configured in Supabase Auth

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
