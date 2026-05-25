import { useEffect, useRef, useState } from 'react';
import { RefreshCw, ChevronDown, ExternalLink } from 'lucide-react';
import { runHealthChecks, overallStatus, type HealthCheck, type CheckStatus } from '../../services/statusService';

const REFRESH_INTERVAL_MS = 60_000;

const STATUS_TEXT: Record<CheckStatus, string> = {
  ok: 'All systems operational',
  degraded: 'Some services degraded',
  down: 'Service outage',
  unknown: 'Status unknown',
};

const DOT_CLASS: Record<CheckStatus, string> = {
  ok: 'bg-success',
  degraded: 'bg-warning',
  down: 'bg-error',
  unknown: 'bg-text-muted',
};

const PILL_RING: Record<CheckStatus, string> = {
  ok: 'ring-green-500/20',
  degraded: 'ring-warning/30',
  down: 'ring-error/40',
  unknown: 'ring-border',
};

function formatRelative(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function formatLatency(ms: number | null): string {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function SystemStatus() {
  const [checks, setChecks] = useState<HealthCheck[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRunAt, setLastRunAt] = useState<Date | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [, setTick] = useState(0);
  const isMounted = useRef(true);

  const run = async () => {
    setIsLoading(true);
    const result = await runHealthChecks();
    if (!isMounted.current) return;
    setChecks(result);
    setLastRunAt(new Date());
    setIsLoading(false);
  };

  useEffect(() => {
    isMounted.current = true;
    run();
    const interval = setInterval(run, REFRESH_INTERVAL_MS);
    // Re-render every 10s so the "X seconds ago" text updates without re-pinging.
    const tick = setInterval(() => setTick((n) => n + 1), 10_000);
    return () => {
      isMounted.current = false;
      clearInterval(interval);
      clearInterval(tick);
    };
  }, []);

  const overall = checks ? overallStatus(checks) : 'unknown';

  return (
    <section className={`bg-surface rounded-2xl border border-border ring-1 ${PILL_RING[overall]} overflow-hidden`}>
      <div className="px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex-1 flex items-center gap-3 text-left min-w-0 -mx-2 px-2 py-1 rounded-lg hover:bg-background/40 transition-colors"
          aria-expanded={expanded}
        >
          <span className="relative flex h-3 w-3 shrink-0">
            {overall === 'ok' && (
              <span className="absolute inline-flex h-full w-full rounded-full bg-success/40 animate-ping" />
            )}
            <span className={`relative inline-flex h-3 w-3 rounded-full ${DOT_CLASS[overall]}`} />
          </span>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text">{STATUS_TEXT[overall]}</p>
            <p className="text-[11px] text-text-muted">
              {lastRunAt ? `Checked ${formatRelative(lastRunAt)}` : 'Checking…'}
              {checks && (
                <>
                  {' · '}
                  {checks.filter((c) => c.status === 'ok').length}/{checks.length} healthy
                </>
              )}
            </p>
          </div>

          {checks && !expanded && (
            <div className="hidden sm:flex items-center gap-2">
              {checks.map((c) => (
                <span
                  key={c.id}
                  className="flex items-center gap-1.5 text-[11px] text-text-muted"
                  title={`${c.name}: ${c.status}${c.latencyMs != null ? ` (${formatLatency(c.latencyMs)})` : ''}`}
                >
                  <span className={`w-2 h-2 rounded-full ${DOT_CLASS[c.status]}`} />
                  <span className="hidden lg:inline">{c.name}</span>
                </span>
              ))}
            </div>
          )}

          <ChevronDown
            className={`h-4 w-4 text-text-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </button>

        <button
          type="button"
          onClick={run}
          disabled={isLoading}
          className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-background/60 transition-colors disabled:opacity-50"
          aria-label="Refresh status"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {expanded && checks && (
        <div className="border-t border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
          {checks.map((c) => (
            <div key={c.id} className="bg-surface p-3 flex items-start gap-3">
              <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${DOT_CLASS[c.status]}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-text truncate">{c.name}</p>
                  <span className="text-[11px] text-text-muted tabular-nums shrink-0">
                    {formatLatency(c.latencyMs)}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted mt-0.5">{c.description}</p>
                <p className="text-[11px] text-text-muted mt-1 capitalize">
                  Status: <span className="font-medium text-text">{c.status}</span>
                  {c.message && <span className="lowercase text-text-muted"> · {c.message}</span>}
                </p>
                {c.href && (
                  <a
                    href={c.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-coral hover:underline mt-1"
                  >
                    Open dashboard <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
