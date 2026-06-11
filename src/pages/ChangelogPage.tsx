import { useMemo, useState } from 'react';
import { Header } from '../components/layout';
import { CHANGELOG, type ChangeKind } from '../data/changelog';
import { Sparkles, Wrench, RefreshCcw, ChevronLeft, ChevronRight } from 'lucide-react';

const KIND_META: Record<ChangeKind, { label: string; icon: typeof Sparkles; color: string }> = {
  added: { label: 'New', icon: Sparkles, color: 'text-coral bg-coral/10' },
  fixed: { label: 'Fixed', icon: Wrench, color: 'text-success bg-success/10' },
  changed: { label: 'Changed', icon: RefreshCcw, color: 'text-purple bg-purple/10' },
};

// How many versions to show per page. Keeps the list short rather than growing
// without bound as we ship more releases.
const PAGE_SIZE = 6;

function parseDate(iso: string): Date {
  return new Date(iso + 'T00:00:00Z');
}

function formatDate(iso: string): string {
  try {
    return parseDate(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

// "2026-06-09" → { key: "2026-06", label: "June 2026" }
function monthOf(iso: string): { key: string; label: string } {
  const key = iso.slice(0, 7);
  let label = key;
  try {
    label = parseDate(iso).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  } catch {
    /* keep raw key */
  }
  return { key, label };
}

export default function ChangelogPage() {
  const [month, setMonth] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Distinct months present in the changelog, newest first, for the filter.
  const months = useMemo(() => {
    const seen = new Map<string, string>();
    for (const entry of CHANGELOG) {
      const { key, label } = monthOf(entry.date);
      if (!seen.has(key)) seen.set(key, label);
    }
    return Array.from(seen, ([key, label]) => ({ key, label })).sort((a, b) =>
      b.key.localeCompare(a.key),
    );
  }, []);

  const filtered = useMemo(
    () => (month === 'all' ? CHANGELOG : CHANGELOG.filter((e) => e.date.startsWith(month))),
    [month],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleMonthChange = (value: string) => {
    setMonth(value);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      <Header title="What's new" />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <section className="bg-surface rounded-2xl border border-border p-6 sm:p-8 text-center">
          <p className="text-purple font-semibold text-xs uppercase tracking-wider mb-3">Changelog</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-text mb-3">
            What we've been <span className="gradient-text">shipping</span>
          </h1>
          <p className="text-sm sm:text-base text-text-muted leading-relaxed">
            A running log of new features, fixes, and improvements.
          </p>
        </section>

        {/* Month filter */}
        {months.length > 0 && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-text-muted">
              {filtered.length} {filtered.length === 1 ? 'release' : 'releases'}
            </p>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-text-muted">Month</span>
              <select
                value={month}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="bg-surface border border-border rounded-lg px-3 py-1.5 text-text focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral transition-colors"
              >
                <option value="all">All months</option>
                {months.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {visible.map((entry) => (
          <section key={entry.version} className="bg-surface rounded-2xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-text">v{entry.version}</h2>
                {entry.summary && (
                  <p className="text-sm text-text-muted mt-0.5">{entry.summary}</p>
                )}
              </div>
              <span className="text-xs text-text-light whitespace-nowrap">{formatDate(entry.date)}</span>
            </div>

            <ul className="divide-y divide-border">
              {entry.changes.map((change, i) => {
                const meta = KIND_META[change.kind];
                const Icon = meta.icon;
                return (
                  <li key={i} className="flex items-start gap-3 px-5 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide shrink-0 mt-0.5 ${meta.color}`}>
                      <Icon className="h-3 w-3" />
                      {meta.label}
                    </span>
                    <p className="text-sm text-text leading-relaxed">{change.text}</p>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {filtered.length === 0 && (
          <p className="text-center text-sm text-text-muted py-8">No releases this month.</p>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-border text-sm text-text disabled:opacity-40 disabled:cursor-not-allowed hover:bg-background transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="text-sm text-text-muted">
              Page {safePage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-border text-sm text-text disabled:opacity-40 disabled:cursor-not-allowed hover:bg-background transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        <p className="text-center text-xs text-text-light pt-2">
          Spot something missing or broken? Tap "Report a problem" in Settings.
        </p>
      </main>
    </div>
  );
}
