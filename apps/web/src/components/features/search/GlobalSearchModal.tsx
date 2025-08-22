import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const resultsRef = useRef<HTMLDivElement>(null)
  
  // Debounce search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timer = setTimeout(async () => {
      try {
        // Use the Convex query to search
        const searchResults = await fetch('/api/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: searchQuery,
            filters: activeFilter ? { type: [activeFilter] } : undefined,
          }),
        })
        
        if (searchResults.ok) {
          const data = await searchResults.json()
          setResults(data)
        }
      } catch (error) {
        console.error('Search error:', error)
        // Fallback to mock results for now
        setResults(getMockResults(searchQuery))
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, activeFilter])
  
  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      setSelectedIndex(0)
      setActiveFilter(null)
      setResults([])
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])
  
  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : results.length - 1
          )
          break
        case 'Enter':
          e.preventDefault()
          if (results[selectedIndex]) {
            handleSelectResult(results[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex, onClose])
  
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
    onClose()
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[var(--theme-background)]/90 z-[100]"
            onClick={onClose}
          />
          
          {/* Search Modal */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-[10%] left-1/2 transform -translate-x-1/2 w-full max-w-[700px] z-[101]"
          >
            <div className="bg-[var(--theme-background-secondary)] border-4 border-[var(--theme-border)] shadow-[var(--theme-box-shadow-hover)]">
              {/* Search Header */}
              <div className="p-24px border-b-2 border-[var(--theme-border)]">
                <div className="flex items-center gap-16px">
                  <HiOutlineSearch className="w-24px h-24px text-[var(--theme-foreground)]" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="SEARCH TASKS, PROJECTS, SPRINTS, USERS..."
                    className="flex-1 bg-transparent text-[var(--theme-foreground)] outline-none text-lg placeholder:text-[var(--theme-foreground)]/50 placeholder:text-sm"
                    autoFocus
                  />
                  <button
                    onClick={onClose}
                    className="p-8px hover:bg-[var(--theme-hover)] transition-colors"
                    aria-label="Close search"
                  >
                    <HiOutlineX className="w-20px h-20px" />
                  </button>
                </div>
                
                {/* Filters */}
                <div className="flex gap-8px mt-16px">
                  {filters.map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setActiveFilter(
                        activeFilter === filter.value ? null : filter.value
                      )}
                      className={clsx(
                        'px-16px py-8px text-xs font-bold border-2 transition-all',
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
                  <div className="p-32px text-center text-[var(--theme-foreground)]/60">
                    <div className="animate-pulse">SEARCHING...</div>
                  </div>
                ) : results.length > 0 ? (
                  results.map((result, index) => {
                    const Icon = typeIcons[result.type]
                    const colorClass = typeColors[result.type]
                    
                    return (
                      <button
                        key={result.id}
                        onClick={() => handleSelectResult(result)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={clsx(
                          'w-full p-16px text-left border-b border-[var(--theme-border)] transition-all',
                          index === selectedIndex
                            ? 'bg-[var(--theme-hover)] translate-x-8px'
                            : 'hover:bg-[var(--theme-hover)]/50'
                        )}
                      >
                        <div className="flex items-start gap-16px">
                          <Icon className={clsx('w-20px h-20px flex-shrink-0 mt-2px', colorClass)} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-8px mb-4px">
                              <span className="font-bold text-[var(--theme-foreground)]">
                                {result.title}
                              </span>
                              {result.status && (
                                <span className="text-xs px-8px py-2px bg-[var(--theme-info)]/20 text-[var(--theme-info)]">
                                  {result.status.toUpperCase()}
                                </span>
                              )}
                              {result.priority && (
                                <span className={clsx(
                                  'text-xs px-8px py-2px',
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
                  })
                ) : searchQuery ? (
                  <div className="p-32px text-center text-[var(--theme-foreground)]/60">
                    NO RESULTS FOUND FOR "{searchQuery.toUpperCase()}"
                  </div>
                ) : (
                  <div className="p-32px text-center text-[var(--theme-foreground)]/60">
                    START TYPING TO SEARCH...
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="p-16px border-t-2 border-[var(--theme-border)] flex items-center justify-between text-xs text-[var(--theme-foreground)]/60">
                <div className="flex gap-16px">
                  <span><kbd>↑↓</kbd> NAVIGATE</span>
                  <span><kbd>ENTER</kbd> SELECT</span>
                  <span><kbd>ESC</kbd> CLOSE</span>
                </div>
                {results.length > 0 && (
                  <span>{results.length} RESULTS</span>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}