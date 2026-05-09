import { useEffect, useMemo, useState } from 'react';
import { Header } from '../../components/layout';
import { Badge, Button, Input, ChatListSkeleton } from '../../components/ui';
import { Search, Mail, Store, User, Download } from 'lucide-react';
import { fetchWaitlist, type WaitlistEntry } from '../../services/adminService';
import { useToast } from '../../contexts/ToastContext';
import { cn } from '../../lib/utils';

type Tab = 'personal' | 'business';

export default function AdminWaitlistPage() {
  const [tab, setTab] = useState<Tab>('personal');
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchWaitlist(tab).then((res) => {
      if (cancelled) return;
      if (res.error) showToast(res.error, 'error');
      setEntries(res.data);
      setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, [tab, showToast]);

  // Counts for both tabs — fetched separately so the inactive tab badge stays
  // accurate without re-rendering the whole table.
  const [counts, setCounts] = useState({ personal: 0, business: 0 });
  useEffect(() => {
    Promise.all([fetchWaitlist('personal'), fetchWaitlist('business')]).then(([p, b]) => {
      setCounts({ personal: p.data.length, business: b.data.length });
    });
  }, [tab]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) =>
      e.email.toLowerCase().includes(q) ||
      e.name.toLowerCase().includes(q) ||
      (e.business_name?.toLowerCase().includes(q) ?? false) ||
      (e.business_type?.toLowerCase().includes(q) ?? false),
    );
  }, [entries, searchQuery]);

  const handleExport = () => {
    if (filtered.length === 0) return;
    const headers = tab === 'business'
      ? ['Email', 'Contact name', 'Business name', 'Business type', 'Joined']
      : ['Email', 'Name', 'Joined'];
    const rows = filtered.map((e) => tab === 'business'
      ? [e.email, e.name, e.business_name ?? '', e.business_type ?? '', new Date(e.created_at).toISOString()]
      : [e.email, e.name, new Date(e.created_at).toISOString()],
    );
    const csv = [headers, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lincc-waitlist-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background pb-12 max-w-7xl mx-auto">
      <Header showBack />
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text">Waitlist</h1>
            <p className="text-sm text-text-muted mt-1">
              People and businesses who signed up before launch.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={handleExport}
            disabled={filtered.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-border">
          <button
            type="button"
            onClick={() => setTab('personal')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === 'personal'
                ? 'border-coral text-coral'
                : 'border-transparent text-text-muted hover:text-text',
            )}
          >
            <User className="h-4 w-4" />
            Personal
            <Badge size="sm" variant={tab === 'personal' ? 'primary' : 'default'}>
              {counts.personal}
            </Badge>
          </button>
          <button
            type="button"
            onClick={() => setTab('business')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === 'business'
                ? 'border-coral text-coral'
                : 'border-transparent text-text-muted hover:text-text',
            )}
          >
            <Store className="h-4 w-4" />
            Business
            <Badge size="sm" variant={tab === 'business' ? 'primary' : 'default'}>
              {counts.business}
            </Badge>
          </button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tab === 'business' ? 'Search email, name, business…' : 'Search email or name…'}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>

        {/* List */}
        {isLoading ? (
          <ChatListSkeleton />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-text-muted">
            <Mail className="h-12 w-12 mx-auto mb-3 text-text-light" />
            <p className="text-sm">
              {searchQuery ? 'No matches.' : tab === 'business' ? 'No businesses on the waitlist yet.' : 'No personal signups yet.'}
            </p>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-background border-b border-border">
                <tr className="text-left text-xs uppercase tracking-wide text-text-muted">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  {tab === 'business' && (
                    <>
                      <th className="px-4 py-3 font-semibold">Business</th>
                      <th className="px-4 py-3 font-semibold">Type</th>
                    </>
                  )}
                  <th className="px-4 py-3 font-semibold text-right">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-t border-border hover:bg-background/60">
                    <td className="px-4 py-3 font-medium text-text">{e.name || '—'}</td>
                    <td className="px-4 py-3 text-text-muted">
                      <a href={`mailto:${e.email}`} className="hover:text-coral hover:underline">
                        {e.email}
                      </a>
                    </td>
                    {tab === 'business' && (
                      <>
                        <td className="px-4 py-3 text-text">{e.business_name || '—'}</td>
                        <td className="px-4 py-3 text-text-muted">{e.business_type || '—'}</td>
                      </>
                    )}
                    <td className="px-4 py-3 text-right text-text-muted text-xs">
                      {new Date(e.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
