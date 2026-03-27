# Feature Roadmap — Agent-First Evolution

## Roadmap Philosophy

Every feature on this roadmap must pass one test: **Does it reduce manual overhead for the developer?**

If a feature adds a UI that requires manual input, it fails. If a feature enables an agent to do work autonomously, it passes. If a feature removes a step from the developer's workflow, it passes.

---

## Phase 1: Agent Foundation (Q2 2026 — 6 weeks)

### Goal
Build the architectural foundation for agents: context assembly, triage pipeline, skills system.

### 1.1 Context Assembly Layer
**Priority**: P0 | **Effort**: Large | **Impact**: Critical

Build a unified context system that assembles relevant information for agent decisions.

```
convex/agent/
├── context.ts          — Context assembly (tasks, code, team, docs)
├── triage.ts           — Triage pipeline (categorize, prioritize, assign)
├── skills.ts           — Skills registry (store, trigger, auto-apply)
├── memory.ts           — Agent workspace memory
├── types.ts            — Agent type definitions
└── config.ts           — Per-workspace agent configuration
```

**Context Assembly Function**:
- Input: workspace ID, optional project/task context
- Gathers: recent tasks (last 50), active sprint, team members with skills, recent git activity, relevant documents
- Output: structured context object for agent consumption
- Cached with TTL for performance

### 1.2 Triage Pipeline
**Priority**: P0 | **Effort**: Large | **Impact**: Critical

When a task is created (from any source — web, TUI, CLI, GitHub, agent):

1. **Auto-categorize**: Determine task type (feature/bug/improvement) from title + description
2. **Auto-prioritize**: Estimate priority based on keywords, sender context, project urgency
3. **Auto-label**: Apply relevant labels from workspace label set
4. **Auto-assign**: Suggest assignee(s) based on expertise matching (existing taskAssignment.ts)
5. **Duplicate detection**: Semantic similarity check against recent tasks
6. **Parent detection**: If task is a subtask of existing work, suggest parent
7. **Sprint suggestion**: If active sprint, suggest whether to add

**Implementation**:
- Mutation hook: after every `createTask`, schedule `internal.agent.triage.triageTask`
- Triage runs as internalAction (needs AI model access)
- Results stored as triage suggestions on the task
- Human approves/rejects/modifies via web or TUI
- Auto-apply mode: workspace setting to skip human approval for low-risk triages

### 1.3 Skills System
**Priority**: P0 | **Effort**: Medium | **Impact**: High

Skills are codified, reusable workflow templates.

**Schema**:
```typescript
skills: defineTable({
  workspaceId: v.id("workspaces"),
  name: v.string(),           // "bug-triage"
  displayName: v.string(),    // "Bug Triage"
  description: v.string(),    // "Auto-categorize and assign bugs"
  trigger: v.union(
    v.literal("manual"),      // Triggered by slash command
    v.literal("auto"),        // Auto-applied when conditions match
    v.literal("both"),        // Both manual and auto
  ),
  conditions: v.optional(v.object({
    taskTypes: v.optional(v.array(v.string())),
    keywords: v.optional(v.array(v.string())),
    sources: v.optional(v.array(v.string())),
  })),
  actions: v.array(v.object({
    type: v.string(),         // "set_priority", "add_label", "assign", "create_tasks", "notify"
    config: v.any(),          // Action-specific configuration
  })),
  createdBy: v.id("users"),
  isActive: v.boolean(),
})
```

**Built-in Skills**:
- `bug-triage`: Set type=bug, priority=high, assign to on-call, notify Slack
- `deploy-checklist`: Create 5 linked verification tasks from template
- `sprint-plan`: AI suggests sprint from backlog priorities + velocity
- `pr-review`: Generate review checklist from task requirements

**Trigger Methods**:
- Web: slash command in task description (`/skill bug-triage`)
- TUI: `ltf skill run bug-triage`
- CLI: `ltf skill run bug-triage --task PROJ-123`
- Auto: skill conditions match on task creation

### 1.4 TUI Agent Commands
**Priority**: P0 | **Effort**: Medium | **Impact**: High

New TUI page: **Agent** (press `a` from dashboard)

```
  ┌─────────────────────────────────────────────┐
  │  AGENT                                       │
  │                                              │
  │  TRIAGE QUEUE (3 items)                      │
  │  ○ PROJ-45  "Fix login bug"                  │
  │    Type: bug  Priority: high  → @sarah       │
  │    [Accept] [Modify] [Reject]                │
  │                                              │
  │  ● PROJ-46  "Add dark mode toggle"           │
  │    Type: feature  Priority: medium  → @john  │
  │    [Accept] [Modify] [Reject]                │
  │                                              │
  │  RECENT AGENT ACTIONS                        │
  │  ✓ Triaged PROJ-44 → bug, high, @mike       │
  │  ✓ Applied skill "deploy-checklist" → 5 tasks│
  │  ✓ Sprint suggestion: add PROJ-43 to Sprint 3│
  │                                              │
  └─────────────────────────────────────────────┘
```

New CLI commands:
- `ltf agent triage` — Show triage queue, accept/reject suggestions
- `ltf agent suggest` — Agent analyzes current state and suggests actions
- `ltf agent status` — Show agent activity summary
- `ltf skill list` — List available skills
- `ltf skill run <name>` — Execute a skill
- `ltf skill create` — Interactive skill creation

### 1.5 Web Triage Page
**Priority**: P1 | **Effort**: Medium | **Impact**: High

New page: `/triage` (in authenticated navigation)

- Inbox-zero style interface for untriaged tasks
- Agent suggestions displayed inline (type, priority, assignee, labels)
- Accept all / accept individual / modify / reject
- Filter by source (GitHub, manual, agent-created)
- Keyboard-driven (j/k navigate, a accept, r reject, e edit)
- Stats: triage rate, acceptance rate, avg triage time

---

## Phase 2: Intelligence (Q3 2026 — 8 weeks)

### 2.1 Code Intelligence
**Priority**: P1 | **Effort**: Extra Large | **Impact**: High

Connect to repositories beyond tracking. Enable agents to understand code.

**Approach**:
- Fetch repository file tree via GitHub API
- Index key files (functions, classes, exports) with summaries
- Store in `codeIndex` table with embeddings for semantic search
- Agent can answer: "What does this function do?", "Where is authentication handled?", "What files would I need to change for X?"

**Schema**:
```typescript
codeIndex: defineTable({
  repositoryId: v.id("githubRepositories"),
  filePath: v.string(),
  entityType: v.string(),     // "function", "class", "export", "file"
  entityName: v.string(),
  summary: v.string(),        // AI-generated summary
  lineStart: v.number(),
  lineEnd: v.number(),
  lastSyncedAt: v.number(),
  embedding: v.optional(v.array(v.number())),
})
```

**Integration Points**:
- Task creation: "What code is relevant to this task?"
- PR review: "Does this PR satisfy the task requirements?"
- Bug triage: "What module is likely affected?"
- Assignment: "Who last touched this code?"

### 2.2 Planning Agent
**Priority**: P1 | **Effort**: Large | **Impact**: High

AI-powered sprint planning.

**Inputs**:
- Backlog tasks with priorities and estimates
- Team capacity (availability, skills, current workload)
- Velocity history (from git data)
- Sprint goal (human-defined)

**Outputs**:
- Suggested sprint plan (which tasks, assigned to whom)
- Risk assessment (overcommitment, skill gaps, dependencies)
- Alternative plans ranked by feasibility

**Trigger**:
- Manual: "Plan Sprint 4" button on sprint page
- CLI: `ltf agent plan-sprint --goal "Ship auth feature"`
- Auto: when sprint status changes to "planning"

### 2.3 Code Diff Viewer
**Priority**: P1 | **Effort**: Large | **Impact**: Medium

Render PR diffs inside LTF1 (web + TUI).

**Web**: Syntax-highlighted diff viewer in task detail modal or dedicated PR page. Show additions/deletions with context. Agent comments inline (e.g., "This change satisfies requirement X from task PROJ-123").

**TUI**: Simplified diff view in git page. Show file changes, additions/deletions counts, key modifications.

**Backend**: Fetch diffs via GitHub API (existing githubConnections token). Cache diffs in storage.

### 2.4 Assignment Agent
**Priority**: P1 | **Effort**: Medium | **Impact**: High

Evolve existing `taskAssignment.ts` into a full assignment agent.

**Enhancements**:
- Consider current workload (tasks in progress, PRs open)
- Consider timezone overlap with collaborators
- Consider code ownership (who last touched relevant files)
- Consider sprint commitment (don't overload)
- Confidence scoring with explanation
- Learning from past assignment accuracy

---

## Phase 3: Autonomy (Q4 2026 — 8 weeks)

### 3.1 Coding Agent Integration
**Priority**: P2 | **Effort**: Extra Large | **Impact**: High

Integrate with external coding agents (GitHub Copilot Workspace, Cursor, etc.) to:
- Create branches from task specs
- Generate initial implementation from task description
- Run tests and report results
- Create PRs linked to tasks
- Auto-update task status through the lifecycle

**Not building**: A coding agent from scratch. Integration with existing agents.

### 3.2 Agent-to-Agent Collaboration
**Priority**: P2 | **Effort**: Large | **Impact**: Medium

Chain agents together:
1. Triage agent categorizes issue
2. Assignment agent assigns developer
3. Planning agent adds to sprint
4. Code agent creates branch and initial implementation
5. Review agent checks PR against requirements
6. Triage agent closes task on merge

**Implementation**: Agent workflow definitions (similar to skills but for agent chains). Each step can be auto or human-approved.

### 3.3 Skills Marketplace
**Priority**: P2 | **Effort**: Medium | **Impact**: Medium

Share skills between workspaces:
- Publish skills to marketplace
- Browse and install community skills
- Version management
- Usage analytics

### 3.4 Enterprise Features
**Priority**: P2 | **Effort**: Large | **Impact**: Medium

- SSO via SAML/OIDC
- SCIM user provisioning
- Audit log exports
- On-premise agent infrastructure
- Custom SLA configuration
- Invoice billing

---

## Phase 4: Platform (2027)

### 4.1 Plugin System
Custom agent plugins with defined API:
- Agent SDK for building custom agents
- Plugin registry and discovery
- Sandboxed execution environment
- Billing integration for paid plugins

### 4.2 Third-Party Marketplace
- Integration marketplace (Slack, Discord, Notion, Figma, etc.)
- Agent marketplace (community-built agents)
- Skill marketplace (expanded from 3.3)

### 4.3 Self-Hosted Agent Infrastructure
- Docker-based deployment for agents
- Custom model support (local LLMs)
- Air-gapped operation for enterprise
- Agent monitoring and observability

---

## Cut / Simplify List

These features exist today but should be cut or simplified to align with the vision:

| Feature | Action | Reason |
|---------|--------|--------|
| **Meeting Scheduler** | Cut (keep AI standup summaries) | Adds process overhead, devs use Google Calendar |
| **Manual Time Tracking** | Simplify (auto-calculate from git) | Manual start/stop contradicts "zero manual updates" |
| **Time Reports Page** | Simplify (show git-derived metrics only) | Manual time data is unreliable |
| **Video Rooms** | Cut | Stub feature, not core to PM |
| **Custom Fields** | Simplify | Enterprise bloat, keep labels instead |
| **Meeting Templates** | Cut | Part of meetings system being cut |
| **Meeting Recordings** | Cut | Storage overhead, not PM feature |
| **Billable Hours** | Cut | Finance tool feature, not dev PM |
| **Developer Career Goals** | Cut from profiles | Not relevant to task assignment |

---

## Success Criteria by Phase

### Phase 1 (Agent Foundation)
- [ ] Triage pipeline processes 100% of new tasks within 30 seconds
- [ ] At least 3 built-in skills shipping
- [ ] `ltf agent triage` command working end-to-end
- [ ] Triage acceptance rate >70% (agent suggestions are useful)
- [ ] Web triage page with inbox-zero flow

### Phase 2 (Intelligence)
- [ ] Code index covering >80% of connected repositories
- [ ] Planning agent generates sprint plans accepted >50% of the time
- [ ] Diff viewer shows PR changes inline with task context
- [ ] Assignment agent confidence >75% (matches human choices)

### Phase 3 (Autonomy)
- [ ] At least one coding agent integration working end-to-end
- [ ] Agent chains completing full triage → assign → code → review lifecycle
- [ ] Skills marketplace with at least 10 community skills
- [ ] First enterprise customer on premium features

### Phase 4 (Platform)
- [ ] Plugin SDK published with documentation
- [ ] At least 5 third-party integrations in marketplace
- [ ] Self-hosted deployment under 1 hour setup time
- [ ] Agent observability dashboard showing performance metrics
