import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/layout';
import {
  Input,
  GradientButton,
  Select,
  VoucherCard,
  VoucherCardSkeleton,
} from '../components/ui';
import { Search, Tag, Store, Settings, Sparkles, Flame, Percent, Gift } from 'lucide-react';
import { getActiveVouchers } from '../services/voucherService';
import { BUSINESS_CATEGORIES } from '../types';
import type { VoucherWithDetails } from '../types';

type QuickFilter = 'all' | 'ending-soon' | 'new' | 'biggest' | 'free';
type SortKey = 'expiring' | 'discount' | 'newest';

const QUICK_FILTERS: Array<{ id: QuickFilter; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'all', label: 'All', icon: Tag },
  { id: 'ending-soon', label: 'Ending soon', icon: Flame },
  { id: 'new', label: 'New', icon: Sparkles },
  { id: 'biggest', label: 'Biggest savings', icon: Percent },
  { id: 'free', label: 'Free', icon: Gift },
];

const SORT_OPTIONS = [
  { value: 'expiring', label: 'Expiring soonest' },
  { value: 'discount', label: 'Biggest discount' },
  { value: 'newest', label: 'Newest first' },
];

function savingsPct(v: VoucherWithDetails): number {
  const o = v.original_price;
  const d = v.discounted_price;
  if (!o || o <= 0 || d == null || d >= o) return 0;
  return Math.round(((o - d) / o) * 100);
}

function hoursUntilExpiry(v: VoucherWithDetails): number {
  return (new Date(v.expires_at).getTime() - Date.now()) / 3_600_000;
}

export default function VouchersPage() {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('expiring');
  const [vouchers, setVouchers] = useState<VoucherWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getActiveVouchers().then((data) => {
      if (!cancelled) {
        setVouchers(data);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Filter pipeline
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vouchers.filter((v) => {
      if (categoryFilter && v.business?.category !== categoryFilter) return false;

      if (quickFilter === 'ending-soon' && hoursUntilExpiry(v) > 24) return false;
      if (quickFilter === 'new' && (Date.now() - new Date(v.created_at).getTime()) > 3 * 86_400_000) return false;
      if (quickFilter === 'biggest' && savingsPct(v) < 30) return false;
      if (quickFilter === 'free' && v.discounted_price !== 0) return false;

      if (q) {
        return (
          v.title.toLowerCase().includes(q) ||
          v.business?.name?.toLowerCase().includes(q) ||
          v.venue_name?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [vouchers, query, categoryFilter, quickFilter]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sortKey === 'expiring') {
      arr.sort((a, b) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime());
    } else if (sortKey === 'discount') {
      arr.sort((a, b) => savingsPct(b) - savingsPct(a));
    } else if (sortKey === 'newest') {
      arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return arr;
  }, [filtered, sortKey]);

  // Featured: top two by savings, only when nothing is filtered and we have enough variety.
  const isUnfiltered = !query.trim() && !categoryFilter && quickFilter === 'all';
  const featured = useMemo<VoucherWithDetails[]>(() => {
    if (!isUnfiltered || vouchers.length < 5) return [];
    return [...vouchers]
      .sort((a, b) => savingsPct(b) - savingsPct(a))
      .filter((v) => savingsPct(v) >= 20)
      .slice(0, 2);
  }, [vouchers, isUnfiltered]);

  const featuredIds = new Set(featured.map((v) => v.id));
  const grid = featured.length > 0 ? sorted.filter((v) => !featuredIds.has(v.id)) : sorted;

  const counts = useMemo(() => {
    const now = Date.now();
    return {
      'all': vouchers.length,
      'ending-soon': vouchers.filter((v) => hoursUntilExpiry(v) <= 24).length,
      'new': vouchers.filter((v) => now - new Date(v.created_at).getTime() <= 3 * 86_400_000).length,
      'biggest': vouchers.filter((v) => savingsPct(v) >= 30).length,
      'free': vouchers.filter((v) => v.discounted_price === 0).length,
    };
  }, [vouchers]);

  const hasFilters = !!query.trim() || !!categoryFilter || quickFilter !== 'all';

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header
        rightContent={
          <Link
            to="/settings"
            className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-background transition-colors"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </Link>
        }
      />

      <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
        {/* Hero header */}
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-text">Vouchers</h1>
            <p className="text-sm text-text-muted mt-1">Local deals and offers near you</p>
          </div>
          <Link
            to="/businesses"
            className="inline-flex items-center gap-2 text-sm font-medium text-coral hover:underline"
          >
            <Store className="h-4 w-4" /> Browse businesses
          </Link>
        </div>

        {/* Search */}
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search vouchers, businesses, or venues..."
          leftIcon={<Search className="h-4 w-4" />}
        />

        {/* Quick filter chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
          {QUICK_FILTERS.map((qf) => {
            const active = quickFilter === qf.id;
            const count = counts[qf.id];
            const Icon = qf.icon;
            return (
              <button
                key={qf.id}
                onClick={() => setQuickFilter(qf.id)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  active
                    ? 'gradient-primary text-white'
                    : 'bg-surface border border-border text-text hover:border-coral/40'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {qf.label}
                {count > 0 && (
                  <span
                    className={`tabular-nums text-[11px] ${active ? 'text-white/80' : 'text-text-muted'}`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sort + category dropdowns */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[180px]">
            <Select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              options={SORT_OPTIONS}
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { value: '', label: 'All categories' },
                ...BUSINESS_CATEGORIES.map((c) => ({ value: c, label: c })),
              ]}
            />
          </div>
        </div>

        {/* Featured hero */}
        {!isLoading && featured.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
              Top deals right now
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {featured.map((v) => (
                <VoucherCard key={v.id} voucher={v} variant="featured" />
              ))}
            </div>
          </section>
        )}

        {/* Results count */}
        {!isLoading && (
          <p className="text-xs text-text-muted">
            {sorted.length} {sorted.length === 1 ? 'voucher' : 'vouchers'}
            {hasFilters && ' matching your filters'}
          </p>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <VoucherCardSkeleton key={i} />
            ))}
          </div>
        ) : grid.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {grid.map((voucher) => (
              <VoucherCard key={voucher.id} voucher={voucher} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mb-4">
              <Tag className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-text mb-2">
              {hasFilters ? 'No matching vouchers' : 'No vouchers yet'}
            </h2>
            <p className="text-sm text-text-muted max-w-xs mb-5">
              {hasFilters
                ? 'Try a different search, category, or filter chip.'
                : 'Check back soon — local businesses are adding offers all the time.'}
            </p>
            {hasFilters && (
              <GradientButton
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery('');
                  setCategoryFilter('');
                  setQuickFilter('all');
                }}
              >
                Clear filters
              </GradientButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
