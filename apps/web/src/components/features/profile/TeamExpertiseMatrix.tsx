import { useState, useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { 
  HiOutlineX, 
  HiOutlineFilter,
  HiOutlineUser,
  HiOutlineCode,
  HiOutlineChartBar,
  HiOutlineSearch,
  HiOutlineDownload,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineSortAscending,
  HiOutlineSortDescending
} from 'react-icons/hi'
import clsx from 'clsx'
import DeveloperStatusIndicator from '../developer/DeveloperStatusIndicator'
import { useNavigate } from 'react-router-dom'

interface TeamExpertiseMatrixProps {
  workspaceId: Id<"workspaces">
  onClose?: () => void
  isModal?: boolean
}

type SortOption = 'name' | 'expertise' | 'status'
type ViewMode = 'matrix' | 'grouped'

export function TeamExpertiseMatrix({ workspaceId, onClose, isModal = false }: TeamExpertiseMatrixProps) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTech, setSelectedTech] = useState<string | null>(null)
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [showEmptySkills, setShowEmptySkills] = useState(true)
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const [sortAsc, setSortAsc] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('matrix')
  const [minLevel, setMinLevel] = useState(1)

  // Get team expertise matrix data
  const matrixData = useQuery(
    api.developers.queries.getTeamExpertiseMatrix,
    { workspaceId }
  )

  // Filter and sort data
  const processedData = useMemo(() => {
    if (!matrixData) return null

    // Filter technologies based on search
    let filteredTechs = matrixData.technologies
    if (searchQuery) {
      filteredTechs = filteredTechs.filter(tech => 
        tech.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter members if one is selected
    let filteredMembers = matrixData.members
    if (selectedMember) {
      filteredMembers = filteredMembers.filter(m => m.userId === selectedMember)
    }

    // Sort members
    const sortedMembers = [...filteredMembers].sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '')
          break
        case 'expertise':
          const aExpertise = a.expertise.length
          const bExpertise = b.expertise.length
          comparison = aExpertise - bExpertise
          break
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '')
          break
      }
      
      return sortAsc ? comparison : -comparison
    })

    // Filter technologies to only show those with experts if not showing empty
    if (!showEmptySkills) {
      filteredTechs = filteredTechs.filter(tech => 
        sortedMembers.some(member => 
          member.expertise.some(exp => exp.name === tech && exp.level >= minLevel)
        )
      )
    }

    return {
      technologies: filteredTechs,
      members: sortedMembers
    }
  }, [matrixData, searchQuery, selectedMember, sortBy, sortAsc, showEmptySkills, minLevel])

  const getExpertiseLevel = (level: number) => {
    if (level >= 8) return { label: 'EXP', color: 'bg-brutal-success', textColor: 'text-event-horizon' }
    if (level >= 6) return { label: 'ADV', color: 'bg-brutal-info', textColor: 'text-event-horizon' }
    if (level >= 4) return { label: 'INT', color: 'bg-brutal-warning', textColor: 'text-event-horizon' }
    if (level >= 2) return { label: 'BEG', color: 'bg-primary-brutalist/30', textColor: 'text-primary-brutalist' }
    return null
  }

  const getMemberExpertise = (memberId: string, tech: string) => {
    const member = processedData?.members.find(m => m.userId === memberId)
    if (!member) return null
    
    const expertise = member.expertise.find(e => e.name === tech)
    if (!expertise || expertise.level < minLevel) return null
    
    return getExpertiseLevel(expertise.level)
  }

  const handleMemberClick = (userId: string) => {
    if (isModal) {
      setSelectedMember(selectedMember === userId ? null : userId)
    } else {
      navigate(`/profile/${userId}`)
    }
  }

  const exportMatrix = () => {
    if (!processedData) return

    const csv = [
      ['Team Member', 'Status', ...processedData.technologies].join(','),
      ...processedData.members.map(member => {
        const row = [
          member.name || 'Unknown',
          member.status,
          ...processedData.technologies.map(tech => {
            const exp = member.expertise.find(e => e.name === tech)
            return exp ? exp.level : '0'
          })
        ]
        return row.map(cell => `"${cell}"`).join(',')
      })
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `team-expertise-matrix-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!processedData) {
    return (
      <div className="p-48px text-center">
        <div className="animate-pulse text-brutal-sm">Loading expertise matrix...</div>
      </div>
    )
  }

  const Container = isModal ? 'div' : 'div'
  const containerProps = isModal ? {
    className: "fixed inset-0 z-50 flex items-center justify-center bg-[var(--theme-background-secondary)]/80"
  } : {
    className: "p-24px"
  }

  return (
    <Container {...containerProps}>
      <div className={clsx(
        "bg-[var(--theme-background)] border-2 border-[var(--theme-border)]",
        isModal ? "w-full max-w-7xl max-h-[90vh] overflow-hidden shadow-brutal" : ""
      )}>
        {/* Header */}
        <div className="p-24px border-b-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-brutal-lg font-bold mb-8px flex items-center gap-12px">
                <HiOutlineChartBar className="w-24px h-24px" />
                TEAM EXPERTISE MATRIX
              </h2>
              <p className="font-mono text-brutal-sm text-primary-brutalist/80">
                {processedData.members.length} MEMBERS • {processedData.technologies.length} TECHNOLOGIES
              </p>
            </div>
            <div className="flex items-center gap-12px">
              <button
                onClick={exportMatrix}
                className="brutal-btn-secondary flex items-center gap-8px px-12px py-8px"
                title="Export as CSV"
              >
                <HiOutlineDownload className="w-16px h-16px" />
                <span className="font-mono text-brutal-xs">EXPORT</span>
              </button>
              {isModal && onClose && (
                <button
                  onClick={onClose}
                  className="brutal-btn-secondary p-8px"
                >
                  <HiOutlineX className="w-20px h-20px" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-16px border-b-2 border-[var(--theme-border)] bg-[var(--theme-background)]/50">
          <div className="flex flex-wrap items-center gap-12px">
            {/* Search */}
            <div className="flex-1 min-w-200px relative">
              <HiOutlineSearch className="absolute left-12px top-50% transform -translate-y-50% w-16px h-16px text-primary-brutalist/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="brutal-input w-full pl-40px pr-12px py-8px text-brutal-sm"
                placeholder="Search technologies..."
              />
            </div>

            {/* View Mode */}
            <div className="flex items-center gap-8px">
              <button
                onClick={() => setViewMode('matrix')}
                className={clsx(
                  "px-12px py-8px font-mono text-brutal-xs font-bold transition-all",
                  viewMode === 'matrix' 
                    ? "bg-primary-brutalist text-event-horizon" 
                    : "bg-basalt-border text-primary-brutalist hover:bg-primary-brutalist/20"
                )}
              >
                MATRIX
              </button>
              <button
                onClick={() => setViewMode('grouped')}
                className={clsx(
                  "px-12px py-8px font-mono text-brutal-xs font-bold transition-all",
                  viewMode === 'grouped' 
                    ? "bg-primary-brutalist text-event-horizon" 
                    : "bg-basalt-border text-primary-brutalist hover:bg-primary-brutalist/20"
                )}
              >
                GROUPED
              </button>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-8px">
              <span className="font-mono text-brutal-xs text-primary-brutalist/60">SORT:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="brutal-input px-8px py-4px text-brutal-xs"
              >
                <option value="name">NAME</option>
                <option value="expertise">EXPERTISE</option>
                <option value="status">STATUS</option>
              </select>
              <button
                onClick={() => setSortAsc(!sortAsc)}
                className="brutal-btn-secondary p-6px"
              >
                {sortAsc ? (
                  <HiOutlineSortAscending className="w-16px h-16px" />
                ) : (
                  <HiOutlineSortDescending className="w-16px h-16px" />
                )}
              </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-12px">
              <label className="flex items-center gap-6px">
                <input
                  type="checkbox"
                  checked={showEmptySkills}
                  onChange={(e) => setShowEmptySkills(e.target.checked)}
                  className="brutal-checkbox"
                />
                <span className="font-mono text-brutal-xs">SHOW ALL</span>
              </label>

              <div className="flex items-center gap-6px">
                <span className="font-mono text-brutal-xs text-primary-brutalist/60">MIN LEVEL:</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={minLevel}
                  onChange={(e) => setMinLevel(parseInt(e.target.value))}
                  className="w-60px"
                />
                <span className="font-mono text-brutal-xs font-bold w-20px">{minLevel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Matrix Content */}
        <div className="overflow-auto" style={{ maxHeight: isModal ? '60vh' : 'calc(100vh - 300px)' }}>
          {viewMode === 'matrix' ? (
            <div className="min-w-800px">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)] sticky top-0 z-10">
                    <th className="p-12px text-left font-mono text-brutal-xs font-bold text-primary-brutalist sticky left-0 bg-[var(--theme-background-secondary)] border-r-2 border-[var(--theme-border)] min-w-200px">
                      TEAM MEMBER
                    </th>
                    <th className="p-12px text-center font-mono text-brutal-xs font-bold text-primary-brutalist border-r-2 border-[var(--theme-border)]">
                      STATUS
                    </th>
                    {processedData.technologies.map((tech) => (
                      <th
                        key={tech}
                        className={clsx(
                          "p-12px text-center font-mono text-brutal-xs font-bold text-primary-brutalist border-r border-[var(--theme-border)]/50 cursor-pointer hover:bg-primary-brutalist/10",
                          selectedTech === tech && "bg-primary-brutalist/20"
                        )}
                        onClick={() => setSelectedTech(selectedTech === tech ? null : tech)}
                      >
                        <div className="writing-mode-vertical whitespace-nowrap">
                          {tech}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {processedData.members.map((member, idx) => (
                    <tr 
                      key={member.userId}
                      className={clsx(
                        "border-b border-[var(--theme-border)]/50 hover:bg-primary-brutalist/5 transition-colors",
                        selectedMember === member.userId && "bg-primary-brutalist/10",
                        idx % 2 === 0 ? "bg-[var(--theme-background)]" : "bg-[var(--theme-background-secondary)]"
                      )}
                    >
                      <td 
                        className="p-12px font-mono text-brutal-sm font-bold sticky left-0 border-r-2 border-[var(--theme-border)] cursor-pointer hover:text-primary-brutalist"
                        style={{ backgroundColor: idx % 2 === 0 ? 'var(--carbon-plate)' : 'var(--event-horizon)' }}
                        onClick={() => handleMemberClick(member.userId)}
                      >
                        <div className="flex items-center gap-8px">
                          <HiOutlineUser className="w-16px h-16px" />
                          {member.name || 'UNKNOWN'}
                        </div>
                      </td>
                      <td className="p-12px text-center border-r-2 border-[var(--theme-border)]">
                        <DeveloperStatusIndicator 
                          userId={member.userId as Id<"users">}
                          size="sm"
                          showLabel={false}
                        />
                      </td>
                      {processedData.technologies.map((tech) => {
                        const expertise = getMemberExpertise(member.userId, tech)
                        return (
                          <td
                            key={tech}
                            className={clsx(
                              "p-8px text-center border-r border-[var(--theme-border)]/30",
                              selectedTech === tech && "bg-primary-brutalist/10"
                            )}
                          >
                            {expertise && (
                              <div className={clsx(
                                "inline-flex items-center justify-center w-32px h-24px font-mono text-brutal-xs font-bold",
                                expertise.color,
                                expertise.textColor
                              )}>
                                {expertise.label}
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            // Grouped View
            <div className="p-24px grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16px">
              {processedData.technologies.map((tech) => {
                const experts = processedData.members.filter(member =>
                  member.expertise.some(e => e.name === tech && e.level >= minLevel)
                ).sort((a, b) => {
                  const aLevel = a.expertise.find(e => e.name === tech)?.level || 0
                  const bLevel = b.expertise.find(e => e.name === tech)?.level || 0
                  return bLevel - aLevel
                })

                if (!showEmptySkills && experts.length === 0) return null

                return (
                  <div key={tech} className="brutal-card p-16px">
                    <h3 className="font-mono text-brutal-sm font-bold mb-12px flex items-center gap-8px">
                      <HiOutlineCode className="w-16px h-16px" />
                      {tech}
                      <span className="text-brutal-xs text-primary-brutalist/60">({experts.length})</span>
                    </h3>
                    {experts.length === 0 ? (
                      <p className="font-mono text-brutal-xs text-primary-brutalist/40">No experts</p>
                    ) : (
                      <div className="space-y-8px">
                        {experts.map((member) => {
                          const expertise = member.expertise.find(e => e.name === tech)!
                          const level = getExpertiseLevel(expertise.level)!
                          
                          return (
                            <div
                              key={member.userId}
                              className="flex items-center justify-between p-8px bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] hover:border-primary-brutalist cursor-pointer transition-all"
                              onClick={() => handleMemberClick(member.userId)}
                            >
                              <div className="flex items-center gap-8px">
                                <DeveloperStatusIndicator 
                                  userId={member.userId as Id<"users">}
                                  size="sm"
                                  showLabel={false}
                                />
                                <span className="font-mono text-brutal-xs">
                                  {member.name || 'Unknown'}
                                </span>
                              </div>
                              <div className={clsx(
                                "px-8px py-4px font-mono text-brutal-xs font-bold",
                                level.color,
                                level.textColor
                              )}>
                                {level.label}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="p-16px border-t-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-16px">
              <span className="font-mono text-brutal-xs font-bold text-primary-brutalist">EXPERTISE LEVELS:</span>
              <div className="flex items-center gap-12px">
                <div className="flex items-center gap-4px">
                  <div className="w-32px h-20px bg-primary-brutalist/30 flex items-center justify-center">
                    <span className="font-mono text-brutal-xs font-bold">BEG</span>
                  </div>
                  <span className="font-mono text-brutal-xs text-primary-brutalist/60">BEGINNER (2-3)</span>
                </div>
                <div className="flex items-center gap-4px">
                  <div className="w-32px h-20px bg-brutal-warning flex items-center justify-center">
                    <span className="font-mono text-brutal-xs font-bold text-event-horizon">INT</span>
                  </div>
                  <span className="font-mono text-brutal-xs text-primary-brutalist/60">INTERMEDIATE (4-5)</span>
                </div>
                <div className="flex items-center gap-4px">
                  <div className="w-32px h-20px bg-brutal-info flex items-center justify-center">
                    <span className="font-mono text-brutal-xs font-bold text-event-horizon">ADV</span>
                  </div>
                  <span className="font-mono text-brutal-xs text-primary-brutalist/60">ADVANCED (6-7)</span>
                </div>
                <div className="flex items-center gap-4px">
                  <div className="w-32px h-20px bg-brutal-success flex items-center justify-center">
                    <span className="font-mono text-brutal-xs font-bold text-event-horizon">EXP</span>
                  </div>
                  <span className="font-mono text-brutal-xs text-primary-brutalist/60">EXPERT (8-10)</span>
                </div>
              </div>
            </div>
            {selectedTech && (
              <div className="font-mono text-brutal-xs text-primary-brutalist/60">
                Selected: <span className="font-bold text-primary-brutalist">{selectedTech}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .writing-mode-vertical {
          writing-mode: vertical-rl;
          text-orientation: mixed;
          max-height: 120px;
        }
      `}</style>
    </Container>
  )
}