import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

export default function OnboardingFlow({ isOpen, onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('theme')
  const [showSkipConfirm, setShowSkipConfirm] = useState(false)
  const { themeName, themeDescription } = useTheme()
  const [direction, setDirection] = useState(1)

  // AI Setup state
  const [aiSetupChoice, setAiSetupChoice] = useState<'free' | 'byok' | 'skip' | ''>('')
  const [apiKey, setApiKey] = useState('')
  const [isValidating, setIsValidating] = useState(false)

  // Boot sequence state
  const [bootComplete, setBootComplete] = useState<Array<number>>([])
  const [allSystemsGo, setAllSystemsGo] = useState(false)

  const setupAICredits = useMutation(api.aiCredits.mutations.setupUserAI)
  const validateApiKey = useAction(api.aiCredits.actions.validateApiKey)
  const saveApiKey = useMutation(api.aiCredits.mutations.saveApiKey)

  const handleThemeComplete = () => {
    setDirection(1)
    setCurrentStep('ai')
  }

  const handleBack = () => {
    if (currentStep === 'ai') {
      setDirection(-1)
      setCurrentStep('theme')
      setAiSetupChoice('')
    }
  }

  const handleAIComplete = async () => {
    if (aiSetupChoice === 'skip') {
      posthog.capture('onboarding_completed', { ai_setup: 'skipped', theme: themeName })
      setDirection(1)
      setCurrentStep('complete')
      return
    }

    if (aiSetupChoice === 'byok' && !apiKey) {
      toast.error('Please enter your Gemini API key')
      return
    }

    setIsValidating(true)
    try {
      if (aiSetupChoice === 'byok') {
        const validationResult = await validateApiKey({ apiKey })
        if (!validationResult.isValid) {
          toast.error(validationResult.error || 'Invalid API key')
          setIsValidating(false)
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
      setDirection(1)
      setCurrentStep('complete')
    } catch (error) {
      toast.error('Setup failed. Please try again.')
      console.error(error)
    } finally {
      setIsValidating(false)
    }
  }

  const handleSkipOnboarding = () => {
    onComplete()
  }

  const handleSkipWithConfirmation = () => {
    if (showSkipConfirm) {
      onComplete()
    } else {
      setShowSkipConfirm(true)
      setTimeout(() => setShowSkipConfirm(false), 3000)
    }
  }

  // Boot sequence effect for completion screen
  useEffect(() => {
    if (currentStep !== 'complete') {
      setBootComplete([])
      setAllSystemsGo(false)
      return
    }

    const timers: Array<ReturnType<typeof setTimeout>> = []

    bootLines.forEach((line, index) => {
      const timer = setTimeout(() => {
        setBootComplete(prev => [...prev, index])
      }, line.delay * 1000 + 600)
      timers.push(timer)
    })

    const finalTimer = setTimeout(() => {
      setAllSystemsGo(true)
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

  // Terminal-style progress bar
  const TerminalProgress = () => (
    <motion.div
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
            key={i}
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
    </motion.div>
  )

  // Completion screen
  if (currentStep === 'complete') {
    return (
      <BrutalModal
        isOpen={isOpen}
        onClose={onComplete}
        title="> SYSTEM_BOOT"
        size="sm"
        showCloseButton={true}
      >
        <div className="py-[16px] font-mono">
          <motion.div
            className="space-y-[10px]"
            initial="hidden"
            animate="show"
            variants={staggerContainer}
          >
            {bootLines.map((line, index) => (
              <motion.div
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
                    <motion.span
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      style={{ color: 'var(--theme-success)' }}
                      className="font-bold"
                    >
                      [OK]
                    </motion.span>
                  ) : (
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      style={{ color: 'var(--theme-foreground-tertiary)' }}
                    >
                      [..]
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}

            <AnimatePresence>
              {allSystemsGo && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="pt-[12px] border-t-2"
                  style={{ borderColor: 'var(--theme-success)' }}
                >
                  <div className="flex items-center gap-[8px]">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
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
                    </motion.div>
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
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </BrutalModal>
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
        <TerminalProgress />

        <AnimatePresence mode="wait" custom={direction}>
          {/* Theme Selection Step */}
          {currentStep === 'theme' && (
            <motion.div
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
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                className="py-[12px]"
              >
                <ThemeSwitcher size="xl" variant="grid" showLabel={true} />
              </motion.div>

              {/* Current Theme Info */}
              <motion.div
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
              </motion.div>

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
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ y: 1 }}
                  onClick={handleSkipWithConfirmation}
                  className="px-[12px] py-[8px] border-2 font-mono text-[11px] uppercase tracking-wider"
                  style={{
                    borderRadius: '8px',
                    backgroundColor: showSkipConfirm ? 'var(--theme-warning)' : 'var(--theme-background)',
                    borderColor: 'var(--theme-border)',
                    color: showSkipConfirm ? 'var(--theme-background)' : 'var(--theme-foreground-tertiary)'
                  }}
                >
                  {showSkipConfirm ? 'CONFIRM_SKIP?' : 'SKIP --force'}
                </motion.button>
                <motion.button
                  whileHover={{ y: -2, boxShadow: '6px 6px 0 var(--theme-shadow)' }}
                  whileTap={{ y: 0, boxShadow: '2px 2px 0 var(--theme-shadow)' }}
                  onClick={handleThemeComplete}
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
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* AI Setup Step */}
          {currentStep === 'ai' && (
            <motion.div
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
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="space-y-[10px]"
              >
                {/* Option 1: Free Credits */}
                <motion.button
                  variants={staggerItem}
                  whileHover={{
                    y: -2,
                    boxShadow: '4px 4px 0 var(--theme-shadow)',
                    transition: { duration: 0.15 },
                  }}
                  whileTap={{ y: 0, boxShadow: 'none' }}
                  onClick={() => setAiSetupChoice('free')}
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
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-4 h-4 border-2 flex items-center justify-center"
                            style={{
                              borderColor: 'var(--theme-primary)',
                              backgroundColor: 'var(--theme-primary)',
                            }}
                          >
                            <HiOutlineCheck className="w-3 h-3" style={{ color: 'var(--theme-background)' }} />
                          </motion.span>
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
                </motion.button>

                {/* Option 2: BYOK */}
                <motion.button
                  variants={staggerItem}
                  whileHover={{
                    y: -2,
                    boxShadow: '4px 4px 0 var(--theme-shadow)',
                    transition: { duration: 0.15 },
                  }}
                  whileTap={{ y: 0, boxShadow: 'none' }}
                  onClick={() => setAiSetupChoice('byok')}
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
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-4 h-4 border-2 flex items-center justify-center"
                            style={{
                              borderColor: 'var(--theme-primary)',
                              backgroundColor: 'var(--theme-primary)',
                            }}
                          >
                            <HiOutlineCheck className="w-3 h-3" style={{ color: 'var(--theme-background)' }} />
                          </motion.span>
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
                </motion.button>

                {/* API Key Input (shown when BYOK is selected) */}
                <AnimatePresence>
                  {aiSetupChoice === 'byok' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-[6px] overflow-hidden"
                    >
                      <label
                        className="block text-[11px] font-mono uppercase tracking-wider"
                        style={{ color: 'var(--theme-foreground)' }}
                      >
                        $ ENTER GEMINI_API_KEY:
                      </label>
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
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
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Option 3: Skip */}
                <motion.button
                  variants={staggerItem}
                  whileHover={{ y: -1 }}
                  whileTap={{ y: 0 }}
                  onClick={() => setAiSetupChoice('skip')}
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
                </motion.button>
              </motion.div>

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-[8px]">
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ y: 1 }}
                  onClick={handleBack}
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
                </motion.button>
                <motion.button
                  whileHover={aiSetupChoice ? { y: -2, boxShadow: '6px 6px 0 var(--theme-shadow)' } : {}}
                  whileTap={aiSetupChoice ? { y: 0, boxShadow: '2px 2px 0 var(--theme-shadow)' } : {}}
                  onClick={handleAIComplete}
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
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BrutalModal>
  )
}
