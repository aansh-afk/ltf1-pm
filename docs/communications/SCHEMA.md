# Communications Hub Schema

## Core Tables

### commsMessages

Normalized messages from all external sources.

| Field             | Validator                                                        | Description                                  |
|-------------------|------------------------------------------------------------------|----------------------------------------------|
| workspaceId       | `v.id("workspaces")`                                             | Parent workspace                             |
| source            | `v.union(v.literal("slack"), v.literal("github"), v.literal("discord"), v.literal("jira"), v.literal("internal"))` | Origin platform |
| sourceChannelId   | `v.string()`                                                     | External channel/repo/issue identifier       |
| sourceMessageId   | `v.string()`                                                     | Deduplication key from source platform       |
| senderName        | `v.string()`                                                     | Display name of the sender                   |
| senderUserId      | `v.optional(v.id("users"))`                                     | Mapped LTF1 user (if linked)                |
| content           | `v.string()`                                                     | Message body                                 |
| contentType       | `v.union(v.literal("text"), v.literal("markdown"), v.literal("code"), v.literal("system"))` | Content format |
| metadata          | `v.any()`                                                        | Source-specific data (reactions, labels, etc.)|
| externalCreatedAt | `v.number()`                                                     | Original timestamp from source               |

**Indexes:**
- `by_workspaceId`: `["workspaceId"]` -- unified feed queries
- `by_workspaceId_and_sourceChannelId`: `["workspaceId", "sourceChannelId"]` -- per-channel queries
- `by_workspaceId_and_sourceMessageId`: `["workspaceId", "sourceMessageId"]` -- deduplication lookups

### commsChannels

Registry of all communication channels across sources.

| Field          | Validator                                                        | Description                                  |
|----------------|------------------------------------------------------------------|----------------------------------------------|
| workspaceId    | `v.id("workspaces")`                                             | Parent workspace                             |
| source         | `v.union(v.literal("slack"), v.literal("github"), v.literal("discord"), v.literal("jira"), v.literal("internal"))` | Origin platform |
| externalId     | `v.string()`                                                     | Channel/repo/issue ID on source platform     |
| name           | `v.string()`                                                     | Display name                                 |
| channelType    | `v.union(v.literal("channel"), v.literal("repository"), v.literal("issue"), v.literal("pr"), v.literal("direct"), v.literal("thread"))` | Category |
| parentId       | `v.optional(v.string())`                                        | Parent channel external ID (for threads)     |
| parentName     | `v.optional(v.string())`                                        | Parent channel display name                  |
| active         | `v.boolean()`                                                    | Whether channel is actively synced           |
| muted          | `v.boolean()`                                                    | User-muted (suppresses unread count)         |
| unreadCount    | `v.number()`                                                     | Denormalized unread message count            |
| lastMessageAt  | `v.optional(v.number())`                                        | Timestamp of most recent message             |
| replyEnabled   | `v.boolean()`                                                    | Whether outbound replies are supported       |

**Indexes:**
- `by_workspaceId`: `["workspaceId"]` -- all channels for workspace
- `by_workspaceId_and_source`: `["workspaceId", "source"]` -- filtered by source
- `by_workspaceId_and_externalId`: `["workspaceId", "externalId"]` -- channel lookup

### commsReplies

Outbound reply tracking for messages sent from the Communications Hub.

| Field             | Validator                                                        | Description                                  |
|-------------------|------------------------------------------------------------------|----------------------------------------------|
| workspaceId       | `v.id("workspaces")`                                             | Parent workspace                             |
| userId            | `v.id("users")`                                                  | LTF1 user who sent the reply                |
| channelId         | `v.id("commsChannels")`                                          | Target channel                               |
| content           | `v.string()`                                                     | Reply text                                   |
| source            | `v.union(v.literal("slack"), v.literal("github"), v.literal("discord"), v.literal("jira"))` | Destination platform |
| status            | `v.union(v.literal("pending"), v.literal("sent"), v.literal("failed"))` | Delivery status |
| externalMessageId | `v.optional(v.string())`                                        | ID assigned by source platform after send    |
| error             | `v.optional(v.string())`                                        | Error message if status is "failed"          |

**Indexes:**
- `by_workspaceId`: `["workspaceId"]` -- all replies for workspace
- `by_channelId`: `["channelId"]` -- replies in a specific channel

---

## Integration Tables

### discordIntegrations

Discord bot connection configuration per workspace.

| Field        | Validator              | Description                        |
|--------------|------------------------|------------------------------------|
| workspaceId  | `v.id("workspaces")`   | Parent workspace                   |
| botToken     | `v.string()`           | Discord bot token (encrypted)      |
| guildId      | `v.string()`           | Discord server (guild) ID          |
| guildName    | `v.string()`           | Discord server display name        |
| active       | `v.boolean()`          | Integration enabled/disabled       |
| connectedBy  | `v.id("users")`        | User who set up the integration    |
| connectedAt  | `v.number()`           | Connection timestamp               |
| updatedAt    | `v.number()`           | Last update timestamp              |

**Indexes:**
- `by_workspaceId`: `["workspaceId"]`
- `by_guildId`: `["guildId"]`

### discordChannelMappings

Maps Discord channels to LTF1 projects.

| Field              | Validator                                                        | Description                          |
|--------------------|------------------------------------------------------------------|--------------------------------------|
| workspaceId        | `v.id("workspaces")`                                             | Parent workspace                     |
| integrationId      | `v.id("discordIntegrations")`                                    | Parent integration                   |
| discordChannelId   | `v.string()`                                                     | Discord channel snowflake ID         |
| discordChannelName | `v.string()`                                                     | Discord channel display name         |
| projectId          | `v.optional(v.id("projects"))`                                  | Mapped LTF1 project (optional)       |
| channelType        | `v.union(v.literal("text"), v.literal("voice"), v.literal("forum"), v.literal("thread"))` | Discord channel type |
| syncEvents         | `v.array(v.string())`                                            | Events to sync (e.g. `["messages", "reactions"]`) |
| active             | `v.boolean()`                                                    | Mapping enabled/disabled             |
| createdAt          | `v.number()`                                                     | Creation timestamp                   |

**Indexes:**
- `by_workspaceId`: `["workspaceId"]`
- `by_integrationId`: `["integrationId"]`
- `by_discordChannelId`: `["discordChannelId"]`

### jiraIntegrations

Jira cloud connection configuration per workspace.

| Field         | Validator              | Description                        |
|---------------|------------------------|------------------------------------|
| workspaceId   | `v.id("workspaces")`   | Parent workspace                   |
| accessToken   | `v.string()`           | OAuth 2.0 access token             |
| refreshToken  | `v.string()`           | OAuth 2.0 refresh token            |
| cloudId       | `v.string()`           | Jira Cloud instance ID             |
| siteName      | `v.string()`           | Jira site name                     |
| siteUrl       | `v.string()`           | Jira site URL                      |
| active        | `v.boolean()`          | Integration enabled/disabled       |
| connectedBy   | `v.id("users")`        | User who set up the integration    |
| connectedAt   | `v.number()`           | Connection timestamp               |
| updatedAt     | `v.number()`           | Last update timestamp              |

**Indexes:**
- `by_workspaceId`: `["workspaceId"]`
- `by_cloudId`: `["cloudId"]`

### jiraProjectMappings

Maps Jira projects to LTF1 projects with sync configuration.

| Field            | Validator                                                        | Description                          |
|------------------|------------------------------------------------------------------|--------------------------------------|
| workspaceId      | `v.id("workspaces")`                                             | Parent workspace                     |
| integrationId    | `v.id("jiraIntegrations")`                                       | Parent integration                   |
| jiraProjectId    | `v.string()`                                                     | Jira project ID                      |
| jiraProjectKey   | `v.string()`                                                     | Jira project key (e.g. "PROJ")       |
| jiraProjectName  | `v.string()`                                                     | Jira project display name            |
| projectId        | `v.optional(v.id("projects"))`                                  | Mapped LTF1 project (optional)       |
| syncDirection    | `v.union(v.literal("to_ltf1"), v.literal("to_jira"), v.literal("bidirectional"))` | Sync direction |
| syncTypes        | `v.array(v.string())`                                            | Event types to sync (e.g. `["issue_created", "issue_updated"]`) |
| active           | `v.boolean()`                                                    | Mapping enabled/disabled             |
| createdAt        | `v.number()`                                                     | Creation timestamp                   |

**Indexes:**
- `by_workspaceId`: `["workspaceId"]`
- `by_integrationId`: `["integrationId"]`
- `by_jiraProjectId`: `["jiraProjectId"]`
