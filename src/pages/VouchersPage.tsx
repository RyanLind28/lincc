import { useEffect, useState } from 'react';
import { Header } from '../components/layout';
import { Input, VoucherTile, GradientButton } from '../components/ui';
import { Search, Tag, Store, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getActiveVouchers } from '../services/voucherService';
import { BUSINESS_CATEGORIES } from '../types';
import type { VoucherWithDetails } from '../types';

export default function VouchersPage() {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
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

  const filtered = vouchers.filter((v) => {
    if (categoryFilter && v.business?.category !== categoryFilter) return false;
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (
      v.title.toLowerCase().includes(q) ||
      v.business?.name?.toLowerCase().includes(q) ||
      v.venue_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-background pb-24 max-w-3xl mx-auto">
      <Header rightContent={<Link to="/settings" className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-background transition-colors" aria-label="Settings"><Settings className="h-5 w-5" /></Link>} />

      <div className="p-4 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Vouchers</h1>
          <p className="text-sm text-text-muted mt-1">Local deals and offers near you</p>
        </div>

        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search vouchers or businesses..."
          leftIcon={<Search className="h-4 w-4" />}
        />

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
          <button
            onClick={() => setCategoryFilter('')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
              !categoryFilter
                ? 'gradient-primary text-white'
                : 'bg-surface border border-border text-text-muted'
            }`}
          >
            All
          </button>
          {BUSINESS_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                categoryFilter === cat
                  ? 'gradient-primary text-white'
                  : 'bg-surface border border-border text-text-muted'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Browse all businesses link */}
        <Link
          to="/businesses"
          className="flex items-center gap-3 p-3 bg-surface rounded-2xl border border-border hover:border-coral/50 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
            <Store className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-text group-hover:text-coral transition-colors">Browse businesses</p>
            <p className="text-xs text-text-muted">See all local businesses on Lincc</p>
          </div>
        </Link>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-surface rounded-2xl border border-border overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((voucher) => (
              <VoucherTile key={voucher.id} voucher={voucher} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mb-4">
              <Tag className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-text mb-2">
              {query || categoryFilter ? 'No matching vouchers' : 'No vouchers yet'}
            </h2>
            <p className="text-sm text-text-muted max-w-xs mb-5">
              {query || categoryFilter
                ? 'Try a different search or category filter.'
                : 'Check back soon — local businesses are adding offers all the time.'}
            </p>
            {(query || categoryFilter) && (
              <GradientButton
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery('');
                  setCategoryFilter('');
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
