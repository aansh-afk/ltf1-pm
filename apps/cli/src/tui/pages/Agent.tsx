/**
 * Agent Page - Triage queue, stats, and activity feed
 * Accent: amber (#F59E0B)
 * Keys: j/k navigate, a accept, r reject, e modify
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
  pageHeader, pageFooter, section, relativeTime,
} from '../helpers.js';

// Amber accent for all agent UI
const AMBER = theme.amber;

interface TriageItem {
  _id: string;
  taskKey: string;
  title: string;
  suggestedType: string;
  suggestedPriority: string;
  suggestedAssignee?: string;
  confidence: number;
}

interface TriageStats {
  pending: number;
  acceptRate: number;
  autoApplied: number;
}

interface ActivityItem {
  _id: string;
  action: string;
  taskKey: string;
  detail: string;
  timestamp: number;
}

export interface AgentPageProps {
  width: number;
  height: number;
  isActive: boolean;
}

export function useAgentPage({ width: W, height: H, isActive }: AgentPageProps): Row[] {
  const config = useConfig();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Queries
  const queueQuery = useConvexQuery(
    api.agent.queries.getTriageQueue,
    config.workspaceId ? { workspaceId: config.workspaceId as never } : null,
    5000,
  );
  const statsQuery = useConvexQuery(
    api.agent.queries.getTriageStats,
    config.workspaceId ? { workspaceId: config.workspaceId as never } : null,
    15000,
  );
  const activityQuery = useConvexQuery(
    api.agent.queries.getAgentActivityFeed,
    config.workspaceId ? { workspaceId: config.workspaceId as never } : null,
    10000,
  );

  const queue = (queueQuery.data as TriageItem[] | null) || [];
  const stats = (statsQuery.data as TriageStats | null) || { pending: 0, acceptRate: 0, autoApplied: 0 };
  const activity = (activityQuery.data as ActivityItem[] | null) || [];

  const showFeedback = useCallback((msg: string) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback(msg);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 2000);
  }, []);

  const runMutation = useCallback(async (type: 'accept' | 'reject', item: TriageItem) => {
    if (!isAuthenticated()) return;
    try {
      const client = getClient();
      const auth = getAuth();
      if (auth?.token) client.setAuth(auth.token);

      if (type === 'accept') {
        await client.mutation(api.agent.mutations.acceptTriageSuggestion, {
          suggestionId: item._id as never,
        } as never);
        showFeedback(`Accepted ${item.taskKey}`);
      } else {
        await client.mutation(api.agent.mutations.rejectTriageSuggestion, {
          suggestionId: item._id as never,
        } as never);
        showFeedback(`Rejected ${item.taskKey}`);
      }
      queueQuery.refetch();
      statsQuery.refetch();
      activityQuery.refetch();
    } catch {
      showFeedback('Action failed');
    }
  }, [showFeedback, queueQuery, statsQuery, activityQuery]);

  useInput((input, key) => {
    if (!isActive) return;

    if (input === 'j' || key.downArrow) {
      setSelectedIndex(prev => Math.min(queue.length - 1, prev + 1));
    }
    if (input === 'k' || key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    }

    // Accept
    if (input === 'a' && queue[selectedIndex]) {
      runMutation('accept', queue[selectedIndex]);
    }
    // Reject
    if (input === 'r' && queue[selectedIndex]) {
      runMutation('reject', queue[selectedIndex]);
    }
  }, { isActive });

  // ── Render ──
  const rows: Row[] = [];
  rows.push(...pageHeader('Agent', '', W));
  rows.push(blank(W));

  // ── Triage Stats ──
  rows.push(section('TRIAGE STATS', W));
  rows.push(blank(W));
  const pendingStr = `Pending: ${stats.pending}`;
  const acceptStr = `Accepted: ${stats.acceptRate}%`;
  const autoStr = `Auto-applied: ${stats.autoApplied}`;
  rows.push(segRow(padSegs([
    { text: '    ', color: WHITE },
    { text: pendingStr, color: AMBER },
    { text: '     ', color: WHITE },
    { text: acceptStr, color: AMBER },
    { text: '     ', color: WHITE },
    { text: autoStr, color: AMBER },
  ], W)));
  rows.push(blank(W));

  // ── Feedback banner ──
  if (feedback) {
    rows.push(segRow(padSegs([
      { text: '    ', color: WHITE },
      { text: '\u2713 ', color: theme.green },
      { text: feedback, color: LIGHT },
    ], W)));
    rows.push(blank(W));
  }

  // ── Triage Queue ──
  const queueLabel = `TRIAGE QUEUE (${queue.length} pending)`;
  rows.push(section(queueLabel, W));
  rows.push(blank(W));

  if (queueQuery.loading && queue.length === 0) {
    rows.push(segRow(padSegs([
      { text: '    Loading triage queue...', color: GRAY },
    ], W)));
  } else if (queue.length === 0) {
    rows.push(segRow(padSegs([
      { text: '    No pending triage items', color: DIM },
    ], W)));
    rows.push(segRow(padSegs([
      { text: '    New tasks will appear here for review.', color: DIM },
    ], W)));
  } else {
    const maxVisible = Math.max(3, Math.floor((H - 22) / 3));
    const visible = queue.slice(0, maxVisible);

    for (let i = 0; i < visible.length; i++) {
      const item = visible[i];
      const isSelected = i === selectedIndex;
      const pointer = isSelected ? '>' : ' ';
      const icon = '\u26A1';
      const titleMax = W - 30;
      const title = truncate(item.title, titleMax);

      if (isSelected) {
        rows.push({
          segments: padSegs([
            { text: `  ${pointer} ${icon} ${item.taskKey}  "${title}"`, color: '#000000' },
          ], W),
          bgColor: AMBER,
        });
      } else {
        rows.push(segRow(padSegs([
          { text: `  ${pointer} `, color: WHITE },
          { text: icon + ' ', color: AMBER },
          { text: item.taskKey, color: LIGHT },
          { text: `  "${title}"`, color: GRAY },
        ], W)));
      }

      // Suggestion details line
      const confColor = item.confidence >= 85 ? theme.green : item.confidence >= 60 ? AMBER : theme.red;
      const assignee = item.suggestedAssignee ? `\u2192 @${item.suggestedAssignee}` : '\u2192 unassigned';
      rows.push(segRow(padSegs([
        { text: '      Suggested: ', color: DIM },
        { text: item.suggestedType, color: GRAY },
        { text: ' | ', color: DIM },
        { text: item.suggestedPriority, color: GRAY },
        { text: ' | ', color: DIM },
        { text: assignee, color: GRAY },
        { text: ' | conf: ', color: DIM },
        { text: `${item.confidence}%`, color: confColor },
      ], W)));

      if (i < visible.length - 1) rows.push(blank(W));
    }
  }
  rows.push(blank(W));

  // ── Recent Activity ──
  rows.push(section('RECENT ACTIVITY', W));
  rows.push(blank(W));

  if (activity.length === 0) {
    rows.push(segRow(padSegs([
      { text: '    No recent activity', color: DIM },
    ], W)));
  } else {
    const maxActivity = Math.min(5, activity.length);
    for (let i = 0; i < maxActivity; i++) {
      const a = activity[i];
      const icon = a.action === 'triaged' ? '\u2713' : a.action === 'ran' ? '\u25C6' : '\u2713';
      const iconColor = a.action === 'triaged' ? theme.green : AMBER;
      const timeAgo = relativeTime(new Date(a.timestamp));
      const detailMax = W - 20 - a.taskKey.length - timeAgo.length;
      const detail = truncate(a.detail, Math.max(10, detailMax));

      rows.push(segRow(padSegs([
        { text: '    ', color: WHITE },
        { text: icon + ' ', color: iconColor },
        { text: a.taskKey, color: LIGHT },
        { text: ` ${detail}`, color: GRAY },
        { text: rep(' ', Math.max(1, W - 8 - icon.length - a.taskKey.length - detail.length - timeAgo.length)), color: WHITE },
        { text: timeAgo, color: DIM },
      ], W)));
    }
  }

  fillTo(rows, H - 2, W);
  rows.push(...pageFooter(W, 'A Accept  R Reject  J/K Nav'));
  return rows;
}
