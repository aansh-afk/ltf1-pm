# LTF1 Design Language — Style

## Philosophy

Brutalist with precision. Every element is a rectangle with a clear edge. Shadows are offset and hard — no blur, no diffusion. Borders are structural, not decorative. The absence of rounded corners isn't laziness, it's intent: this software is a tool, not a toy.

---

## Borders

### Standard Border
```css
border: 2px solid #2E2E35;
```
The 2px border is the signature of the design system. It appears on every card, input, container, and interactive surface. It communicates structure and containment.

### Subtle Divider
```css
border: 1px solid #1F1F23;
```
Used for horizontal separators — footer dividers, nav bottom border, section breaks. Lower visual weight.

### Accent Border (Hover/Focus)
```css
border-color: #6366F1;
```
Replaces default border on interactive hover or focus states. The color change is the primary hover feedback mechanism.

### Border Width Rules
| Element | Width |
|---------|-------|
| Cards, containers | 2px |
| Form inputs | 2px |
| Buttons (primary) | 2px |
| Section dividers | 1px |
| Table rows | 1px bottom |
| Nav (scrolled) | 1px bottom |

---

## Border Radius

The system uses minimal rounding. Hard edges are the default.

| Element | Radius | Class |
|---------|--------|-------|
| Major cards, feature blocks | 0px | none |
| Pricing cards | 12px | `rounded-xl` |
| Buttons | 8px | `rounded-lg` |
| Form inputs | 8px | `rounded-lg` |
| Nav container (scrolled) | 8-12px | `rounded-xl` |
| Badges/pills | 4-8px | `rounded` / `rounded-lg` |
| ASCII/code blocks | 0px | none |
| Toggle buttons | 4-8px | `rounded` |

**Rule**: When in doubt, use no rounding. Rounded corners are reserved for small interactive elements (buttons, inputs) that benefit from touch target affordance.

---

## Shadows

### Brutal Offset Shadow
```css
box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.5);
```
Hard-offset, no blur. Used on hero CTAs and primary action buttons. Creates a "stamped" feel.

### Hover Shadow (reduced)
```css
box-shadow: 3px 3px 0px rgba(0, 0, 0, 0.4);
```
Slightly reduced on hover when combined with `translateY(-2px)` lift.

### No Shadow (default)
Most elements have no shadow. The three-tier background system (`#050505` → `#0A0A0A` → `#111111`) creates depth through color difference, not elevation.

**Rule**: Shadows are accent, not structure. If more than 3 elements on screen have shadows, you've overused them.

---

## Cards

### Standard Card
```css
background: #111111;
border: 2px solid #2E2E35;
```
No shadow. No rounding (or `rounded-xl` for pricing). Content creates hierarchy.

### Card with ASCII Block
```
+-- card (#111111, border-2 #2E2E35) --+
|                                       |
|  +-- ASCII area (#0A0A0A, p-6) ----+ |
|  |  monospace content               | |
|  +----------------------------------+ |
|                                       |
|  Title (Inter bold, #F9FAFB)         |
|  Description (Inter, #6B7280)        |
+---------------------------------------+
```

### Card Hover States
```tsx
variants={{
  rest: { borderColor: 'rgba(46, 46, 53, 1)', y: 0 },
  hover: { borderColor: 'rgba(249, 250, 251, 0.2)', y: -2 }
}}
```
Cards lift 2px and lighten their border on hover. No shadow added.

### Highlighted Card (e.g., Pro pricing tier)
```css
border-color: rgba(99, 102, 241, 0.6);  /* accent at 60% */
```
Hover transitions to full accent:
```css
border-color: rgba(99, 102, 241, 1);
```

---

## Buttons

### Primary CTA
```css
background: #F9FAFB;
color: #050505;
border: 2px solid #4F46E5;
padding: 12px 24px;          /* py-3 px-6 */
font: Inter 600 14px;         /* font-semibold text-sm */
border-radius: 8px;           /* rounded-lg */
box-shadow: 4px 4px 0px rgba(0,0,0,0.5);
```
Hover: `translateY(-2px)`, shadow reduces to `3px 3px`.

White-on-black. The loudest element on screen. Reserved for primary actions only.

### Secondary / Ghost Button
```css
background: transparent;
color: #9CA3AF;
border: 1px solid #2E2E35;
padding: 12px 24px;
font: Inter 600 14px;
border-radius: 8px;
```
Hover: `border-color: #6366F1`, `color: #F9FAFB`.

### Accent Button (forms, waitlist)
```css
background: #6366F1;
color: #FFFFFF;
border: 2px solid #4F46E5;
padding: 10px 20px;
font: Inter 600 14px;
border-radius: 8px;
```
Hover: `background: #4F46E5`.

### Disabled Button
```css
opacity: 0.4;
cursor: not-allowed;
```
Same styling as its base state, just faded.

---

## Form Inputs

### Text Input
```css
background: #111111;
border: 2px solid #2E2E35;
color: #F9FAFB;
padding: 10px 16px;           /* py-2.5 px-4 */
font: IBM Plex Mono 400 14px; /* or Inter depending on context */
border-radius: 8px;
```
Focus: `border-color: #6366F1`, `outline: none`.
Placeholder: `color: #6B7280`.

### Clerk-Themed Inputs (Sign In / Sign Up)
```tsx
formFieldInput: {
  backgroundColor: '#111111',
  border: '2px solid #2E2E35',
  borderRadius: '0',           // HARD EDGES on auth pages
  color: '#F9FAFB',
}
```
Auth page inputs use 0px radius to match the brutalist card aesthetic.

---

## Tables (Comparison)

### Header Row
```css
background: #050505;
position: sticky;
border-bottom: 2px solid #2E2E35;
font: IBM Plex Mono 700 12px uppercase;
color: #F9FAFB;
```

### Body Rows
```css
border-bottom: 1px solid #2E2E35;
font: IBM Plex Mono 400 12px;
color: #9CA3AF;
```

### Category Headers
```css
background: #0A0A0A;
font: IBM Plex Mono 700 10px uppercase;
color: #6366F1;
letter-spacing: 0.1em;
```

### Cell Values
- Feature supported: `+` in `#F9FAFB`
- Feature not supported: `—` in `#6B7280/40`

---

## Status Indicators

### Active Dot
```css
width: 6px;                    /* w-1.5 */
height: 6px;
background: #10B981;
border-radius: 50%;
animation: pulse;
```

### Category Dot
```css
width: 8px;                    /* w-2 */
height: 8px;
background: [categoryColor];
border-radius: 0;              /* square on feature cards */
```

### Badges
```css
font: IBM Plex Mono 400 10px uppercase;
color: #6366F1;
border: 1px solid rgba(99, 102, 241, 0.3);
padding: 2px 8px;
letter-spacing: 0.05em;
```

---

## Style Rules

1. **2px borders are the standard** — never use 1px on cards or interactive elements
2. **No blur shadows** — only hard-offset `Xpx Xpx 0px` shadows
3. **Elevation through color, not shadow** — darker = further back, lighter = closer
4. **Accent border replaces default on hover** — the color shift IS the hover effect
5. **Hard edges on content blocks** — rounded corners only on buttons and small interactives
6. **White is the primary CTA color** — `#F9FAFB` background buttons are the loudest
7. **Indigo is the secondary CTA color** — `#6366F1` for form submits and inline actions
8. **Gray is the tertiary CTA color** — ghost buttons with border transitions
