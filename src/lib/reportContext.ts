import * as Sentry from '@sentry/react';
import { getBrowserEnv } from './browserEnv';

/**
 * Snapshot of the user's environment attached to a problem report. Lets a stuck
 * user send a report without having to describe their device or which screen
 * broke — and links back to the matching Sentry event when there is one.
 */
export interface ReportContext {
  /** Where the report was launched from (e.g. 'event-cover', 'settings'). */
  source: string | null;
  url: string;
  browser: string;
  browserVersion: string | null;
  os: string;
  deviceClass: string;
  standalone: boolean;
  userAgent: string;
  viewport: string;
  mode: string;
  /** Most recent Sentry event id — usually the error the user just hit. */
  sentryEventId: string | null;
  capturedAt: string;
}

export function buildReportContext(opts?: { source?: string | null }): ReportContext {
  let env: ReturnType<typeof getBrowserEnv> | null = null;
  try {
    env = getBrowserEnv();
  } catch {
    // Detection failed — non-fatal, report still goes through.
  }

  return {
    source: opts?.source ?? null,
    url: typeof window !== 'undefined' ? window.location.href : '',
    browser: env?.browser ?? 'unknown',
    browserVersion: env?.browserVersion ?? null,
    os: env?.os ?? 'unknown',
    deviceClass: env?.deviceClass ?? 'unknown',
    standalone: env?.isStandalone ?? false,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    viewport:
      typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : '',
    mode: import.meta.env.MODE,
    sentryEventId: safeLastEventId(),
    capturedAt: new Date().toISOString(),
  };
}

function safeLastEventId(): string | null {
  try {
    return Sentry.lastEventId() ?? null;
  } catch {
    return null;
  }
}
