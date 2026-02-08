# LTF1 Design Language — Layout

## Philosophy

Layouts are vertical-first. Content stacks. Grids serve structure, not creativity. Every section is a full-width band with a max-width container inside. The page reads like a terminal — top to bottom, no surprises.

---

## Container System

### Max-Width Scale

| Class | Width | Usage |
|-------|-------|-------|
| `max-w-4xl` | 896px | Narrow content — CTAs, hero subtitles, centered text |
| `max-w-5xl` | 1024px | Standard content — feature sections, detail pages |
| `max-w-6xl` | 1152px | Wide content — bento grids, comparison tables |
| `max-w-7xl` | 1280px | Full-width content — footer, navigation, pricing grid |

### Standard Container Pattern
```tsx
<div className="max-w-5xl mx-auto px-6">
  {/* content */}
</div>
```
- `mx-auto` centers horizontally
- `px-6` (24px) provides consistent side padding
- Never go below `px-4` (16px) on mobile

---

## Section Structure

### Section Anatomy
```
<section className="py-24 md:py-32">
  <div className="max-w-5xl mx-auto px-6">
    <!-- Section header -->
    <div className="text-center mb-12 md:mb-16">
      <span>Category label</span>
      <h2>Section headline</h2>
      <p>Section subtitle</p>
    </div>

    <!-- Section content -->
    <div className="grid ...">
      ...
    </div>
  </div>
</section>
```

### Section Padding

| Element | Mobile | Desktop |
|---------|--------|---------|
| Standard section | `py-24` (96px) | `md:py-32` (128px) |
| Hero section top | `pt-32` (128px) | `md:pt-40` (160px) |
| Hero section bottom | `pb-16` (64px) | `md:pb-24` (96px) |
| CTA section | `py-20` (80px) | `md:py-28` (112px) |
| Footer sections | `py-12` (48px) | `py-12` (48px) |

### Section Dividers
```css
border-top: 1px solid #1F1F23;
```
or
```css
border-top: 1px solid #2E2E35;
```
Used between major sections. Subtle but structural.

---

## Grid Patterns

### Two-Column (Feature Sections)
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
  <div>{/* text */}</div>
  <div>{/* ASCII/visual */}</div>
</div>
```
Alternates text/visual alignment using `md:[direction:rtl]` for right-aligned sections.

### Three-Column (Pricing)
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* tier cards */}
</div>
```

### Four-Column (Footer)
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-8">
  {/* link columns */}
</div>
```

### Bento Grid (Features Page)
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* feature cards */}
  {/* Some cards span: md:col-span-2 */}
</div>
```
Asymmetric grid where some cards span full width for visual rhythm.

### Contact Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* contact cards */}
</div>
```

---

## Page Templates

### Landing Page Structure
```
1. Navigation (sticky)
2. Hero Section (terminal animation + CTAs)
3. Problem Section (before/after toggle)
4. How It Works (sticky scroll, 4 steps)
5. Features Preview (3-row teaser)
6. Pricing Preview (3-tier grid)
7. Final CTA (centered with ASCII)
8. Footer (newsletter + links + particles)
```

### Feature Detail Page Structure
```
1. Navigation
2. Hero (category label + title + subtitle + ASCII block)
3. Feature Sections (alternating text/ASCII, 2-3 per page)
4. Bottom CTA (title + description + two buttons)
5. Footer
```

### Pricing Page Structure
```
1. Navigation
2. Hero (title + subtitle)
3. Tier Cards (3-column grid)
4. Comparison Table (full-width, sticky header)
5. FAQ or CTA
6. Footer
```

### Auth Page Structure (Sign In / Sign Up)
```
+-- Full viewport, split 50/50 --+
|                |                |
|   Left panel   |  Right panel   |
|   (image +     |  (Clerk form + |
|    overlay)    |   grid bg)     |
|                |                |
+----------------+----------------+
```
- Left: `w-full md:w-1/2`, background image with dark overlay
- Right: `w-full md:w-1/2`, centered form with grid background
- Mobile: Right panel only (left hidden)

---

## Responsive Strategy

### Mobile-First
All styles are mobile by default. Desktop styles use breakpoint prefixes.

### Breakpoints (Tailwind Defaults)
| Prefix | Min-Width | Usage |
|--------|-----------|-------|
| (none) | 0px | Mobile base styles |
| `sm:` | 640px | Small adjustments |
| `md:` | 768px | Tablet — major layout shifts |
| `lg:` | 1024px | Desktop — final layout |

### Common Responsive Patterns

**Font Size Scaling:**
```tsx
className="text-3xl md:text-4xl lg:text-5xl"
```

**Grid Column Shifts:**
```tsx
className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
```

**Padding Scaling:**
```tsx
className="px-4 md:px-6"
className="py-16 md:py-24"
```

**Visibility:**
```tsx
className="hidden md:block"  // desktop only
className="md:hidden"        // mobile only
```

**Flex Direction:**
```tsx
className="flex flex-col sm:flex-row"
```

---

## Navigation Layout

### Default State (Top)
```
Full width, transparent background
max-w-7xl container, px-6
Flex: logo left, links center (desktop), CTA right
```

### Scrolled State
```css
background: rgba(5, 5, 5, 0.8);
backdrop-filter: blur(24px);
border-bottom: 1px solid #1F1F23;
```
Shrinks padding, adds glass morphism effect.

### Mobile Navigation
Hamburger menu icon. Full-screen overlay or slide-in panel.

---

## Spacing Rules

### Consistent Gaps
| Context | Gap |
|---------|-----|
| Between grid cards | `gap-4` (16px) or `gap-6` (24px) |
| Between section header items | `gap-2` (8px) to `gap-4` (16px) |
| Between list items | `space-y-2` (8px) or `space-y-3` (12px) |
| Between major sections | Section padding handles this |
| Between CTA buttons | `gap-4` (16px) |

### Margin Bottom Hierarchy
| Element | Margin Below |
|---------|-------------|
| Category label | `mb-4` to `mb-6` |
| Section headline | `mb-4` to `mb-6` |
| Section subtitle | `mb-8` to `mb-12` |
| Card group | `mb-12` to `mb-16` |

---

## Z-Index Scale

| Layer | Z-Index | Usage |
|-------|---------|-------|
| Background patterns | `z-0` | Grid/dot patterns behind content |
| Content | `z-10` | Default content layer |
| Sticky headers | `z-20` | Table headers, comparison table |
| Navigation | `z-50` | Fixed nav bar |
| Overlays | `z-[100]` | Modals, drawers |

---

## Layout Rules

1. **Every section is a full-width band** — background colors extend edge-to-edge, content is constrained
2. **`max-w-5xl` is the default** — use `max-w-6xl` or `max-w-7xl` only when content demands it
3. **`px-6` is the universal side padding** — consistent across all containers
4. **Grids break at `md:` (768px)** — single column on mobile, multi-column on tablet+
5. **Section padding is generous** — `py-24 md:py-32` minimum. Whitespace is a feature.
6. **Alternating alignment** — feature detail sections alternate text/visual left-right
7. **Center alignment for heroes and CTAs** — `text-center` for focused attention
8. **Left alignment for content** — feature descriptions, pricing details, body copy
9. **No full-bleed images** — all images contained within bordered panels or overlaid panels
10. **Split layouts are 50/50** — auth pages only, with left panel hidden on mobile
