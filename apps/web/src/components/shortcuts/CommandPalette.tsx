import { useState, useEffect, useRef, useMemo } from 'react'
import { useShortcuts } from '../../contexts/ShortcutContext'
import type { Command } from '../../types/shortcuts'
import { 
  HiOutlineSearch,
  HiOutlineX,
  HiOutlineChevronRight,
  HiOutlineLightningBolt,
  HiOutlineClock,
  HiOutlineStar
} from 'react-icons/hi'
import clsx from 'clsx'

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
  const [pinnedCommands, setPinnedCommands] = useState<string[]>([])
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Load recent and pinned commands from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('command-palette')
    if (stored) {
      try {
        const data = JSON.parse(stored)
        setRecentCommands(data.recent || [])
        setPinnedCommands(data.pinned || [])
      } catch (e) {
        console.error('Failed to load command palette data:', e)
      }
    }
  }, [])

  // Save recent and pinned commands
  const saveData = (recent: string[], pinned: string[]) => {
    localStorage.setItem('command-palette', JSON.stringify({ recent, pinned }))
  }

  // Filter and sort commands
  const filteredCommands = useMemo(() => {
    let filtered = commands

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(cmd => 
        cmd.name.toLowerCase().includes(query) ||
        cmd.description?.toLowerCase().includes(query) ||
        cmd.keywords?.some(k => k.toLowerCase().includes(query))
      )

      // Sort by relevance
      filtered.sort((a, b) => {
        const aNameMatch = a.name.toLowerCase().startsWith(query)
        const bNameMatch = b.name.toLowerCase().startsWith(query)
        if (aNameMatch && !bNameMatch) return -1
        if (!aNameMatch && bNameMatch) return 1
        return 0
      })
    } else {
      // Show pinned and recent commands first
      const pinnedCmds = filtered.filter(c => pinnedCommands.includes(c.id))
      const recentCmds = filtered.filter(c => 
        recentCommands.includes(c.id) && !pinnedCommands.includes(c.id)
      ).slice(0, 5)
      const otherCmds = filtered.filter(c => 
        !pinnedCommands.includes(c.id) && !recentCommands.includes(c.id)
      )

      filtered = [...pinnedCmds, ...recentCmds, ...otherCmds]
    }

    return filtered
  }, [commands, searchQuery, recentCommands, pinnedCommands])

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups = new Map<string, Command[]>()
    
    if (!searchQuery) {
      // Add special groups for pinned and recent
      const pinnedCmds = filteredCommands.filter(c => pinnedCommands.includes(c.id))
      const recentCmds = filteredCommands.filter(c => 
        recentCommands.includes(c.id) && !pinnedCommands.includes(c.id)
      ).slice(0, 5)

      if (pinnedCmds.length > 0) {
        groups.set('Pinned', pinnedCmds)
      }
      if (recentCmds.length > 0) {
        groups.set('Recent', recentCmds)
      }

      // Add other commands by category
      filteredCommands
        .filter(c => !pinnedCommands.includes(c.id) && !recentCommands.includes(c.id))
        .forEach(cmd => {
          const category = cmd.category || 'Other'
          if (!groups.has(category)) {
            groups.set(category, [])
          }
          groups.get(category)!.push(cmd)
        })
    } else {
      // When searching, don't group
      groups.set('Results', filteredCommands)
    }

    return Array.from(groups.entries())
  }, [filteredCommands, searchQuery, recentCommands, pinnedCommands])

  // Get flat list of commands for keyboard navigation
  const flatCommands = useMemo(() => {
    return groupedCommands.flatMap(([_, cmds]) => cmds)
  }, [groupedCommands])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isCommandPaletteOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(i => Math.min(i + 1, flatCommands.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(i => Math.max(i - 1, 0))
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

  // Focus search input when opened
  useEffect(() => {
    if (isCommandPaletteOpen) {
      searchInputRef.current?.focus()
      setSearchQuery('')
      setSelectedIndex(0)
    }
  }, [isCommandPaletteOpen])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const items = listRef.current.querySelectorAll('[data-command-item]')
      items[selectedIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  const handleExecuteCommand = (command: Command) => {
    // Add to recent commands
    const newRecent = [command.id, ...recentCommands.filter(id => id !== command.id)].slice(0, 10)
    setRecentCommands(newRecent)
    saveData(newRecent, pinnedCommands)

    // Execute command
    executeCommand(command)
    handleClose()
  }

  const handleTogglePin = (commandId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newPinned = pinnedCommands.includes(commandId)
      ? pinnedCommands.filter(id => id !== commandId)
      : [...pinnedCommands, commandId]
    setPinnedCommands(newPinned)
    saveData(recentCommands, newPinned)
  }

  const handleClose = () => {
    setCommandPaletteOpen(false)
    setSearchQuery('')
    setSelectedIndex(0)
  }

  if (!isCommandPaletteOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-event-horizon/90 backdrop-blur-sm z-[9998]"
        onClick={handleClose}
      />

      {/* Command Palette */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-600px h-[80vh] bg-carbon-plate border-4 border-basalt-border shadow-brutal-xl z-[9999] flex flex-col">
        {/* Search Header */}
        <div className="p-16px border-b-2 border-basalt-border">
          <div className="relative">
            <HiOutlineSearch className="absolute left-12px top-1/2 -translate-y-1/2 w-20px h-20px text-cathode-white/60" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSelectedIndex(0)
              }}
              placeholder="TYPE A COMMAND OR SEARCH..."
              className="w-full pl-44px pr-44px py-12px bg-event-horizon border-2 border-basalt-border font-mono text-brutal-sm placeholder:text-neutral-600 focus:border-primary-brutalist focus:outline-none"
            />
            <button
              onClick={handleClose}
              className="absolute right-12px top-1/2 -translate-y-1/2 p-4px hover:bg-primary-brutalist/20 transition-colors"
            >
              <HiOutlineX className="w-20px h-20px" />
            </button>
          </div>
        </div>

        {/* Commands List */}
        <div ref={listRef} className="flex-1 overflow-y-auto">
          {flatCommands.length === 0 ? (
            <div className="p-32px text-center">
              <p className="text-cathode-white/60 font-mono text-brutal-sm uppercase">
                NO COMMANDS FOUND
              </p>
            </div>
          ) : (
            <div className="py-8px">
              {groupedCommands.map(([category, cmds]) => (
                <div key={category}>
                  {/* Category Header */}
                  <div className="px-16px py-8px">
                    <h3 className="font-mono text-brutal-xs uppercase text-cathode-white/60 flex items-center gap-8px">
                      {category === 'Pinned' && <HiOutlineStar className="w-14px h-14px" />}
                      {category === 'Recent' && <HiOutlineClock className="w-14px h-14px" />}
                      {category}
                    </h3>
                  </div>

                  {/* Commands */}
                  {cmds.map((cmd) => {
                    const globalIndex = flatCommands.indexOf(cmd)
                    const isSelected = selectedIndex === globalIndex
                    const isPinned = pinnedCommands.includes(cmd.id)

                    return (
                      <div
                        key={cmd.id}
                        data-command-item
                        className={clsx(
                          "px-16px py-12px flex items-center justify-between cursor-pointer transition-colors",
                          isSelected 
                            ? "bg-primary-brutalist text-event-horizon" 
                            : "hover:bg-event-horizon/50"
                        )}
                        onClick={() => handleExecuteCommand(cmd)}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                      >
                        <div className="flex items-center gap-12px flex-1">
                          {/* Icon */}
                          <div className="w-32px h-32px bg-event-horizon border-2 border-basalt-border flex items-center justify-center">
                            {cmd.icon || <HiOutlineLightningBolt className="w-16px h-16px" />}
                          </div>

                          {/* Name and Description */}
                          <div className="flex-1">
                            <div className="font-mono text-brutal-sm uppercase">
                              {cmd.name}
                            </div>
                            {cmd.description && (
                              <div className={clsx(
                                "font-mono text-brutal-xs mt-2px",
                                isSelected ? "text-event-horizon/80" : "text-cathode-white/60"
                              )}>
                                {cmd.description}
                              </div>
                            )}
                          </div>


                          {/* Pin Button */}
                          <button
                            onClick={(e) => handleTogglePin(cmd.id, e)}
                            className={clsx(
                              "p-4px transition-colors",
                              isPinned 
                                ? "text-primary-brutalist" 
                                : "text-cathode-white/30 hover:text-cathode-white/60"
                            )}
                          >
                            <HiOutlineStar className={clsx(
                              "w-16px h-16px",
                              isPinned && "fill-current"
                            )} />
                          </button>

                          {/* Arrow */}
                          <HiOutlineChevronRight className={clsx(
                            "w-16px h-16px",
                            isSelected ? "text-event-horizon" : "text-cathode-white/30"
                          )} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-12px border-t-2 border-basalt-border flex items-center justify-between">
          <div className="flex items-center gap-16px text-brutal-xs text-cathode-white/60">
            <span className="flex items-center gap-4px">
              <kbd className="px-4px py-2px bg-event-horizon border border-basalt-border">↑</kbd>
              <kbd className="px-4px py-2px bg-event-horizon border border-basalt-border">↓</kbd>
              NAVIGATE
            </span>
            <span className="flex items-center gap-4px">
              <kbd className="px-6px py-2px bg-event-horizon border border-basalt-border">ENTER</kbd>
              SELECT
            </span>
            <span className="flex items-center gap-4px">
              <kbd className="px-6px py-2px bg-event-horizon border border-basalt-border">ESC</kbd>
              CLOSE
            </span>
          </div>
          <div className="text-brutal-xs text-cathode-white/60">
            {flatCommands.length} COMMANDS
          </div>
        </div>
      </div>
    </>
  )
}