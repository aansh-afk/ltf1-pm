import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { useAuth } from '@clerk/clerk-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import {
  HiOutlineUser,
  HiOutlineEye,
  HiOutlineBell,
  HiOutlineBriefcase,
  HiOutlineCode,
  HiOutlineExclamation,
  HiOutlineTerminal,
  HiOutlineChip,
  HiOutlineClipboardCopy,
  HiOutlineSparkles,
  HiOutlineSave,
  HiOutlineRefresh
} from 'react-icons/hi'
import { FaGithub } from 'react-icons/fa'
import BrutalToggle from '../components/ui/BrutalToggle'
import BrutalSlider from '../components/ui/BrutalSlider'
import SettingsSection from '../components/features/settings/SettingsSection'
import { useSettingsState } from '../hooks/useSettingsState'
import { EditDeveloperProfileModal } from '../components/features/profile/EditDeveloperProfileModal'
import DeveloperStatusIndicator from '../components/features/developer/DeveloperStatusIndicator'
import { GitHubSettingsTab } from '../components/features/settings/GitHubSettingsTab'
import ShortcutSettings from './settings/ShortcutSettings'
import ThemeSwitcher from '../components/theme/ThemeSwitcher'
import AISettingsTab from '../components/features/settings/AISettingsTab'
import BrutalCard from '@/components/ui/BrutalCard'
import BrutalButton from '@/components/ui/BrutalButton'
import BrutalBadge from '@/components/ui/BrutalBadge'

type SettingsTab = 'profile' | 'developer' | 'accessibility' | 'notifications' | 'workspace' | 'github' | 'ai' | 'shortcuts'

const TABS: { id: SettingsTab; label: string; icon: React.ComponentType<any> }[] = [
  { id: 'profile', label: 'Profile', icon: HiOutlineUser },
  { id: 'developer', label: 'Developer', icon: HiOutlineCode },
  { id: 'accessibility', label: 'Display', icon: HiOutlineEye },
  { id: 'notifications', label: 'Notifications', icon: HiOutlineBell },
  { id: 'workspace', label: 'Workspace', icon: HiOutlineBriefcase },
  { id: 'github', label: 'GitHub', icon: FaGithub },
  { id: 'ai', label: 'AI', icon: HiOutlineSparkles },
  { id: 'shortcuts', label: 'Shortcuts', icon: HiOutlineTerminal },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [showEditDeveloperProfile, setShowEditDeveloperProfile] = useState(false)
  const { user: authUser } = useAuth()

  // Queries
  const currentUser = useQuery(api.auth.users.getCurrentUser)
  const workspaces = useQuery(api.workspaces.queries.getUserWorkspaces)
  const developerProfile = useQuery(
    api.developers.queries.getDeveloperProfile,
    currentUser ? { userId: currentUser._id } : 'skip'
  )

  // Mutations
  const updateProfile = useMutation(api.auth.users.updateUserProfile)
  const updatePreferences = useMutation(api.auth.users.updateUserPreferences)

  // Profile state
  const {
    value: profileData,
    setValue: setProfileData,
    setValueWithoutSave: setProfileDataWithoutSave,
    isSaving: isSavingProfile,
    hasUnsavedChanges: hasUnsavedProfile,
    forceSave: forceSaveProfile
  } = useSettingsState({
    defaultValue: {
      name: '',
      bio: '',
      avatarUrl: '',
      githubUsername: '',
    },
    onSave: async (data) => {
      await updateProfile(data)
      toast.success('Profile updated')
    }
  })

  // Preferences state
  const {
    value: preferences,
    setValue: setPreferences,
    setValueWithoutSave: setPreferencesWithoutSave,
    isSaving: isSavingPreferences,
    hasUnsavedChanges: hasUnsavedPreferences,
    forceSave: forceSavePreferences
  } = useSettingsState({
    defaultValue: {
      notifications: { email: true, push: true, slack: false },
      accessibility: {
        fontScale: 1,
        lineHeight: 1.4,
        letterSpacing: 'normal',
        reducedMotion: false,
        highContrast: false,
        focusWidth: 2,
      },
      defaults: {
        projectView: 'kanban',
        taskPriority: 'medium',
        taskType: 'task',
        autoAssignSelf: false,
      },
      defaultWorkspaceId: undefined,
    },
    onSave: async (data) => {
      try {
        const cleanedData: any = { ...data }
        if (!cleanedData.defaultWorkspaceId) {
          delete cleanedData.defaultWorkspaceId
        }
        await updatePreferences({ preferences: cleanedData })
        toast.success('Preferences saved')
      } catch (error: any) {
        throw error
      }
    }
  })

  // Update profile data when user data loads
  useEffect(() => {
    if (currentUser) {
      setProfileDataWithoutSave({
        name: currentUser.name || '',
        bio: currentUser.bio || '',
        avatarUrl: currentUser.avatarUrl || '',
        githubUsername: currentUser.githubUsername || '',
      })

      if (currentUser.preferences) {
        const mergedPreferences = {
          notifications: {
            email: true,
            push: true,
            slack: false,
            ...currentUser.preferences.notifications
          },
          accessibility: {
            fontScale: 1,
            lineHeight: 1.4,
            letterSpacing: 'normal',
            reducedMotion: false,
            highContrast: false,
            focusWidth: 2,
            ...currentUser.preferences.accessibility
          },
          defaults: {
            projectView: 'kanban',
            taskPriority: 'medium',
            taskType: 'task',
            autoAssignSelf: false,
            ...currentUser.preferences.defaults
          },
          defaultWorkspaceId: currentUser.preferences.defaultWorkspaceId
        }
        setPreferencesWithoutSave(mergedPreferences)
      }
    }
  }, [currentUser, setProfileDataWithoutSave, setPreferencesWithoutSave])

  const resetProfile = async () => {
    const resetData = {
      name: currentUser?.name || '',
      bio: '',
      avatarUrl: '',
      githubUsername: '',
    }
    setProfileDataWithoutSave(resetData)
    try {
      await updateProfile(resetData)
      toast.success('Profile reset')
    } catch (error: any) {
      toast.error(`Reset failed: ${error.message || 'Unknown error'}`)
    }
  }

  const resetAccessibility = async () => {
    const resetPrefs = {
      ...preferences,
      accessibility: {
        fontScale: 1,
        lineHeight: 1.4,
        letterSpacing: 'normal',
        reducedMotion: false,
        highContrast: false,
        focusWidth: 2,
      }
    }
    setPreferencesWithoutSave(resetPrefs)
    try {
      await updatePreferences({ preferences: resetPrefs })
      toast.success('Display settings reset')
    } catch (error: any) {
      toast.error(`Reset failed: ${error.message || 'Unknown error'}`)
    }
  }

  const resetNotifications = async () => {
    const resetPrefs = {
      ...preferences,
      notifications: {
        email: true,
        push: true,
        slack: false,
      }
    }
    setPreferencesWithoutSave(resetPrefs)
    try {
      await updatePreferences({ preferences: resetPrefs })
      toast.success('Notifications reset')
    } catch (error: any) {
      toast.error(`Reset failed: ${error.message || 'Unknown error'}`)
    }
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--theme-background)]">
        <div className="text-[14px] font-semibold font-mono animate-pulse">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="p-4 min-h-screen bg-[var(--theme-background)] font-mono">
      {/* Header */}
      <div className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <HiOutlineCog className="w-6 h-6 md:w-7 md:h-7 text-[var(--theme-primary)]" />
            Settings
          </h1>
          <p className="font-mono text-sm text-[var(--theme-foreground)]/60 uppercase tracking-wide">
            Manage your account settings and preferences • User: {currentUser.name}
          </p>
        </div>

        {/* Global Save Status */}
        {(hasUnsavedProfile || hasUnsavedPreferences) && (
          <div className="flex items-center gap-4 animate-pulse">
            <span className="text-brutal-warning font-bold uppercase text-sm flex items-center gap-2">
              <HiOutlineExclamation className="w-4 h-4" />
              Unsaved Changes
            </span>
            <BrutalButton
              variant="primary"
              onClick={() => {
                if (hasUnsavedProfile) forceSaveProfile()
                if (hasUnsavedPreferences) forceSavePreferences()
              }}
              className="flex items-center gap-2"
            >
              <HiOutlineSave className="w-4 h-4" />
              {isSavingProfile || isSavingPreferences ? 'Saving...' : 'Save Changes'}
            </BrutalButton>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-3">
          <BrutalCard className="sticky top-6 p-0 overflow-hidden">
            <div className="bg-[var(--theme-background-secondary)] p-4 border-b-2 border-[var(--theme-border)]">
              <h3 className="font-bold uppercase text-sm">Settings</h3>
            </div>
            <div className="flex flex-col">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'w-full px-4 py-3 flex items-center gap-3',
                    'border-b border-[var(--theme-border)] last:border-b-0',
                    'font-mono text-xs font-bold uppercase tracking-wider',
                    'transition-all text-left hover:bg-[var(--theme-background-secondary)]',
                    activeTab === tab.id
                      ? 'bg-[var(--theme-primary)] text-[var(--theme-background)] hover:bg-[var(--theme-primary)]'
                      : 'text-[var(--theme-foreground)]'
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </BrutalCard>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9">
          <BrutalCard className="min-h-[600px] p-4">
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-[var(--theme-border)] pb-4">
                  <h2 className="text-lg font-bold uppercase">Profile Settings</h2>
                  <BrutalButton variant="ghost" size="sm" onClick={resetProfile} className="text-xs">
                    <HiOutlineRefresh className="w-3 h-3 mr-1" /> Reset
                  </BrutalButton>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase mb-2">Display Name</label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm focus:border-[var(--theme-primary)] outline-none transition-colors"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase mb-2">Email Address</label>
                    <input
                      type="email"
                      value={authUser?.primaryEmailAddress?.emailAddress || ''}
                      disabled
                      className="w-full p-3 bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] font-mono text-sm opacity-60 cursor-not-allowed"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase mb-2">Bio</label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value.slice(0, 150) }))}
                      className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm focus:border-[var(--theme-primary)] outline-none transition-colors resize-none h-32"
                      placeholder="Tell us about yourself..."
                    />
                    <div className="text-right text-[10px] mt-1 text-[var(--theme-foreground)]/60">
                      {profileData.bio.length}/150 chars
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase mb-2">Avatar URL</label>
                    <input
                      type="url"
                      value={profileData.avatarUrl}
                      onChange={(e) => setProfileData(prev => ({ ...prev, avatarUrl: e.target.value }))}
                      className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm focus:border-[var(--theme-primary)] outline-none transition-colors"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase mb-2">GitHub Username</label>
                    <input
                      type="text"
                      value={profileData.githubUsername}
                      onChange={(e) => setProfileData(prev => ({ ...prev, githubUsername: e.target.value }))}
                      className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm focus:border-[var(--theme-primary)] outline-none transition-colors"
                      placeholder="username"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* DEVELOPER TAB */}
            {activeTab === 'developer' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-[var(--theme-border)] pb-4">
                  <h2 className="text-lg font-bold uppercase">Developer Profile</h2>
                </div>

                <div className="bg-[var(--theme-background-secondary)] p-4 border-2 border-[var(--theme-border)] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold uppercase">Status:</span>
                    <DeveloperStatusIndicator
                      userId={currentUser._id}
                      size="md"
                      showLabel={true}
                    />
                  </div>
                  <BrutalButton onClick={() => setShowEditDeveloperProfile(true)}>
                    Edit Profile
                  </BrutalButton>
                </div>

                {developerProfile ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 border-2 border-[var(--theme-border)]">
                      <label className="block text-xs font-bold uppercase mb-2 text-[var(--theme-foreground)]/60">Role</label>
                      <div className="font-mono font-bold">{developerProfile.profile?.role || 'Not Set'}</div>
                    </div>

                    <div className="p-4 border-2 border-[var(--theme-border)]">
                      <label className="block text-xs font-bold uppercase mb-2 text-[var(--theme-foreground)]/60">Timezone</label>
                      <div className="font-mono font-bold">{developerProfile.profile?.timezone || 'Not Set'}</div>
                    </div>

                    <div className="md:col-span-2 p-4 border-2 border-[var(--theme-border)]">
                      <label className="block text-xs font-bold uppercase mb-2 text-[var(--theme-foreground)]/60">Skills & Technologies</label>
                      <div className="flex flex-wrap gap-2">
                        {developerProfile.profile?.technologies && developerProfile.profile.technologies.length > 0 ? (
                          developerProfile.profile.technologies.map((tech: any) => (
                            <BrutalBadge key={tech.name} variant="outline" className="text-xs">
                              {tech.name} [{tech.level}]
                            </BrutalBadge>
                          ))
                        ) : (
                          <span className="text-xs italic text-[var(--theme-foreground)]/40">No skills added</span>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-2 p-4 border-2 border-[var(--theme-border)]">
                      <label className="block text-xs font-bold uppercase mb-2 text-[var(--theme-foreground)]/60">Git Co-Author String</label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 p-2 bg-[var(--theme-background)] border border-[var(--theme-border)] text-xs block truncate">
                          Co-authored-by: {developerProfile.name || currentUser.name || 'Unknown'} &lt;{developerProfile.email || currentUser.email || 'email@example.com'}&gt;
                        </code>
                        <BrutalButton
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            const coAuthorString = `Co-authored-by: ${developerProfile.name || currentUser.name || 'Unknown'} <${developerProfile.email || currentUser.email || 'email@example.com'}>`
                            navigator.clipboard.writeText(coAuthorString)
                            toast.success('Copied to clipboard')
                          }}
                        >
                          <HiOutlineClipboardCopy className="w-4 h-4" />
                        </BrutalButton>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-[var(--theme-border)]">
                    <p className="text-sm font-mono mb-4 text-[var(--theme-foreground)]/60">No developer profile found.</p>
                    <BrutalButton onClick={() => setShowEditDeveloperProfile(true)}>
                      Create Developer Profile
                    </BrutalButton>
                  </div>
                )}
              </div>
            )}

            {/* ACCESSIBILITY TAB */}
            {activeTab === 'accessibility' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-[var(--theme-border)] pb-4">
                  <h2 className="text-lg font-bold uppercase">Display Settings</h2>
                  <BrutalButton variant="ghost" size="sm" onClick={resetAccessibility} className="text-xs">
                    <HiOutlineRefresh className="w-3 h-3 mr-1" /> Reset
                  </BrutalButton>
                </div>

                <div className="space-y-3">
                  <div className="p-4 border-2 border-[var(--theme-border)]">
                    <label className="block text-xs font-bold uppercase mb-4">Theme</label>
                    <ThemeSwitcher size="lg" variant="dropdown" showLabel={true} />
                  </div>

                  <div className="p-4 border-2 border-[var(--theme-border)] space-y-6">
                    <BrutalSlider
                      label="Font Scale"
                      value={preferences.accessibility?.fontScale || 1}
                      onChange={(value) => setPreferences(prev => ({
                        ...prev,
                        accessibility: { ...prev.accessibility!, fontScale: value }
                      }))}
                      min={0.5}
                      max={1.5}
                      step={0.05}
                      unit="x"
                    />

                    <BrutalSlider
                      label="Line Height"
                      value={preferences.accessibility?.lineHeight || 1.4}
                      onChange={(value) => setPreferences(prev => ({
                        ...prev,
                        accessibility: { ...prev.accessibility!, lineHeight: value }
                      }))}
                      min={1.2}
                      max={1.8}
                      step={0.1}
                      unit="x"
                    />

                    <div>
                      <label className="block text-xs font-bold uppercase mb-2">Letter Spacing</label>
                      <select
                        value={preferences.accessibility?.letterSpacing || 'normal'}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          accessibility: { ...prev.accessibility!, letterSpacing: e.target.value }
                        }))}
                        className="w-full p-2 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm focus:border-[var(--theme-primary)] outline-none"
                      >
                        <option value="normal">Normal</option>
                        <option value="wide">Wide</option>
                        <option value="extra-wide">Extra Wide</option>
                      </select>
                    </div>

                    <BrutalToggle
                      label="Reduce Motion"
                      checked={preferences.accessibility?.reducedMotion || false}
                      onChange={(checked) => setPreferences(prev => ({
                        ...prev,
                        accessibility: { ...prev.accessibility!, reducedMotion: checked }
                      }))}
                    />

                    <BrutalToggle
                      label="High Contrast"
                      checked={preferences.accessibility?.highContrast || false}
                      onChange={(checked) => setPreferences(prev => ({
                        ...prev,
                        accessibility: { ...prev.accessibility!, highContrast: checked }
                      }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-[var(--theme-border)] pb-4">
                  <h2 className="text-lg font-bold uppercase">Notifications</h2>
                  <BrutalButton variant="ghost" size="sm" onClick={resetNotifications} className="text-xs">
                    <HiOutlineRefresh className="w-3 h-3 mr-1" /> Reset
                  </BrutalButton>
                </div>

                <div className="space-y-4 p-4 border-2 border-[var(--theme-border)]">
                  <BrutalToggle
                    label="Email Notifications"
                    checked={preferences.notifications?.email || false}
                    onChange={(checked) => setPreferences(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications!, email: checked }
                    }))}
                  />

                  <BrutalToggle
                    label="Push Notifications"
                    checked={preferences.notifications?.push || false}
                    onChange={(checked) => setPreferences(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications!, push: checked }
                    }))}
                  />

                  <div className="pt-4 border-t border-[var(--theme-border)]">
                    <p className="text-xs text-[var(--theme-foreground)]/60 uppercase">
                      Slack notifications are managed in the Slack integration settings.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* WORKSPACE TAB */}
            {activeTab === 'workspace' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-[var(--theme-border)] pb-4">
                  <h2 className="text-lg font-bold uppercase">Workspace Defaults</h2>
                </div>

                <div className="space-y-6 p-4 border-2 border-[var(--theme-border)]">
                  <div>
                    <label className="block text-xs font-bold uppercase mb-2">Default Project View</label>
                    <select
                      value={preferences.defaults?.projectView || 'kanban'}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        defaults: { ...prev.defaults!, projectView: e.target.value as any }
                      }))}
                      className="w-full p-2 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm focus:border-[var(--theme-primary)] outline-none"
                    >
                      <option value="kanban">Kanban Board</option>
                      <option value="list">List View</option>
                      <option value="timeline">Timeline</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase mb-2">Default Task Priority</label>
                    <select
                      value={preferences.defaults?.taskPriority || 'medium'}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        defaults: { ...prev.defaults!, taskPriority: e.target.value as any }
                      }))}
                      className="w-full p-2 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm focus:border-[var(--theme-primary)] outline-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <BrutalToggle
                    label="Auto-assign me to new tasks"
                    checked={preferences.defaults?.autoAssignSelf || false}
                    onChange={(checked) => setPreferences(prev => ({
                      ...prev,
                      defaults: { ...prev.defaults!, autoAssignSelf: checked }
                    }))}
                  />
                </div>
              </div>
            )}

            {/* GITHUB TAB */}
            {activeTab === 'github' && (
              <GitHubSettingsTab />
            )}

            {/* AI TAB */}
            {activeTab === 'ai' && (
              <AISettingsTab />
            )}

            {/* SHORTCUTS TAB */}
            {activeTab === 'shortcuts' && (
              <ShortcutSettings />
            )}
          </BrutalCard>
        </div>
      </div>

      {/* Modals */}
      {showEditDeveloperProfile && (
        <EditDeveloperProfileModal
          isOpen={showEditDeveloperProfile}
          onClose={() => setShowEditDeveloperProfile(false)}
        />
      )}
    </div>
  )
}

// Helper component for section headers if needed
function HiOutlineCog(props: any) {
  return (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
    </svg>
  )
}