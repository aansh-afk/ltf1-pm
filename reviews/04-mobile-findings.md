# Phase 4 - Mobile Findings

Date: 2026-04-29
Scope: `apps/mobile`
Contract source: `reviews/01-backend-map.md`

## 1. Rendering and layout: safe area insets, keyboard covers input, small/large phone layout, tablet/foldable layout, dark mode, dynamic type.

### Finding C-001: Capture modal ignores safe area and keyboard avoidance

- **Severity:** High
- **Surface:** Mobile
- **Category:** UX | UI
- **Location:** `apps/mobile/app/capture.tsx`:120-264
- **Observed behavior:** The task capture screen renders in a plain `View`, auto-focuses the title field, and pins the create button at the bottom of a flex layout without `SafeAreaView`, `useSafeAreaInsets`, `KeyboardAvoidingView`, or a scroll container. The screen also sets `presentation: "modal"` and `animation: "slide_from_bottom"` while placing the handle at `pt-2`, which can sit under notches/status areas.
- **Expected behavior:** Modal task entry should respect top/bottom safe-area insets and keep the focused input and submit button visible above the keyboard on small phones. This checklist explicitly requires safe-area and keyboard coverage review.
- **Impact:** Users on notched iPhones, Android devices with gesture navigation, or small screens can have the modal handle, title field, or create button obscured by the status area, home indicator, or keyboard during the primary task-creation flow.
- **Root cause hypothesis:** The capture screen was built as a custom modal layout but did not reuse the safe-area and keyboard handling used by the auth forms.
- **Proposed fix:** Wrap the modal content in safe-area-aware layout, add keyboard avoidance or a keyboard-aware scroll view, and apply bottom inset padding to the submit area while preserving the modal animation.
- **Risk of fix:** Modal spacing can regress on tablets and Android; verify task creation on iOS/Android with software keyboard open, hardware keyboard, small phone, and gesture-navigation devices.
- **Estimated effort:** S

### Finding C-002: Large text and small screens can clip or hide auth forms

- **Severity:** Medium
- **Surface:** Mobile
- **Category:** A11y | UX
- **Location:** `apps/mobile/app/(auth)/sign-in.tsx`:48-119; `apps/mobile/app/(auth)/sign-up.tsx`:71-173
- **Observed behavior:** Sign-in and sign-up screens use a centered `KeyboardAvoidingView` with no `ScrollView`. All labels, headings, error text, links, and buttons use fixed pixel font sizes. When verification is pending, the sign-up screen swaps in another fixed-height form in the same non-scrollable centered container.
- **Expected behavior:** Auth forms should remain reachable on small screens and under large Dynamic Type/TalkBack font settings, including when the keyboard and error messages are visible.
- **Impact:** Users with accessibility text scaling or small devices can lose access to the submit button, verification input, or sign-in/sign-up link, blocking authentication.
- **Root cause hypothesis:** The auth screens assume the form always fits vertically and do not provide overflow behavior for keyboard plus scaled text.
- **Proposed fix:** Add a scrollable keyboard-aware container, preserve visible focus when inputs are focused, and audit text scaling with maximum multipliers only where necessary.
- **Risk of fix:** Keyboard offset behavior differs by platform; test sign-in, sign-up, verification, and error states on iOS and Android.
- **Estimated effort:** S

### Finding C-003: App is hard-locked to portrait and dark UI style

- **Severity:** Low
- **Surface:** Mobile
- **Category:** UX
- **Location:** `apps/mobile/app.json`:7-10
- **Observed behavior:** Expo config sets `orientation` to `portrait` and `userInterfaceStyle` to `dark`. The UI uses dark-only tokens and a light status bar, with no alternate appearance path for user/system light mode.
- **Expected behavior:** The checklist requires explicit review of tablet/foldable layout and dark mode. Tablet/foldable users should not be forced into a phone-only portrait layout unless the product intentionally excludes those form factors, and color scheme should either follow system appearance or document dark-only support.
- **Impact:** Tablet and foldable users get a constrained portrait phone experience. Users who prefer light mode cannot opt out of the dark UI.
- **Root cause hypothesis:** The first mobile release optimized for phone portrait and hard-coded the visual theme in config and tokens.
- **Proposed fix:** Decide whether tablet/foldable and light mode are supported. If supported, allow relevant orientations/form factors and add responsive/light theme tokens; if unsupported, document the limitation and configure store metadata accordingly.
- **Risk of fix:** Supporting landscape/tablet can expose many layout assumptions in grids, headers, FAB placement, and bottom sheets; test all app routes on tablet/foldable simulators.
- **Estimated effort:** M

## 2. Lifecycle: state lost on background/foreground, restoration after process death, deep link screen routing, push notification tap routing, stale app badge.

### Finding C-004: No push notification or badge lifecycle handling exists

- **Severity:** Medium
- **Surface:** Mobile
- **Category:** UX | Bug
- **Location:** `apps/mobile/package.json`:15-43; `apps/mobile/app/_layout.tsx`:25-36
- **Observed behavior:** The mobile dependencies and root layout do not include `expo-notifications`, notification registration, notification tap listeners, badge clearing, or routing from a notification payload. The backend contract includes notifications APIs and push subscription helpers in `notificationQueries`, `notifications.config`, and `notifications.push_helpers`.
- **Expected behavior:** A mobile app backed by notification and push subscription APIs should register for push notifications, handle notification tap routing to the target workspace/project/task when payload links are present, and clear or refresh stale app badges on foreground/resume.
- **Impact:** Mobile users cannot receive native task/workspace notifications, tapping notifications cannot open the relevant screen, and badges can become stale if added later without centralized lifecycle handling.
- **Root cause hypothesis:** Notification support exists on the backend but has not been wired into the Expo app.
- **Proposed fix:** Add notification registration after sign-in, subscribe/unsubscribe through the documented backend functions, install foreground/background/tap listeners in the root layout, and reconcile badge count from `getUnreadCount` on app foreground.
- **Risk of fix:** Requires platform-specific permission UX and payload schema agreement; test denied permissions, cold-start notification taps, warm taps, and sign-out cleanup.
- **Estimated effort:** M

### Finding C-005: Invalid or stale deep links can call Convex with unchecked IDs

- **Severity:** Medium
- **Surface:** Mobile
- **Category:** Bug
- **Location:** `apps/mobile/app/project/[id].tsx`:71-78; `apps/mobile/app/task/[id].tsx`:64-74; `apps/mobile/app/capture.tsx`:35-42,103-105
- **Observed behavior:** Route params are cast directly to Convex IDs with `const projectId = id as Id<"projects">` and `const taskId = id as Id<"tasks">`; the capture modal also casts `projectId` from search params before `createTask`. These screens then call `getProject`, `getProjectTasks`, `getTask`, `updateTask`, `deleteTask`, and `createTask` without validating that the route value exists, is a string, or has a valid format.
- **Expected behavior:** Deep-linked screens should validate route params before backend calls and show a recoverable error state for missing/malformed/stale IDs. The backend map defines strict Convex ID validators on ID-based APIs, so arbitrary strings are not a safe client contract.
- **Impact:** A malformed universal/deep link, stale notification payload, or manually edited URL can trigger Convex validation errors instead of a clean not-found screen, producing user-visible crashes or error overlays.
- **Root cause hypothesis:** Expo route params were trusted as typed values even though they are runtime strings from external input.
- **Proposed fix:** Add lightweight route-param guards before queries/mutations, skip queries until the ID is valid, and render an explicit invalid-link state with navigation back to a safe route.
- **Risk of fix:** Overly strict validation can reject legitimate Convex IDs if the format check is wrong; prefer using generated ID semantics conservatively and test valid, missing, and malformed links.
- **Estimated effort:** S

### Finding C-006: Task detail performs navigation as a render side effect

- **Severity:** Medium
- **Surface:** Mobile
- **Category:** Bug
- **Location:** `apps/mobile/app/task/[id].tsx`:146-150
- **Observed behavior:** When `task === null`, the component calls `router.back()` during render and returns `null`.
- **Expected behavior:** Navigation side effects should run from an effect or user action, not during render. A deleted/not-found task should render a stable state or schedule navigation after commit.
- **Impact:** If a task is deleted while viewing, render can trigger repeated navigation attempts or React warnings, and the user has no readable deleted/not-found state if there is no back stack.
- **Root cause hypothesis:** The not-found branch was treated as an imperative redirect path rather than part of the component lifecycle.
- **Proposed fix:** Move the back navigation into `useEffect` or replace it with an `EmptyState` that offers an explicit safe navigation action.
- **Risk of fix:** Changing deleted-task behavior affects post-delete and live-update flows; test deleting the current task, opening a stale task link, and cold-starting directly to a deleted task route.
- **Estimated effort:** S

## 3. Navigation: back gesture, modal popping, stack leaks, double-tap pushes.

### Finding C-007: Navigable cards and FABs are not debounced against rapid double taps

- **Severity:** Low
- **Surface:** Mobile
- **Category:** UX | Bug
- **Location:** `apps/mobile/app/(tabs)/index.tsx`:196-205; `apps/mobile/app/(tabs)/index.tsx`:232-234; `apps/mobile/app/(tabs)/projects.tsx`:220-230; `apps/mobile/app/project/[id].tsx`:293-314; `apps/mobile/app/project/[id].tsx`:405-413
- **Observed behavior:** Workspace cards, project cards, task cards, and FABs call `router.push` directly on every press. There is no disabled state, transition guard, or use of `router.navigate`/dedupe behavior for repeated taps.
- **Expected behavior:** Navigation actions that push stack routes should prevent accidental duplicate pushes during tap bursts and transition animations.
- **Impact:** Fast double taps can stack duplicate project, task, or capture screens, requiring extra backs and potentially causing users to edit/delete from an unexpected duplicate screen instance.
- **Root cause hypothesis:** Press handlers were kept simple and rely on the navigator to tolerate repeated pushes.
- **Proposed fix:** Add a short in-flight guard around push actions or use navigation APIs/patterns that avoid pushing the same route while already navigating.
- **Risk of fix:** Over-aggressive debouncing can ignore legitimate quick navigation; test repeated taps and normal back behavior across tabs and modal screens.
- **Estimated effort:** S

## 4. Forms and input: keyboard type, autocorrect on usernames, textContentType/autofill hints, password manager fill.

### Finding C-008: Auth inputs omit autofill and autocorrect hints

- **Severity:** Medium
- **Surface:** Mobile
- **Category:** UX | A11y
- **Location:** `apps/mobile/app/(auth)/sign-in.tsx`:71-89; `apps/mobile/app/(auth)/sign-up.tsx`:97-105; `apps/mobile/app/(auth)/sign-up.tsx`:123-141
- **Observed behavior:** Email inputs set `keyboardType="email-address"` and `autoCapitalize="none"`, but do not set `autoCorrect={false}`, `textContentType`, `autoComplete`, or equivalent hints. Password inputs use `secureTextEntry` but omit password-manager hints such as current/new password. The verification code field uses `number-pad` but omits one-time-code autofill metadata.
- **Expected behavior:** Login, registration, password, and verification fields should provide platform autofill hints so iOS/Android password managers and email-code autofill can work reliably.
- **Impact:** Users have to type credentials and verification codes manually more often, increasing failed sign-ins and friction for password-manager users.
- **Root cause hypothesis:** The forms added keyboard types but did not complete the platform input metadata matrix.
- **Proposed fix:** Add appropriate `autoComplete`, `textContentType`, `autoCorrect={false}`, and one-time-code hints to each auth input, with platform-specific values where needed.
- **Risk of fix:** Incorrect hints can cause wrong autofill suggestions; test sign-in, sign-up, and verification on iOS and Android password managers.
- **Estimated effort:** S

## 5. Network and offline: offline state, retry, request deduplication on reconnect, sync lost on backgrounding.

### Finding C-009: Offline cache is only applied to profile workspaces

- **Severity:** Medium
- **Surface:** Mobile
- **Category:** UX | Bug
- **Location:** `apps/mobile/app/(tabs)/index.tsx`:57; `apps/mobile/app/(tabs)/projects.tsx`:56; `apps/mobile/app/project/[id].tsx`:76-77; `apps/mobile/app/task/[id].tsx`:72; `apps/mobile/app/(tabs)/profile.tsx`:34-37
- **Observed behavior:** The app implements `useOfflineCache`, but only the profile screen uses it for `getUserWorkspaces`. Dashboard, projects, project detail, and task detail use raw `useQuery`, so they return loading/undefined or stale live-subscription behavior without cached fallback when offline.
- **Expected behavior:** If the app advertises offline/cached behavior through `OfflineBanner`, core read-only screens should consistently render cached data or a clear unavailable state when disconnected.
- **Impact:** Offline users can see cached workspaces on Profile but lose dashboard, project, and task context elsewhere. This is inconsistent and can make field work or commuting usage unreliable.
- **Root cause hypothesis:** Offline caching was introduced as a hook but not systematically applied to all read paths.
- **Proposed fix:** Apply the cache wrapper to the primary query screens, define which data is safe to cache, and add explicit stale indicators plus retry behavior for mutations.
- **Risk of fix:** Cached stale data can mislead users; add visible stale state and test cache expiry, sign-out clearing, and reconnect refresh.
- **Estimated effort:** M

### Finding C-010: Pull-to-refresh does not actually refetch or reconnect data

- **Severity:** Low
- **Surface:** Mobile
- **Category:** UX | Bug
- **Location:** `apps/mobile/app/(tabs)/index.tsx`:60-65; `apps/mobile/app/(tabs)/projects.tsx`:62-66; `apps/mobile/app/project/[id].tsx`:85-89
- **Observed behavior:** Pull-to-refresh only sets `refreshing` for 800ms with `setTimeout`, relying on Convex subscriptions to auto-refresh. It does not trigger a reconnection, cache invalidation, retry, or explicit query refresh.
- **Expected behavior:** A visible refresh gesture should either perform a real data refresh/reconnect attempt or avoid implying that a manual network refresh occurred.
- **Impact:** Users with stale data or a recently restored connection can pull to refresh and see a success-looking spinner without any actual fetch/retry behavior.
- **Root cause hypothesis:** Convex live queries were assumed to make manual refresh unnecessary, but the UI still exposes a manual refresh affordance.
- **Proposed fix:** Either remove fake refresh controls or wire them to a real reconnect/cache refresh strategy and show offline failure when refresh cannot complete.
- **Risk of fix:** Manual reconnection behavior may be Convex-client-specific; test offline, airplane-mode recovery, and background/foreground resume.
- **Estimated effort:** S

## 6. Performance: list scroll jank, image caching/sizing, unnecessary re-renders, main thread blocking, app launch >2s risk.

### Finding C-011: Project task list renders all tasks inside a ScrollView

- **Severity:** Medium
- **Surface:** Mobile
- **Category:** Perf
- **Location:** `apps/mobile/app/project/[id].tsx`:189-320
- **Observed behavior:** Project detail uses a `ScrollView` and maps every grouped task into `TaskCard` components. There is no virtualization, pagination, estimated item sizing, or incremental rendering.
- **Expected behavior:** Potentially large task collections should use a virtualized list (`FlatList`/FlashList) or pagination to avoid rendering the whole project board on the main thread.
- **Impact:** Large projects can experience slow screen loads, memory spikes, and scroll jank on mid-range phones.
- **Root cause hypothesis:** Grouped sections were easier to implement in a `ScrollView`, despite `@shopify/flash-list` being available in dependencies.
- **Proposed fix:** Replace the task rendering path with a virtualized section/list strategy, or paginate task groups so only visible cards render.
- **Risk of fix:** Section collapse state and accessibility order can regress; test large projects, collapsed/expanded groups, and navigation to task detail.
- **Estimated effort:** M

### Finding C-012: Network status polling scales with mounted screens

- **Severity:** Low
- **Surface:** Mobile
- **Category:** Perf | Battery
- **Location:** `apps/mobile/hooks/useNetworkStatus.ts`:33-49
- **Observed behavior:** Every `useNetworkStatus` consumer starts a `setInterval` that polls Convex connection state every 3 seconds. Profile, capture, and task detail each use the hook, and additional future screens would add more intervals.
- **Expected behavior:** Connection status should be centralized or event-driven where possible instead of creating per-screen polling timers.
- **Impact:** The current app has low overhead, but backgrounded or stacked screens can accumulate unnecessary timers, increasing battery use and creating avoidable state updates.
- **Root cause hypothesis:** Convex connection state was polled locally because no app-level network provider exists.
- **Proposed fix:** Move network/Convex connectivity into a root provider with a single subscription/poll loop and expose context to screens.
- **Risk of fix:** Provider placement around Convex/Clerk matters; test signed-in, signed-out, reconnect, and screen transition states.
- **Estimated effort:** S

## 7. Permissions: up-front permission requests, denial path, Android rationale, Settings link.

No issues found. The audited mobile app does not currently request native runtime permissions such as camera, location, media library, or notifications.

## 8. Accessibility: VoiceOver/TalkBack labels, focus order, dynamic type clipping, contrast, gesture alternatives.

### Finding C-013: Custom select bottom sheet lacks modal accessibility semantics

- **Severity:** Medium
- **Surface:** Mobile
- **Category:** A11y
- **Location:** `apps/mobile/components/ui/BrutalSelect.tsx`:55-114
- **Observed behavior:** `BrutalSelect` opens a Gorhom bottom sheet and renders radio-like options, but the sheet has no modal accessibility labeling, no explicit focus management, no close/cancel control, and no announced expanded/collapsed state on the trigger.
- **Expected behavior:** Custom picker/bottom-sheet controls should communicate expanded state, trap or guide screen-reader focus while open, announce the option group, and provide an accessible close path.
- **Impact:** VoiceOver/TalkBack users can struggle to understand that a modal selection surface opened, where focus moved, or how to dismiss without selecting.
- **Root cause hypothesis:** Visual bottom-sheet behavior was implemented without adding the accessibility semantics normally provided by native pickers.
- **Proposed fix:** Add appropriate accessibility state/labels to the trigger, modal semantics to the sheet content, focus placement on open, and a visible/accessibility-labeled close action.
- **Risk of fix:** Bottom-sheet accessibility behavior differs between platforms; test with VoiceOver, TalkBack, keyboard focus, and reduced motion.
- **Estimated effort:** M

### Finding C-014: Swipe actions have no accessible action alternative on task cards

- **Severity:** Low
- **Surface:** Mobile
- **Category:** A11y | UX
- **Location:** `apps/mobile/components/features/TaskCard.tsx`:79-91; `apps/mobile/components/features/TaskCard.tsx`:140-150
- **Observed behavior:** `TaskCard` supports swipe right to mark done and swipe left to delete when handlers are provided, but the accessible element only exposes a generic button label. It does not define accessibility actions or visible buttons for the swipe actions.
- **Expected behavior:** Gesture-only task actions should have non-gesture alternatives for screen-reader, switch-control, keyboard, and motor-impaired users.
- **Impact:** Users who cannot perform horizontal swipe gestures cannot discover or invoke quick mark-done/delete actions when those handlers are enabled.
- **Root cause hypothesis:** Swipe affordances were added visually without matching React Native accessibility actions.
- **Proposed fix:** Add `accessibilityActions`/`onAccessibilityAction` for supported actions or expose equivalent visible controls in an overflow/action menu.
- **Risk of fix:** Extra actions must not conflict with the card's primary navigation action; test with VoiceOver/TalkBack and normal touch gestures.
- **Estimated effort:** S

## 9. Platform conventions: iOS/Android design mismatches, custom controls lacking platform haptics/animations, status bar style.

No issues found beyond C-003, C-013, and C-014. The app consistently uses custom dark brutalist controls and includes haptics on key custom buttons/cards.

## 10. Battery and data: polling when push would do, location usage, large cellular downloads.

See C-004 for missing push-notification integration and C-012 for per-screen Convex connection polling. No location usage or large cellular download path was found in the audited mobile source.

## 11. Crash and error handling: uncaught promise rejections, force unwraps/non-null env assertions, threading violations.

### Finding C-015: Required public environment variables are force-unwrapped at module load

- **Severity:** Medium
- **Surface:** Mobile
- **Category:** Bug | DX
- **Location:** `apps/mobile/app/_layout.tsx`:11-15; `apps/mobile/lib/convex.ts`:3-5
- **Observed behavior:** `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` and `EXPO_PUBLIC_CONVEX_URL` are read with non-null assertions and used during module/render initialization. If either value is missing or empty in a build profile, the app proceeds into provider/client initialization with invalid configuration.
- **Expected behavior:** Required runtime configuration should fail with a clear developer-facing error before provider initialization, and release builds should have validation gates.
- **Impact:** Misconfigured dev, preview, or production builds can crash or show opaque Clerk/Convex failures immediately on launch.
- **Root cause hypothesis:** Environment variables were assumed to be present because local `.env` exists, but no runtime/build-time validation was added.
- **Proposed fix:** Add explicit config validation with clear messages and CI/EAS profile checks for required public variables.
- **Risk of fix:** Validation can break currently misconfigured environments earlier; verify all build profiles and local dev startup.
- **Estimated effort:** S

### Finding C-016: External repository links are opened without validation or error handling

- **Severity:** Low
- **Surface:** Mobile
- **Category:** Bug | Security
- **Location:** `apps/mobile/app/project/[id].tsx`:342-356
- **Observed behavior:** Project detail calls `Linking.openURL(projectRepo)` directly from backend-provided data and does not check URL scheme, `canOpenURL`, or catch rejections.
- **Expected behavior:** External links should validate supported schemes and handle open failures with a user-visible error.
- **Impact:** Bad or unsupported repository URLs can produce unhandled promise rejections or fail silently. If non-HTTP schemes reach this field, the app may invoke unexpected platform handlers.
- **Root cause hypothesis:** Repository URLs were treated as trusted web URLs without client-side defensive handling.
- **Proposed fix:** Validate that repository links are `https://` or another explicitly supported scheme, call `canOpenURL`, and catch/display failures.
- **Risk of fix:** Some valid enterprise Git URLs could be blocked if the allowlist is too narrow; align supported schemes with product requirements.
- **Estimated effort:** S

## 12. Backend contract adherence: every Convex/backend call must match /home/aansh/LTF1/iceberg-L/reviews/01-backend-map.md. Mismatches are findings.

### Finding C-017: Mobile renders non-contract project status `paused`

- **Severity:** Low
- **Surface:** Mobile
- **Category:** Bug | UI
- **Location:** `apps/mobile/components/features/ProjectCard.tsx`:7-12; `apps/mobile/app/(tabs)/projects.tsx`:13-19
- **Observed behavior:** `ProjectCard` maps `paused` to an amber badge but does not map backend status `planning` or `on_hold`. The projects screen filter list correctly uses `planning` and `on_hold` from the backend map.
- **Expected behavior:** Project status UI should match the backend contract statuses: `planning`, `active`, `on_hold`, `completed`, and `archived`.
- **Impact:** Projects in `planning` or `on_hold` render with the default badge color, while a dead `paused` state remains in the mobile UI. This weakens status recognition and indicates contract drift.
- **Root cause hypothesis:** The card status map predates or diverged from the current backend project status state machine.
- **Proposed fix:** Replace `paused` with `planning`/`on_hold` color mappings and keep all project status displays aligned to `reviews/01-backend-map.md`.
- **Risk of fix:** Visual-only change; verify project list cards for every status.
- **Estimated effort:** S

### Finding C-018: Mobile task assignee rendering relies on non-contract populated `assignees`

- **Severity:** Medium
- **Surface:** Mobile
- **Category:** Bug | Backend
- **Location:** `apps/mobile/app/project/[id].tsx`:293-307; `apps/mobile/app/task/[id].tsx`:191-192; `apps/mobile/app/task/[id].tsx`:319-349
- **Observed behavior:** Project detail maps each task's `(task.assignees || [])`, and task detail renders `task.assignees ?? []`. The backend map identifies task assignment fields as `assigneeIds` with deprecated `assigneeId`, and known frontend coupling says consumers must prefer `assigneeIds` and keep `assignee` backward-compatible until migration is complete.
- **Expected behavior:** Mobile should adhere to the documented task assignment contract by treating `assigneeIds` as the primary assignment field, or only rely on populated assignee projections if that projection is explicitly documented for the specific query.
- **Impact:** If `getProjectTasks` or `getTask` returns task documents without populated `assignees`, mobile shows assigned tasks as unassigned even though `assigneeIds` is populated. Users can misread ownership and workload.
- **Root cause hypothesis:** Mobile was modeled after a UI-friendly enriched task shape rather than the backend map's canonical task fields.
- **Proposed fix:** Align task assignee display with the documented `assigneeIds` contract, adding a documented projection query or client-side member lookup if display names/avatars are required.
- **Risk of fix:** Changing assignee data loading can add queries and latency; test project detail and task detail with multiple assignees, deprecated `assigneeId`, and unassigned tasks.
- **Estimated effort:** M

### Finding C-019: Dashboard and project cards display hard-coded zero task counts

- **Severity:** Medium
- **Surface:** Mobile
- **Category:** Bug | UI
- **Location:** `apps/mobile/app/(tabs)/index.tsx`:170-184; `apps/mobile/app/(tabs)/projects.tsx`:129-136
- **Observed behavior:** Dashboard stat cards render `Tasks` and `Done` values as `0` regardless of backend data. Project list items also set `taskCount: 0` and `completedCount: 0` before passing them to `ProjectCard`, so every project progress bar reads `0/0 tasks`.
- **Expected behavior:** Mobile should either consume documented backend task/dashboard data accurately or omit metrics it cannot source from the backend contract. The backend map documents task APIs and dashboard data as public surfaces.
- **Impact:** Users see false zero task totals and project completion progress even when projects have tasks, making the mobile dashboard and project grid misleading.
- **Root cause hypothesis:** The first mobile UI shipped before task-count fields were wired to backend responses.
- **Proposed fix:** Source counts from a documented dashboard/project/task API or remove the metrics until the backend contract includes them for mobile.
- **Risk of fix:** Adding per-project task queries can hurt performance; prefer aggregate backend fields or a documented dashboard response and test large workspaces.
- **Estimated effort:** M

## Summary

Findings: 19 total. Blocker: 0. High: 1. Medium: 11. Low: 7. Nit: 0.
