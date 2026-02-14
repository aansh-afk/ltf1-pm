/**
 * Task list command
 * Lists tasks with various filter options
 */

import { Command } from 'commander';
import { requireAuth } from '../../lib/auth.js';
import { getAuthenticatedClient, query } from '../../lib/convex.js';
import { getContext, hasProjectContext } from '../../lib/config.js';
import output from '../../lib/output.js';
import { getErrorMessage } from '../../lib/errors.js';

// Task status type
type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

interface TaskWithDetails {
  _id: string;
  number: number;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: string;
  assignees?: Array<{ name?: string; email: string }>;
  assignee?: { name?: string; email: string } | null;
  labels: string[];
  dueDate?: number;
  estimate?: { points?: number; hours?: number };
  subtaskCount?: number;
  commentCount?: number;
}

interface ListOptions {
  status?: string;
  priority?: string;
  assignee?: string;
  type?: string;
  all?: boolean;
  json?: boolean;
  quiet?: boolean;
  idsOnly?: boolean;
}

export function listTasksCommand(program: Command): void {
  program
    .command('list')
    .alias('ls')
    .description('List tasks in the current project')
    .option('-s, --status <status>', 'Filter by status (backlog,todo,in_progress,in_review,done,cancelled)')
    .option('-p, --priority <priority>', 'Filter by priority (urgent,high,medium,low)')
    .option('-a, --assignee <user>', 'Filter by assignee (use "me" for yourself, or user ID)')
    .option('-t, --type <type>', 'Filter by type (feature,bug,improvement,task,epic)')
    .option('--all', 'Show all tasks including done/cancelled')
    .option('--json', 'Output as JSON')
    .option('--quiet', 'Compact output without headers')
    .option('--ids-only', 'Output only task IDs (for piping)')
    .action(async (options: ListOptions) => {
      requireAuth();

      const context = getContext();
      if (!hasProjectContext()) {
        output.error('No project selected', 'Run `ltf project select` to select a project');
        process.exit(1);
      }

      const spin = output.spinner('Fetching tasks...');

      try {
        const client = getAuthenticatedClient();

        // Parse status filter
        let statusFilter: string[] | undefined;
        if (options.status) {
          statusFilter = options.status.split(',').map(s => s.trim());
        } else if (!options.all) {
          // By default, exclude done and cancelled
          statusFilter = ['backlog', 'todo', 'in_progress', 'in_review'];
        }

        // Build query args
        const queryArgs: Record<string, unknown> = {
          projectId: context?.projectId,
        };

        if (statusFilter) {
          queryArgs.status = statusFilter;
        }

        // Fetch tasks
        const tasks = await query<TaskWithDetails[]>(
          client,
          'tasks/queries:getProjectTasks',
          queryArgs
        );

        spin.stop();

        // Apply client-side filters that aren't supported by the backend
        let filteredTasks = tasks;

        if (options.priority) {
          const priorities = options.priority.split(',').map(p => p.trim());
          filteredTasks = filteredTasks.filter(task => priorities.includes(task.priority));
        }

        if (options.type) {
          const types = options.type.split(',').map(t => t.trim());
          filteredTasks = filteredTasks.filter(task => types.includes(task.type));
        }

        if (options.json) {
          output.json(filteredTasks);
          return;
        }

        if (options.idsOnly) {
          for (const task of filteredTasks) {
            console.log(task._id);
          }
          return;
        }

        if (options.quiet) {
          for (const task of filteredTasks) {
            const projectKey = context?.projectKey || 'PROJ';
            console.log(`${projectKey}-${task.number}\t${task.status}\t${task.title}`);
          }
          return;
        }

        if (filteredTasks.length === 0) {
          output.info('No tasks found matching the criteria');
          return;
        }

        // Display header with project context
        output.header(`Tasks in ${context?.projectName || context?.projectKey}`);

        // Display tasks in a table
        output.table(filteredTasks as unknown as Record<string, unknown>[], [
          {
            header: 'ID',
            key: 'number',
            width: 12,
            formatter: (value) => output.formatTaskNumber(context?.projectKey || 'PROJ', value as number),
          },
          {
            header: 'Title',
            key: 'title',
            width: 40,
            formatter: (value) => {
              const title = String(value || '');
              return title.length > 37 ? title.substring(0, 37) + '...' : title;
            },
          },
          {
            header: 'Status',
            key: 'status',
            width: 14,
            formatter: (value) => output.formatStatus(String(value)),
          },
          {
            header: 'Priority',
            key: 'priority',
            width: 10,
            formatter: (value) => output.formatPriority(String(value)),
          },
          {
            header: 'Type',
            key: 'type',
            width: 12,
            formatter: (value) => output.formatType(String(value)),
          },
          {
            header: 'Assignee',
            key: 'assignees',
            width: 20,
            formatter: (value) => {
              const assignees = value as TaskWithDetails['assignees'];
              if (!assignees || assignees.length === 0) return output.colors.muted('unassigned');
              if (assignees.length === 1) {
                return assignees[0].name || assignees[0].email.split('@')[0];
              }
              return `${assignees[0].name || assignees[0].email.split('@')[0]} +${assignees.length - 1}`;
            },
          },
        ]);

        // Summary
        output.newline();
        const statusCounts = filteredTasks.reduce((acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const summaryParts: string[] = [];
        for (const [status, count] of Object.entries(statusCounts)) {
          summaryParts.push(`${output.formatStatus(status)}: ${count}`);
        }
        output.log(output.colors.muted(`Total: ${filteredTasks.length} tasks | ${summaryParts.join(' | ')}`));

      } catch (err) {
        spin.stop();
        output.error('Failed to fetch tasks', getErrorMessage(err));
        process.exit(1);
      }
    });
}
