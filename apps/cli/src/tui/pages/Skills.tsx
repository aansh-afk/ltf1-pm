/**
 * Skills Page - User skills list and skill library
 * Keys: j/k navigate, t toggle, r run, Enter details
 */

import { useState, useCallback, useRef } from 'react';
import { useInput } from 'ink';
import { useConvexQuery } from '../hooks/useConvex.js';
import { useConfig } from '../hooks/useConfig.js';
import { api, getClient } from '../../lib/convex.js';
import { getAuth, isAuthenticated } from '../../lib/config.js';
import type { Row } from '../types.js';
import { theme, WHITE, LIGHT, GRAY, DIM } from '../theme.js';
import {
  segRow, blank, padSegs, fillTo, rep, truncate,
  pageHeader, pageFooter, section,
} from '../helpers.js';

const PURPLE = theme.purple;

interface Skill {
  _id: string;
  name: string;
  mode: 'auto' | 'manual';
  active: boolean;
  usageCount: number;
}

interface LibrarySkill {
  _id: string;
  name: string;
  description: string;
  installed: boolean;
}

export interface SkillsPageProps {
  width: number;
  height: number;
  isActive: boolean;
}

export function useSkillsPage({ width: W, height: H, isActive }: SkillsPageProps): Row[] {
  const config = useConfig();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const skillsQuery = useConvexQuery(
    api.skills.queries.getUserSkills,
    config.workspaceId ? { workspaceId: config.workspaceId as never } : null,
    15000,
  );
  const libraryQuery = useConvexQuery(
    api.skills.queries.getSkillLibrary,
    config.workspaceId ? { workspaceId: config.workspaceId as never } : null,
    30000,
  );

  const skills = (skillsQuery.data as Skill[] | null) || [];
  const library = (libraryQuery.data as LibrarySkill[] | null) || [];
  const uninstalled = library.filter(s => !s.installed);

  const showFeedback = useCallback((msg: string) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback(msg);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 2000);
  }, []);

  const toggleSkill = useCallback(async (skill: Skill) => {
    if (!isAuthenticated()) return;
    try {
      const client = getClient();
      const auth = getAuth();
      if (auth?.token) client.setAuth(auth.token);
      await client.mutation(api.skills.mutations.toggleSkill, {
        skillId: skill._id as never,
      } as never);
      showFeedback(`${skill.name} ${skill.active ? 'deactivated' : 'activated'}`);
      skillsQuery.refetch();
    } catch {
      showFeedback('Toggle failed');
    }
  }, [showFeedback, skillsQuery]);

  useInput((input, key) => {
    if (!isActive) return;

    if (input === 'j' || key.downArrow) {
      setSelectedIndex(prev => Math.min(skills.length - 1, prev + 1));
    }
    if (input === 'k' || key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    }

    // Toggle active/inactive
    if (input === 't' && skills[selectedIndex]) {
      toggleSkill(skills[selectedIndex]);
    }
  }, { isActive });

  // ── Render ──
  const rows: Row[] = [];
  rows.push(...pageHeader('Skills', '', W));
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

  // ── Your Skills ──
  rows.push(section('YOUR SKILLS', W));
  rows.push(blank(W));

  if (skillsQuery.loading && skills.length === 0) {
    rows.push(segRow(padSegs([
      { text: '    Loading skills...', color: GRAY },
    ], W)));
  } else if (skills.length === 0) {
    rows.push(segRow(padSegs([
      { text: '    No skills configured yet', color: DIM },
    ], W)));
    rows.push(segRow(padSegs([
      { text: '    Install skills from the library below.', color: DIM },
    ], W)));
  } else {
    for (let i = 0; i < skills.length; i++) {
      const s = skills[i];
      const isSelected = i === selectedIndex;
      const icon = s.mode === 'auto' ? '\u26A1' : '\u25C6';
      const modeLabel = s.mode.toUpperCase().padEnd(6);
      const statusDot = s.active ? '\u25CF' : '\u25CB';
      const statusLabel = s.active ? 'Active' : 'Inactive';
      const statusColor = s.active ? theme.green : DIM;
      const usedStr = `Used: ${s.usageCount}x`;
      const nameMax = W - 50;
      const name = truncate(s.name, nameMax);

      if (isSelected) {
        const line = `  > ${icon} ${name}${rep(' ', Math.max(1, nameMax - name.length + 2))}${modeLabel}  ${statusDot} ${statusLabel}    ${usedStr}`;
        rows.push({
          segments: padSegs([
            { text: truncate(line, W), color: '#000000' },
          ], W),
          bgColor: PURPLE,
        });
      } else {
        rows.push(segRow(padSegs([
          { text: '    ', color: WHITE },
          { text: icon + ' ', color: s.mode === 'auto' ? theme.amber : PURPLE },
          { text: name, color: LIGHT },
          { text: rep(' ', Math.max(1, nameMax - name.length + 2)), color: WHITE },
          { text: modeLabel, color: GRAY },
          { text: '  ', color: WHITE },
          { text: statusDot + ' ', color: statusColor },
          { text: statusLabel, color: statusColor },
          { text: '    ', color: WHITE },
          { text: usedStr, color: DIM },
        ], W)));
      }
    }
  }
  rows.push(blank(W));

  // ── Skill Library ──
  rows.push(section('SKILL LIBRARY', W));
  rows.push(blank(W));

  if (uninstalled.length === 0) {
    rows.push(segRow(padSegs([
      { text: '    Available built-in skills to install', color: GRAY },
    ], W)));
    rows.push(segRow(padSegs([
      { text: '    (No additional skills available)', color: DIM },
    ], W)));
  } else {
    for (const lib of uninstalled.slice(0, 5)) {
      rows.push(segRow(padSegs([
        { text: '    ', color: WHITE },
        { text: '\u25CB ', color: DIM },
        { text: truncate(lib.name, 20).padEnd(22), color: LIGHT },
        { text: truncate(lib.description, W - 30), color: DIM },
      ], W)));
    }
  }

  fillTo(rows, H - 2, W);
  rows.push(...pageFooter(W, 'T Toggle  R Run  J/K Nav'));
  return rows;
}
