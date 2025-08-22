import React from 'react'
import { useParams } from 'react-router-dom'
import type { Id } from '../../../../convex/_generated/dataModel'
import ReportBuilder from '@/components/features/reports/ReportBuilder'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'

const ReportsPage: React.FC = () => {
  const { workspaceId, projectId } = useParams<{
    workspaceId: string
    projectId?: string
  }>()

  // Get current workspace
  const workspace = useQuery(api.workspaces.getWorkspace, 
    workspaceId ? { workspaceId: workspaceId as Id<"workspaces"> } : 'skip'
  )

  // Get current project if specified
  const project = useQuery(api.projects.getProject,
    projectId ? { projectId: projectId as Id<"projects"> } : 'skip'
  )

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">No Workspace Selected</h1>
          <p className="text-gray-600">Please select a workspace to view reports</p>
        </div>
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ReportBuilder 
        workspaceId={workspaceId as Id<"workspaces">}
        projectId={projectId as Id<"projects"> | undefined}
      />
    </div>
  )
}

export default ReportsPage