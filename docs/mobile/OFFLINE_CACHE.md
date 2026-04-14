# LTF1 Mobile -- Offline Cache Architecture

This document describes the offline caching strategy for the LTF1 mobile app. The goal is to provide instant UI on app launch and graceful degradation when the network is unavailable.

---

## Storage Layer: MMKV

The cache is backed by `react-native-mmkv`, a C++ native key-value store that operates through JSI.

**Why MMKV:**
- Synchronous read/write. No async overhead, no promises to await on app launch.
- 30x faster than AsyncStorage for both reads and writes.
- Zero bridge overhead (JSI-based).
- Automatic data encryption support if needed in the future.

**Key format:**

```
cache:{queryName}:{argsHash}
```

Examples:
- `cache:dashboard.queries.getDashboardData:noargs`
- `cache:projects.queries.getWorkspaceProjects:a1b2c3d4`
- `cache:tasks.queries.getProjectTasks:e5f6g7h8`

The `argsHash` is a deterministic hash of the query arguments, ensuring that different argument combinations produce different cache entries.

**Max cache size:** 50 MB (configurable). This is enforced through LRU eviction. See "Cache Invalidation" below.

---

## Cache Strategy

The caching strategy follows a "stale-while-revalidate" pattern adapted for Convex real-time subscriptions.

### Step-by-Step Flow

1. **App launch:** Hydrate the UI from MMKV immediately. This is synchronous, so the user sees data on the first frame. The data may be stale, but it is better than a loading spinner.

2. **Convex connects:** The Convex client establishes a WebSocket connection in the background. Real-time subscriptions are activated for the current screen.

3. **Subscriptions fire:** As each subscription delivers fresh data, the UI updates in place. The transition from cached to live data is seamless.

4. **Background snapshot:** After each subscription update, the new data is written to MMKV in a background microtask. This keeps the cache current without blocking the UI thread.

5. **Network loss:** If the network drops, the app continues to display the last-known data from cache. A banner indicates offline status. Mutations are disabled.

6. **Reconnect:** When the network returns, Convex automatically reconnects its WebSocket. Subscriptions resume and deliver any updates that occurred during the offline period. The cache is refreshed.

---

## What Gets Cached

| Data | Cached | Reason |
|------|--------|--------|
| Dashboard data (workspaces, stats) | Yes | Small payload, shown on every app launch |
| Projects list | Yes | Frequently accessed, rarely changes |
| Recent tasks (last 50 per project) | Yes | Core data for project detail screen |
| User profile | Yes | Static data, changes infrequently |
| Task comments | No | Too dynamic, low value when stale |
| File attachments | No | Binary data, too large for MMKV cache |
| Full task history (beyond 50) | No | Pagination handles this on demand |

---

## Offline Detection

### Network State

Use `@react-native-community/netinfo` to monitor network connectivity.

```typescript
import NetInfo from '@react-native-community/netinfo';

NetInfo.addEventListener(state => {
  setIsConnected(state.isConnected && state.isInternetReachable);
});
```

### Convex Connection Status

Monitor the Convex client connection state for a more accurate picture. The device may have network access but the Convex WebSocket may be disconnected (e.g., server maintenance).

### UI Indicators

- **Offline banner:** A persistent banner at the top of the screen when the app detects it is offline. Text: "You are offline. Showing cached data."
- **Disabled mutations:** All create/edit/delete buttons are grayed out with reduced opacity when offline. Tapping a disabled button shows a brief tooltip: "Action unavailable while offline."
- **No offline mutation queue in v1:** Mutations are not queued for later submission. This avoids conflict resolution complexity. Users must be online to make changes.

---

## Cache Invalidation

### TTL-based Expiration

Each cache entry has a maximum age of 24 hours. On app launch, entries older than 24 hours are discarded before hydration. This prevents displaying severely outdated data.

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number; // Date.now() at write time
}

function isExpired(entry: CacheEntry<unknown>): boolean {
  const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
  return Date.now() - entry.timestamp > MAX_AGE_MS;
}
```

### Event-based Replacement

When a Convex subscription delivers new data, it replaces the corresponding cache entry unconditionally. This is the primary cache refresh mechanism during normal operation.

### Manual Refresh

Pull-to-refresh on any list screen forces a fresh fetch from Convex, bypassing the cache. The fresh data is then written back to cache.

### Storage Pressure (LRU Eviction)

When total cache size exceeds 50 MB:

1. Sort all cache entries by `timestamp` (oldest first).
2. Delete the oldest entries until total size is under 40 MB (80% of max).
3. Log evicted keys for debugging.

This is checked on each cache write operation.

---

## Data Flow Diagrams

### Normal Operation

```
App Start
  |
  v
Read MMKV cache (synchronous, <5ms)
  |
  v
Render UI with cached data (instant)
  |
  v
Connect to Convex (background, async)
  |
  v
Subscriptions activate
  |
  v
Fresh data arrives
  |
  v
Update UI + write snapshot to MMKV
  |
  v
User interacts with live data
```

### Offline Scenario

```
Network drops
  |
  v
Convex WebSocket disconnects
  |
  v
Show "Offline" banner
  |
  v
Continue displaying cached data
  |
  v
Disable mutation buttons
  |
  v
User can browse but not modify
```

### Reconnection

```
Network returns
  |
  v
Convex auto-reconnects WebSocket
  |
  v
Subscriptions resume
  |
  v
Fresh data arrives for all active queries
  |
  v
UI updates to current state
  |
  v
Cache entries refreshed
  |
  v
"Offline" banner dismissed
  |
  v
Mutation buttons re-enabled
```

---

## Implementation Notes

### Cache Wrapper

A thin wrapper around MMKV handles serialization, TTL checks, and size tracking.

```typescript
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'ltf1-cache' });

function cacheKey(queryName: string, args: unknown): string {
  const hash = deterministicHash(JSON.stringify(args));
  return `cache:${queryName}:${hash}`;
}

function readCache<T>(queryName: string, args: unknown): T | null {
  const key = cacheKey(queryName, args);
  const raw = storage.getString(key);
  if (!raw) return null;

  const entry: CacheEntry<T> = JSON.parse(raw);
  if (isExpired(entry)) {
    storage.delete(key);
    return null;
  }
  return entry.data;
}

function writeCache<T>(queryName: string, args: unknown, data: T): void {
  const key = cacheKey(queryName, args);
  const entry: CacheEntry<T> = { data, timestamp: Date.now() };
  storage.set(key, JSON.stringify(entry));
}
```

### Integration with Convex Hooks

The cache integrates at the hook level. A custom hook wraps `useQuery` to provide cached fallback data while the subscription connects.

```typescript
function useCachedQuery<T>(queryRef, args): T | undefined {
  const liveData = useQuery(queryRef, args);
  const cachedData = useMemo(
    () => readCache<T>(queryRef.name, args),
    [queryRef, args]
  );

  useEffect(() => {
    if (liveData !== undefined) {
      writeCache(queryRef.name, args, liveData);
    }
  }, [liveData]);

  return liveData ?? cachedData ?? undefined;
}
```

---

## Future Considerations (Not in v1)

- **Offline mutation queue:** Queue mutations locally and submit them when connectivity returns. Requires conflict resolution strategy.
- **Selective sync:** Allow users to "pin" projects for full offline access with deeper caching.
- **Background sync:** Use Android WorkManager to refresh cache periodically while the app is backgrounded.
