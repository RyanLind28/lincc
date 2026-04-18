import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// Scrolls to the top on forward navigation (PUSH/REPLACE). Leaves scroll alone
// on POP (browser back/forward) so returning to a previous page restores the
// user's place.
export function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === 'POP') return;
    window.scrollTo(0, 0);
  }, [pathname, navigationType]);

  return null;
}
