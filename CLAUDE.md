# CLAUDE.md - Lincc Project Context

## What is Lincc?

Lincc is a **local events and discovery platform** — everything happening around you, in one place. Events, deals, openings, offers — all live, all local. It is NOT a friendship or dating app. It helps people improve their social life and keep up with what's happening in real time. Think of it as your "local pulse".

**Target users**: Both regular people (creating events like coffee meetups, co-working, sports) and businesses (promoting deals, openings, offers, limited-time promotions).

**Current status**: Pre-launch. The app is in development with a waitlist landing page live. DEV_MODE is enabled in several files for local testing.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript 5.9 |
| Build | Vite 7 |
| Routing | React Router 7 |
| Styling | Tailwind CSS 4 (via `@tailwindcss/vite`, no separate config file) |
| Icons | Lucide React |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| Maps | Mapbox GL |
| Errors | Sentry |
| PWA | vite-plugin-pwa + Workbox |

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

## Supabase Access

- **Project ref**: `srrubyupwiiqnehshszd`
- **Project URL**: `https://srrubyupwiiqnehshszd.supabase.co`
- **Management API token**: stored in `.env.local` as `SUPABASE_ACCESS_TOKEN` (expires 2026-03-09)
- **Anon key**: stored in `.env.local` as `VITE_SUPABASE_ANON_KEY`
- **Owner account**: `ryanlindie@gmail.com` (profile ID: `0b39d573-f7da-41d7-8db8-49025ea326f1`)

To run SQL against the database:
```bash
curl -s -X POST "https://api.supabase.com/v1/projects/srrubyupwiiqnehshszd/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT 1;"}'
```

## Key Commands

```bash
npm run dev          # Start main app dev server (localhost:5173)
npm run build        # TypeScript check + Vite build
npx tsc --noEmit     # Type-check without building
cd landing && npm run dev  # Start landing site separately
```

## Design System / Styling

### Brand Colors (defined in `src/index.css` @theme)
- **Coral**: `#FF6B6B` (primary brand color)
- **Purple**: `#845EF7` (secondary)
- **Blue**: `#5C7CFA`
- Gradient: coral → purple (135deg)

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
Categories use **Lucide icon names** mapped via `CategoryIcon` component:
Coffee, Utensils, Dumbbell, Trophy, TreePine, Heart, Film, Gamepad2, Palette, BookOpen, PartyPopper, Dog

## Routing (src/App.tsx)

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

### Admin routes (admin role required)
- `/admin`, `/admin/users`, `/admin/events`, `/admin/reports`, `/admin/categories`

## Authentication Flow

1. Login via email/password or magic link (Supabase Auth)
2. Session stored + auto-refreshed
3. Profile fetched from `profiles` table
4. Route protection checks: auth → profile complete → terms accepted → admin role

**DEV_MODE** is currently enabled in:
- `src/contexts/AuthContext.tsx` — mock user/profile
- `src/services/events/eventService.ts` — demo events
- `src/hooks/useUserEngagement.ts` — mock engagement data

## Database (Supabase)

### Key tables
- `profiles` — extends auth.users (name, gender, bio, tags, avatar, settings)
- `categories` — event categories (21 defaults with Lucide icon names)
- `events` — events with location, capacity, join_mode, audience, status
- `event_participants` — join requests (pending/approved/rejected/left)
- `messages` — event chat messages (real-time enabled)
- `notifications` — user notifications (real-time enabled)
- `reports` — user/event reports for moderation
- `blocks` — user blocks

### Migrations in `supabase/migrations/`
- `001_initial_schema.sql` — full schema with RLS, triggers, indexes
- `002_enhancements.sql` — additional enhancements
- `003_fixes.sql` — bug fixes
- `004_example_events.sql` — seed data

### Real-time subscriptions
Enabled for: messages, notifications, event_participants

## Recommendation Algorithm

Located in `src/lib/algorithm.ts` and `src/services/events/recommendationService.ts`.

Scoring considers:
- Geographic proximity (Haversine distance)
- User interests (profile tags → category mapping)
- Engagement history by category
- Gender-based filtering
- Time preferences

Fallback cascade: nearby → category → any (never returns empty)

## Important Conventions

- Categories use **Lucide icon name strings** (e.g., `'Coffee'`, `'Utensils'`), not emoji
- The landing page is **waitlist-only** — no login/signup buttons
- Use `cn()` from `src/lib/utils.ts` for className merging (wraps clsx)
- Service functions typically return `{ success, error, data }` pattern
- Event capacity constraint: 1-3 people (small group focus)
- Bio max: 140 chars, tags max: 3
- Events auto-expire 2 hours after start_time
- Twitter is referred to as **X** everywhere

## What NOT to Do

- Don't add login/signup to the landing page — it's waitlist only until launch
- Don't use emoji for category icons — use Lucide React components
- Don't reference Lincc as a "friendship app" or "dating app" — it's a local discovery platform
- Don't change DEV_MODE flags without explicit instruction
- Don't modify generated Supabase types (`src/types/supabase.ts`) manually
