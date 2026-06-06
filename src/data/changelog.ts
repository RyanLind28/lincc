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
