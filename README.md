# Lincc

Your local pulse — everything happening around you, in one place. Events, deals, openings, offers — all live, all local. Pre-launch React PWA + landing site.

**Live:** [lincc.live](https://lincc.live) · **Staging:** [lincc-six.vercel.app](https://lincc-six.vercel.app)

See [`CLAUDE.md`](./CLAUDE.md) for the full product + engineering reference and [`TODO.md`](./TODO.md) for the task board.

## Architecture

```mermaid
graph TD
    User([User · Host · Joiner])
    Admin([Admin])

    subgraph Clients["Clients"]
        direction LR
        MainApp["Main PWA<br/>(src/)"]
        Landing["Landing / Waitlist<br/>(landing/)"]
    end

    User --> MainApp
    User --> Landing
    Admin --> MainApp

    subgraph MainAppLayers["Main PWA — layered"]
        direction TB
        Pages["Pages<br/>auth · home · event · chat · profile · admin"]
        Components["UI Components<br/>EventCard · MapView · Avatar · Header · Banners"]
        Hooks["Hooks<br/>useAuth · useEventParticipants · useNotifications · usePWA"]
        Services["Services<br/>eventService · adminService · chatService · placesService"]
        SW["Service Worker<br/>(Workbox)<br/>runtime cache · offline · push"]
        Pages --> Components
        Pages --> Hooks
        Hooks --> Services
        MainApp -.- SW
    end

    MainApp --- MainAppLayers

    subgraph Supabase["Supabase Backend"]
        direction TB
        SB_Auth["Auth<br/>email/password · Google OAuth"]
        SB_DB[("Postgres<br/>profiles · events · event_participants<br/>messages · direct_messages · notifications<br/>businesses · vouchers · reports · categories<br/>RLS on every table")]
        SB_RT["Realtime<br/>messages · participants · events · DMs"]
        SB_Storage["Storage<br/>avatars · event-images"]
        SB_Func["Edge Functions<br/>send-welcome-email"]
        SB_Cron["pg_cron<br/>expire_past_events (5m)"]
        SB_DB --> SB_Cron
        SB_DB -.triggers.-> SB_Func
        SB_DB -.triggers.-> SB_DB
    end

    Services -->|REST / RPC| SB_DB
    Services -->|channels| SB_RT
    Services -->|SDK| SB_Auth
    Services --> SB_Storage
    Services --> SB_Func

    subgraph External["External APIs"]
        direction LR
        Mapbox["Mapbox GL<br/>map tiles · geocoding"]
        Places["Google Places API<br/>venue autocomplete"]
        Sentry["Sentry<br/>errors + session replay"]
    end

    Components -->|tiles / static| Mapbox
    Services -->|autocomplete| Places
    MainApp -->|observe| Sentry

    subgraph Hosting["Hosting"]
        Vercel["Vercel<br/>auto-deploy from main"]
    end

    MainApp -.-> Vercel
    Landing -.-> Vercel
```

### Runtime — joining an event

```mermaid
sequenceDiagram
    participant U as User
    participant UI as EventDetailPage
    participant H as useEventParticipants
    participant DB as Supabase Postgres
    participant T as participants_count_trigger
    participant RT as Realtime

    U->>UI: Tap "Request to join"
    UI->>H: join()
    H->>DB: INSERT event_participants (status=pending)
    DB->>T: AFTER INSERT trigger
    T->>DB: recompute events.participant_count<br/>(SECURITY DEFINER, bypasses RLS)
    DB-->>H: success
    H->>DB: refetch participants list
    DB-->>H: updated data
    H-->>UI: setState → re-render
    DB->>RT: broadcast row change
    RT-->>UI: host & other joiners receive update
```

## Tech Stack

| Layer      | Tech                                                |
| ---------- | --------------------------------------------------- |
| Frontend   | React 19, TypeScript 5.9, Vite 7                    |
| Styling    | Tailwind CSS 4                                      |
| Routing    | React Router 7                                      |
| Backend    | Supabase (Postgres, Auth, Realtime, Storage, Edge)  |
| Maps       | Mapbox GL JS                                        |
| PWA        | vite-plugin-pwa + Workbox (injectManifest)          |
| Errors     | Sentry                                              |
| Hosting    | Vercel                                              |

## Getting Started

```bash
# Main app
npm install
npm run dev            # localhost:5173
npm run build          # tsc + vite build
npm run test:run       # vitest

# Landing site (separate)
cd landing
npm install
npm run dev
```

Create a `.env.local` with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_MAPBOX_TOKEN`, and `VITE_GOOGLE_PLACES_API_KEY`.

## Project Structure

```
src/
├── pages/          # Route-level components (admin, auth, landing, main app)
├── components/     # layout · ui · pwa · admin · features · social
├── hooks/          # useAuth, useEventParticipants, usePWA, useBookmarks, ...
├── services/       # events, chat, admin, notifications, bookmark, search, ...
├── contexts/       # AuthContext, ToastContext, ViewModeContext
├── lib/            # supabase client, algorithm, haptics, utils
├── data/           # categories, tag↔category maps, demo events (fallback)
└── sw.ts           # Workbox service worker (injectManifest)

supabase/
├── migrations/     # 000–042 — reference only; apply via dashboard or CLI
└── email-templates/

landing/            # Separate Vite app for waitlist page
```

See [`CLAUDE.md`](./CLAUDE.md) for the complete reference — tables, routes, RLS, design system, and conventions.
