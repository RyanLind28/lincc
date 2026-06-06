import { Header } from '../components/layout';
import { CHANGELOG, type ChangeKind } from '../data/changelog';
import { Sparkles, Wrench, RefreshCcw } from 'lucide-react';

const KIND_META: Record<ChangeKind, { label: string; icon: typeof Sparkles; color: string }> = {
  added: { label: 'New', icon: Sparkles, color: 'text-coral bg-coral/10' },
  fixed: { label: 'Fixed', icon: Wrench, color: 'text-success bg-success/10' },
  changed: { label: 'Changed', icon: RefreshCcw, color: 'text-purple bg-purple/10' },
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso + 'T00:00:00Z');
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

export default function ChangelogPage() {
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

        {CHANGELOG.map((entry) => (
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

        <p className="text-center text-xs text-text-light pt-2">
          Spot something missing or broken? Tap "Report a problem" in Settings.
        </p>
      </main>
    </div>
  );
}
