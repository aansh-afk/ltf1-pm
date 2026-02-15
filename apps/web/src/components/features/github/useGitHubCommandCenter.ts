import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../../../convex/_generated/api';
import type { Id } from '../../../../../../convex/_generated/dataModel';
import { toast } from 'react-hot-toast';

// --- Types ---

export type FeedItemType = 'commit' | 'pr' | 'issue';
export type FeedItemState = 'open' | 'closed' | 'merged' | 'draft';
export type ActiveTypeFilter = 'all' | 'commit' | 'pr' | 'issue';
export type StateFilter = 'all' | 'open' | 'closed' | 'merged' | 'draft';
export type SortOrder = 'newest' | 'oldest';

export interface UnifiedFeedItem {
  id: string;
  type: FeedItemType;
  title: string;
  author: string;
  timestamp: number;
  state?: FeedItemState;
  branch?: string;
  number?: number;
  sha?: string;
  url?: string;
  draft?: boolean;
  labels?: string[];
  assignees?: string[];
  linkedTaskKeys?: string[];
  body?: string;
  raw: any;
}

export interface ActiveFilterChip {
  key: string;
  value: string;
  display: string;
  remove: () => void;
}

export interface UseGitHubCommandCenterOptions {
  projectId: Id<"projects"> | undefined;
  hasRepository: boolean;
}

// --- Hook ---

export function useGitHubCommandCenter({ projectId, hasRepository }: UseGitHubCommandCenterOptions) {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<ActiveTypeFilter>('all');
  const [stateFilter, setStateFilter] = useState<StateFilter>('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [authorFilter, setAuthorFilter] = useState('all');
  const [labelFilter, setLabelFilter] = useState('all');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Data queries
  const commits = useQuery(
    api.integrations.github.queries.getProjectCommits,
    projectId && hasRepository ? { projectId } : 'skip'
  );
  const pullRequests = useQuery(
    api.integrations.github.queries.getProjectPullRequests,
    projectId && hasRepository ? { projectId } : 'skip'
  );
  const issues = useQuery(
    api.integrations.github.queries.getProjectIssues,
    projectId && hasRepository ? { projectId } : 'skip'
  );

  const isLoading = commits === undefined || pullRequests === undefined || issues === undefined;

  // Normalize into UnifiedFeedItem[]
  const mergedItems = useMemo<UnifiedFeedItem[]>(() => {
    const items: UnifiedFeedItem[] = [];

    if (commits) {
      for (const c of commits) {
        const ts = c.timestamp ? new Date(c.timestamp).getTime() : (c.createdAt ? new Date(c.createdAt).getTime() : c._creationTime);
        items.push({
          id: c._id,
          type: 'commit',
          title: c.message?.split('\n')[0] || 'No message',
          author: c.author?.name || c.author?.username || 'Unknown',
          timestamp: ts,
          branch: c.branch,
          sha: c.sha,
          url: c.url,
          linkedTaskKeys: c.linkedTaskKeys,
          body: c.message,
          raw: c,
        });
      }
    }

    if (pullRequests) {
      for (const pr of pullRequests) {
        const ts = pr.createdAt ? new Date(pr.createdAt).getTime() : pr._creationTime;
        const effectiveState: FeedItemState = pr.mergedAt ? 'merged' : pr.draft ? 'draft' : (pr.state as FeedItemState) || 'open';
        items.push({
          id: pr._id,
          type: 'pr',
          title: pr.title || 'Untitled PR',
          author: pr.author || 'Unknown',
          timestamp: ts,
          state: effectiveState,
          number: pr.number,
          url: pr.url,
          draft: pr.draft,
          labels: pr.labels,
          assignees: pr.assignees,
          linkedTaskKeys: pr.linkedTaskKeys,
          body: pr.body,
          raw: pr,
        });
      }
    }

    if (issues) {
      for (const issue of issues) {
        const ts = issue.createdAt ? new Date(issue.createdAt).getTime() : issue._creationTime;
        items.push({
          id: issue._id,
          type: 'issue',
          title: issue.title || 'Untitled Issue',
          author: issue.author || 'Unknown',
          timestamp: ts,
          state: issue.state === 'open' ? 'open' : 'closed',
          number: issue.number,
          url: issue.url || undefined,
          labels: issue.labels,
          assignees: issue.assignees,
          linkedTaskKeys: issue.linkedTaskKeys,
          body: issue.body,
          raw: issue,
        });
      }
    }

    // Sort by timestamp
    items.sort((a, b) => sortOrder === 'newest' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp);
    return items;
  }, [commits, pullRequests, issues, sortOrder]);

  // Parse search query for power-user prefix syntax
  const parsedSearch = useMemo(() => {
    let text = searchQuery;
    let typeOverride: ActiveTypeFilter | null = null;
    let stateOverride: StateFilter | null = null;
    let branchOverride: string | null = null;
    let authorOverride: string | null = null;
    let labelOverride: string | null = null;

    // Extract type:value
    const typeMatch = text.match(/\btype:(commit|pr|issue|all)\b/i);
    if (typeMatch) {
      typeOverride = typeMatch[1].toLowerCase() as ActiveTypeFilter;
      text = text.replace(typeMatch[0], '');
    }

    // Extract state:value
    const stateMatch = text.match(/\bstate:(open|closed|merged|draft|all)\b/i);
    if (stateMatch) {
      stateOverride = stateMatch[1].toLowerCase() as StateFilter;
      text = text.replace(stateMatch[0], '');
    }

    // Extract branch:value
    const branchMatch = text.match(/\bbranch:(\S+)/i);
    if (branchMatch) {
      branchOverride = branchMatch[1];
      text = text.replace(branchMatch[0], '');
    }

    // Extract author:value
    const authorMatch = text.match(/\bauthor:(\S+)/i);
    if (authorMatch) {
      authorOverride = authorMatch[1];
      text = text.replace(authorMatch[0], '');
    }

    // Extract label:value
    const labelMatch = text.match(/\blabel:(\S+)/i);
    if (labelMatch) {
      labelOverride = labelMatch[1];
      text = text.replace(labelMatch[0], '');
    }

    return {
      text: text.trim().toLowerCase(),
      typeOverride,
      stateOverride,
      branchOverride,
      authorOverride,
      labelOverride,
    };
  }, [searchQuery]);

  // Effective filters (search prefixes override UI filters)
  const effectiveType = parsedSearch.typeOverride || activeType;
  const effectiveState = parsedSearch.stateOverride || stateFilter;
  const effectiveBranch = parsedSearch.branchOverride || branchFilter;
  const effectiveAuthor = parsedSearch.authorOverride || authorFilter;
  const effectiveLabel = parsedSearch.labelOverride || labelFilter;

  // Filter
  const filteredItems = useMemo(() => {
    return mergedItems.filter(item => {
      // Type filter
      if (effectiveType !== 'all' && item.type !== effectiveType) return false;

      // State filter
      if (effectiveState !== 'all') {
        if (!item.state) return effectiveState === 'all'; // commits have no state
        if (effectiveState === 'draft') {
          if (!item.draft) return false;
        } else if (item.state !== effectiveState) {
          return false;
        }
      }

      // Branch filter
      if (effectiveBranch !== 'all') {
        if (!item.branch || item.branch !== effectiveBranch) return false;
      }

      // Author filter
      if (effectiveAuthor !== 'all') {
        if (item.author.toLowerCase() !== effectiveAuthor.toLowerCase()) return false;
      }

      // Label filter
      if (effectiveLabel !== 'all') {
        if (!item.labels || !item.labels.includes(effectiveLabel)) return false;
      }

      // Text search
      if (parsedSearch.text) {
        const q = parsedSearch.text;
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesAuthor = item.author.toLowerCase().includes(q);
        const matchesSha = item.sha?.toLowerCase().includes(q) || false;
        const matchesBranch = item.branch?.toLowerCase().includes(q) || false;
        const matchesNumber = item.number ? String(item.number).includes(q) : false;
        if (!matchesTitle && !matchesAuthor && !matchesSha && !matchesBranch && !matchesNumber) return false;
      }

      return true;
    });
  }, [mergedItems, effectiveType, effectiveState, effectiveBranch, effectiveAuthor, effectiveLabel, parsedSearch.text]);

  // Counts
  const counts = useMemo(() => {
    const result = { all: mergedItems.length, commit: 0, pr: 0, issue: 0 };
    for (const item of mergedItems) {
      result[item.type]++;
    }
    return result;
  }, [mergedItems]);

  // Available filter options (extracted from data)
  const availableBranches = useMemo(() => {
    const set = new Set<string>();
    for (const item of mergedItems) {
      if (item.branch) set.add(item.branch);
    }
    return Array.from(set).sort();
  }, [mergedItems]);

  const availableAuthors = useMemo(() => {
    const set = new Set<string>();
    for (const item of mergedItems) {
      if (item.author && item.author !== 'Unknown') set.add(item.author);
    }
    return Array.from(set).sort();
  }, [mergedItems]);

  const availableLabels = useMemo(() => {
    const set = new Set<string>();
    for (const item of mergedItems) {
      if (item.labels) {
        for (const l of item.labels) set.add(l);
      }
    }
    return Array.from(set).sort();
  }, [mergedItems]);

  // Active filter chips
  const activeFilterChips = useMemo<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = [];
    if (stateFilter !== 'all') {
      chips.push({ key: 'state', value: stateFilter, display: `state:${stateFilter}`, remove: () => setStateFilter('all') });
    }
    if (branchFilter !== 'all') {
      chips.push({ key: 'branch', value: branchFilter, display: `branch:${branchFilter}`, remove: () => setBranchFilter('all') });
    }
    if (authorFilter !== 'all') {
      chips.push({ key: 'author', value: authorFilter, display: `author:${authorFilter}`, remove: () => setAuthorFilter('all') });
    }
    if (labelFilter !== 'all') {
      chips.push({ key: 'label', value: labelFilter, display: `label:${labelFilter}`, remove: () => setLabelFilter('all') });
    }
    return chips;
  }, [stateFilter, branchFilter, authorFilter, labelFilter]);

  const clearAllFilters = useCallback(() => {
    setStateFilter('all');
    setBranchFilter('all');
    setAuthorFilter('all');
    setLabelFilter('all');
    setSearchQuery('');
    setActiveType('all');
  }, []);

  // Reset focused index when filters change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [activeType, stateFilter, branchFilter, authorFilter, labelFilter, searchQuery]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;

      // / to focus search (always)
      if (e.key === '/' && !isInInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Escape: blur search / collapse / deselect
      if (e.key === 'Escape') {
        if (isInInput) {
          (target as HTMLElement).blur();
          return;
        }
        if (expandedId) {
          setExpandedId(null);
          return;
        }
        if (focusedIndex >= 0) {
          setFocusedIndex(-1);
          return;
        }
        return;
      }

      // Keyboard nav only when not in input
      if (isInInput) return;

      // j/k navigation
      if (e.key === 'j') {
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
        return;
      }
      if (e.key === 'k') {
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        return;
      }

      // Enter to toggle expand
      if (e.key === 'Enter' && focusedIndex >= 0) {
        e.preventDefault();
        const item = filteredItems[focusedIndex];
        if (item) {
          setExpandedId(prev => prev === item.id ? null : item.id);
        }
        return;
      }

      // o to open on GitHub
      if (e.key === 'o' && focusedIndex >= 0) {
        e.preventDefault();
        const item = filteredItems[focusedIndex];
        if (item?.url) {
          window.open(item.url, '_blank');
        }
        return;
      }

      // Type shortcuts
      if (e.key === 'c') { e.preventDefault(); setActiveType('commit'); return; }
      if (e.key === 'p') { e.preventDefault(); setActiveType('pr'); return; }
      if (e.key === 'i') { e.preventDefault(); setActiveType('issue'); return; }
      if (e.key === 'a') { e.preventDefault(); setActiveType('all'); return; }

      // y to copy SHA
      if (e.key === 'y' && focusedIndex >= 0) {
        e.preventDefault();
        const item = filteredItems[focusedIndex];
        if (item?.sha) {
          navigator.clipboard.writeText(item.sha);
          toast.success('SHA copied');
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredItems, focusedIndex, expandedId]);

  return {
    // State
    searchQuery,
    setSearchQuery,
    activeType,
    setActiveType,
    stateFilter,
    setStateFilter,
    branchFilter,
    setBranchFilter,
    authorFilter,
    setAuthorFilter,
    labelFilter,
    setLabelFilter,
    focusedIndex,
    setFocusedIndex,
    expandedId,
    setExpandedId,
    sortOrder,
    setSortOrder,
    searchInputRef,

    // Data
    filteredItems,
    counts,
    isLoading,

    // Filter options
    availableBranches,
    availableAuthors,
    availableLabels,

    // Active chips
    activeFilterChips,
    clearAllFilters,
  };
}
