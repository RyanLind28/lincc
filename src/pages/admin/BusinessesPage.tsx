import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/layout';
import { Input, Avatar, Badge, ChatListSkeleton } from '../../components/ui';
import { Search, Store, Download, ChevronRight } from 'lucide-react';
import { fetchAdminBusinesses, exportBusinessesCSV } from '../../services/adminService';
import { useToast } from '../../contexts/ToastContext';
import { cn } from '../../lib/utils';

interface AdminBusiness {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  category: string;
  address: string | null;
  status: string;
  owner_id: string;
  created_at: string;
  owner: { first_name: string | null; email: string; avatar_url: string | null } | null;
}

type StatusFilter = 'all' | 'active' | 'suspended';

export default function AdminBusinessesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setIsLoading(true);
    const { data } = await fetchAdminBusinesses(searchQuery, {
      status: statusFilter === 'all' ? undefined : statusFilter,
    });
    setBusinesses(data as unknown as AdminBusiness[]);
    setIsLoading(false);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
  }, [load]);

  const handleExport = async () => {
    const data = await exportBusinessesCSV();
    const headers = ['id', 'name', 'slug', 'category', 'address', 'status', 'owner_id', 'created_at'];
    const csv = [
      headers.join(','),
      ...data.map((row: Record<string, unknown>) => headers.map((h) => `"${row[h] ?? ''}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lincc-businesses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Businesses exported', 'success');
  };

  const statusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'active': return 'success';
      case 'suspended': return 'warning';
      default: return 'default';
    }
  };

  const Pill = ({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
        active ? 'gradient-primary text-white border-transparent' : 'bg-surface text-text-muted border-border hover:text-text'
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header title="Business Management" showBack />

      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or category..."
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <button
            onClick={handleExport}
            className="p-2.5 rounded-xl border border-border bg-surface text-text-muted hover:text-text transition-colors"
            title="Export CSV"
          >
            <Download className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          <span className="text-[11px] text-text-muted self-center mr-1">Status:</span>
          <Pill active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>All</Pill>
          <Pill active={statusFilter === 'active'} onClick={() => setStatusFilter('active')}>Active</Pill>
          <Pill active={statusFilter === 'suspended'} onClick={() => setStatusFilter('suspended')}>Suspended</Pill>
        </div>

        {isLoading ? (
          <ChatListSkeleton count={6} />
        ) : businesses.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 mt-8">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-text mb-1">No businesses found</h2>
            <p className="text-text-muted text-center text-sm">
              {searchQuery ? 'Try a different search term.' : 'No businesses match the current filter.'}
            </p>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-border divide-y divide-border">
            {businesses.map((b) => (
              <Link
                key={b.id}
                to={`/admin/businesses/${b.id}`}
                className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
              >
                <Avatar src={b.logo_url} name={b.name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-text truncate">{b.name}</p>
                    <Badge variant={statusColor(b.status)} size="sm">{b.status}</Badge>
                  </div>
                  <p className="text-sm text-text-muted truncate">
                    {b.category}
                    {b.owner?.first_name ? ` · owned by ${b.owner.first_name}` : ''}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-text-light flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
