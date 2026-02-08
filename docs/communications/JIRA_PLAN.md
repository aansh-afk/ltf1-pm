# Jira Integration Plan

## Overview

Jira integration enables bidirectional issue tracking between LTF1 projects and Jira Cloud. Issue events from Jira appear in the Communications Hub as messages, and LTF1 task changes can sync back to Jira.

## App Setup

### Jira App Creation

1. Create a Jira App at https://developer.atlassian.com/console/myapps/
2. Configure OAuth 2.0 (3LO) authorization
3. Required scopes:
   - `read:jira-work` - Read issues, projects, boards
   - `write:jira-work` - Create/update issues
   - `read:jira-user` - Read user profiles
   - `manage:jira-webhook` - Register webhooks
4. Set callback URL to `/api/jira/callback`

### OAuth 2.0 (3LO) Flow

```
User clicks "Connect Jira" in LTF1 Settings
    |
    v
Redirect to Atlassian OAuth2 authorize URL
    (scope: read:jira-work, write:jira-work, ...)
    |
    v
User authorizes LTF1 app for their Jira site
    |
    v
Jira redirects to /api/jira/callback with code
    |
    v
Exchange code for access_token + refresh_token
    |
    v
GET /oauth/token/accessible-resources to get cloudId
    |
    v
Store tokens + cloudId in jiraIntegrations table
    |
    v
Fetch Jira projects via REST API
    |
    v
Show project mapping UI
```

### Token Refresh

Access tokens expire after 1 hour. Implement a token refresh flow:

```typescript
// Before any Jira API call:
// 1. Check if token is expired (store expiry alongside token)
// 2. If expired, POST to /oauth/token with refresh_token
// 3. Update jiraIntegrations with new access_token
```

## Webhook Configuration

Register webhooks via Jira REST API after OAuth connection:

```
POST /rest/api/3/webhook
{
  "url": "https://<convex-deployment>.convex.site/api/jira/webhook",
  "webhooks": [
    {
      "events": [
        "jira:issue_created",
        "jira:issue_updated",
        "jira:issue_deleted",
        "comment_created",
        "comment_updated",
        "sprint_started",
        "sprint_closed"
      ]
    }
  ]
}
```

### Webhook Events

| Jira Event           | commsMessage contentType | Content Summary                      |
|----------------------|--------------------------|--------------------------------------|
| `jira:issue_created` | `system`                 | "[KEY] Issue created: {summary}"     |
| `jira:issue_updated` | `system`                 | "[KEY] {field} changed: {old} -> {new}" |
| `comment_created`    | `text`                   | Comment body text                    |
| `comment_updated`    | `text`                   | Updated comment body                 |
| `sprint_started`     | `system`                 | "Sprint '{name}' started"            |
| `sprint_closed`      | `system`                 | "Sprint '{name}' closed"             |

### Webhook Security

Verify webhook authenticity by checking the `X-Atlassian-Webhook-Identifier` header and validating the source IP against Atlassian's published IP ranges.

## Field Mapping

### Issue Type Mapping

| Jira Issue Type | LTF1 Task Type |
|-----------------|----------------|
| Story           | feature        |
| Bug             | bug            |
| Task            | task           |
| Epic            | epic           |
| Sub-task        | subtask        |

### Priority Mapping

| Jira Priority | LTF1 Priority |
|---------------|---------------|
| Highest       | critical      |
| High          | high          |
| Medium        | medium        |
| Low           | low           |
| Lowest        | low           |

### Status Mapping

| Jira Status    | LTF1 Status   |
|----------------|---------------|
| To Do          | todo          |
| In Progress    | in_progress   |
| In Review      | in_review     |
| Done           | done          |
| Closed         | done          |

Custom status mappings are configurable per project in `jiraProjectMappings.syncTypes`.

## Bidirectional Sync

### Sync Direction Options

Configured per project mapping in `jiraProjectMappings.syncDirection`:

| Direction       | Behavior                                          |
|-----------------|---------------------------------------------------|
| `to_ltf1`       | Jira events create/update LTF1 tasks. No pushback |
| `to_jira`       | LTF1 task changes create/update Jira issues       |
| `bidirectional` | Changes sync both ways with conflict resolution   |

### Jira to LTF1

```
Jira webhook received
    |
    v
Verify webhook signature
    |
    v
Look up jiraProjectMappings by jiraProjectId
    |
    v
Check syncDirection includes to_ltf1
    |
    v
Normalize to commsMessage format
    |
    v
ingestExternalMessage(source: "jira", ...)
    |
    v
(If task sync enabled) Create/update LTF1 task
```

### LTF1 to Jira

```
LTF1 task created/updated
    |
    v
Check jiraProjectMappings for active bidirectional/to_jira mapping
    |
    v
Map LTF1 fields to Jira fields
    |
    v
POST/PUT to Jira REST API
    - POST /rest/api/3/issue (create)
    - PUT /rest/api/3/issue/{issueId} (update)
    |
    v
Store Jira issue key in LTF1 task metadata
```

### Conflict Resolution (Bidirectional)

When the same issue is modified on both sides:

1. **Last-write-wins** with timestamp comparison
2. Store `lastSyncedAt` on both sides
3. If both modified since last sync, flag as conflict
4. Conflicts are surfaced in the Communications Hub for manual resolution

## JQL Integration

Expose Jira's JQL (Jira Query Language) for advanced queries:

```typescript
// Action to execute JQL queries
export const searchJiraIssues = action({
  args: {
    workspaceId: v.id("workspaces"),
    jql: v.string(),
    maxResults: v.optional(v.number()),
  },
  returns: v.any(),
});
```

Use cases:
- Search for issues assigned to a user: `assignee = "user@example.com"`
- Find overdue issues: `duedate < now() AND status != Done`
- Filter by label: `labels = "ltf1-sync"`
- Sprint-scoped queries: `sprint = "Sprint 5" AND status = "In Progress"`

## Metadata Storage

Jira-specific metadata stored in `commsMessages.metadata`:

```typescript
{
  issueKey: "PROJ-123",
  issueType: "Bug",
  priority: "High",
  status: "In Progress",
  assignee: "jane.doe",
  labels: ["bug", "frontend"],
  sprint: "Sprint 5",
  storyPoints: 3,
  changelog: [
    { field: "status", from: "To Do", to: "In Progress" }
  ],
}
```
