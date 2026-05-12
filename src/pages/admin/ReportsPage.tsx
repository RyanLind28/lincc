import { useState, useEffect, useCallback } from 'react';
import { Header } from '../../components/layout';
import { Avatar, Badge, Modal, Button, TextArea, ChatListSkeleton, Input } from '../../components/ui';
import { Flag, CheckCircle, XCircle, AlertTriangle, Download, Star, MessageSquareWarning, UserX, Ban, UserMinus, CalendarX, Trash2, StarOff } from 'lucide-react';
import { fetchAdminReports, updateReportStatus, exportReportsCSV } from '../../services/adminService';
import {
  warnUser, suspendUser, banUser,
  deleteEventMessage, deleteDirectMessage,
  removeParticipant, cancelEvent,
  deleteHostReview, deleteGuestReview,
} from '../../services/moderationService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatRelativeTime } from '../../lib/utils';

interface AdminHostReview {
  id: string;
  host_rating: number;
  event_rating: number;
  comment: string | null;
  host_reply: string | null;
  host_replied_at: string | null;
  dispute_reason: string | null;
}

interface AdminGuestReview {
  id: string;
  guest_rating: number;
  comment: string | null;
  guest_reply: string | null;
  guest_replied_at: string | null;
  dispute_reason: string | null;
}

interface AdminReportMessage {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
}

interface AdminReportDMMessage {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  conversation_id: string;
}

interface AdminReport {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  host_review_id: string | null;
  guest_review_id: string | null;
  message_id: string | null;
  dm_message_id: string | null;
  reporter: { id: string; first_name: string; avatar_url: string | null } | null;
  reported: { id: string; first_name: string; avatar_url: string | null } | null;
  event: { id: string; title: string } | null;
  host_review: AdminHostReview | null;
  guest_review: AdminGuestReview | null;
  message: AdminReportMessage | null;
  dm_message: AdminReportDMMessage | null;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'dismissed', label: 'Dismissed' },
  { value: 'actioned', label: 'Actioned' },
];

const REASON_OPTIONS = [
  { value: '', label: 'All reasons' },
  { value: 'review_dispute', label: 'Review disputes' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'inappropriate', label: 'Inappropriate' },
  { value: 'spam', label: 'Spam' },
  { value: 'hate', label: 'Hate / threats' },
  { value: 'safety', label: 'Safety' },
];

type ModAction =
  | 'warn'
  | 'suspend'
  | 'ban'
  | 'delete_message'
  | 'remove_participant'
  | 'cancel_event'
  | 'delete_review';

function ActionButton({
  icon: Icon, label, onClick, tone = 'default',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  tone?: 'default' | 'danger';
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
        tone === 'danger'
          ? 'border-error/30 text-error hover:bg-error/5'
          : 'border-border text-text hover:border-coral hover:text-coral'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

const ACTION_LABELS: Record<ModAction, { title: string; needsReason: boolean; needsDuration?: boolean }> = {
  warn:               { title: 'Send warning', needsReason: true },
  suspend:            { title: 'Suspend user', needsReason: true, needsDuration: true },
  ban:                { title: 'Ban user permanently', needsReason: true },
  delete_message:     { title: 'Delete message', needsReason: false },
  remove_participant: { title: 'Remove from event', needsReason: false },
  cancel_event:       { title: 'Cancel event', needsReason: true },
  delete_review:      { title: 'Delete review', needsReason: true },
};

export default function AdminReportsPage() {
  const [statusFilter, setStatusFilter] = useState('pending');
  const [reasonFilter, setReasonFilter] = useState('');
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [pendingAction, setPendingAction] = useState<ModAction | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [suspendDays, setSuspendDays] = useState('7');
  const [isActing, setIsActing] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    const { data } = await fetchAdminReports(statusFilter, 0, 20, reasonFilter);
    setReports(data as unknown as AdminReport[]);
    setIsLoading(false);
  }, [statusFilter, reasonFilter]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleExport = async () => {
    const data = await exportReportsCSV();
    const headers = ['id', 'reason', 'details', 'status', 'admin_notes', 'created_at', 'reviewed_at'];
    const csv = [
      headers.join(','),
      ...data.map((row: Record<string, unknown>) => headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lincc-reports-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Reports exported', 'success');
  };

  const handleAction = async (reportId: string, status: 'reviewed' | 'dismissed' | 'actioned') => {
    if (!user?.id) return;
    const result = await updateReportStatus(reportId, status, adminNotes, user.id);
    if (result.success) {
      showToast(`Report ${status}`, 'success');
      setSelectedReport(null);
      setAdminNotes('');
      loadReports();
    } else {
      showToast(result.error || 'Failed to update', 'error');
    }
  };

  const closeActionConfirm = () => {
    setPendingAction(null);
    setActionReason('');
    setSuspendDays('7');
  };

  const runModerationAction = async () => {
    if (!user?.id || !selectedReport || !pendingAction) return;
    const reportedId = selectedReport.reported?.id;
    if (!reportedId && pendingAction !== 'cancel_event' && pendingAction !== 'delete_message') {
      showToast('Reported user not available', 'error');
      return;
    }
    setIsActing(true);
    try {
      let res: { success: boolean; error?: string } = { success: false };
      switch (pendingAction) {
        case 'warn':
          res = await warnUser(reportedId!, user.id, actionReason);
          break;
        case 'suspend':
          res = await suspendUser(reportedId!, user.id, actionReason, parseInt(suspendDays || '7', 10));
          break;
        case 'ban':
          res = await banUser(reportedId!, user.id, actionReason);
          break;
        case 'delete_message':
          if (selectedReport.message_id) {
            res = await deleteEventMessage(selectedReport.message_id, user.id);
          } else if (selectedReport.dm_message_id) {
            res = await deleteDirectMessage(selectedReport.dm_message_id, user.id);
          } else {
            res = { success: false, error: 'No message linked to this report' };
          }
          break;
        case 'remove_participant':
          if (selectedReport.event && reportedId) {
            res = await removeParticipant(selectedReport.event.id, reportedId, user.id);
          } else {
            res = { success: false, error: 'No event linked to this report' };
          }
          break;
        case 'cancel_event':
          if (selectedReport.event) {
            res = await cancelEvent(selectedReport.event.id, user.id, actionReason);
          } else {
            res = { success: false, error: 'No event linked to this report' };
          }
          break;
        case 'delete_review':
          if (selectedReport.host_review_id) {
            res = await deleteHostReview(selectedReport.host_review_id, user.id, actionReason);
          } else if (selectedReport.guest_review_id) {
            res = await deleteGuestReview(selectedReport.guest_review_id, user.id, actionReason);
          } else {
            res = { success: false, error: 'No review linked to this report' };
          }
          break;
      }
      if (!res.success) {
        showToast(res.error || 'Action failed', 'error');
        setIsActing(false);
        return;
      }
      // Mark the report as actioned and close
      await updateReportStatus(selectedReport.id, 'actioned', adminNotes || actionReason, user.id);
      showToast('Action applied', 'success');
      closeActionConfirm();
      setSelectedReport(null);
      setAdminNotes('');
      loadReports();
    } finally {
      setIsActing(false);
    }
  };

  const statusColor = (status: string): 'warning' | 'success' | 'default' | 'error' => {
    switch (status) {
      case 'pending': return 'warning';
      case 'reviewed': return 'success';
      case 'dismissed': return 'default';
      case 'actioned': return 'error';
      default: return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header
        title="Report Queue"
        showBack
        rightContent={
          <button
            onClick={handleExport}
            className="p-2 rounded-xl text-text-muted hover:text-text transition-colors"
            title="Export CSV"
          >
            <Download className="h-5 w-5" />
          </button>
        }
      />

      <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === opt.value
                  ? 'gradient-primary text-white'
                  : 'bg-surface border border-border text-text-muted hover:text-text'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {REASON_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setReasonFilter(opt.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                reasonFilter === opt.value
                  ? 'bg-coral text-white'
                  : 'bg-surface border border-border text-text-muted hover:text-text'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <ChatListSkeleton count={4} />
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 mt-8">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
              <Flag className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-lg font-semibold text-text mb-1">No reports</h2>
            <p className="text-text-muted text-center text-sm">
              {statusFilter === 'pending' ? 'No pending reports to review.' : 'No reports match this filter.'}
            </p>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-border divide-y divide-border">
            {reports.map((report) => (
              <button
                key={report.id}
                onClick={() => { setSelectedReport(report); setAdminNotes(report.admin_notes || ''); }}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-background transition-colors"
              >
                <div className="w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Flag className="h-5 w-5 text-warning" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text capitalize">{report.reason.replace(/_/g, ' ')}</p>
                  <p className="text-sm text-text-muted truncate">
                    {report.reported?.first_name || 'Unknown user'}
                    {report.event && ` — ${report.event.title}`}
                  </p>
                  <p className="text-xs text-text-light">{formatRelativeTime(report.created_at)}</p>
                </div>
                <Badge variant={statusColor(report.status)} size="sm">
                  {report.status}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={!!selectedReport}
        onClose={() => { setSelectedReport(null); setAdminNotes(''); }}
        title="Report Details"
        size="sm"
      >
        {selectedReport && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-text-muted mb-1">Reason</p>
              <p className="font-medium text-text capitalize">{selectedReport.reason.replace(/_/g, ' ')}</p>
              {selectedReport.details && (
                <p className="text-sm text-text-muted mt-1">{selectedReport.details}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-text-light mb-1">Reporter</p>
                <div className="flex items-center gap-2">
                  <Avatar src={selectedReport.reporter?.avatar_url ?? null} size="sm" />
                  <span className="text-sm text-text">{selectedReport.reporter?.first_name || 'Unknown'}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-text-light mb-1">Reported User</p>
                <div className="flex items-center gap-2">
                  <Avatar src={selectedReport.reported?.avatar_url ?? null} size="sm" />
                  <span className="text-sm text-text">{selectedReport.reported?.first_name || 'Unknown'}</span>
                </div>
              </div>
            </div>

            {selectedReport.event && (
              <div>
                <p className="text-xs text-text-light mb-1">Related Event</p>
                <p className="text-sm text-text">{selectedReport.event.title}</p>
              </div>
            )}

            {selectedReport.host_review && (
              <div className="bg-background rounded-xl border border-border p-3 space-y-2">
                <p className="text-xs font-medium text-text-light">Disputed host review</p>
                <div className="flex items-center gap-3 flex-wrap text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    Host
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i <= selectedReport.host_review!.host_rating ? 'fill-warning text-warning' : 'text-gray-200'}`}
                      />
                    ))}
                  </span>
                  <span className="flex items-center gap-1">
                    Event
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i <= selectedReport.host_review!.event_rating ? 'fill-warning text-warning' : 'text-gray-200'}`}
                      />
                    ))}
                  </span>
                </div>
                {selectedReport.host_review.comment && (
                  <p className="text-sm text-text">{selectedReport.host_review.comment}</p>
                )}
                {selectedReport.host_review.host_reply && (
                  <div className="pl-3 border-l-2 border-coral/40">
                    <p className="text-xs font-medium text-coral mb-0.5">Host reply</p>
                    <p className="text-sm text-text-muted">{selectedReport.host_review.host_reply}</p>
                  </div>
                )}
                {selectedReport.host_review.dispute_reason && (
                  <div>
                    <p className="text-xs font-medium text-warning mb-0.5">Dispute reason</p>
                    <p className="text-sm text-text-muted">{selectedReport.host_review.dispute_reason}</p>
                  </div>
                )}
              </div>
            )}

            {selectedReport.guest_review && (
              <div className="bg-background rounded-xl border border-border p-3 space-y-2">
                <p className="text-xs font-medium text-text-light">Disputed guest review</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i <= selectedReport.guest_review!.guest_rating ? 'fill-warning text-warning' : 'text-gray-200'}`}
                    />
                  ))}
                </div>
                {selectedReport.guest_review.comment && (
                  <p className="text-sm text-text">{selectedReport.guest_review.comment}</p>
                )}
                {selectedReport.guest_review.guest_reply && (
                  <div className="pl-3 border-l-2 border-purple/40">
                    <p className="text-xs font-medium text-purple mb-0.5">Guest reply</p>
                    <p className="text-sm text-text-muted">{selectedReport.guest_review.guest_reply}</p>
                  </div>
                )}
                {selectedReport.guest_review.dispute_reason && (
                  <div>
                    <p className="text-xs font-medium text-warning mb-0.5">Dispute reason</p>
                    <p className="text-sm text-text-muted">{selectedReport.guest_review.dispute_reason}</p>
                  </div>
                )}
              </div>
            )}

            {selectedReport.message && (
              <div className="bg-background rounded-xl border border-border p-3 space-y-2">
                <p className="text-xs font-medium text-text-light">Reported event-chat message</p>
                <div className="bg-surface border border-border rounded-lg p-3">
                  <p className="text-sm text-text whitespace-pre-wrap break-words">{selectedReport.message.content}</p>
                  <p className="text-[11px] text-text-light mt-1">{new Date(selectedReport.message.created_at).toLocaleString()}</p>
                </div>
                {selectedReport.event && (
                  <a
                    href={`/event/${selectedReport.event.id}/chat`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-coral font-medium"
                  >
                    Open thread →
                  </a>
                )}
              </div>
            )}

            {selectedReport.dm_message && (
              <div className="bg-background rounded-xl border border-border p-3 space-y-2">
                <p className="text-xs font-medium text-text-light">Reported direct message</p>
                <div className="bg-surface border border-border rounded-lg p-3">
                  <p className="text-sm text-text whitespace-pre-wrap break-words">{selectedReport.dm_message.content}</p>
                  <p className="text-[11px] text-text-light mt-1">{new Date(selectedReport.dm_message.created_at).toLocaleString()}</p>
                </div>
                <a
                  href={`/dm/${selectedReport.dm_message.conversation_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-coral font-medium"
                >
                  Open conversation →
                </a>
              </div>
            )}

            <Badge variant={statusColor(selectedReport.status)}>
              {selectedReport.status}
            </Badge>

            <TextArea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add admin notes..."
              rows={3}
            />

            {selectedReport.status === 'pending' && (
              <div className="space-y-3">
                <div className="bg-background border border-border rounded-xl p-3 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Moderation actions</p>
                  <div className="grid grid-cols-2 gap-2">
                    <ActionButton icon={MessageSquareWarning} label="Warn user" onClick={() => setPendingAction('warn')} />
                    <ActionButton icon={UserX} label="Suspend user" onClick={() => setPendingAction('suspend')} />
                    <ActionButton icon={Ban} label="Ban user" tone="danger" onClick={() => setPendingAction('ban')} />
                    {(selectedReport.message_id || selectedReport.dm_message_id) && (
                      <ActionButton icon={Trash2} label="Delete message" tone="danger" onClick={() => setPendingAction('delete_message')} />
                    )}
                    {(selectedReport.host_review_id || selectedReport.guest_review_id) && (
                      <ActionButton icon={StarOff} label="Delete review" tone="danger" onClick={() => setPendingAction('delete_review')} />
                    )}
                    {selectedReport.event && (
                      <>
                        <ActionButton icon={UserMinus} label="Remove from event" onClick={() => setPendingAction('remove_participant')} />
                        <ActionButton icon={CalendarX} label="Cancel event" tone="danger" onClick={() => setPendingAction('cancel_event')} />
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => handleAction(selectedReport.id, 'dismissed')}>
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Dismiss
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => handleAction(selectedReport.id, 'reviewed')}>
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    Mark reviewed
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => handleAction(selectedReport.id, 'actioned')}>
                    <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                    Mark actioned
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Action confirmation modal */}
      <Modal
        isOpen={!!pendingAction}
        onClose={closeActionConfirm}
        title={pendingAction ? ACTION_LABELS[pendingAction].title : ''}
        size="sm"
      >
        {pendingAction && (
          <div className="space-y-3">
            {pendingAction === 'ban' && (
              <p className="text-sm text-error font-medium">This permanently bans the account. They lose access immediately.</p>
            )}
            {pendingAction === 'cancel_event' && (
              <p className="text-sm text-warning font-medium">This will cancel the event and notify the host.</p>
            )}
            {pendingAction === 'delete_review' && (
              <p className="text-sm text-warning font-medium">This removes the review permanently and notifies the author. Use when you've upheld a dispute.</p>
            )}
            {pendingAction === 'suspend' && (
              <Input
                label="Suspension length (days)"
                type="number"
                min={1}
                max={365}
                value={suspendDays}
                onChange={(e) => setSuspendDays(e.target.value)}
              />
            )}
            {ACTION_LABELS[pendingAction].needsReason && (
              <TextArea
                label={pendingAction === 'warn' ? 'Warning message to user' : 'Reason'}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder={pendingAction === 'warn'
                  ? 'Explain what behaviour broke the rules and what they need to change.'
                  : 'Reason — visible to the user and admin audit log.'}
                rows={3}
                maxLength={500}
                showCount
              />
            )}
            <div className="flex gap-2">
              <Button variant="ghost" onClick={closeActionConfirm} className="flex-1">Cancel</Button>
              <Button
                variant="danger"
                onClick={runModerationAction}
                isLoading={isActing}
                disabled={ACTION_LABELS[pendingAction].needsReason && !actionReason.trim()}
                className="flex-1"
              >
                Confirm
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
