import { useState, useCallback } from 'react'
import { useAction } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import {
  HiOutlineFolder,
  HiOutlineFolderOpen,
  HiOutlineDocumentText,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
  HiOutlineDownload,
} from 'react-icons/hi'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import BrutalModal from '../../ui/BrutalModal'
import BrutalCheckbox from '../../ui/BrutalCheckbox'
import LoadingSpinner from '../../common/LoadingSpinner'

interface RepoItem {
  name: string
  path: string
  type: 'file' | 'dir'
  size: number
}

interface DirNode {
  items: RepoItem[]
  loaded: boolean
  loading: boolean
}

interface RepoBrowserModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
}

export default function RepoBrowserModal({
  isOpen,
  onClose,
  projectId,
}: RepoBrowserModalProps) {
  const [dirs, setDirs] = useState<Record<string, DirNode>>({})
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)
  const [rootLoading, setRootLoading] = useState(false)

  const browseRepoContents = useAction(api.integrations.github.docs.browseRepoContents)
  const fetchSelectedDocs = useAction(api.integrations.github.docs.fetchSelectedDocs)

  // Load a directory's contents
  const loadDir = useCallback(async (path: string) => {
    const key = path || '__root__'

    // Already loaded
    if (dirs[key]?.loaded) return

    // Mark loading
    if (key === '__root__') {
      setRootLoading(true)
    }
    setDirs(prev => ({
      ...prev,
      [key]: { items: [], loaded: false, loading: true },
    }))

    try {
      const result = await browseRepoContents({
        projectId: projectId as any,
        path: path || undefined,
      })

      if (result.success) {
        setDirs(prev => ({
          ...prev,
          [key]: { items: result.items, loaded: true, loading: false },
        }))
      } else {
        toast.error(result.message)
        setDirs(prev => ({
          ...prev,
          [key]: { items: [], loaded: true, loading: false },
        }))
      }
    } catch {
      toast.error('Failed to load directory')
      setDirs(prev => ({
        ...prev,
        [key]: { items: [], loaded: true, loading: false },
      }))
    } finally {
      if (key === '__root__') {
        setRootLoading(false)
      }
    }
  }, [browseRepoContents, projectId, dirs])

  // Load root on first open
  const handleOpen = useCallback(() => {
    if (!dirs['__root__']?.loaded) {
      loadDir('')
    }
  }, [dirs, loadDir])

  // Toggle folder expansion
  const toggleFolder = useCallback(async (path: string) => {
    const newExpanded = new Set(expanded)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
      // Load if not yet loaded
      const key = path || '__root__'
      if (!dirs[key]?.loaded) {
        await loadDir(path)
      }
    }
    setExpanded(newExpanded)
  }, [expanded, dirs, loadDir])

  // Toggle file selection
  const toggleFile = useCallback((path: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }, [])

  // Select all files in a directory (recursively loads and selects .md files)
  const selectAllInDir = useCallback(async (dirPath: string) => {
    const key = dirPath || '__root__'

    // Ensure loaded
    if (!dirs[key]?.loaded) {
      await loadDir(dirPath)
    }

    const node = dirs[key]
    if (!node?.items) return

    const newSelected = new Set(selected)
    for (const item of node.items) {
      if (item.type === 'file') {
        newSelected.add(item.path)
      }
    }
    setSelected(newSelected)
  }, [dirs, selected, loadDir])

  // Import selected files
  const handleImport = async () => {
    if (selected.size === 0) return

    setImporting(true)
    try {
      const result = await fetchSelectedDocs({
        projectId: projectId as any,
        paths: Array.from(selected),
      })

      if (result.success) {
        toast.success(result.message)
        onClose()
        // Reset state
        setSelected(new Set())
        setDirs({})
        setExpanded(new Set())
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Failed to import files')
    } finally {
      setImporting(false)
    }
  }

  // When modal opens, load root
  if (isOpen && !dirs['__root__']?.loaded && !rootLoading) {
    handleOpen()
  }

  const rootNode = dirs['__root__']

  return (
    <BrutalModal
      isOpen={isOpen}
      onClose={onClose}
      title="ADD FROM REPO"
      size="lg"
    >
      <div className="space-y-[12px]">
        <p className="text-brutal-sm text-[var(--theme-foreground)]/60 font-mono">
          Browse your repository and select markdown files to import.
        </p>

        {/* File browser */}
        <div className="border-2 border-[var(--theme-border)] max-h-[400px] overflow-y-auto bg-[var(--theme-background)]">
          {!rootNode?.loaded ? (
            <div className="p-[24px] flex items-center justify-center">
              <LoadingSpinner size="md" />
            </div>
          ) : rootNode.items.length === 0 ? (
            <div className="p-[24px] text-center text-[var(--theme-foreground)]/40">
              <HiOutlineDocumentText className="w-8 h-8 mx-auto mb-[8px]" />
              <p className="text-brutal-sm font-mono">NO MARKDOWN FILES FOUND</p>
            </div>
          ) : (
            <div className="py-[4px]">
              {rootNode.items.map((item) => (
                <BrowseItem
                  key={item.path}
                  item={item}
                  depth={0}
                  dirs={dirs}
                  expanded={expanded}
                  selected={selected}
                  onToggleFolder={toggleFolder}
                  onToggleFile={toggleFile}
                  onSelectAllInDir={selectAllInDir}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-[4px]">
          <span className="text-brutal-xs font-mono text-[var(--theme-foreground)]/40">
            {selected.size} file{selected.size !== 1 ? 's' : ''} selected
          </span>

          <div className="flex items-center gap-[8px]">
            <button
              onClick={onClose}
              className="px-[12px] py-[6px] text-brutal-xs font-mono font-bold uppercase border-2 border-[var(--theme-border)] hover:bg-[var(--theme-background-secondary)] transition-colors"
            >
              CANCEL
            </button>
            <button
              onClick={handleImport}
              disabled={selected.size === 0 || importing}
              className={clsx(
                'px-[12px] py-[6px] text-brutal-xs font-mono font-bold uppercase border-2 transition-colors flex items-center gap-[6px]',
                selected.size > 0 && !importing
                  ? 'bg-primary-brutalist text-white border-primary-brutalist hover:bg-primary-brutalist/90'
                  : 'opacity-50 cursor-not-allowed border-[var(--theme-border)]'
              )}
            >
              {importing ? (
                <>
                  <LoadingSpinner size="sm" />
                  IMPORTING...
                </>
              ) : (
                <>
                  <HiOutlineDownload className="w-3.5 h-3.5" />
                  ADD SELECTED ({selected.size})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </BrutalModal>
  )
}

// Individual browse item (file or folder)
function BrowseItem({
  item,
  depth,
  dirs,
  expanded,
  selected,
  onToggleFolder,
  onToggleFile,
  onSelectAllInDir,
}: {
  item: RepoItem
  depth: number
  dirs: Record<string, DirNode>
  expanded: Set<string>
  selected: Set<string>
  onToggleFolder: (path: string) => void
  onToggleFile: (path: string) => void
  onSelectAllInDir: (path: string) => void
}) {
  const isExpanded = expanded.has(item.path)
  const isSelected = selected.has(item.path)
  const dirNode = dirs[item.path]

  if (item.type === 'dir') {
    return (
      <div>
        <div
          className="flex items-center gap-[6px] px-[8px] py-[6px] hover:bg-[var(--theme-background-secondary)] transition-colors group"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          <button
            onClick={() => onToggleFolder(item.path)}
            className="flex items-center gap-[6px] flex-1 min-w-0 text-left"
          >
            {isExpanded ? (
              <HiOutlineChevronDown className="w-3 h-3 flex-shrink-0 text-[var(--theme-foreground)]/40" />
            ) : (
              <HiOutlineChevronRight className="w-3 h-3 flex-shrink-0 text-[var(--theme-foreground)]/40" />
            )}
            {isExpanded ? (
              <HiOutlineFolderOpen className="w-4 h-4 flex-shrink-0 text-primary-brutalist" />
            ) : (
              <HiOutlineFolder className="w-4 h-4 flex-shrink-0 text-primary-brutalist" />
            )}
            <span className="truncate text-brutal-xs font-mono font-bold uppercase">
              {item.name}
            </span>
          </button>
          <button
            onClick={() => onSelectAllInDir(item.path)}
            className="text-brutal-xs font-mono text-primary-brutalist opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 px-[4px]"
            title="Select all .md files in this folder"
          >
            +ALL
          </button>
        </div>

        {isExpanded && (
          <div>
            {dirNode?.loading ? (
              <div className="py-[8px] flex justify-center" style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}>
                <LoadingSpinner size="sm" />
              </div>
            ) : dirNode?.items?.length === 0 ? (
              <div
                className="py-[6px] text-brutal-xs font-mono text-[var(--theme-foreground)]/30"
                style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
              >
                No markdown files
              </div>
            ) : (
              dirNode?.items?.map((child) => (
                <BrowseItem
                  key={child.path}
                  item={child}
                  depth={depth + 1}
                  dirs={dirs}
                  expanded={expanded}
                  selected={selected}
                  onToggleFolder={onToggleFolder}
                  onToggleFile={onToggleFile}
                  onSelectAllInDir={onSelectAllInDir}
                />
              ))
            )}
          </div>
        )}
      </div>
    )
  }

  // File item
  return (
    <div
      className="flex items-center gap-[6px] px-[8px] py-[6px] hover:bg-[var(--theme-background-secondary)] transition-colors cursor-pointer"
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
      onClick={() => onToggleFile(item.path)}
    >
      <BrutalCheckbox
        size="sm"
        checked={isSelected}
        onChange={() => onToggleFile(item.path)}
        onClick={(e) => e.stopPropagation()}
      />
      <HiOutlineDocumentText className="w-4 h-4 flex-shrink-0 text-[var(--theme-foreground)]/60" />
      <span className="truncate text-brutal-sm font-mono">{item.name}</span>
      {item.size > 0 && (
        <span className="text-brutal-xs text-[var(--theme-foreground)]/30 flex-shrink-0 ml-auto">
          {item.size < 1024 ? `${item.size}B` : `${(item.size / 1024).toFixed(1)}KB`}
        </span>
      )}
    </div>
  )
}
