# LTF1 Design Language — Motion

## Philosophy

Motion is information. Every animation tells the user something: "this appeared," "this is interactive," "this is loading." If an animation doesn't communicate, it doesn't exist. The system borrows from terminal behavior — content streams in, typing happens character by character, operations complete in sequence.

---

## Core Animation Library

All animations use **Framer Motion** (`framer-motion`). No CSS keyframe animations except for simple utility states (pulse, spin).

---

## Entrance Animations

### Standard Fade-Up (Page Content)
```tsx
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5 }}
```
The default entrance for any content block. 20px upward slide with fade. 500ms duration.

### Delayed Fade-Up (Secondary Content)
```tsx
initial={{ opacity: 0, y: 24 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5, delay: 0.15 }}
```
Slightly deeper slide (24px) with 150ms delay. Used for content that appears after a headline.

### Wider Fade-Up (Hero Elements)
```tsx
initial={{ opacity: 0, y: 24 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.7 }}
```
Longer duration (700ms) for hero-level elements that deserve more visual weight.

### Horizontal Fade (Side Content)
```tsx
initial={{ opacity: 0, x: 20 }}
animate={{ opacity: 1, x: 0 }}
transition={{ duration: 0.5 }}
```
Used sparingly for content entering from the side.

---

## Scroll-Triggered Animations

### Standard Scroll Entrance
```tsx
initial="hidden"
whileInView="visible"
viewport={{ once: true, margin: '-30px' }}
transition={{ duration: 0.5 }}
```
- `once: true` — animation plays only the first time element enters viewport
- `margin: '-30px'` — triggers slightly before element is fully visible
- Never replay animations. Once means once.

### Staggered Children
```tsx
// Parent
variants={{
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } }
}}

// Child
variants={{
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
}}
```
Children animate in sequence with 80ms gaps. Used for lists, grid items, feature cards.

### Common Stagger Values
| Context | Stagger Delay |
|---------|--------------|
| Feature cards | `0.06s` |
| List items | `0.08s` |
| Grid items | `0.08s` |
| Pricing tiers | `0.1s` |

---

## Hover Animations

### Card Hover (Lift + Border)
```tsx
variants={{
  rest: { borderColor: 'rgba(46, 46, 53, 1)', y: 0 },
  hover: { borderColor: 'rgba(249, 250, 251, 0.2)', y: -2 }
}}
transition={{ duration: 0.25 }}
```
Cards lift 2px and their border brightens. This is the standard interactive feedback.

### Highlighted Card Hover (Accent Border)
```tsx
variants={{
  rest: { borderColor: 'rgba(99, 102, 241, 0.6)', y: 0 },
  hover: { borderColor: 'rgba(99, 102, 241, 1)', y: -2 }
}}
```
Same lift, but border transitions from muted accent to full accent.

### Arrow Slide (CTAs and Links)
```tsx
variants={{
  rest: { x: 0, opacity: 0.5 },
  hover: { x: 4, opacity: 1 }
}}
```
Arrow icon slides 4px right and becomes fully opaque. Signals "this goes somewhere."

### Button Hover (Lift + Shadow Reduce)
```css
hover: translateY(-2px);
hover: box-shadow: 3px 3px 0px rgba(0,0,0,0.4);
```
Primary buttons lift and their shadow compresses. Creates a "pressing into" tactile feel.

---

## Terminal Animations

### Character Typing
```tsx
// Speed: 28-45ms per character
const TYPING_SPEED = 35  // ms per character
```
Text appears one character at a time. Used in hero terminal, problem section, and feature demonstrations.

### Line Streaming
```tsx
// Speed: 110-120ms per line
setTimeout(() => {
  setVisibleLog(prev => [...prev, line])
}, 400 + i * 120)
```
Lines appear sequentially with delays. Simulates terminal output streaming.

### Line Pause
```
350-700ms between command groups
```
Longer pauses between logical groups of output. Simulates processing time.

### Terminal Cursor
```tsx
animate={{ opacity: [1, 0] }}
transition={{ duration: 0.8, repeat: Infinity }}
```
Blinking block cursor. Standard terminal aesthetic.

---

## Scroll-Based Animations

### Hero Scroll Indicator
```tsx
animate={{ y: [0, 6, 0] }}
transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
```
Gentle bouncing arrow that signals "scroll down." Infinite loop — one of the only repeating animations.

### Sticky Section Progress
Scroll position drives which step is "active" in multi-step sections. No spring physics, just threshold-based state changes tied to scroll offset.

---

## Page Transitions

### Content Swap (AnimatePresence)
```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={activeKey}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.25 }}
  />
</AnimatePresence>
```
Used for toggle states (e.g., "Without LTF1" / "With LTF1"). Old content exits upward, new content enters from below. Fast (250ms).

---

## Canvas Animations

### Particle Field (Footer)
- ASCII characters drift left across a canvas
- Speed: `0.3-1.2px` per frame
- X-Wing flyby every 30-40 seconds
- Edge fade at 15% of canvas width
- `requestAnimationFrame` loop
- Respects `prefers-reduced-motion`

### Reduced Motion
```tsx
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
if (reducedMotion) {
  // Skip particle movement, show static state
}
```
All canvas animations check for reduced motion preference.

---

## Timing Constants

| Token | Value | Usage |
|-------|-------|-------|
| `duration-fast` | 150ms | Micro interactions (color changes) |
| `duration-normal` | 200ms | Standard transitions (hover states) |
| `duration-entrance` | 500ms | Element entrance animations |
| `duration-hero` | 700ms | Hero-level entrances |
| `duration-typing` | 28-45ms/char | Terminal typing speed |
| `duration-line` | 110-120ms/line | Terminal line streaming |
| `duration-stagger` | 60-100ms | Gap between staggered children |
| `duration-pause` | 350-700ms | Terminal command group pauses |

---

## Motion Rules

1. **Once means once** — `viewport={{ once: true }}` on all scroll-triggered animations
2. **Direction matches intent** — content enters from below (y: 20), exits upward (y: -8)
3. **No springs on content** — spring physics are reserved for micro-interactions only
4. **No infinite loops** — except the scroll indicator and cursor blink
5. **Respect reduced motion** — all canvas animations check the media query
6. **Stagger, don't simultaneous** — grouped elements enter in sequence, not all at once
7. **Terminal typing is sacred** — character-by-character animation only in terminal contexts
8. **Hover feedback is subtle** — 2px lift maximum, 250ms maximum duration
9. **Exit before enter** — `AnimatePresence mode="wait"` ensures clean content swaps
10. **No decoration motion** — if removing the animation loses no information, remove it
