import { useState, useMemo } from 'react'
import { useShortcuts } from '../../contexts/ShortcutContext'
import type { ShortcutCategory } from '../../types/shortcuts'
import { defaultShortcutGroups } from '../../config/defaultShortcuts'
import { 
  HiOutlineX,
  HiOutlineSearch,
  HiOutlinePrinter,
  HiOutlineCog
} from 'react-icons/hi'
import clsx from 'clsx'

export default function ShortcutHelp() {
  const {
    isHelpOpen,
    setHelpOpen,
    shortcuts,
    formatKeyCombo
  } = useShortcuts()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ShortcutCategory | 'all'>('all')

  // Filter shortcuts
  const filteredShortcuts = useMemo(() => {
    let filtered = shortcuts.filter(s => s.enabled)

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(s => s.category === selectedCategory)
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        formatKeyCombo(s.customKeys || s.defaultKeys).toLowerCase().includes(query)
      )
    }

    return filtered
  }, [shortcuts, selectedCategory, searchQuery, formatKeyCombo])

  // Group shortcuts by category
  const groupedShortcuts = useMemo(() => {
    const groups = new Map<ShortcutCategory, typeof filteredShortcuts>()
    
    filteredShortcuts.forEach(shortcut => {
      if (!groups.has(shortcut.category)) {
        groups.set(shortcut.category, [])
      }
      groups.get(shortcut.category)!.push(shortcut)
    })

    return Array.from(groups.entries()).map(([category, shortcuts]) => ({
      category,
      shortcuts,
      info: defaultShortcutGroups.find(g => g.category === category)
    }))
  }, [filteredShortcuts])

  const handlePrint = () => {
    window.print()
  }

  const handleOpenSettings = () => {
    setHelpOpen(false)
    // Navigate to settings
    window.location.href = '/settings/shortcuts'
  }

  if (!isHelpOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-event-horizon/90 backdrop-blur-sm z-[9998] print:hidden"
        onClick={() => setHelpOpen(false)}
      />

      {/* Help Modal */}
      <div className="fixed inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[90vw] md:max-w-900px md:h-[80vh] bg-carbon-plate border-4 border-basalt-border shadow-brutal-xl z-[9999] flex flex-col">
        {/* Header */}
        <div className="bg-carbon-plate border-b-4 border-basalt-border p-[16px] print:border-b-2">
          <div className="flex items-center justify-between mb-[8px]">
            <h1 className="text-2xl font-mono uppercase">KEYBOARD SHORTCUTS</h1>
            
            <div className="flex items-center gap-[6px] print:hidden">
              <button
                onClick={handlePrint}
                className="brutal-btn-sm"
                title="Print cheat sheet"
              >
                <HiOutlinePrinter className="w-4 h-4" />
              </button>
              <button
                onClick={handleOpenSettings}
                className="brutal-btn-sm"
                title="Customize shortcuts"
              >
                <HiOutlineCog className="w-4 h-4" />
              </button>
              <button
                onClick={() => setHelpOpen(false)}
                className="p-[8px] hover:bg-primary-brutalist/20 transition-colors"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center gap-[8px] print:hidden">
            <div className="relative flex-1 max-w-400px">
              <HiOutlineSearch className="absolute left-12px top-1/2 -translate-y-1/2 w-4 h-4 text-cathode-white/60" />
              <input
                type="text"
                placeholder="SEARCH SHORTCUTS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="brutal-input pl-36px w-full"
              />
            </div>

            <div className="flex items-center gap-4px">
              {['all', 'navigation', 'quick-actions', 'general'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat as any)}
                  className={clsx(
                    "px-[10px] py-[8px] font-mono text-brutal-xs uppercase transition-colors",
                    selectedCategory === cat
                      ? "bg-primary-brutalist text-event-horizon"
                      : "bg-carbon-plate border-2 border-basalt-border hover:border-primary-brutalist"
                  )}
                >
                  {cat.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Shortcuts List */}
        <div className="flex-1 overflow-y-auto p-[16px] print:p-[10px]">
          {groupedShortcuts.length === 0 ? (
            <div className="text-center py-[24px]">
              <p className="text-cathode-white/60 font-mono text-brutal-sm uppercase">
                NO SHORTCUTS FOUND
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[16px] print:gap-[8px]">
              {groupedShortcuts.map(({ category, shortcuts, info }) => (
                <div key={category} className="print:break-inside-avoid">
                  <div className="mb-[8px] border-b-2 border-basalt-border pb-8px">
                    <h2 className="font-mono text-lg uppercase text-primary-brutalist">
                      {info?.name || category}
                    </h2>
                    {info?.description && (
                      <p className="text-brutal-xs text-cathode-white/60 mt-4px print:hidden">
                        {info.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-[8px]">
                    {shortcuts.map(shortcut => (
                      <div
                        key={shortcut.id}
                        className="flex items-center justify-between py-6px"
                      >
                        <div className="flex-1 pr-[8px]">
                          <div className="font-mono text-brutal-sm">
                            {shortcut.name}
                          </div>
                          <div className="text-brutal-xs text-cathode-white/60 print:hidden">
                            {shortcut.description}
                          </div>
                        </div>

                        <div className="flex items-center gap-[8px]">
                          <div className="px-[10px] py-6px bg-event-horizon border-2 border-basalt-border font-mono text-brutal-xs whitespace-nowrap">
                            {formatKeyCombo(shortcut.customKeys || shortcut.defaultKeys)}
                          </div>
                          {shortcut.customKeys && (
                            <span className="px-6px py-2px bg-primary-brutalist text-event-horizon font-mono text-brutal-xs uppercase print:hidden">
                              CUSTOM
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-carbon-plate border-t-2 border-basalt-border p-[10px] print:hidden">
          <div className="flex items-center justify-between">
            <p className="font-mono text-brutal-xs text-cathode-white/60">
              PRESS ESC TO CLOSE • CTRL+K TO OPEN COMMAND PALETTE
            </p>
            <button
              onClick={handleOpenSettings}
              className="brutal-btn-sm"
            >
              CUSTOMIZE SHORTCUTS
            </button>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .fixed[role="dialog"], .fixed[role="dialog"] * {
            visibility: visible;
          }
          .fixed[role="dialog"] {
            position: static !important;
            transform: none !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            border: none !important;
            box-shadow: none !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:break-inside-avoid {
            break-inside: avoid;
          }
        }
      `}} />
    </>
  )
}