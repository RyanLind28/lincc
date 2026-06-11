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
    date: '2026-05-25',
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
];
