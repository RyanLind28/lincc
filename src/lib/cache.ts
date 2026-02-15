// Simple in-memory cache with TTL for API responses

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL = 60_000; // 1 minute

/**
 * Get a cached value, or fetch it if expired/missing.
 */
export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL
): Promise<T> {
  const entry = store.get(key) as CacheEntry<T> | undefined;

  if (entry && Date.now() < entry.expiresAt) {
    return entry.data;
  }

  const data = await fetcher();
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
  return data;
}

/**
 * Invalidate a specific cache key.
 */
export function invalidate(key: string) {
  store.delete(key);
}

/**
 * Invalidate all keys matching a prefix.
 */
export function invalidatePrefix(prefix: string) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  }
}

/**
 * Clear the entire cache.
 */
export function clearCache() {
  store.clear();
}
