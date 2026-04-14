import { MMKV } from "react-native-mmkv";

const storage = new MMKV({ id: "ltf1-cache" });

const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
const EVICTION_TARGET_BYTES = 40 * 1024 * 1024; // 80% of max

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function isExpired(entry: CacheEntry<unknown>): boolean {
  return Date.now() - entry.timestamp > MAX_AGE_MS;
}

/**
 * Generate a deterministic cache key from query name and args.
 */
function cacheKey(queryName: string, args: unknown): string {
  const argsStr = args === undefined || args === null ? "noargs" : JSON.stringify(args);
  // Simple hash: djb2
  let hash = 5381;
  for (let i = 0; i < argsStr.length; i++) {
    hash = ((hash << 5) + hash + argsStr.charCodeAt(i)) | 0;
  }
  const hashHex = (hash >>> 0).toString(16);
  return `cache:${queryName}:${hashHex}`;
}

/**
 * Read a cached query result. Returns null if not found or expired.
 */
export function getCachedQuery<T>(queryName: string, args: unknown): T | null {
  const key = cacheKey(queryName, args);
  const raw = storage.getString(key);
  if (!raw) return null;

  try {
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (isExpired(entry)) {
      storage.delete(key);
      return null;
    }
    return entry.data;
  } catch {
    storage.delete(key);
    return null;
  }
}

/**
 * Write a query result to cache. Triggers LRU eviction if storage exceeds limit.
 */
export function cacheQuery<T>(queryName: string, args: unknown, data: T): void {
  const key = cacheKey(queryName, args);
  const entry: CacheEntry<T> = { data, timestamp: Date.now() };
  storage.set(key, JSON.stringify(entry));
  evictIfNeeded();
}

/**
 * Clear all cached data.
 */
export function clearCache(): void {
  const keys = storage.getAllKeys();
  for (const key of keys) {
    if (key.startsWith("cache:")) {
      storage.delete(key);
    }
  }
}

/**
 * LRU eviction: if total cache size exceeds MAX_CACHE_SIZE_BYTES,
 * delete oldest entries until under EVICTION_TARGET_BYTES.
 */
function evictIfNeeded(): void {
  const keys = storage.getAllKeys().filter((k) => k.startsWith("cache:"));
  let totalSize = 0;
  const entries: Array<{ key: string; timestamp: number; size: number }> = [];

  for (const key of keys) {
    const raw = storage.getString(key);
    if (!raw) continue;
    const size = raw.length * 2; // approximate byte size (UTF-16)
    totalSize += size;
    try {
      const parsed: CacheEntry<unknown> = JSON.parse(raw);
      entries.push({ key, timestamp: parsed.timestamp, size });
    } catch {
      // Corrupt entry, remove it
      storage.delete(key);
      totalSize -= size;
    }
  }

  if (totalSize <= MAX_CACHE_SIZE_BYTES) return;

  // Sort oldest first
  entries.sort((a, b) => a.timestamp - b.timestamp);

  for (const entry of entries) {
    if (totalSize <= EVICTION_TARGET_BYTES) break;
    storage.delete(entry.key);
    totalSize -= entry.size;
  }
}
