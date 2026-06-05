import { useEffect, useState, useCallback } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, CheckCircle, AlertTriangle, ShieldCheck, Loader2, MessageSquareWarning,
} from 'lucide-react';
import { Header } from '../components/layout';
import { GradientButton } from '../components/ui';
import {
  VerificationSlots,
  VERIFICATION_SLOTS,
  useVerificationUpload,
} from '../components/business/VerificationSlots';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatRelativeTime } from '../lib/utils';
import {
  getMyVerification,
  submitVerification,
} from '../services/verificationService';
import type { BusinessVerification } from '../types';

export default function BusinessVerifyPage() {
  const { user, business, profile, refreshBusiness } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [verification, setVerification] = useState<BusinessVerification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    if (!business?.id) return;
    const v = await getMyVerification(business.id);
    setVerification(v);
    setIsLoading(false);
  }, [business?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  const { uploadingSlot, uploadError, clearUploadError, handleUpload, handleRemove } = useVerificationUpload(business?.id, user?.id, refresh);

  if (profile && profile.account_type !== 'business') {
    return <Navigate to="/" replace />;
  }
  if (!business) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-coral animate-spin" />
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!verification) return;
    setIsSubmitting(true);
    const result = await submitVerification(verification.id);
    setIsSubmitting(false);
    if (result.success) {
      showToast("Sent for review. We'll be in touch", 'success');
      refresh();
      refreshBusiness();
      navigate('/business/dashboard');
    } else {
      showToast(result.error || 'Submission failed', 'error');
    }
  };

  const status = verification?.status ?? 'draft';
  const canEdit = status === 'draft' || status === 'rejected';
  const allUploaded = VERIFICATION_SLOTS.every((s) => !!verification?.[s.column]);

  return (
    <div className="min-h-screen bg-background pb-12 max-w-2xl mx-auto">
      <Header
        showBack
        rightContent={
          <Link to="/business/dashboard" className="text-sm text-coral font-medium px-3">
            Skip for now
          </Link>
        }
      />

      <div className="p-4 space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-5 w-5 text-coral" />
            <h1 className="text-2xl font-bold text-text">Verify your business</h1>
          </div>
          <p className="text-sm text-text-muted">
            Verified businesses get an official tick on their profile, helping guests trust who they're dealing with. We never share these documents.
          </p>
        </div>

        {/* Status banner */}
        {isLoading ? (
          <div className="h-16 bg-surface rounded-2xl border border-border animate-pulse" />
        ) : status === 'submitted' || status === 'in_review' ? (
          <div className="bg-warning/10 border border-warning/30 rounded-2xl p-4 flex items-start gap-3">
            <Loader2 className="h-5 w-5 text-warning mt-0.5 animate-spin" />
            <div>
              <p className="text-sm font-semibold text-text">Under review</p>
              <p className="text-xs text-text-muted">We're checking your documents. Most reviews finish within 24 hours.</p>
            </div>
          </div>
        ) : status === 'approved' ? (
          <div className="bg-success/10 border border-success/30 rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-success mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-success">Verified</p>
              <p className="text-xs text-text-muted">Your business now displays the official tick across Lincc.</p>
            </div>
          </div>
        ) : status === 'rejected' ? (
          <div className="bg-error/10 border border-error/30 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-error mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-error">More info needed</p>
              <p className="text-xs text-text-muted mt-1">Check the admin's notes below, replace any flagged documents, and re-submit.</p>
            </div>
          </div>
        ) : null}

        {/* Admin feedback — shown when the reviewer left notes (typically on
            rejection, but also when notes accompany an approval). Always
            visible while notes exist so the user knows what to act on. */}
        {!isLoading && verification?.rejection_notes?.trim() && (
          <div className="rounded-2xl border border-error/30 bg-error/5 overflow-hidden">
            <div className="px-4 py-2.5 bg-error/10 border-b border-error/20 flex items-center gap-2">
              <MessageSquareWarning className="h-4 w-4 text-error flex-shrink-0" />
              <p className="text-sm font-semibold text-error">Reviewer's notes</p>
              {verification.reviewed_at && (
                <span className="ml-auto text-[11px] text-text-muted">
                  {formatRelativeTime(verification.reviewed_at)}
                </span>
              )}
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-text whitespace-pre-wrap">{verification.rejection_notes}</p>
              {status === 'rejected' && (
                <p className="text-xs text-text-muted">
                  Replace the documents flagged above and tap <span className="font-medium">Re-submit for review</span> when you're done.
                </p>
              )}
            </div>
          </div>
        )}

        <VerificationSlots
          verification={verification}
          uploadingSlot={uploadingSlot}
          locked={!canEdit}
          onUpload={handleUpload}
          onRemove={handleRemove}
          uploadError={uploadError}
          onClearError={clearUploadError}
        />

        {canEdit && (
          <GradientButton
            fullWidth
            onClick={handleSubmit}
            disabled={!allUploaded}
            isLoading={isSubmitting}
          >
            {status === 'rejected' ? 'Re-submit for review' : 'Submit for review'}
          </GradientButton>
        )}

        {!canEdit && status !== 'approved' && (
          <div className="text-center text-xs text-text-muted">
            Submitted. Locked while we review.
          </div>
        )}

        <p className="text-[11px] text-text-light leading-relaxed">
          Documents are stored privately. Only Lincc admins reviewing your application can access them, and we delete them within 90 days of approval (sooner on request).
        </p>

        <Link
          to="/business/dashboard"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text"
        >
          <ChevronLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </div>
    </div>
  );
}
