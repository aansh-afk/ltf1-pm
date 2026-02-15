import { useState, useMemo } from 'react'
import { useShortcuts } from '../../contexts/ShortcutContext'
import type { Shortcut, KeyCombo, ShortcutCategory } from '../../types/shortcuts'
import { defaultShortcutGroups } from '../../config/defaultShortcuts'
import ShortcutRecorder from '../../components/shortcuts/ShortcutRecorder'
import BrutalCard from '@/components/ui/BrutalCard'
import BrutalButton from '@/components/ui/BrutalButton'
import BrutalBadge from '@/components/ui/BrutalBadge'
import {
  HiOutlineSearch,
  HiOutlinePencil,
  HiOutlineRefresh,
  HiOutlineDownload,
  HiOutlineUpload,
  HiOutlineTerminal,
  HiOutlineCheck,
  HiOutlineX
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
      toast.success('SHORTCUT_UPDATED')
      setEditingShortcut(null)
    }
  }

  const handleResetShortcut = (id: string) => {
    resetShortcut(id)
    toast.success('SHORTCUT_RESET')
  }

  const handleResetAll = () => {
    if (confirm('RESET ALL SHORTCUTS TO DEFAULT?')) {
      resetAllShortcuts()
      toast.success('ALL_SHORTCUTS_RESET')
    }
  }

  const handleToggleShortcut = (shortcut: Shortcut) => {
    if (shortcut.enabled) {
      disableShortcut(shortcut.id)
      toast.success('SHORTCUT_DISABLED')
    } else {
      enableShortcut(shortcut.id)
      toast.success('SHORTCUT_ENABLED')
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
    // Delay cleanup so the browser has time to initiate the download
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 100)
    toast.success('SETTINGS_EXPORTED')
  }

  const handleImport = () => {
    if (!importJson) {
      toast.error('NO_JSON_DATA')
      return
    }

    if (importSettings(importJson)) {
      toast.success('SETTINGS_IMPORTED')
      setShowImportExport(false)
      setImportJson('')
    } else {
      toast.error('IMPORT_FAILED_INVALID_FORMAT')
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
    { value: 'all', label: 'ALL' },
    { value: 'navigation', label: 'NAV' },
    { value: 'quick-actions', label: 'ACTIONS' },
    { value: 'general', label: 'GENERAL' }
  ]

  return (
    <div className="space-y-3">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <h2 className="text-lg font-bold uppercase">KEYBIND_CONFIG</h2>
        <div className="flex gap-2">
          <BrutalButton
            size="sm"
            variant="secondary"
            onClick={() => setShowImportExport(!showImportExport)}
            className="flex items-center gap-2"
          >
            <HiOutlineDownload className="w-4 h-4" />
            IMPORT/EXPORT
          </BrutalButton>
          <BrutalButton
            size="sm"
            variant="destructive"
            onClick={handleResetAll}
            className="flex items-center gap-2"
          >
            <HiOutlineRefresh className="w-4 h-4" />
            RESET_ALL
          </BrutalButton>
        </div>
      </div>

      {/* Search and Filter */}
      <BrutalCard className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--theme-foreground)]/60" />
            <input
              type="text"
              placeholder="SEARCH_BINDINGS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm focus:border-[var(--theme-primary)] outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={clsx(
                  "px-3 py-2 font-mono text-xs font-bold uppercase transition-all border-2",
                  selectedCategory === cat.value
                    ? "bg-[var(--theme-primary)] text-[var(--theme-background)] border-[var(--theme-primary)]"
                    : "bg-transparent border-[var(--theme-border)] text-[var(--theme-foreground)] hover:border-[var(--theme-foreground)]"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </BrutalCard>

      {/* Import/Export Panel */}
      {showImportExport && (
        <BrutalCard className="p-4 border-dashed">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <h3 className="font-bold uppercase text-sm mb-2">EXPORT_CONFIG</h3>
              <p className="text-xs text-[var(--theme-foreground)]/60 mb-4 font-mono">
                Download your custom keybindings as a JSON file.
              </p>
              <BrutalButton
                variant="primary"
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-2"
              >
                <HiOutlineDownload className="w-4 h-4" />
                DOWNLOAD_JSON
              </BrutalButton>
            </div>

            <div>
              <h3 className="font-bold uppercase text-sm mb-2">IMPORT_CONFIG</h3>
              <div className="space-y-3">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                  id="import-file"
                />
                <label
                  htmlFor="import-file"
                  className="flex items-center justify-center gap-2 w-full p-2 border-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)] hover:bg-[var(--theme-background)] cursor-pointer font-mono text-xs font-bold uppercase transition-colors"
                >
                  <HiOutlineUpload className="w-4 h-4" />
                  SELECT_FILE
                </label>

                <textarea
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder="PASTE_JSON_DATA..."
                  className="w-full h-24 p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-xs resize-none focus:border-[var(--theme-primary)] outline-none"
                />

                <BrutalButton
                  variant="secondary"
                  onClick={handleImport}
                  disabled={!importJson}
                  className="w-full"
                >
                  APPLY_IMPORT
                </BrutalButton>
              </div>
            </div>
          </div>
        </BrutalCard>
      )}

      {/* Shortcuts List */}
      <div className="space-y-3">
        {groupedShortcuts.length === 0 ? (
          <BrutalCard className="p-8 text-center border-dashed">
            <HiOutlineTerminal className="w-8 h-8 mx-auto mb-4 text-[var(--theme-foreground)]/40" />
            <p className="text-[var(--theme-foreground)]/60 font-mono text-sm uppercase">
              NO_BINDINGS_FOUND
            </p>
          </BrutalCard>
        ) : (
          groupedShortcuts.map(({ category, shortcuts, info }) => (
            <div key={category}>
              <h3 className="font-bold uppercase text-sm mb-3 pl-2 border-l-4 border-[var(--theme-primary)]">
                {info?.name || category}
              </h3>

              <div className="grid gap-3">
                {shortcuts.map(shortcut => (
                  <BrutalCard
                    key={shortcut.id}
                    className={clsx(
                      "p-4 transition-all",
                      !shortcut.enabled && "opacity-60 grayscale"
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
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <button
                            onClick={() => handleToggleShortcut(shortcut)}
                            className={clsx(
                              "w-5 h-5 border-2 flex items-center justify-center transition-colors",
                              shortcut.enabled
                                ? "bg-[var(--theme-primary)] border-[var(--theme-primary)] text-[var(--theme-background)]"
                                : "bg-transparent border-[var(--theme-foreground)] text-transparent"
                            )}
                          >
                            <HiOutlineCheck className="w-3 h-3" />
                          </button>

                          <div>
                            <div className="font-bold uppercase text-sm">{shortcut.name}</div>
                            <div className="text-xs text-[var(--theme-foreground)]/60 font-mono mt-1">
                              {shortcut.description}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {shortcut.customKeys && (
                              <BrutalBadge variant="outline" className="text-[10px] text-[var(--theme-primary)] border-[var(--theme-primary)]">
                                CUSTOM
                              </BrutalBadge>
                            )}
                            <code className="px-3 py-1 bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] font-mono text-xs font-bold">
                              {formatKeyCombo(shortcut.customKeys || shortcut.defaultKeys)}
                            </code>
                          </div>

                          <div className="flex gap-1">
                            <BrutalButton
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingShortcut(shortcut.id)}
                              title="EDIT_BINDING"
                            >
                              <HiOutlinePencil className="w-4 h-4" />
                            </BrutalButton>

                            {shortcut.customKeys && (
                              <BrutalButton
                                size="sm"
                                variant="ghost"
                                onClick={() => handleResetShortcut(shortcut.id)}
                                title="RESET_DEFAULT"
                                className="text-brutal-warning hover:text-brutal-warning"
                              >
                                <HiOutlineRefresh className="w-4 h-4" />
                              </BrutalButton>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </BrutalCard>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="text-center py-4 border-t-2 border-[var(--theme-border)]">
        <p className="font-mono text-xs text-[var(--theme-foreground)]/60 uppercase">
          PRESS <span className="font-bold text-[var(--theme-foreground)]">?</span> FOR QUICK_HELP • <span className="font-bold text-[var(--theme-foreground)]">CTRL+K</span> FOR COMMAND_PALETTE
        </p>
      </div>
    </div>
  )
}