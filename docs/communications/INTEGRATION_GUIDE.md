# Adding a New Integration Source

This guide walks through adding a new external platform (e.g. Linear, Notion) to the Communications Hub.

## Step 1: Add Schema Tables

Create an integration table and a mapping table in `convex/schema.ts`.

```typescript
// Integration connection config
yourIntegrations: defineTable({
  workspaceId: v.id("workspaces"),
  accessToken: v.string(),
  // ... source-specific credentials
  active: v.boolean(),
  connectedBy: v.id("users"),
  connectedAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_workspaceId", ["workspaceId"]),

// Channel/project mapping
yourChannelMappings: defineTable({
  workspaceId: v.id("workspaces"),
  integrationId: v.id("yourIntegrations"),
  externalChannelId: v.string(),
  externalChannelName: v.string(),
  projectId: v.optional(v.id("projects")),
  syncEvents: v.array(v.string()),
  active: v.boolean(),
  createdAt: v.number(),
})
  .index("by_workspaceId", ["workspaceId"])
  .index("by_integrationId", ["integrationId"]),
```

## Step 2: Create OAuth / Connection Flow

Create `convex/integrations/your-source/oauth.ts`:

```typescript
// 1. Generate OAuth URL (action)
export const getAuthUrl = action({ ... });

// 2. Handle OAuth callback (httpAction in convex/http.ts)
// Exchange code for tokens, store in yourIntegrations table

// 3. Disconnect (mutation)
export const disconnect = mutation({ ... });
```

Register the callback route in `convex/http.ts`:

```typescript
http.route({
  path: "/api/your-source/callback",
  method: "GET",
  handler: httpAction(async (ctx, req) => { ... }),
});
```

## Step 3: Set Up Webhook Handler

Add a webhook endpoint in `convex/http.ts`:

```typescript
http.route({
  path: "/api/your-source/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    // 1. Verify webhook signature
    // 2. Parse event payload
    // 3. Call normalizer (Step 4)
  }),
});
```

## Step 4: Normalize and Ingest Messages

Create a normalizer in `convex/integrations/your-source/sync.ts`:

```typescript
import { internal } from "../../_generated/api";

// Called from webhook handler
async function normalizeAndIngest(ctx, event, workspaceId) {
  // Map source event to commsMessages format
  await ctx.runMutation(internal.communications.mutations.ingestExternalMessage, {
    workspaceId,
    source: "your-source",
    sourceChannelId: event.channel.id,
    sourceMessageId: event.message.id,
    senderName: event.user.displayName,
    content: event.message.text,
    contentType: "text",
    metadata: { /* source-specific data */ },
    externalCreatedAt: event.timestamp,
  });
}
```

## Step 5: Register Channels

When setting up channel mappings, register each channel in `commsChannels`:

```typescript
await ctx.runMutation(internal.communications.mutations.registerCommsChannel, {
  workspaceId,
  source: "your-source",
  externalId: channel.id,
  name: channel.name,
  channelType: "channel", // or repository, issue, etc.
  replyEnabled: true,
});
```

## Step 6: Add Source Filter to UI

In `apps/web/src/components/features/communications/`:

1. Add the new source to the `SourceFilter` component's source list
2. Add the source icon and badge color to the source config map

```typescript
// Source config
const SOURCE_CONFIG = {
  // ... existing sources
  "your-source": {
    label: "Your Source",
    icon: YourSourceIcon,
    color: "#hex-color",
  },
};
```

## Step 7: Add Source Badge and Icon

Update the message display components to handle the new source:

- Add icon import for the source platform
- Add badge color variant in `BrutalBadge` if needed
- Update any source-specific message rendering (e.g. code blocks for GitHub, thread indicators for Slack)

## Checklist

- [ ] Integration table added to schema
- [ ] Mapping table added to schema
- [ ] OAuth/connection flow implemented
- [ ] Webhook endpoint registered in `http.ts`
- [ ] Webhook signature verification
- [ ] Message normalizer calling `ingestExternalMessage`
- [ ] Channel registration calling `registerCommsChannel`
- [ ] Source added to UI filter component
- [ ] Source badge and icon configured
- [ ] Reply handler implemented (if applicable)
- [ ] Run `npx convex dev --once` to deploy schema changes
