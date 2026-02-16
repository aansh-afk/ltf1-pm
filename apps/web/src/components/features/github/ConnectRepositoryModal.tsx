import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { useMutation, useAction } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import toast from 'react-hot-toast'
import BrutalModal from '../../ui/BrutalModal'
import { HiOutlineSearch, HiOutlineLockClosed, HiOutlineGlobeAlt, HiOutlineRefresh } from 'react-icons/hi'
import { VscGithub } from 'react-icons/vsc'

interface ConnectRepositoryModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  workspaceId?: string
  onSuccess?: () => void
}

interface Repository {
  id: number
  name: string
  fullName: string
  description: string | null
  private: boolean
  htmlUrl: string
  language: string | null
  stargazersCount: number
  forksCount: number
  openIssuesCount: number
  updatedAt: string
  defaultBranch: string
  source: 'oauth' | 'installation'
  installationId?: number
}

export default function ConnectRepositoryModal({
  isOpen,
  onClose,
  projectId,
  workspaceId,
  onSuccess
}: ConnectRepositoryModalProps) {
  const [mode, setMode] = useState<'picker' | 'manual'>('picker')
  const [url, setUrl] = useState('')
  const [provider, setProvider] = useState<'github' | 'gitlab' | 'bitbucket'>('github')
  const [isConnecting, setIsConnecting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [hasOAuth, setHasOAuth] = useState(true)

  const connectRepository = useMutation(api.projects.mutations.connectRepository)
  const fetchAvailableRepositories = useAction(api.integrations.github.actions.fetchAvailableRepositories)

  // Load repositories when modal opens
  useEffect(() => {
    if (isOpen) {
      loadRepositories()
    }
  }, [isOpen, workspaceId])

  const loadRepositories = async () => {
    setIsLoading(true)
    try {
      const result = await fetchAvailableRepositories({
        workspaceId: workspaceId as Id<'workspaces'> | undefined,
      })
      setRepositories(result.repositories)
      setHasOAuth(result.sources.hasOAuth)
    } catch (error) {
      console.error('Failed to fetch repositories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (mode === 'manual') {
      if (!url.trim()) {
        toast.error('Repository URL is required')
        return
      }

      const urlPattern = /^https:\/\/(github\.com|gitlab\.com|bitbucket\.org)\/[\w\-\.]+\/[\w\-\.]+\/?$/
      if (!urlPattern.test(url.trim())) {
        toast.error('Please enter a valid repository URL')
        return
      }

      setIsConnecting(true)

      try {
        await connectRepository({
          projectId: projectId as Id<'projects'>,
          repositoryUrl: url.trim(),
          provider: provider,
        })

        toast.success('Repository connected successfully')
        onSuccess?.()
        onClose()

        // Reset form
        setUrl('')
        setProvider('github')
      } catch (error: any) {
        toast.error(error.message || 'Failed to connect repository')
      } finally {
        setIsConnecting(false)
      }
    }
  }

  const filteredRepos = repositories.filter(repo => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      repo.name.toLowerCase().includes(query) ||
      repo.fullName.toLowerCase().includes(query) ||
      (repo.description?.toLowerCase().includes(query) || false)
    )
  })

  const getLanguageColor = (language: string | null) => {
    const colors: Record<string, string> = {
      TypeScript: 'bg-blue-500',
      JavaScript: 'bg-yellow-400',
      Python: 'bg-green-500',
      Rust: 'bg-orange-500',
      Go: 'bg-cyan-500',
      Java: 'bg-red-500',
      'C++': 'bg-pink-500',
      C: 'bg-gray-500',
      Ruby: 'bg-red-600',
      PHP: 'bg-purple-500',
    }
    return colors[language || ''] || 'bg-gray-400'
  }

  const handleConnectRepo = async (repo: Repository) => {
    setIsConnecting(true)
    try {
      await connectRepository({
        projectId: projectId as Id<'projects'>,
        repositoryUrl: repo.htmlUrl,
        provider: 'github',
      })
      toast.success('Repository connected successfully')
      onSuccess?.()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to connect repository')
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <BrutalModal
      isOpen={isOpen}
      onClose={onClose}
      title="UNKNOWN" // We hide the default header in BrutalModal or just ignore it if we provide our own UI structure inside
      size="xl"
    >
      <div className="flex flex-col h-[70vh]">
        {/* Header - Vercel Style */}
        <div className="px-[16px] py-[12px] border-b-2 border-[var(--theme-border)] bg-[var(--theme-background)] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-[16px] font-bold uppercase mb-4px">Import Git Repository</h2>
            <p className="text-brutal-sm text-[var(--theme-foreground)]/60">
              Select a repository to link to your project.
            </p>
          </div>
          {/* Custom Close / Mode Switcher */}
          <div className="flex bg-[var(--theme-background-secondary)] rounded-lg p-4px border-2 border-[var(--theme-border)]">
            <button
              type="button"
              onClick={() => setMode('picker')}
              className={`px-[10px] py-6px text-brutal-xs font-bold uppercase rounded-md transition-all ${mode === 'picker' ? 'bg-[var(--theme-foreground)] text-[var(--theme-background)]' : 'text-[var(--theme-foreground)]/60 hover:text-[var(--theme-foreground)]'
                }`}
            >
              Select
            </button>
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`px-[10px] py-6px text-brutal-xs font-bold uppercase rounded-md transition-all ${mode === 'manual' ? 'bg-[var(--theme-foreground)] text-[var(--theme-background)]' : 'text-[var(--theme-foreground)]/60 hover:text-[var(--theme-foreground)]'
                }`}
            >
              URL
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-[var(--theme-background-secondary)]/30 relative">
          {mode === 'picker' ? (
            <div className="h-full flex flex-col max-w-4xl mx-auto w-full">
              {/* Search Bar - Sticky */}
              <div className="p-[16px] pb-12px shrink-0">
                <div className="relative group">
                  <HiOutlineSearch className="absolute left-[10px] top-1/2 -translate-y-1/2 w-20px h-20px text-[var(--theme-foreground)]/40 group-focus-within:text-[var(--theme-foreground)] transition-colors" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-[24px] pr-[10px] py-[8px] bg-[var(--theme-background)] border-2 border-[var(--theme-border)]
                              font-sans text-brutal-md placeholder:text-[var(--theme-foreground)]/30
                              focus:border-[var(--theme-foreground)] focus:outline-none transition-all shadow-sm"
                    autoFocus
                  />
                  {isLoading && (
                    <div className="absolute right-[10px] top-1/2 -translate-y-1/2">
                      <HiOutlineRefresh className="w-20px h-20px animate-spin text-[var(--theme-foreground)]/40" />
                    </div>
                  )}
                </div>
              </div>

              {/* OAuth hint */}
              {!isLoading && !hasOAuth && (
                <div className="mx-[16px] mb-[8px] px-[10px] py-[6px] bg-[#F59E0B]/10 border border-[#F59E0B]/20 text-brutal-xs font-mono text-[#F59E0B]">
                  Your personal repos aren't shown — connect GitHub in your profile settings to see them.
                </div>
              )}

              {/* List */}
              <div className="flex-1 overflow-y-auto px-[12px] pb-[12px] scrollbar-thin scrollbar-thumb-[var(--theme-border)]">
                {isLoading && filteredRepos.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-[var(--theme-foreground)]/60 space-y-[8px]">
                    <div className="w-6 h-6 border-4 border-[var(--theme-border)] border-t-primary-brutalist rounded-full animate-spin" />
                    <p className="text-brutal-sm font-mono animate-pulse">FETCHING REPOSITORIES...</p>
                  </div>
                ) : filteredRepos.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                    <VscGithub className="w-6 h-6 mb-[8px]" />
                    <p className="font-bold">No repositories found.</p>
                  </div>
                ) : (
                  <div className="border-2 border-[var(--theme-border)] bg-[var(--theme-background)] rounded-lg overflow-hidden">
                    {filteredRepos.map((repo) => (
                      <div
                        key={repo.id}
                        className="flex items-center justify-between p-20px border-b-2 border-[var(--theme-border)] last:border-b-0 hover:bg-[var(--theme-background-secondary)]/50 transition-colors group"
                      >
                        <div className="flex items-center gap-[8px] min-w-0">
                          <div className="w-40px h-40px bg-[var(--theme-background-secondary)] rounded-md border-2 border-[var(--theme-border)] flex items-center justify-center shrink-0">
                            {repo.private ? <HiOutlineLockClosed className="text-[var(--theme-foreground)]/60" /> : <HiOutlineGlobeAlt className="text-[var(--theme-foreground)]/60" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-8px">
                              <span className="font-bold text-brutal-md truncate block">{repo.name}</span>
                              {repo.source === 'installation' && <span className="bg-[var(--theme-border)] px-6px py-2px text-[10px] uppercase font-bold rounded-sm text-[var(--theme-foreground)]/60">ORG</span>}
                            </div>
                            <div className="flex items-center gap-[6px] text-brutal-xs text-[var(--theme-foreground)]/50 mt-2px font-mono">
                              <span className="truncate">{repo.fullName}</span>
                              {repo.language && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-4px">
                                    <span className={`w-6px h-6px rounded-full ${getLanguageColor(repo.language)}`} />
                                    {repo.language}
                                  </span>
                                </>
                              )}
                              <span>•</span>
                              <span>{formatDistanceToNow(new Date(repo.updatedAt))} ago</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleConnectRepo(repo)}
                          disabled={isConnecting}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 px-[12px] py-10px bg-[var(--theme-foreground)] text-[var(--theme-background)] font-bold uppercase text-brutal-sm rounded-md hover:opacity-90 disabled:opacity-50 transition-all transform translate-x-4 group-hover:translate-x-0"
                        >
                          Connect
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto pt-[24px] px-[12px]">
              <form onSubmit={handleSubmit} className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-[20px] rounded-lg">
                <h3 className="text-[14px] font-semibold mb-[12px]">Link External Repository</h3>

                <div className="space-y-[12px]">
                  <div>
                    <label className="block text-brutal-xs font-bold uppercase mb-8px text-[var(--theme-foreground)]/60">Git Provider</label>
                    <div className="flex gap-[6px]">
                      {(['github', 'gitlab', 'bitbucket'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setProvider(p)}
                          className={`flex-1 py-12px border-2 font-bold uppercase text-brutal-xs transition-colors rounded-md ${provider === p ? 'border-[var(--theme-foreground)] bg-[var(--theme-foreground)] text-[var(--theme-background)]' : 'border-[var(--theme-border)] hover:border-[var(--theme-foreground)]'
                            }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-brutal-xs font-bold uppercase mb-8px text-[var(--theme-foreground)]/60">Repository URL</label>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="w-full px-[10px] py-12px bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-brutal-sm focus:border-[var(--theme-foreground)] focus:outline-none rounded-md"
                      placeholder="https://github.com/username/repo"
                      required
                    />
                  </div>
                </div>

                <div className="mt-[16px] flex justify-end gap-[8px]">
                  <button onClick={onClose} type="button" className="text-brutal-sm font-bold uppercase text-[var(--theme-foreground)]/60 hover:text-[var(--theme-foreground)]">Cancel</button>
                  <button type="submit" disabled={isConnecting} className="px-[12px] py-12px bg-[var(--theme-foreground)] text-[var(--theme-background)] font-bold uppercase text-brutal-sm rounded-md hover:opacity-90 disabled:opacity-50">
                    {isConnecting ? 'Connecting...' : 'Connect'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </BrutalModal>
  )
}
