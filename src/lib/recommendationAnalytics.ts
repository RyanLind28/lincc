const ANALYTICS_KEY = 'lincc-rec-analytics';

interface RecAnalytics {
  impressions: number;
  clicks: number;
  fallbacks: Record<string, number>;
  lastReset: string;
}

function getAnalytics(): RecAnalytics {
  try {
    return JSON.parse(localStorage.getItem(ANALYTICS_KEY) || 'null') || defaultAnalytics();
  } catch {
    return defaultAnalytics();
  }
}

function defaultAnalytics(): RecAnalytics {
  return { impressions: 0, clicks: 0, fallbacks: {}, lastReset: new Date().toISOString() };
}

function save(analytics: RecAnalytics) {
  localStorage.setItem(ANALYTICS_KEY, JSON.stringify(analytics));
}

export function trackImpression(count: number) {
  const a = getAnalytics();
  a.impressions += count;
  save(a);
}

export function trackClick() {
  const a = getAnalytics();
  a.clicks += 1;
  save(a);
}

export function trackFallback(type: string) {
  const a = getAnalytics();
  a.fallbacks[type] = (a.fallbacks[type] || 0) + 1;
  save(a);
}

export function getRecAnalytics() {
  const a = getAnalytics();
  return {
    ...a,
    ctr: a.impressions > 0 ? Math.round((a.clicks / a.impressions) * 10000) / 100 : 0,
  };
}

export function resetAnalytics() {
  save(defaultAnalytics());
}
