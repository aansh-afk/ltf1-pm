import { useReducer, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { m, AnimatePresence } from 'framer-motion'
import {
  HiOutlineSearch,
  HiOutlineX,
  HiOutlineFolder,
  HiOutlineClipboardList,
  HiOutlinePlay,
  HiOutlineCalendar,
  HiOutlineUser,
  HiOutlineDocumentText
} from 'react-icons/hi'
import clsx from 'clsx'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import BrutalModal from '../../ui/BrutalModal'
import BrutalInput from '../../ui/BrutalInput'
import toast from 'react-hot-toast'

interface GlobalSearchModalProps {
  isOpen: boolean
  onClose: () => void
}

interface SearchResult {
  id: string
  type: 'task' | 'project' | 'sprint' | 'meeting' | 'user' | 'document'
  title: string
  description?: string
  status?: string
  priority?: string
  url: string
}

const typeIcons = {
  task: HiOutlineClipboardList,
  project: HiOutlineFolder,
  sprint: HiOutlinePlay,
  meeting: HiOutlineCalendar,
  user: HiOutlineUser,
  document: HiOutlineDocumentText,
}

const typeColors = {
  task: 'text-[var(--theme-info)]',
  project: 'text-[var(--theme-success)]',
  sprint: 'text-[var(--theme-warning)]',
  meeting: 'text-[var(--theme-error)]',
  user: 'text-[var(--theme-primary)]',
  document: 'text-[var(--theme-foreground)]',
}

type SearchState = {
  searchQuery: string
  selectedIndex: number
  activeFilter: string | null
  isSearching: boolean
  results: SearchResult[]
}

const initialSearchState: SearchState = {
  searchQuery: '',
  selectedIndex: 0,
  activeFilter: null,
  isSearching: false,
  results: [],
}

type SearchAction =
  | { type: 'SET_QUERY'; value: string }
  | { type: 'SET_SELECTED_INDEX'; value: number }
  | { type: 'SET_ACTIVE_FILTER'; value: string | null }
  | { type: 'SET_IS_SEARCHING'; value: boolean }
  | { type: 'SET_RESULTS'; value: SearchResult[] }
  | { type: 'RESET' }

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'SET_QUERY':
      return { ...state, searchQuery: action.value }
    case 'SET_SELECTED_INDEX':
      return { ...state, selectedIndex: action.value }
    case 'SET_ACTIVE_FILTER':
      return { ...state, activeFilter: action.value }
    case 'SET_IS_SEARCHING':
      return { ...state, isSearching: action.value }
    case 'SET_RESULTS':
      return { ...state, results: action.value }
    case 'RESET':
      return initialSearchState
    default:
      return state
  }
}

// ── Sub-components ──

interface SearchResultItemProps {
  result: SearchResult
  index: number
  selectedIndex: number
  onSelect: (result: SearchResult) => void
  onHover: (index: number) => void
}

function SearchResultItem({ result, index, selectedIndex, onSelect, onHover }: SearchResultItemProps) {
  const Icon = typeIcons[result.type]
  const colorClass = typeColors[result.type]

  return (
    <button
      onClick={() => onSelect(result)}
      onMouseEnter={() => onHover(index)}
      className={clsx(
        'w-full p-[10px] text-left border-b border-[var(--theme-border)] transition-all',
        index === selectedIndex
          ? 'bg-[var(--theme-hover)] translate-x-8px'
          : 'hover:bg-[var(--theme-hover)]/50'
      )}
    >
      <div className="flex items-start gap-[8px]">
        <Icon className={clsx('w-20px h-20px flex-shrink-0 mt-2px', colorClass)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-[4px] mb-[2px]">
            <span className="font-bold text-[var(--theme-foreground)]">
              {result.title}
            </span>
            {result.status && (
              <span className="text-xs px-[4px] py-2px bg-[var(--theme-info)]/20 text-[var(--theme-info)]">
                {result.status.toUpperCase()}
              </span>
            )}
            {result.priority && (
              <span className={clsx(
                'text-xs px-[4px] py-2px',
                result.priority === 'high' && 'bg-[var(--theme-error)]/20 text-[var(--theme-error)]',
                result.priority === 'medium' && 'bg-[var(--theme-warning)]/20 text-[var(--theme-warning)]',
                result.priority === 'low' && 'bg-[var(--theme-info)]/20 text-[var(--theme-info)]'
              )}>
                {result.priority.toUpperCase()}
              </span>
            )}
          </div>
          {result.description && (
            <p className="text-sm text-[var(--theme-foreground)]/60 truncate">
              {result.description}
            </p>
          )}
        </div>
        <span className="text-xs text-[var(--theme-foreground)]/40 uppercase">
          {result.type}
        </span>
      </div>
    </button>
  )
}

interface SearchFooterProps {
  resultsCount: number
}

function SearchFooter({ resultsCount }: SearchFooterProps) {
  return (
    <div className="p-[10px] border-t-2 border-[var(--theme-border)] flex items-center justify-between text-xs text-[var(--theme-foreground)]/60">
      <div className="flex gap-[8px]">
        <span><kbd>↑↓</kbd> NAVIGATE</span>
        <span><kbd>ENTER</kbd> SELECT</span>
        <span><kbd>ESC</kbd> CLOSE</span>
      </div>
      {resultsCount > 0 && (
        <span>{resultsCount} RESULTS</span>
      )}
    </div>
  )
}

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [state, dispatch] = useReducer(searchReducer, initialSearchState)
  const { searchQuery, selectedIndex, activeFilter, isSearching, results } = state
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const resultsRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  const handleClose = useCallback(() => {
    dispatch({ type: 'RESET' })
    onClose()
  }, [onClose])

  const performSearch = useCallback(async (query: string, filter: string | null) => {
    if (!query.trim()) {
      dispatch({ type: 'SET_RESULTS', value: [] })
      dispatch({ type: 'SET_IS_SEARCHING', value: false })
      return
    }
    dispatch({ type: 'SET_IS_SEARCHING', value: true })
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          filters: filter ? { type: [filter] } : undefined,
        }),
      })
      if (res.ok) {
        dispatch({ type: 'SET_RESULTS', value: await res.json() })
      }
    } catch (error) {
      console.error('Search error:', error)
      dispatch({ type: 'SET_RESULTS', value: getMockResults(query) })
    } finally {
      dispatch({ type: 'SET_IS_SEARCHING', value: false })
    }
  }, [])

  const handleSearchChange = useCallback((query: string) => {
    dispatch({ type: 'SET_QUERY', value: query })
    clearTimeout(debounceRef.current)
    if (!query.trim()) {
      dispatch({ type: 'SET_RESULTS', value: [] })
      dispatch({ type: 'SET_IS_SEARCHING', value: false })
      return
    }
    dispatch({ type: 'SET_IS_SEARCHING', value: true })
    debounceRef.current = setTimeout(() => performSearch(query, activeFilter), 300)
  }, [activeFilter, performSearch])

  // Re-run search when active filter changes
  useEffect(() => {
    if (!searchQuery.trim()) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => performSearch(searchQuery, activeFilter), 300)
    return () => clearTimeout(debounceRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          dispatch({ type: 'SET_SELECTED_INDEX', value: selectedIndex < results.length - 1 ? selectedIndex + 1 : 0 })
          break
        case 'ArrowUp':
          e.preventDefault()
          dispatch({ type: 'SET_SELECTED_INDEX', value: selectedIndex > 0 ? selectedIndex - 1 : results.length - 1 })
          break
        case 'Enter':
          e.preventDefault()
          if (results[selectedIndex]) {
            handleSelectResult(results[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          handleClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex, handleClose])

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && results.length > 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [selectedIndex, results])

  const handleSelectResult = (result: SearchResult) => {
    navigate(result.url)
    handleClose()
  }

  const filters = [
    { value: 'task', label: 'TASKS' },
    { value: 'project', label: 'PROJECTS' },
    { value: 'sprint', label: 'SPRINTS' },
    { value: 'meeting', label: 'MEETINGS' },
    { value: 'user', label: 'USERS' },
  ]

  // Mock results for demonstration
  const getMockResults = (query: string): SearchResult[] => {
    if (!query) return []

    return [
      {
        id: '1',
        type: 'task',
        title: `Fix ${query} bug in authentication`,
        description: 'High priority bug that needs immediate attention',
        status: 'in_progress',
        priority: 'high',
        url: '/tasks/1'
      },
      {
        id: '2',
        type: 'project',
        title: `${query} Implementation Project`,
        description: 'Main project for implementing new features',
        status: 'active',
        url: '/projects/2'
      },
      {
        id: '3',
        type: 'sprint',
        title: `Sprint 23 - ${query} Features`,
        description: 'Current sprint focused on search functionality',
        status: 'active',
        url: '/sprints/3'
      },
      {
        id: '4',
        type: 'meeting',
        title: `${query} Planning Meeting`,
        description: 'Weekly planning meeting for the team',
        url: '/meetings/4'
      },
      {
        id: '5',
        type: 'user',
        title: `John ${query}`,
        description: 'john@example.com',
        url: '/users/5'
      },
    ].filter(r =>
      r.title.toLowerCase().includes(query.toLowerCase()) ||
      r.description?.toLowerCase().includes(query.toLowerCase())
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[var(--theme-background)]/90 z-[100]"
            onClick={handleClose}
          />

          {/* Search Modal */}
          <m.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-[10%] left-1/2 transform -translate-x-1/2 w-full max-w-[700px] z-[101]"
          >
            <div className="bg-[var(--theme-background-secondary)] border-4 border-[var(--theme-border)] shadow-[var(--theme-box-shadow-hover)]">
              {/* Search Header */}
              <div className="p-[16px] border-b-2 border-[var(--theme-border)]">
                <div className="flex items-center gap-[8px]">
                  <HiOutlineSearch className="w-4 h-4 text-[var(--theme-foreground)]" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="SEARCH TASKS, PROJECTS, SPRINTS, USERS..."
                    aria-label="Search tasks, projects, sprints, users"
                    className="flex-1 bg-transparent text-[var(--theme-foreground)] outline-none text-lg placeholder:text-[var(--theme-foreground)]/50 placeholder:text-sm"
                  />
                  <button
                    onClick={handleClose}
                    className="p-[4px] hover:bg-[var(--theme-hover)] transition-colors"
                    aria-label="Close search"
                  >
                    <HiOutlineX className="w-20px h-20px" />
                  </button>
                </div>

                {/* Filters */}
                <div className="flex gap-[4px] mt-[8px]">
                  {filters.map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => dispatch({
                        type: 'SET_ACTIVE_FILTER',
                        value: activeFilter === filter.value ? null : filter.value
                      })}
                      className={clsx(
                        'px-[10px] py-[4px] text-xs font-bold border-2 transition-all',
                        activeFilter === filter.value
                          ? 'bg-[var(--theme-primary)] text-[var(--theme-background)] border-[var(--theme-primary)]'
                          : 'bg-transparent text-[var(--theme-foreground)] border-[var(--theme-border)] hover:border-[var(--theme-primary)]'
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Results */}
              <div
                ref={resultsRef}
                className="max-h-[400px] overflow-y-auto"
              >
                {isSearching ? (
                  <div className="p-[20px] text-center text-[var(--theme-foreground)]/60">
                    <div className="animate-pulse">SEARCHING...</div>
                  </div>
                ) : results.length > 0 ? (
                  results.map((result, index) => (
                    <SearchResultItem
                      key={result.id}
                      result={result}
                      index={index}
                      selectedIndex={selectedIndex}
                      onSelect={handleSelectResult}
                      onHover={(i) => dispatch({ type: 'SET_SELECTED_INDEX', value: i })}
                    />
                  ))
                ) : searchQuery ? (
                  <div className="p-[20px] text-center text-[var(--theme-foreground)]/60">
                    NO RESULTS FOUND FOR "{searchQuery.toUpperCase()}"
                  </div>
                ) : (
                  <div className="p-[20px] text-center text-[var(--theme-foreground)]/60">
                    START TYPING TO SEARCH...
                  </div>
                )}
              </div>

              {/* Footer */}
              <SearchFooter resultsCount={results.length} />
            </div>
          </m.div>
        </>
      )}
    </AnimatePresence>
  )
}