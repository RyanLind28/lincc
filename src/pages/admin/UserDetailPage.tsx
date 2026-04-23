import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '../../components/layout';
import { Avatar, Badge, Button, Card, CardContent, Skeleton } from '../../components/ui';
import {
  Mail, Calendar, Shield, Ban, AlertTriangle, Flag, KeyRound, UserCheck,
  Users as UsersIcon, MessageSquare, FileWarning, Store, ShieldAlert,
} from 'lucide-react';
import {
  getUserDetail, updateUserStatus, updateUserRole, flagUser, unflagUser,
  sendAdminPasswordReset, logAdminAction,
} from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { calculateAge, formatRelativeTime } from '../../lib/utils';

type UserDetail = Awaited<ReturnType<typeof getUserDetail>>;

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { showToast } = useToast();
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    const data = await getUserDetail(id);
    setDetail(data);
    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading || !detail || !detail.profile) {
    return (
      <div className="min-h-screen bg-background pb-8">
        <Header title="User" showBack />
        <div className="p-4 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  const p = detail.profile;
  const age = p.dob ? calculateAge(p.dob) : null;

  const statusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'active': return 'success';
      case 'suspended': return 'warning';
      case 'banned': return 'error';
      default: return 'default';
    }
  };

  const withAction = async (fn: () => Promise<{ success: boolean; error?: string }>, onSuccess: string, action?: string, details?: Record<string, unknown>) => {
    setIsActing(true);
    const res = await fn();
    if (res.success) {
      if (authUser?.id && action) logAdminAction(authUser.id, action, 'user', id, details);
      showToast(onSuccess, 'success');
      await load();
    } else {
      showToast(res.error || 'Action failed', 'error');
    }
    setIsActing(false);
  };

  const handleStatus = (status: 'active' | 'suspended' | 'banned') =>
    withAction(() => updateUserStatus(p.id, status), `User ${status}`, `user_${status}`);

  const handleRole = (role: 'user' | 'admin') =>
    withAction(() => updateUserRole(p.id, role), `Role set to ${role}`, `role_${role}`);

  const handleFlag = () => {
    const reason = prompt('Flag reason:');
    if (!reason) return;
    return withAction(() => flagUser(p.id, reason), 'User flagged', 'flag_user', { reason });
  };

  const handleUnflag = () => withAction(() => unflagUser(p.id), 'Flag cleared', 'unflag_user');

  const handlePasswordReset = () =>
    withAction(() => sendAdminPasswordReset(p.email), `Password reset email sent to ${p.email}`, 'send_password_reset');

  const statCards = [
    { label: 'Events Hosted', value: detail.eventsHosted.total, icon: Calendar, color: 'bg-coral/10 text-coral' },
    { label: 'Events Joined', value: detail.eventsJoined.total, icon: UsersIcon, color: 'bg-purple/10 text-purple' },
    { label: 'Messages Sent', value: detail.messagesTotal, icon: MessageSquare, color: 'bg-blue/10 text-blue' },
    { label: 'Reports Against', value: detail.reportsReceived.total, icon: FileWarning, color: 'bg-warning/10 text-warning' },
  ];

  const isSelf = authUser?.id === p.id;

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header title="User Details" showBack />

      <div className="p-4 space-y-6">
        {/* Profile card */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <div className="flex items-start gap-4">
            <Avatar src={p.avatar_url} name={p.first_name || p.email} size="xl" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-semibold text-text">
                  {p.first_name || 'No name'}{age ? `, ${age}` : ''}
                </h2>
                {p.role === 'admin' && <Badge variant="primary">Admin</Badge>}
                {p.is_business && <Badge variant="default"><Store className="h-3 w-3 inline mr-1" />Business</Badge>}
                {p.is_flagged && <Badge variant="error"><Flag className="h-3 w-3 inline mr-1" />Flagged</Badge>}
              </div>
              <p className="text-sm text-text-muted truncate">{p.email}</p>
              <div className="flex gap-2 flex-wrap mt-2">
                <Badge variant={statusColor(p.status)}>{p.status}</Badge>
                {p.gender && <Badge variant="default">{p.gender}</Badge>}
              </div>
              {p.bio && <p className="text-sm text-text mt-3 leading-snug">{p.bio}</p>}
              {p.tags && p.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-2">
                  {p.tags.map((t: string) => (
                    <span key={t} className="text-xs px-2 py-0.5 bg-background rounded-full text-text-muted">{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Auth meta */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 pt-4 border-t border-border text-xs">
            <div>
              <span className="text-text-muted">Joined:</span>{' '}
              <span className="text-text">{formatRelativeTime(p.created_at)}</span>
            </div>
            <div>
              <span className="text-text-muted">Terms:</span>{' '}
              <span className="text-text">{p.terms_accepted_at ? 'Accepted' : '—'}</span>
            </div>
            <div>
              <span className="text-text-muted">Welcomed:</span>{' '}
              <span className="text-text">{p.welcomed_at ? formatRelativeTime(p.welcomed_at) : '—'}</span>
            </div>
            <div>
              <span className="text-text-muted">Updated:</span>{' '}
              <span className="text-text">{formatRelativeTime(p.updated_at)}</span>
            </div>
            <div>
              <span className="text-text-muted">Followers:</span>{' '}
              <span className="text-text">{detail.followerCount}</span>
            </div>
            <div>
              <span className="text-text-muted">Following:</span>{' '}
              <span className="text-text">{detail.followingCount}</span>
            </div>
          </div>

          {p.is_flagged && p.flag_reason && (
            <div className="mt-3 p-2 bg-warning/10 border border-warning/30 rounded-lg text-sm text-warning">
              <ShieldAlert className="h-4 w-4 inline mr-1" />
              Flag reason: {p.flag_reason}
            </div>
          )}
        </div>

        {/* Activity stats */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((s) => (
            <Card key={s.label} variant="outlined" padding="md">
              <CardContent className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text">{s.value}</p>
                  <p className="text-xs text-text-muted">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Admin actions */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h3 className="font-semibold text-text text-sm mb-3">Admin actions</h3>

          {isSelf && (
            <p className="text-xs text-warning mb-3">
              <AlertTriangle className="h-3.5 w-3.5 inline mr-1" />
              This is your own account — role and status changes are disabled to prevent lockout.
            </p>
          )}

          <div className="space-y-2">
            <div>
              <p className="text-xs text-text-muted mb-1.5">Status</p>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant={p.status === 'active' ? 'primary' : 'ghost'} onClick={() => handleStatus('active')} disabled={isActing || isSelf || p.status === 'active'}>
                  <UserCheck className="h-3.5 w-3.5 mr-1" /> Activate
                </Button>
                <Button size="sm" variant={p.status === 'suspended' ? 'primary' : 'ghost'} onClick={() => handleStatus('suspended')} disabled={isActing || isSelf || p.status === 'suspended'}>
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Suspend
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleStatus('banned')} disabled={isActing || isSelf || p.status === 'banned'}>
                  <Ban className="h-3.5 w-3.5 mr-1" /> Ban
                </Button>
              </div>
            </div>

            <div>
              <p className="text-xs text-text-muted mb-1.5">Role</p>
              <div className="flex gap-2 flex-wrap">
                {p.role === 'user' ? (
                  <Button size="sm" variant="ghost" onClick={() => handleRole('admin')} disabled={isActing}>
                    <Shield className="h-3.5 w-3.5 mr-1" /> Grant admin
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => handleRole('user')} disabled={isActing || isSelf}>
                    <Shield className="h-3.5 w-3.5 mr-1" /> Revoke admin
                  </Button>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs text-text-muted mb-1.5">Moderation</p>
              <div className="flex gap-2 flex-wrap">
                {p.is_flagged ? (
                  <Button size="sm" variant="ghost" onClick={handleUnflag} disabled={isActing}>
                    <Flag className="h-3.5 w-3.5 mr-1" /> Clear flag
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={handleFlag} disabled={isActing}>
                    <Flag className="h-3.5 w-3.5 mr-1" /> Flag
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={handlePasswordReset} disabled={isActing}>
                  <KeyRound className="h-3.5 w-3.5 mr-1" /> Send password reset
                </Button>
                <a
                  href={`mailto:${p.email}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-text-muted hover:text-text transition-colors"
                >
                  <Mail className="h-3.5 w-3.5" /> Email
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Events hosted */}
        <Section title={`Events hosted (${detail.eventsHosted.total})`} empty="No events hosted" items={detail.eventsHosted.items}>
          {(e) => (
            <Link key={e.id} to={`/event/${e.id}`} className="block p-3 border-b border-border last:border-b-0 hover:bg-background transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">{e.title}</p>
                  <p className="text-xs text-text-muted">
                    {e.participant_count}/{e.capacity} joined · {new Date(e.start_time).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="default" size="sm">{e.status}</Badge>
              </div>
            </Link>
          )}
        </Section>

        {/* Events joined */}
        <Section title={`Events joined (${detail.eventsJoined.total})`} empty="No events joined" items={detail.eventsJoined.items}>
          {(ep) => {
            const ev = ep.event;
            if (!ev) return null;
            return (
              <Link key={ep.id} to={`/event/${ev.id}`} className="block p-3 border-b border-border last:border-b-0 hover:bg-background transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{ev.title}</p>
                    <p className="text-xs text-text-muted">{new Date(ev.start_time).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={ep.status === 'approved' ? 'success' : ep.status === 'pending' ? 'warning' : 'default'} size="sm">
                    {ep.status}
                  </Badge>
                </div>
              </Link>
            );
          }}
        </Section>

        {/* Reports against */}
        <Section title={`Reports against user (${detail.reportsReceived.total})`} empty="No reports against this user" items={detail.reportsReceived.items}>
          {(r) => (
            <div key={r.id} className="p-3 border-b border-border last:border-b-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text">{r.reason}</p>
                  <p className="text-xs text-text-muted">
                    by {r.reporter?.first_name || 'Someone'}
                    {r.event?.title ? ` · event "${r.event.title}"` : ''}
                  </p>
                </div>
                <Badge variant={r.status === 'pending' ? 'warning' : 'default'} size="sm">{r.status}</Badge>
              </div>
            </div>
          )}
        </Section>

        {/* Reports filed */}
        <Section title={`Reports filed (${detail.reportsFiled.total})`} empty="No reports filed" items={detail.reportsFiled.items}>
          {(r) => (
            <div key={r.id} className="p-3 border-b border-border last:border-b-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text">{r.reason}</p>
                  <p className="text-xs text-text-muted">
                    against {r.reported?.first_name || 'Someone'}
                    {r.event?.title ? ` · event "${r.event.title}"` : ''}
                  </p>
                </div>
                <Badge variant={r.status === 'pending' ? 'warning' : 'default'} size="sm">{r.status}</Badge>
              </div>
            </div>
          )}
        </Section>

        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/users')}>
            Back to user list
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section<T>({ title, empty, items, children }: {
  title: string;
  empty: string;
  items: T[];
  children: (item: T) => React.ReactNode;
}) {
  return (
    <div className="bg-surface rounded-2xl border border-border">
      <div className="p-3 border-b border-border">
        <h3 className="font-semibold text-text text-sm">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-text-muted py-6 text-center">{empty}</p>
      ) : (
        <div>{items.map(children)}</div>
      )}
    </div>
  );
}
