import { useReducer, useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import {
  HiOutlineX,
  HiOutlineUser,
  HiOutlineCode,
  HiOutlineChartBar,
  HiOutlineSearch,
  HiOutlineDownload,
  HiOutlineSortAscending,
  HiOutlineSortDescending
} from 'react-icons/hi'
import clsx from 'clsx'
import BrutalSelect from '@/components/ui/BrutalSelect'
import DeveloperStatusIndicator from '@/components/features/developer/DeveloperStatusIndicator'
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
  if (action.type === 'UPDATE') return { ...state, [action.field]: action.value }
  return state
}

// --- Expertise level helpers ---

interface ExpertiseLevelInfo {
  label: string
  abbr: string
  bg: string
  text: string
  border: string
}

function getExpertiseLevel(level: number): ExpertiseLevelInfo | null {
  if (level >= 8) return { label: 'Expert', abbr: 'EXP', bg: 'bg-[#22C55E]/15', text: 'text-[#22C55E]', border: 'border-[#22C55E]/30' }
  if (level >= 6) return { label: 'Advanced', abbr: 'ADV', bg: 'bg-[#6366F1]/15', text: 'text-[#6366F1]', border: 'border-[#6366F1]/30' }
  if (level >= 4) return { label: 'Intermediate', abbr: 'INT', bg: 'bg-[#F59E0B]/15', text: 'text-[#F59E0B]', border: 'border-[#F59E0B]/30' }
  if (level >= 2) return { label: 'Beginner', abbr: 'BEG', bg: 'bg-[var(--theme-foreground-tertiary)]/10', text: 'text-[var(--theme-foreground-tertiary)]', border: 'border-[var(--theme-foreground-tertiary)]/20' }
  return null
}

// --- Sub-components ---

interface MatrixMember {
  userId: string
  name: string | null
  status: string
  expertise: Array<{ name: string; level: number }>
}

function ExpertiseCell({ level }: { level: ExpertiseLevelInfo | null }) {
  if (!level) return <div className="w-full h-full" />
  return (
    <div className={clsx(
      'inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono font-bold border',
      level.bg, level.text, level.border
    )}>
      {level.abbr}
    </div>
  )
}

function MatrixTableView({
  technologies, members, selectedTech, onSelectTech, onMemberClick, getMemberExpertise
}: {
  technologies: string[]
  members: MatrixMember[]
  selectedTech: string | null
  selectedMember: string | null
  onSelectTech: (tech: string | null) => void
  onMemberClick: (userId: string) => void
  getMemberExpertise: (memberId: string, tech: string) => ExpertiseLevelInfo | null
}) {
  if (members.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-[var(--theme-foreground-tertiary)]">No team members found.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-[var(--theme-border)]">
            <th className="sticky left-0 z-10 bg-[var(--theme-background-secondary)] p-3 text-left text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--theme-foreground-secondary)] border-r border-[var(--theme-border)] min-w-[200px]">
              Team Member
            </th>
            <th className="bg-[var(--theme-background-secondary)] p-3 text-center text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--theme-foreground-secondary)] border-r border-[var(--theme-border)] min-w-[80px]">
              Status
            </th>
            {technologies.map((tech) => (
              <th
                key={tech}
                className={clsx(
                  'bg-[var(--theme-background-secondary)] p-2 text-center text-[11px] font-mono font-bold uppercase tracking-wider border-r border-[var(--theme-border)]/50 cursor-pointer hover:bg-[var(--theme-hover)] transition-colors min-w-[60px]',
                  selectedTech === tech ? 'text-[#6366F1] bg-[#6366F1]/10' : 'text-[var(--theme-foreground-secondary)]'
                )}
                onClick={() => onSelectTech(selectedTech === tech ? null : tech)}
                title={`Click to highlight ${tech}`}
              >
                <div className="whitespace-nowrap" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', maxHeight: '100px' }}>
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
                'border-b border-[var(--theme-border)]/50 hover:bg-[var(--theme-hover)] transition-colors',
                idx % 2 === 0 ? 'bg-[var(--theme-background)]' : 'bg-[var(--theme-background-secondary)]/50'
              )}
            >
              <td className={clsx(
                'sticky left-0 z-[5] p-3 border-r border-[var(--theme-border)]',
                idx % 2 === 0 ? 'bg-[var(--theme-background)]' : 'bg-[var(--theme-background-secondary)]'
              )}>
                <button
                  type="button"
                  className="flex items-center gap-2 text-sm font-medium text-[var(--theme-foreground)] hover:text-[#6366F1] transition-colors w-full text-left"
                  onClick={() => onMemberClick(member.userId)}
                >
                  <HiOutlineUser className="w-3.5 h-3.5 text-[var(--theme-foreground-tertiary)] shrink-0" />
                  {member.name || 'Unknown'}
                </button>
              </td>
              <td className="p-3 text-center border-r border-[var(--theme-border)]">
                <DeveloperStatusIndicator
                  userId={member.userId as Id<"users">}
                  size="sm"
                  showLabel={false}
                />
              </td>
              {technologies.map((tech) => (
                <td
                  key={tech}
                  className={clsx(
                    'p-2 text-center border-r border-[var(--theme-border)]/30',
                    selectedTech === tech && 'bg-[#6366F1]/5'
                  )}
                >
                  <ExpertiseCell level={getMemberExpertise(member.userId, tech)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function GroupedView({
  technologies, members, minLevel, showEmptySkills, onMemberClick
}: {
  technologies: string[]
  members: MatrixMember[]
  minLevel: number
  showEmptySkills: boolean
  onMemberClick: (userId: string) => void
}) {
  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {technologies.map((tech) => {
        const experts = members
          .filter(m => m.expertise.some(e => e.name === tech && e.level >= minLevel))
          .sort((a, b) => {
            const aL = a.expertise.find(e => e.name === tech)?.level || 0
            const bL = b.expertise.find(e => e.name === tech)?.level || 0
            return bL - aL
          })

        if (!showEmptySkills && experts.length === 0) return null

        return (
          <div key={tech} className="border border-[var(--theme-border)] bg-[var(--theme-card)] p-3">
            <h3 className="text-xs font-mono font-bold text-[var(--theme-foreground)] mb-2 flex items-center gap-1.5">
              <HiOutlineCode className="w-3.5 h-3.5 text-[#6366F1]" />
              {tech}
              <span className="text-[var(--theme-foreground-tertiary)] font-normal">({experts.length})</span>
            </h3>
            {experts.length === 0 ? (
              <p className="text-xs text-[var(--theme-foreground-tertiary)]">No experts yet</p>
            ) : (
              <div className="space-y-1">
                {experts.map((member) => {
                  const exp = member.expertise.find(e => e.name === tech)!
                  const level = getExpertiseLevel(exp.level)!
                  return (
                    <button
                      type="button"
                      key={member.userId}
                      className="flex items-center justify-between p-2 bg-[var(--theme-background)] border border-[var(--theme-border)] hover:border-[#6366F1]/50 transition-colors w-full text-left"
                      onClick={() => onMemberClick(member.userId)}
                    >
                      <div className="flex items-center gap-2">
                        <DeveloperStatusIndicator
                          userId={member.userId as Id<"users">}
                          size="sm"
                          showLabel={false}
                        />
                        <span className="text-xs text-[var(--theme-foreground)]">
                          {member.name || 'Unknown'}
                        </span>
                      </div>
                      <ExpertiseCell level={level} />
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

// --- Main Component ---

export function TeamExpertiseMatrix({ workspaceId, onClose, isModal = false }: TeamExpertiseMatrixProps) {
  const navigate = useNavigate()
  const [state, dispatch] = useReducer(matrixReducer, matrixInitialState)
  const { searchQuery, selectedTech, selectedMember, showEmptySkills, sortBy, sortAsc, viewMode, minLevel } = state

  const matrixData = useQuery(api.developers.queries.getTeamExpertiseMatrix, { workspaceId })

  const processedData = useMemo(() => {
    if (!matrixData) return null

    let filteredTechs = matrixData.technologies
    if (searchQuery) {
      filteredTechs = filteredTechs.filter(tech =>
        tech.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    let filteredMembers = matrixData.members
    if (selectedMember) {
      filteredMembers = filteredMembers.filter(m => m.userId === selectedMember)
    }

    const sortedMembers = [...filteredMembers].sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '')
          break
        case 'expertise':
          comparison = a.expertise.length - b.expertise.length
          break
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '')
          break
      }
      return sortAsc ? comparison : -comparison
    })

    if (!showEmptySkills) {
      filteredTechs = filteredTechs.filter(tech =>
        sortedMembers.some(member =>
          member.expertise.some(exp => exp.name === tech && exp.level >= minLevel)
        )
      )
    }

    return { technologies: filteredTechs, members: sortedMembers }
  }, [matrixData, searchQuery, selectedMember, sortBy, sortAsc, showEmptySkills, minLevel])

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
      <div className="p-8 text-center">
        <div className="text-sm text-[var(--theme-foreground-tertiary)] animate-pulse">Loading expertise matrix...</div>
      </div>
    )
  }

  const update = (field: keyof MatrixState, value: unknown) =>
    dispatch({ type: 'UPDATE', field, value })

  const content = (
    <div className={clsx(
      'bg-[var(--theme-background)] border-2 border-[var(--theme-border)] flex flex-col',
      isModal ? 'w-full max-w-6xl max-h-[90vh] shadow-[4px_4px_0px_rgba(0,0,0,0.8)]' : ''
    )}>
      {/* Header */}
      <div className="px-5 py-4 border-b-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)] flex items-start justify-between shrink-0">
        <div>
          <h2 className="text-sm font-bold text-[var(--theme-foreground)] flex items-center gap-2">
            <HiOutlineChartBar className="w-4 h-4 text-[#6366F1]" />
            TEAM EXPERTISE MATRIX
          </h2>
          <p className="text-xs font-mono text-[var(--theme-foreground-tertiary)] mt-1">
            {processedData.members.length} members · {processedData.technologies.length} technologies
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportMatrix}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono font-bold uppercase border border-[var(--theme-border)] text-[var(--theme-foreground-secondary)] hover:border-[#6366F1] hover:text-[#6366F1] transition-colors"
          >
            <HiOutlineDownload className="w-3.5 h-3.5" />
            Export
          </button>
          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 border border-[var(--theme-border)] text-[var(--theme-foreground-secondary)] hover:border-[#EF4444] hover:text-[#EF4444] transition-colors"
            >
              <HiOutlineX className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="px-5 py-3 border-b border-[var(--theme-border)] bg-[var(--theme-background)]/50 shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-[300px]">
            <HiOutlineSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--theme-foreground-tertiary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => update('searchQuery', e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] text-[var(--theme-foreground)] placeholder:text-[var(--theme-foreground-tertiary)] focus:outline-none focus:border-[#6366F1]/50"
              placeholder="Search technologies..."
            />
          </div>

          {/* View mode */}
          <div className="flex items-center border border-[var(--theme-border)]">
            {(['matrix', 'grouped'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => update('viewMode', mode)}
                className={clsx(
                  'px-3 py-1.5 text-[11px] font-mono font-bold uppercase transition-colors',
                  viewMode === mode
                    ? 'bg-[#6366F1] text-white'
                    : 'text-[var(--theme-foreground-secondary)] hover:bg-[var(--theme-hover)]'
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5">
            <BrutalSelect
              value={sortBy}
              onChange={(v) => update('sortBy', v)}
              options={[
                { value: 'name', label: 'Name' },
                { value: 'expertise', label: 'Expertise' },
                { value: 'status', label: 'Status' },
              ]}
              compact
            />
            <button
              onClick={() => update('sortAsc', !sortAsc)}
              className="p-1.5 border border-[var(--theme-border)] text-[var(--theme-foreground-secondary)] hover:border-[#6366F1]/50 transition-colors"
            >
              {sortAsc
                ? <HiOutlineSortAscending className="w-3.5 h-3.5" />
                : <HiOutlineSortDescending className="w-3.5 h-3.5" />
              }
            </button>
          </div>

          {/* Show all + min level */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showEmptySkills}
                onChange={(e) => update('showEmptySkills', e.target.checked)}
                className="w-3.5 h-3.5 accent-[#6366F1]"
              />
              <span className="text-[11px] font-mono text-[var(--theme-foreground-secondary)]">Show all</span>
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-[var(--theme-foreground-tertiary)]">Min:</span>
              <input
                type="range"
                min="1"
                max="10"
                value={minLevel}
                onChange={(e) => update('minLevel', parseInt(e.target.value))}
                className="w-16 accent-[#6366F1]"
              />
              <span className="text-[11px] font-mono font-bold text-[var(--theme-foreground)] w-4 text-center">{minLevel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto min-h-0" style={{ maxHeight: isModal ? '55vh' : 'calc(100vh - 320px)' }}>
        {viewMode === 'matrix' ? (
          <MatrixTableView
            technologies={processedData.technologies}
            members={processedData.members}
            selectedTech={selectedTech}
            selectedMember={selectedMember}
            onSelectTech={(tech) => update('selectedTech', tech)}
            onMemberClick={handleMemberClick}
            getMemberExpertise={getMemberExpertise}
          />
        ) : (
          <GroupedView
            technologies={processedData.technologies}
            members={processedData.members}
            minLevel={minLevel}
            showEmptySkills={showEmptySkills}
            onMemberClick={handleMemberClick}
          />
        )}
      </div>

      {/* Legend */}
      <div className="px-5 py-3 border-t-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)] shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-mono font-bold text-[var(--theme-foreground-secondary)] uppercase">Levels:</span>
            {[
              { abbr: 'BEG', label: '2-3', bg: 'bg-[var(--theme-foreground-tertiary)]/10', text: 'text-[var(--theme-foreground-tertiary)]', border: 'border-[var(--theme-foreground-tertiary)]/20' },
              { abbr: 'INT', label: '4-5', bg: 'bg-[#F59E0B]/15', text: 'text-[#F59E0B]', border: 'border-[#F59E0B]/30' },
              { abbr: 'ADV', label: '6-7', bg: 'bg-[#6366F1]/15', text: 'text-[#6366F1]', border: 'border-[#6366F1]/30' },
              { abbr: 'EXP', label: '8-10', bg: 'bg-[#22C55E]/15', text: 'text-[#22C55E]', border: 'border-[#22C55E]/30' },
            ].map(({ abbr, label, bg, text, border }) => (
              <div key={abbr} className="flex items-center gap-1.5">
                <div className={clsx('inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono font-bold border', bg, text, border)}>
                  {abbr}
                </div>
                <span className="text-[11px] font-mono text-[var(--theme-foreground-tertiary)]">{label}</span>
              </div>
            ))}
          </div>
          {selectedTech && (
            <span className="text-[11px] font-mono text-[var(--theme-foreground-tertiary)]">
              Highlighting: <span className="font-bold text-[#6366F1]">{selectedTech}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--theme-background)]/80 backdrop-blur-sm p-4">
        {content}
      </div>
    )
  }

  return <div className="p-4">{content}</div>
}
