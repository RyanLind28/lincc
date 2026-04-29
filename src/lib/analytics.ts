/**
 * Google Analytics 4 — SPA helper.
 *
 * Behaviour:
 *  - The gtag script is injected only when VITE_GA_MEASUREMENT_ID is set,
 *    so dev/preview environments without an ID stay clean.
 *  - Authenticated users get a `user_id` parameter so GA can stitch sessions
 *    by user across devices. The id is the Supabase profile id; no PII is sent.
 *  - On every route change we fire a page_view event manually (gtag doesn't
 *    auto-track route changes in an SPA).
 */

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

let initialised = false;

export function isAnalyticsEnabled() {
  return !!GA_ID;
}

export function initAnalytics() {
  if (initialised || !GA_ID || typeof window === 'undefined') return;
  initialised = true;

  // 1. Load gtag.js script async
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);

  // 2. Bootstrap dataLayer + gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag('js', new Date());
  // We send page_views manually on route change, so disable the default one.
  window.gtag('config', GA_ID, { send_page_view: false });
}

export function trackPageview(path: string, title?: string) {
  if (!initialised || !GA_ID) return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.origin + path,
    page_title: title ?? document.title,
  });
}

export function trackEvent(action: string, params: Record<string, unknown> = {}) {
  if (!initialised || !GA_ID) return;
  window.gtag('event', action, params);
}

/** Sets the GA user_id for cross-device stitching. Pass null to clear on sign-out. */
export function setAnalyticsUser(userId: string | null) {
  if (!initialised || !GA_ID) return;
  window.gtag('config', GA_ID, { user_id: userId ?? undefined });
}
