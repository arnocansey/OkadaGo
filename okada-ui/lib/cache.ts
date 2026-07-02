const cache = new Map<string, { data: unknown; expiry: number }>();

const DEFAULT_TTL = 5 * 60 * 1000;

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache(key: string, data: unknown, ttl = DEFAULT_TTL): void {
  cache.set(key, { data, expiry: Date.now() + ttl });
}

export function buildCacheKey(...parts: (string | number | undefined | null)[]): string {
  return parts.filter(Boolean).join(":");
}

export function clearCache(): void {
  cache.clear();
}
