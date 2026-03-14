/**
 * Git hook handler - Internal command called by git hooks
 *
 * This command is invoked automatically by git hooks installed via `ltf git hooks install`
 * It runs silently in the background and should not block git operations.
 *
 * Usage (called by git hooks, not directly by users):
 *   ltf git hook post-commit
 *   ltf git hook post-checkout <prev-ref> <new-ref> <branch-flag>
 *   ltf git hook pre-push <remote> <url>
 *   ltf git hook post-merge <squash-flag>
 */

import { Command } from 'commander';
import { getAuthenticatedClient, query, mutation } from '../../lib/convex.js';
import { getContext, hasProjectContext, isAuthenticated } from '../../lib/config.js';
import {
  getCurrentBranch,
  parseTaskFromBranch,
  parseTasksFromCommit,
  getRecentCommits,
  isGitRepo,
  parseConventionalCommit,
  conventionalTypeToLabel,
  validateBranchName,
  DEFAULT_BRANCH_PATTERN,
} from '../../lib/git.js';

interface TaskData {
  _id: string;
  number: number;
  title: string;
  status: string;
}

/**
 * Silently handle errors - hooks should never block git operations
 */
function silentExit(code = 0): never {
  process.exit(code);
}

/**
 * Check if we should process hooks
 */
async function shouldProcessHooks(): Promise<boolean> {
  // Don't process if not authenticated
  if (!isAuthenticated()) {
    return false;
  }

  // Don't process if no project context
  if (!hasProjectContext()) {
    return false;
  }

  // Don't process if not in a git repo
  const inRepo = await isGitRepo();
  if (!inRepo) {
    return false;
  }

  return true;
}

/**
 * Handle post-commit hook
 * - Parse commit message for task references
 * - Update task status if needed
 */
async function handlePostCommit(): Promise<void> {
  if (!(await shouldProcessHooks())) {
    silentExit(0);
  }

  try {
    const context = getContext();
    if (!context?.projectId || !context?.projectKey) {
      silentExit(0);
    }

    const client = getAuthenticatedClient();

    // Get the latest commit
    const commits = await getRecentCommits(1);
    if (commits.length === 0) {
      silentExit(0);
    }

    const latestCommit = commits[0];

    // Parse conventional commit format
    const conventional = parseConventionalCommit(latestCommit.message);
    if (conventional) {
      const label = conventionalTypeToLabel(conventional.type);
      const scopeStr = conventional.scope ? `(${conventional.scope})` : '';
      const breakingStr = conventional.breaking ? ' [BREAKING]' : '';
      console.log(`[LTF] Conventional commit: ${conventional.type}${scopeStr}${breakingStr} — ${label}`);
    }

    // Parse task references from commit message
    const taskRefs = parseTasksFromCommit(latestCommit.message, context.projectKey);
    if (taskRefs.length === 0) {
      // Also check branch name
      const branch = await getCurrentBranch();
      if (branch) {
        const branchTask = parseTaskFromBranch(branch, context.projectKey);
        if (branchTask) {
          taskRefs.push(branchTask);
        }
      }
    }

    if (taskRefs.length === 0) {
      silentExit(0);
    }

    // Get tasks
    const tasks = await query<TaskData[]>(
      client,
      'tasks/queries:getProjectTasks',
      { projectId: context.projectId }
    );

    // Check for status keywords in commit message
    const completesTask = /(?:closes?|fixes?|resolves?|completes?)\s+/i.test(latestCommit.message);
    const startsTask = /(?:starts?|begins?|working\s+on)\s+/i.test(latestCommit.message);

    // Build mutation extras from conventional commit data
    const commitMeta: Record<string, string> = {};
    if (conventional) {
      commitMeta.commitType = conventional.type;
      if (conventional.scope) {
        commitMeta.commitScope = conventional.scope;
      }
      if (conventional.breaking) {
        commitMeta.commitBreaking = 'true';
      }
    }

    // Update task status based on commit message
    for (const ref of taskRefs) {
      const task = tasks.find(t => t.number === ref.number);
      if (!task) continue;

      let newStatus: string | null = null;

      if (completesTask && task.status !== 'done') {
        newStatus = 'done';
      } else if (startsTask && task.status === 'backlog') {
        newStatus = 'in_progress';
      } else if (task.status === 'backlog' || task.status === 'todo') {
        // Auto-transition to in_progress on any commit
        newStatus = 'in_progress';
      }

      if (newStatus && newStatus !== task.status) {
        try {
          await mutation(
            client,
            'tasks/mutations:updateTask',
            {
              taskId: task._id,
              status: newStatus,
              ...commitMeta,
            }
          );

          // Output minimal info (visible in terminal if user is watching)
          const typeTag = conventional ? ` [${conventional.type}]` : '';
          console.log(`[LTF] Task ${context.projectKey}-${task.number}: ${task.status} -> ${newStatus}${typeTag}`);
        } catch (err) {
          console.error(`[LTF] Hook error: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    silentExit(0);
  } catch (err) {
    console.error(`[LTF] Hook error: ${err instanceof Error ? err.message : String(err)}`);
    silentExit(0);
  }
}

/**
 * Handle post-checkout hook
 * - Detect task from new branch name
 * - Show task info to user
 */
async function handlePostCheckout(_prevRef?: string, _newRef?: string, branchFlag?: string): Promise<void> {
  // Only process branch checkouts (flag = 1), not file checkouts
  if (branchFlag !== '1') {
    silentExit(0);
  }

  if (!(await shouldProcessHooks())) {
    silentExit(0);
  }

  try {
    const context = getContext();
    if (!context?.projectId || !context?.projectKey) {
      silentExit(0);
    }

    const client = getAuthenticatedClient();

    // Get current branch
    const branch = await getCurrentBranch();
    if (!branch) {
      silentExit(0);
    }

    // Parse task from branch name
    const taskRef = parseTaskFromBranch(branch, context.projectKey);
    if (!taskRef) {
      silentExit(0);
    }

    // Get the task
    const tasks = await query<TaskData[]>(
      client,
      'tasks/queries:getProjectTasks',
      { projectId: context.projectId }
    );

    const task = tasks.find(t => t.number === taskRef.number);
    if (!task) {
      silentExit(0);
    }

    // Show task info
    console.log(`\n[LTF] Branch linked to: ${context.projectKey}-${task.number}`);
    console.log(`      ${task.title}`);
    console.log(`      Status: ${task.status}`);
    console.log('');

    silentExit(0);
  } catch (err) {
    console.error(`[LTF] Hook error: ${err instanceof Error ? err.message : String(err)}`);
    silentExit(0);
  }
}

/**
 * Handle pre-push hook
 * - Validate that linked tasks exist
 * - Optionally warn about incomplete tasks
 */
async function handlePrePush(_remote?: string, _url?: string): Promise<void> {
  if (!(await shouldProcessHooks())) {
    silentExit(0);
  }

  try {
    const context = getContext();
    if (!context?.projectId || !context?.projectKey) {
      silentExit(0);
    }

    const client = getAuthenticatedClient();

    // Get current branch
    const branch = await getCurrentBranch();
    if (!branch) {
      silentExit(0);
    }

    // Validate branch name against configured pattern (warn only, never block)
    const skipBranches = ['main', 'master', 'develop', 'staging', 'production'];
    if (!skipBranches.includes(branch)) {
      // Use configured pattern or default
      const branchPattern = DEFAULT_BRANCH_PATTERN;
      const validation = validateBranchName(branch, branchPattern);
      if (!validation.valid) {
        console.log(`\n[LTF] Warning: Branch '${branch}' doesn't match project pattern '${validation.pattern}'`);
        console.log(`      Expected format: (feature|fix|hotfix|bugfix|chore|refactor|release|docs)/PROJ-123-description`);
        console.log('');
      }
    }

    // Parse task from branch name
    const taskRef = parseTaskFromBranch(branch, context.projectKey);
    if (!taskRef) {
      // No task reference in branch - that's okay, just continue
      silentExit(0);
    }

    // Get the task to verify it exists
    const tasks = await query<TaskData[]>(
      client,
      'tasks/queries:getProjectTasks',
      { projectId: context.projectId }
    );

    const task = tasks.find(t => t.number === taskRef.number);
    if (!task) {
      // Task not found - warn but don't block
      console.log(`\n[LTF] Warning: Task ${context.projectKey}-${taskRef.number} not found`);
      console.log(`      Branch "${branch}" references a non-existent task`);
      console.log('');
    }

    // Always allow push - we don't want to block workflow
    silentExit(0);
  } catch (err) {
    console.error(`[LTF] Hook error: ${err instanceof Error ? err.message : String(err)}`);
    silentExit(0);
  }
}

/**
 * Handle post-merge hook
 * - Sync any status changes
 * - Update task status if merge completes work
 */
async function handlePostMerge(_squashFlag?: string): Promise<void> {
  if (!(await shouldProcessHooks())) {
    silentExit(0);
  }

  try {
    const context = getContext();
    if (!context?.projectId || !context?.projectKey) {
      silentExit(0);
    }

    const client = getAuthenticatedClient();

    // Get current branch (the branch we merged into)
    const branch = await getCurrentBranch();
    if (!branch) {
      silentExit(0);
    }

    // Check if this is a merge to main/master (could complete tasks)
    const isMainBranch = ['main', 'master', 'develop'].includes(branch);

    if (isMainBranch) {
      // Get recent commits to find merged task references
      const commits = await getRecentCommits(10);

      const taskNumbers = new Set<number>();
      for (const commit of commits) {
        const refs = parseTasksFromCommit(commit.message, context.projectKey);
        for (const ref of refs) {
          taskNumbers.add(ref.number);
        }
      }

      if (taskNumbers.size > 0) {
        // Get tasks
        const tasks = await query<TaskData[]>(
          client,
          'tasks/queries:getProjectTasks',
          { projectId: context.projectId }
        );

        // Check for tasks that should be completed
        for (const taskNum of taskNumbers) {
          const task = tasks.find(t => t.number === taskNum);
          if (task && task.status === 'in_review') {
            // Auto-complete tasks in review that were merged
            try {
              await mutation(
                client,
                'tasks/mutations:updateTask',
                {
                  taskId: task._id,
                  status: 'done',
                }
              );

              console.log(`[LTF] Task ${context.projectKey}-${task.number}: in_review -> done (merged)`);
            } catch (err) {
              console.error(`[LTF] Hook error: ${err instanceof Error ? err.message : String(err)}`);
            }
          }
        }
      }
    }

    silentExit(0);
  } catch (err) {
    console.error(`[LTF] Hook error: ${err instanceof Error ? err.message : String(err)}`);
    silentExit(0);
  }
}

/**
 * Register the hook handler command (internal use)
 */
export function registerHookHandlerCommand(parent: Command): void {
  const hookCmd = parent
    .command('hook')
    .description('Internal command called by git hooks')
    .argument('<type>', 'Hook type (post-commit, post-checkout, pre-push, post-merge)')
    .argument('[args...]', 'Hook arguments')
    .action(async (type: string, args: string[]) => {
      // Run hooks silently - errors should not block git
      switch (type) {
        case 'post-commit':
          await handlePostCommit();
          break;

        case 'post-checkout':
          await handlePostCheckout(args[0], args[1], args[2]);
          break;

        case 'pre-push':
          await handlePrePush(args[0], args[1]);
          break;

        case 'post-merge':
          await handlePostMerge(args[0]);
          break;

        default:
          // Unknown hook type - silently ignore
          silentExit(0);
      }
    });

  // Hide this command from help (it's internal)
  hookCmd.configureHelp({
    showGlobalOptions: false,
  });
}

export default registerHookHandlerCommand;
