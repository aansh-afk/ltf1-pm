import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../../../convex/_generated/api"
import type { Id } from "../../../../../../convex/_generated/dataModel"
import { HiOutlineChevronRight, HiOutlineChevronDown, HiOutlinePlus, HiOutlineDocumentText } from "react-icons/hi"
import { useState } from "react"
import clsx from "clsx"

interface PageSidebarProps {
  workspaceId: Id<"workspaces">
  activeDocumentId?: Id<"whiteboards"> | null
  onSelectDocument: (id: Id<"whiteboards">) => void
}

function PageTreeItem({
  doc,
  activeDocumentId,
  onSelectDocument,
  workspaceId,
  depth = 0,
}: {
  doc: any
  activeDocumentId?: Id<"whiteboards"> | null
  onSelectDocument: (id: Id<"whiteboards">) => void
  workspaceId: Id<"workspaces">
  depth?: number
}) {
  const [expanded, setExpanded] = useState(false)
  const children = useQuery(
    api.documents.getChildDocuments,
    expanded ? { parentId: doc._id } : "skip"
  )
  const createDocument = useMutation(api.documents.createDocument)

  const isActive = activeDocumentId === doc._id
  const hasChildren = children && children.length > 0

  const handleCreateChild = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await createDocument({
      workspaceId,
      name: "Untitled",
      parentId: doc._id,
    })
    setExpanded(true)
  }

  return (
    <div>
      <button
        onClick={() => onSelectDocument(doc._id)}
        className={clsx(
          "w-full flex items-center gap-1 px-2 py-1.5 text-[12px] font-mono group transition-colors",
          isActive
            ? "bg-[var(--theme-background)] text-[var(--theme-info)] border-l-2 border-[var(--theme-info)]"
            : "text-[var(--theme-foreground)]/70 hover:bg-[var(--theme-hover)] hover:text-[var(--theme-foreground)]"
        )}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(!expanded)
          }}
          className="w-4 h-4 flex items-center justify-center shrink-0"
        >
          {expanded ? (
            <HiOutlineChevronDown className="w-3 h-3" />
          ) : (
            <HiOutlineChevronRight className="w-3 h-3" />
          )}
        </button>

        {doc.icon ? (
          <span className="text-sm shrink-0">{doc.icon}</span>
        ) : (
          <HiOutlineDocumentText className="w-3.5 h-3.5 shrink-0" />
        )}

        <span className="truncate flex-1 text-left">{doc.name}</span>

        <button
          onClick={handleCreateChild}
          className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:text-[var(--theme-info)]"
          title="Add sub-page"
        >
          <HiOutlinePlus className="w-3 h-3" />
        </button>
      </button>

      {expanded && children && children.map((child: any) => (
        <PageTreeItem
          key={child._id}
          doc={child}
          activeDocumentId={activeDocumentId}
          onSelectDocument={onSelectDocument}
          workspaceId={workspaceId}
          depth={depth + 1}
        />
      ))}
    </div>
  )
}

export default function PageSidebar({
  workspaceId,
  activeDocumentId,
  onSelectDocument,
}: PageSidebarProps) {
  const documents = useQuery(api.documents.getDocuments, { workspaceId })

  if (!documents) return null

  return (
    <div className="w-[220px] border-r border-[var(--theme-border)] bg-[var(--theme-background-secondary)] flex flex-col shrink-0 overflow-y-auto">
      <div className="px-3 py-2 border-b border-[var(--theme-border)]">
        <span className="text-[10px] font-mono text-[var(--theme-foreground)]/40 tracking-wider">
          ALL PAGES
        </span>
      </div>

      <div className="flex-1 py-1">
        {documents.length === 0 ? (
          <p className="px-3 py-4 text-[11px] font-mono text-[var(--theme-foreground)]/30 text-center">
            No pages yet
          </p>
        ) : (
          documents.map((doc: any) => (
            <PageTreeItem
              key={doc._id}
              doc={doc}
              activeDocumentId={activeDocumentId}
              onSelectDocument={onSelectDocument}
              workspaceId={workspaceId}
            />
          ))
        )}
      </div>
    </div>
  )
}
