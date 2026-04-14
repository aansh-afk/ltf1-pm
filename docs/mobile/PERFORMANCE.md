# LTF1 Mobile -- Performance Optimization Strategy

This document defines performance targets, optimization techniques, and monitoring strategies for the LTF1 Android app built with Expo SDK 52+ and React Native.

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Cold start | < 2s | Time from tap to first meaningful paint, mid-range Android (2020 era) |
| Time to interactive (TTI) | < 3s | Time until the user can interact with the dashboard |
| List scroll | 60 fps constant | No dropped frames during fast scroll on task/project lists |
| Peak memory | < 150 MB | Maximum resident set size during normal usage |
| APK size | < 25 MB | Final APK delivered to users |
| JS bundle | < 2 MB | Hermes bytecode bundle size |

---

## Hermes Engine

Hermes is the default JavaScript engine in Expo SDK 52. It is purpose-built for React Native on mobile devices.

**Bytecode precompilation:** Hermes compiles JavaScript to bytecode at build time, not at runtime. This eliminates JIT warmup delays that plague other engines on cold start.

**Reduced memory footprint:** Hermes uses less memory than V8 or JavaScriptCore. Its garbage collector is optimized for the constrained memory environment of mobile devices.

**Faster cold start on low-end devices:** Because there is no JIT compilation phase, Hermes delivers consistent cold start times regardless of device CPU speed. This is critical for the 2020-era mid-range Android target.

**Implications for development:**
- Avoid language features that Hermes handles slowly (e.g., `Proxy` objects, `Reflect`). These are rarely needed in React Native code.
- Hermes supports modern ECMAScript features. No Babel polyfills are needed for async/await, optional chaining, or nullish coalescing.

---

## New Architecture (Fabric + JSI)

Expo SDK 52 enables the React Native New Architecture by default.

### JSI (JavaScript Interface)

JSI eliminates the asynchronous bridge that was the primary bottleneck in classic React Native. Instead of serializing data to JSON, passing it across the bridge, and deserializing on the other side, JSI allows JavaScript to call native functions synchronously through shared C++ bindings.

**Impact:**
- Native module calls are 3-10x faster.
- No JSON serialization overhead for frequently called native APIs.
- Enables synchronous operations where needed (e.g., MMKV storage reads).

### Fabric Renderer

Fabric is the new rendering system that replaces the legacy renderer.

- Concurrent rendering support: Fabric integrates with React 18 concurrent features, allowing interruptible rendering for smoother interactions.
- Synchronous layout: Layout calculations happen synchronously on the UI thread, eliminating layout "jumps" that occurred with the async bridge.
- Improved gesture handling: Touch events are processed with lower latency.

### TurboModules

TurboModules replace the legacy native module system.

- Lazy loading: Native modules are loaded only when first accessed, not at app startup. This directly reduces cold start time.
- Type-safe: TurboModules use codegen for type-safe communication between JS and native code.
- Reduced memory: Unused modules consume zero memory.

---

## List Performance

Task lists and project lists are the most scroll-intensive screens in the app.

### FlashList

Use `@shopify/flash-list` instead of `FlatList` for all scrollable lists.

FlashList is recycler-based. It reuses off-screen view components for newly visible items, maintaining constant memory usage regardless of list size. A list of 10 items uses the same memory as a list of 10,000 items.

**Configuration:**

```typescript
<FlashList
  data={tasks}
  renderItem={renderTaskItem}
  estimatedItemSize={72}
  keyExtractor={(item) => item._id}
/>
```

**Key practices:**
- Set `estimatedItemSize` accurately. Measure the actual rendered height of a typical list item. Inaccurate estimates cause recycling glitches.
- Use Convex `_id` as the key. It is stable and unique.
- Extract `renderItem` to a named function or `useCallback`. Inline arrow functions in `renderItem` create new function references on every render, defeating memoization.
- Avoid wrapping list items in unnecessary `View` containers.

### Avoiding Re-renders

- Memoize list item components with `React.memo`.
- Use `useCallback` for event handlers passed to list items.
- Keep list item props shallow. Do not pass deep objects that change reference on every render.

---

## Image Optimization

### expo-image

Use `expo-image` instead of React Native's built-in `Image` component. On Android, it uses the Coil library under the hood.

**Caching:** expo-image provides both disk and memory caching out of the box. Images that have been loaded once are served from cache on subsequent renders without network requests.

**Resize on load:**

```typescript
<Image
  source={{ uri: avatarUrl }}
  contentFit="cover"
  style={{ width: 40, height: 40 }}
  placeholder={blurhash}
  transition={200}
/>
```

- `contentFit: "cover"` ensures images fill their container without distortion.
- `placeholder` with a blurhash string provides a low-cost placeholder while the image loads.
- `transition` provides a smooth fade-in when the image finishes loading.

**Progressive loading:** For larger images (project covers, profile banners), use progressive JPEG or blurhash placeholders to give users immediate visual feedback.

---

## Bundle Optimization

### Tree-shaking

- Import specific icons, not entire icon sets. `import { Check } from 'lucide-react-native'` instead of `import * as Icons from 'lucide-react-native'`.
- Import specific functions from utility libraries. `import { format } from 'date-fns'` instead of `import * as dateFns from 'date-fns'`.
- Audit dependencies periodically. Remove any library that is imported but unused.

### Lazy Screen Loading

Expo Router handles lazy loading of screens automatically. Each screen's JavaScript is loaded only when the user navigates to it. This keeps the initial bundle small and the cold start fast.

### Dependency Audit

The following libraries were evaluated and excluded to keep the bundle lean:

| Library | Reason for Exclusion |
|---------|---------------------|
| react-native-paper | Full Material Design library. Too heavy. Use custom lightweight components instead. |
| @react-navigation/elements | Replaced by Expo Router built-in components. |
| react-native-chart-kit | Not needed in v1. Charts can be added later if required. |

---

## Memory Management

### MMKV Storage

`react-native-mmkv` is a C++ native storage solution that operates through JSI. It has zero bridge overhead and provides synchronous read/write operations.

**Why not AsyncStorage:** AsyncStorage serializes to JSON and crosses the bridge asynchronously. MMKV is 30x faster for reads and uses less memory.

### FlashList Memory

FlashList's recycler architecture means that scrolling a list of 500 tasks uses the same memory as scrolling a list of 20. Views are recycled, not accumulated.

### Render Optimization

- Avoid creating large inline objects inside render functions. These create new references on every render and defeat memoization.
- Use `useCallback` for event handlers and `useMemo` for expensive computations.
- Profile components with React DevTools to identify unnecessary re-renders.

---

## Monitoring and Profiling

### Development

**Flipper:** Use Flipper for development-time profiling. It provides:
- Network inspector for Convex WebSocket traffic.
- Layout inspector for view hierarchy analysis.
- Performance monitor for JS thread frame rate.

**React DevTools:** Connect to the running app to:
- Identify components that re-render unnecessarily.
- Profile render times for individual components.
- Inspect component props and state.

**Android Profiler (Android Studio):** For native-level performance analysis:
- CPU profiling to identify native thread bottlenecks.
- Memory profiling to detect leaks and excessive allocation.
- Network profiling for connection analysis.

### Production Monitoring (Future)

**Expo Updates:** Over-the-air (OTA) bundle delivery for rapid iteration without app store review cycles. This allows deploying performance fixes immediately.

**Crash reporting:** Integrate Sentry or Bugsnag for production crash and ANR (Application Not Responding) detection.

**Performance metrics:** Track cold start time, screen load times, and scroll frame rates in production using a lightweight telemetry solution.
