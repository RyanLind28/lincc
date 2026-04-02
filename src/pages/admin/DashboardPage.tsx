import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/layout';
import { Card, CardContent, Skeleton } from '../../components/ui';
import { Users, Calendar, Flag, Tag, ChevronRight, Shield, Megaphone, Zap } from 'lucide-react';
import { getAdminStats } from '../../services/adminService';
import { ActivityChart } from '../../components/admin/ActivityChart';
import { ActivityFeed } from '../../components/admin/ActivityFeed';

const menuItems = [
  { to: '/admin/users', label: 'User Management', icon: Users, description: 'View and manage users' },
  { to: '/admin/events', label: 'Event Management', icon: Calendar, description: 'View and manage events' },
  { to: '/admin/reports', label: 'Report Queue', icon: Flag, description: 'Review user reports' },
  { to: '/admin/categories', label: 'Categories', icon: Tag, description: 'Manage event categories' },
  { to: '/admin/announcements', label: 'Announcements', icon: Megaphone, description: 'Broadcast to all users' },
  { to: '/admin/feature-flags', label: 'Feature Flags', icon: Zap, description: 'Toggle features on/off' },
  { to: '/admin/audit-log', label: 'Audit Log', icon: Shield, description: 'View admin action history' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, activeEvents: 0, pendingReports: 0, totalCategories: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAdminStats().then((data) => {
      setStats(data);
      setIsLoading(false);
    });
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-coral/10 text-coral' },
    { label: 'Active Events', value: stats.activeEvents, icon: Calendar, color: 'bg-green-500/10 text-green-500' },
    { label: 'Pending Reports', value: stats.pendingReports, icon: Flag, color: 'bg-warning/10 text-warning' },
    { label: 'Categories', value: stats.totalCategories, icon: Tag, color: 'bg-purple/10 text-purple' },
  ];

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header title="Admin Dashboard" showBack />

      <div className="p-4 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((stat) => (
            <Card key={stat.label} variant="outlined" padding="md">
              <CardContent className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  {isLoading ? (
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

        {/* Activity chart */}
        <ActivityChart days={14} />

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
