import { supabase } from '../lib/supabase';

export type CheckStatus = 'ok' | 'degraded' | 'down' | 'unknown';

export interface HealthCheck {
  id: string;
  name: string;
  /** Plain-English explanation of what the app uses this service for. */
  description: string;
  status: CheckStatus;
  latencyMs: number | null;
  message?: string;
  /** Useful link a sysadmin would want to open when this check is unhealthy. */
  href?: string;
}

const SLOW_THRESHOLD_MS = 1500;
const VERY_SLOW_THRESHOLD_MS = 2500;
const TIMEOUT_MS = 5000;

async function timed<T>(fn: () => Promise<T>): Promise<{ ms: number; result: T | null; error?: string }> {
  const start = performance.now();
  try {
    const result = await fn();
    return { ms: Math.round(performance.now() - start), result };
  } catch (e) {
    return {
      ms: Math.round(performance.now() - start),
      result: null,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

function classifyLatency(ms: number): CheckStatus {
  if (ms > VERY_SLOW_THRESHOLD_MS) return 'degraded';
  if (ms > SLOW_THRESHOLD_MS) return 'degraded';
  return 'ok';
}

async function checkDatabase(): Promise<HealthCheck> {
  const { ms, error } = await timed(async () => {
    const { error } = await supabase.from('categories').select('id', { count: 'exact', head: true });
    if (error) throw new Error(error.message);
  });
  return {
    id: 'database',
    name: 'Database',
    description: 'Postgres — events, profiles, chat, vouchers, reports',
    status: error ? 'down' : classifyLatency(ms),
    latencyMs: ms,
    message: error,
    href: 'https://supabase.com/dashboard/project/srrubyupwiiqnehshszd',
  };
}

async function checkAuth(): Promise<HealthCheck> {
  const { ms, error } = await timed(async () => {
    const { error } = await supabase.auth.getSession();
    if (error) throw new Error(error.message);
  });
  return {
    id: 'auth',
    name: 'Auth',
    description: 'Signup, login, magic links, password reset',
    status: error ? 'down' : classifyLatency(ms),
    latencyMs: ms,
    message: error,
    href: 'https://supabase.com/dashboard/project/srrubyupwiiqnehshszd/auth/users',
  };
}

async function checkStorage(): Promise<HealthCheck> {
  const { ms, error } = await timed(async () => {
    const { error } = await supabase.storage.from('avatars').list('', { limit: 1 });
    if (error) throw new Error(error.message);
  });
  return {
    id: 'storage',
    name: 'Storage',
    description: 'Avatars, event cover images, business logos',
    status: error ? 'down' : classifyLatency(ms),
    latencyMs: ms,
    message: error,
    href: 'https://supabase.com/dashboard/project/srrubyupwiiqnehshszd/storage/buckets',
  };
}

async function checkRealtime(): Promise<HealthCheck> {
  const start = performance.now();
  return new Promise<HealthCheck>((resolve) => {
    const channel = supabase.channel(`status-check-${Date.now()}`);
    let settled = false;

    const finish = (status: CheckStatus, message?: string) => {
      if (settled) return;
      settled = true;
      const ms = Math.round(performance.now() - start);
      try {
        supabase.removeChannel(channel);
      } catch {
        // ignore
      }
      resolve({
        id: 'realtime',
        name: 'Realtime',
        description: 'Live chat, notifications, event updates',
        status,
        latencyMs: status === 'down' ? null : ms,
        message,
        href: 'https://supabase.com/dashboard/project/srrubyupwiiqnehshszd/database/replication',
      });
    };

    const timer = setTimeout(() => finish('down', 'Subscription timed out'), TIMEOUT_MS);

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        clearTimeout(timer);
        const ms = performance.now() - start;
        finish(classifyLatency(ms));
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        clearTimeout(timer);
        finish('down', status);
      }
    });
  });
}

async function checkMapbox(): Promise<HealthCheck> {
  const token = import.meta.env.VITE_MAPBOX_TOKEN;
  if (!token) {
    return {
      id: 'mapbox',
      name: 'Mapbox',
      description: 'Map tiles, geocoding, static map images',
      status: 'unknown',
      latencyMs: null,
      message: 'VITE_MAPBOX_TOKEN not configured',
    };
  }
  const { ms, error } = await timed(async () => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token=${token}`, {
        method: 'HEAD',
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } finally {
      clearTimeout(t);
    }
  });
  return {
    id: 'mapbox',
    name: 'Mapbox',
    description: 'Map tiles, geocoding, static map images',
    status: error ? 'down' : classifyLatency(ms),
    latencyMs: ms,
    message: error,
    href: 'https://status.mapbox.com',
  };
}

interface HealthCheckPayload {
  ok?: boolean;
  dependencies?: {
    resend?: { ok: boolean; latencyMs: number; status?: number; error?: string };
  };
}

let cachedEdgePayload: HealthCheckPayload | null = null;

async function checkEdgeFunctions(): Promise<HealthCheck> {
  cachedEdgePayload = null;
  const { ms, result, error } = await timed(async () => {
    const { data, error } = await supabase.functions.invoke<HealthCheckPayload>('health-check', {
      method: 'GET',
    });
    if (error) throw new Error(error.message);
    if (!data?.ok) throw new Error('Health-check returned non-ok payload');
    return data;
  });
  cachedEdgePayload = result;
  return {
    id: 'edge-functions',
    name: 'Edge Functions',
    description: 'Push notifications, account deletion, waitlist + welcome emails',
    status: error || !result ? 'down' : classifyLatency(ms),
    latencyMs: ms,
    message: error,
    href: 'https://supabase.com/dashboard/project/srrubyupwiiqnehshszd/functions',
  };
}

async function checkResend(): Promise<HealthCheck> {
  const dep = cachedEdgePayload?.dependencies?.resend;
  if (!dep) {
    return {
      id: 'resend',
      name: 'Resend (email)',
      description: 'Auth emails, waitlist + welcome emails',
      status: 'unknown',
      latencyMs: null,
      message: 'Edge Functions check did not return Resend status',
      href: 'https://status.resend.com',
    };
  }
  return {
    id: 'resend',
    name: 'Resend (email)',
    description: 'Auth emails, waitlist + welcome emails',
    status: dep.ok ? classifyLatency(dep.latencyMs) : 'down',
    latencyMs: dep.latencyMs,
    message: dep.ok ? undefined : dep.error ?? `HTTP ${dep.status ?? '?'}`,
    href: 'https://status.resend.com',
  };
}

interface CronHealthRow {
  jobname: string;
  schedule: string;
  active: boolean;
  last_run_at: string | null;
  last_status: string | null;
  last_return_message: string | null;
  seconds_since_last_run: number | null;
}

async function checkCron(): Promise<HealthCheck> {
  const { ms, result, error } = await timed(async () => {
    const { data, error } = await supabase.rpc('get_cron_health');
    if (error) throw new Error(error.message);
    return (data ?? []) as CronHealthRow[];
  });

  if (error || !result) {
    return {
      id: 'cron',
      name: 'Scheduled jobs',
      description: 'Event auto-expiry + push reminders (every 5 minutes)',
      status: 'down',
      latencyMs: ms,
      message: error,
      href: 'https://supabase.com/dashboard/project/srrubyupwiiqnehshszd/database/cron-jobs',
    };
  }

  if (result.length === 0) {
    return {
      id: 'cron',
      name: 'Scheduled jobs',
      description: 'Event auto-expiry + push reminders (every 5 minutes)',
      status: 'unknown',
      latencyMs: ms,
      message: 'No cron jobs registered',
      href: 'https://supabase.com/dashboard/project/srrubyupwiiqnehshszd/database/cron-jobs',
    };
  }

  // All scheduled jobs run every 5 min. Allow up to 2x the cadence before flagging.
  const STALE_AFTER_SECONDS = 600;
  const failed = result.filter((r) => r.last_status && r.last_status !== 'succeeded');
  const stale = result.filter(
    (r) => r.active && (r.seconds_since_last_run == null || r.seconds_since_last_run > STALE_AFTER_SECONDS),
  );

  let status: CheckStatus = 'ok';
  let detail: string | undefined;
  if (failed.length > 0) {
    status = 'down';
    detail = `${failed.map((r) => `${r.jobname} ${r.last_status}`).join(', ')}`;
  } else if (stale.length > 0) {
    status = 'degraded';
    detail = `${stale.length} job${stale.length === 1 ? '' : 's'} overdue`;
  } else if (ms > VERY_SLOW_THRESHOLD_MS) {
    status = 'degraded';
  }

  return {
    id: 'cron',
    name: 'Scheduled jobs',
    description: `${result.length} job${result.length === 1 ? '' : 's'} — event auto-expiry + push reminders`,
    status,
    latencyMs: ms,
    message: detail,
    href: 'https://supabase.com/dashboard/project/srrubyupwiiqnehshszd/database/cron-jobs',
  };
}

async function checkGooglePlaces(): Promise<HealthCheck> {
  const key = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
  if (!key) {
    return {
      id: 'places',
      name: 'Google Places',
      description: 'Venue autocomplete, place details, venue photos',
      status: 'unknown',
      latencyMs: null,
      message: 'VITE_GOOGLE_PLACES_API_KEY not configured',
    };
  }
  // Skip a live ping — billable per request. Configured = green.
  return {
    id: 'places',
    name: 'Google Places',
    description: 'Venue autocomplete, place details, venue photos',
    status: 'ok',
    latencyMs: null,
    message: 'Key configured (no live ping)',
    href: 'https://status.cloud.google.com',
  };
}

export async function runHealthChecks(): Promise<HealthCheck[]> {
  // Edge Functions must run before Resend, since Resend's status piggybacks on
  // the Edge Function payload (no public CORS-enabled endpoint on Resend).
  const [database, auth, storage, realtime, edge, cron, mapbox, places] = await Promise.all([
    checkDatabase(),
    checkAuth(),
    checkStorage(),
    checkRealtime(),
    checkEdgeFunctions(),
    checkCron(),
    checkMapbox(),
    checkGooglePlaces(),
  ]);
  const resend = await checkResend();
  return [database, auth, storage, realtime, edge, cron, mapbox, places, resend];
}

export function overallStatus(checks: HealthCheck[]): CheckStatus {
  if (checks.some((c) => c.status === 'down')) return 'down';
  if (checks.some((c) => c.status === 'degraded')) return 'degraded';
  if (checks.every((c) => c.status === 'unknown')) return 'unknown';
  return 'ok';
}
