import { useState } from 'react';
import { usePWA } from '../../hooks/usePWA';
import { Download, X } from 'lucide-react';

const DISMISSED_KEY = 'lincc-install-dismissed';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isDismissed(): boolean {
  const raw = localStorage.getItem(DISMISSED_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  if (isNaN(dismissedAt)) return false;
  return Date.now() - dismissedAt < DISMISS_DURATION_MS;
}

export function InstallBanner() {
  const { isInstallable, isInstalled, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState(isDismissed);

  if (!isInstallable || isInstalled || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
  };

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) {
      localStorage.removeItem(DISMISSED_KEY);
    }
  };

  return (
    <div className="fixed bottom-22 left-4 right-4 z-50 lg:bottom-6 lg:left-auto lg:right-6 lg:max-w-sm animate-slide-up">
      <div className="bg-surface border border-border rounded-2xl shadow-lg p-4 flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
          <Download className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text">Install Lincc</p>
          <p className="text-xs text-text-muted">Add to home screen for the best experience</p>
        </div>
        <button
          onClick={handleInstall}
          className="flex-shrink-0 px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 text-text-light hover:text-text transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
