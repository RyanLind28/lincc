import { useState, useEffect } from 'react';
import { Header } from '../components/layout';
import { Input, Badge, ChatListSkeleton, VoucherTile } from '../components/ui';
import { Search, Store, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getActiveBusinesses } from '../services/businessService';
import { getActiveVouchersForBusinesses } from '../services/voucherService';
import { BUSINESS_CATEGORIES } from '../types';
import type { Business, VoucherWithDetails } from '../types';

export default function BusinessDirectoryPage() {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [vouchers, setVouchers] = useState<Record<string, VoucherWithDetails[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      setIsLoading(true);
      const results = await getActiveBusinesses(query.trim() || undefined, categoryFilter || undefined);
      setBusinesses(results);

      // Single batched query for vouchers across all visible businesses
      const voucherMap = await getActiveVouchersForBusinesses(
        results.slice(0, 10).map((b) => b.id),
      );
      setVouchers(voucherMap);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, categoryFilter]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header showBack />

      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold text-text">Businesses</h1>

        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search businesses..."
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
              onClick={() => setCategoryFilter(cat === categoryFilter ? '' : cat)}
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

        {isLoading ? (
          <ChatListSkeleton count={5} />
        ) : businesses.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-text mb-1">No businesses found</h2>
            <p className="text-sm text-text-muted text-center">
              {query || categoryFilter ? 'Try different filters.' : 'No businesses registered yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {businesses.map((biz) => (
              <div key={biz.id} className="bg-surface rounded-2xl border border-border overflow-hidden">
                <Link
                  to={`/business/${biz.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-background transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-background overflow-hidden flex-shrink-0">
                    {biz.logo_url ? (
                      <img src={biz.logo_url} alt={biz.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full gradient-primary flex items-center justify-center text-white font-bold text-lg">
                        {biz.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text truncate">{biz.name}</p>
                    <Badge variant="primary" className="mt-0.5">{biz.category}</Badge>
                    {biz.description && (
                      <p className="text-sm text-text-muted truncate mt-1">{biz.description}</p>
                    )}
                    {biz.address && (
                      <p className="text-xs text-text-light flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {biz.address}
                      </p>
                    )}
                  </div>
                </Link>

                {/* Vouchers for this business */}
                {vouchers[biz.id] && vouchers[biz.id].length > 0 && (
                  <div className="px-4 pb-4">
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
                      {vouchers[biz.id].map((v) => (
                        <VoucherTile key={v.id} voucher={v} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
