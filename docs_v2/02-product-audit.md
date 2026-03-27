# Product Audit — ltf1-pm

Complete audit of every feature across all three surfaces (web, TUI, backend).

---

## Audit Methodology

Every feature is rated on:
- **Completeness**: Is the feature fully implemented? (1-5)
- **Polish**: Is it production-quality? (1-5)
- **Strategic Fit**: Does it align with the agent-native dev workspace vision? (1-5)
- **Verdict**: Ship as-is, Improve, Rethink, or Cut

---

## Core Task Management

### Task CRUD
| Dimension | Rating | Notes |
|-----------|--------|-------|
| Completeness | 5/5 | Create, read, update, delete fully working across web + TUI + CLI |
| Polish | 5/5 | BrutalModal-based creation, 4 view modes, bulk operations, filters |
| Strategic Fit | 5/5 | Core to the product |
| **Verdict** | **Ship** | Excellent. Add agent-driven task creation as enhancement. |

**Web**: CreateTaskModal with title, description, type (5 options), priority (4 levels), labels, smart AI assignment toggle, estimate, multi-assignee. 4 view modes: Board (kanban), List, Calendar, Table. Advanced filtering with 12 filter types. Bulk operations for status, priority, delete. Filter presets saved per user.

**TUI**: Full CRUD with 4-step creation wizard (title → type → priority → description). List view with status filtering. Move, edit, delete, assign, comment operations. Keyboard-driven (j/k navigation, c/e/d/m/a/x shortcuts).

**CLI**: `ltf task create|list|view|update|done|assign|delete|comment|mine` — full command suite with flags for all fields, JSON output support.

**Backend**: `tasks` table with 30+ fields. Indexes: by_projectId, by_projectId_and_status, by_assigneeId, by_workspaceId. Full-text search on title. getProjectTasks, getFilteredTasks, getMyTasks, getTasksByWorkspace queries. createTask, updateTask, deleteTask, moveTask, bulkUpdateTasks, bulkDeleteTasks mutations.

### Task Views
| View | Web | TUI | Quality |
|------|-----|-----|---------|
| **Kanban Board** | Yes (drag-drop columns) | No (list only) | Web: 5/5, TUI: N/A |
| **List View** | Yes (sortable) | Yes (primary view) | 5/5 |
| **Calendar View** | Yes (drag-drop) | No | Web: 4/5 |
| **Table View** | Yes (sortable columns) | No | Web: 4/5 |

### Task Features
| Feature | Status | Notes |
|---------|--------|-------|
| Multi-assignee | Complete | assigneeIds array + AI assignment suggestions |
| Subtasks | Complete | parentTaskId with nesting |
| Dependencies | Complete | Array of task IDs, critical path flag |
| Labels | Complete | Array of strings, workspace-level label aggregation |
| Estimates | Complete | Points or hours, AI complexity estimation |
| Due dates | Complete | Start date + due date + completion date |
| Time tracking | Complete | Start/pause/stop timer, manual entries, billable flag |
| Comments | Complete | CRUD with edit timestamps |
| Attachments | Complete | File upload via Convex storage |
| Git linking | Complete | Branch, commits, PR URL auto-parsed from git |
| Progress | Complete | 0-100% manual or calculated |

---

## Sprint Management

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Completeness | 5/5 | Full lifecycle: planning → active → completed |
| Polish | 4/5 | Burndown chart, velocity tracking, AI health insights |
| Strategic Fit | 5/5 | Core to the product |
| **Verdict** | **Ship** | Add AI sprint planning agent. |

**Web**: SprintPage with current sprint card (progress %, points, task breakdown), two tabs (Sprint Board + Backlog & Planning), burndown chart, AI sprint health insights. CreateSprintModal.

**TUI**: Sprint page with overview (list sprints), tasks in sprint, create sprint (4-step wizard), close sprint, add tasks from backlog, view backlog. Stats: total/done/in-progress/todo, velocity bar.

**CLI**: `ltf sprint list|create|status|add|remove|backlog|close` — full sprint management.

**Backend**: `sprints` table with projectId, name, goal, startDate, endDate, status (planning/active/completed). Daily snapshot cron job for burndown. getProjectSprints, getCurrentSprint, getBacklogTasks queries.

---

## Project Management

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Completeness | 4/5 | Full CRUD, team management, repository connection |
| Polish | 4/5 | ProjectManagementPage is comprehensive |
| Strategic Fit | 4/5 | Core but missing roadmap/initiative layer |
| **Verdict** | **Improve** | Add project-level agent configuration and context assembly. |

**Features**: Create project with key, connect GitHub repo, add/remove members (lead/member/contributor/viewer roles), project settings, invite via code, team assignment. Missing: roadmaps, milestones as first-class entity, project templates.

---

## Workspace Management

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Completeness | 5/5 | Full multi-workspace with roles, invitations, billing |
| Polish | 4/5 | WorkspaceManagementPage, switcher, stats |
| Strategic Fit | 4/5 | Core organizational unit |
| **Verdict** | **Ship** | Add workspace-level agent configuration. |

**Features**: Create workspace with slug, invite members (owner/admin/member/viewer), manage roles, workspace settings with feature flags, subscription management (Polar.sh), workspace analytics.

---

## Team Management

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Completeness | 4/5 | Teams, members, expertise matrix |
| Polish | 3/5 | TeamPage functional but could be more refined |
| Strategic Fit | 4/5 | Enables AI assignment and expertise matching |
| **Verdict** | **Improve** | Polish UI, integrate with agent assignment. |

**Features**: Create teams within workspace, add members (lead/member), team expertise matrix, developer profiles with skills/tech stack/availability, reviewer suggestions, GitHub stats sync. Missing: team capacity planning, workload balancing views.

---

## GitHub Integration

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Completeness | 5/5 | Most comprehensive integration in the product |
| Polish | 4/5 | 10,000+ lines of integration code |
| Strategic Fit | 5/5 | Core differentiator — git-native |
| **Verdict** | **Ship** | This is the moat. Enhance with code intelligence. |

**Features**:
- OAuth flow with token management
- GitHub App installation (multi-installation per workspace)
- Bi-directional issue sync with conflict resolution
- Commit parsing for task key references (PROJ-123)
- PR status tracking linked to tasks
- Team sync from GitHub org teams
- Release notes auto-generation
- Repository documentation fetching
- Webhook event processing (push, PR, issue, review)
- Developer GitHub stats sync (PRs, reviews, languages)
- GitHub user → LTF1 user mapping

**Cron Jobs**: Issue sync (1 min), team sync (1 hr), repo sync (15 min), stats sync (30 min)

**Tables**: githubInstallations, githubRepositories, githubCommits, githubPullRequests, githubIssues, githubActivities, githubConnections, githubWebhookEvents, githubUserMappings, githubTeamMappings, githubIssueSyncQueue, workspaceGitHubInstallations

---

## AI Features

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Completeness | 3/5 | Utility functions exist but no agent architecture |
| Polish | 3/5 | Works but not deeply integrated into UX |
| Strategic Fit | 2/5 | **Must evolve from utilities to agents** |
| **Verdict** | **Rethink** | This is the critical gap. Build agent architecture. |

### Current AI Capabilities

| Feature | Backend | Frontend | Quality |
|---------|---------|----------|---------|
| Task suggestions from commits/PRs | convex/ai/generate.ts | AITaskEnhancer | 3/5 |
| Smart task assignment | convex/ai/taskAssignment.ts | TaskAssignmentHelper | 4/5 |
| Project insights (risk/recommendation) | convex/ai/projectInsights.ts | AIInsightsPanel | 3/5 |
| Sprint health analysis | Via insights module | SprintPage health panel | 3/5 |
| Developer expertise matching | convex/ai/taskAssignment.ts | ReviewerSuggestions | 4/5 |
| Natural language task creation | Via generate module | NaturalLanguageTaskCreator | 3/5 |
| Documentation generation | convex/ai/generate.ts | AIDocumentationHub | 2/5 |

### AI Infrastructure

| Component | Status | Notes |
|-----------|--------|-------|
| Multi-provider support | Complete | Gemini, Groq, Cerebras |
| BYOK (Bring Your Own Key) | Complete | API key storage, provider selection |
| Credit system | Complete | Monthly credits, tier-based limits |
| Usage tracking | Complete | Token counts, cost, latency, cache hits |
| Feedback collection | Complete | Helpful flag, 1-5 rating, comments |
| Session logging | Complete | Full AI interaction history |

### What's Missing (Agent Architecture)

| Missing Feature | Priority | Description |
|----------------|----------|-------------|
| **Triage Agent** | P0 | Auto-categorize, prioritize, assign on task creation |
| **Skills System** | P0 | Codifiable, reusable workflow templates |
| **Context Assembly** | P0 | Unified context from tasks + code + team for agent decisions |
| **Agent Memory** | P1 | What the agent has learned about this workspace |
| **Planning Agent** | P1 | Sprint suggestions from backlog + velocity + team capacity |
| **Code Intelligence** | P1 | Understand repository code, not just track commits |
| **Code Review Agent** | P2 | Review PRs against task requirements |
| **Coding Agent** | P2 | Write code from task specs |

---

## Documents & Pages

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Completeness | 4/5 | BlockNote editor with 10 block types, slash commands |
| Polish | 4/5 | Real-time presence, auto-save, breadcrumbs |
| Strategic Fit | 4/5 | Good as knowledge base, needs agent integration |
| **Verdict** | **Improve** | Connect to agent context layer. Add spec → task linking. |

**Features**: Block editor (paragraph, H1-H3, bullet list, numbered list, code block, blockquote, table, image, divider, callout), slash commands, drag-and-drop, multi-user presence indicators, auto-save with status indicator, page sidebar with tree navigation, icon picker.

---

## Automation System

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Completeness | 3/5 | Workflow builder exists but backend incomplete |
| Polish | 2/5 | Visual canvas functional but needs refinement |
| Strategic Fit | 4/5 | Core to rules layer — needs skills upgrade |
| **Verdict** | **Rethink** | Evolve into Skills + Automations system. |

**Current**: Trigger types (event, schedule, webhook, manual) → Conditions (AND/OR operators) → Actions (task ops, notifications, email, Slack, webhooks). Visual flow canvas for workflow building. Enable/disable toggle. Run count tracking.

**Issues (from audit reports)**:
- automation.ts has ACL gaps (6 major security issues from SHIP_AUDIT_3)
- Public mutations should be internal
- Queries lack auth checks
- No-op functions exist
- Schema validator mismatches

---

## Meetings

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Completeness | 4/5 | Full scheduling, RSVP, action items, recordings |
| Polish | 4/5 | ScheduleMeetingModal, MeetingDetailsModal, bulk scheduling |
| Strategic Fit | 1/5 | **Does not align with "zero overhead" vision** |
| **Verdict** | **Cut or Minimize** | Devs don't need a meeting scheduler in their PM tool. Simplify to standup summaries. |

**Features**: Create meetings (standup, retrospective, planning, review, custom), attendees with RSVP (pending/accepted/declined/tentative), action items → task conversion, Google Calendar integration, recurrence patterns, meeting recordings, notes, templates, 15-min reminder cron job.

**Counter-argument**: Daily standup summaries generated by an agent could be valuable. The full meeting scheduler is overhead, but AI-generated standup reports from sprint data could be a differentiator.

---

## Time Tracking

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Completeness | 4/5 | Start/stop/pause, manual entries, reports |
| Polish | 4/5 | TimeTracker widget, TimeReportPage |
| Strategic Fit | 2/5 | **Adds manual overhead** |
| **Verdict** | **Simplify** | Keep auto-tracking from git activity. Remove manual start/stop. |

**Features**: Start/stop/pause timer per task, manual time entries, billable/approved flags, time reports by user/task/project, active timer display.

**Alternative approach**: Automatically calculate "time spent" from git activity (first commit on branch → PR merge). No manual tracking needed. This aligns with the "git is truth" principle.

---

## Notifications

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Completeness | 4/5 | In-app, email, Slack channels |
| Polish | 3/5 | NotificationBell, markRead, granular toggles |
| Strategic Fit | 4/5 | Important for agent-driven workflows |
| **Verdict** | **Improve** | Add agent notification channel. |

**Features**: In-app notification bell with unread count, notification center with mark-read, email notifications via Resend (due date reminders, overdue alerts, meeting reminders), Slack notifications, granular notification toggles in settings (task_assigned, task_comment, sprint_completed, etc.).

---

## Settings

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Completeness | 5/5 | 8 tabs covering all configuration needs |
| Polish | 4/5 | Clean tab navigation, proper form handling |
| Strategic Fit | 4/5 | Needs agent settings tab |
| **Verdict** | **Ship** | Add agent configuration tab. |

**Tabs**: Profile, Developer, Accessibility (font scale, line height, letter spacing, reduced motion, high contrast, focus width), Notifications, Workspace, GitHub, AI, Shortcuts (recorder, import/export JSON).

---

## Landing Page & Marketing

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Completeness | 5/5 | Full marketing site with 8 sections |
| Polish | 4/5 | Strong design, good messaging, ASCII art |
| Strategic Fit | 4/5 | Needs agent-era messaging update |
| **Verdict** | **Improve** | Update messaging from "git-native PM" to "agent-native dev workspace." |

**Sections**: Hero (main CTA), Problem (before/after comparison), How It Works (4-step git flow), App Showcase (3-tab preview), Features Preview (3 key features with stats), Pricing Preview, Final CTA, Footer with newsletter.

**Current messaging**: "Your repo is the source of truth" — good but doesn't mention agents.

**Recommended messaging**: "Your repo is the source of truth. Your agent handles the rest." — adds the agent dimension.

---

## CLI/TUI

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Completeness | 5/5 | 14 command groups, 7 TUI pages, daemon |
| Polish | 4/5 | Sophisticated rendering, animations, keyboard flow |
| Strategic Fit | 5/5 | **THE differentiator** — no competitor has this |
| **Verdict** | **Ship + Enhance** | Add agent commands, skills, triage page. |

Detailed audit in [07-cli-tui.md](07-cli-tui.md).

---

## Theme System

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Completeness | 5/5 | 20 themes, CSS custom properties, performance optimized |
| Polish | 5/5 | Persistence, accessibility validation, batch updates |
| Strategic Fit | 3/5 | Nice to have but not a differentiator |
| **Verdict** | **Ship** | Complete and polished. |

**Themes**: Obsidian, VS Code, Monokai, Solarized, Nord, OneDark, TokyoNight, Catppuccin, Gruvbox, Vercel — each with dark and light variants.

---

## Onboarding

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Completeness | 4/5 | 3-step flow (theme, AI, complete) |
| Polish | 4/5 | Smooth animations, clear steps |
| Strategic Fit | 3/5 | Should include CLI setup step |
| **Verdict** | **Improve** | Add CLI installation step, agent configuration. |

---

## Known Bugs & Security Issues (from Audit Reports)

### Critical (from SHIP_AUDIT_3.md)
1. **automation.ts security**: 6 major ACL gaps — public mutations should be internal, queries lack auth
2. **sprints/snapshots.ts**: Missing auth check on snapshot creation
3. **projects/members.ts**: Returns wrong role in some cases

### High
4. **timeEntries.ts**: Cross-user data leakage potential
5. **WorkspaceSettingsPage**: Feature key mismatch between frontend and backend

### Medium
6. **NotificationCenter**: Hardcoded colors (should use theme variables)
7. **TaskTable**: Some buttons non-functional
8. **BulkActionBar**: Missing status options

### Low
9. **timeEntries.ts**: Performance issues on large datasets
10. **Various modals**: Minor design system compliance issues

---

## Feature Completeness Summary

| Feature | Complete | Polish | Strategic Fit | Verdict |
|---------|----------|--------|---------------|---------|
| Task Management | 5/5 | 5/5 | 5/5 | Ship |
| Sprint Management | 5/5 | 4/5 | 5/5 | Ship |
| Project Management | 4/5 | 4/5 | 4/5 | Improve |
| Workspace Management | 5/5 | 4/5 | 4/5 | Ship |
| Team Management | 4/5 | 3/5 | 4/5 | Improve |
| GitHub Integration | 5/5 | 4/5 | 5/5 | Ship |
| AI Features | 3/5 | 3/5 | 2/5 | **Rethink** |
| Documents/Pages | 4/5 | 4/5 | 4/5 | Improve |
| Automation | 3/5 | 2/5 | 4/5 | **Rethink** |
| Meetings | 4/5 | 4/5 | 1/5 | **Cut** |
| Time Tracking | 4/5 | 4/5 | 2/5 | **Simplify** |
| Notifications | 4/5 | 3/5 | 4/5 | Improve |
| Settings | 5/5 | 4/5 | 4/5 | Ship |
| Landing/Marketing | 5/5 | 4/5 | 4/5 | Improve |
| CLI/TUI | 5/5 | 4/5 | 5/5 | **Enhance** |
| Theme System | 5/5 | 5/5 | 3/5 | Ship |
| Onboarding | 4/5 | 4/5 | 3/5 | Improve |
| Custom Fields | 3/5 | 3/5 | 2/5 | Simplify |
| Developer Profiles | 4/5 | 3/5 | 4/5 | Improve |
| Search | 4/5 | 4/5 | 4/5 | Ship |
| Billing/Subscriptions | 3/5 | 3/5 | 3/5 | Improve |
