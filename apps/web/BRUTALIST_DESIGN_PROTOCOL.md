# BRUTALIST DESIGN PROTOCOL

## IMMUTABLE LAWS

### 1. BORDER-RADIUS: 0
- **ABSOLUTE LAW**: No element shall have rounded corners
- All border-radius properties must be 0
- ESLint enforces this rule automatically

### 2. COLOR PROTOCOL
```css
--event-horizon: #000000    /* Primary black */
--carbon-plate: #0A0A0A     /* Secondary black */
--cathode-white: #F5F5F5    /* Primary white */
--basalt-border: #333333    /* Border color */
```

### 3. SACRED GLITCH FLARE
```css
--glitch-flare: linear-gradient(90deg, #00FFFF, #FF00FF, #FFFF00)
```
- Use sparingly for emphasis only
- Never as primary background

### 4. TYPOGRAPHY
- **FONT**: IBM Plex Mono (monospace only)
- **STYLES**: UPPERCASE for emphasis
- **TRACKING**: Wide letter-spacing (tracking-wider)
- **WEIGHT**: Regular (400), Semibold (600), Bold (700)

### 5. SPACING: 8px GRID
All spacing must be multiples of 8px:
- 8px, 16px, 24px, 32px, 40px, 48px, 56px, 64px, 72px, 80px

### 6. SHADOWS
- **Standard**: 5px 5px 0px #000000
- **Small**: 3px 3px 0px #000000
- **Large**: 8px 8px 0px #000000
- **Hover**: 8px 8px 0px #000000

### 7. TRANSITIONS
- **Timing**: Linear or brutal-out (no ease-in-out)
- **Movement**: Translate only (no scale or rotate)
- **Duration**: 200ms standard

## COMPONENT LIBRARY

### BrutalButton
```jsx
<BrutalButton variant="primary|secondary|ghost|danger|glitch" size="sm|md|lg|xl">
  CLICK ME
</BrutalButton>
```

### BrutalCard
```jsx
<BrutalCard variant="default|elevated|bordered" hoverable>
  Content
</BrutalCard>
```

### BrutalBadge
```jsx
<BrutalBadge variant="default|error|success|info|warning" size="sm|md|lg">
  STATUS
</BrutalBadge>
```

### BrutalAvatar
```jsx
<BrutalAvatar src="/path" fallback="JD" size="sm|md|lg|xl" status="online|offline|busy|away" />
```

### BrutalProgress
```jsx
<BrutalProgress value={50} max={100} variant="default|success|error|warning|info" showLabel />
```

### BrutalTooltip
```jsx
<BrutalTooltip content="Tooltip text" position="top|bottom|left|right">
  <span>Hover me</span>
</BrutalTooltip>
```

### BrutalInput
```jsx
<BrutalInput placeholder="TYPE HERE..." size="sm|md|lg" />
```

### BrutalModal
```jsx
<BrutalModal isOpen={true} onClose={() => {}}>
  <BrutalModal.Header>TITLE</BrutalModal.Header>
  <BrutalModal.Body>Content</BrutalModal.Body>
  <BrutalModal.Footer>Actions</BrutalModal.Footer>
</BrutalModal>
```

## UTILITY CLASSES

### Text
- `.text-brutal-xs` - Uppercase, wide tracking, extra small
- `.text-brutal-sm` - Uppercase, wide tracking, small
- `.text-brutal-lg` - Uppercase, wide tracking, large
- `.text-brutal-xl` - Uppercase, wide tracking, extra large
- `.text-brutal-2xl` - Uppercase, wide tracking, 2x large

### Effects
- `.brutal-hover` - Adds hover translation effect
- `.glitch-text` - Applies glitch gradient to text
- `.brutal-border` - Standard 2px border
- `.brutal-divider` - Horizontal divider line

### Animation
- `.animate-brutal-fade` - Fade in with slight Y movement
- `.animate-glitch` - Glitch text effect
- `.animate-brutal-pulse` - Hard pulse animation

## DESIGN PATTERNS

### 1. HARD EDGES ONLY
- No rounded corners anywhere
- No soft shadows or glows
- No blur effects

### 2. MONOCHROME BASE
- Black and white primary palette
- Accent colors used sparingly
- High contrast required

### 3. BRUTAL INTERACTIONS
- Hard stops in animations
- Immediate visual feedback
- No smooth transitions

### 4. GRID DISCIPLINE
- Strict 8px grid alignment
- No arbitrary spacing
- Consistent component sizing

### 5. TYPOGRAPHY HIERARCHY
- Size and weight for hierarchy
- Uppercase for emphasis
- Monospace consistency

## FORBIDDEN ELEMENTS

1. **border-radius** (any value except 0)
2. **Soft shadows** (blur, spread)
3. **Gradients** (except Sacred Glitch Flare)
4. **Non-monospace fonts**
5. **Smooth animations** (ease-in-out)
6. **Arbitrary spacing** (non-8px multiples)
7. **Low contrast** combinations
8. **Decorative elements**

## IMPLEMENTATION CHECKLIST

- [ ] All border-radius set to 0
- [ ] Using only approved colors
- [ ] IBM Plex Mono font applied
- [ ] 8px grid spacing enforced
- [ ] Hard shadows implemented
- [ ] Linear transitions only
- [ ] ESLint rules active
- [ ] DaisyUI removed
- [ ] All components brutalized

## ENFORCEMENT

ESLint rules automatically prevent:
- Use of border-radius in styles
- Tailwind rounded classes
- DaisyUI class usage

Run `npm run lint` to check compliance.