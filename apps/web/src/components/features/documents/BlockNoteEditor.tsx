import { useCallback, useEffect, useRef, useState } from "react"
import { useCreateBlockNote } from "@blocknote/react"
import { BlockNoteView } from "@blocknote/mantine"
import "@blocknote/mantine/style.css"
import "./blockNoteStyles.css"
import { brutalDarkTheme } from "./blockNoteTheme"

const VALID_BLOCK_TYPES = new Set([
  "paragraph", "heading", "codeBlock",
  "bulletListItem", "numberedListItem", "checkListItem",
  "table", "file", "image", "video", "audio",
])

// Strip custom ids, remove invalid block types, coerce props
function sanitizeBlocks(blocks: any[]): any[] {
  if (!blocks || !Array.isArray(blocks)) return []

  const cleaned: any[] = []
  for (const block of blocks) {
    if (!block || typeof block !== "object") continue

    const type = block.type
    if (type && !VALID_BLOCK_TYPES.has(type)) continue

    const sanitized: any = {}
    if (type) sanitized.type = type

    if (block.props && typeof block.props === "object") {
      const props = { ...block.props }
      // Coerce heading level
      if (props.level !== undefined) {
        props.level = Number(props.level)
        if (isNaN(props.level) || props.level < 1 || props.level > 3) props.level = 1
      }
      // Coerce checked
      if (props.checked !== undefined) {
        props.checked = Boolean(props.checked)
      }
      if (Object.keys(props).length > 0) sanitized.props = props
    }

    if (Array.isArray(block.content)) {
      sanitized.content = block.content.filter(
        (c: any) => c && typeof c === "object" && c.type === "text" && typeof c.text === "string"
      )
    }

    if (Array.isArray(block.children) && block.children.length > 0) {
      const childrenCleaned = sanitizeBlocks(block.children)
      if (childrenCleaned.length > 0) sanitized.children = childrenCleaned
    }

    cleaned.push(sanitized)
  }
  return cleaned
}

interface BlockNoteEditorProps {
  initialContent?: any[]
  onContentChange?: (content: any[]) => void
  editable?: boolean
}

export default function BlockNoteEditor({
  initialContent,
  onContentChange,
  editable = true,
}: BlockNoteEditorProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onContentChangeRef = useRef(onContentChange)
  onContentChangeRef.current = onContentChange
  const contentLoadedRef = useRef(false)
  const [loadError, setLoadError] = useState(false)

  // Always create editor empty — load content after via replaceBlocks
  const editor = useCreateBlockNote({})

  // Load initial content safely after editor mounts
  useEffect(() => {
    if (contentLoadedRef.current) return
    if (!initialContent || !Array.isArray(initialContent) || initialContent.length === 0) return

    contentLoadedRef.current = true
    const sanitized = sanitizeBlocks(initialContent)
    if (sanitized.length === 0) return

    try {
      editor.replaceBlocks(editor.document, sanitized)
    } catch (err) {
      console.warn("BlockNote: failed to load saved content, starting blank.", err)
      setLoadError(true)
    }
  }, [editor, initialContent])

  const handleChange = useCallback(() => {
    if (!onContentChangeRef.current) return

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      const blocks = editor.document
      onContentChangeRef.current?.(blocks)
    }, 1500)
  }, [editor])

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        const blocks = editor.document
        onContentChangeRef.current?.(blocks)
      }
    }
  }, [editor])

  // Nuke Mantine's runtime-injected backgrounds after mount
  const wrapperRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const strip = () => {
      el.querySelectorAll<HTMLElement>("*").forEach((child) => {
        const bg = getComputedStyle(child).backgroundColor
        // If it's not transparent/rgba(0,0,0,0) and not a menu/toolbar, force it
        if (
          bg &&
          bg !== "transparent" &&
          bg !== "rgba(0, 0, 0, 0)" &&
          !child.closest(".bn-suggestion-menu") &&
          !child.closest(".bn-slash-menu") &&
          !child.closest(".bn-toolbar") &&
          !child.closest(".mantine-Menu-dropdown") &&
          !child.closest(".mantine-Popover-dropdown")
        ) {
          child.style.setProperty("background", "transparent", "important")
          child.style.setProperty("background-color", "transparent", "important")
        }
      })
    }
    // Run immediately + after Mantine CSS-in-JS injects
    strip()
    const timer = setTimeout(strip, 100)
    const observer = new MutationObserver(strip)
    observer.observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class"] })
    return () => { clearTimeout(timer); observer.disconnect() }
  }, [])

  return (
    <div ref={wrapperRef} className="min-h-[300px] w-full bn-transparent-wrapper">
      {loadError && (
        <div className="mb-3 px-3 py-2 bg-[var(--theme-warning)]/10 border border-[var(--theme-warning)]/30 text-[11px] font-mono text-[var(--theme-warning)]">
          Content format was outdated and could not be loaded. Starting with a blank page — your new edits will save normally.
        </div>
      )}
      <BlockNoteView
        editor={editor}
        editable={editable}
        onChange={handleChange}
        theme={brutalDarkTheme}
      />
    </div>
  )
}
