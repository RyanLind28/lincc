import { useMemo, useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';
import { BottomSheet } from '../ui';
import {
  detectInstallPlatform,
  getInstallInstructions,
  InstallSteps,
} from './installInstructions';

const DISMISSED_KEY = 'lincc-install-dismissed';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isDismissed(): boolean {
  const raw = localStorage.getItem(DISMISSED_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  if (isNaN(dismissedAt)) return false;
  return Date.now() - dismissedAt < DISMISS_DURATION_MS;
}

/**
 * Floating install prompt at the bottom of the screen.
 *  - When the BeforeInstallPrompt API is available, the action is a one-tap install.
 *  - On iOS Safari / iOS Chrome / Android browsers without the API, the action
 *    opens a BottomSheet with the platform-specific numbered walkthrough.
 *  - Hidden on platforms with no installable path (eg. desktop Firefox).
 *  - Dismissal persists for 7 days.
 */
export function InstallBanner() {
  const { isInstallable, isInstalled, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState(isDismissed);
  const [showSteps, setShowSteps] = useState(false);
  const platform = useMemo(detectInstallPlatform, []);
  const instructions = useMemo(() => getInstallInstructions(platform), [platform]);

  if (isInstalled || dismissed) return null;
  // Hide entirely if neither the install API nor manual instructions apply.
  if (!isInstallable && !instructions) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
  };

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) localStorage.removeItem(DISMISSED_KEY);
  };

  return (
    <>
      <div className="fixed bottom-22 left-4 right-4 z-[var(--z-overlay)] lg:bottom-6 lg:left-auto lg:right-6 lg:max-w-sm animate-slide-up">
        <div className="bg-surface border border-border rounded-2xl shadow-lg p-4 flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Smartphone className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text">Get the Lincc app</p>
            <p className="text-xs text-text-muted">Add to home screen for the best experience</p>
          </div>

          {isInstallable ? (
            <button
              onClick={handleInstall}
              className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white gradient-primary rounded-lg hover:opacity-90 transition-opacity"
            >
              <Download className="h-3.5 w-3.5" />
              Install
            </button>
          ) : (
            <button
              onClick={() => setShowSteps(true)}
              className="flex-shrink-0 px-3 py-1.5 text-sm font-medium text-white gradient-primary rounded-lg hover:opacity-90 transition-opacity"
            >
              Show how
            </button>
          )}

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 text-text-light hover:text-text transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <BottomSheet isOpen={showSteps} onClose={() => setShowSteps(false)} title="Install Lincc">
        {instructions && (
          <div className="space-y-4 pb-2">
            <p className="text-sm text-text-muted">{instructions.tagline}</p>
            <InstallSteps steps={instructions.steps} />
          </div>
        )}
      </BottomSheet>
    </>
  );
}
