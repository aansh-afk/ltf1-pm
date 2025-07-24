import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../lib/convex'
import { create } from 'zustand'

interface WorkspaceState {
  currentWorkspaceId: string | null
  setCurrentWorkspaceId: (id: string) => void
}

// Store for current workspace
const useWorkspaceStore = create<WorkspaceState>((set) => ({
  currentWorkspaceId: null,
  setCurrentWorkspaceId: (id) => set({ currentWorkspaceId: id }),
}))

export function useCurrentWorkspace() {
  const params = useParams<{ workspaceId: string }>()
  const navigate = useNavigate()
  const { currentWorkspaceId, setCurrentWorkspaceId } = useWorkspaceStore()
  
  // Get all workspaces for the user
  const workspaces = useQuery(api.workspaces.queries.getUserWorkspaces)
  
  useEffect(() => {
    if (!workspaces || workspaces.length === 0) return
    
    // If URL has "current", replace with actual workspace ID
    if (params.workspaceId === 'current') {
      // Use stored workspace ID or default to first workspace
      const targetId = currentWorkspaceId || workspaces[0]._id
      setCurrentWorkspaceId(targetId)
      
      // Replace URL with actual ID
      const currentPath = window.location.pathname
      const newPath = currentPath.replace('/workspace/current/', `/workspace/${targetId}/`)
      navigate(newPath, { replace: true })
      return
    }
    
    // If we have a real workspace ID in URL, store it
    if (params.workspaceId && params.workspaceId !== 'current') {
      setCurrentWorkspaceId(params.workspaceId)
    }
  }, [params.workspaceId, workspaces, currentWorkspaceId, navigate, setCurrentWorkspaceId])
  
  // Return the resolved workspace ID
  const resolvedWorkspaceId = params.workspaceId === 'current' 
    ? (currentWorkspaceId || workspaces?.[0]?._id)
    : params.workspaceId
  
  return {
    currentWorkspaceId: resolvedWorkspaceId,
    workspaceId: resolvedWorkspaceId, // For backward compatibility
    workspaces,
    isLoading: !workspaces,
    setCurrentWorkspace: setCurrentWorkspaceId
  }
}