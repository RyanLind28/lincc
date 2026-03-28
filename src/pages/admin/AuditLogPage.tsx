import { useState, useEffect } from 'react';
import { Header } from '../../components/layout';
import { ChatListSkeleton } from '../../components/ui';
import { Users, Calendar, Flag, Tag, Shield } from 'lucide-react';
import { fetchAuditLog } from '../../services/adminService';
import { formatRelativeTime } from '../../lib/utils';

interface AuditEntry {
  id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
  admin: { first_name: string } | null;
}

const typeIcons: Record<string, { icon: typeof Users; color: string }> = {
  user: { icon: Users, color: 'bg-coral/10 text-coral' },
  event: { icon: Calendar, color: 'bg-purple/10 text-purple' },
  report: { icon: Flag, color: 'bg-warning/10 text-warning' },
  category: { icon: Tag, color: 'bg-blue/10 text-blue' },
};

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAuditLog().then(({ data }) => {
      setEntries(data as unknown as AuditEntry[]);
      setIsLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header title="Audit Log" showBack />

      <div className="p-4">
        {isLoading ? (
          <ChatListSkeleton count={8} />
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 mt-8">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-text mb-1">No audit entries</h2>
            <p className="text-text-muted text-center text-sm">Admin actions will be logged here.</p>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-border divide-y divide-border">
            {entries.map((entry) => {
              const typeInfo = typeIcons[entry.target_type] || typeIcons.user;
              const Icon = typeInfo.icon;
              return (
                <div key={entry.id} className="p-3.5 flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${typeInfo.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text">
                      <span className="font-medium">{(entry.admin as { first_name: string } | null)?.first_name || 'Admin'}</span>
                      {' '}
                      <span className="text-text-muted">{entry.action.replace(/_/g, ' ')}</span>
                    </p>
                    {entry.details && Object.keys(entry.details).length > 0 && (
                      <p className="text-xs text-text-light mt-0.5 truncate">
                        {JSON.stringify(entry.details).slice(0, 80)}
                      </p>
                    )}
                    <p className="text-xs text-text-light mt-0.5">{formatRelativeTime(entry.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
