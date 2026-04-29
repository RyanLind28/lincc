import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Clock, AlertTriangle, Edit3, LogOut, RotateCcw, ShieldCheck } from 'lucide-react';
import { GradientButton } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { resubmitBusiness } from '../../services/businessService';

const LOGO_URL = 'https://qmctlt61dm3jfh0i.public.blob.vercel-storage.com/brand/logo/Lincc_Main_Horizontal%404x.webp';

export default function PendingApprovalPage() {
  const { profile, business, signOut, refreshBusiness, isBusinessApproved } = useAuth();
  const { showToast } = useToast();
  const [isResubmitting, setIsResubmitting] = useState(false);

  // Already approved — bounce home
  if (isBusinessApproved) {
    return <Navigate to="/" replace />;
  }

  // Not a business account — they shouldn't be here
  if (profile?.account_type !== 'business') {
    return <Navigate to="/" replace />;
  }

  const handleResubmit = async () => {
    if (!business) return;
    setIsResubmitting(true);
    const result = await resubmitBusiness(business.id);
    setIsResubmitting(false);
    if (result.success) {
      showToast('Application re-submitted', 'success');
      await refreshBusiness();
    } else {
      showToast(result.error || 'Failed to re-submit', 'error');
    }
  };

  const isRejected = business?.status === 'rejected';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-coral/5 to-purple/5 blur-3xl pointer-events-none" />
      <div className="w-full max-w-md relative">
        <div className="flex justify-center mb-6">
          <img src={LOGO_URL} alt="Lincc" className="h-8" />
        </div>

        <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${isRejected ? 'bg-error/10' : 'bg-warning/10'}`}>
            {isRejected ? (
              <AlertTriangle className="h-8 w-8 text-error" />
            ) : (
              <Clock className="h-8 w-8 text-warning" />
            )}
          </div>

          <h1 className="text-2xl font-bold text-text mb-2">
            {isRejected ? 'Application not accepted' : 'Application under review'}
          </h1>

          <p className="text-text-muted mb-4">
            {isRejected
              ? `We couldn't approve ${business?.name ?? 'your business'} this time.`
              : `Hi ${profile?.first_name || 'there'}, we're reviewing ${business?.name ?? 'your business'}. You'll get a notification once it's approved.`}
          </p>

          {isRejected && business?.rejection_reason && (
            <div className="bg-error/5 border border-error/30 rounded-xl p-3 mb-4 text-left">
              <p className="text-xs font-medium text-error mb-1">Reason</p>
              <p className="text-sm text-text">{business.rejection_reason}</p>
            </div>
          )}

          {!isRejected && (
            <p className="text-sm text-text-muted mb-6">
              In the meantime, you can complete your business profile so you're ready to launch on day one.
            </p>
          )}

          <div className="space-y-2">
            <Link to="/business/verify" className="block">
              <GradientButton fullWidth>
                <ShieldCheck className="h-4 w-4 mr-2" />
                Verify your business
              </GradientButton>
            </Link>
            <Link to="/business/edit" className="block">
              <button className="w-full flex items-center justify-center gap-2 h-11 px-6 rounded-xl border border-border bg-surface text-text font-semibold text-sm hover:border-coral transition-colors">
                <Edit3 className="h-4 w-4" />
                Complete business profile
              </button>
            </Link>

            {isRejected && (
              <button
                onClick={handleResubmit}
                disabled={isResubmitting}
                className="w-full flex items-center justify-center gap-2 h-11 px-6 rounded-xl border border-border bg-surface text-text font-semibold text-sm hover:border-coral transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <RotateCcw className="h-4 w-4" />
                {isResubmitting ? 'Re-submitting…' : 'Re-submit application'}
              </button>
            )}

            <button
              onClick={() => signOut()}
              className="w-full flex items-center justify-center gap-2 h-11 px-6 rounded-xl text-text-muted hover:text-text transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
