# LTF1 — TUI Design System v1.0

> **Purpose**: This document is the single source of truth for the visual design, interaction patterns, and implementation standards of the LTF1 terminal user interface.

> **Stack**: Go · Bubble Tea v2 · Lip Gloss v2 · Bubbles v2

> **Design North Star**: OpenCode's visual polish + lazygit's functional clarity.

See the full design system specification in the conversation history. This file marks the commitment to implement it.

Key decisions:
- Background: #0A0A0A (near black base), #111111 (surface), #1A1A1A (elevated)
- Accent: #6366F1 (indigo) for all interactive/selected states
- Semantic: Green (success), Red (error), Amber (agent/AI), Purple (skills), Cyan (sprint)
- Text: #F9FAFB -> #9CA3AF -> #6B7280 -> #444444 (4-level hierarchy)
- Sidebar: 20 chars fixed, grouped nav items, active = indigo left bar
- Content: max 120 chars, centered on wide terminals
- Borders: rounded, used sparingly, left-border accents preferred
- Selection: left bar in indigo + BgHighlight (#222222)
- Min terminal: 80x24, optimal: 120x40
- No emoji, no nerd fonts, unicode symbols only
- Speed: <100ms render, instant page switch
- Keyboard-first, mouse-welcome
