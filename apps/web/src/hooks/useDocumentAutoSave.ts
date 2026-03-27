import { useCallback, useRef, useState, useEffect } from "react"
import { useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"

type SaveStatus = "saved" | "saving" | "unsaved" | "error"

export function useDocumentAutoSave(documentId: Id<"whiteboards"> | null) {
  const updateContent = useMutation(api.documents.updateDocumentContent)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved")
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingContentRef = useRef<any[] | null>(null)

  const save = useCallback(
    async (content: any[]) => {
      if (!documentId) return

      setSaveStatus("saving")
      try {
        await updateContent({ documentId, content })
        setSaveStatus("saved")
        pendingContentRef.current = null
      } catch {
        setSaveStatus("error")
      }
    },
    [documentId, updateContent]
  )

  const debouncedSave = useCallback(
    (content: any[]) => {
      pendingContentRef.current = content
      setSaveStatus("unsaved")

      if (timeoutRef.current) clearTimeout(timeoutRef.current)

      timeoutRef.current = setTimeout(() => {
        save(content)
      }, 1500)
    },
    [save]
  )

  // Flush pending save on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (pendingContentRef.current && documentId) {
        // Fire-and-forget final save
        updateContent({ documentId, content: pendingContentRef.current }).catch(() => {})
      }
    }
  }, [documentId, updateContent])

  return { saveStatus, debouncedSave }
}
