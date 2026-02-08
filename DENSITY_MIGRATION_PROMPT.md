# Density Migration: Linear-Sizing x Brutalist Design

## Mission

Make the entire LTF1 app UI compact and information-dense like Linear, while strictly following the design docs in `docs_design/` as the non-negotiable source of truth. This is a **spacing and sizing only** migration — no color, font, border-style, shadow, or motion changes.

Read ALL files in `docs_design/` before making any changes. They are your bible.

## Design Doc Constraints (NON-NEGOTIABLE — do NOT violate these)

- **Borders**: `border-2` (`2px #2E2E35`) on cards/components — KEEP everywhere
- **Subtle dividers**: `border` (`1px #1F1F23`) for internal dividers within components
- **Shadows**: `shadow-brutal` (`4px 4px 0px`) hard offset, no blur — KEEP
- **Corners**: `0px` enforced globally — KEEP
- **Fonts**: Inter (prose), IBM Plex Mono (code/labels), uppercase labels — KEEP
- **Accent**: `#6366F1` indigo — KEEP
- **Colors**: `#050505` → `#0A0A0A` → `#111111` background stack — KEEP
- **Motion**: 500ms fade-up, stagger 60-100ms, `once: true` — KEEP

**DO NOT change**: border-2 on BrutalCard, shadow-brutal on buttons, border-radius 0px, color palette, font families, animation timings, or any design token.

## Execution Plan — 5 Parallel Agent Teams

Use `TeamCreate` to create a team, then spawn 5 agents with `Task` tool using `team_name`. Each agent owns specific files — **NO OVERLAP**. After all agents complete, the lead runs `cd apps/web && pnpm build` to verify, fixes any errors, then commits and pushes.

---

### AGENT 1: "foundation" — Tier 1 Foundation Components

**Files owned** (ONLY touch these):
- `apps/web/src/components/ui/BrutalCard.tsx`
- `apps/web/src/components/ui/BrutalButton.tsx`
- `apps/web/src/components/ui/BrutalModal.tsx`
- `apps/web/src/components/common/EmptyState.tsx`

**Changes**:

**BrutalCard.tsx** — Update padding map only:
```
sm: 'p-16px'   →  sm: 'p-[10px]'
md: 'p-24px'   →  md: 'p-[16px]'
lg: 'p-32px'   →  lg: 'p-[20px]'
```
Keep `border-2` and all variants untouched.

**BrutalButton.tsx** — Update sizes map only:
```
sm: 'px-4 py-2 text-xs'     →  sm: 'px-3 py-1.5 text-[11px]'
md: 'px-6 py-3 text-sm'     →  md: 'px-4 py-2 text-xs'
lg: 'px-8 py-4 text-base'   →  lg: 'px-5 py-2.5 text-sm'
xl: 'px-10 py-5 text-lg'    →  xl: 'px-6 py-3 text-sm'
```
Keep `border-2`, shadow, variants untouched.

**BrutalModal.tsx** — Update spacing:
- Outer border: `border-4` → `border-2`
- Header: `px-24px py-16px` → `px-[16px] py-[10px]`
- Header bottom border: `border-b-2` → `border-b`
- Title: `text-brutal-xl` → `text-[14px] font-bold uppercase`
- Close icon: `w-24px h-24px` → `w-4 h-4`
- Close button padding: `p-8px` → `p-[4px]`
- Content area: `p-24px` → `p-[16px]`
- Container inline padding style: `24px` → `16px`
- maxHeight calc: `48px` → `32px`

**EmptyState.tsx** — Update spacing:
- Container: `p-64px` → `p-[32px]`
- Icon wrapper: `mb-24px` → `mb-[12px]`, `p-24px` → `p-[12px]`
- Title: `text-brutal-xl mb-16px` → `text-[14px] font-bold mb-[8px]`
- Description: `text-brutal-sm mb-32px` → `text-[12px] mb-[16px]`

---

### AGENT 2: "common" — Tier 2 Common Components

**Files owned** (ONLY touch these):
- `apps/web/src/components/common/WorkspaceSelector.tsx`
- `apps/web/src/components/common/WorkspaceMobileBlocker.tsx`
- `apps/web/src/components/common/LoadingSpinner.tsx`
- `apps/web/src/components/common/BrutalistLoader.tsx`
- `apps/web/src/components/common/RequireAuth.tsx`
- `apps/web/src/components/features/profile/ProfileCompletionBanner.tsx`
- `apps/web/src/components/terminal/CommandTerminal.tsx`

**Rules**: Read each file first. Apply these density reductions:

**WorkspaceSelector.tsx**:
- Dropdown item padding: any `px-16px py-12px` → `px-[10px] py-[6px]`
- Any `px-20px py-16px` → `px-[12px] py-[8px]`
- Gaps: `gap-12px` → `gap-[6px]`, `gap-16px` → `gap-[8px]`
- Icons: `w-24px h-24px` → `w-4 h-4`
- Keep `border-2`

**CommandTerminal.tsx**:
- Header: `px-16px py-8px` → `px-[10px] py-[6px]`
- Gaps: `gap-12px` → `gap-[6px]`, `gap-16px` → `gap-[8px]`
- Main area: `p-16px` → `p-[10px]`
- Footer: `px-16px py-8px` → `px-[10px] py-[6px]`
- Icons inside: `w-24px h-24px` → `w-4 h-4`

**WorkspaceMobileBlocker.tsx**:
- All `p-32px` → `p-[16px]`, `p-48px` → `p-[24px]`, `p-24px` → `p-[16px]`
- All `mb-32px` → `mb-[16px]`, `mb-24px` → `mb-[12px]`, `mb-16px` → `mb-[8px]`
- Button padding: `px-32px py-16px` → `px-[16px] py-[8px]`, `px-32px py-20px` → `px-[16px] py-[10px]`
- `space-y-24px` → `space-y-[12px]`, `space-y-16px` → `space-y-[8px]`

**LoadingSpinner.tsx**:
- Spinner: `w-32px h-32px` → `w-5 h-5`
- Keep any border-2 on spinner element

**BrutalistLoader.tsx**:
- Spinner: `w-24px h-24px` → `w-5 h-5`, `w-32px` → `w-5`
- Keep `border-2` on spinner

**RequireAuth.tsx**:
- Container padding: anything `p-10` or larger → `p-6`
- Keep `border-2`

**ProfileCompletionBanner.tsx**:
- Read file, apply same density pattern: reduce padding by ~35-40%, reduce icon sizes to `w-4 h-4`, reduce gaps by ~50%

---

### AGENT 3: "features-a" — Feature Components (A-K)

**Files owned**: ALL files in these directories ONLY:
- `apps/web/src/components/features/dashboard/`
- `apps/web/src/components/features/github/`
- `apps/web/src/components/features/kanban/`
- `apps/web/src/components/features/activity/`
- `apps/web/src/components/features/analytics/`
- `apps/web/src/components/features/ai/`
- `apps/web/src/components/features/automations/`
- `apps/web/src/components/features/integrations/`
- `apps/web/src/components/admin/`

**DO NOT touch**: `DashboardLayout.tsx` (already done), any file in `components/ui/`, any file in `components/common/`

**Bulk replacements to apply in every file you own** (read each file first, apply with Edit tool):

```
p-48px      →  p-[24px]
p-32px      →  p-[20px]
p-24px      →  p-[16px]
p-16px      →  p-[10px]

px-48px     →  px-[24px]
px-32px     →  px-[16px]
px-24px     →  px-[12px]
px-16px     →  px-[10px]

py-24px     →  py-[12px]
py-16px     →  py-[8px]

gap-24px    →  gap-[12px]
gap-16px    →  gap-[8px]
gap-12px    →  gap-[6px]

mb-48px     →  mb-[24px]
mb-32px     →  mb-[16px]
mb-24px     →  mb-[12px]
mb-16px     →  mb-[8px]

mt-48px     →  mt-[24px]
mt-32px     →  mt-[16px]
mt-24px     →  mt-[12px]

space-y-24px  →  space-y-[12px]
space-y-16px  →  space-y-[8px]

w-64px h-64px  →  w-8 h-8
w-48px h-48px  →  w-6 h-6
w-32px h-32px  →  w-5 h-5
w-24px h-24px  →  w-4 h-4

text-brutal-2xl  →  text-[20px] font-bold
text-brutal-xl   →  text-[16px] font-bold
text-brutal-lg   →  text-[14px] font-semibold
```

**IMPORTANT**: Do NOT blindly replace. Read each file. If a class appears inside a string that's NOT a className (like a variable name or comment), skip it. Do NOT change any `border-*` classes, `shadow-*` classes, `bg-*` classes, `text-[var(--` classes, or color classes. Only change spacing/sizing classes.

**IMPORTANT**: Some files use `p-24px` as a standalone className AND inside a clsx/template string. Handle both cases. Use `replace_all: true` in Edit tool when the old string is unique enough.

---

### AGENT 4: "features-b" — Feature Components (L-Z)

**Files owned**: ALL files in these directories ONLY:
- `apps/web/src/components/features/meetings/`
- `apps/web/src/components/features/notifications/`
- `apps/web/src/components/features/onboarding/`
- `apps/web/src/components/features/project/`
- `apps/web/src/components/features/search/`
- `apps/web/src/components/features/settings/`
- `apps/web/src/components/features/sprint/`
- `apps/web/src/components/features/task/`
- `apps/web/src/components/features/team/`
- `apps/web/src/components/features/profile/` (EXCEPT `ProfileCompletionBanner.tsx` which is owned by Agent 2)
- `apps/web/src/components/features/whiteboard/`
- `apps/web/src/components/features/workspace/`
- `apps/web/src/components/features/custom-fields/`

**DO NOT touch**: `DashboardLayout.tsx`, any file in `components/ui/`, any file in `components/common/`, `ProfileCompletionBanner.tsx`

**Apply the EXACT same bulk replacement rules as Agent 3** (see the full table above). Same caution rules apply — read before replacing, don't touch borders/shadows/colors.

---

### AGENT 5: "pages" — All Page Components + Landing Components

**Files owned**: ALL files in these directories ONLY:
- `apps/web/src/pages/` (ALL files)
- `apps/web/src/components/landing/` (ALL files)
- `apps/web/src/components/BrutalFooterContent.tsx`
- `apps/web/src/components/common/Footer.tsx`
- `apps/web/src/components/common/StaticMarqueeBackground.tsx`

**DO NOT touch**: `DashboardLayout.tsx` (already done), any file in `components/ui/`, `components/features/`, or other `components/common/` files owned by Agent 2.

**Apply the same bulk replacement rules as Agent 3** for all page files.

**Additional landing-specific changes**:
- `StaticMarqueeBackground.tsx`: `mx-32px` → `mx-[16px]`, `mt-56px` → `mt-[28px]`
- `Footer.tsx`: reduce oversized padding, icons `w-24px h-24px` → `w-4 h-4`
- `BrutalFooterContent.tsx`: same icon/padding reduction

**Landing pages exception**: Landing hero sections (`text-hero-*` classes) should NOT be changed — those are marketing typography, not app density. Only change spacing/padding/gap/margin classes on landing pages, not headline font sizes.

---

## After All Agents Complete

The team lead must:

1. **Build check**:
```bash
cd apps/web && pnpm build
```
If there are TypeScript errors, fix them. Common issues:
- Tailwind class typos (e.g., missing bracket in `p-[16px]`)
- Accidentally modified a non-className string

2. **Visual sanity check**: List what was changed:
```bash
git diff --stat
```

3. **Commit and push**:
```bash
git add apps/web/src/
git commit -m "feat: Apply Linear-density spacing across entire app UI

Reduce padding, margins, gaps, icon sizes, and text sizes across all
components to match Linear-like information density while preserving
the brutalist design system (2px borders, 0px radius, hard shadows,
monospace labels, dark palette).

Foundation: BrutalCard, BrutalButton, BrutalModal, EmptyState
Common: WorkspaceSelector, Terminal, MobileBlocker, loaders
Features: 75+ feature components bulk-updated
Pages: All page and landing components

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"

git push origin developement
```

## Critical Reminders

- **Read `docs_design/` files before ANY changes** — they are the law
- **Read each file before editing** — never blind-edit
- **Keep `border-2`** on cards and components (design doc requirement)
- **Keep `shadow-brutal`** on buttons (design doc requirement)
- **Keep all colors, fonts, motion** unchanged
- **Do NOT touch `DashboardLayout.tsx`** — already compacted
- **Each agent only touches its own files** — no overlap
- **Use `replace_all: true`** in Edit tool for patterns that appear multiple times in one file
- **If a spacing class appears inside a BrutalCard `className` prop override** (e.g., `<BrutalCard className="p-48px">`), still replace it — these are per-instance overrides that need the same density treatment
