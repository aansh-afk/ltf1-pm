# Whiteboard Styling Panel Integration Guide

This document provides the complete integration instructions for adding the comprehensive styling panel to WhiteboardCanvas.tsx.

## Files Created

1. **StylePropertiesPanel.tsx** - `/home/aansh/LTF1/iceberg-L/apps/web/src/components/features/whiteboard/StylePropertiesPanel.tsx`
   - Collapsible properties panel with STROKE, FILL, BACKGROUND sections
   - Range sliders for width and opacity controls
   - Pattern selector with visual previews
   - Color pickers with hex input
   - Dropdown for stroke styles

2. **SVGPatterns.tsx** - `/home/aansh/LTF1/iceberg-L/apps/web/src/components/features/whiteboard/SVGPatterns.tsx`
   - SVG pattern definitions for fill patterns
   - Helper functions: `getFillValue()` and `getStrokeDashArray()`
   - Patterns: hachure, cross-hatch, dots, zigzag

## Integration Steps for WhiteboardCanvas.tsx

### Step 1: Add Imports (After line 23)

```typescript
import StylePropertiesPanel, { type ElementStyle } from './StylePropertiesPanel'
import SVGPatterns, { getFillValue, getStrokeDashArray } from './SVGPatterns'
```

### Step 2: Add State Variables (After line 178)

```typescript
const [strokeOpacity, setStrokeOpacity] = useState(1)
const [strokeStyle, setStrokeStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid')
const [fillOpacity, setFillOpacity] = useState(1)
const [fillPattern, setFillPattern] = useState<'none' | 'solid' | 'hachure' | 'cross-hatch' | 'dots' | 'zigzag'>('solid')
const [backgroundColor, setBackgroundColor] = useState('#FFFFFF')
const [backgroundOpacity, setBackgroundOpacity] = useState(1)
```

### Step 3: Update Style Object in handleCanvasMouseDown (Replace lines 281-285)

```typescript
style: {
  fill: fillColor,
  fillOpacity,
  fillPattern,
  stroke: strokeColor,
  strokeWidth,
  strokeOpacity,
  strokeStyle,
  backgroundColor,
  backgroundOpacity,
}
```

### Step 4: Add Style Change Handler (After handleRestoreSnapshot, before renderElement)

```typescript
// Handle style changes from properties panel
const handleStyleChange = useCallback(async (elementIds: string[], styleChanges: Partial<ElementStyle>) => {
  if (!whiteboardId || elementIds.length === 0) return

  const updates = elementIds.map(elementId => ({
    elementId,
    updates: { style: styleChanges }
  }))

  await batchUpdateElements({
    whiteboardId,
    updates
  })
}, [whiteboardId, batchUpdateElements])
```

### Step 5: Update renderElement Function - Replace Rectangle Rendering (Lines 567-581)

```typescript
if (data.shape === SHAPE_TYPES.RECTANGLE) {
  const fillValue = getFillValue(style)
  const strokeDash = getStrokeDashArray(style.strokeStyle || 'solid')

  return (
    <rect
      key={id}
      x={position.x}
      y={position.y}
      width={size.width}
      height={size.height}
      fill={fillValue}
      fillOpacity={style.fillOpacity ?? 1}
      stroke={isSelected ? '#FF00FF' : style.stroke}
      strokeOpacity={style.strokeOpacity ?? 1}
      strokeWidth={isSelected ? (style.strokeWidth || 2) + 1 : (style.strokeWidth || 2)}
      strokeDasharray={strokeDash}
      className={`cursor-pointer ${locked ? 'pointer-events-none' : ''}`}
      onClick={() => setSelectedElements([id])}
    />
  )
}
```

### Step 6: Update renderElement Function - Replace Circle Rendering (Lines 582-597)

```typescript
else if (data.shape === SHAPE_TYPES.CIRCLE) {
  const fillValue = getFillValue(style)
  const strokeDash = getStrokeDashArray(style.strokeStyle || 'solid')

  return (
    <ellipse
      key={id}
      cx={position.x + size.width / 2}
      cy={position.y + size.height / 2}
      rx={size.width / 2}
      ry={size.height / 2}
      fill={fillValue}
      fillOpacity={style.fillOpacity ?? 1}
      stroke={isSelected ? '#FF00FF' : style.stroke}
      strokeOpacity={style.strokeOpacity ?? 1}
      strokeWidth={isSelected ? (style.strokeWidth || 2) + 1 : (style.strokeWidth || 2)}
      strokeDasharray={strokeDash}
      className={`cursor-pointer ${locked ? 'pointer-events-none' : ''}`}
      onClick={() => setSelectedElements([id])}
    />
  )
}
```

### Step 7: Update Other Shapes Similarly

Apply the same pattern to Diamond, Triangle, Arrow, and Star shapes:
- Add `const fillValue = getFillValue(style)`
- Add `const strokeDash = getStrokeDashArray(style.strokeStyle || 'solid')`
- Replace `fill={style.fill}` with `fill={fillValue}` and add `fillOpacity={style.fillOpacity ?? 1}`
- Add `strokeOpacity={style.strokeOpacity ?? 1}`
- Add `strokeDasharray={strokeDash}`

### Step 8: Update Line Rendering (Lines 720-734)

```typescript
case ELEMENT_TYPES.LINE:
  const strokeDash = getStrokeDashArray(style.strokeStyle || 'solid')

  return (
    <line
      key={id}
      x1={data.points[0][0]}
      y1={data.points[0][1]}
      x2={data.points[1][0]}
      y2={data.points[1][1]}
      stroke={isSelected ? '#FF00FF' : style.stroke}
      strokeOpacity={style.strokeOpacity ?? 1}
      strokeWidth={isSelected ? (style.strokeWidth || 2) + 1 : (style.strokeWidth || 2)}
      strokeDasharray={strokeDash}
      className={`cursor-pointer ${locked ? 'pointer-events-none' : ''}`}
      onClick={() => setSelectedElements([id])}
    />
  )
```

### Step 9: Add SVG Patterns to SVG Element (Inside <svg>, before elements render - After line 994)

```typescript
<svg
  ref={svgRef}
  className="w-full h-full"
  style={{
    transform: `scale(${zoom / 100}) translate(${pan.x}px, ${pan.y}px)`,
    transformOrigin: '0 0'
  }}
>
  {/* SVG Pattern Definitions */}
  <SVGPatterns />

  {/* Render whiteboard elements */}
  {whiteboard?.elements.map(renderElement)}

  {/* Rest of SVG content... */}
```

### Step 10: Add StylePropertiesPanel Component (Before closing </div> at end, around line 1067)

```typescript
      {/* Style Properties Panel */}
      {!showSnapshots && (
        <StylePropertiesPanel
          selectedElements={selectedElements}
          elements={whiteboard?.elements || []}
          onStyleChange={handleStyleChange}
        />
      )}

      {/* Whiteboard Info */}
      <div className="absolute bottom-4 left-4 bg-black border-2 border-white p-2 z-10">
        <p className="text-white font-mono text-sm">{whiteboard?.name}</p>
        <p className="text-gray-400 font-mono text-xs">
          {whiteboard?.elements.length || 0} elements · Version {whiteboard?.version || 1}
        </p>
      </div>
    </div>
  )
}
```

## Features Implemented

### Stroke Controls
- **Stroke Width Slider**: 1-10px range with 0.5px steps
- **Stroke Style Dropdown**: Solid, Dashed, Dotted
- **Stroke Opacity Slider**: 0-100% with real-time preview
- **Stroke Color Picker**: Color picker + hex input

### Fill Controls
- **Fill Color Picker**: Color picker + hex input
- **Fill Opacity Slider**: 0-100% transparency control
- **Fill Pattern Selector**: 6 pattern options with visual previews
  - None (transparent)
  - Solid
  - Hachure (parallel lines)
  - Cross-Hatch
  - Dots
  - Zigzag

### Background Controls
- **Background Color**: Color picker for element backgrounds
- **Background Opacity**: 0-100% transparency

### Panel Features
- **Collapsible Sections**: Each section can be expanded/collapsed
- **Brutalist Design**: IBM Plex Mono font, black panels, white borders, cyan highlights
- **Multi-Element Selection**: Apply changes to all selected elements at once
- **Real-Time Updates**: Changes apply immediately using `batchUpdateElements`

## Design System Compliance

- **Typography**: IBM Plex Mono for labels, uppercase text
- **Colors**: Black background, white borders (2px), cyan-400 highlights
- **Layout**: Right-side panel, 320px width, positioned at top-20
- **Interactions**: Hover states, focus states, disabled states
- **Brutalist Styling**: Sharp corners, high contrast, no gradients

## Testing

After integration, test the following:

1. **Selection**: Select single and multiple elements
2. **Stroke**: Change width, style (solid/dashed/dotted), opacity, color
3. **Fill**: Change color, opacity, and patterns (all 6 patterns)
4. **Background**: Change background color and opacity
5. **Multi-Select**: Select multiple elements and apply bulk changes
6. **Persistence**: Verify changes persist in Convex database
7. **Export**: Test SVG and PNG export with patterns and styles

## Backend Compatibility

The style object structure is compatible with existing Convex schema. The `batchUpdateElements` mutation handles multiple element updates efficiently.

## Next Steps

1. Apply all integration steps above to WhiteboardCanvas.tsx
2. Test the styling panel functionality
3. Verify database persistence
4. Test export functionality with new styles
5. Consider adding keyboard shortcuts for common style operations

## Notes

- The panel only appears when elements are selected
- The panel hides when the Snapshots panel is open (to prevent overlap)
- All style changes are applied atomically using `batchUpdateElements`
- SVG patterns are defined once and reused for performance
- Pattern colors adapt to the selected fill color
