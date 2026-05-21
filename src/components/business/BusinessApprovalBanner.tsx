import { Link } from 'react-router-dom';
import { Clock, ShieldCheck, AlertTriangle, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getMyVerification } from '../../services/verificationService';
import type { VerificationStatus } from '../../types';

/**
 * Persistent banner shown to business accounts whose business isn't yet
 * approved. Appears app-wide via MainLayout. Not dismissable — stays put
 * until the business is approved, otherwise users lose their only path back
 * to /business/verify.
 */
export function BusinessApprovalBanner() {
  const { profile, business, isBusinessApproved } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState<string | null>(null);

  useEffect(() => {
    if (!business?.id) { setVerificationStatus(null); setRejectionNotes(null); return; }
    getMyVerification(business.id).then((v) => {
      setVerificationStatus(v?.status ?? 'draft');
      setRejectionNotes(v?.rejection_notes ?? null);
    });
  }, [business?.id]);

  if (
    !profile ||
    profile.account_type !== 'business' ||
    !business ||
    isBusinessApproved
  ) {
    return null;
  }

  const isRejectedApp = business.status === 'rejected';
  const verifSubmitted = verificationStatus === 'submitted' || verificationStatus === 'in_review';
  const verifRejected = verificationStatus === 'rejected';

  let tone: 'warning' | 'error' = 'warning';
  let icon = Clock;
  let title = 'Awaiting review';
  let body = "We're reviewing your business. You can browse Lincc as usual; you'll be able to publish events and vouchers once verified.";
  let cta = { to: '/business/verify', label: 'Get verified' };

  if (isRejectedApp) {
    tone = 'error';
    icon = AlertTriangle;
    title = 'Application not accepted';
    body = business.rejection_reason || 'Open the application page for details and to re-submit.';
    cta = { to: '/pending-approval', label: 'Open application' };
  } else if (verifRejected) {
    tone = 'error';
    icon = AlertTriangle;
    title = 'Needs another look';
    body = rejectionNotes?.trim()
      ? rejectionNotes
      : 'Replace any flagged documents and re-submit to get the verified tick.';
    cta = { to: '/business/verify', label: 'Re-submit' };
  } else if (verifSubmitted) {
    tone = 'warning';
    icon = Clock;
    title = 'Under review';
    body = 'Most reviews finish within 24 hours. You can keep building your profile in the meantime.';
    cta = { to: '/business/dashboard', label: 'Open dashboard' };
  } else if (verificationStatus === 'draft' || verificationStatus === null) {
    tone = 'warning';
    icon = ShieldCheck;
    title = 'Get verified';
    body = 'Upload your ID and business documents to get the verified tick and unlock publishing.';
    cta = { to: '/business/verify', label: 'Get verified' };
  }

  const Icon = icon;
  const toneClasses = tone === 'error'
    ? 'bg-error/10 border-error/30 text-error'
    : 'bg-warning/10 border-warning/30 text-warning';

  return (
    <div className={`border-b ${toneClasses}`}>
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-3">
        <Icon className="h-4 w-4 flex-shrink-0" />
        <div className="flex-1 min-w-0 text-sm">
          <span className="font-semibold">{title}.</span>{' '}
          <span className="text-text">{body}</span>
        </div>
        <Link
          to={cta.to}
          className="inline-flex items-center gap-1 text-sm font-medium text-text hover:underline whitespace-nowrap"
        >
          {cta.label} <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
