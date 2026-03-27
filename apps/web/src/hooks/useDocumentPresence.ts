import { useEffect } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"

export function useDocumentPresence(documentId: Id<"whiteboards"> | null) {
  const doc = useQuery(
    api.documents.getDocument,
    documentId ? { documentId } : "skip"
  )

  const updateCursor = useMutation(api.whiteboard.updateCursor)

  // Heartbeat: update presence every 30s
  useEffect(() => {
    if (!documentId) return

    const interval = setInterval(() => {
      updateCursor({ whiteboardId: documentId }).catch(() => {})
    }, 30000)

    // Initial presence
    updateCursor({ whiteboardId: documentId }).catch(() => {})

    return () => clearInterval(interval)
  }, [documentId, updateCursor])

  const collaborators = doc?.collaborators ?? []

  return { collaborators }
}
