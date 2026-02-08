# Communications Hub Architecture

## Overview

The Communications Hub provides a unified inbox for all external integrations (Slack, GitHub, Discord, Jira) within a workspace. Messages from each source are normalized into a common format and stored in `commsMessages`, enabling a single UI to display cross-platform communications.

## Data Flow

```
External Service (Slack/GitHub/Discord/Jira)
    |
    v
Webhook Handler (convex/http.ts)
    |
    v
Source-Specific Normalizer
    |
    v
ingestExternalMessage (internalMutation)
    |
    +--> commsMessages (normalized message stored)
    +--> commsChannels (channel updated: lastMessageAt, unreadCount++)
    |
    v
Frontend Queries (getUnifiedFeed, getChannelMessages)
    |
    v
Communications Hub UI
```

## Design Principles

### Source Normalization

Each integration normalizes its events into the unified `commsMessages` schema before calling `ingestExternalMessage`. The normalizer is responsible for:

- Extracting sender name and optional user ID mapping
- Converting content to the appropriate `contentType` (text, markdown, code, system)
- Populating source-specific `metadata` (reaction counts, thread info, labels, etc.)
- Mapping the external channel/repo/issue to a `commsChannels` entry

### Dual-Write Pattern

Existing integration tables (`slackMessages`, `githubEvents`, etc.) remain untouched. The Communications Hub adds a **secondary write** to `commsMessages` during webhook processing. This means:

- Existing integration features continue to work independently
- The Communications Hub is additive, not a replacement
- Rolling back the hub has zero impact on source integrations
- Source-specific tables retain full fidelity data; `commsMessages` stores a normalized subset

### Reply Routing

When a user replies from the Communications Hub UI:

```
User types reply in UI
    |
    v
createCommsReply (mutation)
    |
    +--> commsReplies (status: "pending")
    |
    v
sendReply (action, runs after mutation)
    |
    +--> Source-specific API call (Slack postMessage, GitHub comment, etc.)
    |
    +--> Update commsReplies (status: "sent" | "failed")
```

Each source requires its own reply handler with appropriate API credentials and formatting.

## Table Relationships

```
workspaces
    |
    +-- commsChannels (one workspace has many channels)
    |       |
    |       +-- commsMessages (one channel has many messages)
    |
    +-- commsReplies (one workspace has many outbound replies)
            |
            +-- references commsChannels via channelId
            +-- references users via userId
```

## Source Types

| Source     | Webhook Events                          | Channel Type        | Reply Support |
|------------|----------------------------------------|---------------------|---------------|
| `slack`    | message, reaction, thread_reply        | channel, direct     | Yes           |
| `github`   | push, PR, issue, review, comment       | repository, issue, pr | Yes (comments) |
| `discord`  | MESSAGE_CREATE, REACTION_ADD           | channel, thread     | Planned       |
| `jira`     | issue_created, updated, commented      | issue, project      | Planned       |
| `internal` | System-generated notifications         | system              | No            |

## Performance Considerations

- `commsMessages` indexes on `[workspaceId, sourceChannelId]` for per-channel queries
- `commsMessages` indexes on `[workspaceId]` for unified feed with `order("desc")`
- `commsChannels` indexes on `[workspaceId, source]` for filtered sidebar
- Unread counts are denormalized on `commsChannels` to avoid count queries
- `lastMessageAt` on channels enables sorted channel lists without joining messages
