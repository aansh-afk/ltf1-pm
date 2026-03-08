import React, { useState } from 'react'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import { useEnsureUser } from '@/hooks/useEnsureUser'
import { HiOutlinePlus, HiOutlineUsers, HiOutlineCog, HiOutlineUserAdd } from 'react-icons/hi'
import { toast } from 'react-hot-toast'
import { m } from 'framer-motion'
import BrutalistLoader from '@/components/common/BrutalistLoader'
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
        <ErrorBoundary>
        <div className="p-4 max-w-7xl mx-auto min-h-screen">
            {/* Page Header */}
            <m.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-4"
            >
                <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--theme-primary)] mb-1">WORKSPACE</p>
                    <h1 className="font-mono text-xl font-bold uppercase tracking-tight text-[var(--theme-foreground)] flex items-center gap-2">
                        <HiOutlineUsers className="w-5 h-5 text-[var(--theme-primary)]" />
                        TEAMS
                    </h1>
                    <p className="font-mono text-xs text-[var(--theme-foreground-tertiary)] uppercase tracking-wider mt-1">
                        MANAGE WORKSPACE SQUADS
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-3 py-2 bg-[var(--theme-primary)] text-white font-mono text-xs uppercase tracking-wider font-bold border-2 border-[var(--theme-primary-active)] flex items-center gap-1.5 hover:bg-[var(--theme-primary-active)]"
                >
                    <HiOutlinePlus className="w-4 h-4" />
                    CREATE TEAM
                </button>
            </m.div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {teams?.map((team, index) => (
                    <m.div
                        key={team._id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                        className="group bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-border)] p-4 hover:border-[var(--theme-primary)] transition-colors relative overflow-hidden"
                    >
                        {/* Settings Button */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button className="p-1.5 text-[var(--theme-foreground-tertiary)] hover:text-[var(--theme-foreground)] hover:bg-[var(--theme-background-secondary)]">
                                <HiOutlineCog className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Team Header */}
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 bg-[var(--theme-primary)]/10 flex items-center justify-center border border-[var(--theme-primary)]/20">
                                <HiOutlineUsers className="w-4 h-4 text-[var(--theme-primary)]" />
                            </div>
                            <h3 className="font-mono text-sm font-bold uppercase text-[var(--theme-foreground)] truncate">{team.name}</h3>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-[var(--theme-foreground-tertiary)] font-mono mb-3 line-clamp-2 h-10 border-l-2 border-[var(--theme-border)] pl-3">
                            {team.description || "NO DESCRIPTION PROVIDED."}
                        </p>

                        {/* Footer */}
                        <div className="flex justify-between items-center pt-3 border-t border-[var(--theme-border)]">
                            <span className="font-mono text-[10px] text-[var(--theme-foreground-tertiary)] uppercase tracking-wider">
                                ESTd. {new Date(team.createdAt).toLocaleDateString()}
                            </span>
                            <button
                                onClick={() => setAddMemberTeam({ id: team._id, name: team.name })}
                                className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--theme-foreground-secondary)] hover:text-[var(--theme-primary)] flex items-center gap-1 transition-colors"
                            >
                                <HiOutlineUserAdd className="w-3 h-3" />
                                ADD MEMBER
                            </button>
                        </div>
                    </m.div>
                ))}

                {/* Empty State */}
                {teams?.length === 0 && (
                    <div className="col-span-full">
                        <m.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col items-center justify-center py-12 bg-[var(--theme-background-secondary)] border-2 border-dashed border-[var(--theme-border)]"
                        >
                            <HiOutlineUsers className="w-10 h-10 text-[var(--theme-border)] mb-3" />
                            <h3 className="font-mono text-sm font-bold uppercase text-[var(--theme-foreground)] mb-1">NO TEAMS FOUND</h3>
                            <p className="font-mono text-xs text-[var(--theme-foreground-tertiary)] mb-4">Create your first team to get started.</p>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="px-3 py-2 bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-border)] text-[var(--theme-foreground-secondary)] font-mono text-xs uppercase tracking-wider hover:border-[var(--theme-primary)] hover:text-[var(--theme-foreground)]"
                            >
                                CREATE TEAM
                            </button>
                        </m.div>
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
                        <label htmlFor="create-team-name" className="block font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--theme-foreground-secondary)] mb-1.5">TEAM NAME</label>
                        <input
                            id="create-team-name"
                            type="text"
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                            className="w-full bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] p-2.5 focus:outline-none focus:border-[var(--theme-primary)] font-mono text-xs text-[var(--theme-foreground)] uppercase placeholder:text-[var(--theme-foreground-tertiary)]"
                            placeholder="E.G. FRONTEND SQUAD"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="create-team-description" className="block font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--theme-foreground-secondary)] mb-1.5">DESCRIPTION</label>
                        <textarea
                            id="create-team-description"
                            value={newTeamDescription}
                            onChange={(e) => setNewTeamDescription(e.target.value)}
                            className="w-full bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] p-2.5 focus:outline-none focus:border-[var(--theme-primary)] font-mono text-xs text-[var(--theme-foreground)] resize-none h-24 placeholder:text-[var(--theme-foreground-tertiary)]"
                            placeholder="WHAT DOES THIS TEAM DO?"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-3 border-t border-[var(--theme-border)]">
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="px-3 py-2 bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-border)] text-[var(--theme-foreground-secondary)] font-mono text-xs uppercase tracking-wider hover:border-[var(--theme-primary)] hover:text-[var(--theme-foreground)]"
                        >
                            CANCEL
                        </button>
                        <button
                            type="submit"
                            className="px-3 py-2 bg-[var(--theme-primary)] text-white font-mono text-xs uppercase tracking-wider font-bold border-2 border-[var(--theme-primary-active)] hover:bg-[var(--theme-primary-active)]"
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
        </ErrorBoundary>
    )
}
