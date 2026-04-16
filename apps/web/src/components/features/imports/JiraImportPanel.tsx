import { useState } from 'react'
import { useAction } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import toast from 'react-hot-toast'
import BrutalCard from '@/components/ui/BrutalCard'
import BrutalButton from '@/components/ui/BrutalButton'
import BrutalInput from '@/components/ui/BrutalInput'
import BrutalBadge from '@/components/ui/BrutalBadge'
import { HiOutlineCheckCircle } from 'react-icons/hi'

type JiraProject = {
  id: string
  key: string
  name: string
  projectTypeKey: string
}

type JiraMe = {
  accountId: string
  displayName: string
  emailAddress?: string
}

interface Props {
  workspaceId: Id<'workspaces'>
  onImportStarted: (importId: Id<'imports'>) => void
}

export function JiraImportPanel({ workspaceId, onImportStarted }: Props) {
  const testConnection = useAction(api.integrations.jira.import.testConnection)
  const startImport = useAction(api.integrations.jira.import.startImport)

  const [host, setHost] = useState('')
  const [email, setEmail] = useState('')
  const [apiToken, setApiToken] = useState('')
  const [testing, setTesting] = useState(false)
  const [starting, setStarting] = useState(false)
  const [me, setMe] = useState<JiraMe | null>(null)
  const [projects, setProjects] = useState<Array<JiraProject>>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  async function handleTest() {
    if (!host.trim() || !email.trim() || !apiToken.trim()) {
      toast.error('Fill in host, email, and API token.')
      return
    }
    setTesting(true)
    try {
      const result = await testConnection({
        host: host.trim(),
        email: email.trim(),
        apiToken: apiToken.trim(),
      })
      setMe(result.me)
      setProjects(result.projects)
      if (result.projects.length > 0) setSelectedProjectId(result.projects[0].id)
      toast.success(`Connected as ${result.me.displayName}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connection failed'
      toast.error(msg)
      setMe(null)
      setProjects([])
    } finally {
      setTesting(false)
    }
  }

  async function handleStart() {
    const project = projects.find((p) => p.id === selectedProjectId)
    if (!project) {
      toast.error('Pick a project to import.')
      return
    }
    setStarting(true)
    try {
      const importId = await startImport({
        host: host.trim(),
        email: email.trim(),
        apiToken: apiToken.trim(),
        workspaceId,
        projectId: project.id,
        projectKey: project.key,
        projectName: project.name,
      })
      onImportStarted(importId)
      setApiToken('')
      toast.success(`Importing ${project.name}…`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start import'
      toast.error(msg)
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="space-y-6">
      <BrutalCard padding="lg">
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-mono uppercase text-sm tracking-wide font-bold">
              Step 1 — Connect
            </h2>
            <p className="font-mono text-xs text-[var(--theme-foreground)]/60">
              Create a Jira API token at{' '}
              <a
                href="https://id.atlassian.com/manage-profile/security/api-tokens"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                id.atlassian.com → API tokens
              </a>
              .
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <BrutalInput
              label="Jira host"
              placeholder="acme.atlassian.net"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              fullWidth
              autoComplete="off"
            />
            <BrutalInput
              label="Email"
              type="email"
              placeholder="you@acme.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              autoComplete="off"
            />
          </div>

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <BrutalInput
                label="API token"
                type="password"
                placeholder="ATATT3x..."
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                fullWidth
                autoComplete="off"
              />
            </div>
            <BrutalButton
              onClick={handleTest}
              disabled={testing || !host.trim() || !email.trim() || !apiToken.trim()}
            >
              {testing ? 'Testing…' : 'Test connection'}
            </BrutalButton>
          </div>

          {me && (
            <div className="flex items-center gap-2 font-mono text-sm text-[var(--theme-success)]">
              <HiOutlineCheckCircle />
              Connected as <span className="font-bold">{me.displayName}</span>
              {me.emailAddress && (
                <span className="text-[var(--theme-foreground)]/50">({me.emailAddress})</span>
              )}
            </div>
          )}
        </div>
      </BrutalCard>

      {projects.length > 0 && (
        <BrutalCard padding="lg">
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="font-mono uppercase text-sm tracking-wide font-bold">
                Step 2 — Pick a project
              </h2>
              <p className="font-mono text-xs text-[var(--theme-foreground)]/60">
                A new LTF1 project will be created. Re-importing is idempotent.
              </p>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {projects.map((project) => (
                <label
                  key={project.id}
                  className={
                    'flex items-center justify-between p-3 border-2 cursor-pointer transition-colors ' +
                    (selectedProjectId === project.id
                      ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/10'
                      : 'border-[var(--theme-border)] hover:border-[var(--theme-foreground)]/40')
                  }
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="jira-project"
                      value={project.id}
                      checked={selectedProjectId === project.id}
                      onChange={() => setSelectedProjectId(project.id)}
                      className="accent-[var(--theme-accent)]"
                    />
                    <div className="space-y-0.5">
                      <div className="font-mono text-sm font-bold">{project.name}</div>
                      <div className="font-mono text-xs text-[var(--theme-foreground)]/60">
                        {project.key}
                      </div>
                    </div>
                  </div>
                  <BrutalBadge size="sm">{project.projectTypeKey}</BrutalBadge>
                </label>
              ))}
            </div>

            <div className="flex justify-end">
              <BrutalButton
                variant="primary"
                onClick={handleStart}
                disabled={starting || !selectedProjectId}
              >
                {starting ? 'Starting…' : 'Start import'}
              </BrutalButton>
            </div>
          </div>
        </BrutalCard>
      )}
    </div>
  )
}
