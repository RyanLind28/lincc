import { useCallback, useEffect, useState } from 'react';
import { Header } from '../../components/layout';
import { Avatar, Badge, ChatListSkeleton, GradientButton, Modal, TextArea } from '../../components/ui';
import { Store, CheckCircle, XCircle, ShieldCheck, FileText } from 'lucide-react';
import { fetchPendingBusinesses, approveBusiness, rejectBusiness } from '../../services/adminService';
import { getDocSignedUrl, approveVerification, rejectVerification } from '../../services/verificationService';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatRelativeTime } from '../../lib/utils';
import type { BusinessVerification } from '../../types';

interface PendingBusiness {
  id: string;
  name: string;
  category: string;
  description: string | null;
  address: string | null;
  status: 'pending_approval' | 'rejected';
  rejection_reason: string | null;
  logo_url: string | null;
  created_at: string;
  owner: { id: string; first_name: string | null; email: string; avatar_url: string | null } | null;
}

const VERIF_SLOTS: Array<{ key: keyof BusinessVerification; label: string }> = [
  { key: 'operator_selfie_path', label: 'Operator selfie' },
  { key: 'id_document_path', label: 'ID document' },
  { key: 'selfie_with_id_path', label: 'Selfie with ID' },
  { key: 'registration_doc_path', label: 'Business registration' },
];

const VERIF_BADGE: Record<string, { label: string; tone: 'default' | 'warning' | 'success' | 'error' }> = {
  draft: { label: 'Verification not submitted', tone: 'default' },
  submitted: { label: 'Verification submitted', tone: 'warning' },
  in_review: { label: 'Verification in review', tone: 'warning' },
  approved: { label: 'Verified', tone: 'success' },
  rejected: { label: 'Verification rejected', tone: 'error' },
};

function DocPreview({ path, label }: { path: string; label: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    getDocSignedUrl(path).then((u) => { if (!cancelled) setUrl(u); });
    return () => { cancelled = true; };
  }, [path]);
  const isImage = /\.(jpe?g|png|webp|gif|heic)$/i.test(path);
  return (
    <a
      href={url ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-1 p-2 rounded-lg border border-border bg-background hover:border-coral/40 transition-colors"
    >
      <div className="aspect-square rounded-md overflow-hidden bg-surface flex items-center justify-center">
        {isImage && url ? (
          <img src={url} alt={label} className="w-full h-full object-cover" />
        ) : (
          <FileText className="h-6 w-6 text-text-muted" />
        )}
      </div>
      <p className="text-[11px] text-text-muted text-center truncate">{label}</p>
    </a>
  );
}

export default function BusinessApplicationsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<PendingBusiness[]>([]);
  const [verifications, setVerifications] = useState<Record<string, BusinessVerification | null>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectMode, setRejectMode] = useState<'application' | 'verification'>('application');
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const { data } = await fetchPendingBusinesses();
    const list = data as unknown as PendingBusiness[];
    setItems(list);

    if (list.length) {
      const ids = list.map((b) => b.id);
      const { data: verifs } = await supabase
        .from('business_verifications')
        .select('*')
        .in('business_id', ids);
      const map: Record<string, BusinessVerification | null> = {};
      list.forEach((b) => { map[b.id] = (verifs ?? []).find((v) => v.business_id === b.id) ?? null; });
      setVerifications(map);
    } else {
      setVerifications({});
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleApprove = async (b: PendingBusiness) => {
    if (!user?.id) return;
    setIsSubmitting(true);
    // 1. Approve the business application itself
    const appResult = await approveBusiness(b.id, user.id);
    if (!appResult.success) {
      setIsSubmitting(false);
      showToast(appResult.error || 'Failed to approve', 'error');
      return;
    }
    // 2. If verification was submitted, approve it too (sets verified=true)
    const v = verifications[b.id];
    if (v && (v.status === 'submitted' || v.status === 'in_review')) {
      await approveVerification(v.id, b.id, user.id);
    }
    setIsSubmitting(false);
    showToast(v?.status === 'submitted' ? 'Approved & verified' : 'Approved', 'success');
    refresh();
  };

  const handleVerifyOnly = async (b: PendingBusiness) => {
    const v = verifications[b.id];
    if (!user?.id || !v) return;
    setIsSubmitting(true);
    const result = await approveVerification(v.id, b.id, user.id);
    setIsSubmitting(false);
    if (result.success) {
      showToast('Marked as verified', 'success');
      refresh();
    } else {
      showToast(result.error || 'Failed', 'error');
    }
  };

  const openReject = (id: string, mode: 'application' | 'verification') => {
    setRejectingId(id);
    setRejectMode(mode);
    setRejectReason('');
  };

  const handleReject = async () => {
    if (!user?.id || !rejectingId) return;
    setIsSubmitting(true);
    const result = rejectMode === 'application'
      ? await rejectBusiness(rejectingId, user.id, rejectReason)
      : await rejectVerification(rejectingId, user.id, rejectReason);
    setIsSubmitting(false);
    if (result.success) {
      showToast('Rejected', 'success');
      setRejectingId(null);
      setRejectReason('');
      refresh();
    } else {
      showToast(result.error || 'Failed to reject', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header title="Business applications" showBack />

      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
        {isLoading ? (
          <ChatListSkeleton count={4} />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 mt-8">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-lg font-semibold text-text mb-1">Inbox zero</h2>
            <p className="text-text-muted text-center text-sm">No business applications waiting.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((b) => {
              const v = verifications[b.id];
              const verifBadge = VERIF_BADGE[v?.status ?? 'draft'];
              const submittedDocs = v ? VERIF_SLOTS.filter((s) => v[s.key]).map((s) => ({ ...s, path: v[s.key] as string })) : [];
              const verificationReady = v && (v.status === 'submitted' || v.status === 'in_review');

              return (
                <div key={b.id} className="bg-surface rounded-2xl border border-border p-4">
                  <div className="flex items-start gap-3">
                    <Avatar src={b.logo_url} name={b.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-text truncate">{b.name}</p>
                        <Badge size="sm" variant={b.status === 'rejected' ? 'error' : 'warning'}>
                          {b.status === 'rejected' ? 'Rejected' : 'Pending'}
                        </Badge>
                        <Badge size="sm" variant={verifBadge.tone}>{verifBadge.label}</Badge>
                      </div>
                      <p className="text-sm text-text-muted">{b.category}</p>
                      {b.address && <p className="text-xs text-text-muted truncate">{b.address}</p>}
                      {b.description && (
                        <p className="text-sm text-text mt-2 line-clamp-3">{b.description}</p>
                      )}
                      {b.owner && (
                        <p className="text-xs text-text-light mt-1">
                          Owner: {b.owner.first_name || 'Unknown'} ({b.owner.email}) · {formatRelativeTime(b.created_at)}
                        </p>
                      )}
                      {b.status === 'rejected' && b.rejection_reason && (
                        <div className="mt-2 bg-error/5 border border-error/20 rounded-lg p-2">
                          <p className="text-xs font-medium text-error">Rejection reason</p>
                          <p className="text-sm text-text">{b.rejection_reason}</p>
                        </div>
                      )}
                      {v?.status === 'rejected' && v.rejection_notes && (
                        <div className="mt-2 bg-error/5 border border-error/20 rounded-lg p-2">
                          <p className="text-xs font-medium text-error">Verification rejection notes</p>
                          <p className="text-sm text-text">{v.rejection_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Verification documents */}
                  {submittedDocs.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs font-semibold text-text-muted uppercase mb-2 flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> Verification documents
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {submittedDocs.map((d) => <DocPreview key={d.key} path={d.path} label={d.label} />)}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex gap-2 flex-wrap">
                    {b.status === 'pending_approval' && (
                      <>
                        <GradientButton onClick={() => handleApprove(b)} isLoading={isSubmitting} size="sm">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {verificationReady ? 'Approve & verify' : 'Approve'}
                        </GradientButton>
                        <button
                          onClick={() => openReject(b.id, 'application')}
                          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-error border border-error/30 hover:bg-error/5 transition-colors"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject application
                        </button>
                      </>
                    )}
                    {/* Verification-only actions when business is already approved or independent */}
                    {b.status !== 'pending_approval' && verificationReady && v && (
                      <>
                        <GradientButton onClick={() => handleVerifyOnly(b)} isLoading={isSubmitting} size="sm">
                          <ShieldCheck className="h-4 w-4 mr-1" /> Mark as verified
                        </GradientButton>
                        <button
                          onClick={() => openReject(v.id, 'verification')}
                          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-error border border-error/30 hover:bg-error/5 transition-colors"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject verification
                        </button>
                      </>
                    )}
                    {b.status === 'pending_approval' && verificationReady && v && (
                      <button
                        onClick={() => openReject(v.id, 'verification')}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-error border border-error/30 hover:bg-error/5 transition-colors"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject verification only
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={!!rejectingId}
        onClose={() => { setRejectingId(null); setRejectReason(''); }}
        title={rejectMode === 'application' ? 'Reject application' : 'Reject verification'}
        size="sm"
      >
        <div className="space-y-3">
          <p className="text-sm text-text-muted">
            {rejectMode === 'application'
              ? "Tell the operator why their application wasn't accepted. They'll see this on their dashboard."
              : 'Tell the operator what to fix in their verification documents. They can re-submit.'}
          </p>
          <TextArea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={rejectMode === 'application'
              ? "e.g. Couldn't verify business details, please resubmit"
              : "e.g. ID photo blurry, please retake in better lighting"}
            rows={3}
            maxLength={500}
            showCount
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setRejectingId(null); setRejectReason(''); }}
              className="flex-1 py-2 rounded-lg text-sm text-text-muted hover:text-text"
            >
              Cancel
            </button>
            <GradientButton
              onClick={handleReject}
              isLoading={isSubmitting}
              disabled={!rejectReason.trim()}
              className="flex-1"
            >
              Reject
            </GradientButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
