# LTF1 Investor Pitch Deck — Gemini 2.5 Prompt

Build a full-screen, presentation-style investor pitch deck web app with 12 slides, optimized for live presentation and verbal narration. Use React and Tailwind CSS. Install lucide-react for icons. This is a seed-stage investor pitch for a developer tools company — every slide must be clear, data-driven, and scannable in under 10 seconds. Follow Y Combinator pitch deck structure: one idea per slide, large readable text, no filler.

---

## Global Design System

**Fonts**: IBM Plex Mono (import from Google Fonts: `@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&display=swap')`) for labels, stats, code, and terminal text. Inter (`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap')`) for headlines and body text.

**Theme**: Dark brutalist terminal aesthetic. Near-black backgrounds, white text. This is a developer tool built by engineers — the deck should feel technical, precise, and confident. No rounded corners on cards. No blur effects. No gradients on elements. No drop shadows with blur.

**Color Palette**:
- Backgrounds: `#050505` (base), `#0A0A0A` (surface/terminal blocks), `#111111` (cards)
- Text: `#F9FAFB` (primary headlines), `#D1D5DB` (body text), `#9CA3AF` (secondary), `#6B7280` (tertiary/labels)
- Accent: `#6366F1` (indigo primary), `#4F46E5` (indigo hover)
- Borders: `#2E2E35` (2px standard card borders), `#1F1F23` (1px subtle dividers)
- Semantic Colors: Green `#22C55E` (success/git/positive), Red `#EF4444` (error/negative/pain), Amber `#F59E0B` (AI/warning), Purple `#8B5CF6` (analytics/market), Cyan `#06B6D4` (planning/info), Pink `#EC4899` (collaboration)

**Typography Rules**: All font sizes use responsive `clamp()` values. All spacing uses percentage-based values for full responsiveness across screen sizes. Line heights: 1.05 for headlines, 1.5 for body text, 1.8 for terminal/code blocks.

**Card Style**: `background: #111111`, `border: 2px solid #2E2E35`, `border-radius: 0px`. No blur, no glassmorphism. Hover state: `border-color: #6366F1`, `box-shadow: 4px 4px 0px #000000`. Padding: `clamp(20px, 2.5vw, 48px)`.

**Terminal Blocks**: `background: #0A0A0A`, `border: 2px solid #2E2E35`, `border-radius: 0px`, `padding: clamp(16px, 2vw, 32px)`. Text in IBM Plex Mono. Prompt lines start with `$` in `#22C55E`. Output lines start with `>` in `#9CA3AF`.

**Slide Backgrounds**: Each slide uses `#050505` as base. Add one subtle radial gradient per slide using a low-opacity accent color for depth (e.g. `radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.05), transparent 70%)`). No video backgrounds. No images.

**Stat Blocks**: Large numbers in IBM Plex Mono, font-weight 700. Labels below in IBM Plex Mono, `#9CA3AF`, smaller size. Stats are the most important visual element — they should be the first thing the eye hits on any slide that has them.

---

## Presentation Framework (Presentation.tsx)

Accepts an array of slide React elements and renders them full-screen (100vw x 100vh). Overflow hidden on each slide.

**Keyboard navigation**: ArrowRight / ArrowDown / Spacebar = next slide. ArrowLeft / ArrowUp = previous slide. F = toggle fullscreen. Escape = exit fullscreen.

**Slide transitions**: 500ms ease-in-out opacity crossfade + subtle scale transform (0.97 for exiting slides, 1.03 for entering slides, 1.0 for current). Use CSS transitions, not JS animation libraries.

**Auto-hiding controls**: Appear on mouse move. Disappear after 3 seconds of inactivity. 300ms fade transition.

**Bottom navigation bar** (fixed, bottom 0, full width, `px-[3%]`, `py-[1.5%]`, `z-50`):
- Left: Slide counter "01 / 12" in IBM Plex Mono, `clamp(11px, 0.85vw, 15px)`, `#6B7280`, `font-variant-numeric: tabular-nums`
- Center: Progress dots — 12 dots, each 6px circle. Active dot expands to 24px wide pill with `#6366F1` background. Inactive dots are `rgba(255,255,255,0.25)`. 300ms transition on width and color.
- Right: ChevronLeft and ChevronRight buttons (lucide-react, 18px, `#6B7280`, hover `#F9FAFB`) + 1px `#2E2E35` vertical divider + Maximize2 fullscreen toggle button. All buttons: `padding: 6px`, `border-radius: 4px`, hover `background: rgba(255,255,255,0.08)`.

**Top-right hint** (fixed): "< > Navigate . F Fullscreen" in IBM Plex Mono, `clamp(9px, 0.7vw, 12px)`, `rgba(255,255,255,0.35)`. Fades with controls.

**Consistent slide header** (reusable component, `px-[5.2%]`, `pt-[3%]`): Every slide except Slide 1 (Cover) and Slide 12 (Closing) has a header bar with: "LTF1" left-aligned in IBM Plex Mono, `clamp(12px, 1vw, 18px)`, font-weight 700, `#F9FAFB`. Slide number right-aligned as "01", "02", etc. in IBM Plex Mono, `clamp(10px, 0.85vw, 15px)`, `#6B7280`.

---

## Slide 1 — Cover (CoverSlide.tsx)

**Purpose**: First impression. Company name, one-liner, and positioning. Investor should understand what LTF1 does within 5 seconds.

**Background**: `#050505` + `radial-gradient(ellipse at 70% 80%, rgba(99,102,241,0.07), transparent 60%)`

**Layout**: Vertically centered content, horizontally centered, nudged up 4%.

**Top bar** (`px-[5.2%]`, `pt-[3%]`, flex, justify-between, align-center):
- Left: "LTF1" in IBM Plex Mono, `clamp(22px, 2.2vw, 40px)`, font-weight 700, `#F9FAFB`, with a `3px solid #6366F1` left-border accent (8px left-padding from the border)
- Right: "SEED ROUND 2026" in IBM Plex Mono, `clamp(10px, 0.85vw, 15px)`, `#6B7280`, letter-spacing `0.15em`, uppercase

**Center content** (text-center, max-width 70%, margin auto):
- Terminal line: `> ltf1 init --pitch` in IBM Plex Mono, `clamp(13px, 1.1vw, 22px)`, `#22C55E`, `mb-[2.5%]`
- Headline: "Your repo is the source of truth." in Inter, `clamp(36px, 5.5vw, 104px)`, font-weight 700, `#F9FAFB`, tracking `-0.025em`, line-height `1.05`
- One-liner (`mt-[2%]`): "Git-native project management. Push code, tasks update themselves." in Inter, `clamp(16px, 1.4vw, 30px)`, `#9CA3AF`, line-height `1.4`
- Badge row (`mt-[3.5%]`, flex, gap `clamp(10px, 1.2vw, 20px)`, justify-center):
  - "Open Source" — `#111111` bg, `1px solid #22C55E`, `#22C55E` text
  - "Developer-First" — `#111111` bg, `1px solid #6366F1`, `#6366F1` text
  - "Self-Hostable" — `#111111` bg, `1px solid #06B6D4`, `#06B6D4` text
  - All badges: IBM Plex Mono, `clamp(10px, 0.8vw, 14px)`, `px-[clamp(10px,1vw,18px)] py-[clamp(4px,0.3vw,8px)]`, `border-radius: 0px`

**Footer** (absolute, bottom `3%`, width 100%, text-center): "Vivid Verse Global . 2026" in IBM Plex Mono, `clamp(10px, 0.8vw, 14px)`, `#6B7280`

---

## Slide 2 — Problem (ProblemSlide.tsx)

**Purpose**: Make the pain visceral. Show the exact workflow developers endure today after every commit. Use the P.A.I.N. framework: Problem, Audience, Impact, Non-obvious insight.

**Background**: `#050505` + `radial-gradient(ellipse at 15% 30%, rgba(239,68,68,0.05), transparent 60%)`

**Title area** (`mt-[7%]`, `px-[5.2%]`):
- Eyebrow: "THE PROBLEM" in IBM Plex Mono, `clamp(10px, 0.8vw, 14px)`, `#EF4444`, letter-spacing `0.15em`, uppercase
- Title: "Developers lose 10 minutes of context every single commit." in Inter, `clamp(26px, 3.2vw, 60px)`, font-weight 700, `#F9FAFB`, tracking `-0.02em`, `mt-[0.8%]`

**Two-column layout** (`mt-[3%]`, `px-[5.2%]`, flex, `gap-[3%]`):

**Column 1 — "TODAY'S WORKFLOW"** (flex `0 0 47%`):
- Section label: "AFTER EVERY COMMIT" in IBM Plex Mono, `clamp(10px, 0.75vw, 13px)`, `#EF4444`, letter-spacing `0.1em`, with `2px solid #EF4444` bottom border, `pb-[6px]`
- Terminal block (`mt-[2%]`):
  ```
  $ git commit -m "feat: add auth flow"
  $ git push origin main
  > open browser
  > navigate to jira
  > find the right ticket
  > update status to "in review"
  > paste PR link in comment
  > re-estimate remaining hours
  > update the sprint board
  > post update in slack
  ```
  All lines in IBM Plex Mono, `clamp(11px, 0.85vw, 15px)`, `#9CA3AF`, line-height `1.8`. The `$` prompt lines in `#6B7280`. The `>` output lines in `#9CA3AF`.
- Pain line at bottom of terminal block: `> ~10 min of context switching. every time.` in `#EF4444`, font-weight 500

**Column 2 — "THE DATA"** (flex `0 0 47%`):
- Three stat blocks stacked vertically with `gap-[clamp(20px,2.5vw,40px)]`, `mt-[2%]`:

  **Stat 1**: "23 min 15 sec" in IBM Plex Mono, `clamp(28px, 3vw, 52px)`, font-weight 700, `#EF4444`. Label below: "to regain deep focus after a single interruption" in Inter, `clamp(12px, 1vw, 18px)`, `#9CA3AF`. Source: "University of California, Irvine" in IBM Plex Mono, `clamp(9px, 0.7vw, 12px)`, `#6B7280`, `mt-[4px]`

  **Stat 2**: "1,200" in IBM Plex Mono, `clamp(28px, 3vw, 52px)`, font-weight 700, `#F59E0B`. Label: "app toggles per day for knowledge workers" in Inter, `clamp(12px, 1vw, 18px)`, `#9CA3AF`. Source: "Harvard Business Review"

  **Stat 3**: "#3" in IBM Plex Mono, `clamp(28px, 3vw, 52px)`, font-weight 700, `#8B5CF6`. Label: "productivity killer for developers: context switching between tools" in Inter, `clamp(12px, 1vw, 18px)`, `#9CA3AF`. Source: "Atlassian Developer Survey, 2025"

---

## Slide 3 — Solution (SolutionSlide.tsx)

**Purpose**: Show how LTF1 eliminates the problem. Direct before/after comparison in terminal format.

**Background**: `#050505` + `radial-gradient(ellipse at 80% 40%, rgba(34,197,94,0.05), transparent 60%)`

**Title area** (`mt-[7%]`, `px-[5.2%]`):
- Eyebrow: "THE SOLUTION" in IBM Plex Mono, `clamp(10px, 0.8vw, 14px)`, `#22C55E`, letter-spacing `0.15em`, uppercase
- Title: "Your git workflow becomes your project management." in Inter, `clamp(26px, 3.2vw, 60px)`, font-weight 700, `#F9FAFB`, tracking `-0.02em`, `mt-[0.8%]`

**Full-width terminal block** (`mt-[3.5%]`, `mx-[5.2%]`, `#0A0A0A` bg, `2px solid #22C55E` border, padding `clamp(24px, 3vw, 48px)`):
```
$ git commit -m "feat: add auth flow"
$ git push origin main

[ltf1] task TK-142 status: todo → in_review
[ltf1] PR #87 linked to TK-142
[ltf1] story points estimated from diff: 3 pts (confidence: 94%)
[ltf1] sprint board updated
[ltf1] velocity recalculated: shipping 23% faster than last sprint
[ltf1] #dev-updates notified via slack

> 7 operations. 0 manual effort. 0 context switches.
```
Lines in IBM Plex Mono, `clamp(12px, 1vw, 18px)`, line-height `1.9`. `$` lines in `#6B7280`. `[ltf1]` prefix in `#22C55E`, rest of those lines in `#D1D5DB`. Final `>` line in `#22C55E`, font-weight 700, `clamp(14px, 1.2vw, 22px)`.

**Three stat pills below terminal** (`mt-[3%]`, `mx-[5.2%]`, flex, `gap-[2%]`):
Each pill: `#111111` bg, `2px solid #2E2E35` border, `padding: clamp(16px,1.5vw,28px) clamp(24px,2vw,40px)`, flex-1, text-center.

- Pill 1: "10 min" in `clamp(24px, 2.5vw, 44px)`, `#22C55E`, IBM Plex Mono, 700. Below: "saved per commit" in `clamp(11px, 0.85vw, 15px)`, `#9CA3AF`
- Pill 2: "0" in same style, `#22C55E`. Below: "manual ticket updates"
- Pill 3: "94%" in same style, `#F59E0B`. Below: "AI estimation accuracy"

---

## Slide 4 — Product (ProductSlide.tsx)

**Purpose**: Show key capabilities. Five feature cards — the core of what LTF1 does.

**Background**: `#050505` + `radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.04), transparent 65%)`

**Title area** (centered, `mt-[5.5%]`):
- Eyebrow: "THE PRODUCT" in IBM Plex Mono, `clamp(10px, 0.8vw, 14px)`, `#6366F1`, letter-spacing `0.15em`, uppercase
- Title: "Built for how developers actually work" in Inter, `clamp(26px, 3.2vw, 56px)`, font-weight 700, `#F9FAFB`, `mt-[0.8%]`

**Card grid** (`mt-[3%]`, `px-[5.2%]`):
- Row 1: 3 equal-width cards, gap `clamp(10px, 1.2vw, 24px)`
- Row 2: 2 equal-width cards centered (with same total width as row 1), gap `clamp(10px, 1.2vw, 24px)`

Each card uses the standard card style. Content inside card: icon at top, title below, short description below title. Vertical padding `clamp(20px, 2.5vw, 44px)`, horizontal padding `clamp(16px, 2vw, 36px)`.

**Card 1**: `GitBranch` icon (lucide-react, `clamp(28px, 2.5vw, 44px)`, `#22C55E` stroke, strokeWidth 2). Title: "PR-Driven Updates" in Inter, `clamp(16px, 1.3vw, 28px)`, font-weight 600, `#F9FAFB`, `mt-[clamp(12px,1vw,20px)]`. Description: "Every git event moves the board. Branch, commit, review, merge — zero manual updates." in Inter, `clamp(12px, 0.95vw, 17px)`, `#9CA3AF`, `mt-[clamp(6px,0.5vw,12px)]`, line-height `1.5`.

**Card 2**: `Brain` icon, `#F59E0B`. Title: "AI Code Estimates". Description: "Story points estimated from your actual diff. No more two-hour planning poker sessions."

**Card 3**: `BarChart3` icon, `#8B5CF6`. Title: "Git-Based Velocity". Description: "Velocity from commits, PRs, and deploys. Real shipping data, not story point guesses."

**Card 4**: `Terminal` icon, `#06B6D4`. Title: "Full CLI + TUI". Description: "Manage tasks, sprints, and boards from your terminal. Never leave your editor."

**Card 5**: `Users` icon, `#EC4899`. Title: "Real-Time Collaboration". Description: "Built-in chat, video rooms, whiteboard, and a unified communications hub."

---

## Slide 5 — How It Works (HowItWorksSlide.tsx)

**Purpose**: Show the four-step workflow in a clean visual sequence. This is the "aha moment" slide.

**Background**: `#050505` + `radial-gradient(ellipse at 30% 70%, rgba(6,182,212,0.04), transparent 60%)`

**Title area** (centered, `mt-[6%]`):
- Eyebrow: "HOW IT WORKS" in IBM Plex Mono, `clamp(10px, 0.8vw, 14px)`, `#06B6D4`, letter-spacing `0.15em`, uppercase
- Title: "Four steps. Zero manual effort." in Inter, `clamp(26px, 3.2vw, 56px)`, font-weight 700, `#F9FAFB`, `mt-[0.8%]`

**Four-step horizontal layout** (`mt-[5%]`, `px-[5.2%]`, flex, `gap-[2%]`, align-start):

Each step is a vertical column (flex `0 0 22%`) with:
- Step number: "01", "02", "03", "04" in IBM Plex Mono, `clamp(36px, 3.5vw, 64px)`, font-weight 700, color varies per step. Opacity `0.3`.
- Colored top border: `3px solid [step-color]`, width `40px`, `mt-[clamp(8px,0.8vw,16px)]`
- Step title in Inter, `clamp(16px, 1.3vw, 26px)`, font-weight 600, `#F9FAFB`, `mt-[clamp(12px,1vw,20px)]`
- Step description in Inter, `clamp(12px, 0.95vw, 17px)`, `#9CA3AF`, line-height `1.5`, `mt-[clamp(6px,0.5vw,12px)]`
- Connecting arrow between steps: `ChevronRight` icon (lucide-react, `#2E2E35`, `clamp(20px,1.5vw,32px)`) positioned between columns at vertical center of the step number. Do not show arrow after the last step.

**Step 1** (color `#22C55E`): Title: "Push Code". Description: "Commit and push to your repository. GitHub, GitLab, or Bitbucket."

**Step 2** (color `#6366F1`): Title: "Auto-Update". Description: "LTF1 detects the event and updates task status, links PRs, and adjusts the sprint board."

**Step 3** (color `#F59E0B`): Title: "AI Estimates". Description: "Our AI analyzes the diff and estimates story points with 94% accuracy."

**Step 4** (color `#8B5CF6`): Title: "Ship & Measure". Description: "Velocity calculated from actual shipping data. See what your team really delivers."

---

## Slide 6 — Market Opportunity (MarketSlide.tsx)

**Purpose**: Prove the market is massive with real, sourced numbers. Bottom-up TAM calculation.

**Background**: `#050505` + `radial-gradient(ellipse at 75% 25%, rgba(139,92,246,0.05), transparent 60%)`

**Title area** (`mt-[7%]`, `px-[5.2%]`):
- Eyebrow: "MARKET OPPORTUNITY" in IBM Plex Mono, `clamp(10px, 0.8vw, 14px)`, `#8B5CF6`, letter-spacing `0.15em`, uppercase
- Title: "A $23B market that developers hate." in Inter, `clamp(26px, 3.2vw, 60px)`, font-weight 700, `#F9FAFB`, tracking `-0.02em`, `mt-[0.8%]`

**Three-column stat layout** (`mt-[4%]`, `px-[5.2%]`, flex, `gap-[3%]`):

**Column 1 — TAM** (flex `0 0 30%`):
- Label: "TAM" in IBM Plex Mono, `clamp(10px, 0.75vw, 13px)`, `#8B5CF6`, letter-spacing `0.1em`, `2px solid #8B5CF6` bottom border, `pb-[6px]`
- Stat (`mt-[clamp(16px,1.5vw,28px)]`): "$23.1B" in IBM Plex Mono, `clamp(36px, 4vw, 72px)`, font-weight 700, `#F9FAFB`
- Label: "Project management software market by 2031" in Inter, `clamp(12px, 1vw, 18px)`, `#9CA3AF`, `mt-[6px]`
- Source: "Mordor Intelligence, 2025" in IBM Plex Mono, `clamp(9px, 0.7vw, 12px)`, `#6B7280`, `mt-[4px]`
- Growth badge (`mt-[clamp(12px,1.2vw,24px)]`): "15.4% CAGR" in `#111111` bg, `1px solid #8B5CF6`, `#8B5CF6` text, IBM Plex Mono, `clamp(10px, 0.8vw, 14px)`, inline-block padding

**Column 2 — DEVELOPERS** (flex `0 0 30%`):
- Label: "DEVELOPERS" in IBM Plex Mono, `#22C55E`, `2px solid #22C55E` bottom border
- Stat: "47.2M" in IBM Plex Mono, `clamp(36px, 4vw, 72px)`, font-weight 700, `#F9FAFB`
- Label: "developers worldwide, growing to 45M professional by 2030"
- Source: "SlashData, 2025"
- Sub-stat (`mt-[clamp(16px,1.5vw,28px)]`): "36.5M" in IBM Plex Mono, `clamp(24px, 2.5vw, 44px)`, `#22C55E`. Label: "professional developers (70% growth since 2022)"

**Column 3 — PAIN** (flex `0 0 30%`):
- Label: "THE PAIN" in IBM Plex Mono, `#EF4444`, `2px solid #EF4444` bottom border
- Stat: "86%" in IBM Plex Mono, `clamp(36px, 4vw, 72px)`, font-weight 700, `#EF4444`
- Label: "of bug-tracking market locked into Jira" in Inter, `clamp(12px, 1vw, 18px)`, `#9CA3AF`
- Source: "6sense, 2023"
- Sub-stat (`mt-[clamp(16px,1.5vw,28px)]`): "2.3 hrs" in IBM Plex Mono, `clamp(24px, 2.5vw, 44px)`, `#F59E0B`. Label: "of productive deep work per 8-hour day (the rest is fragmented)" Source: "Developer productivity study, 50 developers tracked"

---

## Slide 7 — Competition (CompetitionSlide.tsx)

**Purpose**: Show competitive landscape and where LTF1 wins. Use a positioning matrix.

**Background**: `#050505` + `radial-gradient(ellipse at 50% 80%, rgba(99,102,241,0.04), transparent 60%)`

**Title area** (`mt-[7%]`, `px-[5.2%]`):
- Eyebrow: "COMPETITIVE LANDSCAPE" in IBM Plex Mono, `clamp(10px, 0.8vw, 14px)`, `#6366F1`, letter-spacing `0.15em`, uppercase
- Title: "The market is ready for disruption." in Inter, `clamp(26px, 3.2vw, 56px)`, font-weight 700, `#F9FAFB`, `mt-[0.8%]`

**Comparison table** (`mt-[3.5%]`, `mx-[5.2%]`):

A grid/table with 6 columns and 6 rows. Header row + 5 competitor rows.

Table styling: `#0A0A0A` background, `2px solid #2E2E35` outer border. Header row: `#111111` background, `border-bottom: 2px solid #2E2E35`. All cell text in IBM Plex Mono. Cell padding `clamp(10px, 1vw, 20px) clamp(12px, 1.2vw, 24px)`. Row dividers: `1px solid #1F1F23`.

**Header row** (`clamp(10px, 0.8vw, 14px)`, `#6B7280`, uppercase, letter-spacing `0.08em`): | (empty) | Git-Native | AI Estimates | Open Source | CLI/TUI | Self-Hostable |

**Row 1 — LTF1** (this row has `border-left: 3px solid #6366F1` accent and slightly brighter bg `#111111`):
"LTF1" in `#6366F1`, font-weight 700. All five feature columns show a `Check` icon (lucide-react, 16px, `#22C55E`).

**Row 2 — Jira**: "Jira" in `#9CA3AF`. Columns: `X` icon (`#EF4444`) for Git-Native, `X` for AI Estimates, `X` for Open Source, `X` for CLI/TUI, `X` for Self-Hostable. Side note text on far right: "$4.4B revenue" in `clamp(9px, 0.7vw, 12px)`, `#6B7280`.

**Row 3 — Linear**: "Linear" in `#9CA3AF`. Columns: `X` Git-Native, `X` AI Estimates, `X` Open Source, `X` CLI/TUI, `X` Self-Hostable. Side note: "$1.25B valuation".

**Row 4 — GitHub Issues**: "GitHub Issues" in `#9CA3AF`. Columns: `Check` (`#22C55E`) Git-Native, `X` AI Estimates, `Check` Open Source, `Check` CLI/TUI, `X` Self-Hostable.

**Row 5 — Plane**: "Plane" in `#9CA3AF`. Columns: `X` Git-Native, `X` AI Estimates, `Check` Open Source, `X` CLI/TUI, `Check` Self-Hostable.

Use lucide-react `Check` and `X` icons for the cells.

**Insight line** below table (`mt-[2.5%]`, `px-[5.2%]`): "No one combines git-native automation, AI estimation, and open source. That's the gap." in Inter, `clamp(14px, 1.2vw, 22px)`, `#D1D5DB`, font-weight 500. The word "gap" is colored `#6366F1`.

---

## Slide 8 — Business Model (BusinessModelSlide.tsx)

**Purpose**: Explain how LTF1 makes money. Three-tier open-core model. Simple and clear.

**Background**: `#050505` + `radial-gradient(ellipse at 25% 60%, rgba(245,158,11,0.04), transparent 60%)`

**Title area** (`mt-[7%]`, `px-[5.2%]`):
- Eyebrow: "BUSINESS MODEL" in IBM Plex Mono, `clamp(10px, 0.8vw, 14px)`, `#F59E0B`, letter-spacing `0.15em`, uppercase
- Title: "Open core. Land with free, expand with Pro." in Inter, `clamp(26px, 3.2vw, 56px)`, font-weight 700, `#F9FAFB`, `mt-[0.8%]`

**Three pricing cards** (`mt-[4%]`, `px-[5.2%]`, flex, `gap-[2%]`, align-stretch):

Each card: flex `0 0 31%`. Standard card style. Content vertically arranged with padding `clamp(24px, 2.5vw, 44px)`.

**Card 1 — Open Source**:
- Tier name: "Open Source" in IBM Plex Mono, `clamp(14px, 1.2vw, 22px)`, `#22C55E`, font-weight 700
- Price: "$0" in IBM Plex Mono, `clamp(36px, 4vw, 64px)`, `#F9FAFB`, font-weight 700, `mt-[clamp(8px,0.8vw,16px)]`
- Price label: "free forever" in IBM Plex Mono, `clamp(12px, 0.9vw, 16px)`, `#9CA3AF`
- Divider: `1px solid #1F1F23`, `my-[clamp(12px,1.2vw,24px)]`
- Feature list (vertical stack, gap `clamp(8px,0.7vw,14px)`). Each item: `Check` icon (lucide-react, 14px, `#22C55E`) + text in Inter, `clamp(12px, 0.9vw, 16px)`, `#D1D5DB`. Items:
  - "Unlimited projects"
  - "Up to 5 team members"
  - "Full git integration"
  - "Sprint management"
  - "100 AI credits/month"
  - "CLI + TUI access"
- Bottom label: "COMMUNITY SUPPORT" in IBM Plex Mono, `clamp(9px, 0.7vw, 12px)`, `#6B7280`, `mt-auto`

**Card 2 — Pro** (this card has `border-color: #6366F1` instead of `#2E2E35`):
- Badge at top of card: "COMING SOON" in `#111111` bg... actually use: `background: #6366F1`, `color: #F9FAFB`, IBM Plex Mono, `clamp(9px, 0.65vw, 11px)`, `padding: 2px 8px`, `border-radius: 0px`, positioned at top-right corner of card with `margin: clamp(12px,1vw,20px)`
- Tier name: "Pro" in `#6366F1`
- Price: "$12" in same style as card 1
- Price label: "per user / month"
- Feature list (same style, uses `Check` icons in `#6366F1`):
  - "Everything in Open Source"
  - "Unlimited team members"
  - "Unlimited AI credits"
  - "Advanced analytics"
  - "SSO / SAML"
  - "Audit logs"
  - "48-hour priority support"

**Card 3 — Enterprise**:
- Tier name: "Enterprise" in `#8B5CF6`
- Price: "Custom"
- Price label: "contact us"
- Feature list (`Check` icons in `#8B5CF6`):
  - "Everything in Pro"
  - "On-premise deployment"
  - "Dedicated support"
  - "Custom SLA (4h)"
  - "SCIM provisioning"
  - "Data warehouse sync"
  - "Invoice billing"

**Bottom insight** (`mt-[2.5%]`, `px-[5.2%]`): "Open source builds trust and community. Pro captures value at scale. Enterprise captures security-sensitive orgs." in Inter, `clamp(13px, 1vw, 19px)`, `#9CA3AF`, max-width `70%`

---

## Slide 9 — Traction (TractionSlide.tsx)

**Purpose**: Show what's been built and what's live. Early-stage traction = product completeness and integrations.

**Background**: `#050505` + `radial-gradient(ellipse at 60% 40%, rgba(6,182,212,0.04), transparent 60%)`

**Title area** (`mt-[7%]`, `px-[5.2%]`):
- Eyebrow: "TRACTION" in IBM Plex Mono, `clamp(10px, 0.8vw, 14px)`, `#06B6D4`, letter-spacing `0.15em`, uppercase
- Title: "Shipping fast. Building in public." in Inter, `clamp(26px, 3.2vw, 56px)`, font-weight 700, `#F9FAFB`, `mt-[0.8%]`

**Two-column layout** (`mt-[3.5%]`, `px-[5.2%]`, flex, `gap-[4%]`):

**Column 1 — "WHAT'S LIVE"** (flex `0 0 46%`):
- Label: "SHIPPED" in IBM Plex Mono, `clamp(10px, 0.75vw, 13px)`, `#22C55E`, `2px solid #22C55E` bottom border, `pb-[6px]`
- Terminal block (`mt-[2%]`) showing a YAML-like status:
  ```
  version: v0.1.0-beta
  platforms:
    web_app: live
    cli:     live (npm: @vvg-ltf1/cli)

  integrations:
    github:     live (webhooks + oauth)
    gitlab:     live (oauth + MRs)
    slack:      live (notifications)
    jira:       sync (bidirectional)

  ai_providers:
    primary:    gemini 2.5 flash
    byok:       openai, anthropic

  features:
    sprints:       live
    kanban:        live
    whiteboard:    live
    video_rooms:   live
    real_time_chat: live
    custom_fields: live
  ```
  All keys in `#6B7280`, values in `#D1D5DB`. "live" values in `#22C55E`. "sync" in `#F59E0B`. IBM Plex Mono, `clamp(11px, 0.85vw, 15px)`, line-height `1.8`.

**Column 2 — "KEY MILESTONES"** (flex `0 0 46%`):
- Label: "MILESTONES" in IBM Plex Mono, `#6366F1`, `2px solid #6366F1` bottom border
- Vertical timeline (`mt-[2%]`). Each milestone is a row with:
  - Left: vertical line segment (`2px solid #2E2E35`) with a `6px` circle dot at the top of each item (`#6366F1` fill)
  - Right: milestone text

  Milestones (gap `clamp(16px, 1.5vw, 28px)` between items):
  1. Dot in `#22C55E`. "Full web platform shipped" — Inter, `clamp(14px, 1.1vw, 20px)`, `#F9FAFB`, font-weight 500. Sub-text: "23 pages, real-time backend, dark brutalist UI" in `clamp(12px, 0.9vw, 16px)`, `#9CA3AF`
  2. Dot in `#22C55E`. "CLI + TUI published to npm" — Sub-text: "@vvg-ltf1/cli v0.1.0-beta.3"
  3. Dot in `#22C55E`. "GitHub App integration live" — Sub-text: "Webhooks, OAuth, bidirectional issue sync"
  4. Dot in `#22C55E`. "Multi-provider AI system" — Sub-text: "Gemini, OpenAI, Anthropic with BYOK support"
  5. Dot in `#6366F1`. "Community + waitlist growing" — Sub-text: "Discord community, open source contributors"
  6. Dot in `#F59E0B` (upcoming). "Pro tier launch" — Sub-text: "Targeting Q3 2026". This item has `opacity: 0.6` to indicate future.

---

## Slide 10 — Go-to-Market (GTMSlide.tsx)

**Purpose**: Show the growth strategy. How does LTF1 acquire users and convert to paid?

**Background**: `#050505` + `radial-gradient(ellipse at 40% 30%, rgba(236,72,153,0.04), transparent 60%)`

**Title area** (`mt-[7%]`, `px-[5.2%]`):
- Eyebrow: "GO-TO-MARKET" in IBM Plex Mono, `clamp(10px, 0.8vw, 14px)`, `#EC4899`, letter-spacing `0.15em`, uppercase
- Title: "Open source is the top of the funnel." in Inter, `clamp(26px, 3.2vw, 56px)`, font-weight 700, `#F9FAFB`, `mt-[0.8%]`

**Funnel visualization** (`mt-[4%]`, `px-[5.2%]`):

Three horizontal bars stacked vertically, each narrower than the last (like a funnel laying on its side, or just three rows with decreasing width). Gap `clamp(12px, 1.2vw, 24px)`.

**Bar 1 — Awareness** (width 100%): `#111111` bg, `2px solid #22C55E` left border (4px wide), padding `clamp(16px, 1.5vw, 32px)`. Left side: "OPEN SOURCE" in IBM Plex Mono, `clamp(12px, 1vw, 18px)`, `#22C55E`, font-weight 700. Right side: description "GitHub repo, npm CLI, community contributions, developer blog, Discord" in Inter, `clamp(12px, 0.95vw, 17px)`, `#9CA3AF`. Far right: "Free" in IBM Plex Mono, `#6B7280`.

**Bar 2 — Activation** (width 85%, `ml-[5%]`): `#111111` bg, `2px solid #6366F1` left border. Left: "PRO CONVERSION" in `#6366F1`. Right: "Team hits 5-member limit, needs advanced analytics, SSO, or audit logs". Far right: "$12/user/mo".

**Bar 3 — Expansion** (width 65%, `ml-[12%]`): `#111111` bg, `2px solid #8B5CF6` left border. Left: "ENTERPRISE" in `#8B5CF6`. Right: "On-premise, dedicated support, custom SLA, SCIM, compliance". Far right: "Custom".

**Growth channels below** (`mt-[4%]`, `px-[5.2%]`, flex, `gap-[2%]`):

Four small cards (flex `0 0 23%`), each: `#0A0A0A` bg, `1px solid #1F1F23` border, padding `clamp(12px, 1.2vw, 24px)`.

- Card 1: `Github` icon (lucide-react, `#D1D5DB`, `clamp(20px,1.5vw,28px)`). Title: "Open Source" (`clamp(13px, 1vw, 18px)`, `#F9FAFB`, font-weight 500, `mt-[8px]`). Description: "GitHub stars, forks, and contributors drive organic awareness" (`clamp(11px, 0.8vw, 14px)`, `#9CA3AF`, `mt-[4px]`).
- Card 2: `Terminal` icon. Title: "Developer Community". Description: "Discord, dev blog, CLI-first onboarding builds loyalty".
- Card 3: `Zap` icon. Title: "Product-Led Growth". Description: "Free tier removes friction. Teams upgrade when they hit limits".
- Card 4: `Building2` icon. Title: "Enterprise Sales". Description: "Direct sales for on-prem, compliance, and custom integrations".

---

## Slide 11 — Team (TeamSlide.tsx)

**Purpose**: Show the team. Investors fund people, not just ideas.

**Background**: `#050505` + `radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.03), transparent 55%)`

**Title area** (`mt-[7%]`, `px-[5.2%]`):
- Eyebrow: "THE TEAM" in IBM Plex Mono, `clamp(10px, 0.8vw, 14px)`, `#6366F1`, letter-spacing `0.15em`, uppercase
- Title: "Built by developers, for developers." in Inter, `clamp(26px, 3.2vw, 56px)`, font-weight 700, `#F9FAFB`, `mt-[0.8%]`

**Founder card** (`mt-[4%]`, `px-[5.2%]`):

Single large card (max-width `60%`): `#111111` bg, `2px solid #6366F1` border, padding `clamp(32px, 3vw, 56px)`.

- Name: "Aansh Naidu" in Inter, `clamp(22px, 2vw, 36px)`, font-weight 700, `#F9FAFB`
- Role: "Founder & CEO" in IBM Plex Mono, `clamp(12px, 1vw, 18px)`, `#6366F1`, `mt-[4px]`
- Company: "Vivid Verse Global" in IBM Plex Mono, `clamp(11px, 0.85vw, 15px)`, `#9CA3AF`, `mt-[8px]`
- Divider: `1px solid #1F1F23`, `my-[clamp(16px,1.5vw,28px)]`
- Bio/credentials (2-3 bullet points, each with a small `ChevronRight` icon in `#6366F1` as bullet). Text in Inter, `clamp(13px, 1.05vw, 19px)`, `#D1D5DB`, line-height `1.6`, gap `clamp(8px,0.7vw,14px)`:
  - "[PLACEHOLDER: Add 1-2 sentences about technical background and relevant experience]"
  - "[PLACEHOLDER: Add notable achievement, previous startup, or domain expertise]"
  - "[PLACEHOLDER: Add education or other credibility signal]"

**NOTE TO BUILDER**: Replace the [PLACEHOLDER] lines with real founder credentials before presenting. These are intentionally left as placeholders.

**Below the card** (`mt-[3%]`, `px-[5.2%]`):
- "Hiring" section: "Building the core team. Key hires planned with seed funding:" in Inter, `clamp(13px, 1vw, 19px)`, `#9CA3AF`
- Three role pills in a horizontal row (`mt-[1.5%]`, flex, gap `clamp(8px, 1vw, 16px)`):
  - "Senior Backend Engineer" — `#111111` bg, `1px solid #22C55E`, `#22C55E` text
  - "Developer Advocate" — `1px solid #6366F1`, `#6366F1` text
  - "Growth Lead" — `1px solid #F59E0B`, `#F59E0B` text
  - All pills: IBM Plex Mono, `clamp(10px, 0.8vw, 14px)`, `px-[clamp(10px,1vw,18px)] py-[clamp(4px,0.3vw,8px)]`

---

## Slide 12 — The Ask / Closing (ClosingSlide.tsx)

**Purpose**: Clear fundraising ask with use of funds. End with contact info. This is the slide they remember.

**Background**: `#050505` + `radial-gradient(ellipse at 60% 70%, rgba(99,102,241,0.06), transparent 55%)`

**Layout**: No standard header on this slide. Full custom layout.

**Top left** (`px-[5.2%]`, `pt-[3%]`): "LTF1" in IBM Plex Mono, `clamp(22px, 2.2vw, 40px)`, font-weight 700, `#F9FAFB`, with `3px solid #6366F1` left-border accent

**Main content** (vertically centered, `px-[5.2%]`, left-aligned):

- Terminal line: `> ltf1 raise --round=seed --status="ready"` in IBM Plex Mono, `clamp(13px, 1.1vw, 22px)`, `#22C55E`, `mb-[2%]`
- Title: "Let's build the future of developer productivity." in Inter, `clamp(30px, 3.8vw, 68px)`, font-weight 700, `#F9FAFB`, tracking `-0.025em`, line-height `1.08`, max-width `65%`

**Use of funds** (`mt-[3.5%]`):
- Label: "USE OF FUNDS" in IBM Plex Mono, `clamp(10px, 0.75vw, 13px)`, `#F59E0B`, letter-spacing `0.1em`, `2px solid #F59E0B` bottom border, `pb-[6px]`
- Three fund allocation rows (`mt-[1.5%]`, vertical stack, gap `clamp(10px, 1vw, 18px)`):

  Each row: flex, align-center. Left: category label in IBM Plex Mono, `clamp(13px, 1.05vw, 19px)`, `#D1D5DB`, font-weight 500, min-width `35%`. Right: a horizontal bar (height `4px`, `border-radius: 0px`) showing relative allocation, with percentage at end.

  - "Engineering & Product" — bar width `50%`, color `#6366F1`. "50%" at end.
  - "Growth & Community" — bar width `30%`, color `#22C55E`. "30%"
  - "Operations & Hiring" — bar width `20%`, color `#F59E0B`. "20%"

  Bar container: `#1F1F23` background (full width = 100%), filled bar is the colored portion.

**Milestones** (`mt-[3%]`):
- Label: "18-MONTH MILESTONES" in IBM Plex Mono, `clamp(10px, 0.75vw, 13px)`, `#06B6D4`, letter-spacing `0.1em`, `2px solid #06B6D4` bottom border, `pb-[6px]`
- Three milestone items (`mt-[1.5%]`, flex, gap `clamp(20px, 2vw, 40px)`):
  - "Launch Pro tier" — `Check` icon in `#06B6D4`, text in Inter, `clamp(13px, 1.05vw, 19px)`, `#D1D5DB`
  - "1,000+ active teams" — same style
  - "First enterprise contracts" — same style

**Contact info** (absolute, `bottom-[6%]`, `left-[5.2%]`):
- Horizontal row, gap `clamp(16px, 1.5vw, 32px)`:
  - `Mail` icon (`#6B7280`, `clamp(16px,1.2vw,22px)`) + "Aansh.Naidu@vividverseglobal.com" in IBM Plex Mono, `clamp(12px, 0.95vw, 17px)`, `#9CA3AF`
  - `Github` icon + "github.com/ltf1"
  - `MessageCircle` icon + "discord.gg/jWMS6Pcr"

**Bottom right** (absolute, `bottom-[6%]`, `right-[5.2%]`):
- "Free . Open Source . Self-Hostable" in IBM Plex Mono, `clamp(10px, 0.8vw, 14px)`, `#6B7280`

---

## App.tsx

Import all 12 slide components and wire them into the Presentation component in this exact order:

1. CoverSlide
2. ProblemSlide
3. SolutionSlide
4. ProductSlide
5. HowItWorksSlide
6. MarketSlide
7. CompetitionSlide
8. BusinessModelSlide
9. TractionSlide
10. GTMSlide
11. TeamSlide
12. ClosingSlide

---

## Narration Guide (Speaker Notes Summary)

1. **Cover** — "LTF1 is git-native project management. When you push code, your tasks update themselves. Open source, self-hostable, built for developers."
2. **Problem** — "Every commit, developers lose 10 minutes to manual ticket updates. UC Irvine found it takes 23 minutes to regain focus after an interruption. Context switching is the #3 productivity killer."
3. **Solution** — "With LTF1, you push code and everything else happens automatically. Task status, PR linking, story point estimation, sprint updates, team notifications. Seven operations, zero manual effort."
4. **Product** — "Five core capabilities: PR-driven task updates, AI estimation from diffs, git-based velocity metrics, full CLI and TUI, and real-time collaboration with chat, video, and whiteboard."
5. **How It Works** — "Four steps: push code, auto-update, AI estimates, ship and measure. That's it."
6. **Market** — "The project management software market hits $23 billion by 2031. There are 47 million developers worldwide. Jira holds 86% of the bug-tracking market — and developers hate it."
7. **Competition** — "Jira is bloated and slow. Linear is closed source and not git-native. GitHub Issues lacks project management depth. Plane isn't git-native. Nobody combines git automation, AI estimation, and open source. That's our gap."
8. **Business Model** — "Open core: free forever for small teams, $12 per user per month for Pro, custom enterprise pricing. Open source builds trust, Pro captures value, Enterprise captures compliance."
9. **Traction** — "Full web platform shipped with 23 pages. CLI published to npm. GitHub, GitLab, Slack integrations live. Multi-provider AI system with Gemini, OpenAI, and Anthropic support. Growing community on Discord."
10. **Go-to-Market** — "Open source is our top of funnel. Developers discover us through GitHub, npm, and community. Teams convert to Pro when they hit the 5-member limit or need advanced analytics and SSO. Enterprise for on-prem and compliance."
11. **Team** — "Founded by Aansh Naidu at Vivid Verse Global. Using seed funding to hire a senior backend engineer, developer advocate, and growth lead."
12. **The Ask** — "We're raising a seed round to scale integrations, grow the open source community, and launch the Pro tier. 50% engineering, 30% growth, 20% operations. 18-month milestones: Pro launch, 1,000 active teams, first enterprise contracts."

---

## Data Sources Referenced

- Project management software market: Mordor Intelligence 2025 ($23.1B by 2031, 15.4% CAGR)
- Developer population: SlashData 2025 (47.2M total, 36.5M professional)
- Context switching: University of California Irvine (23 min 15 sec to regain focus)
- App toggles: Harvard Business Review (1,200 toggles/day)
- Productivity killer ranking: Atlassian Developer Survey 2025 (#3)
- Jira market share: 6sense 2023 (86% bug-tracking market)
- Atlassian revenue: Atlassian FY2024 earnings ($4.4B annual revenue)
- Linear valuation: Series C June 2025 ($1.25B valuation, $100M revenue)
- Developer deep work: Developer productivity study (2.3 hours/8 hours)
