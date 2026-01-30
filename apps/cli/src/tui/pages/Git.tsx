/**
 * Git Page - Real local git status from simple-git
 * Shows branch, changes, branches, recent commits, remote info, hook status
 */

// Git page hook (no JSX)
import { useGitStatus } from '../hooks/useGitStatus.js';
import type { Row } from '../types.js';
import { WHITE, LIGHT, GRAY, DIM } from '../theme.js';
import {
  segRow, blank, padSegs, fillTo, rep, pad,
  pageHeader, pageFooter, section, relativeTime,
} from '../helpers.js';

export interface GitPageProps {
  width: number;
  height: number;
  timeStr: string;
  isActive?: boolean;
}

export function useGitPage({ width: W, height: H, timeStr, isActive = true }: GitPageProps): Row[] {
  const git = useGitStatus(5000, isActive);
  const rows: Row[] = [];

  rows.push(...pageHeader('Git', timeStr, W));
  rows.push(blank(W));

  if (git.loading && !git.branch) {
    rows.push(segRow(padSegs([
      { text: '  Loading git status...', color: GRAY },
    ], W)));
    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W));
    return rows;
  }

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

  // Staged changes
  rows.push(section('Changes', W));
  rows.push(blank(W));

  if (git.stagedFiles.length > 0) {
    for (const f of git.stagedFiles.slice(0, 8)) {
      rows.push(segRow(padSegs([
        { text: '    ', color: WHITE },
        { text: 'staged', color: LIGHT },
        { text: '      ', color: WHITE },
        { text: f.path, color: WHITE },
      ], W)));
    }
    if (git.stagedFiles.length > 8) {
      rows.push(segRow(padSegs([
        { text: `    ... and ${git.stagedFiles.length - 8} more staged`, color: DIM },
      ], W)));
    }
  } else {
    rows.push(segRow(padSegs([
      { text: '    No staged changes', color: DIM },
    ], W)));
  }

  rows.push(blank(W));

  if (git.unstagedFiles.length > 0) {
    for (const f of git.unstagedFiles.slice(0, 5)) {
      const label = f.working === '?' ? 'untracked' : 'modified';
      rows.push(segRow(padSegs([
        { text: '    ', color: WHITE },
        { text: pad(label, 10), color: GRAY },
        { text: '  ', color: WHITE },
        { text: f.path, color: GRAY },
      ], W)));
    }
    if (git.unstagedFiles.length > 5) {
      rows.push(segRow(padSegs([
        { text: `    ... and ${git.unstagedFiles.length - 5} more`, color: DIM },
      ], W)));
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
        ? c.message.slice(0, maxMsg - 1) + '…'
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

  fillTo(rows, H - 2, W);
  rows.push(...pageFooter(W));
  return rows;
}
