import { useMemo, useState } from 'react';

export type BarSeries = {
  key: string;
  label: string;
  /** Tailwind background colour class for the bar (e.g. 'bg-coral'). */
  colorClass: string;
  /** Daily values aligned with the parent's `dates` array. */
  values: number[];
};

interface BarSeriesChartProps {
  title: string;
  /** ISO date strings (YYYY-MM-DD) — one per bar group, oldest → newest. */
  dates: string[];
  series: BarSeries[];
  /** Optional empty-state copy when every value across every series is 0. */
  emptyText?: string;
}

/**
 * Round up to a friendly tick value so a max of 7 renders as 10, not 7.
 * Designed for small-but-growing data so the y-axis doesn't jitter wildly
 * each time a single new event lands.
 */
function niceMax(value: number): number {
  if (value <= 1) return 1;
  if (value <= 2) return 2;
  if (value <= 5) return 5;
  if (value <= 10) return 10;
  const exp = Math.floor(Math.log10(value));
  const base = Math.pow(10, exp);
  const mantissa = value / base;
  const rounded = mantissa <= 2 ? 2 : mantissa <= 5 ? 5 : 10;
  return rounded * base;
}

function formatDateShort(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function BarSeriesChart({ title, dates, series, emptyText = 'No activity yet' }: BarSeriesChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const totals = useMemo(() => series.map((s) => s.values.reduce((a, b) => a + b, 0)), [series]);
  const grandMax = useMemo(() => {
    let m = 0;
    for (const s of series) for (const v of s.values) if (v > m) m = v;
    return m;
  }, [series]);
  const yMax = niceMax(grandMax);
  const isEmpty = grandMax === 0;
  const days = dates.length;

  // Pick a sensible number of x-axis labels so they don't overlap on small screens.
  const labelCount = days <= 7 ? days : days <= 14 ? 7 : days <= 30 ? 6 : 5;
  const labelStep = Math.max(1, Math.floor((days - 1) / (labelCount - 1)));
  const labelIdxs = new Set<number>();
  for (let i = 0; i < days; i += labelStep) labelIdxs.add(i);
  labelIdxs.add(days - 1);

  return (
    <div className="bg-surface rounded-2xl border border-border p-4">
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h3 className="font-semibold text-text text-sm">{title}</h3>
          <p className="text-[11px] text-text-muted mt-0.5">Last {days} days</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          {series.map((s, i) => (
            <div key={s.key} className="flex flex-col items-end">
              <span className="flex items-center gap-1.5 text-text-muted">
                <span className={`w-2.5 h-2.5 rounded-sm ${s.colorClass}`} />
                {s.label}
              </span>
              <span className="font-semibold text-text tabular-nums">{totals[i]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative">
        {/* Y-axis grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          <div className="border-t border-border/60 relative">
            <span className="absolute -top-2 -left-1 text-[10px] text-text-muted bg-surface px-1 tabular-nums">
              {yMax}
            </span>
          </div>
          <div className="border-t border-border/40" />
          <div className="border-t border-border/60 relative">
            <span className="absolute -top-2 -left-1 text-[10px] text-text-muted bg-surface px-1 tabular-nums">0</span>
          </div>
        </div>

        {/* Bars */}
        <div
          className="flex items-end gap-px h-32 pl-6"
          onMouseLeave={() => setHoverIdx(null)}
        >
          {dates.map((date, i) => {
            const isHover = hoverIdx === i;
            return (
              <div
                key={date}
                className="flex-1 h-full flex items-end gap-px relative cursor-default"
                onMouseEnter={() => setHoverIdx(i)}
              >
                {series.map((s) => {
                  const v = s.values[i] ?? 0;
                  const pct = isEmpty ? 0 : (v / yMax) * 100;
                  return (
                    <div
                      key={s.key}
                      className={`flex-1 rounded-t-sm transition-colors ${s.colorClass} ${isHover ? '' : 'opacity-80'}`}
                      style={{ height: `${pct}%`, minHeight: v > 0 ? 2 : 0 }}
                    />
                  );
                })}

                {isHover && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-10 pointer-events-none">
                    <div className="bg-text text-white text-[11px] px-2 py-1 rounded-lg whitespace-nowrap shadow-lg ring-1 ring-black/10">
                      <div className="font-medium mb-0.5">{formatDateShort(date)}</div>
                      {series.map((s, j) => (
                        <div key={s.key} className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-sm ${s.colorClass}`} />
                          <span>
                            {s.label}: <span className="tabular-nums font-semibold">{s.values[i] ?? 0}</span>
                          </span>
                          {j < series.length - 1 ? null : null}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pl-6 pointer-events-none">
            <p className="text-xs text-text-muted bg-surface/80 px-3 py-1 rounded-full">{emptyText}</p>
          </div>
        )}
      </div>

      {/* Date labels */}
      <div className="flex mt-2 pl-6 text-[10px] text-text-muted">
        {dates.map((date, i) => (
          <div key={date} className="flex-1 text-center">
            {labelIdxs.has(i) ? formatDateShort(date) : ' '}
          </div>
        ))}
      </div>
    </div>
  );
}
