import { useState, useEffect, useRef } from 'react'
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
  HiOutlineCog
} from 'react-icons/hi'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import BrutalButton from '@/components/ui/BrutalButton'

interface EditDeveloperProfileModalProps {
  userId: Id<"users">
  onClose: () => void
}

const CAREER_LEVELS = [
  { value: 'junior', label: 'JUNIOR' },
  { value: 'mid', label: 'MID' },
  { value: 'senior', label: 'SENIOR' },
  { value: 'lead', label: 'LEAD' },
  { value: 'principal', label: 'PRINCIPAL' },
] as const

const tabVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 40 : -40,
    opacity: 0,
  }),
}

const staggerContainer = {
  center: {
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const staggerItem = {
  enter: { opacity: 0, y: 12 },
  center: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="mb-4">
      <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--theme-primary)]">
        {'> '}{label}
      </p>
      <div className="mt-1.5 h-[1px] w-full bg-[var(--theme-primary)] opacity-30" />
    </div>
  )
}

function SectionDivider() {
  return <div className="h-[1px] w-full bg-[var(--theme-border)] my-6" />
}

function SegmentedSkillBar({ level, onChange }: { level: number; onChange: (v: number) => void }) {
  const segments = 10
  const label = level <= 3 ? 'LEARNING' : level <= 7 ? 'PROFICIENT' : 'EXPERT'
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-[2px]">
        {Array.from({ length: segments }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i + 1)}
            className={clsx(
              'w-4 h-5 border border-[var(--theme-border)] transition-colors duration-150',
              i < level
                ? 'bg-[var(--theme-primary)]'
                : 'bg-[var(--theme-background-secondary)]',
              'hover:opacity-80'
            )}
          />
        ))}
      </div>
      <span className="font-mono text-[10px] font-bold uppercase w-24 text-right text-[var(--theme-foreground-secondary)]">
        {label} ({level})
      </span>
    </div>
  )
}

export function EditDeveloperProfileModal({ userId, onClose }: EditDeveloperProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'expertise' | 'preferences'>('basic')
  const [isSaving, setIsSaving] = useState(false)
  const [tabDirection, setTabDirection] = useState(0)
  const prevTabRef = useRef(activeTab)

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

  const tabOrder = { basic: 0, expertise: 1, preferences: 2 }

  const handleTabChange = (newTab: typeof activeTab) => {
    const dir = tabOrder[newTab] - tabOrder[activeTab]
    setTabDirection(dir)
    prevTabRef.current = activeTab
    setActiveTab(newTab)
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--theme-background-secondary)]/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border-2 border-[var(--theme-border)] bg-[var(--theme-background)]"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{ boxShadow: '6px 6px 0px var(--theme-shadow)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
          <div>
            <h2 className="text-xl font-bold font-mono uppercase text-[var(--theme-foreground)]">
              EDIT DEVELOPER PROFILE
            </h2>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--theme-foreground-secondary)] mt-1">
              $ PROFILE_EDITOR v2.0 -- MODIFY YOUR CONFIG
            </p>
          </div>
          <motion.button
            onClick={onClose}
            className="p-2 border-2 border-[var(--theme-border)] bg-[var(--theme-background)] text-[var(--theme-foreground-secondary)] hover:text-[var(--theme-error)] hover:border-[var(--theme-error)] transition-colors rounded-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <HiOutlineX className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b-2 border-[var(--theme-border)]">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <motion.button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={clsx(
                  "flex items-center gap-2 px-6 py-4 font-mono text-sm font-bold uppercase transition-colors border-r-2 border-[var(--theme-border)] last:border-r-0 relative",
                  activeTab === tab.id
                    ? "bg-[var(--theme-primary)] text-[var(--theme-background)]"
                    : "bg-[var(--theme-background)] text-[var(--theme-foreground)] hover:bg-[var(--theme-background-secondary)]"
                )}
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--theme-background)]"
                    layoutId="activeTabUnderline"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <AnimatePresence mode="wait" custom={tabDirection}>
            {activeTab === 'basic' && (
              <motion.div
                key="basic"
                custom={tabDirection}
                variants={tabVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                <motion.div className="space-y-6" variants={staggerContainer} initial="enter" animate="center">
                  {/* Personal Information */}
                  <SectionHeader label="BASIC_INFO.config" />
                  <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-xs font-bold uppercase mb-2 text-[var(--theme-foreground-secondary)]">
                        FULL NAME
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] rounded-lg font-mono text-sm text-[var(--theme-foreground)] focus:border-[var(--theme-primary)] outline-none transition-colors"
                        placeholder="ENTER_NAME"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs font-bold uppercase mb-2 text-[var(--theme-foreground-secondary)]">
                        ROLE/TITLE
                      </label>
                      <input
                        type="text"
                        value={formData.role}
                        onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                        className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] rounded-lg font-mono text-sm text-[var(--theme-foreground)] focus:border-[var(--theme-primary)] outline-none transition-colors"
                        placeholder="ENTER_ROLE"
                      />
                    </div>
                  </motion.div>

                  {/* Bio */}
                  <motion.div variants={staggerItem}>
                    <label className="block font-mono text-xs font-bold uppercase mb-2 text-[var(--theme-foreground-secondary)]">
                      BIO
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] rounded-lg font-mono text-sm text-[var(--theme-foreground)] focus:border-[var(--theme-primary)] outline-none min-h-[80px] resize-none transition-colors"
                      placeholder="ENTER_BIO..."
                      rows={3}
                    />
                  </motion.div>

                  <SectionDivider />

                  {/* Location & Contact */}
                  <SectionHeader label="LOCATION.env" />
                  <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-xs font-bold uppercase mb-2 text-[var(--theme-foreground-secondary)]">
                        LOCATION
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] rounded-lg font-mono text-sm text-[var(--theme-foreground)] focus:border-[var(--theme-primary)] outline-none transition-colors"
                        placeholder="CITY_COUNTRY"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs font-bold uppercase mb-2 text-[var(--theme-foreground-secondary)]">
                        TIMEZONE
                      </label>
                      <select
                        value={formData.timezone}
                        onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                        className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] rounded-lg font-mono text-sm text-[var(--theme-foreground)] focus:border-[var(--theme-primary)] outline-none transition-colors"
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
                  </motion.div>

                  <SectionDivider />

                  {/* Contact Information */}
                  <SectionHeader label="CONTACT.config" />
                  <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-xs font-bold uppercase mb-2 text-[var(--theme-foreground-secondary)]">
                        PHONE (OPTIONAL)
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] rounded-lg font-mono text-sm text-[var(--theme-foreground)] focus:border-[var(--theme-primary)] outline-none transition-colors"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs font-bold uppercase mb-2 text-[var(--theme-foreground-secondary)]">
                        GITHUB USERNAME
                      </label>
                      <input
                        type="text"
                        value={formData.githubUsername}
                        onChange={(e) => setFormData(prev => ({ ...prev, githubUsername: e.target.value }))}
                        className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] rounded-lg font-mono text-sm text-[var(--theme-foreground)] focus:border-[var(--theme-primary)] outline-none transition-colors"
                        placeholder="USERNAME"
                      />
                    </div>
                  </motion.div>

                  <SectionDivider />

                  {/* Experience */}
                  <SectionHeader label="EXPERIENCE.yaml" />
                  <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-xs font-bold uppercase mb-2 text-[var(--theme-foreground-secondary)]">
                        YEARS OF EXPERIENCE
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={formData.yearsExperience}
                        onChange={(e) => setFormData(prev => ({ ...prev, yearsExperience: parseInt(e.target.value) || 0 }))}
                        className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] rounded-lg font-mono text-sm text-[var(--theme-foreground)] focus:border-[var(--theme-primary)] outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs font-bold uppercase mb-3 text-[var(--theme-foreground-secondary)]">
                        CAREER LEVEL
                      </label>
                      {/* Horizontal step indicator */}
                      <div className="flex items-center gap-0 w-full">
                        {CAREER_LEVELS.map((level, i) => (
                          <div key={level.value} className="flex items-center">
                            <motion.button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, careerLevel: level.value as any }))}
                              className={clsx(
                                'px-2.5 py-2 font-mono text-[10px] font-bold uppercase border-2 transition-colors',
                                formData.careerLevel === level.value
                                  ? 'bg-[var(--theme-primary)] text-[var(--theme-background)] border-[var(--theme-primary)]'
                                  : 'bg-[var(--theme-background)] text-[var(--theme-foreground-secondary)] border-[var(--theme-border)] hover:border-[var(--theme-primary)] hover:text-[var(--theme-foreground)]',
                                i === 0 && 'rounded-l-lg',
                                i === CAREER_LEVELS.length - 1 && 'rounded-r-lg',
                                i > 0 && '-ml-[2px]'
                              )}
                              whileHover={{ y: -1 }}
                              whileTap={{ scale: 0.97 }}
                            >
                              {level.label}
                            </motion.button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'expertise' && (
              <motion.div
                key="expertise"
                custom={tabDirection}
                variants={tabVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                <motion.div className="space-y-6" variants={staggerContainer} initial="enter" animate="center">
                  {/* Tech Stack */}
                  <SectionHeader label="TECH_STACK.json" />
                  <motion.div variants={staggerItem}>
                    <div className="flex items-center justify-between mb-4">
                      <label className="font-mono text-xs font-bold uppercase text-[var(--theme-foreground-secondary)]">
                        TECHNOLOGY STACK
                      </label>
                      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <BrutalButton
                          size="sm"
                          variant="secondary"
                          onClick={addTechStack}
                          className="flex items-center gap-2"
                        >
                          <HiOutlinePlus className="w-4 h-4" />
                          ADD_TECH
                        </BrutalButton>
                      </motion.div>
                    </div>
                    <div className="space-y-3">
                      <AnimatePresence mode="popLayout">
                        {formData.techStack.map((tech, index) => (
                          <motion.div
                            key={index}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
                            className="flex items-center gap-3 p-3 bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)]"
                          >
                            <input
                              type="text"
                              value={tech.name}
                              onChange={(e) => updateTechStack(index, 'name', e.target.value)}
                              className="flex-1 p-2 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] rounded-lg font-mono text-sm text-[var(--theme-foreground)] focus:border-[var(--theme-primary)] outline-none transition-colors"
                              placeholder="TECH_NAME"
                            />
                            <SegmentedSkillBar
                              level={tech.level}
                              onChange={(v) => updateTechStack(index, 'level', v)}
                            />
                            <motion.button
                              onClick={() => removeTechStack(index)}
                              className="p-1.5 text-[var(--theme-foreground-secondary)] hover:text-[var(--theme-error)] transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <HiOutlineTrash className="w-4 h-4" />
                            </motion.button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {formData.techStack.length === 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center py-6 border-2 border-dashed border-[var(--theme-border)]"
                        >
                          <p className="text-sm font-mono text-[var(--theme-foreground-secondary)] uppercase">NO_TECH_ADDED</p>
                          <p className="text-xs font-mono text-[var(--theme-foreground-secondary)] mt-1 opacity-60">$ click ADD_TECH to get started</p>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>

                  <SectionDivider />

                  {/* Skills */}
                  <SectionHeader label="SKILLS.list" />
                  <motion.div variants={staggerItem}>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <AnimatePresence mode="popLayout">
                        {formData.skills.map((skill) => (
                          <motion.span
                            key={skill}
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.12 } }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--theme-background-tertiary)] border border-[var(--theme-border)] font-mono text-xs uppercase text-[var(--theme-foreground)]"
                          >
                            {skill}
                            <button
                              onClick={() => removeSkill(skill)}
                              className="text-[var(--theme-foreground-secondary)] hover:text-[var(--theme-error)] transition-colors ml-1"
                            >
                              <HiOutlineX className="w-3 h-3" />
                            </button>
                          </motion.span>
                        ))}
                      </AnimatePresence>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="ADD_SKILL_ENTER"
                        className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] rounded-lg font-mono text-sm text-[var(--theme-foreground)] focus:border-[var(--theme-primary)] outline-none transition-colors"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addSkill(e.currentTarget.value)
                            e.currentTarget.value = ''
                          }
                        }}
                      />
                    </div>
                  </motion.div>

                  <SectionDivider />

                  {/* Interests */}
                  <SectionHeader label="INTERESTS.list" />
                  <motion.div variants={staggerItem}>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <AnimatePresence mode="popLayout">
                        {formData.interests.map((interest) => (
                          <motion.span
                            key={interest}
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.12 } }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--theme-background-tertiary)] border border-[var(--theme-border)] font-mono text-xs uppercase text-[var(--theme-foreground)]"
                          >
                            {interest}
                            <button
                              onClick={() => removeInterest(interest)}
                              className="text-[var(--theme-foreground-secondary)] hover:text-[var(--theme-error)] transition-colors ml-1"
                            >
                              <HiOutlineX className="w-3 h-3" />
                            </button>
                          </motion.span>
                        ))}
                      </AnimatePresence>
                    </div>
                    <input
                      type="text"
                      placeholder="ADD_INTEREST_ENTER"
                      className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] rounded-lg font-mono text-sm text-[var(--theme-foreground)] focus:border-[var(--theme-primary)] outline-none transition-colors"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addInterest(e.currentTarget.value)
                          e.currentTarget.value = ''
                        }
                      }}
                    />
                  </motion.div>
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'preferences' && (
              <motion.div
                key="preferences"
                custom={tabDirection}
                variants={tabVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                <motion.div className="space-y-6" variants={staggerContainer} initial="enter" animate="center">
                  {/* Working Hours */}
                  <SectionHeader label="SCHEDULE.config" />
                  <motion.div variants={staggerItem}>
                    <label className="block font-mono text-xs font-bold uppercase mb-2 text-[var(--theme-foreground-secondary)]">
                      WORKING HOURS
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-mono text-[10px] mb-2 uppercase text-[var(--theme-foreground-secondary)]">START TIME</label>
                        <input
                          type="time"
                          value={formData.workingHours.start}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            workingHours: { ...prev.workingHours, start: e.target.value }
                          }))}
                          className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] rounded-lg font-mono text-sm text-[var(--theme-foreground)] focus:border-[var(--theme-primary)] outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] mb-2 uppercase text-[var(--theme-foreground-secondary)]">END TIME</label>
                        <input
                          type="time"
                          value={formData.workingHours.end}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            workingHours: { ...prev.workingHours, end: e.target.value }
                          }))}
                          className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] rounded-lg font-mono text-sm text-[var(--theme-foreground)] focus:border-[var(--theme-primary)] outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </motion.div>

                  <SectionDivider />

                  {/* Communication Preferences */}
                  <SectionHeader label="COMMS.config" />
                  <motion.div variants={staggerItem}>
                    <label className="block font-mono text-xs font-bold uppercase mb-2 text-[var(--theme-foreground-secondary)]">
                      PREFERRED COMMUNICATION METHOD
                    </label>
                    <select
                      value={formData.communicationPrefs}
                      onChange={(e) => setFormData(prev => ({ ...prev, communicationPrefs: e.target.value as any }))}
                      className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] rounded-lg font-mono text-sm text-[var(--theme-foreground)] focus:border-[var(--theme-primary)] outline-none transition-colors"
                    >
                      <option value="email">EMAIL</option>
                      <option value="slack">SLACK</option>
                      <option value="teams">TEAMS</option>
                      <option value="discord">DISCORD</option>
                    </select>
                  </motion.div>

                  <SectionDivider />

                  {/* Work Style */}
                  <SectionHeader label="WORKSTYLE.md" />
                  <motion.div variants={staggerItem}>
                    <label className="block font-mono text-xs font-bold uppercase mb-2 text-[var(--theme-foreground-secondary)]">
                      WORK STYLE DESCRIPTION
                    </label>
                    <textarea
                      value={formData.workStyle}
                      onChange={(e) => setFormData(prev => ({ ...prev, workStyle: e.target.value }))}
                      className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] rounded-lg font-mono text-sm text-[var(--theme-foreground)] focus:border-[var(--theme-primary)] outline-none min-h-[60px] resize-none transition-colors"
                      placeholder="DESCRIBE_WORK_STYLE..."
                    />
                  </motion.div>

                  <SectionDivider />

                  {/* Career Goals */}
                  <SectionHeader label="GOALS.yaml" />
                  <motion.div variants={staggerItem}>
                    <label className="block font-mono text-xs font-bold uppercase mb-2 text-[var(--theme-foreground-secondary)]">
                      CAREER GOALS
                    </label>
                    <textarea
                      value={formData.careerGoals}
                      onChange={(e) => setFormData(prev => ({ ...prev, careerGoals: e.target.value }))}
                      className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] rounded-lg font-mono text-sm text-[var(--theme-foreground)] focus:border-[var(--theme-primary)] outline-none min-h-[60px] resize-none transition-colors"
                      placeholder="CAREER_ASPIRATIONS..."
                    />
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
          <div className="font-mono text-xs text-[var(--theme-foreground-secondary)] uppercase tracking-wider">
            $ PROFILE_EDITOR v2.0
          </div>
          <div className="flex items-center gap-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <BrutalButton
                variant="ghost"
                onClick={onClose}
                disabled={isSaving}
              >
                CANCEL
              </BrutalButton>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <BrutalButton
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2"
                style={{ boxShadow: '4px 4px 0px var(--theme-shadow)' }}
              >
                {isSaving ? (
                  <HiOutlineRefresh className="w-4 h-4 animate-spin" />
                ) : (
                  <HiOutlineSave className="w-4 h-4" />
                )}
                {isSaving ? 'SAVING...' : 'SAVE_PROFILE'}
              </BrutalButton>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
