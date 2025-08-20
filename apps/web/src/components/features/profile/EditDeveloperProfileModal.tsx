import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { 
  HiOutlineX, 
  HiOutlinePlus, 
  HiOutlineTrash, 
  HiOutlineSave,
  HiOutlineRefresh,
  HiOutlineCode,
  HiOutlineUser,
  HiOutlineCog,
  HiOutlineGlobeAlt
} from 'react-icons/hi'
import clsx from 'clsx'

interface EditDeveloperProfileModalProps {
  userId: Id<"users">
  onClose: () => void
}

export function EditDeveloperProfileModal({ userId, onClose }: EditDeveloperProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'expertise' | 'preferences'>('basic')
  const [isSaving, setIsSaving] = useState(false)

  // Get current profile
  const profile = useQuery(api.developers.queries.getDeveloperProfile, { userId })

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    bio: '',
    location: '',
    timezone: '',
    phone: '',
    githubUsername: '',
    yearsExperience: 0,
    careerLevel: 'junior' as 'junior' | 'mid' | 'senior' | 'lead' | 'principal',
    techStack: [] as Array<{ name: string; level: number }>,
    skills: [] as string[],
    interests: [] as string[],
    workingHours: { start: '09:00', end: '17:00' },
    communicationPrefs: 'email' as 'email' | 'slack' | 'teams' | 'discord',
    workStyle: '',
    careerGoals: '',
    mentoringInterests: [] as string[]
  })

  // Mutations
  const updateProfile = useMutation(api.developers.mutations.updateDeveloperProfile)

  // Convert string tech levels from backend to numeric values for UI
  const convertTechLevelsToNumeric = (techStack: Array<{ name: string; level: string }> | undefined): Array<{ name: string; level: number }> => {
    if (!techStack) return []
    return techStack.map(tech => ({
      name: tech.name,
      level: tech.level === 'learning' ? 2 :
             tech.level === 'proficient' ? 5 :
             tech.level === 'expert' ? 9 : 5
    }))
  }

  // Load profile data when available (only once)
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false)
  
  useEffect(() => {
    if (profile && !hasLoadedProfile) {
      setFormData({
        name: profile.name || '',
        role: profile.profile?.role || '',
        bio: profile.profile?.bio || '',
        location: profile.profile?.location || '',
        timezone: profile.profile?.timezone || '',
        phone: profile.profile?.phone || '',
        githubUsername: profile.profile?.githubUsername || '',
        yearsExperience: profile.profile?.yearsExperience || 0,
        careerLevel: profile.profile?.careerLevel || 'junior',
        techStack: convertTechLevelsToNumeric(profile.profile?.techStack),
        skills: profile.profile?.skills || [],
        interests: profile.profile?.interests || [],
        workingHours: profile.profile?.workingHours || { start: '09:00', end: '17:00' },
        communicationPrefs: profile.profile?.communicationPrefs || 'email',
        workStyle: profile.profile?.workStyle || '',
        careerGoals: profile.profile?.careerGoals || '',
        mentoringInterests: profile.profile?.mentoringInterests || []
      })
      setHasLoadedProfile(true)
    }
  }, [profile, hasLoadedProfile])

  // Convert numeric tech levels to string values expected by backend
  const convertTechLevels = (techStack: Array<{ name: string; level: number }>) => {
    return techStack.map(tech => ({
      name: tech.name,
      level: tech.level <= 3 ? 'learning' : 
             tech.level <= 7 ? 'proficient' : 
             'expert'
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Convert tech stack levels before saving
      const dataToSave = {
        ...formData,
        techStack: convertTechLevels(formData.techStack),
        userId
      }
      
      await updateProfile(dataToSave)
      onClose()
    } catch (error) {
      console.error('Failed to update profile:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const addTechStack = () => {
    setFormData(prev => ({
      ...prev,
      techStack: [...prev.techStack, { name: '', level: 1 }]
    }))
  }

  const removeTechStack = (index: number) => {
    setFormData(prev => ({
      ...prev,
      techStack: prev.techStack.filter((_, i) => i !== index)
    }))
  }

  const updateTechStack = (index: number, field: 'name' | 'level', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      techStack: prev.techStack.map((tech, i) => 
        i === index ? { ...tech, [field]: value } : tech
      )
    }))
  }

  const addSkill = (skill: string) => {
    if (skill.trim() && !formData.skills.includes(skill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill.trim()]
      }))
    }
  }

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }))
  }

  const addInterest = (interest: string) => {
    if (interest.trim() && !formData.interests.includes(interest.trim())) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, interest.trim()]
      }))
    }
  }

  const removeInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }))
  }

  const tabs = [
    { id: 'basic', label: 'BASIC INFO', icon: HiOutlineUser },
    { id: 'expertise', label: 'EXPERTISE', icon: HiOutlineCode },
    { id: 'preferences', label: 'PREFERENCES', icon: HiOutlineCog }
  ] as const

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--theme-background-secondary)]/80">
      <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] shadow-brutal w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-24px border-b-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
          <h2 className="text-brutal-lg font-bold">EDIT DEVELOPER PROFILE</h2>
          <button
            onClick={onClose}
            className="brutal-btn-secondary p-8px"
          >
            <HiOutlineX className="w-20px h-20px" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b-2 border-[var(--theme-border)]">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "flex items-center gap-8px px-24px py-16px font-mono text-brutal-sm font-bold transition-all border-r-2 border-[var(--theme-border)] last:border-r-0",
                  activeTab === tab.id
                    ? "bg-primary-brutalist text-event-horizon"
                    : "bg-[var(--theme-background)] text-primary-brutalist/80 hover:bg-[var(--theme-background-secondary)] hover:text-primary-brutalist"
                )}
              >
                <Icon className="w-16px h-16px" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="p-24px overflow-y-auto max-h-[60vh]">
          {activeTab === 'basic' && (
            <div className="space-y-24px">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16px">
                <div>
                  <label className="block font-mono text-brutal-xs font-bold mb-8px">
                    FULL NAME
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="brutal-input w-full"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block font-mono text-brutal-xs font-bold mb-8px">
                    ROLE/TITLE
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="brutal-input w-full"
                    placeholder="e.g., Senior Frontend Developer"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block font-mono text-brutal-xs font-bold mb-8px">
                  BIO
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  className="brutal-input w-full min-h-[80px] resize-vertical whitespace-pre-wrap break-words"
                  placeholder="Tell us about yourself..."
                  rows={3}
                  style={{ 
                    overflowWrap: 'break-word',
                    wordWrap: 'break-word',
                    wordBreak: 'break-word'
                  }}
                />
              </div>

              {/* Location & Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16px">
                <div>
                  <label className="block font-mono text-brutal-xs font-bold mb-8px">
                    LOCATION
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="brutal-input w-full"
                    placeholder="City, Country"
                  />
                </div>
                <div>
                  <label className="block font-mono text-brutal-xs font-bold mb-8px">
                    TIMEZONE
                  </label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                    className="brutal-input w-full"
                  >
                    <option value="">Select timezone</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                    <option value="Asia/Shanghai">Shanghai</option>
                    <option value="Asia/Kolkata">Mumbai</option>
                  </select>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16px">
                <div>
                  <label className="block font-mono text-brutal-xs font-bold mb-8px">
                    PHONE (OPTIONAL)
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="brutal-input w-full"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block font-mono text-brutal-xs font-bold mb-8px">
                    GITHUB USERNAME
                  </label>
                  <input
                    type="text"
                    value={formData.githubUsername}
                    onChange={(e) => setFormData(prev => ({ ...prev, githubUsername: e.target.value }))}
                    className="brutal-input w-full"
                    placeholder="your-username"
                  />
                </div>
              </div>

              {/* Experience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16px">
                <div>
                  <label className="block font-mono text-brutal-xs font-bold mb-8px">
                    YEARS OF EXPERIENCE
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={formData.yearsExperience}
                    onChange={(e) => setFormData(prev => ({ ...prev, yearsExperience: parseInt(e.target.value) || 0 }))}
                    className="brutal-input w-full"
                  />
                </div>
                <div>
                  <label className="block font-mono text-brutal-xs font-bold mb-8px">
                    CAREER LEVEL
                  </label>
                  <select
                    value={formData.careerLevel}
                    onChange={(e) => setFormData(prev => ({ ...prev, careerLevel: e.target.value as any }))}
                    className="brutal-input w-full"
                  >
                    <option value="junior">Junior</option>
                    <option value="mid">Mid-Level</option>
                    <option value="senior">Senior</option>
                    <option value="lead">Lead</option>
                    <option value="principal">Principal</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'expertise' && (
            <div className="space-y-24px">
              {/* Tech Stack */}
              <div>
                <div className="flex items-center justify-between mb-16px">
                  <label className="font-mono text-brutal-xs font-bold">
                    TECHNOLOGY STACK
                  </label>
                  <button
                    onClick={addTechStack}
                    className="brutal-btn-secondary flex items-center gap-8px px-12px py-6px"
                  >
                    <HiOutlinePlus className="w-16px h-16px" />
                    ADD TECH
                  </button>
                </div>
                <div className="space-y-12px">
                  {formData.techStack.map((tech, index) => (
                    <div key={index} className="flex items-center gap-12px p-12px bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)]">
                      <input
                        type="text"
                        value={tech.name}
                        onChange={(e) => updateTechStack(index, 'name', e.target.value)}
                        className="brutal-input flex-1"
                        placeholder="Technology name"
                      />
                      <div className="flex items-center gap-8px">
                        <span className="font-mono text-brutal-xs">LEVEL:</span>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={tech.level}
                          onChange={(e) => updateTechStack(index, 'level', parseInt(e.target.value))}
                          className="w-80px"
                        />
                        <span className="font-mono text-brutal-xs min-w-[80px]">
                          {tech.level <= 3 ? 'LEARNING' : 
                           tech.level <= 7 ? 'PROFICIENT' : 
                           'EXPERT'} ({tech.level})
                        </span>
                      </div>
                      <button
                        onClick={() => removeTechStack(index)}
                        className="brutal-btn-secondary p-6px text-brutal-error"
                      >
                        <HiOutlineTrash className="w-16px h-16px" />
                      </button>
                    </div>
                  ))}
                  {formData.techStack.length === 0 && (
                    <div className="text-center py-24px text-primary-brutalist/60">
                      No technologies added yet. Click "ADD TECH" to get started.
                    </div>
                  )}
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block font-mono text-brutal-xs font-bold mb-8px">
                  SKILLS
                </label>
                <div className="flex flex-wrap gap-8px mb-16px">
                  {formData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="flex items-center gap-8px px-12px py-6px font-mono text-brutal-xs bg-primary-brutalist/20 border-2 border-primary-brutalist text-primary-brutalist font-bold"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="text-brutal-error hover:bg-brutal-error hover:text-event-horizon rounded-full w-16px h-16px flex items-center justify-center"
                      >
                        <HiOutlineX className="w-12px h-12px" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-8px">
                  <input
                    type="text"
                    placeholder="Add a skill and press Enter"
                    className="brutal-input flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addSkill(e.currentTarget.value)
                        e.currentTarget.value = ''
                      }
                    }}
                  />
                </div>
              </div>

              {/* Interests */}
              <div>
                <label className="block font-mono text-brutal-xs font-bold mb-8px">
                  INTERESTS
                </label>
                <div className="flex flex-wrap gap-8px mb-16px">
                  {formData.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="flex items-center gap-8px px-12px py-6px font-mono text-brutal-xs bg-brutal-info/20 border-2 border-brutal-info text-brutal-info font-bold"
                    >
                      {interest}
                      <button
                        onClick={() => removeInterest(interest)}
                        className="text-brutal-error hover:bg-brutal-error hover:text-event-horizon rounded-full w-16px h-16px flex items-center justify-center"
                      >
                        <HiOutlineX className="w-12px h-12px" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add an interest and press Enter"
                  className="brutal-input w-full"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addInterest(e.currentTarget.value)
                      e.currentTarget.value = ''
                    }
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-24px">
              {/* Working Hours */}
              <div>
                <label className="block font-mono text-brutal-xs font-bold mb-8px">
                  WORKING HOURS
                </label>
                <div className="grid grid-cols-2 gap-16px">
                  <div>
                    <label className="block font-mono text-brutal-xs mb-8px">START TIME</label>
                    <input
                      type="time"
                      value={formData.workingHours.start}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        workingHours: { ...prev.workingHours, start: e.target.value }
                      }))}
                      className="brutal-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-brutal-xs mb-8px">END TIME</label>
                    <input
                      type="time"
                      value={formData.workingHours.end}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        workingHours: { ...prev.workingHours, end: e.target.value }
                      }))}
                      className="brutal-input w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Communication Preferences */}
              <div>
                <label className="block font-mono text-brutal-xs font-bold mb-8px">
                  PREFERRED COMMUNICATION METHOD
                </label>
                <select
                  value={formData.communicationPrefs}
                  onChange={(e) => setFormData(prev => ({ ...prev, communicationPrefs: e.target.value as any }))}
                  className="brutal-input w-full"
                >
                  <option value="email">Email</option>
                  <option value="slack">Slack</option>
                  <option value="teams">Microsoft Teams</option>
                  <option value="discord">Discord</option>
                </select>
              </div>

              {/* Work Style */}
              <div>
                <label className="block font-mono text-brutal-xs font-bold mb-8px">
                  WORK STYLE DESCRIPTION
                </label>
                <textarea
                  value={formData.workStyle}
                  onChange={(e) => setFormData(prev => ({ ...prev, workStyle: e.target.value }))}
                  className="brutal-input w-full min-h-[60px]"
                  placeholder="Describe your preferred work style, methodology, etc."
                />
              </div>

              {/* Career Goals */}
              <div>
                <label className="block font-mono text-brutal-xs font-bold mb-8px">
                  CAREER GOALS
                </label>
                <textarea
                  value={formData.careerGoals}
                  onChange={(e) => setFormData(prev => ({ ...prev, careerGoals: e.target.value }))}
                  className="brutal-input w-full min-h-[60px]"
                  placeholder="What are your professional goals and aspirations?"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-24px border-t-2 border-[var(--theme-border)]">
          <div className="font-mono text-brutal-xs text-primary-brutalist/60">
            Changes will be saved immediately
          </div>
          <div className="flex items-center gap-12px">
            <button
              onClick={onClose}
              className="brutal-btn-secondary"
              disabled={isSaving}
            >
              CANCEL
            </button>
            <button
              onClick={handleSave}
              className="brutal-btn flex items-center gap-8px"
              disabled={isSaving}
            >
              {isSaving ? (
                <HiOutlineRefresh className="w-16px h-16px animate-spin" />
              ) : (
                <HiOutlineSave className="w-16px h-16px" />
              )}
              {isSaving ? 'SAVING...' : 'SAVE PROFILE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}