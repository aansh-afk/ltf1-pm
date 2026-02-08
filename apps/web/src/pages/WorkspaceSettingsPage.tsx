import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import {
  HiOutlineOfficeBuilding,
  HiOutlineUserGroup,
  HiOutlineCog,
  HiOutlinePuzzle,
  HiOutlineCreditCard,
  HiOutlineExclamation
} from 'react-icons/hi'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import SettingsSection from '@/components/features/settings/SettingsSection'
import MemberManagement from '@/components/features/workspace/MemberManagement'
import { useSettingsState } from '../hooks/useSettingsState'
import BrutalButton from '@/components/ui/BrutalButton'
import BrutalCard from '@/components/ui/BrutalCard'
import BrutalBadge from '@/components/ui/BrutalBadge'

const tabs = [
  { id: 'general', label: 'GENERAL', icon: HiOutlineOfficeBuilding },
  { id: 'members', label: 'MEMBERS', icon: HiOutlineUserGroup },
  { id: 'features', label: 'FEATURES', icon: HiOutlineCog },
  { id: 'integrations', label: 'INTEGRATIONS', icon: HiOutlinePuzzle },
  { id: 'billing', label: 'BILLING', icon: HiOutlineCreditCard }
]

export default function WorkspaceSettingsPage() {
  const { workspaceId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('general')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  // Queries
  const workspace = useQuery(
    api.workspaces.queries.getWorkspace,
    workspaceId ? { workspaceId: workspaceId as any } : 'skip'
  )
  const currentUser = useQuery(api.auth.users.getOrCreateCurrentUser)
  const memberRole = workspace?.members?.find(m => m.userId === currentUser?._id)?.role

  // Mutations
  const updateWorkspace = useMutation(api.workspaces.mutations.updateWorkspace)
  const deleteWorkspace = useMutation(api.workspaces.mutations.deleteWorkspace)

  // Settings state
  const {
    value: generalSettings,
    setValue: setGeneralSettings,
    setValueWithoutSave: setGeneralSettingsWithoutSave,
    isSaving: isSavingGeneral,
    hasUnsavedChanges: hasUnsavedGeneral,
    forceSave: forceSaveGeneral
  } = useSettingsState({
    defaultValue: {
      name: '',
      slug: '',
      description: '',
      logoUrl: ''
    },
    onSave: async (data) => {
      if (!workspaceId) return
      await updateWorkspace({
        workspaceId: workspaceId as any,
        ...data
      })
    }
  })

  const {
    value: featureSettings,
    setValue: setFeatureSettings,
    setValueWithoutSave: setFeatureSettingsWithoutSave,
    isSaving: isSavingFeatures,
    hasUnsavedChanges: hasUnsavedFeatures,
    forceSave: forceSaveFeatures
  } = useSettingsState({
    defaultValue: {
      enableProjects: true,
      enableTasks: true,
      enableMeetings: true,
      enableSprints: false,
      enableTimeTracking: false,
      enableGitHub: false,
      enableCalendar: false
    },
    onSave: async (data) => {
      if (!workspaceId) return
      await updateWorkspace({
        workspaceId: workspaceId as any,
        settings: {
          ...workspace?.settings,
          features: data
        }
      })
    }
  })

  // Load workspace data
  useEffect(() => {
    if (workspace) {
      setGeneralSettingsWithoutSave({
        name: workspace.name || '',
        slug: workspace.slug || '',
        description: workspace.description || '',
        logoUrl: workspace.logoUrl || ''
      })

      if (workspace.settings?.features) {
        setFeatureSettingsWithoutSave({
          enableProjects: workspace.settings.features.enableProjects ?? true,
          enableTasks: workspace.settings.features.enableTasks ?? true,
          enableMeetings: workspace.settings.features.enableMeetings ?? true,
          enableSprints: workspace.settings.features.enableSprints ?? false,
          enableTimeTracking: workspace.settings.features.enableTimeTracking ?? false,
          enableGitHub: workspace.settings.features.enableGitHub ?? false,
          enableCalendar: workspace.settings.features.enableCalendar ?? false
        })
      }
    }
  }, [workspace, setGeneralSettingsWithoutSave, setFeatureSettingsWithoutSave])

  const handleDeleteWorkspace = async () => {
    if (!workspaceId || !workspace) return
    if (deleteConfirmText !== workspace.name) {
      toast.error('Workspace name does not match')
      return
    }

    try {
      await deleteWorkspace({ workspaceId: workspaceId as any })
      toast.success('Workspace deleted successfully')
      navigate('/workspaces')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete workspace')
    }
  }

  if (!workspace || !currentUser) {
    return <LoadingSpinner size="lg" />
  }

  const canEdit = memberRole === 'owner' || memberRole === 'admin'
  const canDelete = memberRole === 'owner'

  return (
    <div className="p-4 md:p-5 bg-[var(--theme-background)] min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <HiOutlineOfficeBuilding className="w-6 h-6 text-[var(--theme-primary)]" />
            <h1 className="text-2xl font-bold uppercase tracking-tight">WORKSPACE SETTINGS</h1>
          </div>
          <p className="font-mono text-sm text-[var(--theme-foreground)]/60 uppercase tracking-wide border-l-2 border-[var(--theme-border)] pl-3">
            {workspace.name} • {memberRole}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-4 border-b-2 border-[var(--theme-border)]">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "px-4 py-3 flex items-center gap-2 font-mono text-sm font-bold uppercase transition-all duration-200",
                  "border-b-4 -mb-1",
                  activeTab === tab.id
                    ? "border-[var(--theme-primary)] bg-[var(--theme-background-secondary)] text-[var(--theme-primary)]"
                    : "border-transparent text-[var(--theme-foreground)]/60 hover:text-[var(--theme-foreground)] hover:bg-[var(--theme-background-secondary)]/20"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {/* General Tab */}
          {activeTab === 'general' && (
            <>
              <SettingsSection
                title="WORKSPACE INFORMATION"
                description="Basic information about your workspace"
              >
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase font-mono mb-2">WORKSPACE NAME</label>
                    <input
                      type="text"
                      value={generalSettings.name}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, name: e.target.value })}
                      disabled={!canEdit}
                      className="w-full px-4 py-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] 
                               font-mono text-sm placeholder:text-neutral-600
                               focus:border-[var(--theme-primary)] focus:outline-none transition-colors
                               disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase font-mono mb-2">WORKSPACE SLUG</label>
                    <input
                      type="text"
                      value={generalSettings.slug}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, slug: e.target.value })}
                      disabled={!canEdit}
                      pattern="[a-z0-9-]+"
                      className="w-full px-4 py-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] 
                               font-mono text-sm placeholder:text-neutral-600
                               focus:border-[var(--theme-primary)] focus:outline-none transition-colors
                               disabled:opacity-50 disabled:cursor-not-allowed lowercase"
                    />
                    <p className="text-xs font-mono text-[var(--theme-foreground)]/40 mt-1">
                      Used in URLs. Only lowercase letters, numbers, and hyphens.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase font-mono mb-2">DESCRIPTION</label>
                    <textarea
                      value={generalSettings.description}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, description: e.target.value })}
                      disabled={!canEdit}
                      rows={4}
                      className="w-full px-4 py-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] 
                               font-mono text-sm placeholder:text-neutral-600
                               focus:border-[var(--theme-primary)] focus:outline-none transition-colors
                               disabled:opacity-50 disabled:cursor-not-allowed resize-none uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase font-mono mb-2">LOGO URL</label>
                    <input
                      type="url"
                      value={generalSettings.logoUrl}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, logoUrl: e.target.value })}
                      disabled={!canEdit}
                      placeholder="HTTPS://EXAMPLE.COM/LOGO.PNG"
                      className="w-full px-4 py-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] 
                               font-mono text-sm placeholder:text-neutral-600
                               focus:border-[var(--theme-primary)] focus:outline-none transition-colors
                               disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </SettingsSection>

              {canDelete && (
                <BrutalCard
                  variant="default"
                  className="border-[var(--theme-error)] mt-6 bg-[var(--theme-error)]/5"
                >
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3 text-[var(--theme-error)]">
                      <HiOutlineExclamation className="w-5 h-5" />
                      <h3 className="text-lg font-bold uppercase">DANGER ZONE</h3>
                    </div>
                    <p className="text-sm font-mono text-[var(--theme-foreground)]/80 mb-3">
                      Irreversible and destructive actions. Deleting a workspace will permanently remove all projects, tasks, and data.
                    </p>

                    {!showDeleteConfirm ? (
                      <BrutalButton
                        onClick={() => setShowDeleteConfirm(true)}
                        className="bg-[var(--theme-error)] border-[var(--theme-error)] text-white hover:bg-[var(--theme-error)]/90"
                      >
                        DELETE WORKSPACE
                      </BrutalButton>
                    ) : (
                      <div className="space-y-2 p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-error)]">
                        <p className="text-sm font-mono">
                          Type <span className="font-bold">{workspace.name}</span> to confirm deletion:
                        </p>
                        <input
                          type="text"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          className="w-full px-4 py-2 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] 
                                   font-mono text-sm placeholder:text-neutral-600
                                   focus:border-[var(--theme-error)] focus:outline-none transition-colors"
                        />
                        <div className="flex gap-4">
                          <BrutalButton
                            onClick={handleDeleteWorkspace}
                            disabled={deleteConfirmText !== workspace.name}
                            className="bg-[var(--theme-error)] border-[var(--theme-error)] text-white hover:bg-[var(--theme-error)]/90"
                          >
                            CONFIRM DELETE
                          </BrutalButton>
                          <BrutalButton
                            onClick={() => {
                              setShowDeleteConfirm(false)
                              setDeleteConfirmText('')
                            }}
                            variant="ghost"
                          >
                            CANCEL
                          </BrutalButton>
                        </div>
                      </div>
                    )}
                  </div>
                </BrutalCard>
              )}
            </>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <MemberManagement
              workspace={workspace}
              currentUserRole={memberRole}
              canManageMembers={canEdit}
            />
          )}

          {/* Features Tab */}
          {activeTab === 'features' && (
            <SettingsSection
              title="WORKSPACE FEATURES"
              description="Enable or disable features for this workspace"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'enableProjects', label: 'PROJECTS', desc: 'Organize work into projects' },
                  { key: 'enableTasks', label: 'TASKS', desc: 'Track work items and issues' },
                  { key: 'enableMeetings', label: 'MEETINGS', desc: 'Schedule and manage meetings' },
                  { key: 'enableSprints', label: 'SPRINTS', desc: 'Agile sprint planning and tracking' },
                  { key: 'enableTimeTracking', label: 'TIME TRACKING', desc: 'Track time spent on tasks' },
                ].map(({ key, label, desc }) => (
                  <label key={key} className="flex items-start gap-4 p-4 border-2 border-[var(--theme-border)] bg-[var(--theme-background)] hover:border-[var(--theme-primary)] transition-colors cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={featureSettings[key as keyof typeof featureSettings]}
                      onChange={(e) => setFeatureSettings({ ...featureSettings, [key]: e.target.checked })}
                      disabled={!canEdit}
                      className="w-5 h-5 mt-1 border-2 border-[var(--theme-border)] bg-[var(--theme-background)] checked:bg-[var(--theme-primary)] cursor-pointer"
                    />
                    <div>
                      <div className="font-mono font-bold text-sm uppercase group-hover:text-[var(--theme-primary)] transition-colors">{label}</div>
                      <div className="text-xs font-mono text-[var(--theme-foreground)]/60">{desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </SettingsSection>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <SettingsSection
              title="EXTERNAL INTEGRATIONS"
              description="Connect your workspace with external services"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <BrutalCard className="p-4">
                  <h3 className="font-mono font-bold text-sm uppercase mb-2">GITHUB INTEGRATION</h3>
                  <p className="text-xs font-mono text-[var(--theme-foreground)]/60 mb-3 min-h-[40px]">
                    Connect GitHub repositories to sync issues and pull requests
                  </p>
                  <BrutalButton
                    disabled={!canEdit}
                    size="sm"
                    variant="secondary"
                    className="w-full"
                  >
                    CONFIGURE GITHUB
                  </BrutalButton>
                </BrutalCard>

                <BrutalCard className="p-4">
                  <h3 className="font-mono font-bold text-sm uppercase mb-2">GOOGLE CALENDAR</h3>
                  <p className="text-xs font-mono text-[var(--theme-foreground)]/60 mb-3 min-h-[40px]">
                    Sync meetings with Google Calendar
                  </p>
                  <BrutalButton
                    disabled={!canEdit}
                    size="sm"
                    variant="secondary"
                    className="w-full"
                  >
                    CONNECT CALENDAR
                  </BrutalButton>
                </BrutalCard>

                <BrutalCard className="p-4">
                  <h3 className="font-mono font-bold text-sm uppercase mb-2">SLACK</h3>
                  <p className="text-xs font-mono text-[var(--theme-foreground)]/60 mb-3 min-h-[40px]">
                    Send notifications to Slack channels
                  </p>
                  <BrutalButton
                    disabled={!canEdit}
                    size="sm"
                    variant="secondary"
                    className="w-full"
                  >
                    ADD TO SLACK
                  </BrutalButton>
                </BrutalCard>
              </div>
            </SettingsSection>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <SettingsSection
              title="SUBSCRIPTION & BILLING"
              description="Manage your workspace subscription"
            >
              <BrutalCard variant="neon" className="p-5 text-center">
                <p className="text-xl font-bold uppercase mb-2">FREE PLAN</p>
                <p className="text-sm font-mono text-[var(--theme-foreground)]/60 mb-4">
                  You're currently on the free plan with up to 5 members.
                </p>
                <BrutalButton variant="primary">
                  UPGRADE TO PRO
                </BrutalButton>
              </BrutalCard>
            </SettingsSection>
          )}
        </div>

        {/* Save Indicator */}
        {(hasUnsavedGeneral || hasUnsavedFeatures) && (
          <div className="fixed bottom-4 right-4 z-50 animate-bounce">
            <BrutalCard variant="elevated" className="p-3 border-[var(--theme-primary)] flex items-center gap-3 bg-[var(--theme-background)]">
              <div>
                <p className="text-xs font-bold uppercase text-[var(--theme-primary)] mb-1">UNSAVED CHANGES</p>
                <p className="text-[10px] font-mono text-[var(--theme-foreground)]/60">
                  {isSavingGeneral || isSavingFeatures ? 'SAVING...' : 'CHANGES PENDING'}
                </p>
              </div>
              <div className="flex gap-2">
                <BrutalButton
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    if (hasUnsavedGeneral) forceSaveGeneral()
                    if (hasUnsavedFeatures) forceSaveFeatures()
                  }}
                  disabled={isSavingGeneral || isSavingFeatures}
                >
                  SAVE NOW
                </BrutalButton>
              </div>
            </BrutalCard>
          </div>
        )}
      </div>
    </div>
  )
}