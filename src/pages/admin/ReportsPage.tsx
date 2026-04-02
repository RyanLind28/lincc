import { useState, useEffect, useCallback } from 'react';
import { Header } from '../../components/layout';
import { Avatar, Badge, Modal, Button, TextArea, ChatListSkeleton } from '../../components/ui';
import { Flag, CheckCircle, XCircle, AlertTriangle, Download } from 'lucide-react';
import { fetchAdminReports, updateReportStatus, exportReportsCSV } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatRelativeTime } from '../../lib/utils';

interface AdminReport {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  reporter: { id: string; first_name: string; avatar_url: string | null } | null;
  reported: { id: string; first_name: string; avatar_url: string | null } | null;
  event: { id: string; title: string } | null;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'dismissed', label: 'Dismissed' },
  { value: 'actioned', label: 'Actioned' },
];

export default function AdminReportsPage() {
  const [statusFilter, setStatusFilter] = useState('pending');
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const { user } = useAuth();
  const { showToast } = useToast();

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    const { data } = await fetchAdminReports(statusFilter);
    setReports(data as unknown as AdminReport[]);
    setIsLoading(false);
  }, [statusFilter]);

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

      <div className="p-4 space-y-4">
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
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
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
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleAction(selectedReport.id, 'dismissed')}
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  Dismiss
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleAction(selectedReport.id, 'reviewed')}
                >
                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                  Review
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleAction(selectedReport.id, 'actioned')}
                >
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                  Action
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
