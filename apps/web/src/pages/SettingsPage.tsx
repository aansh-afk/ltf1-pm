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
  HiOutlineAcademicCap,
  HiOutlineChip,
  HiOutlineClipboardCopy
} from 'react-icons/hi'
import { FaGithub } from 'react-icons/fa'
import BrutalToggle from '../components/ui/BrutalToggle'
import BrutalSlider from '../components/ui/BrutalSlider'
import SettingsSection from '../components/features/settings/SettingsSection'
import { useSettingsState } from '../hooks/useSettingsState'
import { EditDeveloperProfileModal } from '../components/features/profile/EditDeveloperProfileModal'
import DeveloperStatusIndicator from '../components/features/developer/DeveloperStatusIndicator'
import { GitHubSettings } from '../components/features/github/GitHubSettings'
import { GitHubSettingsTab } from '../components/features/settings/GitHubSettingsTab'

type SettingsTab = 'profile' | 'developer' | 'accessibility' | 'notifications' | 'workspace' | 'github' | 'shortcuts'

const TABS: { id: SettingsTab; label: string; icon: React.ComponentType<any> }[] = [
  { id: 'profile', label: 'PROFILE', icon: HiOutlineUser },
  { id: 'developer', label: 'DEVELOPER', icon: HiOutlineCode },
  { id: 'accessibility', label: 'ACCESSIBILITY', icon: HiOutlineEye },
  { id: 'notifications', label: 'NOTIFICATIONS', icon: HiOutlineBell },
  { id: 'workspace', label: 'WORKSPACE', icon: HiOutlineBriefcase },
  { id: 'github', label: 'GITHUB', icon: FaGithub },
  { id: 'shortcuts', label: 'SHORTCUTS', icon: HiOutlineTerminal },
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
        // Filter out undefined values for Convex
        const cleanedData: any = {
          ...data
        }
        
        // Remove defaultWorkspaceId if it's empty/undefined
        if (!cleanedData.defaultWorkspaceId) {
          delete cleanedData.defaultWorkspaceId
        }
        
        await updatePreferences({ preferences: cleanedData })
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
        // Merge with defaults to ensure all nested objects exist
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

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement
    const accessibility = preferences.accessibility || {}
    
    root.style.setProperty('--font-scale', (accessibility.fontScale || 1).toString())
    root.style.setProperty('--line-height', (accessibility.lineHeight || 1.4).toString())
    root.style.setProperty('--letter-spacing', accessibility.letterSpacing || 'normal')
    root.style.setProperty('--focus-width', `${accessibility.focusWidth || 2}px`)
    
    if (accessibility.highContrast) {
      root.setAttribute('data-accessibility', 'high-contrast')
    } else {
      root.removeAttribute('data-accessibility')
    }
    
    if (accessibility.reducedMotion) {
      root.classList.add('reduce-motion')
    } else {
      root.classList.remove('reduce-motion')
    }
  }, [preferences.accessibility])


  // Reset functions for each section
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
      toast.success('PROFILE RESET')
    } catch (error: any) {
      toast.error(`RESET FAILED: ${error.message || 'Unknown error'}`)
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
      toast.success('ACCESSIBILITY RESET')
    } catch (error: any) {
      toast.error(`RESET FAILED: ${error.message || 'Unknown error'}`)
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
      toast.success('NOTIFICATIONS RESET')
    } catch (error: any) {
      toast.error(`RESET FAILED: ${error.message || 'Unknown error'}`)
    }
  }

  const resetWorkspaceDefaults = async () => {
    const resetPrefs = {
      ...preferences,
      defaults: {
        projectView: 'kanban',
        taskPriority: 'medium',
        taskType: 'task',
        autoAssignSelf: false,
      },
      defaultWorkspaceId: undefined,
    }
    setPreferencesWithoutSave(resetPrefs)
    try {
      await updatePreferences({ preferences: resetPrefs })
      toast.success('WORKSPACE DEFAULTS RESET')
    } catch (error: any) {
      toast.error(`RESET FAILED: ${error.message || 'Unknown error'}`)
    }
  }

  if (!currentUser) {
    return (
      <div className="p-24px">
        <div className="text-brutal-lg">LOADING...</div>
      </div>
    )
  }

  return (
    <div className="p-24px">
      <h1 className="text-brutal-2xl mb-32px">SETTINGS</h1>
      
      {/* Warning bar for unsaved changes */}
      {(hasUnsavedProfile || hasUnsavedPreferences) && (
        <div className="bg-warning-brutalist border-2 border-basalt-border p-16px mb-24px flex items-center justify-between">
          <div className="flex items-center gap-16px">
            <HiOutlineExclamation className="w-24px h-24px" />
            <span className="text-brutal-md uppercase">
              YOU HAVE UNSAVED CHANGES
            </span>
          </div>
          <div className="flex items-center gap-16px">
            {(isSavingProfile || isSavingPreferences) && (
              <span className="text-brutal-sm uppercase">SAVING...</span>
            )}
            <button
              onClick={() => {
                if (hasUnsavedProfile) forceSaveProfile()
                if (hasUnsavedPreferences) forceSavePreferences()
              }}
              className="px-16px py-8px bg-event-horizon border-2 border-basalt-border
                       font-mono text-brutal-sm uppercase tracking-wider
                       hover:bg-primary-brutalist hover:text-event-horizon transition-colors"
            >
              SAVE NOW
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-24px">
        {/* Tabs */}
        <div className="w-240px">
          <div className="bg-carbon-plate border-2 border-basalt-border">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'w-full px-24px py-16px flex items-center gap-16px',
                  'border-b-2 border-basalt-border last:border-b-0',
                  'font-mono text-brutal-md uppercase tracking-wider',
                  'transition-colors text-left',
                  activeTab === tab.id 
                    ? 'bg-primary-brutalist text-event-horizon' 
                    : 'hover:bg-basalt-border'
                )}
              >
                <tab.icon className="w-20px h-20px" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <>
              <SettingsSection
                title="Basic Information"
                description="Your profile information is visible to other workspace members."
                onReset={resetProfile}
              >
                <div className="grid grid-cols-2 gap-16px">
                  <div>
                    <label className="block text-brutal-sm mb-8px">NAME</label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-16px py-12px bg-carbon-plate border-2 border-basalt-border 
                               font-mono text-brutal-md placeholder:text-neutral-600
                               focus:border-primary-brutalist focus:outline-none transition-colors"
                      placeholder="YOUR NAME"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-brutal-sm mb-8px">EMAIL (READ-ONLY)</label>
                    <input
                      type="email"
                      value={authUser?.primaryEmailAddress?.emailAddress || ''}
                      disabled
                      className="w-full px-16px py-12px bg-carbon-plate border-2 border-basalt-border 
                               font-mono text-brutal-md opacity-50 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-brutal-sm mb-8px">BIO (150 CHARACTERS MAX)</label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value.slice(0, 150) }))}
                    className="w-full px-16px py-12px bg-carbon-plate border-2 border-basalt-border 
                             font-mono text-brutal-md placeholder:text-neutral-600
                             focus:border-primary-brutalist focus:outline-none transition-colors resize-none"
                    placeholder="TELL US ABOUT YOURSELF..."
                    rows={3}
                  />
                  <div className="text-brutal-xs text-neutral-600 mt-4px">
                    {profileData.bio.length}/150
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-16px">
                  <div>
                    <label className="block text-brutal-sm mb-8px">AVATAR URL</label>
                    <input
                      type="url"
                      value={profileData.avatarUrl}
                      onChange={(e) => setProfileData(prev => ({ ...prev, avatarUrl: e.target.value }))}
                      className="w-full px-16px py-12px bg-carbon-plate border-2 border-basalt-border 
                               font-mono text-brutal-md placeholder:text-neutral-600
                               focus:border-primary-brutalist focus:outline-none transition-colors"
                      placeholder="HTTPS://..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-brutal-sm mb-8px">GITHUB USERNAME</label>
                    <input
                      type="text"
                      value={profileData.githubUsername}
                      onChange={(e) => setProfileData(prev => ({ ...prev, githubUsername: e.target.value }))}
                      className="w-full px-16px py-12px bg-carbon-plate border-2 border-basalt-border 
                               font-mono text-brutal-md placeholder:text-neutral-600
                               focus:border-primary-brutalist focus:outline-none transition-colors"
                      placeholder="OCTOCAT"
                    />
                  </div>
                </div>
              </SettingsSection>
            </>
          )}

          {/* DEVELOPER TAB */}
          {activeTab === 'developer' && (
            <>
              <SettingsSection
                title="Developer Profile"
                description="Configure your professional profile for team collaboration."
              >
                <div className="space-y-16px">
                  {/* Current Status */}
                  <div className="flex items-center justify-between p-16px bg-carbon-plate border-2 border-basalt-border">
                    <div className="flex items-center gap-16px">
                      <span className="text-brutal-sm uppercase">Current Status:</span>
                      <DeveloperStatusIndicator 
                        userId={currentUser._id}
                        size="md"
                        showLabel={true}
                      />
                    </div>
                    <button
                      onClick={() => setShowEditDeveloperProfile(true)}
                      className="brutal-btn"
                    >
                      EDIT PROFILE
                    </button>
                  </div>

                  {/* Profile Summary */}
                  {developerProfile ? (
                    <div className="space-y-16px">
                      <div>
                        <label className="block text-brutal-sm mb-8px">ROLE / TITLE</label>
                        <div className="px-16px py-12px bg-carbon-plate border-2 border-basalt-border font-mono text-brutal-md">
                          {developerProfile.profile?.role || 'NOT SET'}
                        </div>
                      </div>

                      <div>
                        <label className="block text-brutal-sm mb-8px">EXPERTISE</label>
                        <div className="flex flex-wrap gap-8px">
                          {developerProfile.profile?.technologies && developerProfile.profile.technologies.length > 0 ? (
                            developerProfile.profile.technologies.map((tech: any) => (
                              <span
                                key={tech.name}
                                className="px-12px py-6px bg-primary-brutalist/20 border border-primary-brutalist font-mono text-brutal-xs uppercase"
                              >
                                {tech.name} ({tech.level})
                              </span>
                            ))
                          ) : (
                            <span className="text-brutal-sm text-neutral-600">NO EXPERTISE SET</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-brutal-sm mb-8px">TIME ZONE</label>
                        <div className="px-16px py-12px bg-carbon-plate border-2 border-basalt-border font-mono text-brutal-md">
                          {developerProfile.profile?.timezone || 'NOT SET'}
                        </div>
                      </div>

                      <div>
                        <label className="block text-brutal-sm mb-8px">GIT CO-AUTHOR STRING</label>
                        <div className="flex items-center gap-8px">
                          <div className="flex-1 px-16px py-12px bg-carbon-plate border-2 border-basalt-border font-mono text-brutal-sm">
                            Co-authored-by: {developerProfile.name || currentUser.name || 'Unknown'} &lt;{developerProfile.email || currentUser.email || 'email@example.com'}&gt;
                          </div>
                          <button
                            onClick={() => {
                              const coAuthorString = `Co-authored-by: ${developerProfile.name || currentUser.name || 'Unknown'} <${developerProfile.email || currentUser.email || 'email@example.com'}>`
                              navigator.clipboard.writeText(coAuthorString)
                              toast.success('CO-AUTHOR STRING COPIED')
                            }}
                            className="brutal-btn-secondary p-12px"
                            title="Copy to clipboard"
                          >
                            <HiOutlineClipboardCopy className="w-20px h-20px" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-32px">
                      <p className="text-brutal-md text-neutral-600 mb-16px">NO DEVELOPER PROFILE FOUND</p>
                      <button
                        onClick={() => setShowEditDeveloperProfile(true)}
                        className="brutal-btn"
                      >
                        CREATE PROFILE
                      </button>
                    </div>
                  )}
                </div>
              </SettingsSection>

              <SettingsSection
                title="GitHub Statistics"
                description="Your GitHub activity and contribution metrics."
              >
                {developerProfile?.profile?.githubStats ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-16px">
                    <div className="brutal-card p-16px text-center">
                      <div className="text-brutal-2xl font-bold text-primary-brutalist">
                        {developerProfile.profile.githubStats.contributions || 0}
                      </div>
                      <div className="text-brutal-xs uppercase">Contributions</div>
                    </div>
                    <div className="brutal-card p-16px text-center">
                      <div className="text-brutal-2xl font-bold text-brutal-success">
                        {developerProfile.profile.githubStats.pullRequests || 0}
                      </div>
                      <div className="text-brutal-xs uppercase">Pull Requests</div>
                    </div>
                    <div className="brutal-card p-16px text-center">
                      <div className="text-brutal-2xl font-bold text-brutal-info">
                        {developerProfile.profile.githubStats.codeReviews || 0}
                      </div>
                      <div className="text-brutal-xs uppercase">Code Reviews</div>
                    </div>
                    <div className="brutal-card p-16px text-center">
                      <div className="text-brutal-2xl font-bold text-brutal-warning">
                        {developerProfile.profile.githubStats.issuesResolved || 0}
                      </div>
                      <div className="text-brutal-xs uppercase">Issues Resolved</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-24px text-brutal-sm text-neutral-600">
                    CONNECT YOUR GITHUB ACCOUNT IN THE GITHUB TAB TO SEE STATS
                  </div>
                )}
              </SettingsSection>

              <SettingsSection
                title="Work Preferences"
                description="Configure how you prefer to work and collaborate."
              >
                <div className="space-y-16px">
                  <div>
                    <label className="block text-brutal-sm mb-8px">PREFERRED WORKING HOURS</label>
                    <div className="grid grid-cols-2 gap-16px">
                      <div className="px-16px py-12px bg-carbon-plate border-2 border-basalt-border font-mono text-brutal-md">
                        START: {developerProfile?.profile?.workingHours?.start || 'NOT SET'}
                      </div>
                      <div className="px-16px py-12px bg-carbon-plate border-2 border-basalt-border font-mono text-brutal-md">
                        END: {developerProfile?.profile?.workingHours?.end || 'NOT SET'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-brutal-sm mb-8px">AVAILABILITY</label>
                    <div className="px-16px py-12px bg-carbon-plate border-2 border-basalt-border font-mono text-brutal-md">
                      {developerProfile?.profile?.availability || 'NOT SET'}
                    </div>
                  </div>
                </div>
              </SettingsSection>
            </>
          )}

          {/* ACCESSIBILITY TAB */}
          {activeTab === 'accessibility' && (
            <>
              <SettingsSection
                title="Visual Preferences"
                description="Customize the interface to match your visual needs and preferences."
                onReset={resetAccessibility}
              >
                <BrutalSlider
                  label="Font Scale"
                  value={preferences.accessibility?.fontScale || 1}
                  onChange={(value) => setPreferences(prev => ({
                    ...prev,
                    accessibility: { 
                      fontScale: value,
                      lineHeight: prev.accessibility?.lineHeight || 1.4,
                      letterSpacing: prev.accessibility?.letterSpacing || 'normal',
                      reducedMotion: prev.accessibility?.reducedMotion || false,
                      highContrast: prev.accessibility?.highContrast || false,
                      focusWidth: prev.accessibility?.focusWidth || 2
                    }
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
                    accessibility: { 
                      fontScale: prev.accessibility?.fontScale || 1,
                      lineHeight: value,
                      letterSpacing: prev.accessibility?.letterSpacing || 'normal',
                      reducedMotion: prev.accessibility?.reducedMotion || false,
                      highContrast: prev.accessibility?.highContrast || false,
                      focusWidth: prev.accessibility?.focusWidth || 2
                    }
                  }))}
                  min={1.2}
                  max={1.8}
                  step={0.1}
                  unit="x"
                />

                <div>
                  <label className="block text-brutal-sm mb-8px">LETTER SPACING</label>
                  <select
                    value={preferences.accessibility?.letterSpacing || 'normal'}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      accessibility: { 
                        fontScale: prev.accessibility?.fontScale || 1,
                        lineHeight: prev.accessibility?.lineHeight || 1.4,
                        letterSpacing: e.target.value,
                        reducedMotion: prev.accessibility?.reducedMotion || false,
                        highContrast: prev.accessibility?.highContrast || false,
                        focusWidth: prev.accessibility?.focusWidth || 2
                      }
                    }))}
                    className="w-full px-16px py-12px bg-carbon-plate border-2 border-basalt-border 
                             font-mono text-brutal-md uppercase
                             focus:border-primary-brutalist focus:outline-none transition-colors"
                  >
                    <option value="normal">NORMAL</option>
                    <option value="wide">WIDE</option>
                    <option value="extra-wide">EXTRA WIDE</option>
                  </select>
                </div>

                <BrutalSlider
                  label="Focus Indicator Width"
                  value={preferences.accessibility?.focusWidth || 2}
                  onChange={(value) => setPreferences(prev => ({
                    ...prev,
                    accessibility: { 
                      fontScale: prev.accessibility?.fontScale || 1,
                      lineHeight: prev.accessibility?.lineHeight || 1.4,
                      letterSpacing: prev.accessibility?.letterSpacing || 'normal',
                      reducedMotion: prev.accessibility?.reducedMotion || false,
                      highContrast: prev.accessibility?.highContrast || false,
                      focusWidth: value
                    }
                  }))}
                  min={2}
                  max={6}
                  step={2}
                  unit="px"
                />

                <BrutalToggle
                  label="Reduce Motion"
                  checked={preferences.accessibility?.reducedMotion || false}
                  onChange={(checked) => setPreferences(prev => ({
                    ...prev,
                    accessibility: { 
                      fontScale: prev.accessibility?.fontScale || 1,
                      lineHeight: prev.accessibility?.lineHeight || 1.4,
                      letterSpacing: prev.accessibility?.letterSpacing || 'normal',
                      reducedMotion: checked,
                      highContrast: prev.accessibility?.highContrast || false,
                      focusWidth: prev.accessibility?.focusWidth || 2
                    }
                  }))}
                />

                <BrutalToggle
                  label="High Contrast Mode"
                  checked={preferences.accessibility?.highContrast || false}
                  onChange={(checked) => setPreferences(prev => ({
                    ...prev,
                    accessibility: { 
                      fontScale: prev.accessibility?.fontScale || 1,
                      lineHeight: prev.accessibility?.lineHeight || 1.4,
                      letterSpacing: prev.accessibility?.letterSpacing || 'normal',
                      reducedMotion: prev.accessibility?.reducedMotion || false,
                      highContrast: checked,
                      focusWidth: prev.accessibility?.focusWidth || 2
                    }
                  }))}
                />
              </SettingsSection>
            </>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <>
              <SettingsSection
                title="Email Notifications"
                description="Choose which events trigger email notifications."
                onReset={resetNotifications}
              >
                <BrutalToggle
                  label="Email Notifications"
                  checked={preferences.notifications?.email || false}
                  onChange={(checked) => setPreferences(prev => ({
                    ...prev,
                    notifications: { 
                      email: checked,
                      push: prev.notifications?.push || false,
                      slack: prev.notifications?.slack || false
                    }
                  }))}
                />

                {/* These are placeholders for future functionality */}
                <div className="text-brutal-sm text-neutral-600 uppercase">
                  More notification options coming soon...
                </div>
              </SettingsSection>

              <SettingsSection
                title="Push Notifications"
                description="Browser notifications for real-time updates."
              >
                <BrutalToggle
                  label="Enable Browser Notifications"
                  checked={preferences.notifications?.push || false}
                  onChange={(checked) => setPreferences(prev => ({
                    ...prev,
                    notifications: { 
                      email: prev.notifications?.email || false,
                      push: checked,
                      slack: prev.notifications?.slack || false
                    }
                  }))}
                />
              </SettingsSection>

              <SettingsSection
                title="Slack Integration"
                description="Connect your Slack workspace for notifications."
              >
                <BrutalToggle
                  label="Enable Slack Notifications"
                  checked={preferences.notifications?.slack || false}
                  onChange={(checked) => setPreferences(prev => ({
                    ...prev,
                    notifications: { 
                      email: prev.notifications?.email || false,
                      push: prev.notifications?.push || false,
                      slack: checked
                    }
                  }))}
                />
              </SettingsSection>
            </>
          )}

          {/* WORKSPACE TAB */}
          {activeTab === 'workspace' && (
            <>
              <SettingsSection
                title="Default Workspace"
                description="Choose your default workspace when logging in."
                onReset={resetWorkspaceDefaults}
              >
                <select
                  value={preferences.defaultWorkspaceId || ''}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    defaultWorkspaceId: e.target.value || undefined
                  }))}
                  className="w-full px-16px py-12px bg-carbon-plate border-2 border-basalt-border 
                           font-mono text-brutal-md uppercase
                           focus:border-primary-brutalist focus:outline-none transition-colors"
                >
                  <option value="">NO DEFAULT</option>
                  {workspaces?.map(ws => (
                    <option key={ws._id} value={ws._id}>
                      {ws.name.toUpperCase()}
                    </option>
                  ))}
                </select>
              </SettingsSection>

              <SettingsSection
                title="Project Defaults"
                description="Default settings for new projects and tasks."
              >
                <div>
                  <label className="block text-brutal-sm mb-8px">DEFAULT PROJECT VIEW</label>
                  <select
                    value={preferences.defaults?.projectView || 'kanban'}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      defaults: { 
                        projectView: e.target.value,
                        taskPriority: prev.defaults?.taskPriority || 'medium',
                        taskType: prev.defaults?.taskType || 'task',
                        autoAssignSelf: prev.defaults?.autoAssignSelf || false
                      }
                    }))}
                    className="w-full px-16px py-12px bg-carbon-plate border-2 border-basalt-border 
                             font-mono text-brutal-md uppercase
                             focus:border-primary-brutalist focus:outline-none transition-colors"
                  >
                    <option value="kanban">KANBAN BOARD</option>
                    <option value="list">LIST VIEW</option>
                    <option value="table">TABLE VIEW</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-16px">
                  <div>
                    <label className="block text-brutal-sm mb-8px">DEFAULT TASK PRIORITY</label>
                    <select
                      value={preferences.defaults?.taskPriority || 'medium'}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        defaults: { 
                          projectView: prev.defaults?.projectView || 'kanban',
                          taskPriority: e.target.value,
                          taskType: prev.defaults?.taskType || 'task',
                          autoAssignSelf: prev.defaults?.autoAssignSelf || false
                        }
                      }))}
                      className="w-full px-16px py-12px bg-carbon-plate border-2 border-basalt-border 
                               font-mono text-brutal-md uppercase
                               focus:border-primary-brutalist focus:outline-none transition-colors"
                    >
                      <option value="low">LOW</option>
                      <option value="medium">MEDIUM</option>
                      <option value="high">HIGH</option>
                      <option value="urgent">URGENT</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-brutal-sm mb-8px">DEFAULT TASK TYPE</label>
                    <select
                      value={preferences.defaults?.taskType || 'task'}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        defaults: { 
                          projectView: prev.defaults?.projectView || 'kanban',
                          taskPriority: prev.defaults?.taskPriority || 'medium',
                          taskType: e.target.value,
                          autoAssignSelf: prev.defaults?.autoAssignSelf || false
                        }
                      }))}
                      className="w-full px-16px py-12px bg-carbon-plate border-2 border-basalt-border 
                               font-mono text-brutal-md uppercase
                               focus:border-primary-brutalist focus:outline-none transition-colors"
                    >
                      <option value="task">TASK</option>
                      <option value="feature">FEATURE</option>
                      <option value="bug">BUG</option>
                      <option value="improvement">IMPROVEMENT</option>
                      <option value="epic">EPIC</option>
                    </select>
                  </div>
                </div>

                <BrutalToggle
                  label="Auto-assign new tasks to myself"
                  checked={preferences.defaults?.autoAssignSelf || false}
                  onChange={(checked) => setPreferences(prev => ({
                    ...prev,
                    defaults: { 
                      projectView: prev.defaults?.projectView || 'kanban',
                      taskPriority: prev.defaults?.taskPriority || 'medium',
                      taskType: prev.defaults?.taskType || 'task',
                      autoAssignSelf: checked
                    }
                  }))}
                />
              </SettingsSection>
            </>
          )}

          {/* GITHUB TAB */}
          {activeTab === 'github' && (
            <GitHubSettingsTab currentUser={currentUser} />
          )}
          {/* SHORTCUTS TAB */}
          {activeTab === 'shortcuts' && (
            <>
              <SettingsSection
                title="Keyboard Shortcuts"
                description="Master LTF1 with these keyboard shortcuts. Press keys without modifiers unless specified."
              >
                <div className="space-y-24px">
                  {/* Global Shortcuts */}
                  <div className="brutal-card p-24px">
                    <h3 className="text-brutal-md font-bold uppercase mb-16px">GLOBAL</h3>
                    <div className="space-y-8px font-mono text-brutal-sm">
                      <div className="flex justify-between p-8px hover:bg-basalt-border/20">
                        <span>COMMAND PALETTE</span>
                        <kbd className="px-8px py-4px bg-carbon-plate border-2 border-basalt-border text-brutal-xs">⌘K</kbd>
                      </div>
                      <div className="flex justify-between p-8px hover:bg-basalt-border/20">
                        <span>SEARCH</span>
                        <kbd className="px-8px py-4px bg-carbon-plate border-2 border-basalt-border text-brutal-xs">/</kbd>
                      </div>
                      <div className="flex justify-between p-8px hover:bg-basalt-border/20">
                        <span>NEW TASK</span>
                        <kbd className="px-8px py-4px bg-carbon-plate border-2 border-basalt-border text-brutal-xs">⌘N</kbd>
                      </div>
                      <div className="flex justify-between p-8px hover:bg-basalt-border/20">
                        <span>TOGGLE SIDEBAR</span>
                        <kbd className="px-8px py-4px bg-carbon-plate border-2 border-basalt-border text-brutal-xs">⌘B</kbd>
                      </div>
                    </div>
                  </div>

                  {/* Task Board Shortcuts */}
                  <div className="brutal-card p-24px">
                    <h3 className="text-brutal-md font-bold uppercase mb-16px">TASK BOARD</h3>
                    <div className="space-y-8px font-mono text-brutal-sm">
                      <div className="flex justify-between p-8px hover:bg-basalt-border/20">
                        <span>NEW TASK</span>
                        <kbd className="px-8px py-4px bg-carbon-plate border-2 border-basalt-border text-brutal-xs">N</kbd>
                      </div>
                      <div className="flex justify-between p-8px hover:bg-basalt-border/20">
                        <span>MY TASKS TOGGLE</span>
                        <kbd className="px-8px py-4px bg-carbon-plate border-2 border-basalt-border text-brutal-xs">M</kbd>
                      </div>
                      <div className="flex justify-between p-8px hover:bg-basalt-border/20">
                        <span>START/STOP TIMER</span>
                        <kbd className="px-8px py-4px bg-carbon-plate border-2 border-basalt-border text-brutal-xs">T</kbd>
                      </div>
                      <div className="flex justify-between p-8px hover:bg-basalt-border/20">
                        <span>MARK AS BLOCKED</span>
                        <kbd className="px-8px py-4px bg-carbon-plate border-2 border-basalt-border text-brutal-xs">B</kbd>
                      </div>
                      <div className="flex justify-between p-8px hover:bg-basalt-border/20">
                        <span>SWITCH TO COLUMN 1-5</span>
                        <kbd className="px-8px py-4px bg-carbon-plate border-2 border-basalt-border text-brutal-xs">1-5</kbd>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Shortcuts */}
                  <div className="brutal-card p-24px">
                    <h3 className="text-brutal-md font-bold uppercase mb-16px">NAVIGATION</h3>
                    <div className="space-y-8px font-mono text-brutal-sm">
                      <div className="flex justify-between p-8px hover:bg-basalt-border/20">
                        <span>GO TO DASHBOARD</span>
                        <kbd className="px-8px py-4px bg-carbon-plate border-2 border-basalt-border text-brutal-xs">G D</kbd>
                      </div>
                      <div className="flex justify-between p-8px hover:bg-basalt-border/20">
                        <span>GO TO PROJECTS</span>
                        <kbd className="px-8px py-4px bg-carbon-plate border-2 border-basalt-border text-brutal-xs">G P</kbd>
                      </div>
                      <div className="flex justify-between p-8px hover:bg-basalt-border/20">
                        <span>GO TO TASKS</span>
                        <kbd className="px-8px py-4px bg-carbon-plate border-2 border-basalt-border text-brutal-xs">G T</kbd>
                      </div>
                      <div className="flex justify-between p-8px hover:bg-basalt-border/20">
                        <span>GO TO SETTINGS</span>
                        <kbd className="px-8px py-4px bg-carbon-plate border-2 border-basalt-border text-brutal-xs">G S</kbd>
                      </div>
                    </div>
                  </div>

                  {/* Developer Shortcuts */}
                  <div className="brutal-card p-24px">
                    <h3 className="text-brutal-md font-bold uppercase mb-16px">DEVELOPER</h3>
                    <div className="space-y-8px font-mono text-brutal-sm">
                      <div className="flex justify-between p-8px hover:bg-basalt-border/20">
                        <span>CREATE BRANCH FROM TASK</span>
                        <kbd className="px-8px py-4px bg-carbon-plate border-2 border-basalt-border text-brutal-xs">⌘⇧B</kbd>
                      </div>
                      <div className="flex justify-between p-8px hover:bg-basalt-border/20">
                        <span>CREATE PR</span>
                        <kbd className="px-8px py-4px bg-carbon-plate border-2 border-basalt-border text-brutal-xs">⌘⇧P</kbd>
                      </div>
                      <div className="flex justify-between p-8px hover:bg-basalt-border/20">
                        <span>COPY TASK NUMBER</span>
                        <kbd className="px-8px py-4px bg-carbon-plate border-2 border-basalt-border text-brutal-xs">⌘⇧C</kbd>
                      </div>
                      <div className="flex justify-between p-8px hover:bg-basalt-border/20">
                        <span>SWITCH CONTEXT</span>
                        <kbd className="px-8px py-4px bg-carbon-plate border-2 border-basalt-border text-brutal-xs">⌘⇧S</kbd>
                      </div>
                    </div>
                  </div>
                </div>
              </SettingsSection>
              
              <SettingsSection
                title="Pro Tips"
                description="Level up your keyboard game"
              >
                <div className="space-y-8px text-brutal-sm">
                  <div>• SHORTCUTS WORK WHEN NOT TYPING IN INPUT FIELDS</div>
                  <div>• USE VIM MOTIONS (J/K) IN LIST VIEWS</div>
                  <div>• PRESS ? TO SHOW CONTEXT-SPECIFIC HELP</div>
                  <div>• ESCAPE CLOSES MODALS AND CANCELS OPERATIONS</div>
                </div>
              </SettingsSection>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {showEditDeveloperProfile && currentUser && (
        <EditDeveloperProfileModal
          userId={currentUser._id}
          onClose={() => setShowEditDeveloperProfile(false)}
        />
      )}
    </div>
  )
}