# LINCC TODO

Last updated: 2026-02-14

---

## Current Status

- **App**: Pre-launch, demo-ready on Vercel (`lincc-six.vercel.app`)
- **Database**: Live Supabase with 32 London demo events, 21 categories
- **Auth**: Working (email/password, magic link)
- **DEV_MODE**: OFF in all files

### Migrations
- All migrations up to `010` have been applied to live Supabase
- **Landing**: Live with waitlist form
- **PWA**: Partially configured (service worker generates, but no install UI or offline indicator)

---

## Phase 1: Project Setup & DevOps

- [x] Environment variables — `.env.local` configured, Vercel env vars set
- [x] Supabase project — project `srrubyupwiiqnehshszd`
- [x] Configure Supabase client — `src/lib/supabase.ts` with real credentials
- [ ] CI/CD pipeline — GitHub Actions for build and lint on PR
- [x] Staging environment — `lincc-six.vercel.app` with auto-deploy from main
- [x] Error monitoring — Sentry configured
- [ ] Analytics setup — Mixpanel/Amplitude for user analytics

---

## Phase 2: Database Schema & Backend

- [x] Create profiles table
- [x] Create categories table — 21 categories seeded
- [x] Create events table
- [x] Create event_participants table
- [x] Create messages table
- [x] Create reports table
- [x] Create blocks table
- [x] Create notifications table
- [x] Database indexes — events by location, category, time, host
- [x] Row Level Security (RLS) — all tables (except spatial_ref_sys — known limitation)
- [x] Database functions — nearby events query, participant counts
- [x] Database triggers — auto-update timestamps, participant counts
- [x] Seed data — 32 London demo events

---

## Phase 3: API Integration & Core Services

- [x] Disable DEV_MODE — OFF in all files
- [x] Auth flow testing — sign up, sign in, magic link working
- [x] Profile CRUD — create, read, update via Supabase
- [x] Event fetching — `fetchProductionEvents()` with real data
- [x] Event CRUD — `createEvent()`, `updateEvent()`, `deleteEvent()` (soft-cancel) in eventService.ts
- [x] Participant management — join/leave/approve/reject via participantService + useEventParticipants hook, wired into EventDetailPage
- [x] Real engagement tracking — useUserEngagement queries Supabase event_participants, aggregates by category (DEV_MODE off)
- [x] Real-time subscriptions — events table changes refresh home feed, participant changes refresh event detail (Supabase Realtime channels)
- [x] Error handling — ErrorBoundary component with retry (up to 3x), Sentry integration, wraps key routes in App.tsx
- [x] API response caching — in-memory TTL cache (`src/lib/cache.ts`), 30s for event fetches, auto-invalidated on CRUD + realtime

---

## Phase 4: Authentication & User Management

- [ ] Custom auth emails — branded Supabase email templates
- [ ] Email verification — require for new accounts
- [ ] Password reset flow — forgot password
- [ ] Social login — Google/Apple sign-in
- [ ] Profile completion enforcement — before using app
- [x] Onboarding flow — gender (Female/Male), unlimited interests, photo, name, DOB, bio
- [x] Account settings — update email and password via Supabase Auth in EditProfilePage
- [x] Profile editing — DOB editable in EditProfilePage
- [ ] Account deletion — GDPR compliance
- [ ] Session management — token refresh, logout on all devices

---

## Phase 5: Event Features

- [x] Event creation form — 5-step form with validation, category/subcategory, venue, date/time, capacity, join mode, audience
- [x] Event editing — host edit bottom sheet on EventDetailPage (title, description, venue, capacity) via `updateEvent()`
- [x] Event cancellation — host cancel with confirmation dialog, sets status to 'cancelled', navigates to My Events
- [ ] Event photos — cover photo upload (Supabase Storage) — needs DB migration for cover_image column + storage bucket
- [x] Event chat — real-time messaging with access control, optimistic UI, date separators, fully working
- [ ] Event reminders — blocked by push notifications (Phase 12)
- [ ] Recurring events — post-MVP
- [x] Event capacity — full events blocked at join level, spots left display, full badge
- [x] Event expiry — queries filter by `expires_at` (2h after start), events that started still show until expired
- [x] MyEventsPage — "Hosting" + "Joined" tabs with real data, event counts, participant status badges

---

## Phase 6: Map View

- [x] Mapbox setup — token configured
- [x] Basic map render — centered on user location
- [x] Event markers — category-based pins on map
- [x] Marker clustering — Mapbox GL cluster source with zoom-to-expand, count badges, coral/purple colors
- [x] Event preview — preview card slides up on marker tap with title, venue, time, spots left, category
- [x] User location marker — blue dot with ping animation and outer glow
- [x] Radius visualization — dashed purple circle showing search radius from distance slider
- [x] Map filters — shared filter state with list view via useRecommendedEvents hook
- [x] Map/list sync — both views consume same scoredEvents, filters update both simultaneously
- [x] Find me button — locate button, zooms to user at level 15
- [x] Event detail map — Mapbox Static Images API with marker

---

## Phase 7: PWA

### Working
- [x] vite-plugin-pwa configured with `registerType: 'autoUpdate'`
- [x] Workbox service worker auto-generated with precaching
- [x] Runtime caching — Google Fonts (CacheFirst), Mapbox (NetworkFirst)
- [x] Custom manifest at `public/site.webmanifest`
- [x] iOS PWA meta tags in `index.html`
- [x] `usePWA` hook created — detects installability, offline state, exposes `promptInstall()`

### To Do
- [x] Add `purpose: "any"` icon to manifest — added 96, 180, 192, 512 icons with both `any` and `maskable` purpose
- [x] Build install prompt component — `InstallBanner` in MainLayout, dismissible, uses `usePWA` hook
- [x] Build offline indicator — `OfflineBanner` shows amber bar at top when connection lost
- [x] Build update notification — `UpdateNotification` detects waiting service worker, prompts reload
- [x] Add app shortcuts to manifest — "Create Event" (`/event/new`), "My Chats" (`/chats`)
- [x] Offline fallback page — `public/offline.html` with branded design and retry button
- [x] Cache Supabase API responses — NetworkFirst for REST API (1h), CacheFirst for Storage (1 week)
- [x] Enhanced `usePWA` hook — now tracks `hasUpdate`, exposes `applyUpdate()` for service worker updates
- [ ] Test PWA installability — Lighthouse PWA audit, verify install flow on iOS/Android/desktop
- [ ] App store listings — PWA store submissions (post-launch)

---

## Phase 8: Search & Discovery

- [x] Full-text search — PostgreSQL tsvector + GIN index with weighted ranking (title A, venue B, description C), `search_events()` DB function, fallback ILIKE
- [x] Search suggestions — live auto-complete as user types (debounced 300ms), dropdown with matching titles/venues
- [x] Recent searches — localStorage with max 8, shown when search focused, individual remove + clear all
- [x] Category browsing — `/explore` page with category grid, event counts, drill into category to see its events
- [x] Trending events — "Popular near you" horizontal scroll on home page (sorted by participant count)
- [x] Saved/bookmarked events — `saved_events` DB table with RLS, bookmark button on EventCard/EventCardGrid/EventDetailPage, `/saved` page, optimistic UI

---

## Phase 9: Recommendation System Tuning

- [x] Tune algorithm weights — rebalanced to `interest:35, distance:25, time:20, engagement:10, popularity:5, timeOfDay:5` (total 100)
- [x] Improve distance scoring — exponential decay (`exp(-2 * d/r)`) for stronger nearby preference
- [x] Smooth time scoring — continuous exponential decay with floor (no more coarse 8-tier thresholds)
- [x] Add popularity scoring — participant/capacity ratio as social proof (5 pts max)
- [x] Add time-of-day preferences — preferred activity window from past events, default evenings (5 pts max)
- [x] Add more tag mappings — ~30 new tags (dance, baking, chess, trivia, tech, volunteering, etc.), expanded related categories with symmetry
- [x] Add diversity injection — swaps in underrepresented categories at positions 4 and 8 when top 10 are dominated by ≤2 categories
- [x] Expand engagement hook — `useUserEngagement` now returns `preferredHours` (4-hour sliding window from past events)
- [ ] A/B testing — different weight configurations (post-launch)
- [ ] Recommendation analytics — track fallback usage, click-through rates (post-launch)

---

## Phase 10: Social Features

- [x] User profiles — view other users' public profiles with follower/following counts, hosted/attended stats, upcoming events
- [x] Follow system — `follows` table (migration 011), follow/unfollow with optimistic UI, follower + following counts on profile
- [x] Share events — Web Share API + clipboard fallback (done in Phase 5)
- [x] Share profiles — Web Share API + clipboard fallback on UserProfilePage
- [x] Block users — `blockService` with block/unblock, three-dot menu on UserProfilePage + EventDetailPage, auto-unfollow on block
- [x] Report users/events — `reportService` with reason selection, `ReportDialog` component (BottomSheet with 5 reason options + details), wired into UserProfilePage + EventDetailPage
- [ ] Event reviews — rate and review after attending (post-MVP)
- [ ] Trust score — reputation from attendance, reviews (post-MVP)

---

## Phase 11: UX Polish

- [ ] Pull-to-refresh — event list
- [ ] Infinite scroll — load more events on scroll
- [ ] Skeleton loaders — loading states for all data fetching
- [ ] Empty states — no results, no events
- [ ] Error states — user-friendly messages with retry
- [ ] Haptic feedback — key interactions on mobile
- [ ] Animations — smooth transitions and micro-interactions
- [ ] Dark mode — system preference support
- [ ] Accessibility — screen reader, keyboard navigation
- [x] Desktop layout — sidebar nav on lg+, responsive grid, max-width container

---

## Phase 12: Push Notifications

- [ ] Service worker setup — configure for push
- [ ] Notification permissions — request permission flow
- [ ] Event reminders — 1 hour before, 15 min before
- [ ] Join request notifications — notify hosts
- [ ] Request approved/declined — notify participants
- [ ] New message notifications — chat messages
- [ ] Event cancelled — notify all participants
- [ ] Notification preferences — user controls

---

## Phase 13: Admin Dashboard

### Dashboard & Analytics
- [ ] Dashboard overview — stats: total users, events, active events, reports
- [ ] Analytics charts — user growth, event creation, engagement
- [ ] Real-time updates — live when new reports/events come in

### User Management
- [ ] User list — search, filter, sort
- [ ] User details — full profile, event history, reports
- [ ] User actions — suspend, ban, warn, delete
- [ ] Bulk user actions — batch operations

### Event Management
- [ ] Event list — filters (status, category, date)
- [ ] Event moderation — approve, reject, feature, remove
- [ ] Event analytics — views, joins, completion rate

### Reports & Moderation
- [ ] Reports queue — view and action reports
- [ ] Report workflow — reviewed, dismissed, actioned
- [ ] Content moderation — flag inappropriate content

### Configuration
- [ ] Category management — add, edit, reorder, disable
- [ ] Announcement system — send to all users
- [ ] Feature flags — toggle features

### Admin System
- [ ] Admin roles — super admin, moderator, support
- [ ] Audit log — track admin actions
- [ ] Export data — users, events, reports to CSV
- [ ] Mobile admin — responsive for mobile moderation

---

## Phase 14: Testing

- [ ] Unit tests setup — configure Vitest
- [ ] Algorithm tests — scoring functions in `algorithm.ts`
- [ ] Utility tests — `utils.ts` functions
- [ ] Hook tests — React Testing Library
- [ ] Service tests — API services with mocked Supabase
- [ ] Component tests — key UI components
- [ ] E2E setup — Playwright or Cypress
- [ ] Auth flow E2E — signup, login, logout
- [ ] Event flow E2E — create, join, leave
- [ ] Visual regression — screenshot testing

---

## Phase 15: Performance & Optimization

- [ ] Code splitting — lazy load routes with `React.lazy()`
- [ ] Component lazy loading — heavy components (map, etc.)
- [ ] Image optimization — compress, WebP, lazy load
- [ ] Bundle analysis — reduce bundle size (currently 534KB)
- [ ] Caching strategy — service worker caching for offline
- [ ] Database query optimization — optimize slow queries
- [ ] Lighthouse audit — 90+ scores across all metrics

---

## Phase 16: Documentation

- [ ] README update — setup instructions, env vars
- [ ] API documentation — Supabase tables and functions
- [ ] Component Storybook — document UI components
- [ ] Architecture docs — system architecture decisions
- [ ] Contributing guide — for new contributors
- [ ] Deployment docs — staging/production deploy

---

## Phase 17: Production Launch

- [ ] Production Supabase — production database
- [ ] Production deployment — production environment
- [ ] Domain setup — custom domain, SSL
- [ ] CDN configuration — static assets
- [ ] Monitoring dashboards — uptime monitoring
- [ ] Backup strategy — database backup schedule
- [ ] Load testing — simulated traffic
- [ ] Security audit — vulnerability review

---

## Phase 18: Future Ideas

- [ ] AI event descriptions — generate with AI
- [ ] Smart scheduling — suggest optimal times
- [ ] Group events — events for friend groups
- [ ] Event series — multi-part events
- [ ] Venue partnerships — venue booking integration
- [ ] Premium features — subscription model
- [ ] Event templates — save and reuse configs
- [ ] Calendar integration — Google/Apple Calendar sync
- [ ] Weather integration — weather for outdoor events

---

## Backlog

- [ ] Create style sheet document — design system doc for consistent styling
- [x] Update logo references — using Vercel blob URL
- [ ] Supabase: spatial_ref_sys RLS — PostGIS system table, known platform limitation
- [ ] Supabase: PostGIS in public schema — safe to ignore, moving risks breaking geo queries
- [ ] Supabase: Enable leaked password protection — Dashboard → Auth → Attack Protection
- [ ] Google Places API integration — wire up `VITE_GOOGLE_PLACES_API_KEY` for venue autocomplete
- [x] Mapbox improvements — clustering, event preview on marker tap, user location marker, radius circle (done in Phase 6)
- [ ] UI design consistency pass — Login, Signup, Onboarding, and Terms pages don't match the main app's design system (gradients, cards, spacing, typography). Align them with the rest of the app

---

## Resolved Bugs

- [x] Bottom nav icon render issue — fixed consistent wrapper, smooth transitions
- [x] Auth loading loop — fixed with two-effect pattern
- [x] ProfilePage mock data — fixed to use real Supabase queries
- [x] Vercel SPA routing 404s — fixed with `vercel.json` rewrites
- [x] Vercel build: unused Shield import — removed
- [x] Vercel build: ProfilePage TS errors — fixed null checks
- [x] Vercel env var typo — `VITE_SUPABASE_UR` → `VITE_SUPABASE_URL`
