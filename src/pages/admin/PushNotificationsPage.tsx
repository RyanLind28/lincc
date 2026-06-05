import { useState, useEffect } from 'react';
import { Header } from '../../components/layout';
import { GradientButton, Input, TextArea, Modal, Skeleton } from '../../components/ui';
import { Bell, Users, Store, Send, Smartphone, Megaphone } from 'lucide-react';
import {
  getPushStats,
  broadcastPushNotification,
  logAdminAction,
  type PushStats,
  type BroadcastAudience,
} from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { cn } from '../../lib/utils';

const AUDIENCES: Array<{ key: BroadcastAudience; label: string; hint: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: 'users', label: 'Users', hint: 'Personal accounts', icon: Users },
  { key: 'businesses', label: 'Businesses', hint: 'Business accounts', icon: Store },
  { key: 'all', label: 'Everyone', hint: 'Users + businesses', icon: Megaphone },
];

function StatCard({ icon: Icon, label, value, sub }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-4">
      <div className="flex items-center gap-2 text-text-muted mb-2">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-text">{value}</p>
      {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

export default function PushNotificationsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [stats, setStats] = useState<PushStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const [audience, setAudience] = useState<BroadcastAudience>('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const loadStats = async () => {
    setIsLoadingStats(true);
    const { data } = await getPushStats();
    setStats(data);
    setIsLoadingStats(false);
  };

  useEffect(() => { loadStats(); }, []);

  const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

  // How many people this broadcast would reach in-app, and how many of those
  // also have push enabled (the rest still get the in-app notification).
  const reachLabel = (() => {
    if (!stats) return '';
    switch (audience) {
      case 'users':
        return `${stats.total_active_personal} users (${stats.subscribed_personal} with push)`;
      case 'businesses':
        return `${stats.total_active_business} businesses (${stats.subscribed_business} with push)`;
      case 'all':
        return `${stats.total_active_personal + stats.total_active_business} accounts (${stats.subscribed_users} with push)`;
    }
  })();

  const canSend = title.trim().length > 0 && body.trim().length > 0;

  const handleSend = async () => {
    if (!canSend) return;
    setIsSending(true);
    const link = url.trim();
    const result = await broadcastPushNotification(
      audience,
      title.trim(),
      body.trim(),
      link.startsWith('/') ? link : null,
    );
    setIsSending(false);
    setShowConfirm(false);

    if (result.success) {
      showToast(`Sent to ${result.recipients} recipient${result.recipients === 1 ? '' : 's'}`, 'success');
      if (user?.id) {
        logAdminAction(user.id, 'broadcast_push', 'broadcast', undefined, {
          audience,
          title: title.trim(),
          recipients: result.recipients,
        });
      }
      setTitle('');
      setBody('');
      setUrl('');
    } else {
      showToast(result.error || 'Failed to send', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header title="Push Notifications" showBack />

      <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
        {/* Subscription stats */}
        <section>
          <h2 className="text-section-label mb-3">Subscriptions</h2>
          {isLoadingStats ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                icon={Bell}
                label="Subscribed"
                value={String(stats.subscribed_users)}
                sub={`${pct(stats.subscribed_users, stats.total_active_personal + stats.total_active_business)}% of all accounts`}
              />
              <StatCard
                icon={Users}
                label="Users"
                value={`${stats.subscribed_personal}/${stats.total_active_personal}`}
                sub={`${pct(stats.subscribed_personal, stats.total_active_personal)}% with push`}
              />
              <StatCard
                icon={Store}
                label="Businesses"
                value={`${stats.subscribed_business}/${stats.total_active_business}`}
                sub={`${pct(stats.subscribed_business, stats.total_active_business)}% with push`}
              />
              <StatCard
                icon={Smartphone}
                label="Devices"
                value={String(stats.total_devices)}
                sub="across all users"
              />
            </div>
          ) : (
            <p className="text-sm text-text-muted">Couldn't load stats.</p>
          )}
        </section>

        {/* Compose */}
        <section className="bg-surface rounded-2xl border border-border p-4 lg:p-6 space-y-4">
          <h2 className="text-section-label">Send a notification</h2>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Audience</label>
            <div className="grid grid-cols-3 gap-2">
              {AUDIENCES.map((a) => {
                const Icon = a.icon;
                const active = audience === a.key;
                return (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => setAudience(a.key)}
                    className={cn(
                      'flex flex-col items-center gap-1 py-3 rounded-xl border text-center transition-colors press-effect',
                      active
                        ? 'gradient-primary text-white border-transparent'
                        : 'bg-surface text-text border-border hover:border-coral',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-semibold">{a.label}</span>
                    <span className={cn('text-[10px]', active ? 'text-white/80' : 'text-text-muted')}>{a.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's new on Lincc"
            maxLength={80}
          />
          <TextArea
            label="Message"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Keep it short and clear."
            rows={3}
            maxLength={200}
          />
          <Input
            label="Link (optional)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/explore"
            helperText="An in-app path opened when tapped, e.g. /vouchers. Leave blank for home."
          />

          {reachLabel && (
            <p className="text-xs text-text-muted">
              Reaches <span className="font-semibold text-text">{reachLabel}</span>. Everyone gets it in-app; those with push enabled also get a device notification.
            </p>
          )}

          <GradientButton
            fullWidth
            onClick={() => setShowConfirm(true)}
            disabled={!canSend}
            leftIcon={<Send className="h-4 w-4" />}
          >
            Send notification
          </GradientButton>
        </section>
      </div>

      <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)} title="Send this notification?" size="sm">
        <div className="space-y-4">
          <div className="bg-background rounded-xl border border-border p-3">
            <p className="font-semibold text-text text-sm">{title || 'Untitled'}</p>
            <p className="text-sm text-text-muted mt-0.5">{body}</p>
          </div>
          <p className="text-sm text-text-muted">
            This will notify <span className="font-semibold text-text">{reachLabel}</span>. This can't be undone.
          </p>
          <div className="flex gap-2">
            <GradientButton fullWidth onClick={handleSend} isLoading={isSending}>
              Send now
            </GradientButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
