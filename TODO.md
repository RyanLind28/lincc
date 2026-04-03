# LINCC TODO

Last updated: 2026-04-03

---

## Current Status

- **App**: Pre-launch, demo-ready on Vercel (`lincc-six.vercel.app`)
- **Database**: Live Supabase with 25 Dubai/Bahrain demo events (2027 dates), 26 categories
- **Auth**: Working (email/password, magic link, business signup flag)
- **DEV_MODE**: OFF in all files
- **Migrations**: All up to `031` applied to live Supabase
- **Landing**: Live with waitlist form
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
- [ ] Pull-to-refresh — event list on home page
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
- ~~Google Places API key not set~~ — **Fixed 2026-04-03**: Key added to `.env.local`, still needs adding to Vercel env vars

---

## Open Bugs

- [x] Magic link login broken — **Fixed**: Added explicit `getSession()` bootstrap after auth listener setup to catch hash token exchange that completes before listener is ready. Also handle `INITIAL_SESSION` event alongside `SIGNED_IN`. Added `TOKEN_REFRESHED` handling to avoid resetting profile/loading state. Added profile fetch retry (1s delay) for transient DB failures.
- [x] Unable to add venue — **Fixed**: Rewrote placesService.ts to use Google Maps JavaScript SDK instead of REST API (which was blocked by CORS)
- [x] Unable to join events — **Fixed**: Added missing DELETE RLS policy on event_participants (migration 023). JOIN INSERT was working, but leave/cancel was silently failing.
- [x] List/map toggle icon disappears when switching — **Fixed**: Bumped BottomNav z-index from z-40 to z-50 to prevent MapView stacking context from obscuring it
- [ ] Notifications not configured — push notification code is all built, but **edge function secrets need setting in Supabase dashboard**: VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:), PUSH_FUNCTION_SECRET. See migration 014 for the hardcoded secret value.

---

## Backlog (New Feature Requests)

- [ ] Save event as draft — allow users to save an in-progress event and publish later
- [ ] Message host option — let hosts opt in/out of direct messages from users when creating an event
- [ ] Join without group chat — participants can join an event but opt out of the group chat, with a DM-to-host option instead
- [ ] PWA install screen in onboarding — dedicated step in onboarding flow prompting users to install the app to their home screen / desktop
- [ ] Search by postcode — add postcode/location search to the filter (not just GPS)
- [ ] Header logo resolution — replace current @4x webp with higher-res source file and scale down for crisp rendering

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
