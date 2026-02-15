# UNIVERSAL PAGE REDESIGN PROMPT

> **Instructions**: Paste this entire prompt into each Claude Code instance. Attach ONE screenshot of the specific page/route that instance will work on. Press Enter. Do not add anything else.

---

## YOUR MISSION

You are redesigning a single page of the LTF1 (Iceberg-L) web application. A screenshot has been attached showing the EXACT page you are responsible for. Your job:

1. Identify which page/route the screenshot shows
2. Find the corresponding source files in the codebase
3. Redesign that page to STRICTLY follow the design system documented in `docs_design/`
4. Spawn an agent team to execute the work in parallel (MANDATORY — non-negotiable)
5. Verify the build passes after all changes

You are one of multiple Claude Code instances running simultaneously, each working on a different page. Do NOT touch files outside your page's scope. Do NOT modify shared layout components (DashboardLayout, PublicNavigation, Footer) unless the screenshot specifically shows those components AS your assigned page.

---

## PROJECT CONTEXT

```
Path:           /home/aansh/LTF1/iceberg-L
Stack:          Vite + React 18 + TypeScript + Convex + Clerk + Framer Motion + Tailwind CSS
Web app:        apps/web/src/
Pages dir:      apps/web/src/pages/
Components:     apps/web/src/components/
Landing:        apps/web/src/components/landing/
UI components:  apps/web/src/components/ui/
Layout:         apps/web/src/components/layout/DashboardLayout.tsx
Themes:         apps/web/src/themes/globalThemes.ts
Design docs:    docs_design/ (7 files — THE source of truth)
Build command:  cd apps/web && pnpm build
```

---

## STEP 1: IDENTIFY YOUR PAGE

Analyze the screenshot carefully. Match it to one of these routes and files:

### Public Pages (no sidebar, uses PublicNavigation + Footer)
| Route | File | Key Components |
|-------|------|---------------|
| `/` | `pages/LandingPage.tsx` | `components/landing/sections/*` (7 sections), `components/landing/ascii/*` |
| `/pricing` | `pages/PricingPage.tsx` | Pricing tier cards, comparison table |
| `/contact` | `pages/ContactPage.tsx` | Contact form, cards |
| `/features` | `pages/FeaturesPage.tsx` | Feature category grid, bento layout |
| `/features/:slug` | `pages/FeatureDetailPage.tsx` | Hero + alternating text/ASCII sections |
| `/sign-in/*` | `pages/SignInPage.tsx` | 50/50 split layout, Clerk form |
| `/sign-up/*` | `pages/SignUpPage.tsx` | 50/50 split layout, Clerk form |
| `/coming-soon` | `pages/ComingSoonPage.tsx` | Teaser page |
| `/blog` | `pages/BlogPage.tsx` | Blog listing |
| `*` (404) | `pages/NotFoundPage.tsx` | Error page |

### Authenticated Pages (has sidebar via DashboardLayout, Outlet pattern)
| Route | File | Key Sub-Components |
|-------|------|--------------------|
| `/dashboard` | `pages/Dashboard.tsx` | Stats grid, recent activity, workspaces list |
| `/profile` | `pages/MyProfilePage.tsx` | Profile card, settings |
| `/workspaces` | `pages/WorkspacesPage.tsx` | Workspace cards grid |
| `/workspace/:id` | `pages/WorkspaceManagementPage.tsx` | Tabs: overview, members, settings, integrations |
| `/workspace/:id/project/:id` | `pages/ProjectManagementPage.tsx` | Kanban/list/calendar views, task modals |
| `/projects` | `pages/ProjectsPage.tsx` | Project cards grid |
| `/tasks` | `pages/TasksPage.tsx` | Task table/board, filters |
| `/teams` | `pages/TeamsPage.tsx` | Team listing |
| `/team` | `pages/TeamPage.tsx` | Team management |
| `/sprints` | `pages/SprintPage.tsx` | Sprint board, planning |
| `/settings` | `pages/SettingsPage.tsx` | Settings tabs |
| `/whiteboard` | `pages/WhiteboardPage.tsx` | Canvas whiteboard |
| `/custom-fields` | `pages/CustomFieldsPage.tsx` | Custom field management |
| `/workspace/:id/settings` | `pages/WorkspaceSettingsPage.tsx` | Workspace-level settings |

### Utility Pages
| Route | File |
|-------|------|
| `/cli-auth` | `pages/CLIAuthPage.tsx` |
| `/join-project` | `pages/JoinProjectPage.tsx` |
| `/api/auth/github/callback` | `pages/GitHubCallbackPage.tsx` |

---

## STEP 2: READ THE DESIGN SYSTEM (MANDATORY)

Before writing ANY code, every agent on your team MUST read these files. They are the SINGLE SOURCE OF TRUTH for all visual decisions:

```
docs_design/00-overview.md    — Identity: dark brutalist terminal
docs_design/01-colors.md      — Full palette, semantic colors, background patterns
docs_design/02-typography.md   — Inter + IBM Plex Mono, size scale, hierarchy
docs_design/03-style.md       — Borders, shadows, cards, buttons, forms, tables
docs_design/04-motion.md      — Framer Motion patterns, timing, scroll animations
docs_design/05-language.md    — Voice, tone, ASCII art system, copy conventions
docs_design/06-layout.md      — Grid system, responsive breakpoints, section structure
```

### CRITICAL DESIGN TOKENS (Quick Reference)

**Backgrounds** (depth through color, NOT shadows):
```
Page base:     #050505
Surface:       #0A0A0A  (ASCII blocks, code panels)
Card/input:    #111111  (interactive surfaces)
```

**Text** (gray is default, white is emphasis):
```
Primary:       #F9FAFB  (headlines, important values)
Secondary:     #9CA3AF  (body text, descriptions)
Tertiary:      #6B7280  (labels, hints, timestamps, ASCII)
```

**Accent**:
```
Primary:       #6366F1  (indigo — CTAs, active states, focus rings)
Hover:         #4F46E5
Muted:         #6366F1 at 30% opacity
```

**Semantic Colors** (meaning only, never decorative):
```
Green:    #22C55E   (success, active, synced)
Red:      #EF4444   (error, critical, blocked)
Amber:    #F59E0B   (warning, pending)
Purple:   #8B5CF6   (analytics, metrics)
Cyan:     #06B6D4   (planning, collaboration)
Pink:     #EC4899   (collaboration, team accent)
```

**Borders**:
```
Standard:      2px solid #2E2E35  (cards, inputs, containers)
Subtle:        1px solid #1F1F23  (dividers, nav border)
Hover:         border-color → #6366F1
```

**Typography**:
```
Prose font:    font-['Inter',sans-serif]
Code font:     font-['IBM_Plex_Mono',monospace]
Headlines:     Inter Bold/Extrabold, #F9FAFB, tracking-tight
Body:          Inter Regular, #6B7280 or #9CA3AF, leading-relaxed
Labels:        IBM Plex Mono Semibold, uppercase, tracking-wider, text-xs
```

**Corners**:
```
Cards/content blocks:  0px (no rounding)
Pricing cards:         12px (rounded-xl)
Buttons:               8px (rounded-lg)
Inputs:                8px (rounded-lg)
Badges:                4-8px
```

**Shadows** (hard offset ONLY, never blur):
```
Primary CTA:   4px 4px 0px rgba(0,0,0,0.5)
Hover:         3px 3px 0px rgba(0,0,0,0.4) + translateY(-2px)
Default:       No shadow (depth via background tiers)
```

**Motion** (Framer Motion, all scroll-triggered = once: true):
```
Standard entrance:  opacity 0→1, y 20→0, 500ms
Hero entrance:      opacity 0→1, y 24→0, 700ms
Stagger children:   80ms gap
Card hover:         y: -2px, border lightens, 250ms
Scroll trigger:     viewport={{ once: true, margin: '-30px' }}
```

---

## STEP 3: SPAWN YOUR AGENT TEAM (MANDATORY — NON-NEGOTIABLE)

You MUST use the TeamCreate tool to create a team and spawn agents. This is required for EVERY instance. Use this exact structure:

### Team Architecture

Create a team named after your page (e.g., `redesign-dashboard`, `redesign-pricing`).

Spawn these agents using the Task tool with `team_name` parameter:

#### Agent 1: `researcher` (subagent_type: Explore)
**Task**: Analyze the screenshot and codebase
- Read ALL 7 design doc files in `docs_design/`
- Identify the exact page file and all its sub-components
- Map every component that needs changes
- Document the current state vs. design system gaps
- Report findings to team lead

#### Agent 2: `component-builder` (subagent_type: general-purpose)
**Task**: Implement component-level changes
- Redesign individual components used by this page
- Apply correct colors, typography, borders, shadows, corners
- Add/fix Framer Motion animations per `04-motion.md`
- Ensure responsive behavior per `06-layout.md`
- Do NOT create new files unless absolutely necessary — edit existing ones

#### Agent 3: `page-assembler` (subagent_type: general-purpose)
**Task**: Implement page-level layout and composition
- Fix the page's overall layout structure per `06-layout.md`
- Correct section padding (`py-24 md:py-32`), container widths (`max-w-5xl mx-auto px-6`)
- Fix content hierarchy and spacing
- Ensure proper scroll-triggered animations with `once: true`
- Wire up responsive breakpoints (mobile-first)

#### Agent 4: `validator` (subagent_type: Bash)
**Task**: Build verification and design audit
- Run `cd /home/aansh/LTF1/iceberg-L/apps/web && pnpm build`
- Report any TypeScript or build errors
- If errors exist, report back to team lead for fixes
- Run build again after fixes until clean

### Execution Flow
1. `researcher` completes analysis → reports gaps to team lead
2. Team lead creates tasks from researcher's findings
3. `component-builder` and `page-assembler` work in parallel on their assigned files (NO overlapping files)
4. After both complete → `validator` runs build
5. Fix any build errors → re-validate
6. Team lead marks all tasks complete and shuts down team

### CRITICAL: File Ownership Rules
- Each agent owns specific files. NO two agents edit the same file.
- The team lead assigns file ownership based on researcher's analysis.
- If a file needs both component and layout changes, assign it to ONE agent only.
- Components in `components/features/` or `components/ui/` → `component-builder`
- Page files in `pages/` → `page-assembler`
- If a page file is self-contained (no sub-components), `page-assembler` handles everything

---

## STEP 4: IMPLEMENTATION RULES

### DO
- Use hardcoded hex values from the design docs (e.g., `text-[#F9FAFB]`, `bg-[#111111]`, `border-[#2E2E35]`)
- Use Tailwind arbitrary values for design doc colors (e.g., `bg-[#050505]`)
- Use `font-['Inter',sans-serif]` for prose and `font-['IBM_Plex_Mono',monospace]` for code/labels
- Use Framer Motion for all animations — `motion.div` with proper variants
- Apply `viewport={{ once: true, margin: '-30px' }}` on all scroll-triggered animations
- Use `2px solid #2E2E35` as the standard border on cards and containers
- Make cards 0px border-radius, buttons 8px (`rounded-lg`), inputs 8px
- Apply staggered children animations (80ms gap) for lists and grids
- Keep shadows hard-offset only: `4px 4px 0px rgba(0,0,0,0.5)`
- Follow the section anatomy: `<section className="py-24 md:py-32"><div className="max-w-5xl mx-auto px-6">`
- Preserve all existing functionality, data fetching, state management, and event handlers
- Keep all imports that are currently used
- Keep all Convex query/mutation hooks exactly as they are

### DO NOT
- Do NOT change any Convex backend files (`convex/`)
- Do NOT modify `App.tsx` routing
- Do NOT modify `DashboardLayout.tsx` or `PublicNavigation.tsx` or `Footer.tsx` (shared components)
- Do NOT change `tailwind.config.js` or `globalThemes.ts`
- Do NOT remove existing functionality or break data flow
- Do NOT use CSS variables (`var(--theme-*)`) — use hardcoded design doc hex values
- Do NOT use blur shadows — only hard-offset shadows
- Do NOT use gradients on elements (gradients only for background textures at very low opacity)
- Do NOT add new npm dependencies
- Do NOT create new files unless replacing a broken component
- Do NOT use `rounded-full`, `rounded-3xl`, or large border-radius values
- Do NOT add infinite loop animations (except cursor blink and scroll indicator)
- Do NOT apply `uppercase` to Inter body text (only to IBM Plex Mono labels)
- Do NOT use springs on content animations (springs only for micro-interactions)

### TYPOGRAPHY RULES (from 02-typography.md)
```
H1 (Hero):      Inter 700/800, text-5xl→md:text-6xl→lg:text-7xl, #F9FAFB, tracking-tight
H2 (Section):   Inter 700, text-3xl→md:text-4xl→lg:text-5xl, #F9FAFB, tracking-tight
H3 (Card):      Inter 700, text-2xl→md:text-3xl, #F9FAFB
H4 (Label):     IBM Plex Mono 600, text-xs, #6366F1, uppercase, tracking-wider
Body:           Inter 400, text-base→text-lg, #6B7280, leading-relaxed
Secondary:      Inter 400, text-sm, #9CA3AF
Nav links:      Inter 500, text-sm, #9CA3AF → hover:#F9FAFB
Button text:    Inter 600, text-sm, sentence case
```

### BUTTON RULES (from 03-style.md)
```
Primary CTA:    bg-[#F9FAFB] text-[#050505] border-2 border-[#4F46E5] rounded-lg shadow-[4px_4px_0px_rgba(0,0,0,0.5)] px-6 py-3 font-semibold text-sm
                hover: translateY(-2px), shadow → 3px 3px
Secondary:      bg-transparent text-[#9CA3AF] border border-[#2E2E35] rounded-lg px-6 py-3
                hover: border-[#6366F1] text-[#F9FAFB]
Accent:         bg-[#6366F1] text-white border-2 border-[#4F46E5] rounded-lg px-5 py-2.5
                hover: bg-[#4F46E5]
```

### CARD RULES (from 03-style.md)
```
Standard:       bg-[#111111] border-2 border-[#2E2E35] (NO rounding, NO shadow)
Hover:          border lightens to rgba(249,250,251,0.2), y: -2px
With ASCII:     Inner block bg-[#0A0A0A] p-6 for monospace content
Highlighted:    border-color: rgba(99,102,241,0.6) → hover: full opacity
```

### FOR AUTHENTICATED (DASHBOARD) PAGES SPECIFICALLY
- The page renders inside `DashboardLayout` via React Router `<Outlet />`
- You are only changing the page content, NOT the sidebar or top bar
- Replace CSS variable usage (`var(--theme-*)`) with hardcoded design doc hex values
- Replace BrutalButton/BrutalCard imports with inline Tailwind styling matching the design docs, OR keep the imports but override styles with className
- The page background should be `bg-[#050505]`
- Cards should be `bg-[#111111] border-2 border-[#2E2E35]`
- All text follows the typography hierarchy from `02-typography.md`

### FOR PUBLIC (LANDING/MARKETING) PAGES SPECIFICALLY
- These already mostly follow the design docs — focus on fixing any deviations
- Verify all colors match exactly (no #0F0F0F when it should be #111111, etc.)
- Verify animations follow `04-motion.md` patterns exactly
- Verify typography hierarchy from `02-typography.md` is correct
- Verify layout structure from `06-layout.md` is followed

---

## STEP 5: QUALITY CHECKLIST

Before marking complete, verify:

- [ ] All backgrounds use only: `#050505`, `#0A0A0A`, `#111111`
- [ ] All text uses only: `#F9FAFB`, `#9CA3AF`, `#6B7280` (+ semantic colors for meaning)
- [ ] Accent color is `#6366F1` / `#4F46E5` — not yellow, not blue
- [ ] Borders are `2px solid #2E2E35` on cards/containers, `1px solid #1F1F23` on dividers
- [ ] Cards have 0px border-radius, buttons have 8px
- [ ] Shadows are hard-offset only (no blur)
- [ ] Inter for prose, IBM Plex Mono for code/labels — never mixed in one element
- [ ] All scroll animations have `once: true`
- [ ] Section padding is `py-24 md:py-32` with `max-w-5xl mx-auto px-6`
- [ ] Headlines are `tracking-tight`, labels are `uppercase tracking-wider`
- [ ] No functionality was removed or broken
- [ ] Build passes: `cd /home/aansh/LTF1/iceberg-L/apps/web && pnpm build`

---

## BEGIN

1. Analyze the attached screenshot
2. Read all design docs in `docs_design/`
3. Create your team with TeamCreate
4. Create tasks with TaskCreate
5. Spawn your 4 agents
6. Execute the redesign
7. Validate the build
8. Shut down your team when done
