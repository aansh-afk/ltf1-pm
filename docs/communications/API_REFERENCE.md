# Communications Hub API Reference

## Public Queries

### getCommsChannels

Returns all communication channels for a workspace, optionally filtered by source.

```typescript
// convex/communications/queries.ts
export const getCommsChannels = query({
  args: {
    workspaceId: v.id("workspaces"),
    source: v.optional(
      v.union(
        v.literal("slack"),
        v.literal("github"),
        v.literal("discord"),
        v.literal("jira"),
        v.literal("internal")
      )
    ),
  },
  returns: v.array(v.object({
    _id: v.id("commsChannels"),
    _creationTime: v.number(),
    workspaceId: v.id("workspaces"),
    source: v.string(),
    externalId: v.string(),
    name: v.string(),
    channelType: v.string(),
    parentId: v.optional(v.string()),
    parentName: v.optional(v.string()),
    active: v.boolean(),
    muted: v.boolean(),
    unreadCount: v.number(),
    lastMessageAt: v.optional(v.number()),
    replyEnabled: v.boolean(),
  })),
});
```

**Usage:** Populates the channel sidebar. Channels are sorted by `lastMessageAt` descending on the client.

---

### getUnifiedFeed

Returns the most recent messages across all sources for a workspace.

```typescript
export const getUnifiedFeed = query({
  args: {
    workspaceId: v.id("workspaces"),
    limit: v.number(),
    sources: v.optional(
      v.array(
        v.union(
          v.literal("slack"),
          v.literal("github"),
          v.literal("discord"),
          v.literal("jira"),
          v.literal("internal")
        )
      )
    ),
  },
  returns: v.array(v.object({
    _id: v.id("commsMessages"),
    _creationTime: v.number(),
    workspaceId: v.id("workspaces"),
    source: v.string(),
    sourceChannelId: v.string(),
    sourceMessageId: v.string(),
    senderName: v.string(),
    senderUserId: v.optional(v.id("users")),
    content: v.string(),
    contentType: v.string(),
    metadata: v.any(),
    externalCreatedAt: v.number(),
  })),
});
```

**Usage:** Powers the main unified inbox view. When `sources` is provided, filters to only those platforms. Messages are ordered by `_creationTime` descending and limited by `limit`.

---

### getChannelMessages

Returns messages for a specific channel.

```typescript
export const getChannelMessages = query({
  args: {
    workspaceId: v.id("workspaces"),
    channelId: v.id("commsChannels"),
    limit: v.number(),
  },
  returns: v.array(v.object({
    _id: v.id("commsMessages"),
    _creationTime: v.number(),
    source: v.string(),
    sourceMessageId: v.string(),
    senderName: v.string(),
    senderUserId: v.optional(v.id("users")),
    content: v.string(),
    contentType: v.string(),
    metadata: v.any(),
    externalCreatedAt: v.number(),
  })),
});
```

**Usage:** Displays messages when a user clicks into a specific channel. Looks up the channel's `sourceChannelId` and queries `commsMessages` by that value.

---

### getCommsStats

Returns aggregate statistics for the communications hub.

```typescript
export const getCommsStats = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  returns: v.object({
    totalChannels: v.number(),
    messagesLast24h: v.number(),
    totalUnread: v.number(),
    perSource: v.array(v.object({
      source: v.string(),
      channelCount: v.number(),
      messageCount: v.number(),
    })),
  }),
});
```

**Usage:** Populates the Communications Hub header stats bar showing total channels, recent message volume, and unread count.

---

## Public Mutations

### markChannelRead

Resets the unread count for a channel.

```typescript
export const markChannelRead = mutation({
  args: {
    channelId: v.id("commsChannels"),
  },
  returns: v.null(),
});
```

**Usage:** Called when a user opens a channel to clear its unread badge.

---

### updateChannelSettings

Updates per-channel preferences.

```typescript
export const updateChannelSettings = mutation({
  args: {
    channelId: v.id("commsChannels"),
    muted: v.optional(v.boolean()),
    syncEnabled: v.optional(v.boolean()),
  },
  returns: v.null(),
});
```

**Usage:** Toggle mute (suppresses unread count) or disable sync for a specific channel.

---

### createCommsReply

Sends a reply to an external channel.

```typescript
export const createCommsReply = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    channelId: v.id("commsChannels"),
    content: v.string(),
  },
  returns: v.id("commsReplies"),
});
```

**Usage:** Creates a pending reply record and schedules a `sendReply` action to deliver it to the source platform. Returns the reply ID for optimistic UI updates.

---

## Internal Functions

### ingestExternalMessage

Normalizes and stores an incoming message from any source.

```typescript
export const ingestExternalMessage = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    source: v.string(),
    sourceChannelId: v.string(),
    sourceMessageId: v.string(),
    senderName: v.string(),
    senderUserId: v.optional(v.id("users")),
    content: v.string(),
    contentType: v.string(),
    metadata: v.any(),
    externalCreatedAt: v.number(),
  },
  returns: v.id("commsMessages"),
});
```

**Behavior:**
1. Checks for duplicate via `sourceMessageId` index
2. Inserts into `commsMessages`
3. Updates `commsChannels.lastMessageAt` and increments `unreadCount`

---

### registerCommsChannel

Creates or updates a channel entry in the registry.

```typescript
export const registerCommsChannel = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    source: v.string(),
    externalId: v.string(),
    name: v.string(),
    channelType: v.string(),
    parentId: v.optional(v.string()),
    parentName: v.optional(v.string()),
    replyEnabled: v.boolean(),
  },
  returns: v.id("commsChannels"),
});
```

**Behavior:** Upserts by `workspaceId` + `externalId`. If the channel already exists, updates its name and type. If new, creates with `active: true`, `muted: false`, `unreadCount: 0`.
