import { usePWA } from '../../hooks/usePWA';
import { RefreshCw } from 'lucide-react';

export function UpdateNotification() {
  const { hasUpdate, applyUpdate } = usePWA();

  if (!hasUpdate) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[60] lg:left-auto lg:right-6 lg:max-w-sm animate-slide-up safe-top">
      <div className="bg-surface border border-border rounded-2xl shadow-lg p-4 flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue/10 flex items-center justify-center">
          <RefreshCw className="h-5 w-5 text-blue" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text">Update available</p>
          <p className="text-xs text-text-muted">A new version of Lincc is ready</p>
        </div>
        <button
          onClick={applyUpdate}
          className="flex-shrink-0 px-3 py-1.5 text-sm font-medium text-white bg-blue rounded-lg hover:bg-blue/90 transition-colors"
        >
          Update
        </button>
      </div>
    </div>
  );
}
