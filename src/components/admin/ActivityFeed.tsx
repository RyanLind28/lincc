import { useState, useEffect } from 'react';
import { Users, Calendar, Flag } from 'lucide-react';
import { ChatListSkeleton } from '../ui';
import { getRecentActivity } from '../../services/adminService';
import { formatRelativeTime } from '../../lib/utils';

interface ActivityItem {
  type: 'user' | 'event' | 'report';
  id: string;
  text: string;
  created_at: string;
  status?: string;
}

const iconMap = {
  user: { icon: Users, color: 'bg-coral/10 text-coral' },
  event: { icon: Calendar, color: 'bg-purple/10 text-purple' },
  report: { icon: Flag, color: 'bg-warning/10 text-warning' },
};

export function ActivityFeed() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getRecentActivity(15).then((data) => {
      setItems(data);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) return <ChatListSkeleton count={5} />;

  if (items.length === 0) {
    return (
      <div className="bg-surface rounded-2xl border border-border p-6 text-center">
        <p className="text-sm text-text-muted">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl border border-border divide-y divide-border">
      <div className="p-3 px-4">
        <h3 className="font-semibold text-text text-sm">Recent Activity</h3>
      </div>
      {items.map((item, i) => {
        const { icon: Icon, color } = iconMap[item.type];
        return (
          <div key={`${item.type}-${item.id}-${i}`} className="p-3 px-4 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text truncate">{item.text}</p>
              <p className="text-xs text-text-light">{formatRelativeTime(item.created_at)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
