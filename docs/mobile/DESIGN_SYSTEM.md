# LTF1 Mobile Design System

## Adapted Brutalist -- Dark Terminal Aesthetic for Touch

Version 1.0 | Dark mode only | React Native + Expo + NativeWind

---

## 1. Design Philosophy

LTF1 mobile is an **adapted brutalist** design system. It preserves the web app's dark terminal identity -- surgical color palette, monospace labels, hard-offset shadows, high-contrast text -- while making deliberate concessions for touch ergonomics and mobile readability.

### Core Principles

1. **Same brand DNA, different medium.** The mobile app should feel like the same product, not a different one. Color tokens, semantic meanings, and typographic hierarchy are shared with the web design system.
2. **Dark-first, outdoor-readable.** The `#050505` base with `#F9FAFB` text delivers a contrast ratio of 19.4:1 -- well above WCAG AAA. This is non-negotiable.
3. **Touch-native interactions.** Hover states do not exist on mobile. Every interactive affordance uses press feedback (scale + haptic) instead. All touch targets meet the 48x48dp minimum.
4. **Performance-conscious rendering.** No blur effects. No gradient backgrounds. No transparency-heavy compositing. Shadows use hard offsets only. Animations are GPU-friendly transforms and opacity changes.
5. **Softened edges, same structure.** Web uses 0px card corners for maximum brutalism. Mobile uses 8px -- the minimum concession for a surface you hold in your hand. The design is still rectangular and structural, never bubbly.

### What Changes from Web

| Aspect | Web | Mobile | Reason |
|--------|-----|--------|--------|
| Card corners | 0px | 8px | Touch ergonomics, thumb-friendly edges |
| Card border | 2px | 1px | 2px feels heavy on small screens |
| Hard shadow | 4px 4px 0px | 2px 2px 0px | Proportional to screen size |
| Modals | Centered overlay | Bottom sheets | Reachable with one hand |
| Hover feedback | Border color change | scale(0.98) + haptic | No hover on touch devices |
| Navigation | Sidebar | Tab bar (3 tabs) | Standard mobile pattern |
| Screen padding | 24-32px | 16px | Maximize content area |

### What Does NOT Change

- Color palette (all tokens identical)
- Font families (Inter + IBM Plex Mono)
- Semantic color meanings
- Status and priority color mappings
- Typography hierarchy (adapted sizes, same relationships)
- Shadow direction (always hard offset, no blur)

---

## 2. Color System

All color tokens are identical to the web design system. No mobile-specific colors exist. This ensures cross-platform consistency and a single source of truth.

### Backgrounds

| Token | Hex | NativeWind Class | Usage |
|-------|-----|------------------|-------|
| `bg-base` | `#050505` | `bg-base` | Screen background, deepest layer |
| `bg-surface` | `#0A0A0A` | `bg-surface` | Bottom sheets, elevated content, code panels |
| `bg-card` | `#111111` | `bg-card` | Cards, inputs, interactive surfaces |

### Text

| Token | Hex | NativeWind Class | Usage |
|-------|-----|------------------|-------|
| `text-primary` | `#F9FAFB` | `text-primary` | Headlines, important values, active labels |
| `text-secondary` | `#9CA3AF` | `text-secondary` | Body text, descriptions |
| `text-tertiary` | `#6B7280` | `text-tertiary` | Captions, timestamps, placeholders, inactive icons |

### Accent

| Token | Hex | NativeWind Class | Usage |
|-------|-----|------------------|-------|
| `accent` | `#6366F1` | `bg-accent` / `text-accent` | Primary CTA, active states, focus rings |
| `accent-hover` | `#4F46E5` | `bg-accent-hover` | Pressed state for accent elements |
| `accent-muted` | `#6366F1` at 30% opacity | `bg-accent/30` | Badges, faint highlights |

### Borders

| Token | Hex | NativeWind Class | Usage |
|-------|-----|------------------|-------|
| `border-default` | `#2E2E35` | `border-default` | Card borders, input borders, dividers |
| `border-subtle` | `#1F1F23` | `border-subtle` | Tab bar top border, section separators |

### Semantic Colors

| Token | Hex | NativeWind Class | Usage |
|-------|-----|------------------|-------|
| `success` | `#22C55E` | `text-success` / `bg-success` | Completion, positive states |
| `error` | `#EF4444` | `text-error` / `bg-error` | Errors, destructive actions, cancelled |
| `warning` | `#F59E0B` | `text-warning` / `bg-warning` | Warnings, high priority |
| `info` | `#06B6D4` | `text-info` / `bg-info` | Information, todo status |
| `purple` | `#8B5CF6` | `text-purple` / `bg-purple` | In review, special categories |

### Contrast Ratios (against `#050505`)

| Text Color | Ratio | WCAG Level |
|------------|-------|------------|
| `#F9FAFB` | 19.4:1 | AAA |
| `#9CA3AF` | 7.5:1 | AAA |
| `#6B7280` | 4.8:1 | AA |
| `#6366F1` | 4.6:1 | AA |
| `#22C55E` | 8.2:1 | AAA |
| `#EF4444` | 5.2:1 | AA |

---

## 3. Typography Scale

Mobile type sizes are optimized for handheld reading distance (12-16 inches). The scale is tighter than web -- no text larger than 28px -- but maintains the same hierarchy relationships.

### Type Tokens

| Token | Font | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|------|--------|-------------|----------------|-------|
| `heading-xl` | Inter | 28px | 800 | 34px | -0.5px | Page titles |
| `heading-lg` | Inter | 22px | 700 | 28px | -0.3px | Section titles |
| `heading-md` | Inter | 18px | 600 | 24px | -0.2px | Card titles |
| `body-lg` | Inter | 16px | 400 | 24px | 0px | Primary body text |
| `body-md` | Inter | 14px | 400 | 20px | 0px | Secondary body text |
| `body-sm` | Inter | 12px | 400 | 16px | 0.1px | Captions, timestamps |
| `label-lg` | IBM Plex Mono | 13px | 600 | 16px | 1.2px | Large labels, uppercase |
| `label-md` | IBM Plex Mono | 11px | 600 | 14px | 1.0px | Standard labels, uppercase |
| `label-sm` | IBM Plex Mono | 10px | 500 | 12px | 0.8px | Micro labels, badge text |
| `code` | IBM Plex Mono | 13px | 400 | 18px | 0px | Code blocks, task IDs |

### NativeWind Usage

```tsx
// Page title
<Text className="font-inter text-[28px] font-extrabold leading-[34px] tracking-tight text-primary">
  Dashboard
</Text>

// Monospace label
<Text className="font-mono text-[11px] font-semibold uppercase tracking-wider text-tertiary">
  Task ID
</Text>

// Body text
<Text className="font-inter text-[16px] font-normal leading-[24px] text-secondary">
  Your project description goes here.
</Text>

// Code / task ID
<Text className="font-mono text-[13px] font-normal text-accent">
  LTF-1042
</Text>
```

### Font Loading

Both Inter and IBM Plex Mono must be loaded via `expo-font` before the app renders. Use `expo-splash-screen` to prevent a flash of unstyled text.

```tsx
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium, IBMPlexMono_600SemiBold } from '@expo-google-fonts/ibm-plex-mono';
```

---

## 4. Spacing System

The spacing system is built on an 8px base grid. All spacing values are multiples or divisions of 8.

### Spacing Tokens

| Token | Value | NativeWind Class | Usage |
|-------|-------|------------------|-------|
| `xs` | 4px | `p-1` / `m-1` / `gap-1` | Tight internal spacing, icon-to-label gaps |
| `sm` | 8px | `p-2` / `m-2` / `gap-2` | Compact element spacing |
| `md` | 16px | `p-4` / `m-4` / `gap-4` | Standard element spacing, screen padding |
| `lg` | 24px | `p-6` / `m-6` / `gap-6` | Section spacing |
| `xl` | 32px | `p-8` / `m-8` / `gap-8` | Major section breaks |
| `2xl` | 48px | `p-12` / `m-12` / `gap-12` | Screen-level vertical spacing |

### Screen Layout Rules

| Property | Value | Notes |
|----------|-------|-------|
| Horizontal screen padding | 16px | `px-4` on all screen containers |
| Vertical screen padding | 16px top, 24px bottom | Bottom padding accounts for tab bar proximity |
| Card gap (between cards) | 12px | `gap-3` in card lists |
| Card internal padding | 16px | `p-4` standard |
| Card internal padding (compact) | 12px | `p-3` for list items, small cards |
| Section gap | 24px | `gap-6` between major sections |

### NativeWind Screen Container

```tsx
<SafeAreaView className="flex-1 bg-base">
  <ScrollView
    className="flex-1"
    contentContainerClassName="px-4 pt-4 pb-6 gap-6"
  >
    {/* Screen content */}
  </ScrollView>
</SafeAreaView>
```

---

## 5. Component Specifications

### Cards

Cards are the primary content container. On mobile, they soften the web's hard 0px corners to 8px for comfortable visual scanning.

| Property | Value |
|----------|-------|
| Background | `#111111` (`bg-card`) |
| Border | 1px `#2E2E35` (`border border-default`) |
| Corner radius | 8px (`rounded-lg`) |
| Padding | 16px (`p-4`) |
| Shadow | `2px 2px 0px #000000` |
| Active state | `scale(0.98)` + light haptic |

```tsx
<Pressable
  className="bg-card border border-default rounded-lg p-4"
  style={{ shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowColor: '#000', shadowRadius: 0 }}
  onPress={handlePress}
>
  <Text className="font-inter text-[18px] font-semibold text-primary">
    Card Title
  </Text>
  <Text className="font-inter text-[14px] text-secondary mt-2">
    Card description text goes here.
  </Text>
</Pressable>
```

#### Card Variants

| Variant | Border | Background | Usage |
|---------|--------|------------|-------|
| Default | 1px `#2E2E35` | `#111111` | Standard content card |
| Elevated | 1px `#2E2E35` | `#111111` | Card with shadow, interactive |
| Accent | 1px `#6366F1` | `#111111` | Selected or highlighted card |
| Ghost | None | Transparent | Inline list items |

---

### Buttons

| Property | Primary | Secondary | Ghost | Danger |
|----------|---------|-----------|-------|--------|
| Background | `#6366F1` | Transparent | Transparent | `#EF4444` |
| Border | None | 1px `#2E2E35` | None | None |
| Text color | `#F9FAFB` | `#F9FAFB` | `#9CA3AF` | `#F9FAFB` |
| Corner radius | 8px | 8px | 8px | 8px |
| Min height | 44px | 44px | 44px | 44px |
| Min width | 80px | 80px | -- | 80px |
| Pressed bg | `#4F46E5` | `#111111` | `#111111` | `#DC2626` |
| Font | Inter 14px 600 | Inter 14px 600 | Inter 14px 400 | Inter 14px 600 |

```tsx
// Primary button
<Pressable className="bg-accent rounded-lg px-6 items-center justify-center"
  style={{ minHeight: 44, minWidth: 80 }}>
  <Text className="font-inter text-[14px] font-semibold text-primary">
    Create Task
  </Text>
</Pressable>

// Secondary button
<Pressable className="border border-default rounded-lg px-6 items-center justify-center"
  style={{ minHeight: 44, minWidth: 80 }}>
  <Text className="font-inter text-[14px] font-semibold text-primary">
    Cancel
  </Text>
</Pressable>

// Ghost button
<Pressable className="rounded-lg px-4 items-center justify-center"
  style={{ minHeight: 44 }}>
  <Text className="font-inter text-[14px] text-secondary">
    Skip
  </Text>
</Pressable>
```

#### Button Sizes

| Size | Height | Padding | Font Size |
|------|--------|---------|-----------|
| Large | 52px | 24px horizontal | 16px |
| Default | 44px | 16px horizontal | 14px |
| Small | 36px | 12px horizontal | 12px |

---

### Inputs

| Property | Value |
|----------|-------|
| Background | `#111111` (`bg-card`) |
| Border | 1px `#2E2E35` |
| Focus border | 1px `#6366F1` |
| Corner radius | 8px |
| Height | 48px minimum |
| Horizontal padding | 12px |
| Text | Inter 16px 400 `#F9FAFB` |
| Placeholder | Inter 16px 400 `#6B7280` |

```tsx
<TextInput
  className="bg-card border border-default focus:border-accent rounded-lg px-3 text-[16px] text-primary"
  style={{ minHeight: 48 }}
  placeholderTextColor="#6B7280"
  placeholder="Enter task name..."
/>
```

#### Textarea

Same styles as input, but with `minHeight: 120`, `textAlignVertical: 'top'`, and `py-3` for vertical padding.

---

### Bottom Sheets

Bottom sheets replace web modals on mobile. They slide up from the bottom edge and are reachable with one thumb.

| Property | Value |
|----------|-------|
| Background | `#0A0A0A` (`bg-surface`) |
| Border-top | 1px `#2E2E35` |
| Corner radius (top) | 16px |
| Handle bar width | 40px |
| Handle bar height | 4px |
| Handle bar color | `#2E2E35` |
| Handle bar margin-top | 8px |
| Content padding | 16px horizontal, 16px bottom |
| Snap points | 25%, 50%, 90% |
| Backdrop | `#000000` at 60% opacity |
| Enter animation | Slide up, 300ms ease-out |
| Exit animation | Slide down, 200ms ease-in |

```tsx
<BottomSheetModal
  snapPoints={['25%', '50%', '90%']}
  backgroundStyle={{ backgroundColor: '#0A0A0A', borderTopWidth: 1, borderTopColor: '#2E2E35' }}
  handleIndicatorStyle={{ backgroundColor: '#2E2E35', width: 40, height: 4 }}
  style={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
>
  <BottomSheetView className="px-4 pb-4">
    <Text className="font-inter text-[18px] font-semibold text-primary mb-4">
      Sheet Title
    </Text>
    {/* Sheet content */}
  </BottomSheetView>
</BottomSheetModal>
```

---

### Tab Bar

The tab bar is the primary navigation structure. Three tabs only -- more creates decision fatigue on mobile.

| Property | Value |
|----------|-------|
| Background | `#050505` (`bg-base`) |
| Height | 56px (plus safe area inset) |
| Border-top | 1px `#1F1F23` |
| Active icon color | `#6366F1` |
| Active label color | `#6366F1` |
| Inactive icon color | `#6B7280` |
| Inactive label color | `#6B7280` |
| Icon size | 24px |
| Label font | Inter 10px 500 |
| Label margin-top | 4px |

#### Tab Structure

| Tab | Icon | Label | Route |
|-----|------|-------|-------|
| 1 | LayoutDashboard | Dashboard | `/(tabs)/dashboard` |
| 2 | FolderKanban | Projects | `/(tabs)/projects` |
| 3 | User | Profile | `/(tabs)/profile` |

```tsx
<Tabs
  screenOptions={{
    tabBarStyle: {
      backgroundColor: '#050505',
      borderTopWidth: 1,
      borderTopColor: '#1F1F23',
      height: 56 + insets.bottom,
      paddingBottom: insets.bottom,
    },
    tabBarActiveTintColor: '#6366F1',
    tabBarInactiveTintColor: '#6B7280',
    tabBarLabelStyle: {
      fontFamily: 'Inter_500Medium',
      fontSize: 10,
      marginTop: 4,
    },
  }}
/>
```

---

### FAB (Floating Action Button)

The FAB is the primary creation action -- "New Task" on the dashboard, "New Project" on the projects screen.

| Property | Value |
|----------|-------|
| Size | 56x56 |
| Background | `#6366F1` |
| Icon color | `#F9FAFB` |
| Icon size | 24px |
| Corner radius | 16px |
| Position | Bottom-right, 16px from right edge, 16px above tab bar |
| Shadow | `2px 2px 0px #000000` |
| Press scale | `scale(0.95)` |
| Press haptic | `impactMedium` |

```tsx
<Pressable
  className="absolute bg-accent rounded-2xl items-center justify-center"
  style={{
    width: 56,
    height: 56,
    right: 16,
    bottom: 16 + TAB_BAR_HEIGHT,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowColor: '#000',
    shadowRadius: 0,
    elevation: 4,
  }}
  onPress={handleCreate}
>
  <PlusIcon size={24} color="#F9FAFB" />
</Pressable>
```

---

### Status Badges

Compact indicators for task and project status.

| Property | Value |
|----------|-------|
| Height | 24px |
| Padding | 6px horizontal |
| Corner radius | 4px |
| Font | IBM Plex Mono 10px 600 uppercase |
| Background | Status color at 15% opacity |
| Text | Status color at 100% |

```tsx
// Example: "In Progress" badge
<View className="bg-accent/15 rounded px-1.5 h-6 items-center justify-center">
  <Text className="font-mono text-[10px] font-semibold uppercase tracking-wider text-accent">
    In Progress
  </Text>
</View>
```

### List Items

| Property | Value |
|----------|-------|
| Min height | 56px |
| Padding | 12px vertical, 16px horizontal |
| Border-bottom | 1px `#1F1F23` |
| Press state | `bg-card` (background change) |
| Swipe actions | Optional, accent/red background |

---

## 6. Animation Specifications

All animations are GPU-friendly (transforms and opacity only). No layout animations on initial load. Respect the `prefers-reduced-motion` accessibility setting -- disable all non-essential animations when enabled.

### Screen Transitions

| Transition | Animation | Duration | Easing |
|------------|-----------|----------|--------|
| Stack push | Slide from right | Default (Expo Router) | Platform default |
| Stack pop | Slide to right | Default (Expo Router) | Platform default |
| Tab switch | Cross-fade | 200ms | ease-in-out |
| Bottom sheet open | Slide up | 300ms | ease-out |
| Bottom sheet close | Slide down | 200ms | ease-in |

### Content Animations

| Animation | Properties | Duration | Easing | Usage |
|-----------|-----------|----------|--------|-------|
| Fade-in up | opacity 0 to 1, translateY 20 to 0 | 300ms | ease-out | Screen content entrance |
| List stagger | Same as fade-in up | 300ms | ease-out | 50ms delay between items |
| Press feedback | scale 1 to 0.98 | 100ms | ease-in-out | All pressable elements |
| FAB press | scale 1 to 0.95 | 100ms | ease-in-out | FAB only |
| Skeleton pulse | opacity 0.3 to 0.7 | 1500ms | ease-in-out | Loading placeholders, infinite loop |
| Collapse/expand | height 0 to auto, opacity | 250ms | ease-out | Accordion, expandable sections |

### Haptic Feedback

| Interaction | Haptic Type | When |
|-------------|-------------|------|
| Button press | `impactLight` | On press down |
| FAB press | `impactMedium` | On press down |
| Destructive action | `notificationWarning` | Before confirmation |
| Success | `notificationSuccess` | After completion |
| Tab switch | `selectionChanged` | On tab change |
| Pull to refresh | `impactLight` | On trigger threshold |

### Reanimated Implementation

```tsx
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

// Screen content entrance
<Animated.View entering={FadeInUp.duration(300).delay(index * 50)}>
  <TaskCard task={task} />
</Animated.View>

// Press feedback with scale
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: withTiming(pressed.value ? 0.98 : 1, { duration: 100 }) }],
}));
```

### Reduced Motion

```tsx
import { useReducedMotion } from 'react-native-reanimated';

const reducedMotion = useReducedMotion();

<Animated.View
  entering={reducedMotion ? undefined : FadeInUp.duration(300)}
>
  {children}
</Animated.View>
```

---

## 7. Status and Priority Colors

### Task Status

| Status | Color | Hex | NativeWind Text | NativeWind Badge BG |
|--------|-------|-----|-----------------|---------------------|
| Backlog | Gray | `#6B7280` | `text-tertiary` | `bg-tertiary/15` |
| Todo | Cyan | `#06B6D4` | `text-info` | `bg-info/15` |
| In Progress | Indigo | `#6366F1` | `text-accent` | `bg-accent/15` |
| In Review | Purple | `#8B5CF6` | `text-purple` | `bg-purple/15` |
| Done | Green | `#22C55E` | `text-success` | `bg-success/15` |
| Cancelled | Red | `#EF4444` | `text-error` | `bg-error/15` |

### Task Priority

| Priority | Color | Hex | Icon | NativeWind |
|----------|-------|-----|------|------------|
| Urgent | Red | `#EF4444` | AlertTriangle (filled) | `text-error` |
| High | Amber | `#F59E0B` | ArrowUp | `text-warning` |
| Medium | Indigo | `#6366F1` | Minus | `text-accent` |
| Low | Gray | `#6B7280` | ArrowDown | `text-tertiary` |

### Usage Example

```tsx
const STATUS_COLORS: Record<TaskStatus, { text: string; bg: string }> = {
  backlog:     { text: 'text-tertiary', bg: 'bg-[#6B7280]/15' },
  todo:        { text: 'text-info',     bg: 'bg-[#06B6D4]/15' },
  in_progress: { text: 'text-accent',   bg: 'bg-[#6366F1]/15' },
  in_review:   { text: 'text-purple',   bg: 'bg-[#8B5CF6]/15' },
  done:        { text: 'text-success',  bg: 'bg-[#22C55E]/15' },
  cancelled:   { text: 'text-error',    bg: 'bg-[#EF4444]/15' },
} as const;

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgent: 'text-error',
  high:   'text-warning',
  medium: 'text-accent',
  low:    'text-tertiary',
} as const;
```

---

## 8. NativeWind Configuration

### tailwind.config.ts

```ts
import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './features/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        base: '#050505',
        surface: '#0A0A0A',
        card: '#111111',

        // Text
        primary: '#F9FAFB',
        secondary: '#9CA3AF',
        tertiary: '#6B7280',

        // Accent
        accent: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
        },

        // Borders
        default: '#2E2E35',
        subtle: '#1F1F23',

        // Semantic
        success: '#22C55E',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#06B6D4',
        purple: '#8B5CF6',
      },
      fontFamily: {
        inter: ['Inter'],
        mono: ['IBMPlexMono'],
      },
      borderRadius: {
        DEFAULT: '8px',
      },
      spacing: {
        // Explicit aliases for clarity
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
      },
    },
  },
  plugins: [],
} satisfies Config;
```

### NativeWind Setup (global.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Metro Config Requirement

Ensure `nativewind/metro` is integrated in `metro.config.js`:

```js
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
```

---

## 9. Dark Mode Only

LTF1 v1 ships dark mode exclusively. There is no light mode toggle, no system-preference detection, and no conditional color tokens.

### Rationale

1. **Brand identity.** The dark terminal aesthetic is the product identity. A light mode would dilute it.
2. **Development velocity.** Maintaining two themes doubles the surface area for visual bugs and doubles QA effort.
3. **Consistency.** Users experience the same visual language on web and mobile without mode mismatches.
4. **Performance.** OLED screens consume less power with dark interfaces. The `#050505` base is effectively black-pixel-off on OLED.

### Implementation

Lock the status bar and navigation bar to dark:

```tsx
// In root layout
<StatusBar style="light" />

// Disable system dark mode detection
// No useColorScheme() calls
// No dark: variant classes in NativeWind
```

---

## 10. Accessibility Requirements

### Touch Targets

All interactive elements must meet the 48x48dp minimum touch target size per WCAG 2.1 / Android Material guidelines. If the visual element is smaller (e.g., a 24px icon), the touchable area must still be 48x48 minimum via `hitSlop` or padding.

```tsx
<Pressable hitSlop={12} onPress={handlePress}>
  <Icon size={24} />
</Pressable>
```

### Contrast

All text on `#050505` meets WCAG AA minimum (4.5:1 for normal text, 3:1 for large text). Primary text (`#F9FAFB`) meets AAA. Semantic colors were chosen to meet AA on dark backgrounds.

### Screen Reader Support

- All images require `accessibilityLabel`.
- Interactive elements require `accessibilityRole` and `accessibilityLabel`.
- Status badges require `accessibilityLabel` with full text (not just color).
- Screen transitions must not trap focus.

### Dynamic Type

Respect system font scaling for body text. Headings and labels may cap at 1.3x to prevent layout breakage:

```tsx
<Text
  className="font-inter text-[16px] text-secondary"
  maxFontSizeMultiplier={1.3}
>
  Body text that scales with system settings
</Text>
```

---

## Appendix: Component Quick Reference

| Component | Background | Border | Radius | Min Height | Shadow |
|-----------|-----------|--------|--------|------------|--------|
| Screen | `#050505` | -- | -- | -- | -- |
| Card | `#111111` | 1px `#2E2E35` | 8px | -- | 2px 2px 0px #000 |
| Button (primary) | `#6366F1` | -- | 8px | 44px | -- |
| Button (secondary) | Transparent | 1px `#2E2E35` | 8px | 44px | -- |
| Input | `#111111` | 1px `#2E2E35` | 8px | 48px | -- |
| Bottom Sheet | `#0A0A0A` | 1px top `#2E2E35` | 16px top | -- | -- |
| Tab Bar | `#050505` | 1px top `#1F1F23` | -- | 56px | -- |
| FAB | `#6366F1` | -- | 16px | 56px | 2px 2px 0px #000 |
| Status Badge | Color/15 | -- | 4px | 24px | -- |
| List Item | Transparent | 1px bottom `#1F1F23` | -- | 56px | -- |
