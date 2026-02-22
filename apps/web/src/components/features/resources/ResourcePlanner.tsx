import React, { useState, useMemo } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import BrutalCard from '@/components/ui/BrutalCard'
import BrutalButton from '@/components/ui/BrutalButton'
import BrutalInput from '@/components/ui/BrutalInput'
import { Users, Calendar, TrendingUp, AlertTriangle, Plus, Save, BarChart3 } from 'lucide-react'

interface ResourcePlannerProps {
  projectId: Id<"projects">
  workspaceId: Id<"workspaces">
}

const ResourcePlanner: React.FC<ResourcePlannerProps> = ({ projectId, workspaceId }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month')
  const [showAllocationModal, setShowAllocationModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Id<"users"> | null>(null)
  const [allocationPercentage, setAllocationPercentage] = useState(100)
  const [role, setRole] = useState('Developer')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )

  // Fetch data
  const project = useQuery(api.projects.getProject, { projectId })
  const users = useQuery(api.users.getWorkspaceUsers, { workspaceId })
  const allocations = useQuery(api.resources.getResourceAllocations, { projectId })
  const workloadBalance = useQuery(api.resources.getWorkloadBalance, { 
    period: selectedPeriod 
  })
  const skillMatrix = useQuery(api.resources.getSkillMatrix, { projectId })

  // Mutations
  const allocateResource = useMutation(api.resources.allocateResource)
  const balanceWorkload = useMutation(api.resources.balanceWorkload)

  // Calculate team utilization
  const teamUtilization = useMemo(() => {
    if (!allocations || !users) return []

    return users.map(user => {
      const userAllocations = allocations.filter(a => a.userId === user._id)
      const totalAllocation = userAllocations.reduce((sum, a) => sum + a.allocation, 0)
      
      return {
        user,
        totalAllocation,
        status: totalAllocation > 100 ? 'overallocated' : 
                totalAllocation === 100 ? 'fully-allocated' : 
                totalAllocation > 75 ? 'high' : 
                totalAllocation > 50 ? 'medium' : 'available'
      }
    })
  }, [allocations, users])

  // Handle resource allocation
  const handleAllocateResource = async () => {
    if (!selectedUser) {
      alert('Please select a user')
      return
    }

    try {
      await allocateResource({
        userId: selectedUser,
        projectId,
        allocation: allocationPercentage,
        role,
        startDate: new Date(startDate).getTime(),
        endDate: new Date(endDate).getTime()
      })
      
      setShowAllocationModal(false)
      setSelectedUser(null)
      setAllocationPercentage(100)
    } catch (error) {
      console.error('Failed to allocate resource:', error)
      alert(error instanceof Error ? error.message : 'Failed to allocate resource')
    }
  }

  // Handle workload balancing
  const handleBalanceWorkload = async (strategy: 'even' | 'skills' | 'availability') => {
    try {
      const result = await balanceWorkload({
        projectId,
        strategy
      })
      alert(result.message)
    } catch (error) {
      console.error('Failed to balance workload:', error)
      alert(error instanceof Error ? error.message : 'Failed to balance workload')
    }
  }

  const getUtilizationColor = (status: string) => {
    switch (status) {
      case 'overallocated': return 'text-red-600 bg-red-100'
      case 'fully-allocated': return 'text-green-600 bg-green-100'
      case 'high': return 'text-yellow-600 bg-yellow-100'
      case 'medium': return 'text-blue-600 bg-blue-100'
      case 'available': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Resource Planning</h2>
          <p className="text-gray-600">
            {project?.name} - Manage team allocation and capacity
          </p>
        </div>
        <div className="flex gap-2">
          <BrutalButton
            onClick={() => setShowAllocationModal(true)}
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
          >
            Allocate Resource
          </BrutalButton>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        <BrutalButton
          variant={selectedPeriod === 'week' ? 'primary' : 'secondary'}
          onClick={() => setSelectedPeriod('week')}
          size="sm"
        >
          Week
        </BrutalButton>
        <BrutalButton
          variant={selectedPeriod === 'month' ? 'primary' : 'secondary'}
          onClick={() => setSelectedPeriod('month')}
          size="sm"
        >
          Month
        </BrutalButton>
        <BrutalButton
          variant={selectedPeriod === 'quarter' ? 'primary' : 'secondary'}
          onClick={() => setSelectedPeriod('quarter')}
          size="sm"
        >
          Quarter
        </BrutalButton>
      </div>

      {/* Team Utilization Grid */}
      <BrutalCard className="p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Team Utilization
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamUtilization.map(({ user, totalAllocation, status }) => (
            <div
              key={user._id}
              className="p-4 border-2 border-black hover:shadow-brutal transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-bold">{user.name}</div>
                  <div className="text-sm text-gray-600">{user.email}</div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-bold ${getUtilizationColor(status)}`}>
                  {totalAllocation}%
                </div>
              </div>
              
              {/* Allocation Bar */}
              <div className="w-full bg-gray-200 h-2 mt-3">
                <div
                  className={`h-full transition-all ${
                    totalAllocation > 100 ? 'bg-red-500' :
                    totalAllocation === 100 ? 'bg-green-500' :
                    totalAllocation > 75 ? 'bg-yellow-500' :
                    totalAllocation > 50 ? 'bg-blue-500' :
                    'bg-gray-400'
                  }`}
                  style={{ width: `${Math.min(100, totalAllocation)}%` }}
                />
              </div>
              
              <div className="text-xs text-gray-600 mt-1">
                {status.replace('-', ' ')}
              </div>
            </div>
          ))}
        </div>
      </BrutalCard>

      {/* Workload Balance */}
      <BrutalCard className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Workload Balance
          </h3>
          <div className="flex gap-2">
            <BrutalButton
              onClick={() => handleBalanceWorkload('even')}
              variant="secondary"
              size="sm"
            >
              Balance Evenly
            </BrutalButton>
            <BrutalButton
              onClick={() => handleBalanceWorkload('skills')}
              variant="secondary"
              size="sm"
            >
              By Skills
            </BrutalButton>
            <BrutalButton
              onClick={() => handleBalanceWorkload('availability')}
              variant="secondary"
              size="sm"
            >
              By Availability
            </BrutalButton>
          </div>
        </div>

        {workloadBalance && (
          <div className="space-y-3">
            {workloadBalance.map(member => (
              <div key={member.userId} className="flex items-center justify-between p-3 border border-gray-300">
                <div className="flex-1">
                  <div className="font-medium">{member.userName}</div>
                  <div className="text-sm text-gray-600">
                    {member.assignedTasks} tasks • {member.estimatedHours}h estimated
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Capacity</div>
                    <div className="font-bold">{member.capacity}h</div>
                  </div>
                  <div className={`px-3 py-1 rounded font-bold text-sm ${
                    member.status === 'overloaded' ? 'bg-red-100 text-red-700' :
                    member.status === 'high' ? 'bg-yellow-100 text-yellow-700' :
                    member.status === 'balanced' ? 'bg-green-100 text-green-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {member.utilization.toFixed(0)}%
                  </div>
                  {member.status === 'overloaded' && (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </BrutalCard>

      {/* Skills Matrix */}
      <BrutalCard className="p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Skills Matrix
        </h3>
        
        {skillMatrix && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left p-2">Team Member</th>
                  <th className="text-center p-2">React</th>
                  <th className="text-center p-2">TypeScript</th>
                  <th className="text-center p-2">Node.js</th>
                  <th className="text-center p-2">Python</th>
                  <th className="text-center p-2">Docker</th>
                  <th className="text-center p-2">AWS</th>
                </tr>
              </thead>
              <tbody>
                {skillMatrix.map(member => (
                  <tr key={member.userId} className="border-b border-gray-300">
                    <td className="p-2 font-medium">{member.userName}</td>
                    {member.skills.map(skill => (
                      <td key={skill.skill} className="text-center p-2">
                        <div className="flex justify-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 ${
                                i < skill.level ? 'bg-black' : 'bg-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </BrutalCard>

      {/* Allocation Modal */}
      {showAllocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <BrutalCard className="p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Allocate Resource</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Team Member</label>
                <select
                  value={selectedUser || ''}
                  onChange={(e) => setSelectedUser(e.target.value as Id<"users">)}
                  className="w-full px-3 py-2 border-2 border-black focus:outline-none"
                >
                  <option value="">Select member...</option>
                  {users?.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({teamUtilization.find(u => u.user._id === user._id)?.totalAllocation || 0}% allocated)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Allocation Percentage: {allocationPercentage}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={allocationPercentage}
                  onChange={(e) => setAllocationPercentage(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <BrutalInput
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g., Developer, Designer, Manager"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <BrutalInput
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <BrutalInput
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <BrutalButton
                  onClick={handleAllocateResource}
                  variant="primary"
                  icon={<Save className="w-4 h-4" />}
                >
                  Save Allocation
                </BrutalButton>
                <BrutalButton
                  onClick={() => setShowAllocationModal(false)}
                  variant="secondary"
                >
                  Cancel
                </BrutalButton>
              </div>
            </div>
          </BrutalCard>
        </div>
      )}
    </div>
  )
}

export default ResourcePlanner