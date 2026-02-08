import { FaGithub, FaSlack, FaDiscord, FaJira } from 'react-icons/fa'
import { HiOutlineViewGrid } from 'react-icons/hi'
import clsx from 'clsx'

type Source = 'slack' | 'github' | 'discord' | 'jira' | 'internal'

interface SourceFilterProps {
  selectedSources: Source[]
  onSourcesChange: (sources: Source[]) => void
  stats: {
    bySource: Array<{ source: string; channelCount: number; messageCount: number }>
  } | null | undefined
}

const SOURCES: Array<{ key: Source; label: string; icon: any; color: string }> = [
  { key: 'slack', label: 'Slack', icon: FaSlack, color: '#4A154B' },
  { key: 'github', label: 'GitHub', icon: FaGithub, color: '#F9FAFB' },
  { key: 'discord', label: 'Discord', icon: FaDiscord, color: '#5865F2' },
  { key: 'jira', label: 'Jira', icon: FaJira, color: '#0052CC' },
]

export default function SourceFilter({ selectedSources, onSourcesChange, stats }: SourceFilterProps) {
  const isAllSelected = selectedSources.length === 0

  const toggleSource = (source: Source) => {
    if (selectedSources.includes(source)) {
      onSourcesChange(selectedSources.filter((s) => s !== source))
    } else {
      onSourcesChange([...selectedSources, source])
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* All button */}
      <button
        onClick={() => onSourcesChange([])}
        className={clsx(
          'flex items-center gap-1.5 px-2.5 py-1.5 border-2 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors',
          isAllSelected
            ? 'border-[#6366F1] bg-[#6366F1]/10 text-[#6366F1]'
            : 'border-[#2E2E35] bg-[#0A0A0A] text-[#6B7280] hover:border-[#6366F1]/50'
        )}
      >
        <HiOutlineViewGrid className="w-3 h-3" />
        All
      </button>

      {/* Per-source filters */}
      {SOURCES.map((source) => {
        const Icon = source.icon
        const isSelected = selectedSources.includes(source.key)
        const sourceData = stats?.bySource?.find((s) => s.source === source.key)
        const count = sourceData?.messageCount ?? 0

        return (
          <button
            key={source.key}
            onClick={() => toggleSource(source.key)}
            className={clsx(
              'flex items-center gap-1.5 px-2.5 py-1.5 border-2 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors',
              isSelected
                ? 'border-[#6366F1] bg-[#6366F1]/10 text-[#F9FAFB]'
                : 'border-[#2E2E35] bg-[#0A0A0A] text-[#6B7280] hover:border-[#6366F1]/50 hover:text-[#9CA3AF]'
            )}
          >
            <Icon className="w-3 h-3" style={{ color: isSelected ? source.color : undefined }} />
            {source.label}
            {count > 0 && (
              <span className="text-[#6B7280] font-normal">{count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
