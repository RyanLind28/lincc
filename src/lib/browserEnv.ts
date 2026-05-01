// Browser/device detection used to tag Sentry events and drive UX warnings.
// We avoid feature-detection for *identity* (we want "Samsung Internet" specifically,
// not just "Chromium-based") because Samsung Internet has real behavioural quirks
// — file pickers returning empty MIMEs, Secret Mode disabling SW/IndexedDB, etc.
// — that we want to be able to filter by in Sentry.

export type BrowserName =
  | 'samsung-internet'
  | 'chrome'
  | 'edge'
  | 'firefox'
  | 'safari'
  | 'opera'
  | 'webview'
  | 'other';

export type DeviceClass = 'mobile' | 'tablet' | 'desktop';

export interface BrowserEnv {
  browser: BrowserName;
  browserVersion: string | null;
  deviceClass: DeviceClass;
  os: string;
  isStandalone: boolean; // true when running as installed PWA
  prefersReducedData: boolean;
}

function detectBrowser(ua: string): { name: BrowserName; version: string | null } {
  // Order matters — Samsung Internet's UA contains "Chrome" too, so check first.
  const samsung = /SamsungBrowser\/([\d.]+)/.exec(ua);
  if (samsung) return { name: 'samsung-internet', version: samsung[1] };

  const edge = /Edg(?:e|A|iOS)?\/([\d.]+)/.exec(ua);
  if (edge) return { name: 'edge', version: edge[1] };

  const opera = /OPR\/([\d.]+)/.exec(ua);
  if (opera) return { name: 'opera', version: opera[1] };

  const firefox = /Firefox\/([\d.]+)/.exec(ua);
  if (firefox) return { name: 'firefox', version: firefox[1] };

  // Android WebView / in-app browsers (Instagram, Facebook, LinkedIn) share
  // Chrome's UA but lack the "wv" or have app-specific markers.
  if (/; wv\)/.test(ua) || /\b(FBAN|FBAV|Instagram|LinkedInApp|Twitter|TikTok)\b/.test(ua)) {
    return { name: 'webview', version: null };
  }

  const chrome = /Chrome\/([\d.]+)/.exec(ua);
  if (chrome) return { name: 'chrome', version: chrome[1] };

  // Safari check must come last — every WebKit browser claims "Safari" in its UA.
  const safari = /Version\/([\d.]+).*Safari/.exec(ua);
  if (safari) return { name: 'safari', version: safari[1] };

  return { name: 'other', version: null };
}

function detectOs(ua: string): string {
  if (/Android/.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  if (/Mac OS X/.test(ua)) return 'macOS';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Unknown';
}

function detectDeviceClass(ua: string): DeviceClass {
  if (/iPad|Tablet/.test(ua)) return 'tablet';
  if (/Mobile|Android|iPhone|iPod/.test(ua)) return 'mobile';
  return 'desktop';
}

export function getBrowserEnv(): BrowserEnv {
  const ua = navigator.userAgent;
  const { name, version } = detectBrowser(ua);
  return {
    browser: name,
    browserVersion: version,
    deviceClass: detectDeviceClass(ua),
    os: detectOs(ua),
    isStandalone:
      window.matchMedia?.('(display-mode: standalone)').matches ||
      // iOS Safari sets navigator.standalone on add-to-home-screen apps
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
    prefersReducedData:
      typeof navigator !== 'undefined' &&
      'connection' in navigator &&
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true,
  };
}

/**
 * Detects private / Secret / Incognito mode by probing storage. In private mode
 * Samsung Internet's "Secret Mode" silently no-ops localStorage writes; Firefox
 * private throws on IndexedDB open; Safari private throws on localStorage.setItem.
 *
 * Runs all probes in parallel, returns true if any one indicates private.
 */
export async function isPrivateBrowsing(): Promise<boolean> {
  // localStorage probe — Safari private throws here
  try {
    const probe = '__lincc_private_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
  } catch {
    return true;
  }

  // IndexedDB probe — Firefox private (and some others) throws or fails to open
  if (typeof indexedDB === 'undefined') return true;
  try {
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('__lincc_private_probe__');
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        try {
          req.result.close();
          indexedDB.deleteDatabase('__lincc_private_probe__');
        } catch {
          // best-effort cleanup
        }
        resolve();
      };
    });
  } catch {
    return true;
  }

  // Storage estimate probe — Chrome incognito reports a much smaller quota
  // than the real disk. Only treat *very* small quotas (under 120MB) as private,
  // since some legit phones have small quotas.
  if (navigator.storage?.estimate) {
    try {
      const { quota } = await navigator.storage.estimate();
      if (typeof quota === 'number' && quota > 0 && quota < 120 * 1024 * 1024) {
        return true;
      }
    } catch {
      // ignore — non-fatal
    }
  }

  return false;
}
