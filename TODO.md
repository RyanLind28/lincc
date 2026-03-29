# LINCC TODO

Last updated: 2026-03-29

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

- [x] Profile completion enforcement — block app use until profile is complete (name, DOB, gender, at least 1 tag)
- [x] Password reset flow — forgot password page + Supabase reset email
- [ ] Custom auth emails — branded Supabase email templates (welcome, reset, magic link) *(Supabase Dashboard config)*
- [x] Email verification — require email confirmation for new signups (AuthContext signs out unverified users)
- [x] Session management — token refresh handling, logout on all devices (TOKEN_REFRESHED + Sign Out Everywhere)
- [x] Account deletion — GDPR compliance, delete_user_account RPC (fixed column names in migration 029) + Settings UI
- [x] UI design consistency pass — all auth pages aligned with gradient background decoration, consistent layout
- [x] Password policy — 8 char minimum + uppercase + number required (signup + reset)
- [x] Magic link login fix — bootstrap detects hash fragments, exchanges via setSession(), cleans URL

---

## MVP Phase 2: UX Polish & Core Quality (COMPLETE)

- [x] Skeleton loaders — Skeleton component with 6 variants, integrated into Home, Chats, EventDetail, Profile
- [x] Empty states — gradient icon + CTA pattern across Home, Chats, Saved, Notifications
- [x] Error states — improved error UI with icons + retry in Chats, EventDetail
- [x] Pull-to-refresh — usePullToRefresh hook with visual spinner on HomePage
- [x] Animations — PageTransition component, fade-in animations
- [x] Haptic feedback — haptics.ts utility on bookmark, join, message send
- [x] How-to guide — WelcomeGuide 4-step modal for first-time users
- [x] PWA install prompt in onboarding — Step 5 added with install + notification prompts
- [x] Settings page enhancements — email display, change password, about/help/privacy links, clear cache, dark mode toggle, send feedback
- [x] Consistent header — Lincc logo on every page, always tappable to go home
- [x] Interest pills — horizontal scroll instead of wrapping on profile pages
- [x] "Events Further Away" / "Vouchers Further Away" — fallback sections when nothing nearby

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
- [x] Event reviews — star rating + comment on EventDetailPage
- [x] Trust score — 0-100 from hosting, joining, reviews
- [x] Dark mode — CSS variables + useDarkMode hook + Settings toggle
- [x] Accessibility — skip-to-content, aria-labels, semantic HTML
- [x] Infinite scroll — useInfiniteScroll hook ready for integration
- [x] A/B testing — persistent variant assignment utility
- [x] Recommendation analytics — impression/click/fallback tracking
- [x] Event templates — localStorage save/load/delete
- [x] Weather integration — useWeather hook (Open-Meteo API)
- [x] Postcode/location search — useGeocode hook (Mapbox)
- [x] Feedback system — FeedbackPage (bug/feature/support), linked from Settings
- [x] Contact form — unified into feedback system

---

## Known Limitations

- Supabase: `spatial_ref_sys` RLS — PostGIS system table, known platform limitation
- Supabase: PostGIS in public schema — safe to ignore, moving risks breaking geo queries
- Supabase: Enable leaked password protection — Dashboard > Auth > Attack Protection (manual step)
- Google Places API key not set — venue autocomplete in event creation won't work until key is added to `.env.local` and Vercel

---

## External Config Needed (Not Code)

- Custom auth emails — Supabase Dashboard > Auth > Email Templates
- Mapbox token restriction — Mapbox Dashboard, restrict to domain
- Google Places API key — Google Cloud Console, restrict to domain + Places API
- Supabase auth rate limits — Dashboard > Auth > Rate Limits
- Leaked password protection — Dashboard > Auth > Attack Protection

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
