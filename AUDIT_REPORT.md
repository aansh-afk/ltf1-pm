# Full Button & Endpoint Audit Report

> Generated: 2026-02-21
> Auditor: Claude Code
> Scope: Full codebase — apps/web/src/ (275 files), convex/ (110 files)

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| **Modals found** | 23 |
| **Modals using BrutalModal base** | 15 |
| **Modals with critical non-compliance** | 8 |
| **Modals fully conforming to /docs_design** | 0 (BrutalModal itself has a z-index issue) |
| **Total public Convex endpoints** | 113 |
| **HTTP endpoints** | 3 |
| **Total test files** | 0 |
| **Buttons with test coverage** | 0 |
| **Endpoints with test coverage** | 0 |
| **AI/inline test pages** | 2 (TestAI.tsx, TestCheckbox.tsx — manual only) |

---

## Section 1 — Design System Reference (docs_design/)

Before the audit: full read of all 6 design docs. Key modal requirements extracted:

### Modal Requirements per /docs_design

| Requirement | Spec |
|-------------|------|
| Background | `#111111` (bg-card) or `var(--theme-background-secondary)` |
| Border | `2px solid #2E2E35` |
| Border radius | `0px` (hard edges on content blocks) |
| Animation | Framer Motion `AnimatePresence`, `scale: 0.95→1` + `opacity: 0→1`, `duration: 0.2` |
| Portal | `createPortal(content, document.body)` |
| ESC key | Must close modal |
| Backdrop click | Must close modal |
| Focus trap | Tab cycles within modal; restore focus on close |
| ARIA | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to title |
| Header | Uppercase title (IBM Plex Mono), X close button |
| Z-index | `z-[100]` for overlays (per layout docs) |
| Backdrop | `bg-[#050505]/90` or `bg-black/90` |
| Close button | `HiOutlineX` icon, `p-[4px]`, hover bg transition |
| Shadow | Hard offset `4px 4px 0px rgba(0,0,0,0.5)` — no blur |

---

## Section 2 — BrutalModal Base Component Audit

**File:** `apps/web/src/components/ui/BrutalModal.tsx`

This is the design system's modal primitive that all other modals should use.

### What it does correctly
- ✅ `createPortal(content, document.body)` — renders outside DOM tree
- ✅ `AnimatePresence` with `scale: 0.95→1` + `opacity: 0→1`, `duration: 0.2`
- ✅ ESC key closes modal
- ✅ Tab focus trap (queries all focusable elements, wraps Tab/Shift+Tab)
- ✅ Focuses first focusable element on open (100ms delay)
- ✅ Restores focus to previously active element on close
- ✅ `document.body.style.overflow = 'hidden'` when open
- ✅ `role="dialog"`, `aria-modal="true"`, `aria-labelledby="modal-title"`
- ✅ Backdrop click closes modal (separate `m.div` with `onClick={onClose}`)
- ✅ Header: uppercase title with `HiOutlineX` close button
- ✅ `border-2 border-[var(--theme-border)]`

### Issues Found
| # | Severity | Issue |
|---|----------|-------|
| 1 | Medium | Z-index is `z-50` for both backdrop and container. `/docs_design/06-layout.md` specifies overlays should be `z-[100]`. Navigation is `z-50` — modals can be hidden behind the nav. |
| 2 | Low | Backdrop uses `bg-[var(--theme-background)]/90` — correct spirit but `var(--theme-background)` may not always resolve to `#050505`. Should lock to `bg-[#050505]/90`. |
| 3 | Low | `pointerEvents: 'none'` on outer container div, then `pointerEvents: 'auto'` on modal content — works but unconventional. |

**Impact:** Because 15 modals delegate entirely to BrutalModal, the z-index issue (`z-50` instead of `z-[100]`) affects all of them. The fixed nav bar is also `z-50` — modals may render behind sticky/fixed navigation.

---

## Section 3 — Detailed Modal Inventory

### Legend
- ✅ Compliant
- ⚠️ Partial / Minor issue
- ❌ Non-compliant / Missing
- N/A — Not applicable (delegated to BrutalModal)

---

### 3.1 CreateChannelModal
**File:** `apps/web/src/components/features/communications/CreateChannelModal.tsx`
**Base:** BrutalModal ✅
**Purpose:** Creates a new internal comms channel in a workspace.

| Check | Status | Notes |
|-------|--------|-------|
| BrutalModal base | ✅ | `size="sm"`, `title="Create Channel"` |
| Portal | N/A | Delegated |
| ESC key | N/A | Delegated |
| Backdrop click | N/A | Delegated |
| Focus trap | N/A | Delegated |
| ARIA | N/A | Delegated |
| Framer Motion | N/A | Delegated |
| Uppercase title | ✅ | "CREATE CHANNEL" (uppercase in BrutalModal) |
| 2px border | N/A | Delegated |
| Theme colors | ✅ | Uses `var(--theme-*)` |
| Enter key submit | ✅ | `onKeyPress` triggers `handleCreate()` |

**Buttons:**
| Label | Action | Line |
|-------|--------|------|
| Cancel | `onClose()` | ~60 |
| Create | `handleCreate()` → Convex `createInternalChannel` mutation | ~65 |

**Issues:** None. Fully delegates to BrutalModal correctly.

---

### 3.2 RepoBrowserModal
**File:** `apps/web/src/components/features/documentation/RepoBrowserModal.tsx`
**Base:** None (PANEL, not a modal)
**Purpose:** File browser for GitHub repos — browse/select files to import.

**Note:** This is NOT a modal. It has no overlay, no portal, no backdrop. It's an inline panel component. It does NOT need to conform to modal specs. Likely embedded inside another modal or page section. No compliance assessment needed.

---

### 3.3 ConnectRepositoryModal
**File:** `apps/web/src/components/features/github/ConnectRepositoryModal.tsx`
**Base:** BrutalModal (partial) ⚠️
**Purpose:** Connect GitHub/GitLab/Bitbucket repository to a project.

| Check | Status | Notes |
|-------|--------|-------|
| BrutalModal base | ⚠️ | Used but with broken `title="UNKNOWN"` prop |
| Portal | N/A | Delegated |
| ESC key | N/A | Delegated |
| Backdrop click | N/A | Delegated |
| Theme colors | ✅ | Uses `var(--theme-*)` |

**Critical Bugs:**
| # | Severity | Issue |
|---|----------|-------|
| 1 | **CRITICAL** | `title="UNKNOWN"` hardcoded — modal header reads "UNKNOWN" |
| 2 | **CRITICAL** | `handleConnectRepo` function called at line ~378 but never defined — clicking "Connect" throws `ReferenceError` |
| 3 | Medium | Custom header section conflicts with BrutalModal's built-in header — two headers render |
| 4 | Medium | No explicit close button in the custom header section |

**Buttons:**
| Label | Action | Notes |
|-------|--------|-------|
| Select/URL toggle | Mode switch | ✅ |
| Connect (repo hover) | `handleConnectRepo()` — **UNDEFINED** | ❌ BUG |
| Connect (manual URL) | `handleSubmit()` → Convex `connectRepository` | ✅ |
| Cancel | `onClose()` | ✅ |

---

### 3.4 BulkScheduleModal
**File:** `apps/web/src/components/features/meetings/BulkScheduleModal.tsx`
**Base:** BrutalModal ✅ (`size="lg"`)
**Purpose:** Create multiple recurring meetings from templates.

| Check | Status | Notes |
|-------|--------|-------|
| BrutalModal base | ✅ | Correct |
| Theme colors | ✅ | Uses `var(--theme-*)` throughout |
| Uppercase labels | ✅ | "BULK SCHEDULE MEETINGS", "SELECT TEMPLATE" |
| Input aria-labels | ⚠️ | Sub-component `MeetingScheduleItemRow` inputs missing aria-labels |

**Buttons:**
| Label | Action |
|-------|--------|
| Template buttons (4) | Select meeting template |
| Add Meeting | Appends custom meeting row |
| Remove (trash icon, per row) | Deletes meeting row |
| Cancel | `onClose()` |
| Schedule | `handleSubmit()` → Convex `createMeeting` (batch) |

**Issues:** Minor — missing aria-labels on sub-component inputs.

---

### 3.5 MeetingDetailsModal
**File:** `apps/web/src/components/features/meetings/MeetingDetailsModal.tsx`
**Base:** BrutalModal ✅ (`size="lg"`)
**Purpose:** View meeting details with RSVP, tabs for attendees/agenda/actions.

| Check | Status | Notes |
|-------|--------|-------|
| BrutalModal base | ✅ | |
| Theme colors | ✅ | Semantic colors used correctly |
| Tabs | ✅ | 4 tabs with active state |
| Type annotation | ⚠️ | `meeting: any` — no typed interface |

**Buttons:**
| Label | Action |
|-------|--------|
| Accept / Maybe / Decline | `respondToMeeting` Convex mutation |
| Join | Opens `meetingUrl` in new window |
| Edit | `onEdit()` callback |
| Delete | `deleteMeeting` Convex mutation (organizer only) |
| Tab buttons (4) | `setActiveTab()` |
| Convert to Task | `convertActionItemToTask` Convex mutation |
| Add Action Item | `addActionItem` Convex mutation |
| Close | `onClose()` |

**Issues:** Minor — `meeting: any` prop type.

---

### 3.6 MeetingNotesModal
**File:** `apps/web/src/components/features/meetings/MeetingNotesModal.tsx`
**Base:** BrutalModal ✅ (`size="lg"`)
**Purpose:** View/edit meeting notes with copy/download.

| Check | Status | Notes |
|-------|--------|-------|
| BrutalModal base | ✅ | |
| Theme colors | ✅ | |
| Save feedback | ⚠️ | "SAVING..." text only, no spinner/visual indicator |

**Buttons:**
| Label | Action |
|-------|--------|
| Generate Template | Populates notes with template |
| Copy | `navigator.clipboard.writeText()` |
| Download | Creates `.txt` blob download |
| Edit | `setIsEditing(true)` |
| Save | `updateMeeting` Convex mutation |
| Cancel (edit) | Reverts local state |
| Close | `onClose()` |

**Issues:** Minor.

---

### 3.7 ScheduleMeetingModal
**File:** `apps/web/src/components/features/meetings/ScheduleMeetingModal.tsx`
**Base:** BrutalModal ✅ (`size="lg"`)
**Purpose:** Create or edit a meeting with full form (type, dates, attendees, recurrence, agenda).

| Check | Status | Notes |
|-------|--------|-------|
| BrutalModal base | ✅ | |
| Theme colors | ✅ | |
| Form validation | ✅ | Comprehensive |
| Responsive grid | ✅ | `md:grid-cols-2/3` |

**Buttons:**
| Label | Action |
|-------|--------|
| Meeting type (5) | Sets meeting type, populates template |
| Add Agenda Item | Appends empty agenda row |
| Remove Agenda | Removes agenda row |
| Cancel | `onClose()` |
| Schedule / Update | `handleSubmit()` → `createMeeting` or `updateMeeting` Convex |

**Issues:** None significant.

---

### 3.8 NpsSurveyModal ❌ CRITICAL
**File:** `apps/web/src/components/features/nps/NpsSurveyModal.tsx`
**Base:** None (fully custom) ❌
**Purpose:** 3-step NPS survey (score → reason → thank you).

| Check | Status | Notes |
|-------|--------|-------|
| BrutalModal base | ❌ | Custom `fixed inset-0` div |
| Portal | ❌ | No `createPortal` — renders in page DOM |
| ESC key | ❌ | Not implemented |
| Backdrop click | ❌ | No backdrop click handler |
| Focus trap | ❌ | Not implemented |
| `role="dialog"` | ❌ | Not set |
| `aria-modal` | ❌ | Not set |
| `aria-labelledby` | ❌ | Not set |
| Framer Motion | ❌ | No animation — just appears |
| Theme colors | ❌ | All colors hardcoded hex (#0A0A0A, #2E2E35, #F9FAFB, etc.) |
| Close button | ⚠️ | Plain text "×", not `HiOutlineX` icon |
| Background | ❌ | `#0A0A0A` (surface) instead of `#111111` (card) |
| Z-index | ⚠️ | `z-[60]` — arbitrary, inconsistent with system |

**Buttons:**
| Label | Action |
|-------|--------|
| × close | `handleDismiss()` → `dismissNps` Convex mutation |
| Score 0–10 (11 buttons) | `handleScore(n)` → advances to step 2 |
| Back | Resets score, returns to step 1 |
| Submit | `handleSubmit()` → `submitNps` Convex mutation + PostHog event |

**Required redesign:** Full rewrite using BrutalModal or implementing all modal patterns.

---

### 3.9 EditDeveloperProfileModal ❌ CRITICAL
**File:** `apps/web/src/components/features/profile/EditDeveloperProfileModal.tsx`
**Base:** None (fully custom) ❌
**Purpose:** Multi-tab developer profile editor (Basic Info, Expertise, Preferences).

| Check | Status | Notes |
|-------|--------|-------|
| BrutalModal base | ❌ | Custom fixed overlay |
| Portal | ❌ | No `createPortal` |
| ESC key | ❌ | Not implemented |
| Backdrop click | ❌ | Not implemented |
| Focus trap | ❌ | Not implemented |
| `role="dialog"` | ❌ | Not set |
| `aria-modal` | ❌ | Not set |
| `aria-labelledby` | ❌ | Not set |
| Framer Motion | ⚠️ | Has tab slide animations but not scale+opacity for modal entry |
| Border | ✅ | 2px present |
| Rounded corners | ✅ | 0px |
| Theme colors | ✅ | Uses `var(--theme-*)` |

**Buttons:**
| Label | Action |
|-------|--------|
| × close | `onClose()` |
| Tab buttons (Basic Info, Expertise, Preferences) | `setCurrentTab()` |
| Add Tech Stack | Adds tech row |
| Delete Tech Stack (per row) | Removes tech row |
| Cancel | `onClose()` |
| Save Profile | `updateDeveloperProfile` Convex mutation |

**Required redesign:** Wrap in BrutalModal, add ESC/backdrop/focus trap/ARIA.

---

### 3.10 ExpertiseSearchModal ❌ CRITICAL
**File:** `apps/web/src/components/features/profile/ExpertiseSearchModal.tsx`
**Base:** None (fully custom) ❌
**Purpose:** Search developers by skills/expertise.

| Check | Status | Notes |
|-------|--------|-------|
| BrutalModal base | ❌ | Custom fixed overlay |
| Portal | ❌ | No `createPortal` |
| ESC key | ✅ | Handled on input `onKeyDown` |
| Backdrop click | ✅ | `if (e.target === e.currentTarget)` pattern |
| Focus trap | ⚠️ | Auto-focuses input only — no full trap |
| `role="dialog"` | ❌ | Not set |
| `aria-modal` | ❌ | Not set |
| `aria-labelledby` | ❌ | Not set |
| Framer Motion | ❌ | No animation |
| Theme colors | ❌ | All hardcoded hex (#050505, #0A0A0A, #2E2E35, etc.) |
| Background | ❌ | `#0A0A0A` instead of `#111111` |

**Buttons:**
| Label | Action |
|-------|--------|
| Clear (×) | Clears search input |
| Example filter buttons | Populates search query |
| Copy contact | `navigator.clipboard.writeText()` |
| Email | Opens `mailto:` link |

**Required redesign:** Wrap in BrutalModal, convert hardcoded colors to theme variables, add ARIA.

---

### 3.11 CreateProjectModal
**File:** `apps/web/src/components/features/project/CreateProjectModal.tsx`
**Base:** BrutalModal ✅
**Purpose:** Create new project (name, key, description, workflow type).

| Check | Status | Notes |
|-------|--------|-------|
| BrutalModal base | ✅ | `title="Create New Project"` |
| Theme colors | ⚠️ | Some hardcoded hex (#111111, #2E2E35, #6366F1) alongside CSS vars |

**Buttons:**
| Label | Action |
|-------|--------|
| Cancel | `onClose()` |
| Create Project | `createProject` Convex mutation |

**Issues:** Minor — mixed hardcoded colors/CSS vars. Should standardize to CSS vars.

---

### 3.12 ProjectInviteModal
**File:** `apps/web/src/components/features/project/ProjectInviteModal.tsx`
**Base:** BrutalModal ✅ (`title="PROJECT INVITE"`)
**Purpose:** View/manage/copy project invite link and code.

| Check | Status | Notes |
|-------|--------|-------|
| BrutalModal base | ✅ | |
| Theme colors | ✅ | `var(--theme-*)` throughout |
| Copy feedback | ✅ | Visual color change on copy |

**Buttons:**
| Label | Action |
|-------|--------|
| Generate Invite Code | `ensureInviteCode` Convex mutation |
| Copy link | `navigator.clipboard.writeText()` |
| Copy code | `navigator.clipboard.writeText()` |
| Regenerate | `generateNewCode` Convex mutation |
| Test Link | Opens link in new window |
| Done | `onClose()` |

**Issues:** None significant.

---

### 3.13 GlobalSearchModal ❌ CRITICAL
**File:** `apps/web/src/components/features/search/GlobalSearchModal.tsx`
**Base:** None (custom with Framer Motion) ❌
**Purpose:** Global search with keyboard navigation and type filtering.

| Check | Status | Notes |
|-------|--------|-------|
| BrutalModal base | ❌ | Custom implementation |
| Portal | ❌ | No `createPortal` |
| ESC key | ✅ | Implemented |
| Backdrop click | ✅ | Implemented |
| Focus trap | ⚠️ | Auto-focuses input only |
| `role="dialog"` | ❌ | Not set |
| `aria-modal` | ❌ | Not set |
| Framer Motion | ✅ | Has AnimatePresence + opacity+y animation |
| Border | ❌ | `border-4` instead of `border-2` |
| Animation | ⚠️ | Uses `y` instead of `scale` for entry |

**Buttons:**
| Label | Action |
|-------|--------|
| × close | `handleClose()` |
| Filter buttons (TASKS, PROJECTS, etc.) | Sets `activeFilter` |
| Result items | Navigation to result |

**Required redesign:** Wrap in BrutalModal, fix border to 2px, add ARIA, add portal.

---

### 3.14 CreateSprintModal
**File:** `apps/web/src/components/features/sprint/CreateSprintModal.tsx`
**Base:** BrutalModal ✅ (`title="CREATE NEW SPRINT"`)
**Purpose:** Create a sprint with name, goal, dates.

| Check | Status | Notes |
|-------|--------|-------|
| BrutalModal base | ✅ | |
| Theme colors | ✅ | `var(--theme-*)` |

**Buttons:**
| Label | Action |
|-------|--------|
| Cancel | `onClose()` |
| Create Sprint | `createSprint` Convex mutation |

**Issues:** None.

---

### 3.15 CreateTaskModal
**File:** `apps/web/src/components/features/task/CreateTaskModal.tsx`
**Base:** BrutalModal ✅ (`size="xl"`, `title="NEW TASK"`)
**Purpose:** Create tasks with type/priority chips, smart assignment, labels.

| Check | Status | Notes |
|-------|--------|-------|
| BrutalModal base | ✅ | |
| Theme colors | ✅ | `var(--theme-*)` + `color-mix()` |
| `aria-pressed` | ✅ | On type/priority chip buttons |

**Buttons:**
| Label | Action |
|-------|--------|
| Type chips (Task, Feature, Bug, Improvement, Epic) | Sets `taskType` |
| Priority chips (Low, Med, High, Urgent) | Sets `priority` |
| Smart Assignment toggle | Toggles assignment mode |
| Cancel | `onClose()` |
| Create Task | `createTask` Convex mutation |

**Issues:** None significant.

---

### 3.16 EditTaskModal
**File:** `apps/web/src/components/features/task/EditTaskModal.tsx`
**Base:** BrutalModal ✅ (`size="lg"`)
**Purpose:** Edit existing task (all fields).

| Check | Status | Notes |
|-------|--------|-------|
| BrutalModal base | ✅ | |
| External CSS classes | ⚠️ | Uses `.brutal-input`, `.brutal-btn` — requires globals.css to define |

**Buttons:**
| Label | Action |
|-------|--------|
| Delete Task | `deleteTask` Convex mutation |
| Cancel | `onClose()` |
| Update Task | `updateTask` Convex mutation |

**Issues:** Minor — dependency on external CSS class names.

---

### 3.17 TaskDetailModal
**File:** `apps/web/src/components/features/task/TaskDetailModal.tsx`
**Base:** BrutalModal ✅ (`size="lg"`)
**Purpose:** Read-only task detail with time tracking and comments tabs.

| Check | Status | Notes |
|-------|--------|-------|
| BrutalModal base | ✅ | |
| Theme colors | ✅ | |

**Buttons:**
| Label | Action |
|-------|--------|
| Tab buttons (DETAILS, TIME TRACKING, COMMENTS) | `setActiveTab()` |

**Issues:** None.

---

### 3.18 AddTeamMemberModal
**File:** `apps/web/src/components/features/team/AddTeamMemberModal.tsx`
**Base:** BrutalModal ✅
**Purpose:** Add workspace members to a team with role selection.

| Check | Status | Notes |
|-------|--------|-------|
| BrutalModal base | ✅ | `title="ADD MEMBER — {teamName}"` |
| Theme colors | ⚠️ | Some hardcoded hex (#111111, #0A0A0A, #2E2E35, #6366F1) |

**Buttons:**
| Label | Action |
|-------|--------|
| MEMBER / LEAD toggle | Sets `selectedRole` |
| Add (per member) | `addTeamMember` Convex mutation |
| Done | Resets state + `onClose()` |

**Issues:** Minor — hardcoded colors should be CSS vars.

---

### 3.19 UserProfileModal ❌ MODERATE
**File:** `apps/web/src/components/features/user/UserProfileModal.tsx`
**Base:** None (custom with portal) ⚠️
**Purpose:** View another user's profile (tabbed: Profile, Activity, Skills).

| Check | Status | Notes |
|-------|--------|-------|
| BrutalModal base | ❌ | Custom implementation |
| Portal | ✅ | Uses `React.createPortal` |
| ESC key | ❌ | Not implemented |
| Backdrop click | ✅ | Handled via button element |
| Focus trap | ❌ | Not implemented |
| `role="dialog"` | ❌ | Not set |
| `aria-modal` | ❌ | Not set |
| `aria-labelledby` | ❌ | Not set |
| Framer Motion | ❌ | No animation |
| Theme colors | ✅ | `var(--theme-*)` |

**Buttons:**
| Label | Action |
|-------|--------|
| × close | `onClose()` |
| Tab buttons (PROFILE, ACTIVITY, SKILLS) | `setActiveTab()` |

**Required fixes:** Add ESC handler, focus trap, ARIA attributes, Framer Motion animation.

---

### 3.20 CreateWorkspaceModal
**File:** `apps/web/src/components/features/workspace/CreateWorkspaceModal.tsx`
**Base:** BrutalModal ✅ (`title="CREATE NEW WORKSPACE"`)
**Purpose:** Create a new workspace.

| Check | Status | Notes |
|-------|--------|-------|
| BrutalModal base | ✅ | |
| Theme colors | ✅ | `var(--theme-*)` |
| Border radius override | ✅ | `borderRadius: '0 !important'` explicitly set |

**Buttons:**
| Label | Action |
|-------|--------|
| Cancel | `onClose()` |
| Create Workspace | `createWorkspace` Convex mutation |

**Issues:** None.

---

### 3.21 AISetupModal
**File:** `apps/web/src/components/onboarding/AISetupModal.tsx`
**Base:** BrutalModal ✅
**Purpose:** First-time AI setup (free credits, BYOK, or skip).

| Check | Status | Notes |
|-------|--------|-------|
| BrutalModal base | ✅ | |
| Theme colors | ✅ | `var(--theme-*)` |
| SetupOptionCard radius | ⚠️ | Cards use `borderRadius` computed instead of 0px |

**Buttons:**
| Label | Action |
|-------|--------|
| SetupOptionCard (3) | Selects setup mode |
| Cancel (non-first-time) | `onClose()` |
| Setup button (context-aware) | AI setup Convex actions or `onComplete()` |

**Issues:** Minor — option cards have non-zero border radius.

---

### 3.22 OnboardingFlow
**File:** `apps/web/src/components/onboarding/OnboardingFlow.tsx`
**Base:** BrutalModal ✅
**Purpose:** Multi-step onboarding (Theme → AI → Boot completion).

| Check | Status | Notes |
|-------|--------|-------|
| BrutalModal base | ✅ | |
| Framer Motion | ✅ | Slide transitions between steps |
| Button border-radius | ❌ | `borderRadius: '8px'` on inline button styles — violates spec |
| Theme colors | ✅ | `var(--theme-*)` |

**Buttons:**
| Label | Action |
|-------|--------|
| SKIP --force | Triggers skip confirmation |
| NEXT --step ai | Advances step |
| BACK | Returns to previous step |
| Skip AI / Activate / Validate | Conditionally advances/completes setup |
| Close (boot complete) | `onComplete()` |

**Issues:** Button `borderRadius: '8px'` applied inline — correct per spec (8px for buttons) but inconsistently applied only some places.

---

### 3.23 CommandPalette ❌ MODERATE
**File:** `apps/web/src/components/shortcuts/CommandPalette.tsx`
**Base:** None (custom fixed positioning) ❌
**Purpose:** Keyboard-driven command search and execution.

| Check | Status | Notes |
|-------|--------|-------|
| BrutalModal base | ❌ | Custom `fixed` div |
| Portal | ❌ | No `createPortal` |
| ESC key | ✅ | Implemented |
| Backdrop click | ✅ | Implemented |
| Focus trap | ❌ | Not implemented |
| `role="dialog"` | ❌ | Not set |
| `aria-modal` | ❌ | Not set |
| Framer Motion | ❌ | No animation |
| Theme colors | ❌ | Hardcoded hex (#0A0A0A, #2E2E35, #F9FAFB, #6B7280) |
| Background | ❌ | `#0A0A0A` (surface) instead of `#111111` (card) |
| Border radius | ❌ | `rounded-lg` — violates 0px spec for content blocks |

**Buttons:**
| Label | Action |
|-------|--------|
| Backdrop | `handleClose()` |
| CommandItem rows | `handleExecuteCommand()` |
| Clear (×) | Clears `searchQuery` |

**Required redesign:** Wrap in BrutalModal or implement full modal pattern; fix rounded-lg, hardcoded colors, add portal.

---

## Section 4 — Modal Compliance Matrix

| Modal | BrutalModal | Portal | ESC | Backdrop | Focus Trap | ARIA | Framer | 2px Border | Theme Colors | Status |
|-------|-------------|--------|-----|----------|-----------|------|--------|-----------|--------------|--------|
| CreateChannelModal | ✅ | N/A | N/A | N/A | N/A | N/A | N/A | ✅ | ✅ | ✅ PASS |
| ConnectRepositoryModal | ⚠️ | N/A | N/A | N/A | N/A | N/A | N/A | ✅ | ✅ | ❌ BUGS |
| BulkScheduleModal | ✅ | N/A | N/A | N/A | N/A | N/A | N/A | ✅ | ✅ | ✅ PASS |
| MeetingDetailsModal | ✅ | N/A | N/A | N/A | N/A | N/A | N/A | ✅ | ✅ | ✅ PASS |
| MeetingNotesModal | ✅ | N/A | N/A | N/A | N/A | N/A | N/A | ✅ | ✅ | ✅ PASS |
| ScheduleMeetingModal | ✅ | N/A | N/A | N/A | N/A | N/A | N/A | ✅ | ✅ | ✅ PASS |
| **NpsSurveyModal** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ **CRITICAL** |
| **EditDeveloperProfileModal** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ✅ | ✅ | ❌ **CRITICAL** |
| **ExpertiseSearchModal** | ❌ | ❌ | ✅ | ✅ | ⚠️ | ❌ | ❌ | ✅ | ❌ | ❌ **CRITICAL** |
| CreateProjectModal | ✅ | N/A | N/A | N/A | N/A | N/A | N/A | ✅ | ⚠️ | ⚠️ MINOR |
| ProjectInviteModal | ✅ | N/A | N/A | N/A | N/A | N/A | N/A | ✅ | ✅ | ✅ PASS |
| **GlobalSearchModal** | ❌ | ❌ | ✅ | ✅ | ⚠️ | ❌ | ✅ | ❌ | ✅ | ❌ **CRITICAL** |
| CreateSprintModal | ✅ | N/A | N/A | N/A | N/A | N/A | N/A | ✅ | ✅ | ✅ PASS |
| CreateTaskModal | ✅ | N/A | N/A | N/A | N/A | N/A | N/A | ✅ | ✅ | ✅ PASS |
| EditTaskModal | ✅ | N/A | N/A | N/A | N/A | N/A | N/A | ✅ | ✅ | ✅ PASS |
| TaskDetailModal | ✅ | N/A | N/A | N/A | N/A | N/A | N/A | ✅ | ✅ | ✅ PASS |
| AddTeamMemberModal | ✅ | N/A | N/A | N/A | N/A | N/A | N/A | ✅ | ⚠️ | ⚠️ MINOR |
| **UserProfileModal** | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ MODERATE |
| CreateWorkspaceModal | ✅ | N/A | N/A | N/A | N/A | N/A | N/A | ✅ | ✅ | ✅ PASS |
| AISetupModal | ✅ | N/A | N/A | N/A | N/A | N/A | N/A | ✅ | ✅ | ⚠️ MINOR |
| OnboardingFlow | ✅ | N/A | N/A | N/A | N/A | N/A | ✅ | ✅ | ✅ | ✅ PASS |
| **CommandPalette** | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ MODERATE |
| **ConnectRepositoryModal** | ⚠️ | N/A | N/A | N/A | N/A | N/A | N/A | ✅ | ✅ | ❌ BUGS |

---

## Section 5 — Detailed Endpoint Inventory

### 5.1 Tasks Module
| Function | Type | Route | Description |
|----------|------|-------|-------------|
| `createTask` | mutation | `api.tasks.mutations.createTask` | Creates task with optional assignment + email notifications |
| `updateTask` | mutation | `api.tasks.mutations.updateTask` | Updates all task fields |
| `deleteTask` | mutation | `api.tasks.mutations.deleteTask` | Deletes task, orphans subtasks |
| `moveTask` | mutation | `api.tasks.mutations.moveTask` | Changes task status/position |
| `startTimeTracking` | mutation | `api.tasks.mutations.startTimeTracking` | Starts time tracking session |
| `pauseTimeTracking` | mutation | `api.tasks.mutations.pauseTimeTracking` | Pauses active session |
| `stopTimeTracking` | mutation | `api.tasks.mutations.stopTimeTracking` | Ends session, updates totals |
| `getProjectTasks` | query | `api.tasks.queries.getProjectTasks` | Lists filtered project tasks |
| `getTask` | query | `api.tasks.queries.getTask` | Gets full task with comments/activities |
| `getMyTasks` | query | `api.tasks.queries.getMyTasks` | All tasks for current user |
| `getTaskTimeEntries` | query | `api.tasks.queries.getTaskTimeEntries` | Time entries for a task |
| `getActiveTimeEntry` | query | `api.tasks.queries.getActiveTimeEntry` | Currently active timer |
| `getFilteredTasks` | query | `api.tasks.queries.getFilteredTasks` | Advanced filtered task list |
| `getWorkspaceLabels` | query | `api.tasks.queries.getWorkspaceLabels` | All unique labels in workspace |
| `getTasksByUser` | query | `api.tasks.queries.getTasksByUser` | Tasks by Clerk user ID |
| `getTasksByWorkspace` | query | `api.tasks.queries.getTasksByWorkspace` | All tasks in workspace |

### 5.2 Projects Module
| Function | Type | Route | Description |
|----------|------|-------|-------------|
| `createProject` | mutation | `api.projects.mutations.createProject` | Creates project + invite code |
| `updateProject` | mutation | `api.projects.mutations.updateProject` | Updates project fields |
| `deleteProject` | mutation | `api.projects.mutations.deleteProject` | Archives project |
| `connectRepository` | mutation | `api.projects.mutations.connectRepository` | Links Git repo to project |
| `ensureProjectInviteCode` | mutation | `api.projects.mutations.ensureProjectInviteCode` | Ensures invite code exists |
| `generateProjectInviteCode` | mutation | `api.projects.mutations.generateProjectInviteCode` | Generates new invite code |
| `joinProjectByCode` | mutation | `api.projects.mutations.joinProjectByCode` | Join via invite code |
| `addProjectMember` | mutation | `api.projects.mutations.addProjectMember` | Adds member with role |
| `removeProjectMember` | mutation | `api.projects.mutations.removeProjectMember` | Removes member |
| `updateProjectMemberRole` | mutation | `api.projects.mutations.updateProjectMemberRole` | Changes member role |
| `assignTeam` | mutation | `api.projects.mutations.assignTeam` | Assigns team to project |
| `getWorkspaceProjects` | query | `api.projects.queries.getWorkspaceProjects` | Lists active projects |
| `getProject` | query | `api.projects.queries.getProject` | Full project details |
| `getProjectsByStatus` | query | `api.projects.queries.getProjectsByStatus` | Projects filtered by status |
| `getProjectTeamMembers` | query | `api.projects.queries.getProjectTeamMembers` | Active project members |
| `getProjectByInviteCode` | query | `api.projects.queries.getProjectByInviteCode` | Public info from invite code |
| `getUserProjects` | query | `api.projects.queries.getUserProjects` | Projects current user is in |
| `getProjectInviteLink` | query | `api.projects.queries.getProjectInviteLink` | Invite code + team settings |

### 5.3 Workspaces Module
| Function | Type | Description |
|----------|------|-------------|
| `createWorkspace` | mutation | Creates workspace, sets creator as owner |
| `updateWorkspace` | mutation | Updates workspace settings |
| `inviteToWorkspace` | mutation | Invites user by email |
| `updateMemberRole` | mutation | Changes member role |
| `deleteWorkspace` | mutation | Deletes workspace + all data |
| `removeMember` | mutation | Removes workspace member |
| `getUserWorkspaces` | query | All workspaces for current user |
| `getWorkspaceById` | query | Full workspace with members |
| `getWorkspaceMembers` | query | All workspace members |
| `getWorkspaceStats` | query | Comprehensive workspace statistics |
| `getPendingInvitations` | query | Pending workspace invitations |

### 5.4 Sprints Module
| Function | Type | Description |
|----------|------|-------------|
| `createSprint` | mutation | Creates sprint with date validation |
| `updateSprint` | mutation | Updates sprint, sends status emails |
| `deleteSprint` | mutation | Deletes sprint, orphans tasks |
| `addTasksToSprint` | mutation | Batch adds tasks to sprint |
| `removeTaskFromSprint` | mutation | Returns task to backlog |
| `getProjectSprints` | query | Lists sprints with progress stats |
| `getCurrentSprint` | query | Active sprint with task metrics |
| `getSprintById` | query | Full sprint details |
| `getBacklogTasks` | query | Non-sprint tasks for a project |

### 5.5 Meetings Module
| Function | Type | Description |
|----------|------|-------------|
| `createMeeting` | mutation | Creates meeting + sends email invitations |
| `updateMeeting` | mutation | Updates meeting + notifies attendees |
| `respondToMeeting` | mutation | RSVP (accepted/declined/tentative) |
| `addActionItem` | mutation | Adds action item to meeting |
| `convertActionItemToTask` | mutation | Converts action item to project task |
| `deleteMeeting` | mutation | Cancels + sends cancellation emails |
| `getProjectMeetings` | query | Meetings for a project |
| `getWorkspaceMeetings` | query | Workspace meetings with filters |
| `getUserMeetings` | query | Meetings user organized or attends |
| `getMeeting` | query | Full meeting with attendees |
| `getUpcomingMeetings` | query | User's upcoming meetings |
| `getMeetingTemplates` | query | Predefined meeting templates |

### 5.6 Teams Module
| Function | Type | Description |
|----------|------|-------------|
| `createTeam` | mutation | Creates team, adds creator as lead |
| `addTeamMember` | mutation | Adds member with role |
| `getTeams` | query | All workspace teams |
| `getTeamMembers` | query | Team members with user details |
| `getAvailableMembers` | query | Workspace members not in team |

### 5.7 Communications Module
| Function | Type | Description |
|----------|------|-------------|
| `createInternalChannel` | mutation | Creates internal chat channel |
| `sendInternalMessage` | mutation | Sends message to channel |
| `markChannelRead` | mutation | Resets unread count |
| `updateChannelSettings` | mutation | Updates mute/active status |
| `getCommsChannels` | query | All comms channels |
| `getUnifiedFeed` | query | Unified cross-source message feed |
| `getChannelMessages` | query | Messages from specific channel |
| `getCommsStats` | query | Communications statistics |

### 5.8 Developers Module
| Function | Type | Description |
|----------|------|-------------|
| `updateDeveloperProfile` | mutation | Create/update developer profile |
| `updateStatus` | mutation | Quick developer status update |
| `updateTechStack` | mutation | Update tech expertise list |
| `syncGithubStats` | mutation | Sync GitHub statistics |
| `getDeveloperProfile` | query | Profile by user ID |
| `getMyProfile` | query | Current user's profile |
| `searchDevelopers` | query | Search by expertise |
| `getTeamExpertiseMatrix` | query | Expertise matrix for workspace |
| `getSuggestedReviewers` | query | Suggested code reviewers |
| `getWorkspaceStatuses` | query | Real-time developer statuses |

### 5.9 AI Module
| Function | Type | Description |
|----------|------|-------------|
| `trackAISession` | mutation | Logs AI interaction analytics |
| `addAIFeedback` | mutation | Records user feedback |
| `createAIInsight` | mutation | Creates AI insight |
| `dismissAIInsight` | mutation | Dismisses AI insight |
| `createAITaskSuggestion` | mutation | Creates AI-suggested tasks |
| `updateAITaskStatus` | mutation | Accept/reject AI task suggestion |
| `generateDocumentation` | mutation | Generates doc templates |
| `getUserAISessions` | query | User's AI interaction history |
| `getWorkspaceAIStats` | query | Workspace AI usage stats |
| `getActiveInsights` | query | Active AI insights |
| `getPendingAITasks` | query | Pending AI task suggestions |
| `getAIFeedbackSummary` | query | Aggregated feedback summary |

### 5.10 Comments Module
| Function | Type | Description |
|----------|------|-------------|
| `createComment` | mutation | Adds comment to task + email |
| `updateComment` | mutation | Edits comment (author only) |
| `deleteComment` | mutation | Deletes comment |

### 5.11 HTTP Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `/clerk-webhook` | POST | Clerk auth webhook handler |
| `/api/cli-refresh` | POST | CLI JWT token refresh |
| `/api/github/webhook` | POST | GitHub events (install, push, PR, issues, comments) |

---

## Section 6 — Test Coverage Gaps

### Status: **ZERO TEST COVERAGE**

No test directory, no test framework, no test files exist in this codebase.

**Testing infrastructure status:**
- No Jest / Vitest / Playwright config found
- No `.test.ts`, `.test.tsx`, `.spec.ts`, `.spec.tsx` files
- No Cypress config
- Manual test pages only: `TestAI.tsx`, `TestCheckbox.tsx` (page-level manual UI tests)
- `test-shortcuts.js` — plain JS smoke test file (not a test framework)
- `test-convex.html` — manual HTML test page

**Every single button, endpoint, and modal has NO automated test coverage.**

### Priority Test Coverage Gaps (by risk)

#### Critical — Must Test First
| Component / Endpoint | Risk |
|---------------------|------|
| NpsSurveyModal | ARIA missing, no portal — screen readers can't access |
| EditDeveloperProfileModal | No ESC/backdrop close — users can get trapped |
| createTask / updateTask / deleteTask | Core user workflows |
| createProject / deleteProject | High-value destructive action |
| deleteWorkspace | Destructive — deletes ALL data |
| connectRepository | Bug — `handleConnectRepo` is undefined |
| ConnectRepositoryModal title "UNKNOWN" | UX defect in production |
| GitHub webhook handler | Security-critical |

#### High — Important User Flows
| Component / Endpoint | Risk |
|---------------------|------|
| CreateTaskModal rendering + submission | Core product feature |
| ScheduleMeetingModal form validation | Multi-field validation |
| GlobalSearchModal keyboard navigation | Key UX feature |
| CommandPalette keyboard navigation | Key UX feature |
| respondToMeeting | User-facing state change |
| joinProjectByCode | Onboarding flow |

---

## Section 7 — Prioritized Redesign Plan

### Tier 1 — Fix BrutalModal (affects 15 modals)
**Change:** `z-50` → `z-[100]` for backdrop and container.
**Impact:** All modals that use BrutalModal will correctly appear above the fixed navigation bar.

### Tier 2 — Critical Custom Modal Rewrites (5 modals)
In priority order:

| Modal | Priority | Key Issues |
|-------|----------|-----------|
| NpsSurveyModal | 🔴 P0 | No portal, no ARIA, no ESC, hardcoded colors, wrong bg |
| EditDeveloperProfileModal | 🔴 P0 | No portal, no ESC, no backdrop, no ARIA |
| ExpertiseSearchModal | 🔴 P1 | No portal, no ARIA, hardcoded colors, wrong bg |
| GlobalSearchModal | 🔴 P1 | No portal, no ARIA, 4px border |
| CommandPalette | 🔴 P1 | rounded-lg, hardcoded colors, no portal, no ARIA |

### Tier 3 — Bug Fixes (1 modal)
| Modal | Issue |
|-------|-------|
| ConnectRepositoryModal | Fix `handleConnectRepo` undefined bug; fix `title="UNKNOWN"` |

### Tier 4 — Moderate Issues (1 modal)
| Modal | Issue |
|-------|-------|
| UserProfileModal | Add ESC handler, focus trap, ARIA, Framer Motion animation |

### Tier 5 — Minor Polish (3 modals)
| Modal | Issue |
|-------|-------|
| CreateProjectModal | Standardize hardcoded colors to CSS vars |
| AddTeamMemberModal | Standardize hardcoded colors to CSS vars |
| AISetupModal | Fix option card border radius |

---

## Section 8 — Notes & Observations

1. **No test infrastructure exists.** Building from scratch will require choosing and configuring a test framework (recommend Vitest + React Testing Library for unit/component, Playwright for E2E).

2. **BrutalModal is architecturally sound** — it correctly implements portal, focus trap, ESC, ARIA, and Framer Motion. The only bug is z-index (`z-50` should be `z-[100]`). Fixing BrutalModal fixes 15 modals at once.

3. **Theme colors are inconsistently applied.** Some modals use `var(--theme-*)` (correct), others hardcode hex. This means they won't respond correctly to theme switching. Standardize on CSS custom properties.

4. **ConnectRepositoryModal has a production runtime bug** — `handleConnectRepo` is called but never defined. Clicking "Connect" on a repo in the picker throws `ReferenceError` in production.

5. **The 4 custom modals that bypass BrutalModal** (NpsSurvey, EditDeveloperProfile, ExpertiseSearch, CommandPalette) all have the same missing pattern: no portal, no ARIA, hardcoded colors. These were likely built before BrutalModal existed.

6. **AI components (AITaskEnhancer, NaturalLanguageTaskCreator) are NOT modals** — they're inline components. No modal compliance applies to them.

7. **RepoBrowserModal is a misnomer** — it's a panel component embedded inside other modals, not a standalone modal. No compliance issues.

---

## ⛔ STOP — Awaiting Review

This report covers Phase 1 (Discovery) and Phase 2 (Audit) in full.

**Please review the findings above and confirm before I proceed to Phase 3 (Modal Redesigns).**

Specifically, please confirm:
1. The redesign priority order (Tier 1 → Tier 5 above) is acceptable
2. Whether you want Phase 4 (test writing) to use Vitest + React Testing Library, Playwright, or another stack
3. Any modals you want me to skip or handle differently
