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
import BrutalButton from '@/components/ui/BrutalButton'
import BrutalCard from '@/components/ui/BrutalCard'
import BrutalBadge from '@/components/ui/BrutalBadge'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--theme-background-secondary)]/80 backdrop-blur-sm">
      <BrutalCard className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
          <h2 className="text-xl font-bold uppercase">EDIT DEVELOPER PROFILE</h2>
          <BrutalButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <HiOutlineX className="w-5 h-5" />
          </BrutalButton>
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
                  "flex items-center gap-2 px-6 py-4 font-mono text-sm font-bold uppercase transition-all border-r-2 border-[var(--theme-border)] last:border-r-0",
                  activeTab === tab.id
                    ? "bg-[var(--theme-primary)] text-[var(--theme-background)]"
                    : "bg-[var(--theme-background)] text-[var(--theme-foreground)] hover:bg-[var(--theme-background-secondary)]"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'basic' && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs font-bold uppercase mb-2">
                    FULL NAME
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm focus:border-[var(--theme-primary)] outline-none"
                    placeholder="ENTER_NAME"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs font-bold uppercase mb-2">
                    ROLE/TITLE
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm focus:border-[var(--theme-primary)] outline-none"
                    placeholder="ENTER_ROLE"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block font-mono text-xs font-bold uppercase mb-2">
                  BIO
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm focus:border-[var(--theme-primary)] outline-none min-h-[80px] resize-none"
                  placeholder="ENTER_BIO..."
                  rows={3}
                />
              </div>

              {/* Location & Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs font-bold uppercase mb-2">
                    LOCATION
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm focus:border-[var(--theme-primary)] outline-none"
                    placeholder="CITY_COUNTRY"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs font-bold uppercase mb-2">
                    TIMEZONE
                  </label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm focus:border-[var(--theme-primary)] outline-none"
                  >
                    <option value="">SELECT_TIMEZONE</option>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs font-bold uppercase mb-2">
                    PHONE (OPTIONAL)
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm focus:border-[var(--theme-primary)] outline-none"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs font-bold uppercase mb-2">
                    GITHUB USERNAME
                  </label>
                  <input
                    type="text"
                    value={formData.githubUsername}
                    onChange={(e) => setFormData(prev => ({ ...prev, githubUsername: e.target.value }))}
                    className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm focus:border-[var(--theme-primary)] outline-none"
                    placeholder="USERNAME"
                  />
                </div>
              </div>

              {/* Experience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs font-bold uppercase mb-2">
                    YEARS OF EXPERIENCE
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={formData.yearsExperience}
                    onChange={(e) => setFormData(prev => ({ ...prev, yearsExperience: parseInt(e.target.value) || 0 }))}
                    className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm focus:border-[var(--theme-primary)] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs font-bold uppercase mb-2">
                    CAREER LEVEL
                  </label>
                  <select
                    value={formData.careerLevel}
                    onChange={(e) => setFormData(prev => ({ ...prev, careerLevel: e.target.value as any }))}
                    className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm focus:border-[var(--theme-primary)] outline-none"
                  >
                    <option value="junior">JUNIOR</option>
                    <option value="mid">MID_LEVEL</option>
                    <option value="senior">SENIOR</option>
                    <option value="lead">LEAD</option>
                    <option value="principal">PRINCIPAL</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'expertise' && (
            <div className="space-y-6">
              {/* Tech Stack */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="font-mono text-xs font-bold uppercase">
                    TECHNOLOGY STACK
                  </label>
                  <BrutalButton
                    size="sm"
                    variant="secondary"
                    onClick={addTechStack}
                    className="flex items-center gap-2"
                  >
                    <HiOutlinePlus className="w-4 h-4" />
                    ADD_TECH
                  </BrutalButton>
                </div>
                <div className="space-y-3">
                  {formData.techStack.map((tech, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)]">
                      <input
                        type="text"
                        value={tech.name}
                        onChange={(e) => updateTechStack(index, 'name', e.target.value)}
                        className="flex-1 p-2 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm focus:border-[var(--theme-primary)] outline-none"
                        placeholder="TECH_NAME"
                      />
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold uppercase hidden md:inline">LEVEL:</span>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={tech.level}
                          onChange={(e) => updateTechStack(index, 'level', parseInt(e.target.value))}
                          className="w-24"
                        />
                        <span className="font-mono text-xs font-bold uppercase w-24 text-right">
                          {tech.level <= 3 ? 'LEARNING' :
                            tech.level <= 7 ? 'PROFICIENT' :
                              'EXPERT'} ({tech.level})
                        </span>
                      </div>
                      <BrutalButton
                        size="sm"
                        variant="ghost"
                        onClick={() => removeTechStack(index)}
                        className="text-brutal-error hover:text-brutal-error"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </BrutalButton>
                    </div>
                  ))}
                  {formData.techStack.length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed border-[var(--theme-border)]">
                      <p className="text-sm font-mono text-[var(--theme-foreground)]/60 uppercase">NO_TECH_ADDED</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block font-mono text-xs font-bold uppercase mb-2">
                  SKILLS
                </label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {formData.skills.map((skill, index) => (
                    <BrutalBadge
                      key={index}
                      variant="outline"
                      className="flex items-center gap-2 pr-1"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="hover:text-brutal-error"
                      >
                        <HiOutlineX className="w-3 h-3" />
                      </button>
                    </BrutalBadge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ADD_SKILL_ENTER"
                    className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm focus:border-[var(--theme-primary)] outline-none"
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
                <label className="block font-mono text-xs font-bold uppercase mb-2">
                  INTERESTS
                </label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {formData.interests.map((interest, index) => (
                    <BrutalBadge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-2 pr-1"
                    >
                      {interest}
                      <button
                        onClick={() => removeInterest(interest)}
                        className="hover:text-brutal-error"
                      >
                        <HiOutlineX className="w-3 h-3" />
                      </button>
                    </BrutalBadge>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="ADD_INTEREST_ENTER"
                  className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm focus:border-[var(--theme-primary)] outline-none"
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
            <div className="space-y-6">
              {/* Working Hours */}
              <div>
                <label className="block font-mono text-xs font-bold uppercase mb-2">
                  WORKING HOURS
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-xs mb-2 uppercase">START TIME</label>
                    <input
                      type="time"
                      value={formData.workingHours.start}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        workingHours: { ...prev.workingHours, start: e.target.value }
                      }))}
                      className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm focus:border-[var(--theme-primary)] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs mb-2 uppercase">END TIME</label>
                    <input
                      type="time"
                      value={formData.workingHours.end}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        workingHours: { ...prev.workingHours, end: e.target.value }
                      }))}
                      className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm focus:border-[var(--theme-primary)] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Communication Preferences */}
              <div>
                <label className="block font-mono text-xs font-bold uppercase mb-2">
                  PREFERRED COMMUNICATION METHOD
                </label>
                <select
                  value={formData.communicationPrefs}
                  onChange={(e) => setFormData(prev => ({ ...prev, communicationPrefs: e.target.value as any }))}
                  className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm focus:border-[var(--theme-primary)] outline-none"
                >
                  <option value="email">EMAIL</option>
                  <option value="slack">SLACK</option>
                  <option value="teams">TEAMS</option>
                  <option value="discord">DISCORD</option>
                </select>
              </div>

              {/* Work Style */}
              <div>
                <label className="block font-mono text-xs font-bold uppercase mb-2">
                  WORK STYLE DESCRIPTION
                </label>
                <textarea
                  value={formData.workStyle}
                  onChange={(e) => setFormData(prev => ({ ...prev, workStyle: e.target.value }))}
                  className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm focus:border-[var(--theme-primary)] outline-none min-h-[60px] resize-none"
                  placeholder="DESCRIBE_WORK_STYLE..."
                />
              </div>

              {/* Career Goals */}
              <div>
                <label className="block font-mono text-xs font-bold uppercase mb-2">
                  CAREER GOALS
                </label>
                <textarea
                  value={formData.careerGoals}
                  onChange={(e) => setFormData(prev => ({ ...prev, careerGoals: e.target.value }))}
                  className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm focus:border-[var(--theme-primary)] outline-none min-h-[60px] resize-none"
                  placeholder="CAREER_ASPIRATIONS..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t-2 border-[var(--theme-border)] bg-[var(--theme-background)]">
          <div className="font-mono text-xs text-[var(--theme-foreground)]/60 uppercase">
            CHANGES_SAVED_IMMEDIATELY
          </div>
          <div className="flex items-center gap-4">
            <BrutalButton
              variant="secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              CANCEL
            </BrutalButton>
            <BrutalButton
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <HiOutlineRefresh className="w-4 h-4 animate-spin" />
              ) : (
                <HiOutlineSave className="w-4 h-4" />
              )}
              {isSaving ? 'SAVING...' : 'SAVE_PROFILE'}
            </BrutalButton>
          </div>
        </div>
      </BrutalCard>
    </div>
  )
}