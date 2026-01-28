/**
 * Git utilities for the LTF CLI
 * Handles git operations, branch parsing, and repository detection
 */

import simpleGit, { type SimpleGit } from 'simple-git';
import path from 'node:path';
import fs from 'node:fs';

let gitInstance: SimpleGit | null = null;

/**
 * Get a simple-git instance for the current directory
 */
export function getGit(cwd?: string): SimpleGit {
  if (!gitInstance || cwd) {
    gitInstance = simpleGit(cwd || process.cwd());
  }
  return gitInstance;
}

/**
 * Check if current directory is inside a git repository
 */
export async function isGitRepo(cwd?: string): Promise<boolean> {
  try {
    const git = getGit(cwd);
    await git.revparse(['--git-dir']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the root directory of the git repository
 */
export async function getRepoRoot(cwd?: string): Promise<string | null> {
  try {
    const git = getGit(cwd);
    const root = await git.revparse(['--show-toplevel']);
    return root.trim();
  } catch {
    return null;
  }
}

/**
 * Get the current branch name
 */
export async function getCurrentBranch(): Promise<string | null> {
  try {
    const git = getGit();
    const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
    return branch.trim();
  } catch {
    return null;
  }
}

/**
 * Parse task reference from branch name
 * Supports formats:
 * - feature/PROJ-123-description
 * - bugfix/PROJ-456
 * - PROJ-789
 * - 123-description (if project key is known)
 */
export function parseTaskFromBranch(
  branchName: string,
  projectKey?: string
): { key?: string; number: number } | null {
  // Pattern 1: PROJECT-123 format
  const fullMatch = branchName.match(/([A-Z]+)-(\d+)/);
  if (fullMatch) {
    return {
      key: fullMatch[1],
      number: parseInt(fullMatch[2], 10),
    };
  }

  // Pattern 2: Just number (needs project context)
  if (projectKey) {
    const numberMatch = branchName.match(/(\d+)/);
    if (numberMatch) {
      return {
        key: projectKey,
        number: parseInt(numberMatch[1], 10),
      };
    }
  }

  return null;
}

/**
 * Parse task references from commit message
 * Supports formats:
 * - PROJ-123
 * - fixes PROJ-123
 * - closes #123
 * - refs PROJ-123
 */
export function parseTasksFromCommit(
  message: string,
  projectKey?: string
): Array<{ key?: string; number: number }> {
  const tasks: Array<{ key?: string; number: number }> = [];

  // Pattern 1: PROJECT-123 format
  const projectMatches = message.matchAll(/([A-Z]+)-(\d+)/g);
  for (const match of projectMatches) {
    tasks.push({
      key: match[1],
      number: parseInt(match[2], 10),
    });
  }

  // Pattern 2: #123 format (GitHub style)
  if (projectKey) {
    const hashMatches = message.matchAll(/#(\d+)/g);
    for (const match of hashMatches) {
      // Avoid duplicates
      const num = parseInt(match[1], 10);
      if (!tasks.some((t) => t.number === num)) {
        tasks.push({
          key: projectKey,
          number: num,
        });
      }
    }
  }

  return tasks;
}

/**
 * Get the remote URL for origin
 */
export async function getRemoteUrl(): Promise<string | null> {
  try {
    const git = getGit();
    const remotes = await git.getRemotes(true);
    const origin = remotes.find((r) => r.name === 'origin');
    return origin?.refs?.fetch || null;
  } catch {
    return null;
  }
}

/**
 * Parse repository info from remote URL
 * Supports GitHub, GitLab, and Bitbucket URLs
 */
export function parseRemoteUrl(url: string): { owner: string; repo: string; provider: string } | null {
  // HTTPS format: https://github.com/owner/repo.git
  const httpsMatch = url.match(/https?:\/\/([^/]+)\/([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (httpsMatch) {
    const host = httpsMatch[1];
    let provider = 'github';
    if (host.includes('gitlab')) provider = 'gitlab';
    if (host.includes('bitbucket')) provider = 'bitbucket';

    return {
      owner: httpsMatch[2],
      repo: httpsMatch[3].replace(/\.git$/, ''),
      provider,
    };
  }

  // SSH format: git@github.com:owner/repo.git
  const sshMatch = url.match(/git@([^:]+):([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (sshMatch) {
    const host = sshMatch[1];
    let provider = 'github';
    if (host.includes('gitlab')) provider = 'gitlab';
    if (host.includes('bitbucket')) provider = 'bitbucket';

    return {
      owner: sshMatch[2],
      repo: sshMatch[3].replace(/\.git$/, ''),
      provider,
    };
  }

  return null;
}

/**
 * Get recent commits
 */
export async function getRecentCommits(count = 10): Promise<
  Array<{
    hash: string;
    message: string;
    author: string;
    date: Date;
  }>
> {
  try {
    const git = getGit();
    const log = await git.log({ maxCount: count });
    return log.all.map((commit) => ({
      hash: commit.hash,
      message: commit.message,
      author: commit.author_name,
      date: new Date(commit.date),
    }));
  } catch {
    return [];
  }
}

/**
 * Get the latest commit hash
 */
export async function getLatestCommitHash(): Promise<string | null> {
  try {
    const git = getGit();
    const hash = await git.revparse(['HEAD']);
    return hash.trim();
  } catch {
    return null;
  }
}

/**
 * Check if there are uncommitted changes
 */
export async function hasUncommittedChanges(): Promise<boolean> {
  try {
    const git = getGit();
    const status = await git.status();
    return !status.isClean();
  } catch {
    return false;
  }
}

/**
 * Get the path to git hooks directory
 */
export async function getHooksPath(): Promise<string | null> {
  const repoRoot = await getRepoRoot();
  if (!repoRoot) return null;

  // Check for custom hooks path in git config
  try {
    const git = getGit();
    const customPath = await git.raw(['config', '--get', 'core.hooksPath']);
    if (customPath.trim()) {
      return path.resolve(repoRoot, customPath.trim());
    }
  } catch {
    // No custom hooks path set
  }

  return path.join(repoRoot, '.git', 'hooks');
}

/**
 * Check if git hooks are installed
 */
export async function areHooksInstalled(): Promise<boolean> {
  const hooksPath = await getHooksPath();
  if (!hooksPath) return false;

  const hookFiles = ['post-commit', 'post-checkout', 'pre-push', 'post-merge'];

  for (const hook of hookFiles) {
    const hookPath = path.join(hooksPath, hook);
    if (fs.existsSync(hookPath)) {
      const content = fs.readFileSync(hookPath, 'utf-8');
      if (content.includes('ltf git hook')) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Install git hooks
 */
export async function installHooks(): Promise<void> {
  const hooksPath = await getHooksPath();
  if (!hooksPath) {
    throw new Error('Not in a git repository');
  }

  // Ensure hooks directory exists
  if (!fs.existsSync(hooksPath)) {
    fs.mkdirSync(hooksPath, { recursive: true });
  }

  const hooks: Record<string, string> = {
    'post-commit': `#!/bin/sh
# LTF CLI hook - triggered after commit
ltf git hook post-commit "$@" 2>/dev/null || true
`,
    'post-checkout': `#!/bin/sh
# LTF CLI hook - triggered after branch checkout
ltf git hook post-checkout "$@" 2>/dev/null || true
`,
    'pre-push': `#!/bin/sh
# LTF CLI hook - triggered before push
ltf git hook pre-push "$@" 2>/dev/null || true
`,
    'post-merge': `#!/bin/sh
# LTF CLI hook - triggered after merge
ltf git hook post-merge "$@" 2>/dev/null || true
`,
  };

  for (const [hookName, content] of Object.entries(hooks)) {
    const hookPath = path.join(hooksPath, hookName);

    // Backup existing hook if it exists and isn't ours
    if (fs.existsSync(hookPath)) {
      const existing = fs.readFileSync(hookPath, 'utf-8');
      if (!existing.includes('ltf git hook')) {
        fs.writeFileSync(`${hookPath}.backup`, existing);
      }
    }

    fs.writeFileSync(hookPath, content);
    fs.chmodSync(hookPath, '755');
  }
}

/**
 * Uninstall git hooks
 */
export async function uninstallHooks(): Promise<void> {
  const hooksPath = await getHooksPath();
  if (!hooksPath) {
    throw new Error('Not in a git repository');
  }

  const hookFiles = ['post-commit', 'post-checkout', 'pre-push', 'post-merge'];

  for (const hookName of hookFiles) {
    const hookPath = path.join(hooksPath, hookName);
    const backupPath = `${hookPath}.backup`;

    if (fs.existsSync(hookPath)) {
      const content = fs.readFileSync(hookPath, 'utf-8');
      if (content.includes('ltf git hook')) {
        // Remove our hook
        fs.unlinkSync(hookPath);

        // Restore backup if exists
        if (fs.existsSync(backupPath)) {
          fs.renameSync(backupPath, hookPath);
        }
      }
    }
  }
}

export default {
  getGit,
  isGitRepo,
  getRepoRoot,
  getCurrentBranch,
  parseTaskFromBranch,
  parseTasksFromCommit,
  getRemoteUrl,
  parseRemoteUrl,
  getRecentCommits,
  getLatestCommitHash,
  hasUncommittedChanges,
  getHooksPath,
  areHooksInstalled,
  installHooks,
  uninstallHooks,
};
