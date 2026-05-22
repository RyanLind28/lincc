import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWA() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches
  );
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Listen for successful install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Listen for online/offline
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for waiting service worker (update available).
    // NOTE: our sw.ts calls self.skipWaiting() in its install handler and
    // self.clients.claim() on activate, so new SWs normally take over
    // automatically and never sit in the "waiting" state. The prompt should
    // only appear in the rare case a worker is genuinely stuck waiting
    // (e.g. an older SW shipped before auto-activation, or skipWaiting failed).
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // Existing waiting worker at mount — show the prompt.
        if (registration.waiting && navigator.serviceWorker.controller) {
          setWaitingWorker(registration.waiting);
          setHasUpdate(true);
        }

        // Listen for new updates.
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state !== 'installed' || !navigator.serviceWorker.controller) return;

            // Give the SW a beat to run skipWaiting() from its install handler.
            // If it does, the worker transitions past 'installed' (activating →
            // activated) and registration.waiting clears — no prompt needed.
            // If it's still waiting after the delay, the user actually needs
            // to trigger the update manually.
            setTimeout(() => {
              if (registration.waiting === newWorker && newWorker.state === 'installed') {
                setWaitingWorker(newWorker);
                setHasUpdate(true);
              }
            }, 1500);
          });
        });
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
      return true;
    }

    return false;
  }, [deferredPrompt]);

  const applyUpdate = useCallback(() => {
    if (!waitingWorker) return;

    // Reload only after the new SW has taken control, otherwise the old SW
    // serves the reload and references stale asset hashes — producing a white screen.
    const reload = () => window.location.reload();
    navigator.serviceWorker.addEventListener('controllerchange', reload, { once: true });

    // Fallback: if controllerchange never fires (rare), force reload after 3s
    // so users aren't stuck with the prompt hidden and no reload.
    setTimeout(reload, 3000);

    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    setHasUpdate(false);
    setWaitingWorker(null);
  }, [waitingWorker]);

  return {
    isInstallable,
    isInstalled,
    isOffline,
    hasUpdate,
    promptInstall,
    applyUpdate,
  };
}
