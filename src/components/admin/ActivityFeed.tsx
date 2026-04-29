import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, Flag, ChevronLeft, ChevronRight } from 'lucide-react';
import { ChatListSkeleton } from '../ui';
import { getRecentActivity } from '../../services/adminService';
import { formatRelativeTime } from '../../lib/utils';

type ActivityType = 'user' | 'event' | 'report';

interface ActivityItem {
  type: ActivityType;
  id: string;
  text: string;
  created_at: string;
  status?: string;
}

const iconMap: Record<ActivityType, { icon: typeof Users; color: string }> = {
  user: { icon: Users, color: 'bg-coral/10 text-coral' },
  event: { icon: Calendar, color: 'bg-purple/10 text-purple' },
  report: { icon: Flag, color: 'bg-warning/10 text-warning' },
};

function detailHref(item: ActivityItem): string {
  switch (item.type) {
    case 'user': return `/admin/users/${item.id}`;
    case 'event': return `/event/${item.id}`;
    case 'report': return '/admin/reports';
  }
}

interface Props {
  /** Total pool of activity to fetch from the server */
  poolSize?: number;
  /** Items per page in the UI */
  pageSize?: number;
}

export function ActivityFeed({ poolSize = 60, pageSize = 8 }: Props) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    getRecentActivity(poolSize).then((data) => {
      setItems(data);
      setIsLoading(false);
    });
  }, [poolSize]);

  if (isLoading) return <ChatListSkeleton count={5} />;

  if (items.length === 0) {
    return (
      <div className="bg-surface rounded-2xl border border-border p-6 text-center">
        <p className="text-sm text-text-muted">No recent activity</p>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const start = currentPage * pageSize;
  const visible = items.slice(start, start + pageSize);

  return (
    <div className="bg-surface rounded-2xl border border-border">
      <div className="p-3 px-4 flex items-center justify-between border-b border-border">
        <h3 className="font-semibold text-text text-sm">Recent activity</h3>
        <span className="text-xs text-text-muted">{items.length} item{items.length === 1 ? '' : 's'}</span>
      </div>

      <div className="divide-y divide-border">
        {visible.map((item, i) => {
          const { icon: Icon, color } = iconMap[item.type];
          return (
            <Link
              key={`${item.type}-${item.id}-${start + i}`}
              to={detailHref(item)}
              className="p-3 px-4 flex items-center gap-3 hover:bg-background transition-colors group"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text truncate group-hover:text-coral transition-colors">{item.text}</p>
                <p className="text-xs text-text-light">{formatRelativeTime(item.created_at)}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-text-light flex-shrink-0" />
            </Link>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="p-2 px-4 flex items-center justify-between border-t border-border">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-text-muted hover:text-text disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Prev
          </button>
          <span className="text-xs text-text-muted">
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-text-muted hover:text-text disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
