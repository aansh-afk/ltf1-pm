/**
 * Settings Page - Triage mode, auto-update, connection info
 * Keys: j/k navigate, Enter toggle/select, q back
 */

import { useState, useCallback } from 'react';
import { useInput } from 'ink';
import { useAuth } from '../hooks/useAuth.js';
import { useConfig } from '../hooks/useConfig.js';
import { clearAuth, getPreferences, setPreference } from '../../lib/config.js';
import type { Row } from '../types.js';
import { theme, WHITE, LIGHT, GRAY, DIM } from '../theme.js';
import {
  segRow, blank, padSegs, fillTo,
  pageHeader, pageFooter, section,
} from '../helpers.js';

type TriageMode = 'auto' | 'review' | 'off';

interface SettingsSection {
  label: string;
  type: 'radio' | 'toggle' | 'info' | 'action';
}

const SECTIONS: SettingsSection[] = [
  { label: 'Auto', type: 'radio' },
  { label: 'Review', type: 'radio' },
  { label: 'Off', type: 'radio' },
  { label: 'Auto-update', type: 'toggle' },
  { label: 'Logout', type: 'action' },
];

const VERSION = 'v0.1.0-beta.3';

export interface SettingsPageProps {
  width: number;
  height: number;
  isActive: boolean;
}

export function useSettingsPage({ width: W, height: H, isActive }: SettingsPageProps): Row[] {
  const auth = useAuth();
  const config = useConfig();
  const prefs = getPreferences();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [triageMode, setTriageMode] = useState<TriageMode>('review');
  const [autoUpdate, setAutoUpdate] = useState(prefs?.autoSync ?? true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const showFeedback = useCallback((msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2000);
  }, []);

  useInput((input, key) => {
    if (!isActive) return;

    if (input === 'j' || key.downArrow) {
      setSelectedIndex(prev => Math.min(SECTIONS.length - 1, prev + 1));
    }
    if (input === 'k' || key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    }

    if (key.return) {
      const current = SECTIONS[selectedIndex];
      if (!current) return;

      // Triage mode radio buttons
      if (current.label === 'Auto') {
        setTriageMode('auto');
        showFeedback('Triage mode: Auto');
      } else if (current.label === 'Review') {
        setTriageMode('review');
        showFeedback('Triage mode: Review');
      } else if (current.label === 'Off') {
        setTriageMode('off');
        showFeedback('Triage mode: Off');
      }

      // Auto-update toggle
      if (current.label === 'Auto-update') {
        const next = !autoUpdate;
        setAutoUpdate(next);
        setPreference('autoSync', next);
        showFeedback(`Auto-update: ${next ? 'Enabled' : 'Disabled'}`);
      }

      // Logout
      if (current.label === 'Logout') {
        clearAuth();
        showFeedback('Logged out');
      }
    }
  }, { isActive });

  // ── Render ──
  const rows: Row[] = [];
  rows.push(...pageHeader('Settings', '', W));
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

  // ── Triage Mode ──
  rows.push(section('TRIAGE MODE', W));
  rows.push(blank(W));

  const triageOptions: Array<{ value: TriageMode; label: string; desc: string }> = [
    { value: 'auto', label: 'Auto', desc: 'Agent applies suggestions automatically' },
    { value: 'review', label: 'Review', desc: 'Agent suggests, you decide' },
    { value: 'off', label: 'Off', desc: 'No automatic triage' },
  ];

  for (let i = 0; i < triageOptions.length; i++) {
    const opt = triageOptions[i];
    const isSelected = i === selectedIndex;
    const isChosen = triageMode === opt.value;
    const radio = isChosen ? '\u25CF' : '\u25CB';
    const radioColor = isChosen ? theme.accent : DIM;

    if (isSelected) {
      const line = `    ${radio} ${opt.label.padEnd(10)} ${opt.desc}`;
      rows.push({
        segments: padSegs([
          { text: line, color: '#000000' },
        ], W),
        bgColor: theme.accent,
      });
    } else {
      rows.push(segRow(padSegs([
        { text: '    ', color: WHITE },
        { text: radio + ' ', color: radioColor },
        { text: opt.label.padEnd(10), color: isChosen ? WHITE : GRAY },
        { text: ' ' + opt.desc, color: DIM },
      ], W)));
    }
  }
  rows.push(blank(W));

  // ── Auto-Update ──
  rows.push(section('AUTO-UPDATE', W));
  rows.push(blank(W));

  const updateIdx = 3; // index in SECTIONS
  const isUpdateSelected = selectedIndex === updateIdx;
  const toggleDot = autoUpdate ? '\u25CF' : '\u25CB';
  const toggleColor = autoUpdate ? theme.green : DIM;
  const toggleLabel = autoUpdate ? 'Enabled' : 'Disabled';

  if (isUpdateSelected) {
    const line = `    Auto-update: ${toggleDot} ${toggleLabel}`;
    rows.push({
      segments: padSegs([
        { text: line, color: '#000000' },
      ], W),
      bgColor: theme.accent,
    });
  } else {
    rows.push(segRow(padSegs([
      { text: '    Auto-update: ', color: GRAY },
      { text: toggleDot + ' ', color: toggleColor },
      { text: toggleLabel, color: toggleColor },
    ], W)));
  }

  rows.push(segRow(padSegs([
    { text: `    Current version: ${VERSION}`, color: DIM },
  ], W)));
  rows.push(segRow(padSegs([
    { text: `    Latest version:  ${VERSION} (up to date)`, color: DIM },
  ], W)));
  rows.push(blank(W));

  // ── Connection ──
  rows.push(section('CONNECTION', W));
  rows.push(blank(W));

  const connDot = auth.isAuthenticated ? '\u25CF' : '\u25CB';
  const connColor = auth.isAuthenticated ? theme.green : theme.red;
  const connLabel = auth.isAuthenticated ? 'Connected' : 'Disconnected';

  rows.push(segRow(padSegs([
    { text: '    Convex:    ', color: GRAY },
    { text: connDot + ' ', color: connColor },
    { text: connLabel, color: connColor },
  ], W)));

  rows.push(segRow(padSegs([
    { text: '    User:      ', color: GRAY },
    { text: auth.email || 'Not logged in', color: auth.email ? LIGHT : DIM },
  ], W)));

  rows.push(segRow(padSegs([
    { text: '    Workspace: ', color: GRAY },
    { text: config.workspaceName || 'None selected', color: config.workspaceName ? LIGHT : DIM },
  ], W)));

  rows.push(blank(W));

  // ── Logout button ──
  const logoutIdx = 4;
  const isLogoutSelected = selectedIndex === logoutIdx;
  if (isLogoutSelected) {
    rows.push({
      segments: padSegs([
        { text: '    [Logout]', color: '#000000' },
      ], W),
      bgColor: theme.red,
    });
  } else {
    rows.push(segRow(padSegs([
      { text: '    ', color: WHITE },
      { text: '[Logout]', color: theme.red },
    ], W)));
  }

  fillTo(rows, H - 2, W);
  rows.push(...pageFooter(W, '\u2191\u2193 Navigate  \u23CE Toggle  Q Back'));
  return rows;
}
