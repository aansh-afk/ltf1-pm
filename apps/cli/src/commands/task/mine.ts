/**
 * Task mine command
 * Lists tasks assigned to the current user
 */

import { Command } from 'commander';
import { requireAuth } from '../../lib/auth.js';
import { getAuthenticatedClient, query } from '../../lib/convex.js';
import { getContext, hasProjectContext } from '../../lib/config.js';
import output from '../../lib/output.js';
import { getErrorMessage } from '../../lib/errors.js';
import { normalizeStatus, isValidStatus } from './utils.js';

type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';

interface TaskWithDetails {
  _id: string;
  number: number;
  title: string;
  status: TaskStatus;
  priority: string;
  type: string;
  assignees?: Array<{ name?: string; email: string }>;
  labels: string[];
  dueDate?: number;
  estimate?: { points?: number; hours?: number };
  projectKey?: string;
}

interface MineOptions {
  status?: string;
  json?: boolean;
}

export function myTasksCommand(program: Command): void {
  program
    .command('mine')
    .alias('my')
    .description('List tasks assigned to you')
    .option('-s, --status <status>', 'Filter by status (backlog,todo,in_progress,in_review,done,cancelled)')
    .option('--json', 'Output as JSON')
    .action(async (options: MineOptions) => {
      requireAuth();

      if (!hasProjectContext()) {
        output.error('No project selected', 'Run `ltf project select` to select a project');
        process.exit(1);
      }

      const context = getContext();
      const spin = output.spinner('Fetching your tasks...');

      try {
        const client = getAuthenticatedClient();

        const tasks = await query<TaskWithDetails[]>(
          client,
          'tasks/queries:getMyTasks',
          {}
        );

        spin.stop();

        // Apply status filter
        let filteredTasks = tasks;
        if (options.status) {
          const normalized = normalizeStatus(options.status);
          if (!isValidStatus(normalized)) {
            output.error(`Invalid status: ${options.status}`, 'Valid statuses: backlog, todo, in_progress, in_review, done, cancelled');
            process.exit(1);
          }
          filteredTasks = filteredTasks.filter(t => t.status === normalized);
        }

        if (options.json) {
          output.json(filteredTasks);
          return;
        }

        if (filteredTasks.length === 0) {
          output.info('No tasks assigned to you');
          output.log(output.colors.muted('  Assign a task to yourself: ltf task assign <id> --to me'));
          return;
        }

        output.header(`My Tasks`);

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
        output.error('Failed to fetch your tasks', getErrorMessage(err));
        process.exit(1);
      }
    });
}
