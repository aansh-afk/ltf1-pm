import { useState, useEffect } from 'react'
import { useMutation, useAction } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import toast from 'react-hot-toast'
import BrutalModal from '@/components/ui/BrutalModal'
import BrutalButton from '@/components/ui/BrutalButton'
import BrutalCard from '@/components/ui/BrutalCard'
import {
  HiOutlineSearch,
  HiOutlineLockClosed,
  HiOutlineGlobeAlt,
  HiOutlineRefresh,
  HiOutlineCheck,
  HiOutlineCalendar,
} from 'react-icons/hi'
import { VscGithub } from 'react-icons/vsc'

interface ProjectOnboardingWizardProps {
  projectId: Id<"projects">
  workspaceId: Id<"workspaces">
  onComplete: () => void
  onSkip: () => void
}

interface Repository {
  id: number
  name: string
  fullName: string
  description: string | null
  private: boolean
  htmlUrl: string
  language: string | null
  source: "oauth" | "installation"
}

const TOTAL_STEPS = 3

export default function ProjectOnboardingWizard({
  projectId,
  workspaceId,
  onComplete,
  onSkip,
}: ProjectOnboardingWizardProps) {
  const [step, setStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)

  // Step 1: Connect Repository
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [isLoadingRepos, setIsLoadingRepos] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null)

  // Step 2: Import Issues
  const [syncIssues, setSyncIssues] = useState(true)

  // Step 3: Create Sprint
  const [sprintName, setSprintName] = useState("Sprint 1")
  const [sprintGoal, setSprintGoal] = useState("")
  const [sprintStart, setSprintStart] = useState(() => {
    const d = new Date()
    return d.toISOString().split("T")[0]
  })
  const [sprintEnd, setSprintEnd] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 14)
    return d.toISOString().split("T")[0]
  })

  // @ts-expect-error Convex deep type instantiation
  const connectRepository = useMutation(api.projects.mutations.connectRepository)
  const createSprint = useMutation(api.sprints.mutations.createSprint)
  const fetchAvailableRepositories = useAction(
    api.integrations.github.actions.fetchAvailableRepositories
  )

  useEffect(() => {
    loadRepositories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadRepositories = async () => {
    setIsLoadingRepos(true)
    try {
      const result = await fetchAvailableRepositories({ workspaceId })
      setRepositories(result.repositories as Repository[])
    } catch {
      // GitHub may not be connected - that's okay
    } finally {
      setIsLoadingRepos(false)
    }
  }

  const handleNext = async () => {
    setIsSaving(true)
    try {
      if (step === 1 && selectedRepo) {
        await connectRepository({
          projectId,
          repositoryUrl: selectedRepo.htmlUrl,
          provider: "github",
        })
        toast.success("Repository connected")
      }
      if (step === 3) {
        if (sprintName.trim()) {
          await createSprint({
            projectId,
            name: sprintName.trim(),
            goal: sprintGoal.trim() || undefined,
            startDate: sprintStart,
            endDate: sprintEnd,
          })
          toast.success("Sprint created")
        }
        onComplete()
        return
      }
      setStep((s) => s + 1)
    } catch (err: any) {
      toast.error(err.message || "Something went wrong")
    } finally {
      setIsSaving(false)
    }
  }

  const handleBack = () => {
    setStep((s) => Math.max(1, s - 1))
  }

  const filteredRepos = repositories.filter((repo) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      repo.name.toLowerCase().includes(q) ||
      repo.fullName.toLowerCase().includes(q) ||
      repo.description?.toLowerCase().includes(q) ||
      false
    )
  })

  const stepLabels = ["CONNECT REPOSITORY", "IMPORT ISSUES", "CREATE FIRST SPRINT"]

  return (
    <BrutalModal
      isOpen={true}
      onClose={onSkip}
      title="PROJECT SETUP"
      size="lg"
    >
      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--theme-foreground-tertiary)]">
              STEP {step} OF {TOTAL_STEPS}
            </span>
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--theme-primary)]">
              {stepLabels[step - 1]}
            </span>
          </div>
          <div className="h-1 w-full bg-[var(--theme-background)] border border-[var(--theme-border)]">
            <div
              className="h-full bg-[var(--theme-primary)] transition-all duration-300"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[280px]">
          {step === 1 && (
            <StepConnectRepo
              repositories={filteredRepos}
              isLoading={isLoadingRepos}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedRepo={selectedRepo}
              onSelect={setSelectedRepo}
              onRefresh={loadRepositories}
            />
          )}
          {step === 2 && (
            <StepImportIssues
              syncIssues={syncIssues}
              onToggle={() => setSyncIssues(!syncIssues)}
              hasRepo={!!selectedRepo}
            />
          )}
          {step === 3 && (
            <StepCreateSprint
              name={sprintName}
              goal={sprintGoal}
              startDate={sprintStart}
              endDate={sprintEnd}
              onNameChange={setSprintName}
              onGoalChange={setSprintGoal}
              onStartChange={setSprintStart}
              onEndChange={setSprintEnd}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="border-t-2 border-[var(--theme-border)] pt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={onSkip}
            className="font-mono text-[11px] uppercase tracking-wider text-[var(--theme-foreground-tertiary)] hover:text-[var(--theme-foreground)] transition-colors"
          >
            Skip Setup
          </button>
          <div className="flex items-center gap-2">
            {step > 1 && (
              <BrutalButton
                variant="secondary"
                size="sm"
                onClick={handleBack}
                disabled={isSaving}
              >
                BACK
              </BrutalButton>
            )}
            <BrutalButton
              variant="primary"
              size="sm"
              onClick={handleNext}
              loading={isSaving}
            >
              {step === TOTAL_STEPS ? "FINISH" : "NEXT"}
            </BrutalButton>
          </div>
        </div>
      </div>
    </BrutalModal>
  )
}

/* ---- Step Components ---- */

function StepConnectRepo({
  repositories,
  isLoading,
  searchQuery,
  onSearchChange,
  selectedRepo,
  onSelect,
  onRefresh,
}: {
  repositories: Repository[]
  isLoading: boolean
  searchQuery: string
  onSearchChange: (v: string) => void
  selectedRepo: Repository | null
  onSelect: (repo: Repository | null) => void
  onRefresh: () => void
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--theme-foreground-secondary)] font-mono">
        Link a GitHub repository to this project for issue sync and code tracking.
      </p>

      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <HiOutlineSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--theme-foreground-tertiary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search repositories..."
            className="w-full pl-8 pr-3 py-2 bg-[var(--theme-background)] border-2 border-[var(--theme-border)]
                       font-mono text-xs text-[var(--theme-foreground)] placeholder:text-[var(--theme-foreground-tertiary)]
                       focus:border-[var(--theme-primary)] focus:outline-none"
          />
        </div>
        <BrutalButton variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading}>
          <HiOutlineRefresh className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </BrutalButton>
      </div>

      {/* Repo List */}
      <div className="max-h-[200px] overflow-y-auto border-2 border-[var(--theme-border)] bg-[var(--theme-background)]">
        {isLoading && repositories.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-[var(--theme-foreground-tertiary)]">
              <HiOutlineRefresh className="w-4 h-4 animate-spin" />
              <span className="font-mono text-[11px] uppercase">Fetching repositories...</span>
            </div>
          </div>
        ) : repositories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-[var(--theme-foreground-tertiary)]">
            <VscGithub className="w-6 h-6 mb-2" />
            <span className="font-mono text-[11px]">No repositories found. Connect GitHub first.</span>
          </div>
        ) : (
          repositories.map((repo) => {
            const isSelected = selectedRepo?.id === repo.id
            return (
              <div
                key={repo.id}
                onClick={() => onSelect(isSelected ? null : repo)}
                className={`flex items-center justify-between px-3 py-2.5 border-b border-[var(--theme-border)] last:border-b-0 cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-[var(--theme-primary)]/10"
                    : "hover:bg-[var(--theme-background-secondary)]"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {repo.private ? (
                    <HiOutlineLockClosed className="w-3.5 h-3.5 text-[var(--theme-foreground-tertiary)] shrink-0" />
                  ) : (
                    <HiOutlineGlobeAlt className="w-3.5 h-3.5 text-[var(--theme-foreground-tertiary)] shrink-0" />
                  )}
                  <div className="min-w-0">
                    <span className="font-mono text-xs font-bold block truncate">{repo.name}</span>
                    <span className="font-mono text-[10px] text-[var(--theme-foreground-tertiary)] truncate block">
                      {repo.fullName}
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 bg-[var(--theme-primary)] flex items-center justify-center shrink-0">
                    <HiOutlineCheck className="w-3 h-3 text-[var(--theme-background)]" />
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function StepImportIssues({
  syncIssues,
  onToggle,
  hasRepo,
}: {
  syncIssues: boolean
  onToggle: () => void
  hasRepo: boolean
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-[var(--theme-foreground-secondary)] font-mono">
        Sync existing GitHub issues into this project. Changes will be kept in sync bi-directionally.
      </p>

      {!hasRepo ? (
        <BrutalCard variant="default" padding="md">
          <div className="text-center py-4">
            <VscGithub className="w-8 h-8 mx-auto mb-2 text-[var(--theme-foreground-tertiary)]" />
            <p className="font-mono text-xs text-[var(--theme-foreground-tertiary)]">
              No repository connected. Skip this step or go back to connect one.
            </p>
          </div>
        </BrutalCard>
      ) : (
        <BrutalCard
          variant={syncIssues ? "elevated" : "default"}
          hoverable
          padding="md"
          onClick={onToggle}
          className={`cursor-pointer transition-all ${
            syncIssues
              ? "border-[var(--theme-primary)] shadow-[4px_4px_0px_var(--theme-primary)]"
              : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="font-mono text-xs font-bold uppercase tracking-wider">
                Bi-directional Issue Sync
              </span>
              <p className="text-[11px] text-[var(--theme-foreground-tertiary)] font-mono leading-relaxed">
                Import open GitHub issues as tasks and keep status changes synced between platforms.
                New tasks created here will also appear as GitHub issues.
              </p>
            </div>
            <div
              className={`w-12 h-6 border-2 relative transition-colors shrink-0 ml-4 ${
                syncIssues
                  ? "bg-[var(--theme-primary)] border-[var(--theme-primary)]"
                  : "bg-[var(--theme-background)] border-[var(--theme-border)]"
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 bg-[var(--theme-foreground)] transition-all ${
                  syncIssues ? "left-[calc(100%-18px)]" : "left-0.5"
                }`}
              />
            </div>
          </div>
        </BrutalCard>
      )}
    </div>
  )
}

function StepCreateSprint({
  name,
  goal,
  startDate,
  endDate,
  onNameChange,
  onGoalChange,
  onStartChange,
  onEndChange,
}: {
  name: string
  goal: string
  startDate: string
  endDate: string
  onNameChange: (v: string) => void
  onGoalChange: (v: string) => void
  onStartChange: (v: string) => void
  onEndChange: (v: string) => void
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-[var(--theme-foreground-secondary)] font-mono">
        Create your first sprint to start organizing work into time-boxed iterations.
      </p>

      <div className="space-y-3">
        <div>
          <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--theme-foreground-tertiary)] mb-1">
            Sprint Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Sprint 1"
            className="w-full px-3 py-2 bg-[var(--theme-background)] border-2 border-[var(--theme-border)]
                       font-mono text-xs text-[var(--theme-foreground)] placeholder:text-[var(--theme-foreground-tertiary)]
                       focus:border-[var(--theme-primary)] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--theme-foreground-tertiary)] mb-1">
              <HiOutlineCalendar className="w-3 h-3 inline mr-1" />
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartChange(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--theme-background)] border-2 border-[var(--theme-border)]
                         font-mono text-xs text-[var(--theme-foreground)]
                         focus:border-[var(--theme-primary)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--theme-foreground-tertiary)] mb-1">
              <HiOutlineCalendar className="w-3 h-3 inline mr-1" />
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndChange(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--theme-background)] border-2 border-[var(--theme-border)]
                         font-mono text-xs text-[var(--theme-foreground)]
                         focus:border-[var(--theme-primary)] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--theme-foreground-tertiary)] mb-1">
            Sprint Goal (optional)
          </label>
          <textarea
            value={goal}
            onChange={(e) => onGoalChange(e.target.value)}
            placeholder="What do you want to accomplish in this sprint?"
            rows={3}
            className="w-full px-3 py-2 bg-[var(--theme-background)] border-2 border-[var(--theme-border)]
                       font-mono text-xs text-[var(--theme-foreground)] placeholder:text-[var(--theme-foreground-tertiary)]
                       focus:border-[var(--theme-primary)] focus:outline-none resize-none"
          />
        </div>
      </div>
    </div>
  )
}
