import { useReducer, useEffect } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import BrutalModal from '../ui/BrutalModal'
import ThemeSwitcher from '../theme/ThemeSwitcher'
import { useTheme } from '../../contexts/ThemeContext'
import { useMutation, useAction } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import toast from 'react-hot-toast'
import posthog from 'posthog-js'
import {
  HiOutlineColorSwatch,
  HiOutlineSparkles,
  HiOutlineCheck,
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineX,
  HiOutlineKey,
  HiOutlineCreditCard,
  HiOutlineInformationCircle
} from 'react-icons/hi'

interface OnboardingFlowProps {
  isOpen: boolean
  onComplete: () => void
}

type OnboardingStep = 'theme' | 'ai' | 'complete'

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
}

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
}

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

const bootLines = [
  { label: 'THEME_ENGINE', delay: 0 },
  { label: 'AI_MODULE', delay: 0.4 },
  { label: 'WORKSPACE_INIT', delay: 0.8 },
]

interface TerminalProgressProps {
  filledBlocks: number
  stepIndex: number
  totalSteps: number
  stepLabel: string
}

function TerminalProgress({ filledBlocks, stepIndex, totalSteps, stepLabel }: TerminalProgressProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-[16px] font-mono"
    >
      <div
        className="px-[12px] py-[8px] border-2"
        style={{
          backgroundColor: 'var(--theme-background)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <span style={{ color: 'var(--theme-foreground-tertiary)' }} className="text-[11px] tracking-wider">
          {'['}
        </span>
        {Array.from({ length: 20 }).map((_, i) => (
          <span
            key={`block-${i}`}
            className="text-[11px]"
            style={{
              color: i < filledBlocks ? 'var(--theme-primary)' : 'var(--theme-foreground-tertiary)',
            }}
          >
            {i < filledBlocks ? '\u25A0' : '\u2591'}
          </span>
        ))}
        <span style={{ color: 'var(--theme-foreground-tertiary)' }} className="text-[11px] tracking-wider">
          {'] '}
        </span>
        <span style={{ color: 'var(--theme-foreground)' }} className="text-[11px] uppercase tracking-wider">
          STEP {stepIndex + 1}/{totalSteps}
        </span>
        <span style={{ color: 'var(--theme-foreground-tertiary)' }} className="text-[11px]">
          {' \u2014 '}
        </span>
        <span style={{ color: 'var(--theme-primary)' }} className="text-[11px] uppercase tracking-wider">
          {stepLabel}
        </span>
      </div>
    </m.div>
  )
}

// ── Sub-components ──

interface ThemeStepProps {
  direction: number
  showSkipConfirm: boolean
  themeName: string
  themeDescription: string
  onThemeComplete: () => void
  onSkipWithConfirmation: () => void
}

function ThemeStep({ direction, showSkipConfirm, themeName, themeDescription, onThemeComplete, onSkipWithConfirmation }: ThemeStepProps) {
  return (
    <m.div
      key="theme-step"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="space-y-[12px]"
    >
      {/* Theme Selection Header */}
      <div
        className="p-[10px] border-2"
        style={{
          backgroundColor: 'var(--theme-background-secondary)',
          borderColor: 'var(--theme-info)'
        }}
      >
        <div className="flex items-start gap-[6px]">
          <HiOutlineColorSwatch
            className="w-4 h-4 flex-shrink-0"
            style={{ color: 'var(--theme-info)' }}
          />
          <div>
            <h3
              className="text-[13px] font-mono uppercase mb-[4px] tracking-wider"
              style={{ color: 'var(--theme-foreground)' }}
            >
              {'>'} SELECT VISUAL PROFILE
            </h3>
            <p
              className="text-[11px] font-mono"
              style={{ color: 'var(--theme-foreground-secondary)' }}
            >
              Personalize your command center appearance
            </p>
          </div>
        </div>
      </div>

      {/* Theme Switcher */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="py-[12px]"
      >
        <ThemeSwitcher size="xl" variant="grid" showLabel={true} />
      </m.div>

      {/* Current Theme Info */}
      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.3 }}
        className="p-[10px] border-2"
        style={{
          backgroundColor: 'var(--theme-background-tertiary)',
          borderColor: 'var(--theme-border)'
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p
              className="text-[10px] font-mono uppercase mb-[4px] tracking-wider"
              style={{ color: 'var(--theme-foreground-secondary)' }}
            >
              ACTIVE_THEME:
            </p>
            <h4
              className="text-[13px] font-mono uppercase tracking-wider"
              style={{ color: 'var(--theme-primary)' }}
            >
              {themeName}
            </h4>
            <p
              className="text-[11px] font-mono mt-[4px]"
              style={{ color: 'var(--theme-foreground-secondary)' }}
            >
              {themeDescription}
            </p>
          </div>
        </div>
      </m.div>

      {/* Tips */}
      <div className="space-y-[6px]">
        <p
          className="text-[11px] font-mono flex items-center gap-[8px] tracking-wider"
          style={{ color: 'var(--theme-foreground-secondary)' }}
        >
          <span style={{ color: 'var(--theme-foreground-tertiary)' }}>#</span>
          Ctrl+Shift+T to cycle themes
        </p>
        <p
          className="text-[11px] font-mono flex items-center gap-[8px] tracking-wider"
          style={{ color: 'var(--theme-foreground-secondary)' }}
        >
          <span style={{ color: 'var(--theme-foreground-tertiary)' }}>#</span>
          Type &apos;theme&apos; in terminal to change anytime
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-[8px]">
        <m.button
          whileHover={{ y: -1 }}
          whileTap={{ y: 1 }}
          onClick={onSkipWithConfirmation}
          className="px-[12px] py-[8px] border-2 font-mono text-[11px] uppercase tracking-wider"
          style={{
            borderRadius: '8px',
            backgroundColor: showSkipConfirm ? 'var(--theme-warning)' : 'var(--theme-background)',
            borderColor: 'var(--theme-border)',
            color: showSkipConfirm ? 'var(--theme-background)' : 'var(--theme-foreground-tertiary)'
          }}
        >
          {showSkipConfirm ? 'CONFIRM_SKIP?' : 'SKIP --force'}
        </m.button>
        <m.button
          whileHover={{ y: -2, boxShadow: '6px 6px 0 var(--theme-shadow)' }}
          whileTap={{ y: 0, boxShadow: '2px 2px 0 var(--theme-shadow)' }}
          onClick={onThemeComplete}
          className="px-[16px] py-[8px] border-2 font-mono text-[12px] uppercase tracking-wider flex items-center gap-[6px]"
          style={{
            borderRadius: '8px',
            backgroundColor: 'var(--theme-primary)',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-background)',
            boxShadow: '4px 4px 0 var(--theme-shadow)'
          }}
        >
          NEXT --step ai
          <HiOutlineArrowRight className="w-4 h-4" />
        </m.button>
      </div>
    </m.div>
  )
}

interface AIStepProps {
  direction: number
  aiSetupChoice: 'free' | 'byok' | 'skip' | ''
  apiKey: string
  isValidating: boolean
  dispatch: React.Dispatch<OnboardingAction>
  onBack: () => void
  onAIComplete: () => void
}

function AIStep({ direction, aiSetupChoice, apiKey, isValidating, dispatch, onBack, onAIComplete }: AIStepProps) {
  return (
    <m.div
      key="ai-step"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="space-y-[12px]"
    >
      {/* AI Setup Header */}
      <div
        className="p-[10px] border-2"
        style={{
          backgroundColor: 'var(--theme-background-secondary)',
          borderColor: 'var(--theme-info)'
        }}
      >
        <div className="flex items-start gap-[6px]">
          <HiOutlineSparkles
            className="w-4 h-4 flex-shrink-0"
            style={{ color: 'var(--theme-info)' }}
          />
          <div>
            <h3
              className="text-[13px] font-mono uppercase mb-[4px] tracking-wider"
              style={{ color: 'var(--theme-foreground)' }}
            >
              {'>'} AI CAPABILITIES DETECTED
            </h3>
            <p
              className="text-[11px] font-mono"
              style={{ color: 'var(--theme-foreground-secondary)' }}
            >
              Task generation, code reviews, meeting summaries, and more.
              Select a configuration mode:
            </p>
          </div>
        </div>
      </div>

      {/* Option Cards */}
      <m.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="space-y-[10px]"
      >
        {/* Option 1: Free Credits */}
        <m.button
          variants={staggerItem}
          whileHover={{
            y: -2,
            boxShadow: '4px 4px 0 var(--theme-shadow)',
            transition: { duration: 0.15 },
          }}
          whileTap={{ y: 0, boxShadow: 'none' }}
          onClick={() => dispatch({ type: 'SET_AI_SETUP_CHOICE', value: 'free' })}
          className="w-full p-[16px] border-2 text-left transition-colors"
          style={{
            borderRadius: '0px',
            backgroundColor: aiSetupChoice === 'free'
              ? 'var(--theme-background-secondary)'
              : 'var(--theme-background)',
            borderColor: aiSetupChoice === 'free'
              ? 'var(--theme-primary)'
              : 'var(--theme-border)',
            color: 'var(--theme-foreground)',
            boxShadow: aiSetupChoice === 'free'
              ? '4px 4px 0 var(--theme-shadow), inset 0 0 12px rgba(99, 102, 241, 0.08)'
              : 'none'
          }}
        >
          <div className="flex items-start gap-[8px]">
            <HiOutlineCreditCard
              className="w-4 h-4 flex-shrink-0 mt-[2px]"
              style={{ color: aiSetupChoice === 'free' ? 'var(--theme-primary)' : 'var(--theme-foreground-secondary)' }}
            />
            <div className="flex-1">
              <div className="flex items-center gap-[8px] mb-[6px]">
                <h3 className="text-[12px] font-mono uppercase tracking-wider"
                  style={{ color: aiSetupChoice === 'free' ? 'var(--theme-primary)' : 'var(--theme-foreground)' }}
                >
                  FREE_TIER
                </h3>
                {aiSetupChoice === 'free' && (
                  <m.span
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-4 h-4 border-2 flex items-center justify-center"
                    style={{
                      borderColor: 'var(--theme-primary)',
                      backgroundColor: 'var(--theme-primary)',
                    }}
                  >
                    <HiOutlineCheck className="w-3 h-3" style={{ color: 'var(--theme-background)' }} />
                  </m.span>
                )}
              </div>
              <p className="text-[11px] font-mono mb-[6px]"
                style={{ color: 'var(--theme-foreground-secondary)' }}
              >
                100 free AI credits/month. Perfect for exploration.
              </p>
              <div className="text-[10px] font-mono space-y-[2px]"
                style={{ color: 'var(--theme-foreground-tertiary)' }}
              >
                <p>- ~50 task generations or code reviews</p>
                <p>- Rate limited: 10 req/hour</p>
                <p>- Upgrade anytime</p>
              </div>
            </div>
          </div>
        </m.button>

        {/* Option 2: BYOK */}
        <m.button
          variants={staggerItem}
          whileHover={{
            y: -2,
            boxShadow: '4px 4px 0 var(--theme-shadow)',
            transition: { duration: 0.15 },
          }}
          whileTap={{ y: 0, boxShadow: 'none' }}
          onClick={() => dispatch({ type: 'SET_AI_SETUP_CHOICE', value: 'byok' })}
          className="w-full p-[16px] border-2 text-left transition-colors"
          style={{
            borderRadius: '0px',
            backgroundColor: aiSetupChoice === 'byok'
              ? 'var(--theme-background-secondary)'
              : 'var(--theme-background)',
            borderColor: aiSetupChoice === 'byok'
              ? 'var(--theme-primary)'
              : 'var(--theme-border)',
            color: 'var(--theme-foreground)',
            boxShadow: aiSetupChoice === 'byok'
              ? '4px 4px 0 var(--theme-shadow), inset 0 0 12px rgba(99, 102, 241, 0.08)'
              : 'none'
          }}
        >
          <div className="flex items-start gap-[8px]">
            <HiOutlineKey
              className="w-4 h-4 flex-shrink-0 mt-[2px]"
              style={{ color: aiSetupChoice === 'byok' ? 'var(--theme-primary)' : 'var(--theme-foreground-secondary)' }}
            />
            <div className="flex-1">
              <div className="flex items-center gap-[8px] mb-[6px]">
                <h3 className="text-[12px] font-mono uppercase tracking-wider"
                  style={{ color: aiSetupChoice === 'byok' ? 'var(--theme-primary)' : 'var(--theme-foreground)' }}
                >
                  BYOK_MODE
                </h3>
                {aiSetupChoice === 'byok' && (
                  <m.span
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-4 h-4 border-2 flex items-center justify-center"
                    style={{
                      borderColor: 'var(--theme-primary)',
                      backgroundColor: 'var(--theme-primary)',
                    }}
                  >
                    <HiOutlineCheck className="w-3 h-3" style={{ color: 'var(--theme-background)' }} />
                  </m.span>
                )}
              </div>
              <p className="text-[11px] font-mono mb-[6px]"
                style={{ color: 'var(--theme-foreground-secondary)' }}
              >
                Bring your own Google Gemini key. Unlimited usage.
              </p>
              <div className="text-[10px] font-mono space-y-[2px]"
                style={{ color: 'var(--theme-foreground-tertiary)' }}
              >
                <p>- No credit limits</p>
                <p>- No rate limiting from LTF1</p>
                <p>- Encrypted & secure storage</p>
              </div>
            </div>
          </div>
        </m.button>

        {/* API Key Input (shown when BYOK is selected) */}
        <AnimatePresence>
          {aiSetupChoice === 'byok' && (
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-[6px] overflow-hidden"
            >
              <label
                htmlFor="onboarding-gemini-key"
                className="block text-[11px] font-mono uppercase tracking-wider"
                style={{ color: 'var(--theme-foreground)' }}
              >
                $ ENTER GEMINI_API_KEY:
              </label>
              <input
                id="onboarding-gemini-key"
                type="password"
                value={apiKey}
                onChange={(e) => dispatch({ type: 'SET_API_KEY', value: e.target.value })}
                placeholder="AIza..."
                className="w-full px-[10px] py-[8px] border-2 font-mono text-[12px] tracking-wider"
                style={{
                  borderRadius: '0px',
                  backgroundColor: 'var(--theme-background)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-foreground)'
                }}
              />
              <div className="flex items-start gap-[8px]">
                <HiOutlineInformationCircle
                  className="w-4 h-4 flex-shrink-0 mt-[1px]"
                  style={{ color: 'var(--theme-info)' }}
                />
                <p
                  className="text-[10px] font-mono tracking-wider"
                  style={{ color: 'var(--theme-foreground-secondary)' }}
                >
                  Get your key from{' '}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                    style={{ color: 'var(--theme-info)' }}
                  >
                    Google AI Studio
                  </a>
                  . Encrypted on save.
                </p>
              </div>
            </m.div>
          )}
        </AnimatePresence>

        {/* Option 3: Skip */}
        <m.button
          variants={staggerItem}
          whileHover={{ y: -1 }}
          whileTap={{ y: 0 }}
          onClick={() => dispatch({ type: 'SET_AI_SETUP_CHOICE', value: 'skip' })}
          className="w-full p-[10px] border-2 text-center transition-colors"
          style={{
            borderRadius: '0px',
            backgroundColor: 'var(--theme-background)',
            borderColor: aiSetupChoice === 'skip'
              ? 'var(--theme-foreground-tertiary)'
              : 'var(--theme-border)',
            color: 'var(--theme-foreground-tertiary)',
            boxShadow: aiSetupChoice === 'skip'
              ? '4px 4px 0 var(--theme-shadow)'
              : 'none'
          }}
        >
          <p className="text-[11px] font-mono uppercase tracking-wider">
            SKIP --configure-later
          </p>
        </m.button>
      </m.div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-[8px]">
        <m.button
          whileHover={{ y: -1 }}
          whileTap={{ y: 1 }}
          onClick={onBack}
          className="px-[12px] py-[8px] border-2 font-mono text-[11px] uppercase tracking-wider flex items-center gap-[6px]"
          style={{
            borderRadius: '8px',
            backgroundColor: 'var(--theme-background)',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-foreground)'
          }}
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
          BACK
        </m.button>
        <m.button
          whileHover={aiSetupChoice ? { y: -2, boxShadow: '6px 6px 0 var(--theme-shadow)' } : {}}
          whileTap={aiSetupChoice ? { y: 0, boxShadow: '2px 2px 0 var(--theme-shadow)' } : {}}
          onClick={onAIComplete}
          disabled={!aiSetupChoice || (aiSetupChoice === 'byok' && !apiKey) || isValidating}
          className="px-[16px] py-[8px] border-2 font-mono text-[12px] uppercase tracking-wider disabled:opacity-50"
          style={{
            borderRadius: '8px',
            backgroundColor: aiSetupChoice ? 'var(--theme-success)' : 'var(--theme-background-secondary)',
            borderColor: 'var(--theme-border)',
            color: aiSetupChoice ? 'var(--theme-background)' : 'var(--theme-foreground-tertiary)',
            boxShadow: aiSetupChoice ? '4px 4px 0 var(--theme-shadow)' : 'none'
          }}
        >
          {isValidating ? 'VALIDATING...' :
           aiSetupChoice === 'skip' ? 'SKIP AI_MODULE' :
           aiSetupChoice === 'byok' ? 'VALIDATE --save' :
           aiSetupChoice === 'free' ? 'ACTIVATE FREE_TIER' :
           'SELECT_OPTION'}
        </m.button>
      </div>
    </m.div>
  )
}

type OnboardingState = {
  currentStep: OnboardingStep
  showSkipConfirm: boolean
  direction: number
  aiSetupChoice: 'free' | 'byok' | 'skip' | ''
  apiKey: string
  isValidating: boolean
  bootComplete: Array<number>
  allSystemsGo: boolean
}

const initialOnboardingState: OnboardingState = {
  currentStep: 'theme',
  showSkipConfirm: false,
  direction: 1,
  aiSetupChoice: '',
  apiKey: '',
  isValidating: false,
  bootComplete: [],
  allSystemsGo: false,
}

type OnboardingAction =
  | { type: 'SET_STEP'; step: OnboardingStep; direction: number }
  | { type: 'SET_SHOW_SKIP_CONFIRM'; value: boolean }
  | { type: 'SET_AI_SETUP_CHOICE'; value: 'free' | 'byok' | 'skip' | '' }
  | { type: 'SET_API_KEY'; value: string }
  | { type: 'SET_IS_VALIDATING'; value: boolean }
  | { type: 'ADD_BOOT_COMPLETE'; index: number }
  | { type: 'SET_ALL_SYSTEMS_GO'; value: boolean }
  | { type: 'RESET_BOOT' }

function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.step, direction: action.direction }
    case 'SET_SHOW_SKIP_CONFIRM':
      return { ...state, showSkipConfirm: action.value }
    case 'SET_AI_SETUP_CHOICE':
      return { ...state, aiSetupChoice: action.value }
    case 'SET_API_KEY':
      return { ...state, apiKey: action.value }
    case 'SET_IS_VALIDATING':
      return { ...state, isValidating: action.value }
    case 'ADD_BOOT_COMPLETE':
      return { ...state, bootComplete: [...state.bootComplete, action.index] }
    case 'SET_ALL_SYSTEMS_GO':
      return { ...state, allSystemsGo: action.value }
    case 'RESET_BOOT':
      return { ...state, bootComplete: [], allSystemsGo: false }
    default:
      return state
  }
}

interface CompletionScreenProps {
  isOpen: boolean
  onComplete: () => void
  bootComplete: Array<number>
  allSystemsGo: boolean
}

function CompletionScreen({ isOpen, onComplete, bootComplete, allSystemsGo }: CompletionScreenProps) {
  return (
    <BrutalModal
      isOpen={isOpen}
      onClose={onComplete}
      title="> SYSTEM_BOOT"
      size="sm"
      showCloseButton={true}
    >
      <div className="py-[16px] font-mono">
        <m.div
          className="space-y-[10px]"
          initial="hidden"
          animate="show"
          variants={staggerContainer}
        >
          {bootLines.map((line, index) => (
            <m.div
              key={line.label}
              variants={staggerItem}
              className="flex items-center gap-[8px] text-[12px] tracking-wider"
            >
              <span style={{ color: 'var(--theme-foreground-tertiary)' }}>{'>'}</span>
              <span
                style={{ color: 'var(--theme-foreground)' }}
                className="uppercase"
              >
                {line.label}
              </span>
              <span
                className="flex-1 overflow-hidden"
                style={{ color: 'var(--theme-foreground-tertiary)' }}
              >
                {'................'.slice(0, 16 - line.label.length + 16)}
              </span>
              <AnimatePresence>
                {bootComplete.includes(index) ? (
                  <m.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    style={{ color: 'var(--theme-success)' }}
                    className="font-bold"
                  >
                    [OK]
                  </m.span>
                ) : (
                  <m.span
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    style={{ color: 'var(--theme-foreground-tertiary)' }}
                  >
                    [..]
                  </m.span>
                )}
              </AnimatePresence>
            </m.div>
          ))}

          <AnimatePresence>
            {allSystemsGo && (
              <m.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="pt-[12px] border-t-2"
                style={{ borderColor: 'var(--theme-success)' }}
              >
                <div className="flex items-center gap-[8px]">
                  <m.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    className="w-5 h-5 border-2 flex items-center justify-center"
                    style={{
                      borderColor: 'var(--theme-success)',
                      backgroundColor: 'var(--theme-success)',
                    }}
                  >
                    <HiOutlineCheck
                      className="w-3 h-3"
                      style={{ color: 'var(--theme-background)' }}
                    />
                  </m.div>
                  <span
                    className="text-[13px] uppercase tracking-widest font-bold"
                    style={{ color: 'var(--theme-success)' }}
                  >
                    ALL_SYSTEMS_NOMINAL
                  </span>
                </div>
                <p
                  className="text-[11px] mt-[8px] tracking-wider"
                  style={{ color: 'var(--theme-foreground-secondary)' }}
                >
                  {'>'} Launching command center...
                </p>
              </m.div>
            )}
          </AnimatePresence>
        </m.div>
      </div>
    </BrutalModal>
  )
}

export default function OnboardingFlow({ isOpen, onComplete }: OnboardingFlowProps) {
  const [state, dispatch] = useReducer(onboardingReducer, initialOnboardingState)
  const { currentStep, showSkipConfirm, direction, aiSetupChoice, apiKey, isValidating, bootComplete, allSystemsGo } = state
  const { themeName, themeDescription } = useTheme()

  const setupAICredits = useMutation(api.aiCredits.mutations.setupUserAI)
  const validateApiKey = useAction(api.aiCredits.actions.validateApiKey)
  const saveApiKey = useMutation(api.aiCredits.mutations.saveApiKey)

  const handleThemeComplete = () => {
    dispatch({ type: 'SET_STEP', step: 'ai', direction: 1 })
  }

  const handleBack = () => {
    if (currentStep === 'ai') {
      dispatch({ type: 'SET_STEP', step: 'theme', direction: -1 })
      dispatch({ type: 'SET_AI_SETUP_CHOICE', value: '' })
    }
  }

  const handleAIComplete = async () => {
    if (aiSetupChoice === 'skip') {
      posthog.capture('onboarding_completed', { ai_setup: 'skipped', theme: themeName })
      dispatch({ type: 'SET_STEP', step: 'complete', direction: 1 })
      return
    }

    if (aiSetupChoice === 'byok' && !apiKey) {
      toast.error('Please enter your Gemini API key')
      return
    }

    dispatch({ type: 'SET_IS_VALIDATING', value: true })
    try {
      if (aiSetupChoice === 'byok') {
        const validationResult = await validateApiKey({ apiKey })
        if (!validationResult.isValid) {
          toast.error(validationResult.error || 'Invalid API key')
          dispatch({ type: 'SET_IS_VALIDATING', value: false })
          return
        }

        await saveApiKey({ apiKey })
        toast.success('API key validated and saved successfully!')
      } else if (aiSetupChoice === 'free') {
        await setupAICredits({
          tier: 'free',
          setupType: 'free_credits'
        })
        toast.success('Free AI credits activated! You have 100 credits to start.')
      }

      posthog.capture('onboarding_completed', { ai_setup: aiSetupChoice, theme: themeName })
      dispatch({ type: 'SET_STEP', step: 'complete', direction: 1 })
    } catch (error) {
      toast.error('Setup failed. Please try again.')
      console.error(error)
    } finally {
      dispatch({ type: 'SET_IS_VALIDATING', value: false })
    }
  }

  const handleSkipOnboarding = () => {
    onComplete()
  }

  const handleSkipWithConfirmation = () => {
    if (showSkipConfirm) {
      onComplete()
    } else {
      dispatch({ type: 'SET_SHOW_SKIP_CONFIRM', value: true })
      setTimeout(() => dispatch({ type: 'SET_SHOW_SKIP_CONFIRM', value: false }), 3000)
    }
  }

  // Already uses useReducer dispatch; multiple dispatches are for sequential animation timers
  useEffect(() => {
    if (currentStep !== 'complete') {
      dispatch({ type: 'RESET_BOOT' })
      return
    }

    const timers: Array<ReturnType<typeof setTimeout>> = []

    bootLines.forEach((line, index) => {
      const timer = setTimeout(() => {
        dispatch({ type: 'ADD_BOOT_COMPLETE', index })
      }, line.delay * 1000 + 600)
      timers.push(timer)
    })

    const finalTimer = setTimeout(() => {
      dispatch({ type: 'SET_ALL_SYSTEMS_GO', value: true })
    }, (bootLines[bootLines.length - 1].delay + 0.6) * 1000 + 600)
    timers.push(finalTimer)

    const completeTimer = setTimeout(() => {
      onComplete()
    }, (bootLines[bootLines.length - 1].delay + 0.6) * 1000 + 1800)
    timers.push(completeTimer)

    return () => timers.forEach(clearTimeout)
  }, [currentStep, onComplete])

  const stepIndex = currentStep === 'theme' ? 0 : currentStep === 'ai' ? 1 : 2
  const stepLabel = currentStep === 'theme' ? 'THEME_CONFIG' : currentStep === 'ai' ? 'AI_MODULE' : 'COMPLETE'
  const totalSteps = 2
  const filledBlocks = Math.round((Math.min(stepIndex + 1, totalSteps) / totalSteps) * 20)

  // Completion screen
  if (currentStep === 'complete') {
    return (
      <CompletionScreen
        isOpen={isOpen}
        onComplete={onComplete}
        bootComplete={bootComplete}
        allSystemsGo={allSystemsGo}
      />
    )
  }

  return (
    <BrutalModal
      isOpen={isOpen}
      onClose={handleSkipOnboarding}
      title={currentStep === 'theme' ? '> INITIALIZING THEME ENGINE...' : '$ CONFIGURE AI_MODULE'}
      size="lg"
      showCloseButton={true}
    >
      <div className="space-y-[12px]">
        {/* Terminal Progress Bar */}
        <TerminalProgress filledBlocks={filledBlocks} stepIndex={stepIndex} totalSteps={totalSteps} stepLabel={stepLabel} />

        <AnimatePresence mode="wait" custom={direction}>
          {currentStep === 'theme' && (
            <ThemeStep
              direction={direction}
              showSkipConfirm={showSkipConfirm}
              themeName={themeName}
              themeDescription={themeDescription}
              onThemeComplete={handleThemeComplete}
              onSkipWithConfirmation={handleSkipWithConfirmation}
            />
          )}

          {currentStep === 'ai' && (
            <AIStep
              direction={direction}
              aiSetupChoice={aiSetupChoice}
              apiKey={apiKey}
              isValidating={isValidating}
              dispatch={dispatch}
              onBack={handleBack}
              onAIComplete={handleAIComplete}
            />
          )}
        </AnimatePresence>
      </div>
    </BrutalModal>
  )
}