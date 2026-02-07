# LINCC Project TODO List

Last updated: 2026-01-27

---

## Phase 1: Project Setup & DevOps

> Get the foundation in place before building features

- [ ] **Environment variables** - Set up .env.local, .env.staging, .env.production
- [ ] **Supabase project** - Create Supabase project, get API keys
- [ ] **Configure Supabase client** - Update `src/lib/supabase.ts` with real credentials
- [ ] **CI/CD pipeline** - GitHub Actions for build and lint on PR
- [ ] **Staging environment** - Deploy to Vercel/Netlify staging branch
- [ ] **Error monitoring** - Set up Sentry for error tracking
- [ ] **Analytics setup** - Set up Mixpanel/Amplitude for user analytics

---

## Phase 2: Database Schema & Backend

> Build the data layer - everything depends on this

- [ ] **Create profiles table** - User profiles with all fields from types
- [ ] **Create categories table** - Event categories (seed with CATEGORIES data)
- [ ] **Create events table** - Events with all fields, foreign keys
- [ ] **Create event_participants table** - Track who joined which events
- [ ] **Create messages table** - Event chat messages
- [ ] **Create reports table** - User/event reports
- [ ] **Create blocks table** - User blocks
- [ ] **Create notifications table** - Push notification records
- [ ] **Database indexes** - Add indexes for: events by location, by category, by time, by host
- [ ] **Row Level Security (RLS)** - Configure RLS policies for all tables
- [ ] **Database functions** - Stored procedures for nearby events query, participant counts
- [ ] **Database triggers** - Auto-update timestamps, participant counts
- [ ] **Seed data** - Create seed script for categories and test data

---

## Phase 3: API Integration & Core Services

> Connect frontend to backend

- [ ] **Disable DEV_MODE** - Set DEV_MODE = false in AuthContext.tsx and eventService.ts
- [ ] **Auth flow testing** - Test sign up, sign in, magic link with real Supabase
- [ ] **Profile CRUD** - Create, read, update profile via Supabase
- [ ] **Event fetching** - Test `fetchProductionEvents()` with real data
- [ ] **Event CRUD** - Create, update, delete events via Supabase
- [ ] **Participant management** - Join/leave events, approve/reject join requests
- [ ] **Real engagement tracking** - Replace mock data in useUserEngagement.ts
- [ ] **Real-time subscriptions** - Enable Supabase real-time for live event updates
- [ ] **Error handling** - Add proper error boundaries and retry logic
- [ ] **API response caching** - Cache frequently accessed data

---

## Phase 4: Authentication & User Management

> Secure the app and manage users properly

- [ ] **Custom auth emails** - Design branded Supabase email templates (signup, reset, magic link)
- [ ] **Email verification** - Require email verification for new accounts
- [ ] **Password reset flow** - Implement forgot password functionality
- [ ] **Social login** - Add Google/Apple sign-in options
- [ ] **Profile completion** - Enforce profile completion before using app
- [ ] **Onboarding flow** - Guide new users through interest selection
- [ ] **Account settings** - Update email, password, notification preferences
- [ ] **Account deletion** - Allow users to delete their account (GDPR)
- [ ] **Session management** - Handle token refresh, logout on all devices

---

## Phase 5: Event Features

> Complete the core event functionality

- [ ] **Event creation form** - Complete the CreateEventPage with validation
- [ ] **Event editing** - Allow hosts to edit their events
- [ ] **Event cancellation** - Allow hosts to cancel with notification to participants
- [ ] **Event photos** - Allow uploading event cover photos (Supabase Storage)
- [ ] **Event chat** - Real-time messaging for event participants
- [ ] **Event reminders** - Notify participants before event starts
- [ ] **Recurring events** - Support for weekly/monthly recurring events
- [ ] **Event capacity** - Handle full events, waitlist functionality
- [ ] **Event expiry** - Auto-expire past events, cleanup

---

## Phase 6: Map View

> Location-based discovery

- [ ] **Mapbox setup** - Get API key, install Mapbox GL JS
- [ ] **Basic map render** - Display map centered on user location
- [ ] **Event markers** - Display events as pins on map
- [ ] **Marker clustering** - Group nearby events into clusters
- [ ] **Event preview** - Show event card when tapping marker
- [ ] **User location marker** - Show user's current location
- [ ] **Radius visualization** - Show user's search radius circle on map
- [ ] **Map filters** - Apply same filters as list view
- [ ] **Map/list sync** - Keep both views in sync when filtering

---

## Phase 7: Search & Discovery

> Help users find events

- [ ] **Full-text search** - Search events by title, description, venue
- [ ] **Search suggestions** - Auto-complete for search queries
- [ ] **Recent searches** - Save and display recent search history
- [ ] **Category browsing** - Browse events by category
- [ ] **Trending events** - Show popular events in the area
- [ ] **Saved/bookmarked events** - Allow users to save events for later

---

## Phase 8: Recommendation System Tuning

> Improve the algorithm based on real usage

- [ ] **Test scoring accuracy** - Verify interest/distance/time/engagement scores
- [ ] **Tune algorithm weights** - Adjust SCORE_WEIGHTS based on user feedback
- [ ] **Add more tag mappings** - Expand tagToCategoryMap.ts with more tags
- [ ] **Test fallback cascade** - Verify never-empty behavior in edge cases
- [ ] **A/B testing** - Test different weight configurations
- [ ] **Recommendation analytics** - Track fallback usage, click-through rates
- [ ] **Personalization improvements** - Factor in time-of-day preferences, etc.

---

## Phase 9: Social Features

> Build community and trust

- [ ] **User profiles** - View other users' public profiles
- [ ] **Follow system** - Follow other users to see their events
- [ ] **Event reviews** - Rate and review events after attending
- [ ] **Share events** - Share events via social media or deep link
- [ ] **Block users** - Block problematic users
- [ ] **Report users/events** - Report inappropriate content
- [ ] **Trust score** - Build reputation based on attendance, reviews

---

## Phase 10: User Experience Polish

> Make it delightful

- [ ] **Pull-to-refresh** - Add pull-to-refresh on event list
- [ ] **Infinite scroll** - Load more events as user scrolls
- [ ] **Skeleton loaders** - Add loading states for all data fetching
- [ ] **Empty states** - Design empty states for no results, no events, etc.
- [ ] **Error states** - User-friendly error messages with retry
- [ ] **Haptic feedback** - Add haptics for key interactions (mobile)
- [ ] **Animations** - Smooth transitions and micro-interactions
- [ ] **Dark mode** - Support system dark mode preference
- [ ] **Accessibility** - Screen reader support, keyboard navigation

---

## Phase 11: Push Notifications

> Keep users engaged

- [ ] **Service worker setup** - Configure for push notifications
- [ ] **Notification permissions** - Request permission flow
- [ ] **Event reminders** - 1 hour before, 15 min before
- [ ] **Join request notifications** - Notify hosts of new requests
- [ ] **Request approved/declined** - Notify participants
- [ ] **New message notifications** - Event chat messages
- [ ] **Event cancelled** - Notify all participants
- [ ] **Notification preferences** - Let users control what they receive

---

## Phase 12: Admin Dashboard

> Moderation and management tools

### Dashboard & Analytics
- [ ] **Dashboard overview** - Stats: total users, events, active events, reports
- [ ] **Analytics charts** - User growth, event creation, engagement trends
- [ ] **Real-time updates** - Live updates when new reports/events come in

### User Management
- [ ] **User list** - List all users with search, filter, sort
- [ ] **User details** - View full profile, event history, reports
- [ ] **User actions** - Suspend, ban, warn, delete users
- [ ] **Bulk user actions** - Select multiple users for batch operations

### Event Management
- [ ] **Event list** - List all events with filters (status, category, date)
- [ ] **Event moderation** - Approve, reject, feature, or remove events
- [ ] **Event analytics** - Views, joins, completion rate per event

### Reports & Moderation
- [ ] **Reports queue** - View and action user/event reports
- [ ] **Report workflow** - Mark as reviewed, dismissed, actioned
- [ ] **Content moderation** - Flag inappropriate titles, descriptions, images

### Configuration
- [ ] **Category management** - Add, edit, reorder, disable categories
- [ ] **Announcement system** - Send announcements to all users
- [ ] **Feature flags** - Toggle features on/off

### Admin System
- [ ] **Admin roles** - Super admin, moderator, support permissions
- [ ] **Audit log** - Track all admin actions with timestamps
- [ ] **Export data** - Export users, events, reports to CSV
- [ ] **Mobile admin** - Responsive interface for mobile moderation

---

## Phase 13: Testing

> Ensure quality and prevent regressions

- [ ] **Unit tests setup** - Configure Vitest
- [ ] **Algorithm tests** - Test all scoring functions in algorithm.ts
- [ ] **Utility tests** - Test utils.ts functions
- [ ] **Hook tests** - Test custom hooks with React Testing Library
- [ ] **Service tests** - Test API services with mocked Supabase
- [ ] **Component tests** - Test key UI components
- [ ] **E2E setup** - Configure Playwright or Cypress
- [ ] **Auth flow E2E** - Test signup, login, logout
- [ ] **Event flow E2E** - Test create, join, leave event
- [ ] **Visual regression** - Screenshot testing for UI consistency

---

## Phase 14: Performance & Optimization

> Make it fast

- [ ] **Code splitting** - Lazy load routes with React.lazy()
- [ ] **Component lazy loading** - Lazy load heavy components (map, etc.)
- [ ] **Image optimization** - Compress images, use WebP, lazy load
- [ ] **Bundle analysis** - Analyze and reduce bundle size (currently 534KB)
- [ ] **Caching strategy** - Service worker caching for offline support
- [ ] **Database query optimization** - Optimize slow queries
- [ ] **Lighthouse audit** - Achieve 90+ scores across all metrics

---

## Phase 15: Documentation

> Make it maintainable

- [ ] **README update** - Setup instructions, environment variables
- [ ] **API documentation** - Document all Supabase tables and functions
- [ ] **Component Storybook** - Document UI components
- [ ] **Architecture docs** - Document system architecture decisions
- [ ] **Contributing guide** - Guide for new contributors
- [ ] **Deployment docs** - How to deploy to staging/production

---

## Phase 16: Production Launch

> Ship it!

- [ ] **Production Supabase** - Set up production database
- [ ] **Production deployment** - Deploy to production environment
- [ ] **Domain setup** - Configure custom domain, SSL
- [ ] **CDN configuration** - Set up CDN for static assets
- [ ] **Monitoring dashboards** - Set up uptime monitoring
- [ ] **Backup strategy** - Database backup schedule
- [ ] **Load testing** - Test with simulated traffic
- [ ] **Security audit** - Review for vulnerabilities
- [ ] **App store prep** - PWA store listings (if applicable)

---

## Phase 17: Future Ideas

> Nice to have, post-launch

- [ ] **AI event descriptions** - Generate event descriptions with AI
- [ ] **Smart scheduling** - Suggest optimal times based on user availability
- [ ] **Group events** - Events for friend groups
- [ ] **Event series** - Multi-part events (workshop series)
- [ ] **Venue partnerships** - Integration with venues for booking
- [ ] **Premium features** - Subscription for advanced features
- [ ] **Event templates** - Save and reuse event configurations
- [ ] **Calendar integration** - Sync with Google/Apple Calendar
- [ ] **Weather integration** - Show weather for outdoor events

---

## Backlog

> Items to address when time permits

- [ ] **Create style sheet document** - Document the design system (colors, gradients, typography, spacing, components) for consistent styling across the app. Work with designer to finalize.
- [x] **Update logo references** - ~~Replace lincc-logo.webp across app once final asset is ready~~ Done — using Vercel blob URL
- [ ] **Supabase: spatial_ref_sys RLS** - PostGIS system table can't have RLS enabled (owned by supabase_admin). Known platform limitation — contact Supabase support or ignore.
- [ ] **Supabase: PostGIS in public schema** - Linter warns about postgis extension in public schema. Moving it risks breaking geo queries. Safe to ignore.
- [ ] **Supabase: Enable leaked password protection** - Dashboard → Authentication → Attack Protection → Enable leaked password protection (HaveIBeenPwned check)
- [ ] **Google Places API integration** - Wire up VITE_GOOGLE_PLACES_API_KEY for venue search/autocomplete in event creation
- [ ] **Mapbox improvements** - Improve map UX: clustering, event preview on marker tap, user location marker, radius circle

---

## Bugs & Issues

> Track bugs as they're discovered

- [ ] (Add bugs here)

---

## Notes

### Current State
- DEV_MODE is **OFF** in all files — app uses real Supabase data
- 32 demo events loaded in Supabase (London locations)
- Mapbox token configured
- Sentry configured
- Owner account: ryanlindie@gmail.com

### Key Files
- Algorithm weights: `src/lib/algorithm.ts`
- Tag mappings: `src/data/tagToCategoryMap.ts`
- Demo events: `src/data/demoEvents.ts` (fallback only)
- Recommendation service: `src/services/events/recommendationService.ts`

### Dependencies Needed
- Google Places API key (for venue autocomplete)
- Analytics SDK (Mixpanel/Amplitude)
