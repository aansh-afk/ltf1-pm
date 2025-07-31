# Brutalist Design System Guide

The LTF1 Brutalist Design System embodies raw, functional aesthetics with uncompromising visual hierarchy. This guide covers all design components, patterns, and implementation details.

## Design Philosophy

### Core Principles

1. **RAW AESTHETICS**
   - No rounded corners, ever
   - Sharp edges only
   - High contrast ratios
   - Visible borders and divisions

2. **FUNCTIONAL HIERARCHY**
   - Typography drives structure
   - Size indicates importance
   - Uppercase for emphasis
   - Monospace for technical feel

3. **BRUTAL HONESTY**
   - No decorative elements
   - Function over form
   - Clear visual boundaries
   - Direct user feedback

4. **PERFORMANCE FIRST**
   - Minimal animations
   - Fast load times
   - Efficient rendering
   - Accessibility built-in

## Color System

### Primary Palette

```css
/* Core Colors */
--primary-brutalist: #FFD93D;      /* Brutal Yellow */
--event-horizon: #0A0A0A;          /* Near Black */
--carbon-plate: #1A1A1A;           /* Surface Dark */
--basalt-border: #2A2A2A;          /* Border Gray */
--cathode-white: #F5F5F5;          /* Off White */

/* Status Colors */
--success-brutalist: #00FF00;      /* Harsh Green */
--error-brutalist: #FF0000;        /* Pure Red */
--warning-brutalist: #FFA500;      /* Alert Orange */
--info-brutalist: #00FFFF;         /* Cyber Cyan */
```

### Color Usage

#### Backgrounds
- **Primary**: `event-horizon` (#0A0A0A)
- **Surface**: `carbon-plate` (#1A1A1A)
- **Elevated**: `basalt-border` (#2A2A2A)

#### Text
- **Primary**: `cathode-white` (#F5F5F5)
- **Emphasis**: `primary-brutalist` (#FFD93D)
- **Muted**: `#808080`

#### Interactive
- **Default**: `primary-brutalist` background
- **Hover**: Increase brightness 20%
- **Active**: Decrease brightness 20%
- **Disabled**: 50% opacity

## Typography

### Font Stack

```css
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
--font-system: -apple-system, system-ui, sans-serif;
```

### Type Scale

```css
/* Brutal Type Scale - All uppercase for headers */
--text-xs: 0.75rem;    /* 12px - Labels */
--text-sm: 0.875rem;   /* 14px - Body small */
--text-base: 1rem;     /* 16px - Body default */
--text-lg: 1.125rem;   /* 18px - Body large */
--text-xl: 1.25rem;    /* 20px - H4 */
--text-2xl: 1.5rem;    /* 24px - H3 */
--text-3xl: 1.875rem;  /* 30px - H2 */
--text-4xl: 2.25rem;   /* 36px - H1 */
--text-5xl: 3rem;      /* 48px - Display */
```

### Text Styles

#### Headers
```css
.brutal-h1 {
  font-size: var(--text-4xl);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1;
}

.brutal-h2 {
  font-size: var(--text-3xl);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.brutal-h3 {
  font-size: var(--text-2xl);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
```

#### Body Text
```css
.brutal-body {
  font-size: var(--text-base);
  font-weight: 400;
  line-height: 1.5;
  font-family: var(--font-mono);
}

.brutal-caption {
  font-size: var(--text-sm);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
```

## Spacing System

### Grid Unit
All spacing follows an 8px grid system:

```css
/* Spacing Scale */
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### Component Spacing
- **Padding**: Use 12px, 16px, 24px
- **Margin**: Use 8px, 16px, 32px
- **Gap**: Use 8px, 16px for flex/grid

## Components

### Buttons

#### Primary Button
```tsx
<button className="brutal-btn brutal-btn-primary">
  TAKE ACTION
</button>
```

```css
.brutal-btn {
  padding: 12px 24px;
  font-family: var(--font-mono);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border: 2px solid var(--basalt-border);
  background: var(--carbon-plate);
  color: var(--cathode-white);
  cursor: pointer;
  transition: all 200ms ease;
  box-shadow: 4px 4px 0 var(--event-horizon);
}

.brutal-btn-primary {
  background: var(--primary-brutalist);
  color: var(--event-horizon);
  border-color: var(--event-horizon);
}

.brutal-btn:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 var(--event-horizon);
}

.brutal-btn:active {
  transform: translate(0, 0);
  box-shadow: 2px 2px 0 var(--event-horizon);
}
```

#### Button Variants
- **Secondary**: Gray background
- **Danger**: Red background
- **Ghost**: Transparent background
- **Disabled**: 50% opacity, no hover

### Forms

#### Input Fields
```tsx
<input className="brutal-input" placeholder="ENTER TEXT" />
```

```css
.brutal-input {
  width: 100%;
  padding: 12px 16px;
  font-family: var(--font-mono);
  font-size: var(--text-base);
  background: var(--carbon-plate);
  border: 2px solid var(--basalt-border);
  color: var(--cathode-white);
  transition: all 200ms ease;
}

.brutal-input:focus {
  outline: none;
  border-color: var(--primary-brutalist);
  box-shadow: 0 0 0 4px rgba(255, 217, 61, 0.2);
}

.brutal-input::placeholder {
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

#### Select Dropdown
```tsx
<select className="brutal-select">
  <option>OPTION ONE</option>
  <option>OPTION TWO</option>
</select>
```

### Cards

```tsx
<div className="brutal-card">
  <div className="brutal-card-header">
    <h3>CARD TITLE</h3>
  </div>
  <div className="brutal-card-body">
    Content goes here
  </div>
</div>
```

```css
.brutal-card {
  background: var(--carbon-plate);
  border: 2px solid var(--basalt-border);
  box-shadow: 4px 4px 0 var(--event-horizon);
}

.brutal-card-header {
  padding: 16px 24px;
  border-bottom: 2px solid var(--basalt-border);
  background: var(--basalt-border);
}

.brutal-card-body {
  padding: 24px;
}
```

### Tables

```tsx
<table className="brutal-table">
  <thead>
    <tr>
      <th>COLUMN 1</th>
      <th>COLUMN 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Data 1</td>
      <td>Data 2</td>
    </tr>
  </tbody>
</table>
```

```css
.brutal-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--carbon-plate);
  border: 2px solid var(--basalt-border);
}

.brutal-table th {
  padding: 12px 16px;
  background: var(--basalt-border);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-align: left;
  border-bottom: 2px solid var(--event-horizon);
}

.brutal-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--basalt-border);
}

.brutal-table tr:hover {
  background: rgba(255, 217, 61, 0.1);
}
```

### Navigation

#### Top Navigation
```tsx
<nav className="brutal-nav">
  <div className="brutal-nav-brand">LTF1</div>
  <div className="brutal-nav-links">
    <a href="#" className="brutal-nav-link active">DASHBOARD</a>
    <a href="#" className="brutal-nav-link">PROJECTS</a>
    <a href="#" className="brutal-nav-link">TEAM</a>
  </div>
</nav>
```

```css
.brutal-nav {
  display: flex;
  align-items: center;
  padding: 0 24px;
  height: 64px;
  background: var(--carbon-plate);
  border-bottom: 2px solid var(--basalt-border);
}

.brutal-nav-brand {
  font-size: var(--text-2xl);
  font-weight: 900;
  color: var(--primary-brutalist);
  letter-spacing: 0.1em;
}

.brutal-nav-link {
  padding: 8px 16px;
  margin: 0 4px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--cathode-white);
  transition: all 200ms ease;
}

.brutal-nav-link:hover,
.brutal-nav-link.active {
  background: var(--primary-brutalist);
  color: var(--event-horizon);
}
```

### Modals

```tsx
<div className="brutal-modal-overlay">
  <div className="brutal-modal">
    <div className="brutal-modal-header">
      <h2>MODAL TITLE</h2>
      <button className="brutal-modal-close">×</button>
    </div>
    <div className="brutal-modal-body">
      Modal content
    </div>
    <div className="brutal-modal-footer">
      <button className="brutal-btn">CANCEL</button>
      <button className="brutal-btn brutal-btn-primary">CONFIRM</button>
    </div>
  </div>
</div>
```

### Status Indicators

```tsx
// Status badges
<span className="brutal-badge brutal-badge-success">ACTIVE</span>
<span className="brutal-badge brutal-badge-warning">PENDING</span>
<span className="brutal-badge brutal-badge-error">FAILED</span>
```

```css
.brutal-badge {
  display: inline-block;
  padding: 4px 8px;
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border: 2px solid;
}

.brutal-badge-success {
  background: var(--success-brutalist);
  color: var(--event-horizon);
  border-color: var(--event-horizon);
}
```

## Patterns

### Loading States
```tsx
<div className="brutal-skeleton">
  <div className="brutal-skeleton-line"></div>
  <div className="brutal-skeleton-line short"></div>
</div>
```

### Empty States
```tsx
<div className="brutal-empty">
  <div className="brutal-empty-icon">[ ]</div>
  <h3>NO DATA FOUND</h3>
  <p>Start by adding some items</p>
  <button className="brutal-btn brutal-btn-primary">
    ADD ITEM
  </button>
</div>
```

### Error States
```tsx
<div className="brutal-error">
  <div className="brutal-error-icon">[!]</div>
  <h3>ERROR OCCURRED</h3>
  <p>Something went wrong. Try again.</p>
  <code className="brutal-error-code">ERR_CODE_500</code>
</div>
```

## Animations

Keep animations minimal and functional:

```css
/* Standard transition */
.brutal-transition {
  transition: all 200ms ease;
}

/* Hover lift effect */
.brutal-hover-lift:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 var(--event-horizon);
}

/* Active press effect */
.brutal-active-press:active {
  transform: translate(1px, 1px);
  box-shadow: 2px 2px 0 var(--event-horizon);
}

/* NO smooth scrolling, NO fade effects, NO rotations */
```

## Accessibility

### Color Contrast
- Text on dark: minimum 7:1 ratio
- Large text: minimum 4.5:1 ratio
- Interactive elements: clear focus states

### Keyboard Navigation
- All interactive elements keyboard accessible
- Visible focus indicators
- Logical tab order
- Skip links for navigation

### Screen Readers
- Semantic HTML structure
- ARIA labels where needed
- Descriptive button text
- Alt text for images

## Implementation Guidelines

### Component Structure
```tsx
// Brutal component example
export function BrutalButton({ 
  children, 
  variant = "primary",
  disabled = false,
  onClick 
}: BrutalButtonProps) {
  return (
    <button 
      className={clsx(
        "brutal-btn",
        `brutal-btn-${variant}`,
        disabled && "brutal-btn-disabled"
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
```

### Tailwind Config
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'primary-brutalist': '#FFD93D',
        'event-horizon': '#0A0A0A',
        'carbon-plate': '#1A1A1A',
        'basalt-border': '#2A2A2A',
        'cathode-white': '#F5F5F5',
      },
      boxShadow: {
        'brutal': '4px 4px 0 var(--event-horizon)',
        'brutal-hover': '6px 6px 0 var(--event-horizon)',
        'brutal-active': '2px 2px 0 var(--event-horizon)',
      },
      borderRadius: {
        'none': '0',
        // NO OTHER BORDER RADIUS VALUES
      }
    }
  }
}
```

## Do's and Don'ts

### DO ✓
- Use uppercase for emphasis
- Keep borders at 2px
- Use monospace fonts
- Apply harsh shadows
- Maintain high contrast
- Use 8px grid spacing

### DON'T ✗
- Use rounded corners EVER
- Add decorative elements
- Use smooth animations
- Apply gradients
- Use soft shadows
- Mix font families

## Component Library

All brutalist components are available as:
- React components in `/components/brutal/`
- CSS utilities in `/styles/brutal.css`
- Tailwind presets in `tailwind.config.js`

## Related Documentation

- [Development Guide](../development/contributing.md) - Using components
- [Architecture Overview](../architecture/technical-overview.md) - Design decisions
- [Getting Started](../guides/getting-started.md) - Setup instructions