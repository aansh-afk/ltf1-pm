import React, { useEffect, useRef, useState } from 'react'

interface TextEditorProps {
  initialText: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  style: {
    fontSize?: number
    fontFamily?: string
    fontWeight?: string
    fontStyle?: string
    textDecoration?: string
    color?: string
  }
  zoom: number
  pan: { x: number; y: number }
  onSave: (text: string) => void
  onCancel: () => void
}

export function TextEditor({
  initialText,
  position,
  size,
  style,
  zoom,
  pan,
  onSave,
  onCancel,
}: TextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [text, setText] = useState(initialText)

  // Calculate screen position from SVG coordinates
  const screenX = position.x * (zoom / 100) + pan.x
  const screenY = position.y * (zoom / 100) + pan.y
  const screenWidth = Math.max(size.width * (zoom / 100), 100)
  const screenHeight = size.height * (zoom / 100)

  useEffect(() => {
    // Auto-focus on mount
    if (editorRef.current) {
      editorRef.current.focus()
      // Select all text for easy replacement
      const selection = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(editorRef.current)
      selection?.removeAllRanges()
      selection?.addRange(range)
    }
  }, [])

  useEffect(() => {
    // Handle click outside to save
    const handleClickOutside = (e: MouseEvent) => {
      if (editorRef.current && !editorRef.current.contains(e.target as Node)) {
        handleSave()
      }
    }

    // Handle escape key to cancel
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [text])

  const handleSave = () => {
    const finalText = editorRef.current?.innerText || text
    if (finalText.trim()) {
      onSave(finalText)
    } else {
      onCancel()
    }
  }

  const handleBlur = () => {
    handleSave()
  }

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      className="absolute bg-white border-2 border-black outline-none overflow-auto resize-none"
      style={{
        left: `${screenX}px`,
        top: `${screenY}px`,
        minWidth: `${screenWidth}px`,
        minHeight: `${screenHeight || 30}px`,
        maxWidth: '500px',
        fontSize: `${(style.fontSize || 16) * (zoom / 100)}px`,
        fontFamily: style.fontFamily || 'IBM Plex Mono, monospace',
        fontWeight: style.fontWeight || 'normal',
        fontStyle: style.fontStyle || 'normal',
        textDecoration: style.textDecoration || 'none',
        color: style.color || '#000000',
        padding: '4px 8px',
        lineHeight: '1.4',
        wordWrap: 'break-word',
        whiteSpace: 'pre-wrap',
        zIndex: 1000,
      }}
    >
      {initialText}
    </div>
  )
}
