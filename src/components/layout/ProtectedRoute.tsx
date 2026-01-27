import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FullPageSpinner } from '../ui/Spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireProfile?: boolean;
  requireTerms?: boolean;
  requireAdmin?: boolean;
}

export function ProtectedRoute({
  children,
  requireProfile = true,
  requireTerms = true,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const { profile, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <FullPageSpinner />;
  }

  // Not logged in - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check admin requirement
  if (requireAdmin && profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Check terms acceptance
  if (requireTerms && !profile?.terms_accepted_at) {
    return <Navigate to="/terms" state={{ from: location }} replace />;
  }

  // Check profile completion
  if (requireProfile && !profile?.first_name) {
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <FullPageSpinner />;
  }

  // If authenticated and has profile, redirect to home
  if (isAuthenticated && profile?.first_name) {
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}
