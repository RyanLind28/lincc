# LINCC TODO

Last updated: 2026-03-28

---

## Current Status

- **App**: Pre-launch, demo-ready on Vercel (`lincc-six.vercel.app`)
- **Database**: Live Supabase with 25 Dubai/Bahrain demo events (2027 dates), 26 categories
- **Auth**: Working (email/password, magic link)
- **DEV_MODE**: OFF in all files
- **Migrations**: All up to `028` applied to live Supabase
- **Landing**: Live with waitlist form
- **PWA**: Configured with install prompt, offline banner, update notification, service worker

---

## MVP Phase 1: Auth & Profile Hardening

- [x] Profile completion enforcement — block app use until profile is complete (name, DOB, gender, at least 1 tag)
- [x] Password reset flow — forgot password page + Supabase reset email
- [ ] Custom auth emails — branded Supabase email templates (welcome, reset, magic link) *(Supabase Dashboard config)*
- [x] Email verification — require email confirmation for new signups (AuthContext signs out unverified users)
- [x] Session management — token refresh handling, logout on all devices (TOKEN_REFRESHED + Sign Out Everywhere)
- [x] Account deletion — GDPR compliance, delete profile + data (delete_user_account RPC + Settings UI)
- [x] UI design consistency pass — Login, Signup, Onboarding, and Terms pages aligned: consistent max-width, vertical centering, gradient background decoration

---

## MVP Phase 2: UX Polish & Core Quality

- [x] Skeleton loaders — shimmer placeholders for all data-fetching views (home, profile, event detail, chats)
- [x] Empty states — friendly messages + CTAs when no events, no chats, no results
- [x] Error states — user-friendly error messages with retry buttons
- [x] Pull-to-refresh — event list on home page
- [x] Animations — smooth page transitions and micro-interactions (PageTransition component, fade-in)
- [x] Haptic feedback — key interactions on mobile (join, bookmark, send message)
- [x] How-to guide — in-app walkthrough/tutorial for new users explaining key features (WelcomeGuide component)
- [x] PWA install prompt in onboarding — InstallBanner shows on home page immediately after onboarding completion
- [x] Settings page enhancements — account management (email display, change password), about/help/privacy links, clear cache, version info

---

## MVP Phase 3: Push Notifications

### Chunk A — Foundation (DONE)
- [x] VAPID key generation — `scripts/generate-vapid-keys.mjs`, keys generated and in `.env`
- [x] `push_subscriptions` table — migration `013` applied to live Supabase (RLS, index, CASCADE delete)
- [x] Custom service worker — `src/sw.ts` with Workbox precaching, runtime caching, push + notificationclick handlers
- [x] Vite PWA config — switched from `generateSW` to `injectManifest` strategy
- [x] Push subscription service — `src/services/pushService.ts` (subscribe, unsubscribe, getSubscription)
- [x] `usePushNotifications` hook — permission state, isSubscribed, subscribe/unsubscribe
- [x] Notification permission prompt — dismissible card in MainLayout for first-time users
- [x] Settings page push toggle — on/off toggle with "Blocked in browser" state
- [x] Set `VITE_VAPID_PUBLIC_KEY` in Vercel dashboard env vars

### Chunk B — Server-Side Push Sending (DONE)
- [x] Supabase Edge Function — `send-push-notification` deployed, uses `web-push` npm for VAPID signing
- [x] `create_notification()` updated — fires async `pg_net` HTTP POST to Edge Function on every notification
- [x] Join request notifications — push to host via existing `on_join_request` trigger → `create_notification()`
- [x] Request approved/declined — push to participant via existing `on_request_response` trigger → `create_notification()`
- [x] New message notifications — `on_new_message` trigger on `messages` INSERT, notifies all participants except sender, 5-min throttle per user/event
- [x] Event cancelled — `on_event_cancelled` trigger on `events` UPDATE to `cancelled`, notifies all approved participants
- [x] Event reminders — `send_event_reminders()` pg_cron job every 5 min, notifies for events starting within 1 hour (one-time per event)
- [x] VAPID keys + secrets — stored as Supabase Edge Function secrets (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `PUSH_FUNCTION_SECRET`)
- [x] Stale subscription cleanup — 410/404 responses auto-delete expired subscriptions from DB
- [x] Migration 014 applied — `014_push_notification_trigger.sql`

### Chunk C — Notification Preferences & Enhancements (DONE)
- [x] Notification preferences — per-type toggles in Settings (join_request, new_message, event_cancelled, event_starting, nearby_event)
- [x] Quiet hours — user-configurable start/end times, push notifications suppressed during set window
- [x] Nearby event alerts — `on_nearby_event` trigger on events INSERT, Haversine distance check against user's saved location and radius
- [x] Connection-based notifications — 3+ shared events bypass quiet hours (checked in `create_notification()`)
- [x] `notification_preferences` JSONB column added to profiles with sensible defaults
- [x] `last_lat`/`last_lng` columns on profiles for location-based alerts
- [x] Location sync — `useUserLocation` hook saves position to DB once per session
- [x] Migration 015 applied — `015_notification_preferences.sql`

---

## MVP Phase 4: Admin Dashboard

### Dashboard & Analytics
- [x] Dashboard overview — real-time stats: total users, active events, pending reports, categories
- [x] Analytics charts — ActivityChart (user/event growth bar chart, 14-day view with tooltips)
- [x] Real-time updates — ActivityFeed (merged timeline of recent users, events, reports)

### User Management
- [x] User list — search by name/email with debounce
- [x] User details — modal with profile info, tags, role, status, join date
- [x] User actions — suspend, ban, activate, promote to admin, demote
- [x] Bulk user actions — select all/individual, bulk suspend/ban/activate

### Event Management
- [x] Event list — search + status filter pills (all/active/expired/cancelled/full)
- [x] Event moderation — cancel and delete events from admin
- [x] Event analytics — summary cards (total, active, total joins)

### Reports & Moderation
- [x] Reports queue — filterable list with pending/reviewed/dismissed/actioned status
- [x] Report workflow — review with admin notes, dismiss, action reports
- [x] Content moderation — flag users and events with reason from admin modals

### Configuration
- [x] Category management — fetch from DB, add, edit, delete categories
- [x] Announcement system — announcements table, admin CRUD page, dismissible AnnouncementBanner in MainLayout
- [x] Feature flags — feature_flags table with seeded defaults, admin toggle page, useFeatureFlags hook

### Admin System
- [x] Admin roles — moderator and support values added to user_role enum
- [x] Audit log — admin_audit_log table + AuditLogPage, all admin actions logged
- [x] Export data — CSV export for users, events, reports (download buttons on each page)
- [x] Mobile admin — responsive layout for mobile moderation

---

## MVP Phase 5: Business Profiles

- [x] Business mode toggle — Settings "Switch to Business" with BusinessOnboardingSheet (3-step wizard), deactivate option
- [x] Business profile fields — name, logo, address, category, description, opening hours (EditBusinessProfilePage)
- [x] Business posting — CreateVoucherPage (4-step wizard), VoucherDetailPage with scratch-to-redeem, share via DM
- [x] Landing page business signup — "Got a business?" section with "Register Interest" CTA linking to waitlist

---

## MVP Phase 6: Performance & Testing

### Performance
- [x] Code splitting — all routes lazy-loaded with `React.lazy()` + `Suspense` fallback
- [x] Component lazy loading — vendor chunks split (mapbox, sentry, supabase, react, icons)
- [x] Image optimization — native lazy loading on event cards, vouchers, maps, category images
- [x] Bundle analysis — main chunk reduced from 2.8MB to 247KB via code splitting + vendor chunking
- [x] Database query optimization — reviewed all indexes, coverage is comprehensive across all tables
- [ ] Lighthouse audit — target 90+ across all metrics

### Testing
- [x] Unit tests setup — Vitest + jsdom + @testing-library configured
- [x] Algorithm tests — 23 tests covering all scoring functions in `algorithm.ts`
- [x] Utils tests — cn, calculateAge, formatRelativeTime
- [x] Service tests — mocked Supabase client pattern established
- [x] Component tests — Button and Badge tested with React Testing Library
- [x] E2E setup — Playwright configured with dev server auto-start
- [x] Auth flow E2E — login/signup page loads, navigation, invalid credentials, protected route redirect
- [ ] Event flow E2E — create, join, leave, chat (requires authenticated session)
- [ ] Test PWA installability — Lighthouse PWA audit, verify install on iOS/Android/desktop

---

## MVP Phase 7: Production Launch

- [ ] Production Supabase — separate production database
- [ ] Production deployment — production environment on Vercel
- [ ] Domain setup — custom domain (lincc.live), SSL
- [ ] CDN configuration — static asset caching
- [ ] Monitoring dashboards — uptime monitoring, error alerting
- [ ] Backup strategy — database backup schedule
- [ ] Load testing — simulated traffic
- [ ] Security audit — vulnerability review, pen test
- [x] CI/CD pipeline — GitHub Actions: type check + unit tests + build on push/PR to main
- [ ] Analytics setup — Mixpanel/Amplitude for user analytics

---

## Post-MVP / Future Ideas

- [ ] Social login — Google/Apple sign-in
- [x] Event photos — cover photo upload via Supabase Storage + Google Places venue photo selector
- [x] Google Places API integration — venue autocomplete in CreateEventPage with session tokens, field masking, debouncing, venue photo picker for cover images
- [x] Google Places cover image selector — venue photos from Google Places shown as selectable cover image options during event creation
- [x] Event reviews — event_reviews table, star rating + comment, EventReviews component on EventDetailPage
- [x] Trust score — trustScoreService calculates 0-100 score from hosting, joining, reviews (new/rising/trusted/veteran)
- [ ] Recurring events — weekly/monthly repeat
- [x] Dark mode — CSS variables override with .dark class, useDarkMode hook, Settings toggle, system preference detection
- [x] Accessibility — skip-to-content link, aria-labels on nav/modals/sheets, semantic HTML
- [x] Infinite scroll — useInfiniteScroll hook with IntersectionObserver, ready for integration
- [x] A/B testing — abTest utility with persistent variant assignment per experiment
- [x] Recommendation analytics — impression/click/fallback tracking with CTR calculation
- [ ] AI event descriptions — generate with AI
- [ ] Smart scheduling — suggest optimal event times
- [ ] Group events — events for friend groups
- [ ] Event series — multi-part events
- [ ] Venue partnerships — venue booking integration
- [ ] Premium features — subscription model
- [x] Event templates — localStorage-based save/load/delete (eventTemplateService)
- [ ] Calendar integration — Google/Apple Calendar sync
- [x] Weather integration — useWeather hook (Open-Meteo API), shown on EventDetailPage location card
- [ ] App store listings — PWA store submissions
- [ ] Event data sourcing — external event APIs, scrapers, partnerships
- [x] Postcode / location search — useGeocode hook using Mapbox geocoding API
- [x] Feature request form — FeedbackPage with type selector (feedback/feature_request/bug/support), saved to feedback table
- [x] Contact us form — unified into FeedbackPage with support type, linked from Settings

---

## Blocked / Waiting

_(Nothing currently blocked)_

---

## Known Limitations

- Supabase: `spatial_ref_sys` RLS — PostGIS system table, known platform limitation
- Supabase: PostGIS in public schema — safe to ignore, moving risks breaking geo queries
- Supabase: Enable leaked password protection — Dashboard > Auth > Attack Protection (manual step)

---

## Open Bugs

- [x] Magic link login broken — Fixed: bootstrap now detects hash fragments with access_token, exchanges via setSession(), cleans URL hash


---

## Completed

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
- [x] Create profiles table
- [x] Create categories table — 26 categories
- [x] Create events table
- [x] Create event_participants table
- [x] Create messages table
- [x] Create reports table
- [x] Create blocks table
- [x] Create notifications table
- [x] Database indexes — events by location, category, time, host
- [x] Row Level Security (RLS) — all tables
- [x] Database functions — nearby events query, participant counts
- [x] Database triggers — auto-update timestamps, participant counts
- [x] Seed data — 25 Dubai/Bahrain demo events (2027 dates)

### Auth & Profiles
- [x] Disable DEV_MODE — OFF in all files
- [x] Auth flow — sign up, sign in, magic link working
- [x] Profile CRUD — create, read, update via Supabase
- [x] Onboarding flow — gender, interests, photo, name, DOB, bio
- [x] Account settings — update email and password
- [x] Profile editing — all fields editable in EditProfilePage

### Events & Core Features
- [x] Event fetching — `fetchProductionEvents()` with real Supabase data
- [x] Event CRUD — create, update, delete (soft-cancel)
- [x] Participant management — join/leave/approve/reject
- [x] Real engagement tracking — queries event_participants, aggregates by category
- [x] Real-time subscriptions — events, participants, messages, notifications
- [x] Error handling — ErrorBoundary with retry + Sentry
- [x] API response caching — 30s TTL, auto-invalidated
- [x] Event creation form — 5-step with validation
- [x] Event editing — host edit bottom sheet
- [x] Event cancellation — soft-cancel with confirmation
- [x] Event chat — real-time messaging with access control
- [x] Event capacity — full blocking, spots display
- [x] Event expiry — 2h after start via `expires_at`
- [x] MyEventsPage — Hosting + Joined tabs

### Map
- [x] Mapbox setup + basic render
- [x] Event markers — category-based pins
- [x] Marker clustering — zoom-to-expand, count badges
- [x] Event preview card on marker tap
- [x] User location marker — blue dot with ping
- [x] Radius visualization — dashed purple circle
- [x] Map/list filter sync
- [x] Find me button
- [x] Event detail static map

### PWA
- [x] vite-plugin-pwa with autoUpdate
- [x] Workbox service worker with precaching
- [x] Runtime caching — Fonts, Mapbox, Supabase REST, Storage
- [x] Custom manifest with maskable icons
- [x] iOS PWA meta tags
- [x] `usePWA` hook — installability, offline, updates
- [x] Install prompt banner
- [x] Offline indicator banner
- [x] Update notification
- [x] App shortcuts
- [x] Offline fallback page

### Search & Discovery
- [x] Full-text search — tsvector + GIN index
- [x] Search suggestions — debounced auto-complete
- [x] Recent searches — localStorage
- [x] Category browsing — `/explore` page
- [x] Trending events — popular near you
- [x] Saved/bookmarked events

### Recommendation System
- [x] Tuned algorithm weights (interest 35, distance 25, time 20, engagement 10, popularity 5, timeOfDay 5)
- [x] Exponential distance decay
- [x] Continuous time scoring
- [x] Popularity scoring
- [x] Time-of-day preferences
- [x] 30+ tag mappings
- [x] Diversity injection
- [x] Engagement hook with preferredHours

### Social Features
- [x] User profiles with stats
- [x] Follow system with optimistic UI
- [x] Share events + profiles (Web Share API)
- [x] Block users with auto-unfollow
- [x] Report users/events with reason selection

### Layout
- [x] Desktop layout — sidebar nav, responsive grid

### Launch Data
- [x] Bahrain & Dubai demo events — 13 Dubai + 12 Bahrain with real venues
- [x] Map default center changed to Dubai
- [x] Recommendation fallback location changed to Dubai

### Push Notifications (Phase 3, Chunk A)
- [x] VAPID key generation script
- [x] `push_subscriptions` DB table + RLS + migration 013
- [x] Custom service worker (`src/sw.ts`) — injectManifest with push handler
- [x] Push subscription service (`src/services/pushService.ts`)
- [x] `usePushNotifications` hook
- [x] Notification permission prompt component in MainLayout
- [x] Push toggle in Settings page

### Push Notifications (Phase 3, Chunk B)
- [x] Edge Function `send-push-notification` deployed with VAPID signing
- [x] `create_notification()` wired to pg_net → Edge Function for push delivery
- [x] `on_event_cancelled` trigger — notifies approved participants
- [x] `on_new_message` trigger — notifies chat participants (5-min throttle)
- [x] `send_event_reminders()` pg_cron job — events starting within 1 hour
- [x] Stale subscription cleanup (410/404 auto-delete)
- [x] Migration 014 applied

### Push Notifications (Phase 3, Chunk C)
- [x] Per-type notification preferences (toggles in Settings UI)
- [x] Quiet hours with configurable start/end time pickers
- [x] Nearby event alerts — DB trigger with Haversine distance + user radius
- [x] Connection-based priority — 3+ shared events bypass quiet hours
- [x] `notification_preferences` JSONB + `last_lat`/`last_lng` on profiles
- [x] Location sync from frontend to DB (once per session)
- [x] `nearby_event` notification type with icon/routing in NotificationsPage + service worker
- [x] Migration 015 applied

### Bug Fixes
- [x] Bottom nav icon render issue
- [x] Auth loading loop — two-effect pattern
- [x] ProfilePage mock data → real queries
- [x] Vercel SPA routing 404s
- [x] Vercel build errors (unused imports, TS errors, env typo)
- [x] Category icons — added 11 missing icons to iconMap + MapView emoji map
- [x] Profile picture upload — upsert + error logging + success toast
- [x] Profile UI redesign — card layout with stats row
- [x] Profile follower/following counts
- [x] Profile image upload — immediate DB save + refreshProfile on upload, Avatar resets error on src change
- [x] Interest pills compacted — `size="sm"` + tighter gap on ProfilePage and UserProfilePage
- [x] Followers/Following list page — `/user/:id/follows?tab=followers|following` with tabbed UI
- [x] Follower/following counts now clickable links on both ProfilePage and UserProfilePage

### Event Cover Image System
- [x] Subcategory images — all ~62 subcategories have specific Unsplash images
- [x] `cover_image_url` column — migration 019 applied to live Supabase
- [x] TypeScript types updated — Event, supabase types, CreateEventData, UpdateEventData
- [x] Cover image picker in CreateEventPage — auto-populates from subcategory, upload via camera button, reset to default
- [x] Image compression + upload to `event-images` storage bucket on submit
- [x] EventDetailPage uses `cover_image_url` with category fallback
- [x] EventCardGrid tiles show `cover_image_url` via recommendation service + Explore/Saved pages

</details>
