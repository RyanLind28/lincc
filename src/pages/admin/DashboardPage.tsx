import { Link } from 'react-router-dom';
import { Header } from '../../components/layout';
import { Card, CardContent } from '../../components/ui';
import { Users, Calendar, Flag, Tag, ChevronRight } from 'lucide-react';

const stats = [
  { label: 'Total Users', value: '0', icon: Users, color: 'text-primary' },
  { label: 'Active Events', value: '0', icon: Calendar, color: 'text-success' },
  { label: 'Pending Reports', value: '0', icon: Flag, color: 'text-warning' },
  { label: 'Categories', value: '21', icon: Tag, color: 'text-secondary' },
];

const menuItems = [
  { to: '/admin/users', label: 'User Management', icon: Users, description: 'View and manage users' },
  { to: '/admin/events', label: 'Event Management', icon: Calendar, description: 'View and manage events' },
  { to: '/admin/reports', label: 'Report Queue', icon: Flag, description: 'Review user reports' },
  { to: '/admin/categories', label: 'Categories', icon: Tag, description: 'Manage event categories' },
];

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-background pb-8">
      <Header title="Admin Dashboard" showBack />

      <div className="p-4 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <Card key={stat.label} variant="outlined" padding="md">
              <CardContent className="flex items-center gap-3">
                <div className={`w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text">{stat.value}</p>
                  <p className="text-xs text-text-muted">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Menu */}
        <div className="bg-surface rounded-xl border border-border divide-y divide-border">
          {menuItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <item.icon className="h-5 w-5 text-primary" />
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
