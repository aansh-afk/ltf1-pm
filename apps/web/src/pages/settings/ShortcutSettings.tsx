import { useState, useMemo } from 'react'
import { useShortcuts } from '../../contexts/ShortcutContext'
import type { Shortcut, KeyCombo, ShortcutCategory } from '../../types/shortcuts'
import { defaultShortcutGroups } from '../../config/defaultShortcuts'
import ShortcutRecorder from '../../components/shortcuts/ShortcutRecorder'
import { BrutalCheckbox } from '../../components/ui'
import { 
  HiOutlineSearch, 
  HiOutlinePencil, 
  HiOutlineRefresh,
  HiOutlineDownload,
  HiOutlineUpload
} from 'react-icons/hi'
import clsx from 'clsx'
import toast from 'react-hot-toast'

export default function ShortcutSettings() {
  const {
    shortcuts,
    updateShortcut,
    resetShortcut,
    resetAllShortcuts,
    enableShortcut,
    disableShortcut,
    formatKeyCombo,
    exportSettings,
    importSettings
  } = useShortcuts()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ShortcutCategory | 'all'>('all')
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null)
  const [showImportExport, setShowImportExport] = useState(false)
  const [importJson, setImportJson] = useState('')

  // Filter shortcuts
  const filteredShortcuts = useMemo(() => {
    let filtered = shortcuts

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
    const groups = new Map<ShortcutCategory, Shortcut[]>()
    
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

  const handleUpdateShortcut = (id: string, keys: KeyCombo) => {
    const conflicts = updateShortcut(id, keys)
    if (conflicts.length === 0) {
      toast.success('Shortcut updated')
      setEditingShortcut(null)
    }
  }

  const handleResetShortcut = (id: string) => {
    resetShortcut(id)
    toast.success('Shortcut reset to default')
  }

  const handleResetAll = () => {
    if (confirm('Are you sure you want to reset all shortcuts to defaults?')) {
      resetAllShortcuts()
      toast.success('All shortcuts reset to defaults')
    }
  }

  const handleToggleShortcut = (shortcut: Shortcut) => {
    if (shortcut.enabled) {
      disableShortcut(shortcut.id)
      toast.success('Shortcut disabled')
    } else {
      enableShortcut(shortcut.id)
      toast.success('Shortcut enabled')
    }
  }

  const handleExport = () => {
    const json = exportSettings()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'keyboard-shortcuts.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Settings exported')
  }

  const handleImport = () => {
    if (!importJson) {
      toast.error('Please paste settings JSON')
      return
    }

    if (importSettings(importJson)) {
      toast.success('Settings imported successfully')
      setShowImportExport(false)
      setImportJson('')
    } else {
      toast.error('Failed to import settings. Invalid format.')
    }
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setImportJson(content)
    }
    reader.readAsText(file)
  }

  const categories: Array<{ value: ShortcutCategory | 'all', label: string }> = [
    { value: 'all', label: 'ALL CATEGORIES' },
    { value: 'navigation', label: 'NAVIGATION' },
    { value: 'quick-actions', label: 'QUICK ACTIONS' },
    { value: 'task-operations', label: 'TASK OPERATIONS' },
    { value: 'meeting-operations', label: 'MEETING OPERATIONS' },
    { value: 'general', label: 'GENERAL' }
  ]

  return (
    <div className="h-full flex flex-col bg-[var(--theme-background-secondary)] overflow-hidden">
      {/* Header */}
      <div className="bg-[var(--theme-background)] border-b-4 border-[var(--theme-border)] p-24px flex-shrink-0">
        <div className="flex items-center justify-between mb-24px">
          <h1 className="text-2xl font-mono uppercase">KEYBOARD SHORTCUTS</h1>
          
          <div className="flex items-center gap-12px">
            <button
              onClick={() => setShowImportExport(!showImportExport)}
              className="brutal-btn-sm"
            >
              <HiOutlineDownload className="w-16px h-16px mr-4px" />
              IMPORT/EXPORT
            </button>
            <button
              onClick={handleResetAll}
              className="brutal-btn-sm bg-brutal-error"
            >
              <HiOutlineRefresh className="w-16px h-16px mr-4px" />
              RESET ALL
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-16px">
          <div className="relative flex-1 max-w-400px">
            <HiOutlineSearch className="absolute left-12px top-1/2 -translate-y-1/2 w-16px h-16px text-[var(--theme-foreground)]/60" />
            <input
              type="text"
              placeholder="SEARCH SHORTCUTS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="brutal-input pl-36px w-full"
            />
          </div>

          <div className="flex items-center gap-4px">
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={clsx(
                  "px-16px py-10px font-mono text-brutal-xs uppercase transition-colors",
                  selectedCategory === cat.value
                    ? "bg-primary-brutalist text-event-horizon"
                    : "bg-[var(--theme-background)] border-2 border-[var(--theme-border)] hover:border-primary-brutalist"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Import/Export Panel */}
      {showImportExport && (
        <div className="bg-[var(--theme-background)] border-b-2 border-[var(--theme-border)] p-24px flex-shrink-0">
          <div className="grid grid-cols-2 gap-24px">
            <div>
              <h3 className="font-mono text-brutal-sm uppercase mb-12px">EXPORT SETTINGS</h3>
              <p className="text-brutal-xs text-[var(--theme-foreground)]/60 mb-12px">
                Download your custom keyboard shortcuts as a JSON file
              </p>
              <button
                onClick={handleExport}
                className="brutal-btn-primary"
              >
                <HiOutlineDownload className="w-16px h-16px mr-8px" />
                DOWNLOAD SETTINGS
              </button>
            </div>

            <div>
              <h3 className="font-mono text-brutal-sm uppercase mb-12px">IMPORT SETTINGS</h3>
              <div className="space-y-12px">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                  id="import-file"
                />
                <label
                  htmlFor="import-file"
                  className="brutal-btn-secondary inline-block cursor-pointer"
                >
                  <HiOutlineUpload className="w-16px h-16px mr-8px inline" />
                  CHOOSE FILE
                </label>
                
                <textarea
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder="OR PASTE JSON HERE..."
                  className="w-full h-100px p-12px bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] font-mono text-brutal-xs resize-none focus:border-primary-brutalist focus:outline-none"
                />
                
                <button
                  onClick={handleImport}
                  disabled={!importJson}
                  className="brutal-btn"
                >
                  IMPORT SETTINGS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shortcuts List */}
      <div className="flex-1 overflow-y-auto p-24px">
        {groupedShortcuts.length === 0 ? (
          <div className="text-center py-48px">
            <p className="text-[var(--theme-foreground)]/60 font-mono text-brutal-sm uppercase">
              NO SHORTCUTS FOUND
            </p>
          </div>
        ) : (
          <div className="space-y-32px">
            {groupedShortcuts.map(({ category, shortcuts, info }) => (
              <div key={category}>
                <div className="mb-16px">
                  <h2 className="font-mono text-lg uppercase text-primary-brutalist">
                    {info?.name || category}
                  </h2>
                  {info?.description && (
                    <p className="text-brutal-xs text-[var(--theme-foreground)]/60 mt-4px">
                      {info.description}
                    </p>
                  )}
                </div>

                <div className="space-y-1px">
                  {shortcuts.map(shortcut => (
                    <div
                      key={shortcut.id}
                      className={clsx(
                        "bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-16px",
                        !shortcut.enabled && "opacity-50"
                      )}
                    >
                      {editingShortcut === shortcut.id ? (
                        <ShortcutRecorder
                          currentKeys={shortcut.customKeys || shortcut.defaultKeys}
                          onRecord={(keys) => handleUpdateShortcut(shortcut.id, keys)}
                          onCancel={() => setEditingShortcut(null)}
                          excludeId={shortcut.id}
                        />
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-12px">
                              <BrutalCheckbox
                                checked={shortcut.enabled}
                                onChange={() => handleToggleShortcut(shortcut)}
                                size="md"
                              />
                              <div>
                                <h3 className="font-mono text-brutal-sm uppercase">
                                  {shortcut.name}
                                </h3>
                                <p className="text-brutal-xs text-[var(--theme-foreground)]/60 mt-2px">
                                  {shortcut.description}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-12px">
                            {/* Shortcut Display */}
                            <div className="px-16px py-8px bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)]">
                              <span className="font-mono text-brutal-sm">
                                {formatKeyCombo(shortcut.customKeys || shortcut.defaultKeys)}
                              </span>
                            </div>

                            {/* Custom Indicator */}
                            {shortcut.customKeys && (
                              <span className="px-8px py-4px bg-primary-brutalist text-event-horizon font-mono text-brutal-xs uppercase">
                                CUSTOM
                              </span>
                            )}

                            {/* Actions */}
                            <button
                              onClick={() => setEditingShortcut(shortcut.id)}
                              className="p-8px hover:bg-primary-brutalist/20 transition-colors"
                              title="Edit shortcut"
                            >
                              <HiOutlinePencil className="w-16px h-16px" />
                            </button>

                            {shortcut.customKeys && (
                              <button
                                onClick={() => handleResetShortcut(shortcut.id)}
                                className="p-8px hover:bg-brutal-warning/20 transition-colors"
                                title="Reset to default"
                              >
                                <HiOutlineRefresh className="w-16px h-16px" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="bg-[var(--theme-background)] border-t-2 border-[var(--theme-border)] p-16px flex-shrink-0">
        <p className="font-mono text-brutal-xs text-[var(--theme-foreground)]/60 text-center">
          PRESS ? TO SHOW KEYBOARD SHORTCUTS HELP • CTRL+K TO OPEN COMMAND PALETTE
        </p>
      </div>
    </div>
  )
}