# Iceberg-L MVP Readiness Audit
**Date:** 2026-02-07
**Branch:** developement
**Stack:** Vite + React 18 + Convex + Clerk
**Scope:** Full codebase audit across 4 domains

---

## Executive Summary

Iceberg-L has a **solid core PM foundation** with Tasks, Projects, Workspaces, and Sprints all functional. The landing page is production-quality and the theme system is genuinely differentiating. Deeper audit reveals that Chat, Meetings, Custom Fields, and AI features are more complete than initially apparent -- all have working backends with proper auth. However, video conferencing is a Jitsi URL wrapper, GitLab sync has a critical bug, several marketing pages overpromise, and there are security gaps that must be fixed before any public launch.

**Verdict:** Ship a focused MVP with core PM + GitHub + Chat + Meetings + Custom Fields. AI features work with graceful fallbacks. Mark video, automation, GitLab, and Slack as "Public Preview" or hide entirely.

---

## Table of Contents

1. [Feature Classification: KEEP / PUBLIC PREVIEW / DEFER](#1-feature-classification)
2. [Security Fixes Required Before Launch](#2-security-fixes-p0)
3. [Core PM Features Audit](#3-core-pm-features)
4. [Integrations & AI Audit](#4-integrations--ai)
5. [Marketing Pages Redesign Plan](#5-marketing-pages-redesign)
6. [Infrastructure & Performance](#6-infrastructure--performance)
7. [Bugs Found](#7-bugs-found)
8. [Priority Action Items](#8-priority-action-items)

---

## 1. Feature Classification

### KEEP for MVP (Ship Now)

| Feature | Status | Notes |
|---------|--------|-------|
| Tasks CRUD | Complete | Create, read, update, delete with permissions |
| Task Kanban Board | Complete | Drag-drop, 5 status columns, position tracking |
| Task Filters/Search | Complete | 10+ filter dimensions, presets, quick search |
| Task Time Tracking | Complete | Start/pause/stop with duration accumulation |
| Projects CRUD | Complete | Full lifecycle with key validation, invite codes |
| Project Members | Complete | Add, remove, role management, invite by code |
| Workspaces CRUD | Complete | Create, settings, cascading delete, member management |
| Workspace Roles | Complete | Owner/admin/member/viewer with 21 permissions |
| Sprints Full Lifecycle | Complete | Create, activate (single active), complete, delete |
| Sprint Planning | Complete | Add/remove tasks, backlog view, progress stats |
| Dashboard (basic) | Partial | Workspace stats + activity feed (remove fake metrics) |
| GitHub Integration | Functional | OAuth, webhooks, commit/PR/issue linking to tasks |
| Auth Flow (Clerk) | Complete | Sign-up, sign-in, webhook sync, waitlist gating |
| Onboarding | Complete | 2-step: theme selection + AI config |
| Settings (8 tabs) | Complete | Profile, display, notifications, workspace, AI, shortcuts |
| Theme System (9 themes) | Complete | CSS custom properties, keyboard shortcuts, high contrast |
| Waitlist/Newsletter | Complete | Real Convex backend, stats, boost button |
| Landing Page | Complete | 9 sections, strong value prop, responsive |
| Custom Fields | Complete | 8 field types, validation, permissions, search by field values |
| Chat System | Complete | 5 channel types, threads, reactions, typing indicators, read receipts, search |
| Meetings | Complete | RSVP, action items, task conversion, 4 templates, recurrence |
| Whiteboard | Working | Konva canvas, 6 element types, snapshots, collab cursors, element locking |
| AI Features | Working | Credit system, BYOK, usage tracking, mock fallbacks, 15+ AI operations |
| RBAC Permissions | Complete | Workspace + project level, team inheritance |
| Activity Logging | Complete | Comprehensive across all features |
| CLI Auth | Solid | Localhost-only callbacks, CSRF protection |
| Command Palette | Complete | Search, categories, keyboard nav, recent commands |

### PUBLIC PREVIEW (Show but label "Coming Soon" or "Beta")

| Feature | Status | What's Missing |
|---------|--------|----------------|
| Task Subtasks | Backend only | No UI to create/manage subtasks |
| Slack Integration | Partial | Sprint command bugs, no OAuth flow, no interactive messages |
| Teams | Partial | Create/list works, no edit/delete/member management UI |
| Automation/Workflows | Partial | Engine exists with condition evaluation, but many action types unimplemented, runCount bug |
| Audit Logs | Working | Needs workspace membership checks on queries |

### DEFER / HIDE (Remove from UI and marketing)

| Feature | Status | Why Defer |
|---------|--------|-----------|
| Task Dependencies | Stub | Schema field only, no logic or UI |
| GitLab Integration | Buggy | Critical: `response.json()` called twice on same response -- will crash on every sync |
| Video Calls | Jitsi wrapper | Just generates Jitsi Meet URLs, recording/signaling are stubs |
| Blog | Fabricated | 8 fake posts with fake authors, broken links |
| Enterprise Pricing Tier | UI only | No SSO/SAML, no on-premise, no SOC2 |
| Reports (advanced) | Stub | ReportBuilder exists but unverified |
| System Metrics Widget | Fake | Hardcoded CPU/memory/network values |
| Quick Actions (dashboard) | Stub | Button exists, no functionality |

---

## 2. Security Fixes (P0)

These MUST be fixed before any public launch:

### Critical (Fix Immediately)

| Issue | Location | Risk |
|-------|----------|------|
| No React Error Boundary | `apps/web/src/App.tsx` | Any JS error = white screen for all users |
| `clearGitHubData` is public, no auth | `convex/admin/one_off_cleanup.ts` | Anyone can delete ALL GitHub data |
| Migration mutations are public, no auth | `convex/migrations.ts`, `convex/migrations/migrateToMultipleAssignees.ts` | Anyone can modify all user/task data |
| `clearOldActivities` has no auth | `convex/workspaces/mutations.ts:455` | Anyone can delete all activities |
| `globalSearch` does 5 full table scans | `convex/search.ts` | Will crash at scale, exposes all data |

### High (Fix Before Real Users)

| Issue | Location | Risk |
|-------|----------|------|
| `getUserById` is public, no auth | `convex/auth/users.ts:250` | Leaks email, preferences, settings of any user |
| GitHub monitoring queries have no auth | `convex/integrations/github/monitoring.ts` | Exposes installation details, rate limits |
| `getGitHubConnection` returns access token to client | `convex/integrations/github/oauth.ts:237` | OAuth token exposed to browser |
| Slack queries return `botAccessToken` | `convex/integrations/slack/queries.ts:14` | Slack bot token exposed to browser |
| OAuth tokens stored in plaintext | Schema: `githubConnections.accessToken`, `gitlabIntegrations.accessToken`, `slackIntegrations.accessToken` | Token theft if DB breached |
| Default access code in `.env.example` | `.env.example:31` (`668588907`) | Checked into version control |
| 23 uses of `v.any()` in schema | `convex/schema.ts` | No type safety on important fields |
| ~40% of public functions missing `returns:` validators | Throughout `convex/` | No output validation |
| Audit log queries missing workspace membership checks | `convex/audit.ts` | Any authed user can read any workspace's logs |
| `createAuditLog` is public mutation | `convex/audit.ts` | Should be `internalMutation` |
| No rate limiting on any endpoint | Throughout | Newsletter spam, search abuse, CLI brute-force |

---

## 3. Core PM Features

### Tasks System
- **CRUD**: Complete with permissions, activity logging, notifications
- **Kanban**: Complete. Two parallel implementations exist (`KanbanBoard` + `TaskBoard`) -- should consolidate
- **Filters**: Complete. 10+ dimensions, presets, quick search
- **Time Tracking**: Complete. Start/pause/stop with live UI. **WARNING**: Duplicate code in `convex/tasks/timeTracking.ts` WITHOUT permission checks
- **Subtasks**: Backend supports `parentTaskId`, but NO frontend UI to create/manage. Show as "Coming Soon"
- **Dependencies**: Schema field exists, zero implementation. Hide entirely
- **Performance concern**: `getMyTasks` and `getTasksByUser` do full table scans

### Projects System
- **CRUD**: Complete with key validation, auto-generated invite codes
- **Members**: Complete with role management, invite-by-code flow
- **Repository Connect**: GitHub/GitLab/Bitbucket URL storage, GitHub backfill trigger
- **Bug**: `convex/projects/members.ts` reads `project.members` array which doesn't exist in current schema

### Workspaces System
- **CRUD**: Complete with cascading hard-delete (owner-only)
- **Members**: Invite by email, remove, role change, owner protection
- **Settings**: Feature toggles, general settings with auto-save
- **Bug**: `WorkspaceSettingsPage.tsx` references `api.workspaces.queries.getWorkspace` -- should be `getWorkspaceById`

### Sprints System
- **Complete**. Create, activate (validates single-active), complete, delete
- **Planning**: Add/remove tasks, backlog query, progress stats (points, %, days remaining)
- **No issues found**

### Dashboard
- **Working**: Workspace stats, activity feed, profile completion banner
- **Fake**: System Metrics widget (hardcoded CPU/memory/network) -- REMOVE
- **Broken**: Meetings count hardcoded to "0" -- REMOVE or fix
- **Missing**: "My Tasks" summary widget -- would be valuable for MVP

### Teams
- **Partial**: Create and list work. No edit, delete, or member management UI
- **The TeamPage is really a "Workspace Team & Sprints" page**, not managing the `teams` table
- Add to Public Preview tier

---

## 4. Integrations & AI

### GitHub Integration -- MVP READY
- OAuth flow with CSRF state protection
- GitHub App installation with JWT/RS256 authentication
- Webhook handler with HMAC-SHA256 signature verification (note: string comparison not constant-time)
- Commit/PR/issue linking to tasks via `PROJECT-123` pattern detection
- Auto-complete tasks on PR merge
- Repository backfill: fetches last 20 commits and 10 PRs
- Bi-directional issue sync with queue-based processing, retry logic, exponential backoff
- Team sync between GitHub orgs and LTF1 teams
- Developer stats sync: PR count, review count, issue count, language stats
- Rate limiting infrastructure
- 8 frontend components: connect button, installation, repository modal, monitoring
- **Fix needed**: `getGitHubConnection` returns access token to client
- **Fix needed**: `backfillRepositoryData` uses `VITE_GITHUB_CLIENT_ID` for App ID (wrong env var)

### GitLab Integration -- DEFER (CRITICAL BUG)
- OAuth flow, token storage with refresh support
- Project connection, issue sync, MR sync mutations exist
- Queries for integration status, connections, issues, MRs, activity
- **CRITICAL BUG**: `sync.ts` calls `response.json()` twice on same response objects -- will crash on every sync attempt
- No webhook processing (GitHub has 10+ event handlers; GitLab has zero)
- No queue-based sync system
- Uses `.filter()` instead of `.withIndex()` for lookups

### Slack Integration -- PUBLIC PREVIEW
- Integration storage with bot tokens, channel mapping, user mapping
- Event processing for 4 types: message, app_mention, reaction_added, file_shared
- Auto-create tasks from "create task: title" messages
- Bot commands: help, list tasks; mark task complete on checkmark reaction
- **10 slash commands**: help, task (create/list/mine/complete), sprint (status/tasks), project, standup, time (start/stop/today), meeting, search, connect, disconnect
- Notification system with Block Kit builders for task/sprint/meeting events
- Standup storage and retrieval
- **Bug**: Sprint commands reference `args.projectId` instead of `channelMapping.projectId`
- **Missing**: No OAuth flow for initial Slack app installation
- **Fix needed**: `botAccessToken` returned to client in queries

### AI Features -- MVP READY (with fallbacks)
- **Credit System**: Full implementation -- free (100), pro (10K), enterprise (50K) monthly credits
- **BYOK**: Users save own Gemini API key, validation via test request
- **Usage Tracking**: Per-request logging with model, tokens, credits, response time
- **Rate Limiting**: 10 requests/hour for free tier
- **15+ AI Operations** via `useAI` hook: task intelligence (title, points, priority, labels), code intelligence (commit messages, PR summaries), sprint analysis, predictive analytics, natural language Q&A
- **Smart Model Routing**: Flash vs Flash-Lite based on complexity
- **MockAIService**: Full fallback when Gemini not configured -- features work without API keys
- **Project Insights**: Sprint health, risk detection, team workload analysis
- **Task Generation from NL**: Break feature descriptions into 3-8 tasks with points/dependencies
- **Standup Summary**: Daily standup with AI-enhanced narrative or basic fallback
- **Security concern**: API key "encryption" is base64 only (btoa/atob), not real encryption

### Video Conferencing -- DEFER
- Room CRUD with full settings (max participants, recording, waiting room, etc.)
- Join/leave with participant management and auto-host reassignment
- Media state management: audio/video/screen toggle per participant
- Host controls: mute, remove participant
- **Reality**: Generates Jitsi Meet URLs (`https://meet.jit.si/${roomId}`) -- no access control on rooms
- **Stubs**: `startRecording`/`stopRecording` just set a string field, `sendSignal` just `console.log`s
- No actual WebRTC/signaling infrastructure

### Chat System -- MVP READY
- 5 channel types: public, private, direct, project, sprint
- DM deduplication (prevents duplicate DM channels)
- 6 message types: text, file, image, code, task, meeting
- Thread replies with parent message reference
- Mentions with user notification
- Message editing/deletion with permission checks
- Emoji reactions with toggle behavior
- Per-message read receipts
- Typing indicators with 3-second timeout
- Full-text search via Convex searchIndex
- Join/leave with system messages
- Per-channel notification settings: muted, muteUntil, notifyFor (all/mentions/none)
- Admin-only message pinning
- Unread count per channel
- **Missing**: No file upload handling, no markdown rendering, no link previews

### Meetings -- MVP READY
- Meeting CRUD with workspace/project association
- 5 types: standup, retrospective, planning, review, custom
- Sprint association
- Attendee RSVP: pending, accepted, declined, tentative with timestamps
- Action items with completion tracking and assignees
- **Convert action items to tasks**: Creates task with meeting reference, labels, proper numbering
- Recurrence: daily, weekly, monthly with intervals and end dates
- 4 meeting templates: standup, retro, planning, review (with agendas and durations)
- Queries: project meetings, workspace meetings (date range + type filter), user meetings
- Notes field for meeting minutes
- **Missing**: No video room auto-creation, no calendar sync, no reminders

### Whiteboard -- MVP READY (solo + basic collab)
- 6 element types: shape (rectangle/circle/triangle/diamond/arrow/star), text, line, image, sticky, drawing
- Element CRUD with auth and lock checks
- Batch element updates for performance
- Version tracking with automatic increment
- Collaborative cursors with user-specific colors
- Snapshot creation and restoration with auto-backup
- Access control: public/private, creator, collaborator-based
- Whiteboard cloning
- Image upload via Convex storage
- Element locking per-element and per-whiteboard
- Collaborator activity tracking (60-second window)
- **Stubs**: Export returns mock URL, thumbnail is SVG placeholder with element count
- **Missing**: No undo/redo, no element grouping, no z-index management

### Automation/Workflows -- PUBLIC PREVIEW
- Engine framework with condition evaluation (13 operators: equals, contains, regex, in, between, etc.)
- AND/OR connector support for conditions
- Variable replacement in strings using `{{path.to.value}}`
- Sequential action execution with result chaining
- Workflow run tracking with execution logs
- 4 built-in templates: task overdue notification, sprint daily summary, auto-assign by skill, GitLab sync
- Workflow export/import as templates
- **Implemented actions**: CREATE_TASK, UPDATE_TASK, ASSIGN_TASK, CHANGE_TASK_STATUS, SEND_SLACK_MESSAGE, UPDATE_CUSTOM_FIELD, IF_THEN_ELSE, WAIT, RUN_WEBHOOK
- **Unimplemented actions**: SEND_EMAIL, GENERATE_REPORT, CREATE_MEETING, LOG_TIME, CREATE_GITLAB_ISSUE/MR
- **Bug**: `runCount` operator precedence: `runCount ?? 0 + 1` evaluates as `runCount ?? 1`
- **Bug**: `incrementWorkflowErrorCount` is a no-op (errorCount field removed from schema)

### Custom Fields -- MVP READY
- 8 field types: text, number, date, select, multiselect, boolean, url, email
- Field definition CRUD with workspace/entity association
- Validation: required checks, min/max, regex patterns, select option validation, URL/email format
- Per-field view/edit permissions
- Value CRUD with upsert, bulk set, delete
- Search by custom field values: 9 filter operators
- Active/inactive toggle (soft delete)
- Default value support
- **Performance concern**: `searchByCustomFields` does full table scan then filters

---

## 5. Marketing Pages Redesign

### Landing Page -- KEEP but audit claims

**Current state**: Production-quality, 9 sections, responsive, strong visual identity.

**Changes needed for MVP messaging**:
1. **Hero**: Change "YOUR REPO IS THE SOURCE OF TRUTH" -- keep, it's accurate
2. **Features Section**: Remove or badge features that aren't ready:
   - "TECH DEBT SURFACING" -- not built, remove or mark "Coming Soon"
   - "BITBUCKET" support claims -- if not built, remove from copy
   - Verify "OPEN SOURCE" + "MODIFIED MIT LICENSE" claim is accurate
3. **Secondary Features**: Badge as "Coming Soon" or remove:
   - "Automation" -- schema only, no engine
   - "Multi-Platform" -- verify CLI actually works
4. **Pricing Preview**: Reduce to 2 tiers (Free + Pro), remove Enterprise
5. **Footer**: Remove 9 "(SOON)" links or gray them out clearly

### Pricing Page -- MAJOR REDESIGN

**Current state**: 4-tier pricing with aggressive claims, no Stripe.

**Redesign for MVP**:
1. **Reduce to 2 tiers**: Free (LOCALHOST) + Pro (STARTUP, renamed)
2. **Remove**: Enterprise tier entirely (no SSO, no on-premise, no SOC2)
3. **Remove**: Scale tier (API access, BYOK not ready)
4. **Remove**: ROI calculator (17,268% claim is aggressive)
5. **Remove**: "What's an AI Operation?" section (AI not ready)
6. **Add**: Clear "MVP / Early Access" badge at top
7. **Add**: "More tiers coming soon" note
8. **CTA**: Change from "Start Free Trial" to "Join Beta" or "Get Early Access"
9. **Keep**: Monthly/yearly toggle (for when Stripe is added)

### Contact Page -- FIX OR SIMPLIFY

**Current state**: Form with fake `setTimeout` submission.

**Options**:
1. **Quick fix**: Wire form to a Convex mutation that stores contact requests (like waitlist)
2. **Simplify**: Remove form entirely, just show email addresses
3. **Must do**: Remove fake phone number (1-888-LTF1-DEV)
4. **Must do**: Verify social links exist or remove them

### Blog Page -- REMOVE

**Current state**: 8 fabricated blog posts with fake authors, broken individual post links.

**Action**: Remove from navigation and routing entirely. Fabricated content is a credibility risk. When ready, either:
- Add 1-2 genuine posts about the product vision
- Integrate with a real CMS (MDX, Contentlayer, or external)

### Coming Soon / Waitlist -- KEEP

**Current state**: Fully functional, real backend.

**Changes**: None needed. This is the best-built public page.

### Required New Pages

1. **Privacy Policy** -- LEGAL REQUIREMENT before launch
2. **Terms of Service** -- LEGAL REQUIREMENT before launch
3. **MVP Badge/Banner** -- Add a persistent "Early Access" or "Beta" indicator across all pages

---

## 6. Infrastructure & Performance

### Error Handling -- CRITICAL GAP
- **No React Error Boundary** in the entire app
- Only 86 try/catch blocks across 20 files
- No global error handler for Convex client errors
- Backend errors are bare strings (`throw new Error("Unauthorized")`) with no error codes

### Data Validation
- 23 uses of `v.any()` in schema (activities table is entirely permissive)
- ~40% of public functions missing `returns:` validators

### Performance Hotspots
- `globalSearch`: 5 full table scans per query
- `getMyTasks` / `getTasksByUser`: Full table scan on tasks
- `getWorkspaceLabels`: Iterates all projects then all tasks
- `createTask` task number generation: Collects ALL tasks to find max number
- 93 total `.collect()` calls across 30+ files (many without limits)
- Permission checks involve multiple sequential DB reads (N+1 pattern)

### Environment
- No runtime validation of required environment variables
- Default access code (`668588907`) in `.env.example` checked into VCS

### Cron Jobs
- 3 GitHub sync crons (1min, 15min, 1hr) -- well structured, no issues

---

## 7. Bugs Found

### Critical Bugs (will crash at runtime)

| Bug | Location | Severity |
|-----|----------|----------|
| GitLab `response.json()` called twice on same response | `convex/integrations/gitlab/sync.ts` | **Crashes every sync** |
| `WorkspaceSettingsPage` references `getWorkspace` (should be `getWorkspaceById`) | `apps/web/src/pages/WorkspaceSettingsPage.tsx:40` | Page will crash |

### Security Bugs

| Bug | Location | Severity |
|-----|----------|----------|
| Duplicate time tracking code WITHOUT permission checks | `convex/tasks/timeTracking.ts` | Bypasses access control |
| API key "encryption" is just base64 (btoa/atob) | `convex/aiCredits/mutations.ts` | Keys recoverable |
| `processEventTrigger` is public action, should be internal | `convex/automation.ts` | Unauthorized trigger execution |

### Logic Bugs

| Bug | Location | Severity |
|-----|----------|----------|
| Slack sprint commands use `args.projectId` instead of `channelMapping.projectId` | `convex/integrations/slack/commands.ts:296-298,330-333` | Sprint commands fail |
| Automation `runCount` operator precedence: `?? 0 + 1` = `?? 1` | `convex/automation.ts:566` | Silently corrupts run counts |
| Automation `incrementWorkflowErrorCount` is a no-op | `convex/automation.ts:652-658` | Error tracking lost |
| `members.ts` reads `project.members` array that doesn't exist | `convex/projects/members.ts` | Returns empty/crashes |
| Dashboard meetings count hardcoded to "0" | `apps/web/src/pages/Dashboard.tsx` | Shows wrong data |
| GitHub webhook uses `accountId: 0` hardcoded | `convex/http.ts:304` | Wrong data stored |
| Whiteboard `getStorageUrl` takes `v.string()` not `v.id("_storage")` | `convex/whiteboard.ts` | Wrong type |
| Whiteboard `.filter()` instead of `.withIndex()` for projectId/meetingId | `convex/whiteboard.ts` | Performance issue |
| Slack `handleSlashCommand` returns response but validator says `v.null()` | `convex/integrations/slack/commands.ts` | Type mismatch |

### Data/UI Bugs

| Bug | Location | Severity |
|-----|----------|----------|
| Dashboard system metrics are fake values | `apps/web/src/pages/Dashboard.tsx` | Shows fake data |
| Blog post links go to 404 | `apps/web/src/pages/BlogPage.tsx` | Broken navigation |
| Contact form submits to nowhere | `apps/web/src/pages/ContactPage.tsx:33-39` | Lost user data |
| Whiteboard export returns mock URL | `convex/whiteboard.ts:700` | Feature doesn't work |
| Whiteboard thumbnail is SVG placeholder | `convex/whiteboard.ts:871` | Not a real preview |

---

## 8. Priority Action Items

### Before Launch (P0)

1. **Add React Error Boundary** -- 1 hour
   - Wrap App component, wrap route groups
   - Show user-friendly error UI instead of white screen

2. **Convert admin/migration mutations to `internalMutation`** -- 30 min
   - `clearGitHubData`, `clearOldActivities`, `migrateExistingUsersToActive`, `migrateTasksToMultipleAssignees`, `cleanupDeprecatedAssigneeId`

3. **Add auth to `getUserById`** -- 15 min

4. **Fix `WorkspaceSettingsPage` API reference** -- 5 min
   - Change `getWorkspace` to `getWorkspaceById`

5. **Remove/replace `globalSearch` full table scans** -- 2-4 hours
   - Use Convex search indexes or limit results

6. **Remove fake dashboard widgets** -- 30 min
   - System Metrics widget, hardcoded meetings "0"

7. **Remove blog page from routing** -- 15 min

8. **Add Privacy Policy + Terms of Service pages** -- External/legal work

9. **Redesign pricing to 2 tiers** -- 2-3 hours

10. **Add "Early Access" / "Beta" banner across app** -- 1 hour

### After Launch (P1)

11. Move OAuth token queries server-side (GitHub, Slack)
12. Add `returns:` validators to all public functions
13. Delete duplicate `convex/tasks/timeTracking.ts`
14. Fix `convex/projects/members.ts` stale query
15. Add rate limiting to newsletter, CLI refresh, search
16. Add workspace membership checks to audit log queries
17. Convert `createAuditLog` to `internalMutation`
18. Wire up contact form to real backend
19. Consolidate duplicate Kanban board components
20. Add "My Tasks" widget to dashboard

### Phase 2 (Public Preview features)

21. Build subtasks UI
22. Wire up actual AI API calls + insight generation
23. Add Slack webhook handler + message sending
24. Integrate video provider (Daily.co)
25. Build team edit/delete/member management UI
26. Add whiteboard real-time collaboration
27. Build automation execution engine

---

## Navigation Restructure for MVP

### Keep in Sidebar (Core)
1. Dashboard
2. My Profile
3. Workspaces
4. Projects
5. Tasks
6. Sprints (currently inside TeamPage -- consider promoting)
7. Chat (fully implemented -- threads, reactions, read receipts)
8. Meetings (scheduling, RSVP, action items, templates)
9. Settings

### Keep in Sidebar (Label "Beta")
10. Whiteboard (working with collab cursors, label "Beta")
11. Team (partial -- rename to "Team Directory")

### Remove from Sidebar
12. Slack (sprint command bugs, no OAuth flow)
13. Video (just Jitsi URL wrapper)

### Keep in Public Nav
- Landing Page
- Pricing (redesigned to 2 tiers)
- Waitlist / Coming Soon
- Contact (with real form or just emails)

### Remove from Public Nav
- Blog (fabricated content)

---

## Summary

**What you're shipping**: A code-aware project management tool with real Git integration (GitHub), solid task/project/sprint management, real-time chat with threads and reactions, meeting scheduling with RSVP and action items, custom fields, a whiteboard, AI features with graceful fallbacks, a beautiful 9-theme system, and a waitlist-gated beta.

**What you're NOT shipping**: Video calls, GitLab, Slack integration, automation engine, blog, enterprise features.

**What needs to be communicated**: This is an "Early Access" / "Beta" product. The landing page should set expectations. The pricing page should be honest about what's available now vs. coming soon.

**Estimated time to MVP-ready**: 1-2 days for P0 fixes (security + UI cleanup), plus legal work for Privacy Policy / ToS.

---

## Appendix: Detailed Feature Readiness (10-point scale)

| Feature | Backend | Frontend | Auth/Perms | Tests | Overall |
|---------|---------|----------|------------|-------|---------|
| Tasks | 9/10 | 9/10 | 8/10 | 0/10 | 8/10 |
| Projects | 9/10 | 8/10 | 8/10 | 0/10 | 8/10 |
| Workspaces | 9/10 | 7/10 | 9/10 | 0/10 | 8/10 |
| Sprints | 9/10 | 8/10 | 8/10 | 0/10 | 8/10 |
| Chat | 9/10 | ?/10 | 8/10 | 0/10 | 7/10 |
| Meetings | 9/10 | 7/10 | 8/10 | 0/10 | 7/10 |
| GitHub | 8/10 | 7/10 | 6/10 | 0/10 | 7/10 |
| AI Features | 8/10 | 7/10 | 7/10 | 0/10 | 7/10 |
| Custom Fields | 9/10 | ?/10 | 7/10 | 0/10 | 7/10 |
| Whiteboard | 8/10 | 7/10 | 7/10 | 0/10 | 7/10 |
| Dashboard | 6/10 | 6/10 | 5/10 | 0/10 | 5/10 |
| Teams | 5/10 | 4/10 | 6/10 | 0/10 | 4/10 |
| Slack | 7/10 | 3/10 | 5/10 | 0/10 | 4/10 |
| Automation | 6/10 | 2/10 | 4/10 | 0/10 | 3/10 |
| GitLab | 3/10 | 0/10 | 3/10 | 0/10 | 2/10 |
| Video | 5/10 | 2/10 | 5/10 | 0/10 | 2/10 |

Note: "?/10" indicates frontend component existence was not fully verified in audit. Test coverage is 0/10 across the board -- there are zero automated tests in the codebase.
