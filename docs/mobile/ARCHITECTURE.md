# LTF1 Mobile App Architecture

## 1. Overview

LTF1 Mobile is a React Native (Expo SDK 52+) Android application for the LTF1 dev-focused project management platform. It shares the same Convex backend as the existing web application, providing real-time task management, project tracking, and team collaboration on mobile devices.

### Monorepo Structure

```
iceberg-L/
├── apps/
│   ├── web/                  # Vite + React 18 web application
│   ├── mobile/               # Expo SDK 52+ React Native app (this document)
│   └── tui/                  # Terminal UI client
├── convex/                   # Shared Convex backend (all apps use this)
├── packages/
│   ├── backend/              # Shared backend utilities
│   ├── types/                # Shared TypeScript types
│   ├── ui/                   # Shared UI primitives (web-only today)
│   └── utils/                # Shared utility functions
├── pnpm-workspace.yaml       # Workspace definition
├── turbo.json                # Turborepo pipeline config
├── tsconfig.base.json        # Shared TypeScript config
└── package.json              # Root dependencies and scripts
```

### Build System

- **Package manager**: pnpm 8.12+ with workspace protocol (`workspace:*`)
- **Build orchestrator**: Turborepo with pipeline caching
- **Workspace packages**: `apps/*` and `packages/*` (defined in `pnpm-workspace.yaml`)
- **Convex backend**: Single `convex/` directory at the monorepo root, shared by all apps. Schema, queries, mutations, and actions are written once and consumed by web, mobile, and TUI clients.

### Turbo Pipeline

The existing `turbo.json` pipeline applies to the mobile app without modification:

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "typecheck": {},
    "test": {},
    "clean": {
      "cache": false
    }
  }
}
```

The mobile app adds its own `dev` script that runs `expo start` and its `build` script that triggers EAS Build.

---

## 2. App Architecture

### Runtime and Framework

- **Expo SDK 52+** with the New Architecture (Fabric renderer, TurboModules) enabled
- **React Native 0.76+** (ships with Expo SDK 52)
- **Hermes** JavaScript engine (default in Expo SDK 52)
- **Android only** for initial release; iOS can be added later with minimal changes

### Routing

- **Expo Router v4** provides file-based routing, analogous to Next.js but for React Native
- Layouts, route groups, and dynamic segments map directly to the file system under `app/`

### Provider Hierarchy

The root layout wraps the entire app in a provider stack. Order matters -- each provider depends on the ones above it.

```
GestureHandlerRootView          -- react-native-gesture-handler root
  SafeAreaProvider               -- react-native-safe-area-context
    ClerkProvider                -- @clerk/clerk-expo, token persistence via SecureStore
      ConvexProviderWithClerk    -- bridges Clerk auth tokens into Convex client
        OfflineCacheProvider     -- MMKV-backed cache hydration layer
          NativeWindProvider     -- NativeWind v4 theme (Tailwind CSS for RN)
            <Slot />             -- Expo Router renders here
```

### Key Dependencies

| Dependency | Purpose |
|---|---|
| `expo` ~52.x | Core SDK, managed workflow |
| `expo-router` ~4.x | File-based navigation |
| `@clerk/clerk-expo` | Authentication |
| `convex` ^1.25 | Real-time backend client |
| `nativewind` ^4.x | Tailwind CSS styling for React Native |
| `react-native-mmkv` | Fast key-value storage (offline cache, preferences) |
| `expo-secure-store` | Encrypted token persistence for Clerk |
| `react-native-reanimated` | Animations (required by Expo Router transitions) |
| `react-native-gesture-handler` | Gesture system |
| `react-native-safe-area-context` | Safe area insets |
| `lucide-react-native` | Icon set (matches web app) |
| `date-fns` | Date formatting (matches web app) |

---

## 3. File Structure

```
apps/mobile/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout (all providers, splash screen)
│   ├── (auth)/
│   │   ├── _layout.tsx           # Auth layout (redirect if already signed in)
│   │   ├── sign-in.tsx           # Sign-in screen
│   │   └── sign-up.tsx           # Sign-up screen
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Bottom tab bar configuration
│   │   ├── index.tsx             # Dashboard (home tab)
│   │   ├── projects.tsx          # Projects list
│   │   └── profile.tsx           # Profile and settings
│   ├── project/
│   │   └── [id].tsx              # Project detail (stack screen)
│   ├── task/
│   │   └── [id].tsx              # Task detail (stack screen)
│   └── capture.tsx               # Quick task capture (presented as modal)
├── components/
│   ├── ui/                       # Base design system components
│   │   ├── BrutalButton.tsx      # Primary button with hard shadow
│   │   ├── BrutalCard.tsx        # Card with 2px border, no border-radius
│   │   ├── BrutalInput.tsx       # Text input with terminal aesthetic
│   │   ├── BrutalBadge.tsx       # Status/priority badges
│   │   ├── BrutalModal.tsx       # Modal container
│   │   ├── TabBar.tsx            # Custom bottom tab bar
│   │   ├── Header.tsx            # Screen header with back navigation
│   │   └── LoadingSpinner.tsx    # Loading indicator
│   └── features/                 # Feature-specific components
│       ├── TaskCard.tsx          # Task list item with status, priority, assignee
│       ├── TaskStatusSelect.tsx  # Status picker (backlog, todo, in_progress, done)
│       ├── ProjectCard.tsx       # Project list item with progress indicator
│       ├── DashboardStats.tsx    # Key metrics cards
│       ├── ActivityFeed.tsx      # Recent activity timeline
│       ├── QuickCaptureForm.tsx  # Minimal task creation form
│       └── MemberAvatar.tsx      # User avatar with online indicator
├── hooks/
│   ├── useCurrentUser.ts        # Clerk user -> Convex user lookup
│   ├── useOfflineCache.ts       # MMKV read/write with Convex sync
│   ├── useWorkspace.ts          # Active workspace context
│   ├── useOptimisticUpdate.ts   # Optimistic mutation wrapper
│   └── useQuickCapture.ts       # Task capture logic with workspace defaults
├── lib/
│   ├── theme.ts                 # Design tokens (colors, typography, spacing)
│   ├── cache.ts                 # MMKV offline cache layer
│   ├── convex.ts                # Convex client initialization
│   ├── clerk.ts                 # Clerk client initialization, SecureStore adapter
│   └── utils.ts                 # Formatters, date helpers, validators
├── providers/
│   └── OfflineCacheProvider.tsx  # Cache hydration and sync context
├── assets/
│   ├── fonts/
│   │   ├── Inter-Regular.ttf
│   │   ├── Inter-Medium.ttf
│   │   ├── Inter-SemiBold.ttf
│   │   ├── Inter-Bold.ttf
│   │   ├── IBMPlexMono-Regular.ttf
│   │   └── IBMPlexMono-Medium.ttf
│   └── images/
│       └── logo.png
├── app.json                     # Expo configuration
├── eas.json                     # EAS Build profiles
├── metro.config.js              # Metro bundler (monorepo-aware)
├── tailwind.config.ts           # NativeWind v4 config
├── nativewind-env.d.ts          # NativeWind type declarations
├── babel.config.js              # Babel with NativeWind and Reanimated plugins
├── tsconfig.json                # TypeScript config extending base
└── package.json                 # App dependencies
```

---

## 4. Navigation Architecture

### Expo Router v4 File-Based Routing

Navigation is defined entirely by the file structure under `app/`. No manual navigator configuration is needed.

### Route Groups

| Group | Purpose | Auth Required |
|---|---|---|
| `(auth)/` | Sign-in and sign-up screens | No (redirects away if signed in) |
| `(tabs)/` | Main tab-based interface | Yes |
| `project/` | Project detail stack | Yes |
| `task/` | Task detail stack | Yes |
| `capture` | Quick task capture modal | Yes |

### Tab Navigator

Three tabs in the bottom tab bar. Minimal surface area for fast access to the most common actions.

| Tab | Screen | Icon | Description |
|---|---|---|---|
| Dashboard | `(tabs)/index.tsx` | `LayoutDashboard` | Stats, recent tasks, activity feed |
| Projects | `(tabs)/projects.tsx` | `FolderKanban` | All projects in active workspace |
| Profile | `(tabs)/profile.tsx` | `User` | Settings, workspace switch, sign out |

### Stack Screens

Stack screens push on top of the tab navigator. The user can swipe back or tap a back button to return.

```
(tabs) [Tab Navigator]
  ├── index.tsx          -> project/[id].tsx  (tap a project)
  ├── index.tsx          -> task/[id].tsx     (tap a task)
  ├── projects.tsx       -> project/[id].tsx  (tap a project)
  └── project/[id].tsx   -> task/[id].tsx     (tap a task within project)
```

### Modal Presentation

`capture.tsx` is presented as a full-screen modal from any screen. It uses Expo Router's `presentation: "modal"` option in the root layout:

```typescript
// app/_layout.tsx
<Stack>
  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
  <Stack.Screen name="project/[id]" options={{ headerShown: true }} />
  <Stack.Screen name="task/[id]" options={{ headerShown: true }} />
  <Stack.Screen name="capture" options={{ presentation: "modal" }} />
</Stack>
```

### Deep Linking

Expo Router v4 provides automatic deep linking based on the file structure. The scheme is configured in `app.json`:

```json
{
  "expo": {
    "scheme": "ltf1",
    "web": {
      "bundler": "metro"
    }
  }
}
```

Deep link examples:
- `ltf1://project/abc123` opens the project detail screen
- `ltf1://task/def456` opens the task detail screen
- `ltf1://capture` opens the quick capture modal

---

## 5. Data Flow

### Convex Real-Time Subscriptions

The mobile app uses the same Convex queries and mutations as the web app. Convex subscriptions are real-time by default -- any database change triggers an automatic re-render.

```typescript
// Reading data -- real-time subscription
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const projects = useQuery(api.projects.queries.listProjects, {
  workspaceId: activeWorkspaceId,
});
```

```typescript
// Writing data -- mutation
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

const updateTask = useMutation(api.tasks.mutations.updateTask);

await updateTask({
  taskId,
  status: "in_progress",
});
```

### Optimistic Updates

Task status changes, the most frequent mutation on mobile, use optimistic updates for instant feedback:

```typescript
const updateTaskStatus = useMutation(api.tasks.mutations.updateTask).withOptimisticUpdate(
  (localStore, args) => {
    const currentTask = localStore.getQuery(api.tasks.queries.getTask, {
      taskId: args.taskId,
    });
    if (currentTask) {
      localStore.setQuery(api.tasks.queries.getTask, { taskId: args.taskId }, {
        ...currentTask,
        status: args.status,
      });
    }
  }
);
```

### Offline Cache Layer

MMKV provides a fast, synchronous key-value store for offline support:

```
App Launch
  │
  ├── 1. MMKV hydrates cached data into React state (instant, <5ms)
  ├── 2. Convex client connects and subscribes to queries
  ├── 3. Real-time data replaces cached data as subscriptions resolve
  └── 4. New data is written back to MMKV for next cold start
```

The cache stores serialized query results keyed by query name and arguments. It does not attempt full offline mutation queuing -- the app requires connectivity for writes.

```typescript
// lib/cache.ts
import { MMKV } from "react-native-mmkv";

export const storage = new MMKV({ id: "ltf1-cache" });

export function getCachedQuery<T>(key: string): T | null {
  const raw = storage.getString(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setCachedQuery<T>(key: string, data: T): void {
  storage.set(key, JSON.stringify(data));
}
```

### Data Flow Diagram

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   React Native   │────>│   Convex Client   │────>│  Convex Backend  │
│   Components     │<────│   (WebSocket)     │<────│  (convex/)       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │
        │  hydrate on launch     │  persist on update
        v                        v
┌─────────────────────────────────┐
│        MMKV Offline Cache        │
└─────────────────────────────────┘
```

---

## 6. Authentication Flow

### Clerk Expo SDK

Authentication is handled by `@clerk/clerk-expo`, which provides the same Clerk identity used by the web app (`@clerk/clerk-react`). Users who sign up on web can sign in on mobile with the same account.

### Token Persistence

Clerk tokens are stored in `expo-secure-store`, an encrypted keychain wrapper:

```typescript
// lib/clerk.ts
import * as SecureStore from "expo-secure-store";

export const tokenCache = {
  async getToken(key: string): Promise<string | null> {
    return await SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },
  async clearToken(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },
};
```

### Provider Setup

```typescript
// app/_layout.tsx
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { tokenCache } from "../lib/clerk";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

export default function RootLayout() {
  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <Slot />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
```

### User Resolution

The Convex backend resolves Clerk subjects to LTF1 users via the `users.by_clerk_id` index:

```typescript
// hooks/useCurrentUser.ts
import { useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-expo";
import { api } from "../../convex/_generated/api";

export function useCurrentUser() {
  const { user: clerkUser } = useUser();
  const convexUser = useQuery(
    api.users.queries.getCurrentUser,
    clerkUser ? {} : "skip"
  );
  return {
    clerkUser,
    user: convexUser,
    isLoading: convexUser === undefined,
  };
}
```

### Route Protection

The `(auth)` group layout redirects signed-in users to the main app. The `(tabs)` group layout redirects unauthenticated users to sign-in.

```typescript
// app/(auth)/_layout.tsx
import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Stack } from "expo-router";

export default function AuthLayout() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
```

```typescript
// app/(tabs)/_layout.tsx
import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Tabs } from "expo-router";

export default function TabsLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;

  return (
    <Tabs screenOptions={{ /* tab bar config */ }}>
      <Tabs.Screen name="index" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="projects" options={{ title: "Projects" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
```

---

## 7. State Management

### No External State Library

The mobile app does not use Redux, Zustand, or MobX. Convex replaces the need for a client-side state management library for server state.

| State Category | Solution | Persistence |
|---|---|---|
| Server state (tasks, projects, users) | Convex `useQuery` / `useMutation` | Convex cloud database |
| Authentication state | Clerk `useAuth` / `useUser` | SecureStore (encrypted) |
| Local UI state (form inputs, modals) | React `useState` / `useReducer` | None (ephemeral) |
| Cached server state (offline) | MMKV via `useOfflineCache` | Device storage |
| User preferences (theme, defaults) | MMKV | Device storage |
| Active workspace | React Context + MMKV | Device storage |

### Convex as State Manager

Convex subscriptions are reactive. When a task is updated by any client (web, mobile, or TUI), all connected clients receive the update within milliseconds. This eliminates the need for manual cache invalidation or refetching.

```
Web app updates task status
        │
        v
Convex database (source of truth)
        │
        ├── Web app subscription fires (re-render)
        ├── Mobile app subscription fires (re-render)
        └── TUI subscription fires (re-render)
```

### Workspace Context

The active workspace is stored in MMKV and exposed via a React context provider:

```typescript
// hooks/useWorkspace.ts
import { createContext, useContext } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { storage } from "../lib/cache";

interface WorkspaceContext {
  activeWorkspaceId: Id<"workspaces"> | null;
  setActiveWorkspace: (id: Id<"workspaces">) => void;
}

const WorkspaceCtx = createContext<WorkspaceContext | null>(null);

export function useWorkspace() {
  const ctx = useContext(WorkspaceCtx);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
```

---

## 8. Metro Bundler Configuration

### Monorepo-Aware Resolution

The Metro bundler must resolve packages from the monorepo root, not just the `apps/mobile/` directory. This is necessary because:

1. The `convex/` directory lives at the project root
2. Shared packages (`@ltf1/types`, `@ltf1/utils`) live under `packages/`
3. pnpm uses symlinks that Metro must follow

```javascript
// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// Resolve modules from both the app directory and the monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Ensure symlinks from pnpm workspaces are followed
config.resolver.disableHierarchicalLookup = false;

module.exports = withNativeWind(config, {
  input: "./global.css",
});
```

### Babel Configuration

Babel must include the NativeWind and Reanimated plugins:

```javascript
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }]],
    plugins: ["nativewind/babel", "react-native-reanimated/plugin"],
  };
};
```

### TypeScript Configuration

The TypeScript config extends the monorepo base and adds path aliases for the Convex directory:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "strict": true,
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "paths": {
      "convex/*": ["../../convex/*"]
    },
    "types": ["nativewind/types"]
  },
  "include": ["**/*.ts", "**/*.tsx", "*.config.js", "*.config.ts"],
  "exclude": ["node_modules"]
}
```

---

## 9. Design System

The mobile app inherits the LTF1 dark brutalist terminal design system documented in `docs_design/`. The same visual identity applies, adapted for touch targets and mobile screen sizes.

### Design Tokens

```typescript
// lib/theme.ts
export const colors = {
  bg: {
    base: "#050505",
    surface: "#0A0A0A",
    card: "#111111",
    elevated: "#1A1A1A",
  },
  text: {
    primary: "#F9FAFB",
    secondary: "#9CA3AF",
    tertiary: "#6B7280",
  },
  accent: {
    default: "#6366F1",
    hover: "#4F46E5",
  },
  border: {
    standard: "#2E2E35",
    subtle: "#1F1F23",
  },
  semantic: {
    green: "#22C55E",
    red: "#EF4444",
    amber: "#F59E0B",
    purple: "#8B5CF6",
    cyan: "#06B6D4",
  },
} as const;

export const typography = {
  fontFamily: {
    sans: "Inter",
    mono: "IBMPlexMono",
  },
} as const;

export const spacing = {
  borderWidth: {
    standard: 2,
    subtle: 1,
  },
  borderRadius: {
    none: 0,      // cards
    sm: 8,        // buttons
    md: 12,       // containers
  },
  shadow: {
    hard: {
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 0,
      shadowColor: "#000000",
      elevation: 4,
    },
  },
} as const;
```

### NativeWind Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: { base: "#050505", surface: "#0A0A0A", card: "#111111" },
        accent: { DEFAULT: "#6366F1", hover: "#4F46E5" },
        border: { standard: "#2E2E35", subtle: "#1F1F23" },
      },
      fontFamily: {
        sans: ["Inter"],
        mono: ["IBMPlexMono"],
      },
      borderRadius: {
        brutal: "0px",
      },
    },
  },
  plugins: [],
} satisfies Config;
```

### Touch Target Guidelines

All interactive elements have a minimum touch target of 44x44 points, per Android accessibility guidelines. Buttons use 48px height minimum. List items use 56px minimum height.

---

## 10. EAS Build Configuration

```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-services.json",
        "track": "internal"
      }
    }
  }
}
```

---

## 11. Environment Variables

The mobile app uses Expo's `EXPO_PUBLIC_` prefix for client-side environment variables:

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_CONVEX_URL` | Convex deployment URL (same as web app) |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (same Clerk app, different client) |

These are set in the EAS build profiles or in a local `.env` file during development.

---

## 12. Key Schema References

The mobile app reads from and writes to the same Convex tables as the web app. The most frequently accessed tables on mobile are:

| Table | Mobile Usage |
|---|---|
| `users` | Current user lookup via `by_clerk_id` index |
| `workspaces` | Workspace list and active workspace |
| `workspaceMembers` | Membership check via `by_workspace_user` index |
| `projects` | Project listing and detail |
| `tasks` | Task listing, detail, status updates, quick capture |
| `sprints` | Active sprint display on dashboard |
| `activities` | Activity feed on dashboard |
| `notifications` | Push notification triggers |

No schema changes are required for mobile. The existing Convex backend serves both web and mobile clients.
