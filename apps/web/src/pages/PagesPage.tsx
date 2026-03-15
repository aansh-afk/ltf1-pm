import { useState, useCallback, useEffect, useRef } from "react"
import { useQuery, useMutation, useAction } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"
import { m, AnimatePresence } from "framer-motion"
import {
  HiOutlineDocumentText,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineTrash,
  HiOutlineArrowLeft,
  HiOutlineArchive,
  HiOutlineTemplate,
  HiOutlineSparkles,
  HiOutlineX,
  HiOutlineClock,
  HiOutlineDocumentDuplicate,
} from "react-icons/hi"
import clsx from "clsx"
import { useCurrentWorkspace } from "@/hooks/useCurrentWorkspace"
import { useDocumentAutoSave } from "@/hooks/useDocumentAutoSave"
import { useDocumentPresence } from "@/hooks/useDocumentPresence"
import { usePageTitle } from "@/hooks/usePageTitle"
import BrutalButton from "@/components/ui/BrutalButton"
import BrutalInput from "@/components/ui/BrutalInput"
import BlockNoteEditor from "@/components/features/documents/BlockNoteEditor"
import SaveStatusIndicator from "@/components/features/documents/SaveStatusIndicator"
import PageIconPicker from "@/components/features/documents/PageIconPicker"
import PageBreadcrumbs from "@/components/features/documents/PageBreadcrumbs"
import PageSidebar from "@/components/features/documents/PageSidebar"
import {
  TEMPLATES,
  TEMPLATE_CATEGORIES,
  WELCOME_PAGE_CONTENT,
  LTF1_TUTORIAL_CONTENT,
} from "@/components/features/documents/templates"
import type { PageTemplate } from "@/components/features/documents/templates"
import toast from "react-hot-toast"

// ── Template Gallery Modal ──────────────────────────────

function TemplateGallery({
  isOpen,
  onClose,
  onSelectTemplate,
  onAIGenerate,
}: {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (template: PageTemplate) => void
  onAIGenerate: () => void
}) {
  const [category, setCategory] = useState<string>("all")
  const [search, setSearch] = useState("")

  const filtered = TEMPLATES.filter((t) => {
    if (category !== "all" && t.category !== category) return false
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <m.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="relative bg-[#0A0A0A] border-2 border-[#2E2E35] shadow-[6px_6px_0px_rgba(0,0,0,0.6)] w-[680px] max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2E2E35]">
          <div className="flex items-center gap-2">
            <HiOutlineTemplate className="w-5 h-5 text-[var(--theme-info)]" />
            <h2 className="text-[14px] font-bold text-[var(--theme-foreground)] tracking-tight">
              CHOOSE A TEMPLATE
            </h2>
          </div>
          <button onClick={onClose} className="text-[var(--theme-foreground)]/40 hover:text-[var(--theme-foreground)] transition-colors">
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        {/* AI Banner */}
        <button
          onClick={() => { onClose(); onAIGenerate() }}
          className="mx-5 mt-4 flex items-center gap-3 p-3 border border-[#6366F1]/30 bg-[#6366F1]/5 hover:bg-[#6366F1]/10 hover:border-[#6366F1]/50 transition-all group"
        >
          <div className="w-9 h-9 bg-[#6366F1]/20 flex items-center justify-center shrink-0">
            <HiOutlineSparkles className="w-5 h-5 text-[#6366F1] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-left">
            <p className="text-[13px] font-semibold text-[var(--theme-foreground)]">Generate with AI</p>
            <p className="text-[11px] text-[var(--theme-foreground)]/40 font-mono">
              Describe what you need — AI builds the template
            </p>
          </div>
          <span className="ml-auto text-[10px] font-mono text-[#6366F1] tracking-wider shrink-0">
            BETA
          </span>
        </button>

        {/* Search + Categories */}
        <div className="px-5 pt-4 pb-2 space-y-3">
          <div className="relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--theme-foreground)]/20" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full bg-[#111111] border border-[#2E2E35] text-[13px] text-[var(--theme-foreground)] py-2 pl-9 pr-3 outline-none focus:border-[var(--theme-info)] font-mono placeholder:text-[var(--theme-foreground)]/20"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {TEMPLATE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={clsx(
                  "text-[10px] font-mono tracking-wider px-2.5 py-1 border transition-colors shrink-0",
                  category === cat.id
                    ? "bg-[var(--theme-info)] text-[var(--theme-background)] border-[var(--theme-info)]"
                    : "border-[#2E2E35] text-[var(--theme-foreground)]/50 hover:text-[var(--theme-foreground)] hover:border-[var(--theme-foreground)]/30"
                )}
              >
                {cat.label.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 pt-2">
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((template) => (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template)}
                className="text-left p-3 border border-[#2E2E35] bg-[#111111] hover:border-[var(--theme-info)] hover:bg-[#111111]/80 transition-all group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{template.icon}</span>
                  <span className="text-[13px] font-semibold text-[var(--theme-foreground)] group-hover:text-[var(--theme-info)] transition-colors">
                    {template.name}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--theme-foreground)]/40 leading-relaxed line-clamp-2">
                  {template.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </m.div>
    </div>
  )
}

// ── AI Template Generator Modal ─────────────────────────

function AITemplateModal({
  isOpen,
  onClose,
  onGenerated,
}: {
  isOpen: boolean
  onClose: () => void
  onGenerated: (name: string, icon: string, content: any[]) => void
}) {
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const generateTemplate = useAction(api.documents.aiTemplates.generateTemplate)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    try {
      const content = await generateTemplate({ prompt: prompt.trim() })
      // Derive name from prompt
      const name = prompt.trim().split(/[.!?\n]/)[0].slice(0, 60)
      onGenerated(name, "✨", content)
      toast.success("Template generated!")
      onClose()
      setPrompt("")
    } catch (err: any) {
      toast.error(err.message || "Failed to generate template")
    } finally {
      setLoading(false)
    }
  }

  const suggestions = [
    "Sprint retrospective with mad/sad/glad format",
    "Technical architecture document for a microservices system",
    "Product launch checklist with pre-launch, launch day, and post-launch phases",
    "1-on-1 meeting template with career growth discussion",
    "Incident post-mortem with timeline and action items",
    "Onboarding guide for new engineering team members",
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <m.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="relative bg-[#0A0A0A] border-2 border-[#2E2E35] shadow-[6px_6px_0px_rgba(0,0,0,0.6)] w-[520px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2E2E35]">
          <div className="flex items-center gap-2">
            <HiOutlineSparkles className="w-5 h-5 text-[#6366F1]" />
            <h2 className="text-[14px] font-bold text-[var(--theme-foreground)] tracking-tight">
              AI TEMPLATE GENERATOR
            </h2>
          </div>
          <button onClick={onClose} className="text-[var(--theme-foreground)]/40 hover:text-[var(--theme-foreground)]">
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-[11px] font-mono text-[var(--theme-foreground)]/40 tracking-wider block mb-2">
              DESCRIBE YOUR TEMPLATE
            </label>
            <textarea
              ref={inputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Sprint planning template for a 2-week sprint with capacity planning..."
              rows={3}
              className="w-full bg-[#111111] border-2 border-[#2E2E35] text-[13px] text-[var(--theme-foreground)] p-3 outline-none focus:border-[#6366F1] font-['Inter',sans-serif] placeholder:text-[var(--theme-foreground)]/20 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate()
              }}
            />
          </div>

          {/* Suggestions */}
          <div>
            <label className="text-[10px] font-mono text-[var(--theme-foreground)]/30 tracking-wider block mb-2">
              TRY THESE
            </label>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(s)}
                  className="text-[10px] font-mono text-[var(--theme-foreground)]/40 border border-[#2E2E35] px-2 py-1 hover:text-[var(--theme-foreground)] hover:border-[var(--theme-foreground)]/30 transition-colors truncate max-w-[240px]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <BrutalButton variant="ghost" size="sm" onClick={onClose}>
              CANCEL
            </BrutalButton>
            <BrutalButton
              variant="primary"
              size="sm"
              onClick={handleGenerate}
              loading={loading}
              disabled={!prompt.trim()}
            >
              <HiOutlineSparkles className="w-3.5 h-3.5 mr-1" />
              GENERATE
            </BrutalButton>
          </div>
        </div>
      </m.div>
    </div>
  )
}

// ── Page Card ───────────────────────────────────────────

function PageCard({
  doc,
  onClick,
  onArchive,
  index,
}: {
  doc: any
  onClick: () => void
  onArchive: () => void
  index: number
}) {
  const age = Date.now() - doc.updatedAt
  const isRecent = age < 86400000 // 24h

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      className="bg-[#111111] border-2 border-[#2E2E35] p-4 cursor-pointer hover:border-[var(--theme-info)] hover:shadow-[4px_4px_0px_rgba(99,102,241,0.15)] transition-all group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl group-hover:scale-110 transition-transform">{doc.icon || "📄"}</span>
        <div className="flex items-center gap-1">
          {isRecent && (
            <span className="text-[9px] font-mono text-[#22C55E] tracking-wider">RECENT</span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onArchive()
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--theme-foreground)]/30 hover:text-[var(--theme-error)] p-0.5"
            title="Archive"
          >
            <HiOutlineArchive className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <h3 className="text-[14px] font-medium text-[var(--theme-foreground)] truncate mb-1 group-hover:text-[var(--theme-info)] transition-colors">
        {doc.name}
      </h3>
      <div className="flex items-center gap-2">
        <HiOutlineClock className="w-3 h-3 text-[var(--theme-foreground)]/20" />
        <p className="text-[11px] font-mono text-[var(--theme-foreground)]/30">
          {formatRelativeTime(doc.updatedAt)}
        </p>
      </div>
    </m.div>
  )
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}

// ── Listing View ────────────────────────────────────────

function PageListView({
  workspaceId,
  projectId,
  onSelectDocument,
}: {
  workspaceId: Id<"workspaces">
  projectId?: Id<"projects">
  onSelectDocument: (id: Id<"whiteboards">) => void
}) {
  const [search, setSearch] = useState("")
  const [showTrash, setShowTrash] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)

  const documents = useQuery(api.documents.getDocuments, { workspaceId, projectId })
  const hasWelcome = useQuery(api.documents.hasWelcomePage, { workspaceId, projectId })
  const archivedDocs = useQuery(
    api.documents.getArchivedDocuments,
    showTrash ? { workspaceId } : "skip"
  )
  const createDocument = useMutation(api.documents.createDocument)
  const createFromTemplate = useMutation(api.documents.createDocumentFromTemplate)
  const archiveDocument = useMutation(api.documents.archiveDocument)
  const restoreDocument = useMutation(api.documents.restoreDocument)
  const deleteDocumentPermanent = useMutation(api.documents.deleteDocumentPermanent)

  // Auto-create welcome page + tutorial on first visit
  const welcomeCreatedRef = useRef(false)
  useEffect(() => {
    if (hasWelcome === false && !welcomeCreatedRef.current) {
      welcomeCreatedRef.current = true
      // Create welcome page
      createFromTemplate({
        workspaceId,
        name: "Welcome to Pages",
        icon: "👋",
        content: WELCOME_PAGE_CONTENT,
      }).then((welcomeId) => {
        // Create tutorial as a sub-page
        createFromTemplate({
          workspaceId,
          name: "LTF1 — Getting Started",
          icon: "🚀",
          content: LTF1_TUTORIAL_CONTENT,
          parentId: welcomeId,
        })
      })
    }
  }, [hasWelcome, workspaceId, createFromTemplate])

  const handleCreate = async () => {
    const id = await createDocument({ workspaceId, name: "Untitled", projectId })
    onSelectDocument(id)
  }

  const handleTemplateSelect = async (template: PageTemplate) => {
    setShowTemplates(false)
    const id = await createFromTemplate({
      workspaceId,
      name: template.name,
      icon: template.icon,
      content: template.content,
      projectId,
    })
    onSelectDocument(id)
    toast.success(`Created from "${template.name}" template`)
  }

  const handleAIGenerated = async (name: string, icon: string, content: any[]) => {
    const id = await createFromTemplate({
      workspaceId,
      name,
      icon,
      content,
      projectId,
    })
    onSelectDocument(id)
  }

  const handleArchive = async (docId: Id<"whiteboards">) => {
    await archiveDocument({ documentId: docId })
    toast.success("Page archived")
  }

  const handleRestore = async (docId: Id<"whiteboards">) => {
    await restoreDocument({ documentId: docId })
    toast.success("Page restored")
  }

  const handleDeletePermanent = async (docId: Id<"whiteboards">) => {
    await deleteDocumentPermanent({ documentId: docId })
    toast.success("Page permanently deleted")
  }

  const filteredDocs = documents?.filter((d: any) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  )

  // Sort: recently updated first
  const sortedDocs = filteredDocs?.sort((a: any, b: any) => b.updatedAt - a.updatedAt)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <m.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-xl font-bold text-[var(--theme-foreground)] tracking-tight flex items-center gap-2">
            <HiOutlineDocumentText className="w-5 h-5 text-[var(--theme-info)]" />
            PAGES
          </h1>
          <p className="text-[11px] font-mono text-[var(--theme-foreground)]/30 mt-1">
            {documents?.length ?? 0} page{(documents?.length ?? 0) !== 1 ? "s" : ""} in workspace
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BrutalButton
            variant="ghost"
            size="sm"
            onClick={() => setShowTrash(!showTrash)}
            className={clsx(showTrash && "text-[var(--theme-error)]")}
          >
            <HiOutlineTrash className="w-3.5 h-3.5 mr-1" />
            TRASH
          </BrutalButton>
          <BrutalButton
            variant="secondary"
            size="sm"
            onClick={() => setShowTemplates(true)}
          >
            <HiOutlineTemplate className="w-3.5 h-3.5 mr-1" />
            FROM TEMPLATE
          </BrutalButton>
          <BrutalButton variant="primary" size="sm" onClick={handleCreate}>
            <HiOutlinePlus className="w-3.5 h-3.5 mr-1" />
            NEW PAGE
          </BrutalButton>
        </div>
      </m.div>

      {/* Search */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6 relative"
      >
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--theme-foreground)]/20" />
        <BrutalInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search pages..."
          className="pl-9"
        />
      </m.div>

      {/* Trash view */}
      <AnimatePresence>
        {showTrash && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mb-8"
          >
            <h2 className="text-[11px] font-mono text-[var(--theme-foreground)]/30 tracking-wider mb-3 flex items-center gap-2">
              <HiOutlineTrash className="w-3 h-3" />
              ARCHIVED PAGES
            </h2>
            {(!archivedDocs || archivedDocs.length === 0) ? (
              <p className="text-[11px] font-mono text-[var(--theme-foreground)]/15 py-6 text-center border border-dashed border-[#2E2E35]">
                Trash is empty
              </p>
            ) : (
              <div className="space-y-1">
                {archivedDocs.map((doc: any) => (
                  <div
                    key={doc._id}
                    className="flex items-center justify-between bg-[#0A0A0A] border border-[#1F1F23] px-4 py-2.5 hover:border-[#2E2E35] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{doc.icon || "📄"}</span>
                      <span className="text-[12px] text-[var(--theme-foreground)]/50">
                        {doc.name}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--theme-foreground)]/20">
                        {formatRelativeTime(doc.updatedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BrutalButton variant="ghost" size="sm" onClick={() => handleRestore(doc._id)}>
                        RESTORE
                      </BrutalButton>
                      <BrutalButton variant="danger" size="sm" onClick={() => handleDeletePermanent(doc._id)}>
                        DELETE
                      </BrutalButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="h-px bg-gradient-to-r from-[#2E2E35] via-[#2E2E35]/50 to-transparent my-6" />
          </m.div>
        )}
      </AnimatePresence>

      {/* Document grid */}
      {!sortedDocs || sortedDocs.length === 0 ? (
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-center py-20 border-2 border-dashed border-[#2E2E35]"
        >
          <div className="w-16 h-16 mx-auto mb-5 bg-[#111111] border-2 border-[#2E2E35] flex items-center justify-center">
            <HiOutlineDocumentDuplicate className="w-8 h-8 text-[var(--theme-foreground)]/10" />
          </div>
          <p className="text-[14px] text-[var(--theme-foreground)]/40 mb-1">
            {search ? "No pages match your search" : "No pages yet"}
          </p>
          <p className="text-[11px] font-mono text-[var(--theme-foreground)]/20 mb-6">
            {search ? "Try a different search term" : "Create a blank page or start from a template"}
          </p>
          {!search && (
            <div className="flex items-center justify-center gap-3">
              <BrutalButton variant="secondary" size="sm" onClick={() => setShowTemplates(true)}>
                <HiOutlineTemplate className="w-3.5 h-3.5 mr-1" />
                BROWSE TEMPLATES
              </BrutalButton>
              <BrutalButton variant="primary" size="sm" onClick={handleCreate}>
                <HiOutlinePlus className="w-3.5 h-3.5 mr-1" />
                BLANK PAGE
              </BrutalButton>
            </div>
          )}
        </m.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedDocs.map((doc: any, i: number) => (
            <PageCard
              key={doc._id}
              doc={doc}
              onClick={() => onSelectDocument(doc._id)}
              onArchive={() => handleArchive(doc._id)}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showTemplates && (
          <TemplateGallery
            isOpen={showTemplates}
            onClose={() => setShowTemplates(false)}
            onSelectTemplate={handleTemplateSelect}
            onAIGenerate={() => { setShowTemplates(false); setShowAIModal(true) }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAIModal && (
          <AITemplateModal
            isOpen={showAIModal}
            onClose={() => setShowAIModal(false)}
            onGenerated={handleAIGenerated}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Editor View ────────────────────────────────────────

function PageEditorView({
  documentId,
  workspaceId,
  onBack,
  onNavigate,
}: {
  documentId: Id<"whiteboards">
  workspaceId: Id<"workspaces">
  onBack: () => void
  onNavigate: (id: Id<"whiteboards"> | null) => void
}) {
  const doc = useQuery(api.documents.getDocument, { documentId })
  const updateMeta = useMutation(api.documents.updateDocumentMeta)
  const { saveStatus, debouncedSave } = useDocumentAutoSave(documentId)
  const { collaborators } = useDocumentPresence(documentId)

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState("")

  const handleTitleClick = () => {
    if (doc) {
      setTitleValue(doc.name)
      setIsEditingTitle(true)
    }
  }

  const handleTitleBlur = () => {
    setIsEditingTitle(false)
    if (doc && titleValue.trim() && titleValue !== doc.name) {
      updateMeta({ documentId, name: titleValue.trim() })
    }
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      ;(e.target as HTMLInputElement).blur()
    }
  }

  const handleIconSelect = (emoji: string) => {
    updateMeta({ documentId, icon: emoji })
  }

  const handleIconRemove = () => {
    updateMeta({ documentId, icon: "" })
  }

  const handleContentChange = useCallback(
    (content: any) => {
      debouncedSave(content)
    },
    [debouncedSave]
  )

  // Keyboard shortcut: Escape to go back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.target) onBack()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onBack])

  if (!doc) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-6 h-6 border-2 border-[var(--theme-info)] border-t-transparent rounded-full" />
          <span className="text-[11px] font-mono text-[var(--theme-foreground)]/30">LOADING PAGE...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="h-[44px] border-b border-[var(--theme-border)] flex items-center px-4 gap-3 shrink-0 bg-[var(--theme-background-secondary)]">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[11px] font-mono text-[var(--theme-foreground)]/40 hover:text-[var(--theme-foreground)] transition-colors"
        >
          <HiOutlineArrowLeft className="w-3.5 h-3.5" />
          BACK
        </button>

        <div className="h-3.5 w-px bg-[var(--theme-border)]" />

        <PageBreadcrumbs documentId={documentId} onNavigate={onNavigate} />

        <div className="flex-1" />

        <SaveStatusIndicator status={saveStatus} />

        {/* Collaborator avatars */}
        {collaborators.length > 1 && (
          <div className="flex items-center -space-x-1.5 ml-2">
            {collaborators.slice(0, 4).map((c: any) => (
              <div
                key={c.userId}
                className="w-5 h-5 rounded-full border-2 border-[var(--theme-background-secondary)] text-[7px] flex items-center justify-center font-mono font-bold"
                style={{ backgroundColor: c.color }}
                title={c.user?.name}
              >
                {c.user?.name?.[0]?.toUpperCase() || "?"}
              </div>
            ))}
            {collaborators.length > 4 && (
              <span className="text-[10px] font-mono text-[var(--theme-foreground)]/30 ml-2">
                +{collaborators.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto">
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="max-w-3xl mx-auto px-6 py-8"
        >
          {/* Icon + Title */}
          <div className="mb-6">
            <PageIconPicker
              currentIcon={doc.icon}
              onSelect={handleIconSelect}
              onRemove={handleIconRemove}
            />

            {isEditingTitle ? (
              <input
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                autoFocus
                className="w-full bg-transparent text-[32px] font-bold text-[var(--theme-foreground)] border-none outline-none tracking-tight mt-2"
                placeholder="Untitled"
              />
            ) : (
              <h1
                onClick={handleTitleClick}
                className="text-[32px] font-bold text-[var(--theme-foreground)] tracking-tight cursor-text hover:bg-[var(--theme-hover)] transition-colors mt-2 px-1 -mx-1"
              >
                {doc.name || "Untitled"}
              </h1>
            )}

            {/* Meta info */}
            <p className="text-[11px] font-mono text-[var(--theme-foreground)]/20 mt-2">
              Last edited {formatRelativeTime(doc.updatedAt)}
              {doc.creator?.name && ` by ${doc.creator.name}`}
            </p>
          </div>

          {/* Block Editor */}
          <BlockNoteEditor
            initialContent={doc.content}
            onContentChange={handleContentChange}
          />
        </m.div>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────

interface PagesPageProps {
  projectId?: Id<"projects">
}

export default function PagesPage({ projectId }: PagesPageProps = {}) {
  usePageTitle("Pages — LTF1")
  const { currentWorkspaceId } = useCurrentWorkspace()
  const [activeDocumentId, setActiveDocumentId] = useState<Id<"whiteboards"> | null>(null)

  const handleNavigate = (id: Id<"whiteboards"> | null) => {
    setActiveDocumentId(id)
  }

  if (!currentWorkspaceId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <HiOutlineDocumentText className="w-10 h-10 mx-auto text-[var(--theme-foreground)]/10 mb-3" />
          <p className="text-[13px] text-[var(--theme-foreground)]/40 mb-1">
            Select a workspace to view pages
          </p>
          <p className="text-[11px] font-mono text-[var(--theme-foreground)]/20">
            Go to WORKSPACES in the sidebar
          </p>
        </div>
      </div>
    )
  }

  if (activeDocumentId) {
    return (
      <div className="flex h-full">
        <PageSidebar
          workspaceId={currentWorkspaceId}
          activeDocumentId={activeDocumentId}
          onSelectDocument={setActiveDocumentId}
        />
        <PageEditorView
          documentId={activeDocumentId}
          workspaceId={currentWorkspaceId}
          onBack={() => setActiveDocumentId(null)}
          onNavigate={handleNavigate}
        />
      </div>
    )
  }

  return (
    <PageListView
      workspaceId={currentWorkspaceId}
      projectId={projectId}
      onSelectDocument={setActiveDocumentId}
    />
  )
}
