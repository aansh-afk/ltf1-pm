import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import {
  HiOutlineCursorClick,
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
import PropertiesPanel from './PropertiesPanel'
import ContextMenu, { createElementContextMenu, createCanvasContextMenu } from './ContextMenu'
import StatusBar from './StatusBar'
import BrutalTooltip from '../../ui/BrutalTooltip'
import SVGPatterns, { getFillValue, getStrokeDashArray } from './SVGPatterns'
import StylePropertiesPanel from './StylePropertiesPanel'
import { TextEditor } from './TextEditor'
import { TextFormattingControls } from './TextFormattingControls'
import { debounce } from './utils/performanceUtils'

// Circle icon component (since HiOutlineCircle doesn't exist in hi package)
const CircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <circle cx="12" cy="12" r="9" strokeWidth="2" />
  </svg>
)

// Square icon component (since HiOutlineSquare doesn't exist in hi package)
const SquareIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <rect x="4" y="4" width="16" height="16" strokeWidth="2" />
  </svg>
)

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

interface ViewportBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

// Viewport culling helpers
const VIEWPORT_BUFFER = 1.5 // Render 1.5x viewport to prevent pop-in

const calculateViewportBounds = (
  canvasRect: DOMRect,
  pan: { x: number; y: number },
  zoom: number
): ViewportBounds => {
  const scale = zoom / 100
  const bufferWidth = canvasRect.width * VIEWPORT_BUFFER / scale
  const bufferHeight = canvasRect.height * VIEWPORT_BUFFER / scale

  return {
    minX: -pan.x / scale - bufferWidth / 2,
    minY: -pan.y / scale - bufferHeight / 2,
    maxX: (canvasRect.width - pan.x) / scale + bufferWidth / 2,
    maxY: (canvasRect.height - pan.y) / scale + bufferHeight / 2,
  }
}

const isElementInViewport = (element: Element, viewport: ViewportBounds): boolean => {
  const { position, size } = element
  const elementRight = position.x + size.width
  const elementBottom = position.y + size.height

  return !(
    elementRight < viewport.minX ||
    position.x > viewport.maxX ||
    elementBottom < viewport.minY ||
    position.y > viewport.maxY
  )
}

const calculateContentBounds = (elements: Element[]): ViewportBounds | null => {
  if (elements.length === 0) return null

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  elements.forEach(element => {
    const { position, size } = element
    minX = Math.min(minX, position.x)
    minY = Math.min(minY, position.y)
    maxX = Math.max(maxX, position.x + size.width)
    maxY = Math.max(maxY, position.y + size.height)
  })

  return { minX, minY, maxX, maxY }
}

// Calculate bounding box for selection
const calculateSelectionBounds = (elements: Element[]) => {
  if (elements.length === 0) return null

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  elements.forEach(el => {
    minX = Math.min(minX, el.position.x)
    minY = Math.min(minY, el.position.y)
    maxX = Math.max(maxX, el.position.x + el.size.width)
    maxY = Math.max(maxY, el.position.y + el.size.height)
  })

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
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
  const [strokeColor, setStrokeColor] = useState('#FFFFFF') // White stroke for visibility on black canvas
  const [fillColor, setFillColor] = useState('transparent') // Transparent fill by default
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // UI Enhancement State
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false)
  const [showStylePanel, setShowStylePanel] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; options: any[] } | null>(null)
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null)
  const [zenMode, setZenMode] = useState(false)
  const [copiedElement, setCopiedElement] = useState<Element | null>(null)

  // Selection & Manipulation State
  const [isSelectionBox, setIsSelectionBox] = useState(false)
  const [selectionBoxStart, setSelectionBoxStart] = useState({ x: 0, y: 0 })
  const [selectionBoxEnd, setSelectionBoxEnd] = useState({ x: 0, y: 0 })
  const [resizingHandle, setResizingHandle] = useState<string | null>(null)
  const [rotatingElement, setRotatingElement] = useState<string | null>(null)
  const [groups, setGroups] = useState<string[][]>([])
  const [isDraggingElement, setIsDraggingElement] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Text Editing State
  const [editingTextElement, setEditingTextElement] = useState<Element | null>(null)
  const [showTextFormattingControls, setShowTextFormattingControls] = useState(false)

  // Infinite Canvas State
  const [viewportBounds, setViewportBounds] = useState<ViewportBounds>({
    minX: -1000,
    minY: -1000,
    maxX: 1000,
    maxY: 1000
  })
  const viewportUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
  const generateImageUploadUrl = useMutation(api.whiteboard.generateImageUploadUrl)

  // Memoized visible elements with viewport culling
  const visibleElements = useMemo(() => {
    if (!whiteboard?.elements) return []
    return whiteboard.elements.filter((element) =>
      isElementInViewport(element, viewportBounds)
    )
  }, [whiteboard?.elements, viewportBounds])

  // Memoized content bounds for minimap and fit-to-content
  const contentBounds = useMemo(() => {
    if (!whiteboard?.elements || whiteboard.elements.length === 0) return null
    return calculateContentBounds(whiteboard.elements)
  }, [whiteboard?.elements])

  // Image upload state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

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

  // Update cursor position (no debounce for smoothest tracking)
  useEffect(() => {
    if (!whiteboardId) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return

      const rect = canvasRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - pan.x) / (zoom / 100)
      const y = (e.clientY - rect.top - pan.y) / (zoom / 100)

      // Direct update without debounce for real-time cursor tracking
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

  // Update viewport bounds for culling (debounced at 16ms for 60fps)
  const updateViewportBounds = useCallback(() => {
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const newBounds = calculateViewportBounds(rect, pan, zoom)
    setViewportBounds(newBounds)
  }, [pan, zoom])

  useEffect(() => {
    if (viewportUpdateTimeoutRef.current) {
      clearTimeout(viewportUpdateTimeoutRef.current)
    }

    viewportUpdateTimeoutRef.current = setTimeout(() => {
      updateViewportBounds()
    }, 16) // 16ms = 60fps

    return () => {
      if (viewportUpdateTimeoutRef.current) {
        clearTimeout(viewportUpdateTimeoutRef.current)
      }
    }
  }, [pan, zoom, updateViewportBounds])

  // Image upload handlers (defined before drag & drop useEffect to avoid initialization order error)
  const handleImageUpload = useCallback(async (file: File) => {
    if (!whiteboardId || !canvasRef.current) return

    setIsUploadingImage(true)

    try {
      // Get upload URL from Convex
      const uploadUrl = await generateImageUploadUrl()

      // Upload file to Convex storage
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file
      })

      const { storageId } = await result.json()

      // Get image dimensions and URL
      const img = new Image()
      const imageUrl = URL.createObjectURL(file)

      img.onload = async () => {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return

        // Calculate position (center of viewport)
        const centerX = (rect.width / 2 - pan.x) / (zoom / 100)
        const centerY = (rect.height / 2 - pan.y) / (zoom / 100)

        // Add image element with storageId (URL will be fetched via getStorageUrl when rendering)
        await addElement({
          whiteboardId,
          element: {
            type: ELEMENT_TYPES.IMAGE,
            data: {
              storageId,
              url: imageUrl, // Temporary blob URL until we can fetch from Convex
              width: img.width,
              height: img.height
            },
            position: {
              x: centerX - img.width / 2,
              y: centerY - img.height / 2
            },
            size: {
              width: img.width,
              height: img.height
            },
            rotation: 0,
            style: {
              opacity: 1
            }
          }
        })

        // Note: In production, you'd fetch the Convex storage URL here
        // using the getStorageUrl query and update the element
        // For now, the blob URL will work for the current session

        URL.revokeObjectURL(imageUrl)
        setIsUploadingImage(false)
      }

      img.onerror = () => {
        console.error('Failed to load image')
        URL.revokeObjectURL(imageUrl)
        setIsUploadingImage(false)
      }

      img.src = imageUrl
    } catch (error) {
      console.error('Image upload failed:', error)
      alert('Failed to upload image. Please try again.')
      setIsUploadingImage(false)
    }
  }, [whiteboardId, pan, zoom, addElement, generateImageUploadUrl])

  // Drag & drop and paste handlers for images
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy'
      }
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer?.files[0]
      if (file && file.type.startsWith('image/')) {
        handleImageUpload(file)
      }
    }

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile()
          if (file) {
            e.preventDefault()
            handleImageUpload(file)
            break
          }
        }
      }
    }

    canvasRef.current?.addEventListener('dragover', handleDragOver)
    canvasRef.current?.addEventListener('drop', handleDrop)
    document.addEventListener('paste', handlePaste)

    return () => {
      canvasRef.current?.removeEventListener('dragover', handleDragOver)
      canvasRef.current?.removeEventListener('drop', handleDrop)
      document.removeEventListener('paste', handlePaste)
    }
  }, [handleImageUpload])

  // Helper function to get selected elements (defined early to avoid initialization order errors)
  const getSelectedElements = useCallback(() => {
    if (!whiteboard) return []
    return whiteboard.elements.filter(el => selectedElements.includes(el.id))
  }, [whiteboard, selectedElements])

  // Canvas mouse handlers
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (!whiteboardId) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = (e.clientX - rect.left - pan.x) / (zoom / 100)
    const y = (e.clientY - rect.top - pan.y) / (zoom / 100)

    setIsDragging(true)
    setDragStart({ x, y })

    // Check if clicking on an element for selection/dragging
    if (activeTool === 'SELECT') {
      const clickedElement = whiteboard?.elements.find(el => {
        const { position, size } = el
        return x >= position.x && x <= position.x + size.width &&
               y >= position.y && y <= position.y + size.height
      })

      if (clickedElement) {
        // Shift+Click: add to selection
        if (e.shiftKey) {
          if (selectedElements.includes(clickedElement.id)) {
            setSelectedElements(prev => prev.filter(id => id !== clickedElement.id))
          } else {
            setSelectedElements(prev => [...prev, clickedElement.id])
          }
        } else {
          // Single click: select only this element
          if (!selectedElements.includes(clickedElement.id)) {
            setSelectedElements([clickedElement.id])
          }
          // Start dragging
          setIsDraggingElement(true)
          setDragOffset({
            x: x - clickedElement.position.x,
            y: y - clickedElement.position.y
          })
        }
      } else {
        // Clicked on empty space: start selection box
        if (!e.shiftKey) {
          setSelectedElements([])
        }
        setIsSelectionBox(true)
        setSelectionBoxStart({ x, y })
        setSelectionBoxEnd({ x, y })
      }
      return
    }

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
  }, [whiteboardId, activeTool, pan, zoom, strokeColor, fillColor, strokeWidth, whiteboard, selectedElements])

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - pan.x) / (zoom / 100)
    const y = (e.clientY - rect.top - pan.y) / (zoom / 100)

    // Selection box expansion
    if (isSelectionBox) {
      setSelectionBoxEnd({ x, y })
      return
    }

    // Element dragging
    if (isDraggingElement && whiteboardId) {
      const dx = x - dragStart.x
      const dy = y - dragStart.y

      const selected = getSelectedElements()
      const updates = selected.map(el => ({
        elementId: el.id,
        updates: {
          position: {
            x: el.position.x + dx,
            y: el.position.y + dy
          }
        }
      }))

      // Update immediately for smooth dragging
      batchUpdateElements({ whiteboardId, updates })
      setDragStart({ x, y })
      return
    }

    if (currentElement) {
      // Special handling for DRAWING tool - add points
      if (activeTool === 'DRAWING') {
        setCurrentElement(prev => {
          const prevPoints = prev!.data?.points || []
          const lastPoint = prevPoints[prevPoints.length - 1]

          // Only add point if it's far enough from the last point (reduces redundant points)
          const distance = lastPoint ?
            Math.sqrt(Math.pow(x - lastPoint[0], 2) + Math.pow(y - lastPoint[1], 2)) :
            Infinity

          if (distance > 2) { // Minimum 2px distance between points
            return {
              ...prev!,
              data: {
                ...prev!.data,
                points: [...prevPoints, [x, y]]
              }
            }
          }
          return prev!
        })
      } else {
        // Update current element size for shapes
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
      }
    } else if (activeTool === 'PAN') {
      // Pan the canvas
      setPan(prev => ({
        x: prev.x + (x - dragStart.x),
        y: prev.y + (y - dragStart.y)
      }))
    }
  }, [isDragging, currentElement, activeTool, dragStart, pan, zoom, isSelectionBox, isDraggingElement, whiteboardId, getSelectedElements, batchUpdateElements])

  const handleCanvasMouseUp = useCallback(async () => {
    // Finalize selection box
    if (isSelectionBox && whiteboard) {
      const minX = Math.min(selectionBoxStart.x, selectionBoxEnd.x)
      const minY = Math.min(selectionBoxStart.y, selectionBoxEnd.y)
      const maxX = Math.max(selectionBoxStart.x, selectionBoxEnd.x)
      const maxY = Math.max(selectionBoxStart.y, selectionBoxEnd.y)

      const selected = whiteboard.elements.filter(el => {
        const { position, size } = el
        const elCenterX = position.x + size.width / 2
        const elCenterY = position.y + size.height / 2

        return elCenterX >= minX && elCenterX <= maxX &&
               elCenterY >= minY && elCenterY <= maxY
      })

      setSelectedElements(selected.map(el => el.id))
      setIsSelectionBox(false)
      setIsDragging(false)
      return
    }

    // Finalize element dragging
    if (isDraggingElement) {
      setIsDraggingElement(false)
      setIsDragging(false)
      return
    }

    if (!whiteboardId || !currentElement) {
      setIsDragging(false)
      return
    }

    // Add element to whiteboard
    // For DRAWING elements, check if we have enough points (at least 2)
    // For other elements, check if size is big enough
    const isValidDrawing = currentElement.type === ELEMENT_TYPES.DRAWING &&
                          currentElement.data?.points?.length >= 2
    const isValidShape = currentElement.type !== ELEMENT_TYPES.DRAWING &&
                        (currentElement.size!.width > 5 || currentElement.size!.height > 5)

    if (isValidDrawing || isValidShape) {
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
  }, [whiteboardId, currentElement, addElement, isSelectionBox, isDraggingElement, selectionBoxStart, selectionBoxEnd, whiteboard])

  // Delete selected elements
  const handleDeleteSelected = useCallback(async () => {
    if (!whiteboardId || selectedElements.length === 0) return
    
    for (const elementId of selectedElements) {
      await deleteElement({ whiteboardId, elementId })
    }
    setSelectedElements([])
  }, [whiteboardId, selectedElements, deleteElement])

  // Export to SVG
  const exportToSVG = useCallback(async () => {
    if (!svgRef.current || !whiteboard || !whiteboardId) return

    setIsExporting(true)
    setShowExportMenu(false)

    try {
      // Calculate content bounds with padding
      const bounds = calculateContentBounds(whiteboard.elements)
      if (!bounds) {
        alert('No content to export')
        return
      }

      const padding = 20
      const width = bounds.maxX - bounds.minX + (padding * 2)
      const height = bounds.maxY - bounds.minY + (padding * 2)
      const viewBox = `${bounds.minX - padding} ${bounds.minY - padding} ${width} ${height}`

      // Clone the SVG
      const svgClone = svgRef.current.cloneNode(true) as SVGElement
      svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      svgClone.setAttribute('viewBox', viewBox)
      svgClone.setAttribute('width', width.toString())
      svgClone.setAttribute('height', height.toString())

      // Remove transform (zoom/pan) from clone
      svgClone.style.transform = ''

      // Remove class names and event handlers
      const allElements = svgClone.querySelectorAll('*')
      allElements.forEach(el => {
        el.removeAttribute('class')
        el.removeAttribute('onclick')
      })

      // Embed font
      const fontStyle = document.createElement('style')
      fontStyle.textContent = `
        @font-face {
          font-family: 'IBM Plex Mono';
          src: url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&display=swap');
        }
        @font-face {
          font-family: 'SpaceMono';
          src: url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        }
      `
      svgClone.insertBefore(fontStyle, svgClone.firstChild)

      // Serialize SVG
      const serializer = new XMLSerializer()
      let svgString = serializer.serializeToString(svgClone)

      // Add XML declaration
      svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString

      // Create blob and download
      const blob = new Blob([svgString], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `whiteboard-${whiteboardId}-${Date.now()}.svg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('SVG export failed:', error)
      alert('Failed to export SVG. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }, [whiteboard, whiteboardId])

  // Export to PNG
  const exportToPNG = useCallback(async (resolution: number = 2) => {
    if (!svgRef.current || !whiteboard || !whiteboardId) return

    setIsExporting(true)
    setShowExportMenu(false)

    try {
      // Calculate content bounds with padding
      const bounds = calculateContentBounds(whiteboard.elements)
      if (!bounds) {
        alert('No content to export')
        return
      }

      const padding = 20
      const width = bounds.maxX - bounds.minX + (padding * 2)
      const height = bounds.maxY - bounds.minY + (padding * 2)
      const viewBox = `${bounds.minX - padding} ${bounds.minY - padding} ${width} ${height}`

      // Clone the SVG
      const svgClone = svgRef.current.cloneNode(true) as SVGElement
      svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      svgClone.setAttribute('viewBox', viewBox)
      svgClone.setAttribute('width', width.toString())
      svgClone.setAttribute('height', height.toString())

      // Remove transform (zoom/pan) from clone
      svgClone.style.transform = ''

      // Remove class names and event handlers
      const allElements = svgClone.querySelectorAll('*')
      allElements.forEach(el => {
        el.removeAttribute('class')
        el.removeAttribute('onclick')
      })

      // Serialize SVG
      const serializer = new XMLSerializer()
      const svgString = serializer.serializeToString(svgClone)

      // Create data URL
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
      const svgUrl = URL.createObjectURL(svgBlob)

      // Create image and load SVG
      const img = new Image()
      img.onload = () => {
        // Create canvas with resolution scaling
        const canvas = document.createElement('canvas')
        canvas.width = width * resolution
        canvas.height = height * resolution

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          alert('Failed to create canvas context')
          return
        }

        // Scale canvas for resolution
        ctx.scale(resolution, resolution)

        // Draw white background
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)

        // Draw image
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to blob and download
        canvas.toBlob((blob) => {
          if (!blob) {
            alert('Failed to create PNG')
            return
          }

          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `whiteboard-${whiteboardId}-${Date.now()}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
          URL.revokeObjectURL(svgUrl)

          setIsExporting(false)
        }, 'image/png')
      }

      img.onerror = () => {
        alert('Failed to load SVG for PNG conversion')
        URL.revokeObjectURL(svgUrl)
        setIsExporting(false)
      }

      img.src = svgUrl
    } catch (error) {
      console.error('PNG export failed:', error)
      alert('Failed to export PNG. Please try again.')
      setIsExporting(false)
    }
  }, [whiteboard, whiteboardId])

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

  // Handle style changes from StylePropertiesPanel
  const handleStyleChange = useCallback(async (elementIds: string[], styleChanges: any) => {
    if (!whiteboardId) return

    const updates = elementIds.map(elementId => ({
      elementId,
      updates: {
        style: {
          ...whiteboard?.elements.find(el => el.id === elementId)?.style,
          ...styleChanges
        }
      }
    }))

    await batchUpdateElements({ whiteboardId, updates })
  }, [whiteboardId, whiteboard, batchUpdateElements])

  // Text editing handlers
  const handleTextDoubleClick = useCallback((element: Element) => {
    setEditingTextElement(element)
    setShowTextFormattingControls(true)
  }, [])

  const handleTextSave = useCallback(async (text: string) => {
    if (!whiteboardId || !editingTextElement) return

    await updateElement({
      whiteboardId,
      elementId: editingTextElement.id,
      updates: {
        data: { ...editingTextElement.data, text }
      }
    })

    setEditingTextElement(null)
    setShowTextFormattingControls(false)
  }, [whiteboardId, editingTextElement, updateElement])

  const handleTextCancel = useCallback(() => {
    setEditingTextElement(null)
    setShowTextFormattingControls(false)
  }, [])

  // Text formatting handlers
  const handleTextFormatChange = useCallback(async (changes: any) => {
    if (!whiteboardId || !editingTextElement) return

    await updateElement({
      whiteboardId,
      elementId: editingTextElement.id,
      updates: {
        style: {
          ...editingTextElement.style,
          ...changes
        }
      }
    })
  }, [whiteboardId, editingTextElement, updateElement])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleImageUpload])

  const handleImageButtonClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // Grouping functions
  const handleGroupElements = useCallback(() => {
    if (selectedElements.length < 2) return
    setGroups(prev => [...prev, [...selectedElements]])
  }, [selectedElements])

  const handleUngroupElements = useCallback(() => {
    if (selectedElements.length === 0) return
    setGroups(prev => prev.filter(group =>
      !group.some(id => selectedElements.includes(id))
    ))
  }, [selectedElements])

  // Alignment functions
  const handleAlignLeft = useCallback(async () => {
    const selected = getSelectedElements()
    if (selected.length < 2 || !whiteboardId) return

    const bounds = calculateSelectionBounds(selected)
    if (!bounds) return

    const updates = selected.map(el => ({
      elementId: el.id,
      updates: { position: { x: bounds.x, y: el.position.y } }
    }))

    await batchUpdateElements({ whiteboardId, updates })
  }, [getSelectedElements, whiteboardId, batchUpdateElements])

  const handleAlignRight = useCallback(async () => {
    const selected = getSelectedElements()
    if (selected.length < 2 || !whiteboardId) return

    const bounds = calculateSelectionBounds(selected)
    if (!bounds) return

    const rightEdge = bounds.x + bounds.width

    const updates = selected.map(el => ({
      elementId: el.id,
      updates: { position: { x: rightEdge - el.size.width, y: el.position.y } }
    }))

    await batchUpdateElements({ whiteboardId, updates })
  }, [getSelectedElements, whiteboardId, batchUpdateElements])

  const handleAlignTop = useCallback(async () => {
    const selected = getSelectedElements()
    if (selected.length < 2 || !whiteboardId) return

    const bounds = calculateSelectionBounds(selected)
    if (!bounds) return

    const updates = selected.map(el => ({
      elementId: el.id,
      updates: { position: { x: el.position.x, y: bounds.y } }
    }))

    await batchUpdateElements({ whiteboardId, updates })
  }, [getSelectedElements, whiteboardId, batchUpdateElements])

  const handleAlignBottom = useCallback(async () => {
    const selected = getSelectedElements()
    if (selected.length < 2 || !whiteboardId) return

    const bounds = calculateSelectionBounds(selected)
    if (!bounds) return

    const bottomEdge = bounds.y + bounds.height

    const updates = selected.map(el => ({
      elementId: el.id,
      updates: { position: { x: el.position.x, y: bottomEdge - el.size.height } }
    }))

    await batchUpdateElements({ whiteboardId, updates })
  }, [getSelectedElements, whiteboardId, batchUpdateElements])

  const handleAlignCenterH = useCallback(async () => {
    const selected = getSelectedElements()
    if (selected.length < 2 || !whiteboardId) return

    const bounds = calculateSelectionBounds(selected)
    if (!bounds) return

    const centerY = bounds.y + bounds.height / 2

    const updates = selected.map(el => ({
      elementId: el.id,
      updates: { position: { x: el.position.x, y: centerY - el.size.height / 2 } }
    }))

    await batchUpdateElements({ whiteboardId, updates })
  }, [getSelectedElements, whiteboardId, batchUpdateElements])

  const handleAlignCenterV = useCallback(async () => {
    const selected = getSelectedElements()
    if (selected.length < 2 || !whiteboardId) return

    const bounds = calculateSelectionBounds(selected)
    if (!bounds) return

    const centerX = bounds.x + bounds.width / 2

    const updates = selected.map(el => ({
      elementId: el.id,
      updates: { position: { x: centerX - el.size.width / 2, y: el.position.y } }
    }))

    await batchUpdateElements({ whiteboardId, updates })
  }, [getSelectedElements, whiteboardId, batchUpdateElements])

  // Context menu handlers
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = (e.clientX - rect.left - pan.x) / (zoom / 100)
    const y = (e.clientY - rect.top - pan.y) / (zoom / 100)

    // Check if clicking on an element
    const clickedElement = whiteboard?.elements.find(el => {
      const { position, size } = el
      return x >= position.x && x <= position.x + size.width &&
             y >= position.y && y <= position.y + size.height
    })

    if (clickedElement) {
      setSelectedElements([clickedElement.id])
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        options: createElementContextMenu(
          clickedElement,
          clickedElement.locked,
          () => setCopiedElement(clickedElement),
          () => {
            // Duplicate element
            if (!whiteboardId) return
            addElement({
              whiteboardId,
              element: {
                ...clickedElement,
                position: {
                  x: clickedElement.position.x + 20,
                  y: clickedElement.position.y + 20
                }
              }
            })
          },
          () => {
            // Delete element
            if (!whiteboardId) return
            deleteElement({ whiteboardId, elementId: clickedElement.id })
            setSelectedElements([])
          },
          () => {
            // Toggle lock
            if (!whiteboardId) return
            updateElement({
              whiteboardId,
              elementId: clickedElement.id,
              updates: { locked: !clickedElement.locked }
            })
          },
          () => {
            // Bring forward
            console.log('Bring forward not implemented yet')
          },
          () => {
            // Send backward
            console.log('Send backward not implemented yet')
          }
        )
      })
    } else {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        options: createCanvasContextMenu(
          () => {
            // Paste
            if (!copiedElement || !whiteboardId) return
            const rect = canvasRef.current?.getBoundingClientRect()
            if (!rect) return
            const x = (e.clientX - rect.left - pan.x) / (zoom / 100)
            const y = (e.clientY - rect.top - pan.y) / (zoom / 100)
            addElement({
              whiteboardId,
              element: {
                ...copiedElement,
                position: { x, y }
              }
            })
          },
          () => {
            // Select all
            if (!whiteboard) return
            setSelectedElements(whiteboard.elements.map(el => el.id))
          },
          () => {
            // Fit to view
            if (!whiteboard || !canvasRef.current) return
            const bounds = calculateContentBounds(whiteboard.elements)
            if (!bounds) return

            const rect = canvasRef.current.getBoundingClientRect()
            const padding = 50
            const contentWidth = bounds.maxX - bounds.minX + padding * 2
            const contentHeight = bounds.maxY - bounds.minY + padding * 2

            const scaleX = rect.width / contentWidth
            const scaleY = rect.height / contentHeight
            const newZoom = Math.min(scaleX, scaleY) * 100

            setZoom(Math.max(25, Math.min(200, newZoom)))
            setPan({
              x: -(bounds.minX - padding) * (newZoom / 100),
              y: -(bounds.minY - padding) * (newZoom / 100)
            })
          },
          !!copiedElement
        )
      })
    }
  }, [whiteboard, pan, zoom, copiedElement, whiteboardId, addElement, deleteElement, updateElement])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Zen mode toggle (F11 or Z)
      if (e.key === 'F11' || (e.key === 'z' && !e.ctrlKey && !e.metaKey)) {
        e.preventDefault()
        setZenMode(prev => !prev)
        return
      }

      // Group (Ctrl/Cmd + G)
      if ((e.ctrlKey || e.metaKey) && e.key === 'g' && !e.shiftKey) {
        e.preventDefault()
        handleGroupElements()
        return
      }

      // Ungroup (Ctrl/Cmd + Shift + G)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'G') {
        e.preventDefault()
        handleUngroupElements()
        return
      }

      // Copy (Ctrl/Cmd + C)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        const selected = getSelectedElements()
        if (selected.length > 0) {
          setCopiedElement(selected[0])
        }
        return
      }

      // Paste (Ctrl/Cmd + V)
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        if (copiedElement && whiteboardId && canvasRef.current) {
          const rect = canvasRef.current.getBoundingClientRect()
          addElement({
            whiteboardId,
            element: {
              ...copiedElement,
              position: {
                x: copiedElement.position.x + 20,
                y: copiedElement.position.y + 20
              }
            }
          })
        }
        return
      }

      // Duplicate (Ctrl/Cmd + D)
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault()
        const selected = getSelectedElements()
        if (selected.length > 0 && whiteboardId) {
          selected.forEach(el => {
            addElement({
              whiteboardId,
              element: {
                ...el,
                position: {
                  x: el.position.x + 20,
                  y: el.position.y + 20
                }
              }
            })
          })
        }
        return
      }

      // Delete (Delete or Backspace)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected()
        return
      }

      // Select All (Ctrl/Cmd + A)
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault()
        if (whiteboard) {
          setSelectedElements(whiteboard.elements.map(el => el.id))
        }
        return
      }

      // Nudging with arrow keys
      const NUDGE_AMOUNT = e.shiftKey ? 10 : 1
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        const selected = getSelectedElements()
        if (selected.length === 0 || !whiteboardId) return

        const updates = selected.map(el => {
          let newX = el.position.x
          let newY = el.position.y

          if (e.key === 'ArrowUp') newY -= NUDGE_AMOUNT
          if (e.key === 'ArrowDown') newY += NUDGE_AMOUNT
          if (e.key === 'ArrowLeft') newX -= NUDGE_AMOUNT
          if (e.key === 'ArrowRight') newX += NUDGE_AMOUNT

          return {
            elementId: el.id,
            updates: { position: { x: newX, y: newY } }
          }
        })

        batchUpdateElements({ whiteboardId, updates })
        return
      }

      // Toggle Style Panel (Ctrl/Cmd + E)
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault()
        setShowStylePanel(prev => !prev)
        return
      }

      // Ctrl+0: Reset zoom
      if (e.ctrlKey && e.key === '0') {
        e.preventDefault()
        handleResetZoom()
        return
      }

      // Ctrl+1: Zoom to fit
      if (e.ctrlKey && e.key === '1') {
        e.preventDefault()
        handleZoomToFit()
        return
      }

      // Ctrl+2: Zoom to selection
      if (e.ctrlKey && e.key === '2') {
        e.preventDefault()
        if (selectedElements.length > 0) {
          handleZoomToSelection()
        }
        return
      }

      // Ctrl++: Zoom in
      if (e.ctrlKey && (e.key === '+' || e.key === '=')) {
        e.preventDefault()
        setZoom(prev => Math.min(400, prev + 25))
        return
      }

      // Ctrl+-: Zoom out
      if (e.ctrlKey && (e.key === '-' || e.key === '_')) {
        e.preventDefault()
        setZoom(prev => Math.max(10, prev - 25))
        return
      }

      // Escape - clear selection and close panels
      if (e.key === 'Escape') {
        setSelectedElements([])
        setContextMenu(null)
        setShowPropertiesPanel(false)
        setShowStylePanel(false)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [copiedElement, whiteboardId, getSelectedElements, handleDeleteSelected, whiteboard, handleGroupElements, handleUngroupElements, batchUpdateElements, addElement, selectedElements, handleResetZoom, handleZoomToFit, handleZoomToSelection])

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

  // Update cursor position for status bar
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - pan.x) / (zoom / 100)
      const y = (e.clientY - rect.top - pan.y) / (zoom / 100)
      setCursorPosition({ x, y })
    }

    const handleMouseLeave = () => {
      setCursorPosition(null)
    }

    canvasRef.current?.addEventListener('mousemove', handleMouseMove)
    canvasRef.current?.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      canvasRef.current?.removeEventListener('mousemove', handleMouseMove)
      canvasRef.current?.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [pan, zoom])

  // Auto-open properties panel when elements selected
  useEffect(() => {
    if (selectedElements.length > 0 && !zenMode) {
      setShowPropertiesPanel(true)
      setShowStylePanel(true)
    } else if (selectedElements.length === 0) {
      setShowPropertiesPanel(false)
      setShowStylePanel(false)
    }
  }, [selectedElements.length, zenMode])

  // Load zen mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('whiteboard-zen-mode')
    if (saved === 'true') {
      setZenMode(true)
    }
  }, [])

  // Save zen mode to localStorage
  useEffect(() => {
    localStorage.setItem('whiteboard-zen-mode', zenMode.toString())
  }, [zenMode])

  // Render element
  const renderElement = (element: Element | Partial<Element>, isPreview = false) => {
    const { id, type, data, position, size, style, locked } = element
    const isSelected = id ? selectedElements.includes(id) : false
    const elementId = id || 'preview'
    
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
              fill={getFillValue(style)}
              fillOpacity={style.fillOpacity ?? 1}
              stroke={isSelected ? '#FF00FF' : style.stroke}
              strokeWidth={isSelected ? (style.strokeWidth || 2) + 1 : (style.strokeWidth || 2)}
              strokeOpacity={style.strokeOpacity ?? 1}
              strokeDasharray={getStrokeDashArray(style.strokeStyle || 'solid')}
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
              fill={getFillValue(style)}
              fillOpacity={style.fillOpacity ?? 1}
              stroke={isSelected ? '#FF00FF' : style.stroke}
              strokeWidth={isSelected ? (style.strokeWidth || 2) + 1 : (style.strokeWidth || 2)}
              strokeOpacity={style.strokeOpacity ?? 1}
              strokeDasharray={getStrokeDashArray(style.strokeStyle || 'solid')}
              opacity={style.opacity || 1}
              className={`cursor-pointer ${locked ? 'pointer-events-none' : ''}`}
              onClick={() => setSelectedElements([id])}
            />
          )
        } else if (data.shape === SHAPE_TYPES.DIAMOND) {
          // Diamond: Rotated square with 4 points (top, right, bottom, left)
          const centerX = position.x + size.width / 2
          const centerY = position.y + size.height / 2
          const points = [
            `${centerX},${position.y}`,                    // Top
            `${position.x + size.width},${centerY}`,      // Right
            `${centerX},${position.y + size.height}`,     // Bottom
            `${position.x},${centerY}`                     // Left
          ].join(' ')

          return (
            <polygon
              key={id}
              points={points}
              fill={getFillValue(style)}
              fillOpacity={style.fillOpacity ?? 1}
              stroke={isSelected ? '#FF00FF' : style.stroke}
              strokeWidth={isSelected ? (style.strokeWidth || 2) + 1 : (style.strokeWidth || 2)}
              strokeOpacity={style.strokeOpacity ?? 1}
              strokeDasharray={getStrokeDashArray(style.strokeStyle || 'solid')}
              opacity={style.opacity || 1}
              className={`cursor-pointer ${locked ? 'pointer-events-none' : ''}`}
              onClick={() => setSelectedElements([id])}
            />
          )
        } else if (data.shape === SHAPE_TYPES.TRIANGLE) {
          // Triangle: Equilateral triangle with 3 points (top, bottom-left, bottom-right)
          const centerX = position.x + size.width / 2
          const points = [
            `${centerX},${position.y}`,                        // Top center
            `${position.x},${position.y + size.height}`,      // Bottom left
            `${position.x + size.width},${position.y + size.height}` // Bottom right
          ].join(' ')

          return (
            <polygon
              key={id}
              points={points}
              fill={getFillValue(style)}
              fillOpacity={style.fillOpacity ?? 1}
              stroke={isSelected ? '#FF00FF' : style.stroke}
              strokeWidth={isSelected ? (style.strokeWidth || 2) + 1 : (style.strokeWidth || 2)}
              strokeOpacity={style.strokeOpacity ?? 1}
              strokeDasharray={getStrokeDashArray(style.strokeStyle || 'solid')}
              opacity={style.opacity || 1}
              className={`cursor-pointer ${locked ? 'pointer-events-none' : ''}`}
              onClick={() => setSelectedElements([id])}
            />
          )
        } else if (data.shape === SHAPE_TYPES.ARROW) {
          // Arrow: Pointing right with shaft and arrowhead (7 points)
          const shaftHeight = size.height / 3
          const shaftEnd = position.x + (size.width * 2 / 3)
          const centerY = position.y + size.height / 2

          const points = [
            `${position.x},${position.y + shaftHeight}`,           // Shaft top-left
            `${shaftEnd},${position.y + shaftHeight}`,             // Shaft top-right
            `${shaftEnd},${position.y}`,                           // Arrowhead top
            `${position.x + size.width},${centerY}`,               // Arrowhead tip
            `${shaftEnd},${position.y + size.height}`,             // Arrowhead bottom
            `${shaftEnd},${position.y + size.height - shaftHeight}`, // Shaft bottom-right
            `${position.x},${position.y + size.height - shaftHeight}`  // Shaft bottom-left
          ].join(' ')

          return (
            <polygon
              key={id}
              points={points}
              fill={getFillValue(style)}
              fillOpacity={style.fillOpacity ?? 1}
              stroke={isSelected ? '#FF00FF' : style.stroke}
              strokeWidth={isSelected ? (style.strokeWidth || 2) + 1 : (style.strokeWidth || 2)}
              strokeOpacity={style.strokeOpacity ?? 1}
              strokeDasharray={getStrokeDashArray(style.strokeStyle || 'solid')}
              opacity={style.opacity || 1}
              className={`cursor-pointer ${locked ? 'pointer-events-none' : ''}`}
              onClick={() => setSelectedElements([id])}
            />
          )
        } else if (data.shape === SHAPE_TYPES.STAR) {
          // Star: 5-pointed star with 10 points (5 outer, 5 inner)
          // Using golden ratio for inner radius: 0.382
          const centerX = position.x + size.width / 2
          const centerY = position.y + size.height / 2
          const outerRadius = Math.min(size.width, size.height) / 2
          const innerRadius = outerRadius * 0.382

          // Generate 10 points: alternating outer and inner points
          // Start from top (-90 degrees) and go clockwise
          const points: string[] = []
          for (let i = 0; i < 10; i++) {
            const angle = (Math.PI * 2 * i / 10) - Math.PI / 2 // Start from top
            const radius = i % 2 === 0 ? outerRadius : innerRadius
            const x = centerX + radius * Math.cos(angle)
            const y = centerY + radius * Math.sin(angle)
            points.push(`${x},${y}`)
          }

          return (
            <polygon
              key={id}
              points={points.join(' ')}
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
        // Split text into lines for multi-line rendering
        const textLines = (data.text || '').split('\n')
        const lineHeight = (style.fontSize || 16) * 1.4

        return (
          <text
            key={id}
            x={position.x}
            y={position.y + (style.fontSize || 16)}
            fontSize={style.fontSize || 16}
            fontFamily={style.fontFamily || 'IBM Plex Mono, monospace'}
            fontWeight={style.fontWeight || 'normal'}
            fontStyle={style.fontStyle || 'normal'}
            textDecoration={style.textDecoration || 'none'}
            textAnchor={style.textAlign || 'left'}
            fill={isSelected ? '#FF00FF' : style.color || '#000000'}
            className={`cursor-pointer ${locked ? 'pointer-events-none' : ''}`}
            onClick={() => setSelectedElements([id])}
            onDoubleClick={() => handleTextDoubleClick(element)}
          >
            {textLines.map((line, index) => (
              <tspan
                key={index}
                x={position.x}
                dy={index === 0 ? 0 : lineHeight}
              >
                {line || ' '}
              </tspan>
            ))}
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

      case ELEMENT_TYPES.DRAWING:
        // Render freehand drawing path
        if (!data?.points || data.points.length < 2) {
          return null
        }

        const pathData = data.points
          .map((point: number[], index: number) => {
            const [x, y] = point
            return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
          })
          .join(' ')

        return (
          <path
            key={elementId}
            d={pathData}
            fill="none"
            stroke={isSelected ? '#FF00FF' : (style?.stroke || '#FFFFFF')}
            strokeWidth={isSelected ? (style?.strokeWidth || 2) + 1 : (style?.strokeWidth || 2)}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={isPreview ? 0.7 : (style?.opacity || 1)}
            className={`cursor-pointer ${locked ? 'pointer-events-none' : ''}`}
            onClick={() => !isPreview && id && setSelectedElements([id])}
          />
        )

      case ELEMENT_TYPES.IMAGE:
        return (
          <g key={id}>
            <image
              href={data.url || `https://via.placeholder.com/${size.width}x${size.height}`}
              x={position.x}
              y={position.y}
              width={size.width}
              height={size.height}
              opacity={style.opacity || 1}
              className={`cursor-pointer ${locked ? 'pointer-events-none' : ''}`}
              onClick={() => setSelectedElements([id])}
              preserveAspectRatio="none"
            />
            {isSelected && (
              <rect
                x={position.x}
                y={position.y}
                width={size.width}
                height={size.height}
                fill="none"
                stroke="#FF00FF"
                strokeWidth={2}
                strokeDasharray="5,5"
              />
            )}
          </g>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex" onContextMenu={handleContextMenu}>
      {/* Zen Mode Toggle - Always visible */}
      {zenMode && (
        <button
          onClick={() => setZenMode(false)}
          className="fixed top-4 right-4 bg-black/50 border-2 border-white/50 p-2 hover:bg-black hover:border-white z-50"
          title="Exit Zen Mode (F11 or Z)"
        >
          <HiOutlineX className="w-5 h-5 text-white" />
        </button>
      )}

      {/* Toolbar */}
      {!zenMode && (
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
          <SquareIcon className="w-5 h-5 text-white" />
        </button>
        
        <button
          onClick={() => setActiveTool('CIRCLE')}
          className={`p-2 border-2 ${activeTool === 'CIRCLE' ? 'border-cyan-400 bg-cyan-400/20' : 'border-white'} hover:bg-white/10`}
          title="Circle"
        >
          <CircleIcon className="w-5 h-5 text-white" />
        </button>
        
        <button
          onClick={() => setActiveTool('DRAWING')}
          className={`p-2 border-2 ${activeTool === 'DRAWING' ? 'border-cyan-400 bg-cyan-400/20' : 'border-white'} hover:bg-white/10`}
          title="Draw (Freehand)"
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
          onClick={handleImageButtonClick}
          disabled={isUploadingImage}
          className="p-2 border-2 border-white hover:bg-white/10 disabled:opacity-50"
          title="Upload Image (or drag & drop / paste)"
        >
          {isUploadingImage ? (
            <span className="text-white text-xs">...</span>
          ) : (
            <HiOutlineCamera className="w-5 h-5 text-white" />
          )}
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
      )}

      {/* Top Controls */}
      {!zenMode && (
        <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
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
        <div className="relative">
          <div className="bg-black border-2 border-white p-2">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-1 hover:bg-white/10 disabled:opacity-50"
              title="Export"
              disabled={isExporting}
            >
              {isExporting ? (
                <span className="text-white text-sm">...</span>
              ) : (
                <HiOutlineDownload className="w-5 h-5 text-white" />
              )}
            </button>
          </div>

          {/* Export Dropdown */}
          {showExportMenu && !isExporting && (
            <>
              {/* Backdrop to close menu */}
              <div
                className="fixed inset-0 z-20"
                onClick={() => setShowExportMenu(false)}
              />

              {/* Menu */}
              <div className="absolute right-0 top-full mt-1 bg-black border-2 border-white min-w-48 z-30">
                <button
                  onClick={() => exportToPNG(2)}
                  className="w-full px-4 py-2 text-left text-white font-mono text-sm uppercase border-b-2 border-white hover:bg-white/10"
                >
                  PNG (2X)
                </button>
                <button
                  onClick={() => exportToPNG(1)}
                  className="w-full px-4 py-2 text-left text-white font-mono text-sm uppercase border-b-2 border-white hover:bg-white/10"
                >
                  PNG (1X)
                </button>
                <button
                  onClick={() => exportToPNG(3)}
                  className="w-full px-4 py-2 text-left text-white font-mono text-sm uppercase border-b-2 border-white hover:bg-white/10"
                >
                  PNG (3X)
                </button>
                <button
                  onClick={exportToSVG}
                  className="w-full px-4 py-2 text-left text-white font-mono text-sm uppercase hover:bg-white/10"
                >
                  SVG
                </button>
              </div>
            </>
          )}
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

        {/* Zen Mode Toggle */}
        <button
          onClick={() => setZenMode(true)}
          className="bg-black border-2 border-white p-2 hover:bg-cyan-400/20"
          title="Zen Mode (F11 or Z)"
        >
          <span className="text-white font-['IBM_Plex_Mono'] text-xs">ZEN</span>
        </button>
        </div>
      )}

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
            transformOrigin: '0 0',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {/* SVG Pattern Definitions */}
          <SVGPatterns />

          {/* Render whiteboard elements (with viewport culling) */}
          {visibleElements.map(renderElement)}

          {/* Render current element being drawn (preview) */}
          {currentElement && renderElement(currentElement as Element, true)}

          {/* Selection box */}
          {isSelectionBox && (
            <rect
              x={Math.min(selectionBoxStart.x, selectionBoxEnd.x)}
              y={Math.min(selectionBoxStart.y, selectionBoxEnd.y)}
              width={Math.abs(selectionBoxEnd.x - selectionBoxStart.x)}
              height={Math.abs(selectionBoxEnd.y - selectionBoxStart.y)}
              fill="rgba(0, 255, 255, 0.1)"
              stroke="#00FFFF"
              strokeWidth={2}
              strokeDasharray="5,5"
            />
          )}

          {/* Bounding box with handles for selection */}
          {selectedElements.length > 0 && !isSelectionBox && (() => {
            const selected = getSelectedElements()
            const bounds = calculateSelectionBounds(selected)
            if (!bounds) return null

            const handleSize = 8
            const handles = [
              { x: bounds.x, y: bounds.y, cursor: 'nw-resize', id: 'nw' },
              { x: bounds.x + bounds.width / 2, y: bounds.y, cursor: 'n-resize', id: 'n' },
              { x: bounds.x + bounds.width, y: bounds.y, cursor: 'ne-resize', id: 'ne' },
              { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2, cursor: 'e-resize', id: 'e' },
              { x: bounds.x + bounds.width, y: bounds.y + bounds.height, cursor: 'se-resize', id: 'se' },
              { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height, cursor: 's-resize', id: 's' },
              { x: bounds.x, y: bounds.y + bounds.height, cursor: 'sw-resize', id: 'sw' },
              { x: bounds.x, y: bounds.y + bounds.height / 2, cursor: 'w-resize', id: 'w' },
            ]

            return (
              <g>
                {/* Bounding box */}
                <rect
                  x={bounds.x}
                  y={bounds.y}
                  width={bounds.width}
                  height={bounds.height}
                  fill="none"
                  stroke="#FF00FF"
                  strokeWidth={2}
                  strokeDasharray="5,5"
                />

                {/* Resize handles */}
                {handles.map(handle => (
                  <rect
                    key={handle.id}
                    x={handle.x - handleSize / 2}
                    y={handle.y - handleSize / 2}
                    width={handleSize}
                    height={handleSize}
                    fill="#FFFFFF"
                    stroke="#FF00FF"
                    strokeWidth={2}
                    className="cursor-pointer"
                    style={{ cursor: handle.cursor }}
                  />
                ))}

                {/* Rotation handle */}
                <line
                  x1={bounds.x + bounds.width / 2}
                  y1={bounds.y}
                  x2={bounds.x + bounds.width / 2}
                  y2={bounds.y - 30}
                  stroke="#FF00FF"
                  strokeWidth={2}
                />
                <circle
                  cx={bounds.x + bounds.width / 2}
                  cy={bounds.y - 30}
                  r={6}
                  fill="#FFFFFF"
                  stroke="#FF00FF"
                  strokeWidth={2}
                  className="cursor-pointer"
                  style={{ cursor: 'grab' }}
                />
              </g>
            )
          })()}

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

        {/* Minimap - Infinite Canvas Navigation */}
        {!zenMode && contentBounds && (
          <div
            className="absolute bottom-4 right-4 bg-black border-2 border-white"
            style={{ width: 150, height: 100 }}
            onClick={(e) => {
              if (!canvasRef.current || !contentBounds) return

              const rect = e.currentTarget.getBoundingClientRect()
              const clickX = e.clientX - rect.left
              const clickY = e.clientY - rect.top

              // Calculate minimap scale
              const MINIMAP_PADDING = 10
              const contentWidth = contentBounds.maxX - contentBounds.minX
              const contentHeight = contentBounds.maxY - contentBounds.minY
              const minimapScale = Math.min(
                (150 - MINIMAP_PADDING * 2) / contentWidth,
                (100 - MINIMAP_PADDING * 2) / contentHeight
              )

              // Transform click coordinates to canvas coordinates
              const canvasX = contentBounds.minX + (clickX - MINIMAP_PADDING) / minimapScale
              const canvasY = contentBounds.minY + (clickY - MINIMAP_PADDING) / minimapScale

              // Calculate new pan to center clicked point
              const canvasRect = canvasRef.current.getBoundingClientRect()
              const scale = zoom / 100
              const newPan = {
                x: canvasRect.width / 2 - canvasX * scale,
                y: canvasRect.height / 2 - canvasY * scale
              }

              setPan(newPan)
            }}
          >
            <svg width={150} height={100} className="cursor-pointer">
              {/* Render all elements as simplified white outlines */}
              {whiteboard?.elements.map(element => {
                const MINIMAP_PADDING = 10
                const contentWidth = contentBounds.maxX - contentBounds.minX
                const contentHeight = contentBounds.maxY - contentBounds.minY
                const minimapScale = Math.min(
                  (150 - MINIMAP_PADDING * 2) / contentWidth,
                  (100 - MINIMAP_PADDING * 2) / contentHeight
                )

                const x = (element.position.x - contentBounds.minX) * minimapScale + MINIMAP_PADDING
                const y = (element.position.y - contentBounds.minY) * minimapScale + MINIMAP_PADDING
                const width = element.size.width * minimapScale
                const height = element.size.height * minimapScale

                return (
                  <rect
                    key={element.id}
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill="none"
                    stroke="white"
                    strokeWidth={1}
                    opacity={0.6}
                  />
                )
              })}

              {/* Viewport indicator (cyan rectangle) */}
              {(() => {
                if (!canvasRef.current) return null

                const MINIMAP_PADDING = 10
                const contentWidth = contentBounds.maxX - contentBounds.minX
                const contentHeight = contentBounds.maxY - contentBounds.minY
                const minimapScale = Math.min(
                  (150 - MINIMAP_PADDING * 2) / contentWidth,
                  (100 - MINIMAP_PADDING * 2) / contentHeight
                )

                const canvasRect = canvasRef.current.getBoundingClientRect()
                const scale = zoom / 100

                // Calculate viewport bounds in canvas coordinates
                const viewMinX = -pan.x / scale
                const viewMinY = -pan.y / scale
                const viewMaxX = (canvasRect.width - pan.x) / scale
                const viewMaxY = (canvasRect.height - pan.y) / scale

                // Transform to minimap coordinates
                const minimapX = (viewMinX - contentBounds.minX) * minimapScale + MINIMAP_PADDING
                const minimapY = (viewMinY - contentBounds.minY) * minimapScale + MINIMAP_PADDING
                const minimapWidth = (viewMaxX - viewMinX) * minimapScale
                const minimapHeight = (viewMaxY - viewMinY) * minimapScale

                return (
                  <rect
                    x={minimapX}
                    y={minimapY}
                    width={minimapWidth}
                    height={minimapHeight}
                    fill="cyan"
                    fillOpacity={0.2}
                    stroke="#00FFFF"
                    strokeWidth={1}
                  />
                )
              })()}
            </svg>
          </div>
        )}
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
      {!zenMode && (
        <div className="absolute bottom-4 left-4 bg-black border-2 border-white p-2 z-10">
          <p className="text-white font-mono text-sm">{whiteboard?.name}</p>
          <p className="text-gray-400 font-mono text-xs">
            {whiteboard?.elements.length || 0} elements · {visibleElements.length} visible · Version {whiteboard?.version || 1} · {Math.round(zoom)}% zoom
          </p>
        </div>
      )}

      {/* Properties Panel */}
      {showPropertiesPanel && !zenMode && (
        <PropertiesPanel
          selectedElements={getSelectedElements()}
          onUpdateElement={(elementId, updates) => {
            if (!whiteboardId) return
            updateElement({ whiteboardId, elementId, updates })
          }}
          onDeleteElements={handleDeleteSelected}
          onClose={() => setShowPropertiesPanel(false)}
        />
      )}

      {/* Style Properties Panel */}
      {showStylePanel && !zenMode && whiteboard && (
        <StylePropertiesPanel
          selectedElements={selectedElements}
          elements={whiteboard.elements}
          onStyleChange={handleStyleChange}
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          options={contextMenu.options}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Status Bar */}
      {!zenMode && (
        <StatusBar
          cursorPosition={cursorPosition}
          selectedCount={selectedElements.length}
          elementCount={whiteboard?.elements.length || 0}
          zoom={zoom}
          isViewOnly={false}
        />
      )}

      {/* Text Editor Overlay */}
      {editingTextElement && (
        <TextEditor
          initialText={editingTextElement.data.text || ''}
          position={editingTextElement.position}
          size={editingTextElement.size}
          style={{
            fontSize: editingTextElement.style?.fontSize,
            fontFamily: editingTextElement.style?.fontFamily,
            fontWeight: editingTextElement.style?.fontWeight,
            fontStyle: editingTextElement.style?.fontStyle,
            textDecoration: editingTextElement.style?.textDecoration,
            color: editingTextElement.style?.color
          }}
          zoom={zoom}
          pan={pan}
          onSave={handleTextSave}
          onCancel={handleTextCancel}
        />
      )}

      {/* Text Formatting Controls */}
      {showTextFormattingControls && editingTextElement && !zenMode && (
        <div className="absolute left-4 top-20 z-50">
          <TextFormattingControls
            fontSize={editingTextElement.style?.fontSize || 16}
            fontFamily={editingTextElement.style?.fontFamily || 'IBM Plex Mono, monospace'}
            fontWeight={editingTextElement.style?.fontWeight || 'normal'}
            fontStyle={editingTextElement.style?.fontStyle || 'normal'}
            textDecoration={editingTextElement.style?.textDecoration || 'none'}
            textAlign={(editingTextElement.style?.textAlign as any) || 'left'}
            onFontSizeChange={(size) => handleTextFormatChange({ fontSize: size })}
            onFontFamilyChange={(family) => handleTextFormatChange({ fontFamily: family })}
            onToggleBold={() => handleTextFormatChange({
              fontWeight: editingTextElement.style?.fontWeight === 'bold' ? 'normal' : 'bold'
            })}
            onToggleItalic={() => handleTextFormatChange({
              fontStyle: editingTextElement.style?.fontStyle === 'italic' ? 'normal' : 'italic'
            })}
            onToggleUnderline={() => handleTextFormatChange({
              textDecoration: editingTextElement.style?.textDecoration === 'underline' ? 'none' : 'underline'
            })}
            onTextAlignChange={(align) => handleTextFormatChange({ textAlign: align })}
          />
        </div>
      )}

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  )
}