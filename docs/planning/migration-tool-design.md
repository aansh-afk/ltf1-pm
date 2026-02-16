# LTF1 Migration Tool: One-Click Import from Linear & Jira

> **Date**: February 2026
> **Status**: Design Document
> **Priority**: Phase 1 Launch Requirement

---

## Overview

A wizard-based migration tool that lets teams import their entire project history from Linear or Jira into LTF1 with a single click. Full OAuth authentication, automatic user mapping, and real-time progress tracking.

**Goal**: Zero-friction switching. Connect, select, click, done.

---

## What Gets Imported

| Entity | Linear | Jira | LTF1 Target |
|--------|--------|------|-------------|
| Projects | Teams + Projects | Projects | `projects` table |
| Tasks/Issues | Issues (with hierarchy) | Issues (Story/Bug/Task/Epic/Sub-task) | `tasks` table |
| Sprints/Cycles | Cycles | Sprints (Agile board) | `sprints` table |
| Labels | Labels | Labels | `tasks.labels` array |
| Comments | Comments | Comments | `comments` table |
| Attachments | Attachments | Attachments | `attachments` table (Convex storage) |
| Users | Members | Users | User mapping (email-based) |
| Priorities | 5-level (0-4) | 5-level (Highest-Lowest) | 4-level (urgent/high/medium/low) |
| Statuses | Custom per team | Custom per workflow | 6 statuses (backlog/todo/in_progress/in_review/done/cancelled) |
| Estimates | Points | Points + Time | `tasks.estimate` (points + hours) |
| Due dates | Due dates | Due dates | `tasks.dueDate` |
| Parent/child | Sub-issues | Sub-tasks + Epic links | `tasks.parentTaskId` |

**Not imported** (by design): Custom views, favorites, integrations, webhooks, automation rules, custom workflows. These are LTF1-specific and should be configured fresh.

---

## API Access

### Linear API

- **Type**: GraphQL (`https://api.linear.app/graphql`)
- **Auth**: OAuth 2.0 (refresh tokens mandatory after April 2026)
- **Pagination**: Relay-style cursor-based (`first/after`, `last/before`)
- **Default page size**: 50 results
- **Rate limits**: Reasonable (no strict published limits)
- **Key queries**: `teams`, `projects`, `issues`, `cycles`, `comments`, `users`, `attachments`
- **Native CSV export**: Available via Cmd+K (includes ID, Team, Title, Description, Status, Estimate, Priority, Project, Creator, Assignee, Labels, Cycle, Dates)

### Jira API

- **Type**: REST v3 (`https://{domain}.atlassian.net/rest/api/3/`)
- **Auth**: OAuth 2.0 (3LO) via Atlassian Developer Console
- **Pagination**: Offset-based (`startAt`, `maxResults`)
- **Agile API**: `/rest/agile/1.0/` for sprints and boards
- **Rate limits**: Point-based (enforced March 2, 2026). 5 concurrent bulk requests max.
- **Native CSV export**: Max 1,000 issues, loses comments and attachments
- **Custom fields**: Referenced by `customfield_{id}` (not by name), requires metadata discovery

---

## Authentication Flow

Both sources use full OAuth 2.0, following the same pattern as existing GitHub/GitLab integrations.

### Flow

```
User clicks "Connect Linear" or "Connect Jira"
  -> Frontend calls mutation: createOAuthState (stores CSRF state in DB)
  -> Frontend redirects to provider OAuth URL
  -> User authorizes in provider
  -> Provider redirects to our HTTP callback endpoint
  -> HTTP handler verifies state, calls action to exchange code for token
  -> Action fetches org/user info from provider API
  -> Action calls mutation to store token in DB
  -> HTTP handler redirects to frontend with success param
  -> Frontend detects connection, advances wizard
```

### OAuth Endpoints

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/linear/callback` | GET | Linear OAuth callback |
| `/api/jira/callback` | GET | Jira OAuth callback |

### Environment Variables

```
LINEAR_CLIENT_ID=
LINEAR_CLIENT_SECRET=
LINEAR_REDIRECT_URI=https://{convex-url}.convex.site/api/linear/callback

JIRA_CLIENT_ID=
JIRA_CLIENT_SECRET=
JIRA_REDIRECT_URI=https://{convex-url}.convex.site/api/jira/callback

SITE_URL=https://your-app.vercel.app
```

---

## Schema Additions

### New Tables

```
linearIntegrations
  - workspaceId: Id<"workspaces">
  - accessToken: string
  - organizationId: string
  - organizationName: string
  - active: boolean
  - connectedBy: Id<"users">
  - connectedAt: number
  - updatedAt: number
  Indexes: by_workspace, by_organization

linearOAuthStates
  - state: string
  - workspaceId: Id<"workspaces">
  - userId: Id<"users">
  - createdAt: number
  - expiresAt: number (10 min TTL)
  Index: by_state

jiraOAuthStates
  - state: string
  - workspaceId: Id<"workspaces">
  - userId: Id<"users">
  - createdAt: number
  - expiresAt: number (10 min TTL)
  Index: by_state

importJobs
  - workspaceId: Id<"workspaces">
  - userId: Id<"users">
  - source: "linear" | "jira"
  - status: "pending" | "fetching" | "mapping" | "importing" | "completed" | "failed" | "cancelled"
  - config: {
      sourceProjectIds: string[]
      targetProjectMappings: { sourceProjectId, sourceProjectName, targetProjectId?, createNew, newProjectKey? }[]
      importOptions: { tasks, comments, attachments, sprints, labels } (all boolean)
      userMappings: { sourceUserId, sourceUserName, sourceUserEmail?, targetUserId? }[]
    }
  - progress: {
      phase: string
      totalItems: number
      processedItems: number
      currentBatch: number
      totalBatches: number
      errors: { item, error, timestamp }[]
    }
  - summary?: { projectsCreated, tasksImported, commentsImported, attachmentsImported, sprintsImported, labelsImported, errors, duration }
  - startedAt?: number
  - completedAt?: number
  - createdAt: number
  - updatedAt: number
  Indexes: by_workspace, by_user, by_status

importIdMappings
  - importJobId: Id<"importJobs">
  - sourceType: "project" | "task" | "sprint" | "comment" | "attachment" | "label" | "user"
  - sourceId: string
  - targetId: string
  - createdAt: number
  Indexes: by_job, by_job_and_source
```

### Existing Tables (No Changes Needed)

- `jiraIntegrations` - Already has all required fields
- `jiraProjectMappings` - Already has sync direction and project mapping

---

## Data Mapping

### Priority Mapping

```
Linear → LTF1:
  0 (No priority)  → "low"
  1 (Urgent)        → "urgent"
  2 (High)          → "high"
  3 (Medium)        → "medium"
  4 (Low)           → "low"

Jira → LTF1:
  Highest → "urgent"
  High    → "high"
  Medium  → "medium"
  Low     → "low"
  Lowest  → "low"
```

### Status Mapping

```
Linear → LTF1:
  Backlog      → "backlog"
  Todo         → "todo"
  In Progress  → "in_progress"
  In Review    → "in_review"
  Done         → "done"
  Cancelled    → "cancelled"

Jira → LTF1 (fuzzy matching, case-insensitive):
  "To Do" / "Open" / "Backlog" / "New"           → "todo"
  "In Progress" / "In Development" / "Active"      → "in_progress"
  "In Review" / "Code Review" / "QA" / "Testing"   → "in_review"
  "Done" / "Closed" / "Resolved" / "Complete"       → "done"
  "Cancelled" / "Won't Do" / "Rejected"             → "cancelled"
  (anything else)                                     → "backlog"
```

### Issue Type Mapping

```
Linear → LTF1:
  (No direct type — mapped by labels or inferred)
  Default → "task"
  Has "bug" label → "bug"
  Has "feature" label → "feature"

Jira → LTF1:
  Story        → "feature"
  Bug          → "bug"
  Task         → "task"
  Epic         → "epic"
  Sub-task     → "task" (with parentTaskId set)
  Improvement  → "improvement"
  (other)      → "task"
```

---

## Import Architecture

### Batching Strategy

Convex constraints:
- **Actions**: 10-minute timeout per invocation
- **Mutations**: 8MB transaction size limit
- **Solution**: Chain batches via `ctx.scheduler.runAfter(0, ...)`

Each phase processes data in pages of 50-100 items:

```
startImport (action)
  -> fetchProjects (action, page 1)
    -> storeProjects (mutation, batch)
    -> fetchProjects (action, page 2) [scheduled]
  -> fetchSprints (action, per project, paginated) [scheduled after projects]
    -> storeSprints (mutation, batch)
  -> fetchTasks (action, per project, paginated) [scheduled after sprints]
    -> storeTasks (mutation, batch of 50)
  -> fetchComments (action, per task batch) [scheduled after tasks]
    -> storeComments (mutation, batch)
  -> fetchAttachments (action, per task batch) [scheduled after comments]
    -> downloadAndStoreAttachments (action -> storage upload -> mutation)
  -> completeImport (mutation) [scheduled after last batch]
```

Each batch action:
1. Fetches one page from external API
2. Calls a mutation to write data and store ID mappings
3. Updates `importJobs.progress`
4. Schedules next page (if more data) or next phase (if done)

### Rate Limiting

- **Linear**: 100ms delay between API calls (conservative)
- **Jira**: Track consumed points. Pause at 80% of budget. Parse `Retry-After` header on 429.
- **Both**: Exponential backoff on transient errors (429, 500, 502, 503). Max 3 retries per batch.

### Entity Creation Order

Must respect foreign key dependencies:

```
1. Projects (no dependencies)
2. Sprints (depends on projects)
3. Tasks - pass 1: create all tasks without parentTaskId (depends on projects + sprints)
4. Tasks - pass 2: patch parentTaskId using importIdMappings (depends on tasks)
5. Comments (depends on tasks)
6. Attachments (depends on tasks)
```

### Attachment Handling

Attachments require download from source and re-upload to Convex storage:

```
1. Action fetches attachment URL from source API
2. Action downloads file bytes using source access token
3. Action uploads to Convex storage via ctx.storage.store(blob)
4. Action calls mutation to create attachment record with storageId
```

Estimated 2-5 seconds per attachment. Large imports may take significant time.

---

## Progress Tracking

### Real-Time Updates

The `importJobs` table is a reactive Convex document. Frontend subscribes via `useQuery`:

```typescript
const job = useQuery(api.integrations.import.queries.getImportJobStatus, { jobId });
```

This auto-updates whenever any mutation modifies the job row. No polling needed.

### Progress Fields

- `progress.phase`: Current phase name ("Fetching projects", "Importing tasks", etc.)
- `progress.processedItems / totalItems`: Overall completion ratio
- `progress.currentBatch / totalBatches`: Batch-level progress
- `progress.errors[]`: Array of failed items (capped at 100)

### Frontend Display

- BrutalProgress bar showing `processedItems / totalItems`
- Phase indicator text
- Live counter: "345 / 1,200 tasks imported"
- Collapsible error list
- Cancel button (sets status to "cancelled", batch actions check before proceeding)
- Estimated time remaining: `(elapsed / processed) * remaining`

---

## Error Handling

### Retry Logic

- Transient HTTP errors (429, 500, 502, 503): Retry with exponential backoff (1s, 2s, 4s)
- 429 with Retry-After: Respect the header value
- Max 3 consecutive failures per batch before marking the batch as failed
- Job continues to next batch even if one batch fails (partial import)

### Partial Failures

- Individual item failures logged in `progress.errors[]`
- Import continues past failures (skip and log)
- Summary shows total errors at completion
- User can see exactly which items failed and why

### Rollback

- No automatic rollback (destructive and complex)
- Manual "Delete Imported Data" action available
- Uses `importIdMappings` to find and delete all created entities
- Explicit user action with confirmation dialog

### Job Cancellation

- User can cancel at any time
- Sets `importJobs.status` to "cancelled"
- Each scheduled batch checks status before proceeding
- Already-imported data is kept (not rolled back)

---

## Frontend Wizard

### Steps

**Step 1 - Choose Source**: Two cards: "Import from Linear" / "Import from Jira". Shows connected status if already authenticated.

**Step 2 - Connect (OAuth)**: OAuth redirect flow. Shows "Connecting..." spinner. Auto-advances on success. "Connection failed" with retry on error.

**Step 3 - Select Projects**: Fetches available projects from source API. Checkbox list with project name, task count, last updated. Option per project: "Create New" or "Map to Existing LTF1 Project".

**Step 4 - Map Users**: Lists all source users found in selected projects. Auto-matches by email (highlighted green). Dropdown for manual mapping of unmatched users. "Skip" option (tasks created without assignee).

**Step 5 - Import Options**: Checkboxes (all default ON): Tasks, Comments, Attachments, Sprints/Cycles, Labels. Attachment storage warning. Estimated item count display.

**Step 6 - Confirm**: Summary of selections. "Start Import" button. Creates `importJob` and schedules first batch.

**Step 7 - Progress**: Real-time progress bar. Phase indicator. Item counter. Error list (collapsible). Cancel button. On completion: summary card with counts + "Go to Projects" link.

### Route

New lazy-loaded route in App.tsx:
```
/workspace/:workspaceId/import → ImportPage
```

Also accessible from Workspace Settings as an "Import Data" card.

---

## Backend File Structure

Following existing patterns at `convex/integrations/{provider}/`:

```
convex/integrations/
  linear/
    oauth.ts          - createOAuthState, storeLinearConnection, disconnectLinear
    actions.ts        - exchangeCodeForToken, fetchTeams, fetchProjects, fetchUsers
    queries.ts        - getOAuthState, getLinearIntegration
    types.ts          - LinearTeam, LinearProject, LinearIssue, LinearCycle, etc.
  jira/
    oauth.ts          - createOAuthState, storeJiraConnection, refreshJiraToken
    actions.ts        - exchangeCodeForToken, fetchProjects, fetchUsers
    queries.ts        - getOAuthState, getJiraIntegration
    types.ts          - JiraProject, JiraIssue, JiraSprint, etc.
  import/
    actions.ts        - fetchSourceProjects, startImport, deleteImportedData
    mutations.ts      - createImportJob, updateProgress, addError, completeImport, storeIdMapping
    queries.ts        - getImportJobStatus, getImportJobs
    linearFetcher.ts  - fetchProjectsBatch, fetchSprintsBatch, fetchTasksBatch, etc.
    jiraFetcher.ts    - same pattern for Jira REST API
    batchWriter.ts    - writeProjectBatch, writeSprintBatch, writeTaskBatch, etc.
    mappers.ts        - mapLinearPriority, mapJiraStatus, mapJiraIssueType, etc.
    types.ts          - ImportJob, ImportConfig, SourceProject, SourceTask, etc.
```

HTTP routes added to `convex/http.ts`:
- `/api/linear/callback` (GET)
- `/api/jira/callback` (GET)

Frontend files:
```
apps/web/src/
  pages/ImportPage.tsx
  components/features/import/
    ImportWizard.tsx
    steps/
      SourceSelectStep.tsx
      ConnectStep.tsx
      ProjectSelectStep.tsx
      UserMappingStep.tsx
      OptionsStep.tsx
      ConfirmStep.tsx
      ProgressStep.tsx
```

---

## Known Challenges

1. **Jira custom status names**: Jira allows arbitrary workflow status names. Fuzzy matching required. Fallback to "backlog" for unrecognized statuses.

2. **Jira custom fields**: Referenced by `customfield_{id}`, not by name. Requires metadata discovery API call before import to map field IDs to types.

3. **Attachment size**: Large attachments slow down import. Consider setting a per-file size limit (50MB) and skipping larger files with a warning.

4. **Task number generation**: Bulk-creating tasks requires sequential task numbers. Batch writer must query max number once per batch and increment.

5. **Subtask ordering**: Parent tasks must exist before children. Two-pass approach: create all tasks first, then patch `parentTaskId` using ID mappings.

6. **Linear team-based issues**: Linear issues belong to teams, not projects directly. Need to handle the team → project mapping during import.

7. **Jira rate limits (March 2026)**: New point-based rate limits. Need to track point consumption and throttle accordingly.

8. **Token refresh**: Jira tokens expire. Need background refresh logic. Linear OAuth refresh tokens mandatory after April 2026.

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Import completion rate | >95% of started imports complete successfully |
| Data accuracy | >99% of imported items match source data |
| Time to import 1,000 tasks | <5 minutes |
| User mapping accuracy (auto-match) | >80% of users auto-matched by email |
| Post-import user satisfaction | Users can find all their data in LTF1 |
