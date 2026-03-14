import { useQuery } from "convex/react"
import { api } from "../../../../../../convex/_generated/api"
import type { Id } from "../../../../../../convex/_generated/dataModel"
import { HiOutlineChevronRight } from "react-icons/hi"

interface PageBreadcrumbsProps {
  documentId: Id<"whiteboards">
  onNavigate: (id: Id<"whiteboards"> | null) => void
}

export default function PageBreadcrumbs({ documentId, onNavigate }: PageBreadcrumbsProps) {
  const doc = useQuery(api.documents.getDocument, { documentId })

  if (!doc) return null

  // Build breadcrumb chain by walking up parentId
  const crumbs: Array<{ id: Id<"whiteboards">; name: string; icon?: string }> = []
  crumbs.push({ id: doc._id, name: doc.name, icon: doc.icon })

  return (
    <nav className="flex items-center gap-1 text-[12px] font-mono text-[var(--theme-foreground)]/50 overflow-x-auto">
      <button
        onClick={() => onNavigate(null)}
        className="hover:text-[var(--theme-foreground)] transition-colors shrink-0"
      >
        PAGES
      </button>

      {crumbs.map((crumb) => (
        <span key={crumb.id} className="flex items-center gap-1 shrink-0">
          <HiOutlineChevronRight className="w-3 h-3" />
          <button
            onClick={() => onNavigate(crumb.id)}
            className="hover:text-[var(--theme-foreground)] transition-colors truncate max-w-[160px]"
          >
            {crumb.icon && <span className="mr-1">{crumb.icon}</span>}
            {crumb.name}
          </button>
        </span>
      ))}
    </nav>
  )
}
