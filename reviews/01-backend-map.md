# Phase 1 - Backend Map

Date: 2026-04-29
Commit reviewed: `1f4d3d8471b993e23f492d87a32f235a4c7e334b`
Backend roots: `convex`, `packages/backend`

This document is the backend source of truth for frontend audits. Frontend auditors should not infer alternate contracts from UI code.

## Backend Architecture

- Runtime: Convex functions with document database, HTTP actions, scheduled jobs, and generated API references in `convex/_generated`.
- Public function API: Convex `query`, `mutation`, and `action` exports under `convex/`.
- Internal function API: Convex `internalQuery`, `internalMutation`, and `internalAction` exports under `convex/`, callable only through `internal` references.
- Public HTTP API: `convex/http.ts` registers four exact routes: `/clerk-webhook`, `/webhooks/polar`, `/api/cli-refresh`, `/api/github/webhook`.
- Client bindings: web and mobile use `ConvexReactClient`; TUI uses Convex HTTP endpoints `/api/query`, `/api/mutation`, and `/api/action` plus `/api/cli-refresh` for token refresh.
- Shared package: `packages/backend` currently re-exports Convex types and browser/react utilities only; it is not the runtime backend.

## Data Models

Schema source: `convex/schema.ts`. System fields `_id` and `_creationTime` are implicit on every table.

### Identity And Workspace Core

- `users`: Clerk-backed users. Key fields: `clerkId`, `email`, `name`, `avatarUrl`, `role` (`admin` | `user`), optional `status` (`active` | `waitlisted`), `preferences`, GitHub fields, timestamps. Indexes by Clerk ID, email, status, and email search. Invariant: `clerkId` should be unique by convention but only indexed, not schema-unique.
- `workspaces`: tenant root. Key fields: `name`, `slug`, `ownerId`, `settings.features`, optional `settings.integrations`, `subscription`, `isDemo`, timestamps. Indexes by slug and owner. Invariant: slug uniqueness is enforced in `createWorkspace`, not by DB uniqueness.
- `workspaceMembers`: workspace membership. Key fields: `workspaceId`, `userId`, `role` (`owner` | `admin` | `member` | `viewer`), `permissions`, `joinedAt`. Indexes by workspace, user, and workspace-user.
- `workspaceInvitations`: pending workspace invites. Key fields: `workspaceId`, `email`, `role` (`admin` | `member` | `viewer`), `invitedBy`, `status` (`pending` | `accepted` | `declined` | `expired`), `expiresAt`. Indexes by workspace, email, workspace-email, status.
- `teams`: workspace teams. Key fields: `workspaceId`, `name`, `slug`, `description`, timestamps. Indexes by workspace and workspace-slug.
- `teamMembers`: team membership. Key fields: `teamId`, `userId`, `role` (`lead` | `member`), `joinedAt`. Indexes by team, user, team-user.

### Project Management Core

- `projects`: workspace projects. Key fields: `workspaceId`, `name`, `key`, `description`, `leadId`, legacy `members`, `teamIds`, `status` (`planning` | `active` | `on_hold` | `completed` | `archived`), `visibility`, optional `inviteCode`, `repository`, `settings`, `teamSettings`, `metadata`, import metadata, timestamps. Indexes by workspace, key, lead, status, invite code, workspace-status, external source, and name search.
- `projectMembers`: direct project membership. Key fields: `projectId`, `userId`, `role` (`lead` | `member` | `contributor` | `viewer`), `status` (`active` | `pending` | `removed`), `invitedBy`, `joinedAt`. Indexes by project, user, project-user, status, project-status, user-status.
- `projectInvitations`: project invite records. Key fields: `projectId`, `invitedEmail`, `invitedBy`, `role`, `status` (`pending` | `accepted` | `declined` | `expired`), `inviteCode`, `expiresAt`. Indexes by project, invite code, status, email.
- `tasks`: project tasks. Key fields: `projectId`, optional `parentTaskId`, `number`, `title`, `description`, `status` (`backlog` | `todo` | `in_progress` | `in_review` | `done` | `cancelled`), `priority` (`urgent` | `high` | `medium` | `low`), `type` (`feature` | `bug` | `improvement` | `task` | `epic`), `assigneeIds`, deprecated `assigneeId`, `reporterId`, `labels`, dates, dependencies, estimate, time tracked, Git/GitHub/GitLab/import metadata, `sprintId`, `position`, timestamps. Indexes by project, assignee, reporter, status, sprint, parent, project-number, project-external, and title search.
- `sprints`: project sprints. Key fields: `projectId`, `name`, `goal`, `startDate`, `endDate`, `status` (`planning` | `active` | `completed`), timestamps. Indexes by project, status, project-status, and name search.
- `comments`: task comments. Key fields: `taskId`, `userId`, `content`, `createdAt`, optional `editedAt`. Indexes by task and user.
- `attachments`: task attachments. Key fields: `taskId`, `fileName`, `fileUrl`, `fileType`, `fileSize`, `uploadedBy`, `createdAt`. Index by task.
- `timeEntries`: time tracking. Key fields: `taskId`, `userId` as Clerk subject string, `startTime`, optional `endTime`, `duration`, `description`, billing/approval flags, timestamps. Indexes by task, user, task-user, user-startTime, start time.
- `meetings`: workspace/project/sprint meetings. Key fields: `workspaceId`, optional `projectId`/`sprintId`, `title`, `type`, `organizerId`, times, location/url, attendee statuses, related tasks, recurrence, notes, action items, recordings. Indexes by workspace, project, sprint, type, organizer, start time.

### Activity, Notifications, And Collaboration

- `notifications`: per-user notifications. Key fields: `userId`, optional `workspaceId`, `type`, `title`, optional `body`/`message`/`link`, read flags, actor/entity refs, `data`, `createdAt`. Indexes by user, user-workspace, user-read, user-workspace-read.
- `activities`: workspace/project activity log. Key fields: `type`, `workspaceId`, optional `projectId`, optional actor, target metadata, `timestamp`. Indexes by type, project, workspace, actor with timestamp.
- `chatChannels`, `chatMessages`, `chatTypingIndicators`, `chatNotificationSettings`: real-time chat domain. Channels carry workspace/type/member/admin metadata; messages carry sender/content/type/thread/reactions/mentions/read state. Search index on message content.
- `videoRooms`: video room state including workspace/name/type/participants/recording metadata.
- `whiteboards`, `whiteboardSnapshots`: collaborative canvas/pages. Whiteboards store elements, collaborators, version, locked/public flags, content/archive/parent metadata. Snapshots store versioned element payloads.

### Integrations And Imports

- GitHub tables: `githubOAuthStates`, `githubConnections`, `githubInstallations`, `githubRepositories`, `repoDocs`, `githubWebhookEvents`, `githubActivities`, `githubCommits`, `githubPullRequests`, `githubIssues`, `githubUserMappings`, `workspaceGitHubInstallations`, `githubTeamMappings`, `githubIssueSyncQueue`, `githubRateLimits`, `githubOperationLogs`, plus generic `webhookEvents`.
- GitLab tables: `gitlabOAuthStates`, `gitlabIntegrations`, `gitlabProjects`, `gitlabMergeRequests`.
- Slack tables: `slackIntegrations`, `slackChannels`, `slackUserMappings`, `slackEvents`, `slackFiles`, `slackTaskLinks`, `standups`.
- Discord/Jira tables: `discordIntegrations`, `discordChannelMappings`, `jiraIntegrations`, `jiraProjectMappings`.
- `imports`: Linear/Jira import jobs with status (`pending` | `running` | `completed` | `failed`), parameters, progress counters, error, timestamps.

### AI, Agent, Billing, Community, And Miscellaneous

- AI tables: `aiTasks`, `aiSessions`, `aiInsights`, `aiProviderKeys`, `projectAISettings`, `userAICredits`, `aiUsageLogs`, `aiPricingTiers`, `aiCredits`.
- Agent tables: `triageSuggestions`, `agentActivities`, `skills`.
- Billing table: `subscriptions` keyed by workspace/Polar customer/subscription, with status (`active` | `trialing` | `past_due` | `cancelled` | `incomplete`), plan, seat count, billing cycle, period fields.
- UX/community tables: `filterPresets`, `developerProfiles`, `expertiseSearchIndex`, `newsletter`, `wishlist`, `customFieldDefinitions`, `customFieldValues`, `workflows`, `workflowRuns`, `commsMessages`, `commsChannels`, `commsReplies`, `feedback`, `npsSurveys`, `bugReports`, `sprintSnapshots`, `communityPolls`, `communityVotes`, `communityPosts`, `communityUpvotes`, `communityComments`, `pushSubscriptions`.

## Public HTTP API Surface

### `POST /clerk-webhook`

- Source: `convex/http.ts`:8 and `convex/clerk.ts`:6.
- Auth: Svix signature via `CLERK_WEBHOOK_SECRET`.
- Request shape: raw Clerk webhook body plus `svix-id`, `svix-timestamp`, `svix-signature` headers.
- Response shape: empty `200` on success, `400` invalid signature, thrown error if secret missing.
- Side effects: on `user.created` or `user.updated`, calls `internal.auth.users.createOrUpdateUser`.
- Idempotency: upserts by Clerk ID; invitation auto-accept may insert memberships on new user creation only.

### `POST /webhooks/polar`

- Source: `convex/http.ts`:15-119.
- Auth: HMAC verification through `internal.billing.webhookVerify.verifyPolarSignature` using `POLAR_WEBHOOK_SECRET` and webhook headers.
- Request shape: raw Polar webhook JSON body, headers `webhook-id`, `webhook-timestamp`, `webhook-signature`.
- Response shape: text `OK` on success, `400` missing headers, `401` invalid signature, `500` config/handler errors.
- Side effects: creates, updates, or cancels subscription records and mirrors plan/seat fields onto workspace subscription.
- Idempotency: subscription creation updates existing workspace subscription; no webhook event ID storage or replay guard in `http.ts`.

### `POST /api/cli-refresh`

- Source: `convex/http.ts`:146-184 and `convex/cliRefresh.ts`.
- Auth: accepts a Clerk `sessionId` in JSON body, uses `CLERK_SECRET_KEY` server-side to mint a Convex JWT.
- Request shape: `{ "sessionId": string }`.
- Response shape: `{ "token": string }` with `200`, `{ "error": string }` with `400`, `401`, or `500`.
- Side effects: none except Clerk token read.
- Idempotency: yes; repeated valid requests mint fresh tokens.

### `POST /api/github/webhook`

- Source: `convex/http.ts`:187-541.
- Auth: verifies `x-hub-signature-256` with `GITHUB_WEBHOOK_SECRET` via internal GitHub action.
- Request shape: raw GitHub webhook JSON body with `x-hub-signature-256` and `x-github-event` headers.
- Response shape: text `OK` with `200`, `400` missing headers, `401` invalid signature, `500` handler errors.
- Events handled: `installation`, `installation_repositories`, `push`, `pull_request`, `issues`, `issue_comment`, `pull_request_review_comment`.
- Side effects: stores/removes installations, links commits/PRs/issues/comments to tasks, logs GitHub activity, syncs PR/issue comments to tasks.
- Idempotency: no delivery-ID replay guard in the route; duplicate GitHub deliveries may duplicate downstream activity unless individual internal mutations dedupe.

## Public Convex Function API Surface

Exact request shapes are the `args` validators in each source file. Exact response shapes are `returns` validators where present; many functions lack `returns`, which is logged as Finding B-001.

### Auth And User API

- `auth.users`: `getCurrentUser`, `createCurrentUser`, `updateLastSeen`, `getUserById`, `updateUserPreferences`, `makeUserAdmin`, `updateUserProfile`, `validateGitHubToken`.
- Auth model: most functions use Clerk identity (`ctx.auth.getUserIdentity`) and map `identity.subject` to `users.clerkId`.
- Important contract: `getCurrentUser` returns `null` when unauthenticated or missing user; `createCurrentUser` creates/seeds the user and returns full user doc.

### Workspace API

- `workspaces.queries`: `getUserWorkspaces`, `getWorkspaceById`, `getWorkspaceMembers`, `getWorkspaceStats`, `getPendingInvitations`.
- `workspaces.mutations`: `createWorkspace`, `updateWorkspace`, `inviteToWorkspace`, `updateMemberRole`, `deleteWorkspace`, `removeMember`.
- Permission model: `workspace.view`, `workspace.edit`, `workspace.invite`; owner-only delete is manually checked in `deleteWorkspace`.

### Project API

- `projects.queries`: `getWorkspaceProjects`, `getProject`, `getProjectsByStatus`, `getProjectTeamMembers`, `getProjectByInviteCode`, `getUserProjects`, `getProjectInviteLink`.
- `projects.mutations`: `createProject`, `updateProject`, `deleteProject`, `connectRepository`, `ensureProjectInviteCode`, `generateProjectInviteCode`, `joinProjectByCode`, `addProjectMember`, `removeProjectMember`, `updateProjectMemberRole`, `assignTeam`, `inviteByEmail`, `inviteWorkspaceMembers`.
- `projects.members`: `getProjectMembers`.
- Permission model: workspace permissions first, then direct project role permissions, then team membership permissions.

### Task, Sprint, Comment, And Time API

- `tasks.queries`: `getProjectTasks`, `getTask`, `getMyTasks`, `getTaskTimeEntries`, `getActiveTimeEntry`, `getFilteredTasks`, `getWorkspaceLabels`, `getTasksByUser`, `getTasksByWorkspace`.
- `tasks.mutations`: `createTask`, `updateTask`, `deleteTask`, `moveTask`, `startTimeTracking`, `pauseTimeTracking`, `stopTimeTracking`, `bulkUpdateTasks`, `bulkDeleteTasks`.
- `sprints.queries`: `getProjectSprints`, `getCurrentSprint`, `getSprintById`, `getBacklogTasks`.
- `sprints.mutations`: `createSprint`, `updateSprint`, `deleteSprint`, `addTasksToSprint`, `removeTaskFromSprint`.
- `comments.mutations`: `createComment`, `updateComment`, `deleteComment`.
- `timeEntries`: `getTimeEntry`, `getTimeEntriesByTask`, `getTimeEntriesByUser`, `getActiveTimeEntry`, `getTimeEntriesByProject`, `getTimeEntriesForApproval`, `startTimer`, `stopTimer`, `createManualEntry`, `updateTimeEntry`, `deleteTimeEntry`, `approveTimeEntries`, `getTimeStatsByUser`.
- Important contract: task status strings are `backlog`, `todo`, `in_progress`, `in_review`, `done`, `cancelled`; sprint status strings are `planning`, `active`, `completed`.

### Notifications, Activity, Dashboard, Search

- `notificationQueries`: `getNotifications`, `getUnreadCount`, `markAsRead`, `markAllAsRead`.
- `notifications.config`: `getVapidPublicKey`.
- `notifications.push_helpers`: `subscribe`, `unsubscribe`.
- `activities.queries`: `getProjectActivities`, `getWorkspaceActivities`, `getRecentTeamActivity`, `getActivityStats`, `getTeamActivityDashboard`, `getDashboardActivities`.
- `dashboard.queries`: `getDashboardData`.
- `search`: `globalSearch`, `quickSearch`, `searchSuggestions`.

### Collaboration And Content API

- `chat`: `createChannel`, `sendMessage`, `editMessage`, `deleteMessage`, `addReaction`, `markAsRead`, `updateTypingIndicator`, `getChannels`, `getMessages`, `getTypingIndicators`, `searchMessages`, `joinChannel`, `leaveChannel`, `updateNotificationSettings`, `togglePinMessage`, `getUnreadCounts`.
- `documents`: `getDocument`, `getDocuments`, `getChildDocuments`, `searchDocuments`, `createDocument`, `updateDocumentContent`, `updateDocumentMeta`, `archiveDocument`, `restoreDocument`, `getArchivedDocuments`, `deleteDocumentPermanent`, `createDocumentFromTemplate`, `hasWelcomePage`.
- `whiteboard`: `createWhiteboard`, `addElement`, `updateElement`, `deleteElement`, `batchUpdateElements`, `updateCursor`, `createSnapshot`, `restoreSnapshot`, `getWhiteboards`, `getWhiteboard`, `getSnapshots`, `exportAsImage`, `generateImageUploadUrl`, `getStorageUrl`, `cloneWhiteboard`, `deleteWhiteboard`.
- `video`: `createRoom`, `joinRoom`, `leaveRoom`, `updateMediaState`, `muteParticipant`, `removeParticipant`, `startRecording`, `stopRecording`, `getActiveRooms`, `getRoom`, `getRoomRecordings`, `sendSignal`, `getInstantMeetingLink`, `scheduleMeeting`.
- `meetings`: `getProjectMeetings`, `getWorkspaceMeetings`, `getUserMeetings`, `getMeeting`, `getUpcomingMeetings`, `getMeetingTemplates`, `createMeeting`, `updateMeeting`, `respondToMeeting`, `addActionItem`, `convertActionItemToTask`, `deleteMeeting`.

### AI, Agent, Skills, Automation, Billing

- `ai.actions`: `generateDescription`, `suggestTasks`, `analyzeTask`.
- `ai.generate`: `generate`.
- `ai.keyManagement`: `getProviderKeys`, `getMyProviderKeys`, `getProjectAISettings`, `saveProviderKey`, `removeProviderKey`, `updateProviderKey`, `updateProjectAISettings`.
- `ai.mutations`: `trackAISession`, `addAIFeedback`, `createAIInsight`, `dismissAIInsight`, `createAITaskSuggestion`, `updateAITaskStatus`, `generateDocumentation`.
- `ai.queries`: `getUserAISessions`, `getWorkspaceAIStats`, `getActiveInsights`, `getPendingAITasks`, `getAIFeedbackSummary`.
- `ai.taskAssignment`: `suggestAssignees`.
- `ai.projectInsights`: `generateProjectInsights`, `generateTasksFromDescription`, `generateStandupSummary`.
- `aiCredits`: `validateApiKey`, `getUserAICredits`, `getUserAIUsage`, `getMonthlyUsageStats`, `canMakeAIRequest`, `getPricingTiers`, `setupUserAI`, `saveApiKey`, `removeApiKey`, `trackAIUsage`, `resetMonthlyCredits`.
- `agent`: `suggestNextActions`, `updateTriageSettings`, `getTriageQueue`, `getTriageSuggestionForTask`, `getTriageStats`, `getAgentActivityFeed`, `getTaskAgentActivity`, `getTriageSettings`, `acceptTriageSuggestion`, `rejectTriageSuggestion`, `modifyAndAcceptTriageSuggestion`.
- `skills`: `getWorkspaceSkills`, `getSkillById`, `getBuiltInSkills`, `getPublishedSkills`, `getSkillUsageStats`, `createSkill`, `updateSkill`, `deleteSkill`, `toggleSkill`, `publishSkill`, `unpublishSkill`, `installBuiltInSkill`, `installSkill`, `executeSkill`.
- `automation`: `createWorkflow`, `updateWorkflow`, `deleteWorkflow`, `toggleWorkflow`, `runWorkflow`, `getWorkflows`, `getWorkflowRuns`, `getWorkflowById`, `exportWorkflowTemplate`, `importWorkflowTemplate`.
- `billing`: `createCheckoutSession`, `getSubscriptionStatus`, `canAddMembers`.

### Integration API

- GitHub: OAuth/actions/docs/auth/mutations/queries/metrics/monitoring/release notes/team sync/install management/project queries/diff actions. Main public functions include `handleOAuthCallback`, `fetchGitHubRepositories`, `fetchGitHubActivity`, `fetchAvailableRepositories`, `syncRepositories`, `connectRepositoryToProject`, `syncRepository`, `getWorkspaceInstallations`, `getInstallationRepositories`, `getProjectGitHubActivity`, `getProjectRepository`, `getDeveloperGitHubStats`, `getTaskPullRequests`, `getTaskCommits`, `getProjectCommits`, `getProjectPullRequests`, `getProjectIssues`, `searchRepositories`, `debugGitHubState`, `verifyInstallationAccess`, `linkGitHubAccount`, `getUserInstallations`, `linkInstallationToWorkspace`, `unlinkInstallationFromWorkspace`, `setPrimaryInstallation`, `getAvailableInstallations`, `migrateLegacyInstallation`, `updateSyncSettings`.
- GitLab: `syncProjectData`, `fetchGitLabProjects`, `createGitLabIssue`, `createGitLabMergeRequest`, `storeOAuthState`, `storeAccessToken`, `disconnectGitLab`, `connectProjectToGitLab`, `syncGitLabIssues`, `syncGitLabMergeRequests`, `verifyOAuthState`, `getGitLabIntegration`, `getProjectGitLabConnection`, `getGitLabProjects`, `getGitLabIssues`, `getGitLabMergeRequests`, `getGitLabActivity`.
- Slack: `handleSlashCommand`, `storeSlackIntegration`, `mapSlackChannel`, `mapSlackUser`, `logSlackEvent`, `processSlackEvent`, `sendNotification`, `getSlackIntegration`, `getSlackChannel`, `getSlackChannels`, `getSlackChannelsForEvent`, `getSlackUserMapping`, `getSlackUserMappings`, `getSlackEvent`, `getRecentSlackEvents`, `getTaskBySlackMessage`, `getSlackFiles`, `getSlackIntegrationStatus`, `getRecentStandups`, `updateSlackEvent`, `disconnectChannel`, `disconnectSlack`, `storeSlackFile`, `linkTaskToSlackMessage`, `storeStandup`, `updateSlackIntegrationSettings`.
- Linear/Jira imports: `testConnection`, `startImport`, `getImport`, `listImports`.
- Communication integrations: `getCommsChannels`, `getUnifiedFeed`, `getChannelMessages`, `getCommsStats`, `markChannelRead`, `createInternalChannel`, `sendInternalMessage`, `updateChannelSettings`.

### Other Public API

- `resources`: `getResourceAllocations`, `getTeamCapacity`, `getSkillMatrix`, `getWorkloadBalance`, `getUtilizationReport`, `allocateResource`, `updateAllocation`, `removeAllocation`, `balanceWorkload`.
- `teams`: `createTeam`, `getTeams`, `getTeamMembers`, `getAvailableMembers`, `addTeamMember`.
- `customFields`: `createCustomField`, `updateCustomField`, `deleteCustomField`, `reorderCustomFields`, `getCustomFields`, `setCustomFieldValue`, `getCustomFieldValues`, `bulkSetCustomFieldValues`, `deleteCustomFieldValues`, `searchByCustomFields`.
- `developers`: `getDeveloperProfile`, `getMyProfile`, `searchDevelopers`, `getTeamExpertiseMatrix`, `getSuggestedReviewers`, `getWorkspaceStatuses`, `updateDeveloperProfile`, `updateStatus`, `updateTechStack`, `syncGithubStats`.
- `audit`: `getAuditLogs`, `getAuditLogStats`, `exportAuditLogs`, `setRetentionPolicy`.
- `bugReports`: `generateUploadUrl`, `submitBugReport`, `listBugReports`, `getBugReport`, `updateBugReportStatus`.
- `community`: `getActivePolls`, `getClosedPolls`, `getPosts`, `getPostComments`, `createPoll`, `votePoll`, `closePoll`, `createPost`, `upvotePost`, `commentOnPost`.
- `feedback`: `submitFeedback`, `listFeedback`.
- `nps`: `submitNpsSurvey`, `dismissNpsSurvey`, `hasCompletedNps`.
- `waitlist`: `getWaitlistStats`, `joinWaitlist`, `subscribeToNewsletter`, `addToWishlist`.
- `onboarding`: `getChecklistStatus`, `deleteMyDemo`.

## Authentication And Authorization

- Auth provider: Clerk. Convex auth config uses Clerk domain `https://fleet-tadpole-92.clerk.accounts.dev` with application ID `convex`.
- User resolution: helpers in `convex/lib/auth.ts` map `ctx.auth.getUserIdentity().subject` to `users.clerkId`.
- Public functions either throw `Unauthorized`, return `null`, or return `[]` when unauthenticated; behavior is inconsistent and must be treated as part of each function contract.
- Workspace permission helper: `hasPermission` and `requirePermission` in `convex/auth/permissions.ts` check `workspaceMembers` role plus custom permissions.
- Project permission helper: `hasProjectPermission` checks workspace permission, direct project membership, then team membership inherited as member/lead.
- Role permission sets:
- Owner: all workspace, project, task, and meeting permissions.
- Admin: workspace view/edit/invite, project create/view/edit/delete, team management, task create/view/edit/delete/assign, meeting create/view/edit/delete.
- Member: workspace view, project view/edit, team view, task create/view/edit/assign, meeting create/view/edit.
- Viewer: workspace view, project/team/task/meeting view only.
- Project lead: project/team/task/meeting full permissions for project.
- Project member: project edit, team view, task create/view/edit/assign, meeting create/view/edit.
- Project contributor: project/team view, task create/view/edit, meeting view.
- Project viewer: project/team/task/meeting view only.

## State Machines

- User `status`: `waitlisted` or `active`. `createOrUpdateUser` creates waitlisted users from Clerk webhook; `ensureUserExists` creates active users from app/session flows.
- Workspace invitation `status`: `pending`, `accepted`, `declined`, `expired`. New-user creation auto-accepts pending unexpired invitations.
- Project member `status`: `active`, `pending`, `removed`.
- Project invitation `status`: `pending`, `accepted`, `declined`, `expired`.
- Project `status`: `planning`, `active`, `on_hold`, `completed`, `archived`. `deleteProject` is a soft archive.
- Task `status`: `backlog`, `todo`, `in_progress`, `in_review`, `done`, `cancelled`. `createTask` always starts at `backlog`; time tracking start moves task to `in_progress`; done sets `completedAt`.
- Sprint `status`: `planning`, `active`, `completed`. `updateSprint` prevents more than one active sprint per project.
- Meeting attendee `status`: `pending`, `accepted`, `declined`, `tentative`.
- AI task `status`: `pending`, `accepted`, `rejected`.
- GitHub webhook event `status`: `pending`, `processed`, `failed`.
- GitHub issue sync queue `status`: `pending`, `processing`, `completed`, `failed`.
- Newsletter `status`: `active`, `unsubscribed`.
- Workflow run `status`: `pending`, `running`, `completed`, `failed`.
- Bug report `status`: `new`, `triaged`, `in_progress`, `resolved`, `closed`.
- Subscription `status`: `active`, `trialing`, `past_due`, `cancelled`, `incomplete`.
- Triage suggestion `status`: `pending`, `accepted`, `rejected`, `partial`, `auto_applied`.
- Community poll `status`: `active`, `closed`.
- Import job `status`: `pending`, `running`, `completed`, `failed`.

## External Dependencies And Failure Modes

- Clerk: auth identity, webhooks, CLI token refresh. Failures mostly throw or return `{ error }`; no circuit breaker.
- Svix: Clerk webhook signature verification. Invalid signature returns 400.
- Polar.sh: checkout API and webhooks. Checkout failure logs provider response and throws generic error; webhook verification returns 401 on invalid signature.
- GitHub API/App: installation tokens, repository sync, webhooks, docs, metrics, comments, team sync. Some queue processing is cron-backed; many actions throw provider errors directly.
- GitLab API: OAuth, project/issues/MR sync, create issue/MR actions. Failure handling generally throws.
- Slack API: slash commands/events/notifications; stored integration tokens in DB. Failure handling varies by action.
- Linear API: GraphQL import worker. Import errors update import status through internal worker path.
- Jira API: Cloud REST import worker. Import errors update import status through internal worker path.
- Resend: transactional email. Internal email sends throw on provider error; public `sendTestEmail` returns success/error object.
- Web Push: push subscriptions and dispatch helpers.
- AI providers: Cerebras/Groq/OpenAI-compatible clients and user-supplied keys. Failure handling generally returns validation errors or throws action errors.
- Convex storage: bug report uploads and whiteboard image upload URLs.

## Background Jobs And Queues

- Cron `process-github-issue-sync-queue`: every 1 minute, calls `internal.integrations.github.issueSync.processSyncQueue`.
- Cron `process-github-team-sync`: every 1 hour, calls `internal.integrations.github.teamSync.processTeamSyncQueue`.
- Cron `process-github-repository-sync`: every 15 minutes, calls `internal.integrations.github.syncActions.processRepositorySyncQueue`.
- Cron `process-github-stats-sync`: every 30 minutes, calls `internal.integrations.github.syncActions.processStatsSyncQueue`.
- Cron `process-due-date-reminders`: every 6 hours, calls `internal.email.cronHelpers.processDueDateReminders`.
- Cron `process-overdue-alerts`: every 12 hours, calls `internal.email.cronHelpers.processOverdueAlerts`.
- Cron `process-meeting-reminders`: every 15 minutes, calls `internal.email.cronHelpers.processMeetingReminders`.
- Cron `process-sprint-ending-reminders`: every 12 hours, calls `internal.email.cronHelpers.processSprintEndingReminders`.
- Cron `daily sprint snapshot`: daily at midnight UTC, calls `internal.sprints.snapshots.captureAllActiveSprintSnapshots`.
- Ad hoc scheduled work: task creation schedules agent triage and auto-skill matching; task/sprint/comment/workspace actions schedule notification/email dispatch; GitHub and import flows schedule sync work.
- Idempotency varies by job. Some import/upsert paths are idempotent by external IDs. Webhook routes do not consistently record delivery IDs before processing.

## Caching Layers

- No standalone cache service detected.
- Convex query subscriptions provide client-side reactive caching.
- GitHub rate limit and operation data are persisted in tables, not a cache layer.
- TUI auth token refresh is cached locally in auth config; refresh is throttled for 5 seconds in `apps/tui/internal/api/client.go`.
- No documented TTL/invalidation strategy for derived dashboard stats, analytics, or integration sync data.

## Known Frontend Coupling

- Web and mobile consume `convex/_generated/api` directly; generated API drift breaks compile-time contracts.
- TUI uses string function paths over Convex HTTP and local Go structs in `apps/tui/internal/api/types.go`; it assumes task fields `_id`, `_creationTime`, `projectId`, `title`, `description`, `status`, `priority`, `type`, `assigneeIds`, `labels`, `sprintId`, `estimate`, and `progress`.
- TUI assumes Convex deployment URL from `CONVEX_URL`, `VITE_CONVEX_URL`, or saved config, and derives `.convex.site` from `.convex.cloud` for `/api/cli-refresh`.
- Web expects Vite env values `VITE_CONVEX_URL` and `VITE_CLERK_PUBLISHABLE_KEY`; mobile expects `EXPO_PUBLIC_CONVEX_URL` and Clerk publishable key.
- Task assignment uses both `assigneeIds` and deprecated `assigneeId`; consumers must prefer `assigneeIds` and keep `assignee` backward-compatible until migration is complete.
- Some APIs return `[]` for unauthenticated/unauthorized while others throw; frontends must not assume a single auth error shape.
- Many functions return inferred values due missing `returns` validators, so frontend type expectations are currently less stable than the source suggests.

## Backend Findings

### Finding B-001: Many Convex functions omit return validators

- **Severity:** High
- **Surface:** Backend
- **Category:** Bug | DX
- **Location:** `convex/auth/users.ts`:6-93, `convex/tasks/mutations.ts`:23-152, `convex/tasks/queries.ts`:6-105, and many additional Convex files
- **Observed behavior:** Numerous `query`, `mutation`, `action`, and internal functions define `args` and `handler` but no `returns`. Examples include `createOrUpdateUser`, `getCurrentUser`, `createTask`, `getProjectTasks`, `updateTask`, `deleteTask`, `createSprint`, `createComment`, and many integration functions.
- **Expected behavior:** Repository Convex rules require argument and return validators on every Convex function, using `v.null()` for null/no-return functions.
- **Impact:** Generated API contracts are incomplete or inferred inconsistently, frontend type drift is harder to detect, and baseline typecheck failures are amplified.
- **Root cause hypothesis:** Functions were added before the validator policy or without enforcing Convex lint/type rules in CI.
- **Proposed fix:** Add explicit `returns` validators to all Convex functions in small module-by-module commits, starting with frontend-consumed functions.
- **Risk of fix:** Validators may expose real response-shape mismatches; each module needs typecheck and targeted client verification.
- **Estimated effort:** L

### Finding B-002: Any authenticated user can list all tasks in any workspace by ID

- **Severity:** Blocker
- **Surface:** Backend
- **Category:** Security
- **Location:** `convex/tasks/queries.ts`:614-642
- **Observed behavior:** `getTasksByWorkspace` only checks that a Clerk identity exists, then fetches every project in `args.workspaceId` and returns all tasks. It never maps the identity to a user or checks `workspace.view`/`task.view` membership for that workspace.
- **Expected behavior:** Task listing by workspace must require the caller to be a workspace member with task or project view permission.
- **Impact:** A signed-in user who obtains or guesses a workspace ID can read task titles, descriptions, labels, assignee IDs, project relationships, and other task metadata for another tenant.
- **Root cause hypothesis:** Helper query was added for convenience and bypassed the standard `getCurrentUser` plus `hasPermission` pattern used in other task queries.
- **Proposed fix:** Use `getCurrentUser(ctx)` and `hasPermission(ctx.db, user._id, args.workspaceId, "task.view")` before fetching projects/tasks; return `[]` or throw consistently with adjacent queries.
- **Risk of fix:** Existing callers relying on unauthorised access will start seeing empty/error states; update tests and frontend handling.
- **Estimated effort:** S

### Finding B-003: Any authenticated user can query tasks for any Clerk user ID

- **Severity:** High
- **Surface:** Backend
- **Category:** Security
- **Location:** `convex/tasks/queries.ts`:568-612
- **Observed behavior:** `getTasksByUser` accepts `userId: v.string()`, treats it as a Clerk ID, requires only that the caller is authenticated, then collects all tasks and returns tasks where the target user is assignee or reporter. It does not require `args.userId === identity.subject` or workspace/project permission.
- **Expected behavior:** A user-task query must either be self-only or scoped through workspace/project authorization.
- **Impact:** Signed-in users can enumerate another user's task involvement if they know the target Clerk ID.
- **Root cause hypothesis:** The function mixed identity lookup with cross-user reporting needs and did not add an authorization branch for non-self queries.
- **Proposed fix:** Restrict to the current identity by default. For cross-user use cases, require a workspace/project ID and verify `task.view`/admin permission before returning results.
- **Risk of fix:** Dashboard/profile surfaces may need to pass workspace context; add tests for self and non-self access.
- **Estimated effort:** S

### Finding B-004: Pending workspace invitations leak invitee emails without workspace permission

- **Severity:** High
- **Surface:** Backend
- **Category:** Security
- **Location:** `convex/workspaces/queries.ts`:203-244
- **Observed behavior:** `getPendingInvitations` only checks for any authenticated identity, then returns pending invitation emails and inviter names for `args.workspaceId`. It does not verify membership or `workspace.invite` permission.
- **Expected behavior:** Pending invitations should be visible only to workspace members with invitation/admin permissions.
- **Impact:** Invitation email addresses and inviter metadata are exposed to any signed-in user with a workspace ID.
- **Root cause hypothesis:** The query used raw Clerk identity instead of the standard workspace permission helper.
- **Proposed fix:** Resolve current user and require `workspace.invite` or at least `workspace.view` before reading invitations.
- **Risk of fix:** Non-admin members may lose visibility if UI expected broader access; align with product policy and add tests.
- **Estimated effort:** S

### Finding B-005: Public user lookup returns arbitrary user documents without authorization

- **Severity:** High
- **Surface:** Backend
- **Category:** Security
- **Location:** `convex/auth/users.ts`:331-336
- **Observed behavior:** `getUserById` accepts any `Id<"users">` and returns the full user document with no authentication or relationship check.
- **Expected behavior:** User lookups should require authentication and return a public profile projection unless the caller is the same user or has an authorized workspace/project relationship.
- **Impact:** Any client that can call this query can retrieve user emails, preferences, role/status, GitHub metadata, and timestamps by user ID.
- **Root cause hypothesis:** Utility query was exposed publicly for convenience instead of internalizing or projecting safe fields.
- **Proposed fix:** Add auth, relationship checks, and a safe return projection. If full user docs are needed internally, move that path to `internalQuery`.
- **Risk of fix:** Components relying on full user docs may need adjusted fields; add tests for self, related member, and unrelated user.
- **Estimated effort:** M

### Finding B-006: AI provider key management authorizes only “authenticated”, not owner of scope/key

- **Severity:** Blocker
- **Surface:** Backend
- **Category:** Security
- **Location:** `convex/ai/keyManagement.ts`:8-67, `convex/ai/keyManagement.ts`:178-219, `convex/ai/keyManagement.ts`:270-377
- **Observed behavior:** `getProviderKeys` accepts arbitrary `scope` and `scopeId` and returns masked metadata for matching keys to any authenticated user. `saveProviderKey` writes a key for arbitrary user/project scope. `removeProviderKey`, `updateProviderKey`, and `updateProjectAISettings` only require authentication and do not verify key ownership or project/workspace permissions.
- **Expected behavior:** User-scoped keys must be limited to `identity.subject`; project-scoped keys/settings must require project/workspace admin permission; key mutation by ID must verify ownership before update/delete.
- **Impact:** A signed-in user can discover, overwrite, deactivate, delete, or attach AI provider keys for other users/projects if they know IDs or scope strings.
- **Root cause hypothesis:** Scope fields were trusted as client-provided authorization instead of deriving or checking them server-side.
- **Proposed fix:** Derive user scope from identity, require project permission for project scope, and verify `key.scope/scopeId` before every key mutation. Add negative authorization tests.
- **Risk of fix:** Existing UI flows that pass arbitrary scope IDs may fail until updated to use server-derived scope or authorized project context.
- **Estimated effort:** M

### Finding B-007: User-supplied AI API keys are base64-encoded, not encrypted

- **Severity:** High
- **Surface:** Backend
- **Category:** Security
- **Location:** `convex/ai/keyManagement.ts`:209-215; `convex/aiCredits/mutations.ts`:4-15; `convex/schema.ts`:1252-1255
- **Observed behavior:** Provider keys are stored as `btoa(args.apiKey)`. `aiCredits.saveApiKey` uses `btoa` with comments calling it “simple encryption”. The `aiCredits` table also has an optional raw `apiKey` field, and `internalQueries.getUserApiKey` returns `aiCredits?.apiKey`.
- **Expected behavior:** Secrets should be encrypted with a server-side key management strategy or stored in a provider designed for secrets, never reversible by simple base64 encoding or raw schema fields.
- **Impact:** Anyone with database read access or a server-side bug can recover all BYOK provider keys trivially.
- **Root cause hypothesis:** Placeholder encoding was shipped as storage protection.
- **Proposed fix:** Introduce real encryption with a Convex environment secret and authenticated encryption, remove raw-key usage through a non-breaking migration plan, and rotate affected keys if production data exists.
- **Risk of fix:** Requires migration of persisted key material and may be a security incident if production keys exist; this may trigger stop-and-ask before live fix.
- **Estimated effort:** L

### Finding B-008: Any workspace member can create billing checkout sessions

- **Severity:** High
- **Surface:** Backend
- **Category:** Security | Bug
- **Location:** `convex/billing/actions.ts`:23-33
- **Observed behavior:** `createCheckoutSession` calls `getSubscriptionStatus` and only checks that it returns non-null, which means any workspace member can create a checkout session for that workspace.
- **Expected behavior:** Billing management should be limited to workspace owner/admin or a dedicated billing permission.
- **Impact:** Non-admin members can initiate plan/checkout flows for workspaces they do not administer, potentially confusing billing ownership and audit trails.
- **Root cause hypothesis:** Membership verification was reused as billing authorization.
- **Proposed fix:** Resolve the current Convex user and require owner/admin role or a new `billing.manage` permission before creating checkout sessions.
- **Risk of fix:** Some member users may lose access to billing page actions; update UI permissions accordingly.
- **Estimated effort:** S

### Finding B-009: GitHub webhook processing lacks delivery idempotency guard

- **Severity:** Medium
- **Surface:** Backend
- **Category:** Bug
- **Location:** `convex/http.ts`:187-275
- **Observed behavior:** `/api/github/webhook` verifies signatures and immediately processes events. It does not persist or check `x-github-delivery` before executing side effects, even though the schema includes `githubWebhookEvents.deliveryId`.
- **Expected behavior:** Webhook handlers should record delivery IDs and skip or safely replay duplicate deliveries.
- **Impact:** GitHub retries can duplicate activity logs, issue/PR comment syncs, and downstream scheduled work.
- **Root cause hypothesis:** Event storage schema was created but not integrated into the HTTP route.
- **Proposed fix:** Read `x-github-delivery`, insert/check a pending event record transactionally, mark processed/failed after handlers, and make downstream operations idempotent where needed.
- **Risk of fix:** Need careful handling so legitimate retries after failed processing can recover; add tests for duplicate and failed deliveries.
- **Estimated effort:** M

### Finding B-010: Workspace deletion leaves orphaned related records

- **Severity:** High
- **Surface:** Backend
- **Category:** Bug
- **Location:** `convex/workspaces/mutations.ts`:430-509
- **Observed behavior:** `deleteWorkspace` deletes projects, tasks, workspace members, activities, meetings, and the workspace. It does not delete or archive related sprints, comments, attachments, notifications, time entries, invitations, project members/invitations, documents/whiteboards, integrations, billing/subscriptions, skills, custom fields, chat/comms data, or import jobs.
- **Expected behavior:** Workspace deletion should either be a soft-delete with all queries respecting it, or it should cascade comprehensively across all workspace-scoped tables.
- **Impact:** Orphaned data remains readable through insufficiently scoped queries and pollutes future analytics/storage. It can also break queries that expect parent project/workspace records to exist.
- **Root cause hypothesis:** Cascade delete was implemented before later workspace-scoped tables were added.
- **Proposed fix:** Prefer non-breaking soft deletion plus query filtering, or add an exhaustive cascade helper with tests for all workspace-owned tables.
- **Risk of fix:** A full cascade touches many tables and may exceed the stop-and-ask threshold; soft delete requires query updates across many files.
- **Estimated effort:** L

### Finding B-011: Several queries use unbounded table scans and post-filtering

- **Severity:** Medium
- **Surface:** Backend
- **Category:** Perf
- **Location:** `convex/tasks/queries.ts`:208-260, `convex/tasks/queries.ts`:588-610, `convex/workspaces/queries.ts`:151-199, `convex/auth/permissions.ts`:215-223
- **Observed behavior:** `getMyTasks` collects every task in the database before filtering by assignee. `getTasksByUser` collects every task before filtering. `getWorkspaceStats` performs per-project task queries and collects full activity history before filtering in memory. `hasProjectPermission` filters team memberships with a dynamic OR after querying by user.
- **Expected behavior:** Queries should use targeted indexes, pagination, or denormalized lookup tables instead of unbounded `.collect()` and in-memory filtering.
- **Impact:** Large tenants or many tenants can experience slow queries and excessive read costs; dashboard/task views can degrade for all users.
- **Root cause hypothesis:** Array fields and flexible filters were added without companion indexes or query-specific tables.
- **Proposed fix:** Add scoped indexes/denormalized assignment records where needed and paginate/filter server-side. For tasks, consider a task assignee join table or per-user assignment index.
- **Risk of fix:** Schema changes may require migration planning; some fixes may trigger stop-and-ask.
- **Estimated effort:** L

### Finding B-012: Public email test action logs secret material prefix and PII

- **Severity:** Medium
- **Surface:** Backend
- **Category:** Security
- **Location:** `convex/email/send.ts`:57-65
- **Observed behavior:** `sendTestEmail` logs the first eight characters of `RESEND_API_KEY`, sender, and recipient email address.
- **Expected behavior:** Secrets should never be logged, even partially; PII should be minimized or redacted in logs.
- **Impact:** Logs can expose secret prefixes useful for identification/phishing and leak user email addresses to anyone with log access.
- **Root cause hypothesis:** Debug logging was left in a public test action.
- **Proposed fix:** Remove API key logging and redact email addresses or log only non-sensitive delivery state.
- **Risk of fix:** Low; test email troubleshooting loses one debug line.
- **Estimated effort:** S

### Finding B-013: Public admin migration status query is exposed without auth

- **Severity:** Medium
- **Surface:** Backend
- **Category:** Security | DX
- **Location:** `convex/admin/migrationStatus.ts`:3-56
- **Observed behavior:** `checkMigrationStatus` is exported as a public query from an admin module, has no auth check, reads activities, and returns migration status plus caught error text.
- **Expected behavior:** Admin/migration inspection APIs should require admin role or be internal-only.
- **Impact:** Operational migration metadata may be exposed to public clients.
- **Root cause hypothesis:** Admin utility was added as a public query for convenience.
- **Proposed fix:** Convert to `internalQuery` or add `getCurrentUserOrThrow` plus `role === "admin"` guard.
- **Risk of fix:** Any admin UI using the public query must be updated if internalized.
- **Estimated effort:** S
