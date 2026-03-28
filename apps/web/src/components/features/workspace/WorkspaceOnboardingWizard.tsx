import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import toast from 'react-hot-toast'
import BrutalModal from '@/components/ui/BrutalModal'
import BrutalButton from '@/components/ui/BrutalButton'
import BrutalCard from '@/components/ui/BrutalCard'
import { GitHubConnectButton } from '@/components/features/github/GitHubConnectButton'
import { GitHubInstallationButton } from '@/components/features/github/GitHubInstallationButton'
import {
  HiOutlineLightningBolt,
  HiOutlineEye,
  HiOutlineBan,
  HiOutlineMail,
  HiOutlineX,
  HiOutlineCheck,
} from 'react-icons/hi'
import { FaGithub } from 'react-icons/fa'

interface WorkspaceOnboardingWizardProps {
  workspaceId: Id<"workspaces">
  onComplete: () => void
  onSkip: () => void
}

type TriageMode = "auto" | "review" | "off"

interface InviteEntry {
  email: string
  role: "admin" | "member" | "viewer"
}

const TOTAL_STEPS = 4

export default function WorkspaceOnboardingWizard({
  workspaceId,
  onComplete,
  onSkip,
}: WorkspaceOnboardingWizardProps) {
  const [step, setStep] = useState(1)
  const [triageMode, setTriageMode] = useState<TriageMode>("review")
  const [invites, setInvites] = useState<InviteEntry[]>([])
  const [currentEmail, setCurrentEmail] = useState("")
  const [currentRole, setCurrentRole] = useState<"admin" | "member" | "viewer">("member")
  const [enabledSkills, setEnabledSkills] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)

  const updateTriageSettings = useMutation(api.agent.mutations.updateTriageSettings)
  const inviteToWorkspace = useMutation(api.workspaces.mutations.inviteToWorkspace)
  const toggleSkillMutation = useMutation(api.skills.mutations.toggleSkill)
  const workspaceSkills = useQuery(api.skills.queries.getWorkspaceSkills, { workspaceId })
  const builtInSkills = useQuery(api.skills.queries.getBuiltInSkills)

  const handleNext = async () => {
    setIsSaving(true)
    try {
      if (step === 2) {
        await updateTriageSettings({ workspaceId, triageMode })
      }
      if (step === 3 && invites.length > 0) {
        for (const invite of invites) {
          try {
            await inviteToWorkspace({
              workspaceId,
              email: invite.email,
              role: invite.role,
            })
          } catch (err: any) {
            toast.error(`Failed to invite ${invite.email}: ${err.message}`)
          }
        }
      }
      if (step === 4) {
        // Toggle workspace skills that the user selected
        if (workspaceSkills && enabledSkills.size > 0) {
          for (const skill of workspaceSkills) {
            const shouldBeEnabled = enabledSkills.has(skill.name)
            const isCurrentlyActive = skill.isActive ?? false
            if (shouldBeEnabled !== isCurrentlyActive) {
              try {
                await toggleSkillMutation({ skillId: skill._id })
              } catch {
                // Skill toggle may fail silently
              }
            }
          }
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

  const addInvite = () => {
    const trimmed = currentEmail.trim().toLowerCase()
    if (!trimmed) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Invalid email address")
      return
    }
    if (invites.some((i) => i.email === trimmed)) {
      toast.error("Email already added")
      return
    }
    setInvites([...invites, { email: trimmed, role: currentRole }])
    setCurrentEmail("")
  }

  const removeInvite = (email: string) => {
    setInvites(invites.filter((i) => i.email !== email))
  }

  const toggleSkillName = (name: string) => {
    setEnabledSkills((prev) => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  const stepLabels = ["CONNECT GITHUB", "SET UP TRIAGE", "INVITE TEAM", "PICK SKILLS"]

  return (
    <BrutalModal
      isOpen={true}
      onClose={onSkip}
      title="WORKSPACE SETUP"
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
            <StepGitHub workspaceId={workspaceId} />
          )}
          {step === 2 && (
            <StepTriage triageMode={triageMode} onSelect={setTriageMode} />
          )}
          {step === 3 && (
            <StepInvite
              invites={invites}
              currentEmail={currentEmail}
              currentRole={currentRole}
              onEmailChange={setCurrentEmail}
              onRoleChange={setCurrentRole}
              onAdd={addInvite}
              onRemove={removeInvite}
            />
          )}
          {step === 4 && (
            <StepSkills
              skills={(workspaceSkills ?? builtInSkills ?? []) as Array<{
                name: string
                displayName: string
                description: string
                trigger: "manual" | "auto" | "both"
                isActive?: boolean
              }>}
              enabledSkills={enabledSkills}
              onToggle={toggleSkillName}
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

function StepGitHub({ workspaceId }: { workspaceId: string }) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-[var(--theme-foreground-secondary)] font-mono">
        Connect your GitHub account and install the app to enable repository sync, issue tracking, and automated workflows.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <BrutalCard variant="elevated" padding="md">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FaGithub className="w-5 h-5 text-[var(--theme-foreground)]" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider">
                Personal Account
              </span>
            </div>
            <p className="text-[11px] text-[var(--theme-foreground-tertiary)] font-mono">
              Connect your GitHub account via OAuth for personal repo access.
            </p>
            <GitHubConnectButton variant="secondary" size="sm" />
          </div>
        </BrutalCard>
        <BrutalCard variant="elevated" padding="md">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FaGithub className="w-5 h-5 text-[var(--theme-foreground)]" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider">
                Organization
              </span>
            </div>
            <p className="text-[11px] text-[var(--theme-foreground-tertiary)] font-mono">
              Install the GitHub App on your org for team-wide access.
            </p>
            <GitHubInstallationButton workspaceId={workspaceId} />
          </div>
        </BrutalCard>
      </div>
    </div>
  )
}

const TRIAGE_OPTIONS: Array<{
  mode: TriageMode
  label: string
  description: string
  icon: typeof HiOutlineLightningBolt
}> = [
  {
    mode: "auto",
    label: "AUTO",
    description: "Agent applies suggestions automatically. Best for fast-moving teams.",
    icon: HiOutlineLightningBolt,
  },
  {
    mode: "review",
    label: "REVIEW",
    description: "Agent suggests, you decide. Best for teams that want control.",
    icon: HiOutlineEye,
  },
  {
    mode: "off",
    label: "OFF",
    description: "No automatic triage. You categorize everything manually.",
    icon: HiOutlineBan,
  },
]

function StepTriage({
  triageMode,
  onSelect,
}: {
  triageMode: TriageMode
  onSelect: (mode: TriageMode) => void
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-[var(--theme-foreground-secondary)] font-mono">
        Choose how the AI agent triages incoming tasks and issues in this workspace.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {TRIAGE_OPTIONS.map(({ mode, label, description, icon: Icon }) => (
          <BrutalCard
            key={mode}
            variant={triageMode === mode ? "elevated" : "default"}
            hoverable
            padding="md"
            onClick={() => onSelect(mode)}
            className={`cursor-pointer transition-all ${
              triageMode === mode
                ? "border-[var(--theme-primary)] shadow-[4px_4px_0px_var(--theme-primary)]"
                : ""
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Icon
                  className={`w-5 h-5 ${
                    triageMode === mode
                      ? "text-[var(--theme-primary)]"
                      : "text-[var(--theme-foreground-tertiary)]"
                  }`}
                />
                <span className="font-mono text-xs font-bold uppercase tracking-wider">
                  {label}
                </span>
              </div>
              <p className="text-[11px] text-[var(--theme-foreground-tertiary)] font-mono leading-relaxed">
                {description}
              </p>
              {triageMode === mode && (
                <div className="flex items-center gap-1 text-[var(--theme-primary)]">
                  <HiOutlineCheck className="w-3.5 h-3.5" />
                  <span className="font-mono text-[10px] font-bold uppercase">Selected</span>
                </div>
              )}
            </div>
          </BrutalCard>
        ))}
      </div>
    </div>
  )
}

function StepInvite({
  invites,
  currentEmail,
  currentRole,
  onEmailChange,
  onRoleChange,
  onAdd,
  onRemove,
}: {
  invites: InviteEntry[]
  currentEmail: string
  currentRole: "admin" | "member" | "viewer"
  onEmailChange: (v: string) => void
  onRoleChange: (v: "admin" | "member" | "viewer") => void
  onAdd: () => void
  onRemove: (email: string) => void
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-[var(--theme-foreground-secondary)] font-mono">
        Invite team members to collaborate in this workspace. You can always add more later.
      </p>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <HiOutlineMail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--theme-foreground-tertiary)]" />
          <input
            type="email"
            placeholder="teammate@company.com"
            value={currentEmail}
            onChange={(e) => onEmailChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                onAdd()
              }
            }}
            className="w-full pl-8 pr-3 py-2 bg-[var(--theme-background)] border-2 border-[var(--theme-border)]
                       font-mono text-xs text-[var(--theme-foreground)] placeholder:text-[var(--theme-foreground-tertiary)]
                       focus:border-[var(--theme-primary)] focus:outline-none"
          />
        </div>
        <select
          value={currentRole}
          onChange={(e) => onRoleChange(e.target.value as "admin" | "member" | "viewer")}
          className="px-2 py-2 bg-[var(--theme-background)] border-2 border-[var(--theme-border)]
                     font-mono text-xs text-[var(--theme-foreground)] uppercase
                     focus:border-[var(--theme-primary)] focus:outline-none"
        >
          <option value="admin">ADMIN</option>
          <option value="member">MEMBER</option>
          <option value="viewer">VIEWER</option>
        </select>
        <BrutalButton variant="secondary" size="sm" onClick={onAdd}>
          ADD
        </BrutalButton>
      </div>

      {invites.length > 0 && (
        <div className="border-2 border-[var(--theme-border)] bg-[var(--theme-background)]">
          {invites.map((invite) => (
            <div
              key={invite.email}
              className="flex items-center justify-between px-3 py-2 border-b border-[var(--theme-border)] last:border-b-0"
            >
              <div className="flex items-center gap-2">
                <HiOutlineMail className="w-3.5 h-3.5 text-[var(--theme-foreground-tertiary)]" />
                <span className="font-mono text-xs text-[var(--theme-foreground)]">
                  {invite.email}
                </span>
                <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] text-[var(--theme-foreground-tertiary)]">
                  {invite.role}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemove(invite.email)}
                className="p-1 hover:bg-[var(--theme-error)]/10 text-[var(--theme-foreground-tertiary)] hover:text-[var(--theme-error)] transition-colors"
              >
                <HiOutlineX className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {invites.length === 0 && (
        <div className="border-2 border-dashed border-[var(--theme-border)] p-6 text-center">
          <p className="font-mono text-[11px] text-[var(--theme-foreground-tertiary)]">
            No invitations added yet. Add emails above or skip this step.
          </p>
        </div>
      )}
    </div>
  )
}

function StepSkills({
  skills,
  enabledSkills,
  onToggle,
}: {
  skills: Array<{
    name: string
    displayName: string
    description: string
    trigger: "manual" | "auto" | "both"
    isActive?: boolean
  }>
  enabledSkills: Set<string>
  onToggle: (name: string) => void
}) {
  const triggerLabel = (t: string) => {
    switch (t) {
      case "auto": return "AUTO-TRIGGER"
      case "manual": return "MANUAL"
      case "both": return "AUTO + MANUAL"
      default: return t.toUpperCase()
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-[var(--theme-foreground-secondary)] font-mono">
        Enable built-in agent skills for this workspace. Skills teach the agent how to handle specific task types.
      </p>
      {skills.length === 0 ? (
        <div className="border-2 border-dashed border-[var(--theme-border)] p-6 text-center">
          <p className="font-mono text-[11px] text-[var(--theme-foreground-tertiary)]">
            Loading available skills...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {skills.slice(0, 4).map((skill) => {
            const isEnabled = enabledSkills.has(skill.name)
            return (
              <BrutalCard
                key={skill.name}
                variant={isEnabled ? "elevated" : "default"}
                hoverable
                padding="md"
                onClick={() => onToggle(skill.name)}
                className={`cursor-pointer transition-all ${
                  isEnabled
                    ? "border-[var(--theme-success)] shadow-[4px_4px_0px_var(--theme-success)]"
                    : ""
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider">
                      {skill.displayName}
                    </span>
                    <div
                      className={`w-5 h-5 border-2 flex items-center justify-center transition-colors ${
                        isEnabled
                          ? "border-[var(--theme-success)] bg-[var(--theme-success)]"
                          : "border-[var(--theme-border)]"
                      }`}
                    >
                      {isEnabled && <HiOutlineCheck className="w-3 h-3 text-[var(--theme-background)]" />}
                    </div>
                  </div>
                  <p className="text-[11px] text-[var(--theme-foreground-tertiary)] font-mono leading-relaxed">
                    {skill.description}
                  </p>
                  <span className="inline-block font-mono text-[10px] uppercase px-1.5 py-0.5 bg-[var(--theme-background)] border border-[var(--theme-border)] text-[var(--theme-foreground-tertiary)]">
                    {triggerLabel(skill.trigger)}
                  </span>
                </div>
              </BrutalCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
