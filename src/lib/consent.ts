/**
 * Cookie / analytics consent.
 *
 * Stored as a single localStorage key. Consumers (analytics, etc.) listen for
 * the custom 'lincc:consent' event so they can react when the user accepts
 * after the page has already loaded.
 */

export type ConsentStatus = 'pending' | 'accepted' | 'declined';

const KEY = 'lincc:cookie-consent';
const EVENT = 'lincc:consent';

export function getConsent(): ConsentStatus {
  if (typeof window === 'undefined') return 'pending';
  const v = localStorage.getItem(KEY);
  if (v === 'accepted' || v === 'declined') return v;
  return 'pending';
}

export function setConsent(value: 'accepted' | 'declined') {
  localStorage.setItem(KEY, value);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: value }));
}

export function onConsentChange(listener: (value: ConsentStatus) => void) {
  const handler = (e: Event) => listener((e as CustomEvent).detail as ConsentStatus);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
