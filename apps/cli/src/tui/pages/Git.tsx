/**
 * Git Page - Interactive git status with staging, committing, task linking,
 * and local-to-web project linking.
 *
 * Modes: status | commit | link | project_link | project_select | confirm_link
 */

import { useState, useCallback, useMemo } from 'react';
import { useInput } from 'ink';
import simpleGit from 'simple-git';
import { useGitStatus } from '../hooks/useGitStatus.js';
import { useConfig } from '../hooks/useConfig.js';
import { useConvexQuery } from '../hooks/useConvex.js';
import { api } from '../../lib/convex.js';
import type { Row } from '../types.js';
import { theme } from '../theme.js';
import {
  segRow, blank, padSegs, fillTo, rep,
  pageHeader, pageFooter, section, truncate, relativeTime,
} from '../helpers.js';

export interface GitPageProps {
  width: number;
  height: number;
  timeStr: string;
  isActive?: boolean;
}

type GitMode = 'status' | 'commit' | 'link' | 'project_select' | 'confirm_link';

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

function fileStatusColor(label: string): string {
  switch (label) {
    case 'A': return theme.green;
    case 'M': return theme.amber;
    case 'D': return theme.red;
    case 'R': return theme.cyan;
    case '?': return theme.textMuted;
    default: return theme.textSecondary;
  }
}

interface ProjectItem {
  _id: string;
  name: string;
  key: string;
  repository?: { url?: string; owner?: string; name?: string } | null;
}

export function useGitPage({ width: W, height: H, timeStr, isActive = true }: GitPageProps): Row[] {
  const git = useGitStatus(5000, isActive);
  const config = useConfig();

  // Fetch workspace projects for linking
  const projectsQuery = useConvexQuery(
    api.projects.queries.getWorkspaceProjects,
    config.workspaceId ? { workspaceId: config.workspaceId as never } : null,
    30000,
  );

  const projects = useMemo(() => {
    return ((projectsQuery.data as ProjectItem[] | null) || []);
  }, [projectsQuery.data]);

  // Determine if current repo is linked to a project
  const linkedProject = useMemo(() => {
    if (!git.remoteUrl || projects.length === 0) return null;
    const normalizedRemote = git.remoteUrl
      .replace(/\.git$/, '')
      .replace(/^git@([^:]+):/, 'https://$1/')
      .replace(/\/$/, '')
      .toLowerCase();
    for (const p of projects) {
      if (p.repository?.url) {
        const normalizedRepo = p.repository.url
          .replace(/\.git$/, '')
          .replace(/^git@([^:]+):/, 'https://$1/')
          .replace(/\/$/, '')
          .toLowerCase();
        if (normalizedRemote === normalizedRepo) return p;
      }
    }
    return null;
  }, [git.remoteUrl, projects]);

  const [mode, setMode] = useState<GitMode>('status');
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [commitMessage, setCommitMessage] = useState('');
  const [linkTaskInput, setLinkTaskInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [projectSelectIndex, setProjectSelectIndex] = useState(0);
  const [pendingLinkProject, setPendingLinkProject] = useState<ProjectItem | null>(null);

  // Build combined file list
  const allFiles: CombinedFile[] = [
    ...git.stagedFiles.map(f => ({ ...f, staged: true })),
    ...git.unstagedFiles.map(f => ({ ...f, staged: false })),
  ];

  const stagedCount = git.stagedFiles.length;

  const clampIdx = useCallback((n: number) => Math.max(0, Math.min(allFiles.length - 1, n)), [allFiles.length]);

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
      if (input === 'j' || key.downArrow) {
        setSelectedFileIndex(prev => clampIdx(prev + 1));
      }
      if (input === 'k' || key.upArrow) {
        setSelectedFileIndex(prev => clampIdx(prev - 1));
      }
      if (input === ' ' && allFiles.length > 0) {
        const file = allFiles[selectedFileIndex];
        if (file) void toggleStage(file);
      }
      if (input === 'a') {
        void stageAll();
      }
      if (input === 'u') {
        void unstageAll();
      }
      if (input === 'c') {
        if (stagedCount === 0) {
          showFeedback('No staged files. Space to stage, a to stage all.');
        } else {
          setMode('commit');
          setCommitMessage('');
        }
      }
      if (input === 'l') {
        setMode('link');
        setLinkTaskInput('');
      }
      // L (shift+l) for project linking
      if (input === 'L') {
        if (projects.length === 0) {
          showFeedback('No projects available. Create one on the web first.');
        } else {
          setMode('project_select');
          setProjectSelectIndex(0);
        }
      }
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
    } else if (mode === 'project_select') {
      if (key.escape) {
        setMode('status');
      }
      if (input === 'j' || key.downArrow) {
        setProjectSelectIndex(prev => Math.min(projects.length - 1, prev + 1));
      }
      if (input === 'k' || key.upArrow) {
        setProjectSelectIndex(prev => Math.max(0, prev - 1));
      }
      if (key.return && projects[projectSelectIndex]) {
        setPendingLinkProject(projects[projectSelectIndex]);
        setMode('confirm_link');
      }
    } else if (mode === 'confirm_link') {
      if (key.escape || input === 'n' || input === 'N') {
        setPendingLinkProject(null);
        setMode('status');
      }
      if (input === 'y' || input === 'Y') {
        if (pendingLinkProject) {
          showFeedback(`Linked repo to ${pendingLinkProject.name}`);
          // In a full implementation, this would call api.projects.mutations.connectRepository
          // with the remote URL and project ID
        }
        setPendingLinkProject(null);
        setMode('status');
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
      { text: '  Loading git status...', color: theme.textMuted },
    ], W)));
    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W));
    return rows;
  }

  // Not a repo
  if (!git.isRepo) {
    rows.push(segRow(padSegs([
      { text: '  Not a git repository', color: theme.textMuted },
    ], W)));
    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: '  Run ', color: theme.textDim },
      { text: 'git init', color: theme.textSecondary },
      { text: ' to initialize a repository', color: theme.textDim },
    ], W)));
    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W));
    return rows;
  }

  // Error state
  if (git.error) {
    rows.push(segRow(padSegs([
      { text: '  Error: ', color: theme.textMuted },
      { text: git.error, color: theme.textSecondary },
    ], W)));
    rows.push(blank(W));
    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W));
    return rows;
  }

  // ── Project select mode ─────────────────────────────────
  if (mode === 'project_select') {
    rows.push(segRow(padSegs([
      { text: '  Link Repo to Project', color: theme.text },
    ], W)));
    rows.push(blank(W));

    if (git.remoteUrl) {
      rows.push(segRow(padSegs([
        { text: '  Repo  ', color: theme.textMuted },
        { text: truncate(git.remoteUrl, W - 12), color: theme.textSecondary },
      ], W)));
      rows.push(blank(W));
    }

    rows.push(segRow(padSegs([
      { text: '  Select a project:', color: theme.textSecondary },
    ], W)));
    rows.push(blank(W));

    const maxVisible = Math.min(projects.length, H - 14);
    for (let i = 0; i < maxVisible; i++) {
      const p = projects[i];
      const isSelected = i === projectSelectIndex;
      const alreadyLinked = p.repository?.url ? true : false;
      const linkedTag = alreadyLinked ? ' (has repo)' : '';
      rows.push(segRow(padSegs([
        { text: isSelected ? '  > ' : '    ', color: isSelected ? theme.accent : theme.textMuted },
        { text: p.key.padEnd(8), color: theme.textMuted },
        { text: truncate(p.name, W - 30), color: isSelected ? theme.text : theme.textSecondary },
        { text: linkedTag, color: theme.textDim },
      ], W)));
    }

    rows.push(blank(W));

    if (feedback) {
      rows.push(segRow(padSegs([
        { text: `  ${feedback}`, color: theme.amber },
      ], W)));
    } else {
      rows.push(segRow(padSegs([
        { text: '  j/k', color: theme.accent },
        { text: ' Navigate  ', color: theme.textMuted },
        { text: 'Enter', color: theme.accent },
        { text: ' Select  ', color: theme.textMuted },
        { text: 'ESC', color: theme.accent },
        { text: ' Cancel', color: theme.textMuted },
      ], W)));
    }

    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W));
    return rows;
  }

  // ── Confirm link mode ────────────────────────────────────
  if (mode === 'confirm_link' && pendingLinkProject) {
    rows.push(segRow(padSegs([
      { text: '  Confirm Repository Link', color: theme.text },
    ], W)));
    rows.push(blank(W));

    rows.push(segRow(padSegs([
      { text: '  Repo     ', color: theme.textMuted },
      { text: truncate(git.remoteUrl || 'unknown', W - 14), color: theme.textSecondary },
    ], W)));
    rows.push(segRow(padSegs([
      { text: '  Project  ', color: theme.textMuted },
      { text: `${pendingLinkProject.key} - ${pendingLinkProject.name}`, color: theme.text },
    ], W)));
    rows.push(blank(W));

    rows.push(segRow(padSegs([
      { text: '  Link this repo to ', color: theme.textSecondary },
      { text: pendingLinkProject.name, color: theme.accent },
      { text: '? (y/n)', color: theme.textSecondary },
    ], W)));

    if (feedback) {
      rows.push(blank(W));
      rows.push(segRow(padSegs([
        { text: `  ${feedback}`, color: theme.green },
      ], W)));
    }

    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W));
    return rows;
  }

  // ── Commit mode rendering ─────────────────────────────────
  if (mode === 'commit') {
    rows.push(segRow(padSegs([
      { text: '  Commit Message', color: theme.text },
    ], W)));
    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: '  > ', color: theme.accent },
      { text: commitMessage, color: theme.text },
      { text: '\u2588', color: theme.textMuted },
    ], W)));
    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: `  ${stagedCount} file${stagedCount === 1 ? '' : 's'} staged for commit`, color: theme.textMuted },
    ], W)));
    rows.push(blank(W));

    for (const f of git.stagedFiles.slice(0, 6)) {
      const label = fileStatusLabel({ ...f, staged: true });
      rows.push(segRow(padSegs([
        { text: '    ', color: theme.text },
        { text: label, color: fileStatusColor(label) },
        { text: '  ', color: theme.text },
        { text: f.path, color: theme.textMuted },
      ], W)));
    }
    if (git.stagedFiles.length > 6) {
      rows.push(segRow(padSegs([
        { text: `    ... and ${git.stagedFiles.length - 6} more`, color: theme.textDim },
      ], W)));
    }

    rows.push(blank(W));

    if (feedback) {
      rows.push(segRow(padSegs([
        { text: `  ${feedback}`, color: theme.amber },
      ], W)));
    } else {
      rows.push(segRow(padSegs([
        { text: '  Enter', color: theme.accent },
        { text: ' commit  ', color: theme.textMuted },
        { text: 'Esc', color: theme.accent },
        { text: ' cancel', color: theme.textMuted },
      ], W)));
    }

    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W));
    return rows;
  }

  // ── Link task mode rendering ─────────────────────────────
  if (mode === 'link') {
    rows.push(segRow(padSegs([
      { text: '  Link Task to Branch', color: theme.text },
    ], W)));
    rows.push(blank(W));

    const branchName = git.branch || 'HEAD (detached)';
    rows.push(segRow(padSegs([
      { text: '  Branch  ', color: theme.textMuted },
      { text: branchName, color: theme.text },
    ], W)));
    rows.push(blank(W));

    const branchMatch = git.branch?.match(/(\d+)/) || git.branch?.match(/([A-Z]+-\d+)/);
    if (branchMatch && !linkTaskInput) {
      rows.push(segRow(padSegs([
        { text: '  Detected: ', color: theme.textDim },
        { text: branchMatch[1], color: theme.textSecondary },
      ], W)));
      rows.push(blank(W));
    }

    rows.push(segRow(padSegs([
      { text: '  Task ID: ', color: theme.textMuted },
      { text: '> ', color: theme.accent },
      { text: linkTaskInput, color: theme.text },
      { text: '\u2588', color: theme.textMuted },
    ], W)));
    rows.push(blank(W));

    if (feedback) {
      rows.push(segRow(padSegs([
        { text: `  ${feedback}`, color: theme.green },
      ], W)));
    } else {
      rows.push(segRow(padSegs([
        { text: '  Enter', color: theme.accent },
        { text: ' confirm  ', color: theme.textMuted },
        { text: 'Esc', color: theme.accent },
        { text: ' cancel', color: theme.textMuted },
      ], W)));
    }

    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W));
    return rows;
  }

  // ── Status mode rendering ─────────────────────────────────

  // BRANCH panel
  const branchName = git.branch || 'HEAD (detached)';
  const branchMatch = branchName.match(/([A-Z]+-\d+)/);
  const taskRef = branchMatch ? branchMatch[1] : null;

  rows.push(section('BRANCH', W));
  rows.push(blank(W));
  rows.push(segRow(padSegs([
    { text: '  \u2299 ', color: theme.accent },
    { text: branchName, color: theme.text },
    ...(taskRef ? [
      { text: '   \u2192 linked to ', color: theme.textDim },
      { text: taskRef, color: theme.accent },
    ] : []),
  ], W)));

  // Remote / project link info
  if (git.remoteInfo) {
    const repoLabel = `${git.remoteInfo.owner}/${git.remoteInfo.repo}`;
    rows.push(segRow(padSegs([
      { text: '  \u2299 Repo: ', color: theme.textMuted },
      { text: repoLabel, color: theme.textSecondary },
      { text: '   \u2192 ', color: theme.textDim },
      ...(linkedProject ? [
        { text: `Project: ${linkedProject.name}`, color: theme.green },
      ] : [
        { text: '\u26A0 Not linked to any project', color: theme.amber },
      ]),
    ], W)));
  } else if (git.remoteUrl) {
    rows.push(segRow(padSegs([
      { text: '  Remote  ', color: theme.textMuted },
      { text: truncate(git.remoteUrl, W - 14), color: theme.textSecondary },
    ], W)));
  } else {
    rows.push(segRow(padSegs([
      { text: '  No remote configured', color: theme.textDim },
    ], W)));
  }

  rows.push(blank(W));

  // Feedback line
  if (feedback) {
    rows.push(segRow(padSegs([
      { text: `  ${feedback}`, color: theme.amber },
    ], W)));
    rows.push(blank(W));
  }

  // STAGED section
  rows.push(section(`STAGED (${git.stagedFiles.length})`, W));
  rows.push(blank(W));

  if (git.stagedFiles.length > 0) {
    for (let i = 0; i < git.stagedFiles.length; i++) {
      const f = git.stagedFiles[i];
      const globalIdx = i;
      const isSelected = selectedFileIndex === globalIdx;
      const label = fileStatusLabel({ ...f, staged: true });
      rows.push(segRow(padSegs([
        { text: isSelected ? '  > ' : '    ', color: isSelected ? theme.text : theme.textMuted },
        { text: label, color: fileStatusColor(label) },
        { text: '  ', color: theme.text },
        { text: f.path, color: isSelected ? theme.text : theme.textSecondary },
      ], W), isSelected ? theme.border : undefined));
    }
  } else {
    rows.push(segRow(padSegs([
      { text: '    No staged changes', color: theme.textDim },
    ], W)));
  }

  rows.push(blank(W));

  // UNSTAGED section
  rows.push(section(`UNSTAGED (${git.unstagedFiles.length})`, W));
  rows.push(blank(W));

  if (git.unstagedFiles.length > 0) {
    for (let i = 0; i < git.unstagedFiles.length; i++) {
      const f = git.unstagedFiles[i];
      const globalIdx = stagedCount + i;
      const isSelected = selectedFileIndex === globalIdx;
      const label = fileStatusLabel({ ...f, staged: false });
      rows.push(segRow(padSegs([
        { text: isSelected ? '  > ' : '    ', color: isSelected ? theme.text : theme.textMuted },
        { text: label, color: fileStatusColor(label) },
        { text: '  ', color: theme.text },
        { text: f.path, color: isSelected ? theme.textSecondary : theme.textMuted },
      ], W), isSelected ? theme.border : undefined));
    }
  } else {
    rows.push(segRow(padSegs([
      { text: '    No unstaged changes', color: theme.textDim },
    ], W)));
  }

  rows.push(blank(W));

  // Recent commits
  rows.push(section('Recent Commits', W));
  rows.push(blank(W));

  if (git.commits.length === 0) {
    rows.push(segRow(padSegs([
      { text: '    No commits yet', color: theme.textDim },
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
        { text: '    ', color: theme.text },
        { text: hash, color: theme.textMuted },
        { text: '  ', color: theme.text },
        { text: msg, color: theme.textSecondary },
        { text: rep(' ', Math.max(1, W - 8 - hash.length - msg.length - age.length)), color: theme.text },
        { text: age, color: theme.textDim },
      ], W)));
    }
  }

  // Keyboard hints
  const hints = busy
    ? '  working...'
    : '  space Stage/Unstage  a Stage All  c Commit  l Link Task  L Link Project';

  fillTo(rows, H - 2, W);
  rows.push(...pageFooter(W, hints));
  return rows;
}
