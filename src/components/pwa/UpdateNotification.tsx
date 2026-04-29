import { useState } from 'react';
import { usePWA } from '../../hooks/usePWA';
import { RefreshCw, Sparkles } from 'lucide-react';

/**
 * Full-screen, non-dismissable overlay shown when a new service worker is
 * waiting. Stays put until the user hits Update — which calls SKIP_WAITING
 * on the SW and reloads the page on the new bundle.
 */
export function UpdateNotification() {
  const { hasUpdate, applyUpdate } = usePWA();
  const [isUpdating, setIsUpdating] = useState(false);

  if (!hasUpdate) return null;

  const handleUpdate = () => {
    setIsUpdating(true);
    applyUpdate();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/95 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full max-w-md bg-surface rounded-3xl border border-border shadow-2xl p-8 text-center">
        <div className="w-20 h-20 mx-auto rounded-3xl gradient-primary flex items-center justify-center mb-5 shadow-lg">
          <Sparkles className="h-10 w-10 text-white" />
        </div>

        <h1 id="update-title" className="text-2xl font-bold text-text mb-2">
          Lincc just got better
        </h1>
        <p className="text-text-muted mb-6">
          A new version of the app is ready. Refresh now to get the latest features and fixes.
        </p>

        <button
          onClick={handleUpdate}
          disabled={isUpdating}
          className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl gradient-primary text-white font-semibold hover:shadow-lg disabled:opacity-70 transition-all"
        >
          <RefreshCw className={`h-5 w-5 ${isUpdating ? 'animate-spin' : ''}`} />
          {isUpdating ? 'Updating…' : 'Update now'}
        </button>

        <p className="text-xs text-text-light mt-4">
          The page will reload automatically.
        </p>
      </div>
    </div>
  );
}
