import { useReducer, useMemo } from 'react'
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

type MatrixState = {
  searchQuery: string
  selectedTech: string | null
  selectedMember: string | null
  showEmptySkills: boolean
  sortBy: SortOption
  sortAsc: boolean
  viewMode: ViewMode
  minLevel: number
}

const matrixInitialState: MatrixState = {
  searchQuery: '',
  selectedTech: null,
  selectedMember: null,
  showEmptySkills: true,
  sortBy: 'name',
  sortAsc: true,
  viewMode: 'matrix',
  minLevel: 1,
}

type MatrixAction = { type: 'UPDATE'; field: keyof MatrixState; value: unknown }

function matrixReducer(state: MatrixState, action: MatrixAction): MatrixState {
  switch (action.type) {
    case 'UPDATE':
      return { ...state, [action.field]: action.value }
    default:
      return state
  }
}

// --- Sub-components ---

interface MatrixControlsProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  sortBy: SortOption
  onSortByChange: (sort: SortOption) => void
  sortAsc: boolean
  onSortAscToggle: () => void
  showEmptySkills: boolean
  onShowEmptySkillsChange: (show: boolean) => void
  minLevel: number
  onMinLevelChange: (level: number) => void
}

function MatrixControls({ searchQuery, onSearchChange, viewMode, onViewModeChange, sortBy, onSortByChange, sortAsc, onSortAscToggle, showEmptySkills, onShowEmptySkillsChange, minLevel, onMinLevelChange }: MatrixControlsProps) {
  return (
    <div className="p-[10px] border-b-2 border-[var(--theme-border)] bg-[var(--theme-background)]/50">
      <div className="flex flex-wrap items-center gap-[6px]">
        <div className="flex-1 min-w-200px relative">
          <HiOutlineSearch className="absolute left-12px top-50% transform -translate-y-50% w-4 h-4 text-primary-brutalist/60" />
          <input
            id="team-matrix-search"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="brutal-input w-full pl-40px pr-[6px] py-[4px] text-brutal-sm"
            placeholder="Search technologies..."
            aria-label="Search technologies"
          />
        </div>

        <div className="flex items-center gap-[4px]">
          <button
            onClick={() => onViewModeChange('matrix')}
            className={clsx(
              "px-[8px] py-[4px] font-mono text-brutal-xs font-bold transition-all",
              viewMode === 'matrix'
                ? "bg-primary-brutalist text-event-horizon"
                : "bg-basalt-border text-primary-brutalist hover:bg-primary-brutalist/20"
            )}
          >
            MATRIX
          </button>
          <button
            onClick={() => onViewModeChange('grouped')}
            className={clsx(
              "px-[8px] py-[4px] font-mono text-brutal-xs font-bold transition-all",
              viewMode === 'grouped'
                ? "bg-primary-brutalist text-event-horizon"
                : "bg-basalt-border text-primary-brutalist hover:bg-primary-brutalist/20"
            )}
          >
            GROUPED
          </button>
        </div>

        <div className="flex items-center gap-[4px]">
          <label htmlFor="team-matrix-sort" className="font-mono text-brutal-xs text-primary-brutalist/60">SORT:</label>
          <select
            id="team-matrix-sort"
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as SortOption)}
            className="brutal-input px-[4px] py-4px text-brutal-xs"
          >
            <option value="name">NAME</option>
            <option value="expertise">EXPERTISE</option>
            <option value="status">STATUS</option>
          </select>
          <button
            onClick={onSortAscToggle}
            className="brutal-btn-secondary p-6px"
          >
            {sortAsc ? (
              <HiOutlineSortAscending className="w-4 h-4" />
            ) : (
              <HiOutlineSortDescending className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-[6px]">
          <label htmlFor="team-matrix-show-all" className="flex items-center gap-6px">
            <input
              id="team-matrix-show-all"
              type="checkbox"
              checked={showEmptySkills}
              onChange={(e) => onShowEmptySkillsChange(e.target.checked)}
              className="brutal-checkbox"
            />
            <span className="font-mono text-brutal-xs">SHOW ALL</span>
          </label>

          <div className="flex items-center gap-6px">
            <label htmlFor="team-matrix-min-level" className="font-mono text-brutal-xs text-primary-brutalist/60">MIN LEVEL:</label>
            <input
              id="team-matrix-min-level"
              type="range"
              min="1"
              max="10"
              value={minLevel}
              onChange={(e) => onMinLevelChange(parseInt(e.target.value))}
              className="w-60px"
            />
            <span className="font-mono text-brutal-xs font-bold w-5">{minLevel}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ExpertiseLevelInfo {
  label: string
  color: string
  textColor: string
}

interface MatrixMember {
  userId: string
  name: string | null
  status: string
  expertise: Array<{ name: string; level: number }>
}

interface MatrixTableViewProps {
  technologies: string[]
  members: MatrixMember[]
  selectedTech: string | null
  selectedMember: string | null
  onSelectTech: (tech: string | null) => void
  onMemberClick: (userId: string) => void
  getMemberExpertise: (memberId: string, tech: string) => ExpertiseLevelInfo | null
}

function MatrixTableView({ technologies, members, selectedTech, selectedMember, onSelectTech, onMemberClick, getMemberExpertise }: MatrixTableViewProps) {
  return (
    <div className="min-w-800px">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)] sticky top-0 z-10">
            <th className="p-[8px] text-left font-mono text-brutal-xs font-bold text-primary-brutalist sticky left-0 bg-[var(--theme-background-secondary)] border-r-2 border-[var(--theme-border)] min-w-200px">
              TEAM MEMBER
            </th>
            <th className="p-[8px] text-center font-mono text-brutal-xs font-bold text-primary-brutalist border-r-2 border-[var(--theme-border)]">
              STATUS
            </th>
            {technologies.map((tech) => (
              <th
                key={tech}
                className={clsx(
                  "p-[8px] text-center font-mono text-brutal-xs font-bold text-primary-brutalist border-r border-[var(--theme-border)]/50 cursor-pointer hover:bg-primary-brutalist/10",
                  selectedTech === tech && "bg-primary-brutalist/20"
                )}
                onClick={() => onSelectTech(selectedTech === tech ? null : tech)}
              >
                <div className="writing-mode-vertical whitespace-nowrap">
                  {tech}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((member, idx) => (
            <tr
              key={member.userId}
              className={clsx(
                "border-b border-[var(--theme-border)]/50 hover:bg-primary-brutalist/5 transition-colors",
                selectedMember === member.userId && "bg-primary-brutalist/10",
                idx % 2 === 0 ? "bg-[var(--theme-background)]" : "bg-[var(--theme-background-secondary)]"
              )}
            >
              <td
                className="p-[8px] font-mono text-brutal-sm font-bold sticky left-0 border-r-2 border-[var(--theme-border)]"
                style={{ backgroundColor: idx % 2 === 0 ? 'var(--carbon-plate)' : 'var(--event-horizon)' }}
              >
                <button
                  type="button"
                  className="flex items-center gap-[4px] cursor-pointer hover:text-primary-brutalist w-full text-left"
                  onClick={() => onMemberClick(member.userId)}
                >
                  <HiOutlineUser className="w-4 h-4" />
                  {member.name || 'UNKNOWN'}
                </button>
              </td>
              <td className="p-[8px] text-center border-r-2 border-[var(--theme-border)]">
                <DeveloperStatusIndicator
                  userId={member.userId as Id<"users">}
                  size="sm"
                  showLabel={false}
                />
              </td>
              {technologies.map((tech) => {
                const expertise = getMemberExpertise(member.userId, tech)
                return (
                  <td
                    key={tech}
                    className={clsx(
                      "p-[4px] text-center border-r border-[var(--theme-border)]/30",
                      selectedTech === tech && "bg-primary-brutalist/10"
                    )}
                  >
                    {expertise && (
                      <div className={clsx(
                        "inline-flex items-center justify-center w-5 h-4 font-mono text-brutal-xs font-bold",
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
  )
}

interface GroupedViewProps {
  technologies: string[]
  members: MatrixMember[]
  minLevel: number
  showEmptySkills: boolean
  getExpertiseLevel: (level: number) => ExpertiseLevelInfo | null
  onMemberClick: (userId: string) => void
}

function GroupedView({ technologies, members, minLevel, showEmptySkills, getExpertiseLevel, onMemberClick }: GroupedViewProps) {
  return (
    <div className="p-[16px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[8px]">
      {technologies.map((tech) => {
        const experts = members.filter(member =>
          member.expertise.some(e => e.name === tech && e.level >= minLevel)
        ).sort((a, b) => {
          const aLevel = a.expertise.find(e => e.name === tech)?.level || 0
          const bLevel = b.expertise.find(e => e.name === tech)?.level || 0
          return bLevel - aLevel
        })

        if (!showEmptySkills && experts.length === 0) return null

        return (
          <div key={tech} className="brutal-card p-[10px]">
            <h3 className="font-mono text-brutal-sm font-bold mb-[6px] flex items-center gap-[4px]">
              <HiOutlineCode className="w-4 h-4" />
              {tech}
              <span className="text-brutal-xs text-primary-brutalist/60">({experts.length})</span>
            </h3>
            {experts.length === 0 ? (
              <p className="font-mono text-brutal-xs text-primary-brutalist/40">No experts</p>
            ) : (
              <div className="space-y-[4px]">
                {experts.map((member) => {
                  const expertise = member.expertise.find(e => e.name === tech)!
                  const level = getExpertiseLevel(expertise.level)!

                  return (
                    <button
                      type="button"
                      key={member.userId}
                      className="flex items-center justify-between p-[4px] bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] hover:border-primary-brutalist cursor-pointer transition-all w-full text-left"
                      onClick={() => onMemberClick(member.userId)}
                    >
                      <div className="flex items-center gap-[4px]">
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
                        "px-[4px] py-4px font-mono text-brutal-xs font-bold",
                        level.color,
                        level.textColor
                      )}>
                        {level.label}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

interface ExpertiseLegendProps {
  selectedTech: string | null
}

function ExpertiseLegend({ selectedTech }: ExpertiseLegendProps) {
  return (
    <div className="p-[10px] border-t-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[8px]">
          <span className="font-mono text-brutal-xs font-bold text-primary-brutalist">EXPERTISE LEVELS:</span>
          <div className="flex items-center gap-[6px]">
            <div className="flex items-center gap-4px">
              <div className="w-5 h-5 bg-primary-brutalist/30 flex items-center justify-center">
                <span className="font-mono text-brutal-xs font-bold">BEG</span>
              </div>
              <span className="font-mono text-brutal-xs text-primary-brutalist/60">BEGINNER (2-3)</span>
            </div>
            <div className="flex items-center gap-4px">
              <div className="w-5 h-5 bg-brutal-warning flex items-center justify-center">
                <span className="font-mono text-brutal-xs font-bold text-event-horizon">INT</span>
              </div>
              <span className="font-mono text-brutal-xs text-primary-brutalist/60">INTERMEDIATE (4-5)</span>
            </div>
            <div className="flex items-center gap-4px">
              <div className="w-5 h-5 bg-brutal-info flex items-center justify-center">
                <span className="font-mono text-brutal-xs font-bold text-event-horizon">ADV</span>
              </div>
              <span className="font-mono text-brutal-xs text-primary-brutalist/60">ADVANCED (6-7)</span>
            </div>
            <div className="flex items-center gap-4px">
              <div className="w-5 h-5 bg-brutal-success flex items-center justify-center">
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
  )
}

// --- Main Component ---

export function TeamExpertiseMatrix({ workspaceId, onClose, isModal = false }: TeamExpertiseMatrixProps) {
  const navigate = useNavigate()
  const [state, dispatch] = useReducer(matrixReducer, matrixInitialState)
  const { searchQuery, selectedTech, selectedMember, showEmptySkills, sortBy, sortAsc, viewMode, minLevel } = state

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
      dispatch({ type: 'UPDATE', field: 'selectedMember', value: selectedMember === userId ? null : userId })
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
      <div className="p-[24px] text-center">
        <div className="animate-pulse text-brutal-sm">Loading expertise matrix...</div>
      </div>
    )
  }

  const Container = isModal ? 'div' : 'div'
  const containerProps = isModal ? {
    className: "fixed inset-0 z-50 flex items-center justify-center bg-[var(--theme-background-secondary)]/80 backdrop-blur-sm"
  } : {
    className: "p-[16px]"
  }

  return (
    <Container {...containerProps}>
      <div className={clsx(
        "bg-[var(--theme-background)] border-2 border-[var(--theme-border)]",
        isModal ? "w-full max-w-7xl max-h-[90vh] overflow-hidden shadow-brutal" : ""
      )}>
        {/* Header */}
        <div className="p-[16px] border-b-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[14px] font-semibold font-bold mb-[4px] flex items-center gap-[6px]">
                <HiOutlineChartBar className="w-4 h-4" />
                TEAM EXPERTISE MATRIX
              </h2>
              <p className="font-mono text-brutal-sm text-primary-brutalist/80">
                {processedData.members.length} MEMBERS • {processedData.technologies.length} TECHNOLOGIES
              </p>
            </div>
            <div className="flex items-center gap-[6px]">
              <button
                onClick={exportMatrix}
                className="brutal-btn-secondary flex items-center gap-[4px] px-[8px] py-[4px]"
                title="Export as CSV"
              >
                <HiOutlineDownload className="w-4 h-4" />
                <span className="font-mono text-brutal-xs">EXPORT</span>
              </button>
              {isModal && onClose && (
                <button
                  onClick={onClose}
                  className="brutal-btn-secondary p-[4px]"
                >
                  <HiOutlineX className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        <MatrixControls
          searchQuery={searchQuery}
          onSearchChange={(q) => dispatch({ type: 'UPDATE', field: 'searchQuery', value: q })}
          viewMode={viewMode}
          onViewModeChange={(m) => dispatch({ type: 'UPDATE', field: 'viewMode', value: m })}
          sortBy={sortBy}
          onSortByChange={(s) => dispatch({ type: 'UPDATE', field: 'sortBy', value: s })}
          sortAsc={sortAsc}
          onSortAscToggle={() => dispatch({ type: 'UPDATE', field: 'sortAsc', value: !sortAsc })}
          showEmptySkills={showEmptySkills}
          onShowEmptySkillsChange={(s) => dispatch({ type: 'UPDATE', field: 'showEmptySkills', value: s })}
          minLevel={minLevel}
          onMinLevelChange={(l) => dispatch({ type: 'UPDATE', field: 'minLevel', value: l })}
        />

        {/* Matrix Content */}
        <div className="overflow-auto" style={{ maxHeight: isModal ? '60vh' : 'calc(100vh - 300px)' }}>
          {viewMode === 'matrix' ? (
            <MatrixTableView
              technologies={processedData.technologies}
              members={processedData.members}
              selectedTech={selectedTech}
              selectedMember={selectedMember}
              onSelectTech={(tech) => dispatch({ type: 'UPDATE', field: 'selectedTech', value: tech })}
              onMemberClick={handleMemberClick}
              getMemberExpertise={getMemberExpertise}
            />
          ) : (
            <GroupedView
              technologies={processedData.technologies}
              members={processedData.members}
              minLevel={minLevel}
              showEmptySkills={showEmptySkills}
              getExpertiseLevel={getExpertiseLevel}
              onMemberClick={handleMemberClick}
            />
          )}
        </div>

        <ExpertiseLegend selectedTech={selectedTech} />
      </div>

      <style>{`
        .writing-mode-vertical {
          writing-mode: vertical-rl;
          text-orientation: mixed;
          max-height: 120px;
        }
      `}</style>
    </Container>
  )
}