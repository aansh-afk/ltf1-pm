import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useShortcuts } from '../../contexts/ShortcutContext'
import type { Command } from '../../types/shortcuts'
import clsx from 'clsx'

// Minimal icons inline to avoid heavy icon imports
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="7" r="5.25" />
      <path d="M11 11l3.5 3.5" strokeLinecap="round" />
    </svg>
  )
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function HashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 6h10M3 10h10M6 3v10M10 3v10" strokeLinecap="round" />
    </svg>
  )
}

export default function CommandPalette() {
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    commands,
    executeCommand,
    formatKeyCombo
  } = useShortcuts()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentCommands, setRecentCommands] = useState<string[]>([])

  const searchInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Load recent commands from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('command-palette')
    if (stored) {
      try {
        const data = JSON.parse(stored)
        setRecentCommands(data.recent || [])
      } catch {
        // ignore
      }
    }
  }, [])

  const saveRecent = useCallback((recent: string[]) => {
    const stored = localStorage.getItem('command-palette')
    let pinned: string[] = []
    if (stored) {
      try { pinned = JSON.parse(stored).pinned || [] } catch { /* ignore */ }
    }
    localStorage.setItem('command-palette', JSON.stringify({ recent, pinned }))
  }, [])

  // Filter and sort commands
  const filteredCommands = useMemo(() => {
    let filtered = commands

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(cmd =>
        cmd.name.toLowerCase().includes(query) ||
        cmd.description?.toLowerCase().includes(query) ||
        cmd.keywords?.some(k => k.toLowerCase().includes(query))
      )

      // Sort by relevance - exact name start match first
      filtered.sort((a, b) => {
        const aStart = a.name.toLowerCase().startsWith(query) ? 0 : 1
        const bStart = b.name.toLowerCase().startsWith(query) ? 0 : 1
        return aStart - bStart
      })
    } else {
      // Show recent first, then rest by category
      const recentCmds = filtered.filter(c => recentCommands.includes(c.id)).slice(0, 5)
      const otherCmds = filtered.filter(c => !recentCommands.includes(c.id))
      filtered = [...recentCmds, ...otherCmds]
    }

    return filtered
  }, [commands, searchQuery, recentCommands])

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Array<{ label: string; items: Command[] }> = []

    if (searchQuery) {
      if (filteredCommands.length > 0) {
        groups.push({ label: 'Results', items: filteredCommands })
      }
    } else {
      const recentCmds = filteredCommands.filter(c => recentCommands.includes(c.id)).slice(0, 5)
      if (recentCmds.length > 0) {
        groups.push({ label: 'Recent', items: recentCmds })
      }

      const rest = filteredCommands.filter(c => !recentCommands.includes(c.id))
      const categoryMap = new Map<string, Command[]>()
      rest.forEach(cmd => {
        const cat = cmd.category || 'Other'
        if (!categoryMap.has(cat)) categoryMap.set(cat, [])
        categoryMap.get(cat)!.push(cmd)
      })
      categoryMap.forEach((items, label) => {
        groups.push({ label, items })
      })
    }

    return groups
  }, [filteredCommands, searchQuery, recentCommands])

  // Flat list for keyboard navigation
  const flatCommands = useMemo(() => {
    return groupedCommands.flatMap(g => g.items)
  }, [groupedCommands])

  // Keyboard navigation
  useEffect(() => {
    if (!isCommandPaletteOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(i => (i + 1) % Math.max(flatCommands.length, 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(i => (i - 1 + flatCommands.length) % Math.max(flatCommands.length, 1))
          break
        case 'Enter':
          e.preventDefault()
          if (flatCommands[selectedIndex]) {
            handleExecuteCommand(flatCommands[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          handleClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isCommandPaletteOpen, selectedIndex, flatCommands])

  // Focus on open
  useEffect(() => {
    if (isCommandPaletteOpen) {
      // Small delay to ensure DOM is ready
      requestAnimationFrame(() => {
        searchInputRef.current?.focus()
      })
      setSearchQuery('')
      setSelectedIndex(0)
    }
  }, [isCommandPaletteOpen])

  // Scroll selected into view
  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const items = listRef.current.querySelectorAll('[data-cmd-item]')
      items[selectedIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  const handleExecuteCommand = useCallback((command: Command) => {
    const newRecent = [command.id, ...recentCommands.filter(id => id !== command.id)].slice(0, 10)
    setRecentCommands(newRecent)
    saveRecent(newRecent)
    executeCommand(command)
    handleClose()
  }, [recentCommands, saveRecent, executeCommand])

  const handleClose = useCallback(() => {
    setCommandPaletteOpen(false)
    setSearchQuery('')
    setSelectedIndex(0)
  }, [setCommandPaletteOpen])

  if (!isCommandPaletteOpen) return null

  // Format category labels nicely
  const formatCategory = (cat: string) => {
    return cat.replace(/-/g, ' ')
  }

  return (
    <>
      {/* Backdrop - subtle dark overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-[9998]"
        onClick={handleClose}
      />

      {/* Command Palette - Linear style: top-positioned, compact */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[90vw] max-w-[560px] z-[9999] flex flex-col overflow-hidden rounded-lg border border-[#2E2E35] bg-[#0A0A0A] shadow-2xl">

        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-[#1F1F23]">
          <SearchIcon className="w-4 h-4 text-[#6B7280] flex-shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setSelectedIndex(0)
            }}
            placeholder="Type a command or search..."
            className="flex-1 py-3 bg-transparent text-sm text-[#F9FAFB] placeholder:text-[#4B5563] focus:outline-none font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSelectedIndex(0) }}
              className="text-[#6B7280] hover:text-[#9CA3AF] text-xs font-mono px-1.5 py-0.5 rounded border border-[#2E2E35]"
            >
              ESC
            </button>
          )}
        </div>

        {/* Commands list */}
        <div ref={listRef} className="max-h-[min(360px,50vh)] overflow-y-auto py-1">
          {flatCommands.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-[#6B7280]">No results found</p>
            </div>
          ) : (
            groupedCommands.map(({ label, items }) => (
              <div key={label}>
                {/* Category label */}
                <div className="px-4 pt-3 pb-1">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-[#6B7280]">
                    {formatCategory(label)}
                  </span>
                </div>

                {/* Command items */}
                {items.map((cmd) => {
                  const globalIndex = flatCommands.indexOf(cmd)
                  const isSelected = selectedIndex === globalIndex

                  return (
                    <div
                      key={`${label}-${cmd.id}`}
                      data-cmd-item
                      className={clsx(
                        "mx-1 px-3 py-2 flex items-center gap-3 cursor-pointer rounded-md transition-colors",
                        isSelected
                          ? "bg-[#1A1A2E]"
                          : "hover:bg-[#111119]"
                      )}
                      onClick={() => handleExecuteCommand(cmd)}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                    >
                      {/* Icon */}
                      <div className={clsx(
                        "w-5 h-5 flex items-center justify-center flex-shrink-0",
                        isSelected ? "text-[#9CA3AF]" : "text-[#6B7280]"
                      )}>
                        {cmd.icon || <HashIcon className="w-3.5 h-3.5" />}
                      </div>

                      {/* Name + description */}
                      <div className="flex-1 min-w-0">
                        <div className={clsx(
                          "text-sm truncate",
                          isSelected ? "text-[#F9FAFB]" : "text-[#D1D5DB]"
                        )}>
                          {cmd.name}
                        </div>
                        {cmd.description && (
                          <div className="text-xs text-[#6B7280] truncate mt-0.5">
                            {cmd.description}
                          </div>
                        )}
                      </div>

                      {/* Shortcut key hint */}
                      {cmd.shortcut && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {formatKeyCombo(cmd.shortcut).split('+').map((part, i) => (
                            <kbd
                              key={i}
                              className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-mono text-[#6B7280] bg-[#111111] border border-[#2E2E35] rounded"
                            >
                              {part}
                            </kbd>
                          ))}
                        </div>
                      )}

                      {/* Chevron for selected */}
                      {isSelected && (
                        <ChevronIcon className="w-3.5 h-3.5 text-[#6B7280] flex-shrink-0" />
                      )}
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-[#1F1F23] bg-[#080808]">
          <div className="flex items-center gap-3 text-[11px] text-[#4B5563]">
            <span className="flex items-center gap-1">
              <kbd className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-mono bg-[#111111] border border-[#2E2E35] rounded">
                ↑
              </kbd>
              <kbd className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-mono bg-[#111111] border border-[#2E2E35] rounded">
                ↓
              </kbd>
              <span className="ml-0.5">navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="inline-flex items-center justify-center h-4 px-1 text-[10px] font-mono bg-[#111111] border border-[#2E2E35] rounded">
                ↵
              </kbd>
              <span className="ml-0.5">select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="inline-flex items-center justify-center h-4 px-1 text-[10px] font-mono bg-[#111111] border border-[#2E2E35] rounded">
                esc
              </kbd>
              <span className="ml-0.5">close</span>
            </span>
          </div>
          <span className="text-[11px] text-[#4B5563]">
            {flatCommands.length} commands
          </span>
        </div>
      </div>
    </>
  )
}
