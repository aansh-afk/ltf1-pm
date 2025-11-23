import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Stage, Layer, Rect, Circle, Line, Text, Arrow, Image as KonvaImage, Transformer, Group } from 'react-konva'
import type Konva from 'konva'
import useImage from 'use-image'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import {
    HiOutlineCursorClick,
    HiOutlinePencil,
    HiOutlineAnnotation,
    HiOutlineArrowsExpand,
    HiOutlineTrash,
    HiOutlineZoomIn,
    HiOutlineZoomOut,
    HiOutlinePhotograph,
    HiOutlineArrowRight,
    HiOutlineX // Using X for Eraser as a placeholder or standard icon
} from 'react-icons/hi'
import { debounce } from 'lodash'

// --- Types & Constants ---

const ELEMENT_TYPES = {
    SHAPE: 'shape',
    TEXT: 'text',
    LINE: 'line',
    IMAGE: 'image',
    STICKY: 'sticky',
    DRAWING: 'drawing',
    ARROW: 'arrow',
} as const

const SHAPE_TYPES = {
    RECTANGLE: 'rectangle',
    CIRCLE: 'circle',
} as const

const TOOLS = {
    SELECT: 'select',
    RECTANGLE: 'rectangle',
    CIRCLE: 'circle',
    LINE: 'line',
    TEXT: 'text',
    STICKY: 'sticky',
    DRAWING: 'drawing',
    ARROW: 'arrow',
    IMAGE: 'image',
    ERASER: 'eraser',
    PAN: 'pan',
} as const

type Tool = keyof typeof TOOLS

interface WhiteboardCanvasProps {
    workspaceId: Id<'workspaces'>
    whiteboardId?: Id<'whiteboards'>
    projectId?: Id<'projects'>
    meetingId?: Id<'meetings'>
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
}

// --- Helper Components ---

const URLImage = ({ image, ...props }: any) => {
    const [img] = useImage(image.url)
    return <KonvaImage image={img} {...props} />
}

// --- Main Component ---

export default function WhiteboardCanvasKonva({
    workspaceId,
    whiteboardId: initialWhiteboardId,
    projectId,
    meetingId,
}: WhiteboardCanvasProps) {
    // --- State ---
    const [whiteboardId, setWhiteboardId] = useState(initialWhiteboardId)
    const [activeTool, setActiveTool] = useState<Tool>('SELECT')
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [stageScale, setStageScale] = useState(1)
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)

    // Eraser State
    const [eraserPath, setEraserPath] = useState<{ x: number, y: number }[]>([])

    // Text Editing State
    const [editingTextId, setEditingTextId] = useState<string | null>(null)
    const [editingTextValue, setEditingTextValue] = useState('')
    const [editingTextPos, setEditingTextPos] = useState({ x: 0, y: 0, width: 0, height: 0 })

    // Optimistic UI state
    const [elements, setElements] = useState<Element[]>([])
    const [currentElement, setCurrentElement] = useState<Partial<Element> | null>(null)

    // Refs
    const stageRef = useRef<Konva.Stage | null>(null)
    const transformerRef = useRef<Konva.Transformer | null>(null)
    const isDrawing = useRef(false)
    const isErasing = useRef(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // --- Queries & Mutations ---
    const whiteboard = useQuery(api.whiteboard.getWhiteboard, whiteboardId ? { whiteboardId } : 'skip')
    const createWhiteboard = useMutation(api.whiteboard.createWhiteboard)
    const addElement = useMutation(api.whiteboard.addElement)
    const updateElement = useMutation(api.whiteboard.updateElement)
    const deleteElement = useMutation(api.whiteboard.deleteElement)
    const updateCursor = useMutation(api.whiteboard.updateCursor)

    // --- Effects ---

    // Sync elements from backend
    useEffect(() => {
        if (whiteboard?.elements) {
            setElements(whiteboard.elements as Element[])
        }
    }, [whiteboard?.elements])

    // Create whiteboard if needed
    useEffect(() => {
        if (!whiteboardId) {
            createWhiteboard({
                workspaceId,
                name: `Whiteboard ${new Date().toLocaleDateString()}`,
                description: 'Konva Powered',
                projectId,
                meetingId,
                public: false,
            }).then(setWhiteboardId)
        }
    }, [whiteboardId, workspaceId, projectId, meetingId, createWhiteboard])

    // Update Transformer selection
    useEffect(() => {
        if (selectedIds.length > 0 && transformerRef.current && stageRef.current) {
            const nodes = selectedIds.map(id => stageRef.current!.findOne('#' + id)).filter(Boolean)
            transformerRef.current.nodes(nodes)
            transformerRef.current.getLayer()?.batchDraw()
        } else if (transformerRef.current) {
            transformerRef.current.nodes([])
            transformerRef.current.getLayer()?.batchDraw()
        }
    }, [selectedIds, elements])

    // Throttled cursor update
    const throttledUpdateCursor = useMemo(
        () => debounce((pos: { x: number, y: number }) => {
            if (whiteboardId) {
                updateCursor({ whiteboardId, cursor: pos })
            }
        }, 100),
        [whiteboardId, updateCursor]
    )

    // --- Handlers ---

    const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault()
        const scaleBy = 1.1
        const stage = e.target.getStage()
        if (!stage) return

        const oldScale = stage.scaleX()
        const pointerPosition = stage.getPointerPosition()
        if (!pointerPosition) return

        const mousePointTo = {
            x: pointerPosition.x / oldScale - stage.x() / oldScale,
            y: pointerPosition.y / oldScale - stage.y() / oldScale,
        }

        const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy
        setStageScale(newScale)
        setStagePos({
            x: -(mousePointTo.x - pointerPosition.x / newScale) * newScale,
            y: -(mousePointTo.y - pointerPosition.y / newScale) * newScale,
        })
    }

    const handleMouseDown = async (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!whiteboardId) return

        // If editing text, commit on click outside
        if (editingTextId) {
            handleTextSubmit()
            return
        }

        const stage = e.target.getStage()
        if (!stage) return

        const pos = stage.getRelativePointerPosition()
        if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number' || isNaN(pos.x) || isNaN(pos.y)) return

        // Eraser Tool Logic
        if (activeTool === 'ERASER') {
            isErasing.current = true
            setEraserPath([{ x: pos.x, y: pos.y }])
            return
        }

        // Select Tool Logic
        if (activeTool === 'SELECT') {
            const clickedOnEmpty = e.target === stage
            if (clickedOnEmpty) {
                setSelectedIds([])
                return
            }

            const id = e.target.id()
            if (id) {
                if (e.evt.shiftKey) {
                    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
                } else {
                    if (!selectedIds.includes(id)) {
                        setSelectedIds([id])
                    }
                }
            }
            return
        }

        // Pan Tool Logic
        if (activeTool === 'PAN') {
            setIsDragging(true)
            return
        }

        // Drawing Tool Logic
        if (activeTool === 'DRAWING') {
            isDrawing.current = true
            const newElement: Partial<Element> = {
                type: ELEMENT_TYPES.DRAWING,
                data: { points: [pos.x, pos.y] },
                position: { x: 0, y: 0 },
                size: { width: 0, height: 0 },
                rotation: 0,
                style: { stroke: '#FFFFFF', strokeWidth: 2 },
            }
            setCurrentElement(newElement)
            return
        }

        // Arrow Tool Logic
        if (activeTool === 'ARROW') {
            isDrawing.current = true
            const newElement: Partial<Element> = {
                type: ELEMENT_TYPES.ARROW,
                data: { points: [pos.x, pos.y, pos.x, pos.y] }, // Start and end same initially
                position: { x: 0, y: 0 },
                size: { width: 0, height: 0 },
                rotation: 0,
                style: { stroke: '#FFFFFF', strokeWidth: 2, pointerLength: 10, pointerWidth: 10 },
            }
            setCurrentElement(newElement)
            return
        }

        // Shape Creation Logic
        const newElement: Partial<Element> = {
            type: activeTool === 'RECTANGLE' || activeTool === 'CIRCLE' ? ELEMENT_TYPES.SHAPE :
                activeTool === 'TEXT' ? ELEMENT_TYPES.TEXT :
                    activeTool === 'STICKY' ? ELEMENT_TYPES.STICKY : ELEMENT_TYPES.SHAPE,
            data: activeTool === 'RECTANGLE' ? { shape: SHAPE_TYPES.RECTANGLE } :
                activeTool === 'CIRCLE' ? { shape: SHAPE_TYPES.CIRCLE } :
                    activeTool === 'TEXT' ? { text: 'Double click to edit' } :
                        activeTool === 'STICKY' ? { text: 'Note' } : {},
            position: { x: pos.x, y: pos.y },
            size: { width: 0, height: 0 },
            rotation: 0,
            style: {
                fill: activeTool === 'STICKY' ? '#FFFF00' : 'transparent',
                stroke: activeTool === 'STICKY' ? 'transparent' : '#FFFFFF',
                strokeWidth: 2,
                fontSize: 16
            },
        }
        setCurrentElement(newElement)
        setIsDragging(true)
    }

    const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
        const stage = e.target.getStage()
        if (!stage) return

        const pos = stage.getRelativePointerPosition()
        if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number' || isNaN(pos.x) || isNaN(pos.y)) return

        throttledUpdateCursor(pos)

        // Eraser Logic
        if (activeTool === 'ERASER' && isErasing.current) {
            setEraserPath(prev => [...prev, { x: pos.x, y: pos.y }])

            // Check intersection with elements
            // Simple bounding box check for now
            const hitElements = elements.filter(el => {
                if (el.locked) return false
                const x = el.position.x
                const y = el.position.y
                const w = el.size.width
                const h = el.size.height

                // Check if cursor is inside element
                return pos.x >= x && pos.x <= x + w && pos.y >= y && pos.y <= y + h
            })

            if (hitElements.length > 0) {
                // Delete hit elements
                hitElements.forEach(async (el) => {
                    // Optimistic update: remove from local state immediately
                    setElements(prev => prev.filter(e => e.id !== el.id))
                    await deleteElement({ whiteboardId, elementId: el.id })
                })
            }
            return
        }

        if (activeTool === 'PAN' && isDragging) return
        if (!isDragging && !isDrawing.current) return

        if (activeTool === 'DRAWING' && isDrawing.current && currentElement) {
            const newPoints = (currentElement.data?.points || []).concat([pos.x, pos.y])
            setCurrentElement({
                ...currentElement,
                data: { ...currentElement.data, points: newPoints }
            })
            return
        }

        if (activeTool === 'ARROW' && isDrawing.current && currentElement) {
            const startX = currentElement.data.points[0]
            const startY = currentElement.data.points[1]
            setCurrentElement({
                ...currentElement,
                data: { ...currentElement.data, points: [startX, startY, pos.x, pos.y] }
            })
            return
        }

        if (currentElement && currentElement.position) {
            const startX = currentElement.position.x
            const startY = currentElement.position.y
            const width = pos.x - startX
            const height = pos.y - startY

            setCurrentElement({
                ...currentElement,
                size: { width: Math.abs(width), height: Math.abs(height) },
                position: {
                    x: width < 0 ? pos.x : startX,
                    y: height < 0 ? pos.y : startY
                }
            })
        }
    }

    const handleMouseUp = async () => {
        setIsDragging(false)
        isDrawing.current = false

        if (activeTool === 'ERASER') {
            isErasing.current = false
            setEraserPath([])
            return
        }

        if (currentElement && whiteboardId) {
            if (activeTool !== 'DRAWING' && activeTool !== 'ARROW' && (currentElement.size!.width < 5 || currentElement.size!.height < 5)) {
                // For text, give it a default size if clicked (not dragged)
                if (activeTool === 'TEXT') {
                    // Keep it, it has default text
                } else {
                    setCurrentElement(null)
                    return
                }
            }

            await addElement({
                whiteboardId,
                element: {
                    type: currentElement.type as Element['type'],
                    data: currentElement.data,
                    position: currentElement.position!,
                    size: currentElement.size || { width: 100, height: 50 }, // Default for text
                    rotation: currentElement.rotation || 0,
                    style: currentElement.style
                } as Omit<Element, 'id' | 'locked' | 'createdBy'>
            })
            setCurrentElement(null)

            if (activeTool !== 'DRAWING' && activeTool !== 'ARROW') {
                setActiveTool('SELECT')
            }
        }
    }

    const handleDragEnd = async (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!whiteboardId) return
        const node = e.target as Konva.Node
        const id = node.id()
        const element = elements.find(el => el.id === id)
        if (element) {
            await updateElement({
                whiteboardId,
                elementId: id,
                updates: {
                    position: { x: node.x(), y: node.y() }
                }
            })
        }
    }

    const handleTransformEnd = async (e: Konva.KonvaEventObject<Event>) => {
        if (!whiteboardId) return
        const node = e.target as Konva.Transformer
        const id = node.id()
        const scaleX = node.scaleX()
        const scaleY = node.scaleY()

        node.scaleX(1)
        node.scaleY(1)

        await updateElement({
            whiteboardId,
            elementId: id,
            updates: {
                position: { x: node.x(), y: node.y() },
                size: {
                    width: Math.max(5, node.width() * scaleX),
                    height: Math.max(5, node.height() * scaleY)
                },
                rotation: node.rotation()
            }
        })
    }

    const handleDelete = async () => {
        if (!whiteboardId || selectedIds.length === 0) return
        for (const id of selectedIds) {
            await deleteElement({ whiteboardId, elementId: id })
        }
        setSelectedIds([])
    }

    // Text Editing Handlers
    const handleDoubleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
        const id = e.target.id()
        const element = elements.find(el => el.id === id)
        if (element && (element.type === ELEMENT_TYPES.TEXT || element.type === ELEMENT_TYPES.STICKY)) {
            setEditingTextId(id)
            setEditingTextValue(element.data.text)

            // Calculate absolute position for textarea
            const stage = e.target.getStage()
            if (stage) {
                const textNode = e.target as Konva.Text
                const tr = textNode.getAbsoluteTransform()
                const pos = tr.getTranslation()
                const scale = stage.scaleX()

                setEditingTextPos({
                    x: pos.x,
                    y: pos.y,
                    width: textNode.width() * scale,
                    height: textNode.height() * scale
                })
            }
        }
    }

    const handleTextSubmit = async () => {
        if (editingTextId && whiteboardId) {
            await updateElement({
                whiteboardId,
                elementId: editingTextId,
                updates: {
                    data: { text: editingTextValue }
                }
            })
            setEditingTextId(null)
        }
    }

    // Image Upload Handler
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file && whiteboardId) {
            const reader = new FileReader()
            reader.onload = async (event) => {
                const base64 = event.target?.result as string
                // Get center of screen
                const stage = stageRef.current
                const center = stage ? {
                    x: (-stage.x() + stage.width() / 2) / stage.scaleX(),
                    y: (-stage.y() + stage.height() / 2) / stage.scaleY()
                } : { x: 0, y: 0 }

                await addElement({
                    whiteboardId,
                    element: {
                        type: ELEMENT_TYPES.IMAGE,
                        data: { url: base64 },
                        position: center,
                        size: { width: 200, height: 200 },
                        rotation: 0,
                        style: {}
                    } as any
                })
            }
            reader.readAsDataURL(file)
        }
    }

    // Property Changes
    const updateSelectedStyle = async (styleUpdate: any) => {
        if (!whiteboardId || selectedIds.length === 0) return
        for (const id of selectedIds) {
            const element = elements.find(el => el.id === id)
            if (element) {
                await updateElement({
                    whiteboardId,
                    elementId: id,
                    updates: {
                        style: { ...element.style, ...styleUpdate }
                    }
                })
            }
        }
    }

    // --- Render Helpers ---

    const renderElement = (element: Element | Partial<Element>, isPreview = false) => {
        if (!element.position || !element.size || !element.style) return null

        const props = {
            key: element.id || 'preview',
            id: element.id,
            x: element.position.x,
            y: element.position.y,
            width: element.size.width,
            height: element.size.height,
            rotation: element.rotation || 0,
            draggable: activeTool === 'SELECT' && !(element as Element).locked && !isPreview && !editingTextId,
            onDragEnd: handleDragEnd,
            onTransformEnd: handleTransformEnd,
            onClick: handleMouseDown,
            onTap: handleMouseDown,
            onDblClick: handleDoubleClick,
        }

        if (element.type === ELEMENT_TYPES.SHAPE) {
            if (element.data?.shape === SHAPE_TYPES.RECTANGLE) {
                return <Rect {...props} fill={element.style.fill} stroke={element.style.stroke} strokeWidth={element.style.strokeWidth} />
            } else if (element.data?.shape === SHAPE_TYPES.CIRCLE) {
                return (
                    <Circle
                        {...props}
                        x={props.x + props.width / 2}
                        y={props.y + props.height / 2}
                        width={props.width}
                        height={props.height}
                        fill={element.style.fill}
                        stroke={element.style.stroke}
                        strokeWidth={element.style.strokeWidth}
                    />
                )
            }
        } else if (element.type === ELEMENT_TYPES.TEXT) {
            return (
                <Text
                    {...props}
                    text={element.data?.text}
                    fontSize={element.style.fontSize}
                    fill={element.style.stroke}
                    fontFamily="monospace"
                    visible={editingTextId !== element.id}
                    // Add a subtle border if selected to differentiate
                    stroke={selectedIds.includes(element.id!) ? '#00FFFF' : undefined}
                    strokeWidth={selectedIds.includes(element.id!) ? 1 : 0}
                />
            )
        } else if (element.type === ELEMENT_TYPES.STICKY) {
            return (
                <Group {...props}>
                    <Rect
                        width={props.width}
                        height={props.height}
                        fill={element.style.fill}
                        shadowColor="black"
                        shadowBlur={10}
                        shadowOpacity={0.2}
                        stroke={selectedIds.includes(element.id!) ? '#00FFFF' : 'rgba(0,0,0,0.1)'}
                        strokeWidth={selectedIds.includes(element.id!) ? 2 : 1}
                    />
                    <Text
                        x={10}
                        y={10}
                        width={props.width - 20}
                        text={element.data?.text}
                        fontSize={14}
                        fill="black"
                        fontFamily="monospace"
                        visible={editingTextId !== element.id}
                    />
                </Group>
            )
        } else if (element.type === ELEMENT_TYPES.DRAWING) {
            return (
                <Line
                    key={element.id || 'preview'}
                    points={element.data?.points || []}
                    stroke={element.style.stroke}
                    strokeWidth={element.style.strokeWidth}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                />
            )
        } else if (element.type === ELEMENT_TYPES.ARROW) {
            return (
                <Arrow
                    key={element.id || 'preview'}
                    points={element.data?.points || []}
                    stroke={element.style.stroke}
                    strokeWidth={element.style.strokeWidth}
                    pointerLength={element.style.pointerLength}
                    pointerWidth={element.style.pointerWidth}
                    fill={element.style.stroke}
                />
            )
        } else if (element.type === ELEMENT_TYPES.IMAGE) {
            return <URLImage key={element.id} image={element.data} {...props} />
        }
        return null
    }

    // --- UI Render ---

    // Cursor style based on tool
    const getCursorStyle = () => {
        switch (activeTool) {
            case 'ERASER': return 'crosshair' // Or a custom eraser cursor
            case 'PAN': return isDragging ? 'grabbing' : 'grab'
            case 'TEXT': return 'text'
            case 'DRAWING': return 'crosshair'
            case 'ARROW': return 'crosshair'
            default: return 'default'
        }
    }

    return (
        <div
            className="relative w-full h-full bg-[#111] overflow-hidden"
            style={{ cursor: getCursorStyle() }}
        >
            {/* Toolbar */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-[#222] p-2 border border-[#333]">
                <ToolButton icon={<HiOutlineCursorClick />} active={activeTool === 'SELECT'} onClick={() => setActiveTool('SELECT')} tooltip="Select (V)" />
                <ToolButton icon={<HiOutlineArrowsExpand />} active={activeTool === 'PAN'} onClick={() => setActiveTool('PAN')} tooltip="Pan (H)" />
                <div className="h-px bg-[#333] my-1" />
                <ToolButton label="⬜" active={activeTool === 'RECTANGLE'} onClick={() => setActiveTool('RECTANGLE')} tooltip="Rectangle (R)" />
                <ToolButton label="⭕" active={activeTool === 'CIRCLE'} onClick={() => setActiveTool('CIRCLE')} tooltip="Circle (C)" />
                <ToolButton icon={<HiOutlineArrowRight />} active={activeTool === 'ARROW'} onClick={() => setActiveTool('ARROW')} tooltip="Arrow (A)" />
                <ToolButton icon={<HiOutlinePencil />} active={activeTool === 'DRAWING'} onClick={() => setActiveTool('DRAWING')} tooltip="Draw (P)" />
                <ToolButton label="T" active={activeTool === 'TEXT'} onClick={() => setActiveTool('TEXT')} tooltip="Text (T)" />
                <ToolButton icon={<HiOutlineAnnotation />} active={activeTool === 'STICKY'} onClick={() => setActiveTool('STICKY')} tooltip="Sticky Note (S)" />
                <ToolButton icon={<HiOutlinePhotograph />} active={activeTool === 'IMAGE'} onClick={() => fileInputRef.current?.click()} tooltip="Image (I)" />
                <div className="h-px bg-[#333] my-1" />
                <ToolButton icon={<HiOutlineX />} active={activeTool === 'ERASER'} onClick={() => setActiveTool('ERASER')} tooltip="Eraser (E)" />
                <ToolButton icon={<HiOutlineTrash />} onClick={handleDelete} disabled={selectedIds.length === 0} tooltip="Delete Selected (Del)" />
                <div className="h-px bg-[#333] my-1" />
                <button
                    onClick={() => window.history.back()}
                    className="p-2 flex items-center justify-center text-white hover:bg-[#333] transition-colors"
                    title="Back"
                >
                    <span className="font-bold text-sm">←</span>
                </button>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
            />

            {/* Properties Panel */}
            {selectedIds.length > 0 && (
                <div className="absolute top-4 left-20 z-10 flex gap-4 bg-[#222] p-2 border border-[#333] items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Stroke</span>
                        <input type="color" className="w-6 h-6 bg-transparent border-none" onChange={(e) => updateSelectedStyle({ stroke: e.target.value })} />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Fill</span>
                        <input type="color" className="w-6 h-6 bg-transparent border-none" onChange={(e) => updateSelectedStyle({ fill: e.target.value })} />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Width</span>
                        <input type="range" min="1" max="20" className="w-20" onChange={(e) => updateSelectedStyle({ strokeWidth: parseInt(e.target.value) })} />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Size</span>
                        <input type="range" min="12" max="72" className="w-20" onChange={(e) => updateSelectedStyle({ fontSize: parseInt(e.target.value) })} />
                    </div>
                </div>
            )}

            {/* Canvas */}
            <Stage
                ref={stageRef}
                width={window.innerWidth}
                height={window.innerHeight}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                scaleX={stageScale}
                scaleY={stageScale}
                x={stagePos.x}
                y={stagePos.y}
                draggable={activeTool === 'PAN'}
            >
                <Layer>
                    {elements.map(el => renderElement(el))}
                    {currentElement && renderElement(currentElement, true)}

                    {/* Eraser Trail */}
                    {eraserPath.length > 0 && (
                        <Line
                            points={eraserPath.flatMap(p => [p.x, p.y])}
                            stroke="#ff0000"
                            strokeWidth={5}
                            opacity={0.5}
                            lineCap="round"
                            lineJoin="round"
                            listening={false}
                        />
                    )}

                    <Transformer ref={transformerRef} />
                </Layer>
            </Stage>

            {/* Text Editing Overlay */}
            {editingTextId && (
                <textarea
                    value={editingTextValue}
                    onChange={(e) => setEditingTextValue(e.target.value)}
                    onBlur={handleTextSubmit}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleTextSubmit() }}
                    style={{
                        position: 'absolute',
                        top: editingTextPos.y,
                        left: editingTextPos.x,
                        width: Math.max(100, editingTextPos.width),
                        height: Math.max(50, editingTextPos.height),
                        fontSize: `${(elements.find(e => e.id === editingTextId)?.style.fontSize || 16) * stageScale}px`,
                        color: elements.find(e => e.id === editingTextId)?.style.stroke || 'white',
                        background: 'transparent',
                        border: '1px dashed cyan',
                        outline: 'none',
                        resize: 'none',
                        fontFamily: 'monospace',
                        zIndex: 100,
                    }}
                    autoFocus
                />
            )}

            {/* Zoom Controls */}
            <div className="absolute bottom-4 right-4 z-10 flex gap-2 bg-[#222] p-2 border border-[#333]">
                <button className="p-2 hover:bg-[#333] text-white" onClick={() => setStageScale(s => s * 1.2)}><HiOutlineZoomIn /></button>
                <span className="p-2 text-white font-mono text-sm flex items-center">{Math.round(stageScale * 100)}%</span>
                <button className="p-2 hover:bg-[#333] text-white" onClick={() => setStageScale(s => s / 1.2)}><HiOutlineZoomOut /></button>
            </div>
        </div>
    )
}

interface ToolButtonProps {
    icon?: React.ReactNode
    label?: string
    active: boolean
    onClick: () => void
    disabled?: boolean
    tooltip: string
}

const ToolButton = ({ icon, label, active, onClick, disabled, tooltip }: ToolButtonProps) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={tooltip}
        className={`
      p-2 flex items-center justify-center transition-colors
      ${active ? 'bg-cyan-500 text-black' : 'text-white hover:bg-[#333]'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    `}
    >
        {icon || <span className="font-bold text-sm">{label}</span>}
    </button>
)
