import React, { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { useEnsureUser } from '../hooks/useEnsureUser'
import { Plus, Users, Settings, UserPlus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import BrutalistLoader from '../components/common/BrutalistLoader'

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
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-black mb-2 tracking-tighter">TEAMS</h1>
                    <p className="text-[var(--theme-muted)] font-mono uppercase tracking-widest text-sm">
                        Manage your workspace squads
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-[var(--theme-accent)] text-[var(--theme-background)] px-6 py-3 font-bold uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Create Team
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams?.map((team) => (
                    <div
                        key={team._id}
                        className="border-2 border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 hover:border-[var(--theme-accent)] transition-colors group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Settings className="w-5 h-5 text-[var(--theme-muted)] hover:text-[var(--theme-foreground)] cursor-pointer" />
                        </div>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-[var(--theme-accent)]/10 flex items-center justify-center border border-[var(--theme-accent)]/20">
                                <Users className="w-5 h-5 text-[var(--theme-accent)]" />
                            </div>
                            <h3 className="text-xl font-bold truncate">{team.name}</h3>
                        </div>

                        <p className="text-[var(--theme-muted)] text-sm mb-6 line-clamp-2 h-10">
                            {team.description || "No description provided."}
                        </p>

                        <div className="flex justify-between items-center pt-4 border-t border-[var(--theme-border)]">
                            <span className="text-xs font-mono text-[var(--theme-muted)]">
                                {new Date(team.createdAt).toLocaleDateString()}
                            </span>
                            <button className="text-xs font-bold uppercase tracking-wider hover:text-[var(--theme-accent)] flex items-center gap-1">
                                <UserPlus className="w-3 h-3" />
                                Add Member
                            </button>
                        </div>
                    </div>
                ))}

                {teams?.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 border-2 border-dashed border-[var(--theme-border)]">
                        <Users className="w-16 h-16 text-[var(--theme-muted)] mb-4" />
                        <h3 className="text-xl font-bold mb-2">No Teams Yet</h3>
                        <p className="text-[var(--theme-muted)] mb-6">Create your first team to get started.</p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="text-[var(--theme-accent)] font-bold uppercase tracking-wider hover:underline"
                        >
                            Create Team
                        </button>
                    </div>
                )}
            </div>

            {/* Create Team Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-8 max-w-md w-full shadow-[8px_8px_0px_0px_var(--theme-border)]">
                        <h2 className="text-2xl font-black mb-6 uppercase tracking-tight">New Team</h2>
                        <form onSubmit={handleCreateTeam}>
                            <div className="mb-4">
                                <label className="block text-xs font-bold uppercase tracking-wider mb-2">Team Name</label>
                                <input
                                    type="text"
                                    value={newTeamName}
                                    onChange={(e) => setNewTeamName(e.target.value)}
                                    className="w-full bg-[var(--theme-surface)] border-2 border-[var(--theme-border)] p-3 focus:outline-none focus:border-[var(--theme-accent)] font-mono"
                                    placeholder="e.g. Frontend Squad"
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-xs font-bold uppercase tracking-wider mb-2">Description</label>
                                <textarea
                                    value={newTeamDescription}
                                    onChange={(e) => setNewTeamDescription(e.target.value)}
                                    className="w-full bg-[var(--theme-surface)] border-2 border-[var(--theme-border)] p-3 focus:outline-none focus:border-[var(--theme-accent)] font-mono h-24 resize-none"
                                    placeholder="What does this team do?"
                                />
                            </div>
                            <div className="flex justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-6 py-3 font-bold uppercase tracking-wider hover:bg-[var(--theme-surface)] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-[var(--theme-accent)] text-[var(--theme-background)] px-6 py-3 font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
