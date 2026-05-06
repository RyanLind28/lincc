# Lincc

**Everything happening around you, in one place.**

Lincc is a local events and discovery platform that surfaces what's happening around you in real time — events, deals, openings, and offers. Personal users discover and host meetups; businesses promote themselves with verified profiles, recurring events, vouchers and (later) ticket sales. Your local pulse.

- **Live**: [lincc.live](https://lincc.live)
- **Status**: pre-launch / demo-ready
- **PRD**: `PRD/Lincc PRD V1.rtf`
- **Tasks & changelog**: [`TODO.md`](TODO.md)
- **Project guide for AI agents**: [`CLAUDE.md`](CLAUDE.md)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript 5.9 |
| Build | Vite 7, vite-plugin-pwa, Workbox |
| Styling | Tailwind CSS 4 (utility-first, runtime CSS-var theme) |
| State / Data | Supabase JS (Auth, DB, Realtime, Storage, Edge Functions) |
| Maps | Mapbox GL JS |
| Venues | Google Places (New) JS SDK |
| Image cropping | react-easy-crop |
| Errors | Sentry |
| Analytics | Google Analytics 4 (consent-gated) |
| Hosting | Vercel (auto-deploy from `main`) |

---

## High-level architecture

```mermaid
graph TB
    subgraph Browser
        PWA[React PWA]
        SW[Service Worker]
    end

    subgraph Supabase
        Auth[Auth]
        DB[(PostgreSQL + RLS)]
        Realtime[Realtime channels]
        Storage[Storage buckets]
        Edge[Edge Functions]
        Cron[pg_cron]
    end

    subgraph External
        Mapbox[Mapbox GL]
        Places[Google Places]
        Resend[Resend SMTP]
        WebPush[Web Push]
        GA[Google Analytics 4]
    end

    PWA -->|email / OAuth| Auth
    PWA -->|select / RPC| DB
    PWA -->|chat, notifications| Realtime
    PWA -->|avatars, covers, docs| Storage
    PWA -->|map tiles| Mapbox
    PWA -->|venue search| Places
    PWA -->|consented page views| GA
    PWA <-->|push messages| SW
    SW -->|push subscription| WebPush

    Edge -->|send-welcome-email| Resend
    Edge -->|send-waitlist-email| Resend
    Edge -->|send-push-notification| WebPush
    Cron -->|expire_past_events every 5m| DB
    DB -->|triggers| Realtime
```

---

## Account & business flow

Lincc treats Personal and Business as distinct account types chosen at signup. Businesses go through admin approval and (optional) document verification to earn a tick.

```mermaid
flowchart TD
    Start([Sign up]) -->|chooser| ChoosePersonal{Personal}
    Start -->|chooser| ChooseBusiness{Business}

    ChoosePersonal --> PersonalConfirm[Verify email]
    PersonalConfirm --> Onboarding[Onboarding<br/>name, DOB, gender, tags]
    Onboarding --> Home[Home / Map / Discovery]

    ChooseBusiness --> BusinessConfirm[Verify email]
    BusinessConfirm --> Pending[Status: pending_approval<br/>Soft-gate banner across app]
    Pending --> Verify[Upload verification docs<br/>selfie + ID + selfie with ID + registration]
    Pending --> EditProfile[Build business profile<br/>logo, hours, locations, socials]
    Verify --> AdminQueue
    EditProfile --> AdminQueue
    AdminQueue[Admin: BusinessApplicationsPage] --> Decision{Review}
    Decision -->|Approve| Approved[Status: approved<br/>+ verified tick if docs OK]
    Decision -->|Reject| Rejected[Status: rejected<br/>resubmittable]
    Approved --> Publish[Can publish events<br/>+ vouchers]
```

---

## App flow (Personal user)

```mermaid
flowchart TD
    Login[Login / Magic link] --> Home[Home Feed / Map]
    Home --> CreateEvent[Create Event]
    Home --> EventDetail[Event Detail]
    Home --> Vouchers[Vouchers grid]
    Home --> Explore[Explore categories]
    Home --> Profile[My Profile]

    EventDetail --> Request{Join mode}
    Request -->|auto| Joined[Approved instantly]
    Request -->|request| Pending[Pending → host approves]
    Pending --> Joined
    Joined --> Chat[Event chat]
    Joined --> Reviews[Post-event review prompt<br/>rate host + event]

    CreateEvent --> Live[Event published]
    Live --> Chat

    Profile --> EditProfile[Edit profile + crop avatar]
    Profile --> InstallApp[Install Lincc PWA]
    Profile --> StatsAndTabs[Stats + Hosting / Joined / Saved tabs]
```

---

## Reporting & moderation

Anyone can report users, events, reviews, or chat messages. Reports flow into the admin queue with full context, and admins have a real action toolkit — not just a "mark resolved" button.

```mermaid
flowchart LR
    subgraph Reporters
        U1[Guest reports message]
        U2[Host reports guest]
        U3[Anyone reports event]
        U4[Reviewer disputes review]
    end

    U1 --> R[(reports table)]
    U2 --> R
    U3 --> R
    U4 --> R

    R --> Admin[Admin Reports queue<br/>reason filter + chat / review context]
    Admin --> Act{Action}

    Act -->|Warn| Warn[notification + audit log]
    Act -->|Suspend| Suspend[profiles.status = suspended<br/>+ duration]
    Act -->|Ban| Ban[profiles.status = banned]
    Act -->|Delete message| DelMsg[remove from messages / direct_messages]
    Act -->|Remove from event| RemPart[participant status = rejected]
    Act -->|Cancel event| CancelEvt[events.status = cancelled<br/>+ flag]
    Act -->|Dismiss| Dismiss[no action]

    Warn --> Log[(admin_audit_log)]
    Suspend --> Log
    Ban --> Log
    DelMsg --> Log
    RemPart --> Log
    CancelEvt --> Log
```

---

## Bidirectional review system

Both directions of the review relationship are first-class. Guests rate the host **and** the event; hosts rate each guest. Either party can dispute a review which lands in admin moderation.

```mermaid
sequenceDiagram
    autonumber
    actor Guest
    actor Host
    actor Admin
    participant DB as Postgres

    Note over DB: Event expires (cron)
    DB-->>Guest: review_prompt notification
    DB-->>Host: review_prompt notification

    Guest->>DB: host_reviews INSERT (host★ + event★ + comment)
    Host->>DB: guest_reviews INSERT (guest★ + comment)
    Host->>DB: host_reviews UPDATE (host_reply, once)

    alt Disputed
        Guest->>DB: host_reviews UPDATE (is_disputed=true)
        DB->>DB: trigger inserts row in reports
        Admin->>DB: resolves report
    end
```

---

## Database schema (high-level)

```mermaid
erDiagram
    profiles ||--o{ events : "hosts (host_id)"
    profiles ||--o{ event_participants : "joins (user_id)"
    profiles ||--o{ messages : "sends (sender_id)"
    profiles ||--o{ direct_messages : "sends (sender_id)"
    profiles ||--o{ notifications : receives
    profiles ||--o{ saved_events : bookmarks
    profiles ||--o{ follows : "follower / followed"
    profiles ||--o{ blocks : "blocker / blocked"
    profiles ||--o| businesses : owns
    profiles ||--o{ host_reviews : "guest writes"
    profiles ||--o{ guest_reviews : "host writes"
    profiles ||--o{ reports : "reporter / reported"
    profiles ||--o{ admin_audit_log : "admin acts"

    businesses ||--o{ business_locations : has
    businesses ||--o{ vouchers : offers
    businesses ||--o{ events : "hosts (business_id)"
    businesses ||--|| business_verifications : verifies

    events ||--o{ event_participants : has
    events ||--o{ messages : contains
    events ||--o{ host_reviews : about
    events ||--o{ guest_reviews : about
    events }o--|| categories : "belongs to"

    categories ||--o{ categories : "parent / sub"

    conversations ||--o{ direct_messages : contains
    profiles ||--o{ conversations : participates

    vouchers ||--o{ voucher_redemptions : has
    profiles ||--o{ voucher_redemptions : redeems

    profiles {
        uuid id PK
        text email
        text first_name
        date dob
        text gender
        text[] tags
        text avatar_url
        text account_type "personal | business"
        text role "user | admin"
        text status "active | suspended | banned"
        timestamptz suspended_until
    }

    businesses {
        uuid id PK
        uuid owner_id FK
        text name
        text slug UK
        text logo_url
        text category
        text address
        jsonb opening_hours
        jsonb social_links
        text status "pending_approval | approved | rejected | suspended | inactive | archived"
        bool verified
        timestamptz verified_at
        text rejection_reason
    }

    business_verifications {
        uuid id PK
        uuid business_id FK
        text operator_selfie_path
        text id_document_path
        text selfie_with_id_path
        text registration_doc_path
        text status "draft | submitted | in_review | approved | rejected"
        text rejection_notes
    }

    business_locations {
        uuid id PK
        uuid business_id FK
        text name
        text address
        float8 lat
        float8 lng
        bool is_primary
    }

    events {
        uuid id PK
        uuid host_id FK
        uuid business_id FK
        uuid category_id FK
        text title
        text description
        text venue_name
        text venue_address
        float8 venue_lat
        float8 venue_lng
        timestamptz start_time
        timestamptz expires_at
        int capacity
        text join_mode "request | auto"
        text audience "everyone | women | men"
        text status
        text cover_image_url
        text recurrence_rule
    }

    categories {
        uuid id PK
        text name
        text icon
        text value
        uuid parent_id FK "self-ref for subcategories"
        int sort_order
        bool is_active
    }

    host_reviews {
        uuid id PK
        uuid event_id FK
        uuid guest_id FK
        int host_rating
        int event_rating
        text comment
        text host_reply
        bool is_disputed
        text dispute_reason
    }

    guest_reviews {
        uuid id PK
        uuid event_id FK
        uuid host_id FK
        uuid guest_id FK
        int guest_rating
        text comment
        text guest_reply
        bool is_disputed
    }

    vouchers {
        uuid id PK
        uuid business_id FK
        text title
        text discount_text
        numeric original_price
        numeric discounted_price
        int redemption_limit
        int redemption_count
        timestamptz expires_at
    }

    reports {
        uuid id PK
        uuid reporter_id FK
        uuid reported_user_id FK
        uuid event_id FK
        uuid host_review_id FK
        uuid guest_review_id FK
        uuid message_id FK
        uuid dm_message_id FK
        text reason
        text status "pending | reviewed | dismissed | actioned"
        text admin_notes
    }
```

---

## Project structure

```
src/
├── components/
│   ├── layout/         MainLayout, Header, BottomNav, SideNav, ScrollToTop, ProtectedRoute
│   ├── ui/             Button, Card, Modal, BottomSheet, Avatar, AvatarCropper, Toggle, Skeleton, MapView…
│   ├── features/       EventReviewsSection, HostReviewsList, GuestReviewsList, ReviewPromptModal, RatingBadges
│   ├── business/       VerifiedTick, BusinessCard, BusinessHoursDisplay, BusinessApprovalBanner
│   ├── pwa/            InstallBanner, OfflineBanner, UpdateNotification, InstallAppCard
│   ├── social/         ReportDialog, ReportMessageDialog, FollowButton
│   ├── admin/          ActivityChart, EngagementChart, ActivityFeed, DateRangePicker, TopList
│   ├── AnalyticsTracker.tsx
│   └── CookieConsentBanner.tsx
├── contexts/           AuthContext (profile + business), ToastContext, ViewModeContext
├── hooks/              useRecommendedEvents, useEventChat, useDMChat, usePWA, useDarkMode,
│                       useAnalytics, useNotifications, usePendingReviews, useUserLocation, …
├── lib/                supabase, utils, algorithm, analytics, consent, imageCompression, haptics, abTest, cache
├── pages/
│   ├── auth/           LoginPage, SignupPage, TermsPage, PendingApprovalPage
│   ├── onboarding/     OnboardingPage
│   ├── admin/          DashboardPage, UsersPage, EventsPage, ReportsPage, BusinessesPage,
│                       BusinessApplicationsPage, BusinessDetailPage, CategoriesPage, AnnouncementsPage,
│                       FeatureFlagsPage, AuditLogPage, UserDetailPage
│   ├── landing/        AboutPage, PrivacyPage, TermsPage, ContactPage
│   └── *.tsx           HomePage, EventDetailPage, CreateEventPage, EditProfilePage,
│                       BusinessPage, BusinessDashboardPage, BusinessVerifyPage, EditBusinessProfilePage,
│                       VouchersPage, VoucherDetailPage, CreateVoucherPage,
│                       ChatsPage, ChatRoomPage, DMChatRoomPage,
│                       ProfilePage, UserProfilePage, FollowListPage,
│                       SavedEventsPage, ExplorePage, NotificationsPage,
│                       BusinessDirectoryPage, SearchPeoplePage, ManageParticipantsPage,
│                       FeedbackPage, SettingsPage
├── services/
│   ├── events/         eventService, recommendationService, participantService, transformers
│   ├── chat/           chatService, dmService
│   ├── reviews/        hostReviewService, guestReviewService, pendingReviewsService
│   ├── adminService.ts moderationService.ts businessService.ts voucherService.ts
│   ├── verificationService.ts notificationService.ts pushService.ts
│   ├── searchService.ts bookmarkService.ts blockService.ts reportService.ts followService.ts
│   └── placesService.ts
├── data/               categories.ts (with subcategories), demoEvents.ts, tagToCategoryMap.ts
└── types/              index.ts (domain types), supabase.ts (generated)

landing/                Separate marketing/waitlist site (own Vite build)
supabase/
├── migrations/         001 → 049 (numbered, applied in order)
├── functions/          send-welcome-email, send-waitlist-email, send-push-notification
└── email-templates/    All 13 auth/security templates + waitlist + welcome
```

---

## Key features

### Personal
- Discover events on a Mapbox map or list, filtered by radius (1–20km), date, category, audience
- Create an event in under 30 seconds with Google Places venue autocomplete
- Real-time event chat (Supabase Realtime), DMs to friends and hosts, voucher / event share cards
- 5-star bidirectional reviews with optional reply and dispute flow
- Bookmarks, follows, blocks, reports
- PWA with offline shell, install prompts, push notifications

### Business
- Verified business accounts with admin approval flow + document verification → blue tick
- Business dashboard: events, vouchers, locations, hours, social links, recent activity
- Public business profile (cover hero, stats, reviews, deals)
- Host-attributed events under business identity
- Vouchers with redemption codes, scratch-card UI, swipe-to-redeem, stock progress
- Multi-location chains (`business_locations`)

### Admin
- Dashboard with action-needed counters per management area
- Pending business applications + verification doc review (signed URLs)
- Reports queue with chat / review context + moderation toolkit (warn / suspend / ban / delete message / remove from event / cancel event)
- Categories with subcategories (parent → child cascade)
- Announcements, feature flags, audit log
- All admin actions written to `admin_audit_log` and surface user notifications

### Trust & safety
- HEIC detection + magic-byte image validation (authoritative over MIME — handles Samsung's mis-labelled `image/jpg` photos), 25MB input cap, typed `FileReadError` for cloud-only photo placeholders (Samsung Cloud / Google Photos) with a tailored toast directing the user to download the photo to device first
- Avatar cropper (round + square crops via `react-easy-crop`)
- Soft-gate for unapproved businesses (banner across app, publishing blocked at DB trigger level)
- Cookie consent gate before Google Analytics fires
- Full-screen non-dismissable update prompt when a new service worker is waiting

---

## Getting started

```bash
npm install
npm run dev
```

Create a `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=ey…
VITE_MAPBOX_TOKEN=pk.ey…
VITE_GOOGLE_PLACES_API_KEY=AIza…
VITE_VAPID_PUBLIC_KEY=BAu2…
VITE_SENTRY_DSN=https://…@sentry.io/…
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX   # optional — analytics no-ops without it
VITE_APP_URL=http://localhost:5173
```

The app boots at `http://localhost:5173`. Database migrations live in `supabase/migrations/` — they're reference files and don't auto-apply; run them via the Supabase Dashboard SQL editor or `supabase db push`.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | TypeScript check + production build |
| `npx tsc --noEmit` | Type-check only (no emit) |
| `npm run test` | Vitest in watch mode |
| `npm run test:run` | Vitest single run (42 tests) |
| `npm run test:e2e` | Playwright E2E tests |

---

## Deployment

- **Hosting** — Vercel, auto-deploys on push to `main`. SPA rewrites in `vercel.json`
- **Database** — Supabase project `srrubyupwiiqnehshszd` (production-ready)
- **Email** — Custom SMTP via Resend (`noreply@system.lincc.live`); 15 branded templates
- **Push** — Web Push via VAPID + custom service worker; Edge Function `send-push-notification`
- **PWA** — vite-plugin-pwa with `autoUpdate`, runtime caching for fonts, Mapbox, Supabase
- **Cron** — `pg_cron` runs `expire_past_events()` every 5 minutes; expiry trigger fires `review_prompt` notifications

---

## Migrations cheat sheet

| # | Purpose |
|---|---------|
| 001 | Initial schema, RLS, triggers, indexes |
| 010 | `handle_new_user` trigger |
| 016 | Vouchers |
| 017 | Direct messages, conversations |
| 020 | Business profiles |
| 028 | Reviews + admin role tiers |
| 033 | `businesses` table (separate entity) |
| 034 | `business_locations` (chain support) |
| 035 | `events.business_id` |
| 042 | participant count trigger fix |
| 043 | Host reviews + dispute trigger |
| 044 | Bidirectional reviews (`host_reviews` + `guest_reviews`) |
| 045 | Account types + business approval workflow |
| 047 | Business verifications + storage bucket |
| 049 | Chat reports (`message_id`, `dm_message_id` on reports) |
| 047_fix | Restore account_type + pending business creation in `handle_new_user` (regression fix) |

Full list under `supabase/migrations/`.

---

## License

All rights reserved. Private repository.
