# LTF1 AI Agent Integration: MCP Server & Public API

> **Date**: February 2026
> **Status**: Design Document
> **Priority**: High - Key differentiator

---

## Overview

Enable AI coding agents (Claude Code, Cursor, GitHub Copilot, Windsurf, etc.) to automatically read and update LTF1 project data as they work. When a developer finishes a coding session, the AI agent should automatically update task status, log progress, add comments, and create follow-up tasks in LTF1 -- without the developer lifting a finger.

**Vision**: Your AI pair programmer is also your project manager. It knows what task you're working on, updates the board when it's done, and creates the next ticket.

---

## Why This Matters

Today, developers context-switch between their code editor and project management tool dozens of times per day:
- Open Linear/Jira to check task details
- Code for 30 minutes
- Go back to update task status
- Write a comment about what was done
- Create a follow-up task for what's left
- Repeat

With AI agents becoming the primary coding interface, this workflow should be automatic. The AI agent already knows:
- What task the developer is working on (from branch name, task key in commits)
- What was accomplished (it wrote the code)
- What's left to do (it knows the remaining work)
- How long it took (session duration)

LTF1 should be the first project management tool where **your AI does your project management**.

---

## Two Integration Paths

### Path 1: MCP Server (Primary)

**Model Context Protocol** is the standard for AI agents to interact with external tools. Claude Code, Cursor, and other AI IDEs support MCP servers natively.

An LTF1 MCP server would expose tools that AI agents can call during their sessions.

### Path 2: REST API (Universal)

A public REST API for non-MCP integrations, webhooks, and custom tooling. Also serves as the backend for the MCP server.

### Path 3: LTF1 CLI (Already Built)

The existing CLI at `apps/cli/` already has commands for task, sprint, project, and git operations. AI agents can invoke CLI commands directly. The MCP server can wrap CLI commands or call Convex directly.

---

## MCP Server Design

### What is MCP?

Model Context Protocol lets AI agents discover and call tools exposed by external servers. The AI sees a tool list, decides when to use them, and calls them with structured arguments.

### Server Architecture

```
AI Agent (Claude Code, Cursor, etc.)
  ↓ MCP Protocol (stdio or HTTP)
LTF1 MCP Server (Node.js process)
  ↓ Convex Client (authenticated)
LTF1 Backend (Convex)
```

The MCP server is a lightweight Node.js process that:
1. Authenticates with LTF1 using a personal API token
2. Exposes tools for reading and writing project data
3. Maintains context about the current workspace and project
4. Runs locally alongside the AI agent

### Installation

```bash
# Install globally
npm install -g @ltf1/mcp-server

# Or add to Claude Code MCP config (~/.claude/mcp.json)
{
  "mcpServers": {
    "ltf1": {
      "command": "npx",
      "args": ["@ltf1/mcp-server"],
      "env": {
        "LTF1_API_TOKEN": "ltf1_tok_...",
        "LTF1_WORKSPACE": "my-workspace"
      }
    }
  }
}
```

### MCP Tools Exposed

#### Task Management

```
ltf1_get_task
  - args: { taskKey: "WEB-123" } OR { taskId: string }
  - returns: Full task object (title, description, status, priority, assignee, labels, etc.)
  - use case: AI reads task details before starting work

ltf1_list_tasks
  - args: { projectKey?, status?, assignee?, sprint?, limit? }
  - returns: Array of tasks matching filters
  - use case: AI checks what tasks are in current sprint

ltf1_create_task
  - args: { title, description?, projectKey, type?, priority?, assigneeEmail?, labels?, parentTaskKey?, sprintName? }
  - returns: { taskKey, taskId }
  - use case: AI creates follow-up tasks after finding TODOs or bugs

ltf1_update_task
  - args: { taskKey, status?, priority?, title?, description?, labels?, progress? }
  - returns: { success: true }
  - use case: AI updates task status when work is done

ltf1_add_comment
  - args: { taskKey, content }
  - returns: { commentId }
  - use case: AI logs what was accomplished in a coding session

ltf1_assign_task
  - args: { taskKey, assigneeEmail }
  - returns: { success: true }
  - use case: AI assigns tasks to appropriate team members
```

#### Sprint Management

```
ltf1_get_current_sprint
  - args: { projectKey }
  - returns: Sprint object with task counts by status
  - use case: AI checks sprint progress

ltf1_add_to_sprint
  - args: { taskKey, sprintName }
  - returns: { success: true }
  - use case: AI adds newly created tasks to current sprint
```

#### Context & Search

```
ltf1_search
  - args: { query, type?: "task" | "project" | "sprint" }
  - returns: Matching entities
  - use case: AI finds related tasks or projects

ltf1_get_project
  - args: { projectKey }
  - returns: Project details with recent activity
  - use case: AI understands project context

ltf1_get_my_tasks
  - args: { status? }
  - returns: Tasks assigned to authenticated user
  - use case: AI checks what the developer should work on next

ltf1_whoknows
  - args: { technology: "rust" | "react" | etc. }
  - returns: Team members with that expertise
  - use case: AI suggests reviewers or asks for help
```

#### Git Integration

```
ltf1_link_branch
  - args: { taskKey, branch }
  - returns: { success: true }
  - use case: AI links current git branch to task

ltf1_link_pr
  - args: { taskKey, prUrl }
  - returns: { success: true }
  - use case: AI links PR after creating it

ltf1_log_commit
  - args: { taskKey, sha, message }
  - returns: { success: true }
  - use case: AI logs commits against tasks
```

#### Time Tracking

```
ltf1_start_timer
  - args: { taskKey }
  - returns: { timeEntryId }
  - use case: AI starts tracking time when work begins

ltf1_stop_timer
  - args: { taskKey, description? }
  - returns: { duration }
  - use case: AI stops timer and logs what was done

ltf1_log_time
  - args: { taskKey, duration: "2h30m", description? }
  - returns: { timeEntryId }
  - use case: AI logs time after a coding session
```

---

## Automatic Behaviors

### The "Session End" Pattern

When a Claude Code session ends (or reaches a natural stopping point), the AI should automatically:

1. **Detect the current task** from git branch name (e.g., `feature/WEB-123-add-auth`) or recent commits
2. **Summarize what was done** based on the code changes
3. **Update task status** (e.g., move to "in_review" if a PR was created)
4. **Add a comment** with the session summary
5. **Create follow-up tasks** for any TODOs, bugs found, or remaining work
6. **Log time** for the session duration
7. **Link the PR/branch** to the task

### Example Flow

```
Developer: "Fix the login bug described in WEB-42"

Claude Code:
  1. Calls ltf1_get_task({ taskKey: "WEB-42" })
     → Reads bug description, acceptance criteria
  2. Fixes the code, runs tests
  3. Creates a commit: "fix: resolve login redirect loop (WEB-42)"
  4. Creates a PR

  [Session ending or task complete]

  5. Calls ltf1_update_task({ taskKey: "WEB-42", status: "in_review", progress: 90 })
  6. Calls ltf1_add_comment({
       taskKey: "WEB-42",
       content: "Fixed the redirect loop in auth middleware. Root cause was missing session check on /callback route. PR #187 created. Remaining: needs QA verification on Safari."
     })
  7. Calls ltf1_link_pr({ taskKey: "WEB-42", prUrl: "https://github.com/..." })
  8. Calls ltf1_log_time({ taskKey: "WEB-42", duration: "45m", description: "Bug fix + tests" })
  9. Calls ltf1_create_task({
       title: "QA: Verify WEB-42 fix on Safari",
       projectKey: "WEB",
       type: "task",
       priority: "medium",
       parentTaskKey: "WEB-42"
     })
```

The developer did zero project management. It all happened automatically.

### Task Detection Heuristics

The MCP server should be able to detect the current task from context:

1. **Git branch name**: Parse task key from branch (e.g., `feature/WEB-123-*`, `fix/BUG-456-*`)
2. **Recent commits**: Scan commit messages for task key patterns (e.g., `WEB-123`, `[WEB-123]`)
3. **CLAUDE.md / .ltf1.json**: Project-level config can specify current task
4. **Prompt context**: The developer's prompt may mention a task key
5. **Active sprint**: Fall back to checking tasks assigned to the user in the current sprint

---

## REST API Design

### Authentication

```
Authorization: Bearer ltf1_tok_{token}
```

Personal API tokens generated in LTF1 Settings. Scoped to a workspace. Tokens stored hashed in DB, never in plaintext after creation.

### Base URL

```
https://api.ltf1.dev/v1/
```

Or via Convex HTTP actions:
```
https://{deployment}.convex.site/api/v1/
```

### Endpoints

```
# Tasks
GET    /tasks?project={key}&status={status}&assignee={email}&sprint={name}&limit={n}
GET    /tasks/{taskKey}
POST   /tasks
PATCH  /tasks/{taskKey}
DELETE /tasks/{taskKey}
POST   /tasks/{taskKey}/comments
GET    /tasks/{taskKey}/comments

# Projects
GET    /projects
GET    /projects/{projectKey}

# Sprints
GET    /sprints?project={key}&status={status}
GET    /sprints/current?project={key}
POST   /sprints/{sprintId}/tasks  (add task to sprint)

# Search
GET    /search?q={query}&type={task|project|sprint}

# Time Tracking
POST   /time-entries
GET    /time-entries?task={taskKey}&user={email}

# Git
POST   /tasks/{taskKey}/branch
POST   /tasks/{taskKey}/pr
POST   /tasks/{taskKey}/commits

# Users
GET    /users/me
GET    /users?expertise={technology}

# Webhooks (outbound)
POST   /webhooks
GET    /webhooks
DELETE /webhooks/{id}
```

### Request/Response Format

```json
// POST /tasks
{
  "title": "Fix login redirect loop",
  "description": "Users are getting infinite redirect on /callback",
  "projectKey": "WEB",
  "type": "bug",
  "priority": "high",
  "assigneeEmail": "dev@example.com",
  "labels": ["auth", "urgent"],
  "sprintName": "Sprint 14"
}

// Response: 201 Created
{
  "taskKey": "WEB-42",
  "taskId": "j573abc...",
  "url": "https://app.ltf1.dev/workspace/acme/project/web/task/WEB-42"
}
```

### Rate Limits

```
Free:       100 requests/minute
Pro:        1,000 requests/minute
Enterprise: 10,000 requests/minute
```

---

## MCP Server Implementation

### Tech Stack

- **Runtime**: Node.js (matches existing CLI at `apps/cli/`)
- **MCP SDK**: `@modelcontextprotocol/sdk`
- **Convex Client**: `convex` npm package (same as web app)
- **Package**: `@ltf1/mcp-server` on npm
- **Location**: `packages/mcp-server/` in the monorepo

### File Structure

```
packages/mcp-server/
  package.json
  tsconfig.json
  src/
    index.ts              - MCP server entry point, tool registration
    auth.ts               - Token validation, Convex client setup
    tools/
      tasks.ts            - Task CRUD tools
      sprints.ts          - Sprint tools
      search.ts           - Search and context tools
      git.ts              - Git linking tools
      time.ts             - Time tracking tools
    utils/
      task-detection.ts   - Detect current task from git/context
      formatting.ts       - Format responses for AI consumption
    types.ts              - Shared types
```

### Tool Registration Pattern

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const server = new McpServer({
  name: "ltf1",
  version: "1.0.0",
});

server.tool(
  "ltf1_get_task",
  "Get full details of a task by its key (e.g., WEB-123)",
  {
    taskKey: z.string().describe("Task key like WEB-123"),
  },
  async ({ taskKey }) => {
    const task = await convexClient.query(api.tasks.queries.getTaskByKey, { key: taskKey });
    return {
      content: [{ type: "text", text: JSON.stringify(task, null, 2) }],
    };
  }
);
```

### Authentication Flow

```
1. User generates API token in LTF1 Settings → token displayed once
2. User adds token to MCP config (env var or config file)
3. MCP server starts → validates token against Convex backend
4. Server creates authenticated Convex client
5. All tool calls use this authenticated client
```

---

## CLI Integration

### Existing CLI Commands (already built)

The CLI at `apps/cli/` already supports:

```bash
ltf task create "Fix login bug" --type bug --priority high
ltf task list --status in_progress
ltf task update WEB-42 --status in_review
ltf task done WEB-42
ltf sprint list
ltf git link WEB-42
ltf ai suggest
```

### AI Agent Using CLI Directly

For AI agents that don't support MCP but can run shell commands (like basic Claude Code usage), the CLI is the integration path:

```bash
# AI detects task from branch, updates status
ltf task update WEB-42 --status in_review --comment "Fixed redirect loop. PR #187."

# AI creates follow-up
ltf task create "QA: Verify WEB-42 fix on Safari" --type task --parent WEB-42

# AI logs time
ltf time log WEB-42 --duration 45m --description "Bug fix + tests"
```

### Claude Code Hooks Integration

Claude Code supports hooks that run on specific events. LTF1 can register hooks:

```json
// .claude/hooks.json
{
  "postToolUse": [
    {
      "matcher": "Bash",
      "command": "ltf git sync --quiet"
    }
  ],
  "sessionEnd": [
    {
      "command": "ltf session end --auto-update"
    }
  ]
}
```

The `ltf session end --auto-update` command would:
1. Detect current task from git branch
2. Summarize recent git changes
3. Update task status based on git state (PR created → in_review, etc.)
4. Add comment with session summary
5. Log session duration as time entry

---

## Webhook System (Outbound)

### Purpose

Allow external tools to react to LTF1 events. Enables:
- Slack bot that posts when tasks change
- CI/CD that triggers on task status changes
- Custom dashboards that update in real-time

### Supported Events

```
task.created
task.updated
task.status_changed
task.assigned
task.completed
comment.created
sprint.started
sprint.completed
project.created
```

### Webhook Payload

```json
{
  "event": "task.status_changed",
  "timestamp": "2026-02-16T10:30:00Z",
  "workspace": "acme",
  "data": {
    "taskKey": "WEB-42",
    "taskId": "j573abc...",
    "previousStatus": "in_progress",
    "newStatus": "in_review",
    "changedBy": {
      "name": "Claude Code",
      "type": "api_token"
    }
  }
}
```

### Webhook Registration

```json
POST /api/v1/webhooks
{
  "url": "https://example.com/webhook",
  "events": ["task.status_changed", "task.completed"],
  "secret": "whsec_..."
}
```

Webhooks are signed with HMAC-SHA256 using the shared secret.

---

## Schema Additions

### API Tokens Table

```
apiTokens
  - workspaceId: Id<"workspaces">
  - userId: Id<"users">
  - name: string              // "Claude Code", "CI/CD", etc.
  - tokenHash: string         // SHA-256 hash of the token
  - tokenPrefix: string       // First 8 chars for identification (ltf1_tok_abcd...)
  - scopes: string[]          // ["tasks:read", "tasks:write", "sprints:read", etc.]
  - lastUsedAt?: number
  - expiresAt?: number
  - createdAt: number
  Indexes: by_workspace, by_user, by_token_prefix
```

### Webhooks Table

```
webhooks
  - workspaceId: Id<"workspaces">
  - userId: Id<"users">
  - url: string
  - events: string[]
  - secret: string
  - active: boolean
  - lastDeliveredAt?: number
  - failureCount: number
  - createdAt: number
  - updatedAt: number
  Indexes: by_workspace, by_active
```

### Webhook Deliveries Table

```
webhookDeliveries
  - webhookId: Id<"webhooks">
  - event: string
  - payload: any
  - responseStatus?: number
  - responseBody?: string
  - success: boolean
  - attemptCount: number
  - deliveredAt: number
  Indexes: by_webhook, by_event
```

---

## Implementation Phases

### Phase 1: API Token System
- API token generation UI in Settings
- Token validation middleware in Convex HTTP routes
- Token scoping (read/write per entity type)

### Phase 2: REST API
- HTTP routes in `convex/http.ts` for all endpoints
- Request validation and error handling
- Rate limiting per token

### Phase 3: MCP Server
- `packages/mcp-server/` package
- Core tools: get_task, list_tasks, create_task, update_task, add_comment
- Task detection from git context
- npm publish as `@ltf1/mcp-server`

### Phase 4: Automatic Behaviors
- Session end hook for Claude Code
- Auto-detect task from branch/commits
- Auto-summarize session changes
- Auto-update task status based on git state

### Phase 5: Webhooks
- Webhook registration API
- Event emission from existing mutations
- Delivery queue with retry logic
- Webhook management UI

### Phase 6: Advanced AI Features
- AI suggests next task based on sprint priority and developer expertise
- AI auto-assigns tasks based on `whoknows` expertise matching
- AI predicts sprint completion based on velocity + current progress
- AI generates standup summaries from task activity

---

## Competitive Advantage

### What Exists Today

| Tool | AI Integration | Auto-Update | MCP Server |
|------|---------------|-------------|------------|
| Linear | Codex integration (limited), MCP server (read-heavy) | No auto-update from coding sessions | Yes (basic) |
| Jira | Rovo AI (search/summarize only) | No | No |
| GitHub Issues | Copilot can read issues | No | No |
| **LTF1** | Full read/write MCP + REST API | Auto-update on session end | Full CRUD |

### Our Unique Position

1. **Full CRUD via MCP**: Not just reading tasks -- AI agents can create, update, assign, and close tasks. Linear's MCP server is read-heavy.

2. **Expertise matching**: `ltf1_whoknows` tool lets AI agents find the right person for code review or help. No other tool has this.

3. **Time tracking integration**: AI auto-logs time. No other PM tool tracks AI coding session time.

4. **Session intelligence**: Because we have chat + tasks + time tracking + git data in one DB, the AI can make smarter decisions than tools that only see task data.

5. **CLI as fallback**: Even without MCP support, any AI that can run shell commands can use `ltf` CLI commands. This works with every AI agent today.

---

## Developer Experience Goals

### Zero-config for Claude Code users

```bash
# One command to set up
ltf mcp setup

# Outputs: Added LTF1 MCP server to ~/.claude/mcp.json
# Outputs: Generated API token: ltf1_tok_...
# Outputs: Claude Code will now auto-update LTF1 tasks
```

### Natural language in AI sessions

The AI should understand LTF1 context naturally:

```
Developer: "What should I work on next?"
AI: [calls ltf1_get_my_tasks] "You have 3 tasks in the current sprint.
     WEB-42 (high priority bug) is blocking the release. I'd start there."

Developer: "OK fix it"
AI: [calls ltf1_get_task WEB-42, reads description, fixes code]
    [calls ltf1_update_task WEB-42 status=in_review]
    [calls ltf1_add_comment WEB-42 "Fixed the redirect loop..."]
    "Done. I've updated WEB-42 to 'In Review' and added a comment."
```

### Dashboard visibility

When AI agents update tasks, it should be clearly visible in LTF1:

- Activity feed shows "Updated by Claude Code via API" (not just "Updated by {user}")
- Comments from AI have a distinct visual indicator
- Time entries logged by AI are tagged as "ai-session"
- Audit log tracks all API token usage
