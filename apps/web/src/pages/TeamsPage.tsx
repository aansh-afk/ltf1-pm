import React, { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { useEnsureUser } from '../hooks/useEnsureUser'
import { HiOutlinePlus, HiOutlineUsers, HiOutlineCog, HiOutlineUserAdd } from 'react-icons/hi'
import { toast } from 'react-hot-toast'
import BrutalistLoader from '../components/common/BrutalistLoader'
import BrutalCard from '@/components/ui/BrutalCard'
import BrutalButton from '@/components/ui/BrutalButton'
import BrutalModal from '@/components/ui/BrutalModal'

export default function TeamsPage() {
    const { user, isLoading: isUserLoading } = useEnsureUser()
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [newTeamName, setNewTeamName] = useState('')
    const [newTeamDescription, setNewTeamDescription] = useState('')

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
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-[var(--theme-background)]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
                        <HiOutlineUsers className="w-8 h-8 md:w-10 md:h-10 text-[var(--theme-primary)]" />
                        TEAMS
                    </h1>
                    <p className="font-mono text-sm text-[var(--theme-foreground)]/60 uppercase tracking-wide">
                        MANAGE WORKSPACE SQUADS
                    </p>
                </div>
                <BrutalButton
                    onClick={() => setIsCreateModalOpen(true)}
                    variant="primary"
                    className="flex items-center gap-2"
                >
                    <HiOutlinePlus className="w-4 h-4" />
                    CREATE TEAM
                </BrutalButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams?.map((team) => (
                    <BrutalCard
                        key={team._id}
                        variant="default"
                        className="group hover:border-[var(--theme-primary)] transition-colors relative overflow-hidden"
                    >
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <BrutalButton variant="ghost" size="sm">
                                <HiOutlineCog className="w-4 h-4" />
                            </BrutalButton>
                        </div>

                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-[var(--theme-primary)]/10 flex items-center justify-center border border-[var(--theme-primary)]/20">
                                    <HiOutlineUsers className="w-5 h-5 text-[var(--theme-primary)]" />
                                </div>
                                <h3 className="text-xl font-bold truncate font-mono uppercase">{team.name}</h3>
                            </div>

                            <p className="text-[var(--theme-foreground)]/60 text-sm font-mono mb-6 line-clamp-2 h-10 border-l-2 border-[var(--theme-border)] pl-3">
                                {team.description || "NO DESCRIPTION PROVIDED."}
                            </p>

                            <div className="flex justify-between items-center pt-4 border-t-2 border-[var(--theme-border)]">
                                <span className="text-xs font-mono text-[var(--theme-foreground)]/60">
                                    ESTd. {new Date(team.createdAt).toLocaleDateString()}
                                </span>
                                <button className="text-xs font-bold uppercase tracking-wider hover:text-[var(--theme-primary)] flex items-center gap-1 font-mono transition-colors">
                                    <HiOutlineUserAdd className="w-3 h-3" />
                                    ADD MEMBER
                                </button>
                            </div>
                        </div>
                    </BrutalCard>
                ))}

                {teams?.length === 0 && (
                    <div className="col-span-full">
                        <BrutalCard className="flex flex-col items-center justify-center py-20 border-dashed">
                            <HiOutlineUsers className="w-16 h-16 text-[var(--theme-foreground)]/20 mb-4" />
                            <h3 className="text-xl font-bold mb-2 uppercase">NO TEAMS FOUND</h3>
                            <p className="text-[var(--theme-foreground)]/60 mb-6 font-mono text-sm">Create your first team to get started.</p>
                            <BrutalButton
                                onClick={() => setIsCreateModalOpen(true)}
                                variant="secondary"
                            >
                                CREATE TEAM
                            </BrutalButton>
                        </BrutalCard>
                    </div>
                )}
            </div>

            {/* Create Team Modal */}
            <BrutalModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="CREATE NEW TEAM"
            >
                <form onSubmit={handleCreateTeam} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2 font-mono">TEAM NAME</label>
                        <input
                            type="text"
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                            className="w-full bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-3 focus:outline-none focus:border-[var(--theme-primary)] font-mono text-sm uppercase"
                            placeholder="E.G. FRONTEND SQUAD"
                            required
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2 font-mono">DESCRIPTION</label>
                        <textarea
                            value={newTeamDescription}
                            onChange={(e) => setNewTeamDescription(e.target.value)}
                            className="w-full bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-3 focus:outline-none focus:border-[var(--theme-primary)] font-mono text-sm resize-none h-24"
                            placeholder="WHAT DOES THIS TEAM DO?"
                        />
                    </div>
                    <div className="flex justify-end gap-4 pt-4 border-t-2 border-[var(--theme-border)]">
                        <BrutalButton
                            type="button"
                            variant="ghost"
                            onClick={() => setIsCreateModalOpen(false)}
                        >
                            CANCEL
                        </BrutalButton>
                        <BrutalButton
                            type="submit"
                            variant="primary"
                        >
                            CREATE TEAM
                        </BrutalButton>
                    </div>
                </form>
            </BrutalModal>
        </div>
    )
}
