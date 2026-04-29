import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/layout';
import { Input, Avatar, Badge, Button, ChatListSkeleton } from '../../components/ui';
import { Search, Users, Download, CheckSquare, Square, Flag, ChevronRight, Store } from 'lucide-react';
import { fetchAdminUsers, bulkUpdateUserStatus, exportUsersCSV } from '../../services/adminService';
import { useToast } from '../../contexts/ToastContext';
import { cn } from '../../lib/utils';

interface AdminUser {
  id: string;
  email: string;
  first_name: string | null;
  avatar_url: string | null;
  gender: string | null;
  role: 'user' | 'admin';
  status: 'active' | 'suspended' | 'banned';
  tags: string[] | null;
  is_flagged: boolean;
  account_type: 'personal' | 'business';
  created_at: string;
}

type StatusFilter = 'all' | 'active' | 'suspended' | 'banned';
type RoleFilter = 'all' | 'user' | 'admin';

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { showToast } = useToast();

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.size === users.length ? new Set() : new Set(users.map((u) => u.id)));
  };

  const handleBulkAction = async (status: 'active' | 'suspended' | 'banned') => {
    if (selectedIds.size === 0) return;
    const result = await bulkUpdateUserStatus(Array.from(selectedIds), status);
    if (result.success) {
      showToast(`${selectedIds.size} users updated to ${status}`, 'success');
      setSelectedIds(new Set());
      loadUsers();
    } else {
      showToast(result.error || 'Failed to update', 'error');
    }
  };

  const handleExport = async () => {
    const data = await exportUsersCSV();
    const headers = ['id', 'email', 'first_name', 'gender', 'role', 'status', 'account_type', 'created_at'];
    const csv = [
      headers.join(','),
      ...data.map((row: Record<string, unknown>) => headers.map((h) => `"${row[h] ?? ''}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lincc-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Users exported', 'success');
  };

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    const { data } = await fetchAdminUsers(searchQuery, {
      status: statusFilter === 'all' ? undefined : statusFilter,
      role: roleFilter === 'all' ? undefined : roleFilter,
      flagged: flaggedOnly || undefined,
    });
    setUsers(data as AdminUser[]);
    setIsLoading(false);
  }, [searchQuery, statusFilter, roleFilter, flaggedOnly]);

  useEffect(() => {
    const timeout = setTimeout(loadUsers, 300);
    return () => clearTimeout(timeout);
  }, [loadUsers]);

  const statusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'active': return 'success';
      case 'suspended': return 'warning';
      case 'banned': return 'error';
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
      <Header title="User Management" showBack />

      <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
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

        {/* Filter pills */}
        <div className="space-y-2">
          <div className="flex gap-1.5 flex-wrap">
            <span className="text-[11px] text-text-muted self-center mr-1">Status:</span>
            <Pill active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>All</Pill>
            <Pill active={statusFilter === 'active'} onClick={() => setStatusFilter('active')}>Active</Pill>
            <Pill active={statusFilter === 'suspended'} onClick={() => setStatusFilter('suspended')}>Suspended</Pill>
            <Pill active={statusFilter === 'banned'} onClick={() => setStatusFilter('banned')}>Banned</Pill>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <span className="text-[11px] text-text-muted self-center mr-1">Role:</span>
            <Pill active={roleFilter === 'all'} onClick={() => setRoleFilter('all')}>All</Pill>
            <Pill active={roleFilter === 'user'} onClick={() => setRoleFilter('user')}>Users</Pill>
            <Pill active={roleFilter === 'admin'} onClick={() => setRoleFilter('admin')}>Admins</Pill>
            <Pill active={flaggedOnly} onClick={() => setFlaggedOnly(!flaggedOnly)}>
              <Flag className="h-3 w-3 inline mr-0.5" />Flagged
            </Pill>
          </div>
        </div>

        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 p-3 bg-coral/5 border border-coral/20 rounded-xl">
            <span className="text-sm font-medium text-text">{selectedIds.size} selected</span>
            <div className="flex-1" />
            <Button variant="ghost" size="sm" onClick={() => handleBulkAction('active')}>Activate</Button>
            <Button variant="ghost" size="sm" onClick={() => handleBulkAction('suspended')}>Suspend</Button>
            <Button variant="danger" size="sm" onClick={() => handleBulkAction('banned')}>Ban</Button>
            <button onClick={() => setSelectedIds(new Set())} className="text-xs text-text-muted hover:text-text ml-1">Clear</button>
          </div>
        )}

        {isLoading ? (
          <ChatListSkeleton count={6} />
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 mt-8">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-text mb-1">No users found</h2>
            <p className="text-text-muted text-center text-sm">
              {searchQuery ? 'Try a different search term.' : 'No users match the current filters.'}
            </p>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-border divide-y divide-border">
            <button onClick={toggleSelectAll} className="w-full px-4 py-2 flex items-center gap-2 text-xs text-text-muted hover:text-text">
              {selectedIds.size === users.length ? <CheckSquare className="h-4 w-4 text-coral" /> : <Square className="h-4 w-4" />}
              {selectedIds.size === users.length ? 'Deselect all' : 'Select all'}
            </button>
            {users.map((user) => (
              <div key={user.id} className="p-4 flex items-center gap-3 hover:bg-background transition-colors">
                <button onClick={() => toggleSelect(user.id)} className="flex-shrink-0">
                  {selectedIds.has(user.id) ? <CheckSquare className="h-5 w-5 text-coral" /> : <Square className="h-5 w-5 text-text-light" />}
                </button>
                <Link to={`/admin/users/${user.id}`} className="flex-1 flex items-center gap-3 min-w-0">
                  <Avatar src={user.avatar_url} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-text truncate">{user.first_name || 'No name'}</p>
                      {user.role === 'admin' && <Badge variant="primary" size="sm">Admin</Badge>}
                      {user.account_type === 'business' && <Badge variant="default" size="sm"><Store className="h-3 w-3 inline mr-0.5" />Business</Badge>}
                      {user.is_flagged && <Badge variant="error" size="sm"><Flag className="h-3 w-3 inline mr-0.5" />Flagged</Badge>}
                    </div>
                    <p className="text-sm text-text-muted truncate">{user.email}</p>
                  </div>
                  <Badge variant={statusColor(user.status)} size="sm">{user.status}</Badge>
                  <ChevronRight className="h-4 w-4 text-text-light flex-shrink-0" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
