import { Download, ChevronRight, Check } from 'lucide-react';
import { detectInstallPlatform, getInstallInstructions, InstallSteps } from '../../../components/pwa/installInstructions';

interface InstallStepProps {
  isInstalled: boolean;
  isInstallable: boolean;
  onInstall: () => void;
}

export function InstallStep({ isInstalled, isInstallable, onInstall }: InstallStepProps) {
  // Note: we always show this step in onboarding even when isInstalled is
  // true. The browser only knows "is this tab running standalone right now",
  // not "has the user added the app somewhere", so we play it safe and
  // re-offer the instructions while softening the copy for the standalone
  // case below.
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold gradient-text mb-2">
        {isInstalled ? "You're all set" : 'Add to Home Screen'}
      </h1>
      <p className="text-text-muted mb-8">
        {isInstalled
          ? "Lincc is already on your home screen on this device — nothing to do here."
          : 'Install Lincc for the best experience. Instant access, just like a native app.'}
      </p>

      <div className="space-y-3 text-left">
        {isInstalled && (
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="h-7 w-7 text-success" />
            </div>
            <p className="text-text-muted text-sm">
              If you use Lincc on another device, you can add it there too — instructions are in Settings.
            </p>
          </div>
        )}

        {!isInstalled && isInstallable && (
          <button
            onClick={onInstall}
            className="w-full p-4 bg-coral/5 rounded-xl border border-coral/20 flex items-center gap-4 hover:bg-coral/10 transition-colors press-effect"
          >
            <div className="w-11 h-11 bg-coral rounded-xl flex items-center justify-center flex-shrink-0">
              <Download className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-text">Install Lincc</h3>
              <p className="text-xs text-text-muted">Tap to add to your home screen</p>
            </div>
            <ChevronRight className="h-5 w-5 text-coral" />
          </button>
        )}

        {!isInstalled && !isInstallable && (() => {
          const platform = detectInstallPlatform();
          const instructions = getInstallInstructions(platform);
          if (!instructions) {
            return (
              <div className="text-center py-4">
                <p className="text-text-muted text-sm">
                  You can install Lincc anytime from your browser menu.
                </p>
              </div>
            );
          }
          return (
            <div className="w-full p-4 bg-coral/5 rounded-xl border border-coral/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 bg-coral rounded-xl flex items-center justify-center flex-shrink-0">
                  <Download className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-text">Add to Home Screen</h3>
                  <p className="text-xs text-text-muted">{instructions.tagline}</p>
                </div>
              </div>
              <InstallSteps steps={instructions.steps} />
            </div>
          );
        })()}
      </div>
    </div>
  );
}
