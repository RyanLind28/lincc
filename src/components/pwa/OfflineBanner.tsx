import { usePWA } from '../../hooks/usePWA';
import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const { isOffline } = usePWA();

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-500 text-white px-4 py-2 text-center safe-top">
      <div className="flex items-center justify-center gap-2 text-sm font-medium">
        <WifiOff className="h-4 w-4" />
        <span>You're offline. Some features may be unavailable.</span>
      </div>
    </div>
  );
}
