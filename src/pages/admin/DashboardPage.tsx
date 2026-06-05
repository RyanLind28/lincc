import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/layout';
import { Card, CardContent, Skeleton } from '../../components/ui';
import {
  Users, Calendar, Flag, Tag, Shield, Megaphone, Zap,
  UserPlus, Handshake, MessageSquare, Ticket, Building2, Gift, Store, Image as ImageIcon,
  ClipboardList, MessageSquareWarning, Bell,
} from 'lucide-react';
import {
  getAdminStats, getDashboardMetrics, getAdminActionCounts,
  getTopHosts, getTopCategories, getTopBusinesses,
} from '../../services/adminService';
import { ActivityChart } from '../../components/admin/ActivityChart';
import { EngagementChart } from '../../components/admin/EngagementChart';
import { ActivityFeed } from '../../components/admin/ActivityFeed';
import { DateRangePicker } from '../../components/admin/DateRangePicker';
import { TopList } from '../../components/admin/TopList';
import { SystemStatus } from '../../components/admin/SystemStatus';

type CountKey = 'flaggedUsers' | 'flaggedEvents' | 'pendingApplications' | 'pendingVerifications' | 'pendingReports';

const menuItems: Array<{
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  countKey?: CountKey;
}> = [
  { to: '/admin/waitlist', label: 'Waitlist', icon: ClipboardList, description: 'Personal & business signups before launch' },
  { to: '/admin/users', label: 'User Management', icon: Users, description: 'View and manage users', countKey: 'flaggedUsers' },
  { to: '/admin/events', label: 'Event Management', icon: Calendar, description: 'View and manage events', countKey: 'flaggedEvents' },
  { to: '/admin/businesses', label: 'Business Management', icon: Store, description: 'View and manage businesses' },
  { to: '/admin/business-applications', label: 'Business Applications', icon: Store, description: 'Approve or reject pending business signups', countKey: 'pendingApplications' },
  { to: '/admin/reports', label: 'Report Queue', icon: Flag, description: 'Review user reports', countKey: 'pendingReports' },
  { to: '/admin/feedback', label: 'User Feedback', icon: MessageSquareWarning, description: 'Bug reports & problem reports from users' },
  { to: '/admin/categories', label: 'Categories', icon: Tag, description: 'Manage event categories' },
  { to: '/admin/images', label: 'Images', icon: ImageIcon, description: 'Browse and remove uploaded images' },
  { to: '/admin/announcements', label: 'Announcements', icon: Megaphone, description: 'In-app banner broadcast' },
  { to: '/admin/push', label: 'Push Notifications', icon: Bell, description: 'Send push to users, businesses, or both' },
  { to: '/admin/feature-flags', label: 'Feature Flags', icon: Zap, description: 'Toggle features on/off' },
  { to: '/admin/audit-log', label: 'Audit Log', icon: Shield, description: 'View admin action history' },
];

type TopItem = { id: string; label: string; count: number; avatar?: string | null };

export default function AdminDashboard() {
  const [days, setDays] = useState(14);
  const [stats, setStats] = useState({ totalUsers: 0, activeEvents: 0, pendingReports: 0, totalCategories: 0 });
  const [metrics, setMetrics] = useState<{
    newUsers: number; newEvents: number; joinRequests: number; approvedJoins: number;
    messages: number; newVouchers: number; redemptions: number; newBusinesses: number; newReports: number;
  } | null>(null);
  const [topHosts, setTopHosts] = useState<TopItem[]>([]);
  const [topCategories, setTopCategories] = useState<TopItem[]>([]);
  const [topBusinesses, setTopBusinesses] = useState<TopItem[]>([]);
  const [actionCounts, setActionCounts] = useState<Record<CountKey, number>>({
    flaggedUsers: 0, flaggedEvents: 0, pendingApplications: 0, pendingVerifications: 0, pendingReports: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [isLoadingTops, setIsLoadingTops] = useState(true);

  // Totals — load once, not dependent on range
  useEffect(() => {
    getAdminStats().then((data) => {
      setStats(data);
      setIsLoadingStats(false);
    });
    getAdminActionCounts().then(setActionCounts);
  }, []);

  // Range-dependent metrics + top lists — reload on range change
  useEffect(() => {
    setIsLoadingMetrics(true);
    setIsLoadingTops(true);

    getDashboardMetrics(days).then((d) => {
      setMetrics(d);
      setIsLoadingMetrics(false);
    });

    Promise.all([
      getTopHosts(days, 5),
      getTopCategories(days, 5),
      getTopBusinesses(days, 5),
    ]).then(([hosts, cats, bizs]) => {
      setTopHosts(hosts.map((h) => ({ id: h.id, label: h.name, count: h.count, avatar: h.avatar })));
      setTopCategories(cats.map((c) => ({ id: c.id, label: c.name, count: c.count })));
      setTopBusinesses(bizs.map((b) => ({ id: b.id, label: b.name, count: b.count, avatar: b.logo })));
      setIsLoadingTops(false);
    });
  }, [days]);

  const totalCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-coral/10 text-coral' },
    { label: 'Active Events', value: stats.activeEvents, icon: Calendar, color: 'bg-success/10 text-success' },
    { label: 'Pending Reports', value: stats.pendingReports, icon: Flag, color: 'bg-warning/10 text-warning' },
    { label: 'Categories', value: stats.totalCategories, icon: Tag, color: 'bg-purple/10 text-purple' },
  ];

  const metricCards = [
    { label: 'New Users', value: metrics?.newUsers ?? 0, icon: UserPlus, color: 'bg-coral/10 text-coral' },
    { label: 'New Events', value: metrics?.newEvents ?? 0, icon: Calendar, color: 'bg-success/10 text-success' },
    { label: 'Join Requests', value: metrics?.joinRequests ?? 0, icon: Handshake, color: 'bg-blue/10 text-blue' },
    { label: 'Approved Joins', value: metrics?.approvedJoins ?? 0, icon: Handshake, color: 'bg-purple/10 text-purple' },
    { label: 'Messages', value: metrics?.messages ?? 0, icon: MessageSquare, color: 'bg-blue/10 text-blue' },
    { label: 'Vouchers Redeemed', value: metrics?.redemptions ?? 0, icon: Gift, color: 'bg-coral/10 text-coral' },
    { label: 'New Vouchers', value: metrics?.newVouchers ?? 0, icon: Ticket, color: 'bg-purple/10 text-purple' },
    { label: 'New Businesses', value: metrics?.newBusinesses ?? 0, icon: Building2, color: 'bg-success/10 text-success' },
  ];

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header title="Admin Dashboard" showBack />

      <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
        {/* System status — top of page so issues are unmissable */}
        <SystemStatus />

        {/* Totals (all-time) — 4 columns on desktop */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">All Time</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {totalCards.map((stat) => (
              <Card key={stat.label} variant="outlined" padding="md">
                <CardContent className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    {isLoadingStats ? (
                      <Skeleton className="h-7 w-10 mb-1" />
                    ) : (
                      <p className="text-2xl font-bold text-text">{stat.value}</p>
                    )}
                    <p className="text-xs text-text-muted">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Range picker + range-scoped metrics — 4 columns on desktop */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Last {days} Days</h2>
            <DateRangePicker value={days} onChange={setDays} />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {metricCards.map((stat) => (
              <Card key={stat.label} variant="outlined" padding="md">
                <CardContent className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    {isLoadingMetrics ? (
                      <Skeleton className="h-7 w-10 mb-1" />
                    ) : (
                      <p className="text-2xl font-bold text-text">{stat.value}</p>
                    )}
                    <p className="text-xs text-text-muted">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Charts — side-by-side on desktop */}
        <div className="grid lg:grid-cols-2 gap-4">
          <ActivityChart days={days} />
          <EngagementChart days={days} />
        </div>

        {/* Top lists + activity feed — three columns on desktop */}
        <div className="grid lg:grid-cols-3 gap-4">
          <TopList
            title={`Top Hosts (last ${days} days)`}
            items={topHosts}
            isLoading={isLoadingTops}
            countSuffix=" events"
            emptyText="No events created yet"
          />
          <TopList
            title={`Top Categories by Joins (last ${days} days)`}
            items={topCategories}
            isLoading={isLoadingTops}
            countSuffix=" joins"
            emptyText="No joins yet"
          />
          <TopList
            title={`Top Businesses by Redemptions (last ${days} days)`}
            items={topBusinesses}
            isLoading={isLoadingTops}
            countSuffix=" redeemed"
            emptyText="No redemptions yet"
          />
        </div>

        {/* Quick manage — full set of admin tools */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">Manage</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {menuItems.map((item) => {
              const count = item.countKey ? actionCounts[item.countKey] : 0;
              const showBadge = count > 0;
              const extraBadge = item.to === '/admin/business-applications' && actionCounts.pendingVerifications > 0
                ? actionCounts.pendingVerifications
                : 0;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group relative bg-surface rounded-2xl border border-border p-4 hover:border-coral/40 hover:shadow-md transition-all flex flex-col gap-2"
                >
                  {showBadge && (
                    <span className="absolute top-3 right-3 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold text-white bg-coral rounded-full">
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text text-sm group-hover:text-coral transition-colors">{item.label}</h3>
                    <p className="text-xs text-text-muted line-clamp-2 mt-0.5">{item.description}</p>
                    {extraBadge > 0 && (
                      <p className="text-[11px] font-medium text-warning mt-1">
                        +{extraBadge} verification{extraBadge === 1 ? '' : 's'} to review
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Recent activity */}
        <ActivityFeed />
      </div>
    </div>
  );
}
