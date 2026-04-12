"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
// @ts-ignore — deep type instantiation
import { internal } from "../_generated/api";
import {
  taskAssigned,
  taskUnassigned,
  taskCompleted,
  taskStatusChanged,
  commentAdded,
  sprintStarted,
  sprintCompleted,
  taskDueReminder,
  taskOverdue,
  workspaceInvitation,
  memberRoleChanged,
  memberRemoved,
  meetingScheduled,
  meetingUpdated,
  meetingCancelled,
  meetingReminder,
  priorityEscalated,
  sprintEndingSoon,
  projectAdded,
  projectRemoved,
  prMerged,
  prReviewRequested,
  agentTriageReady,
  aiInsightCritical,
} from "../email/templates";

// ─── Notification types and their channel defaults ───────────────────

type NotificationType =
  // Tasks
  | "task_assigned"
  | "task_unassigned"
  | "task_completed"
  | "task_status_changed"
  | "task_comment"
  | "task_mention"
  | "task_comment_reply"
  | "task_due_reminder"
  | "task_overdue"
  | "task_priority_escalated"
  | "task_deleted"
  // Sprints
  | "sprint_started"
  | "sprint_completed"
  | "sprint_ending_soon"
  // Meetings
  | "meeting_scheduled"
  | "meeting_updated"
  | "meeting_cancelled"
  | "meeting_reminder"
  | "meeting_notes_shared"
  // Workspace & Team
  | "member_joined"
  | "member_role_changed"
  | "member_removed"
  | "workspace_invitation"
  | "project_added"
  | "project_removed"
  // GitHub / PRs
  | "pr_merged"
  | "pr_review_requested"
  // AI / Agent
  | "agent_triage"
  | "ai_insight_critical"
  | "ai_insight_recommendation";

// Which channels each notification type should use by default
const CHANNEL_DEFAULTS: Record<
  NotificationType,
  { email: boolean; push: boolean }
> = {
  // ── Tasks ──────────────────────────────
  task_assigned:          { email: true,  push: true },
  task_unassigned:        { email: true,  push: false },
  task_completed:         { email: true,  push: false },
  task_status_changed:    { email: false, push: false },
  task_comment:           { email: false, push: false },
  task_mention:           { email: true,  push: true },
  task_comment_reply:     { email: true,  push: false },
  task_due_reminder:      { email: true,  push: true },
  task_overdue:           { email: true,  push: false },
  task_priority_escalated:{ email: true,  push: false },
  task_deleted:           { email: false, push: false },
  // ── Sprints ────────────────────────────
  sprint_started:         { email: true,  push: false },
  sprint_completed:       { email: false, push: false },
  sprint_ending_soon:     { email: true,  push: false },
  // ── Meetings ───────────────────────────
  meeting_scheduled:      { email: true,  push: true },
  meeting_updated:        { email: true,  push: false },
  meeting_cancelled:      { email: true,  push: true },
  meeting_reminder:       { email: false, push: true },
  meeting_notes_shared:   { email: false, push: false },
  // ── Workspace & Team ───────────────────
  member_joined:          { email: false, push: false },
  member_role_changed:    { email: true,  push: false },
  member_removed:         { email: true,  push: false },
  workspace_invitation:   { email: true,  push: false },
  project_added:          { email: true,  push: false },
  project_removed:        { email: true,  push: false },
  // ── GitHub / PRs ───────────────────────
  pr_merged:              { email: true,  push: false },
  pr_review_requested:    { email: true,  push: true },
  // ── AI / Agent ─────────────────────────
  agent_triage:           { email: true,  push: false },
  ai_insight_critical:    { email: true,  push: false },
  ai_insight_recommendation: { email: false, push: false },
};

// ─── Centralized dispatch ────────────────────────────────────────────

export const dispatch = internalAction({
  args: {
    recipientUserId: v.id("users"),
    workspaceId: v.id("workspaces"),
    type: v.string(),
    title: v.string(),
    body: v.string(),
    link: v.optional(v.string()),
    actorId: v.optional(v.id("users")),
    entityId: v.optional(v.string()),
    entityType: v.optional(v.string()),
    // Email-specific context (for template rendering)
    emailData: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const notificationType = args.type as NotificationType;
    const defaults = CHANNEL_DEFAULTS[notificationType] || {
      email: false,
      push: false,
    };

    // 1. Always create in-app notification
    // Use the existing createNotification mutation (supports the known type union)
    // All types supported by createNotification
    const validTypes = Object.keys(CHANNEL_DEFAULTS);
    if (validTypes.includes(notificationType)) {
      await ctx.runMutation(internal.notificationQueries.createNotification, {
        userId: args.recipientUserId,
        workspaceId: args.workspaceId,
        type: notificationType as any,
        title: args.title,
        body: args.body,
        link: args.link,
        actorId: args.actorId,
        entityId: args.entityId,
        entityType: args.entityType,
      });
    }

    // 2. Check user preferences
    const user: any = await ctx.runQuery(
      internal.notifications.dispatch_helpers.getUserPreferences,
      { userId: args.recipientUserId },
    );
    if (!user) return null;

    const prefs = user.preferences?.notifications;
    const typePrefs = prefs?.types || {};

    // Check if this type is explicitly disabled by the user
    const typeKey = notificationType as keyof typeof typePrefs;
    const typeEnabled = typePrefs[typeKey] !== false; // default to true if not set

    // 3. Send email if enabled
    const shouldEmail =
      defaults.email && typeEnabled && (prefs?.email !== false);
    if (shouldEmail && user.email) {
      try {
        const emailContent = buildEmailContent(
          notificationType,
          args.title,
          args.body,
          args.emailData,
        );
        if (emailContent) {
          await ctx.runAction(internal.email.send.sendEmail, {
            to: user.email,
            subject: emailContent.subject,
            html: emailContent.html,
          });
        }
      } catch (e) {
        console.error(`[DISPATCH] Email send failed for ${notificationType}:`, e);
      }
    }

    // 4. Send push notification if enabled
    const shouldPush =
      defaults.push && typeEnabled && (prefs?.push !== false);
    if (shouldPush) {
      try {
        await ctx.runAction(internal.notifications.push.sendPushToUser, {
          userId: args.recipientUserId,
          title: args.title,
          body: args.body,
          link: args.link,
          tag: notificationType,
        });
      } catch (e) {
        console.error(`[DISPATCH] Push send failed for ${notificationType}:`, e);
      }
    }

    return null;
  },
});

// ─── Email template builder ──────────────────────────────────────────

function buildEmailContent(
  type: NotificationType,
  title: string,
  body: string,
  data?: any,
): { subject: string; html: string } | null {
  if (!data) {
    // Fallback: generic email
    return {
      subject: title,
      html: genericEmailTemplate(title, body),
    };
  }

  switch (type) {
    // Tasks
    case "task_assigned":
      return taskAssigned(data);
    case "task_unassigned":
      return taskUnassigned(data);
    case "task_completed":
      return taskCompleted(data);
    case "task_status_changed":
      return taskStatusChanged(data);
    case "task_comment":
    case "task_mention":
    case "task_comment_reply":
      return commentAdded(data);
    case "task_due_reminder":
      return taskDueReminder(data);
    case "task_overdue":
      return taskOverdue(data);
    case "task_priority_escalated":
      return priorityEscalated(data);
    // Sprints
    case "sprint_started":
      return sprintStarted(data);
    case "sprint_completed":
      return sprintCompleted(data);
    case "sprint_ending_soon":
      return sprintEndingSoon(data);
    // Meetings
    case "meeting_scheduled":
      return meetingScheduled(data);
    case "meeting_updated":
      return meetingUpdated(data);
    case "meeting_cancelled":
      return meetingCancelled(data);
    case "meeting_reminder":
      return meetingReminder(data);
    // Workspace & Team
    case "member_role_changed":
      return memberRoleChanged(data);
    case "member_removed":
      return memberRemoved(data);
    case "workspace_invitation":
      return workspaceInvitation(data);
    case "project_added":
      return projectAdded(data);
    case "project_removed":
      return projectRemoved(data);
    // GitHub
    case "pr_merged":
      return prMerged(data);
    case "pr_review_requested":
      return prReviewRequested(data);
    // AI / Agent
    case "agent_triage":
      return agentTriageReady(data);
    case "ai_insight_critical":
      return aiInsightCritical(data);
    // Fallback
    default:
      return {
        subject: title,
        html: genericEmailTemplate(title, body),
      };
  }
}

function genericEmailTemplate(title: string, body: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#050505;font-family:'Inter',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#050505;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#0A0A0A;border:2px solid #2E2E35;max-width:600px;width:100%;">
  <tr><td style="padding:32px 40px 24px;border-bottom:1px solid #1F1F23;">
    <span style="font-family:'IBM Plex Mono',monospace;font-size:20px;font-weight:700;color:#6366F1;">LTF1</span>
  </td></tr>
  <tr><td style="padding:32px 40px;">
    <h1 style="margin:0 0 16px;font-size:18px;font-weight:700;color:#F9FAFB;">${title}</h1>
    <p style="margin:0;font-size:14px;color:#9CA3AF;line-height:1.6;">${body}</p>
  </td></tr>
  <tr><td style="padding:24px 40px;border-top:1px solid #1F1F23;">
    <p style="margin:0;font-size:12px;color:#6B7280;">
      <a href="https://ltf1.dev/settings" style="color:#6366F1;text-decoration:none;">Manage notifications</a>
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}
