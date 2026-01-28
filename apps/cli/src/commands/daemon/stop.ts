/**
 * Stop daemon command
 * Stops the running daemon process
 */

import fs from 'node:fs';
import { success, error, warning, info, spinner } from '../../lib/output.js';
import { setDaemonConfig } from '../../lib/config.js';
import { readPidFile, isProcessRunning, removePidFile, REPO_FILE } from './start.js';
import { writeLog } from './watcher.js';

/**
 * Remove repo file
 */
function removeRepoFile(): void {
  if (fs.existsSync(REPO_FILE)) {
    fs.unlinkSync(REPO_FILE);
  }
}

export interface StopDaemonOptions {
  force?: boolean;
}

/**
 * Send a signal to a process and wait for it to exit
 */
async function killProcess(pid: number, signal: NodeJS.Signals, timeout = 5000): Promise<boolean> {
  try {
    process.kill(pid, signal);

    // Wait for process to exit
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (!isProcessRunning(pid)) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return !isProcessRunning(pid);
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err) {
      // ESRCH means the process doesn't exist
      if ((err as { code: string }).code === 'ESRCH') {
        return true;
      }
    }
    return false;
  }
}

/**
 * Stop the daemon
 */
export async function stopDaemon(options: StopDaemonOptions = {}): Promise<void> {
  const sp = spinner('Stopping daemon...');

  // Get the PID from file
  const pid = readPidFile();

  if (!pid) {
    sp.fail('No daemon PID file found');
    info('The daemon may not be running');

    // Clean up config just in case
    setDaemonConfig({ enabled: false, pid: undefined });
    return;
  }

  // Check if process is actually running
  if (!isProcessRunning(pid)) {
    sp.warn('Daemon process is not running');
    info('Cleaning up stale PID file...');

    // Clean up
    removePidFile();
    removeRepoFile();
    setDaemonConfig({ enabled: false, pid: undefined });

    success('Cleaned up stale daemon files');
    return;
  }

  // Log the shutdown attempt
  writeLog('info', `Received shutdown signal from CLI (PID: ${process.pid})`);

  // Try graceful shutdown first
  sp.text = 'Sending SIGTERM...';
  let stopped = await killProcess(pid, 'SIGTERM', 5000);

  if (!stopped && options.force) {
    // Force kill if requested
    sp.text = 'Sending SIGKILL...';
    warning('Graceful shutdown failed, force killing...');
    stopped = await killProcess(pid, 'SIGKILL', 2000);
  }

  if (stopped) {
    // Clean up
    removePidFile();
    removeRepoFile();
    setDaemonConfig({ enabled: false, pid: undefined });

    sp.succeed('Daemon stopped successfully');
    info(`PID ${pid} terminated`);
  } else {
    sp.fail('Failed to stop daemon');
    error(`Process ${pid} is still running`);

    if (!options.force) {
      info('Try `ltf daemon stop --force` to force kill');
    } else {
      info(`You may need to manually kill the process: kill -9 ${pid}`);
    }
  }
}

export default stopDaemon;
