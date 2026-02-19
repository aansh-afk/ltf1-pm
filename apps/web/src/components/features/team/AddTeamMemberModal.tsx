import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import BrutalModal from '@/components/ui/BrutalModal'
import { HiOutlineUserAdd, HiOutlineSearch, HiOutlineUser } from 'react-icons/hi'
import { toast } from 'react-hot-toast'

interface AddTeamMemberModalProps {
  isOpen: boolean
  onClose: () => void
  teamId: Id<"teams">
  teamName: string
}

export default function AddTeamMemberModal({ isOpen, onClose, teamId, teamName }: AddTeamMemberModalProps) {
  const [search, setSearch] = useState('')
  const [selectedRole, setSelectedRole] = useState<'member' | 'lead'>('member')
  const [addingUserId, setAddingUserId] = useState<Id<"users"> | null>(null)

  const availableMembers = useQuery(
    api.teams.getAvailableMembers,
    isOpen ? { teamId } : 'skip'
  )

  const addTeamMember = useMutation(api.teams.addTeamMember)

  const filtered = availableMembers?.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = async (userId: Id<"users">) => {
    setAddingUserId(userId)
    try {
      await addTeamMember({ teamId, userId, role: selectedRole })
      toast.success('Member added to team')
    } catch (error: any) {
      toast.error(error.message || 'Failed to add member')
    } finally {
      setAddingUserId(null)
    }
  }

  const handleClose = () => {
    setSearch('')
    setSelectedRole('member')
    onClose()
  }

  return (
    <BrutalModal isOpen={isOpen} onClose={handleClose} title={`ADD MEMBER — ${teamName}`}>
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="SEARCH WORKSPACE MEMBERS..."
            className="w-full pl-10 pr-3 py-2.5 bg-[#0A0A0A] border-2 border-[#2E2E35] text-[#F9FAFB] placeholder-[#6B7280] font-mono text-xs uppercase tracking-wider focus:border-[#6366F1] focus:outline-none"
          />
        </div>

        {/* Role Selector */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">ROLE:</span>
          <div className="flex border-2 border-[#2E2E35]">
            <button
              type="button"
              onClick={() => setSelectedRole('member')}
              className={`px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider border-r border-[#2E2E35] transition-colors ${
                selectedRole === 'member'
                  ? 'bg-[#6366F1] text-white'
                  : 'bg-[#111111] text-[#6B7280] hover:text-[#F9FAFB]'
              }`}
            >
              MEMBER
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('lead')}
              className={`px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors ${
                selectedRole === 'lead'
                  ? 'bg-[#6366F1] text-white'
                  : 'bg-[#111111] text-[#6B7280] hover:text-[#F9FAFB]'
              }`}
            >
              LEAD
            </button>
          </div>
        </div>

        {/* Members List */}
        <div className="max-h-[300px] overflow-y-auto border-2 border-[#2E2E35]">
          {availableMembers === undefined ? (
            <div className="p-6 text-center">
              <span className="font-mono text-xs text-[#6B7280] uppercase tracking-wider">LOADING...</span>
            </div>
          ) : filtered && filtered.length > 0 ? (
            filtered.map((member) => (
              <div
                key={member._id}
                className="flex items-center justify-between px-3 py-2.5 border-b border-[#1F1F23] last:border-b-0 hover:bg-[#0A0A0A] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="w-7 h-7 border border-[#2E2E35] flex-shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 bg-[#111111] border border-[#2E2E35] flex items-center justify-center flex-shrink-0">
                      <HiOutlineUser className="w-3.5 h-3.5 text-[#6B7280]" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-bold text-[#F9FAFB] uppercase truncate">{member.name}</p>
                    <p className="font-mono text-[10px] text-[#6B7280] truncate">{member.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleAdd(member._id)}
                  disabled={addingUserId === member._id}
                  className="flex-shrink-0 ml-3 px-2.5 py-1.5 bg-[#111111] border-2 border-[#2E2E35] text-[#9CA3AF] font-mono text-[10px] font-bold uppercase tracking-wider hover:border-[#6366F1] hover:text-[#F9FAFB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <HiOutlineUserAdd className="w-3 h-3" />
                  {addingUserId === member._id ? 'ADDING...' : 'ADD'}
                </button>
              </div>
            ))
          ) : (
            <div className="p-6 text-center">
              <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center border-2 border-[#2E2E35] text-[#6B7280]">
                <HiOutlineUser className="w-4 h-4" />
              </div>
              <p className="font-mono text-xs text-[#6B7280] uppercase tracking-wider">
                {search ? 'NO MATCHING MEMBERS' : 'ALL WORKSPACE MEMBERS ARE IN THIS TEAM'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-[#1F1F23]">
          <button
            type="button"
            onClick={handleClose}
            className="px-3 py-2 bg-[#111111] border-2 border-[#2E2E35] text-[#9CA3AF] font-mono text-xs uppercase tracking-wider hover:border-[#6366F1] hover:text-[#F9FAFB]"
          >
            DONE
          </button>
        </div>
      </div>
    </BrutalModal>
  )
}
