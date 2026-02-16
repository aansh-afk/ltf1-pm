import { useState, useEffect } from 'react'
import { useQuery, useAction } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import {
  HiOutlineDocumentText,
  HiOutlineFolder,
  HiOutlineFolderOpen,
  HiOutlineRefresh,
  HiOutlineSparkles,
  HiOutlineExternalLink,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
  HiOutlineCode,
  HiOutlineBookOpen,
  HiOutlineClipboardCopy,
  HiOutlineDownload,
  HiOutlinePlus,
} from 'react-icons/hi'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import LoadingSpinner from '../../common/LoadingSpinner'
import AIDocumentationHub from './AIDocumentationHub'
import RepoBrowserPanel from './RepoBrowserModal'

interface ProjectDocsHubProps {
  projectId: string
  workspaceId: string
  tasks?: any[]
  sprints?: any[]
  projectDetails?: any
}

type DocTab = 'repo' | 'ai'
type RepoView = 'docs' | 'add'

// Build a tree structure from flat paths
interface TreeNode {
  name: string
  path: string
  type: 'file' | 'folder'
  children: TreeNode[]
  content?: string
  size?: number
  sha?: string
}

function buildFileTree(docs: Array<{ path: string; name: string; content: string; size: number; sha: string }>): TreeNode[] {
  const root: TreeNode[] = []

  for (const doc of docs) {
    const parts = doc.path.split('/')
    let current = root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isFile = i === parts.length - 1

      if (isFile) {
        current.push({
          name: part,
          path: doc.path,
          type: 'file',
          children: [],
          content: doc.content,
          size: doc.size,
          sha: doc.sha,
        })
      } else {
        let folder = current.find(n => n.name === part && n.type === 'folder')
        if (!folder) {
          folder = { name: part, path: parts.slice(0, i + 1).join('/'), type: 'folder', children: [] }
          current.push(folder)
        }
        current = folder.children
      }
    }
  }

  // Sort: folders first, then files alphabetically (README first)
  function sortNodes(nodes: TreeNode[]): TreeNode[] {
    return nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
      // README always first
      if (a.name.toLowerCase().startsWith('readme')) return -1
      if (b.name.toLowerCase().startsWith('readme')) return 1
      return a.name.localeCompare(b.name)
    }).map(n => ({ ...n, children: sortNodes(n.children) }))
  }

  return sortNodes(root)
}

function FileTreeItem({
  node,
  selectedPath,
  onSelect,
  depth = 0,
}: {
  node: TreeNode
  selectedPath: string | null
  onSelect: (node: TreeNode) => void
  depth?: number
}) {
  const [expanded, setExpanded] = useState(depth < 2)
  const isSelected = node.path === selectedPath

  if (node.type === 'folder') {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={clsx(
            'w-full flex items-center gap-[6px] px-[8px] py-[6px] text-left transition-colors',
            'hover:bg-[var(--theme-background-secondary)]',
            'text-brutal-sm font-mono'
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {expanded ? (
            <HiOutlineChevronDown className="w-3 h-3 flex-shrink-0 text-[var(--theme-foreground)]/40" />
          ) : (
            <HiOutlineChevronRight className="w-3 h-3 flex-shrink-0 text-[var(--theme-foreground)]/40" />
          )}
          {expanded ? (
            <HiOutlineFolderOpen className="w-4 h-4 flex-shrink-0 text-primary-brutalist" />
          ) : (
            <HiOutlineFolder className="w-4 h-4 flex-shrink-0 text-primary-brutalist" />
          )}
          <span className="truncate uppercase text-brutal-xs font-bold">{node.name}</span>
        </button>
        {expanded && (
          <div>
            {node.children.map((child) => (
              <FileTreeItem
                key={child.path}
                node={child}
                selectedPath={selectedPath}
                onSelect={onSelect}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={() => onSelect(node)}
      className={clsx(
        'w-full flex items-center gap-[6px] px-[8px] py-[6px] text-left transition-all',
        'text-brutal-sm font-mono',
        isSelected
          ? 'bg-primary-brutalist/10 border-l-2 border-primary-brutalist text-[var(--theme-foreground)]'
          : 'hover:bg-[var(--theme-background-secondary)] border-l-2 border-transparent'
      )}
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
    >
      <HiOutlineDocumentText className="w-4 h-4 flex-shrink-0 text-[var(--theme-foreground)]/60" />
      <span className="truncate">{node.name}</span>
    </button>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ProjectDocsHub({
  projectId,
  workspaceId,
  tasks = [],
  sprints = [],
  projectDetails,
}: ProjectDocsHubProps) {
  const [activeTab, setActiveTab] = useState<DocTab>('repo')
  const [repoView, setRepoView] = useState<RepoView>('docs')
  const [selectedDoc, setSelectedDoc] = useState<TreeNode | null>(null)
  const [syncing, setSyncing] = useState(false)

  const repoDocs = useQuery(
    api.integrations.github.docs.getRepoDocs,
    { projectId: projectId as any }
  )

  const fetchRepoDocs = useAction(api.integrations.github.docs.fetchRepoDocs)

  const project = useQuery(
    api.projects.queries.getProject,
    projectId ? { projectId: projectId as any } : 'skip'
  )

  const hasRepo = !!project?.repository
  const hasDocs = repoDocs && repoDocs.length > 0
  const fileTree = repoDocs ? buildFileTree(
    repoDocs.map(d => ({
      path: d.path,
      name: d.name,
      content: d.content,
      size: d.size,
      sha: d.sha,
    }))
  ) : []

  // Auto-select README on first load
  useEffect(() => {
    if (repoDocs && repoDocs.length > 0 && !selectedDoc) {
      const readme = repoDocs.find(d =>
        d.name.toLowerCase().startsWith('readme')
      )
      if (readme) {
        setSelectedDoc({
          name: readme.name,
          path: readme.path,
          type: 'file',
          children: [],
          content: readme.content,
          size: readme.size,
          sha: readme.sha,
        })
      }
    }
  }, [repoDocs, selectedDoc])

  // When docs appear for the first time, switch to docs view
  useEffect(() => {
    if (hasDocs && repoView === 'add') {
      // Don't auto-switch — let user stay on add view if they want
    }
  }, [hasDocs, repoView])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const result = await fetchRepoDocs({ projectId: projectId as any })
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('Failed to sync docs from repository')
    } finally {
      setSyncing(false)
    }
  }

  const handleCopyContent = () => {
    if (selectedDoc?.content) {
      navigator.clipboard.writeText(selectedDoc.content)
      toast.success('Copied to clipboard!')
    }
  }

  const handleDownload = () => {
    if (selectedDoc?.content) {
      const blob = new Blob([selectedDoc.content], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = selectedDoc.name
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  // If no repo connected, default to AI tab
  const effectiveTab = !hasRepo && activeTab === 'repo' ? 'ai' : activeTab

  return (
    <div className="space-y-[12px]">
      {/* Header with Tab Toggle */}
      <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-[16px]">
        <div className="flex items-center justify-between mb-[8px]">
          <div>
            <h2 className="text-brutal-lg font-bold uppercase flex items-center gap-[8px]">
              <HiOutlineBookOpen className="w-4 h-4 text-primary-brutalist" />
              PROJECT DOCS
            </h2>
            <p className="text-brutal-sm text-[var(--theme-foreground)]/60 mt-[4px]">
              {hasRepo
                ? `Synced from ${project?.repository?.owner}/${project?.repository?.name}`
                : 'Connect a repository to auto-fetch docs, or generate with AI'}
            </p>
          </div>

          {/* Tab Toggle */}
          <div className="flex items-center gap-0 border-2 border-[var(--theme-border)]">
            <button
              onClick={() => setActiveTab('repo')}
              className={clsx(
                'px-[12px] py-[6px] text-brutal-xs font-mono font-bold uppercase transition-all flex items-center gap-[6px]',
                effectiveTab === 'repo'
                  ? 'bg-primary-brutalist text-white'
                  : 'hover:bg-[var(--theme-background-secondary)]',
                !hasRepo && 'opacity-50'
              )}
              disabled={!hasRepo}
              title={!hasRepo ? 'Connect a GitHub repository first' : 'Repository docs'}
            >
              <HiOutlineCode className="w-3.5 h-3.5" />
              REPO DOCS
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={clsx(
                'px-[12px] py-[6px] text-brutal-xs font-mono font-bold uppercase transition-all flex items-center gap-[6px] border-l-2 border-[var(--theme-border)]',
                effectiveTab === 'ai'
                  ? 'bg-primary-brutalist text-white'
                  : 'hover:bg-[var(--theme-background-secondary)]'
              )}
            >
              <HiOutlineSparkles className="w-3.5 h-3.5" />
              AI DOCS
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {effectiveTab === 'repo' ? (
          <motion.div
            key="repo"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {repoDocs === undefined ? (
              <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-[32px] flex items-center justify-center">
                <LoadingSpinner size="md" />
              </div>
            ) : (
              <>
                {/* Sub-navigation: VIEW DOCS / ADD FROM REPO */}
                <div className="flex items-center gap-0 border-2 border-[var(--theme-border)] bg-[var(--theme-background)] mb-[12px]">
                  <button
                    onClick={() => setRepoView('docs')}
                    className={clsx(
                      'flex-1 px-[12px] py-[8px] text-brutal-xs font-mono font-bold uppercase transition-all flex items-center justify-center gap-[6px]',
                      repoView === 'docs'
                        ? 'bg-[var(--theme-background-secondary)] text-[var(--theme-foreground)]'
                        : 'hover:bg-[var(--theme-background-secondary)]/50 text-[var(--theme-foreground)]/60'
                    )}
                  >
                    <HiOutlineDocumentText className="w-3.5 h-3.5" />
                    VIEW DOCS {hasDocs ? `(${repoDocs.length})` : ''}
                  </button>
                  <button
                    onClick={() => setRepoView('add')}
                    className={clsx(
                      'flex-1 px-[12px] py-[8px] text-brutal-xs font-mono font-bold uppercase transition-all flex items-center justify-center gap-[6px] border-l-2 border-[var(--theme-border)]',
                      repoView === 'add'
                        ? 'bg-[var(--theme-background-secondary)] text-[var(--theme-foreground)]'
                        : 'hover:bg-[var(--theme-background-secondary)]/50 text-[var(--theme-foreground)]/60'
                    )}
                  >
                    <HiOutlinePlus className="w-3.5 h-3.5" />
                    ADD FROM REPO
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {repoView === 'add' ? (
                    <motion.div
                      key="add"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                    >
                      <RepoBrowserPanel
                        projectId={projectId}
                        onImported={() => setRepoView('docs')}
                      />
                    </motion.div>
                  ) : !hasDocs ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                    >
                      {/* Empty State */}
                      <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-[32px]">
                        <div className="text-center max-w-md mx-auto">
                          <HiOutlineDocumentText className="w-12 h-12 mx-auto mb-[12px] text-[var(--theme-foreground)]/20" />
                          <h3 className="text-brutal-md font-bold uppercase mb-[8px]">
                            NO DOCS SYNCED YET
                          </h3>
                          <p className="text-brutal-sm text-[var(--theme-foreground)]/60 mb-[16px]">
                            Auto-sync markdown files or manually add them from your repository.
                          </p>
                          <div className="flex items-center justify-center gap-[8px]">
                            <button
                              onClick={handleSync}
                              disabled={syncing}
                              className="brutal-btn flex items-center gap-[8px]"
                            >
                              {syncing ? (
                                <>
                                  <LoadingSpinner size="sm" />
                                  SYNCING...
                                </>
                              ) : (
                                <>
                                  <HiOutlineRefresh className="w-4 h-4" />
                                  AUTO SYNC
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => setRepoView('add')}
                              className="brutal-btn brutal-btn-outline flex items-center gap-[8px]"
                            >
                              <HiOutlinePlus className="w-4 h-4" />
                              ADD MANUALLY
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="browser"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                    >
                      {/* Docs Browser */}
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 border-2 border-[var(--theme-border)]">
                        {/* File Tree Sidebar */}
                        <div className="lg:col-span-1 bg-[var(--theme-background)] border-r-2 border-[var(--theme-border)]">
                          <div className="flex items-center justify-between p-[10px] border-b-2 border-[var(--theme-border)]">
                            <span className="text-brutal-xs font-mono font-bold uppercase text-[var(--theme-foreground)]/60">
                              FILES ({repoDocs.length})
                            </span>
                            <button
                              onClick={handleSync}
                              disabled={syncing}
                              className="p-[4px] hover:bg-[var(--theme-background-secondary)] transition-colors"
                              title="Re-sync from repository"
                            >
                              <HiOutlineRefresh className={clsx('w-3.5 h-3.5', syncing && 'animate-spin')} />
                            </button>
                          </div>
                          <div className="max-h-[600px] overflow-y-auto">
                            {fileTree.map((node) => (
                              <FileTreeItem
                                key={node.path}
                                node={node}
                                selectedPath={selectedDoc?.path ?? null}
                                onSelect={setSelectedDoc}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Content Viewer */}
                        <div className="lg:col-span-3 bg-[var(--theme-background)]">
                          {selectedDoc?.content ? (
                            <>
                              {/* Doc Header */}
                              <div className="flex items-center justify-between p-[10px] border-b-2 border-[var(--theme-border)]">
                                <div className="flex items-center gap-[8px] min-w-0">
                                  <HiOutlineDocumentText className="w-4 h-4 flex-shrink-0 text-primary-brutalist" />
                                  <span className="font-mono text-brutal-sm font-bold truncate">
                                    {selectedDoc.path}
                                  </span>
                                  <span className="text-brutal-xs text-[var(--theme-foreground)]/40 flex-shrink-0">
                                    {formatFileSize(selectedDoc.size || 0)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-[4px] flex-shrink-0">
                                  <button
                                    onClick={handleCopyContent}
                                    className="p-[6px] hover:bg-[var(--theme-background-secondary)] transition-colors"
                                    title="Copy raw markdown"
                                  >
                                    <HiOutlineClipboardCopy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={handleDownload}
                                    className="p-[6px] hover:bg-[var(--theme-background-secondary)] transition-colors"
                                    title="Download file"
                                  >
                                    <HiOutlineDownload className="w-3.5 h-3.5" />
                                  </button>
                                  {project?.repository && (
                                    <a
                                      href={`${project.repository.url}/blob/${project.repository.defaultBranch}/${selectedDoc.path}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-[6px] hover:bg-[var(--theme-background-secondary)] transition-colors"
                                      title="View on GitHub"
                                    >
                                      <HiOutlineExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>
                              </div>

                              {/* Markdown Content */}
                              <div className="p-[16px] max-h-[600px] overflow-y-auto">
                                <div className="prose prose-invert max-w-none
                                  prose-headings:font-mono prose-headings:uppercase prose-headings:tracking-wide
                                  prose-h1:text-brutal-lg prose-h1:border-b-2 prose-h1:border-[var(--theme-border)] prose-h1:pb-[8px] prose-h1:mb-[12px]
                                  prose-h2:text-brutal-md prose-h2:mt-[16px] prose-h2:mb-[8px]
                                  prose-h3:text-brutal-sm prose-h3:mt-[12px] prose-h3:mb-[6px]
                                  prose-p:text-brutal-sm prose-p:text-[var(--theme-foreground)]/80 prose-p:leading-relaxed
                                  prose-a:text-primary-brutalist prose-a:no-underline hover:prose-a:underline
                                  prose-code:text-primary-brutalist prose-code:bg-[var(--theme-background-secondary)] prose-code:px-[4px] prose-code:py-[2px] prose-code:text-brutal-xs prose-code:font-mono
                                  prose-pre:bg-[var(--theme-background-secondary)] prose-pre:border-2 prose-pre:border-[var(--theme-border)] prose-pre:p-[12px]
                                  prose-ul:text-brutal-sm prose-ol:text-brutal-sm
                                  prose-li:text-[var(--theme-foreground)]/80
                                  prose-strong:text-[var(--theme-foreground)]
                                  prose-blockquote:border-l-2 prose-blockquote:border-primary-brutalist prose-blockquote:text-[var(--theme-foreground)]/60
                                  prose-table:text-brutal-sm
                                  prose-th:bg-[var(--theme-background-secondary)] prose-th:p-[8px] prose-th:border-2 prose-th:border-[var(--theme-border)] prose-th:font-mono prose-th:uppercase
                                  prose-td:p-[8px] prose-td:border-2 prose-td:border-[var(--theme-border)]
                                  prose-img:border-2 prose-img:border-[var(--theme-border)]
                                  prose-hr:border-[var(--theme-border)]
                                ">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {selectedDoc.content}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="p-[32px] text-center text-[var(--theme-foreground)]/40">
                              <HiOutlineDocumentText className="w-10 h-10 mx-auto mb-[8px]" />
                              <p className="text-brutal-sm font-mono">SELECT A FILE TO VIEW</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="ai"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <AIDocumentationHub
              projectId={projectId}
              workspaceId={workspaceId}
              tasks={tasks}
              sprints={sprints}
              projectDetails={projectDetails}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
