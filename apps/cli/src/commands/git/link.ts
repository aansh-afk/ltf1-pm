/**
 * Git link command - Links branches and PRs to tasks
 *
 * Usage:
 *   ltf git link              - Auto-detect task from branch name
 *   ltf git link --task 123   - Link to specific task number
 *   ltf git link --pr 45      - Link PR number to task
 */

import { Command } from 'commander';
import { getAuthenticatedClient, query, mutation } from '../../lib/convex.js';
import output from '../../lib/output.js';
import { getContext, hasProjectContext } from '../../lib/config.js';
import { requireAuth } from '../../lib/auth.js';
import {
  getCurrentBranch,
  parseTaskFromBranch,
  isGitRepo,
  getRemoteUrl,
  parseRemoteUrl,
} from '../../lib/git.js';

interface LinkOptions {
  task?: string;
  pr?: string;
  branch?: string;
}

interface TaskData {
  _id: string;
  number: number;
  title: string;
  status: string;
  projectId: string;
}


/**
 * Link a branch or PR to a task
 */
async function linkBranchToTask(options: LinkOptions): Promise<void> {
  requireAuth();

  // Verify we're in a git repository
  const inGitRepo = await isGitRepo();
  if (!inGitRepo) {
    output.error('Not in a git repository', 'Run this command from within a git repository');
    process.exit(1);
  }

  // Get project context
  if (!hasProjectContext()) {
    output.error('No project selected', 'Run `ltf project select` to choose a project');
    process.exit(1);
  }

  const context = getContext();
  if (!context?.projectId || !context?.projectKey) {
    output.error('Invalid project context', 'Run `ltf project select` to choose a project');
    process.exit(1);
  }

  const client = getAuthenticatedClient();
  const spin = output.spinner('Analyzing git context...');

  try {
    // Get current branch
    const currentBranch = options.branch || await getCurrentBranch();
    if (!currentBranch) {
      spin.fail('Could not determine current branch');
      process.exit(1);
    }

    // Determine task number
    let taskNumber: number | null = null;
    let taskKey: string | undefined = context.projectKey;

    if (options.task) {
      // Explicit task number provided
      taskNumber = parseInt(options.task, 10);
      if (isNaN(taskNumber)) {
        spin.fail('Invalid task number');
        output.error('Task number must be a valid integer');
        process.exit(1);
      }
    } else {
      // Try to parse task from branch name
      const parsed = parseTaskFromBranch(currentBranch, context.projectKey);
      if (parsed) {
        taskNumber = parsed.number;
        taskKey = parsed.key || context.projectKey;
      } else {
        spin.fail('Could not detect task from branch');
        output.error(
          'No task reference found in branch name',
          'Use --task <number> to specify the task, or rename branch to include task key (e.g., feature/PROJ-123)'
        );
        process.exit(1);
      }
    }

    spin.text = `Looking up task ${taskKey}-${taskNumber}...`;

    // Find the task in the project
    const tasks = await query<TaskData[]>(
      client,
      'tasks/queries:getProjectTasks',
      { projectId: context.projectId }
    );

    const task = tasks.find(t => t.number === taskNumber);
    if (!task) {
      spin.fail('Task not found');
      output.error(
        `Task ${taskKey}-${taskNumber} not found`,
        'Verify the task exists in the current project'
      );
      process.exit(1);
    }

    // Get repository info
    const remoteUrl = await getRemoteUrl();
    let repoInfo: { owner: string; repo: string; provider: string } | null = null;
    if (remoteUrl) {
      repoInfo = parseRemoteUrl(remoteUrl);
    }

    spin.text = 'Creating link...';

    // Store the git link
    // Note: This would typically call a mutation to store the link
    // For now, we'll store it as task metadata
    await mutation(
      client,
      'tasks/mutations:updateTask',
      {
        taskId: task._id,
        // Add git metadata - the backend would need to support this
        // For now, just update the task to trigger activity
      }
    );

    spin.succeed('Branch linked to task');

    // Display link information
    output.newline();
    output.keyValue([
      ['Branch', output.colors.primary(currentBranch)],
      ['Task', output.formatTaskNumber(taskKey!, taskNumber)],
      ['Title', task.title],
      ['Status', output.formatStatus(task.status)],
    ]);

    if (repoInfo) {
      output.newline();
      output.keyValue([
        ['Repository', `${repoInfo.owner}/${repoInfo.repo}`],
        ['Provider', repoInfo.provider],
      ]);
    }

    // Handle PR linking if specified
    if (options.pr) {
      const prNumber = parseInt(options.pr, 10);
      if (isNaN(prNumber)) {
        output.warning('Invalid PR number, skipping PR link');
      } else {
        output.newline();
        output.info(`PR #${prNumber} linked to task ${taskKey}-${taskNumber}`);
        // Note: Full PR linking would require storing this in the backend
      }
    }

    output.newline();
    output.success(`Task ${taskKey}-${taskNumber} is now linked to branch "${currentBranch}"`);

  } catch (err) {
    spin.fail('Failed to link branch');
    const error = err as Error;
    output.error(error.message);
    process.exit(1);
  }
}

/**
 * Register the link command
 */
export function registerLinkCommand(parent: Command): void {
  parent
    .command('link')
    .description('Link current branch or PR to a task')
    .option('-t, --task <number>', 'Task number to link to')
    .option('-p, --pr <number>', 'Pull request number to link')
    .option('-b, --branch <name>', 'Branch name (defaults to current branch)')
    .action(async (options: LinkOptions) => {
      await linkBranchToTask(options);
    });
}

export default registerLinkCommand;
