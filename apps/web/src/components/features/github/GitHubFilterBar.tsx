import { FaSearch, FaTimes } from 'react-icons/fa';
import type { ActiveTypeFilter, StateFilter, ActiveFilterChip } from './useGitHubCommandCenter';
import BrutalSelect from '../../ui/BrutalSelect';

interface GitHubFilterBarProps {
  // Search
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;

  // Type filter
  activeType: ActiveTypeFilter;
  onTypeChange: (t: ActiveTypeFilter) => void;
  counts: { all: number; commit: number; pr: number; issue: number };

  // Advanced filters
  stateFilter: StateFilter;
  onStateChange: (s: StateFilter) => void;
  branchFilter: string;
  onBranchChange: (b: string) => void;
  authorFilter: string;
  onAuthorChange: (a: string) => void;
  labelFilter: string;
  onLabelChange: (l: string) => void;

  // Dynamic options
  availableBranches: string[];
  availableAuthors: string[];
  availableLabels: string[];

  // Active chips
  activeFilterChips: ActiveFilterChip[];
  onClearAll: () => void;
}

const TYPE_CHIPS: { key: ActiveTypeFilter; label: string; hint: string }[] = [
  { key: 'all', label: 'ALL', hint: 'a' },
  { key: 'commit', label: 'COMMITS', hint: 'c' },
  { key: 'pr', label: 'PRS', hint: 'p' },
  { key: 'issue', label: 'ISSUES', hint: 'i' },
];

export default function GitHubFilterBar({
  searchQuery,
  onSearchChange,
  searchInputRef,
  activeType,
  onTypeChange,
  counts,
  stateFilter,
  onStateChange,
  branchFilter,
  onBranchChange,
  authorFilter,
  onAuthorChange,
  labelFilter,
  onLabelChange,
  availableBranches,
  availableAuthors,
  availableLabels,
  activeFilterChips,
  onClearAll,
}: GitHubFilterBarProps) {
  // Contextual state options
  const showMergedDraft = activeType === 'all' || activeType === 'pr';
  const showBranch = activeType === 'all' || activeType === 'commit';
  const showLabels = activeType === 'all' || activeType === 'issue';

  return (
    <div className="space-y-[8px]">
      {/* Row 1: Unified Search */}
      <div className="relative">
        <FaSearch className="absolute left-[10px] top-1/2 -translate-y-1/2 w-[12px] h-[12px] text-[var(--theme-foreground)]/40" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search commits, PRs, issues...  type:pr state:open"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search commits, PRs, issues"
          className="w-full pl-[32px] pr-[40px] py-[8px] font-mono text-brutal-sm bg-[var(--theme-background-secondary)] text-[var(--theme-foreground)] border border-[var(--theme-border)] focus:border-primary-brutalist focus:outline-none transition-colors placeholder:text-[var(--theme-foreground)]/30"
        />
        <kbd className="absolute right-[10px] top-1/2 -translate-y-1/2 px-[6px] py-[2px] font-mono text-[10px] text-[var(--theme-foreground)]/30 border border-[var(--theme-border)] rounded bg-[var(--theme-background)]">
          /
        </kbd>
      </div>

      {/* Row 2: Type Chips */}
      <div className="flex items-center gap-[6px]">
        {TYPE_CHIPS.map(chip => (
          <button
            key={chip.key}
            onClick={() => onTypeChange(chip.key)}
            className={`px-[10px] py-[5px] font-mono text-brutal-xs uppercase border transition-all flex items-center gap-[6px] ${
              activeType === chip.key
                ? 'bg-primary-brutalist text-event-horizon border-primary-brutalist font-bold'
                : 'bg-[var(--theme-background-secondary)] text-[var(--theme-foreground)]/60 border-[var(--theme-border)] hover:border-primary-brutalist hover:text-[var(--theme-foreground)]'
            }`}
          >
            {chip.label}
            <span className={`text-[10px] ${activeType === chip.key ? 'opacity-80' : 'opacity-50'}`}>
              {counts[chip.key]}
            </span>
            <span className="hidden lg:inline text-[9px] opacity-30 ml-[2px]">{chip.hint}</span>
          </button>
        ))}
      </div>

      {/* Row 3: Advanced Filters */}
      <div className="flex items-center gap-[6px] flex-wrap">
        {/* State dropdown */}
        <BrutalSelect
          value={stateFilter}
          onChange={(v) => onStateChange(v as StateFilter)}
          options={[
            { value: 'all', label: 'All states' },
            { value: 'open', label: 'Open' },
            { value: 'closed', label: 'Closed' },
            ...(showMergedDraft ? [
              { value: 'merged', label: 'Merged' },
              { value: 'draft', label: 'Draft' },
            ] : []),
          ]}
          compact
        />

        {/* Branch dropdown */}
        {showBranch && availableBranches.length > 0 && (
          <BrutalSelect
            value={branchFilter}
            onChange={(v) => onBranchChange(v)}
            options={[
              { value: 'all', label: 'All branches' },
              ...availableBranches.map(b => ({ value: b, label: b })),
            ]}
            compact
          />
        )}

        {/* Author dropdown */}
        {availableAuthors.length > 0 && (
          <BrutalSelect
            value={authorFilter}
            onChange={(v) => onAuthorChange(v)}
            options={[
              { value: 'all', label: 'All authors' },
              ...availableAuthors.map(a => ({ value: a, label: a })),
            ]}
            compact
          />
        )}

        {/* Label dropdown */}
        {showLabels && availableLabels.length > 0 && (
          <BrutalSelect
            value={labelFilter}
            onChange={(v) => onLabelChange(v)}
            options={[
              { value: 'all', label: 'All labels' },
              ...availableLabels.map(l => ({ value: l, label: l })),
            ]}
            compact
          />
        )}
      </div>

      {/* Row 4: Active Filter Chips */}
      {activeFilterChips.length > 0 && (
        <div className="flex items-center gap-[6px] flex-wrap">
          {activeFilterChips.map(chip => (
            <button
              key={chip.key}
              onClick={chip.remove}
              className="inline-flex items-center gap-[4px] px-[6px] py-[2px] bg-primary-brutalist/10 text-primary-brutalist border border-primary-brutalist/20 font-mono text-[10px] hover:bg-primary-brutalist/20 transition-colors"
            >
              {chip.display}
              <FaTimes className="w-[8px] h-[8px]" />
            </button>
          ))}
          <button
            onClick={onClearAll}
            className="font-mono text-[10px] text-[var(--theme-foreground)]/40 hover:text-[var(--theme-foreground)] transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
