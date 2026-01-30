/**
 * Task create command
 * Creates a new task in the current project
 */

import { Command } from 'commander';
import { requireAuth } from '../../lib/auth.js';
import { getAuthenticatedClient, mutation } from '../../lib/convex.js';
import { getContext, hasProjectContext } from '../../lib/config.js';
import output from '../../lib/output.js';
import { getErrorMessage } from '../../lib/errors.js';

type TaskType = 'feature' | 'bug' | 'improvement' | 'task' | 'epic';
type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

interface CreateOptions {
  description?: string;
  type?: TaskType;
  priority?: TaskPriority;
  labels?: string;
  estimate?: string;
  dueDate?: string;
  json?: boolean;
}

// Unused - mutation returns task ID directly
// interface CreateTaskResult { _id: string; number: number; }

const VALID_TYPES: TaskType[] = ['feature', 'bug', 'improvement', 'task', 'epic'];
const VALID_PRIORITIES: TaskPriority[] = ['urgent', 'high', 'medium', 'low'];

export function createTaskCommand(program: Command): void {
  program
    .command('create <title>')
    .alias('new')
    .alias('add')
    .description('Create a new task')
    .option('-d, --description <text>', 'Task description')
    .option('-t, --type <type>', 'Task type (feature, bug, improvement, task, epic)', 'task')
    .option('-p, --priority <priority>', 'Priority (urgent, high, medium, low)', 'medium')
    .option('-l, --labels <labels>', 'Comma-separated labels')
    .option('-e, --estimate <points>', 'Story points estimate')
    .option('--due-date <date>', 'Due date (YYYY-MM-DD format)')
    .option('--json', 'Output as JSON')
    .action(async (title: string, options: CreateOptions) => {
      requireAuth();

      const context = getContext();
      if (!hasProjectContext()) {
        output.error('No project selected', 'Run `ltf project select` to select a project');
        process.exit(1);
      }

      // Validate type
      const taskType = (options.type || 'task') as TaskType;
      if (!VALID_TYPES.includes(taskType)) {
        output.error(`Invalid task type: ${options.type}`, `Valid types: ${VALID_TYPES.join(', ')}`);
        process.exit(1);
      }

      // Validate priority
      const taskPriority = (options.priority || 'medium') as TaskPriority;
      if (!VALID_PRIORITIES.includes(taskPriority)) {
        output.error(`Invalid priority: ${options.priority}`, `Valid priorities: ${VALID_PRIORITIES.join(', ')}`);
        process.exit(1);
      }

      // Parse labels
      const labels = options.labels ? options.labels.split(',').map(l => l.trim()).filter(Boolean) : [];

      // Parse estimate
      let estimate: { points?: number; hours?: number } | undefined;
      if (options.estimate) {
        const points = parseInt(options.estimate, 10);
        if (!isNaN(points) && points > 0) {
          estimate = { points };
        }
      }

      // Parse due date
      let dueDate: number | undefined;
      if (options.dueDate) {
        const parsed = new Date(options.dueDate);
        if (isNaN(parsed.getTime())) {
          output.error('Invalid due date format', 'Use YYYY-MM-DD format (e.g., 2024-03-15)');
          process.exit(1);
        }
        dueDate = parsed.getTime();
      }

      const spin = output.spinner('Creating task...');

      try {
        const client = getAuthenticatedClient();

        const taskId = await mutation<string>(
          client,
          'tasks/mutations:createTask',
          {
            projectId: context?.projectId,
            title,
            description: options.description,
            type: taskType,
            priority: taskPriority,
            labels,
            estimate,
            dueDate,
          }
        );

        spin.stop();

        // Fetch the created task to get the number
        // Since we just created it, we can assume it was successful
        // The mutation returns the task ID

        if (options.json) {
          output.json({ taskId, title, type: taskType, priority: taskPriority });
          return;
        }

        output.success(`Task created successfully`);
        output.newline();
        output.keyValue([
          ['Task ID', taskId],
          ['Title', title],
          ['Type', output.formatType(taskType)],
          ['Priority', output.formatPriority(taskPriority)],
          ['Status', output.formatStatus('backlog')],
        ]);

        if (labels.length > 0) {
          output.log(`  ${output.colors.muted('Labels'.padEnd(12))}  ${labels.join(', ')}`);
        }
        if (estimate?.points) {
          output.log(`  ${output.colors.muted('Estimate'.padEnd(12))}  ${estimate.points} points`);
        }
        if (dueDate) {
          output.log(`  ${output.colors.muted('Due Date'.padEnd(12))}  ${new Date(dueDate).toLocaleDateString()}`);
        }

        output.newline();
        output.log(output.colors.muted(`View task: ltf task view ${taskId}`));

      } catch (err) {
        spin.stop();
        output.error('Failed to create task', getErrorMessage(err));
        process.exit(1);
      }
    });
}
