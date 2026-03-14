import { m } from "framer-motion";
import clsx from "clsx";
import BrutalCard from "@/components/ui/BrutalCard";

// ── Types ──

interface GitIntegrationCardProps {
  repositoryName?: string | null;
  repositoryUrl?: string | null;
  isConnected?: boolean;
  workflowPreset?: "agile" | "kanban" | "custom" | null;
  prsSynced?: number;
  commitsTracked?: number;
  onConfigure?: () => void;
}

export default function GitIntegrationCard({
  repositoryName,
  repositoryUrl,
  isConnected = false,
  workflowPreset,
  prsSynced = 0,
  commitsTracked = 0,
  onConfigure,
}: GitIntegrationCardProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <BrutalCard padding="none" className="overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F1F23]">
          <div className="flex items-center gap-2">
            <div
              className={clsx(
                "w-1.5 h-1.5 rounded-full shrink-0",
                isConnected ? "bg-[#22C55E]" : "bg-[#6B7280]",
              )}
            />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
              Git Integration
            </span>
          </div>
          {workflowPreset && (
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#6366F1] border border-[#6366F1]/30 px-2 py-0.5">
              {workflowPreset}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {isConnected && repositoryName ? (
            <>
              {/* Repository info */}
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-[#22C55E] shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
                {repositoryUrl ? (
                  <a
                    href={repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm text-[#F9FAFB] hover:text-[#6366F1] transition-colors truncate"
                  >
                    {repositoryName}
                  </a>
                ) : (
                  <span className="font-mono text-sm text-[#F9FAFB] truncate">
                    {repositoryName}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 font-mono text-xs text-[#9CA3AF]">
                <span>
                  <span className="text-[#F9FAFB] font-semibold">{prsSynced}</span> PRs synced
                </span>
                <span className="text-[#2E2E35]">|</span>
                <span>
                  <span className="text-[#F9FAFB] font-semibold">{commitsTracked}</span> commits tracked
                </span>
              </div>
            </>
          ) : (
            <p className="font-mono text-xs text-[#6B7280]">
              No repository connected. Connect a repo to enable git-driven task automation.
            </p>
          )}
        </div>

        {/* Footer */}
        {onConfigure && (
          <div className="px-4 py-3 border-t border-[#1F1F23]">
            <button
              onClick={onConfigure}
              className="font-mono text-xs font-semibold uppercase tracking-wider text-[#22C55E] hover:text-[#F9FAFB] transition-colors"
            >
              Configure &rarr;
            </button>
          </div>
        )}
      </BrutalCard>
    </m.div>
  );
}
