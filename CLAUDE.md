# CLAUDE.md - Lincc Project Reference

## What is Lincc?

Lincc is a **local events and discovery platform** — everything happening around you, in one place. Events, deals, openings, offers — all live, all local. It is NOT a friendship or dating app. It helps people improve their social life and keep up with what's happening in real time. Think of it as your "local pulse".

**Target users**: Both regular people (creating events like coffee meetups, co-working, sports) and businesses (promoting deals, openings, offers, limited-time promotions).

**Current status**: Pre-launch, demo-ready. The app is deployed on Vercel (`lincc-six.vercel.app`) with real Supabase data. DEV_MODE is OFF in all files. Landing page with waitlist is live.

**PRD**: Full product requirements document at `PRD/Lincc PRD V1.rtf`.

**Task tracking**: All tasks, phases, and progress tracked in `TODO.md`.

---

## MVP Scope

The MVP focuses on three pillars: **Immediacy**, **Safety**, and **Simplicity**.

### Core MVP Features
1. **Auth & Onboarding** — Magic link or email/password via Supabase Auth. Mandatory profile completion (photo, name, DOB 18+, gender (Female/Male), unlimited tags, bio max 140 chars).
2. **The "Now" Map (Home Screen)** — Mapbox GL map centered on user location. Event pins by category. Filters: time, category, radius (1–20km). Women-only visibility mode.
3. **Event Creation** — Post an activity in under 30 seconds. Category, title, location (Google Places), time (within 24h), capacity. Join mode: request or auto-join. Audience: everyone, women only, men only. Events expire 2 hours after start time.
4. **Connection & Chat** — Join request flow with host approval. Text-only real-time chat (Supabase Realtime). Unmatch/report/block. Chat archived 24h after event end.
5. **Admin Panel** — Desktop web portal. User management, event moderation, report queue.

### User Personas
- **The Host**: Wants to do an activity now but needs a partner.
- **The Joiner**: Looking for nearby activities to join immediately.
- **The Admin**: Moderates content and ensures community safety.

### Non-Functional Requirements
- Map load < 2 seconds on 4G
- RLS enabled on all tables
- User location fuzzed for strangers, exact only for accepted guests
- GDPR export/delete in settings

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + TypeScript | 19.2 / 5.9 |
| Build | Vite | 7.2 |
| Routing | React Router | 7.13 |
| Styling | Tailwind CSS 4 (via `@tailwindcss/vite`, no config file) | 4.1 |
| Icons | Lucide React | 0.563 |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Storage) | 2.91 |
| Maps | Mapbox GL JS | 3.18 |
| Errors | Sentry | 10.38 |
| PWA | vite-plugin-pwa + Workbox | 1.2 |
| CSS Utils | clsx (via `cn()` wrapper) | 2.1 |

### External Services
- **Supabase** — Database, auth, realtime, storage
- **Mapbox** — Map rendering and static image API
- **Google Places API** — Venue autocomplete (key configured, not yet integrated)
- **Vercel** — Hosting with auto-deploy from main
- **Sentry** — Error monitoring

---

## Project Structure

There are **two separate apps** in this repo:

### Main App (`/src`) — the actual product
```
src/
├── components/
│   ├── layout/        # MainLayout, BottomNav, Header, ProtectedRoute
│   ├── ui/            # Reusable: Button, Card, Input, EventCard, MapView, CategoryIcon, etc.
│   └── features/      # (empty — feature components go here)
├── contexts/          # AuthContext, ToastContext, ViewModeContext
├── data/              # categories.ts, demoEvents.ts, tagToCategoryMap.ts
├── hooks/             # useRecommendedEvents, useEventChat, useEventParticipants, useNotifications, useUserLocation, useUserEngagement, useFilters, usePWA
├── lib/               # supabase.ts, utils.ts, algorithm.ts
├── pages/
│   ├── auth/          # LoginPage, SignupPage, TermsPage
│   ├── admin/         # DashboardPage, UsersPage, EventsPage, ReportsPage, CategoriesPage
│   ├── landing/       # AboutPage, PrivacyPage, TermsPage, ContactPage
│   └── *.tsx          # HomePage, EventDetailPage, CreateEventPage, ChatRoomPage, ChatsPage, ProfilePage, etc.
├── services/
│   ├── events/        # eventService, recommendationService, participantService, transformers
│   ├── chat/          # chatService
│   └── notificationService.ts
└── types/             # index.ts (domain types), supabase.ts (generated)
```

### Landing Site (`/landing`) — marketing/waitlist page
```
landing/
├── src/
│   ├── components/    # Footer, WaitlistForm
│   ├── lib/           # supabase.ts (landing's own client)
│   └── pages/         # Home, About, Contact, Privacy, Terms
├── index.html
├── vite.config.ts
└── package.json       # Separate dependencies
```

---

## PWA Configuration

### Current State
The PWA is fully configured with install prompts, offline detection, update notifications, and runtime caching.

### What's Working
- **vite-plugin-pwa** with `registerType: 'autoUpdate'` in `vite.config.ts`
- **Workbox** service worker auto-generated with precaching and runtime caching
- **Runtime caching**: Google Fonts (CacheFirst, 1yr), Mapbox (NetworkFirst, 1d), Supabase REST (NetworkFirst, 1hr), Supabase Storage (CacheFirst, 1wk)
- **Custom manifest** at `public/site.webmanifest` with `purpose: "any"` + `"maskable"` icons and app shortcuts
- **iOS PWA meta tags** in `index.html`
- **`usePWA` hook** — detects installability, offline state, service worker updates, exposes `promptInstall()` and `applyUpdate()`
- **`InstallBanner`** — dismissible install prompt in MainLayout
- **`OfflineBanner`** — amber bar at top when connection lost (global, in App.tsx)
- **`UpdateNotification`** — prompts reload when new service worker is waiting (global, in App.tsx)
- **Offline fallback** — `public/offline.html` with branded design
- **App shortcuts** — "Create Event" (`/event/new`), "My Chats" (`/chats`)

### PWA Files
```
public/
├── site.webmanifest              # Custom manifest (name, icons, theme)
├── apple-touch-icon.png          # 180x180 iOS icon
├── favicon.ico                   # ICO favicon
├── favicon.svg                   # SVG favicon (coral-purple gradient)
├── favicon-96x96.png             # PNG favicon
├── web-app-manifest-192x192.png  # PWA icon (maskable)
├── web-app-manifest-512x512.png  # PWA icon (maskable)
└── icons/
    └── favicon.svg               # SVG icon
```

### Vite PWA Config (`vite.config.ts`)
```typescript
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['icons/*.svg', 'icons/*.png'],
  manifest: false,  // Using custom public/site.webmanifest
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MB
    runtimeCaching: [ /* Google Fonts, Mapbox */ ],
  },
  devOptions: { enabled: false },
})
```

---

## Build & Dev Commands

```bash
# Main app
npm run dev              # Dev server (localhost:5173)
npm run build            # TypeScript check + Vite build
npx tsc --noEmit         # Type-check only

# Landing site
cd landing && npm run dev    # Landing dev server
cd landing && npm run build  # Landing build
```

---

## Deployment

- **Vercel URL**: `https://lincc-six.vercel.app`
- **Auto-deploy**: From `main` branch
- **SPA routing**: `vercel.json` rewrites all non-asset routes to `index.html`
- **Vercel env vars**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_MAPBOX_TOKEN`

---

## Supabase

- **Project ref**: `srrubyupwiiqnehshszd`
- **Project URL**: `https://srrubyupwiiqnehshszd.supabase.co`
- **Management API token**: `.env` as `SUPABASE_ACCESS_TOKEN`
- **Anon key**: `.env.local` as `VITE_SUPABASE_ANON_KEY`
- **Mapbox token**: `.env.local` as `VITE_MAPBOX_TOKEN`
- **Owner account**: `ryanlindie@gmail.com` (profile ID: `0b39d573-f7da-41d7-8db8-49025ea326f1`)

### SQL Query via API
```bash
curl -s -X POST "https://api.supabase.com/v1/projects/srrubyupwiiqnehshszd/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT 1;"}'
```

### Database Tables
| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (name, gender, bio, tags, avatar, settings) |
| `categories` | 21 event categories with Lucide icon names |
| `events` | Events with location, capacity, join_mode, audience, status |
| `event_participants` | Join requests (pending/approved/rejected/left) |
| `messages` | Event chat messages (realtime enabled) |
| `notifications` | User notifications (realtime enabled) |
| `reports` | User/event reports for moderation |
| `blocks` | User blocks |
| `saved_events` | Bookmarked/saved events per user |
| `follows` | User-to-user follow relationships |

### Migrations
Located in `supabase/migrations/`:
- `001_initial_schema.sql` — Full schema with RLS, triggers, indexes
- `002_enhancements.sql` — Additional enhancements, `expire_past_events()` function, event-images storage bucket
- `003_fixes.sql` — Bug fixes
- `004_example_events.sql` — Seed data
- `005_demo_events_london.sql` — 30 London demo events
- `006_security_fixes.sql` — Function search_path fixes, waitlist RLS
- `007_realtime_events_and_expiry_cron.sql` — Adds `events` to realtime publication + pg_cron for auto-expiry (every 5 min)
- `008_search_and_bookmarks.sql` — Full-text search (tsvector + GIN on events), `search_events()` function, `saved_events` table with RLS
- `009_gender_and_tags_update.sql` — Gender enum: `woman/man/non-binary` → `female/male`, remove 3-tag limit on profiles
- `010_handle_new_user_trigger.sql` — Auto-create `profiles` row on signup (trigger on `auth.users`), defaults for first_name/dob/gender, backfills missing profiles
- `011_follows_table.sql` — User-to-user follow system with RLS (follower can view/create/delete own follows)

### Realtime
Enabled for: `messages`, `notifications`, `event_participants`, `events`

---

## Routing (`src/App.tsx`)

### Public routes (no auth)
- `/landing` — LandingPage (waitlist-focused, no login/signup)
- `/landing/about`, `/landing/privacy`, `/landing/terms`, `/landing/contact`
- `/demo` — DemoPage
- `/login`, `/signup`

### Protected routes (auth required, MainLayout with BottomNav)
- `/` — HomePage (event feed)
- `/chats` — ChatsPage
- `/my-events` — MyEventsPage
- `/profile` — ProfilePage

### Protected routes (no MainLayout)
- `/event/new` — CreateEventPage
- `/event/:id` — EventDetailPage
- `/event/:id/chat` — ChatRoomPage
- `/event/:id/manage` — ManageParticipantsPage
- `/user/:id` — UserProfilePage
- `/notifications`, `/settings`, `/profile/edit`
- `/saved` — SavedEventsPage (bookmarked events)
- `/explore` — ExplorePage (category browsing with drill-down)

### Admin routes (admin role required)
- `/admin`, `/admin/users`, `/admin/events`, `/admin/reports`, `/admin/categories`

---

## Authentication

1. Login via email/password or magic link (Supabase Auth)
2. Session stored + auto-refreshed
3. Profile fetched from `profiles` table
4. Route protection checks: auth → profile complete → terms accepted → admin role

**DEV_MODE** exists (set to `false`) in:
- `src/contexts/AuthContext.tsx` — mock user/profile
- `src/services/events/eventService.ts` — demo events
- `src/hooks/useUserEngagement.ts` — mock engagement data

**Auth architecture**: Two separate effects to avoid race conditions:
- Effect 1: `onAuthStateChange` listener (synchronous state updates only, no async)
- Effect 2: Watches `user` state, fetches profile when user changes (with cancellation)

---

## Recommendation Algorithm

Located in `src/lib/algorithm.ts` and `src/services/events/recommendationService.ts`.

Scoring: geographic proximity (Haversine), user interests (tags → category mapping), engagement history, gender-based filtering, time preferences.

Fallback cascade: nearby → category → any (never returns empty).

---

## Design System

### Brand Colors (defined in `src/index.css` @theme)
- **Coral**: `#FF6B6B` (primary)
- **Purple**: `#845EF7` (secondary)
- **Blue**: `#5C7CFA`
- **Gradient**: coral → purple (135deg)

### CSS Utility Classes
- `.gradient-primary` — coral→purple gradient background
- `.gradient-secondary` — purple→blue gradient background
- `.gradient-text` — gradient text (background-clip)
- `.gradient-border` — gradient border effect
- `.safe-bottom` / `.safe-top` — iOS safe area insets
- `.scrollbar-hide` / `.scrollbar-thin` — scroll styling
- `.press-effect` — active press scale
- `.animate-shimmer`, `.animate-slide-up`, `.animate-fade-in`

### Brand Assets
- **Logo**: `https://qmctlt61dm3jfh0i.public.blob.vercel-storage.com/brand/logo/Lincc_Main_Horizontal%404x.webp`
- **Favicon files**: In `public/` (favicon.ico, favicon.svg, favicon-96x96.png, apple-touch-icon.png)
- **PWA icons**: `public/web-app-manifest-192x192.png`, `public/web-app-manifest-512x512.png`
- **Manifest**: `public/site.webmanifest`

### Icon System
Categories use **Lucide icon name strings** (e.g., `'Coffee'`, `'Utensils'`), not emoji, mapped via `CategoryIcon` component:
Coffee, Utensils, Dumbbell, Trophy, TreePine, Heart, Film, Gamepad2, Palette, BookOpen, PartyPopper, Dog

---

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/algorithm.ts` | Recommendation algorithm weights |
| `src/data/tagToCategoryMap.ts` | Tag → category mappings |
| `src/data/demoEvents.ts` | Demo event data (fallback only) |
| `src/services/events/recommendationService.ts` | Recommendation service |
| `src/contexts/AuthContext.tsx` | Auth context (two-effect pattern) |
| `src/hooks/usePWA.ts` | PWA install/offline detection hook |
| `vite.config.ts` | Vite + PWA + Workbox config |
| `public/site.webmanifest` | PWA manifest |
| `vercel.json` | SPA rewrites for Vercel |
| `src/services/searchService.ts` | Full-text search + recent searches |
| `src/services/bookmarkService.ts` | Saved events CRUD |
| `src/hooks/useBookmarks.ts` | Bookmark state + optimistic toggling |
| `src/services/blockService.ts` | Block/unblock users |
| `src/services/reportService.ts` | Report users/events with reasons |
| `src/services/followService.ts` | Follow/unfollow + counts |
| `src/components/social/ReportDialog.tsx` | Report dialog (BottomSheet with reason selection) |
| `src/components/pwa/InstallBanner.tsx` | PWA install prompt banner |
| `src/components/pwa/OfflineBanner.tsx` | Offline connection indicator |
| `src/components/pwa/UpdateNotification.tsx` | Service worker update prompt |

---

## Conventions

- Categories use **Lucide icon name strings**, not emoji
- The landing page is **waitlist-only** — no login/signup buttons
- Use `cn()` from `src/lib/utils.ts` for className merging (wraps clsx)
- Service functions return `{ success, error, data }` pattern
- Event capacity: minimum 1, no upper limit
- Bio max: 140 chars, tags: unlimited
- Gender values: `'female'` and `'male'` (DB enum `user_gender`)
- Events auto-expire 2 hours after start_time
- Twitter is referred to as **X** everywhere

## Backend Sync Rule

**Every time frontend code is added or changed, check if the Supabase backend needs updating too.** This includes:

1. **New columns or tables** — If frontend references a field that doesn't exist in the DB, create a migration
2. **RLS policies** — If frontend does new queries/mutations, verify RLS allows them for the correct roles
3. **Realtime subscriptions** — If frontend subscribes to a table via Supabase channels, verify that table is in the `supabase_realtime` publication (`ALTER PUBLICATION supabase_realtime ADD TABLE tablename;`)
4. **Database functions/triggers** — If frontend relies on computed values (e.g., `expires_at`), verify the trigger exists
5. **Storage buckets** — If frontend uploads files, verify the bucket and storage policies exist
6. **Scheduled jobs** — If features depend on periodic tasks (e.g., expiring events), verify the cron/Edge Function is set up

**After creating a migration file**, it must be run against the live Supabase project. Migrations in `supabase/migrations/` are reference files — they don't auto-apply. Run them via:
- Supabase Dashboard → SQL Editor (paste and run)
- Or `supabase db push` if the CLI is linked to the project

**Always check**: Does the migration need to run before the frontend deploy, or can they go together?

---

## What NOT to Do

- Don't add login/signup to the landing page — waitlist only until launch
- Don't use emoji for category icons — use Lucide React components
- Don't reference Lincc as a "friendship app" or "dating app"
- Don't change DEV_MODE flags without explicit instruction
- Don't modify generated Supabase types (`src/types/supabase.ts`) manually
- Don't add frontend real-time subscriptions without verifying the table is in `supabase_realtime`
- Don't add new DB columns in code without creating a corresponding migration file
