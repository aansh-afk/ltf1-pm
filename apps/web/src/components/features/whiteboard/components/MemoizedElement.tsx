/**
 * Memoized Element Component for Optimized Rendering
 *
 * Only re-renders when element props change
 */

import React, { memo } from 'react'

interface Element {
  id: string
  type: string
  data: any
  position: { x: number; y: number }
  size: { width: number; height: number }
  rotation: number
  style: any
  locked: boolean
}

interface MemoizedElementProps {
  element: Element
  isSelected: boolean
  onSelect: (id: string) => void
}

const ELEMENT_TYPES = {
  SHAPE: 'shape',
  TEXT: 'text',
  LINE: 'line',
  IMAGE: 'image',
  STICKY: 'sticky',
  DRAWING: 'drawing',
} as const

const SHAPE_TYPES = {
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  TRIANGLE: 'triangle',
  DIAMOND: 'diamond',
  ARROW: 'arrow',
  STAR: 'star',
} as const

/**
 * Memoized rectangle shape component
 */
const RectangleShape = memo(({ element, isSelected, onSelect }: MemoizedElementProps) => {
  const { id, position, size, style } = element

  return (
    <rect
      x={position.x}
      y={position.y}
      width={size.width}
      height={size.height}
      fill={style.fill}
      stroke={isSelected ? '#FF00FF' : style.stroke}
      strokeWidth={isSelected ? style.strokeWidth + 1 : style.strokeWidth}
      opacity={style.opacity || 1}
      className={`cursor-pointer ${element.locked ? 'pointer-events-none' : ''}`}
      onClick={() => onSelect(id)}
      style={{ willChange: isSelected ? 'transform' : 'auto' }}
    />
  )
})

RectangleShape.displayName = 'RectangleShape'

/**
 * Memoized circle shape component
 */
const CircleShape = memo(({ element, isSelected, onSelect }: MemoizedElementProps) => {
  const { id, position, size, style } = element

  return (
    <ellipse
      cx={position.x + size.width / 2}
      cy={position.y + size.height / 2}
      rx={size.width / 2}
      ry={size.height / 2}
      fill={style.fill}
      stroke={isSelected ? '#FF00FF' : style.stroke}
      strokeWidth={isSelected ? style.strokeWidth + 1 : style.strokeWidth}
      opacity={style.opacity || 1}
      className={`cursor-pointer ${element.locked ? 'pointer-events-none' : ''}`}
      onClick={() => onSelect(id)}
      style={{ willChange: isSelected ? 'transform' : 'auto' }}
    />
  )
})

CircleShape.displayName = 'CircleShape'

/**
 * Memoized text component
 */
const TextElement = memo(({ element, isSelected, onSelect }: MemoizedElementProps) => {
  const { id, position, data, style } = element

  return (
    <text
      x={position.x}
      y={position.y}
      fontSize={style.fontSize || 16}
      fontFamily={style.fontFamily || 'SpaceMono'}
      fill={isSelected ? '#FF00FF' : style.color || '#000000'}
      className={`cursor-pointer ${element.locked ? 'pointer-events-none' : ''}`}
      onClick={() => onSelect(id)}
      style={{ willChange: isSelected ? 'transform' : 'auto' }}
    >
      {data.text}
    </text>
  )
})

TextElement.displayName = 'TextElement'

/**
 * Memoized line component
 */
const LineElement = memo(({ element, isSelected, onSelect }: MemoizedElementProps) => {
  const { id, data, style } = element

  return (
    <line
      x1={data.points[0][0]}
      y1={data.points[0][1]}
      x2={data.points[1][0]}
      y2={data.points[1][1]}
      stroke={isSelected ? '#FF00FF' : style.stroke}
      strokeWidth={isSelected ? style.strokeWidth + 1 : style.strokeWidth}
      strokeDasharray={style.strokeDasharray || ''}
      className={`cursor-pointer ${element.locked ? 'pointer-events-none' : ''}`}
      onClick={() => onSelect(id)}
      style={{ willChange: isSelected ? 'transform' : 'auto' }}
    />
  )
})

LineElement.displayName = 'LineElement'

/**
 * Memoized sticky note component
 */
const StickyElement = memo(({ element, isSelected, onSelect }: MemoizedElementProps) => {
  const { id, position, size, data, style } = element

  return (
    <g>
      <rect
        x={position.x}
        y={position.y}
        width={size.width}
        height={size.height}
        fill={style.backgroundColor || '#FFFF00'}
        stroke={isSelected ? '#FF00FF' : style.borderColor || '#000000'}
        strokeWidth={isSelected ? (style.borderWidth || 2) + 1 : style.borderWidth || 2}
        className={`cursor-pointer ${element.locked ? 'pointer-events-none' : ''}`}
        onClick={() => onSelect(id)}
        style={{ willChange: isSelected ? 'transform' : 'auto' }}
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
})

StickyElement.displayName = 'StickyElement'

/**
 * Main memoized element component that routes to specific element types
 */
export const MemoizedElement = memo(
  ({ element, isSelected, onSelect }: MemoizedElementProps) => {
    const { type, data } = element

    switch (type) {
      case ELEMENT_TYPES.SHAPE:
        if (data.shape === SHAPE_TYPES.RECTANGLE) {
          return <RectangleShape element={element} isSelected={isSelected} onSelect={onSelect} />
        } else if (data.shape === SHAPE_TYPES.CIRCLE) {
          return <CircleShape element={element} isSelected={isSelected} onSelect={onSelect} />
        }
        return null

      case ELEMENT_TYPES.TEXT:
        return <TextElement element={element} isSelected={isSelected} onSelect={onSelect} />

      case ELEMENT_TYPES.LINE:
        return <LineElement element={element} isSelected={isSelected} onSelect={onSelect} />

      case ELEMENT_TYPES.STICKY:
        return <StickyElement element={element} isSelected={isSelected} onSelect={onSelect} />

      default:
        return null
    }
  },
  // Custom comparison function for memo
  (prevProps, nextProps) => {
    // Re-render only if these props changed
    return (
      prevProps.element === nextProps.element &&
      prevProps.isSelected === nextProps.isSelected
    )
  }
)

MemoizedElement.displayName = 'MemoizedElement'
