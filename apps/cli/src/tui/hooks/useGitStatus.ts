/**
 * Git status hook for TUI
 * Polls local git data via simple-git utilities
 * Only polls when `enabled` is true (i.e. git page is active)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getCurrentBranch,
  getRecentCommits,
  hasUncommittedChanges,
  isGitRepo,
  getRemoteUrl,
  parseRemoteUrl,
  areHooksInstalled,
  getGit,
} from '../../lib/git.js';

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: Date;
}

export interface GitFileChange {
  path: string;
  index: string;   // staged status letter
  working: string;  // unstaged status letter
}

export interface GitStatusState {
  isRepo: boolean;
  branch: string | null;
  commits: GitCommit[];
  hasChanges: boolean;
  stagedFiles: GitFileChange[];
  unstagedFiles: GitFileChange[];
  remoteUrl: string | null;
  remoteInfo: { owner: string; repo: string; provider: string } | null;
  hooksInstalled: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGitStatus(intervalMs = 5000, enabled = true): GitStatusState {
  const [state, setState] = useState<Omit<GitStatusState, 'refetch'>>({
    isRepo: false,
    branch: null,
    commits: [],
    hasChanges: false,
    stagedFiles: [],
    unstagedFiles: [],
    remoteUrl: null,
    remoteInfo: null,
    hooksInstalled: false,
    loading: true,
    error: null,
  });

  // Track if we've fetched at least once (for initial load on page visit)
  const hasFetched = useRef(false);
  const fetchingRef = useRef(false);

  const fetchGitData = useCallback(async () => {
    // Prevent concurrent fetches
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      const repo = await isGitRepo();
      if (!repo) {
        setState(prev => {
          if (!prev.isRepo && !prev.loading && prev.error === null) return prev;
          return { ...prev, isRepo: false, loading: false, error: null };
        });
        return;
      }

      const [branch, commits, changes, remote, hooks] = await Promise.all([
        getCurrentBranch(),
        getRecentCommits(10),
        hasUncommittedChanges(),
        getRemoteUrl(),
        areHooksInstalled(),
      ]);

      // Get detailed file status
      let stagedFiles: GitFileChange[] = [];
      let unstagedFiles: GitFileChange[] = [];
      try {
        const git = getGit();
        const status = await git.status();
        stagedFiles = [
          ...status.created.map(p => ({ path: p, index: 'A', working: ' ' })),
          ...status.staged.map(p => ({ path: p, index: 'M', working: ' ' })),
          ...status.deleted.map(p => ({ path: p, index: 'D', working: ' ' })),
          ...status.renamed.map(r => ({ path: r.to, index: 'R', working: ' ' })),
        ];
        unstagedFiles = [
          ...status.modified.filter(p => !status.staged.includes(p)).map(p => ({ path: p, index: ' ', working: 'M' })),
          ...status.not_added.map(p => ({ path: p, index: '?', working: '?' })),
        ];
      } catch {
        // Fall back to simple hasChanges boolean
      }

      const remoteInfo = remote ? parseRemoteUrl(remote) : null;

      setState({
        isRepo: true,
        branch,
        commits: commits.map(c => ({ ...c, date: new Date(c.date) })),
        hasChanges: changes,
        stagedFiles,
        unstagedFiles,
        remoteUrl: remote,
        remoteInfo,
        hooksInstalled: hooks,
        loading: false,
        error: null,
      });
      hasFetched.current = true;
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Git error',
      }));
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  const refetch = useCallback(() => {
    setState(prev => ({ ...prev, loading: true }));
    fetchGitData();
  }, [fetchGitData]);

  useEffect(() => {
    if (!enabled) return;

    // Fetch immediately when enabled (page becomes active)
    fetchGitData();

    const interval = setInterval(fetchGitData, intervalMs);
    return () => clearInterval(interval);
  }, [enabled, fetchGitData, intervalMs]);

  return { ...state, refetch };
}
