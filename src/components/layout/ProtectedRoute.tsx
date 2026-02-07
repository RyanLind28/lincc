import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
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
  const { profile, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    console.log(LOG_PREFIX, location.pathname, '→ loading spinner');
    return <FullPageSpinner />;
  }

  // Not logged in - redirect to login
  if (!isAuthenticated) {
    console.log(LOG_PREFIX, location.pathname, '→ redirect to /login (not authenticated)');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check admin requirement
  if (requireAdmin && profile?.role !== 'admin') {
    console.log(LOG_PREFIX, location.pathname, '→ redirect to / (not admin, role:', profile?.role, ')');
    return <Navigate to="/" replace />;
  }

  // Check terms acceptance
  if (requireTerms && !profile?.terms_accepted_at) {
    console.log(LOG_PREFIX, location.pathname, '→ redirect to /terms (terms not accepted, profile:', !!profile, ')');
    return <Navigate to="/terms" state={{ from: location }} replace />;
  }

  // Check profile completion
  if (requireProfile && !profile?.first_name) {
    console.log(LOG_PREFIX, location.pathname, '→ redirect to /onboarding (no first_name, profile:', !!profile, ')');
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  console.log(LOG_PREFIX, location.pathname, '→ allowed');
  return <>{children}</>;
}

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    console.log(LOG_PREFIX, 'PublicRoute', location.pathname, '→ loading spinner');
    return <FullPageSpinner />;
  }

  // If authenticated and has profile, redirect to home
  if (isAuthenticated && profile?.first_name) {
    const from = location.state?.from?.pathname || '/';
    console.log(LOG_PREFIX, 'PublicRoute', location.pathname, '→ redirect to', from, '(already authenticated)');
    return <Navigate to={from} replace />;
  }

  console.log(LOG_PREFIX, 'PublicRoute', location.pathname, '→ allowed');
  return <>{children}</>;
}
