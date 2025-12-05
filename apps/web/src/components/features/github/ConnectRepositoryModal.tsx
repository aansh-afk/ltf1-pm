import { useState, useEffect } from 'react'
import { useMutation, useAction, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import toast from 'react-hot-toast'
import BrutalModal from '../../ui/BrutalModal'
import { HiOutlineInformationCircle, HiOutlineSearch, HiOutlineLockClosed, HiOutlineGlobeAlt, HiOutlineExternalLink, HiOutlineStar, HiOutlineRefresh } from 'react-icons/hi'
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
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [sources, setSources] = useState<{
    hasOAuth: boolean
    hasInstallation: boolean
    installationName?: string
  } | null>(null)

  const connectRepository = useMutation(api.projects.mutations.connectRepository)
  const fetchAvailableRepositories = useAction(api.integrations.github.actions.fetchAvailableRepositories)
  const githubConnection = useQuery(api.integrations.github.oauth.getGitHubConnectionInfo)

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
      setSources(result.sources)

      // If no repositories available, switch to manual mode
      if (result.repositories.length === 0) {
        setMode('manual')
      }
    } catch (error) {
      console.error('Failed to fetch repositories:', error)
      setMode('manual')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    let repositoryUrl = ''
    let repositoryProvider: 'github' | 'gitlab' | 'bitbucket' = 'github'

    if (mode === 'picker' && selectedRepo) {
      repositoryUrl = selectedRepo.htmlUrl
      repositoryProvider = 'github'
    } else if (mode === 'manual') {
      if (!url.trim()) {
        toast.error('Repository URL is required')
        return
      }

      const urlPattern = /^https:\/\/(github\.com|gitlab\.com|bitbucket\.org)\/[\w\-\.]+\/[\w\-\.]+\/?$/
      if (!urlPattern.test(url.trim())) {
        toast.error('Please enter a valid repository URL')
        return
      }

      repositoryUrl = url.trim()
      repositoryProvider = provider
    } else {
      toast.error('Please select a repository')
      return
    }

    setIsConnecting(true)

    try {
      await connectRepository({
        projectId: projectId as Id<'projects'>,
        repositoryUrl,
        provider: repositoryProvider,
      })

      toast.success('Repository connected successfully')
      onSuccess?.()
      onClose()

      // Reset form
      setUrl('')
      setProvider('github')
      setSelectedRepo(null)
      setSearchQuery('')
    } catch (error: any) {
      toast.error(error.message || 'Failed to connect repository')
    } finally {
      setIsConnecting(false)
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

  const exampleUrls = {
    github: 'https://github.com/username/repository',
    gitlab: 'https://gitlab.com/username/repository',
    bitbucket: 'https://bitbucket.org/username/repository'
  }

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

  return (
    <BrutalModal
      isOpen={isOpen}
      onClose={onClose}
      title="CONNECT REPOSITORY"
    >
      <div className="space-y-24px">
        {/* Mode Tabs */}
        <div className="flex border-2 border-[var(--theme-border)]">
          <button
            type="button"
            onClick={() => setMode('picker')}
            className={`flex-1 px-16px py-12px text-brutal-xs uppercase font-mono transition-colors ${
              mode === 'picker'
                ? 'bg-primary-brutalist text-event-horizon'
                : 'bg-[var(--theme-background-secondary)] text-[var(--theme-foreground)] hover:bg-[var(--theme-background-tertiary)]'
            }`}
          >
            SELECT FROM LIST
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`flex-1 px-16px py-12px text-brutal-xs uppercase font-mono transition-colors border-l-2 border-[var(--theme-border)] ${
              mode === 'manual'
                ? 'bg-primary-brutalist text-event-horizon'
                : 'bg-[var(--theme-background-secondary)] text-[var(--theme-foreground)] hover:bg-[var(--theme-background-tertiary)]'
            }`}
          >
            ENTER URL
          </button>
        </div>

        {/* Information Banner */}
        <div className="bg-[var(--theme-background-secondary)] border-2 border-brutal-info p-16px flex gap-12px">
          <HiOutlineInformationCircle className="w-20px h-20px text-brutal-info flex-shrink-0 mt-2px" />
          <div className="text-brutal-xs text-[var(--theme-foreground)]/80">
            Connect your repository to enable pull request tracking, commit history, and automated workflows.
            {mode === 'picker' && sources && (
              <div className="mt-8px text-[var(--theme-foreground)]/60">
                {sources.hasOAuth && <span className="mr-12px">Personal repos available</span>}
                {sources.hasInstallation && <span>Organization repos via {sources.installationName}</span>}
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-24px">
          {mode === 'picker' ? (
            <>
              {/* Search */}
              <div className="relative">
                <HiOutlineSearch className="absolute left-12px top-1/2 -translate-y-1/2 w-16px h-16px text-[var(--theme-foreground)]/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search repositories..."
                  className="w-full pl-40px pr-16px py-12px bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)]
                           font-mono text-brutal-sm placeholder:text-neutral-600
                           focus:border-primary-brutalist focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={loadRepositories}
                  disabled={isLoading}
                  className="absolute right-8px top-1/2 -translate-y-1/2 p-8px hover:bg-[var(--theme-background-tertiary)] rounded transition-colors"
                  title="Refresh repositories"
                >
                  <HiOutlineRefresh className={`w-16px h-16px text-[var(--theme-foreground)]/60 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Repository List */}
              <div className="max-h-300px overflow-y-auto border-2 border-[var(--theme-border)]">
                {isLoading ? (
                  <div className="p-32px text-center text-[var(--theme-foreground)]/60">
                    <HiOutlineRefresh className="w-24px h-24px animate-spin mx-auto mb-12px" />
                    <p className="text-brutal-xs">Loading repositories...</p>
                  </div>
                ) : filteredRepos.length === 0 ? (
                  <div className="p-32px text-center text-[var(--theme-foreground)]/60">
                    {repositories.length === 0 ? (
                      <>
                        <VscGithub className="w-32px h-32px mx-auto mb-12px opacity-40" />
                        <p className="text-brutal-sm mb-8px">No repositories found</p>
                        <p className="text-brutal-xs">
                          {!githubConnection ?
                            'Connect your GitHub account to see your repositories' :
                            'Try entering a repository URL manually'
                          }
                        </p>
                      </>
                    ) : (
                      <p className="text-brutal-sm">No matching repositories</p>
                    )}
                  </div>
                ) : (
                  <div className="divide-y-2 divide-[var(--theme-border)]">
                    {filteredRepos.map((repo) => (
                      <button
                        key={repo.id}
                        type="button"
                        onClick={() => setSelectedRepo(repo)}
                        className={`w-full p-16px text-left transition-colors ${
                          selectedRepo?.id === repo.id
                            ? 'bg-primary-brutalist/10 border-l-4 border-primary-brutalist'
                            : 'hover:bg-[var(--theme-background-secondary)]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-12px">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-8px">
                              {repo.private ? (
                                <HiOutlineLockClosed className="w-14px h-14px text-[var(--theme-foreground)]/60 flex-shrink-0" />
                              ) : (
                                <HiOutlineGlobeAlt className="w-14px h-14px text-[var(--theme-foreground)]/60 flex-shrink-0" />
                              )}
                              <span className="text-brutal-sm font-mono font-semibold truncate">
                                {repo.fullName}
                              </span>
                            </div>
                            {repo.description && (
                              <p className="text-brutal-xs text-[var(--theme-foreground)]/60 mt-4px line-clamp-2">
                                {repo.description}
                              </p>
                            )}
                            <div className="flex items-center gap-12px mt-8px">
                              {repo.language && (
                                <span className="flex items-center gap-4px text-brutal-xs text-[var(--theme-foreground)]/60">
                                  <span className={`w-8px h-8px rounded-full ${getLanguageColor(repo.language)}`} />
                                  {repo.language}
                                </span>
                              )}
                              <span className="flex items-center gap-4px text-brutal-xs text-[var(--theme-foreground)]/60">
                                <HiOutlineStar className="w-12px h-12px" />
                                {repo.stargazersCount}
                              </span>
                              <span className="text-brutal-xs text-[var(--theme-foreground)]/40 uppercase">
                                {repo.source === 'installation' ? 'org' : 'personal'}
                              </span>
                            </div>
                          </div>
                          {selectedRepo?.id === repo.id && (
                            <span className="text-primary-brutalist text-brutal-xs font-mono">SELECTED</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Repository Preview */}
              {selectedRepo && (
                <div className="bg-[var(--theme-background-secondary)] border-2 border-primary-brutalist p-16px">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-brutal-xs text-[var(--theme-foreground)]/60 uppercase mb-4px">Selected Repository</p>
                      <p className="text-brutal-sm font-mono font-semibold">{selectedRepo.fullName}</p>
                    </div>
                    <a
                      href={selectedRepo.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-8px hover:bg-[var(--theme-background-tertiary)] rounded transition-colors"
                    >
                      <HiOutlineExternalLink className="w-16px h-16px text-[var(--theme-foreground)]/60" />
                    </a>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Provider Selection */}
              <div>
                <label className="block text-brutal-sm uppercase mb-8px">
                  PROVIDER
                </label>
                <div className="grid grid-cols-3 gap-8px">
                  {(['github', 'gitlab', 'bitbucket'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setProvider(p)}
                      className={`px-16px py-12px border-2 text-brutal-xs uppercase font-mono transition-colors ${
                        provider === p
                          ? 'bg-primary-brutalist border-primary-brutalist text-event-horizon'
                          : 'bg-[var(--theme-background-secondary)] border-[var(--theme-border)] text-[var(--theme-foreground)] hover:border-primary-brutalist'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Repository URL */}
              <div>
                <label className="block text-brutal-sm uppercase mb-8px">
                  REPOSITORY URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={exampleUrls[provider]}
                  className="w-full px-16px py-12px bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)]
                           font-mono text-brutal-sm placeholder:text-neutral-600
                           focus:border-primary-brutalist focus:outline-none transition-colors"
                  required={mode === 'manual'}
                />
                <p className="text-brutal-xs text-[var(--theme-foreground)]/60 mt-8px">
                  Enter the HTTPS URL of your repository (e.g., {exampleUrls[provider]})
                </p>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-16px justify-end pt-24px border-t-2 border-[var(--theme-border)]">
            <button
              type="button"
              onClick={onClose}
              className="brutal-btn-secondary"
              disabled={isConnecting}
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="brutal-btn"
              disabled={isConnecting || (mode === 'picker' && !selectedRepo)}
            >
              {isConnecting ? 'CONNECTING...' : 'CONNECT REPOSITORY'}
            </button>
          </div>
        </form>
      </div>
    </BrutalModal>
  )
}
