# Lincc

**Everything happening around you, in one place.**

Lincc is a local events and discovery platform that surfaces what's happening around you in real time — events, deals, openings, and offers. Your local pulse.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript 5.9 |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 |
| Backend | Supabase (Auth, DB, Realtime, Storage) |
| Maps | Mapbox GL JS |
| Venues | Google Places API |
| Hosting | Vercel |
| PWA | vite-plugin-pwa + Workbox |

---

## Architecture

```mermaid
graph LR
    subgraph Client
        PWA[React PWA]
    end

    subgraph Supabase
        Auth[Auth]
        DB[(PostgreSQL)]
        Realtime[Realtime]
        Storage[Storage]
        Edge[Edge Functions]
    end

    PWA --> Auth
    PWA --> DB
    PWA --> Realtime
    PWA --> Storage
    PWA --> Mapbox[Mapbox GL]
    PWA --> Places[Google Places]
    Edge --> Push[Push Notifications]
    Edge --> Email[Emails]
    DB --> Cron[pg_cron]
```

---

## App Flow

```mermaid
flowchart TD
    Landing[Landing Page] --> Signup
    Signup --> Onboarding[Profile Onboarding]
    Onboarding --> Home[Home Feed / Map]

    Home --> Create[Create Event]
    Home --> Browse[Browse & Join]
    Home --> Chats[Chats]
    Home --> Profile[Profile]

    Browse --> Request[Join Request]
    Request --> Approved{Approved?}
    Approved -->|Yes| ChatRoom[Chat Room]
    Approved -->|No| Home

    Create --> Live[Event Live on Map]
    Live --> ChatRoom
```

---

## Database Schema

```mermaid
erDiagram
    profiles ||--o{ events : hosts
    profiles ||--o{ event_participants : joins
    profiles ||--o{ messages : sends
    profiles ||--o{ notifications : receives
    profiles ||--o{ direct_messages : sends
    profiles ||--o{ vouchers : creates

    events ||--o{ event_participants : has
    events ||--o{ messages : contains
    events }o--|| categories : belongs_to
    events ||--o{ event_reviews : has

    conversations ||--o{ direct_messages : contains
    profiles ||--o{ conversations : participates

    vouchers ||--o{ voucher_redemptions : has
    profiles ||--o{ voucher_redemptions : redeems

    profiles {
        uuid id PK
        text first_name
        text gender
        text[] tags
        text bio
        text avatar_url
    }

    events {
        uuid id PK
        uuid host_id FK
        uuid category_id FK
        text title
        point location
        timestamp start_time
        int capacity
        text join_mode
        text audience
    }

    event_participants {
        uuid event_id FK
        uuid user_id FK
        text status
    }

    messages {
        uuid id PK
        uuid event_id FK
        uuid sender_id FK
        text content
    }

    categories {
        uuid id PK
        text name
        text icon
    }

    vouchers {
        uuid id PK
        uuid business_id FK
        text title
        numeric price
        text redemption_code
    }
```

---

## Project Structure

```
src/
├── components/
│   ├── layout/         # MainLayout, BottomNav, Header
│   ├── ui/             # Button, Card, Input, MapView, Skeleton
│   ├── features/       # Feature-specific components
│   ├── pwa/            # InstallBanner, OfflineBanner
│   └── admin/          # Admin dashboard components
├── contexts/           # AuthContext, ToastContext, ViewModeContext
├── hooks/              # useRecommendedEvents, useEventChat, usePWA, etc.
├── lib/                # supabase.ts, utils.ts, algorithm.ts
├── pages/              # All route pages (auth, admin, landing)
├── services/           # events/, chat/, admin, push, vouchers
├── data/               # categories, demo data, tag mappings
└── types/              # Domain types, Supabase generated types

landing/                # Separate marketing/waitlist site
supabase/migrations/    # Database migrations (reference)
```

---

## Getting Started

```bash
npm install
npm run dev
```

Create a `.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_MAPBOX_TOKEN=your_mapbox_token
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (localhost:5173) |
| `npm run build` | TypeScript check + production build |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Single test run |
| `npm run test:e2e` | Playwright E2E tests |

---

## Deployment

- **Hosting** — Vercel with auto-deploy from `main`
- **PWA** — Full offline support, install prompts, runtime caching
- **Realtime** — Supabase channels for chat and notifications
- **Cron** — `pg_cron` auto-expires events 2 hours after start

---

## License

All rights reserved. Private repository.
