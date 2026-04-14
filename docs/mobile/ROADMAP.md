# LTF1 Mobile App Roadmap

React Native (Expo SDK 52+) with NativeWind v4, Clerk auth, and Convex backend.
Target: Internal APK in 7 days, public release post-MVP.

---

## Phase 1: Scaffold and Auth (Day 1-2)

### Objectives

Stand up the Expo project inside the existing monorepo, wire authentication end-to-end, and confirm a signed-in user can reach an empty authenticated screen.

### Tasks

1. Delete all existing content under `apps/mobile/`.
2. Initialize a fresh Expo SDK 52 project with Expo Router (file-based routing) in `apps/mobile/`.
3. Configure monorepo integration:
   - `metro.config.js` -- resolve shared packages from workspace root.
   - `tsconfig.json` -- extend root config, add path aliases.
   - Add `apps/mobile` to `pnpm-workspace.yaml`.
4. Install and configure NativeWind v4:
   - `tailwind.config.js` with LTF1 design tokens (colors, fonts, spacing).
   - `babel.config.js` with NativeWind preset.
   - Verify a styled component renders correctly on iOS and Android.
5. Install and configure `@clerk/clerk-expo`:
   - `ClerkProvider` in root layout with `tokenCache` using `expo-secure-store`.
   - Environment variable: `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`.
6. Set up `ConvexProviderWithClerk`:
   - Wrap authenticated routes with `ConvexProviderWithClerk`.
   - Environment variable: `EXPO_PUBLIC_CONVEX_URL`.
   - Verify Convex client connects and authenticates with Clerk token.
7. Build auth screens:
   - Sign-in screen: email + password, OAuth buttons (Google, GitHub).
   - Sign-up screen: name, email, password, verification code.
   - Shared auth layout with LTF1 branding.
8. Implement auth gate:
   - Redirect unauthenticated users to sign-in.
   - Redirect authenticated users to dashboard.
9. End-to-end test: sign up, sign in, reach empty dashboard, sign out.

### Milestone

User can sign in via Clerk, authenticate with Convex, and land on an empty dashboard screen.

### Key Decisions

- Use `expo-secure-store` for token caching (not AsyncStorage).
- Use Expo Router `_layout.tsx` files for auth gating (not manual navigation).
- Do not install `react-navigation` -- Expo Router handles all routing.

---

## Phase 2: Dashboard and Navigation (Day 2-3)

### Objectives

Build the tab bar navigation structure, implement all base UI components, and render a functional dashboard with live Convex data.

### Tasks

1. Build tab bar layout with three tabs:
   - Dashboard (`/(tabs)/index.tsx`)
   - Projects (`/(tabs)/projects.tsx`)
   - Profile (`/(tabs)/profile.tsx`)
   - Tab bar: `bg-[#050505] border-t border-[#1F1F23]`, icons 24x24.
   - Active tab: accent icon + label. Inactive: tertiary icon, no label.
2. Implement base UI components (see COMPONENT_LIBRARY.md):
   - BrutalCard (default, bordered, elevated variants)
   - BrutalButton (primary, secondary, ghost, danger variants)
   - BrutalBadge (all semantic colors)
   - BrutalInput (label, error, multiline states)
   - BrutalSelect (bottom sheet picker)
   - Avatar (image and initials fallback)
   - Skeleton (animated pulse)
   - Divider
3. Build Dashboard screen:
   - Header: workspace name + user avatar.
   - Stat cards row (horizontal scroll): open tasks, overdue, completed this week, active projects.
   - Workspace cards: list of user workspaces with member counts.
   - Activity feed: last 10 activities with pull-to-refresh.
4. Connect Dashboard to Convex queries:
   - Use `useQuery` from `convex/react` for all data fetching.
   - Use the existing `convex/dashboard/queries.ts` combined query.
5. Implement pull-to-refresh:
   - `RefreshControl` on `ScrollView` or `FlatList`.
   - Invalidate Convex queries on pull.
6. Implement loading states:
   - Skeleton screens for each dashboard section.
   - Transition from skeleton to data with fade animation.

### Milestone

Dashboard screen shows real workspace data from Convex -- stat cards, workspace list, and activity feed -- with pull-to-refresh.

### Key Decisions

- Use `FlashList` (from `@shopify/flash-list`) for the activity feed, not `FlatList`.
- Stat cards scroll horizontally; workspace cards and activities scroll vertically.
- Tab bar uses custom styling, not default Expo Router tab bar appearance.

---

## Phase 3: Projects and Tasks (Day 3-5)

### Objectives

Build the full project-to-task navigation flow: project list, project detail with task list, and task detail with edit capability.

### Tasks

1. Build Projects list screen:
   - Search bar at top (BrutalInput with search icon).
   - StatusChip filter row (All, Active, Completed, Archived).
   - Project grid: 2-column layout using `FlashList` with `numColumns={2}`.
   - Each item renders ProjectCard component.
2. Build ProjectCard component:
   - Project key (mono), name, status badge, progress bar, task count.
   - Pressable -- navigates to project detail.
3. Build Project detail screen (`/projects/[id].tsx`):
   - Header: project name, key, status badge, description.
   - StatusChip filter row for task statuses.
   - Task list using `FlashList`.
   - FAB for quick task creation.
4. Build TaskCard component:
   - Priority badge, title, assignee avatars, due date, type badge.
   - Swipe right to mark done (green, check icon).
   - Swipe left to delete (red, trash icon, with confirmation alert).
   - Haptic feedback on swipe threshold.
5. Build Task detail screen (`/tasks/[id].tsx`):
   - Full task information: title, description, status, priority, type.
   - Assignee list with avatars.
   - Due date display.
   - Edit button in header -- navigates to edit mode.
6. Build Task edit mode:
   - Inline editing of title, description.
   - BrutalSelect for status, priority, type.
   - Save and cancel buttons.
7. Wire mutations:
   - `updateTaskStatus` -- swipe and detail screen status changes.
   - `updateTask` -- edit mode saves.
   - `deleteTask` -- swipe left action.
   - Optimistic updates where possible using Convex's built-in optimistic update support.

### Milestone

User can browse projects, view task lists, swipe to change task status, open task details, and edit task fields -- all connected to live Convex data.

### Key Decisions

- Use `useRouter()` from Expo Router for navigation, not `navigation.navigate()`.
- Task swipe uses `react-native-gesture-handler` Swipeable, not custom pan responder.
- Confirmation alert on delete uses `Alert.alert()` (native) for reliability.
- FlashList `estimatedItemSize` set to 72 for TaskCard, 140 for ProjectCard.

---

## Phase 4: Quick Capture and Polish (Day 5-6)

### Objectives

Add the quick capture flow for task creation from anywhere in the app. Polish all screens with loading states, empty states, error handling, and micro-interactions.

### Tasks

1. Build Quick Capture modal:
   - Triggered by FAB on any screen.
   - Bottom sheet (60% screen height) using `@gorhom/bottom-sheet`.
   - Fields: title (required), project (BrutalSelect), priority (BrutalSelect), description (multiline, optional).
   - Submit button calls `createTask` mutation.
   - Close on successful creation with success haptic.
2. Integrate task creation mutation:
   - Validate required fields before submission.
   - Show inline errors on invalid fields.
   - Loading state on submit button.
   - Dismiss sheet and navigate to new task on success.
3. Add loading skeletons for all screens:
   - Dashboard: 3 stat card skeletons, 2 workspace card skeletons, 5 activity row skeletons.
   - Projects: 4 project card skeletons in grid.
   - Task list: 5 task card skeletons.
   - Task detail: full-page skeleton layout.
4. Add empty states for all lists:
   - Projects list: "No projects yet" with create CTA.
   - Task list: "No tasks in this project" with create CTA.
   - Activity feed: "No recent activity" (no CTA).
   - Search results: "No results found" with suggestion text.
5. Add error boundaries:
   - Root error boundary in `_layout.tsx`.
   - Screen-level error boundaries with retry button.
   - Network error state with retry.
   - Display: BrutalCard with red border, error icon, message, retry BrutalButton.
6. Add haptic feedback to all interactive elements:
   - Button presses: light impact.
   - Swipe completions: success notification.
   - FAB press: medium impact.
   - Destructive actions: warning notification.
7. Add micro-animations:
   - List items: staggered fade-in on initial load (50ms delay between items).
   - Cards: `pressIn` scale to 0.98, `pressOut` back to 1.0.
   - Status changes: brief color flash on the badge.
   - Respect `useReducedMotion()` system setting.

### Milestone

Users can create tasks from anywhere via the FAB. All screens have loading, empty, and error states. Interactions feel responsive with haptics and animation.

### Key Decisions

- Quick Capture is a bottom sheet, not a full-screen modal -- faster to open and dismiss.
- Error boundaries use a custom component, not `react-native-error-boundary` package.
- Haptics use `expo-haptics`, not a third-party library.
- Animations use `react-native-reanimated` layout animations for list item entrance.

---

## Phase 5: Offline Cache and APK (Day 6-7)

### Objectives

Add offline data caching so the app is usable without network, run a final performance audit, and produce an internal APK via EAS Build.

### Tasks

1. Install and configure MMKV:
   - `react-native-mmkv` for fast synchronous key-value storage.
   - Create cache utility: `cacheGet`, `cacheSet`, `cacheClear` with typed wrappers.
   - TTL support: default 5 minutes, configurable per cache key.
2. Implement cache hydration layer:
   - On Convex query success, write results to MMKV with timestamp.
   - On app cold start, hydrate screens from cache before Convex connection is established.
   - Show cached data immediately, replace with fresh data when Convex connects.
   - Visual indicator: subtle "Updated just now" / "Cached 2m ago" timestamp on pull-to-refresh.
3. Implement offline detection and banner:
   - Use `@react-native-community/netinfo` for connection monitoring.
   - Render OfflineBanner component when `isConnected === false`.
   - Disable mutation buttons when offline (show toast explaining why).
4. Performance audit:
   - Replace any remaining `FlatList` with `FlashList`.
   - Audit image loading: use `expo-image` with proper cache headers.
   - Verify list `estimatedItemSize` values are accurate.
   - Profile with React DevTools -- no unnecessary re-renders.
   - Verify JS bundle size is under 2MB.
   - Test cold start time target: under 2 seconds on mid-range device.
5. Configure EAS Build:
   - `eas.json` with `preview` and `production` profiles.
   - `preview` profile: internal distribution, APK output.
   - `production` profile: AAB output for Play Store (future).
   - Environment variables in EAS secrets.
6. Generate internal APK:
   - Run `eas build --platform android --profile preview`.
   - Verify APK installs and runs on physical device.
   - Test sign-in, dashboard, projects, tasks, quick capture, offline mode.
7. Internal team distribution:
   - Share APK via EAS internal distribution link.
   - Collect feedback for 48 hours before proceeding to future phases.

### Milestone

APK distributed to internal team. App works offline with cached data and gracefully handles network transitions.

### Key Decisions

- Use MMKV over AsyncStorage for 30x faster reads.
- Cache layer is read-through: always try Convex first, fall back to cache.
- No offline write queue in MVP -- mutations require network. Queued writes deferred to Phase 7.
- EAS Build used over local builds for consistency and CI readiness.

---

## Dependencies

```
Phase 1 (Scaffold + Auth)
    |
    v
Phase 2 (Dashboard + Navigation)
    |
    v
Phase 3 (Projects + Tasks)
   / \
  /   \
 v     v
Phase 4 (Quick Capture + Polish)    [partial overlap OK]
 \     /
  \   /
   v v
Phase 5 (Offline Cache + APK)
```

- Phase 2 is blocked by Phase 1. Auth must work before building authenticated screens.
- Phase 3 is blocked by Phase 2. Base components and navigation structure must exist.
- Phase 4 can partially overlap with Phase 3. Quick capture depends on task creation mutation (Phase 3 task 7), but polish work (skeletons, empty states) can start as soon as screens exist.
- Phase 5 is blocked by Phase 3. Screens must be built before caching their data.

---

## Future Phases (Post-MVP)

These phases are planned but not scheduled. Priorities will be determined by internal team feedback after the MVP APK is distributed.

### Phase 6: Push Notifications

- Firebase Cloud Messaging (FCM) integration via `expo-notifications`.
- Notification types: task assigned, task due soon, task completed, mentioned in comment.
- Convex action to send push via FCM HTTP API.
- Notification preferences screen in Profile tab.
- Deep linking from notification tap to relevant screen.

### Phase 7: Offline Write Queue

- Queue mutations in MMKV when offline.
- Replay queue on reconnect with conflict resolution.
- Visual indicator for pending (unsynced) mutations.
- Retry with exponential backoff on failure.
- Conflict resolution strategy: last-write-wins with user notification.

### Phase 8: iOS Build and TestFlight

- EAS Build for iOS (`production` profile).
- Apple Developer account setup.
- App Store Connect configuration.
- TestFlight internal distribution.
- iOS-specific polish: safe area handling, dynamic type support.

### Phase 9: Play Store Submission

- Play Console developer account setup.
- Store listing: screenshots, description, feature graphic.
- Privacy policy and data safety form.
- Internal testing track, then open testing, then production.
- Target: 3-5 day review cycle.

### Phase 10: Sprint Board and Time Tracking

- Kanban board view with drag-and-drop (columns by status).
- Sprint management: create sprint, add tasks, start/complete sprint.
- Time tracking: start/stop timer per task, manual time entry.
- Sprint burndown chart.
- Weekly time report per user.

---

## Technical Constraints

| Constraint             | Target                          |
|------------------------|---------------------------------|
| Expo SDK               | 52+                             |
| React Native           | 0.76+                           |
| Minimum Android API    | 24 (Android 7.0)                |
| Minimum iOS version    | 15.0                            |
| JS bundle size         | Under 2MB                       |
| Cold start time        | Under 2 seconds (mid-range)     |
| Min touch target       | 44x44 points                    |
| Offline cache TTL      | 5 minutes default               |
| Auth provider          | Clerk (existing)                |
| Backend                | Convex (existing)               |
| State management       | Convex reactive queries (no Redux/Zustand) |

## Package Dependencies (MVP)

| Package                                | Purpose                      |
|----------------------------------------|------------------------------|
| `expo` (SDK 52)                        | Framework                    |
| `expo-router`                          | File-based routing           |
| `nativewind` (v4)                      | Tailwind on React Native     |
| `@clerk/clerk-expo`                    | Authentication               |
| `convex`                               | Backend client               |
| `@gorhom/bottom-sheet`                 | Bottom sheet modals          |
| `react-native-gesture-handler`         | Swipe gestures               |
| `react-native-reanimated`              | Animations                   |
| `@shopify/flash-list`                  | Performant lists             |
| `react-native-mmkv`                    | Offline cache                |
| `@react-native-community/netinfo`     | Network detection            |
| `expo-haptics`                         | Haptic feedback              |
| `expo-image`                           | Optimized image loading      |
| `expo-font`                            | Custom font loading          |
| `expo-secure-store`                    | Secure token storage         |
| `expo-splash-screen`                   | Splash screen management     |
