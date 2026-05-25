import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X } from 'lucide-react';
import { getConsent, setConsent, onConsentChange } from '../lib/consent';

export function CookieConsentBanner() {
  const [status, setStatus] = useState(getConsent());

  useEffect(() => onConsentChange(setStatus), []);

  if (status !== 'pending') return null;

  return (
    <div className="fixed inset-x-0 bottom-16 lg:bottom-0 z-[var(--z-toast)] safe-bottom pointer-events-none">
      <div className="p-3 sm:p-4 pointer-events-auto">
        <div className="max-w-md mx-auto bg-surface/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl px-4 py-3 animate-slide-up-sm">
          <div className="flex items-center gap-3">
            <Cookie className="h-4 w-4 text-coral flex-shrink-0" />
            <p className="text-xs text-text-muted flex-1">
              We use analytics to improve Lincc.{' '}
              <Link to="/landing/privacy" className="text-coral underline">Learn more</Link>
            </p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => setConsent('accepted')}
                className="h-7 px-3 rounded-lg gradient-primary text-white text-xs font-semibold"
              >
                Accept
              </button>
              <button
                onClick={() => setConsent('declined')}
                className="h-7 w-7 rounded-lg border border-border text-text-muted hover:text-text flex items-center justify-center transition-colors"
                aria-label="Decline cookies"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
