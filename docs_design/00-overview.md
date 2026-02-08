# LTF1 Design Language — Overview

## Identity

LTF1's visual language is **dark brutalist terminal** — a design system that treats the web like a developer's terminal session. Every element communicates: this tool was built by developers, for developers. No polish for polish's sake. No rounded-corner SaaS softness. Every pixel earns its place.

## Design Pillars

### 1. Terminal Authenticity
The interface speaks the developer's native language. Monospace type, ASCII art, command prompts, and diff-style layouts aren't decoration — they're the communication medium. The site feels like `ssh`-ing into a well-configured machine.

### 2. Brutal Clarity
No ambiguity. Hard edges. High contrast. 2px borders. Information hierarchy is enforced through size and brightness, not color gradience or drop shadows. If something is important, it's white on black. If it's secondary, it's gray.

### 3. Engineered Motion
Animation serves function: entrance reveals content hierarchy, hover states confirm interactivity, terminal typing animations reinforce the dev-tool identity. Nothing bounces. Nothing loops forever. Motion is deliberate, short, and directional.

### 4. Dark-First
The entire system assumes a dark environment. There is no light mode. Colors are chosen for legibility against near-black backgrounds. The palette is restrained — one accent (indigo), five semantic colors, three grays.

## Document Index

| File | Contents |
|------|----------|
| [01-colors.md](./01-colors.md) | Full color palette, semantic usage, category accent system |
| [02-typography.md](./02-typography.md) | Font families, size scale, hierarchy rules, spacing |
| [03-style.md](./03-style.md) | Borders, shadows, backgrounds, cards, buttons, forms |
| [04-motion.md](./04-motion.md) | Animation patterns, timing, Framer Motion conventions |
| [05-language.md](./05-language.md) | Voice, tone, copy conventions, ASCII art system |
| [06-layout.md](./06-layout.md) | Grid system, responsive breakpoints, section structure |

## Quick Reference

```
Background:  #050505 → #0A0A0A → #111111
Text:        #F9FAFB → #9CA3AF → #6B7280
Accent:      #6366F1 (indigo)
Borders:     #2E2E35 (2px standard)
Fonts:       Inter (prose), IBM Plex Mono (code/labels)
Corners:     0px on cards, 8px on buttons, 12px on containers
Motion:      0.5s ease, opacity + translateY, once on scroll
```
