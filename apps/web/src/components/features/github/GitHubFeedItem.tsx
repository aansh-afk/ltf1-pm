import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCode,
  FaCodeBranch,
  FaExclamationCircle,
  FaCheckCircle,
  FaLink,
  FaCopy,
  FaClock,
  FaTimesCircle,
} from 'react-icons/fa';
import { HiOutlineExternalLink } from 'react-icons/hi';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import type { UnifiedFeedItem } from './useGitHubCommandCenter';

interface GitHubFeedItemProps {
  item: UnifiedFeedItem;
  isFocused: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onFocus: () => void;
}

// --- Accent bar color ---
function getAccentColor(item: UnifiedFeedItem): string {
  if (item.type === 'commit') return 'bg-[#06B6D4]';
  if (item.type === 'pr') {
    if (item.state === 'merged') return 'bg-[#8B5CF6]';
    if (item.state === 'closed') return 'bg-[#EF4444]';
    if (item.state === 'draft') return 'bg-[#F59E0B]';
    return 'bg-[#22C55E]';
  }
  // issue
  if (item.state === 'closed') return 'bg-[#6B7280]';
  return 'bg-[#22C55E]';
}

// --- Type icon ---
function TypeIcon({ item }: { item: UnifiedFeedItem }) {
  if (item.type === 'commit') return <FaCode className="w-[10px] h-[10px]" />;
  if (item.type === 'pr') return <FaCodeBranch className="w-[10px] h-[10px] -rotate-90" />;
  if (item.state === 'closed') return <FaCheckCircle className="w-[10px] h-[10px]" />;
  return <FaExclamationCircle className="w-[10px] h-[10px]" />;
}

function getIconColor(item: UnifiedFeedItem): string {
  if (item.type === 'commit') return 'text-[#06B6D4]';
  if (item.type === 'pr') {
    if (item.state === 'merged') return 'text-[#8B5CF6]';
    if (item.state === 'closed') return 'text-[#EF4444]';
    if (item.state === 'draft') return 'text-[#F59E0B]';
    return 'text-[#22C55E]';
  }
  if (item.state === 'closed') return 'text-[#6B7280]';
  return 'text-[#22C55E]';
}

// --- State badge ---
function StateBadge({ item }: { item: UnifiedFeedItem }) {
  if (!item.state || item.type === 'commit') return null;

  const configs: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode; label: string }> = {
    open: { bg: 'bg-[#22C55E]/10', text: 'text-[#22C55E]', border: 'border-[#22C55E]/20', icon: <FaClock className="w-[8px] h-[8px]" />, label: 'open' },
    closed: { bg: 'bg-[#EF4444]/10', text: 'text-[#EF4444]', border: 'border-[#EF4444]/20', icon: <FaTimesCircle className="w-[8px] h-[8px]" />, label: 'closed' },
    merged: { bg: 'bg-[#8B5CF6]/10', text: 'text-[#8B5CF6]', border: 'border-[#8B5CF6]/20', icon: <FaCheckCircle className="w-[8px] h-[8px]" />, label: 'merged' },
    draft: { bg: 'bg-[#F59E0B]/10', text: 'text-[#F59E0B]', border: 'border-[#F59E0B]/20', icon: <FaClock className="w-[8px] h-[8px]" />, label: 'draft' },
  };

  // For issues, only show open/closed
  const key = item.type === 'issue' ? (item.state === 'open' ? 'open' : 'closed') : item.state;
  const cfg = configs[key];
  if (!cfg) return null;

  return (
    <span className={`inline-flex items-center gap-[3px] px-[5px] py-[1px] rounded font-mono text-[10px] font-bold uppercase border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function formatTimestamp(ts: number): string {
  try {
    return formatDistanceToNow(new Date(ts), { addSuffix: true });
  } catch {
    return 'recently';
  }
}

// Simple hash for label colors
const LABEL_COLORS = [
  { bg: 'bg-primary-brutalist/10', text: 'text-primary-brutalist', border: 'border-primary-brutalist/20' },
  { bg: 'bg-[#22C55E]/10', text: 'text-[#22C55E]', border: 'border-[#22C55E]/20' },
  { bg: 'bg-[#F59E0B]/10', text: 'text-[#F59E0B]', border: 'border-[#F59E0B]/20' },
  { bg: 'bg-[#8B5CF6]/10', text: 'text-[#8B5CF6]', border: 'border-[#8B5CF6]/20' },
  { bg: 'bg-[#06B6D4]/10', text: 'text-[#06B6D4]', border: 'border-[#06B6D4]/20' },
  { bg: 'bg-[#EF4444]/10', text: 'text-[#EF4444]', border: 'border-[#EF4444]/20' },
];

function getLabelColor(label: string) {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = label.charCodeAt(i) + ((hash << 5) - hash);
  }
  return LABEL_COLORS[Math.abs(hash) % LABEL_COLORS.length];
}

export default memo(function GitHubFeedItem({ item, isFocused, isExpanded, onToggleExpand, onFocus }: GitHubFeedItemProps) {
  const copySha = () => {
    if (item.sha) {
      navigator.clipboard.writeText(item.sha);
      toast.success('SHA copied');
    }
  };

  return (
    <div
      onClick={onFocus}
      className={`group relative pl-[14px] pr-[10px] py-[8px] border bg-[var(--theme-background)] transition-all duration-150 cursor-pointer ${
        isFocused
          ? 'border-primary-brutalist bg-primary-brutalist/5'
          : 'border-[var(--theme-border)] hover:border-primary-brutalist/50'
      }`}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${getAccentColor(item)}`} />

      {/* Compact row */}
      <div className="flex items-center gap-[8px] min-w-0" onClick={onToggleExpand}>
        {/* Type icon */}
        <div className={`w-[20px] h-[20px] rounded-full flex items-center justify-center border border-[var(--theme-border)] bg-[var(--theme-background-secondary)] shrink-0 ${getIconColor(item)}`}>
          <TypeIcon item={item} />
        </div>

        {/* Title + metadata */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-[6px] min-w-0">
            <span className="text-brutal-sm font-bold text-[var(--theme-foreground)] truncate">
              {item.title}
            </span>
            {item.number && (
              <span className="shrink-0 font-mono text-[10px] text-[var(--theme-foreground)]/40">
                #{item.number}
              </span>
            )}
            <StateBadge item={item} />
            {item.draft && item.state !== 'draft' && (
              <span className="shrink-0 px-[5px] py-[1px] rounded font-mono text-[10px] font-bold uppercase bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20">
                DRAFT
              </span>
            )}
          </div>

          {/* Second line: task keys, branch, labels */}
          <div className="flex items-center gap-[6px] mt-[2px] flex-wrap">
            {item.linkedTaskKeys && item.linkedTaskKeys.length > 0 && (
              <div className="flex items-center gap-[4px] px-[5px] py-[1px] bg-primary-brutalist/10 rounded border border-primary-brutalist/20">
                <FaLink className="w-[8px] h-[8px] text-primary-brutalist" />
                {item.linkedTaskKeys.map(key => (
                  <span key={key} className="font-mono text-[10px] font-bold text-primary-brutalist">{key}</span>
                ))}
              </div>
            )}
            {item.branch && (
              <span className="inline-flex items-center gap-[3px] px-[5px] py-[1px] rounded font-mono text-[10px] bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20">
                <FaCodeBranch className="w-[8px] h-[8px]" />
                {item.branch}
              </span>
            )}
            {item.labels && item.labels.slice(0, 3).map(label => {
              const c = getLabelColor(label);
              return (
                <span key={label} className={`px-[5px] py-[1px] rounded font-mono text-[10px] font-bold border ${c.bg} ${c.text} ${c.border}`}>
                  {label}
                </span>
              );
            })}
          </div>
        </div>

        {/* Right side: author + time */}
        <div className="flex items-center gap-[8px] shrink-0">
          <div className="flex items-center gap-[4px] font-mono text-brutal-xs text-[var(--theme-foreground)]/50">
            <div className="w-[16px] h-[16px] rounded-full bg-gradient-to-br from-primary-brutalist to-[var(--theme-border)] flex items-center justify-center text-[8px] font-bold text-white shrink-0">
              {item.author.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:inline truncate max-w-[80px]">{item.author}</span>
          </div>
          <span className="font-mono text-brutal-xs text-[var(--theme-foreground)]/40 whitespace-nowrap">
            {formatTimestamp(item.timestamp)}
          </span>
        </div>
      </div>

      {/* Expanded view */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-[8px] pt-[8px] border-t border-[var(--theme-border)] space-y-[6px]">
              {/* Commit: full message + copy SHA */}
              {item.type === 'commit' && (
                <>
                  {item.body && item.body.includes('\n') && (
                    <pre className="text-brutal-xs text-[var(--theme-foreground)]/60 font-mono whitespace-pre-wrap bg-[var(--theme-background-secondary)] p-[8px] rounded border border-[var(--theme-border)] max-h-[200px] overflow-y-auto">
                      {item.body}
                    </pre>
                  )}
                  {item.sha && (
                    <div className="flex items-center gap-[6px]">
                      <span className="font-mono text-brutal-xs text-[var(--theme-foreground)]/50">SHA:</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); copySha(); }}
                        className="flex items-center gap-[4px] px-[6px] py-[2px] bg-[var(--theme-background-secondary)] rounded border border-[var(--theme-border)] hover:border-primary-brutalist/30 transition-colors font-mono text-brutal-xs text-[var(--theme-foreground)]/60"
                      >
                        <FaCopy className="w-[10px] h-[10px] opacity-50" />
                        {item.sha}
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* PR: description, branch info, timestamps */}
              {item.type === 'pr' && (
                <>
                  {item.body && (
                    <div className="text-brutal-xs text-[var(--theme-foreground)]/60 leading-relaxed max-h-[150px] overflow-y-auto">
                      {item.body.slice(0, 500)}{item.body.length > 500 ? '...' : ''}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-[8px] font-mono text-brutal-xs text-[var(--theme-foreground)]/50">
                    {item.raw.headBranch && (
                      <span className="flex items-center gap-[4px]">
                        <FaCodeBranch className="w-[10px] h-[10px]" />
                        {item.raw.headBranch} &rarr; {item.raw.baseBranch || 'main'}
                      </span>
                    )}
                    {item.raw.mergedAt && <span>Merged {formatTimestamp(new Date(item.raw.mergedAt).getTime())}</span>}
                    {item.raw.closedAt && !item.raw.mergedAt && <span>Closed {formatTimestamp(new Date(item.raw.closedAt).getTime())}</span>}
                  </div>
                </>
              )}

              {/* Issue: body preview, assignees */}
              {item.type === 'issue' && (
                <>
                  {item.body && (
                    <div className="text-brutal-xs text-[var(--theme-foreground)]/60 leading-relaxed max-h-[150px] overflow-y-auto">
                      {item.body.slice(0, 500)}{item.body.length > 500 ? '...' : ''}
                    </div>
                  )}
                  {item.assignees && item.assignees.length > 0 && (
                    <div className="flex items-center gap-[6px]">
                      <span className="font-mono text-brutal-xs text-[var(--theme-foreground)]/50">Assignees:</span>
                      <div className="flex items-center gap-[4px]">
                        {item.assignees.map(a => (
                          <div key={a} className="w-[18px] h-[18px] rounded-full bg-gradient-to-br from-[#06B6D4] to-[var(--theme-border)] flex items-center justify-center text-[8px] font-bold text-white" title={a}>
                            {a.charAt(0).toUpperCase()}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {item.labels && item.labels.length > 0 && (
                    <div className="flex flex-wrap gap-[4px]">
                      {item.labels.map(label => {
                        const c = getLabelColor(label);
                        return (
                          <span key={label} className={`px-[5px] py-[1px] rounded font-mono text-[10px] font-bold border ${c.bg} ${c.text} ${c.border}`}>
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* View on GitHub (all types) */}
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-[4px] font-mono text-brutal-xs text-primary-brutalist hover:underline"
                >
                  <HiOutlineExternalLink className="w-[12px] h-[12px]" />
                  View on GitHub
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
