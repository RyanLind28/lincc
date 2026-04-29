import { useState, useEffect } from 'react';
import { Download, Smartphone, X, Share2 } from 'lucide-react';
import { GradientButton } from '../ui';
import { usePWA } from '../../hooks/usePWA';

const DISMISS_KEY = 'lincc:install-card-dismissed';

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}
function isSafari() {
  const ua = navigator.userAgent;
  return /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);
}

/**
 * In-app card that prompts install. Renders on the profile.
 *  - Android / Chrome / Edge: uses the BeforeInstallPrompt API.
 *  - iOS Safari: shows the manual "Share → Add to Home Screen" steps because
 *    the API isn't supported.
 *  - When the app is already installed, renders nothing.
 *  - User can dismiss it; choice persists.
 */
export function InstallAppCard() {
  const { isInstallable, isInstalled, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1');
  const [didInstall, setDidInstall] = useState(false);

  // Hide if PWA reports installed mid-session
  useEffect(() => {
    if (isInstalled) setDidInstall(true);
  }, [isInstalled]);

  if (isInstalled || didInstall || dismissed) return null;

  const onIOS = isIOS() && isSafari();
  // Hide entirely if neither path applies (eg. desktop Firefox where install isn't available)
  if (!isInstallable && !onIOS) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) setDidInstall(true);
  };

  return (
    <div className="relative bg-gradient-to-br from-coral/10 via-purple/10 to-blue/10 border border-coral/20 rounded-2xl p-5 overflow-hidden">
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 p-1 rounded-lg text-text-light hover:text-text hover:bg-surface/50 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center flex-shrink-0 text-white shadow-md">
          <Smartphone className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-text">Install Lincc</h3>
          <p className="text-sm text-text-muted mt-0.5">
            Get the app on your home screen — faster, full-screen, and ready when you are.
          </p>

          {onIOS ? (
            <div className="mt-3 space-y-1.5 text-sm text-text">
              <p className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-coral text-white text-xs font-bold">1</span>
                Tap the <Share2 className="inline h-4 w-4 mx-1 text-coral" /> share button below
              </p>
              <p className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-coral text-white text-xs font-bold">2</span>
                Choose <span className="font-semibold">Add to Home Screen</span>
              </p>
            </div>
          ) : (
            <div className="mt-4">
              <GradientButton onClick={handleInstall} size="md">
                <Download className="h-4 w-4 mr-1" /> Install app
              </GradientButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
