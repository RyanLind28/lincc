import { Download, ChevronRight } from 'lucide-react';
import { detectInstallPlatform, getInstallInstructions, InstallSteps } from '../../../components/pwa/installInstructions';

interface InstallStepProps {
  isInstalled: boolean;
  isInstallable: boolean;
  onInstall: () => void;
}

export function InstallStep({ isInstalled, isInstallable, onInstall }: InstallStepProps) {
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold gradient-text mb-2">Add to Home Screen</h1>
      <p className="text-text-muted mb-8">
        Install Lincc for the best experience. Instant access, just like a native app.
      </p>

      <div className="space-y-3 text-left">
        {isInstalled && (
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Download className="h-7 w-7 text-success" />
            </div>
            <p className="text-text-muted text-sm">Lincc is already installed!</p>
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
