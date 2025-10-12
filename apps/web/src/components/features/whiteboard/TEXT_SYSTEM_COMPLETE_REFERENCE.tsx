/**
 * COMPLETE TEXT SYSTEM REFERENCE
 *
 * This file contains all the code additions needed for inline text editing.
 * Use this as a reference when integrating into WhiteboardCanvas.tsx
 */

// ============================================================================
// IMPORTS TO ADD (after react-icons imports)
// ============================================================================

import { TextEditor } from './TextEditor'
import { TextFormattingControls } from './TextFormattingControls'

// ============================================================================
// HELPER FUNCTION (add after calculateContentBounds)
// ============================================================================

const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  const charWidth = fontSize * 0.6
  const maxChars = Math.floor(maxWidth / charWidth)

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    if (testLine.length <= maxChars) {
      currentLine = testLine
    } else {
      if (currentLine) lines.push(currentLine)
      currentLine = word
    }
  }

  if (currentLine) lines.push(currentLine)
  return lines.length > 0 ? lines : ['']
}

// ============================================================================
// STATE VARIABLES (add to state section)
// ============================================================================

const [editingTextId, setEditingTextId] = useState<string | null>(null)
// Note: showPropertiesPanel already exists based on the file changes

// ============================================================================
// TEXT EDITING HANDLERS (add after handleRestoreSnapshot)
// ============================================================================

const handleTextDoubleClick = useCallback((elementId: string, e: React.MouseEvent) => {
  e.stopPropagation()
  setEditingTextId(elementId)
  setSelectedElements([elementId])
  setShowPropertiesPanel(true)
}, [])

const handleTextSave = useCallback(async (text: string) => {
  if (!whiteboardId || !editingTextId) return

  const element = whiteboard?.elements.find(el => el.id === editingTextId)
  if (!element) return

  await updateElement({
    whiteboardId,
    elementId: editingTextId,
    updates: {
      data: { ...element.data, text },
    }
  })
  setEditingTextId(null)
}, [whiteboardId, editingTextId, whiteboard, updateElement])

const handleTextCancel = useCallback(() => {
  setEditingTextId(null)
}, [])

const handleTextFormatting = useCallback(async (updates: Partial<any>) => {
  if (!whiteboardId || selectedElements.length === 0) return

  const elementId = selectedElements[0]
  const element = whiteboard?.elements.find(el => el.id === elementId)
  if (!element || element.type !== ELEMENT_TYPES.TEXT) return

  await updateElement({
    whiteboardId,
    elementId,
    updates: {
      style: { ...element.style, ...updates }
    }
  })
}, [whiteboardId, selectedElements, whiteboard, updateElement])

const selectedTextElement = useMemo(() => {
  if (selectedElements.length !== 1) return null
  const element = whiteboard?.elements.find(el => el.id === selectedElements[0])
  return element?.type === ELEMENT_TYPES.TEXT ? element : null
}, [selectedElements, whiteboard])

// ============================================================================
// ENHANCED TEXT RENDERING (replace TEXT case in renderElement)
// ============================================================================

case ELEMENT_TYPES.TEXT: {
  const fontSize = style.fontSize || 16
  const fontFamily = style.fontFamily || 'IBM Plex Mono, monospace'
  const fontWeight = style.fontWeight || 'normal'
  const fontStyle = style.fontStyle || 'normal'
  const textDecoration = style.textDecoration || 'none'
  const textAlign = style.textAlign || 'left'
  const color = style.color || '#000000'

  // Wrap text for multi-line support
  const lines = wrapText(data.text, size.width || 200, fontSize)
  const lineHeight = fontSize * 1.4

  // Calculate text anchor based on alignment
  let textAnchor: 'start' | 'middle' | 'end' = 'start'
  let xOffset = 0
  if (textAlign === 'center') {
    textAnchor = 'middle'
    xOffset = (size.width || 200) / 2
  } else if (textAlign === 'right') {
    textAnchor = 'end'
    xOffset = size.width || 200
  }

  return (
    <g
      key={id}
      onDoubleClick={(e) => handleTextDoubleClick(id, e)}
      className={`cursor-pointer ${locked ? 'pointer-events-none' : ''}`}
      onClick={(e) => {
        e.stopPropagation()
        setSelectedElements([id])
        setShowPropertiesPanel(true)
      }}
    >
      {/* Selection rectangle */}
      {isSelected && (
        <rect
          x={position.x - 2}
          y={position.y - fontSize}
          width={(size.width || 200) + 4}
          height={lines.length * lineHeight + 4}
          fill="none"
          stroke="#00FFFF"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
      )}

      {/* Multi-line text with formatting */}
      <text
        x={position.x + xOffset}
        y={position.y}
        fontSize={fontSize}
        fontFamily={fontFamily}
        fontWeight={fontWeight}
        fontStyle={fontStyle}
        textDecoration={textDecoration}
        textAnchor={textAnchor}
        fill={isSelected ? '#00FFFF' : color}
      >
        {lines.map((line, i) => (
          <tspan
            key={i}
            x={position.x + xOffset}
            dy={i === 0 ? 0 : lineHeight}
          >
            {line}
          </tspan>
        ))}
      </text>
    </g>
  )
}

// ============================================================================
// TEXT EDITOR OVERLAY (add after </svg> closing tag, before Snapshots Panel)
// ============================================================================

{/* Text Editor Overlay */}
{editingTextId && (() => {
  const element = whiteboard?.elements.find(el => el.id === editingTextId)
  if (!element || element.type !== ELEMENT_TYPES.TEXT) return null

  return (
    <TextEditor
      initialText={element.data.text}
      position={element.position}
      size={element.size}
      style={{
        fontSize: element.style.fontSize || 16,
        fontFamily: element.style.fontFamily || 'IBM Plex Mono, monospace',
        fontWeight: element.style.fontWeight || 'normal',
        fontStyle: element.style.fontStyle || 'normal',
        textDecoration: element.style.textDecoration || 'none',
        color: element.style.color || '#000000',
      }}
      zoom={zoom}
      pan={pan}
      onSave={handleTextSave}
      onCancel={handleTextCancel}
    />
  )
})()}

// ============================================================================
// TEXT FORMATTING PANEL (integrate into existing PropertiesPanel)
// ============================================================================

// If using the existing PropertiesPanel component, add this section:
{selectedTextElement && (
  <TextFormattingControls
    fontSize={selectedTextElement.style.fontSize || 16}
    fontFamily={selectedTextElement.style.fontFamily || 'IBM Plex Mono, monospace'}
    fontWeight={selectedTextElement.style.fontWeight || 'normal'}
    fontStyle={selectedTextElement.style.fontStyle || 'normal'}
    textDecoration={selectedTextElement.style.textDecoration || 'none'}
    textAlign={selectedTextElement.style.textAlign || 'left'}
    onFontSizeChange={(size) => handleTextFormatting({ fontSize: size })}
    onFontFamilyChange={(family) => handleTextFormatting({ fontFamily: family })}
    onToggleBold={() => {
      const current = selectedTextElement.style.fontWeight || 'normal'
      handleTextFormatting({ fontWeight: current === 'bold' ? 'normal' : 'bold' })
    }}
    onToggleItalic={() => {
      const current = selectedTextElement.style.fontStyle || 'normal'
      handleTextFormatting({ fontStyle: current === 'italic' ? 'normal' : 'italic' })
    }}
    onToggleUnderline={() => {
      const current = selectedTextElement.style.textDecoration || 'none'
      handleTextFormatting({ textDecoration: current === 'underline' ? 'none' : 'underline' })
    }}
    onTextAlignChange={(align) => handleTextFormatting({ textAlign: align })}
  />
)}

// ============================================================================
// ALTERNATIVE: STANDALONE TEXT PROPERTIES PANEL
// ============================================================================

// If NOT using PropertiesPanel component, add this after Snapshots Panel:
{showPropertiesPanel && selectedTextElement && (
  <div className="absolute left-20 top-20 w-80 bg-black border-2 border-white p-4 z-20">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-white font-bold uppercase">Text Properties</h3>
      <button
        onClick={() => setShowPropertiesPanel(false)}
        className="text-white hover:text-cyan-400"
      >
        <HiOutlineX className="w-5 h-5" />
      </button>
    </div>

    <TextFormattingControls
      fontSize={selectedTextElement.style.fontSize || 16}
      fontFamily={selectedTextElement.style.fontFamily || 'IBM Plex Mono, monospace'}
      fontWeight={selectedTextElement.style.fontWeight || 'normal'}
      fontStyle={selectedTextElement.style.fontStyle || 'normal'}
      textDecoration={selectedTextElement.style.textDecoration || 'none'}
      textAlign={selectedTextElement.style.textAlign || 'left'}
      onFontSizeChange={(size) => handleTextFormatting({ fontSize: size })}
      onFontFamilyChange={(family) => handleTextFormatting({ fontFamily: family })}
      onToggleBold={() => {
        const current = selectedTextElement.style.fontWeight || 'normal'
        handleTextFormatting({ fontWeight: current === 'bold' ? 'normal' : 'bold' })
      }}
      onToggleItalic={() => {
        const current = selectedTextElement.style.fontStyle || 'normal'
        handleTextFormatting({ fontStyle: current === 'italic' ? 'normal' : 'italic' })
      }}
      onToggleUnderline={() => {
        const current = selectedTextElement.style.textDecoration || 'none'
        handleTextFormatting({ textDecoration: current === 'underline' ? 'none' : 'underline' })
      }}
      onTextAlignChange={(align) => handleTextFormatting({ textAlign: align })}
    />
  </div>
)}

// ============================================================================
// USAGE INSTRUCTIONS
// ============================================================================

/**
 * INTEGRATION CHECKLIST:
 *
 * 1. ✓ TextEditor.tsx created
 * 2. ✓ TextFormattingControls.tsx created
 * 3. □ Add imports to WhiteboardCanvas.tsx
 * 4. □ Add wrapText helper function
 * 5. □ Add editingTextId state variable
 * 6. □ Add all text editing handlers
 * 7. □ Replace TEXT case in renderElement
 * 8. □ Add TextEditor overlay after </svg>
 * 9. □ Add TextFormattingControls to PropertiesPanel OR create standalone panel
 *
 * TESTING:
 * - Create text element (drag with text tool)
 * - Double-click to edit
 * - Single-click to select and show properties
 * - Test all formatting options
 * - Verify multi-line wrapping works
 * - Test with zoom and pan
 */

export {}
