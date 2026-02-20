import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { useAuth } from '@clerk/clerk-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import { m } from 'framer-motion'
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

// ── Sub-components ──

interface ProfileTabProps {
  profileData: { name: string; bio: string; avatarUrl: string; githubUsername: string }
  authEmail: string
  setProfileData: (updater: (prev: any) => any) => void
  onReset: () => void
}

function ProfileTab({ profileData, authEmail, setProfileData, onReset }: ProfileTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b-2 border-[var(--theme-border)] pb-4">
        <h2 className="text-lg font-bold uppercase">Profile Settings</h2>
        <BrutalButton variant="ghost" size="sm" onClick={onReset} className="text-xs">
          <HiOutlineRefresh className="w-3 h-3 mr-1" /> Reset
        </BrutalButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label htmlFor="settings-display-name" className="block text-xs font-bold uppercase mb-2">Display Name</label>
          <input
            id="settings-display-name"
            type="text"
            value={profileData.name}
            onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm focus:border-[var(--theme-primary)] outline-none transition-colors"
            placeholder="Enter your name"
          />
        </div>

        <div>
          <label htmlFor="settings-email" className="block text-xs font-bold uppercase mb-2">Email Address</label>
          <input
            id="settings-email"
            type="email"
            value={authEmail}
            disabled
            className="w-full p-3 bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] font-mono text-sm opacity-60 cursor-not-allowed"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="settings-bio" className="block text-xs font-bold uppercase mb-2">Bio</label>
          <textarea
            id="settings-bio"
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
          <label htmlFor="settings-avatar-url" className="block text-xs font-bold uppercase mb-2">Avatar URL</label>
          <input
            id="settings-avatar-url"
            type="url"
            value={profileData.avatarUrl}
            onChange={(e) => setProfileData(prev => ({ ...prev, avatarUrl: e.target.value }))}
            className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm focus:border-[var(--theme-primary)] outline-none transition-colors"
            placeholder="https://..."
          />
        </div>

        <div>
          <label htmlFor="settings-github-username" className="block text-xs font-bold uppercase mb-2">GitHub Username</label>
          <input
            id="settings-github-username"
            type="text"
            value={profileData.githubUsername}
            onChange={(e) => setProfileData(prev => ({ ...prev, githubUsername: e.target.value }))}
            className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm focus:border-[var(--theme-primary)] outline-none transition-colors"
            placeholder="username"
          />
        </div>
      </div>
    </div>
  )
}

interface AccessibilityTabProps {
  preferences: any
  setPreferences: (updater: (prev: any) => any) => void
  onReset: () => void
}

function AccessibilityTab({ preferences, setPreferences, onReset }: AccessibilityTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b-2 border-[var(--theme-border)] pb-4">
        <h2 className="text-lg font-bold uppercase">Display Settings</h2>
        <BrutalButton variant="ghost" size="sm" onClick={onReset} className="text-xs">
          <HiOutlineRefresh className="w-3 h-3 mr-1" /> Reset
        </BrutalButton>
      </div>

      <div className="space-y-3">
        <div className="p-4 border-2 border-[var(--theme-border)]">
          <span className="block text-xs font-bold uppercase mb-4">Theme</span>
          <ThemeSwitcher variant="grid" showLabel={true} />
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
            <label htmlFor="settings-letter-spacing" className="block text-xs font-bold uppercase mb-2">Letter Spacing</label>
            <select
              id="settings-letter-spacing"
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
  )
}

interface NotificationsTabProps {
  preferences: any
  setPreferences: (updater: (prev: any) => any) => void
  onReset: () => void
}

function NotificationsTab({ preferences, setPreferences, onReset }: NotificationsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b-2 border-[var(--theme-border)] pb-4">
        <h2 className="text-lg font-bold uppercase">Notifications</h2>
        <BrutalButton variant="ghost" size="sm" onClick={onReset} className="text-xs">
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
  )
}

interface DeveloperTabProps {
  currentUser: any
  developerProfile: any
  onEditProfile: () => void
}

function DeveloperTab({ currentUser, developerProfile, onEditProfile }: DeveloperTabProps) {
  return (
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
        <BrutalButton onClick={onEditProfile}>
          Edit Profile
        </BrutalButton>
      </div>

      {developerProfile ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border-2 border-[var(--theme-border)]">
            <span className="block text-xs font-bold uppercase mb-2 text-[var(--theme-foreground)]/60">Role</span>
            <div className="font-mono font-bold">{developerProfile.profile?.role || 'Not Set'}</div>
          </div>

          <div className="p-4 border-2 border-[var(--theme-border)]">
            <span className="block text-xs font-bold uppercase mb-2 text-[var(--theme-foreground)]/60">Timezone</span>
            <div className="font-mono font-bold">{developerProfile.profile?.timezone || 'Not Set'}</div>
          </div>

          <div className="md:col-span-2 p-4 border-2 border-[var(--theme-border)]">
            <span className="block text-xs font-bold uppercase mb-2 text-[var(--theme-foreground)]/60">Skills & Technologies</span>
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
            <span className="block text-xs font-bold uppercase mb-2 text-[var(--theme-foreground)]/60">Git Co-Author String</span>
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
          <BrutalButton onClick={onEditProfile}>
            Create Developer Profile
          </BrutalButton>
        </div>
      )}
    </div>
  )
}

interface WorkspaceTabProps {
  preferences: any
  setPreferences: (updater: (prev: any) => any) => void
}

function WorkspaceTab({ preferences, setPreferences }: WorkspaceTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b-2 border-[var(--theme-border)] pb-4">
        <h2 className="text-lg font-bold uppercase">Workspace Defaults</h2>
      </div>

      <div className="space-y-6 p-4 border-2 border-[var(--theme-border)]">
        <div>
          <label htmlFor="settings-default-project-view" className="block text-xs font-bold uppercase mb-2">Default Project View</label>
          <select
            id="settings-default-project-view"
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
          <label htmlFor="settings-default-task-priority" className="block text-xs font-bold uppercase mb-2">Default Task Priority</label>
          <select
            id="settings-default-task-priority"
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
  )
}

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

interface SettingsHeaderProps {
  hasUnsavedProfile: boolean
  hasUnsavedPreferences: boolean
  isSavingProfile: boolean
  isSavingPreferences: boolean
  onSave: () => void
}

function SettingsHeader({ hasUnsavedProfile, hasUnsavedPreferences, isSavingProfile, isSavingPreferences, onSave }: SettingsHeaderProps) {
  return (
    <div className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-3">
      <div>
        <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[var(--theme-foreground)]/40 inline-block mb-1">
          Account
        </span>
        <h1 className="text-xl font-bold tracking-tight text-[var(--theme-foreground)]">Settings</h1>
        <p className="text-xs text-[var(--theme-foreground)]/40 mt-1 font-mono">
          Manage your account settings and preferences
        </p>
      </div>
      {(hasUnsavedProfile || hasUnsavedPreferences) && (
        <div className="flex items-center gap-3">
          <span className="text-brutal-warning font-bold uppercase text-xs font-mono flex items-center gap-2">
            <HiOutlineExclamation className="w-3.5 h-3.5" /> Unsaved
          </span>
          <BrutalButton variant="primary" size="sm" onClick={onSave} className="flex items-center gap-2">
            <HiOutlineSave className="w-3.5 h-3.5" />
            {isSavingProfile || isSavingPreferences ? 'Saving...' : 'Save'}
          </BrutalButton>
        </div>
      )}
    </div>
  )
}

interface SettingsSidebarProps {
  activeTab: SettingsTab
  onTabChange: (tab: SettingsTab) => void
}

interface SettingsContentProps {
  activeTab: SettingsTab
  profileData: { name: string; bio: string; avatarUrl: string; githubUsername: string }
  authEmail: string
  setProfileData: (updater: (prev: any) => any) => void
  preferences: any
  setPreferences: (updater: (prev: any) => any) => void
  currentUser: any
  developerProfile: any
  onResetProfile: () => void
  onResetAccessibility: () => void
  onResetNotifications: () => void
  onEditDeveloperProfile: () => void
}

function SettingsContent({
  activeTab, profileData, authEmail, setProfileData, preferences, setPreferences,
  currentUser, developerProfile, onResetProfile, onResetAccessibility,
  onResetNotifications, onEditDeveloperProfile,
}: SettingsContentProps) {
  return (
    <div className="lg:col-span-9">
      <BrutalCard className="min-h-[600px] p-4">
        {activeTab === 'profile' && (
          <ProfileTab profileData={profileData} authEmail={authEmail}
            setProfileData={setProfileData} onReset={onResetProfile} />
        )}
        {activeTab === 'developer' && (
          <DeveloperTab currentUser={currentUser} developerProfile={developerProfile}
            onEditProfile={onEditDeveloperProfile} />
        )}
        {activeTab === 'accessibility' && (
          <AccessibilityTab preferences={preferences} setPreferences={setPreferences}
            onReset={onResetAccessibility} />
        )}
        {activeTab === 'notifications' && (
          <NotificationsTab preferences={preferences} setPreferences={setPreferences}
            onReset={onResetNotifications} />
        )}
        {activeTab === 'workspace' && (
          <WorkspaceTab preferences={preferences} setPreferences={setPreferences} />
        )}
        {activeTab === 'github' && <GitHubSettingsTab />}
        {activeTab === 'ai' && <AISettingsTab />}
        {activeTab === 'shortcuts' && <ShortcutSettings />}
      </BrutalCard>
    </div>
  )
}

function SettingsSidebar({ activeTab, onTabChange }: SettingsSidebarProps) {
  return (
    <div className="lg:col-span-3">
      <BrutalCard className="sticky top-6 p-0 overflow-hidden">
        <div className="bg-[var(--theme-background-secondary)] p-4 border-b-2 border-[var(--theme-border)]">
          <h3 className="font-bold uppercase text-sm">Settings</h3>
        </div>
        <div className="flex flex-col">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
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
  )
}

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

  // Legitimate useEffect: syncs server-loaded user data into form state
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xs font-semibold font-mono uppercase tracking-wider text-[var(--theme-foreground)]/50 animate-pulse">Loading settings...</div>
      </div>
    )
  }

  return (
    <m.div
      className="p-4 bg-[var(--theme-background)]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <SettingsHeader
        hasUnsavedProfile={hasUnsavedProfile}
        hasUnsavedPreferences={hasUnsavedPreferences}
        isSavingProfile={isSavingProfile}
        isSavingPreferences={isSavingPreferences}
        onSave={() => {
          if (hasUnsavedProfile) forceSaveProfile()
          if (hasUnsavedPreferences) forceSavePreferences()
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <SettingsContent
          activeTab={activeTab} profileData={profileData}
          authEmail={authUser?.primaryEmailAddress?.emailAddress || ''}
          setProfileData={setProfileData} preferences={preferences}
          setPreferences={setPreferences} currentUser={currentUser}
          developerProfile={developerProfile} onResetProfile={resetProfile}
          onResetAccessibility={resetAccessibility} onResetNotifications={resetNotifications}
          onEditDeveloperProfile={() => setShowEditDeveloperProfile(true)}
        />
      </div>

      {/* Modals */}
      {showEditDeveloperProfile && (
        <EditDeveloperProfileModal
          isOpen={showEditDeveloperProfile}
          onClose={() => setShowEditDeveloperProfile(false)}
        />
      )}
    </m.div>
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