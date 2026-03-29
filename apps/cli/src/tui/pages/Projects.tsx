/**
 * Projects Page - Project list with workspace context
 * Keys: j/k navigate, Enter select, i info, r connect repo
 */

import { useState, useCallback } from 'react';
import { useInput } from 'ink';
import { useConvexQuery } from '../hooks/useConvex.js';
import { useConfig } from '../hooks/useConfig.js';
import { api } from '../../lib/convex.js';
import { setContext } from '../../lib/config.js';
import type { Row } from '../types.js';
import { theme, WHITE, LIGHT, GRAY, DIM } from '../theme.js';
import {
  segRow, blank, padSegs, fillTo, rep, truncate,
  pageHeader, pageFooter, section,
} from '../helpers.js';

const ACCENT = theme.accent;

interface ProjectItem {
  _id: string;
  name: string;
  key: string;
  status: string;
  taskCount?: number;
  activeSprint?: string;
  repoLinked?: boolean;
}

export interface ProjectsPageProps {
  width: number;
  height: number;
  isActive: boolean;
}

export function useProjectsPage({ width: W, height: H, isActive }: ProjectsPageProps): Row[] {
  const config = useConfig();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const projectsQuery = useConvexQuery(
    api.projects.queries.getWorkspaceProjects,
    config.workspaceId ? { workspaceId: config.workspaceId as never } : null,
    15000,
  );

  const projects = (projectsQuery.data as ProjectItem[] | null) || [];

  const selectProject = useCallback((project: ProjectItem) => {
    setContext({
      projectId: project._id,
      projectKey: project.key,
      projectName: project.name,
    });
    setFeedback(`Active project: ${project.name}`);
    setTimeout(() => setFeedback(null), 2000);
  }, []);

  useInput((input, key) => {
    if (!isActive) return;

    if (input === 'j' || key.downArrow) {
      setSelectedIndex(prev => Math.min(projects.length - 1, prev + 1));
    }
    if (input === 'k' || key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    }

    // Select project as active
    if (key.return && projects[selectedIndex]) {
      selectProject(projects[selectedIndex]);
    }
  }, { isActive });

  // ── Render ──
  const rows: Row[] = [];
  rows.push(...pageHeader('Projects', '', W));
  rows.push(blank(W));

  // ── Feedback ──
  if (feedback) {
    rows.push(segRow(padSegs([
      { text: '    ', color: WHITE },
      { text: '\u2713 ', color: theme.green },
      { text: feedback, color: LIGHT },
    ], W)));
    rows.push(blank(W));
  }

  // ── Active context ──
  if (config.projectName) {
    rows.push(segRow(padSegs([
      { text: '    Active: ', color: DIM },
      { text: config.projectName, color: ACCENT },
      { text: config.projectKey ? ` (${config.projectKey})` : '', color: GRAY },
    ], W)));
    rows.push(blank(W));
  }

  // ── Projects list ──
  rows.push(section('PROJECTS', W));
  rows.push(blank(W));

  if (projectsQuery.loading && projects.length === 0) {
    rows.push(segRow(padSegs([
      { text: '    Loading projects...', color: GRAY },
    ], W)));
  } else if (!config.workspaceId) {
    rows.push(segRow(padSegs([
      { text: '    Select a workspace first (press D for dashboard)', color: DIM },
    ], W)));
  } else if (projects.length === 0) {
    rows.push(segRow(padSegs([
      { text: '    No projects in this workspace', color: DIM },
    ], W)));
    rows.push(segRow(padSegs([
      { text: '    Create a project at app.ltf1.com', color: DIM },
    ], W)));
  } else {
    for (let i = 0; i < projects.length; i++) {
      const p = projects[i];
      const isSelected = i === selectedIndex;
      const isActive = p._id === config.projectId;
      const icon = isActive ? '\u25C6' : '\u25C7';
      const taskStr = p.taskCount != null ? `${p.taskCount} tasks` : '';
      const sprintStr = p.activeSprint || '\u2014';
      const repoIcon = p.repoLinked ? '\u2299 linked' : '\u25CB no repo';
      const repoColor = p.repoLinked ? theme.green : DIM;
      const nameMax = W - 55;
      const name = truncate(p.name, nameMax);

      if (isSelected) {
        const line = `  > ${icon} ${name}${rep(' ', Math.max(1, nameMax - name.length + 2))}${taskStr.padEnd(12)}${sprintStr.padEnd(12)}${repoIcon}`;
        rows.push({
          segments: padSegs([
            { text: truncate(line, W), color: '#000000' },
          ], W),
          bgColor: ACCENT,
        });
      } else {
        rows.push(segRow(padSegs([
          { text: `  ${isSelected ? '>' : ' '} `, color: WHITE },
          { text: icon + ' ', color: isActive ? ACCENT : GRAY },
          { text: name, color: isActive ? WHITE : LIGHT },
          { text: rep(' ', Math.max(1, nameMax - name.length + 2)), color: WHITE },
          { text: taskStr.padEnd(12), color: GRAY },
          { text: sprintStr.padEnd(12), color: DIM },
          { text: repoIcon, color: repoColor },
        ], W)));
      }
    }
  }

  fillTo(rows, H - 2, W);
  rows.push(...pageFooter(W, '\u23CE Select  I Info  J/K Nav'));
  return rows;
}
