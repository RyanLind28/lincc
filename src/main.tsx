import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import App from './App';
import 'mapbox-gl/dist/mapbox-gl.css';
import './index.css';

// Apply the dark-mode class synchronously before React renders so we don't flash
// the wrong colour scheme. Honours the in-app preference first, then the OS.
(() => {
  try {
    const stored = localStorage.getItem('lincc-dark-mode');
    const wantsDark = stored === 'true'
      ? true
      : stored === 'false'
        ? false
        : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', wantsDark);
  } catch {
    // localStorage unavailable — fall through with default
  }
})();

// Unregister any stale service workers in development
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
      console.log('[SW] Unregistered service worker');
    }
  });
}

// Initialize Sentry error monitoring
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  enabled: import.meta.env.PROD, // Only enable in production
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Tracing
  tracesSampleRate: 0.1, // Sample 10% of transactions in production
  tracePropagationTargets: ['localhost', /^https:\/\/.*\.supabase\.co/],
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0, // Capture 100% of sessions with errors
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
