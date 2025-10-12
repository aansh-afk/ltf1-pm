# Text System Integration Guide for WhiteboardCanvas.tsx

This guide provides step-by-step instructions to integrate inline text editing with formatting controls into the whiteboard.

## Files Created

1. `TextEditor.tsx` - Inline editing overlay component
2. `TextFormattingControls.tsx` - Formatting toolbar component
3. This integration guide

## Integration Steps

### Step 1: Add Imports (Line ~23)

Add these imports after the existing react-icons imports:

```typescript
import { TextEditor } from './TextEditor'
import { TextFormattingControls } from './TextFormattingControls'
```

### Step 2: Add State Variables (Line ~180, after `setIsExporting`)

```typescript
const [editingTextId, setEditingTextId] = useState<string | null>(null)
const [showPropertiesPanel, setShowPropertiesPanel] = useState(false)
```

### Step 3: Add Helper Function (After `calculateContentBounds`, Line ~153)

```typescript
// Helper function to wrap text into lines
const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  // Approximate character width (this is a rough estimate)
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
```

### Step 4: Add Text Editing Handlers (After `handleRestoreSnapshot`, Line ~557)

```typescript
// Text editing handlers
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
```

### Step 5: Replace TEXT Case in renderElement (Line ~704-715)

Replace the existing TEXT case with this enhanced version:

```typescript
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
```

### Step 6: Add TextEditor Overlay (After `</svg>` tag, Line ~873, before Snapshots Panel)

```typescript
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
```

### Step 7: Add Properties Panel (After Snapshots Panel, Line ~910)

```typescript
{/* Text Properties Panel */}
{showPropertiesPanel && selectedTextElement && (
  <div className="absolute left-20 top-20 w-80 bg-black border-2 border-white p-4 z-20">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-white font-bold uppercase">Properties</h3>
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
```

### Step 8: Update Text Element Creation (Line ~274, in `handleCanvasMouseDown`)

Update the TEXT case to include default formatting:

```typescript
activeTool === 'TEXT' ? {
  text: 'Double-click to edit',
  fontSize: 16,
  fontFamily: 'IBM Plex Mono, monospace',
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',
  textAlign: 'left',
  color: '#000000'
} :
```

## Features Implemented

1. **Inline Editing**:
   - Double-click text element to enter edit mode
   - Contenteditable div overlay with proper coordinate transformation
   - Auto-focus and text selection on edit
   - Save on blur/click outside, cancel on Escape

2. **Text Formatting Controls**:
   - Font size: 12-48px
   - Font family: IBM Plex Mono, Arial, Times New Roman, Courier
   - Bold, Italic, Underline toggles
   - Text alignment: Left, Center, Right

3. **Text Rendering**:
   - Multi-line text with automatic wrapping
   - SVG <tspan> elements for proper line rendering
   - Formatting applied via SVG attributes
   - Selection indicator with dashed cyan rectangle

4. **Properties Panel**:
   - Shows when text element is selected
   - Real-time formatting updates
   - Brutalist design matching whiteboard aesthetic

## Testing

1. Create a text element by selecting the Text tool and dragging
2. Double-click the text to enter edit mode
3. Type new text and click outside to save
4. Click the text once to select it and open the properties panel
5. Try different font sizes, families, and styles
6. Test text alignment options
7. Verify text wrapping works for long text

## Notes

- Text elements have a minimum width of 100px
- Text automatically wraps based on element width
- Container height auto-grows to fit content
- All formatting is saved to the element's style object
- Zoom and pan are properly accounted for in the editor overlay
