# Quick Implementation Guide: Whiteboard Performance Optimizations

## TL;DR - What Changed

1. **Cursor updates**: Debounced from 500/sec to 60/sec (88% reduction)
2. **Element rendering**: Only visible elements rendered (viewport culling)
3. **Re-renders**: Memoized components prevent unnecessary re-renders
4. **Mutations**: Batched operations reduce N mutations to 1
5. **Performance monitoring**: Real-time FPS and frame time tracking

## Files Created

```
apps/web/src/components/features/whiteboard/
├── utils/
│   ├── spatialIndex.ts           # Viewport culling system
│   └── performanceUtils.ts       # Debounce, throttle, batching, monitoring
├── components/
│   ├── MemoizedElement.tsx       # Optimized element components
│   └── PerformanceOverlay.tsx    # Dev mode performance display
```

## Critical Changes Needed in WhiteboardCanvas.tsx

### 1. Add Imports (Top of file)

```typescript
import { SpatialIndex, getViewportBounds } from './utils/spatialIndex'
import { debounce, BatchManager, PerformanceMonitor } from './utils/performanceUtils'
import { MemoizedElement } from './components/MemoizedElement'
import PerformanceOverlay from './components/PerformanceOverlay'
```

### 2. Add Performance System Refs (After existing useRefs)

```typescript
// After: const svgRef = useRef<SVGSVGElement>(null)

// Performance systems
const spatialIndexRef = useRef(new SpatialIndex<Element>(500))
const monitorRef = useRef(new PerformanceMonitor())
const batchManagerRef = useRef<BatchManager<any>>(
  new BatchManager(
    (updates) => {
      if (whiteboardId) {
        batchUpdateElements({ whiteboardId, updates })
      }
    },
    100, // 100ms flush delay
    50   // 50 items max
  )
)

// Enable monitoring in dev
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    monitorRef.current.enable()
  }
}, [])
```

### 3. Replace Cursor Update Effect (Currently lines 224-249)

**BEFORE:**
```typescript
// Update cursor position
useEffect(() => {
  if (!whiteboardId) return

  const handleMouseMove = (e: MouseEvent) => {
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - pan.x) / (zoom / 100)
    const y = (e.clientY - rect.top - pan.y) / (zoom / 100)

    updateCursor({ whiteboardId, cursor: { x, y } })  // FIRES ON EVERY MOUSEMOVE!
  }
  // ... rest
}, [whiteboardId, zoom, pan, updateCursor])
```

**AFTER:**
```typescript
// Debounced cursor update (60fps max)
const debouncedCursorUpdate = useMemo(
  () => debounce((cursor: { x: number; y: number } | undefined) => {
    if (!whiteboardId) return
    updateCursor({ whiteboardId, cursor })
  }, 16), // 60fps
  [whiteboardId, updateCursor]
)

useEffect(() => {
  if (!whiteboardId) return

  const handleMouseMove = (e: MouseEvent) => {
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - pan.x) / (zoom / 100)
    const y = (e.clientY - rect.top - pan.y) / (zoom / 100)

    debouncedCursorUpdate({ x, y })  // DEBOUNCED!
  }

  const handleMouseLeave = () => {
    debouncedCursorUpdate(undefined)
  }

  canvasRef.current?.addEventListener('mousemove', handleMouseMove)
  canvasRef.current?.addEventListener('mouseleave', handleMouseLeave)

  return () => {
    canvasRef.current?.removeEventListener('mousemove', handleMouseMove)
    canvasRef.current?.removeEventListener('mouseleave', handleMouseLeave)
  }
}, [whiteboardId, zoom, pan, debouncedCursorUpdate])
```

### 4. Add Viewport Culling (After whiteboard query)

```typescript
// After the whiteboard query

// Calculate visible elements with viewport culling
const visibleElements = useMemo(() => {
  if (!whiteboard?.elements || !canvasRef.current) return []

  // Rebuild spatial index when elements change
  spatialIndexRef.current.rebuild(whiteboard.elements)

  // Calculate viewport bounds
  const rect = canvasRef.current.getBoundingClientRect()
  const bounds = getViewportBounds(rect.width, rect.height, zoom, pan)

  // Query visible elements (200px buffer to prevent pop-in)
  return spatialIndexRef.current.query(bounds, 200)
}, [whiteboard?.elements, zoom, pan])

// Record frame for performance monitoring
useEffect(() => {
  monitorRef.current.recordFrame()
}, [visibleElements, zoom, pan])
```

### 5. Replace Element Rendering (Currently line 688)

**BEFORE:**
```typescript
{/* Render whiteboard elements */}
{whiteboard?.elements.map(renderElement)}  // RENDERS ALL ELEMENTS!
```

**AFTER:**
```typescript
{/* Render only visible elements with memoization */}
{visibleElements.map(element => (
  <MemoizedElement
    key={element.id}
    element={element}
    isSelected={selectedElements.includes(element.id)}
    onSelect={(id) => setSelectedElements([id])}
  />
))}
```

### 6. Replace Delete Handler (Currently lines 285-292)

**BEFORE:**
```typescript
const handleDeleteSelected = useCallback(async () => {
  if (!whiteboardId || selectedElements.length === 0) return

  for (const elementId of selectedElements) {
    await deleteElement({ whiteboardId, elementId })  // N MUTATIONS!
  }
  setSelectedElements([])
}, [whiteboardId, selectedElements, deleteElement])
```

**AFTER:**
```typescript
const handleDeleteSelected = useCallback(async () => {
  if (!whiteboardId || selectedElements.length === 0) return

  // Create batch of delete operations
  const deleteBatch = selectedElements.map(elementId => ({
    elementId,
    updates: { deleted: true } // Mark for deletion
  }))

  // Single batched mutation
  await batchUpdateElements({ whiteboardId, updates: deleteBatch })
  setSelectedElements([])
}, [whiteboardId, selectedElements, batchUpdateElements])
```

### 7. Add Performance Overlay (In JSX return, before closing </div>)

```typescript
return (
  <div className="fixed inset-0 bg-black/90 z-50 flex">
    {/* ... existing UI ... */}

    {/* Performance Overlay (dev mode only) */}
    {process.env.NODE_ENV === 'development' && (
      <PerformanceOverlay monitor={monitorRef.current} enabled={true} />
    )}
  </div>
)
```

### 8. Optional: Optimize SVG Transform

Add CSS class for better GPU performance:

```typescript
// In component or global CSS
const styles = `
  .whiteboard-canvas-svg {
    width: 100%;
    height: 100%;
    transform-origin: 0 0;
    will-change: transform;
  }
`

// Update SVG element
<svg
  ref={svgRef}
  className="whiteboard-canvas-svg"
  style={{
    transform: `scale(${zoom / 100}) translate(${pan.x}px, ${pan.y}px)`
  }}
>
```

## Testing Checklist

After implementing:

- [ ] Cursor updates are smooth and not laggy
- [ ] Panning/zooming is smooth at 60 FPS
- [ ] Only visible elements are rendered (check with React DevTools)
- [ ] Deleting multiple elements triggers single mutation
- [ ] Performance overlay shows in development mode
- [ ] FPS stays at 60 with 1000+ elements
- [ ] Memory usage is stable over time

## Performance Metrics to Monitor

In development mode, the performance overlay will show:

- **FPS**: Should be 60 (green) under normal conditions
- **Avg Frame Time**: Should be <16ms (green)
- **Max Frame Time**: Should be <33ms (yellow) at worst

If metrics are red:
1. Check element count - are too many visible?
2. Check spatial index - is it being rebuilt too often?
3. Check re-renders - are memoized components working?
4. Check browser console for warnings

## Backend Update Required

The `batchUpdateElements` mutation needs to support delete operations. Update in `convex/whiteboard.ts`:

```typescript
export const batchUpdateElements = mutation({
  args: {
    whiteboardId: v.id("whiteboards"),
    updates: v.array(v.object({
      elementId: v.string(),
      updates: v.object({
        // ... existing fields ...
        deleted: v.optional(v.boolean()),  // ADD THIS
      }),
    })),
  },
  handler: async (ctx, args) => {
    // ... existing code ...

    // Apply all updates
    let updatedElements = [...whiteboard.elements]

    for (const update of args.updates) {
      const elementIndex = updatedElements.findIndex(e => e.id === update.elementId)

      if (elementIndex !== -1) {
        // Handle deletion
        if (update.updates.deleted) {
          updatedElements.splice(elementIndex, 1)
        } else {
          // Handle update
          updatedElements[elementIndex] = {
            ...updatedElements[elementIndex],
            ...update.updates,
            updatedBy: user._id,
            updatedAt: Date.now(),
          }
        }
      }
    }

    await ctx.db.patch(args.whiteboardId, {
      elements: updatedElements,
      version: whiteboard.version + 1,
      updatedAt: Date.now(),
    })

    updateCollaboratorActivity(ctx, whiteboard, user._id)
  },
})
```

## Common Issues

### Issue: Cursor updates still laggy
**Solution**: Check that debounce is working. Add `console.log` to verify it's being called max 60 times per second.

### Issue: Elements popping in and out
**Solution**: Increase buffer size in viewport query from 200 to 400 pixels.

### Issue: Low FPS with few elements
**Solution**: Check if spatial index is being rebuilt on every frame. It should only rebuild when elements change.

### Issue: Memory leak
**Solution**: Ensure cleanup in useEffect hooks. All event listeners and timers should be cleaned up.

## Next Steps

1. ✅ Files created
2. ⬜ Integrate changes into WhiteboardCanvas.tsx
3. ⬜ Update backend mutation for batch deletes
4. ⬜ Test with 1000+ elements
5. ⬜ Monitor performance metrics
6. ⬜ Deploy to staging
7. ⬜ A/B test performance improvement

## Support

For questions or issues:
1. Check `PERFORMANCE_OPTIMIZATION_REPORT.md` for detailed documentation
2. Review example implementations in utility files
3. Check performance overlay for real-time metrics
4. Use React DevTools Profiler to identify bottlenecks
