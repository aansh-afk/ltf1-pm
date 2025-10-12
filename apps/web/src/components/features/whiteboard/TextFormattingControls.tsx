import React from 'react'
import {
  HiOutlineCollection,
  HiOutlineSortAscending,
  HiOutlineSortDescending,
} from 'react-icons/hi'

interface TextFormattingControlsProps {
  fontSize: number
  fontFamily: string
  fontWeight: string
  fontStyle: string
  textDecoration: string
  textAlign: 'left' | 'center' | 'right'
  onFontSizeChange: (size: number) => void
  onFontFamilyChange: (family: string) => void
  onToggleBold: () => void
  onToggleItalic: () => void
  onToggleUnderline: () => void
  onTextAlignChange: (align: 'left' | 'center' | 'right') => void
}

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48]
const FONT_FAMILIES = [
  { name: 'IBM Plex Mono', value: 'IBM Plex Mono, monospace' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Times New Roman', value: 'Times New Roman, serif' },
  { name: 'Courier', value: 'Courier, monospace' },
]

export function TextFormattingControls({
  fontSize,
  fontFamily,
  fontWeight,
  fontStyle,
  textDecoration,
  textAlign,
  onFontSizeChange,
  onFontFamilyChange,
  onToggleBold,
  onToggleItalic,
  onToggleUnderline,
  onTextAlignChange,
}: TextFormattingControlsProps) {
  const isBold = fontWeight === 'bold'
  const isItalic = fontStyle === 'italic'
  const isUnderline = textDecoration === 'underline'

  return (
    <div className="bg-black border-2 border-white p-4 space-y-4">
      <h3 className="text-white font-bold uppercase text-sm mb-3">TEXT FORMAT</h3>

      {/* Font Size */}
      <div className="space-y-2">
        <label className="text-white text-xs uppercase block">Font Size</label>
        <select
          value={fontSize}
          onChange={(e) => onFontSizeChange(Number(e.target.value))}
          className="w-full bg-black text-white border-2 border-white p-2 font-mono uppercase cursor-pointer hover:bg-white/10"
        >
          {FONT_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}PX
            </option>
          ))}
        </select>
      </div>

      {/* Font Family */}
      <div className="space-y-2">
        <label className="text-white text-xs uppercase block">Font Family</label>
        <select
          value={fontFamily}
          onChange={(e) => onFontFamilyChange(e.target.value)}
          className="w-full bg-black text-white border-2 border-white p-2 font-mono uppercase cursor-pointer hover:bg-white/10"
        >
          {FONT_FAMILIES.map((font) => (
            <option key={font.value} value={font.value}>
              {font.name.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Text Style */}
      <div className="space-y-2">
        <label className="text-white text-xs uppercase block">Text Style</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onToggleBold}
            className={`p-2 border-2 font-bold ${
              isBold
                ? 'border-cyan-400 bg-cyan-400/20 text-cyan-400'
                : 'border-white text-white'
            } hover:bg-white/10 uppercase`}
          >
            B
          </button>
          <button
            onClick={onToggleItalic}
            className={`p-2 border-2 italic ${
              isItalic
                ? 'border-cyan-400 bg-cyan-400/20 text-cyan-400'
                : 'border-white text-white'
            } hover:bg-white/10 uppercase`}
          >
            I
          </button>
          <button
            onClick={onToggleUnderline}
            className={`p-2 border-2 underline ${
              isUnderline
                ? 'border-cyan-400 bg-cyan-400/20 text-cyan-400'
                : 'border-white text-white'
            } hover:bg-white/10 uppercase`}
          >
            U
          </button>
        </div>
      </div>

      {/* Text Alignment */}
      <div className="space-y-2">
        <label className="text-white text-xs uppercase block">Alignment</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onTextAlignChange('left')}
            className={`p-2 border-2 ${
              textAlign === 'left'
                ? 'border-cyan-400 bg-cyan-400/20 text-cyan-400'
                : 'border-white text-white'
            } hover:bg-white/10 uppercase flex items-center justify-center`}
            title="Align Left"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h10M4 18h16"
              />
            </svg>
          </button>
          <button
            onClick={() => onTextAlignChange('center')}
            className={`p-2 border-2 ${
              textAlign === 'center'
                ? 'border-cyan-400 bg-cyan-400/20 text-cyan-400'
                : 'border-white text-white'
            } hover:bg-white/10 uppercase flex items-center justify-center`}
            title="Align Center"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M7 12h10M4 18h16"
              />
            </svg>
          </button>
          <button
            onClick={() => onTextAlignChange('right')}
            className={`p-2 border-2 ${
              textAlign === 'right'
                ? 'border-cyan-400 bg-cyan-400/20 text-cyan-400'
                : 'border-white text-white'
            } hover:bg-white/10 uppercase flex items-center justify-center`}
            title="Align Right"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M10 12h10M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
