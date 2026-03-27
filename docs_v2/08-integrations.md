# Integrations Reference — iceberg-pm

## GitHub Integration

### Overview
The most extensive integration in iceberg. 10,000+ lines of code across 15+ files. Provides bi-directional sync between GitHub and iceberg for issues, PRs, commits, teams, and developer stats.

### Architecture

```
GitHub
  │
  ├── Webhooks ──────────► POST /clerk-webhook ──► convex/github/webhooks.ts
  │                                                      │
  │                                                      ▼
  │                                               Event Processing
  │                                               (sync.ts, issueSync.ts)
  │                                                      │
  │                                                      ▼
  │                                               Database Updates
  │                                               (tasks, PRs, commits)
  │
  ├── OAuth ─────────────► convex/github/oauth.ts
  │                         (User GitHub connection)
  │
  ├── GitHub App ────────► convex/github/installationManagement.ts
  │                         (Organization-level access)
  │
  └── API (Octokit) ────► convex/github/nodeActions.ts
                            (Query GitHub data)
```

### Features

#### GitHub App Installation
- Install iceberg GitHub App on organizations or personal accounts
- Multi-installation support per workspace (via `workspaceGitHubInstallations` junction table)
- Configurable permissions and event subscriptions
- Automatic repository discovery after installation

#### User OAuth Connection
- GitHub OAuth flow via `githubConnections` table
- Links GitHub user to iceberg user
- Provides personal access for API calls
- Token management with scope tracking

#### Bi-Directional Issue Sync
- **GitHub → iceberg**: New GitHub issues create tasks, updates sync status/labels/assignees
- **iceberg → GitHub**: New tasks create GitHub issues, status changes sync back
- Conflict resolution via `githubIssueSyncQueue` with retry logic
- Configurable sync direction per project: `github_to_ltf1`, `ltf1_to_github`, `bidirectional`
- Cron job processes queue every 1 minute

**Sync Fields**:
| iceberg Field | GitHub Field | Direction |
|---------------|-------------|-----------|
| title | title | Bidirectional |
| description | body | Bidirectional |
| status | state (open/closed) | Bidirectional |
| labels | labels | Bidirectional |
| assigneeIds | assignees | Bidirectional |
| priority | label prefix (priority:) | iceberg → GitHub |

#### Commit Parsing
- Parses commit messages for task key references (e.g., `PROJ-123`)
- Links commits to tasks via `gitCommits` field on tasks
- Stored in `githubCommits` table with full metadata
- Supports multiple task keys per commit

#### PR Tracking
- Tracks pull request lifecycle: opened → reviewed → merged → closed
- Links PRs to tasks via branch name parsing
- Updates task status based on PR events (configurable)
- Stores in `githubPullRequests` table

#### Team Sync
- Syncs GitHub organization teams to iceberg teams
- Maps GitHub team members to iceberg users via `githubUserMappings`
- Configurable sync direction
- Cron job runs every 1 hour

#### Developer Stats Sync
- Syncs GitHub contribution data for developer profiles
- PRs opened, reviews given, primary languages, contribution history
- Used by AI assignment agent for expertise matching
- Cron job runs every 30 minutes

#### Release Notes Generation
- Auto-generates release notes from merged PRs and commits
- Groups by category (features, fixes, improvements)
- Accessible via `ltf release notes` CLI command

#### Repository Documentation
- Fetches and caches README and documentation from connected repos
- Stored in `repoDocs` table
- Used by AIDocumentationHub component

### Database Tables

| Table | Records | Purpose |
|-------|---------|---------|
| `githubInstallations` | GitHub App installations | Organization access |
| `githubRepositories` | Synced repositories | Repo metadata, sync status |
| `githubCommits` | Tracked commits | Commit-task linking |
| `githubPullRequests` | Tracked PRs | PR lifecycle tracking |
| `githubIssues` | Synced issues | Issue-task linking |
| `githubActivities` | Activity stream | GitHub activity feed |
| `githubConnections` | User OAuth tokens | Personal GitHub access |
| `githubWebhookEvents` | Webhook payloads | Event storage, debugging |
| `githubUserMappings` | User mapping | GitHub → iceberg user |
| `githubTeamMappings` | Team mapping | GitHub org → iceberg team |
| `githubIssueSyncQueue` | Sync queue | Pending sync operations |
| `workspaceGitHubInstallations` | Junction table | Multi-installation support |
| `githubOAuthStates` | OAuth state tokens | CSRF protection |

### Cron Jobs

| Job | Interval | Module |
|-----|----------|--------|
| Issue sync queue processing | 1 min | `github/issueSync.ts` |
| Team sync | 1 hr | `github/teamSync.ts` |
| Repository sync | 15 min | `github/syncActions.ts` |
| Developer stats sync | 30 min | `github/syncActions.ts` |

### Frontend Components

| Component | Location | Purpose |
|-----------|----------|---------|
| GitHubConnectButton | components/github/ | OAuth connection |
| GitHubInstallationButton | components/github/ | App installation |
| GitHubMonitor | components/github/ | Activity monitoring |
| GitHubProjectTab | components/github/ | Project GitHub view |
| GitHubSettings | components/settings/ | GitHub configuration |
| GitHubQuickStats | components/github/ | Quick stats widget |
| GitHubFilterBar | components/github/ | Activity filtering |
| GitHubFeedItem | components/github/ | Activity feed item |
| TaskGitHubActivity | components/github/ | Task-level GitHub activity |
| GitHubProfileSection | components/profile/ | Developer profile GitHub stats |

---

## AI Integration

### Architecture

```
User Request
    │
    ▼
Frontend (useAI hook / component)
    │
    ▼
Convex Action (ai/generate.ts)
    │
    ├── Resolve Config (ai/resolveConfig.ts)
    │   ├── Check user API key (BYOK)
    │   ├── Check workspace AI settings
    │   └── Fall back to platform keys
    │
    ├── Check Credits (ai/queries.ts → canMakeAIRequest)
    │   ├── Check monthly allowance
    │   ├── Check rate limits
    │   └── Return allowed/denied
    │
    ├── Assemble Context
    │   ├── Recent tasks
    │   ├── Sprint data
    │   ├── Team members + skills
    │   └── Relevant documents
    │
    ├── Call Provider (ai/providers.ts)
    │   ├── Gemini 2.5 Flash / Flash Lite
    │   ├── Groq
    │   ├── Cerebras
    │   └── GPT OSS 120B / 20B
    │
    ├── Track Usage (ai/usageLog.ts)
    │   ├── Token counts (input/output/total)
    │   ├── Cost calculation
    │   ├── Latency measurement
    │   └── Cache hit tracking
    │
    └── Return Result
        │
        ▼
    Store Session (aiSessions table)
```

### AI Capabilities

| Capability | Module | Input | Output |
|-----------|--------|-------|--------|
| Task Description Generation | ai/generate.ts | Task title, context | Description, acceptance criteria |
| Task Suggestions from Git | ai/generate.ts | Commit/PR data | Suggested tasks with type/priority |
| Smart Assignment | ai/taskAssignment.ts | Task content, team profiles | Ranked assignees with confidence |
| Sprint Health Analysis | ai/projectInsights.ts | Sprint data, tasks, velocity | Risk/recommendation insights |
| Project Insights | ai/projectInsights.ts | Project data | Risk, recommendation, opportunity, anomaly |
| Developer Expertise Matching | ai/taskAssignment.ts | Task requirements, dev profiles | Suitability scores |
| Documentation Generation | ai/generate.ts | Project data, code | Auto-generated docs |
| Natural Language Task Creation | ai/generate.ts | Free-text description | Structured task (title, type, priority, description) |
| Reviewer Suggestions | ai/taskAssignment.ts | PR data, team | Suggested reviewers |

### Models Supported

| Model | Provider | Use Case |
|-------|----------|----------|
| gemini-2.5-flash | Google | Primary model, balanced |
| gemini-2.5-flash-lite | Google | Fast, low-cost operations |
| gpt-oss-120b | Open source | Complex analysis |
| gpt-oss-20b | Open source | Quick suggestions |

### Credit System

| Tier | Monthly Credits | Rate Limit | BYOK |
|------|----------------|------------|------|
| Free | 100 | 10/hour | No |
| Pro | Unlimited | 100/hour | Yes |
| Enterprise | Custom | Custom | Yes |

### BYOK (Bring Your Own Key)
- Supports Cerebras, Groq, Gemini providers
- Encrypted key storage in `aiProviderKeys` table
- User-controlled provider selection
- No credit deduction for BYOK requests

---

## Email Integration (Resend)

### Capabilities
- Due date reminders (6-hour cron)
- Overdue task alerts (12-hour cron)
- Meeting reminders (15-minute cron)
- Workspace invitation emails
- Project invitation emails
- Test email from settings

### Cron Jobs
| Job | Interval | Purpose |
|-----|----------|---------|
| Due date reminders | 6 hours | Email tasks due within 24 hours |
| Overdue alerts | 12 hours | Email overdue task notifications |
| Meeting reminders | 15 minutes | Email upcoming meeting reminders |

---

## Billing Integration (Polar.sh)

### Webhook Events
- `subscription.created` → Initialize workspace subscription
- `subscription.updated` → Update plan/status
- `subscription.canceled` → Downgrade workspace

### Subscription Tiers

| Tier | Members | AI Credits | Features |
|------|---------|------------|----------|
| Free | 5 | 100/month | Core PM, Git integration, CLI |
| Pro | Unlimited | Unlimited | + Agent features, BYOK, advanced analytics |
| Enterprise | Custom | Custom | + SSO, SCIM, on-premise, SLA |

### Feature Gates
Pro-only features are gated via workspace `subscription.plan` field:
- Custom webhooks
- SSO
- Audit logs
- Unlimited AI credits
- Tech debt surfacing
- Sprint suggestions
- BYOK
- Cycle time metrics
- Custom reports
- Private teams
- Guest accounts

---

## Slack Integration

### Current State: Partial
- `integrations` table supports Slack configuration
- Notification routing to Slack channels
- Basic webhook-based messaging
- Not fully implemented (framework exists)

### Planned
- Slash commands for task operations from Slack
- Threaded task discussions synced to iceberg comments
- Sprint standup summaries posted to channels
- PR notifications with task context

---

## GitLab Integration

### Current State: Partial
- `gitlabIntegrations` and `gitlabOAuthStates` tables exist
- OAuth flow scaffolded
- Not fully implemented

### Planned
- Bi-directional issue sync (same model as GitHub)
- MR tracking linked to tasks
- CI/CD pipeline status

---

## Webhook System (Svix)

### Architecture
- Svix handles webhook delivery infrastructure
- `webhookEvents` table stores event payloads
- Configurable per-workspace webhook endpoints (Pro feature)

### Event Types
- task.created, task.updated, task.completed, task.deleted
- sprint.started, sprint.completed
- project.created, project.updated
- member.joined, member.left

---

## Analytics (PostHog)

### Tracked Events
- Page views
- Feature usage
- Task creation/completion rates
- Sprint cycle metrics
- CLI vs web usage
- AI feature adoption

### Implementation
- PostHog JS SDK in web app
- Anonymous analytics in CLI (opt-out available)
- No PII in analytics events

---

## Authentication (Clerk)

### Web App Flow
1. ClerkProvider wraps React app
2. SignIn/SignUp components with custom theme
3. Authenticated → ConvexProviderWithClerk passes JWT
4. Backend: `ctx.auth.getUserIdentity()` → users table

### CLI Flow
1. `ltf auth login` → opens browser
2. Clerk auth in browser → callback to localhost:9876
3. JWT + sessionId stored locally
4. Silent refresh via sessionId (up to 7 days)
5. Fallback: re-auth via browser

### Webhook
- `POST /clerk-webhook` receives user lifecycle events
- Creates/updates user records in Convex
- Syncs profile changes (name, email, avatar)

---

## Integration Roadmap

### Phase 1 (Q2 2026)
- Complete Slack integration (slash commands, thread sync)
- Agent context assembly (pull from all integrated sources)

### Phase 2 (Q3 2026)
- Complete GitLab integration
- Code intelligence (repo indexing beyond commit parsing)
- Bitbucket basic support

### Phase 3 (Q4 2026)
- Jira import tool (migration path)
- Linear import tool
- Notion/Confluence document import
- Custom webhook endpoints for Pro users

### Phase 4 (2027)
- Integration marketplace
- Third-party plugin API
- Zapier/n8n connectors
