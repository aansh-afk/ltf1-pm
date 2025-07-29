import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import toast from 'react-hot-toast'
import BrutalModal from '../../ui/BrutalModal'
import { HiOutlineInformationCircle } from 'react-icons/hi'

interface ConnectRepositoryModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  onSuccess?: () => void
}

export default function ConnectRepositoryModal({ 
  isOpen, 
  onClose, 
  projectId,
  onSuccess 
}: ConnectRepositoryModalProps) {
  const [url, setUrl] = useState('')
  const [provider, setProvider] = useState<'github' | 'gitlab' | 'bitbucket'>('github')
  const [isConnecting, setIsConnecting] = useState(false)

  const connectRepository = useMutation(api.projects.mutations.connectRepository)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
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
        projectId: projectId as any,
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

  const exampleUrls = {
    github: 'https://github.com/username/repository',
    gitlab: 'https://gitlab.com/username/repository',
    bitbucket: 'https://bitbucket.org/username/repository'
  }

  return (
    <BrutalModal
      isOpen={isOpen}
      onClose={onClose}
      title="CONNECT REPOSITORY"
    >
      <form onSubmit={handleSubmit} className="space-y-24px">
        {/* Information Banner */}
        <div className="bg-event-horizon border-2 border-brutal-info p-16px flex gap-12px">
          <HiOutlineInformationCircle className="w-20px h-20px text-brutal-info flex-shrink-0 mt-2px" />
          <div className="text-brutal-xs text-cathode-white/80">
            Connect your repository to enable pull request tracking, commit history, and automated workflows.
          </div>
        </div>

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
                    : 'bg-event-horizon border-basalt-border text-cathode-white hover:border-primary-brutalist'
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
            className="w-full px-16px py-12px bg-event-horizon border-2 border-basalt-border 
                     font-mono text-brutal-sm placeholder:text-neutral-600
                     focus:border-primary-brutalist focus:outline-none transition-colors"
            required
          />
          <p className="text-brutal-xs text-cathode-white/60 mt-8px">
            Enter the HTTPS URL of your repository (e.g., {exampleUrls[provider]})
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-16px justify-end pt-24px border-t-2 border-basalt-border">
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
            disabled={isConnecting}
          >
            {isConnecting ? 'CONNECTING...' : 'CONNECT REPOSITORY'}
          </button>
        </div>
      </form>
    </BrutalModal>
  )
}