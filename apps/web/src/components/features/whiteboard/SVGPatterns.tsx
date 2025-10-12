import React from 'react'

/**
 * SVG Pattern Definitions Component
 * Defines reusable fill patterns for whiteboard elements
 */
export default function SVGPatterns() {
  return (
    <defs>
      {/* Hachure Pattern - Parallel vertical lines */}
      <pattern
        id="pattern-hachure"
        width="8"
        height="8"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <line
          x1="0"
          y1="0"
          x2="0"
          y2="8"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
      </pattern>

      {/* Cross-Hatch Pattern - Perpendicular lines */}
      <pattern
        id="pattern-cross-hatch"
        width="8"
        height="8"
        patternUnits="userSpaceOnUse"
      >
        <line
          x1="0"
          y1="0"
          x2="0"
          y2="8"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="0"
          y1="0"
          x2="8"
          y2="0"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
      </pattern>

      {/* Dots Pattern - Regular dot grid */}
      <pattern
        id="pattern-dots"
        width="8"
        height="8"
        patternUnits="userSpaceOnUse"
      >
        <circle
          cx="4"
          cy="4"
          r="1.5"
          fill="currentColor"
          opacity="0.5"
        />
      </pattern>

      {/* Zigzag Pattern - Wavy lines */}
      <pattern
        id="pattern-zigzag"
        width="16"
        height="8"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M 0 4 L 4 0 L 8 4 L 12 0 L 16 4"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          opacity="0.5"
        />
      </pattern>

      {/* Color variants for different fill colors */}
      {['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'].map(color => (
        <React.Fragment key={color}>
          <pattern
            id={`pattern-hachure-${color.slice(1)}`}
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="8"
              stroke={color}
              strokeWidth="1"
              opacity="0.5"
            />
          </pattern>

          <pattern
            id={`pattern-cross-hatch-${color.slice(1)}`}
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="8"
              stroke={color}
              strokeWidth="1"
              opacity="0.5"
            />
            <line
              x1="0"
              y1="0"
              x2="8"
              y2="0"
              stroke={color}
              strokeWidth="1"
              opacity="0.5"
            />
          </pattern>

          <pattern
            id={`pattern-dots-${color.slice(1)}`}
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx="4"
              cy="4"
              r="1.5"
              fill={color}
              opacity="0.5"
            />
          </pattern>

          <pattern
            id={`pattern-zigzag-${color.slice(1)}`}
            width="16"
            height="8"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 0 4 L 4 0 L 8 4 L 12 0 L 16 4"
              stroke={color}
              strokeWidth="1"
              fill="none"
              opacity="0.5"
            />
          </pattern>
        </React.Fragment>
      ))}
    </defs>
  )
}

/**
 * Get the fill value for an element based on its style
 */
export function getFillValue(style: any): string {
  const pattern = style.fillPattern || 'solid'
  const fillColor = style.fill || '#FFFFFF'

  switch (pattern) {
    case 'none':
      return 'transparent'
    case 'solid':
      return fillColor
    case 'hachure':
      return `url(#pattern-hachure-${fillColor.slice(1)})`
    case 'cross-hatch':
      return `url(#pattern-cross-hatch-${fillColor.slice(1)})`
    case 'dots':
      return `url(#pattern-dots-${fillColor.slice(1)})`
    case 'zigzag':
      return `url(#pattern-zigzag-${fillColor.slice(1)})`
    default:
      return fillColor
  }
}

/**
 * Get stroke dasharray based on stroke style
 */
export function getStrokeDashArray(strokeStyle: string): string {
  switch (strokeStyle) {
    case 'dashed':
      return '8,4'
    case 'dotted':
      return '2,2'
    case 'solid':
    default:
      return ''
  }
}
