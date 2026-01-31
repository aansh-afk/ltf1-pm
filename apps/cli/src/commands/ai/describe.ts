/**
 * AI Describe Command
 * Generates detailed task description from brief input
 */

import output from '../../lib/output.js';
import { getAuthenticatedClient, action, mutation } from '../../lib/convex.js';
import { requireAuth } from '../../lib/auth.js';
import { getContext, hasProjectContext } from '../../lib/config.js';
import readline from 'node:readline';
import { getErrorMessage } from '../../lib/errors.js';

interface DescribeOptions {
  create?: boolean;
  json?: boolean;
}

interface TaskDetails {
  title: string;
  points: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  labels: string[];
  type?: 'feature' | 'bug' | 'improvement' | 'task';
  description?: string;
}

/**
 * Generate detailed task from brief description
 */
export async function describeCommand(
  brief: string,
  options: DescribeOptions
): Promise<void> {
  requireAuth();

  // Check for project context
  if (!hasProjectContext()) {
    output.error('No project selected', 'Run `ltf project select` first');
    process.exit(1);
  }

  const context = getContext();
  const projectId = context?.projectId;

  if (!projectId) {
    output.error('No project selected', 'Run `ltf project select` first');
    process.exit(1);
  }

  if (!brief || brief.trim().length === 0) {
    output.error('Brief description required', 'Provide a brief description of the task');
    process.exit(1);
  }

  const spin = output.spinner('Generating task details with AI...');

  try {
    const client = getAuthenticatedClient();

    // Call the AI action to generate task details
    const details = await action<TaskDetails>(
      client,
      'ai/actions:generateTaskDetails',
      { description: brief }
    );

    spin.stop();

    if (options.json) {
      output.json(details);
      return;
    }

    // Display generated details
    output.newline();
    output.box(
      `${output.colors.highlight('Title:')} ${details.title}\n\n` +
      `${output.colors.highlight('Type:')} ${formatType(details.type || 'task')}\n` +
      `${output.colors.highlight('Priority:')} ${formatPriority(details.priority)}\n` +
      `${output.colors.highlight('Estimate:')} ${details.points} points\n` +
      `${output.colors.highlight('Labels:')} ${details.labels.length > 0 ? details.labels.join(', ') : 'none'}`,
      `${output.icons.ai} AI Generated Task`
    );

    if (details.description) {
      output.newline();
      output.log(output.colors.highlight('DESCRIPTION'));
      output.log(output.colors.muted(details.description));
    }

    // If --create flag is passed, create the task
    if (options.create) {
      const confirmed = await confirmCreate();

      if (confirmed) {
        await createTask(client, projectId, details);
      } else {
        output.info('Task creation cancelled');
      }
    } else {
      output.newline();
      output.info('Use --create flag to create this task, or copy the details above');
      output.log(output.colors.muted(`  ltf ai describe "${brief}" --create`));
    }

  } catch (err) {
    spin.stop();
    output.error('Failed to generate task details', getErrorMessage(err));
    process.exit(1);
  }
}

/**
 * Format task type with color
 */
function formatType(type: string): string {
  const colors: Record<string, (text: string) => string> = {
    feature: output.colors.success,
    bug: output.colors.error,
    improvement: output.colors.info,
    task: output.colors.muted,
  };
  const color = colors[type] || output.colors.muted;
  return color(type.toUpperCase());
}

/**
 * Format priority with color
 */
function formatPriority(priority: string): string {
  const colors: Record<string, (text: string) => string> = {
    urgent: output.colors.error,
    high: output.colors.warning,
    medium: output.colors.primary,
    low: output.colors.muted,
  };
  const color = colors[priority] || output.colors.muted;
  return color(priority);
}

/**
 * Prompt user to confirm task creation
 */
async function confirmCreate(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    output.newline();
    rl.question(
      `${output.colors.primary('?')} Create this task? (y/N) `,
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      }
    );
  });
}

/**
 * Create the task in the backend
 */
async function createTask(
  client: ReturnType<typeof getAuthenticatedClient>,
  projectId: string,
  details: TaskDetails
): Promise<void> {
  const spin = output.spinner('Creating task...');

  try {
    const result = await mutation<{ _id: string; number: number }>(
      client,
      'tasks/mutations:createTask',
      {
        projectId,
        title: details.title,
        description: details.description || '',
        type: details.type || 'task',
        priority: details.priority,
        estimate: details.points > 0 ? { points: details.points } : undefined,
        labels: details.labels,
      }
    );

    spin.stop();

    const context = getContext();
    const taskKey = context?.projectKey
      ? `${context.projectKey}-${result.number}`
      : `#${result.number}`;

    output.success(`Task created: ${output.colors.primary(taskKey)}`);
    output.log(output.colors.muted(`  ${details.title}`));

  } catch (err) {
    spin.stop();
    output.error('Failed to create task', getErrorMessage(err));
  }
}
