/**
 * Show current project info
 * Displays detailed information about the currently selected project
 */

import { requireAuth } from '../../lib/auth.js';
import { getAuthenticatedClient, query } from '../../lib/convex.js';
import { getContext, hasProjectContext } from '../../lib/config.js';
import output from '../../lib/output.js';
import { getErrorMessage } from '../../lib/errors.js';

interface User {
  _id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
}

interface Sprint {
  _id: string;
  name: string;
  status: string;
  startDate: number;
  endDate: number;
}

interface Task {
  _id: string;
  status: string;
}

interface Repository {
  provider: string;
  url: string;
  name: string;
  owner: string;
  defaultBranch: string;
  connectedAt: number;
}

interface Project {
  _id: string;
  name: string;
  key: string;
  description?: string;
  status: string;
  visibility: string;
  lead?: User | null;
  members?: Array<User & { projectRole?: string }>;
  tasks?: Task[];
  activeSprint?: Sprint | null;
  repository?: Repository | null;
  settings: {
    taskPrefix: string;
    workflowType: string;
    defaultAssigneeId?: string;
  };
  teamSettings?: {
    maxMembers?: number;
    allowSelfJoin?: boolean;
    requireApproval?: boolean;
  };
  _creationTime: number;
}

interface InfoOptions {
  json?: boolean;
}

export async function showProjectInfo(options: InfoOptions): Promise<void> {
  requireAuth();

  // Check if project context is set
  if (!hasProjectContext()) {
    output.error('No project selected', 'Run `ltf project select` to select a project');
    process.exit(1);
  }

  const context = getContext();
  const spin = output.spinner('Fetching project details...');

  try {
    const client = getAuthenticatedClient();

    const project = await query<Project>(
      client,
      'projects/queries:getProject',
      { projectId: context!.projectId }
    );

    spin.stop();

    if (!project) {
      output.error('Project not found', 'The selected project may have been deleted');
      output.info('Run `ltf project select` to select a different project');
      process.exit(1);
    }

    // JSON output
    if (options.json) {
      output.json(project);
      return;
    }

    // Header
    output.box(
      `${output.colors.primary(project.key)} - ${project.name}\n` +
        (project.description || output.colors.muted('No description')),
      'Project Info'
    );

    // Basic info
    output.header('Details');
    output.keyValue([
      ['Status', formatStatus(project.status)],
      ['Visibility', project.visibility === 'public' ? 'Public' : 'Private'],
      ['Workflow', project.settings.workflowType],
      ['Task Prefix', project.settings.taskPrefix],
      ['Lead', project.lead?.name || output.colors.muted('Unassigned')],
      ['Created', formatDate(project._creationTime)],
    ]);

    // Task statistics
    output.newline();
    output.header('Task Statistics');
    const taskStats = calculateTaskStats(project.tasks || []);
    output.keyValue([
      ['Total Tasks', String(taskStats.total)],
      ['Done', output.colors.success(String(taskStats.done))],
      ['In Progress', output.colors.warning(String(taskStats.inProgress))],
      ['To Do', output.colors.info(String(taskStats.todo))],
      ['Backlog', output.colors.muted(String(taskStats.backlog))],
    ]);

    // Progress bar
    if (taskStats.total > 0) {
      output.newline();
      output.log(`  Progress: ${output.progressBar(taskStats.done, taskStats.total)}`);
    }

    // Active sprint
    if (project.activeSprint) {
      output.newline();
      output.header('Active Sprint');
      output.keyValue([
        ['Name', project.activeSprint.name],
        ['Start', formatDate(project.activeSprint.startDate)],
        ['End', formatDate(project.activeSprint.endDate)],
      ]);
    }

    // Repository
    if (project.repository) {
      output.newline();
      output.header('Repository');
      output.keyValue([
        ['Provider', capitalizeFirst(project.repository.provider)],
        ['Repository', `${project.repository.owner}/${project.repository.name}`],
        ['Default Branch', project.repository.defaultBranch],
        ['URL', output.colors.link(project.repository.url)],
        ['Connected', formatDate(project.repository.connectedAt)],
      ]);
    }

    // Team members
    if (project.members && project.members.length > 0) {
      output.newline();
      output.header('Team Members');
      for (const member of project.members.slice(0, 10)) {
        const role = member.projectRole ? output.colors.muted(` (${member.projectRole})`) : '';
        output.log(`  ${output.icons.user} ${member.name}${role}`);
      }
      if (project.members.length > 10) {
        output.log(output.colors.muted(`  ... and ${project.members.length - 10} more`));
      }
    }

    // Team settings (if available)
    if (project.teamSettings) {
      output.newline();
      output.header('Team Settings');
      output.keyValue([
        ['Max Members', project.teamSettings.maxMembers?.toString() || 'Unlimited'],
        ['Self Join', project.teamSettings.allowSelfJoin ? 'Allowed' : 'Not Allowed'],
        ['Approval Required', project.teamSettings.requireApproval ? 'Yes' : 'No'],
      ]);
    }

    // Quick actions hint
    output.newline();
    output.divider();
    output.log(output.colors.muted('Quick Actions:'));
    output.log(output.colors.muted('  ltf task list       View tasks'));
    output.log(output.colors.muted('  ltf task create     Create a task'));
    output.log(output.colors.muted('  ltf sprint list     View sprints'));
  } catch (error) {
    spin.stop();
    output.error('Failed to fetch project info', getErrorMessage(error));
    process.exit(1);
  }
}

function formatStatus(status: string): string {
  const colors: Record<string, (text: string) => string> = {
    planning: output.colors.info,
    active: output.colors.success,
    on_hold: output.colors.warning,
    completed: output.colors.muted,
    archived: output.colors.muted,
  };
  const formatter = colors[status] || output.colors.muted;
  return formatter(status.replace(/_/g, ' '));
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

interface TaskStats {
  total: number;
  done: number;
  inProgress: number;
  todo: number;
  backlog: number;
}

function calculateTaskStats(tasks: Task[]): TaskStats {
  const stats: TaskStats = {
    total: tasks.length,
    done: 0,
    inProgress: 0,
    todo: 0,
    backlog: 0,
  };

  for (const task of tasks) {
    switch (task.status) {
      case 'done':
        stats.done++;
        break;
      case 'in_progress':
      case 'in_review':
        stats.inProgress++;
        break;
      case 'todo':
        stats.todo++;
        break;
      case 'backlog':
        stats.backlog++;
        break;
    }
  }

  return stats;
}
