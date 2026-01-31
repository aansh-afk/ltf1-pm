/**
 * File watcher implementation for the LTF daemon
 * Monitors .git directory for changes and triggers appropriate handlers
 */

import chokidar, { type FSWatcher } from 'chokidar';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { getRepoRoot, getCurrentBranch, getLatestCommitHash } from '../../lib/git.js';

// Log file location
const LOG_DIR = path.join(os.homedir(), '.config', 'ltf-nodejs');
const LOG_FILE = path.join(LOG_DIR, 'daemon.log');

// State tracking for change detection
interface WatcherState {
  currentBranch: string | null;
  lastCommitHash: string | null;
  isMerging: boolean;
}

let watcher: FSWatcher | null = null;
let watcherState: WatcherState = {
  currentBranch: null,
  lastCommitHash: null,
  isMerging: false,
};
let verbose = false;

/**
 * Ensure log directory exists
 */
function ensureLogDir(): void {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

/**
 * Format a log message with timestamp
 */
function formatLogMessage(level: string, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
}

/**
 * Write a log message to the log file
 */
export function writeLog(level: 'info' | 'warn' | 'error' | 'debug', message: string): void {
  if (level === 'debug' && !verbose) {
    return;
  }

  ensureLogDir();
  const logMessage = formatLogMessage(level, message) + '\n';

  // Append to log file
  fs.appendFileSync(LOG_FILE, logMessage);

  // Also output to console if running in foreground
  if (process.env.LTF_DAEMON_FOREGROUND === 'true') {
    const coloredLevel = {
      info: '\x1b[34mINFO\x1b[0m',
      warn: '\x1b[33mWARN\x1b[0m',
      error: '\x1b[31mERROR\x1b[0m',
      debug: '\x1b[90mDEBUG\x1b[0m',
    }[level];
    console.log(`[${new Date().toISOString()}] [${coloredLevel}] ${message}`);
  }
}

/**
 * Get the log file path
 */
export function getLogFilePath(): string {
  return LOG_FILE;
}

/**
 * Clear the log file
 */
export function clearLogFile(): void {
  ensureLogDir();
  fs.writeFileSync(LOG_FILE, '');
}

/**
 * Read recent log entries
 */
export function readRecentLogs(lines: number): string[] {
  if (!fs.existsSync(LOG_FILE)) {
    return [];
  }

  const content = fs.readFileSync(LOG_FILE, 'utf-8');
  const allLines = content.split('\n').filter(line => line.trim());
  return allLines.slice(-lines);
}

/**
 * Handle branch change (checkout)
 */
async function handleBranchChange(newBranch: string): Promise<void> {
  const oldBranch = watcherState.currentBranch;
  watcherState.currentBranch = newBranch;

  if (oldBranch && oldBranch !== newBranch) {
    writeLog('info', `Branch changed: ${oldBranch} -> ${newBranch}`);

    // Trigger post-checkout handler
    try {
      await triggerGitHook('post-checkout', [oldBranch, newBranch, '1']);
    } catch (err) {
      writeLog('error', `Failed to trigger post-checkout handler: ${err}`);
    }
  }
}

/**
 * Handle new commit
 */
async function handleNewCommit(commitHash: string): Promise<void> {
  const oldHash = watcherState.lastCommitHash;
  watcherState.lastCommitHash = commitHash;

  if (oldHash && oldHash !== commitHash) {
    writeLog('info', `New commit detected: ${commitHash.substring(0, 8)}`);

    // Trigger post-commit handler
    try {
      await triggerGitHook('post-commit', []);
    } catch (err) {
      writeLog('error', `Failed to trigger post-commit handler: ${err}`);
    }
  }
}

/**
 * Handle merge
 */
async function handleMerge(merging: boolean): Promise<void> {
  const wasMerging = watcherState.isMerging;
  watcherState.isMerging = merging;

  if (wasMerging && !merging) {
    writeLog('info', 'Merge completed');

    // Trigger post-merge handler
    try {
      await triggerGitHook('post-merge', ['0']); // 0 = not a squash merge
    } catch (err) {
      writeLog('error', `Failed to trigger post-merge handler: ${err}`);
    }
  } else if (!wasMerging && merging) {
    writeLog('info', 'Merge in progress');
  }
}

/**
 * Trigger the appropriate git hook handler
 * This calls the ltf git hook command which handles the actual logic
 */
async function triggerGitHook(hookType: string, args: string[]): Promise<void> {
  writeLog('debug', `Triggering ${hookType} hook with args: ${args.join(', ')}`);

  // Import dynamically to avoid circular dependencies
  // The hook handlers will be implemented in the git commands module
  try {
    const { spawn } = await import('node:child_process');

    // Call ltf git hook command
    const child = spawn('ltf', ['git', 'hook', hookType, ...args], {
      stdio: 'ignore',
      detached: true,
    });
    child.unref();
  } catch (err) {
    writeLog('error', `Error spawning hook process: ${err}`);
  }
}

/**
 * Read current HEAD reference
 */
function readHeadRef(gitDir: string): string | null {
  try {
    const headPath = path.join(gitDir, 'HEAD');
    if (!fs.existsSync(headPath)) return null;

    const content = fs.readFileSync(headPath, 'utf-8').trim();

    // Check if it's a symbolic reference (ref: refs/heads/branch-name)
    if (content.startsWith('ref: ')) {
      const ref = content.substring(5);
      // Extract branch name from refs/heads/branch-name
      if (ref.startsWith('refs/heads/')) {
        return ref.substring(11);
      }
      return ref;
    }

    // It's a detached HEAD with a commit hash
    return content;
  } catch {
    return null;
  }
}

/**
 * Read latest commit hash from reflog
 */
function readLatestCommit(gitDir: string): string | null {
  try {
    const reflogPath = path.join(gitDir, 'logs', 'HEAD');
    if (!fs.existsSync(reflogPath)) return null;

    const content = fs.readFileSync(reflogPath, 'utf-8').trim();
    const lines = content.split('\n');
    const lastLine = lines[lines.length - 1];

    if (!lastLine) return null;

    // Reflog format: old_hash new_hash author timestamp message
    const parts = lastLine.split(' ');
    if (parts.length >= 2) {
      return parts[1]; // new_hash
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Check if a merge is in progress
 */
function isMergeInProgress(gitDir: string): boolean {
  return fs.existsSync(path.join(gitDir, 'MERGE_HEAD'));
}

/**
 * Start the file watcher
 */
export async function startWatcher(options: { verbose?: boolean } = {}): Promise<void> {
  verbose = options.verbose ?? false;

  writeLog('info', 'Starting LTF daemon watcher...');

  const repoRoot = await getRepoRoot();
  if (!repoRoot) {
    writeLog('error', 'Not in a git repository');
    throw new Error('Not in a git repository');
  }

  const gitDir = path.join(repoRoot, '.git');

  // Initialize state
  watcherState.currentBranch = await getCurrentBranch();
  watcherState.lastCommitHash = await getLatestCommitHash();
  watcherState.isMerging = isMergeInProgress(gitDir);

  writeLog('info', `Watching repository: ${repoRoot}`);
  writeLog('info', `Current branch: ${watcherState.currentBranch || 'unknown'}`);
  writeLog('info', `Latest commit: ${watcherState.lastCommitHash?.substring(0, 8) || 'unknown'}`);

  // Files to watch
  const watchPaths = [
    path.join(gitDir, 'HEAD'),           // Branch changes
    path.join(gitDir, 'logs', 'HEAD'),   // Commit history (new commits)
    path.join(gitDir, 'MERGE_HEAD'),     // Merge state
  ];

  // Create watcher with appropriate options
  watcher = chokidar.watch(watchPaths, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50,
    },
    // Use polling for .git files as they're often modified atomically
    usePolling: true,
    interval: 500,
  });

  // Handle file changes
  watcher.on('change', async (filePath) => {
    writeLog('debug', `File changed: ${filePath}`);

    const fileName = path.basename(filePath);
    const parentDir = path.basename(path.dirname(filePath));

    if (fileName === 'HEAD' && parentDir === '.git') {
      // HEAD file changed - check for branch change
      const newBranch = readHeadRef(gitDir);
      if (newBranch && newBranch !== watcherState.currentBranch) {
        await handleBranchChange(newBranch);
      }
    } else if (fileName === 'HEAD' && parentDir === 'logs') {
      // Reflog updated - new commit
      const newHash = readLatestCommit(gitDir);
      if (newHash && newHash !== watcherState.lastCommitHash) {
        await handleNewCommit(newHash);
      }
    } else if (fileName === 'MERGE_HEAD') {
      // Merge state changed
      const merging = isMergeInProgress(gitDir);
      await handleMerge(merging);
    }
  });

  // Handle file additions (for MERGE_HEAD)
  watcher.on('add', async (filePath) => {
    writeLog('debug', `File added: ${filePath}`);

    const fileName = path.basename(filePath);
    if (fileName === 'MERGE_HEAD') {
      await handleMerge(true);
    }
  });

  // Handle file deletions (for MERGE_HEAD)
  watcher.on('unlink', async (filePath) => {
    writeLog('debug', `File removed: ${filePath}`);

    const fileName = path.basename(filePath);
    if (fileName === 'MERGE_HEAD') {
      await handleMerge(false);
    }
  });

  // Handle errors
  watcher.on('error', (error) => {
    writeLog('error', `Watcher error: ${error}`);
  });

  writeLog('info', 'Daemon watcher started successfully');
}

/**
 * Stop the file watcher
 */
export async function stopWatcher(): Promise<void> {
  if (watcher) {
    writeLog('info', 'Stopping daemon watcher...');
    await watcher.close();
    watcher = null;
    writeLog('info', 'Daemon watcher stopped');
  }
}

/**
 * Check if the watcher is running
 */
export function isWatcherRunning(): boolean {
  return watcher !== null;
}

export default {
  startWatcher,
  stopWatcher,
  isWatcherRunning,
  writeLog,
  getLogFilePath,
  clearLogFile,
  readRecentLogs,
};
