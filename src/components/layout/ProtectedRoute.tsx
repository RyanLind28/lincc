import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { logger } from '../../lib/utils';
import { FullPageSpinner } from '../ui/Spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireProfile?: boolean;
  requireTerms?: boolean;
  requireAdmin?: boolean;
}

const LOG_PREFIX = '[ProtectedRoute]';

export function ProtectedRoute({
  children,
  requireProfile = true,
  requireTerms = true,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const { profile, isLoading, isAuthenticated, isProfileComplete } = useAuth();
  const location = useLocation();

  if (isLoading) {
    logger.log(LOG_PREFIX, location.pathname, '→ loading spinner');
    return <FullPageSpinner />;
  }

  // Not logged in - redirect to login
  if (!isAuthenticated) {
    logger.log(LOG_PREFIX, location.pathname, '→ redirect to /login (not authenticated)');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check admin requirement
  if (requireAdmin && profile?.role !== 'admin') {
    logger.log(LOG_PREFIX, location.pathname, '→ redirect to / (not admin, role:', profile?.role, ')');
    return <Navigate to="/" replace />;
  }

  // Check terms acceptance. Only redirect when we actually have a loaded profile
  // that hasn't accepted terms — a null profile here means the fetch is still
  // settling or transiently failed, and bouncing to /terms (which performs a DB
  // write before the session is reliably attached) surfaced a spurious
  // "Something went wrong" toast. Terms are accepted at signup, so a genuinely
  // unaccepted loaded profile is the only case that should land here.
  if (requireTerms && profile && !profile.terms_accepted_at) {
    logger.log(LOG_PREFIX, location.pathname, '→ redirect to /terms (terms not accepted)');
    return <Navigate to="/terms" state={{ from: location }} replace />;
  }

  // Check profile completion (all required fields: first_name, dob, gender, tags, avatar_url).
  // Business accounts have their own multi-step wizard at /onboarding/business
  // (welcome → logo+bio → location → install). Verification is a separate,
  // optional step from the dashboard, not part of onboarding.
  if (requireProfile && !isProfileComplete) {
    const target = profile?.account_type === 'business' ? '/onboarding/business' : '/onboarding';
    logger.log(LOG_PREFIX, location.pathname, '→ redirect to', target, '(profile incomplete)');
    return <Navigate to={target} state={{ from: location }} replace />;
  }

  // Pending business accounts can roam freely; the DB publish triggers and per-page
  // CTAs in CreateEventPage / CreateVoucherPage stop them from publishing until
  // they're approved. The /pending-approval page remains as an info hub they can
  // open from a banner shown across the app.

  // Personal accounts cannot reach business-only management routes.
  if (
    profile?.account_type === 'personal' &&
    profile?.role !== 'admin' &&
    location.pathname.startsWith('/business/')
  ) {
    // Allow viewing public business pages (`/business/:id`), block edit/dashboard.
    const blocked = /^\/business\/(edit|new)/.test(location.pathname)
      || /\/dashboard\/?$/.test(location.pathname);
    if (blocked) {
      logger.log(LOG_PREFIX, location.pathname, '→ redirect to / (personal account on biz route)');
      return <Navigate to="/" replace />;
    }
  }

  logger.log(LOG_PREFIX, location.pathname, '→ allowed');
  return <>{children}</>;
}

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    logger.log(LOG_PREFIX, 'PublicRoute', location.pathname, '→ loading spinner');
    return <FullPageSpinner />;
  }

  // If authenticated, redirect away — ProtectedRoute handles terms/onboarding/admin gates
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/';
    logger.log(LOG_PREFIX, 'PublicRoute', location.pathname, '→ redirect to', from, '(already authenticated)');
    return <Navigate to={from} replace />;
  }

  logger.log(LOG_PREFIX, 'PublicRoute', location.pathname, '→ allowed');
  return <>{children}</>;
}
