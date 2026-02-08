# LTF1 Design Language — Colors

## Philosophy

The palette is surgical. One accent color. Three background tiers. Three text tiers. Five semantic colors borrowed from terminal conventions (green = success, red = error). No gradients on elements. No color for decoration. Every color communicates.

---

## Core Palette

### Backgrounds (darkest to lightest)

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-base` | `#050505` | Page background, deepest layer |
| `bg-surface` | `#0A0A0A` | ASCII blocks, code panels, elevated content |
| `bg-card` | `#111111` | Cards, containers, form inputs, interactive surfaces |

The three-tier system creates depth without shadows. `#050505` is the void. `#0A0A0A` sits on top. `#111111` is the interactive layer.

### Text (brightest to dimmest)

| Token | Hex | Usage |
|-------|-----|-------|
| `text-primary` | `#F9FAFB` | Headlines, important values, interactive text on hover |
| `text-secondary` | `#9CA3AF` | Body text, descriptions, default link color |
| `text-tertiary` | `#6B7280` | Labels, hints, timestamps, ASCII art default, placeholders |

### Borders & Dividers

| Token | Hex | Usage |
|-------|-----|-------|
| `border-default` | `#2E2E35` | Standard 2px border on cards, inputs, containers |
| `border-subtle` | `#1F1F23` | 1px dividers, nav border on scroll, footer separators |

### Accent

| Token | Hex | Usage |
|-------|-----|-------|
| `accent` | `#6366F1` | Primary accent — CTAs, active states, focus rings, category labels |
| `accent-hover` | `#4F46E5` | Hover state for accent elements |
| `accent-muted` | `#6366F1/30` | Badges, faint accent borders, subtle highlights |

Indigo was chosen because it reads as "electric" on dark backgrounds without the aggression of blue or the warmth of purple. It's neutral enough to pair with any semantic color.

---

## Semantic Colors

Used exclusively for meaning. Never decorative.

| Name | Hex | Terminal Analogy | Usage |
|------|-----|-----------------|-------|
| Green | `#22C55E` | `\033[32m` | Success, active, synced, git-integration, positive metrics |
| Red | `#EF4444` | `\033[31m` | Error, critical, blocked, debt, negative metrics |
| Amber | `#F59E0B` | `\033[33m` | Warning, moderate, intelligence, pending |
| Purple | `#8B5CF6` | `\033[35m` | Analytics, data, numbers, metrics |
| Cyan | `#06B6D4` | `\033[36m` | Planning, collaboration, identifiers, labels |
| Pink | `#EC4899` | — | Collaboration, team-specific accent |
| Bright Green | `#10B981` | — | Status dots, success confirmations, developer experience |

---

## Category Accent System

Each feature category has an assigned color used for:
- The 2px category dot on feature cards and detail pages
- Border accents on hover states
- ASCII art highlighting in feature-specific blocks

| Category | Color | Hex |
|----------|-------|-----|
| Git Integration | Green | `#22C55E` |
| Analytics | Purple | `#8B5CF6` |
| Intelligence | Amber | `#F59E0B` |
| Quality | Red | `#EF4444` |
| Planning | Cyan | `#06B6D4` |
| Collaboration | Pink | `#EC4899` |
| Developer Experience | Bright Green | `#10B981` |
| Open Source | White | `#F9FAFB` |

---

## Background Patterns

Subtle patterns add texture without competing with content. Always applied with very low opacity.

### Line Grid (60px)
```css
background-image:
  linear-gradient(to right, #F9FAFB 1px, transparent 1px),
  linear-gradient(to bottom, #F9FAFB 1px, transparent 1px);
background-size: 60px 60px;
opacity: 0.04;
```
Used on: ProblemSection background

### Dot Grid (24px)
```css
background-image: radial-gradient(circle, #F9FAFB 0.5px, transparent 0.5px);
background-size: 24px 24px;
opacity: 0.03;
```
Used on: HowItWorksSection background

### Square Grid (24px, higher contrast)
```css
background-image:
  linear-gradient(rgba(46,46,53,0.18) 1px, transparent 1px),
  linear-gradient(90deg, rgba(46,46,53,0.18) 1px, transparent 1px);
background-size: 24px 24px;
```
Used on: Sign-in/sign-up right panel

### Radial Fade
```css
background: radial-gradient(
  ellipse 70% 50% at 50% 30%,
  rgba(255,255,255,0.03) 0%,
  transparent 70%
);
```
Used on: Hero section subtle glow

---

## Color Rules

1. **Never use color alone to communicate state** — always pair with text, icons, or position
2. **Accent appears sparingly** — overuse of `#6366F1` dilutes its signal
3. **Semantic colors are fixed** — green always means success, red always means error
4. **No gradients on elements** — gradients are reserved for background textures only
5. **White (`#F9FAFB`) is the loudest color** — use it to draw the eye to what matters
6. **Gray is the default** — most text should be `#9CA3AF` or `#6B7280`, not white
7. **Borders define structure** — `#2E2E35` at 2px is the standard container edge
