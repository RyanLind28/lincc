import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/layout';
import { Card, CardContent, Skeleton } from '../../components/ui';
import {
  Users, Calendar, Flag, Tag, ChevronRight, Shield, Megaphone, Zap,
  UserPlus, Handshake, MessageSquare, Ticket, Building2, Gift, Store,
} from 'lucide-react';
import {
  getAdminStats, getDashboardMetrics,
  getTopHosts, getTopCategories, getTopBusinesses,
} from '../../services/adminService';
import { ActivityChart } from '../../components/admin/ActivityChart';
import { EngagementChart } from '../../components/admin/EngagementChart';
import { ActivityFeed } from '../../components/admin/ActivityFeed';
import { DateRangePicker } from '../../components/admin/DateRangePicker';
import { TopList } from '../../components/admin/TopList';

const menuItems = [
  { to: '/admin/users', label: 'User Management', icon: Users, description: 'View and manage users' },
  { to: '/admin/events', label: 'Event Management', icon: Calendar, description: 'View and manage events' },
  { to: '/admin/businesses', label: 'Business Management', icon: Store, description: 'View and manage businesses' },
  { to: '/admin/reports', label: 'Report Queue', icon: Flag, description: 'Review user reports' },
  { to: '/admin/categories', label: 'Categories', icon: Tag, description: 'Manage event categories' },
  { to: '/admin/announcements', label: 'Announcements', icon: Megaphone, description: 'Broadcast to all users' },
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
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [isLoadingTops, setIsLoadingTops] = useState(true);

  // Totals — load once, not dependent on range
  useEffect(() => {
    getAdminStats().then((data) => {
      setStats(data);
      setIsLoadingStats(false);
    });
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
    { label: 'Active Events', value: stats.activeEvents, icon: Calendar, color: 'bg-green-500/10 text-green-500' },
    { label: 'Pending Reports', value: stats.pendingReports, icon: Flag, color: 'bg-warning/10 text-warning' },
    { label: 'Categories', value: stats.totalCategories, icon: Tag, color: 'bg-purple/10 text-purple' },
  ];

  const metricCards = [
    { label: 'New Users', value: metrics?.newUsers ?? 0, icon: UserPlus, color: 'bg-coral/10 text-coral' },
    { label: 'New Events', value: metrics?.newEvents ?? 0, icon: Calendar, color: 'bg-green-500/10 text-green-500' },
    { label: 'Join Requests', value: metrics?.joinRequests ?? 0, icon: Handshake, color: 'bg-blue/10 text-blue' },
    { label: 'Approved Joins', value: metrics?.approvedJoins ?? 0, icon: Handshake, color: 'bg-purple/10 text-purple' },
    { label: 'Messages', value: metrics?.messages ?? 0, icon: MessageSquare, color: 'bg-blue/10 text-blue' },
    { label: 'Vouchers Redeemed', value: metrics?.redemptions ?? 0, icon: Gift, color: 'bg-coral/10 text-coral' },
    { label: 'New Vouchers', value: metrics?.newVouchers ?? 0, icon: Ticket, color: 'bg-purple/10 text-purple' },
    { label: 'New Businesses', value: metrics?.newBusinesses ?? 0, icon: Building2, color: 'bg-green-500/10 text-green-500' },
  ];

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header title="Admin Dashboard" showBack />

      <div className="p-4 space-y-6">
        {/* Totals (all-time) */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">All Time</h2>
          <div className="grid grid-cols-2 gap-3">
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

        {/* Range picker + range-scoped metrics */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Last {days} Days</h2>
            <DateRangePicker value={days} onChange={setDays} />
          </div>
          <div className="grid grid-cols-2 gap-3">
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

        {/* Charts */}
        <div className="space-y-4">
          <ActivityChart days={days} />
          <EngagementChart days={days} />
        </div>

        {/* Top-N lists */}
        <div className="space-y-4">
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

        {/* Recent activity feed */}
        <ActivityFeed />

        {/* Menu */}
        <div className="bg-surface rounded-2xl border border-border divide-y divide-border">
          {menuItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-coral/10 rounded-xl flex items-center justify-center">
                <item.icon className="h-5 w-5 text-coral" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-text">{item.label}</h3>
                <p className="text-sm text-text-muted">{item.description}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-text-muted" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
