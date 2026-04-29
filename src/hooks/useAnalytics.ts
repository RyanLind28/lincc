import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { initAnalytics, trackPageview, setAnalyticsUser } from '../lib/analytics';
import { getConsent, onConsentChange } from '../lib/consent';

/**
 * Bootstraps Google Analytics (only after the user accepts cookies) and pumps
 * SPA route changes + auth state into it. Mount once at the root of the app.
 */
export function useAnalytics() {
  const location = useLocation();
  const { user } = useAuth();
  const [consent, setConsentState] = useState(getConsent());

  // Listen for consent flips (the banner accept/decline)
  useEffect(() => onConsentChange(setConsentState), []);

  // Boot GA once consent is granted
  useEffect(() => {
    if (consent === 'accepted') {
      initAnalytics();
      // Backfill the page they were on when they accepted
      trackPageview(window.location.pathname + window.location.search);
    }
  }, [consent]);

  // Track each route change (no-op until init has run)
  useEffect(() => {
    if (consent !== 'accepted') return;
    trackPageview(location.pathname + location.search);
  }, [location.pathname, location.search, consent]);

  // Stitch sessions by Supabase user id when authenticated
  useEffect(() => {
    if (consent !== 'accepted') return;
    setAnalyticsUser(user?.id ?? null);
  }, [user?.id, consent]);
}
