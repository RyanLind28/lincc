import { useMemo, useState, useEffect } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { GradientButton } from '../ui';
import { usePWA } from '../../hooks/usePWA';
import {
  detectInstallPlatform,
  getInstallInstructions,
  InstallSteps,
} from './installInstructions';

const DISMISS_KEY = 'lincc:install-card-dismissed';

/**
 * In-app card that prompts install. Renders on the profile.
 *  - Browsers that support the BeforeInstallPrompt API (Android Chrome, Edge,
 *    desktop Chrome): one-tap install button.
 *  - iOS Safari, iOS Chrome/Edge, Android browsers without the API: numbered
 *    walkthrough with the actual icons users will see.
 *  - When the app is already installed, renders nothing.
 *  - User can dismiss it; choice persists.
 */
export function InstallAppCard() {
  const { isInstallable, isInstalled, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1');
  const [didInstall, setDidInstall] = useState(false);
  const platform = useMemo(detectInstallPlatform, []);
  const instructions = useMemo(() => getInstallInstructions(platform), [platform]);

  useEffect(() => {
    if (isInstalled) setDidInstall(true);
  }, [isInstalled]);

  if (isInstalled || didInstall || dismissed) return null;
  if (!isInstallable && !instructions) return null;

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
          <h3 className="font-bold text-text">Get the Lincc app</h3>
          <p className="text-sm text-text-muted mt-0.5">
            {instructions?.tagline ??
              'Save Lincc to your home screen — faster, full-screen, and ready when you are.'}
          </p>

          {isInstallable ? (
            <div className="mt-4">
              <GradientButton onClick={handleInstall} size="md">
                <Download className="h-4 w-4 mr-1" /> Install app
              </GradientButton>
            </div>
          ) : instructions ? (
            <div className="mt-3">
              <InstallSteps steps={instructions.steps} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
