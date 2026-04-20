import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '../../components/layout';
import { Avatar, Badge, Button, Card, CardContent, Skeleton } from '../../components/ui';
import {
  Store, MapPin, Ticket, Gift, Calendar, UserCheck, AlertTriangle, ExternalLink, User,
} from 'lucide-react';
import { getBusinessDetail, updateBusinessStatus, logAdminAction } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatRelativeTime } from '../../lib/utils';

type BusinessDetail = Awaited<ReturnType<typeof getBusinessDetail>>;

export default function AdminBusinessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user: authUser } = useAuth();
  const { showToast } = useToast();
  const [detail, setDetail] = useState<BusinessDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    const data = await getBusinessDetail(id);
    setDetail(data);
    setIsLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (isLoading || !detail || !detail.business) {
    return (
      <div className="min-h-screen bg-background pb-8">
        <Header title="Business" showBack />
        <div className="p-4 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  const b = detail.business;

  const statusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'active': return 'success';
      case 'suspended': return 'warning';
      default: return 'default';
    }
  };

  const handleStatus = async (status: 'active' | 'suspended') => {
    setIsActing(true);
    const res = await updateBusinessStatus(b.id, status);
    if (res.success) {
      if (authUser?.id) logAdminAction(authUser.id, `business_${status}`, 'event', b.id);
      showToast(`Business ${status}`, 'success');
      await load();
    } else {
      showToast(res.error || 'Action failed', 'error');
    }
    setIsActing(false);
  };

  const statCards = [
    { label: 'Vouchers', value: detail.vouchers.total, icon: Ticket, color: 'bg-coral/10 text-coral' },
    { label: 'Redemptions', value: detail.redemptions.total, icon: Gift, color: 'bg-purple/10 text-purple' },
    { label: 'Events', value: detail.events.total, icon: Calendar, color: 'bg-green-500/10 text-green-500' },
  ];

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header title="Business Details" showBack />

      <div className="p-4 space-y-6">
        {/* Business card */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <div className="flex items-start gap-4">
            <Avatar src={b.logo_url} name={b.name} size="xl" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-semibold text-text">{b.name}</h2>
                <Badge variant={statusColor(b.status)}>{b.status}</Badge>
              </div>
              <p className="text-sm text-text-muted">
                <Store className="h-3.5 w-3.5 inline mr-1" />{b.category}
              </p>
              {b.address && (
                <p className="text-sm text-text-muted mt-1">
                  <MapPin className="h-3.5 w-3.5 inline mr-1" />{b.address}
                </p>
              )}
              {b.description && <p className="text-sm text-text mt-3 leading-snug">{b.description}</p>}
            </div>
          </div>

          {/* Owner & meta */}
          <div className="mt-4 pt-4 border-t border-border">
            {b.owner && (
              <Link
                to={`/admin/users/${b.owner.id}`}
                className="flex items-center gap-2 text-sm text-text hover:text-coral transition-colors mb-2"
              >
                <User className="h-4 w-4" />
                Owner: <span className="font-medium">{b.owner.first_name || b.owner.email}</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div>
                <span className="text-text-muted">Created:</span>{' '}
                <span className="text-text">{formatRelativeTime(b.created_at)}</span>
              </div>
              <div>
                <span className="text-text-muted">Updated:</span>{' '}
                <span className="text-text">{formatRelativeTime(b.updated_at)}</span>
              </div>
              {b.slug && (
                <div className="col-span-2">
                  <span className="text-text-muted">Slug:</span>{' '}
                  <span className="text-text font-mono">{b.slug}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-3">
          {statCards.map((s) => (
            <Card key={s.label} variant="outlined" padding="md">
              <CardContent className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.color}`}>
                  <s.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xl font-bold text-text">{s.value}</p>
                  <p className="text-[11px] text-text-muted">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Admin actions */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h3 className="font-semibold text-text text-sm mb-3">Admin actions</h3>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant={b.status === 'active' ? 'primary' : 'ghost'} onClick={() => handleStatus('active')} disabled={isActing || b.status === 'active'}>
              <UserCheck className="h-3.5 w-3.5 mr-1" /> Activate
            </Button>
            <Button size="sm" variant="danger" onClick={() => handleStatus('suspended')} disabled={isActing || b.status === 'suspended'}>
              <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Suspend
            </Button>
            <Link
              to={`/business/${b.id}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-text-muted hover:text-text transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View public page
            </Link>
          </div>
        </div>

        {/* Vouchers */}
        <Section title={`Vouchers (${detail.vouchers.total})`} empty="No vouchers created" items={detail.vouchers.items}>
          {(v) => (
            <Link key={v.id} to={`/voucher/${v.id}`} className="block p-3 border-b border-border last:border-b-0 hover:bg-background transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">{v.title}</p>
                  <p className="text-xs text-text-muted">
                    {v.discount_text} · {v.redemption_count}/{v.redemption_limit ?? '∞'} redeemed
                  </p>
                </div>
                <Badge variant={v.status === 'active' ? 'success' : 'default'} size="sm">{v.status}</Badge>
              </div>
            </Link>
          )}
        </Section>

        {/* Recent redemptions */}
        <Section title={`Recent redemptions (${detail.redemptions.total})`} empty="No redemptions yet" items={detail.redemptions.items}>
          {(r) => (
            <div key={r.id} className="p-3 border-b border-border last:border-b-0 flex items-center gap-3">
              <Avatar src={r.user?.avatar_url} name={r.user?.first_name || 'User'} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text truncate">
                  <span className="font-medium">{r.user?.first_name || 'Someone'}</span>
                  {' redeemed '}
                  <span className="text-text-muted">{r.voucher?.title}</span>
                </p>
                <p className="text-xs text-text-muted">{formatRelativeTime(r.redeemed_at)}</p>
              </div>
            </div>
          )}
        </Section>

        {/* Events */}
        <Section title={`Events (${detail.events.total})`} empty="No events linked" items={detail.events.items}>
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
