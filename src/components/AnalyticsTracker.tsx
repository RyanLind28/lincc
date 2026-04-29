import { useAnalytics } from '../hooks/useAnalytics';

/**
 * Mounts inside the Router + AuthProvider so it can observe both route changes
 * and the current user. Renders nothing.
 */
export function AnalyticsTracker() {
  useAnalytics();
  return null;
}
