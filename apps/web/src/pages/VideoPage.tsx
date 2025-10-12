import { useParams } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import VideoRooms from '@/components/features/video/VideoRooms'
import BrutalistLoader from '@/components/common/BrutalistLoader'

export default function VideoPage() {
  const { workspaceId, meetingId } = useParams<{ workspaceId: string; meetingId?: string }>()

  // Get current workspace
  const workspaces = useQuery(api.workspaces.queries.getUserWorkspaces)
  const currentWorkspace = workspaces?.[0]

  if (!currentWorkspace) {
    return <BrutalistLoader />
  }

  return (
    <VideoRooms
      workspaceId={currentWorkspace._id}
      meetingId={meetingId as Id<"meetings"> | undefined}
    />
  )
}
