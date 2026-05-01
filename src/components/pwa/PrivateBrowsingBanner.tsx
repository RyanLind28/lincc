import { useEffect, useState } from 'react';
import { EyeOff, X } from 'lucide-react';
import * as Sentry from '@sentry/react';
import { isPrivateBrowsing, getBrowserEnv } from '../../lib/browserEnv';

const DISMISS_KEY = 'lincc-private-banner-dismissed';

/**
 * Surfaced when the user is in Private / Incognito / Samsung "Secret Mode".
 * In those modes localStorage / IndexedDB / service workers either don't persist
 * or fail outright, so the user appears stuck — accounts don't save, push notifs
 * don't register, the app reloads to a logged-out state. We can't fix the mode,
 * but we can tell them what's happening.
 *
 * Dismissal lives in sessionStorage so it persists this tab but not future ones.
 */
export function PrivateBrowsingBanner() {
  const [isPrivate, setIsPrivate] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    isPrivateBrowsing().then((result) => {
      if (cancelled || !result) return;
      setIsPrivate(true);
      // sessionStorage may also be unavailable in private — wrap.
      try {
        if (sessionStorage.getItem(DISMISS_KEY)) setDismissed(true);
      } catch {
        // ignore
      }
      // Telemetry: knowing how many of our users hit this is useful, even though
      // we can't show them anything more than the banner.
      const env = getBrowserEnv();
      Sentry.captureMessage('private-browsing-detected', {
        level: 'info',
        tags: { browser: env.browser, os: env.os },
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isPrivate || dismissed) return null;

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  return (
    <div className="bg-purple text-white px-4 py-2 safe-top">
      <div className="flex items-center gap-3 text-sm">
        <EyeOff className="h-4 w-4 flex-shrink-0" />
        <p className="flex-1">
          Private browsing detected — Lincc may not save your account or notifications. Open in a normal tab for the full experience.
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="flex-shrink-0 p-1 -mr-1 hover:bg-white/10 rounded"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
