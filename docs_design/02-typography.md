# LTF1 Design Language — Typography

## Philosophy

Two fonts. No exceptions. Inter for human-readable prose. IBM Plex Mono for machine-readable data. The tension between the two creates the site's dual identity: a polished product that speaks developer.

---

## Font Families

### Inter (Sans-Serif) — Voice of the Product
```css
font-family: 'Inter', sans-serif;
```
- **Role**: Headlines, body copy, buttons, navigation, descriptions
- **Weights used**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold), 800 (extrabold)
- **Character**: Clean, modern, highly legible. Designed for screens.
- **Tailwind**: `font-['Inter',sans-serif]`

### IBM Plex Mono — Voice of the Terminal
```css
font-family: 'IBM Plex Mono', monospace;
```
- **Role**: Labels, tags, ASCII art, code blocks, technical values, category markers
- **Weights used**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Character**: Industrial, monospaced, engineered. IBM's open-source monospace.
- **Tailwind**: `font-['IBM_Plex_Mono',monospace]`

### Font Loading (index.html)
```html
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

---

## Size Scale

Follows Tailwind's default scale. Sizes are chosen for their role, not their pixel value.

| Class | Size | Role |
|-------|------|------|
| `text-[10px]` | 10px | Micro labels, badge text, comparison table values |
| `text-[11px]` | 11px | ASCII art text, terminal output |
| `text-xs` | 12px | Labels, tags, category markers, feature list items |
| `text-sm` | 14px | Secondary text, descriptions, footer links, button text |
| `text-base` | 16px | Body text, section descriptions |
| `text-lg` | 18px | Subheadings, card descriptions |
| `text-xl` | 20px | Section subheads |
| `text-2xl` | 24px | Card titles, feature headlines |
| `text-3xl` | 30px | Section headers (mobile) |
| `text-4xl` | 36px | Section headers (desktop), pricing numbers |
| `text-5xl` | 48px | Page headers, hero text (mobile) |
| `text-6xl` | 64px | Hero headlines (desktop) |
| `text-7xl` | 80px | Maximum impact — hero only |

---

## Hierarchy Rules

### Headlines (Inter)
```
H1 — Hero titles
  Font: Inter Bold (700) or Extrabold (800)
  Size: text-5xl → md:text-6xl → lg:text-7xl
  Color: #F9FAFB
  Tracking: tracking-tight (-0.025em)
  Line-height: leading-tight (1.25)

H2 — Section headers
  Font: Inter Bold (700)
  Size: text-3xl → md:text-4xl → lg:text-5xl
  Color: #F9FAFB
  Tracking: tracking-tight

H3 — Card/feature titles
  Font: Inter Bold (700)
  Size: text-2xl → md:text-3xl
  Color: #F9FAFB

H4 — Footer section headers, small labels
  Font: IBM Plex Mono Semibold (600)
  Size: text-xs
  Color: #6366F1
  Transform: uppercase
  Tracking: tracking-wider (0.05em)
```

### Body Text (Inter)
```
Primary body — descriptions, paragraphs
  Font: Inter Regular (400)
  Size: text-base → text-lg
  Color: #6B7280
  Line-height: leading-relaxed (1.625)

Secondary body — captions, supporting text
  Font: Inter Regular (400)
  Size: text-sm
  Color: #9CA3AF
```

### Labels & Technical Text (IBM Plex Mono)
```
Category labels
  Font: IBM Plex Mono Semibold (600)
  Size: text-xs
  Color: #6B7280 or #6366F1
  Transform: uppercase
  Tracking: tracking-wider

Feature list items (pricing)
  Font: IBM Plex Mono Regular (400)
  Size: text-xs
  Color: #9CA3AF
  Prefix: "+" character

ASCII art / code blocks
  Font: IBM Plex Mono Regular (400)
  Size: text-[11px] → text-xs
  Color: #6B7280 (default), semantic colors via ColoredPre
  Line-height: leading-relaxed
  White-space: pre
  Select: none
```

### Interactive Text
```
Navigation links
  Font: Inter Medium (500)
  Size: text-sm
  Color: #9CA3AF → hover: #F9FAFB
  Transition: 200ms

Button text
  Font: Inter Semibold (600)
  Size: text-sm
  Transform: none (buttons are sentence case)

Footer links
  Font: Inter Regular (400)
  Size: text-sm
  Color: #9CA3AF → hover: #F9FAFB
```

---

## Tracking & Spacing Rules

| Context | Tracking | Value |
|---------|----------|-------|
| Large headlines (>36px) | `tracking-tight` | -0.025em |
| Body text | Default | 0 |
| Monospace labels | `tracking-wider` | 0.05em |
| Micro labels | `tracking-widest` | 0.1em |

### Line Height

| Context | Class | Ratio |
|---------|-------|-------|
| Headlines | `leading-tight` | 1.25 |
| Body text | `leading-relaxed` | 1.625 |
| ASCII art | `leading-relaxed` or `leading-6` | 1.625 / 24px |
| Compact UI | `leading-snug` | 1.375 |

---

## Typography Do's and Don'ts

### Do
- Use Inter for anything a human reads as prose
- Use IBM Plex Mono for anything that feels "from the system"
- Apply `tracking-tight` to headlines above `text-3xl`
- Apply `uppercase tracking-wider` to monospace labels
- Let body text be gray (`#6B7280` or `#9CA3AF`), not white

### Don't
- Mix fonts within a single text element
- Use Inter for ASCII art or code
- Use IBM Plex Mono for paragraphs of prose
- Apply `uppercase` to Inter body text
- Use `font-bold` on body copy — it breaks the hierarchy
- Go below `text-[10px]` for any text
- Use more than 3 font weights in a single component
