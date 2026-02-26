/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope;

// Workbox precaching (manifest injected by vite-plugin-pwa at build time)
precacheAndRoute(self.__WB_MANIFEST);

// --- Runtime caching (migrated from vite.config.ts workbox.runtimeCaching) ---

// Google Fonts stylesheets
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Google Fonts files
registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: 'gstatic-fonts-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Mapbox tiles and API
registerRoute(
  /^https:\/\/api\.mapbox\.com\/.*/i,
  new NetworkFirst({
    cacheName: 'mapbox-cache',
    networkTimeoutSeconds: 10,
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }),
    ],
  })
);

// Supabase REST API (events, profiles, etc.)
registerRoute(
  /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
  new NetworkFirst({
    cacheName: 'supabase-api-cache',
    networkTimeoutSeconds: 10,
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Supabase Storage (avatars, images)
registerRoute(
  /^https:\/\/.*\.supabase\.co\/storage\/v1\/.*/i,
  new CacheFirst({
    cacheName: 'supabase-storage-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// --- SKIP WAITING HANDLER ---
// When the app sends SKIP_WAITING, activate the new service worker immediately
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// --- PUSH NOTIFICATION HANDLER ---

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const { title, body, type, data: notifData } = data;

  event.waitUntil(
    self.registration.showNotification(title || 'Lincc', {
      body: body || '',
      icon: '/web-app-manifest-192x192.png',
      badge: '/favicon-96x96.png',
      tag: type || 'default',
      data: { url: getNotificationUrl(type, notifData) },
    })
  );
});

// Click handler — navigate to relevant page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

function getNotificationUrl(
  type: string,
  data: Record<string, unknown> | undefined
): string {
  const eventId = data?.event_id as string | undefined;
  switch (type) {
    case 'join_request':
      return eventId ? `/event/${eventId}/manage` : '/my-events';
    case 'request_approved':
    case 'request_declined':
      return eventId ? `/event/${eventId}` : '/';
    case 'new_message':
      return eventId ? `/event/${eventId}/chat` : '/chats';
    case 'event_starting':
    case 'event_cancelled':
    case 'nearby_event':
      return eventId ? `/event/${eventId}` : '/';
    default:
      return '/';
  }
}
