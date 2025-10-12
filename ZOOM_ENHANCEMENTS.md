# Advanced Zoom Navigation Implementation

## Summary
Comprehensive zoom controls and keyboard shortcuts for WhiteboardCanvas.tsx with smooth transitions and cursor-based zooming.

## Features Implemented
1. Zoom to fit all elements (Ctrl+1)
2. Zoom to selection (Ctrl+2)
3. Reset zoom to 100% (Ctrl+0)
4. Zoom at cursor with Ctrl+Scroll
5. Keyboard shortcuts: Ctrl++, Ctrl+-
6. Smooth CSS transitions
7. Extended zoom range: 10%-400%
8. Enhanced UI with FIT, SEL, RESET buttons

## Code to Add

### 1. Add Zoom Functions (After handleRestoreSnapshot, ~line 568)

```typescript
  // Zoom to fit all elements
  const handleZoomToFit = useCallback(() => {
    if (!whiteboard?.elements || whiteboard.elements.length === 0 || !canvasRef.current) return

    const bounds = calculateContentBounds(whiteboard.elements)
    if (!bounds) return

    const rect = canvasRef.current.getBoundingClientRect()

    // Calculate required zoom with padding
    const padding = 50
    const contentWidth = bounds.maxX - bounds.minX
    const contentHeight = bounds.maxY - bounds.minY
    const scaleX = (rect.width - padding * 2) / contentWidth
    const scaleY = (rect.height - padding * 2) / contentHeight
    const newZoom = Math.min(scaleX, scaleY) * 100

    // Clamp zoom to valid range (10-400%)
    const clampedZoom = Math.max(10, Math.min(400, newZoom))

    // Calculate center position
    const centerX = (bounds.minX + bounds.maxX) / 2
    const centerY = (bounds.minY + bounds.maxY) / 2
    const newPan = {
      x: rect.width / 2 - centerX * (clampedZoom / 100),
      y: rect.height / 2 - centerY * (clampedZoom / 100)
    }

    setZoom(clampedZoom)
    setPan(newPan)
  }, [whiteboard])

  // Zoom to selected elements
  const handleZoomToSelection = useCallback(() => {
    if (!whiteboard?.elements || selectedElements.length === 0 || !canvasRef.current) return

    const selectedEls = whiteboard.elements.filter(el => selectedElements.includes(el.id))
    const bounds = calculateContentBounds(selectedEls)
    if (!bounds) return

    const rect = canvasRef.current.getBoundingClientRect()

    // Calculate required zoom with padding
    const padding = 100
    const contentWidth = bounds.maxX - bounds.minX
    const contentHeight = bounds.maxY - bounds.minY
    const scaleX = (rect.width - padding * 2) / contentWidth
    const scaleY = (rect.height - padding * 2) / contentHeight
    const newZoom = Math.min(scaleX, scaleY) * 100

    // Clamp zoom to valid range (10-400%)
    const clampedZoom = Math.max(10, Math.min(400, newZoom))

    // Calculate center position
    const centerX = (bounds.minX + bounds.maxX) / 2
    const centerY = (bounds.minY + bounds.maxY) / 2
    const newPan = {
      x: rect.width / 2 - centerX * (clampedZoom / 100),
      y: rect.height / 2 - centerY * (clampedZoom / 100)
    }

    setZoom(clampedZoom)
    setPan(newPan)
  }, [whiteboard, selectedElements])

  // Reset zoom to 100%
  const handleResetZoom = useCallback(() => {
    setZoom(100)
    setPan({ x: 0, y: 0 })
  }, [])

  // Zoom at cursor position
  const handleZoomAtCursor = useCallback((delta: number, clientX: number, clientY: number) => {
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()

    // Calculate world coordinates before zoom
    const worldX = (clientX - rect.left - pan.x) / (zoom / 100)
    const worldY = (clientY - rect.top - pan.y) / (zoom / 100)

    // Calculate new zoom
    const zoomChange = delta > 0 ? 1.1 : 0.9
    const newZoom = Math.max(10, Math.min(400, zoom * zoomChange))

    // Calculate new pan to keep cursor position fixed
    const newPan = {
      x: clientX - rect.left - worldX * (newZoom / 100),
      y: clientY - rect.top - worldY * (newZoom / 100)
    }

    setZoom(newZoom)
    setPan(newPan)
  }, [zoom, pan])
```

### 2. Add Keyboard Shortcuts (After zoom functions)

```typescript
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+0: Reset zoom
      if (e.ctrlKey && e.key === '0') {
        e.preventDefault()
        handleResetZoom()
      }

      // Ctrl+1: Zoom to fit
      if (e.ctrlKey && e.key === '1') {
        e.preventDefault()
        handleZoomToFit()
      }

      // Ctrl+2: Zoom to selection
      if (e.ctrlKey && e.key === '2') {
        e.preventDefault()
        if (selectedElements.length > 0) {
          handleZoomToSelection()
        }
      }

      // Ctrl++: Zoom in
      if (e.ctrlKey && (e.key === '+' || e.key === '=')) {
        e.preventDefault()
        setZoom(prev => Math.min(400, prev + 25))
      }

      // Ctrl+-: Zoom out
      if (e.ctrlKey && (e.key === '-' || e.key === '_')) {
        e.preventDefault()
        setZoom(prev => Math.max(10, prev - 25))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleResetZoom, handleZoomToFit, handleZoomToSelection, selectedElements])
```

### 3. Add Mouse Wheel Handler (After keyboard shortcuts)

```typescript
  // Mouse wheel zoom with Ctrl
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault()
        handleZoomAtCursor(-e.deltaY, e.clientX, e.clientY)
      }
    }

    const canvas = canvasRef.current
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false })
      return () => canvas.removeEventListener('wheel', handleWheel)
    }
  }, [handleZoomAtCursor])
```

### 4. Replace Zoom Controls UI (~line 299-313)

Replace the existing zoom controls section with:

```typescript
        {/* Enhanced Zoom Controls */}
        <div className="bg-black border-2 border-white p-2 flex items-center space-x-1">
          <button
            onClick={() => setZoom(Math.max(10, zoom - 25))}
            className="p-1 hover:bg-white/10"
            title="Zoom Out (Ctrl+-)"
          >
            <HiOutlineZoomOut className="w-5 h-5 text-white" />
          </button>

          <button
            onClick={handleResetZoom}
            className="px-2 py-1 hover:bg-white/10 border-x border-white/30"
            title="Reset Zoom (Ctrl+0)"
          >
            <span className="text-white font-mono text-xs uppercase">RESET</span>
          </button>

          <span className="text-white font-mono text-sm w-14 text-center">{Math.round(zoom)}%</span>

          <button
            onClick={handleZoomToFit}
            className="px-2 py-1 hover:bg-white/10 border-x border-white/30"
            title="Zoom to Fit All (Ctrl+1)"
          >
            <span className="text-white font-mono text-xs uppercase">FIT</span>
          </button>

          <button
            onClick={handleZoomToSelection}
            disabled={selectedElements.length === 0}
            className="px-2 py-1 hover:bg-white/10 border-r border-white/30 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Zoom to Selection (Ctrl+2)"
          >
            <span className="text-white font-mono text-xs uppercase">SEL</span>
          </button>

          <button
            onClick={() => setZoom(Math.min(400, zoom + 25))}
            className="p-1 hover:bg-white/10"
            title="Zoom In (Ctrl++)"
          >
            <HiOutlineZoomIn className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Keyboard Hints */}
        <div className="bg-black border-2 border-white p-2 flex flex-col space-y-0.5">
          <div className="text-white font-mono text-[10px] opacity-70">
            <kbd className="px-1 bg-white/10 rounded">Ctrl</kbd>+<kbd className="px-1 bg-white/10 rounded">Scroll</kbd> Zoom
          </div>
          <div className="text-white font-mono text-[10px] opacity-70">
            <kbd className="px-1 bg-white/10 rounded">Ctrl</kbd>+<kbd className="px-1 bg-white/10 rounded">0/1/2</kbd> Views
          </div>
        </div>
```

### 5. Add Smooth Transition to SVG (~line 444-450)

Update the SVG style to include transition:

```typescript
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{
            transform: `scale(${zoom / 100}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: '0 0',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
```

### 6. Update Status Bar Info (~line 519-524)

Add zoom indicator to the info panel:

```typescript
      {/* Whiteboard Info with Zoom Indicator */}
      <div className="absolute bottom-4 left-4 bg-black border-2 border-white p-2 z-10">
        <p className="text-white font-mono text-sm">{whiteboard?.name}</p>
        <p className="text-gray-400 font-mono text-xs">
          {whiteboard?.elements.length || 0} elements · Version {whiteboard?.version || 1} · {Math.round(zoom)}% zoom
        </p>
      </div>
```

## Implementation Steps

1. Open `WhiteboardCanvas.tsx`
2. Locate `handleRestoreSnapshot` (~line 563-568)
3. Add the 4 zoom functions after it
4. Add the 2 useEffect hooks (keyboard and wheel)
5. Replace the zoom controls UI section
6. Update the SVG style with transition
7. Update the status bar with zoom indicator

## Testing Checklist

- [ ] Ctrl+0 resets zoom to 100%
- [ ] Ctrl+1 zooms to fit all elements
- [ ] Ctrl+2 zooms to selected elements (when elements selected)
- [ ] Ctrl+Scroll zooms at cursor position
- [ ] Ctrl++ zooms in by 25%
- [ ] Ctrl+- zooms out by 25%
- [ ] FIT button zooms to fit all
- [ ] SEL button zooms to selection (disabled when no selection)
- [ ] RESET button resets zoom to 100%
- [ ] Zoom range: 10%-400%
- [ ] Smooth transitions when zooming
- [ ] Keyboard hints visible in UI

## Notes

- The `calculateContentBounds` helper function already exists in the file
- Zoom range expanded from 25-200% to 10-400%
- All zoom operations maintain smooth CSS transitions
- Cursor-based zooming keeps the point under the cursor fixed in world space
- Selection zoom has larger padding (100px) vs fit-all zoom (50px) for better focus
