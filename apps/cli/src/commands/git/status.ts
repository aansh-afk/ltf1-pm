/**
 * Git status command - Shows comprehensive git integration status
 *
 * Usage:
 *   ltf git status            - Show full git integration status
 *   ltf git status --brief    - Show brief status
 */

import { Command } from 'commander';
import { getAuthenticatedClient, query } from '../../lib/convex.js';
import output from '../../lib/output.js';
import { getContext, hasProjectContext, getGitHooksConfig } from '../../lib/config.js';
import { requireAuth } from '../../lib/auth.js';
import {
  isGitRepo,
  getCurrentBranch,
  parseTaskFromBranch,
  getRemoteUrl,
  parseRemoteUrl,
  areHooksInstalled,
  hasUncommittedChanges,
  getRecentCommits,
  getLatestCommitHash,
} from '../../lib/git.js';

interface StatusOptions {
  brief?: boolean;
  json?: boolean;
}

interface TaskData {
  _id: string;
  number: number;
  title: string;
  status: string;
}

interface PullRequestData {
  _id: string;
  number: number;
  title: string;
  state: string;
  url: string;
}

interface CommitData {
  _id: string;
  sha: string;
  message: string;
  author: { name: string };
}

interface ProjectData {
  _id: string;
  key: string;
  name: string;
  repository?: {
    url?: string;
    name?: string;
    owner?: string;
  };
}

/**
 * Show git integration status
 */
async function showGitStatus(options: StatusOptions): Promise<void> {
  // Check git repository first (doesn't require auth)
  const inGitRepo = await isGitRepo();
  if (!inGitRepo) {
    output.error('Not in a git repository', 'Run this command from within a git repository');
    process.exit(1);
  }

  // Gather local git info (doesn't require auth)
  const currentBranch = await getCurrentBranch();
  const remoteUrl = await getRemoteUrl();
  const repoInfo = remoteUrl ? parseRemoteUrl(remoteUrl) : null;
  const hooksInstalled = await areHooksInstalled();
  const hooksConfig = getGitHooksConfig();
  const uncommittedChanges = await hasUncommittedChanges();
  const latestCommit = await getLatestCommitHash();

  if (options.brief) {
    // Brief output
    output.keyValue([
      ['Branch', currentBranch || 'Unknown'],
      ['Hooks', hooksInstalled ? 'Installed' : 'Not installed'],
      ['Changes', uncommittedChanges ? 'Uncommitted changes' : 'Clean'],
    ]);
    return;
  }

  // Full status requires authentication
  requireAuth();

  const spin = output.spinner('Loading git status...');

  try {
    let linkedTask: TaskData | null = null;
    let project: ProjectData | null = null;
    let linkedPRs: PullRequestData[] = [];
    let linkedCommits: CommitData[] = [];

    // Get project context for task linking
    if (hasProjectContext()) {
      const context = getContext();
      if (context?.projectId && context?.projectKey) {
        const client = getAuthenticatedClient();

        // Get project details
        project = await query<ProjectData | null>(
          client,
          'projects/queries:getProject',
          { projectId: context.projectId }
        );

        // Try to find linked task from branch name
        if (currentBranch) {
          const parsed = parseTaskFromBranch(currentBranch, context.projectKey);
          if (parsed) {
            spin.text = `Looking up task ${context.projectKey}-${parsed.number}...`;

            const tasks = await query<TaskData[]>(
              client,
              'tasks/queries:getProjectTasks',
              { projectId: context.projectId }
            );

            linkedTask = tasks.find(t => t.number === parsed.number) || null;

            // Get linked PRs and commits if task found
            if (linkedTask) {
              try {
                linkedPRs = await query<PullRequestData[]>(
                  client,
                  'integrations/github/queries:getTaskPullRequests',
                  { taskId: linkedTask._id }
                );
              } catch {
                // PR query may fail if not configured
              }

              try {
                linkedCommits = await query<CommitData[]>(
                  client,
                  'integrations/github/queries:getTaskCommits',
                  { taskId: linkedTask._id }
                );
              } catch {
                // Commit query may fail if not configured
              }
            }
          }
        }
      }
    }

    spin.stop();

    // Output status
    if (options.json) {
      output.json({
        branch: currentBranch,
        repository: repoInfo,
        hooks: {
          installed: hooksInstalled,
          installedAt: hooksConfig?.installedAt,
        },
        task: linkedTask ? {
          key: project?.key ? `${project.key}-${linkedTask.number}` : linkedTask.number,
          title: linkedTask.title,
          status: linkedTask.status,
        } : null,
        project: project ? {
          key: project.key,
          name: project.name,
          repository: project.repository,
        } : null,
        uncommittedChanges,
        latestCommit,
        linkedPRs: linkedPRs.length,
        linkedCommits: linkedCommits.length,
      });
      return;
    }

    output.header('Git Integration Status');

    // Branch info
    output.keyValue([
      ['Current branch', output.colors.primary(currentBranch || 'Unknown')],
      ['Uncommitted changes', uncommittedChanges ? output.colors.warning('Yes') : output.colors.success('No')],
      ['Latest commit', latestCommit ? latestCommit.substring(0, 8) : 'Unknown'],
    ]);

    // Repository info
    if (repoInfo) {
      output.newline();
      output.info('Repository');
      output.keyValue([
        ['Name', `${repoInfo.owner}/${repoInfo.repo}`],
        ['Provider', repoInfo.provider],
        ['URL', remoteUrl || 'Unknown'],
      ]);
    }

    // Project info
    if (project) {
      output.newline();
      output.info('Project');
      output.keyValue([
        ['Key', project.key],
        ['Name', project.name],
      ]);

      if (project.repository?.url) {
        output.keyValue([
          ['Linked repo', project.repository.url.replace('https://github.com/', '')],
        ]);
      }
    }

    // Linked task info
    output.newline();
    if (linkedTask && project) {
      output.info('Linked Task');
      output.keyValue([
        ['Task', output.formatTaskNumber(project.key, linkedTask.number)],
        ['Title', linkedTask.title],
        ['Status', output.formatStatus(linkedTask.status)],
      ]);

      if (linkedPRs.length > 0) {
        output.newline();
        output.info(`Pull Requests (${linkedPRs.length})`);
        for (const pr of linkedPRs.slice(0, 3)) {
          output.log(`  ${output.icons.git} PR #${pr.number}: ${pr.title} (${pr.state})`);
        }
        if (linkedPRs.length > 3) {
          output.log(output.colors.muted(`  ... and ${linkedPRs.length - 3} more`));
        }
      }

      if (linkedCommits.length > 0) {
        output.newline();
        output.info(`Recent Commits (${linkedCommits.length})`);
        for (const commit of linkedCommits.slice(0, 3)) {
          const shortSha = commit.sha.substring(0, 7);
          const shortMessage = commit.message.split('\n')[0].substring(0, 50);
          output.log(`  ${output.colors.muted(shortSha)} ${shortMessage}`);
        }
        if (linkedCommits.length > 3) {
          output.log(output.colors.muted(`  ... and ${linkedCommits.length - 3} more`));
        }
      }
    } else {
      output.warning('No linked task detected');
      output.log(output.colors.muted('  Use a branch name like feature/PROJ-123 or run `ltf git link --task <number>`'));
    }

    // Hooks status
    output.newline();
    output.info('Git Hooks');
    output.keyValue([
      ['Status', hooksInstalled
        ? output.colors.success('Installed')
        : output.colors.warning('Not installed')
      ],
    ]);

    if (hooksConfig?.installedAt) {
      output.keyValue([
        ['Installed at', new Date(hooksConfig.installedAt).toLocaleString()],
      ]);
    }

    if (!hooksInstalled) {
      output.newline();
      output.log(output.colors.muted('  Run `ltf git hooks install` to enable automatic task updates'));
    }

    // Recent local commits
    output.newline();
    output.info('Recent Commits');
    const recentCommits = await getRecentCommits(5);
    if (recentCommits.length > 0) {
      for (const commit of recentCommits) {
        const shortSha = commit.hash.substring(0, 7);
        const shortMessage = commit.message.split('\n')[0].substring(0, 50);
        output.log(`  ${output.colors.muted(shortSha)} ${shortMessage}`);
      }
    } else {
      output.log(output.colors.muted('  No commits found'));
    }

  } catch (err) {
    spin.fail('Failed to load status');
    const error = err as Error;
    output.error(error.message);
    process.exit(1);
  }
}

/**
 * Register the status command
 */
export function registerStatusCommand(parent: Command): void {
  parent
    .command('status')
    .description('Show git integration status')
    .option('-b, --brief', 'Show brief status')
    .option('--json', 'Output in JSON format')
    .action(async (options: StatusOptions) => {
      await showGitStatus(options);
    });
}

export default registerStatusCommand;
