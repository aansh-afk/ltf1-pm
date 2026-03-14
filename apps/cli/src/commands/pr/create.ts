/**
 * PR create command - Generate and open pull requests linked to tasks
 *
 * Usage:
 *   ltf pr create                        - Auto-detect from branch
 *   ltf pr create --title "My PR"        - Use custom title
 *   ltf pr create --draft                - Create as draft PR
 */

import { Command } from 'commander';
import open from 'open';
import { getAuthenticatedClient, query } from '../../lib/convex.js';
import output from '../../lib/output.js';
import { getErrorMessage } from '../../lib/errors.js';
import { getContext, hasProjectContext } from '../../lib/config.js';
import { requireAuth } from '../../lib/auth.js';
import {
  isGitRepo,
  getCurrentBranch,
  parseTaskFromBranch,
  getRemoteUrl,
  parseRemoteUrl,
  getRecentCommits,
  parseConventionalCommit,
  conventionalTypeToLabel,
} from '../../lib/git.js';

interface CreateOptions {
  title?: string;
  draft?: boolean;
  base?: string;
}

interface TaskData {
  _id: string;
  number: number;
  title: string;
  status: string;
  type?: string;
}

/**
 * Infer PR type from branch prefix or commits
 */
function inferPRType(
  branch: string,
  commits: Array<{ message: string }>
): string {
  // Check branch prefix
  if (branch.startsWith('feature/') || branch.startsWith('feat/')) return 'feat';
  if (branch.startsWith('fix/') || branch.startsWith('bugfix/') || branch.startsWith('hotfix/')) return 'fix';
  if (branch.startsWith('chore/')) return 'chore';
  if (branch.startsWith('refactor/')) return 'refactor';
  if (branch.startsWith('docs/')) return 'docs';

  // Check most common conventional commit type
  const typeCounts: Record<string, number> = {};
  for (const commit of commits) {
    const cc = parseConventionalCommit(commit.message);
    if (cc) {
      typeCounts[cc.type] = (typeCounts[cc.type] || 0) + 1;
    }
  }

  const sortedTypes = Object.entries(typeCounts).sort(([, a], [, b]) => b - a);
  if (sortedTypes.length > 0) {
    return sortedTypes[0][0];
  }

  return 'feat';
}

/**
 * Build commit changelog for PR body
 */
function buildCommitChangelog(
  commits: Array<{ hash: string; message: string; author: string }>
): string {
  if (commits.length === 0) return '_No commits found_';

  const lines: string[] = [];
  for (const commit of commits.slice(0, 20)) {
    const shortHash = commit.hash.substring(0, 7);
    const firstLine = commit.message.split('\n')[0];
    lines.push(`- \`${shortHash}\` ${firstLine}`);
  }

  if (commits.length > 20) {
    lines.push(`- _...and ${commits.length - 20} more commits_`);
  }

  return lines.join('\n');
}

/**
 * Create a pull request
 */
async function createPR(options: CreateOptions): Promise<void> {
  requireAuth();

  // Verify we're in a git repository
  const inGitRepo = await isGitRepo();
  if (!inGitRepo) {
    output.error('Not in a git repository', 'Run this command from within a git repository');
    process.exit(1);
  }

  const spin = output.spinner('Analyzing branch and commits...');

  try {
    // Get current branch
    const branch = await getCurrentBranch();
    if (!branch) {
      spin.fail('Could not determine current branch');
      process.exit(1);
    }

    if (['main', 'master', 'develop'].includes(branch)) {
      spin.fail(`Cannot create PR from ${branch}`);
      output.error('Switch to a feature branch first');
      process.exit(1);
    }

    // Get remote info
    const remoteUrl = await getRemoteUrl();
    if (!remoteUrl) {
      spin.fail('No remote URL configured');
      output.error('Add a remote with: git remote add origin <url>');
      process.exit(1);
    }

    const repoInfo = parseRemoteUrl(remoteUrl);
    if (!repoInfo) {
      spin.fail('Could not parse remote URL');
      process.exit(1);
    }

    // Get recent commits on this branch
    const commits = await getRecentCommits(50);

    // Try to find linked task
    let task: TaskData | null = null;
    let taskKey = '';
    const context = hasProjectContext() ? getContext() : undefined;

    if (context?.projectId && context?.projectKey) {
      const parsed = parseTaskFromBranch(branch, context.projectKey);
      if (parsed) {
        spin.text = `Looking up task ${context.projectKey}-${parsed.number}...`;

        const client = getAuthenticatedClient();
        const tasks = await query<TaskData[]>(
          client,
          'tasks/queries:getProjectTasks',
          { projectId: context.projectId }
        );

        task = tasks.find(t => t.number === parsed.number) || null;
        taskKey = `${context.projectKey}-${parsed.number}`;
      }
    }

    // Determine PR type
    const prType = inferPRType(branch, commits);
    const prTypeLabel = conventionalTypeToLabel(prType as 'feat' | 'fix' | 'chore' | 'refactor' | 'test' | 'docs' | 'perf' | 'ci' | 'style' | 'build');

    // Build PR title
    let prTitle: string;
    if (options.title) {
      prTitle = options.title;
    } else if (task) {
      prTitle = `[${taskKey}] ${task.title}`;
    } else {
      // Fallback: use branch name cleaned up
      const cleanedBranch = branch
        .replace(/^(feature|fix|hotfix|bugfix|chore|refactor|docs)\//, '')
        .replace(/[A-Z]+-\d+-?/, '')
        .replace(/-/g, ' ')
        .trim();
      prTitle = cleanedBranch || branch;
    }

    // Build PR body
    const bodyParts: string[] = [];

    if (task) {
      bodyParts.push('## Linked Task');
      bodyParts.push(`- [${taskKey}: ${task.title}](link)`);
      bodyParts.push(`- Status: ${task.status}`);
      bodyParts.push('');
    }

    bodyParts.push('## Changes');
    bodyParts.push(buildCommitChangelog(commits));
    bodyParts.push('');

    bodyParts.push('## Type');
    bodyParts.push(`${prType} — ${prTypeLabel}`);
    bodyParts.push('');

    const prBody = bodyParts.join('\n');

    spin.stop();

    // Display what we're about to create
    output.header('Pull Request');
    output.keyValue([
      ['Title', output.colors.primary(prTitle)],
      ['Branch', `${branch} → ${options.base || 'main'}`],
      ['Type', prTypeLabel],
      ['Draft', options.draft ? 'Yes' : 'No'],
    ]);

    if (task) {
      output.newline();
      output.keyValue([
        ['Linked task', output.formatTaskNumber(context?.projectKey || '', task.number)],
        ['Task title', task.title],
        ['Task status', output.formatStatus(task.status)],
      ]);
    }

    output.newline();

    // Build GitHub PR creation URL
    const baseBranch = options.base || 'main';
    const encodedTitle = encodeURIComponent(prTitle);
    const encodedBody = encodeURIComponent(prBody);

    if (repoInfo.provider === 'github') {
      const prUrl = `https://github.com/${repoInfo.owner}/${repoInfo.repo}/compare/${baseBranch}...${branch}?expand=1&title=${encodedTitle}&body=${encodedBody}`;

      output.info('Opening GitHub PR creation page...');
      output.log(output.colors.muted('If browser does not open, visit:'));
      output.log(output.colors.link(`https://github.com/${repoInfo.owner}/${repoInfo.repo}/compare/${baseBranch}...${branch}`));

      try {
        await open(prUrl);
        output.newline();
        output.success('PR creation page opened in browser');
      } catch {
        output.warning('Could not open browser automatically');
        output.log(`Visit the URL above to create your PR`);
      }
    } else if (repoInfo.provider === 'gitlab') {
      const mrUrl = `https://gitlab.com/${repoInfo.owner}/${repoInfo.repo}/-/merge_requests/new?merge_request[source_branch]=${branch}&merge_request[target_branch]=${baseBranch}&merge_request[title]=${encodedTitle}`;

      output.info('Opening GitLab MR creation page...');

      try {
        await open(mrUrl);
        output.newline();
        output.success('MR creation page opened in browser');
      } catch {
        output.warning('Could not open browser automatically');
        output.log(output.colors.link(mrUrl));
      }
    } else {
      output.warning(`Provider '${repoInfo.provider}' does not support direct PR URL creation`);
      output.newline();
      output.log('PR details:');
      output.log(output.colors.muted(`  Title: ${prTitle}`));
      output.log(output.colors.muted(`  Branch: ${branch} → ${baseBranch}`));
    }

  } catch (err) {
    spin.fail('Failed to create PR');
    output.error(getErrorMessage(err));
    process.exit(1);
  }
}

/**
 * Register the create subcommand
 */
export function registerCreateCommand(parent: Command): void {
  parent
    .command('create')
    .description('Create a pull request linked to the current task')
    .option('-t, --title <title>', 'PR title (auto-generated from task if not provided)')
    .option('-d, --draft', 'Create as draft PR')
    .option('-b, --base <branch>', 'Base branch (default: main)', 'main')
    .action(async (options: CreateOptions) => {
      await createPR(options);
    });
}

export default registerCreateCommand;
