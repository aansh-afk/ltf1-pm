# Discord Integration Plan

## Overview

Discord integration enables bidirectional messaging between LTF1 workspaces and Discord servers. Team conversations in Discord automatically appear in the Communications Hub, and users can reply from LTF1.

## Bot Setup

### Bot Creation

1. Create a Discord Application at https://discord.com/developers/applications
2. Create a Bot user under the application
3. Required bot permissions:
   - `READ_MESSAGE_HISTORY` - Read channel messages
   - `SEND_MESSAGES` - Reply from LTF1
   - `VIEW_CHANNEL` - Access channel list
   - `ADD_REACTIONS` - React to messages
4. Enable the `MESSAGE_CONTENT` privileged intent
5. Generate an OAuth2 URL with `bot` and `applications.commands` scopes

### OAuth2 Flow

```
User clicks "Connect Discord" in LTF1 Settings
    |
    v
Redirect to Discord OAuth2 authorize URL
    (scope: bot, applications.commands)
    |
    v
User selects Discord server, authorizes bot
    |
    v
Discord redirects to /api/discord/callback with code
    |
    v
Exchange code for bot token
    |
    v
Store in discordIntegrations table
    |
    v
Fetch guild channels via Discord API
    |
    v
Show channel mapping UI
```

## Gateway Events

The bot listens for these Discord Gateway events:

| Event              | Action                                           |
|--------------------|--------------------------------------------------|
| `MESSAGE_CREATE`   | Normalize and ingest as commsMessage              |
| `MESSAGE_UPDATE`   | Update existing commsMessage metadata             |
| `MESSAGE_DELETE`   | Mark commsMessage as deleted in metadata          |
| `REACTION_ADD`     | Update reaction counts in message metadata        |
| `REACTION_REMOVE`  | Update reaction counts in message metadata        |
| `CHANNEL_CREATE`   | Auto-register new channel if guild is mapped      |
| `CHANNEL_DELETE`   | Deactivate corresponding commsChannel             |
| `THREAD_CREATE`    | Register as child channel with parentId           |

### Implementation Approach

Since Convex does not support persistent WebSocket connections, Discord events will be received via an external bot process or Discord's Interaction Endpoint:

**Option A: External Bot Process** (Recommended for full event coverage)
- Lightweight Node.js service running discord.js
- Connects to Discord Gateway
- Forwards relevant events to Convex via HTTP actions

**Option B: Discord Interactions Endpoint**
- Register Convex HTTP endpoint as Discord Interactions URL
- Limited to slash commands and component interactions
- Does not receive message events

## Channel Mapping

```
Discord Server (Guild)
    |
    +-- #general       --> mapped to Project "Main" commsChannel
    +-- #engineering    --> mapped to Project "Backend" commsChannel
    +-- #design         --> mapped to Project "Frontend" commsChannel
    +-- #random         --> not mapped (ignored)
```

Users configure mappings in the Discord integration settings page:
- Select which Discord channels to sync
- Optionally map each channel to an LTF1 project
- Configure which event types to sync per channel

## Bidirectional Messaging

### Discord to LTF1

```
Discord message received
    |
    v
Bot process forwards to Convex HTTP endpoint
    |
    v
Normalize: senderName = Discord username, contentType = text/markdown
    |
    v
ingestExternalMessage(source: "discord", ...)
```

### LTF1 to Discord

```
User replies in Communications Hub
    |
    v
createCommsReply(source: "discord", channelId, content)
    |
    v
sendReply action:
    - Look up discordIntegrations for bot token
    - Look up discordChannelMappings for Discord channel ID
    - POST /channels/{channelId}/messages via Discord API
    - Update commsReplies status
```

## Slash Commands

Register LTF1 slash commands in Discord for task management:

| Command                      | Action                                    |
|------------------------------|-------------------------------------------|
| `/ltf1 task create <title>`  | Create a task in the mapped LTF1 project  |
| `/ltf1 task list`            | List open tasks for the mapped project    |
| `/ltf1 task assign <id> <user>` | Assign a task to a team member         |
| `/ltf1 status`               | Show project status summary               |
| `/ltf1 link <project>`       | Link current Discord channel to a project |

Slash command interactions are received at the Convex HTTP Interactions endpoint and processed via actions.

## Message Formatting

| Discord Format   | LTF1 Display                          |
|------------------|---------------------------------------|
| `**bold**`       | Rendered as markdown bold             |
| `\`code\``       | Rendered as inline code               |
| `\`\`\`lang`     | Rendered as code block with syntax    |
| `<@userId>`      | Resolved to Discord username          |
| `<#channelId>`   | Resolved to channel name              |
| Embeds           | Stored in metadata, rendered as cards |
| Attachments      | URLs stored in metadata, shown as links |
