import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { HiOutlineSearch, HiOutlineUser, HiOutlineFilter } from 'react-icons/hi'
import DeveloperProfileCard from '@/components/features/developer/DeveloperProfileCard'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import clsx from 'clsx'

export default function TeamPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  
  // Get current user's workspaces
  const workspaces = useQuery(api.workspaces.queries.getUserWorkspaces)
  
  // For now, use the first workspace. In production, you'd get this from context or URL
  const currentWorkspace = workspaces?.[0]
  
  // Get team members with their statuses
  const teamStatuses = useQuery(
    api.developers.queries.getWorkspaceStatuses, 
    currentWorkspace ? { workspaceId: currentWorkspace._id as any } : 'skip'
  )

  if (!currentWorkspace) {
    return (
      <div className="p-48px">
        <div className="bg-carbon-plate border-2 border-basalt-border p-48px text-center">
          <h2 className="text-brutal-lg font-bold mb-16px">NO WORKSPACE SELECTED</h2>
          <p className="text-cathode-white/60">Create or select a workspace to view team members</p>
        </div>
      </div>
    )
  }

  if (!teamStatuses) {
    return <LoadingSpinner />
  }

  // Filter team members
  const filteredMembers = teamStatuses.filter((member) => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || member.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  // Group by status for summary
  const statusCounts = teamStatuses.reduce((acc, member) => {
    acc[member.status] = (acc[member.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-24px">
      {/* Page Header */}
      <div className="mb-32px">
        <h1 className="text-brutal-2xl font-bold mb-8px">TEAM</h1>
        <p className="text-cathode-white/60 text-brutal-sm uppercase">
          {currentWorkspace.name} • {teamStatuses.length} MEMBERS
        </p>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-16px mb-32px">
        <div className="bg-carbon-plate border-2 border-basalt-border p-16px">
          <div className="flex items-center justify-between mb-8px">
            <div className="w-12px h-12px bg-brutal-success"></div>
            <span className="font-mono text-brutal-2xl font-bold">{statusCounts.AVAILABLE || 0}</span>
          </div>
          <div className="font-mono text-brutal-xs uppercase text-cathode-white/60">AVAILABLE</div>
        </div>
        
        <div className="bg-carbon-plate border-2 border-basalt-border p-16px">
          <div className="flex items-center justify-between mb-8px">
            <div className="w-12px h-12px bg-brutal-error"></div>
            <span className="font-mono text-brutal-2xl font-bold">{statusCounts.LOCKED_IN || 0}</span>
          </div>
          <div className="font-mono text-brutal-xs uppercase text-cathode-white/60">LOCKED IN</div>
        </div>
        
        <div className="bg-carbon-plate border-2 border-basalt-border p-16px">
          <div className="flex items-center justify-between mb-8px">
            <div className="w-12px h-12px bg-brutal-info"></div>
            <span className="font-mono text-brutal-2xl font-bold">{statusCounts.IN_REVIEW || 0}</span>
          </div>
          <div className="font-mono text-brutal-xs uppercase text-cathode-white/60">IN REVIEW</div>
        </div>
        
        <div className="bg-carbon-plate border-2 border-basalt-border p-16px">
          <div className="flex items-center justify-between mb-8px">
            <div className="w-12px h-12px bg-brutal-warning"></div>
            <span className="font-mono text-brutal-2xl font-bold">{statusCounts.IN_MEETING || 0}</span>
          </div>
          <div className="font-mono text-brutal-xs uppercase text-cathode-white/60">IN MEETING</div>
        </div>
        
        <div className="bg-carbon-plate border-2 border-basalt-border p-16px">
          <div className="flex items-center justify-between mb-8px">
            <div className="w-12px h-12px bg-primary-brutalist/30"></div>
            <span className="font-mono text-brutal-2xl font-bold">{statusCounts.AFK || 0}</span>
          </div>
          <div className="font-mono text-brutal-xs uppercase text-cathode-white/60">AFK</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-16px mb-32px">
        <div className="flex-1 relative">
          <HiOutlineSearch className="absolute left-16px top-1/2 -translate-y-1/2 w-20px h-20px text-cathode-white/60" />
          <input
            type="text"
            placeholder="SEARCH TEAM MEMBERS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-48px pr-16px py-12px bg-event-horizon border-2 border-basalt-border text-cathode-white placeholder-cathode-white/40 font-mono text-brutal-sm uppercase focus:border-primary-brutalist focus:outline-none transition-colors"
          />
        </div>
        
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-16px py-12px bg-event-horizon border-2 border-basalt-border text-cathode-white font-mono text-brutal-sm uppercase focus:border-primary-brutalist focus:outline-none transition-colors"
        >
          <option value="all">ALL STATUSES</option>
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="LOCKED_IN">LOCKED IN</option>
          <option value="IN_REVIEW">IN REVIEW</option>
          <option value="IN_MEETING">IN MEETING</option>
          <option value="AFK">AFK</option>
        </select>
        
        <button className="brutal-btn flex items-center gap-8px">
          <HiOutlineSearch className="w-16px h-16px" />
          FIND EXPERT
        </button>
      </div>

      {/* Team Grid */}
      {filteredMembers.length === 0 ? (
        <div className="bg-carbon-plate border-2 border-basalt-border p-48px text-center">
          <HiOutlineUser className="w-48px h-48px text-primary-brutalist/30 mx-auto mb-16px" />
          <p className="text-cathode-white/60">No team members found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-24px">
          {filteredMembers.map((member) => (
            <DeveloperProfileCard
              key={member.userId}
              userId={member.userId as string}
              onClick={() => {
                // Navigate to profile page when implemented
                console.log('Navigate to profile:', member.userId)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}