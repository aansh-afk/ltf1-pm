import { useMemo, useEffect } from "react";
import { useQuery } from "convex/react";
import { FunctionReference } from "convex/server";
import { getCachedQuery, cacheQuery } from "../lib/cache";

/**
 * Wraps Convex useQuery with MMKV cache fallback.
 *
 * On mount, returns cached data immediately (synchronous MMKV read).
 * Once the Convex subscription delivers live data, it replaces the cached value
 * and writes the fresh data back to cache.
 *
 * When offline, the cached data persists as the return value.
 */
export function useOfflineCache<T>(
  queryRef: FunctionReference<"query", "public", any, T>,
  args: any,
): T | undefined {
  // Extract a stable query name for cache key
  const queryName = useMemo(() => {
    if (typeof queryRef === "string") return queryRef;
    // FunctionReference objects have internal name property
    return (queryRef as any)?.name ?? (queryRef as any)?._name ?? String(queryRef);
  }, [queryRef]);

  // Get live data from Convex subscription
  const liveData = useQuery(queryRef, args ?? "skip");

  // Read cached data synchronously on mount
  const cachedData = useMemo(
    () => getCachedQuery<T>(queryName, args),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryName, JSON.stringify(args)],
  );

  // Write fresh data to cache whenever live data updates
  useEffect(() => {
    if (liveData !== undefined) {
      cacheQuery(queryName, args, liveData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveData, queryName, JSON.stringify(args)]);

  return liveData ?? cachedData ?? undefined;
}
