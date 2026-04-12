// Email templates for LTF1 notifications
// All templates return HTML strings with inline styles for email client compatibility

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://ltf1.vercel.app";

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#050505;font-family:'Inter',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#050505;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#0A0A0A;border:2px solid #2E2E35;max-width:600px;width:100%;">
  <tr><td style="padding:32px 40px 24px;border-bottom:1px solid #1F1F23;">
    <span style="font-family:'IBM Plex Mono',monospace;font-size:20px;font-weight:700;color:#6366F1;letter-spacing:-0.5px;">LTF1</span>
  </td></tr>
  <tr><td style="padding:32px 40px;">
    ${content}
  </td></tr>
  <tr><td style="padding:24px 40px;border-top:1px solid #1F1F23;">
    <p style="margin:0;font-size:12px;color:#6B7280;line-height:1.5;">
      You're receiving this because you have email notifications enabled.<br>
      <a href="${BASE_URL}/settings" style="color:#6366F1;text-decoration:none;">Manage notification preferences</a>
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function button(text: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;">
<tr><td style="background-color:#6366F1;border-radius:8px;padding:12px 24px;">
  <a href="${url}" style="color:#F9FAFB;text-decoration:none;font-size:14px;font-weight:600;font-family:'Inter',Arial,sans-serif;">${text}</a>
</td></tr>
</table>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#F9FAFB;line-height:1.3;">${text}</h1>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:14px;color:#9CA3AF;line-height:1.6;">${text}</p>`;
}

function metaRow(label: string, value: string): string {
  return `<tr>
<td style="padding:8px 12px;font-size:12px;color:#6B7280;font-family:'IBM Plex Mono',monospace;border-bottom:1px solid #1F1F23;width:120px;">${label}</td>
<td style="padding:8px 12px;font-size:13px;color:#F9FAFB;border-bottom:1px solid #1F1F23;">${value}</td>
</tr>`;
}

function metaTable(rows: Array<{ label: string; value: string }>): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#111111;border:1px solid #2E2E35;margin:16px 0;">
${rows.map((r) => metaRow(r.label, r.value)).join("")}
</table>`;
}

// ─── Workspace Emails ────────────────────────────────────────

export function workspaceInvitation(params: {
  inviterName: string;
  workspaceName: string;
  role: string;
  inviteeEmail: string;
  workspaceId?: string;
}): { subject: string; html: string } {
  const signupUrl = params.workspaceId
    ? `${BASE_URL}/sign-up?invite=${encodeURIComponent(params.inviteeEmail)}&workspace=${params.workspaceId}`
    : `${BASE_URL}/sign-up`;
  return {
    subject: `You've been invited to ${params.workspaceName}`,
    html: layout(
      heading(`Join ${params.workspaceName}`) +
        paragraph(
          `<strong style="color:#F9FAFB;">${params.inviterName}</strong> invited you to join their workspace as a <strong style="color:#F9FAFB;">${params.role}</strong>.`
        ) +
        metaTable([
          { label: "Workspace", value: params.workspaceName },
          { label: "Role", value: params.role },
          { label: "Invited as", value: params.inviteeEmail },
        ]) +
        button("Accept Invitation", signupUrl)
    ),
  };
}

export function memberRoleChanged(params: {
  workspaceName: string;
  changedByName: string;
  newRole: string;
}): { subject: string; html: string } {
  return {
    subject: `Your role was updated in ${params.workspaceName}`,
    html: layout(
      heading("Role Updated") +
        paragraph(
          `<strong style="color:#F9FAFB;">${params.changedByName}</strong> changed your role in <strong style="color:#F9FAFB;">${params.workspaceName}</strong>.`
        ) +
        metaTable([
          { label: "Workspace", value: params.workspaceName },
          { label: "New role", value: params.newRole },
          { label: "Changed by", value: params.changedByName },
        ]) +
        button("Open Workspace", `${BASE_URL}/dashboard`)
    ),
  };
}

export function memberRemoved(params: {
  workspaceName: string;
  removedByName: string;
}): { subject: string; html: string } {
  return {
    subject: `You've been removed from ${params.workspaceName}`,
    html: layout(
      heading("Removed from Workspace") +
        paragraph(
          `<strong style="color:#F9FAFB;">${params.removedByName}</strong> removed you from <strong style="color:#F9FAFB;">${params.workspaceName}</strong>.`
        ) +
        paragraph(
          "If you believe this was a mistake, please contact your workspace administrator."
        )
    ),
  };
}

// ─── Task Emails ─────────────────────────────────────────────

export function taskAssigned(params: {
  assignerName: string;
  taskTitle: string;
  projectName: string;
  taskKey: string;
  priority: string;
  workspaceSlug: string;
  projectKey: string;
}): { subject: string; html: string } {
  const priorityColor: Record<string, string> = {
    urgent: "#EF4444",
    high: "#F59E0B",
    medium: "#6366F1",
    low: "#22C55E",
  };
  return {
    subject: `[${params.taskKey}] You've been assigned: ${params.taskTitle}`,
    html: layout(
      heading("Task Assigned to You") +
        paragraph(
          `<strong style="color:#F9FAFB;">${params.assignerName}</strong> assigned you to a task.`
        ) +
        metaTable([
          { label: "Task", value: params.taskTitle },
          { label: "Key", value: params.taskKey },
          { label: "Project", value: params.projectName },
          {
            label: "Priority",
            value: `<span style="color:${priorityColor[params.priority] || "#6366F1"};">${params.priority}</span>`,
          },
        ]) +
        button("View Task", `${BASE_URL}/dashboard`)
    ),
  };
}

export function taskUnassigned(params: {
  taskTitle: string;
  taskKey: string;
  removedByName: string;
}): { subject: string; html: string } {
  return {
    subject: `[${params.taskKey}] You've been unassigned: ${params.taskTitle}`,
    html: layout(
      heading("Task Unassigned") +
        paragraph(
          `<strong style="color:#F9FAFB;">${params.removedByName}</strong> removed you from task <strong style="color:#F9FAFB;">${params.taskTitle}</strong> (${params.taskKey}).`
        )
    ),
  };
}

export function taskCompleted(params: {
  completedByName: string;
  taskTitle: string;
  taskKey: string;
  projectName: string;
}): { subject: string; html: string } {
  return {
    subject: `[${params.taskKey}] Completed: ${params.taskTitle}`,
    html: layout(
      heading("Task Completed &#10003;") +
        paragraph(
          `<strong style="color:#F9FAFB;">${params.completedByName}</strong> marked <strong style="color:#F9FAFB;">${params.taskTitle}</strong> as done.`
        ) +
        metaTable([
          { label: "Task", value: params.taskTitle },
          { label: "Key", value: params.taskKey },
          { label: "Project", value: params.projectName },
          {
            label: "Status",
            value: '<span style="color:#22C55E;">Done</span>',
          },
        ])
    ),
  };
}

export function taskStatusChanged(params: {
  changedByName: string;
  taskTitle: string;
  taskKey: string;
  oldStatus: string;
  newStatus: string;
}): { subject: string; html: string } {
  return {
    subject: `[${params.taskKey}] Status changed: ${params.oldStatus} → ${params.newStatus}`,
    html: layout(
      heading("Task Status Updated") +
        paragraph(
          `<strong style="color:#F9FAFB;">${params.changedByName}</strong> updated the status of <strong style="color:#F9FAFB;">${params.taskTitle}</strong>.`
        ) +
        metaTable([
          { label: "Task", value: `${params.taskKey} — ${params.taskTitle}` },
          { label: "From", value: params.oldStatus.replace(/_/g, " ") },
          { label: "To", value: params.newStatus.replace(/_/g, " ") },
        ])
    ),
  };
}

// ─── Comment Emails ──────────────────────────────────────────

export function commentAdded(params: {
  commenterName: string;
  taskTitle: string;
  taskKey: string;
  commentPreview: string;
}): { subject: string; html: string } {
  const preview =
    params.commentPreview.length > 200
      ? params.commentPreview.slice(0, 200) + "..."
      : params.commentPreview;
  return {
    subject: `[${params.taskKey}] New comment on: ${params.taskTitle}`,
    html: layout(
      heading("New Comment") +
        paragraph(
          `<strong style="color:#F9FAFB;">${params.commenterName}</strong> commented on <strong style="color:#F9FAFB;">${params.taskTitle}</strong> (${params.taskKey}).`
        ) +
        `<div style="background-color:#111111;border-left:3px solid #6366F1;padding:16px;margin:16px 0;">
  <p style="margin:0;font-size:14px;color:#9CA3AF;line-height:1.6;white-space:pre-wrap;">${preview}</p>
</div>` +
        button("View Comment", `${BASE_URL}/dashboard`)
    ),
  };
}

// ─── Meeting Emails ──────────────────────────────────────────

export function meetingScheduled(params: {
  organizerName: string;
  meetingTitle: string;
  meetingType: string;
  startTime: string;
  endTime: string;
  location?: string;
  meetingUrl?: string;
}): { subject: string; html: string } {
  const rows: Array<{ label: string; value: string }> = [
    { label: "Meeting", value: params.meetingTitle },
    { label: "Type", value: params.meetingType },
    { label: "When", value: `${params.startTime} — ${params.endTime}` },
    { label: "Organizer", value: params.organizerName },
  ];
  if (params.location) rows.push({ label: "Location", value: params.location });
  if (params.meetingUrl)
    rows.push({
      label: "Link",
      value: `<a href="${params.meetingUrl}" style="color:#6366F1;">${params.meetingUrl}</a>`,
    });

  return {
    subject: `Meeting: ${params.meetingTitle} — ${params.startTime}`,
    html: layout(
      heading("Meeting Scheduled") +
        paragraph(
          `<strong style="color:#F9FAFB;">${params.organizerName}</strong> scheduled a meeting.`
        ) +
        metaTable(rows) +
        button("View Meeting", `${BASE_URL}/dashboard`)
    ),
  };
}

export function meetingUpdated(params: {
  organizerName: string;
  meetingTitle: string;
  changes: string;
}): { subject: string; html: string } {
  return {
    subject: `Meeting updated: ${params.meetingTitle}`,
    html: layout(
      heading("Meeting Updated") +
        paragraph(
          `<strong style="color:#F9FAFB;">${params.organizerName}</strong> updated the meeting <strong style="color:#F9FAFB;">${params.meetingTitle}</strong>.`
        ) +
        paragraph(`Changes: ${params.changes}`) +
        button("View Meeting", `${BASE_URL}/dashboard`)
    ),
  };
}

export function meetingCancelled(params: {
  organizerName: string;
  meetingTitle: string;
  startTime: string;
}): { subject: string; html: string } {
  return {
    subject: `Meeting cancelled: ${params.meetingTitle}`,
    html: layout(
      heading("Meeting Cancelled") +
        paragraph(
          `<strong style="color:#F9FAFB;">${params.organizerName}</strong> cancelled the meeting <strong style="color:#F9FAFB;">${params.meetingTitle}</strong> (${params.startTime}).`
        )
    ),
  };
}

// ─── Sprint Emails ───────────────────────────────────────────

export function sprintStarted(params: {
  sprintName: string;
  projectName: string;
  startDate: string;
  endDate: string;
  goal?: string;
  startedByName: string;
}): { subject: string; html: string } {
  const rows: Array<{ label: string; value: string }> = [
    { label: "Sprint", value: params.sprintName },
    { label: "Project", value: params.projectName },
    { label: "Duration", value: `${params.startDate} — ${params.endDate}` },
    { label: "Started by", value: params.startedByName },
  ];
  if (params.goal) rows.push({ label: "Goal", value: params.goal });

  return {
    subject: `Sprint started: ${params.sprintName}`,
    html: layout(
      heading("Sprint Started") +
        paragraph(
          `<strong style="color:#F9FAFB;">${params.startedByName}</strong> started a new sprint in <strong style="color:#F9FAFB;">${params.projectName}</strong>.`
        ) +
        metaTable(rows) +
        button("View Sprint", `${BASE_URL}/dashboard`)
    ),
  };
}

export function sprintCompleted(params: {
  sprintName: string;
  projectName: string;
  completedByName: string;
}): { subject: string; html: string } {
  return {
    subject: `Sprint completed: ${params.sprintName}`,
    html: layout(
      heading("Sprint Completed &#10003;") +
        paragraph(
          `<strong style="color:#F9FAFB;">${params.completedByName}</strong> completed sprint <strong style="color:#F9FAFB;">${params.sprintName}</strong> in <strong style="color:#F9FAFB;">${params.projectName}</strong>.`
        ) +
        button("View Sprint Summary", `${BASE_URL}/dashboard`)
    ),
  };
}

// ─── Due Date / Overdue Emails ───────────────────────────────

export function taskDueReminder(params: {
  taskTitle: string;
  taskKey: string;
  projectName: string;
  dueDate: string;
  daysLeft: number;
}): { subject: string; html: string } {
  const urgency =
    params.daysLeft <= 1
      ? '<span style="color:#EF4444;">Due tomorrow</span>'
      : `Due in ${params.daysLeft} days`;
  return {
    subject: `[${params.taskKey}] Due ${params.daysLeft <= 1 ? "tomorrow" : `in ${params.daysLeft} days`}: ${params.taskTitle}`,
    html: layout(
      heading("Due Date Reminder") +
        paragraph(`A task assigned to you is coming up.`) +
        metaTable([
          { label: "Task", value: `${params.taskKey} — ${params.taskTitle}` },
          { label: "Project", value: params.projectName },
          { label: "Due date", value: params.dueDate },
          { label: "Status", value: urgency },
        ]) +
        button("View Task", `${BASE_URL}/dashboard`)
    ),
  };
}

export function taskOverdue(params: {
  taskTitle: string;
  taskKey: string;
  projectName: string;
  dueDate: string;
  daysOverdue: number;
}): { subject: string; html: string } {
  return {
    subject: `[${params.taskKey}] OVERDUE (${params.daysOverdue}d): ${params.taskTitle}`,
    html: layout(
      heading('<span style="color:#EF4444;">Task Overdue</span>') +
        paragraph(`A task assigned to you is past its due date.`) +
        metaTable([
          { label: "Task", value: `${params.taskKey} — ${params.taskTitle}` },
          { label: "Project", value: params.projectName },
          { label: "Due date", value: params.dueDate },
          {
            label: "Overdue",
            value: `<span style="color:#EF4444;">${params.daysOverdue} day${params.daysOverdue === 1 ? "" : "s"}</span>`,
          },
        ]) +
        button("View Task", `${BASE_URL}/dashboard`)
    ),
  };
}

// ─── Meeting Reminder Emails ─────────────────────────────────

export function meetingReminder(params: {
  meetingTitle: string;
  meetingType: string;
  startTime: string;
  meetingUrl?: string;
  minutesUntil: number;
}): { subject: string; html: string } {
  const timeLabel = params.minutesUntil >= 60
    ? `${Math.round(params.minutesUntil / 60)}h`
    : `${params.minutesUntil}min`;
  return {
    subject: `Reminder: ${params.meetingTitle} in ${timeLabel}`,
    html: layout(
      heading(`Meeting in ${timeLabel}`) +
        paragraph(
          `Your meeting <strong style="color:#F9FAFB;">${params.meetingTitle}</strong> starts soon.`
        ) +
        metaTable([
          { label: "Meeting", value: params.meetingTitle },
          { label: "Type", value: params.meetingType },
          { label: "Starts at", value: params.startTime },
          ...(params.meetingUrl
            ? [{ label: "Link", value: `<a href="${params.meetingUrl}" style="color:#6366F1;">${params.meetingUrl}</a>` }]
            : []),
        ]) +
        (params.meetingUrl
          ? button("Join Meeting", params.meetingUrl)
          : button("View Meeting", `${BASE_URL}/dashboard`))
    ),
  };
}

// ─── Priority Escalation ──────────────────────────────────────

export function priorityEscalated(params: {
  taskTitle: string;
  taskKey: string;
  projectName: string;
  oldPriority: string;
  newPriority: string;
  changedByName: string;
}): { subject: string; html: string } {
  return {
    subject: `[${params.taskKey}] Priority escalated to ${params.newPriority.toUpperCase()}: ${params.taskTitle}`,
    html: layout(
      heading('<span style="color:#EF4444;">Priority Escalated</span>') +
        paragraph(
          `<strong style="color:#F9FAFB;">${params.changedByName}</strong> escalated the priority of a task assigned to you.`
        ) +
        metaTable([
          { label: "Task", value: `${params.taskKey} — ${params.taskTitle}` },
          { label: "Project", value: params.projectName },
          { label: "Was", value: params.oldPriority },
          { label: "Now", value: `<span style="color:#EF4444;font-weight:700;">${params.newPriority.toUpperCase()}</span>` },
        ]) +
        button("View Task", `${BASE_URL}/dashboard`)
    ),
  };
}

// ─── Sprint Ending Soon ───────────────────────────────────────

export function sprintEndingSoon(params: {
  sprintName: string;
  projectName: string;
  endDate: string;
  daysRemaining: number;
  completedTasks: number;
  totalTasks: number;
}): { subject: string; html: string } {
  const pct = params.totalTasks > 0
    ? Math.round((params.completedTasks / params.totalTasks) * 100)
    : 0;
  return {
    subject: `Sprint "${params.sprintName}" ends in ${params.daysRemaining} day${params.daysRemaining === 1 ? "" : "s"}`,
    html: layout(
      heading("Sprint Ending Soon") +
        paragraph(
          `Sprint <strong style="color:#F9FAFB;">${params.sprintName}</strong> in <strong style="color:#F9FAFB;">${params.projectName}</strong> ends on ${params.endDate}.`
        ) +
        metaTable([
          { label: "Sprint", value: params.sprintName },
          { label: "Ends", value: `${params.endDate} (${params.daysRemaining}d remaining)` },
          { label: "Progress", value: `${params.completedTasks}/${params.totalTasks} tasks (${pct}%)` },
        ]) +
        button("View Sprint", `${BASE_URL}/dashboard`)
    ),
  };
}

// ─── Project Membership ───────────────────────────────────────

export function projectAdded(params: {
  projectName: string;
  addedByName: string;
  role?: string;
}): { subject: string; html: string } {
  return {
    subject: `You've been added to ${params.projectName}`,
    html: layout(
      heading("Added to Project") +
        paragraph(
          `<strong style="color:#F9FAFB;">${params.addedByName}</strong> added you to <strong style="color:#F9FAFB;">${params.projectName}</strong>${params.role ? ` as ${params.role}` : ""}.`
        ) +
        button("View Project", `${BASE_URL}/dashboard`)
    ),
  };
}

export function projectRemoved(params: {
  projectName: string;
  removedByName: string;
}): { subject: string; html: string } {
  return {
    subject: `You've been removed from ${params.projectName}`,
    html: layout(
      heading("Removed from Project") +
        paragraph(
          `<strong style="color:#F9FAFB;">${params.removedByName}</strong> removed you from <strong style="color:#F9FAFB;">${params.projectName}</strong>.`
        ) +
        paragraph("You will no longer receive notifications for this project.")
    ),
  };
}

// ─── GitHub / PR Notifications ────────────────────────────────

export function prMerged(params: {
  prTitle: string;
  prNumber: number;
  repoName: string;
  mergedByName: string;
  taskTitle?: string;
  taskKey?: string;
}): { subject: string; html: string } {
  return {
    subject: `PR #${params.prNumber} merged: ${params.prTitle}`,
    html: layout(
      heading("Pull Request Merged") +
        paragraph(
          `<strong style="color:#F9FAFB;">${params.mergedByName}</strong> merged a pull request in <strong style="color:#F9FAFB;">${params.repoName}</strong>.`
        ) +
        metaTable([
          { label: "PR", value: `#${params.prNumber} — ${params.prTitle}` },
          { label: "Repo", value: params.repoName },
          ...(params.taskTitle
            ? [{ label: "Linked task", value: `${params.taskKey || ""} ${params.taskTitle}` }]
            : []),
        ]) +
        button("View Details", `${BASE_URL}/dashboard`)
    ),
  };
}

export function prReviewRequested(params: {
  prTitle: string;
  prNumber: number;
  repoName: string;
  requestedByName: string;
  prUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `Review requested: PR #${params.prNumber} — ${params.prTitle}`,
    html: layout(
      heading("Review Requested") +
        paragraph(
          `<strong style="color:#F9FAFB;">${params.requestedByName}</strong> requested your review on a pull request.`
        ) +
        metaTable([
          { label: "PR", value: `#${params.prNumber} — ${params.prTitle}` },
          { label: "Repo", value: params.repoName },
        ]) +
        button("Review PR", params.prUrl)
    ),
  };
}

// ─── AI / Agent Notifications ─────────────────────────────────

export function agentTriageReady(params: {
  projectName: string;
  suggestionCount: number;
}): { subject: string; html: string } {
  return {
    subject: `${params.suggestionCount} triage suggestion${params.suggestionCount === 1 ? "" : "s"} ready for ${params.projectName}`,
    html: layout(
      heading("Triage Suggestions Ready") +
        paragraph(
          `The AI agent has analyzed new tasks in <strong style="color:#F9FAFB;">${params.projectName}</strong> and generated <strong style="color:#F9FAFB;">${params.suggestionCount}</strong> suggestion${params.suggestionCount === 1 ? "" : "s"} for review.`
        ) +
        button("Review Triage Queue", `${BASE_URL}/triage`)
    ),
  };
}

export function aiInsightCritical(params: {
  projectName: string;
  insightTitle: string;
  severity: string;
  description: string;
}): { subject: string; html: string } {
  return {
    subject: `[${params.severity.toUpperCase()}] AI Insight: ${params.insightTitle}`,
    html: layout(
      heading(`<span style="color:#EF4444;">AI Insight — ${params.severity.toUpperCase()}</span>`) +
        paragraph(
          `An AI-generated insight requires attention in <strong style="color:#F9FAFB;">${params.projectName}</strong>.`
        ) +
        metaTable([
          { label: "Insight", value: params.insightTitle },
          { label: "Severity", value: `<span style="color:#EF4444;">${params.severity}</span>` },
          { label: "Details", value: params.description },
        ]) +
        button("View Insights", `${BASE_URL}/dashboard`)
    ),
  };
}
