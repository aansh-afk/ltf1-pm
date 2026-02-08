import React, { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import { useEnsureUser } from '../hooks/useEnsureUser'
import { HiOutlinePlus, HiOutlineUsers, HiOutlineCog, HiOutlineUserAdd } from 'react-icons/hi'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import BrutalistLoader from '../components/common/BrutalistLoader'
import BrutalModal from '@/components/ui/BrutalModal'
import AddTeamMemberModal from '@/components/features/team/AddTeamMemberModal'

export default function TeamsPage() {
    const { user, isLoading: isUserLoading } = useEnsureUser()
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [newTeamName, setNewTeamName] = useState('')
    const [newTeamDescription, setNewTeamDescription] = useState('')
    const [addMemberTeam, setAddMemberTeam] = useState<{ id: Id<"teams">; name: string } | null>(null)

    const teams = useQuery(api.teams.getTeams,
        user?.preferences?.defaultWorkspaceId ? { workspaceId: user.preferences.defaultWorkspaceId } : "skip"
    )

    const createTeam = useMutation(api.teams.createTeam)

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user?.preferences?.defaultWorkspaceId) return

        try {
            await createTeam({
                workspaceId: user.preferences.defaultWorkspaceId,
                name: newTeamName,
                description: newTeamDescription,
            })
            toast.success('Team created successfully')
            setIsCreateModalOpen(false)
            setNewTeamName('')
            setNewTeamDescription('')
        } catch (error) {
            toast.error('Failed to create team')
            console.error(error)
        }
    }

    if (isUserLoading) return <BrutalistLoader />

    return (
        <div className="p-4 max-w-7xl mx-auto min-h-screen">
            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-4"
            >
                <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-[#6366F1] mb-1">WORKSPACE</p>
                    <h1 className="font-mono text-xl font-bold uppercase tracking-tight text-[#F9FAFB] flex items-center gap-2">
                        <HiOutlineUsers className="w-5 h-5 text-[#6366F1]" />
                        TEAMS
                    </h1>
                    <p className="font-mono text-xs text-[#6B7280] uppercase tracking-wider mt-1">
                        MANAGE WORKSPACE SQUADS
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-3 py-2 bg-[#6366F1] text-white font-mono text-xs uppercase tracking-wider font-bold border-2 border-[#4F46E5] flex items-center gap-1.5 hover:bg-[#4F46E5]"
                >
                    <HiOutlinePlus className="w-4 h-4" />
                    CREATE TEAM
                </button>
            </motion.div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {teams?.map((team, index) => (
                    <motion.div
                        key={team._id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                        className="group bg-[#111111] border-2 border-[#2E2E35] p-4 hover:border-[#6366F1] transition-colors relative overflow-hidden"
                    >
                        {/* Settings Button */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button className="p-1.5 text-[#6B7280] hover:text-[#F9FAFB] hover:bg-[#0A0A0A]">
                                <HiOutlineCog className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Team Header */}
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 bg-[#6366F1]/10 flex items-center justify-center border border-[#6366F1]/20">
                                <HiOutlineUsers className="w-4 h-4 text-[#6366F1]" />
                            </div>
                            <h3 className="font-mono text-sm font-bold uppercase text-[#F9FAFB] truncate">{team.name}</h3>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-[#6B7280] font-mono mb-3 line-clamp-2 h-10 border-l-2 border-[#2E2E35] pl-3">
                            {team.description || "NO DESCRIPTION PROVIDED."}
                        </p>

                        {/* Footer */}
                        <div className="flex justify-between items-center pt-3 border-t border-[#1F1F23]">
                            <span className="font-mono text-[10px] text-[#6B7280] uppercase tracking-wider">
                                ESTd. {new Date(team.createdAt).toLocaleDateString()}
                            </span>
                            <button
                                onClick={() => setAddMemberTeam({ id: team._id, name: team.name })}
                                className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] hover:text-[#6366F1] flex items-center gap-1 transition-colors"
                            >
                                <HiOutlineUserAdd className="w-3 h-3" />
                                ADD MEMBER
                            </button>
                        </div>
                    </motion.div>
                ))}

                {/* Empty State */}
                {teams?.length === 0 && (
                    <div className="col-span-full">
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col items-center justify-center py-12 bg-[#0A0A0A] border-2 border-dashed border-[#2E2E35]"
                        >
                            <HiOutlineUsers className="w-10 h-10 text-[#2E2E35] mb-3" />
                            <h3 className="font-mono text-sm font-bold uppercase text-[#F9FAFB] mb-1">NO TEAMS FOUND</h3>
                            <p className="font-mono text-xs text-[#6B7280] mb-4">Create your first team to get started.</p>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="px-3 py-2 bg-[#111111] border-2 border-[#2E2E35] text-[#9CA3AF] font-mono text-xs uppercase tracking-wider hover:border-[#6366F1] hover:text-[#F9FAFB]"
                            >
                                CREATE TEAM
                            </button>
                        </motion.div>
                    </div>
                )}
            </div>

            {/* Create Team Modal */}
            <BrutalModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="CREATE NEW TEAM"
            >
                <form onSubmit={handleCreateTeam} className="space-y-3">
                    <div>
                        <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-1.5">TEAM NAME</label>
                        <input
                            type="text"
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                            className="w-full bg-[#0A0A0A] border-2 border-[#2E2E35] p-2.5 focus:outline-none focus:border-[#6366F1] font-mono text-xs text-[#F9FAFB] uppercase placeholder:text-[#6B7280]"
                            placeholder="E.G. FRONTEND SQUAD"
                            required
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-1.5">DESCRIPTION</label>
                        <textarea
                            value={newTeamDescription}
                            onChange={(e) => setNewTeamDescription(e.target.value)}
                            className="w-full bg-[#0A0A0A] border-2 border-[#2E2E35] p-2.5 focus:outline-none focus:border-[#6366F1] font-mono text-xs text-[#F9FAFB] resize-none h-24 placeholder:text-[#6B7280]"
                            placeholder="WHAT DOES THIS TEAM DO?"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-3 border-t border-[#1F1F23]">
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="px-3 py-2 bg-[#111111] border-2 border-[#2E2E35] text-[#9CA3AF] font-mono text-xs uppercase tracking-wider hover:border-[#6366F1] hover:text-[#F9FAFB]"
                        >
                            CANCEL
                        </button>
                        <button
                            type="submit"
                            className="px-3 py-2 bg-[#6366F1] text-white font-mono text-xs uppercase tracking-wider font-bold border-2 border-[#4F46E5] hover:bg-[#4F46E5]"
                        >
                            CREATE TEAM
                        </button>
                    </div>
                </form>
            </BrutalModal>

            {/* Add Team Member Modal */}
            {addMemberTeam && (
                <AddTeamMemberModal
                    isOpen={true}
                    onClose={() => setAddMemberTeam(null)}
                    teamId={addMemberTeam.id}
                    teamName={addMemberTeam.name}
                />
            )}
        </div>
    )
}
