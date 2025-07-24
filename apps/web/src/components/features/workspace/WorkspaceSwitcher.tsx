import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import {
  HiOutlineOfficeBuilding,
  HiOutlineChevronDown,
  HiOutlinePlus,
  HiOutlineCheck,
  HiOutlineCog
} from 'react-icons/hi'
import clsx from 'clsx'

export default function WorkspaceSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const { workspaceId } = useParams()
  
  // Get all user workspaces
  const workspaces = useQuery(api.workspaces.queries.getUserWorkspaces)
  
  // Get current workspace details
  const currentWorkspaceId = workspaceId === 'current' ? 
    workspaces?.[0]?._id : workspaceId
  
  const currentWorkspace = workspaces?.find(w => w._id === currentWorkspaceId)

  const handleWorkspaceChange = (workspace: typeof workspaces[0]) => {
    // Get current path segments
    const pathSegments = window.location.pathname.split('/')
    const resourceType = pathSegments[3] // projects, tasks, etc.
    
    // Navigate to same resource in new workspace
    if (resourceType) {
      navigate(`/workspace/${workspace._id}/${resourceType}`)
    } else {
      navigate(`/workspace/${workspace._id}/projects`)
    }
    setIsOpen(false)
  }

  const handleCreateWorkspace = () => {
    navigate('/workspaces')
    setIsOpen(false)
  }

  if (!workspaces) {
    return (
      <div className="h-48px px-16px flex items-center gap-8px">
        <div className="w-32px h-32px bg-carbon-plate animate-pulse" />
        <div className="w-120px h-20px bg-carbon-plate animate-pulse" />
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "h-48px px-16px flex items-center gap-8px",
          "border-2 border-basalt-border bg-carbon-plate",
          "hover:bg-event-horizon hover:text-primary-brutalist",
          "transition-colors duration-200",
          "font-mono text-brutal-sm uppercase tracking-wider",
          isOpen && "bg-event-horizon text-primary-brutalist"
        )}
      >
        <div className="w-32px h-32px bg-primary-brutalist border-2 border-basalt-border flex items-center justify-center">
          {currentWorkspace?.logoUrl ? (
            <img 
              src={currentWorkspace.logoUrl} 
              alt={currentWorkspace.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <HiOutlineOfficeBuilding className="w-20px h-20px text-event-horizon" />
          )}
        </div>
        
        <span className="max-w-200px truncate">
          {currentWorkspace?.name || 'Select Workspace'}
        </span>
        
        <HiOutlineChevronDown className={clsx(
          "w-16px h-16px transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className={clsx(
            "absolute top-full left-0 mt-8px z-50",
            "min-w-280px max-w-360px",
            "bg-carbon-plate border-2 border-basalt-border",
            "shadow-brutal-lg"
          )}>
            {/* Workspace List */}
            <div className="max-h-400px overflow-y-auto">
              {workspaces.map((workspace) => (
                <button
                  key={workspace._id}
                  onClick={() => handleWorkspaceChange(workspace)}
                  className={clsx(
                    "w-full px-16px py-12px",
                    "flex items-center gap-12px",
                    "hover:bg-event-horizon hover:text-primary-brutalist",
                    "transition-colors duration-200",
                    "font-mono text-brutal-sm uppercase",
                    "border-b-2 border-basalt-border last:border-b-0",
                    workspace._id === currentWorkspaceId && "bg-primary-brutalist text-event-horizon"
                  )}
                >
                  <div className="w-24px h-24px bg-cathode-white border border-basalt-border flex items-center justify-center flex-shrink-0">
                    {workspace.logoUrl ? (
                      <img 
                        src={workspace.logoUrl} 
                        alt={workspace.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <HiOutlineOfficeBuilding className="w-16px h-16px" />
                    )}
                  </div>
                  
                  <div className="flex-1 text-left">
                    <div className="truncate">{workspace.name}</div>
                    <div className="text-brutal-xs opacity-70">
                      {workspace.memberCount} {workspace.memberCount === 1 ? 'member' : 'members'} · {workspace.projectCount} {workspace.projectCount === 1 ? 'project' : 'projects'}
                    </div>
                  </div>
                  
                  {workspace._id === currentWorkspaceId && (
                    <HiOutlineCheck className="w-16px h-16px flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="border-t-2 border-basalt-border">
              <button
                onClick={handleCreateWorkspace}
                className={clsx(
                  "w-full px-16px py-12px",
                  "flex items-center gap-12px",
                  "hover:bg-event-horizon hover:text-primary-brutalist",
                  "transition-colors duration-200",
                  "font-mono text-brutal-sm uppercase"
                )}
              >
                <HiOutlinePlus className="w-16px h-16px" />
                <span>Create New Workspace</span>
              </button>
              
              {currentWorkspace && (
                <button
                  onClick={() => navigate(`/workspace/${currentWorkspaceId}/settings`)}
                  className={clsx(
                    "w-full px-16px py-12px",
                    "flex items-center gap-12px",
                    "hover:bg-event-horizon hover:text-primary-brutalist",
                    "transition-colors duration-200",
                    "font-mono text-brutal-sm uppercase",
                    "border-t-2 border-basalt-border"
                  )}
                >
                  <HiOutlineCog className="w-16px h-16px" />
                  <span>Workspace Settings</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}