import React from 'react'
import { HiOutlineLockClosed, HiOutlineLockOpen, HiOutlineTrash } from 'react-icons/hi'
import BrutalInput from '@/components/ui/BrutalInput'
import type { Id } from '../../../../../../convex/_generated/dataModel'

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

interface PropertiesPanelProps {
  selectedElements: Element[]
  onUpdateElement: (elementId: string, updates: Partial<Element>) => void
  onDeleteElements: () => void
  onClose: () => void
}

export default function PropertiesPanel({
  selectedElements,
  onUpdateElement,
  onDeleteElements,
  onClose
}: PropertiesPanelProps) {
  if (selectedElements.length === 0) return null

  const element = selectedElements[0]
  const isMultiSelect = selectedElements.length > 1

  const handlePositionChange = (axis: 'x' | 'y', value: string) => {
    const numValue = parseFloat(value)
    if (isNaN(numValue)) return

    if (isMultiSelect) {
      // Update all selected elements relatively
      const delta = numValue - element.position[axis]
      selectedElements.forEach(el => {
        onUpdateElement(el.id, {
          position: {
            ...el.position,
            [axis]: el.position[axis] + delta
          }
        })
      })
    } else {
      onUpdateElement(element.id, {
        position: { ...element.position, [axis]: numValue }
      })
    }
  }

  const handleSizeChange = (dimension: 'width' | 'height', value: string) => {
    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue <= 0) return

    onUpdateElement(element.id, {
      size: { ...element.size, [dimension]: numValue }
    })
  }

  const handleLockToggle = () => {
    selectedElements.forEach(el => {
      onUpdateElement(el.id, { locked: !el.locked })
    })
  }

  const formatType = (type: string) => {
    return type.toUpperCase().replace('_', ' ')
  }

  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-black border-l-2 border-white z-40 overflow-y-auto animate-brutal-slide-left">
      {/* Header */}
      <div className="sticky top-0 bg-black border-b-2 border-white p-4 flex items-center justify-between">
        <h2 className="text-white font-['IBM_Plex_Mono'] text-sm font-bold uppercase">
          {isMultiSelect ? `${selectedElements.length} ELEMENTS` : 'PROPERTIES'}
        </h2>
        <button
          onClick={onClose}
          className="text-white hover:text-cyan-400 transition-colors"
          aria-label="Close properties panel"
        >
          ✕
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Element Info Section */}
        <section>
          <h3 className="text-white font-['IBM_Plex_Mono'] text-xs font-bold uppercase mb-3 pb-2 border-b border-white/20">
            ELEMENT INFO
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-white/60 font-['IBM_Plex_Mono'] text-xs uppercase">Type</span>
              <span className="text-white font-['IBM_Plex_Mono'] text-xs">{formatType(element.type)}</span>
            </div>
            {!isMultiSelect && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-white/60 font-['IBM_Plex_Mono'] text-xs uppercase">Status</span>
                  <span className={`font-['IBM_Plex_Mono'] text-xs ${element.locked ? 'text-red-400' : 'text-cyan-400'}`}>
                    {element.locked ? 'LOCKED' : 'UNLOCKED'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60 font-['IBM_Plex_Mono'] text-xs uppercase">Created</span>
                  <span className="text-white font-['IBM_Plex_Mono'] text-xs">
                    {new Date(element.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Position Section */}
        <section>
          <h3 className="text-white font-['IBM_Plex_Mono'] text-xs font-bold uppercase mb-3 pb-2 border-b border-white/20">
            POSITION
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-white/60 font-['IBM_Plex_Mono'] text-xs uppercase mb-1">
                X
              </label>
              <input
                type="number"
                value={Math.round(element.position.x)}
                onChange={(e) => handlePositionChange('x', e.target.value)}
                disabled={element.locked}
                className="w-full bg-black text-white border-2 border-white px-2 py-1 font-['IBM_Plex_Mono'] text-xs focus:border-cyan-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-white/60 font-['IBM_Plex_Mono'] text-xs uppercase mb-1">
                Y
              </label>
              <input
                type="number"
                value={Math.round(element.position.y)}
                onChange={(e) => handlePositionChange('y', e.target.value)}
                disabled={element.locked}
                className="w-full bg-black text-white border-2 border-white px-2 py-1 font-['IBM_Plex_Mono'] text-xs focus:border-cyan-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </section>

        {/* Size Section */}
        {!isMultiSelect && (
          <section>
            <h3 className="text-white font-['IBM_Plex_Mono'] text-xs font-bold uppercase mb-3 pb-2 border-b border-white/20">
              SIZE
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-white/60 font-['IBM_Plex_Mono'] text-xs uppercase mb-1">
                  WIDTH
                </label>
                <input
                  type="number"
                  value={Math.round(element.size.width)}
                  onChange={(e) => handleSizeChange('width', e.target.value)}
                  disabled={element.locked}
                  min="1"
                  className="w-full bg-black text-white border-2 border-white px-2 py-1 font-['IBM_Plex_Mono'] text-xs focus:border-cyan-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-white/60 font-['IBM_Plex_Mono'] text-xs uppercase mb-1">
                  HEIGHT
                </label>
                <input
                  type="number"
                  value={Math.round(element.size.height)}
                  onChange={(e) => handleSizeChange('height', e.target.value)}
                  disabled={element.locked}
                  min="1"
                  className="w-full bg-black text-white border-2 border-white px-2 py-1 font-['IBM_Plex_Mono'] text-xs focus:border-cyan-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </section>
        )}

        {/* Style Section - Placeholder for Styling System Agent */}
        <section>
          <h3 className="text-white font-['IBM_Plex_Mono'] text-xs font-bold uppercase mb-3 pb-2 border-b border-white/20">
            STYLE
          </h3>
          <div className="text-white/40 font-['IBM_Plex_Mono'] text-xs text-center py-4 border-2 border-dashed border-white/20">
            STYLE CONTROLS
            <br />
            (INTEGRATED WITH STYLING SYSTEM)
          </div>
        </section>

        {/* Actions Section */}
        <section className="space-y-2">
          <button
            onClick={handleLockToggle}
            className="w-full bg-black border-2 border-white text-white px-4 py-2 font-['IBM_Plex_Mono'] text-xs uppercase hover:bg-white hover:text-black transition-colors flex items-center justify-center gap-2"
          >
            {element.locked ? (
              <>
                <HiOutlineLockOpen className="w-4 h-4" />
                UNLOCK
              </>
            ) : (
              <>
                <HiOutlineLockClosed className="w-4 h-4" />
                LOCK
              </>
            )}
          </button>

          <button
            onClick={onDeleteElements}
            className="w-full bg-red-500 border-2 border-white text-white px-4 py-2 font-['IBM_Plex_Mono'] text-xs uppercase hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
          >
            <HiOutlineTrash className="w-4 h-4" />
            DELETE {isMultiSelect ? `(${selectedElements.length})` : ''}
          </button>
        </section>
      </div>
    </div>
  )
}
