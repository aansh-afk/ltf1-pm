import { memo } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  FaCode,
  FaCodeBranch,
  FaExclamationCircle,
  FaCheckCircle,
  FaLink,
  FaCopy,
  FaClock,
  FaTimesCircle,
} from "react-icons/fa";
import { HiOutlineExternalLink } from "react-icons/hi";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-hot-toast";
import type { UnifiedFeedItem } from "./useGitHubCommandCenter";

interface GitHubFeedItemProps {
  item: UnifiedFeedItem;
  isFocused: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onFocus: () => void;
}

// --- Accent bar color via inline style (CSS variables) ---
function getAccentStyle(item: UnifiedFeedItem): React.CSSProperties {
  if (item.type === "commit") return { backgroundColor: "var(--theme-info)" };
  if (item.type === "pr") {
    if (item.state === "merged")
      return { backgroundColor: "var(--theme-primary)" };
    if (item.state === "closed")
      return { backgroundColor: "var(--theme-error)" };
    if (item.state === "draft")
      return { backgroundColor: "var(--theme-warning)" };
    return { backgroundColor: "var(--theme-success)" };
  }
  // issue
  if (item.state === "closed")
    return { backgroundColor: "var(--theme-foreground-tertiary)" };
  return { backgroundColor: "var(--theme-success)" };
}

// --- Type icon color via inline style ---
function getIconStyle(item: UnifiedFeedItem): React.CSSProperties {
  if (item.type === "commit") return { color: "var(--theme-info)" };
  if (item.type === "pr") {
    if (item.state === "merged") return { color: "var(--theme-primary)" };
    if (item.state === "closed") return { color: "var(--theme-error)" };
    if (item.state === "draft") return { color: "var(--theme-warning)" };
    return { color: "var(--theme-success)" };
  }
  if (item.state === "closed")
    return { color: "var(--theme-foreground-tertiary)" };
  return { color: "var(--theme-success)" };
}

// --- Type icon ---
function TypeIcon({ item }: { item: UnifiedFeedItem }) {
  if (item.type === "commit") return <FaCode className="w-[10px] h-[10px]" />;
  if (item.type === "pr")
    return <FaCodeBranch className="w-[10px] h-[10px] -rotate-90" />;
  if (item.state === "closed")
    return <FaCheckCircle className="w-[10px] h-[10px]" />;
  return <FaExclamationCircle className="w-[10px] h-[10px]" />;
}

// --- State badge ---
function StateBadge({ item }: { item: UnifiedFeedItem }) {
  if (!item.state || item.type === "commit") return null;

  type BadgeConfig = { colorVar: string; icon: React.ReactNode; label: string };
  const configs: Record<string, BadgeConfig> = {
    open: {
      colorVar: "var(--theme-success)",
      icon: <FaClock className="w-[8px] h-[8px]" />,
      label: "open",
    },
    closed: {
      colorVar: "var(--theme-error)",
      icon: <FaTimesCircle className="w-[8px] h-[8px]" />,
      label: "closed",
    },
    merged: {
      colorVar: "var(--theme-primary)",
      icon: <FaCheckCircle className="w-[8px] h-[8px]" />,
      label: "merged",
    },
    draft: {
      colorVar: "var(--theme-warning)",
      icon: <FaClock className="w-[8px] h-[8px]" />,
      label: "draft",
    },
  };

  const key =
    item.type === "issue"
      ? item.state === "open"
        ? "open"
        : "closed"
      : item.state;
  const cfg = configs[key];
  if (!cfg) return null;

  return (
    <span
      className="inline-flex items-center gap-[3px] px-[5px] py-[1px] font-mono text-[10px] font-bold uppercase"
      style={{
        color: cfg.colorVar,
        border: `1px solid color-mix(in srgb, ${cfg.colorVar} 30%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${cfg.colorVar} 10%, transparent)`,
      }}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function formatTimestamp(ts: number): string {
  try {
    return formatDistanceToNow(new Date(ts), { addSuffix: true });
  } catch {
    return "recently";
  }
}

// Label colors using CSS variable tokens — cycle through semantic vars
const LABEL_COLOR_VARS = [
  "var(--theme-primary)",
  "var(--theme-success)",
  "var(--theme-warning)",
  "var(--theme-info)",
  "var(--theme-error)",
];

function getLabelColorVar(label: string): string {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = label.charCodeAt(i) + ((hash << 5) - hash);
  }
  return LABEL_COLOR_VARS[Math.abs(hash) % LABEL_COLOR_VARS.length];
}

export default memo(function GitHubFeedItem({
  item,
  isFocused,
  isExpanded,
  onToggleExpand,
  onFocus,
}: GitHubFeedItemProps) {
  const copySha = () => {
    if (item.sha) {
      navigator.clipboard.writeText(item.sha);
      toast.success("SHA copied");
    }
  };

  return (
    <button
      type="button"
      onClick={onFocus}
      className="group relative pl-[14px] pr-[10px] py-[8px] border bg-[var(--theme-background)] transition-all duration-150 cursor-pointer w-full text-left"
      style={
        isFocused
          ? {
              borderColor: "var(--theme-primary)",
              backgroundColor:
                "color-mix(in srgb, var(--theme-primary) 5%, transparent)",
            }
          : undefined
      }
      onMouseEnter={(e) => {
        if (!isFocused)
          (e.currentTarget as HTMLElement).style.borderColor =
            "color-mix(in srgb, var(--theme-primary) 50%, transparent)";
      }}
      onMouseLeave={(e) => {
        if (!isFocused)
          (e.currentTarget as HTMLElement).style.borderColor =
            "var(--theme-border)";
      }}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={getAccentStyle(item)}
      />

      {/* Compact row */}
      <div
        className="flex items-center gap-[8px] min-w-0"
        onClick={(e) => {
          e.stopPropagation();
          onToggleExpand();
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            onToggleExpand();
          }
        }}
      >
        {/* Type icon */}
        <div
          className="w-[20px] h-[20px] flex items-center justify-center border border-[var(--theme-border)] bg-[var(--theme-background-secondary)] shrink-0"
          style={getIconStyle(item)}
        >
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
            {item.draft && item.state !== "draft" && (
              <span
                className="shrink-0 px-[5px] py-[1px] font-mono text-[10px] font-bold uppercase"
                style={{
                  color: "var(--theme-warning)",
                  border:
                    "1px solid color-mix(in srgb, var(--theme-warning) 30%, transparent)",
                  backgroundColor:
                    "color-mix(in srgb, var(--theme-warning) 10%, transparent)",
                }}
              >
                DRAFT
              </span>
            )}
          </div>

          {/* Second line: task keys, branch, labels */}
          <div className="flex items-center gap-[6px] mt-[2px] flex-wrap">
            {item.linkedTaskKeys && item.linkedTaskKeys.length > 0 && (
              <div
                className="flex items-center gap-[4px] px-[5px] py-[1px]"
                style={{
                  color: "var(--theme-primary)",
                  border:
                    "1px solid color-mix(in srgb, var(--theme-primary) 20%, transparent)",
                  backgroundColor:
                    "color-mix(in srgb, var(--theme-primary) 10%, transparent)",
                }}
              >
                <FaLink className="w-[8px] h-[8px]" />
                {item.linkedTaskKeys.map((key) => (
                  <span key={key} className="font-mono text-[10px] font-bold">
                    {key}
                  </span>
                ))}
              </div>
            )}
            {item.branch && (
              <span
                className="inline-flex items-center gap-[3px] px-[5px] py-[1px] font-mono text-[10px]"
                style={{
                  color: "var(--theme-info)",
                  border:
                    "1px solid color-mix(in srgb, var(--theme-info) 20%, transparent)",
                  backgroundColor:
                    "color-mix(in srgb, var(--theme-info) 10%, transparent)",
                }}
              >
                <FaCodeBranch className="w-[8px] h-[8px]" />
                {item.branch}
              </span>
            )}
            {item.labels &&
              item.labels.slice(0, 3).map((label) => {
                const colorVar = getLabelColorVar(label);
                return (
                  <span
                    key={label}
                    className="px-[5px] py-[1px] font-mono text-[10px] font-bold"
                    style={{
                      color: colorVar,
                      border: `1px solid color-mix(in srgb, ${colorVar} 20%, transparent)`,
                      backgroundColor: `color-mix(in srgb, ${colorVar} 10%, transparent)`,
                    }}
                  >
                    {label}
                  </span>
                );
              })}
          </div>
        </div>

        {/* Right side: author + time */}
        <div className="flex items-center gap-[8px] shrink-0">
          <div className="flex items-center gap-[4px] font-mono text-brutal-xs text-[var(--theme-foreground)]/50">
            <div
              className="w-[16px] h-[16px] flex items-center justify-center text-[8px] font-bold shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, var(--theme-primary), var(--theme-border))",
                color: "var(--theme-background)",
              }}
            >
              {item.author.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:inline truncate max-w-[80px]">
              {item.author}
            </span>
          </div>
          <span className="font-mono text-brutal-xs text-[var(--theme-foreground)]/40 whitespace-nowrap">
            {formatTimestamp(item.timestamp)}
          </span>
        </div>
      </div>

      {/* Expanded view */}
      <AnimatePresence>
        {isExpanded && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-[8px] pt-[8px] border-t border-[var(--theme-border)] space-y-[6px]">
              {/* Commit: full message + copy SHA */}
              {item.type === "commit" && (
                <>
                  {item.body && item.body.includes("\n") && (
                    <pre className="text-brutal-xs text-[var(--theme-foreground)]/60 font-mono whitespace-pre-wrap bg-[var(--theme-background-secondary)] p-[8px] border border-[var(--theme-border)] max-h-[200px] overflow-y-auto">
                      {item.body}
                    </pre>
                  )}
                  {item.sha && (
                    <div className="flex items-center gap-[6px]">
                      <span className="font-mono text-brutal-xs text-[var(--theme-foreground)]/50">
                        SHA:
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copySha();
                        }}
                        className="flex items-center gap-[4px] px-[6px] py-[2px] bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] font-mono text-brutal-xs text-[var(--theme-foreground)]/60 hover:border-[var(--theme-primary)] transition-colors"
                      >
                        <FaCopy className="w-[10px] h-[10px] opacity-50" />
                        {item.sha}
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* PR: description, branch info, timestamps */}
              {item.type === "pr" && (
                <>
                  {item.body && (
                    <div className="text-brutal-xs text-[var(--theme-foreground)]/60 leading-relaxed max-h-[150px] overflow-y-auto">
                      {item.body.slice(0, 500)}
                      {item.body.length > 500 ? "..." : ""}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-[8px] font-mono text-brutal-xs text-[var(--theme-foreground)]/50">
                    {item.raw.headBranch && (
                      <span className="flex items-center gap-[4px]">
                        <FaCodeBranch className="w-[10px] h-[10px]" />
                        {item.raw.headBranch} &rarr;{" "}
                        {item.raw.baseBranch || "main"}
                      </span>
                    )}
                    {item.raw.mergedAt && (
                      <span>
                        Merged{" "}
                        {formatTimestamp(new Date(item.raw.mergedAt).getTime())}
                      </span>
                    )}
                    {item.raw.closedAt && !item.raw.mergedAt && (
                      <span>
                        Closed{" "}
                        {formatTimestamp(new Date(item.raw.closedAt).getTime())}
                      </span>
                    )}
                  </div>
                </>
              )}

              {/* Issue: body preview, assignees */}
              {item.type === "issue" && (
                <>
                  {item.body && (
                    <div className="text-brutal-xs text-[var(--theme-foreground)]/60 leading-relaxed max-h-[150px] overflow-y-auto">
                      {item.body.slice(0, 500)}
                      {item.body.length > 500 ? "..." : ""}
                    </div>
                  )}
                  {item.assignees && item.assignees.length > 0 && (
                    <div className="flex items-center gap-[6px]">
                      <span className="font-mono text-brutal-xs text-[var(--theme-foreground)]/50">
                        Assignees:
                      </span>
                      <div className="flex items-center gap-[4px]">
                        {item.assignees.map((a) => (
                          <div
                            key={a}
                            className="w-[18px] h-[18px] flex items-center justify-center text-[8px] font-bold"
                            style={{
                              background:
                                "linear-gradient(135deg, var(--theme-info), var(--theme-border))",
                              color: "var(--theme-background)",
                            }}
                            title={a}
                          >
                            {a.charAt(0).toUpperCase()}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {item.labels && item.labels.length > 0 && (
                    <div className="flex flex-wrap gap-[4px]">
                      {item.labels.map((label) => {
                        const colorVar = getLabelColorVar(label);
                        return (
                          <span
                            key={label}
                            className="px-[5px] py-[1px] font-mono text-[10px] font-bold"
                            style={{
                              color: colorVar,
                              border: `1px solid color-mix(in srgb, ${colorVar} 20%, transparent)`,
                              backgroundColor: `color-mix(in srgb, ${colorVar} 10%, transparent)`,
                            }}
                          >
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
                  className="inline-flex items-center gap-[4px] font-mono text-brutal-xs text-[var(--theme-primary)] hover:underline"
                >
                  <HiOutlineExternalLink className="w-[12px] h-[12px]" />
                  View on GitHub
                </a>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </button>
  );
});
