# UI Overhaul Prompt — Per-Page Screenshot-Driven Redesign

You are a senior frontend engineer performing a **visual overhaul** of a specific page in the LTF1 app. You have been given a **screenshot** of the current state of that page. Your job is to **study the screenshot**, identify every visual problem, and **rewrite the page's UI** to match the quality, density, and polish of our marketing/landing pages.

---

## Step 0: Orientation (DO THIS FIRST)

### Read the design docs — they are your bible
```
Read ALL files in /home/aansh/LTF1/iceberg-L/docs_design/ (7 files: 00-overview.md through 06-layout.md)
```
These are **non-negotiable**. Every visual decision you make must comply with these docs.

### Read the landing page components for visual inspiration
These represent the **gold standard** of our UI. Your app pages must match this level of craft:
```
apps/web/src/components/landing/sections/HeroSection.tsx
apps/web/src/components/landing/sections/FeaturesPreviewSection.tsx
apps/web/src/pages/PricingPage.tsx
apps/web/src/pages/FeaturesPage.tsx
apps/web/src/pages/ContactPage.tsx
```

### Understand the project structure
- **Stack**: Vite + React 18 + TypeScript + Tailwind CSS + Convex + Clerk + Framer Motion
- **Web app root**: `apps/web/src/`
- **Pages**: `apps/web/src/pages/` — each page is a default export React component
- **Feature components**: `apps/web/src/components/features/` — organized by domain
- **UI primitives**: `apps/web/src/components/ui/` — BrutalCard, BrutalButton, BrutalModal, BrutalInput, BrutalSelect, BrutalTable, BrutalBadge, BrutalCheckbox, etc.
- **Layout**: `apps/web/src/components/layout/DashboardLayout.tsx` — sidebar + top bar wrapper (DO NOT MODIFY)
- **Build command**: `cd apps/web && pnpm build`
- **Tailwind config**: `apps/web/tailwind.config.js`
- **Global styles**: `apps/web/src/styles/globals.css`

### Route → Page File Mapping
```
/dashboard                              → pages/Dashboard.tsx
/profile                                → pages/MyProfilePage.tsx
/workspaces                             → pages/WorkspacesPage.tsx
/workspace/:workspaceId                 → pages/WorkspaceManagementPage.tsx
/workspace/:id/project/:id              → pages/ProjectManagementPage.tsx
/projects                               → pages/ProjectsPage.tsx
/tasks                                  → pages/TasksPage.tsx
/teams                                  → pages/TeamsPage.tsx
/team                                   → pages/TeamPage.tsx
/sprints                                → pages/SprintPage.tsx
/settings                               → pages/SettingsPage.tsx
/whiteboard                             → pages/WhiteboardPage.tsx
/custom-fields                          → pages/CustomFieldsPage.tsx
/meetings                               → pages/MeetingsPage.tsx
```

---

## Step 1: Analyze the Screenshot

Study the screenshot carefully. For every visible element, evaluate:

1. **Spacing**: Is there too much whitespace? Padding too generous? Gaps too wide?
2. **Typography hierarchy**: Are headings properly sized? Is there clear visual hierarchy? Are labels using monospace uppercase as required?
3. **Information density**: Could more information fit on screen without feeling cramped? (Think Linear, not Notion)
4. **Card structure**: Do cards have proper `border-2 border-[#2E2E35]` borders? Are they using `bg-[#111111]`?
5. **Empty states**: Are empty states well-designed with icon + title + description + action?
6. **Button styling**: Do buttons follow the design system? Primary = white bg, ghost = transparent with border
7. **Color compliance**: Are backgrounds using the 3-tier stack (#050505 → #0A0A0A → #111111)? Is text using the 3-tier hierarchy (#F9FAFB → #9CA3AF → #6B7280)?
8. **Monospace labels**: Are category labels, status badges, and technical text using IBM Plex Mono?
9. **Icons**: Are icons appropriately sized (w-4 h-4 for inline, w-5 h-5 for standalone)?
10. **Alignment**: Is content properly aligned? Left-aligned for content, centered for heroes/CTAs?
11. **Responsive concerns**: Does the layout work for the viewport shown?
12. **Brutalist identity**: Does it feel like a developer tool? Hard edges, no soft shadows, no rounded playfulness?

---

## Step 2: Identify the Page and Its Components

1. **Determine the route** from the screenshot (URL bar or content context)
2. **Read the page file** from the route mapping above
3. **Read every component** that page imports — follow the import tree
4. **Read the UI primitives** used (BrutalCard, BrutalButton, etc.)
5. **Understand the data flow** — what Convex queries/mutations are used? What data is displayed?

**You MUST read every file before changing it.** Never blind-edit.

---

## Step 3: Plan Your Changes

Before writing any code, create a mental checklist of what needs to change. Categories:

### A. Layout Structure
- Page header: should have category label (monospace, uppercase, tracking-wider, #6B7280 or #6366F1) + page title (Inter Bold, text-xl or text-2xl, #F9FAFB) + optional subtitle (text-sm, #6B7280)
- Content area: proper max-width, consistent padding
- Grid layouts: appropriate column counts for the content type
- Section spacing: tight but readable (mb-4 between sections, not mb-8)

### B. Component-Level Fixes
- Cards: `bg-[#111111] border-2 border-[#2E2E35]` with compact padding (p-4 or p-5)
- Tables: monospace font for data, sticky headers, proper row borders (1px #2E2E35)
- Forms: inputs with `bg-[#111111] border-2 border-[#2E2E35]` and focus state `border-[#6366F1]`
- Buttons: proper size hierarchy, primary/ghost/accent variants per design docs
- Badges: `text-[10px] font-mono uppercase tracking-wider` with appropriate border
- Empty states: centered, with icon + title + description + CTA button

### C. Typography Corrections
- Page titles: Inter Bold, text-xl to text-2xl max (not text-3xl+ for app pages)
- Section headers: Inter Bold, text-lg max
- Card titles: Inter Semibold, text-sm to text-base
- Body text: Inter Regular, text-sm, #6B7280 or #9CA3AF
- Labels/tags: IBM Plex Mono, text-xs, uppercase, tracking-wider
- Data values: IBM Plex Mono for numbers, metrics, dates, IDs

### D. Density Targets
Reference these spacing values as your baseline:
```
Page padding:        p-4 (inside DashboardLayout's content area)
Card padding:        p-4 to p-5 (compact)
Card gap:            gap-3 to gap-4
Section margin:      mb-4 to mb-6
Header margin:       mb-3 to mb-4
List item spacing:   space-y-1 to space-y-2
Icon sizes:          w-4 h-4 (inline), w-5 h-5 (standalone), w-6 h-6 (feature icons)
Button padding:      px-3 py-1.5 (sm), px-4 py-2 (md)
Input padding:       px-3 py-2
Badge padding:       px-2 py-0.5
```

---

## Step 4: Design System Compliance Checklist (NON-NEGOTIABLE)

Every change you make MUST pass ALL of these checks:

### Colors
- [ ] Page background: inherits from DashboardLayout (no need to set)
- [ ] Card backgrounds: `bg-[#111111]`
- [ ] Elevated surfaces inside cards: `bg-[#0A0A0A]`
- [ ] Primary text: `text-[#F9FAFB]` — headlines, important values
- [ ] Secondary text: `text-[#9CA3AF]` — body, descriptions
- [ ] Tertiary text: `text-[#6B7280]` — labels, hints, timestamps
- [ ] Accent: `text-[#6366F1]` or `bg-[#6366F1]` — CTAs, active states, focus rings
- [ ] Semantic: Green `#22C55E` (success), Red `#EF4444` (error), Amber `#F59E0B` (warning), Purple `#8B5CF6` (analytics), Cyan `#06B6D4` (planning)
- [ ] NO gradients on elements (only background textures)
- [ ] NO colors used alone for state — always pair with text/icon

### Borders
- [ ] Cards and containers: `border-2 border-[#2E2E35]`
- [ ] Internal dividers: `border border-[#1F1F23]` (1px)
- [ ] Hover state: `border-[#6366F1]` or `border-[#F9FAFB]/20`
- [ ] Table rows: `border-b border-[#2E2E35]/50`
- [ ] NEVER use `border-1` — it's either `border-2` (structural) or `border` (subtle divider)

### Border Radius
- [ ] Cards: 0px (enforced globally in tailwind.config.js — all radii are 0)
- [ ] Everything is 0px — the tailwind config overrides all border-radius values to 0
- [ ] Do NOT add rounded-* classes — they will have no effect and are misleading

### Shadows
- [ ] Primary buttons: `shadow-brutal` (5px 5px 0px #000000) — ONLY on primary CTAs
- [ ] Hover: `shadow-brutal-sm` (3px 3px 0px) with translateY(-2px)
- [ ] Most elements: NO shadow — depth comes from background color tiers
- [ ] NEVER use blur shadows (drop-shadow, shadow-lg, etc.)

### Typography
- [ ] Prose text: `font-['Inter',sans-serif]` (or just default — Inter is the base font)
- [ ] Technical text: `font-mono` (maps to IBM Plex Mono in tailwind config)
- [ ] Category labels: `text-xs font-mono font-semibold uppercase tracking-wider`
- [ ] NO `font-bold` on body copy
- [ ] Headlines use `tracking-tight` when above text-2xl
- [ ] Monospace labels use `tracking-wider` or `tracking-widest`

### Motion
- [ ] Entrance: `initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}`
- [ ] Scroll-triggered: `whileInView` with `viewport={{ once: true }}`
- [ ] Staggered children: `staggerChildren: 0.06` to `0.1`
- [ ] Card hover: border color change + `y: -2` lift
- [ ] NO springs on content, NO infinite loops (except cursors), NO bouncing
- [ ] Use Framer Motion (`motion` from 'framer-motion'), not CSS animations

---

## Step 5: Execute Changes

### Rules of Engagement
1. **Read before write** — always read a file before editing it
2. **Preserve all functionality** — do NOT change business logic, data fetching, state management, event handlers, or routing. Only change JSX structure and className strings.
3. **Preserve all Convex queries/mutations** — do NOT modify any `useQuery`, `useMutation`, `useAction` calls or their arguments
4. **Preserve all Clerk auth** — do NOT modify authentication logic
5. **Use existing UI primitives** — prefer BrutalCard, BrutalButton, BrutalModal, BrutalInput, BrutalSelect, BrutalTable, BrutalBadge over raw HTML where appropriate
6. **Import paths** — use direct imports (no barrel files). Example: `import BrutalCard from '../ui/BrutalCard'`
7. **Do NOT create new files** unless absolutely necessary (e.g., extracting a large inline component)
8. **Do NOT modify DashboardLayout.tsx** — it's the shared shell and is already done
9. **Do NOT modify any file in `components/ui/`** — these are shared primitives, treat them as a library
10. **Do NOT modify Convex backend files** (`convex/` directory)

### What You CAN Change
- JSX structure and ordering within the page file
- className strings (Tailwind classes)
- Component composition (wrapping elements, adding containers)
- Inline styles for specific design needs (e.g., grid templates)
- Import statements (to add/use UI primitives)
- Static text/labels if they're clearly wrong or missing
- Feature component files that are imported by your page (in `components/features/`)

### What You CANNOT Change
- Convex queries, mutations, actions, or their arguments
- React hooks logic (useState, useEffect, useMemo, useCallback)
- Event handler logic (onClick, onSubmit, etc.)
- Router logic (useNavigate, useParams, useLocation)
- Clerk auth logic
- TypeScript interfaces/types
- Any file in `components/ui/` (shared primitives)
- Any file in `convex/` (backend)
- `DashboardLayout.tsx`
- `App.tsx`
- `tailwind.config.js`

---

## Step 6: Visual Patterns to Emulate

Study these patterns from the landing pages and apply them to app pages:

### Page Header Pattern (from FeaturesPreviewSection)
```tsx
<div className="mb-4">
  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#6B7280] inline-block mb-2">
    {/* CATEGORY LABEL */}
  </span>
  <h1 className="text-xl font-bold tracking-tight text-[#F9FAFB]">
    {/* Page Title */}
  </h1>
  <p className="text-sm text-[#6B7280] mt-1">
    {/* Optional subtitle */}
  </p>
</div>
```

### Card Pattern (from PricingPage tier cards)
```tsx
<div className="bg-[#111111] border-2 border-[#2E2E35] p-4">
  <div className="flex items-center justify-between mb-3">
    <span className="text-xs font-mono text-[#6B7280] uppercase tracking-wider">
      {/* Card label */}
    </span>
    {/* Optional badge */}
  </div>
  <h3 className="text-sm font-bold text-[#F9FAFB] mb-1">{/* Title */}</h3>
  <p className="text-xs text-[#6B7280]">{/* Description */}</p>
</div>
```

### Data Row Pattern (from comparison table)
```tsx
<div className="grid grid-cols-4 gap-3 py-2 border-b border-[#2E2E35]/50 text-xs font-mono">
  <div className="text-[#9CA3AF]">{/* label */}</div>
  <div className="text-[#F9FAFB]">{/* value */}</div>
</div>
```

### Stat Card Pattern
```tsx
<div className="bg-[#111111] border-2 border-[#2E2E35] p-4">
  <span className="text-xs font-mono text-[#6B7280] uppercase tracking-wider">
    {/* Stat label */}
  </span>
  <div className="text-2xl font-bold font-mono text-[#F9FAFB] mt-1">
    {/* Value */}
  </div>
</div>
```

### Action Bar Pattern (top of page, right-aligned actions)
```tsx
<div className="flex items-center justify-between mb-4">
  <div>
    {/* Page header (label + title) */}
  </div>
  <div className="flex items-center gap-2">
    {/* Action buttons */}
  </div>
</div>
```

### Empty State Pattern
```tsx
<div className="border-2 border-[#2E2E35] border-dashed p-8 text-center">
  <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border-2 border-[#2E2E35] text-[#6B7280]">
    {/* Icon */}
  </div>
  <h3 className="text-sm font-bold text-[#F9FAFB] mb-1">{/* Title */}</h3>
  <p className="text-xs text-[#6B7280] mb-4 max-w-sm mx-auto">{/* Description */}</p>
  <button className="px-4 py-2 bg-[#6366F1] text-white text-xs font-semibold border-2 border-[#4F46E5]">
    {/* CTA */}
  </button>
</div>
```

### Tab Navigation Pattern
```tsx
<div className="flex items-center gap-0 border-b-2 border-[#2E2E35] mb-4">
  {tabs.map(tab => (
    <button
      key={tab.id}
      className={`px-4 py-2 text-xs font-mono uppercase tracking-wider border-b-2 -mb-[2px] transition-colors ${
        active === tab.id
          ? 'text-[#F9FAFB] border-[#6366F1]'
          : 'text-[#6B7280] border-transparent hover:text-[#9CA3AF]'
      }`}
    >
      {tab.label}
    </button>
  ))}
</div>
```

### Filter/Search Bar Pattern
```tsx
<div className="flex items-center gap-2 mb-4">
  <div className="flex-1 relative">
    <input
      type="text"
      placeholder="Search..."
      className="w-full bg-[#111111] border-2 border-[#2E2E35] px-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] focus:border-[#6366F1] focus:outline-none font-mono"
    />
  </div>
  <select className="bg-[#111111] border-2 border-[#2E2E35] px-3 py-2 text-xs font-mono text-[#9CA3AF] focus:border-[#6366F1] focus:outline-none">
    <option>All</option>
  </select>
</div>
```

---

## Step 7: Build Verification

After ALL changes are complete:

```bash
cd /home/aansh/LTF1/iceberg-L/apps/web && pnpm build
```

If the build fails:
1. Read the error message carefully
2. Fix TypeScript errors (usually className typos or missing imports)
3. Do NOT change business logic to fix build errors
4. Re-run build until clean

**Do NOT commit.** The user will review and commit manually.

---

## Step 8: Self-Audit Checklist

Before declaring done, verify every item:

- [ ] All text colors use the 3-tier hierarchy (#F9FAFB / #9CA3AF / #6B7280)
- [ ] All cards use `bg-[#111111] border-2 border-[#2E2E35]`
- [ ] All labels use `font-mono text-xs uppercase tracking-wider`
- [ ] No rounded corners visible (tailwind config enforces this but check for inline styles)
- [ ] No blur shadows anywhere
- [ ] No gradients on elements
- [ ] Spacing is compact and Linear-like (p-4, gap-3, mb-4 as maximums for most elements)
- [ ] Icons are consistently sized (w-4 h-4 or w-5 h-5)
- [ ] Empty states are well-designed
- [ ] Page header follows the label + title pattern
- [ ] Framer Motion used for entrances (not CSS transitions for content appearance)
- [ ] All functionality preserved (click every interactive element mentally)
- [ ] Build passes clean
- [ ] NO files modified outside your page's scope

---

## Critical Reminders

1. **The screenshot is your brief.** Every visual problem you see must be fixed.
2. **The design docs are the law.** When in doubt, follow `docs_design/`.
3. **The landing pages are the target quality.** Your app page should feel like it belongs alongside them.
4. **Functionality over aesthetics.** If you're unsure whether a change will break something, don't make it. Visual-only changes.
5. **Read before write.** Always. No exceptions.
6. **Compact, not cramped.** Linear-like density means information-rich, not claustrophobic. Leave breathing room between logical sections, but eliminate wasteful whitespace within them.
7. **You own your page and its direct feature components.** Do NOT modify shared UI primitives, the layout shell, or other pages.
