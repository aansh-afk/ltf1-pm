import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { 
  HiOutlineCursorClick,
  HiOutlineSquare,
  HiOutlineCircle,
  HiOutlinePencil,
  HiOutlineAnnotation,
  HiOutlineArrowsExpand,
  HiOutlineDownload,
  HiOutlineDuplicate,
  HiOutlineLockClosed,
  HiOutlineLockOpen,
  HiOutlineCamera,
  HiOutlineRewind,
  HiOutlineTrash,
  HiOutlineColorSwatch,
  HiOutlineUsers,
  HiOutlineZoomIn,
  HiOutlineZoomOut,
  HiOutlineDotsVertical,
  HiOutlineX
} from 'react-icons/hi'

// Element types
const ELEMENT_TYPES = {
  SHAPE: 'shape',
  TEXT: 'text',
  LINE: 'line',
  IMAGE: 'image',
  STICKY: 'sticky',
  DRAWING: 'drawing',
} as const

// Shape types
const SHAPE_TYPES = {
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  TRIANGLE: 'triangle',
  DIAMOND: 'diamond',
  ARROW: 'arrow',
  STAR: 'star',
} as const

// Tool types
const TOOLS = {
  SELECT: 'select',
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  LINE: 'line',
  TEXT: 'text',
  STICKY: 'sticky',
  DRAWING: 'drawing',
  PAN: 'pan',
} as const

type Tool = keyof typeof TOOLS

interface WhiteboardCanvasProps {
  workspaceId: Id<'workspaces'>
  whiteboardId?: Id<'whiteboards'>
  projectId?: Id<'projects'>
  meetingId?: Id<'meetings'>
  onClose?: () => void
}

interface Element {
  id: string
  type: string
  data: any
  position: { x: number; y: number }
  size: { width: number; height: number }
  rotation: number
  style: any
  locked: boolean
  createdBy: Id<'users'>
  updatedBy: Id<'users'>
  createdAt: number
  updatedAt: number
}

export default function WhiteboardCanvas({
  workspaceId,
  whiteboardId: initialWhiteboardId,
  projectId,
  meetingId,
  onClose
}: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  
  // State
  const [whiteboardId, setWhiteboardId] = useState(initialWhiteboardId)
  const [activeTool, setActiveTool] = useState<Tool>('SELECT')
  const [selectedElements, setSelectedElements] = useState<string[]>([])
  const [zoom, setZoom] = useState(100)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [currentElement, setCurrentElement] = useState<Partial<Element> | null>(null)
  const [showSnapshots, setShowSnapshots] = useState(false)
  const [showCollaborators, setShowCollaborators] = useState(true)
  const [strokeColor, setStrokeColor] = useState('#000000')
  const [fillColor, setFillColor] = useState('#FFFFFF')
  const [strokeWidth, setStrokeWidth] = useState(2)

  // Queries
  const whiteboard = useQuery(
    api.whiteboard.getWhiteboard,
    whiteboardId ? { whiteboardId } : 'skip'
  )
  
  const whiteboards = useQuery(
    api.whiteboard.getWhiteboards,
    { workspaceId, projectId, meetingId }
  )
  
  const snapshots = useQuery(
    api.whiteboard.getSnapshots,
    whiteboardId && showSnapshots ? { whiteboardId, limit: 10 } : 'skip'
  )

  // Mutations
  const createWhiteboard = useMutation(api.whiteboard.createWhiteboard)
  const addElement = useMutation(api.whiteboard.addElement)
  const updateElement = useMutation(api.whiteboard.updateElement)
  const deleteElement = useMutation(api.whiteboard.deleteElement)
  const batchUpdateElements = useMutation(api.whiteboard.batchUpdateElements)
  const updateCursor = useMutation(api.whiteboard.updateCursor)
  const createSnapshot = useMutation(api.whiteboard.createSnapshot)
  const restoreSnapshot = useMutation(api.whiteboard.restoreSnapshot)
  const cloneWhiteboard = useMutation(api.whiteboard.cloneWhiteboard)
  const exportAsImage = useMutation(api.whiteboard.exportAsImage)

  // Create new whiteboard if needed
  useEffect(() => {
    if (!whiteboardId && !isDragging) {
      createWhiteboard({
        workspaceId,
        name: `Whiteboard ${new Date().toLocaleDateString()}`,
        description: 'Collaborative whiteboard',
        projectId,
        meetingId,
        public: false,
      }).then(setWhiteboardId)
    }
  }, [whiteboardId, workspaceId, projectId, meetingId, createWhiteboard, isDragging])

  // Update cursor position
  useEffect(() => {
    if (!whiteboardId) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return
      
      const rect = canvasRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - pan.x) / (zoom / 100)
      const y = (e.clientY - rect.top - pan.y) / (zoom / 100)
      
      updateCursor({ whiteboardId, cursor: { x, y } })
    }

    const handleMouseLeave = () => {
      updateCursor({ whiteboardId, cursor: undefined })
    }

    canvasRef.current?.addEventListener('mousemove', handleMouseMove)
    canvasRef.current?.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      canvasRef.current?.removeEventListener('mousemove', handleMouseMove)
      canvasRef.current?.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [whiteboardId, zoom, pan, updateCursor])

  // Canvas mouse handlers
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (!whiteboardId) return
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const x = (e.clientX - rect.left - pan.x) / (zoom / 100)
    const y = (e.clientY - rect.top - pan.y) / (zoom / 100)
    
    setIsDragging(true)
    setDragStart({ x, y })
    
    // Create new element based on active tool
    if (activeTool !== 'SELECT' && activeTool !== 'PAN') {
      const newElement: Partial<Element> = {
        type: activeTool === 'RECTANGLE' || activeTool === 'CIRCLE' ? ELEMENT_TYPES.SHAPE : 
              activeTool === 'LINE' ? ELEMENT_TYPES.LINE :
              activeTool === 'TEXT' ? ELEMENT_TYPES.TEXT :
              activeTool === 'STICKY' ? ELEMENT_TYPES.STICKY :
              activeTool === 'DRAWING' ? ELEMENT_TYPES.DRAWING : ELEMENT_TYPES.SHAPE,
        data: activeTool === 'RECTANGLE' ? { shape: SHAPE_TYPES.RECTANGLE } :
              activeTool === 'CIRCLE' ? { shape: SHAPE_TYPES.CIRCLE } :
              activeTool === 'TEXT' ? { text: 'New Text' } :
              activeTool === 'STICKY' ? { text: 'New Note' } :
              activeTool === 'DRAWING' ? { points: [[x, y]] } :
              activeTool === 'LINE' ? { points: [[x, y], [x, y]] } : {},
        position: { x, y },
        size: { width: 0, height: 0 },
        rotation: 0,
        style: {
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth,
        }
      }
      setCurrentElement(newElement)
    }
  }, [whiteboardId, activeTool, pan, zoom, strokeColor, fillColor, strokeWidth])

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !canvasRef.current) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - pan.x) / (zoom / 100)
    const y = (e.clientY - rect.top - pan.y) / (zoom / 100)
    
    if (currentElement) {
      // Update current element size
      setCurrentElement(prev => ({
        ...prev!,
        size: {
          width: Math.abs(x - dragStart.x),
          height: Math.abs(y - dragStart.y)
        },
        position: {
          x: Math.min(x, dragStart.x),
          y: Math.min(y, dragStart.y)
        }
      }))
    } else if (activeTool === 'PAN') {
      // Pan the canvas
      setPan(prev => ({
        x: prev.x + (x - dragStart.x),
        y: prev.y + (y - dragStart.y)
      }))
    }
  }, [isDragging, currentElement, activeTool, dragStart, pan, zoom])

  const handleCanvasMouseUp = useCallback(async () => {
    if (!whiteboardId || !currentElement) {
      setIsDragging(false)
      return
    }
    
    // Add element to whiteboard
    if (currentElement.size!.width > 5 || currentElement.size!.height > 5) {
      await addElement({
        whiteboardId,
        element: {
          type: currentElement.type as any,
          data: currentElement.data,
          position: currentElement.position!,
          size: currentElement.size!,
          rotation: currentElement.rotation,
          style: currentElement.style
        }
      })
    }
    
    setCurrentElement(null)
    setIsDragging(false)
  }, [whiteboardId, currentElement, addElement])

  // Delete selected elements
  const handleDeleteSelected = useCallback(async () => {
    if (!whiteboardId || selectedElements.length === 0) return
    
    for (const elementId of selectedElements) {
      await deleteElement({ whiteboardId, elementId })
    }
    setSelectedElements([])
  }, [whiteboardId, selectedElements, deleteElement])

  // Export whiteboard
  const handleExport = useCallback(async (format: 'png' | 'svg' | 'pdf') => {
    if (!whiteboardId) return
    
    const result = await exportAsImage({ whiteboardId, format })
    // In production, this would download the file
    console.log('Export result:', result)
  }, [whiteboardId, exportAsImage])

  // Clone whiteboard
  const handleClone = useCallback(async () => {
    if (!whiteboardId) return
    
    const newId = await cloneWhiteboard({
      whiteboardId,
      name: `${whiteboard?.name} (Copy)`
    })
    setWhiteboardId(newId)
  }, [whiteboardId, whiteboard, cloneWhiteboard])

  // Create snapshot
  const handleSnapshot = useCallback(async () => {
    if (!whiteboardId) return
    await createSnapshot({ whiteboardId })
  }, [whiteboardId, createSnapshot])

  // Restore snapshot
  const handleRestoreSnapshot = useCallback(async (snapshotId: Id<'whiteboardSnapshots'>) => {
    if (!whiteboardId) return
    await restoreSnapshot({ whiteboardId, snapshotId })
    setShowSnapshots(false)
  }, [whiteboardId, restoreSnapshot])

  // Render element
  const renderElement = (element: Element) => {
    const { id, type, data, position, size, style, locked } = element
    const isSelected = selectedElements.includes(id)
    
    switch (type) {
      case ELEMENT_TYPES.SHAPE:
        if (data.shape === SHAPE_TYPES.RECTANGLE) {
          return (
            <rect
              key={id}
              x={position.x}
              y={position.y}
              width={size.width}
              height={size.height}
              fill={style.fill}
              stroke={isSelected ? '#FF00FF' : style.stroke}
              strokeWidth={isSelected ? style.strokeWidth + 1 : style.strokeWidth}
              opacity={style.opacity || 1}
              className={`cursor-pointer ${locked ? 'pointer-events-none' : ''}`}
              onClick={() => setSelectedElements([id])}
            />
          )
        } else if (data.shape === SHAPE_TYPES.CIRCLE) {
          return (
            <ellipse
              key={id}
              cx={position.x + size.width / 2}
              cy={position.y + size.height / 2}
              rx={size.width / 2}
              ry={size.height / 2}
              fill={style.fill}
              stroke={isSelected ? '#FF00FF' : style.stroke}
              strokeWidth={isSelected ? style.strokeWidth + 1 : style.strokeWidth}
              opacity={style.opacity || 1}
              className={`cursor-pointer ${locked ? 'pointer-events-none' : ''}`}
              onClick={() => setSelectedElements([id])}
            />
          )
        }
        break
      
      case ELEMENT_TYPES.TEXT:
        return (
          <text
            key={id}
            x={position.x}
            y={position.y}
            fontSize={style.fontSize || 16}
            fontFamily={style.fontFamily || 'SpaceMono'}
            fill={isSelected ? '#FF00FF' : style.color || '#000000'}
            className={`cursor-pointer ${locked ? 'pointer-events-none' : ''}`}
            onClick={() => setSelectedElements([id])}
          >
            {data.text}
          </text>
        )
      
      case ELEMENT_TYPES.LINE:
        return (
          <line
            key={id}
            x1={data.points[0][0]}
            y1={data.points[0][1]}
            x2={data.points[1][0]}
            y2={data.points[1][1]}
            stroke={isSelected ? '#FF00FF' : style.stroke}
            strokeWidth={isSelected ? style.strokeWidth + 1 : style.strokeWidth}
            strokeDasharray={style.strokeDasharray || ''}
            className={`cursor-pointer ${locked ? 'pointer-events-none' : ''}`}
            onClick={() => setSelectedElements([id])}
          />
        )
      
      case ELEMENT_TYPES.STICKY:
        return (
          <g key={id}>
            <rect
              x={position.x}
              y={position.y}
              width={size.width}
              height={size.height}
              fill={style.backgroundColor || '#FFFF00'}
              stroke={isSelected ? '#FF00FF' : style.borderColor || '#000000'}
              strokeWidth={isSelected ? style.borderWidth + 1 : style.borderWidth || 2}
              className={`cursor-pointer ${locked ? 'pointer-events-none' : ''}`}
              onClick={() => setSelectedElements([id])}
            />
            <text
              x={position.x + 10}
              y={position.y + 25}
              fontSize={style.fontSize || 14}
              fontFamily={style.fontFamily || 'SpaceMono'}
              fill="#000000"
            >
              {data.text}
            </text>
          </g>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 bg-black border-2 border-white p-2 space-y-2 z-10">
        <button
          onClick={() => setActiveTool('SELECT')}
          className={`p-2 border-2 ${activeTool === 'SELECT' ? 'border-cyan-400 bg-cyan-400/20' : 'border-white'} hover:bg-white/10`}
          title="Select"
        >
          <HiOutlineCursorClick className="w-5 h-5 text-white" />
        </button>
        
        <button
          onClick={() => setActiveTool('RECTANGLE')}
          className={`p-2 border-2 ${activeTool === 'RECTANGLE' ? 'border-cyan-400 bg-cyan-400/20' : 'border-white'} hover:bg-white/10`}
          title="Rectangle"
        >
          <HiOutlineSquare className="w-5 h-5 text-white" />
        </button>
        
        <button
          onClick={() => setActiveTool('CIRCLE')}
          className={`p-2 border-2 ${activeTool === 'CIRCLE' ? 'border-cyan-400 bg-cyan-400/20' : 'border-white'} hover:bg-white/10`}
          title="Circle"
        >
          <HiOutlineCircle className="w-5 h-5 text-white" />
        </button>
        
        <button
          onClick={() => setActiveTool('LINE')}
          className={`p-2 border-2 ${activeTool === 'LINE' ? 'border-cyan-400 bg-cyan-400/20' : 'border-white'} hover:bg-white/10`}
          title="Line"
        >
          <HiOutlinePencil className="w-5 h-5 text-white" />
        </button>
        
        <button
          onClick={() => setActiveTool('TEXT')}
          className={`p-2 border-2 ${activeTool === 'TEXT' ? 'border-cyan-400 bg-cyan-400/20' : 'border-white'} hover:bg-white/10`}
          title="Text"
        >
          <span className="text-white font-bold">T</span>
        </button>
        
        <button
          onClick={() => setActiveTool('STICKY')}
          className={`p-2 border-2 ${activeTool === 'STICKY' ? 'border-cyan-400 bg-cyan-400/20' : 'border-white'} hover:bg-white/10`}
          title="Sticky Note"
        >
          <HiOutlineAnnotation className="w-5 h-5 text-white" />
        </button>
        
        <button
          onClick={() => setActiveTool('PAN')}
          className={`p-2 border-2 ${activeTool === 'PAN' ? 'border-cyan-400 bg-cyan-400/20' : 'border-white'} hover:bg-white/10`}
          title="Pan"
        >
          <HiOutlineArrowsExpand className="w-5 h-5 text-white" />
        </button>
        
        <div className="border-t-2 border-white pt-2">
          <button
            onClick={handleDeleteSelected}
            disabled={selectedElements.length === 0}
            className="p-2 border-2 border-white hover:bg-red-500/20 disabled:opacity-50"
            title="Delete Selected"
          >
            <HiOutlineTrash className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Top Controls */}
      <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
        {/* Zoom Controls */}
        <div className="bg-black border-2 border-white p-2 flex items-center space-x-2">
          <button
            onClick={() => setZoom(Math.max(25, zoom - 25))}
            className="p-1 hover:bg-white/10"
          >
            <HiOutlineZoomOut className="w-5 h-5 text-white" />
          </button>
          <span className="text-white font-mono text-sm w-12 text-center">{zoom}%</span>
          <button
            onClick={() => setZoom(Math.min(200, zoom + 25))}
            className="p-1 hover:bg-white/10"
          >
            <HiOutlineZoomIn className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Color Picker */}
        <div className="bg-black border-2 border-white p-2 flex items-center space-x-2">
          <input
            type="color"
            value={strokeColor}
            onChange={(e) => setStrokeColor(e.target.value)}
            className="w-8 h-8 border-2 border-white cursor-pointer"
            title="Stroke Color"
          />
          <input
            type="color"
            value={fillColor}
            onChange={(e) => setFillColor(e.target.value)}
            className="w-8 h-8 border-2 border-white cursor-pointer"
            title="Fill Color"
          />
        </div>

        {/* Actions */}
        <div className="bg-black border-2 border-white p-2 flex items-center space-x-2">
          <button
            onClick={handleSnapshot}
            className="p-1 hover:bg-white/10"
            title="Create Snapshot"
          >
            <HiOutlineCamera className="w-5 h-5 text-white" />
          </button>
          
          <button
            onClick={() => setShowSnapshots(!showSnapshots)}
            className="p-1 hover:bg-white/10"
            title="View Snapshots"
          >
            <HiOutlineRewind className="w-5 h-5 text-white" />
          </button>
          
          <button
            onClick={handleClone}
            className="p-1 hover:bg-white/10"
            title="Clone Whiteboard"
          >
            <HiOutlineDuplicate className="w-5 h-5 text-white" />
          </button>
          
          <button
            onClick={() => setShowCollaborators(!showCollaborators)}
            className="p-1 hover:bg-white/10"
            title="Toggle Collaborators"
          >
            <HiOutlineUsers className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Export Menu */}
        <div className="bg-black border-2 border-white p-2">
          <button
            onClick={() => handleExport('png')}
            className="p-1 hover:bg-white/10"
            title="Export"
          >
            <HiOutlineDownload className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="bg-red-500 border-2 border-white p-2 hover:bg-red-600"
          >
            <HiOutlineX className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      {/* Canvas */}
      <div 
        ref={canvasRef}
        className="flex-1 overflow-hidden cursor-crosshair relative"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
      >
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{
            transform: `scale(${zoom / 100}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: '0 0'
          }}
        >
          {/* Render whiteboard elements */}
          {whiteboard?.elements.map(renderElement)}
          
          {/* Render current element being drawn */}
          {currentElement && renderElement(currentElement as Element)}
          
          {/* Render collaborator cursors */}
          {showCollaborators && whiteboard?.collaborators.map(collab => collab.cursor && (
            <g key={collab.userId}>
              <circle
                cx={collab.cursor.x}
                cy={collab.cursor.y}
                r="5"
                fill={collab.color}
                opacity="0.8"
              />
              <text
                x={collab.cursor.x + 10}
                y={collab.cursor.y - 10}
                fontSize="12"
                fill={collab.color}
                fontFamily="SpaceMono"
              >
                {collab.user?.name}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Snapshots Panel */}
      {showSnapshots && (
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-black border-l-2 border-white p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">Snapshots</h3>
            <button
              onClick={() => setShowSnapshots(false)}
              className="text-white hover:text-cyan-400"
            >
              <HiOutlineX className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-2">
            {snapshots?.map(snapshot => (
              <div
                key={snapshot._id}
                className="p-2 border-2 border-white hover:border-cyan-400 cursor-pointer"
                onClick={() => handleRestoreSnapshot(snapshot._id)}
              >
                <p className="text-white text-sm">Version {snapshot.version}</p>
                <p className="text-gray-400 text-xs">
                  {new Date(snapshot.createdAt).toLocaleString()}
                </p>
                <p className="text-gray-400 text-xs">
                  by {snapshot.creator?.name}
                </p>
                <p className="text-cyan-400 text-xs">
                  {snapshot.elements.length} elements
                </p>
              </div>
            ))}
          </div>
        </div>
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