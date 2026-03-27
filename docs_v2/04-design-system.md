# Design System v2 — iceberg-pm

## Identity

**"Dark brutalist terminal — built by devs, for devs."**

The design language is intentionally aggressive, monospace-heavy, and high-contrast. It signals to developers: this tool was built by people like you, not by a design agency trying to make project management feel friendly.

### Four Pillars

1. **Terminal Authenticity**: Monospace fonts, ASCII art, command-line aesthetic, keyboard-first interaction
2. **Brutal Clarity**: 2px borders, hard shadows, zero border-radius on cards, no gradients, no soft glow
3. **Engineered Motion**: Purpose-driven animation, 0.5s entrances, scroll-triggered once, no bouncing or looping
4. **Dark-First**: #050505 base, three-tier gray backgrounds, surgical color palette

---

## Color System

### Backgrounds (3-Tier Depth)

| Tier | Hex | CSS Variable | Usage |
|------|-----|-------------|-------|
| Void | `#050505` | `--bg-void` | Page background, deepest layer |
| Surface | `#0A0A0A` | `--bg-surface` | Section backgrounds, panels |
| Card | `#111111` | `--bg-card` | Cards, interactive elements, elevated surfaces |

### Text Hierarchy

| Level | Hex | CSS Variable | Usage |
|-------|-----|-------------|-------|
| Primary | `#F9FAFB` | `--text-primary` | Headlines, primary content, active states |
| Secondary | `#9CA3AF` | `--text-secondary` | Body text, descriptions, inactive labels |
| Tertiary | `#6B7280` | `--text-tertiary` | Timestamps, metadata, placeholders |

### Borders

| Type | Hex | Width | Usage |
|------|-----|-------|-------|
| Standard | `#2E2E35` | 2px | Card borders, section dividers, input borders |
| Subtle | `#1F1F23` | 1px | Internal dividers, table rows, light separation |
| Accent | `#6366F1` | 2px | Hover states, active elements, focus indicators |

### Accent

| State | Hex | Usage |
|-------|-----|-------|
| Default | `#6366F1` | Primary CTA, active nav, focus rings |
| Hover | `#4F46E5` | Hover state for accent elements |
| Muted | `#6366F1` at 10% opacity | Background highlights, selected rows |

### Semantic Colors

| Name | Hex | Domain | Usage |
|------|-----|--------|-------|
| Green | `#22C55E` | Success, Git | Merged PRs, completed tasks, git operations |
| Red | `#EF4444` | Error, Critical | Bugs, failed builds, urgent priority |
| Amber | `#F59E0B` | Warning, Intelligence | AI features, pending items, caution states |
| Purple | `#8B5CF6` | Analytics, Data | Charts, metrics, insights, data visualization |
| Cyan | `#06B6D4` | Planning, Identity | Sprint planning, identifiers, collaboration |
| Pink | `#EC4899` | Team, Collaboration | Team features, social interactions |
| Bright Green | `#10B981` | Status, DX | Online status, developer experience features |

### Category Accent System

Feature pages and cards use category-specific accent colors:

| Category | Color | Hex | Features |
|----------|-------|-----|----------|
| Git Integration | Green | `#22C55E` | PR-driven updates |
| Analytics | Purple | `#8B5CF6` | Git-based velocity |
| Intelligence | Amber | `#F59E0B` | Code complexity estimates |
| Quality | Red | `#EF4444` | Tech debt surfacing |
| Planning | Cyan | `#06B6D4` | Sprint planning |
| Collaboration | Pink | `#EC4899` | Team management |
| Developer Experience | Bright Green | `#10B981` | Terminal-first |
| Open Source | White | `#F9FAFB` | Open source features |

### Background Patterns

| Pattern | Usage | Implementation |
|---------|-------|----------------|
| Line Grid | Problem section, technical areas | Repeating 40px grid lines at 5% opacity |
| Dot Grid | How-it-works, workflow areas | 2px dots at 20px intervals, 10% opacity |
| Square Grid | Feature detail pages | 60px squares at 3% opacity |
| Radial Fade | Hero sections, emphasis | Radial gradient from accent at 5% to transparent |
| ASCII Pattern | Cards, decorative | Low-opacity ASCII characters in background |

### Color Rules

1. **No gradients on elements** — only background textures use gradients
2. **Accent (indigo) used sparingly** — CTAs, active states, focus rings only
3. **Semantic colors are functional** — green means success, red means error, always
4. **Background patterns at <10% opacity** — they add texture, not distraction
5. **White text on dark only** — never use dark text on dark backgrounds
6. **Border color changes on hover** — `#2E2E35` → `#6366F1` for interactive elements

---

## Typography

### Font Stack

| Font | Weight | Usage |
|------|--------|-------|
| **Inter** | 400 (Regular) | Body text, descriptions |
| **Inter** | 500 (Medium) | Navigation, labels, secondary headlines |
| **Inter** | 600 (Semibold) | Section headlines, emphasis |
| **Inter** | 700 (Bold) | Page titles, primary headlines |
| **Inter** | 800 (Extra Bold) | Hero headlines, marketing headers |
| **IBM Plex Mono** | 400 (Regular) | Code, timestamps, metadata |
| **IBM Plex Mono** | 500 (Medium) | Labels, category tags |
| **IBM Plex Mono** | 600 (Semibold) | Terminal text, commands |
| **IBM Plex Mono** | 700 (Bold) | ASCII art, hero monospace |

### Size Scale

| Size | Class | Usage |
|------|-------|-------|
| 10px | `text-[10px]` | Micro labels, footnotes |
| 11px | `text-[11px]` | Metadata, timestamps |
| 12px | `text-xs` | Secondary labels, badges |
| 13px | `text-[13px]` | Compact body text |
| 14px | `text-sm` | Default body text, form inputs |
| 16px | `text-base` | Standard paragraphs |
| 18px | `text-lg` | Intro paragraphs, emphasized body |
| 20px | `text-xl` | Card headers, section titles |
| 24px | `text-2xl` | Section headlines |
| 30px | `text-3xl` | Page titles |
| 36px | `text-4xl` | Feature headlines |
| 48px | `text-5xl` | Hero subheadlines |
| 60px | `text-6xl` | Hero headlines |
| 80px | `text-7xl` | Marketing hero (desktop only) |

### Hierarchy Rules

| Element | Font | Size | Weight | Color | Tracking |
|---------|------|------|--------|-------|----------|
| H1 (Hero) | Inter | 60-80px | 800 | Primary | `-0.02em` |
| H2 (Section) | Inter | 36-48px | 700 | Primary | `-0.01em` |
| H3 (Card) | Inter | 24-30px | 600 | Primary | Normal |
| H4 (Subsection) | Inter | 18-20px | 600 | Primary | Normal |
| Body | Inter | 14-16px | 400 | Secondary | Normal |
| Label | IBM Plex Mono | 10-12px | 500 | Tertiary | `0.05em` (uppercase) |
| Code | IBM Plex Mono | 13-14px | 400 | Secondary | Normal |
| CTA | Inter | 14-16px | 600 | Primary/Accent | `0.01em` |

### Typography Rules

1. Labels are always uppercase IBM Plex Mono with wide tracking
2. Headlines use Inter with negative tracking (tighter)
3. Body text is Inter Regular 14-16px, secondary color
4. Code and technical values always IBM Plex Mono
5. No font sizes below 10px
6. Line height: 1.1-1.2 for headlines, 1.5-1.6 for body, 1.3 for labels
7. Max paragraph width: 65ch for readability

---

## Component System

### BrutalButton

```
Variants: primary, secondary, ghost, danger, glitch, neon
Sizes: sm (h-8 text-xs), md (h-10 text-sm), lg (h-12 text-base), xl (h-14 text-lg)

Primary:
  bg: white | text: black | border: 2px white
  hover: translate -2px, shadow 4px 4px 0

Secondary (Ghost):
  bg: transparent | text: white | border: 2px #2E2E35
  hover: border #6366F1, bg #6366F1/10

Danger:
  bg: transparent | text: #EF4444 | border: 2px #EF4444
  hover: bg #EF4444/10

Glitch:
  animated border color shift on hover

Neon:
  accent border with glow effect on hover
```

### BrutalCard

```
bg: #111111 | border: 2px #2E2E35 | radius: 0px | shadow: 4px 4px 0 rgba(0,0,0,0.5)
hover: translate -2px -2px, border #3E3E45, shadow 6px 6px 0

ASCII variant: includes low-opacity ASCII art background pattern
```

### BrutalModal

```
Overlay: bg black/80 with backdrop-blur
Container: bg #0A0A0A | border: 2px #2E2E35 | max-w varies by size
Focus trap: Tab cycles within modal
ESC: closes modal
Portal: renders to document.body
Animation: fade in + scale from 0.95
```

### BrutalInput

```
bg: #0A0A0A | border: 2px #2E2E35 | text: #F9FAFB | radius: 0px
focus: border #6366F1 | outline: none
placeholder: #6B7280
error: border #EF4444
```

### BrutalBadge

```
Variants: default, success, warning, error, info
bg: semantic color at 10% | text: semantic color | border: 1px semantic color
font: IBM Plex Mono, uppercase, 10-11px
```

### BrutalTable

```
Header: bg #0A0A0A | text: #9CA3AF | font: IBM Plex Mono uppercase
Row: border-bottom 1px #1F1F23
Row hover: bg #111111
Cell: text-sm, Inter
```

---

## Motion System

### Philosophy

Motion is information, not decoration. Every animation communicates state change, draws attention to new content, or provides feedback on interaction.

### Entrance Animations

| Type | Properties | Duration | Usage |
|------|-----------|----------|-------|
| Standard Fade-Up | opacity 0→1, y 20→0 | 0.5s ease | Default for content sections |
| Delayed Fade-Up | opacity 0→1, y 20→0, delay 0.2s | 0.5s ease | Secondary content |
| Wider Fade-Up | opacity 0→1, y 40→0 | 0.6s ease | Hero sections, large blocks |
| Horizontal Fade | opacity 0→1, x ±30→0 | 0.5s ease | Side-by-side comparisons |

### Scroll-Triggered

```typescript
// All scroll animations trigger once only
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: 0.5, ease: "easeOut" }}
>
```

### Staggered Children

```typescript
// Parent container
variants={{
  visible: {
    transition: { staggerChildren: 0.08 } // 60-100ms gap
  }
}}

// Each child
variants={{
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}}
```

### Hover Animations

| Element | Hover Effect |
|---------|-------------|
| Card | translate(-2px, -2px), border color brighten, shadow expand |
| Button (primary) | translate(-2px, -2px), shadow 4px 4px 0 |
| Button (ghost) | border color → accent, bg accent/10 |
| Arrow icon | translateX(4px) |
| Link | color → accent |

### Terminal Animations

| Type | Speed | Usage |
|------|-------|-------|
| Character typing | 35ms per char | Hero terminal, code demos |
| Line streaming | 100ms per line | Git log display, status output |
| Cursor blink | 530ms interval | Terminal input, active fields |

### Timing Constants

| Name | Duration | Usage |
|------|----------|-------|
| instant | 0ms | State toggles (no visible transition) |
| micro | 150ms | Button press feedback, tooltip show |
| fast | 300ms | Menu open, dropdown reveal |
| normal | 500ms | Page entrance, section fade-in |
| slow | 700ms | Hero animation, complex transitions |

### Motion Rules

1. **Once only**: Scroll-triggered animations fire once, never replay
2. **No bouncing**: ease or easeOut only, never spring/bounce
3. **No looping**: Animations complete and stop (except loading states)
4. **Stagger, don't flood**: Children appear sequentially (60-100ms gap)
5. **Direction matches flow**: Content appearing below fades up, from side fades in
6. **Critical paths skip animation**: Loading states, error states have no entrance animation
7. **Reduced motion respected**: `prefers-reduced-motion` disables all non-essential animation
8. **Canvas animations are background**: Particle effects at low opacity, never interfere with content
9. **Hover provides feedback**: Interactive elements always respond to hover
10. **Duration < 700ms**: Nothing takes longer than 700ms to complete

---

## Layout System

### Container Strategy

```css
/* Standard section container */
.container {
  max-width: 1280px;  /* max-w-7xl */
  margin: 0 auto;
  padding: 0 24px;    /* px-6 */
}

/* Narrow content (text-heavy) */
.container-narrow {
  max-width: 896px;   /* max-w-4xl */
}

/* Wide content (dashboards) */
.container-wide {
  max-width: 1280px;  /* max-w-7xl */
}
```

### Section Spacing

```css
/* Standard section */
.section {
  padding-top: 96px;    /* py-24 */
  padding-bottom: 96px;
}

/* Desktop override */
@media (min-width: 768px) {
  .section {
    padding-top: 128px;  /* md:py-32 */
    padding-bottom: 128px;
  }
}
```

### Grid Patterns

| Pattern | CSS | Usage |
|---------|-----|-------|
| Two-column | `grid grid-cols-1 md:grid-cols-2 gap-8` | Feature comparisons, side-by-side |
| Three-column | `grid grid-cols-1 md:grid-cols-3 gap-6` | Feature cards, pricing tiers |
| Four-column | `grid grid-cols-2 md:grid-cols-4 gap-6` | Stats, small cards |
| Bento | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4` | Feature showcase |
| Dashboard | `grid grid-cols-12 gap-4-6` | App layout with sidebar |

### Responsive Strategy

| Breakpoint | Tailwind | Behavior |
|------------|----------|----------|
| Mobile | `<640px` | Single column, stacked layout |
| Small | `sm:640px` | Minor adjustments |
| Medium | `md:768px` | Two-column layouts activate |
| Large | `lg:1024px` | Full multi-column, sidebar visible |

### Z-Index Scale

| Layer | Z-Index | Elements |
|-------|---------|----------|
| Background | 0 | Page backgrounds, patterns |
| Content | 1-10 | Cards, sections, normal content |
| Sticky | 20 | Sticky navigation, floating elements |
| Dropdown | 30 | Dropdown menus, popovers |
| Modal overlay | 40 | Modal backdrop |
| Modal | 50 | Modal content |
| Toast | 60 | Notifications, toasts |
| Tooltip | 70 | Tooltips, hover popups |

---

## Voice & Language

### Characteristics

- **Direct**: Say what it is. No filler.
- **Technical**: Use developer vocabulary. Don't dumb it down.
- **Confident**: State facts. Don't hedge.
- **Dry humor**: Occasional wit. Never forced.

### Copy Hierarchy

| Level | Style | Example |
|-------|-------|---------|
| Hero headline | 2-4 words, bold, imperative | "Ship. Track. Ship again." |
| Subtitle | 1 sentence, value proposition | "Git-native project management." |
| Section headline | 3-6 words, descriptive | "Your repo drives the board" |
| Body text | Short paragraphs, Inter 14-16px | Technical but accessible |
| Label | ALL CAPS, monospace, category prefix | "GIT INTEGRATION" |
| CTA | Action verb, 2-4 words | "Get Started Free" |

### Words We Use

| Use | Don't Use |
|-----|-----------|
| ship | deliver |
| push | submit |
| track | monitor |
| build | construct |
| fix | resolve |
| fast | performant |
| simple | easy |
| dev | developer (in casual context) |

### Punctuation Rules

1. No exclamation marks. Ever.
2. Em dashes for asides — like this.
3. Periods end sentences, even in bullet points.
4. No trailing ellipsis.
5. Oxford comma always.
6. Code references in backticks: `PROJ-123`.

---

## TUI Design System

### Color Palette (Terminal)

| Name | Hex | Usage |
|------|-----|-------|
| BG | `#000000` | Terminal background |
| WHITE | `#FFFFFF` | Primary text, active items |
| LIGHT | `#CCCCCC` | Secondary text, highlights |
| GRAY | `#888888` | Muted text, inactive items |
| DIM | `#555555` | Very muted, borders |
| DARK | `#333333` | Dividers, separators |

### Status Icons (Terminal)

| Status | Icon | Color |
|--------|------|-------|
| backlog | `◌` | DIM |
| todo | `○` | GRAY |
| in_progress | `●` | WHITE |
| in_review | `◉` | LIGHT |
| done | `✓` | DIM |
| cancelled | `✕` | DARK |

### TUI Layout

```
  ┌──────────────────────────────────────────────┐
  │  LTF1  ›  Workspace  ›  Project     ● Ready │  ← Header
  │──────────────────────────────────────────────│
  │                                              │
  │  [Page Content]                              │  ← Content Area
  │                                              │
  │──────────────────────────────────────────────│
  │  ESC Back | T Tasks | S Sprint | Q Quit      │  ← Footer nav hints
  └──────────────────────────────────────────────┘
```

Minimum terminal size: 100 columns x 30 rows.
