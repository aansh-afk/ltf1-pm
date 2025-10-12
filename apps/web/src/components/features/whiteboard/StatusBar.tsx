import React from 'react'

interface StatusBarProps {
  cursorPosition: { x: number; y: number } | null
  selectedCount: number
  elementCount: number
  zoom: number
  isViewOnly?: boolean
}

export default function StatusBar({
  cursorPosition,
  selectedCount,
  elementCount,
  zoom,
  isViewOnly = false
}: StatusBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-8 bg-black border-t-2 border-white z-30 flex items-center justify-between px-4">
      {/* Left: Cursor Coordinates */}
      <div className="flex items-center gap-4">
        <span className="text-white font-['IBM_Plex_Mono'] text-xs">
          {cursorPosition ? (
            <>
              X: {Math.round(cursorPosition.x)} · Y: {Math.round(cursorPosition.y)}
            </>
          ) : (
            'X: — · Y: —'
          )}
        </span>

        {isViewOnly && (
          <span className="text-cyan-400 font-['IBM_Plex_Mono'] text-xs font-bold uppercase border-l-2 border-white/20 pl-4">
            VIEW ONLY
          </span>
        )}
      </div>

      {/* Center: Selection Count */}
      <div className="text-white font-['IBM_Plex_Mono'] text-xs">
        {selectedCount > 0 ? (
          <span className="text-cyan-400">
            {selectedCount} ELEMENT{selectedCount !== 1 ? 'S' : ''} SELECTED
          </span>
        ) : (
          <span className="text-white/40">NO SELECTION</span>
        )}
      </div>

      {/* Right: Stats */}
      <div className="flex items-center gap-4 text-white font-['IBM_Plex_Mono'] text-xs">
        <span>{zoom}%</span>
        <span className="border-l-2 border-white/20 pl-4">
          {elementCount} ELEMENT{elementCount !== 1 ? 'S' : ''}
        </span>
      </div>
    </div>
  )
}
