# LTF1 Mobile -- Tech Stack

> React Native Expo Android app for the LTF1 developer-focused project management platform.
> Last updated: 2026-04-14

---

## Core Framework

| Package | Version | Purpose | Why This Over Alternatives |
|---------|---------|---------|---------------------------|
| expo | ~52.0.0 | App framework | New Architecture enabled by default, managed workflow eliminates native toolchain friction, EAS Build for CI/CD, OTA updates via expo-updates |
| react-native | 0.76.x | UI runtime | Bundled with Expo 52, Hermes engine for faster startup and lower memory, JSI for synchronous native module calls |
| react | 18.3.x | Component model | Bundled with Expo 52, concurrent features (useTransition, Suspense) for responsive UI |
| typescript | ^5.3.0 | Type safety | Project-wide standard, strict mode enabled, shared types with web and Convex backend |

**Alternatives considered:**
- **Flutter**: Would require rewriting all shared business logic, no Convex SDK, Dart is not used anywhere else in the stack.
- **Kotlin/Jetpack Compose**: Android-only is acceptable for MVP, but no code sharing with web, no Convex SDK, team expertise is TypeScript.
- **Bare React Native (no Expo)**: Extra native build complexity with no benefit; Expo 52 New Architecture removes the historical performance gap.

---

## Routing and Navigation

| Package | Version | Purpose | Why This Over Alternatives |
|---------|---------|---------|---------------------------|
| expo-router | v4 | File-based routing | Automatic deep linking, lazy route loading, typed routes, layout nesting, simpler mental model than imperative navigation |

**Alternatives considered:**
- **React Navigation (standalone)**: expo-router is built on React Navigation internally but adds file-based conventions, typed routes, and automatic deep link generation. Direct React Navigation use requires more boilerplate for equivalent functionality.
- **Solito**: Designed for cross-platform web+native routing. Adds complexity for a mobile-only target; not needed when web app uses its own router.

---

## Styling

| Package | Version | Purpose | Why This Over Alternatives |
|---------|---------|---------|---------------------------|
| nativewind | ^4.0.0 | Tailwind CSS on React Native | Developers already know Tailwind from the web app, shared design token vocabulary, compiles to StyleSheet at build time for zero runtime cost |
| tailwindcss | ^3.4.0 | CSS utility framework | Peer dependency of NativeWind, powers the class-based API |

**Alternatives considered:**
- **StyleSheet.create (built-in)**: Verbose, no design token system, harder to keep consistent with web.
- **Tamagui**: Excellent performance but adds a new mental model and component library; heavier than NativeWind for a team already fluent in Tailwind.
- **Unistyles**: Good runtime performance, but smaller ecosystem and less mature than NativeWind v4.

---

## Authentication

| Package | Version | Purpose | Why This Over Alternatives |
|---------|---------|---------|---------------------------|
| @clerk/clerk-expo | latest | Authentication | Already used on web, shared user model, first-class Expo support with prebuilt hooks, supports OAuth and magic link flows |
| expo-secure-store | ~13.0.0 | Token storage | Android Keystore / iOS Keychain backed, Clerk's recommended token cache for Expo |

**Alternatives considered:**
- **Firebase Auth**: Would require migrating the entire auth system; Clerk is already integrated across the web app and Convex backend.
- **Supabase Auth**: Same migration problem; no advantage over Clerk for this stack.
- **expo-auth-session (raw OAuth)**: Low-level; Clerk wraps this internally and adds session management, user profiles, and organization support.

---

## Backend

| Package | Version | Purpose | Why This Over Alternatives |
|---------|---------|---------|---------------------------|
| convex | ^1.17.0 | Real-time backend | Shared with web app, real-time subscriptions out of the box, optimistic updates, no REST endpoints to maintain, TypeScript end-to-end |

**Alternatives considered:**
- **REST API layer**: Would require building and maintaining a separate API server; Convex already serves the web app with real-time queries.
- **tRPC**: Good TypeScript DX but requires a server; Convex removes the server entirely.
- **GraphQL (Apollo/Relay)**: Over-engineered for this use case; Convex subscriptions are simpler and faster to develop against.

---

## Performance Libraries

| Package | Version | Purpose | Why This Over Alternatives |
|---------|---------|---------|---------------------------|
| @shopify/flash-list | ^1.7.0 | High-performance lists | 5x faster than FlatList via cell recycling, constant memory usage regardless of list size, drop-in replacement API |
| react-native-mmkv | ^2.12.0 | Fast key-value storage | 30x faster than AsyncStorage, synchronous reads via JSI, C++ native module, encryption support |
| expo-image | ~2.0.0 | Image loading and caching | Uses Coil on Android (Fresco replacement), automatic disk/memory caching, blurhash placeholders, progressive loading |

**Alternatives considered:**
- **FlatList (built-in)**: Acceptable for short lists but degrades on 100+ items; FlashList is strictly better for task lists and activity feeds.
- **AsyncStorage**: Works but is asynchronous and slow; MMKV is a direct upgrade with no API complexity increase.
- **react-native-fast-image**: Unmaintained since 2023; expo-image is actively developed and Expo-native.

---

## Animation and Interaction

| Package | Version | Purpose | Why This Over Alternatives |
|---------|---------|---------|---------------------------|
| react-native-reanimated | ~3.16.0 | Animations | Runs on UI thread at 60fps via worklets, shared values avoid bridge overhead, layout animations, entering/exiting transitions |
| react-native-gesture-handler | ~2.20.0 | Gesture recognition | Native gesture system for swipe, pan, pinch, long-press; works with Reanimated for gesture-driven animations |
| @gorhom/bottom-sheet | ^5.0.0 | Bottom sheet modals | Best-in-class implementation, Reanimated-powered, configurable snap points, keyboard-aware, backdrop handling |
| expo-haptics | ~13.0.0 | Haptic feedback | Tactile response on task completion, swipe actions, and destructive operations |

**Alternatives considered:**
- **Animated (built-in)**: JS-thread animations cause frame drops during gestures; Reanimated is the standard for production RN apps.
- **Moti**: Nice declarative API but is a wrapper around Reanimated; using Reanimated directly gives more control and avoids an extra dependency.
- **react-native-modal**: Basic modal with no gesture support; bottom sheets are the standard mobile pattern for contextual actions.

---

## UI Components

| Package | Version | Purpose | Why This Over Alternatives |
|---------|---------|---------|---------------------------|
| lucide-react-native | latest | Icon set | Matches the web app's lucide-react, consistent icon language across platforms, tree-shakeable (only bundle used icons) |
| expo-linear-gradient | ~13.0.0 | Gradient backgrounds | Card headers, status indicators, and the brutalist design system's accent gradients |
| react-native-safe-area-context | ~4.12.0 | Safe area insets | Handles notch, status bar, navigation bar padding across all Android devices |
| expo-status-bar | ~2.0.0 | Status bar control | Programmatic light/dark style switching to match the app's dark theme |

**Alternatives considered:**
- **react-native-vector-icons**: Large bundle (includes all icon fonts), not tree-shakeable; lucide is lighter and already used on web.
- **expo-icons (@expo/vector-icons)**: Convenient but bundles entire icon fonts; lucide tree-shaking produces smaller APKs.

---

## Development and Build

| Package | Version | Purpose | Why This Over Alternatives |
|---------|---------|---------|---------------------------|
| eas-cli | latest | Build and submission | Cloud APK/AAB generation, Play Store submission, build profiles (development/preview/production), OTA update channels |
| metro | bundled | JavaScript bundler | Ships with Expo, monorepo-aware via `watchFolders` config, supports Hermes bytecode compilation |
| babel | bundled | Transpilation | Required for NativeWind (babel-plugin-nativewind) and Reanimated (react-native-reanimated/plugin) |

**Alternatives considered:**
- **Local Gradle builds**: Requires Android SDK setup on every developer machine; EAS Build handles this in the cloud.
- **Fastlane**: Powerful but complex; EAS covers the same build/submit workflow with less configuration for Expo projects.

---

## NOT Using (and Why)

| Package | Reason for Exclusion |
|---------|---------------------|
| react-native-paper | Heavy Material Design library, conflicts with the LTF1 brutalist design system, large bundle size (~200KB) |
| react-native-elements | Another heavyweight UI library, redundant when NativeWind provides full styling control |
| react-native-chart-kit | Poor performance on lower-end devices, SVG-based rendering is slow for real-time data; not needed for MVP |
| @tanstack/react-query | Convex handles all server state with real-time subscriptions; adding TanStack Query would create duplicate caching layers |
| react-native-vector-icons | Not tree-shakeable, bundles entire icon fonts; replaced by lucide-react-native |
| Redux / Zustand / Jotai | Convex real-time queries serve as the primary state manager; local UI state is handled by React useState/useReducer |
| AsyncStorage | MMKV is 30x faster with a synchronous API; AsyncStorage has no advantages for this use case |
| styled-components | Runtime CSS-in-JS adds overhead on React Native; NativeWind compiles to static StyleSheet objects |
| react-native-navigation (Wix) | Requires native module linking and custom native code; incompatible with Expo managed workflow |

---

## Version Pinning Strategy

| Constraint | Rule | Rationale |
|-----------|------|-----------|
| Expo SDK packages | Tilde (`~`) | Stay within the SDK 52 compatibility matrix; Expo tests these exact ranges together |
| Non-Expo community packages | Caret (`^`) | Accept minor and patch updates for bug fixes |
| convex | Match web app version exactly | API compatibility between mobile and web clients; schema changes must deploy atomically |
| @clerk/clerk-expo | `latest` during development, pin on release | Clerk ships breaking changes in major versions; pin before production to avoid surprises |
| typescript | `^5.3.0` | Must match the web app's TypeScript version for shared type definitions |

---

## Monorepo Integration

The mobile app lives at `apps/mobile/` within the existing pnpm monorepo. Shared code:

| Shared Resource | Location | Usage |
|----------------|----------|-------|
| Convex functions | `convex/` | Imported via the generated `convex/_generated/api` module; same queries/mutations as web |
| TypeScript types | `convex/_generated/dataModel` | `Id<"tableName">` and `Doc<"tableName">` types shared across platforms |
| Design tokens | `tailwind.config.ts` (shared base) | Color palette, spacing scale, and font configuration extended by NativeWind config |
| Clerk auth config | Shared publishable key | Same Clerk application, same user pool, same organization model |

---

## Minimum Device Requirements

| Requirement | Target |
|------------|--------|
| Android API level | 24 (Android 7.0) -- Expo 52 minimum |
| RAM | 2GB minimum, 4GB recommended |
| Architecture | arm64-v8a primary, armeabi-v7a fallback |
| Hermes engine | Required (enabled by default in Expo 52) |
