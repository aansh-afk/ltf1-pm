/**
 * Task view command
 * Displays detailed information about a specific task
 */

import { Command } from 'commander';
import { requireAuth } from '../../lib/auth.js';
import { getAuthenticatedClient, query } from '../../lib/convex.js';
import { getContext, hasProjectContext } from '../../lib/config.js';
import output from '../../lib/output.js';
import { resolveTaskId } from './utils.js';
import { getErrorMessage } from '../../lib/errors.js';

interface User {
  _id: string;
  name?: string;
  email: string;
}

interface Comment {
  _id: string;
  content: string;
  createdAt: number;
  user?: User;
}

interface Activity {
  _id: string;
  type: string;
  description?: string;
  timestamp?: number;
  user?: User;
}

interface Project {
  _id: string;
  name: string;
  key: string;
}

interface TaskDetails {
  _id: string;
  number: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  type: string;
  assignees?: User[];
  assignee?: User | null;
  reporter?: User;
  labels: string[];
  dueDate?: number;
  startDate?: number;
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
  estimate?: { points?: number; hours?: number };
  timeTracked?: number;
  subtasks?: Array<{ _id: string; title: string; status: string }>;
  comments?: Comment[];
  activities?: Activity[];
  project?: Project;
  git?: {
    branch?: string;
    commits?: string[];
    pullRequestUrl?: string;
    pullRequestStatus?: string;
  };
}

interface ViewOptions {
  json?: boolean;
  comments?: boolean;
  activity?: boolean;
}

export function viewTaskCommand(program: Command): void {
  program
    .command('view <identifier>')
    .alias('show')
    .alias('get')
    .description('View task details (use task number like 123 or PROJ-123, or task ID)')
    .option('--json', 'Output as JSON')
    .option('-c, --comments', 'Show comments')
    .option('-a, --activity', 'Show activity history')
    .action(async (identifier: string, options: ViewOptions) => {
      requireAuth();

      const context = getContext();
      if (!hasProjectContext()) {
        output.error('No project selected', 'Run `ltf project select` to select a project');
        process.exit(1);
      }

      const spin = output.spinner('Fetching task...');

      try {
        const client = getAuthenticatedClient();

        // Resolve task ID from identifier
        const taskId = await resolveTaskId(client, identifier, context);

        if (!taskId) {
          spin.stop();
          output.error('Task not found', `Could not find task: ${identifier}`);
          process.exit(1);
        }

        // Fetch task details
        const task = await query<TaskDetails>(
          client,
          'tasks/queries:getTask',
          { taskId }
        );

        spin.stop();

        if (!task) {
          output.error('Task not found', `Could not find task: ${identifier}`);
          process.exit(1);
        }

        if (options.json) {
          output.json(task);
          return;
        }

        // Display task header
        const projectKey = task.project?.key || context?.projectKey || 'TASK';
        output.newline();
        output.log(
          `${output.formatTaskNumber(projectKey, task.number)} ${output.colors.highlight(task.title)}`
        );
        output.divider();

        // Basic info
        output.newline();
        output.keyValue([
          ['Status', output.formatStatus(task.status)],
          ['Priority', output.formatPriority(task.priority)],
          ['Type', output.formatType(task.type)],
        ]);

        // Assignees
        output.newline();
        const assignees = task.assignees && task.assignees.length > 0
          ? task.assignees
          : task.assignee ? [task.assignee] : [];

        if (assignees.length > 0) {
          const assigneeNames = assignees.map(a => a.name || a.email).join(', ');
          output.log(`  ${output.colors.muted('Assignees'.padEnd(12))}  ${assigneeNames}`);
        } else {
          output.log(`  ${output.colors.muted('Assignees'.padEnd(12))}  ${output.colors.muted('Unassigned')}`);
        }

        if (task.reporter) {
          output.log(`  ${output.colors.muted('Reporter'.padEnd(12))}  ${task.reporter.name || task.reporter.email}`);
        }

        // Labels
        if (task.labels && task.labels.length > 0) {
          output.log(`  ${output.colors.muted('Labels'.padEnd(12))}  ${task.labels.map(l => output.colors.primary(l)).join(', ')}`);
        }

        // Dates
        output.newline();
        output.log(`  ${output.colors.muted('Created'.padEnd(12))}  ${formatDate(task.createdAt)}`);
        output.log(`  ${output.colors.muted('Updated'.padEnd(12))}  ${formatDate(task.updatedAt)}`);

        if (task.dueDate) {
          const isOverdue = task.dueDate < Date.now() && task.status !== 'done' && task.status !== 'cancelled';
          const dueDateStr = formatDate(task.dueDate);
          output.log(`  ${output.colors.muted('Due Date'.padEnd(12))}  ${isOverdue ? output.colors.error(dueDateStr + ' (OVERDUE)') : dueDateStr}`);
        }

        if (task.completedAt) {
          output.log(`  ${output.colors.muted('Completed'.padEnd(12))}  ${formatDate(task.completedAt)}`);
        }

        // Estimate and time tracking
        if (task.estimate?.points || task.estimate?.hours || task.timeTracked) {
          output.newline();
          if (task.estimate?.points) {
            output.log(`  ${output.colors.muted('Estimate'.padEnd(12))}  ${task.estimate.points} points`);
          }
          if (task.estimate?.hours) {
            output.log(`  ${output.colors.muted('Est. Hours'.padEnd(12))}  ${task.estimate.hours}h`);
          }
          if (task.timeTracked) {
            const hours = Math.floor(task.timeTracked / 3600000);
            const minutes = Math.floor((task.timeTracked % 3600000) / 60000);
            output.log(`  ${output.colors.muted('Time Logged'.padEnd(12))}  ${hours}h ${minutes}m`);
          }
        }

        // Description
        if (task.description) {
          output.newline();
          output.header('Description');
          output.log(task.description);
        }

        // Git info
        if (task.git && (task.git.branch || task.git.pullRequestUrl)) {
          output.newline();
          output.header('Git');
          if (task.git.branch) {
            output.log(`  ${output.colors.muted('Branch'.padEnd(12))}  ${output.colors.info(task.git.branch)}`);
          }
          if (task.git.pullRequestUrl) {
            const prStatus = task.git.pullRequestStatus || 'unknown';
            output.log(`  ${output.colors.muted('PR'.padEnd(12))}  ${task.git.pullRequestUrl} (${prStatus})`);
          }
          if (task.git.commits && task.git.commits.length > 0) {
            output.log(`  ${output.colors.muted('Commits'.padEnd(12))}  ${task.git.commits.length} commits`);
          }
        }

        // Subtasks
        if (task.subtasks && task.subtasks.length > 0) {
          output.newline();
          output.header(`Subtasks (${task.subtasks.length})`);
          for (const subtask of task.subtasks) {
            const icon = subtask.status === 'done' ? output.icons.taskDone : output.icons.task;
            output.log(`  ${icon} ${subtask.title} ${output.colors.muted(`[${subtask.status}]`)}`);
          }
        }

        // Comments (if requested)
        if (options.comments && task.comments && task.comments.length > 0) {
          output.newline();
          output.header(`Comments (${task.comments.length})`);
          for (const comment of task.comments.slice(-5)) { // Show last 5 comments
            const author = comment.user?.name || comment.user?.email || 'Unknown';
            output.log(`  ${output.colors.muted(formatDate(comment.createdAt))} ${output.colors.highlight(author)}`);
            output.log(`    ${comment.content}`);
            output.newline();
          }
        }

        // Activity (if requested)
        if (options.activity && task.activities && task.activities.length > 0) {
          output.newline();
          output.header(`Activity (${task.activities.length})`);
          for (const activity of task.activities.slice(-10)) { // Show last 10 activities
            const actor = activity.user?.name || activity.user?.email || 'System';
            const time = activity.timestamp ? formatDate(activity.timestamp) : '';
            output.log(`  ${output.colors.muted(time)} ${actor} ${activity.description || activity.type}`);
          }
        }

        output.newline();

      } catch (err) {
        spin.stop();
        output.error('Failed to fetch task', getErrorMessage(err));
        process.exit(1);
      }
    });
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // Less than 24 hours ago
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    if (hours === 0) {
      const minutes = Math.floor(diff / 60000);
      return minutes <= 1 ? 'just now' : `${minutes}m ago`;
    }
    return `${hours}h ago`;
  }

  // Less than 7 days ago
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
  }

  // Otherwise show full date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
