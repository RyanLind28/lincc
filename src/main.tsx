import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { getBrowserEnv } from './lib/browserEnv';
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

const BOT_UA = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|read-aloud|lighthouse|headlesschrome/i;
const isBot = typeof navigator !== 'undefined' && BOT_UA.test(navigator.userAgent);

// Initialize Sentry error monitoring
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  enabled: import.meta.env.PROD && !isBot,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 0.1,
  tracePropagationTargets: ['localhost', /^https:\/\/.*\.supabase\.co/],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// When a new deploy replaces the JS chunks the cached app shell (especially iOS
// standalone PWAs) still references, dynamic import() 404s. Reload once to pick
// up the fresh index.html. Guard with sessionStorage so we never loop.
const PRELOAD_RELOAD_KEY = 'lincc-preload-reloaded';
window.addEventListener('vite:preloadError', (event) => {
  if (sessionStorage.getItem(PRELOAD_RELOAD_KEY)) {
    Sentry.captureException(event.payload, {
      tags: { feature: 'pwa', stage: 'preload-after-reload' },
    });
    return;
  }
  sessionStorage.setItem(PRELOAD_RELOAD_KEY, '1');
  event.preventDefault();
  window.location.reload();
});
window.addEventListener('load', () => {
  sessionStorage.removeItem(PRELOAD_RELOAD_KEY);
});

// Skip SW registration for bots — Google-Read-Aloud et al. reject the call and
// we don't want them caching anything anyway.
if (import.meta.env.PROD && !isBot) {
  registerSW({
    immediate: true,
    onRegisterError(error) {
      Sentry.captureException(error, {
        tags: { feature: 'pwa', stage: 'register' },
      });
    },
  });
}

// Tag every Sentry event with browser/device info so we can filter by, e.g.,
// browser:"samsung-internet" when triaging upload or auth issues.
try {
  const env = getBrowserEnv();
  Sentry.setTags({
    browser: env.browser,
    os: env.os,
    device_class: env.deviceClass,
    standalone: String(env.isStandalone),
  });
  Sentry.setContext('browser_env', {
    browser: env.browser,
    browserVersion: env.browserVersion,
    os: env.os,
    deviceClass: env.deviceClass,
    isStandalone: env.isStandalone,
    prefersReducedData: env.prefersReducedData,
    userAgent: navigator.userAgent,
  });
} catch {
  // Detection failed — non-fatal, continue without tags
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
