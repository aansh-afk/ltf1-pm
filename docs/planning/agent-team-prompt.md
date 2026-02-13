# Claude Code Agent Team Prompt - Iceberg PM MVP Ship

## OVERVIEW

Ship the Iceberg PM MVP by restructuring the app and completely redesigning all marketing pages. This is a Vite + React 18 + Convex + Clerk monorepo at `/home/aansh/LTF1/iceberg-L`.

**Positioning**: "Linear's speed + GitHub Copilot's code awareness + Open Source trust"
**Strategy**: KILL features that compete with existing tools (Slack, Zoom). KEEP features that differentiate (PR-driven updates, code-aware estimation, git velocity, whiteboard, cross-platform).

---

## SHARED DESIGN SPECIFICATION (ALL MARKETING AGENTS MUST FOLLOW)

The marketing pages are being redesigned **from top to bottom** - every single element from the header/navigation through all content sections to the footer. Moving from raw brutalist/terminal aesthetic to a **polished neo-brutalism** inspired by Linear.app and Vercel.com. Nothing is left untouched except the ParticleField footer animation (which gets restyled, not removed).

**Design References**: neobrutalism.dev (shadcn/ui architecture with bold colors, thick borders, hard shadows)

### Color Palette (use Tailwind arbitrary values like `bg-[#111111]`)
```
Background:       #050505  (near black, like Vercel)
Surface:          #111111  (cards, elevated sections)
Surface-elevated: #1A1A1A  (hover states, overlays)
Surface-muted:    #0A0A0A  (alternate section bg)

Primary:          #6366F1  (indigo - buttons, links, accents)
Primary-hover:    #4F46E5  (darker indigo)
Accent:           #10B981  (emerald - success, CTAs)
Accent-hover:     #059669  (darker emerald)

Text-primary:     #F9FAFB  (near white)
Text-secondary:   #9CA3AF  (gray-400)
Text-muted:       #6B7280  (gray-500)

Border-default:   #1F1F23  (very subtle)
Border-strong:    #2E2E35  (cards, separators)
Border-accent:    #6366F1  (active states)

Glow:             rgba(99, 102, 241, 0.15)  (primary glow for hover effects)
```

### Typography
- **Headings**: `font-['Inter',sans-serif]` - bold, tracking-tight, NORMAL CASE (not all uppercase)
- **Body**: `font-['Inter',sans-serif]` - regular weight
- **Code/accents**: `font-['IBM_Plex_Mono',monospace]` - for code blocks, terminal demos, labels/badges ONLY
- **DO NOT** use all-uppercase for headings or body text. Only for small labels, badges, and category tags.
- **Add Inter to index.html** alongside IBM Plex Mono: `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">`

### Neo-Brutalism Elements
- **Borders**: 2px solid, use `border-[#2E2E35]`
- **Border radius**: `rounded-xl` (12px) for cards, `rounded-lg` (8px) for buttons/inputs
- **Hard shadows**: `shadow-[4px_4px_0px_rgba(0,0,0,0.5)]` for cards
- **Hover shadows**: `hover:shadow-[6px_6px_0px_rgba(99,102,241,0.3)] hover:-translate-y-0.5`
- **Transitions**: `transition-all duration-300 ease-out` (smooth, not instant)

### Component Patterns
```
Card:     bg-[#111111] border-2 border-[#2E2E35] rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,0.5)] p-6
Button:   bg-[#6366F1] hover:bg-[#4F46E5] text-white font-semibold rounded-lg px-6 py-3 border-2 border-[#4F46E5] shadow-[3px_3px_0px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all duration-300
Ghost:    border-2 border-[#2E2E35] hover:border-[#6366F1] bg-transparent hover:bg-[#111111] rounded-lg
Badge:    bg-[#6366F1]/10 text-[#6366F1] text-xs font-mono font-semibold uppercase tracking-wider px-3 py-1 rounded-md border border-[#6366F1]/20
Section:  py-24 md:py-32 (generous vertical spacing)
Container: max-w-6xl mx-auto px-6
```

### Animation Guidelines
- Use framer-motion for scroll reveals (`initial={{ opacity: 0, y: 20 }}` `whileInView={{ opacity: 1, y: 0 }}`)
- Stagger children: `transition={{ delay: index * 0.1 }}`
- `viewport={{ once: true }}` to animate only once
- NO glitch, scanline, CRT, or terminal typing animations
- Subtle gradient backgrounds or mesh patterns instead of ASCII noise
- Keep ParticleConstellation ONLY if the section specifically calls for it, otherwise remove

### What NOT to Change
- DO NOT modify `tailwind.config.js` (use Tailwind arbitrary values instead)
- DO NOT modify `globals.css` or `themeVariables.css`
- DO NOT modify any app dashboard components
- KEEP all Convex backend integrations (waitlist stats, newsletter signup)
- KEEP framer-motion as the animation library

---

## CRITICAL RULES FOR ALL TEAMMATES:
1. **NO FILE CONFLICTS** - Each teammate owns specific files. NEVER edit files assigned to another teammate.
2. **BUILD VERIFICATION** - After ALL tasks, run `cd /home/aansh/LTF1/iceberg-L/apps/web && pnpm build` to verify zero errors.
3. **CONVEX VERIFICATION** - After ANY convex file change, run `cd /home/aansh/LTF1/iceberg-L && npx convex dev --once` to verify.
4. **READ BEFORE EDIT** - Always read the full file before making ANY changes.
5. **REPORT BLOCKERS** - If stuck, message the lead immediately with specifics.
6. **MINIMAL NON-MARKETING CHANGES** - For agents 1, 2, 4: only make the exact changes listed. For marketing agents 3, 5, 6, 7: full creative freedom within the design spec.
7. **USE CONVEX RULES** - Read `/home/aansh/LTF1/iceberg-L/convex_rules.txt` if you get Convex errors.
8. **FOLLOW DESIGN SPEC** - All marketing agents MUST use the shared design specification above for consistency.

---

## TEAMMATE 1: "security-backend" - Convex Security Hardening
**Model:** Opus

**Owned Files:**
- `convex/admin/one_off_cleanup.ts`
- `convex/admin/clearOldActivities.ts`
- `convex/migrations.ts`
- `convex/migrations/migrateToMultipleAssignees.ts`
- `convex/workspaces/mutations.ts` (ONLY the `clearOldActivities` export around line 455)

**Tasks:**

### Task 1: Convert admin/one_off_cleanup.ts
Change `clearGitHubData` from `mutation` to `internalMutation`. Change the import accordingly.

### Task 2: Convert admin/clearOldActivities.ts
Change `clearOldActivities` from `mutation` to `internalMutation`.

### Task 3: Convert migrations.ts
Change `migrateExistingUsersToActive` from `mutation` to `internalMutation`.

### Task 4: Convert migrations/migrateToMultipleAssignees.ts
Change BOTH `migrateTasksToMultipleAssignees` AND `cleanupDeprecatedAssigneeId` from `mutation` to `internalMutation`.

### Task 5: Convert clearOldActivities in workspaces/mutations.ts
Add `internalMutation` to the imports (keep existing `mutation` import). Change ONLY the `clearOldActivities` function (around line 455) to `internalMutation`. Do NOT touch any other function.

### Task 6: Verify
Run `npx convex dev --once` and fix any errors.

**Success Criteria:**
- All 6 mutations → `internalMutation`
- `npx convex dev --once` passes

---

## TEAMMATE 2: "frontend-restructure" - Navigation, Routes & Error Boundary
**Model:** Opus

**Owned Files:**
- `apps/web/src/App.tsx` (EXCLUSIVE)
- `apps/web/src/components/layout/DashboardLayout.tsx` (EXCLUSIVE)
- `apps/web/src/components/common/ErrorBoundary.tsx` (NEW FILE)

**Tasks:**

### Task 1: Create ErrorBoundary component
Create `apps/web/src/components/common/ErrorBoundary.tsx`:

```tsx
import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a', color: '#e0e0e0', fontFamily: 'monospace', padding: '2rem' }}>
          <div style={{ maxWidth: '600px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '1rem' }}>
              SOMETHING WENT WRONG
            </h1>
            <p style={{ marginBottom: '1.5rem', opacity: 0.7 }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button onClick={() => window.location.reload()} style={{ padding: '0.75rem 2rem', border: '2px solid currentColor', background: 'transparent', color: 'inherit', fontFamily: 'monospace', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 'bold' }}>
              RELOAD PAGE
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
```

### Task 2: Prune NAV_ITEMS in DashboardLayout.tsx
Replace the NAV_ITEMS array with exactly 9 items:

```typescript
const NAV_ITEMS = [
  { path: '/dashboard', label: 'DASHBOARD', icon: HiOutlineHome },
  { path: '/profile', label: 'MY PROFILE', icon: HiOutlineUser },
  { path: '/workspaces', label: 'WORKSPACES', icon: HiOutlineBriefcase },
  { path: '/projects', label: 'PROJECTS', icon: HiOutlineFolder },
  { path: '/tasks', label: 'TASKS', icon: HiOutlineClipboardList },
  { path: '/team', label: 'TEAM', icon: HiOutlineUserGroup },
  { path: '/sprints', label: 'SPRINTS', icon: HiOutlineRefresh },
  { path: '/whiteboard', label: 'WHITEBOARD', icon: HiOutlinePencilAlt },
  { path: '/settings', label: 'SETTINGS', icon: HiOutlineCog },
]
```

Add `HiOutlineRefresh` to the react-icons/hi import. Remove Meetings and Slack entries. Keep Whiteboard.

### Task 3: Remove killed routes and imports from App.tsx
**Remove these lazy imports:**
```
MeetingsPage, AutomationPage, VideoPage, SlackPage, TestCheckbox, TestAI
```
**Remove BlogPage eager import.**

**Remove these routes:**
```
/blog, meetings, automation, video, video/:meetingId, slack, test-checkbox, test-ai
```
**Keep whiteboard route. Keep both /team and /teams routes.** Remove duplicate tasks route (line 224).

### Task 4: Wrap App in ErrorBoundary
```typescript
import ErrorBoundary from './components/common/ErrorBoundary'
// Wrap: <ErrorBoundary>...<OptionalConvexProvider>...</ErrorBoundary>
```

### Task 5: Verify
Run `pnpm build` and fix any errors.

**Success Criteria:**
- 9 NAV_ITEMS
- Killed routes removed (whiteboard KEPT)
- ErrorBoundary wraps app
- `pnpm build` passes

---

## TEAMMATE 3: "marketing-chrome" - Shared Navigation, Footer & Fonts
**Model:** Opus
**Use daisy-ui-theme-expert approach**: Research existing code before changes. Follow the SHARED DESIGN SPECIFICATION above.

**Owned Files:**
- `apps/web/index.html` (ONLY add Inter font link)
- `apps/web/src/components/common/PublicNavigation.tsx` (FULL REDESIGN)
- `apps/web/src/components/common/Footer.tsx` (FULL REDESIGN)
- `apps/web/src/components/landing/WaitlistForm.tsx` (FULL REDESIGN)

**Tasks:**

### Task 1: Add Inter font to index.html
Add Inter font alongside existing IBM Plex Mono. Replace the current Google Fonts link:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Task 2: Redesign PublicNavigation.tsx
Complete rewrite. Create a clean, modern fixed navbar inspired by Linear/Vercel:

**Requirements:**
- Fixed top, transparent initially, `bg-[#050505]/80 backdrop-blur-xl` on scroll
- Left: ICEBERG logo/wordmark in bold Inter font (link to /)
- Right (desktop): Features (#features), Pricing (/pricing), Contact (/contact) links + Sign In (/sign-in) ghost button + Get Started (/sign-up) primary button
- NO blog link
- Mobile: Hamburger menu with slide-in panel
- Smooth scroll handling for hash links
- Clean, minimal - no terminal/ASCII aesthetics
- Use colors from the shared design spec (text-[#9CA3AF] for links, hover:text-[#F9FAFB])
- Border-bottom: `border-b border-[#1F1F23]` on scroll

### Task 3: Redesign Footer.tsx
Complete rewrite. Modern footer inspired by Linear/Vercel:

**Requirements:**
- Dark background `bg-[#050505]` with subtle top border
- Grid layout: 4 columns (Product, Company, Developers, Legal)
- Product links: Dashboard, Tasks, Projects, Sprints, Teams, Whiteboard
- Company links: Pricing, Contact, Blog (removed), About (link to /)
- Developers links: GitHub, Documentation (link to /), CLI (link to /)
- Legal links: Privacy, Terms, AGPL License
- NO blog link, NO Enterprise references, NO Chat/Video/Meetings/Automation/Slack
- Bottom bar: Copyright 2026 Iceberg PM + social icons (GitHub, Twitter/X, Discord)
- Contact email: Aansh.Naidu@vividverseglobal.com
- **KEEP the ParticleField/X-wing flyby animation** - it is the one visual element the user explicitly wants preserved. Restyle it to match the new design (update particle colors to use `#6366F1` indigo and `#9CA3AF` gray tones instead of the old brutalist palette, keep the canvas-based particle field and the X-wing ASCII flyby on its 30-40s interval)
- Inter font for text, clean spacing

### Task 4: Redesign WaitlistForm.tsx
Redesign the waitlist email signup form:

**Requirements:**
- Keep Convex integration (`useMutation(api.waitlist.subscribeToNewsletter)`)
- Keep `source` prop and `compact` variant
- Clean design: rounded input + button side by side
- Input: `bg-[#111111] border-2 border-[#2E2E35] rounded-lg` placeholder "Enter your email"
- Button: Primary style from design spec
- Success state: Green checkmark + "You're on the list!"
- Error handling with toast
- Inter font

### Task 5: Verify
Run `pnpm build` and fix any errors.

**Success Criteria:**
- Inter font loads alongside IBM Plex Mono
- PublicNavigation is clean, modern, no blog link
- Footer has correct links, no killed features, copyright 2026, ParticleField animation preserved
- WaitlistForm keeps Convex integration, looks modern
- `pnpm build` passes

---

## TEAMMATE 4: "search-performance" - Search Index & Query Optimization
**Model:** Opus

**Owned Files:**
- `convex/search.ts` (EXCLUSIVE)
- `convex/schema.ts` (ONLY adding search indexes)

**Tasks:**

### Task 1: Add search indexes to schema.ts
Add `.searchIndex()` calls to tasks, projects, sprints, and users tables. Do NOT modify any existing definitions.

```typescript
// tasks table - ADD:
.searchIndex("search_title", { searchField: "title", filterFields: ["projectId", "status"] })

// projects table - ADD:
.searchIndex("search_name", { searchField: "name", filterFields: ["workspaceId", "status"] })

// sprints table - ADD:
.searchIndex("search_name", { searchField: "name", filterFields: ["projectId", "status"] })

// users table - ADD:
.searchIndex("search_email", { searchField: "email" })
```

### Task 2: Rewrite search.ts
Replace ALL three queries (globalSearch, quickSearch, searchSuggestions) to use `withSearchIndex` instead of `.collect()`. Remove meeting search entirely (remove meeting type from return validator too). Use `Promise.all` for parallel queries. See the complete implementation in the previous version of this prompt (the code is identical - refer to convex/search.ts rewrite section).

### Task 3: Verify
Run `npx convex dev --once` and `pnpm build`.

**Success Criteria:**
- 4 search indexes added
- No `.collect()` in search.ts
- No meeting search
- Both `npx convex dev --once` and `pnpm build` pass

---

## TEAMMATE 5: "landing-hero" - Landing Page Top Sections
**Model:** Opus
**Use daisy-ui-theme-expert approach**: Follow the SHARED DESIGN SPECIFICATION above.

**Owned Files:**
- `apps/web/src/pages/LandingPage.tsx` (EXCLUSIVE)
- `apps/web/src/components/landing/sections/HeroSection.tsx` (FULL REDESIGN)
- `apps/web/src/components/landing/sections/ProblemSection.tsx` (FULL REDESIGN)
- `apps/web/src/components/landing/sections/HowItWorksSection.tsx` (FULL REDESIGN)
- `apps/web/src/components/landing/ascii/HeroTerminal.tsx` (REDESIGN into clean code demo)
- `apps/web/src/components/landing/ascii/AsciiNoise.tsx` (can be replaced or removed)
- `apps/web/src/components/landing/ascii/ParticleConstellation.tsx` (can be replaced or removed)
- `apps/web/src/components/landing/ascii/AnimatedAscii.tsx` (can be replaced or removed)
- `apps/web/src/components/landing/ascii/StreamingGitLog.tsx` (can be replaced or removed)

**Tasks:**

### Task 1: Update LandingPage.tsx
Keep the same composition structure but ensure it imports from the correct redesigned sections. The page should have:
```tsx
<div className="min-h-screen bg-[#050505]">
  <PublicNavigation />
  <HeroSection />
  <ProblemSection />
  <HowItWorksSection />
  <CoreFeaturesSection />        // Owned by Agent 6
  <SecondaryFeaturesSection />   // Owned by Agent 6
  <PricingPreviewSection />      // Owned by Agent 6
  <FinalCTASection />            // Owned by Agent 6
  <Footer />
</div>
```

### Task 2: Redesign HeroSection.tsx
The hero is the first thing visitors see. Make it stunning.

**Requirements:**
- Full viewport height (`min-h-screen`)
- Subtle background: gradient mesh or very faint grid pattern (NO ASCII noise)
- Top badge: `font-mono text-xs uppercase tracking-wider` - "DEVELOPER-FIRST PROJECT MANAGEMENT"
- Headline (Inter, font-extrabold, text-5xl md:text-7xl, tracking-tight):
  **"Your repo is the source of truth"**
- Subheadline (text-xl, text-[#9CA3AF], max-w-2xl):
  "Tasks update themselves when you push code. Story points estimated from your diff. Velocity measured from actual shipping data."
- Two CTAs:
  - Primary: "Get Started Free" → /sign-up
  - Ghost: "See How It Works" → scroll to #how-it-works
- Below CTAs: Redesigned HeroTerminal showing the git workflow demo
- Scroll indicator at bottom

### Task 3: Redesign HeroTerminal.tsx
Transform from raw ASCII terminal into a polished code demo widget:

**Requirements:**
- Keep the concept: Left panel shows dev typing git commands, right panel shows LTF1 engine auto-updating tasks
- New design: Two side-by-side cards with `bg-[#111111] border-2 border-[#2E2E35] rounded-xl`
- Headers: Left "DEVELOPER" + green dot, Right "LTF1 ENGINE" + indigo dot
- Font: IBM Plex Mono (monospace for code content)
- Keep the typing animation but make it smoother
- Keep IntersectionObserver trigger
- Keep reduced-motion support
- Colors: White for commands, `text-[#6366F1]` for engine output, `text-[#10B981]` for success
- NO scan lines or CRT effects

### Task 4: Redesign ProblemSection.tsx
**Requirements:**
- Keep the "Without / With LTF1" toggle concept - it's effective
- Redesign as two comparison cards with clean styling
- "Without" card: Red-tinted border, steps shown as a flow
- "With" card: Green-tinted border, dramatically fewer steps
- Toggle switch: Clean pill switch (not terminal-style)
- Use motion animations for the switch between states
- Section heading: "Stop updating tickets manually"
- Subtitle: "Your git workflow is your project management workflow"

### Task 5: Redesign HowItWorksSection.tsx
**Requirements:**
- 4 steps in a horizontal flow (vertical on mobile)
- Each step is a card with an icon/number, title, and description
- Steps: COMMIT → TASK CREATED, PR → TASK LINKED, MERGE → TASK CLOSED, GIT LOG → VELOCITY
- Connecting lines/arrows between steps (CSS borders or SVG)
- Section heading: "How it works"
- Subtle background differentiation from hero
- Use motion for staggered reveal on scroll

### Task 6: Handle ASCII components
- Replace AsciiNoise usage with a CSS gradient or remove entirely
- ParticleConstellation: Remove from sections. If you want subtle visual interest, use a CSS gradient mesh instead
- AnimatedAscii, StreamingGitLog: These can be left as-is (unused) or emptied to simple no-op exports to avoid breaking any remaining imports

### Task 7: Verify
Run `pnpm build` and fix any errors. Make sure no imports are broken.

**Success Criteria:**
- Hero section looks like Linear/Vercel quality
- Problem section toggle works smoothly
- HowItWorks shows clear 4-step flow
- HeroTerminal still animates the git workflow but looks polished
- No broken imports
- `pnpm build` passes

---

## TEAMMATE 6: "landing-features-cta" - Landing Page Bottom Sections
**Model:** Opus
**Use daisy-ui-theme-expert approach**: Follow the SHARED DESIGN SPECIFICATION above.

**Owned Files:**
- `apps/web/src/components/landing/sections/CoreFeaturesSection.tsx` (FULL REDESIGN)
- `apps/web/src/components/landing/sections/SecondaryFeaturesSection.tsx` (FULL REDESIGN)
- `apps/web/src/components/landing/sections/PricingPreviewSection.tsx` (FULL REDESIGN)
- `apps/web/src/components/landing/sections/FinalCTASection.tsx` (FULL REDESIGN)

**Tasks:**

### Task 1: Redesign CoreFeaturesSection.tsx
This is the main features showcase. Currently uses a 700vh sticky scroll mechanism.

**Requirements:**
- Replace sticky scroll with a clean feature grid or bento grid layout
- 7 features (keep the same content but update copy style):
  1. **PR-Driven Updates** - "Tasks update themselves when you open, review, or merge pull requests."
  2. **Code Complexity Estimates** - "AI analyzes your diff to estimate story points. No more planning poker."
  3. **Tech Debt Surfacing** - "Automatically flags growing complexity, missing tests, and architectural drift."
  4. **Git-Based Velocity** - "Velocity from actual shipping data. Commits, PRs, and deploys."
  5. **Cross Platform** - "GitHub, GitLab, Bitbucket. Slack, Discord, Teams. One tool, every platform."
  6. **Terminal-First** - "Full TUI for managing projects without leaving your terminal."
  7. **Open Source** - "Fully open source under AGPL. Self-host it, audit it, fork it."
- **IMPORTANT**: Feature 7 (Open Source) detail must say `'AGPL LICENSE'` (not "MODIFIED MIT LICENSE")
- Each feature as a card in a 2-col or 3-col bento grid
- Feature cards: icon/number + title + description
- Use the Card component pattern from design spec
- Staggered scroll reveal animations

### Task 2: Redesign SecondaryFeaturesSection.tsx
**Requirements:**
- 5 items in a responsive grid:
  ```
  SPRINT PLANNING - AI-assisted sprint creation from your backlog
  TEAM MANAGEMENT - Workload visibility and capacity planning
  WHITEBOARD - Real-time collaborative diagramming and brainstorming
  CUSTOM FIELDS - Extend any entity with your own fields and types
  MULTI-PLATFORM - GitHub, GitLab, Bitbucket. Web + CLI + TUI
  ```
- Section heading: "Everything else you need"
- Clean card grid (3 cols desktop, 1 col mobile)
- Simpler cards than CoreFeatures (just title + short description)
- NO horizontal scroll - use responsive grid

### Task 3: Redesign PricingPreviewSection.tsx
**Requirements:**
- Show 2 tiers (matching the full pricing page):
  - **Open Source**: $0 forever, key features (unlimited projects, Git integration, 100 AI credits, CLI access)
  - **Pro**: $12/user/month - "Coming Soon" badge, key features (unlimited members, priority support, advanced analytics, SSO)
- CTA: "View full pricing" → /pricing
- Clean card layout, side by side on desktop
- Pro card has subtle `border-[#6366F1]` accent
- Inter font, NOT uppercase for feature lists

### Task 4: Redesign FinalCTASection.tsx
**Requirements:**
- Keep Convex integration (`useQuery(api.waitlist.getWaitlistStats)`)
- Bold heading: "Ready to ship faster?"
- Subheading: "Join X developers already on the waitlist" (X from Convex query)
- WaitlistForm component (imported from landing/WaitlistForm.tsx - redesigned by Agent 3)
- Clean background, maybe subtle gradient
- Social proof: GitHub stars badge or similar (optional)
- Simple, impactful. Not cluttered.

### Task 5: Verify
Run `pnpm build` and fix any errors.

**Success Criteria:**
- CoreFeatures shows 7 features in clean grid, AGPL license
- SecondaryFeatures has 5 items (WHITEBOARD stays, no AUTOMATION)
- PricingPreview shows 2 tiers
- FinalCTA keeps Convex waitlist integration
- `pnpm build` passes

---

## TEAMMATE 7: "marketing-pages" - Pricing, Contact & ComingSoon Pages
**Model:** Opus
**Use daisy-ui-theme-expert approach**: Follow the SHARED DESIGN SPECIFICATION above.

**Owned Files:**
- `apps/web/src/pages/PricingPage.tsx` (FULL REDESIGN)
- `apps/web/src/pages/ContactPage.tsx` (FULL REDESIGN)
- `apps/web/src/pages/ComingSoonPage.tsx` (FULL REDESIGN)

**Tasks:**

### Task 1: Redesign PricingPage.tsx
Complete rewrite. Clean 2-tier pricing page.

**Requirements:**
- Page header: "Simple, transparent pricing" (Inter, large)
- Subtitle: "Start free, scale when you're ready"
- 2 tiers side by side (stacked on mobile):

**OPEN SOURCE** (Free forever):
- Price: $0 / FREE FOREVER
- Features:
  - Unlimited projects
  - Up to 5 team members
  - Full Git integration (GitHub, GitLab, Bitbucket)
  - PR-driven task updates
  - Sprint management
  - Whiteboard collaboration
  - 100 AI credits/month
  - CLI + TUI access
  - Community support
  - AGPL licensed - self-host anywhere
- CTA: "Get Started" → /sign-up (primary button)

**PRO** (For scaling teams):
- Price: $12/user/month
- "COMING SOON" badge (indigo badge at top)
- "EARLY ACCESS" label
- Features:
  - Everything in Open Source
  - Unlimited team members
  - Priority support (48h SLA)
  - Advanced analytics & velocity tracking
  - Custom integrations & webhooks
  - BYOK (Bring Your Own Key) AI
  - SSO / SAML
  - Audit logs
  - Data retention controls
- CTA: "Join Waitlist" → disabled button (cursor-not-allowed, opacity-50)
- Card has subtle `border-[#6366F1]` accent

**Remove entirely:**
- STARTUP, SCALE, ENTERPRISE tiers
- ROI calculator
- AI Operations explainer
- FAQ section (or keep a simplified version with 3-4 questions)

- Keep PublicNavigation and Footer imports
- Use Inter font throughout
- Clean, generous whitespace

### Task 2: Redesign ContactPage.tsx
Complete rewrite with working mailto form.

**Requirements:**
- Page header: "Get in touch"
- Subtitle: "Have questions? We'd love to hear from you."
- Form (left side):
  - Name, Email, Company (optional), Subject dropdown (General, Sales, Support, Partnership), Message textarea
  - Submit: Opens `mailto:Aansh.Naidu@vividverseglobal.com` with form data
  - Remove fake setTimeout submit
  - Remove isSubmitting/submitStatus states
  - Button always enabled
- Contact info (right side, 2-3 cards):
  - Email: Aansh.Naidu@vividverseglobal.com
  - GitHub: Link to repo
  - Discord: Community link
- NO phone number, NO enterprise section, NO Slack references
- Keep PublicNavigation and Footer
- Clean design following the spec

### Task 3: Redesign ComingSoonPage.tsx
Redesign the waitlist/coming-soon page.

**Requirements:**
- Keep ALL Convex integrations:
  - `useQuery(api.waitlist.getWaitlistStats)` for stats
  - `useMutation(api.waitlist.addToWishlist)` for hype tracking
- Keep recharts for the waitlist growth graph (but restyle it)
- Clean design: centered layout, bold heading "We're building something special"
- Show waitlist count prominently
- WaitlistForm for email signup
- Waitlist growth graph with clean styling (use indigo for the area color)
- "Hype" button: Keep the fingerprint-based interaction but restyle
- Status indicators: Clean badges instead of terminal-style
- Keep PublicNavigation and Footer

### Task 4: Verify
Run `pnpm build` and fix any errors.

**Success Criteria:**
- PricingPage: 2 tiers, Pro is "Coming Soon"
- ContactPage: mailto form works, no fake submit
- ComingSoonPage: Convex integrations preserved, clean design
- `pnpm build` passes

---

## EXECUTION ORDER

All 7 teammates work in parallel. The ONLY soft dependency is that marketing agents (3, 5, 6, 7) should all follow the shared design spec for consistency.

1. **security-backend**: Convex mutations only
2. **frontend-restructure**: App.tsx + DashboardLayout only
3. **marketing-chrome**: Nav, Footer, WaitlistForm, fonts
4. **search-performance**: convex/search.ts + schema.ts
5. **landing-hero**: Landing top sections + ASCII components
6. **landing-features-cta**: Landing bottom sections
7. **marketing-pages**: Pricing, Contact, ComingSoon

**After all complete**, the lead should run:
```bash
cd /home/aansh/LTF1/iceberg-L && npx convex dev --once && cd apps/web && pnpm build
```

---

## FINAL VALIDATION CHECKLIST

### Backend
- [ ] All admin/migration mutations → internalMutation
- [ ] `npx convex dev --once` passes
- [ ] 4 search indexes added to schema.ts
- [ ] No `.collect()` in search.ts
- [ ] No meeting search in globalSearch

### App Structure
- [ ] NAV_ITEMS has 9 entries (Dashboard, Profile, Workspaces, Projects, Tasks, Team, Sprints, Whiteboard, Settings)
- [ ] Killed routes removed (meetings, automation, video, slack, test-*, blog) - whiteboard KEPT
- [ ] ErrorBoundary wraps entire app

### Marketing Pages (Design)
- [ ] Inter font loads alongside IBM Plex Mono
- [ ] PublicNavigation: Clean, modern, no blog link
- [ ] Footer: No killed features, correct links, copyright 2026, ParticleField animation KEPT and restyled
- [ ] Hero: Bold headline, polished code demo, two CTAs
- [ ] Problem section: Clean toggle comparison
- [ ] HowItWorks: 4-step flow
- [ ] CoreFeatures: 7 features in grid, AGPL license
- [ ] SecondaryFeatures: 5 items (Whiteboard stays, no Automation)
- [ ] PricingPreview: 2 tiers
- [ ] FinalCTA: Waitlist integration preserved
- [ ] PricingPage: 2 tiers (Open Source free + Pro $12 COMING SOON)
- [ ] ContactPage: mailto:Aansh.Naidu@vividverseglobal.com
- [ ] ComingSoonPage: Convex integrations preserved
- [ ] ALL marketing pages follow shared design spec (colors, fonts, shadows)

### Build
- [ ] `pnpm build` passes with zero errors
- [ ] No broken imports or unused variables

---

## START THE TEAM NOW

Create this agent team with 7 teammates. Use Opus model for all. Marketing agents (3, 5, 6, 7) should use the daisy-ui-theme-expert approach to research existing code structure before making changes. Each teammate should verify their changes with a build command before reporting done.

Begin execution immediately. Ship today.
