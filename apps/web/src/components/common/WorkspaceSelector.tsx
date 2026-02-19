import { useState, useRef, useEffect } from 'react'
import { HiOutlineChevronDown, HiOutlineOfficeBuilding, HiOutlineCheck } from 'react-icons/hi'
import { useCurrentWorkspace } from '../../hooks/useCurrentWorkspace'
import LoadingSpinner from './LoadingSpinner'
import clsx from 'clsx'

interface WorkspaceSelectorProps {
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export default function WorkspaceSelector({ 
  size = 'md', 
  showLabel = true,
  className 
}: WorkspaceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { currentWorkspaceId, workspaces, isLoading, setCurrentWorkspace } = useCurrentWorkspace()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  if (isLoading) {
    return <LoadingSpinner size="sm" />
  }

  if (!workspaces || workspaces.length === 0) {
    return (
      <div className="bg-brutal-warning/10 border-2 border-brutal-warning p-[10px]">
        <p className="text-brutal-xs text-brutal-warning">
          No workspaces found. Create a workspace first.
        </p>
      </div>
    )
  }

  // Deduplicate workspaces by ID to prevent duplicate entries
  const uniqueWorkspaces = workspaces.filter((workspace, index, arr) => 
    arr.findIndex(w => w._id === workspace._id) === index
  )

  const currentWorkspace = uniqueWorkspaces.find(w => w._id === currentWorkspaceId)

  const handleWorkspaceSelect = (workspaceId: string) => {
    if (workspaceId !== currentWorkspaceId) {
      setCurrentWorkspace(workspaceId)
    }
    setIsOpen(false)
  }

  const handleToggleDropdown = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsOpen(!isOpen)
  }

  return (
    <div className={clsx('relative', className)} ref={dropdownRef}>
      {showLabel && (
        <span className="block text-brutal-xs mb-[4px] text-cathode-white/60">
          ACTIVE WORKSPACE
        </span>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={handleToggleDropdown}
          className={clsx(
            'w-full flex items-center justify-between',
            'bg-carbon-plate border-2 border-basalt-border',
            'text-cathode-white font-mono transition-all',
            'hover:border-primary-brutalist focus:border-primary-brutalist focus:outline-none',
            isOpen && 'border-primary-brutalist',
            size === 'sm' && 'px-[8px] py-[5px] text-brutal-xs',
            size === 'md' && 'px-[10px] py-[6px] text-brutal-sm',
            size === 'lg' && 'px-[12px] py-[8px] text-brutal-md'
          )}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <div className="flex items-center gap-[6px]">
            <HiOutlineOfficeBuilding className={clsx(
              'text-primary-brutalist flex-shrink-0',
              size === 'sm' && 'w-3 h-3',
              size === 'md' && 'w-3.5 h-3.5',
              size === 'lg' && 'w-4 h-4'
            )} />
            <span className="truncate">
              {currentWorkspace?.name || 'SELECT WORKSPACE'}
            </span>
          </div>
          
          <HiOutlineChevronDown className={clsx(
            'transition-transform text-cathode-white/60 flex-shrink-0',
            isOpen && 'rotate-180',
            size === 'sm' && 'w-3 h-3',
            size === 'md' && 'w-3.5 h-3.5',
            size === 'lg' && 'w-4 h-4'
          )} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && uniqueWorkspaces.length > 0 && (
          <div 
            className={clsx(
              "absolute top-full left-0 right-0 mt-2px",
              "bg-carbon-plate border-2 border-basalt-border shadow-brutal-lg",
              "z-[9999]" // Very high z-index to ensure it's on top
            )}
            role="listbox"
          >
            <div className="max-h-256px overflow-y-auto">
              {uniqueWorkspaces.map((workspace) => (
                <button
                  key={workspace._id}
                  type="button"
                  onClick={() => handleWorkspaceSelect(workspace._id)}
                  className={clsx(
                    'w-full flex items-center justify-between px-[10px] py-[6px]',
                    'text-left transition-colors hover:bg-event-horizon',
                    'border-none cursor-pointer',
                    currentWorkspaceId === workspace._id && 'bg-event-horizon text-primary-brutalist'
                  )}
                  role="option"
                  aria-selected={currentWorkspaceId === workspace._id}
                >
                  <div className="flex items-center gap-[6px] min-w-0">
                    <HiOutlineOfficeBuilding className="w-3.5 h-3.5 text-primary-brutalist flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-brutal-sm font-mono truncate">{workspace.name}</div>
                      {workspace.description && (
                        <div className="text-brutal-xs text-cathode-white/60 truncate">
                          {workspace.description}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {currentWorkspaceId === workspace._id && (
                    <HiOutlineCheck className="w-3.5 h-3.5 text-primary-brutalist flex-shrink-0 ml-[4px]" />
                  )}
                </button>
              ))}
            </div>
            
            {/* Footer with workspace count */}
            <div className="border-t-2 border-basalt-border px-[10px] py-[5px] bg-event-horizon">
              <p className="text-brutal-xs text-cathode-white/60">
                {uniqueWorkspaces.length} workspace{uniqueWorkspaces.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}