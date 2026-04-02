import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/layout';
import { Input, Avatar, Badge, ChatListSkeleton, VoucherTile } from '../components/ui';
import { Search, Store, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getActiveVouchersByBusiness } from '../services/voucherService';
import { BUSINESS_CATEGORIES } from '../types';
import type { VoucherWithDetails } from '../types';

interface BusinessResult {
  id: string;
  first_name: string;
  avatar_url: string | null;
  business_name: string | null;
  business_logo_url: string | null;
  business_category: string | null;
  business_description: string | null;
  business_address: string | null;
}

export default function BusinessDirectoryPage() {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [businesses, setBusinesses] = useState<BusinessResult[]>([]);
  const [vouchers, setVouchers] = useState<Record<string, VoucherWithDetails[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      setIsLoading(true);
      let q = supabase
        .from('profiles')
        .select('id, first_name, avatar_url, business_name, business_logo_url, business_category, business_description, business_address')
        .eq('is_business', true)
        .eq('status', 'active')
        .order('business_name', { ascending: true })
        .limit(30);

      if (query.trim()) {
        const sanitized = query.trim().replace(/[,.()\[\]]/g, '');
        q = q.or(`business_name.ilike.%${sanitized}%,business_description.ilike.%${sanitized}%`);
      }
      if (categoryFilter) {
        q = q.eq('business_category', categoryFilter);
      }

      const { data } = await q;
      const results = (data ?? []) as BusinessResult[];
      setBusinesses(results);

      // Fetch vouchers for each business
      const voucherMap: Record<string, VoucherWithDetails[]> = {};
      await Promise.all(
        results.slice(0, 10).map(async (biz) => {
          const v = await getActiveVouchersByBusiness(biz.id);
          if (v.length > 0) voucherMap[biz.id] = v;
        })
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
                  to={`/user/${biz.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                >
                  <Avatar src={biz.business_logo_url || biz.avatar_url} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-text truncate">{biz.business_name || biz.first_name}</p>
                    </div>
                    {biz.business_category && (
                      <Badge variant="primary" size="sm" className="mt-0.5">{biz.business_category}</Badge>
                    )}
                    {biz.business_description && (
                      <p className="text-sm text-text-muted truncate mt-1">{biz.business_description}</p>
                    )}
                    {biz.business_address && (
                      <p className="text-xs text-text-light flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {biz.business_address}
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
