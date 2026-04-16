# LTF1 Mobile Component Library

React Native (Expo SDK 52+) component specifications using NativeWind v4.
Design language: adapted brutalist -- dark terminal aesthetic softened for mobile touch.

---

## Design Tokens Reference

| Token            | Value     | NativeWind Alias      |
|------------------|-----------|-----------------------|
| bg-base          | `#050505` | `bg-[#050505]`        |
| bg-surface       | `#0A0A0A` | `bg-[#0A0A0A]`        |
| bg-card          | `#111111` | `bg-[#111111]`        |
| text-primary     | `#F9FAFB` | `text-[#F9FAFB]`      |
| text-secondary   | `#9CA3AF` | `text-[#9CA3AF]`      |
| text-tertiary    | `#6B7280` | `text-[#6B7280]`      |
| accent           | `#6366F1` | `bg-[#6366F1]`        |
| border-default   | `#2E2E35` | `border-[#2E2E35]`    |
| border-subtle    | `#1F1F23` | `border-[#1F1F23]`    |
| green            | `#22C55E` | `bg-[#22C55E]`        |
| red              | `#EF4444` | `bg-[#EF4444]`        |
| amber            | `#F59E0B` | `bg-[#F59E0B]`        |
| purple           | `#8B5CF6` | `bg-[#8B5CF6]`        |
| cyan             | `#06B6D4` | `bg-[#06B6D4]`        |

**Typography:** Inter (prose), IBM Plex Mono (code/labels).
**Corners:** 8px cards, 8px buttons, 12px modals.
**Shadows:** 2px 2px 0px hard offset, no blur.

---

## Base UI Components

### 1. BrutalCard

Container with border and hard shadow. Primary layout primitive for grouping content.

**Variants:**

| Variant   | Description                          | Classes                                                                |
|-----------|--------------------------------------|------------------------------------------------------------------------|
| default   | Standard card with border            | `bg-[#111111] border border-[#2E2E35] rounded-lg`                     |
| bordered  | Thicker border, no shadow            | `bg-[#111111] border-2 border-[#2E2E35] rounded-lg`                   |
| elevated  | Border plus hard offset shadow       | `bg-[#111111] border border-[#2E2E35] rounded-lg shadow-brutal`       |

**Props:**

```typescript
interface BrutalCardProps {
  variant?: "default" | "bordered" | "elevated";
  padding?: "sm" | "md" | "lg";
  onPress?: () => void;
  children: React.ReactNode;
}
```

**Padding map:** `sm` = `p-2`, `md` = `p-4`, `lg` = `p-6`.

**Shadow style (elevated):** `{ shadowOffset: { width: 2, height: 2 }, shadowColor: '#2E2E35', shadowOpacity: 1, shadowRadius: 0 }`.

**NativeWind classes:**

```
bg-[#111111] border border-[#2E2E35] rounded-lg p-4
```

**Usage:**

```tsx
<BrutalCard variant="elevated" padding="md" onPress={() => navigate("detail")}>
  <Text className="text-[#F9FAFB] font-sans text-base">Card content</Text>
</BrutalCard>
```

---

### 2. BrutalButton

Touch button with haptic feedback. All variants respect the 44pt minimum touch target.

**Variants:**

| Variant   | Background           | Text Color  | Border               |
|-----------|----------------------|-------------|----------------------|
| primary   | `bg-[#6366F1]`       | `#FFFFFF`   | none                 |
| secondary | transparent          | `#F9FAFB`   | `border-[#2E2E35]`  |
| ghost     | transparent          | `#9CA3AF`   | none                 |
| danger    | `bg-[#EF4444]`       | `#FFFFFF`   | none                 |

**Sizes:**

| Size | Height | Padding     | Font Size |
|------|--------|-------------|-----------|
| sm   | 36px   | `px-3`      | 13px      |
| md   | 44px   | `px-4`      | 15px      |
| lg   | 52px   | `px-6`      | 17px      |

**Props:**

```typescript
interface BrutalButtonProps {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}
```

**NativeWind classes (primary, md):**

```
bg-[#6366F1] rounded-lg h-11 px-4 flex-row items-center justify-center
```

**Disabled state:** `opacity-50` and `pointerEvents: "none"`.
**Loading state:** Replace label with `ActivityIndicator` (white, size small).

**Usage:**

```tsx
<BrutalButton
  variant="primary"
  size="md"
  label="Create Task"
  onPress={handleCreate}
  loading={isPending}
/>
```

---

### 3. BrutalBadge

Compact label for status, priority, or type indicators. Monospaced uppercase text.

**Props:**

```typescript
interface BrutalBadgeProps {
  label: string;
  color: "green" | "red" | "amber" | "purple" | "cyan" | "accent" | "default";
  size?: "sm" | "md";
}
```

**Color map (background / text):**

| Color   | Background           | Text        |
|---------|----------------------|-------------|
| green   | `bg-[#22C55E]/15`    | `#22C55E`   |
| red     | `bg-[#EF4444]/15`    | `#EF4444`   |
| amber   | `bg-[#F59E0B]/15`    | `#F59E0B`   |
| purple  | `bg-[#8B5CF6]/15`    | `#8B5CF6`   |
| cyan    | `bg-[#06B6D4]/15`    | `#06B6D4`   |
| accent  | `bg-[#6366F1]/15`    | `#6366F1`   |
| default | `bg-[#2E2E35]/30`    | `#9CA3AF`   |

**Size map:** `sm` = `px-1.5 py-0.5 text-[10px]`, `md` = `px-2 py-0.5 text-xs`.

**NativeWind classes:**

```
px-2 py-0.5 rounded font-mono text-xs uppercase tracking-wider
```

**Usage:**

```tsx
<BrutalBadge label="High" color="red" size="sm" />
<BrutalBadge label="In Progress" color="accent" />
```

---

### 4. BrutalInput

Text input with label, error state, and focus ring.

**Props:**

```typescript
interface BrutalInputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  error?: string;
  multiline?: boolean;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: KeyboardTypeOptions;
}
```

**NativeWind classes:**

```
h-12 bg-[#0A0A0A] border border-[#2E2E35] rounded-lg px-3 text-[#F9FAFB] font-sans text-base
```

**States:**

| State   | Border Class          |
|---------|-----------------------|
| default | `border-[#2E2E35]`   |
| focus   | `border-[#6366F1]`   |
| error   | `border-[#EF4444]`   |

**Label:** Rendered above the input as `text-[#9CA3AF] font-mono text-xs uppercase tracking-wider mb-1.5`.

**Error message:** Rendered below the input as `text-[#EF4444] font-sans text-xs mt-1`.

**Multiline:** Set `h-auto min-h-[100px] py-3` with `textAlignVertical: "top"`.

**Usage:**

```tsx
<BrutalInput
  label="Task Title"
  placeholder="Enter task title..."
  value={title}
  onChangeText={setTitle}
  error={errors.title}
/>
```

---

### 5. BrutalSelect

Bottom sheet picker. Uses `@gorhom/bottom-sheet` internally. Never use the native RN Picker.

**Props:**

```typescript
interface SelectOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface BrutalSelectProps {
  options: SelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}
```

**Trigger element:** Styled identically to BrutalInput but with a chevron-down icon on the right side. Displays the selected option label or placeholder text in tertiary color.

**Bottom sheet:** Background `bg-[#0A0A0A]`, top handle bar in `bg-[#2E2E35]`, max height 50% of screen.

**Option row:** `h-12 px-4 flex-row items-center border-b border-[#1F1F23]`. Selected option shows accent-colored check icon on the right.

**Usage:**

```tsx
<BrutalSelect
  label="Priority"
  options={[
    { label: "Critical", value: "critical" },
    { label: "High", value: "high" },
    { label: "Medium", value: "medium" },
    { label: "Low", value: "low" },
  ]}
  value={priority}
  onChange={setPriority}
/>
```

---

### 6. Avatar

User avatar with image or initials fallback.

**Props:**

```typescript
interface AvatarProps {
  url?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}
```

**Size map:**

| Size | Dimension | Font Size |
|------|-----------|-----------|
| sm   | 28x28     | 11px      |
| md   | 36x36     | 14px      |
| lg   | 48x48     | 18px      |

**Image mode:** `rounded-full` with the image filling the container.

**Fallback:** Extract first letter of first and last name. Render initials centered in a circle. Background color is deterministic from the name string (hash to one of 6 accent colors: accent, green, purple, cyan, amber, red).

**NativeWind classes (md):**

```
w-9 h-9 rounded-full bg-[#6366F1] items-center justify-center
```

**Usage:**

```tsx
<Avatar name="Aansh Kumar" size="md" />
<Avatar url={user.imageUrl} name={user.name} size="lg" />
```

---

### 7. Skeleton

Animated loading placeholder. Uses `Animated.View` with a looping opacity pulse (0.3 to 0.7, 1000ms, easeInOut).

**Props:**

```typescript
interface SkeletonProps {
  width: number | string;
  height: number | string;
  rounded?: "sm" | "md" | "lg" | "full";
}
```

**Rounded map:** `sm` = `rounded`, `md` = `rounded-lg`, `lg` = `rounded-xl`, `full` = `rounded-full`.

**NativeWind classes:**

```
bg-[#2E2E35]
```

**Usage:**

```tsx
<Skeleton width="100%" height={20} rounded="md" />
<Skeleton width={36} height={36} rounded="full" />
```

---

### 8. Divider

Horizontal separator line.

**Props:**

```typescript
interface DividerProps {
  spacing?: "sm" | "md" | "lg";
}
```

**Spacing map:** `sm` = `my-2`, `md` = `my-4`, `lg` = `my-6`.

**NativeWind classes:**

```
h-px bg-[#1F1F23]
```

**Usage:**

```tsx
<Divider spacing="md" />
```

---

## Feature Components

### 9. TaskCard

Task list item used in project detail screens and search results. Supports swipe gestures via `react-native-gesture-handler` and `react-native-reanimated`.

**Props:**

```typescript
interface TaskCardProps {
  task: {
    _id: Id<"tasks">;
    title: string;
    status: string;
    priority: string;
    type: string;
    assignees?: Array<{ name: string; imageUrl?: string }>;
    dueDate?: number;
  };
  onPress: () => void;
  onMarkDone?: () => void;
  onDelete?: () => void;
}
```

**Layout:**

```
[Priority Badge]  Title (truncated single line)        [Due Date]
                  [Type Badge]  [Assignee Avatars]
```

**NativeWind classes (outer):**

```
bg-[#111111] border border-[#2E2E35] rounded-lg p-3 mb-2
```

**Swipe actions:**

| Direction | Action    | Background     | Icon    | Haptic      |
|-----------|-----------|----------------|---------|-------------|
| Right     | Mark done | `bg-[#22C55E]` | Check   | Success     |
| Left      | Delete    | `bg-[#EF4444]` | Trash   | Warning     |

**Title:** `text-[#F9FAFB] font-sans text-base` with `numberOfLines={1}`.
**Due date:** `text-[#6B7280] font-mono text-xs`. If overdue, use `text-[#EF4444]`.
**Assignee avatars:** Stack up to 3 `Avatar` components (size sm) overlapping by 8px. If more than 3, show `+N` count.

**Usage:**

```tsx
<TaskCard
  task={task}
  onPress={() => navigate("task-detail", { id: task._id })}
  onMarkDone={() => updateStatus(task._id, "done")}
  onDelete={() => deleteTask(task._id)}
/>
```

---

### 10. ProjectCard

Grid card for the projects list. Displayed in a 2-column grid or single column depending on screen width.

**Props:**

```typescript
interface ProjectCardProps {
  project: {
    _id: Id<"projects">;
    key: string;
    name: string;
    status: string;
    taskCount: number;
    completedCount: number;
  };
  onPress: () => void;
}
```

**Layout:**

```
KEY-001                          [Status Badge]
Project Name
[===-------] 4/12 tasks
```

**NativeWind classes:**

```
bg-[#111111] border border-[#2E2E35] rounded-lg p-4
```

**Project key:** `text-[#6366F1] font-mono text-xs uppercase tracking-wider`.
**Project name:** `text-[#F9FAFB] font-sans text-base font-semibold mt-1`.
**Progress bar container:** `h-1.5 bg-[#2E2E35] rounded-full mt-3`. Fill uses `bg-[#6366F1] rounded-full`.
**Task count:** `text-[#6B7280] font-mono text-xs mt-1`.

**Usage:**

```tsx
<ProjectCard
  project={project}
  onPress={() => navigate("project-detail", { id: project._id })}
/>
```

---

### 11. StatCard

Dashboard metric display. Shows a single KPI with label and optional icon.

**Props:**

```typescript
interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
}
```

**Layout:**

```
[Icon]  LABEL
        42
```

**NativeWind classes:**

```
bg-[#111111] border border-[#2E2E35] rounded-lg p-4
```

**Label:** `text-[#9CA3AF] font-mono text-xs uppercase tracking-wider`.
**Value:** `text-[#F9FAFB] font-sans text-2xl font-bold mt-1`.
**Icon:** 20x20, colored with the `color` prop or defaults to `#6366F1`.

**Usage:**

```tsx
<StatCard label="Open Tasks" value={12} icon={<TaskIcon />} color="#6366F1" />
<StatCard label="Overdue" value={3} icon={<AlertIcon />} color="#EF4444" />
```

---

### 12. ActivityItem

Single row in the activity feed. Monospace terminal aesthetic.

**Props:**

```typescript
interface ActivityItemProps {
  activity: {
    _id: string;
    timestamp: number;
    userName: string;
    action: string;
    targetName: string;
  };
}
```

**Layout (single line, scrollable):**

```
2m ago  |  aansh  |  completed  |  Fix auth bug
```

**NativeWind classes:**

```
flex-row items-center py-2.5 border-b border-[#1F1F23]
```

**Time:** `text-[#6B7280] font-mono text-xs w-16`.
**Separator:** `text-[#2E2E35] font-mono text-xs mx-2` (literal `|`).
**User:** `text-[#9CA3AF] font-mono text-xs`.
**Action:** `text-[#6B7280] font-mono text-xs`.
**Target:** `text-[#F9FAFB] font-mono text-xs flex-1` with `numberOfLines={1}`.

**Usage:**

```tsx
<ActivityItem activity={activityItem} />
```

---

### 13. StatusChip

Horizontally scrollable row of filter chips. Used on project detail and task list screens.

**Props:**

```typescript
interface StatusChipProps {
  statuses: Array<{ label: string; value: string; count?: number }>;
  activeStatus: string | null;
  onSelect: (value: string | null) => void;
}
```

**Chip (active):**

```
bg-[#6366F1] rounded-lg px-3 h-8 items-center justify-center mr-2
```

Text: `text-white font-mono text-xs uppercase`.

**Chip (inactive):**

```
border border-[#2E2E35] rounded-lg px-3 h-8 items-center justify-center mr-2
```

Text: `text-[#9CA3AF] font-mono text-xs uppercase`.

**Container:** `ScrollView` with `horizontal`, `showsHorizontalScrollIndicator={false}`, and `contentContainerStyle={{ paddingHorizontal: 16 }}`.

**Count badge:** If `count` is provided, render it after the label as `text-[#6B7280]` (inactive) or `text-white/70` (active).

**Usage:**

```tsx
<StatusChip
  statuses={[
    { label: "All", value: "all", count: 24 },
    { label: "Todo", value: "todo", count: 12 },
    { label: "In Progress", value: "in_progress", count: 8 },
    { label: "Done", value: "done", count: 4 },
  ]}
  activeStatus={filter}
  onSelect={setFilter}
/>
```

---

### 14. FAB (Floating Action Button)

Fixed-position button for primary create actions. Includes haptic feedback and scale animation on press.

**Props:**

```typescript
interface FABProps {
  onPress: () => void;
  icon?: React.ReactNode;
}
```

**NativeWind classes:**

```
absolute bottom-6 right-6 w-14 h-14 rounded-full bg-[#6366F1] items-center justify-center
```

**Shadow:** `{ shadowOffset: { width: 2, height: 2 }, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 0 }`.

**Icon:** Default is a `+` icon, 24x24, white.

**Animation:** `Animated.spring` scale from 1.0 to 0.9 on `pressIn`, back to 1.0 on `pressOut`.
**Haptic:** `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)` on press.

**Usage:**

```tsx
<FAB onPress={() => openQuickCapture()} />
```

---

### 15. OfflineBanner

Network status indicator. Fixed at the top of the screen. Slides in/out with spring animation.

**Props:**

```typescript
interface OfflineBannerProps {
  isOffline: boolean;
}
```

**NativeWind classes:**

```
bg-[#F59E0B]/15 border-b border-[#F59E0B]/30 px-4 py-2 flex-row items-center justify-center
```

**Icon:** Wi-Fi off icon, 16x16, `text-[#F59E0B]`.
**Text:** `text-[#F59E0B] font-mono text-xs ml-2` -- "You're offline -- showing cached data".

**Animation:** Translate Y from -60 to 0 using `Animated.spring` with `damping: 15`.

**Detection:** Use `@react-native-community/netinfo` `useNetInfo()` hook. Render only when `isConnected === false`.

**Usage:**

```tsx
const netInfo = useNetInfo();
<OfflineBanner isOffline={!netInfo.isConnected} />
```

---

### 16. EmptyState

Placeholder shown when a list or screen has no data.

**Props:**

```typescript
interface EmptyStateProps {
  icon?: React.ReactNode;
  heading: string;
  description: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
}
```

**NativeWind classes (container):**

```
border border-dashed border-[#2E2E35] rounded-lg p-8 items-center justify-center
```

**Icon:** 48x48, `text-[#6B7280] mb-4`.
**Heading:** `text-[#F9FAFB] font-sans text-base font-semibold text-center`.
**Description:** `text-[#9CA3AF] font-sans text-sm text-center mt-2 max-w-[260px]`.
**CTA button:** Rendered as `BrutalButton variant="secondary" size="sm"` with `mt-4`.

**Usage:**

```tsx
<EmptyState
  icon={<InboxIcon />}
  heading="No tasks yet"
  description="Create your first task to get started with this project."
  ctaLabel="Create Task"
  onCtaPress={() => openQuickCapture()}
/>
```

---

## Shared Conventions

### Haptic Feedback

All pressable components trigger haptic feedback:

| Interaction     | Haptic Style                        |
|-----------------|-------------------------------------|
| Button press    | `ImpactFeedbackStyle.Light`         |
| FAB press       | `ImpactFeedbackStyle.Medium`        |
| Swipe complete  | `NotificationFeedbackType.Success`  |
| Destructive     | `NotificationFeedbackType.Warning`  |
| Toggle          | `ImpactFeedbackStyle.Light`         |

### Accessibility

- All interactive elements must have `accessibilityRole` set (`button`, `link`, `checkbox`).
- All images and icons must have `accessibilityLabel`.
- Minimum touch target: 44x44 points.
- Color is never the sole indicator of state -- always pair with text or icon.
- Support `reduceMotionEnabled` from `AccessibilityInfo` to disable animations.

### Animation Defaults

- Duration: 200ms for micro-interactions, 300ms for transitions.
- Easing: `Easing.out(Easing.cubic)` for entrances, `Easing.in(Easing.cubic)` for exits.
- Spring: `damping: 15, stiffness: 150` for physical interactions.
- Use `useReducedMotion()` from `react-native-reanimated` to respect system preferences.

### Font Loading

Load Inter and IBM Plex Mono via `expo-font` in the root layout:

```tsx
const [fontsLoaded] = useFonts({
  "Inter-Regular": require("./assets/fonts/Inter-Regular.ttf"),
  "Inter-SemiBold": require("./assets/fonts/Inter-SemiBold.ttf"),
  "Inter-Bold": require("./assets/fonts/Inter-Bold.ttf"),
  "IBMPlexMono-Regular": require("./assets/fonts/IBMPlexMono-Regular.ttf"),
  "IBMPlexMono-SemiBold": require("./assets/fonts/IBMPlexMono-SemiBold.ttf"),
});
```

NativeWind mapping in `tailwind.config.js`:

```js
fontFamily: {
  sans: ["Inter-Regular"],
  "sans-semibold": ["Inter-SemiBold"],
  "sans-bold": ["Inter-Bold"],
  mono: ["IBMPlexMono-Regular"],
  "mono-semibold": ["IBMPlexMono-SemiBold"],
},
```
