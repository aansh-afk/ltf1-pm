import React, { useEffect, useRef } from 'react'
import {
  HiOutlineDuplicate,
  HiOutlineTrash,
  HiOutlineLockClosed,
  HiOutlineLockOpen,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
  HiOutlineClipboardCopy,
  HiOutlineClipboard,
  HiOutlineViewGrid,
  HiOutlineZoomIn
} from 'react-icons/hi'

interface ContextMenuOption {
  label: string
  icon?: React.ReactNode
  shortcut?: string
  action: () => void
  disabled?: boolean
  divider?: boolean
  danger?: boolean
}

interface ContextMenuProps {
  x: number
  y: number
  options: ContextMenuOption[]
  onClose: () => void
}

export default function ContextMenu({ x, y, options, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    // Add listeners after a small delay to prevent immediate close
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }, 10)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  // Adjust position to keep menu in viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect()
      const menu = menuRef.current

      // Adjust horizontal position
      if (rect.right > window.innerWidth) {
        menu.style.left = `${x - rect.width}px`
      }

      // Adjust vertical position
      if (rect.bottom > window.innerHeight) {
        menu.style.top = `${y - rect.height}px`
      }
    }
  }, [x, y])

  return (
    <div
      ref={menuRef}
      className="fixed bg-black border-2 border-white z-50 min-w-[200px] animate-brutal-fade"
      style={{ left: x, top: y }}
      role="menu"
    >
      {options.map((option, index) => (
        <React.Fragment key={index}>
          {option.divider ? (
            <div className="border-t-2 border-white/20 my-1" />
          ) : (
            <button
              onClick={() => {
                if (!option.disabled) {
                  option.action()
                  onClose()
                }
              }}
              disabled={option.disabled}
              className={`
                w-full px-4 py-2 flex items-center justify-between gap-4
                font-['IBM_Plex_Mono'] text-xs uppercase text-left
                transition-colors
                ${option.disabled
                  ? 'text-white/30 cursor-not-allowed'
                  : option.danger
                    ? 'text-red-400 hover:bg-red-500/20 hover:text-red-300'
                    : 'text-white hover:bg-cyan-400/20 hover:text-cyan-400'
                }
              `}
              role="menuitem"
            >
              <span className="flex items-center gap-2">
                {option.icon && <span className="w-4 h-4">{option.icon}</span>}
                {option.label}
              </span>
              {option.shortcut && (
                <span className="text-white/50 text-[10px]">{option.shortcut}</span>
              )}
            </button>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// Helper function to create element context menu options
export const createElementContextMenu = (
  element: any,
  isLocked: boolean,
  onCopy: () => void,
  onDuplicate: () => void,
  onDelete: () => void,
  onToggleLock: () => void,
  onBringForward: () => void,
  onSendBackward: () => void
): ContextMenuOption[] => [
  {
    label: 'Copy',
    icon: <HiOutlineClipboardCopy />,
    shortcut: 'Ctrl+C',
    action: onCopy,
  },
  {
    label: 'Duplicate',
    icon: <HiOutlineDuplicate />,
    shortcut: 'Ctrl+D',
    action: onDuplicate,
  },
  { divider: true } as ContextMenuOption,
  {
    label: isLocked ? 'Unlock' : 'Lock',
    icon: isLocked ? <HiOutlineLockOpen /> : <HiOutlineLockClosed />,
    shortcut: 'Ctrl+L',
    action: onToggleLock,
  },
  { divider: true } as ContextMenuOption,
  {
    label: 'Bring Forward',
    icon: <HiOutlineArrowUp />,
    shortcut: 'Ctrl+]',
    action: onBringForward,
  },
  {
    label: 'Send Backward',
    icon: <HiOutlineArrowDown />,
    shortcut: 'Ctrl+[',
    action: onSendBackward,
  },
  { divider: true } as ContextMenuOption,
  {
    label: 'Delete',
    icon: <HiOutlineTrash />,
    shortcut: 'Del',
    action: onDelete,
    danger: true,
  },
]

// Helper function to create canvas context menu options
export const createCanvasContextMenu = (
  onPaste: () => void,
  onSelectAll: () => void,
  onFitToView: () => void,
  hasCopiedElement: boolean
): ContextMenuOption[] => [
  {
    label: 'Paste',
    icon: <HiOutlineClipboard />,
    shortcut: 'Ctrl+V',
    action: onPaste,
    disabled: !hasCopiedElement,
  },
  {
    label: 'Select All',
    icon: <HiOutlineViewGrid />,
    shortcut: 'Ctrl+A',
    action: onSelectAll,
  },
  { divider: true } as ContextMenuOption,
  {
    label: 'Fit to View',
    icon: <HiOutlineZoomIn />,
    shortcut: 'Ctrl+0',
    action: onFitToView,
  },
]
