/**
 * Start daemon command
 * Starts the background daemon that watches for git events
 */

import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { success, error, info, spinner } from '../../lib/output.js';
import { setDaemonConfig } from '../../lib/config.js';
import { isGitRepo, getRepoRoot } from '../../lib/git.js';
import { startWatcher, writeLog, getLogFilePath } from './watcher.js';

// PID file location for tracking the daemon process
const PID_DIR = path.join(os.homedir(), '.config', 'ltf-nodejs');
const PID_FILE = path.join(PID_DIR, 'daemon.pid');
const REPO_FILE = path.join(PID_DIR, 'daemon.repo');

export interface StartDaemonOptions {
  foreground?: boolean;
  verbose?: boolean;
  /** Internal flag - indicates this is a background process spawn */
  _background?: boolean;
}

/**
 * Ensure the PID directory exists
 */
function ensurePidDir(): void {
  if (!fs.existsSync(PID_DIR)) {
    fs.mkdirSync(PID_DIR, { recursive: true });
  }
}

/**
 * Write PID to file
 */
function writePidFile(pid: number): void {
  ensurePidDir();
  fs.writeFileSync(PID_FILE, pid.toString());
}

/**
 * Write repo root to file (for background process reference)
 */
function writeRepoFile(repoRoot: string): void {
  ensurePidDir();
  fs.writeFileSync(REPO_FILE, repoRoot);
}

/**
 * Read repo root from file
 */
function readRepoFile(): string | null {
  if (!fs.existsSync(REPO_FILE)) {
    return null;
  }
  try {
    return fs.readFileSync(REPO_FILE, 'utf-8').trim();
  } catch {
    return null;
  }
}

/**
 * Read PID from file
 */
function readPidFile(): number | null {
  if (!fs.existsSync(PID_FILE)) {
    return null;
  }
  try {
    const content = fs.readFileSync(PID_FILE, 'utf-8').trim();
    const pid = parseInt(content, 10);
    return isNaN(pid) ? null : pid;
  } catch {
    return null;
  }
}

/**
 * Check if a process is running
 */
function isProcessRunning(pid: number): boolean {
  try {
    // Sending signal 0 doesn't kill the process, just checks if it exists
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove PID file
 */
function removePidFile(): void {
  if (fs.existsSync(PID_FILE)) {
    fs.unlinkSync(PID_FILE);
  }
}

/**
 * Remove repo file
 */
function removeRepoFile(): void {
  if (fs.existsSync(REPO_FILE)) {
    fs.unlinkSync(REPO_FILE);
  }
}

/**
 * Start the daemon in foreground mode (for testing/debugging)
 */
async function startForeground(options: StartDaemonOptions): Promise<void> {
  // If this is a background spawn, run silently
  const isBackgroundSpawn = options._background === true;

  if (!isBackgroundSpawn) {
    info('Starting daemon in foreground mode...');
    info(`Logs will be written to: ${getLogFilePath()}`);
  }

  // Set environment variable so watcher knows to output to console
  if (!isBackgroundSpawn) {
    process.env.LTF_DAEMON_FOREGROUND = 'true';
  }

  // Write current PID
  writePidFile(process.pid);
  setDaemonConfig({
    enabled: true,
    pid: process.pid,
    logFile: getLogFilePath(),
  });

  // Handle shutdown signals
  const cleanup = async (): Promise<void> => {
    if (!isBackgroundSpawn) {
      info('\nShutting down daemon...');
    }
    writeLog('info', 'Daemon received shutdown signal');
    const { stopWatcher } = await import('./watcher.js');
    await stopWatcher();
    removePidFile();
    removeRepoFile();
    setDaemonConfig({ enabled: false, pid: undefined });
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // Start the watcher
  try {
    await startWatcher({ verbose: options.verbose });

    if (!isBackgroundSpawn) {
      success('Daemon started in foreground mode');
      info('Press Ctrl+C to stop');
    } else {
      writeLog('info', 'Daemon background process started successfully');
    }

    // Keep the process running
    await new Promise(() => {}); // Never resolves
  } catch (err) {
    if (!isBackgroundSpawn) {
      error(`Failed to start daemon: ${err}`);
    }
    writeLog('error', `Failed to start daemon: ${err}`);
    removePidFile();
    removeRepoFile();
    setDaemonConfig({ enabled: false, pid: undefined });
    process.exit(1);
  }
}

/**
 * Start the daemon in background mode
 * This spawns a new ltf process with the --foreground and --_background flags
 */
async function startBackground(options: StartDaemonOptions): Promise<void> {
  const sp = spinner('Starting daemon...');

  // Check if already running
  const existingPid = readPidFile();
  if (existingPid && isProcessRunning(existingPid)) {
    sp.fail('Daemon is already running');
    info(`PID: ${existingPid}`);
    info('Use `ltf daemon stop` to stop it first');
    return;
  }

  // Clean up stale PID file
  if (existingPid) {
    removePidFile();
  }

  const repoRoot = await getRepoRoot();
  if (!repoRoot) {
    sp.fail('Could not determine repository root');
    return;
  }

  // Store the repo root for the background process
  writeRepoFile(repoRoot);

  // Spawn the daemon process using ltf itself with foreground flag
  // The --_background flag tells the foreground mode to run silently
  const logFile = getLogFilePath();

  // Ensure log directory exists
  const logDir = path.dirname(logFile);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const out = fs.openSync(logFile, 'a');
  const errFile = fs.openSync(logFile, 'a');

  // Build the command arguments
  const args: Array<string> = ['daemon', 'start', '--foreground'];
  if (options.verbose) {
    args.push('--verbose');
  }

  // Find the ltf executable
  // We try several locations: npm global, local node_modules, or the current script
  let ltfPath = 'ltf';

  // Check if we can find the ltf binary
  try {
    const { execSync } = await import('node:child_process');
    ltfPath = execSync('which ltf', { encoding: 'utf-8' }).trim();
  } catch {
    // Try to use the current script's location
    const scriptDir = path.dirname(import.meta.url.replace('file://', ''));
    const possiblePaths = [
      path.resolve(scriptDir, '../../../dist/bin/ltf.js'),
      path.resolve(scriptDir, '../../bin/ltf.js'),
      'ltf',
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        ltfPath = p;
        break;
      }
    }
  }

  writeLog('info', `Starting background daemon with: ${ltfPath} ${args.join(' ')}`);

  const child: ChildProcess = spawn('node', [ltfPath, ...args], {
    detached: true,
    stdio: ['ignore', out, errFile],
    cwd: repoRoot,
    env: {
      ...process.env,
      LTF_DAEMON: 'true',
      LTF_DAEMON_BACKGROUND: 'true',
    },
  });

  if (child.pid) {
    // Detach from the child process
    child.unref();

    // Give it a moment to start and write its PID
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if it's still running by reading the PID file (child writes its own PID)
    const actualPid = readPidFile();

    if (actualPid && isProcessRunning(actualPid)) {
      sp.succeed('Daemon started successfully');
      info(`PID: ${actualPid}`);
      info(`Log file: ${logFile}`);
      info('Use `ltf daemon status` to check status');
      info('Use `ltf daemon logs -f` to follow logs');
    } else {
      sp.fail('Daemon failed to start');
      error('Check logs for details: `ltf daemon logs`');
      removePidFile();
      removeRepoFile();
      setDaemonConfig({ enabled: false, pid: undefined });
    }
  } else {
    sp.fail('Failed to spawn daemon process');
    error('Could not start background process');
  }

  // Close the file descriptors in the parent process
  fs.closeSync(out);
  fs.closeSync(errFile);
}

/**
 * Start the daemon
 */
export async function startDaemon(options: StartDaemonOptions = {}): Promise<void> {
  // Check if we're running as a background spawn
  if (process.env.LTF_DAEMON_BACKGROUND === 'true') {
    options._background = true;
    options.foreground = true;

    // Get repo root from file for background process
    const savedRepoRoot = readRepoFile();
    if (savedRepoRoot && fs.existsSync(savedRepoRoot)) {
      process.chdir(savedRepoRoot);
    }
  }

  // Verify we're in a git repository
  if (!await isGitRepo()) {
    error('Not in a git repository');
    info('The daemon must be started from within a git repository');
    return;
  }

  if (options.foreground) {
    await startForeground(options);
  } else {
    await startBackground(options);
  }
}

export { readPidFile, isProcessRunning, removePidFile, PID_FILE, REPO_FILE };
