import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useShortcuts } from '@/contexts/ShortcutContext'
import type { Command } from '@/types/shortcuts'
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

// ── Sub-components ──

interface CommandItemProps {
  cmd: Command
  isSelected: boolean
  formatKeyCombo: (combo: any) => string
  onExecute: (cmd: Command) => void
  onHover: () => void
}

function CommandItem({ cmd, isSelected, formatKeyCombo, onExecute, onHover }: CommandItemProps) {
  return (
    <button
      type="button"
      data-cmd-item
      className={clsx(
        "mx-1 px-3 py-2 flex items-center gap-3 cursor-pointer rounded-md transition-colors w-[calc(100%-0.5rem)] text-left",
        isSelected
          ? "bg-[var(--theme-background-tertiary)]"
          : "hover:bg-[var(--theme-hover)]"
      )}
      onClick={() => onExecute(cmd)}
      onMouseEnter={onHover}
    >
      {/* Icon */}
      <div className={clsx(
        "w-5 h-5 flex items-center justify-center flex-shrink-0",
        isSelected ? "text-[var(--theme-foreground-secondary)]" : "text-[var(--theme-foreground-tertiary)]"
      )}>
        {cmd.icon || <HashIcon className="w-3.5 h-3.5" />}
      </div>

      {/* Name + description */}
      <div className="flex-1 min-w-0">
        <div className={clsx(
          "text-sm truncate",
          isSelected ? "text-[var(--theme-foreground)]" : "text-[var(--theme-foreground-secondary)]"
        )}>
          {cmd.name}
        </div>

        {cmd.description && (
          <div className="text-xs text-[var(--theme-foreground-tertiary)] truncate mt-0.5">
            {cmd.description}
          </div>
        )}
      </div>

      {/* Shortcut key hint */}
      {cmd.shortcut && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {formatKeyCombo(cmd.shortcut).split('+').map((part) => (
            <kbd
              key={part}
              className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-mono text-[var(--theme-foreground-tertiary)] bg-[#111111] border border-[var(--theme-border)] rounded"
            >
              {part}
            </kbd>
          ))}
        </div>
      )}

      {/* Chevron for selected */}
      {isSelected && (
        <ChevronIcon className="w-3.5 h-3.5 text-[var(--theme-foreground-tertiary)] flex-shrink-0" />
      )}
    </button>
  )
}

interface FooterHintsProps {
  commandCount: number
}

function FooterHints({ commandCount }: FooterHintsProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--theme-border-subtle,#1F1F23)] bg-[var(--theme-background)]">
      <div className="flex items-center gap-3 text-[11px] text-[var(--theme-foreground-tertiary)]">
        <span className="flex items-center gap-1">
          <kbd className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-mono bg-[#111111] border border-[var(--theme-border)] rounded">
            ↑
          </kbd>
          <kbd className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-mono bg-[#111111] border border-[var(--theme-border)] rounded">
            ↓
          </kbd>
          <span className="ml-0.5">navigate</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="inline-flex items-center justify-center h-4 px-1 text-[10px] font-mono bg-[#111111] border border-[var(--theme-border)] rounded">
            ↵
          </kbd>
          <span className="ml-0.5">select</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="inline-flex items-center justify-center h-4 px-1 text-[10px] font-mono bg-[#111111] border border-[var(--theme-border)] rounded">
            esc
          </kbd>
          <span className="ml-0.5">close</span>
        </span>
      </div>
      <span className="text-[11px] text-[var(--theme-foreground-tertiary)]">
        {commandCount} commands
      </span>
    </div>
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
  const paletteRef = useRef<HTMLDivElement>(null)

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

  // Focus trap: trap Tab/Shift+Tab within the palette
  useEffect(() => {
    if (!isCommandPaletteOpen || !paletteRef.current) return

    const palette = paletteRef.current

    const getFocusable = (): HTMLElement[] => {
      return Array.from(
        palette.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => !el.closest('[aria-hidden="true"]'))
    }

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const focusable = getFocusable()
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTab)
    return () => document.removeEventListener('keydown', handleTab)
  }, [isCommandPaletteOpen])

  // Auto-focus search input when opened
  useEffect(() => {
    if (isCommandPaletteOpen) {
      // Small delay to let AnimatePresence mount the element
      const id = setTimeout(() => {
        searchInputRef.current?.focus()
      }, 20)
      return () => clearTimeout(id)
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

  // Format category labels nicely
  const formatCategory = (cat: string) => {
    return cat.replace(/-/g, ' ')
  }

  const content = (
    <AnimatePresence>
      {isCommandPaletteOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            role="button"
            tabIndex={0}
            aria-label="Close command palette"
            onClick={handleClose}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClose() }}
          />

          {/* Command Palette - centered container to avoid transform conflicts */}
          <div className="fixed inset-0 z-[9999] flex justify-center pointer-events-none" style={{ paddingTop: '20vh' }}>
            <motion.div
              ref={paletteRef}
              role="dialog"
              aria-modal="true"
              aria-label="Command palette"
              className="w-[90vw] max-w-[560px] h-fit flex flex-col overflow-hidden border border-[var(--theme-border)] bg-[var(--theme-background-secondary)] shadow-2xl pointer-events-auto"
              initial={{ opacity: 0, scale: 0.97, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 border-b border-[var(--theme-border-subtle,#1F1F23)]">
              <SearchIcon className="w-4 h-4 text-[var(--theme-foreground-tertiary)] flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setSelectedIndex(0)
                }}
                placeholder="Type a command or search..."
                aria-label="Search commands"
                className="flex-1 py-3 bg-transparent text-sm text-[var(--theme-foreground)] placeholder:text-[var(--theme-foreground-tertiary)] focus:outline-none font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setSelectedIndex(0) }}
                  className="text-[var(--theme-foreground-tertiary)] hover:text-[var(--theme-foreground-secondary)] text-xs font-mono px-1.5 py-0.5 rounded border border-[var(--theme-border)]"
                >
                  ESC
                </button>
              )}
            </div>

            {/* Commands list */}
            <div ref={listRef} className="max-h-[min(360px,50vh)] overflow-y-auto py-1">
              {flatCommands.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-[var(--theme-foreground-tertiary)]">No results found</p>
                </div>
              ) : (
                groupedCommands.map(({ label, items }) => (
                  <div key={label}>
                    {/* Category label */}
                    <div className="px-4 pt-3 pb-1">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--theme-foreground-tertiary)]">
                        {formatCategory(label)}
                      </span>
                    </div>

                    {/* Command items */}
                    {items.map((cmd) => {
                      const globalIndex = flatCommands.indexOf(cmd)
                      return (
                        <CommandItem
                          key={`${label}-${cmd.id}`}
                          cmd={cmd}
                          isSelected={selectedIndex === globalIndex}
                          formatKeyCombo={formatKeyCombo}
                          onExecute={handleExecuteCommand}
                          onHover={() => setSelectedIndex(globalIndex)}
                        />
                      )
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer hints */}
            <FooterHints commandCount={flatCommands.length} />
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )

  return createPortal(content, document.body)
}
