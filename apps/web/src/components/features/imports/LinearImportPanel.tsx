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

type LinearTeam = {
  id: string
  key: string
  name: string
  issueCount: number
}

type Viewer = {
  id: string
  name: string
  email: string
}

interface Props {
  workspaceId: Id<'workspaces'>
  onImportStarted: (importId: Id<'imports'>) => void
}

export function LinearImportPanel({ workspaceId, onImportStarted }: Props) {
  const testConnection = useAction(api.integrations.linear.import.testConnection)
  const startImport = useAction(api.integrations.linear.import.startImport)

  const [apiKey, setApiKey] = useState('')
  const [testing, setTesting] = useState(false)
  const [starting, setStarting] = useState(false)
  const [viewer, setViewer] = useState<Viewer | null>(null)
  const [teams, setTeams] = useState<Array<LinearTeam>>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

  async function handleTest() {
    if (!apiKey.trim()) {
      toast.error('Paste a Linear API key first.')
      return
    }
    setTesting(true)
    try {
      const result = await testConnection({ apiKey: apiKey.trim() })
      setViewer(result.viewer)
      setTeams(result.teams)
      if (result.teams.length > 0) {
        setSelectedTeamId(result.teams[0].id)
      }
      toast.success(`Connected as ${result.viewer.name}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connection failed'
      toast.error(msg)
      setViewer(null)
      setTeams([])
    } finally {
      setTesting(false)
    }
  }

  async function handleStart() {
    const team = teams.find((t) => t.id === selectedTeamId)
    if (!team) {
      toast.error('Pick a team to import.')
      return
    }
    setStarting(true)
    try {
      const importId = await startImport({
        apiKey: apiKey.trim(),
        workspaceId,
        teamId: team.id,
        teamName: team.name,
        teamKey: team.key,
      })
      onImportStarted(importId)
      // Clear the api key once the job is queued — it is not persisted server-side,
      // but we should also avoid leaving it in memory longer than needed.
      setApiKey('')
      toast.success(`Importing ${team.name}…`)
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
              Create a Linear personal API key at{' '}
              <a
                href="https://linear.app/settings/api"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                linear.app/settings/api
              </a>
              . It stays in this tab only.
            </p>
          </div>

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <BrutalInput
                label="Linear API key"
                type="password"
                placeholder="lin_api_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                fullWidth
                autoComplete="off"
              />
            </div>
            <BrutalButton onClick={handleTest} disabled={testing || !apiKey.trim()}>
              {testing ? 'Testing…' : 'Test connection'}
            </BrutalButton>
          </div>

          {viewer && (
            <div className="flex items-center gap-2 font-mono text-sm text-[var(--theme-success)]">
              <HiOutlineCheckCircle />
              Connected as <span className="font-bold">{viewer.name}</span>
              <span className="text-[var(--theme-foreground)]/50">({viewer.email})</span>
            </div>
          )}
        </div>
      </BrutalCard>

      {teams.length > 0 && (
        <BrutalCard padding="lg">
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="font-mono uppercase text-sm tracking-wide font-bold">
                Step 2 — Pick a team
              </h2>
              <p className="font-mono text-xs text-[var(--theme-foreground)]/60">
                A new LTF1 project will be created for the team. Re-importing the
                same team is safe — issues already imported will be updated in place.
              </p>
            </div>

            <div className="space-y-2">
              {teams.map((team) => (
                <label
                  key={team.id}
                  className={
                    'flex items-center justify-between p-3 border-2 cursor-pointer transition-colors ' +
                    (selectedTeamId === team.id
                      ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/10'
                      : 'border-[var(--theme-border)] hover:border-[var(--theme-foreground)]/40')
                  }
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="linear-team"
                      value={team.id}
                      checked={selectedTeamId === team.id}
                      onChange={() => setSelectedTeamId(team.id)}
                      className="accent-[var(--theme-accent)]"
                    />
                    <div className="space-y-0.5">
                      <div className="font-mono text-sm font-bold">{team.name}</div>
                      <div className="font-mono text-xs text-[var(--theme-foreground)]/60">
                        {team.key}
                      </div>
                    </div>
                  </div>
                  <BrutalBadge size="sm">{team.issueCount} issues</BrutalBadge>
                </label>
              ))}
            </div>

            <div className="flex justify-end">
              <BrutalButton
                variant="primary"
                onClick={handleStart}
                disabled={starting || !selectedTeamId}
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
