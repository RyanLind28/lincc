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

  // Check terms acceptance
  if (requireTerms && !profile?.terms_accepted_at) {
    logger.log(LOG_PREFIX, location.pathname, '→ redirect to /terms (terms not accepted, profile:', !!profile, ')');
    return <Navigate to="/terms" state={{ from: location }} replace />;
  }

  // Check profile completion (all required fields: first_name, dob, gender, tags, avatar_url)
  if (requireProfile && !isProfileComplete) {
    logger.log(LOG_PREFIX, location.pathname, '→ redirect to /onboarding (profile incomplete)');
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
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
