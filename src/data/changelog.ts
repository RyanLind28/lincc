// User-facing changelog. Update this on every release alongside the version
// bump in package.json and SettingsPage. Keep entries short and plain
// English — these are read by users, not engineers.

export type ChangeKind = 'added' | 'fixed' | 'changed';

export interface ChangelogEntry {
  version: string;
  /** ISO date (YYYY-MM-DD) the version shipped. */
  date: string;
  /** Optional one-line summary shown under the version heading. */
  summary?: string;
  changes: { kind: ChangeKind; text: string }[];
}

// Most recent first.
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.15.7',
    date: '2026-06-15',
    summary: 'Sign-up emails are friendlier with strict spam filters.',
    changes: [
      { kind: 'fixed', text: 'Confirmation and password-reset emails are less likely to land in junk on Outlook and other strict providers — the verify link now opens on app.lincc.live to match the sender domain.' },
    ],
  },
  {
    version: '0.15.6',
    date: '2026-06-12',
    summary: 'The full Lincc story, right back to day one.',
    changes: [
      { kind: 'added', text: 'This changelog now covers every release since the very first build in January, so you can see how far Lincc has come.' },
      { kind: 'changed', text: 'Tidied up release dates so the timeline reads in the right order.' },
    ],
  },
  {
    version: '0.15.5',
    date: '2026-06-11',
    summary: 'Venue search now follows your real location.',
    changes: [
      { kind: 'fixed', text: 'Fixed venue search showing far-away places (like US results for a UK search). It now works out your country reliably instead of guessing from your browser language.' },
      { kind: 'changed', text: 'Venue search uses your live GPS first and falls back to your location automatically, so results stay local even before you grant location access.' },
    ],
  },
  {
    version: '0.15.4',
    date: '2026-06-09',
    summary: 'Smarter venue search and notification deletes that stick.',
    changes: [
      { kind: 'fixed', text: 'Venue search now uses your country instead of defaulting to the UK when GPS is off, so people in Bahrain see Bahrain results.' },
      { kind: 'fixed', text: 'Deleted notifications stay deleted — they no longer reappear after refreshing the page.' },
      { kind: 'changed', text: 'Tightened the venue search radius so nearby places rank higher than globally popular ones.' },
    ],
  },
  {
    version: '0.15.3',
    date: '2026-06-06',
    summary: 'Notifications, reviews, and chat polish.',
    changes: [
      { kind: 'added', text: 'New Reviews page that opens straight from the rating notification, with a clear "all caught up" view when there\'s nothing to do.' },
      { kind: 'added', text: 'Red dot on the Chats tab when you have new messages, clears as soon as you open the chats list or a thread.' },
      { kind: 'added', text: 'Stat cards on the business dashboard now tap-through to the matching tab and scroll it into view.' },
      { kind: 'added', text: 'If neither side rates within 72 hours, we auto-fill a positive 5-star review on their behalf so profiles stay welcoming.' },
      { kind: 'fixed', text: 'Tapping any notification now reliably opens the right page on iPhone (previously some taps were being silently swallowed).' },
      { kind: 'fixed', text: 'Business owners now see their venue name and logo on their own messages immediately, not their personal name.' },
      { kind: 'fixed', text: 'Chat list preview shows the right business identity on the most recent message too.' },
      { kind: 'fixed', text: 'Users with a completed profile no longer get stuck on the onboarding screen after logging in.' },
      { kind: 'changed', text: 'The "Add to home screen" step in onboarding always shows now, with a friendly "you\'re all set" if Lincc is already installed.' },
    ],
  },
  {
    version: '0.15.2',
    date: '2026-06-06',
    summary: 'Place search location fix and account tidy-up.',
    changes: [
      { kind: 'fixed', text: 'Place search no longer locks to the UK when your GPS is off or denied.' },
      { kind: 'fixed', text: 'Tapping a review prompt notification opens the review pop-up again.' },
      { kind: 'changed', text: 'Personal accounts can no longer be converted to business in place. The Settings tile now signs you out and takes you to business signup with a different email.' },
      { kind: 'changed', text: 'Username field in onboarding now reads "Add username please".' },
    ],
  },
  {
    version: '0.15.1',
    date: '2026-06-06',
    summary: 'Notifications now take you to the right place.',
    changes: [
      { kind: 'fixed', text: 'Tapping a notification now opens the matching event, voucher, or page instead of dropping you on home.' },
      { kind: 'fixed', text: 'Review prompts land you on My Events so you can pick which event to review.' },
      { kind: 'fixed', text: 'Voucher redeemed and problem-report notifications now have proper icons and tap-through actions.' },
      { kind: 'changed', text: 'Install step in onboarding now always shows. If Lincc is already on your home screen, it confirms you\'re set instead of pushing you to install again.' },
    ],
  },
  {
    version: '0.15.0',
    date: '2026-06-06',
    summary: 'Polish across onboarding, contact, places, and broken images.',
    changes: [
      { kind: 'added', text: 'About and Contact pages now live inside the app instead of feeling like the marketing site.' },
      { kind: 'added', text: '"Need help?" button on every onboarding screen that opens the report sheet.' },
      { kind: 'added', text: 'Confirmation popup when switching to a business account so it\'s clear the change is permanent.' },
      { kind: 'added', text: 'Stock image fallback when an event or voucher cover is broken or missing.' },
      { kind: 'added', text: 'Report sheet now tells you we aim to reply within 24 hours.' },
      { kind: 'fixed', text: 'Place search now biases to your country, no more results from the other side of the world.' },
      { kind: 'fixed', text: 'Typing in the report sheet no longer jumps focus to the close button.' },
      { kind: 'fixed', text: 'Business onboarding no longer gets stuck on a loading screen after converting.' },
      { kind: 'fixed', text: 'Replaying onboarding now remembers your date of birth, gender, interests, and bio.' },
      { kind: 'changed', text: 'Contact us now lives in the Settings menu with real Instagram and TikTok links.' },
    ],
  },
  {
    version: '0.14.0',
    date: '2026-06-05',
    summary: 'Big visual refresh and desktop polish.',
    changes: [
      { kind: 'changed', text: 'Full UI/UX refresh across landing and the main app.' },
      { kind: 'added', text: 'Persistent side navigation on desktop with full-width consumer pages.' },
      { kind: 'fixed', text: 'Dark mode contrast and persistence across the app.' },
      { kind: 'fixed', text: 'Email DNS records (SPF, DKIM, DMARC) so account emails land in inboxes.' },
    ],
  },
  {
    version: '0.13.7',
    date: '2026-05-31',
    summary: 'Mobile image uploads fixed end to end.',
    changes: [
      { kind: 'fixed', text: 'Photo uploads on Samsung and Android phones.' },
      { kind: 'fixed', text: 'Join button no longer hidden behind the bottom bar on mobile.' },
      { kind: 'fixed', text: 'Onboarding no longer resets after taking a selfie.' },
      { kind: 'added', text: 'Report a problem sheet so you can flag broken flows directly from the app.' },
    ],
  },
  {
    version: '0.13.0',
    date: '2026-05-16',
    summary: 'Security tightening and Sentry cleanup.',
    changes: [
      { kind: 'fixed', text: 'Hardened a backend permission that could let notifications be spoofed.' },
      { kind: 'changed', text: 'Cleaned up monitoring so real issues stand out from noise.' },
    ],
  },
  {
    version: '0.12.0',
    date: '2026-05-06',
    summary: 'Auth and image upload reliability.',
    changes: [
      { kind: 'fixed', text: 'Business signup no longer loses your business details on first login.' },
      { kind: 'fixed', text: 'Image upload reliability on slow phone connections.' },
    ],
  },
  {
    version: '0.11.0',
    date: '2026-05-04',
    summary: 'Easier installs and a smoother signup.',
    changes: [
      { kind: 'added', text: 'Step-by-step install instructions tailored to your device, whether you\'re on iPhone, Android, or desktop.' },
      { kind: 'added', text: 'System status checks behind the scenes so we spot problems before you do.' },
      { kind: 'changed', text: 'Signup form reworked with clearer fields, and onboarding now pre-fills anything we already know about you.' },
    ],
  },
  {
    version: '0.10.0',
    date: '2026-05-01',
    summary: 'iPhone photos and full account deletion.',
    changes: [
      { kind: 'added', text: 'iPhone photos (HEIC format) now upload properly, converted automatically behind the scenes.' },
      { kind: 'added', text: 'A heads-up banner if you\'re in private browsing, where some features can\'t work.' },
      { kind: 'added', text: 'Delete your account completely from Settings, everything goes, no traces left.' },
    ],
  },
  {
    version: '0.9.0',
    date: '2026-04-29',
    summary: 'Reviews go both ways and businesses get verified.',
    changes: [
      { kind: 'added', text: 'After an event, hosts and guests can now rate each other, so trust builds in both directions.' },
      { kind: 'added', text: 'Business verification: businesses upload their documents and earn a verified badge once approved.' },
      { kind: 'added', text: 'A friendly prompt to rate your event once it wraps up.' },
      { kind: 'added', text: 'Cookie consent banner and privacy-respecting analytics.' },
      { kind: 'changed', text: 'Clearer split between personal and business accounts.' },
    ],
  },
  {
    version: '0.8.2',
    date: '2026-04-27',
    summary: 'A guided welcome for new users.',
    changes: [
      { kind: 'added', text: 'Interactive welcome tour that walks first-timers around the app with spotlights and tips.' },
      { kind: 'changed', text: 'Onboarding rebuilt step by step: date of birth, location, notifications, and install, each on its own screen.' },
      { kind: 'added', text: '"Delete your data" section on the Privacy page, your data, your call.' },
    ],
  },
  {
    version: '0.8.1',
    date: '2026-04-18',
    summary: 'Welcome emails and livelier chat.',
    changes: [
      { kind: 'added', text: 'You now get a proper welcome email when you join, and waitlist signups get a confirmation too.' },
      { kind: 'added', text: 'Chat shows when people are online and typing.' },
      { kind: 'added', text: 'Save an event as a draft or duplicate a past one instead of starting from scratch.' },
      { kind: 'added', text: 'Follow button on user profiles so it\'s one tap to stay in the loop.' },
    ],
  },
  {
    version: '0.8.0',
    date: '2026-04-02',
    summary: 'Browse businesses and find people.',
    changes: [
      { kind: 'added', text: 'Business directory: browse local businesses and their offers in one place.' },
      { kind: 'added', text: 'Dashboard for business owners to manage their venue, offers, and reach.' },
      { kind: 'added', text: 'Find people by name and check out their profiles.' },
    ],
  },
  {
    version: '0.7.0',
    date: '2026-03-28',
    summary: 'Dark mode, ratings, and a way to talk back.',
    changes: [
      { kind: 'added', text: 'Dark mode. Easy on the eyes, follows your system setting.' },
      { kind: 'added', text: 'Star ratings and comments on events once they finish.' },
      { kind: 'added', text: 'In-app feedback form: spot a bug or have an idea, tell us right from the app.' },
      { kind: 'added', text: 'Announcement banner so we can let everyone know about important updates.' },
      { kind: 'changed', text: 'Smoother loading with skeleton screens instead of blank pages.' },
    ],
  },
  {
    version: '0.6.0',
    date: '2026-03-04',
    summary: 'Venue search, direct messages, and the first business tools.',
    changes: [
      { kind: 'added', text: 'Venue search powered by Google Places: type a few letters and pick the exact spot, photos included.' },
      { kind: 'added', text: 'Direct messages: chat one-to-one with people outside of events.' },
      { kind: 'added', text: 'Vouchers: businesses can post offers and you can redeem them with a code at the till.' },
      { kind: 'added', text: 'Business accounts with their own profiles.' },
      { kind: 'added', text: 'Cover images on events.' },
      { kind: 'added', text: 'Forgot your password? You can reset it now.' },
    ],
  },
  {
    version: '0.5.0',
    date: '2026-02-26',
    summary: 'Push notifications arrive.',
    changes: [
      { kind: 'added', text: 'Push notifications so you hear about join requests, approvals, and messages even when the app is closed.' },
      { kind: 'added', text: 'Notification preferences with quiet hours, you decide what gets through and when.' },
    ],
  },
  {
    version: '0.4.0',
    date: '2026-02-16',
    summary: 'Search, saving, and staying safe.',
    changes: [
      { kind: 'added', text: 'Search events by keyword.' },
      { kind: 'added', text: 'Save events for later and find them in your own saved list.' },
      { kind: 'added', text: 'Explore page for browsing events by category.' },
      { kind: 'added', text: 'Follow people whose events you like.' },
      { kind: 'added', text: 'Block and report: tools to keep your experience safe.' },
      { kind: 'added', text: 'Lincc now works offline and can be installed on your home screen like a proper app.' },
    ],
  },
  {
    version: '0.3.0',
    date: '2026-02-07',
    summary: 'Lincc goes public with its landing page and waitlist.',
    changes: [
      { kind: 'added', text: 'Brand new landing page with the waitlist open for early signups.' },
      { kind: 'added', text: 'About, Privacy, Terms, and Contact pages.' },
      { kind: 'added', text: 'Demo events across London so you can see Lincc in action.' },
    ],
  },
  {
    version: '0.2.0',
    date: '2026-02-03',
    summary: 'The map comes alive.',
    changes: [
      { kind: 'added', text: 'Live map with event pins, location search, and zoom controls.' },
      { kind: 'added', text: 'Full event pages with participants and chat in one place.' },
      { kind: 'added', text: 'Hosts can manage join requests from a dedicated screen.' },
      { kind: 'added', text: 'View other people\'s profiles.' },
      { kind: 'added', text: 'Notifications page for join requests and event alerts.' },
      { kind: 'fixed', text: 'You stay signed in after refreshing the page.' },
    ],
  },
  {
    version: '0.1.0',
    date: '2026-01-27',
    summary: 'Lincc is born.',
    changes: [
      { kind: 'added', text: 'The first build: create an event in under 30 seconds, set the category, spot, time, and how many can join.' },
      { kind: 'added', text: 'Discover events near you, ranked by what you\'re into and how close they are.' },
      { kind: 'added', text: 'Join requests with host approval, or instant auto-join.' },
      { kind: 'added', text: 'Real-time chat for every event.' },
      { kind: 'added', text: 'Profiles with photo, interests, and bio.' },
    ],
  },
];
