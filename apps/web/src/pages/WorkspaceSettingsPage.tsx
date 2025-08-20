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
  HiOutlineTrash,
  HiOutlineExclamation
} from 'react-icons/hi'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import SettingsSection from '@/components/features/settings/SettingsSection'
import MemberManagement from '@/components/features/workspace/MemberManagement'
import { useSettingsState } from '../hooks/useSettingsState'

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
    <div className="p-24px">
      <div className="max-w-1200px mx-auto">
        {/* Header */}
        <div className="mb-32px">
          <h1 className="text-brutal-2xl font-bold mb-8px uppercase">WORKSPACE SETTINGS</h1>
          <p className="text-brutal-sm text-neutral-500">{workspace.name}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2px mb-32px border-b-2 border-[var(--theme-border)]">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "px-24px py-16px flex items-center gap-8px",
                  "font-mono text-brutal-sm uppercase transition-all duration-200",
                  "border-b-4 -mb-2px",
                  activeTab === tab.id
                    ? "border-primary-brutalist bg-[var(--theme-background-secondary)] text-primary-brutalist"
                    : "border-transparent hover:bg-[var(--theme-background-secondary)]/20"
                )}
              >
                <Icon className="w-16px h-16px" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="space-y-32px">
          {/* General Tab */}
          {activeTab === 'general' && (
            <>
              <SettingsSection
                title="WORKSPACE INFORMATION"
                description="Basic information about your workspace"
              >
                <div className="space-y-24px">
                  <div>
                    <label className="block text-brutal-sm mb-8px">WORKSPACE NAME</label>
                    <input
                      type="text"
                      value={generalSettings.name}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, name: e.target.value })}
                      disabled={!canEdit}
                      className="w-full px-16px py-12px bg-[var(--theme-background)] border-2 border-[var(--theme-border)] 
                               font-mono text-brutal-md placeholder:text-neutral-600
                               focus:border-primary-brutalist focus:outline-none transition-colors
                               disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-brutal-sm mb-8px">WORKSPACE SLUG</label>
                    <input
                      type="text"
                      value={generalSettings.slug}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, slug: e.target.value })}
                      disabled={!canEdit}
                      pattern="[a-z0-9-]+"
                      className="w-full px-16px py-12px bg-[var(--theme-background)] border-2 border-[var(--theme-border)] 
                               font-mono text-brutal-md placeholder:text-neutral-600
                               focus:border-primary-brutalist focus:outline-none transition-colors
                               disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <p className="text-brutal-xs text-neutral-500 mt-4px">
                      Used in URLs. Only lowercase letters, numbers, and hyphens.
                    </p>
                  </div>

                  <div>
                    <label className="block text-brutal-sm mb-8px">DESCRIPTION</label>
                    <textarea
                      value={generalSettings.description}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, description: e.target.value })}
                      disabled={!canEdit}
                      rows={4}
                      className="w-full px-16px py-12px bg-[var(--theme-background)] border-2 border-[var(--theme-border)] 
                               font-mono text-brutal-md placeholder:text-neutral-600
                               focus:border-primary-brutalist focus:outline-none transition-colors
                               disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-brutal-sm mb-8px">LOGO URL</label>
                    <input
                      type="url"
                      value={generalSettings.logoUrl}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, logoUrl: e.target.value })}
                      disabled={!canEdit}
                      placeholder="https://example.com/logo.png"
                      className="w-full px-16px py-12px bg-[var(--theme-background)] border-2 border-[var(--theme-border)] 
                               font-mono text-brutal-md placeholder:text-neutral-600
                               focus:border-primary-brutalist focus:outline-none transition-colors
                               disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </SettingsSection>

              {canDelete && (
                <SettingsSection
                  title="DANGER ZONE"
                  description="Irreversible and destructive actions"
                  className="border-2 border-[var(--theme-error)]"
                >
                  <div className="space-y-16px">
                    <p className="text-brutal-sm text-[var(--theme-error)]">
                      <HiOutlineExclamation className="inline w-16px h-16px mr-4px" />
                      Deleting a workspace will permanently remove all projects, tasks, and data.
                    </p>
                    
                    {!showDeleteConfirm ? (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-24px py-12px bg-[var(--theme-error)] border-2 border-[var(--theme-border)] 
                                 font-mono text-brutal-sm uppercase tracking-wider text-[var(--theme-foreground)]
                                 hover:bg-[#CC0000] transition-colors"
                      >
                        DELETE WORKSPACE
                      </button>
                    ) : (
                      <div className="space-y-16px p-16px bg-[var(--theme-error)]/10 border-2 border-[var(--theme-error)]">
                        <p className="text-brutal-sm">
                          Type <span className="font-bold">{workspace.name}</span> to confirm deletion:
                        </p>
                        <input
                          type="text"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          className="w-full px-16px py-12px bg-[var(--theme-background)] border-2 border-[var(--theme-border)] 
                                   font-mono text-brutal-md placeholder:text-neutral-600
                                   focus:border-[var(--theme-error)] focus:outline-none transition-colors"
                        />
                        <div className="flex gap-16px">
                          <button
                            onClick={handleDeleteWorkspace}
                            disabled={deleteConfirmText !== workspace.name}
                            className="px-24px py-12px bg-[var(--theme-error)] border-2 border-[var(--theme-border)] 
                                     font-mono text-brutal-sm uppercase tracking-wider text-[var(--theme-foreground)]
                                     hover:bg-[#CC0000] transition-colors
                                     disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            CONFIRM DELETE
                          </button>
                          <button
                            onClick={() => {
                              setShowDeleteConfirm(false)
                              setDeleteConfirmText('')
                            }}
                            className="brutal-btn"
                          >
                            CANCEL
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </SettingsSection>
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
              <div className="space-y-16px">
                <label className="flex items-center gap-12px">
                  <input
                    type="checkbox"
                    checked={featureSettings.enableProjects}
                    onChange={(e) => setFeatureSettings({ ...featureSettings, enableProjects: e.target.checked })}
                    disabled={!canEdit}
                    className="w-20px h-20px border-2 border-[var(--theme-border)] bg-[var(--theme-background)]"
                  />
                  <div>
                    <div className="font-mono text-brutal-sm uppercase">PROJECTS</div>
                    <div className="text-brutal-xs text-neutral-500">Organize work into projects</div>
                  </div>
                </label>

                <label className="flex items-center gap-12px">
                  <input
                    type="checkbox"
                    checked={featureSettings.enableTasks}
                    onChange={(e) => setFeatureSettings({ ...featureSettings, enableTasks: e.target.checked })}
                    disabled={!canEdit}
                    className="w-20px h-20px border-2 border-[var(--theme-border)] bg-[var(--theme-background)]"
                  />
                  <div>
                    <div className="font-mono text-brutal-sm uppercase">TASKS</div>
                    <div className="text-brutal-xs text-neutral-500">Track work items and issues</div>
                  </div>
                </label>

                <label className="flex items-center gap-12px">
                  <input
                    type="checkbox"
                    checked={featureSettings.enableMeetings}
                    onChange={(e) => setFeatureSettings({ ...featureSettings, enableMeetings: e.target.checked })}
                    disabled={!canEdit}
                    className="w-20px h-20px border-2 border-[var(--theme-border)] bg-[var(--theme-background)]"
                  />
                  <div>
                    <div className="font-mono text-brutal-sm uppercase">MEETINGS</div>
                    <div className="text-brutal-xs text-neutral-500">Schedule and manage meetings</div>
                  </div>
                </label>

                <label className="flex items-center gap-12px">
                  <input
                    type="checkbox"
                    checked={featureSettings.enableSprints}
                    onChange={(e) => setFeatureSettings({ ...featureSettings, enableSprints: e.target.checked })}
                    disabled={!canEdit}
                    className="w-20px h-20px border-2 border-[var(--theme-border)] bg-[var(--theme-background)]"
                  />
                  <div>
                    <div className="font-mono text-brutal-sm uppercase">SPRINTS</div>
                    <div className="text-brutal-xs text-neutral-500">Agile sprint planning and tracking</div>
                  </div>
                </label>

                <label className="flex items-center gap-12px">
                  <input
                    type="checkbox"
                    checked={featureSettings.enableTimeTracking}
                    onChange={(e) => setFeatureSettings({ ...featureSettings, enableTimeTracking: e.target.checked })}
                    disabled={!canEdit}
                    className="w-20px h-20px border-2 border-[var(--theme-border)] bg-[var(--theme-background)]"
                  />
                  <div>
                    <div className="font-mono text-brutal-sm uppercase">TIME TRACKING</div>
                    <div className="text-brutal-xs text-neutral-500">Track time spent on tasks</div>
                  </div>
                </label>
              </div>
            </SettingsSection>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <SettingsSection
              title="EXTERNAL INTEGRATIONS"
              description="Connect your workspace with external services"
            >
              <div className="space-y-24px">
                <div className="p-16px bg-[var(--theme-background-secondary)]/10 border-2 border-[var(--theme-border)]">
                  <h3 className="font-mono text-brutal-sm uppercase mb-8px">GITHUB INTEGRATION</h3>
                  <p className="text-brutal-xs text-neutral-500 mb-16px">
                    Connect GitHub repositories to sync issues and pull requests
                  </p>
                  <button
                    disabled={!canEdit}
                    className="brutal-btn-sm"
                  >
                    CONFIGURE GITHUB
                  </button>
                </div>

                <div className="p-16px bg-[var(--theme-background-secondary)]/10 border-2 border-[var(--theme-border)]">
                  <h3 className="font-mono text-brutal-sm uppercase mb-8px">GOOGLE CALENDAR</h3>
                  <p className="text-brutal-xs text-neutral-500 mb-16px">
                    Sync meetings with Google Calendar
                  </p>
                  <button
                    disabled={!canEdit}
                    className="brutal-btn-sm"
                  >
                    CONNECT CALENDAR
                  </button>
                </div>

                <div className="p-16px bg-[var(--theme-background-secondary)]/10 border-2 border-[var(--theme-border)]">
                  <h3 className="font-mono text-brutal-sm uppercase mb-8px">SLACK</h3>
                  <p className="text-brutal-xs text-neutral-500 mb-16px">
                    Send notifications to Slack channels
                  </p>
                  <button
                    disabled={!canEdit}
                    className="brutal-btn-sm"
                  >
                    ADD TO SLACK
                  </button>
                </div>
              </div>
            </SettingsSection>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <SettingsSection
              title="SUBSCRIPTION & BILLING"
              description="Manage your workspace subscription"
            >
              <div className="p-24px bg-[var(--theme-background-secondary)]/10 border-2 border-[var(--theme-border)]">
                <p className="text-brutal-lg font-bold mb-8px">FREE PLAN</p>
                <p className="text-brutal-sm text-neutral-500 mb-16px">
                  You're currently on the free plan with up to 5 members.
                </p>
                <button className="brutal-btn">
                  UPGRADE TO PRO
                </button>
              </div>
            </SettingsSection>
          )}
        </div>

        {/* Save Indicator */}
        {(hasUnsavedGeneral || hasUnsavedFeatures) && (
          <div className="fixed bottom-24px right-24px bg-warning-brutalist border-2 border-[var(--theme-border)] p-16px shadow-brutal-lg">
            <p className="text-brutal-sm mb-8px">UNSAVED CHANGES</p>
            <div className="flex gap-8px">
              {(isSavingGeneral || isSavingFeatures) ? (
                <span className="text-brutal-xs">SAVING...</span>
              ) : (
                <button
                  onClick={() => {
                    if (hasUnsavedGeneral) forceSaveGeneral()
                    if (hasUnsavedFeatures) forceSaveFeatures()
                  }}
                  className="brutal-btn-sm"
                >
                  SAVE NOW
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}