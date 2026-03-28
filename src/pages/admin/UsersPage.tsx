import { useState, useEffect, useCallback } from 'react';
import { Header } from '../../components/layout';
import { Input, Avatar, Badge, Modal, Button, ChatListSkeleton } from '../../components/ui';
import { Search, Users, Shield, Ban, AlertTriangle, Download, CheckSquare, Square, Flag } from 'lucide-react';
import { fetchAdminUsers, updateUserStatus, updateUserRole, bulkUpdateUserStatus, exportUsersCSV, flagUser, logAdminAction } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatRelativeTime } from '../../lib/utils';

interface AdminUser {
  id: string;
  email: string;
  first_name: string | null;
  avatar_url: string | null;
  gender: string | null;
  role: 'user' | 'admin';
  status: 'active' | 'suspended' | 'banned';
  tags: string[] | null;
  created_at: string;
}

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { showToast } = useToast();
  const { user: authUser } = useAuth();

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === users.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(users.map((u) => u.id)));
    }
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
    const headers = ['id', 'email', 'first_name', 'gender', 'role', 'status', 'is_business', 'created_at'];
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
    const { data } = await fetchAdminUsers(searchQuery);
    setUsers(data as AdminUser[]);
    setIsLoading(false);
  }, [searchQuery]);

  useEffect(() => {
    const timeout = setTimeout(loadUsers, 300);
    return () => clearTimeout(timeout);
  }, [loadUsers]);

  const handleStatusChange = async (userId: string, status: 'active' | 'suspended' | 'banned') => {
    const result = await updateUserStatus(userId, status);
    if (result.success) {
      if (authUser?.id) logAdminAction(authUser.id, `user_${status}`, 'user', userId);
      showToast(`User ${status}`, 'success');
      setSelectedUser(null);
      loadUsers();
    } else {
      showToast(result.error || 'Failed to update', 'error');
    }
  };

  const handleRoleChange = async (userId: string, role: 'user' | 'admin') => {
    const result = await updateUserRole(userId, role);
    if (result.success) {
      if (authUser?.id) logAdminAction(authUser.id, `role_${role}`, 'user', userId);
      showToast(`Role updated to ${role}`, 'success');
      setSelectedUser(null);
      loadUsers();
    } else {
      showToast(result.error || 'Failed to update', 'error');
    }
  };

  const handleFlag = async (userId: string) => {
    const reason = prompt('Flag reason:');
    if (!reason) return;
    const result = await flagUser(userId, reason);
    if (result.success) {
      if (authUser?.id) logAdminAction(authUser.id, 'flag_user', 'user', userId, { reason });
      showToast('User flagged', 'success');
      setSelectedUser(null);
    } else {
      showToast(result.error || 'Failed to flag', 'error');
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'suspended': return 'warning';
      case 'banned': return 'error';
      default: return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header title="User Management" showBack />

      <div className="p-4 space-y-4">
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
              {searchQuery ? 'Try a different search term.' : 'No users have signed up yet.'}
            </p>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-border divide-y divide-border">
            {/* Select all header */}
            <button onClick={toggleSelectAll} className="w-full px-4 py-2 flex items-center gap-2 text-xs text-text-muted hover:text-text">
              {selectedIds.size === users.length ? <CheckSquare className="h-4 w-4 text-coral" /> : <Square className="h-4 w-4" />}
              {selectedIds.size === users.length ? 'Deselect all' : 'Select all'}
            </button>
            {users.map((user) => (
              <div
                key={user.id}
                className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
              >
                <button onClick={() => toggleSelect(user.id)} className="flex-shrink-0">
                  {selectedIds.has(user.id) ? <CheckSquare className="h-5 w-5 text-coral" /> : <Square className="h-5 w-5 text-text-light" />}
                </button>
                <button onClick={() => setSelectedUser(user)} className="flex-1 flex items-center gap-3 text-left min-w-0">
                <Avatar src={user.avatar_url} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-text truncate">{user.first_name || 'No name'}</p>
                    {user.role === 'admin' && (
                      <Badge variant="primary" size="sm">Admin</Badge>
                    )}
                  </div>
                  <p className="text-sm text-text-muted truncate">{user.email}</p>
                </div>
                <Badge variant={statusColor(user.status) as 'success' | 'warning' | 'error' | 'default'} size="sm">
                  {user.status}
                </Badge>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User detail modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="User Details"
        size="sm"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar src={selectedUser.avatar_url} size="lg" />
              <div>
                <p className="font-semibold text-text">{selectedUser.first_name || 'No name'}</p>
                <p className="text-sm text-text-muted">{selectedUser.email}</p>
                <p className="text-xs text-text-light">
                  Joined {formatRelativeTime(selectedUser.created_at)}
                </p>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Badge variant={statusColor(selectedUser.status) as 'success' | 'warning' | 'error' | 'default'}>
                {selectedUser.status}
              </Badge>
              <Badge variant={selectedUser.role === 'admin' ? 'primary' : 'default'}>
                {selectedUser.role}
              </Badge>
              {selectedUser.gender && <Badge variant="default">{selectedUser.gender}</Badge>}
            </div>

            {selectedUser.tags && selectedUser.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {selectedUser.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-text-muted">{tag}</span>
                ))}
              </div>
            )}

            <div className="border-t border-border pt-4 space-y-2">
              <p className="text-sm font-medium text-text">Actions</p>

              <div className="flex gap-2">
                {selectedUser.status !== 'active' && (
                  <Button variant="ghost" size="sm" onClick={() => handleStatusChange(selectedUser.id, 'active')}>
                    Activate
                  </Button>
                )}
                {selectedUser.status !== 'suspended' && (
                  <Button variant="ghost" size="sm" onClick={() => handleStatusChange(selectedUser.id, 'suspended')}>
                    <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                    Suspend
                  </Button>
                )}
                {selectedUser.status !== 'banned' && (
                  <Button variant="danger" size="sm" onClick={() => handleStatusChange(selectedUser.id, 'banned')}>
                    <Ban className="h-3.5 w-3.5 mr-1" />
                    Ban
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleFlag(selectedUser.id)}>
                  <Flag className="h-3.5 w-3.5 mr-1" />
                  Flag
                </Button>
                {selectedUser.role === 'user' ? (
                  <Button variant="ghost" size="sm" onClick={() => handleRoleChange(selectedUser.id, 'admin')}>
                    <Shield className="h-3.5 w-3.5 mr-1" />
                    Make Admin
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => handleRoleChange(selectedUser.id, 'user')}>
                    Remove Admin
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
