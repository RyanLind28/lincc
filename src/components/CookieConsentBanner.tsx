import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie } from 'lucide-react';
import { GradientButton } from './ui';
import { getConsent, setConsent, onConsentChange } from '../lib/consent';

/**
 * Bottom-of-screen consent banner for non-essential cookies (currently:
 * Google Analytics). Stays mounted but only renders while status is 'pending'.
 * Accept = analytics on; Decline = analytics never loads.
 */
export function CookieConsentBanner() {
  const [status, setStatus] = useState(getConsent());

  useEffect(() => onConsentChange(setStatus), []);

  if (status !== 'pending') return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4 pointer-events-none">
      <div className="max-w-3xl mx-auto bg-surface border border-border rounded-2xl shadow-2xl p-4 sm:p-5 pointer-events-auto">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 rounded-xl bg-coral/10 flex items-center justify-center flex-shrink-0">
            <Cookie className="h-5 w-5 text-coral" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-text">We'd love to learn how you use Lincc</p>
            <p className="text-sm text-text-muted mt-1">
              We use Google Analytics to understand which features people use. Nothing identifying about you is shared.
              See our{' '}
              <Link to="/landing/privacy" className="text-coral underline hover:text-coral/80">privacy policy</Link>.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <GradientButton size="sm" onClick={() => setConsent('accepted')}>
                Accept
              </GradientButton>
              <button
                onClick={() => setConsent('declined')}
                className="h-9 px-4 rounded-xl border border-border text-text-muted hover:text-text text-sm font-medium transition-colors"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
