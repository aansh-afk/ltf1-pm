# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Fixed

- Fixed `@ltf1/backend` typecheck configuration so it extends the committed base config and checks the package's exported entry points. [R-002]
- Added a mobile ESLint configuration and removed surfaced unused mobile symbols so `@ltf1/mobile` lint runs successfully. [R-003]
- Split mobile local build verification from remote EAS release builds by making `build` run a local Android Expo export and moving EAS to `build:eas`. [R-004]
- Applied `gofmt` to the TUI files reported by the formatting check. [R-008]

### Security

- Replaced base64 "encryption" of BYOK provider keys with AES-256-GCM via a shared `convex/lib/secrets.ts` helper; old base64 rows continue to round-trip via a legacy decode path so existing keys keep working until rotated. Requires `SECRET_ENCRYPTION_KEY` (base64 32-byte value) in the Convex environment. [B-007]
- Required `task.view` workspace permission in `getTasksByWorkspace`; previously any authenticated user could enumerate task data for any workspace ID. [B-002]
- Restricted `getTasksByUser` to the calling Clerk identity; cross-user task lookups now return an empty list. [B-003]
- Required `workspace.invite` permission in `getPendingInvitations` so invitee emails and inviter metadata only render for authorized workspace members. [B-004]
- Reduced `getUserById` to a public-safe projection (name, email, avatar, bio, GitHub username, lastSeenAt) and required authentication; preferences/role/status/Clerk metadata are no longer exposed. [B-005]
- Authorized AI provider key management by deriving the `user` scope from the Clerk identity and requiring `project.edit` for `project` scope; key update/delete now verifies ownership of the referenced key. [B-006]
- Restricted billing checkout creation to workspace owners and admins via a new internal `callerCanManageBilling` helper. [B-008]
- Removed Resend API key prefix and recipient email logging from `sendTestEmail` and the internal `sendEmail` action. [B-012]
- Gated `admin/migrationStatus.checkMigrationStatus` to platform admins; non-admin and unauthenticated callers now get the no-op shape. [B-013]
- Added `scripts/check-no-secrets.sh` and `docs/security/local-secrets.md` to keep `.env`, `.pem`, `.p8`, and `.key` files out of commits, document local secret handling, and provide rotation guidance. [D-013]

### Performance

- `getMyTasks` and `getTasksByUser` no longer scan the entire tasks table; both walk the caller's workspace memberships and use the `by_workspace` / `by_project` indexes. [B-011]
- `getWorkspaceStats` filters recent activities via the `(workspaceId, timestamp)` composite index instead of pulling the full activity history into memory. [B-011]
- `hasProjectPermission` performs one indexed `(teamId, userId)` probe per assigned team instead of a dynamic OR over the user's full team membership. [B-011]

### Changed

- `deleteWorkspace` now cascades into all workspace-scoped tables (sprints, comments, attachments, time entries, project members/invitations, integrations, billing, skills, custom fields, chat/comms, imports, etc.) and per-task children, instead of deleting only projects/tasks/members/activities/meetings. Missing optional integration tables degrade gracefully with a warning log. [B-010]
- TUI sprint page now calls `tasks/queries:getProjectTasks` instead of the non-existent `tasks:list`. [A-004]
- TUI notifications page and `ltf1 notifications` commands call the documented `notificationQueries:*` paths. [A-005]
- TUI `ltf1 skill list/run/create` calls now match the backend skill contract: `getWorkspaceSkills`, `executeSkill` (taskId required), and `createSkill` with `displayName`/`actions`. [A-006]
- TUI time tracking commands call the single-file `timeEntries:*` module instead of nonexistent `timeEntries/queries|mutations` paths. [A-010]
