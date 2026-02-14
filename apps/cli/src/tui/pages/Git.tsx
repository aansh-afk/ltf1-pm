/**
 * Git Page - Interactive git status with staging, committing, and task linking
 * Shows branch, navigable file list, stage/unstage, commit, link task
 */

import { useState, useCallback } from 'react';
import { useInput } from 'ink';
import simpleGit from 'simple-git';
import { useGitStatus } from '../hooks/useGitStatus.js';
import type { Row } from '../types.js';
import { WHITE, LIGHT, GRAY, DIM, DARK } from '../theme.js';
import {
  segRow, blank, padSegs, fillTo, rep,
  pageHeader, pageFooter, section, relativeTime,
} from '../helpers.js';

export interface GitPageProps {
  width: number;
  height: number;
  timeStr: string;
  isActive?: boolean;
}

type GitMode = 'status' | 'commit' | 'link';

interface CombinedFile {
  path: string;
  index: string;
  working: string;
  staged: boolean;
}

const gitOps = simpleGit();

function fileStatusLabel(f: CombinedFile): string {
  if (f.index === 'A' || f.working === 'A') return 'A';
  if (f.index === 'D' || f.working === 'D') return 'D';
  if (f.index === 'R') return 'R';
  if (f.working === '?' && f.index === '?') return '?';
  if (f.index === 'M' || f.working === 'M') return 'M';
  return ' ';
}

export function useGitPage({ width: W, height: H, timeStr, isActive = true }: GitPageProps): Row[] {
  const git = useGitStatus(5000, isActive);

  const [mode, setMode] = useState<GitMode>('status');
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [commitMessage, setCommitMessage] = useState('');
  const [linkTaskInput, setLinkTaskInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Build combined file list
  const allFiles: CombinedFile[] = [
    ...git.stagedFiles.map(f => ({ ...f, staged: true })),
    ...git.unstagedFiles.map(f => ({ ...f, staged: false })),
  ];

  // Count staged files in combined list
  const stagedCount = git.stagedFiles.length;

  // Clamp selection
  const clampIdx = useCallback((n: number) => Math.max(0, Math.min(allFiles.length - 1, n)), [allFiles.length]);

  // Show feedback briefly
  const showFeedback = useCallback((msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2500);
  }, []);

  // Toggle stage/unstage for a file
  const toggleStage = useCallback(async (file: CombinedFile) => {
    if (busy) return;
    setBusy(true);
    try {
      if (file.staged) {
        await gitOps.reset(['HEAD', '--', file.path]);
      } else {
        await gitOps.add(file.path);
      }
      git.refetch();
    } catch (err) {
      showFeedback(err instanceof Error ? err.message : 'Git operation failed');
    } finally {
      setBusy(false);
    }
  }, [busy, git, showFeedback]);

  // Stage all
  const stageAll = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      await gitOps.add('.');
      git.refetch();
      showFeedback('All files staged');
    } catch (err) {
      showFeedback(err instanceof Error ? err.message : 'Stage all failed');
    } finally {
      setBusy(false);
    }
  }, [busy, git, showFeedback]);

  // Unstage all
  const unstageAll = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      await gitOps.reset(['HEAD']);
      git.refetch();
      showFeedback('All files unstaged');
    } catch (err) {
      showFeedback(err instanceof Error ? err.message : 'Unstage all failed');
    } finally {
      setBusy(false);
    }
  }, [busy, git, showFeedback]);

  // Execute commit
  const executeCommit = useCallback(async (msg: string) => {
    if (busy || !msg.trim()) return;
    setBusy(true);
    try {
      const result = await gitOps.commit(msg.trim());
      const hash = result.commit ? result.commit.slice(0, 7) : '?';
      showFeedback(`Committed: ${hash}`);
      setCommitMessage('');
      setMode('status');
      git.refetch();
    } catch (err) {
      showFeedback(err instanceof Error ? err.message : 'Commit failed');
    } finally {
      setBusy(false);
    }
  }, [busy, git, showFeedback]);

  // Input handling
  useInput((input, key) => {
    if (!isActive) return;
    if (busy) return;

    if (mode === 'status') {
      // Navigate files
      if (input === 'j' || key.downArrow) {
        setSelectedFileIndex(prev => clampIdx(prev + 1));
      }
      if (input === 'k' || key.upArrow) {
        setSelectedFileIndex(prev => clampIdx(prev - 1));
      }

      // Toggle stage/unstage selected file
      if (input === ' ' && allFiles.length > 0) {
        const file = allFiles[selectedFileIndex];
        if (file) {
          void toggleStage(file);
        }
      }

      // Stage all
      if (input === 's') {
        void stageAll();
      }

      // Unstage all
      if (input === 'u') {
        void unstageAll();
      }

      // Open commit mode
      if (input === 'c') {
        if (stagedCount === 0) {
          showFeedback('No staged files. Space to stage, s to stage all.');
        } else {
          setMode('commit');
          setCommitMessage('');
        }
      }

      // Open link mode
      if (input === 'l') {
        setMode('link');
        setLinkTaskInput('');
      }

      // Refresh
      if (input === 'r') {
        git.refetch();
        showFeedback('Refreshing...');
      }
    } else if (mode === 'commit') {
      if (key.escape) {
        setMode('status');
        setCommitMessage('');
      } else if (key.return && commitMessage.trim()) {
        void executeCommit(commitMessage);
      } else if (key.backspace || key.delete) {
        setCommitMessage(prev => prev.slice(0, -1));
      } else if (input && !key.ctrl && !key.meta && input.length === 1) {
        setCommitMessage(prev => prev + input);
      }
    } else if (mode === 'link') {
      if (key.escape) {
        setMode('status');
        setLinkTaskInput('');
      } else if (key.return && linkTaskInput.trim()) {
        showFeedback(`Branch linked to task: ${linkTaskInput.trim()}`);
        setMode('status');
        setLinkTaskInput('');
      } else if (key.backspace || key.delete) {
        setLinkTaskInput(prev => prev.slice(0, -1));
      } else if (input && !key.ctrl && !key.meta && input.length === 1) {
        setLinkTaskInput(prev => prev + input);
      }
    }
  }, { isActive: isActive ?? true });

  // ── Rendering ──────────────────────────────────────────────

  const rows: Row[] = [];

  rows.push(...pageHeader('Git', timeStr, W));
  rows.push(blank(W));

  // Loading state
  if (git.loading && !git.branch) {
    rows.push(segRow(padSegs([
      { text: '  Loading git status...', color: GRAY },
    ], W)));
    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W));
    return rows;
  }

  // Not a repo
  if (!git.isRepo) {
    rows.push(segRow(padSegs([
      { text: '  Not a git repository', color: GRAY },
    ], W)));
    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: '  Run ', color: DIM },
      { text: 'git init', color: LIGHT },
      { text: ' to initialize a repository', color: DIM },
    ], W)));
    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W));
    return rows;
  }

  // Error state
  if (git.error) {
    rows.push(segRow(padSegs([
      { text: '  Error: ', color: GRAY },
      { text: git.error, color: LIGHT },
    ], W)));
    rows.push(blank(W));
    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W));
    return rows;
  }

  // ── Commit mode rendering ─────────────────────────────────
  if (mode === 'commit') {
    rows.push(segRow(padSegs([
      { text: '  Commit Message', color: WHITE },
    ], W)));
    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: '  > ', color: LIGHT },
      { text: commitMessage, color: WHITE },
      { text: '█', color: GRAY },
    ], W)));
    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: `  ${stagedCount} file${stagedCount === 1 ? '' : 's'} staged for commit`, color: GRAY },
    ], W)));
    rows.push(blank(W));

    // Show staged file list
    for (const f of git.stagedFiles.slice(0, 6)) {
      const label = fileStatusLabel({ ...f, staged: true });
      rows.push(segRow(padSegs([
        { text: '    ', color: WHITE },
        { text: label, color: LIGHT },
        { text: '  ', color: WHITE },
        { text: f.path, color: GRAY },
      ], W)));
    }
    if (git.stagedFiles.length > 6) {
      rows.push(segRow(padSegs([
        { text: `    ... and ${git.stagedFiles.length - 6} more`, color: DIM },
      ], W)));
    }

    rows.push(blank(W));

    if (feedback) {
      rows.push(segRow(padSegs([
        { text: `  ${feedback}`, color: LIGHT },
      ], W)));
    } else {
      rows.push(segRow(padSegs([
        { text: '  Enter', color: LIGHT },
        { text: ' commit  ', color: DIM },
        { text: 'Esc', color: LIGHT },
        { text: ' cancel', color: DIM },
      ], W)));
    }

    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W));
    return rows;
  }

  // ── Link mode rendering ───────────────────────────────────
  if (mode === 'link') {
    rows.push(segRow(padSegs([
      { text: '  Link Task to Branch', color: WHITE },
    ], W)));
    rows.push(blank(W));

    // Show current branch
    const branchName = git.branch || 'HEAD (detached)';
    rows.push(segRow(padSegs([
      { text: '  Branch  ', color: GRAY },
      { text: branchName, color: WHITE },
    ], W)));
    rows.push(blank(W));

    // Try to auto-detect task from branch name
    const branchMatch = git.branch?.match(/(\d+)/) || git.branch?.match(/([A-Z]+-\d+)/);
    if (branchMatch && !linkTaskInput) {
      rows.push(segRow(padSegs([
        { text: '  Detected: ', color: DIM },
        { text: branchMatch[1], color: LIGHT },
      ], W)));
      rows.push(blank(W));
    }

    rows.push(segRow(padSegs([
      { text: '  Task ID: ', color: GRAY },
      { text: '> ', color: LIGHT },
      { text: linkTaskInput, color: WHITE },
      { text: '█', color: GRAY },
    ], W)));
    rows.push(blank(W));

    if (feedback) {
      rows.push(segRow(padSegs([
        { text: `  ${feedback}`, color: LIGHT },
      ], W)));
    } else {
      rows.push(segRow(padSegs([
        { text: '  Enter', color: LIGHT },
        { text: ' confirm  ', color: DIM },
        { text: 'Esc', color: LIGHT },
        { text: ' cancel', color: DIM },
      ], W)));
    }

    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W));
    return rows;
  }

  // ── Status mode rendering ─────────────────────────────────

  // Branch info
  const branchName = git.branch || 'HEAD (detached)';
  rows.push(segRow(padSegs([
    { text: '  On branch  ', color: GRAY },
    { text: branchName, color: WHITE },
    { text: '    ', color: WHITE },
    { text: git.hasChanges ? '● Uncommitted changes' : '● Clean', color: git.hasChanges ? LIGHT : GRAY },
  ], W)));
  rows.push(blank(W));

  // Remote info
  if (git.remoteInfo) {
    rows.push(segRow(padSegs([
      { text: '  Remote  ', color: GRAY },
      { text: git.remoteInfo.provider, color: LIGHT },
      { text: ':', color: DIM },
      { text: `${git.remoteInfo.owner}/${git.remoteInfo.repo}`, color: WHITE },
    ], W)));
  } else if (git.remoteUrl) {
    rows.push(segRow(padSegs([
      { text: '  Remote  ', color: GRAY },
      { text: git.remoteUrl, color: LIGHT },
    ], W)));
  } else {
    rows.push(segRow(padSegs([
      { text: '  No remote configured', color: DIM },
    ], W)));
  }

  // Hook status
  rows.push(segRow(padSegs([
    { text: '  Hooks   ', color: GRAY },
    { text: git.hooksInstalled ? 'Installed' : 'Not installed', color: git.hooksInstalled ? LIGHT : DIM },
  ], W)));

  rows.push(blank(W));

  // Feedback line (if any)
  if (feedback) {
    rows.push(segRow(padSegs([
      { text: `  ${feedback}`, color: LIGHT },
    ], W)));
    rows.push(blank(W));
  }

  // Staged section
  rows.push(section('Staged', W));
  rows.push(blank(W));

  if (git.stagedFiles.length > 0) {
    for (let i = 0; i < git.stagedFiles.length; i++) {
      const f = git.stagedFiles[i];
      const globalIdx = i; // staged files are first in allFiles
      const isSelected = selectedFileIndex === globalIdx;
      const label = fileStatusLabel({ ...f, staged: true });
      const row: Row = segRow(padSegs([
        { text: isSelected ? '  > ' : '    ', color: isSelected ? WHITE : GRAY },
        { text: label, color: WHITE },
        { text: '  ', color: WHITE },
        { text: f.path, color: WHITE },
      ], W), isSelected ? DARK : undefined);
      rows.push(row);
    }
  } else {
    rows.push(segRow(padSegs([
      { text: '    No staged changes', color: DIM },
    ], W)));
  }

  rows.push(blank(W));

  // Unstaged section
  rows.push(section('Unstaged', W));
  rows.push(blank(W));

  if (git.unstagedFiles.length > 0) {
    for (let i = 0; i < git.unstagedFiles.length; i++) {
      const f = git.unstagedFiles[i];
      const globalIdx = stagedCount + i; // offset by staged files
      const isSelected = selectedFileIndex === globalIdx;
      const label = fileStatusLabel({ ...f, staged: false });
      rows.push(segRow(padSegs([
        { text: isSelected ? '  > ' : '    ', color: isSelected ? WHITE : GRAY },
        { text: label, color: GRAY },
        { text: '  ', color: WHITE },
        { text: f.path, color: GRAY },
      ], W), isSelected ? DARK : undefined));
    }
  } else {
    rows.push(segRow(padSegs([
      { text: '    No unstaged changes', color: DIM },
    ], W)));
  }

  rows.push(blank(W));

  // Recent commits
  rows.push(section('Recent Commits', W));
  rows.push(blank(W));

  if (git.commits.length === 0) {
    rows.push(segRow(padSegs([
      { text: '    No commits yet', color: DIM },
    ], W)));
  } else {
    for (const c of git.commits.slice(0, 8)) {
      const hash = c.hash.slice(0, 7);
      const age = relativeTime(c.date);
      const maxMsg = W - 8 - hash.length - age.length - 4;
      const msg = c.message.length > maxMsg
        ? c.message.slice(0, maxMsg - 1) + '\u2026'
        : c.message;
      rows.push(segRow(padSegs([
        { text: '    ', color: WHITE },
        { text: hash, color: GRAY },
        { text: '  ', color: WHITE },
        { text: msg, color: WHITE },
        { text: rep(' ', Math.max(1, W - 8 - hash.length - msg.length - age.length)), color: WHITE },
        { text: age, color: DIM },
      ], W)));
    }
  }

  // Keyboard hints
  const hints = busy
    ? '  working...'
    : '  Space stage  s all  u unstage  c commit  l link  r refresh';

  fillTo(rows, H - 2, W);
  rows.push(...pageFooter(W, hints));
  return rows;
}
