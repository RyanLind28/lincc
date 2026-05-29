import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Banner shown app-wide (via MainLayout) ONLY when a business account has a
 * genuine status problem — a rejected application, or a suspended/inactive
 * account. Approved businesses (the default since migration 061/064) see
 * nothing here.
 *
 * Verification (the businesses.verified tick) is deliberately NOT surfaced
 * here: it's an optional, bonus add-on the owner can opt into from their
 * dashboard, not something we nag about or gate publishing on.
 */
export function BusinessApprovalBanner() {
  const { profile, business, isBusinessApproved } = useAuth();

  if (
    !profile ||
    profile.account_type !== 'business' ||
    !business ||
    isBusinessApproved
  ) {
    return null;
  }

  let tone: 'warning' | 'error' = 'warning';
  let icon = Clock;
  let title = 'Account inactive';
  let body = "Your business account isn't active right now, so it won't appear publicly. Contact support if you think this is a mistake.";
  let cta: { to: string; label: string } | null = null;

  if (business.status === 'rejected') {
    tone = 'error';
    icon = AlertTriangle;
    title = 'Application not accepted';
    body = business.rejection_reason || 'Open the application page for details and to re-submit.';
    cta = { to: '/pending-approval', label: 'Open application' };
  } else if (business.status === 'suspended') {
    tone = 'error';
    icon = AlertTriangle;
    title = 'Account suspended';
    body = 'Your business account has been suspended. Contact support to resolve this.';
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
        {cta && (
          <Link
            to={cta.to}
            className="inline-flex items-center gap-1 text-sm font-medium text-text hover:underline whitespace-nowrap"
          >
            {cta.label} <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
