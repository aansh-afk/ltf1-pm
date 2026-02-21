import { useState, useEffect, useRef, useReducer } from 'react'
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
import { m, AnimatePresence } from 'framer-motion'
import BrutalButton from '@/components/ui/BrutalButton'
import BrutalModal from '@/components/ui/BrutalModal'

interface EditDeveloperProfileModalProps {
  userId: Id<"users">
  isOpen: boolean
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

// --- Tab Panel Sub-components ---

interface BasicInfoTabPanelProps {
  formData: EditProfileState['formData']
  dispatch: React.Dispatch<EditProfileAction>
}

function BasicInfoTabPanel({ formData, dispatch }: BasicInfoTabPanelProps) {
  return (
    <m.div className="space-y-6" variants={staggerContainer} initial="enter" animate="center">
      {/* Personal Information */}
      <SectionHeader label="BASIC_INFO.config" />
      <m.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="edit-profile-name" className="block font-mono text-xs font-bold uppercase mb-2 text-[var(--theme-foreground-secondary)]">
            FULL NAME
          </label>
          <input
            id="edit-profile-name"
            type="text"
            value={formData.name}
            onChange={(e) => dispatch({ type: 'UPDATE_FORM', field: 'name', value: e.target.value })}
            className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] rounded-lg font-mono text-sm text-[var(--theme-foreground)] focus:border-[var(--theme-primary)] outline-none transition-colors"
            placeholder="ENTER_NAME"
          />
        </div>
        <div>
          <label htmlFor="edit-profile-role" className="block font-mono text-xs font-bold uppercase mb-2 text-[var(--theme-foreground-secondary)]">
            ROLE/TITLE
          </label>
          <input
            id="edit-profile-role"
            type="text"
            value={formData.role}
            onChange={(e) => dispatch({ type: 'UPDATE_FORM', field: 'role', value: e.target.value })}
            className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] rounded-lg font-mono text-sm text-[var(--theme-foreground)] focus:border-[var(--theme-primary)] outline-none transition-colors"
            placeholder="ENTER_ROLE"
          />
        </div>
      </m.div>

      {/* Bio */}
      <m.div variants={staggerItem}>
        <label htmlFor="edit-profile-bio" className="block font-mono text-xs font-bold uppercase mb-2 text-[var(--theme-foreground-secondary)]">
          BIO
        </label>
        <textarea
          id="edit-profile-bio"
          value={formData.bio}
          onChange={(e) => dispatch({ type: 'UPDATE_FORM', field: 'bio', value: e.target.value })}
          className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] rounded-lg font-mono text-sm text-[var(--theme-foreground)] focus:border-[var(--theme-primary)] outline-none min-h-[80px] resize-none transition-colors"
          placeholder="ENTER_BIO..."
          rows={3}
        />
      </m.div>

      <SectionDivider />

      {/* Location & Contact */}
      <SectionHeader label="LOCATION.env" />
      <m.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="edit-profile-location" className="block font-mono text-xs font-bold uppercase mb-2 text-[var(--theme-foreground-secondary)]">
            LOCATION
          </label>
          <input
            id="edit-profile-location"
            type="text"
            value={formData.location}
            onChange={(e) => dispatch({ type: 'UPDATE_FORM', field: 'location', value: e.target.value })}
            className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] rounded-lg font-mono text-sm text-[var(--theme-foreground)] focus:border-[var(--theme-primary)] outline-none transition-colors"
            placeholder="CITY_COUNTRY"
          />
        </div>
        <div>
          <label htmlFor="edit-profile-timezone" className="block font-mono text-xs font-bold uppercase mb-2 text-[var(--theme-foreground-secondary)]">
            TIMEZONE
          </label>
          <select
            id="edit-profile-timezone"
            value={formData.timezone}
            onChange={(e) => dispatch({ type: 'UPDATE_FORM', field: 'timezone', value: e.target.value })}
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
      </m.div>

      <SectionDivider />

      {/* Contact Information */}
      <SectionHeader label="CONTACT.config" />
      <m.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="edit-profile-phone" className="block font-mono text-xs font-bold uppercase mb-2 text-[var(--theme-foreground-secondary)]">
            PHONE (OPTIONAL)
          </label>
          <input
            id="edit-profile-phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => dispatch({ type: 'UPDATE_FORM', field: 'phone', value: e.target.value })}
            className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] rounded-lg font-mono text-sm text-[var(--theme-foreground)] focus:border-[var(--theme-primary)] outline-none transition-colors"
            placeholder="+1 (555) 123-4567"
          />
        </div>
        <div>
          <label htmlFor="edit-profile-github" className="block font-mono text-xs font-bold uppercase mb-2 text-[var(--theme-foreground-secondary)]">
            GITHUB USERNAME
          </label>
          <input
            id="edit-profile-github"
            type="text"
            value={formData.githubUsername}
            onChange={(e) => dispatch({ type: 'UPDATE_FORM', field: 'githubUsername', value: e.target.value })}
            className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] rounded-lg font-mono text-sm text-[var(--theme-foreground)] focus:border-[var(--theme-primary)] outline-none transition-colors"
            placeholder="USERNAME"
          />
        </div>
      </m.div>

      <SectionDivider />

      {/* Experience */}
      <SectionHeader label="EXPERIENCE.yaml" />
      <m.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="edit-profile-years" className="block font-mono text-xs font-bold uppercase mb-2 text-[var(--theme-foreground-secondary)]">
            YEARS OF EXPERIENCE
          </label>
          <input
            id="edit-profile-years"
            type="number"
            min="0"
            max="50"
            value={formData.yearsExperience}
            onChange={(e) => dispatch({ type: 'UPDATE_FORM', field: 'yearsExperience', value: parseInt(e.target.value) || 0 })}
            className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] rounded-lg font-mono text-sm text-[var(--theme-foreground)] focus:border-[var(--theme-primary)] outline-none transition-colors"
          />
        </div>
        <div>
          <span className="block font-mono text-xs font-bold uppercase mb-3 text-[var(--theme-foreground-secondary)]">
            CAREER LEVEL
          </span>
          {/* Horizontal step indicator */}
          <div className="flex items-center gap-0 w-full">
            {CAREER_LEVELS.map((level, i) => (
              <div key={level.value} className="flex items-center">
                <m.button
                  type="button"
                  onClick={() => dispatch({ type: 'UPDATE_FORM', field: 'careerLevel', value: level.value })}
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
                </m.button>
              </div>
            ))}
          </div>
        </div>
      </m.div>
    </m.div>
  )
}

interface ExpertiseTabPanelProps {
  formData: EditProfileState['formData']
  onAddTechStack: () => void
  onRemoveTechStack: (index: number) => void
  onUpdateTechStack: (index: number, field: 'name' | 'level', value: string | number) => void
  onAddSkill: (skill: string) => void
  onRemoveSkill: (skill: string) => void
  onAddInterest: (interest: string) => void
  onRemoveInterest: (interest: string) => void
}

function ExpertiseTabPanel({ formData, onAddTechStack, onRemoveTechStack, onUpdateTechStack, onAddSkill, onRemoveSkill, onAddInterest, onRemoveInterest }: ExpertiseTabPanelProps) {
  return (
    <m.div className="space-y-6" variants={staggerContainer} initial="enter" animate="center">
      {/* Tech Stack */}
      <SectionHeader label="TECH_STACK.json" />
      <m.div variants={staggerItem}>
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-xs font-bold uppercase text-[var(--theme-foreground-secondary)]">
            TECHNOLOGY STACK
          </span>
          <m.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <BrutalButton
              size="sm"
              variant="secondary"
              onClick={onAddTechStack}
              className="flex items-center gap-2"
            >
              <HiOutlinePlus className="w-4 h-4" />
              ADD_TECH
            </BrutalButton>
          </m.div>
        </div>
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {formData.techStack.map((tech, index) => (
              <m.div
                key={`tech-${tech.name || 'empty'}-${tech.level}`}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
                className="flex items-center gap-3 p-3 bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)]"
              >
                <input
                  type="text"
                  value={tech.name}
                  onChange={(e) => onUpdateTechStack(index, 'name', e.target.value)}
                  className="flex-1 p-2 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] rounded-lg font-mono text-sm text-[var(--theme-foreground)] focus:border-[var(--theme-primary)] outline-none transition-colors"
                  placeholder="TECH_NAME"
                />
                <SegmentedSkillBar
                  level={tech.level}
                  onChange={(v) => onUpdateTechStack(index, 'level', v)}
                />
                <m.button
                  onClick={() => onRemoveTechStack(index)}
                  className="p-1.5 text-[var(--theme-foreground-secondary)] hover:text-[var(--theme-error)] transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <HiOutlineTrash className="w-4 h-4" />
                </m.button>
              </m.div>
            ))}
          </AnimatePresence>
          {formData.techStack.length === 0 && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6 border-2 border-dashed border-[var(--theme-border)]"
            >
              <p className="text-sm font-mono text-[var(--theme-foreground-secondary)] uppercase">NO_TECH_ADDED</p>
              <p className="text-xs font-mono text-[var(--theme-foreground-secondary)] mt-1 opacity-60">$ click ADD_TECH to get started</p>
            </m.div>
          )}
        </div>
      </m.div>

      <SectionDivider />

      {/* Skills */}
      <SectionHeader label="SKILLS.list" />
      <m.div variants={staggerItem}>
        <div className="flex flex-wrap gap-2 mb-4">
          <AnimatePresence mode="popLayout">
            {formData.skills.map((skill) => (
              <m.span
                key={skill}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.12 } }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--theme-background-tertiary)] border border-[var(--theme-border)] font-mono text-xs uppercase text-[var(--theme-foreground)]"
              >
                {skill}
                <button
                  onClick={() => onRemoveSkill(skill)}
                  className="text-[var(--theme-foreground-secondary)] hover:text-[var(--theme-error)] transition-colors ml-1"
                >
                  <HiOutlineX className="w-3 h-3" />
                </button>
              </m.span>
            ))}
          </AnimatePresence>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="ADD_SKILL_ENTER"
            aria-label="Add skill"
            className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] rounded-lg font-mono text-sm text-[var(--theme-foreground)] focus:border-[var(--theme-primary)] outline-none transition-colors"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                onAddSkill(e.currentTarget.value)
                e.currentTarget.value = ''
              }
            }}
          />
        </div>
      </m.div>

      <SectionDivider />

      {/* Interests */}
      <SectionHeader label="INTERESTS.list" />
      <m.div variants={staggerItem}>
        <div className="flex flex-wrap gap-2 mb-4">
          <AnimatePresence mode="popLayout">
            {formData.interests.map((interest) => (
              <m.span
                key={interest}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.12 } }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--theme-background-tertiary)] border border-[var(--theme-border)] font-mono text-xs uppercase text-[var(--theme-foreground)]"
              >
                {interest}
                <button
                  onClick={() => onRemoveInterest(interest)}
                  className="text-[var(--theme-foreground-secondary)] hover:text-[var(--theme-error)] transition-colors ml-1"
                >
                  <HiOutlineX className="w-3 h-3" />
                </button>
              </m.span>
            ))}
          </AnimatePresence>
        </div>
        <input
          type="text"
          placeholder="ADD_INTEREST_ENTER"
          aria-label="Add interest"
          className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] rounded-lg font-mono text-sm text-[var(--theme-foreground)] focus:border-[var(--theme-primary)] outline-none transition-colors"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              onAddInterest(e.currentTarget.value)
              e.currentTarget.value = ''
            }
          }}
        />
      </m.div>
    </m.div>
  )
}

interface PreferencesTabPanelProps {
  formData: EditProfileState['formData']
  dispatch: React.Dispatch<EditProfileAction>
}

function PreferencesTabPanel({ formData, dispatch }: PreferencesTabPanelProps) {
  return (
    <m.div className="space-y-6" variants={staggerContainer} initial="enter" animate="center">
      {/* Working Hours */}
      <SectionHeader label="SCHEDULE.config" />
      <m.div variants={staggerItem}>
        <span className="block font-mono text-xs font-bold uppercase mb-2 text-[var(--theme-foreground-secondary)]">
          WORKING HOURS
        </span>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="edit-profile-start-time" className="block font-mono text-[10px] mb-2 uppercase text-[var(--theme-foreground-secondary)]">START TIME</label>
            <input
              id="edit-profile-start-time"
              type="time"
              value={formData.workingHours.start}
              onChange={(e) => dispatch({ type: 'UPDATE_FORM', field: 'workingHours', value: { ...formData.workingHours, start: e.target.value } })}
              className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] rounded-lg font-mono text-sm text-[var(--theme-foreground)] focus:border-[var(--theme-primary)] outline-none transition-colors"
            />
          </div>
          <div>
            <label htmlFor="edit-profile-end-time" className="block font-mono text-[10px] mb-2 uppercase text-[var(--theme-foreground-secondary)]">END TIME</label>
            <input
              id="edit-profile-end-time"
              type="time"
              value={formData.workingHours.end}
              onChange={(e) => dispatch({ type: 'UPDATE_FORM', field: 'workingHours', value: { ...formData.workingHours, end: e.target.value } })}
              className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] rounded-lg font-mono text-sm text-[var(--theme-foreground)] focus:border-[var(--theme-primary)] outline-none transition-colors"
            />
          </div>
        </div>
      </m.div>

      <SectionDivider />

      {/* Communication Preferences */}
      <SectionHeader label="COMMS.config" />
      <m.div variants={staggerItem}>
        <label htmlFor="edit-profile-comms" className="block font-mono text-xs font-bold uppercase mb-2 text-[var(--theme-foreground-secondary)]">
          PREFERRED COMMUNICATION METHOD
        </label>
        <select
          id="edit-profile-comms"
          value={formData.communicationPrefs}
          onChange={(e) => dispatch({ type: 'UPDATE_FORM', field: 'communicationPrefs', value: e.target.value })}
          className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] rounded-lg font-mono text-sm text-[var(--theme-foreground)] focus:border-[var(--theme-primary)] outline-none transition-colors"
        >
          <option value="email">EMAIL</option>
          <option value="slack">SLACK</option>
          <option value="teams">TEAMS</option>
          <option value="discord">DISCORD</option>
        </select>
      </m.div>

      <SectionDivider />

      {/* Work Style */}
      <SectionHeader label="WORKSTYLE.md" />
      <m.div variants={staggerItem}>
        <label htmlFor="edit-profile-workstyle" className="block font-mono text-xs font-bold uppercase mb-2 text-[var(--theme-foreground-secondary)]">
          WORK STYLE DESCRIPTION
        </label>
        <textarea
          id="edit-profile-workstyle"
          value={formData.workStyle}
          onChange={(e) => dispatch({ type: 'UPDATE_FORM', field: 'workStyle', value: e.target.value })}
          className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] rounded-lg font-mono text-sm text-[var(--theme-foreground)] focus:border-[var(--theme-primary)] outline-none min-h-[60px] resize-none transition-colors"
          placeholder="DESCRIBE_WORK_STYLE..."
        />
      </m.div>

      <SectionDivider />

      {/* Career Goals */}
      <SectionHeader label="GOALS.yaml" />
      <m.div variants={staggerItem}>
        <label htmlFor="edit-profile-goals" className="block font-mono text-xs font-bold uppercase mb-2 text-[var(--theme-foreground-secondary)]">
          CAREER GOALS
        </label>
        <textarea
          id="edit-profile-goals"
          value={formData.careerGoals}
          onChange={(e) => dispatch({ type: 'UPDATE_FORM', field: 'careerGoals', value: e.target.value })}
          className="w-full p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] rounded-lg font-mono text-sm text-[var(--theme-foreground)] focus:border-[var(--theme-primary)] outline-none min-h-[60px] resize-none transition-colors"
          placeholder="CAREER_ASPIRATIONS..."
        />
      </m.div>
    </m.div>
  )
}

// --- Main component types ---

type EditProfileState = {
  activeTab: 'basic' | 'expertise' | 'preferences'
  isSaving: boolean
  tabDirection: number
  formData: {
    name: string
    role: string
    bio: string
    location: string
    timezone: string
    phone: string
    githubUsername: string
    yearsExperience: number
    careerLevel: 'junior' | 'mid' | 'senior' | 'lead' | 'principal'
    techStack: Array<{ name: string; level: number }>
    skills: string[]
    interests: string[]
    workingHours: { start: string; end: string }
    communicationPrefs: 'email' | 'slack' | 'teams' | 'discord'
    workStyle: string
    careerGoals: string
    mentoringInterests: string[]
  }
  hasLoadedProfile: boolean
}

const editProfileInitialState: EditProfileState = {
  activeTab: 'basic',
  isSaving: false,
  tabDirection: 0,
  formData: {
    name: '',
    role: '',
    bio: '',
    location: '',
    timezone: '',
    phone: '',
    githubUsername: '',
    yearsExperience: 0,
    careerLevel: 'junior',
    techStack: [],
    skills: [],
    interests: [],
    workingHours: { start: '09:00', end: '17:00' },
    communicationPrefs: 'email',
    workStyle: '',
    careerGoals: '',
    mentoringInterests: [],
  },
  hasLoadedProfile: false,
}

type EditProfileAction =
  | { type: 'UPDATE'; field: keyof EditProfileState; value: unknown }
  | { type: 'UPDATE_FORM'; field: keyof EditProfileState['formData']; value: unknown }

function editProfileReducer(state: EditProfileState, action: EditProfileAction): EditProfileState {
  switch (action.type) {
    case 'UPDATE':
      return { ...state, [action.field]: action.value }
    case 'UPDATE_FORM':
      return { ...state, formData: { ...state.formData, [action.field]: action.value } }
    default:
      return state
  }
}

export function EditDeveloperProfileModal({ userId, isOpen, onClose }: EditDeveloperProfileModalProps) {
  const [state, dispatch] = useReducer(editProfileReducer, editProfileInitialState)
  const { activeTab, isSaving, tabDirection, formData, hasLoadedProfile } = state
  const prevTabRef = useRef(activeTab)

  // Get current profile
  const profile = useQuery(api.developers.queries.getDeveloperProfile, { userId })

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
  useEffect(() => {
    if (profile && !hasLoadedProfile) {
      dispatch({ type: 'UPDATE', field: 'formData', value: {
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
      }})
      dispatch({ type: 'UPDATE', field: 'hasLoadedProfile', value: true })
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
    dispatch({ type: 'UPDATE', field: 'isSaving', value: true })
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
      dispatch({ type: 'UPDATE', field: 'isSaving', value: false })
    }
  }

  const addTechStack = () => {
    dispatch({ type: 'UPDATE_FORM', field: 'techStack', value: [...formData.techStack, { name: '', level: 1 }] })
  }

  const removeTechStack = (index: number) => {
    dispatch({ type: 'UPDATE_FORM', field: 'techStack', value: formData.techStack.filter((_, i) => i !== index) })
  }

  const updateTechStack = (index: number, field: 'name' | 'level', value: string | number) => {
    dispatch({ type: 'UPDATE_FORM', field: 'techStack', value: formData.techStack.map((tech, i) =>
      i === index ? { ...tech, [field]: value } : tech
    ) })
  }

  const addSkill = (skill: string) => {
    if (skill.trim() && !formData.skills.includes(skill.trim())) {
      dispatch({ type: 'UPDATE_FORM', field: 'skills', value: [...formData.skills, skill.trim()] })
    }
  }

  const removeSkill = (skill: string) => {
    dispatch({ type: 'UPDATE_FORM', field: 'skills', value: formData.skills.filter(s => s !== skill) })
  }

  const addInterest = (interest: string) => {
    if (interest.trim() && !formData.interests.includes(interest.trim())) {
      dispatch({ type: 'UPDATE_FORM', field: 'interests', value: [...formData.interests, interest.trim()] })
    }
  }

  const removeInterest = (interest: string) => {
    dispatch({ type: 'UPDATE_FORM', field: 'interests', value: formData.interests.filter(i => i !== interest) })
  }

  const tabs = [
    { id: 'basic', label: 'BASIC INFO', icon: HiOutlineUser },
    { id: 'expertise', label: 'EXPERTISE', icon: HiOutlineCode },
    { id: 'preferences', label: 'PREFERENCES', icon: HiOutlineCog }
  ] as const

  const tabOrder = { basic: 0, expertise: 1, preferences: 2 }

  const handleTabChange = (newTab: typeof activeTab) => {
    const dir = tabOrder[newTab] - tabOrder[activeTab]
    dispatch({ type: 'UPDATE', field: 'tabDirection', value: dir })
    prevTabRef.current = activeTab
    dispatch({ type: 'UPDATE', field: 'activeTab', value: newTab })
  }

  return (
    <BrutalModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Developer Profile"
      size="xl"
      showCloseButton={true}
    >
      {/* Tab Navigation */}
      <div className="flex border-b-2 border-[var(--theme-border)] -mx-4 mb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <m.button
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
                <m.div
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--theme-background)]"
                  layoutId="activeTabUnderline"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </m.button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 280px)' }}>
        <AnimatePresence mode="wait" custom={tabDirection}>
          {activeTab === 'basic' && (
            <m.div
              key="basic"
              custom={tabDirection}
              variants={tabVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <BasicInfoTabPanel formData={formData} dispatch={dispatch} />
            </m.div>
          )}

          {activeTab === 'expertise' && (
            <m.div
              key="expertise"
              custom={tabDirection}
              variants={tabVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <ExpertiseTabPanel
                formData={formData}
                onAddTechStack={addTechStack}
                onRemoveTechStack={removeTechStack}
                onUpdateTechStack={updateTechStack}
                onAddSkill={addSkill}
                onRemoveSkill={removeSkill}
                onAddInterest={addInterest}
                onRemoveInterest={removeInterest}
              />
            </m.div>
          )}

          {activeTab === 'preferences' && (
            <m.div
              key="preferences"
              custom={tabDirection}
              variants={tabVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <PreferencesTabPanel formData={formData} dispatch={dispatch} />
            </m.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t-2 border-[var(--theme-border)]">
        <div className="font-mono text-xs text-[var(--theme-foreground-secondary)] uppercase tracking-wider">
          $ PROFILE_EDITOR v2.0
        </div>
        <div className="flex items-center gap-4">
          <m.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <BrutalButton
              variant="ghost"
              onClick={onClose}
              disabled={isSaving}
            >
              CANCEL
            </BrutalButton>
          </m.div>
          <m.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
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
          </m.div>
        </div>
      </div>
    </BrutalModal>
  )
}
