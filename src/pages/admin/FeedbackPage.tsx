import { useCallback, useEffect, useState } from 'react';
import { Header } from '../../components/layout';
import { TextArea } from '../../components/ui';
import { useToast } from '../../contexts/ToastContext';
import {
  fetchAdminFeedback,
  updateFeedbackStatus,
  type AdminFeedbackRow,
} from '../../services/feedbackService';
import { Bug, LifeBuoy, MessageSquare, Lightbulb, ChevronDown, ChevronUp, Inbox } from 'lucide-react';

const STATUS_TABS: { value: string; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'closed', label: 'Closed' },
  { value: '', label: 'All' },
];

const TYPE_META: Record<string, { label: string; icon: typeof Bug; color: string }> = {
  bug: { label: 'Bug', icon: Bug, color: 'text-error bg-error/10' },
  support: { label: 'Stuck', icon: LifeBuoy, color: 'text-warning bg-warning/10' },
  feedback: { label: 'Feedback', icon: MessageSquare, color: 'text-coral bg-coral/10' },
  feature_request: { label: 'Feature', icon: Lightbulb, color: 'text-purple bg-purple/10' },
};

function typeMeta(type: string) {
  return TYPE_META[type] ?? TYPE_META.feedback;
}

export default function AdminFeedbackPage() {
  const { showToast } = useToast();
  const [statusFilter, setStatusFilter] = useState('open');
  const [rows, setRows] = useState<AdminFeedbackRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const { data } = await fetchAdminFeedback(statusFilter, '');
    setRows(data);
    setIsLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const saveStatus = async (row: AdminFeedbackRow, status: string) => {
    setSavingId(row.id);
    const notes = notesById[row.id] ?? row.admin_notes ?? '';
    const { success, error } = await updateFeedbackStatus(row.id, status, notes);
    setSavingId(null);
    if (success) {
      showToast(`Marked ${status}`, 'success');
      load();
    } else {
      showToast(error || 'Update failed', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-3xl mx-auto">
      <Header title="User Feedback" showBack />

      <div className="p-4 lg:p-6 space-y-4">
        {/* Status filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value || 'all'}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 h-9 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === tab.value
                  ? 'gradient-primary text-white'
                  : 'bg-surface text-text-muted border border-border hover:text-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-surface rounded-2xl border border-border animate-pulse" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16">
            <Inbox className="h-10 w-10 text-text-light mx-auto mb-3" />
            <p className="text-text-muted">No feedback here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => {
              const meta = typeMeta(row.type);
              const Icon = meta.icon;
              const isExpanded = expanded === row.id;
              const notes = notesById[row.id] ?? row.admin_notes ?? '';
              return (
                <div key={row.id} className="bg-surface rounded-2xl border border-border overflow-hidden">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : row.id)}
                    className="w-full flex items-start gap-3 p-4 text-left"
                  >
                    <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold shrink-0 ${meta.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                      {meta.label}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-text truncate">{row.subject}</p>
                      <p className="text-xs text-text-muted truncate">
                        {row.user?.first_name || 'Unknown'} ·{' '}
                        {row.created_at ? new Date(row.created_at).toLocaleString('en-GB') : ''}
                      </p>
                    </div>
                    <span className="text-[10px] font-medium uppercase text-text-muted shrink-0 mt-1">{row.status}</span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-text-muted shrink-0 mt-1" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-text-muted shrink-0 mt-1" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                      <p className="text-sm text-text whitespace-pre-wrap">{row.body}</p>

                      {row.context && (
                        <div className="bg-background rounded-xl p-3 text-xs text-text-muted space-y-0.5">
                          <p className="font-semibold text-text mb-1">Context</p>
                          {row.context.source && <p>Source: {row.context.source}</p>}
                          {row.context.url && <p className="break-all">URL: {row.context.url}</p>}
                          <p>
                            {row.context.browser} {row.context.browserVersion} · {row.context.os} ·{' '}
                            {row.context.deviceClass}
                            {row.context.standalone ? ' · PWA' : ''}
                          </p>
                          {row.context.viewport && <p>Viewport: {row.context.viewport}</p>}
                          {row.context.sentryEventId && (
                            <p className="break-all">Sentry: {row.context.sentryEventId}</p>
                          )}
                          <p className="break-all opacity-70">{row.context.userAgent}</p>
                        </div>
                      )}

                      <TextArea
                        label="Admin notes"
                        value={notes}
                        onChange={(e) => setNotesById((m) => ({ ...m, [row.id]: e.target.value }))}
                        placeholder="Internal notes (optional)"
                        rows={2}
                      />

                      <div className="flex flex-wrap gap-2">
                        {['open', 'reviewed', 'closed']
                          .filter((s) => s !== row.status)
                          .map((s) => (
                            <button
                              key={s}
                              type="button"
                              disabled={savingId === row.id}
                              onClick={() => saveStatus(row, s)}
                              className="px-3 h-9 rounded-xl border border-border bg-background text-sm font-medium text-text hover:border-coral hover:text-coral disabled:opacity-50 capitalize"
                            >
                              Mark {s}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
