import { useReducer, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { m, AnimatePresence } from 'framer-motion'
import BrutalModal from '@/components/ui/BrutalModal'
import ThemeSwitcher from '@/components/theme/ThemeSwitcher'
import { useTheme } from '@/contexts/ThemeContext'
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
  HiOutlineKey,
  HiOutlineCreditCard,
  HiOutlineInformationCircle,
  HiOutlineDownload,
  HiOutlinePlay,
  HiOutlineRefresh,
  HiOutlineLightningBolt,
  HiOutlineUserGroup,
  HiOutlineChartBar,
} from 'react-icons/hi'

interface OnboardingFlowProps {
  isOpen: boolean
  onComplete: () => void
}

type OnboardingStep =
  | 'aha'
  | 'intent'
  | 'team'
  | 'projection'
  | 'ai'
  | 'import'
  | 'theme'
  | 'complete'

type ImportChoice = 'linear' | 'jira' | 'skip' | ''
type AISetupChoice = 'free' | 'byok' | 'skip' | ''
type TeamSize = 'solo' | 'small' | 'medium' | 'large' | ''

const STEP_ORDER: Array<Exclude<OnboardingStep, 'complete'>> = [
  'aha',
  'intent',
  'team',
  'projection',
  'ai',
  'import',
  'theme',
]

const STEP_LABELS: Record<OnboardingStep, string> = {
  aha: 'DEMO',
  intent: 'GOALS',
  team: 'TEAM_SIZE',
  projection: 'PROJECTION',
  ai: 'AI_MODULE',
  import: 'MIGRATION',
  theme: 'APPEARANCE',
  complete: 'COMPLETE',
}

const STEP_TITLES: Record<OnboardingStep, string> = {
  aha: '> WATCH IT WORK --auto-play',
  intent: '$ WHAT BRINGS YOU HERE?',
  team: '$ TEAM SIZE --single-select',
  projection: '> PROJECTION --based-on-input',
  ai: '$ CONFIGURE AI_MODULE',
  import: '> MIGRATE --optional',
  theme: '> APPEARANCE --optional',
  complete: '> SYSTEM_BOOT',
}

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -80 : 80, opacity: 0 }),
}

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

// ─────────── Intent catalog ───────────
interface Intent {
  id: string
  label: string
  sub: string
}

const INTENTS: Array<Intent> = [
  { id: 'migrate_linear', label: 'MOVE_OFF_LINEAR', sub: 'I have issues stuck in Linear' },
  { id: 'migrate_jira', label: 'MOVE_OFF_JIRA', sub: 'I have issues stuck in Jira' },
  { id: 'auto_triage', label: 'AUTO_TRIAGE', sub: 'Stop hand-sorting bugs' },
  { id: 'sprint_plan', label: 'SPRINT_PLAN', sub: 'Cut planning overhead' },
  { id: 'code_review', label: 'AI_CODE_REVIEW', sub: 'Review PRs for me' },
  { id: 'git_auto_link', label: 'GIT_AUTO_LINK', sub: 'Close tickets on push' },
  { id: 'agent_work', label: 'AGENT_TO_PM', sub: 'Wire AI agents into tracker' },
  { id: 'just_explore', label: 'JUST_EXPLORE', sub: 'Tire-kicking for now' },
]

// ─────────── Team sizes ───────────
interface TeamOption {
  id: TeamSize
  label: string
  sub: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
}

const TEAM_OPTIONS: Array<TeamOption> = [
  { id: 'solo', label: 'SOLO', sub: 'Just me', icon: HiOutlineUserGroup },
  { id: 'small', label: 'SMALL', sub: '2–5 devs', icon: HiOutlineUserGroup },
  { id: 'medium', label: 'MEDIUM', sub: '6–20 devs', icon: HiOutlineUserGroup },
  { id: 'large', label: 'LARGE', sub: '20+ devs', icon: HiOutlineUserGroup },
]

// ─────────── Aha animation ───────────
const AHA_COMMANDS: Array<{ text: string; pause: number }> = [
  { text: '$ git commit -m "fix: null pointer in auth"', pause: 380 },
  { text: '$ git push origin feature/LTF-142', pause: 600 },
]

const AHA_ENGINE: Array<{ tag: string; text: string; color?: string }> = [
  { tag: 'DETECT', text: 'push received · 1 commit' },
  { tag: 'PARSE', text: 'commit: "fix: null pointer in auth"' },
  { tag: 'LINK', text: 'commit → LTF-142' },
  { tag: 'STATUS', text: 'LTF-142: TODO → IN-REVIEW' },
  { tag: 'MERGE', text: 'PR #87 merged to main' },
  { tag: 'STATUS', text: 'LTF-142: IN-REVIEW → DONE', color: 'success' },
  { tag: 'VELOCITY', text: '+3 pts · sprint-23: 34.7' },
]

const CHAR_SPEED = 28
const ENGINE_SPEED = 280

// ─────────── Completion boot ───────────
const bootLines = [
  { label: 'PREFERENCES', delay: 0 },
  { label: 'AI_MODULE', delay: 0.35 },
  { label: 'WORKSPACE_INIT', delay: 0.7 },
]

function scheduleBootTimers(
  dispatch: (a: { type: 'ADD_BOOT_COMPLETE'; index: number } | { type: 'SET_ALL_SYSTEMS_GO'; value: boolean }) => void,
  onComplete: () => void
): Array<ReturnType<typeof setTimeout>> {
  const timers: Array<ReturnType<typeof setTimeout>> = []
  bootLines.forEach((line, index) => {
    timers.push(setTimeout(() => dispatch({ type: 'ADD_BOOT_COMPLETE', index }), line.delay * 1000 + 500))
  })
  timers.push(setTimeout(() => dispatch({ type: 'SET_ALL_SYSTEMS_GO', value: true }), (bootLines[bootLines.length - 1].delay + 0.5) * 1000 + 500))
  timers.push(setTimeout(onComplete, (bootLines[bootLines.length - 1].delay + 0.5) * 1000 + 1900))
  return timers
}

// ─────────── Progress bar ───────────
interface TerminalProgressProps {
  stepIndex: number
  totalSteps: number
  stepLabel: string
}

function TerminalProgress({ stepIndex, totalSteps, stepLabel }: TerminalProgressProps) {
  const filled = Math.round((Math.min(stepIndex + 1, totalSteps) / totalSteps) * 20)
  return (
    <m.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-[16px] font-mono"
    >
      <div
        className="px-[12px] py-[8px] border-2"
        style={{ backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-border)' }}
      >
        <span style={{ color: 'var(--theme-foreground-tertiary)' }} className="text-[11px] tracking-wider">{'['}</span>
        {Array.from({ length: 20 }).map((_, i) => (
          <span
            key={`block-${i}`}
            className="text-[11px]"
            style={{ color: i < filled ? 'var(--theme-primary)' : 'var(--theme-foreground-tertiary)' }}
          >
            {i < filled ? '\u25A0' : '\u2591'}
          </span>
        ))}
        <span style={{ color: 'var(--theme-foreground-tertiary)' }} className="text-[11px] tracking-wider">{'] '}</span>
        <span style={{ color: 'var(--theme-foreground)' }} className="text-[11px] uppercase tracking-wider">
          STEP {stepIndex + 1}/{totalSteps}
        </span>
        <span style={{ color: 'var(--theme-foreground-tertiary)' }} className="text-[11px]">{' \u2014 '}</span>
        <span style={{ color: 'var(--theme-primary)' }} className="text-[11px] uppercase tracking-wider">{stepLabel}</span>
      </div>
    </m.div>
  )
}

// ═════════════════════════════════════════════════════════════
// STEP: AHA (outcome preview animation)
// ═════════════════════════════════════════════════════════════

interface AhaStepProps {
  direction: number
  onBegin: () => void
  onSkipDemo: () => void
}

type AhaState = {
  commandsTyped: Array<string>
  typingText: string
  devDone: boolean
  engineLines: typeof AHA_ENGINE
  done: boolean
  replayKey: number
}

type AhaAction =
  | { type: 'TYPE'; value: string }
  | { type: 'COMMIT_LINE'; value: string }
  | { type: 'DEV_DONE' }
  | { type: 'PUSH_ENGINE'; value: typeof AHA_ENGINE[number] }
  | { type: 'DONE' }
  | { type: 'REPLAY' }
  | { type: 'SHOW_FINAL' }

function ahaReducer(state: AhaState, action: AhaAction): AhaState {
  switch (action.type) {
    case 'TYPE':
      return { ...state, typingText: action.value }
    case 'COMMIT_LINE':
      return { ...state, commandsTyped: [...state.commandsTyped, action.value], typingText: '' }
    case 'DEV_DONE':
      return { ...state, devDone: true }
    case 'PUSH_ENGINE':
      return { ...state, engineLines: [...state.engineLines, action.value] }
    case 'DONE':
      return { ...state, done: true }
    case 'REPLAY':
      return { commandsTyped: [], typingText: '', devDone: false, engineLines: [], done: false, replayKey: state.replayKey + 1 }
    case 'SHOW_FINAL':
      return { commandsTyped: AHA_COMMANDS.map(c => c.text), typingText: '', devDone: true, engineLines: AHA_ENGINE, done: true, replayKey: state.replayKey }
    default:
      return state
  }
}

function scheduleAhaAnimation(dispatch: React.Dispatch<AhaAction>): Array<ReturnType<typeof setTimeout>> {
  const timers: Array<ReturnType<typeof setTimeout>> = []
  let t = 250

  for (const cmd of AHA_COMMANDS) {
    for (let i = 1; i <= cmd.text.length; i++) {
      const d = t
      timers.push(setTimeout(() => dispatch({ type: 'TYPE', value: cmd.text.slice(0, i) }), d))
      t += CHAR_SPEED
    }
    const lineEnd = t
    timers.push(setTimeout(() => dispatch({ type: 'COMMIT_LINE', value: cmd.text }), lineEnd))
    t += cmd.pause
  }
  timers.push(setTimeout(() => dispatch({ type: 'DEV_DONE' }), t))
  t += 350

  for (let i = 0; i < AHA_ENGINE.length; i++) {
    const d = t
    timers.push(setTimeout(() => dispatch({ type: 'PUSH_ENGINE', value: AHA_ENGINE[i] }), d))
    t += ENGINE_SPEED
  }
  t += 250
  timers.push(setTimeout(() => dispatch({ type: 'DONE' }), t))

  return timers
}

function AhaStep({ direction, onBegin, onSkipDemo }: AhaStepProps) {
  const [state, dispatch] = useReducer(ahaReducer, {
    commandsTyped: [],
    typingText: '',
    devDone: false,
    engineLines: [],
    done: false,
    replayKey: 0,
  })

  useEffect(() => {
    const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      dispatch({ type: 'SHOW_FINAL' })
      return
    }
    const timers = scheduleAhaAnimation(dispatch)
    return () => timers.forEach(clearTimeout)
  }, [state.replayKey])

  return (
    <m.div
      key="aha-step"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="space-y-[12px]"
    >
      <div
        className="p-[10px] border-2"
        style={{ backgroundColor: 'var(--theme-background-secondary)', borderColor: 'var(--theme-info)' }}
      >
        <div className="flex items-start gap-[6px]">
          <HiOutlinePlay className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--theme-info)' }} />
          <div>
            <h3 className="text-[13px] font-mono uppercase mb-[4px] tracking-wider" style={{ color: 'var(--theme-foreground)' }}>
              {'>'} PUSH A COMMIT, WATCH YOUR TICKET CLOSE
            </h3>
            <p className="text-[11px] font-mono" style={{ color: 'var(--theme-foreground-secondary)' }}>
              No configuration needed. This is what LTF1 does by default.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[10px]">
        {/* LEFT: Developer terminal */}
        <div
          className="border-2 overflow-hidden"
          style={{ backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-border)' }}
        >
          <div
            className="px-[10px] py-[6px] border-b-2 flex items-center gap-[6px]"
            style={{ backgroundColor: 'var(--theme-background-secondary)', borderColor: 'var(--theme-border)' }}
          >
            <span className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: 'var(--theme-success)' }} />
            <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--theme-foreground-secondary)' }}>
              DEVELOPER
            </span>
          </div>
          <div className="p-[10px] font-mono text-[11px] min-h-[160px] leading-6" style={{ color: 'var(--theme-foreground)' }}>
            {state.commandsTyped.map((line) => (
              <div key={line}>{line}</div>
            ))}
            {!state.devDone && state.typingText && (
              <div>
                {state.typingText}
                <span className="inline-block w-[6px] h-[12px] ml-px align-middle animate-pulse" style={{ backgroundColor: 'var(--theme-foreground)' }} />
              </div>
            )}
            {state.devDone && (
              <div className="mt-[8px] pt-[8px] border-t text-[10px]" style={{ color: 'var(--theme-foreground-tertiary)', borderColor: 'var(--theme-border)' }}>
                {'>'} 2 commands · 0 tickets manually moved
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: LTF1 engine */}
        <div
          className="border-2 overflow-hidden"
          style={{ backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-border)' }}
        >
          <div
            className="px-[10px] py-[6px] border-b-2 flex items-center gap-[6px]"
            style={{ backgroundColor: 'var(--theme-background-secondary)', borderColor: 'var(--theme-border)' }}
          >
            <span
              className="w-[6px] h-[6px] rounded-full"
              style={{ backgroundColor: state.engineLines.length > 0 ? 'var(--theme-primary)' : 'var(--theme-foreground-tertiary)' }}
            />
            <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--theme-primary)' }}>
              LTF1 ENGINE
            </span>
            {state.engineLines.length > 0 && !state.done && (
              <span className="ml-auto w-[5px] h-[5px] rounded-full animate-pulse" style={{ backgroundColor: 'var(--theme-primary)' }} />
            )}
            {state.done && (
              <span className="ml-auto font-mono text-[10px] uppercase" style={{ color: 'var(--theme-success)' }}>DONE</span>
            )}
          </div>
          <div className="p-[10px] font-mono text-[11px] min-h-[160px] leading-6">
            {state.engineLines.length === 0 && !state.devDone && (
              <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--theme-foreground-tertiary)' }}>
                waiting for push...
              </div>
            )}
            {state.engineLines.map((line, idx) => (
              <m.div
                key={`${line.tag}-${idx}`}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="flex"
              >
                <span
                  className="shrink-0 w-[72px]"
                  style={{ color: line.color === 'success' ? 'var(--theme-success)' : 'var(--theme-primary)' }}
                >
                  [{line.tag}]
                </span>
                <span style={{ color: line.color === 'success' ? 'var(--theme-success)' : 'var(--theme-foreground-secondary)' }}>
                  {line.text}
                </span>
              </m.div>
            ))}
            {state.done && (
              <div className="mt-[8px] pt-[8px] border-t text-[10px]" style={{ color: 'var(--theme-foreground-tertiary)', borderColor: 'var(--theme-border)' }}>
                {'>'} {AHA_ENGINE.length} operations · 0 manual effort
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-[4px]">
        <div className="flex items-center gap-[8px]">
          <button
            type="button"
            onClick={() => dispatch({ type: 'REPLAY' })}
            disabled={!state.done}
            className="px-[10px] py-[6px] border-2 font-mono text-[10px] uppercase tracking-wider flex items-center gap-[4px] disabled:opacity-40"
            style={{
              borderRadius: '6px',
              backgroundColor: 'var(--theme-background)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-foreground-secondary)',
            }}
          >
            <HiOutlineRefresh className="w-3 h-3" />
            REPLAY
          </button>
          <button
            type="button"
            onClick={onSkipDemo}
            className="px-[10px] py-[6px] font-mono text-[10px] uppercase tracking-wider"
            style={{ color: 'var(--theme-foreground-tertiary)' }}
          >
            SKIP DEMO
          </button>
        </div>
        <m.button
          whileHover={{ y: -2, boxShadow: '6px 6px 0 var(--theme-shadow)' }}
          whileTap={{ y: 0, boxShadow: '2px 2px 0 var(--theme-shadow)' }}
          onClick={onBegin}
          className="px-[16px] py-[8px] border-2 font-mono text-[12px] uppercase tracking-wider flex items-center gap-[6px]"
          style={{
            borderRadius: '8px',
            backgroundColor: 'var(--theme-primary)',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-background)',
            boxShadow: '4px 4px 0 var(--theme-shadow)',
          }}
        >
          START SETUP
          <HiOutlineArrowRight className="w-4 h-4" />
        </m.button>
      </div>
    </m.div>
  )
}

// ═════════════════════════════════════════════════════════════
// STEP: INTENT (multi-select)
// ═════════════════════════════════════════════════════════════

interface IntentStepProps {
  direction: number
  intents: Array<string>
  onToggle: (id: string) => void
  onBack: () => void
  onNext: () => void
}

function IntentStep({ direction, intents, onToggle, onBack, onNext }: IntentStepProps) {
  const canContinue = intents.length > 0

  return (
    <m.div
      key="intent-step"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="space-y-[12px]"
    >
      <div
        className="p-[10px] border-2"
        style={{ backgroundColor: 'var(--theme-background-secondary)', borderColor: 'var(--theme-info)' }}
      >
        <div className="flex items-start gap-[6px]">
          <HiOutlineLightningBolt className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--theme-info)' }} />
          <div>
            <h3 className="text-[13px] font-mono uppercase mb-[4px] tracking-wider" style={{ color: 'var(--theme-foreground)' }}>
              {'>'} WHAT BRINGS YOU HERE?
            </h3>
            <p className="text-[11px] font-mono" style={{ color: 'var(--theme-foreground-secondary)' }}>
              Pick any that apply — we&apos;ll tailor the setup.
            </p>
          </div>
        </div>
      </div>

      <m.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 gap-[8px]">
        {INTENTS.map((intent) => {
          const selected = intents.includes(intent.id)
          return (
            <m.button
              key={intent.id}
              variants={staggerItem}
              whileHover={{ y: -1 }}
              whileTap={{ y: 0 }}
              onClick={() => onToggle(intent.id)}
              className="p-[10px] border-2 text-left transition-colors"
              style={{
                backgroundColor: selected ? 'var(--theme-background-secondary)' : 'var(--theme-background)',
                borderColor: selected ? 'var(--theme-primary)' : 'var(--theme-border)',
                boxShadow: selected ? '4px 4px 0 var(--theme-shadow)' : 'none',
              }}
            >
              <div className="flex items-center justify-between mb-[2px]">
                <span
                  className="font-mono text-[11px] uppercase tracking-wider"
                  style={{ color: selected ? 'var(--theme-primary)' : 'var(--theme-foreground)' }}
                >
                  {intent.label}
                </span>
                {selected && (
                  <m.span
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-3.5 h-3.5 border-2 flex items-center justify-center"
                    style={{ borderColor: 'var(--theme-primary)', backgroundColor: 'var(--theme-primary)' }}
                  >
                    <HiOutlineCheck className="w-2.5 h-2.5" style={{ color: 'var(--theme-background)' }} />
                  </m.span>
                )}
              </div>
              <p className="font-mono text-[10px]" style={{ color: 'var(--theme-foreground-secondary)' }}>
                {intent.sub}
              </p>
            </m.button>
          )
        })}
      </m.div>

      <div className="flex justify-between pt-[8px]">
        <m.button
          whileHover={{ y: -1 }}
          whileTap={{ y: 1 }}
          onClick={onBack}
          className="px-[12px] py-[8px] border-2 font-mono text-[11px] uppercase tracking-wider flex items-center gap-[6px]"
          style={{ borderRadius: '8px', backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-border)', color: 'var(--theme-foreground)' }}
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
          BACK
        </m.button>
        <m.button
          whileHover={canContinue ? { y: -2, boxShadow: '6px 6px 0 var(--theme-shadow)' } : {}}
          whileTap={canContinue ? { y: 0, boxShadow: '2px 2px 0 var(--theme-shadow)' } : {}}
          onClick={onNext}
          disabled={!canContinue}
          className="px-[16px] py-[8px] border-2 font-mono text-[12px] uppercase tracking-wider flex items-center gap-[6px] disabled:opacity-50"
          style={{
            borderRadius: '8px',
            backgroundColor: canContinue ? 'var(--theme-primary)' : 'var(--theme-background-secondary)',
            borderColor: 'var(--theme-border)',
            color: canContinue ? 'var(--theme-background)' : 'var(--theme-foreground-tertiary)',
            boxShadow: canContinue ? '4px 4px 0 var(--theme-shadow)' : 'none',
          }}
        >
          {canContinue ? `NEXT --${intents.length} SELECTED` : 'PICK AT LEAST ONE'}
          {canContinue && <HiOutlineArrowRight className="w-4 h-4" />}
        </m.button>
      </div>
    </m.div>
  )
}

// ═════════════════════════════════════════════════════════════
// STEP: TEAM SIZE
// ═════════════════════════════════════════════════════════════

interface TeamStepProps {
  direction: number
  teamSize: TeamSize
  onSelect: (size: TeamSize) => void
  onBack: () => void
  onNext: () => void
}

function TeamStep({ direction, teamSize, onSelect, onBack, onNext }: TeamStepProps) {
  const canContinue = teamSize !== ''

  return (
    <m.div
      key="team-step"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="space-y-[12px]"
    >
      <div
        className="p-[10px] border-2"
        style={{ backgroundColor: 'var(--theme-background-secondary)', borderColor: 'var(--theme-info)' }}
      >
        <div className="flex items-start gap-[6px]">
          <HiOutlineUserGroup className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--theme-info)' }} />
          <div>
            <h3 className="text-[13px] font-mono uppercase mb-[4px] tracking-wider" style={{ color: 'var(--theme-foreground)' }}>
              {'>'} HOW MANY DEVS ON YOUR TEAM?
            </h3>
            <p className="text-[11px] font-mono" style={{ color: 'var(--theme-foreground-secondary)' }}>
              We&apos;ll recommend a plan and pre-fill workspace defaults.
            </p>
          </div>
        </div>
      </div>

      <m.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-4 gap-[8px]">
        {TEAM_OPTIONS.map(({ id, label, sub, icon: Icon }) => {
          const selected = teamSize === id
          return (
            <m.button
              key={id}
              variants={staggerItem}
              whileHover={{ y: -1 }}
              whileTap={{ y: 0 }}
              onClick={() => onSelect(id)}
              className="p-[12px] border-2 text-left transition-colors"
              style={{
                backgroundColor: selected ? 'var(--theme-background-secondary)' : 'var(--theme-background)',
                borderColor: selected ? 'var(--theme-primary)' : 'var(--theme-border)',
                boxShadow: selected ? '4px 4px 0 var(--theme-shadow)' : 'none',
              }}
            >
              <Icon
                className="w-5 h-5 mb-[6px]"
                style={{ color: selected ? 'var(--theme-primary)' : 'var(--theme-foreground-secondary)' }}
              />
              <div
                className="font-mono text-[12px] uppercase tracking-wider mb-[2px]"
                style={{ color: selected ? 'var(--theme-primary)' : 'var(--theme-foreground)' }}
              >
                {label}
              </div>
              <div className="font-mono text-[10px]" style={{ color: 'var(--theme-foreground-secondary)' }}>
                {sub}
              </div>
            </m.button>
          )
        })}
      </m.div>

      <div className="flex justify-between pt-[8px]">
        <m.button
          whileHover={{ y: -1 }}
          whileTap={{ y: 1 }}
          onClick={onBack}
          className="px-[12px] py-[8px] border-2 font-mono text-[11px] uppercase tracking-wider flex items-center gap-[6px]"
          style={{ borderRadius: '8px', backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-border)', color: 'var(--theme-foreground)' }}
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
          BACK
        </m.button>
        <m.button
          whileHover={canContinue ? { y: -2, boxShadow: '6px 6px 0 var(--theme-shadow)' } : {}}
          whileTap={canContinue ? { y: 0, boxShadow: '2px 2px 0 var(--theme-shadow)' } : {}}
          onClick={onNext}
          disabled={!canContinue}
          className="px-[16px] py-[8px] border-2 font-mono text-[12px] uppercase tracking-wider flex items-center gap-[6px] disabled:opacity-50"
          style={{
            borderRadius: '8px',
            backgroundColor: canContinue ? 'var(--theme-primary)' : 'var(--theme-background-secondary)',
            borderColor: 'var(--theme-border)',
            color: canContinue ? 'var(--theme-background)' : 'var(--theme-foreground-tertiary)',
            boxShadow: canContinue ? '4px 4px 0 var(--theme-shadow)' : 'none',
          }}
        >
          NEXT
          {canContinue && <HiOutlineArrowRight className="w-4 h-4" />}
        </m.button>
      </div>
    </m.div>
  )
}

// ═════════════════════════════════════════════════════════════
// STEP: PROJECTION ("here's what LTF1 will do for you")
// ═════════════════════════════════════════════════════════════

interface Projection {
  hoursRange: string
  bullets: Array<string>
  summary: string
}

function buildProjection(intents: Array<string>, teamSize: TeamSize): Projection {
  const hoursByTeam: Record<Exclude<TeamSize, ''>, string> = {
    solo: '1–3',
    small: '4–7',
    medium: '8–14',
    large: '15–25',
  }
  const size = teamSize || 'small'
  const hoursRange = hoursByTeam[size as Exclude<TeamSize, ''>]

  const summaryByTeam: Record<Exclude<TeamSize, ''>, string> = {
    solo: 'Solo devs keep ~1–3 hrs/week that used to go into ticket hygiene.',
    small: 'Small teams typically recover 4–7 hrs/week of status-meeting + triage time.',
    medium: 'Teams your size usually reclaim 8–14 hrs/week, mostly sprint planning + code review.',
    large: 'Teams past 20 devs see 15–25 hrs/week back — triage dominates at your scale.',
  }
  const summary = summaryByTeam[size as Exclude<TeamSize, ''>]

  const bullets: Array<string> = []
  if (intents.includes('migrate_linear')) bullets.push('One-shot Linear import — teams, issues, cycles, labels.')
  if (intents.includes('migrate_jira')) bullets.push('One-shot Jira import — issues, sprints, labels.')
  if (intents.includes('auto_triage')) bullets.push('Agent classifies incoming bugs & routes them to the right project.')
  if (intents.includes('sprint_plan')) bullets.push('Sprint auto-composed from velocity + open priorities.')
  if (intents.includes('code_review')) bullets.push('AI review comments on every PR before you look.')
  if (intents.includes('git_auto_link')) bullets.push('Commits auto-link to tickets; status moves on push/merge.')
  if (intents.includes('agent_work')) bullets.push('CLI + API so your own agents can update tasks directly.')
  if (intents.includes('just_explore')) bullets.push('No commitment — a demo project will appear on your dashboard.')

  if (bullets.length === 0) {
    bullets.push('Commits auto-link to tickets; status moves on push/merge.')
    bullets.push('Velocity measured from actual shipping data.')
    bullets.push('Story points estimated from your diff.')
  }

  return { hoursRange, bullets: bullets.slice(0, 3), summary }
}

interface ProjectionStepProps {
  direction: number
  projection: Projection
  onBack: () => void
  onNext: () => void
}

function ProjectionStep({ direction, projection, onBack, onNext }: ProjectionStepProps) {
  return (
    <m.div
      key="projection-step"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="space-y-[12px]"
    >
      <div
        className="p-[10px] border-2"
        style={{ backgroundColor: 'var(--theme-background-secondary)', borderColor: 'var(--theme-info)' }}
      >
        <div className="flex items-start gap-[6px]">
          <HiOutlineChartBar className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--theme-info)' }} />
          <div>
            <h3 className="text-[13px] font-mono uppercase mb-[4px] tracking-wider" style={{ color: 'var(--theme-foreground)' }}>
              {'>'} BASED ON YOUR ANSWERS
            </h3>
            <p className="text-[11px] font-mono" style={{ color: 'var(--theme-foreground-secondary)' }}>
              Here&apos;s what we&apos;ll prioritize for you.
            </p>
          </div>
        </div>
      </div>

      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="p-[14px] border-2"
        style={{
          backgroundColor: 'var(--theme-background)',
          borderColor: 'var(--theme-primary)',
          boxShadow: '4px 4px 0 var(--theme-shadow)',
        }}
      >
        <div className="flex items-baseline gap-[12px] mb-[10px]">
          <span
            className="font-mono text-[32px] font-bold"
            style={{ color: 'var(--theme-primary)', letterSpacing: '-0.5px' }}
          >
            ~{projection.hoursRange}
          </span>
          <span
            className="font-mono text-[11px] uppercase tracking-wider"
            style={{ color: 'var(--theme-foreground-secondary)' }}
          >
            HRS / WEEK RECOVERED
          </span>
        </div>
        <p className="font-mono text-[11px] mb-[12px]" style={{ color: 'var(--theme-foreground-secondary)' }}>
          {projection.summary}
        </p>
        <div className="pt-[10px] border-t" style={{ borderColor: 'var(--theme-border)' }}>
          <p
            className="font-mono text-[10px] uppercase tracking-wider mb-[6px]"
            style={{ color: 'var(--theme-foreground-tertiary)' }}
          >
            {'>'} PRIORITIZED FOR YOU:
          </p>
          <ul className="space-y-[6px]">
            {projection.bullets.map((b) => (
              <li key={b} className="flex items-start gap-[8px] font-mono text-[11px]" style={{ color: 'var(--theme-foreground)' }}>
                <span style={{ color: 'var(--theme-primary)' }} className="mt-[2px]">{'>'}</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </m.div>

      <p className="font-mono text-[10px]" style={{ color: 'var(--theme-foreground-tertiary)' }}>
        # ranges are median observations across similar teams — your mileage will vary
      </p>

      <div className="flex justify-between pt-[4px]">
        <m.button
          whileHover={{ y: -1 }}
          whileTap={{ y: 1 }}
          onClick={onBack}
          className="px-[12px] py-[8px] border-2 font-mono text-[11px] uppercase tracking-wider flex items-center gap-[6px]"
          style={{ borderRadius: '8px', backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-border)', color: 'var(--theme-foreground)' }}
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
          BACK
        </m.button>
        <m.button
          whileHover={{ y: -2, boxShadow: '6px 6px 0 var(--theme-shadow)' }}
          whileTap={{ y: 0, boxShadow: '2px 2px 0 var(--theme-shadow)' }}
          onClick={onNext}
          className="px-[16px] py-[8px] border-2 font-mono text-[12px] uppercase tracking-wider flex items-center gap-[6px]"
          style={{
            borderRadius: '8px',
            backgroundColor: 'var(--theme-primary)',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-background)',
            boxShadow: '4px 4px 0 var(--theme-shadow)',
          }}
        >
          LET&apos;S WIRE IT UP
          <HiOutlineArrowRight className="w-4 h-4" />
        </m.button>
      </div>
    </m.div>
  )
}

// ═════════════════════════════════════════════════════════════
// STEP: AI (existing, with team-size-driven recommendation)
// ═════════════════════════════════════════════════════════════

interface AIOptionCardProps {
  selected: boolean
  recommended: boolean
  icon: React.ReactNode
  title: string
  description: string
  details: Array<string>
  onSelect: () => void
}

function AIOptionCard({ selected, recommended, icon, title, description, details, onSelect }: AIOptionCardProps) {
  return (
    <m.button
      variants={staggerItem}
      whileHover={{ y: -2, boxShadow: '4px 4px 0 var(--theme-shadow)', transition: { duration: 0.15 } }}
      whileTap={{ y: 0, boxShadow: 'none' }}
      onClick={onSelect}
      className="w-full p-[16px] border-2 text-left transition-colors relative"
      style={{
        backgroundColor: selected ? 'var(--theme-background-secondary)' : 'var(--theme-background)',
        borderColor: selected ? 'var(--theme-primary)' : 'var(--theme-border)',
        color: 'var(--theme-foreground)',
        boxShadow: selected ? '4px 4px 0 var(--theme-shadow), inset 0 0 12px rgba(99, 102, 241, 0.08)' : 'none',
      }}
    >
      {recommended && (
        <span
          className="absolute top-[-10px] right-[10px] px-[6px] py-[2px] border-2 font-mono text-[9px] uppercase tracking-wider"
          style={{
            backgroundColor: 'var(--theme-primary)',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-background)',
          }}
        >
          RECOMMENDED
        </span>
      )}
      <div className="flex items-start gap-[8px]">
        {icon}
        <div className="flex-1">
          <div className="flex items-center gap-[8px] mb-[6px]">
            <h3 className="text-[12px] font-mono uppercase tracking-wider" style={{ color: selected ? 'var(--theme-primary)' : 'var(--theme-foreground)' }}>
              {title}
            </h3>
            {selected && (
              <m.span
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-4 h-4 border-2 flex items-center justify-center"
                style={{ borderColor: 'var(--theme-primary)', backgroundColor: 'var(--theme-primary)' }}
              >
                <HiOutlineCheck className="w-3 h-3" style={{ color: 'var(--theme-background)' }} />
              </m.span>
            )}
          </div>
          <p className="text-[11px] font-mono mb-[6px]" style={{ color: 'var(--theme-foreground-secondary)' }}>
            {description}
          </p>
          <div className="text-[10px] font-mono space-y-[2px]" style={{ color: 'var(--theme-foreground-tertiary)' }}>
            {details.map((d) => <p key={d}>- {d}</p>)}
          </div>
        </div>
      </div>
    </m.button>
  )
}

interface BYOKInputProps {
  apiKey: string
  onApiKeyChange: (v: string) => void
}

function BYOKInput({ apiKey, onApiKeyChange }: BYOKInputProps) {
  return (
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
        onChange={(e) => onApiKeyChange(e.target.value)}
        placeholder="AIza..."
        className="w-full px-[10px] py-[8px] border-2 font-mono text-[12px] tracking-wider"
        style={{ backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-border)', color: 'var(--theme-foreground)' }}
      />
      <div className="flex items-start gap-[8px]">
        <HiOutlineInformationCircle className="w-4 h-4 flex-shrink-0 mt-[1px]" style={{ color: 'var(--theme-info)' }} />
        <p className="text-[10px] font-mono tracking-wider" style={{ color: 'var(--theme-foreground-secondary)' }}>
          Get your key from{' '}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--theme-info)' }}>
            Google AI Studio
          </a>
          . Encrypted on save.
        </p>
      </div>
    </m.div>
  )
}

interface AIStepProps {
  direction: number
  aiSetupChoice: AISetupChoice
  apiKey: string
  isValidating: boolean
  recommended: 'free' | 'byok' | null
  dispatch: React.Dispatch<OnboardingAction>
  onBack: () => void
  onAIComplete: () => void
}

function AIStep({ direction, aiSetupChoice, apiKey, isValidating, recommended, dispatch, onBack, onAIComplete }: AIStepProps) {
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
      <div
        className="p-[10px] border-2"
        style={{ backgroundColor: 'var(--theme-background-secondary)', borderColor: 'var(--theme-info)' }}
      >
        <div className="flex items-start gap-[6px]">
          <HiOutlineSparkles className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--theme-info)' }} />
          <div>
            <h3 className="text-[13px] font-mono uppercase mb-[4px] tracking-wider" style={{ color: 'var(--theme-foreground)' }}>
              {'>'} AI CAPABILITIES DETECTED
            </h3>
            <p className="text-[11px] font-mono" style={{ color: 'var(--theme-foreground-secondary)' }}>
              Task generation, code reviews, meeting summaries. Pick a mode:
            </p>
          </div>
        </div>
      </div>

      <m.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-[10px] pt-[6px]">
        <AIOptionCard
          selected={aiSetupChoice === 'free'}
          recommended={recommended === 'free'}
          icon={<HiOutlineCreditCard className="w-4 h-4 flex-shrink-0 mt-[2px]" style={{ color: aiSetupChoice === 'free' ? 'var(--theme-primary)' : 'var(--theme-foreground-secondary)' }} />}
          title="FREE_TIER"
          description="100 free AI credits/month. Perfect for exploration."
          details={['~50 task generations or code reviews', 'Rate limited: 10 req/hour', 'Upgrade anytime']}
          onSelect={() => dispatch({ type: 'SET_AI_SETUP_CHOICE', value: 'free' })}
        />

        <AIOptionCard
          selected={aiSetupChoice === 'byok'}
          recommended={recommended === 'byok'}
          icon={<HiOutlineKey className="w-4 h-4 flex-shrink-0 mt-[2px]" style={{ color: aiSetupChoice === 'byok' ? 'var(--theme-primary)' : 'var(--theme-foreground-secondary)' }} />}
          title="BYOK_MODE"
          description="Bring your own Google Gemini key. Unlimited usage."
          details={['No credit limits', 'No rate limiting from LTF1', 'Encrypted & secure storage']}
          onSelect={() => dispatch({ type: 'SET_AI_SETUP_CHOICE', value: 'byok' })}
        />

        <AnimatePresence>
          {aiSetupChoice === 'byok' && (
            <BYOKInput apiKey={apiKey} onApiKeyChange={(v) => dispatch({ type: 'SET_API_KEY', value: v })} />
          )}
        </AnimatePresence>

        <m.button
          variants={staggerItem}
          whileHover={{ y: -1 }}
          whileTap={{ y: 0 }}
          onClick={() => dispatch({ type: 'SET_AI_SETUP_CHOICE', value: 'skip' })}
          className="w-full p-[10px] border-2 text-center transition-colors"
          style={{
            backgroundColor: 'var(--theme-background)',
            borderColor: aiSetupChoice === 'skip' ? 'var(--theme-foreground-tertiary)' : 'var(--theme-border)',
            color: 'var(--theme-foreground-tertiary)',
            boxShadow: aiSetupChoice === 'skip' ? '4px 4px 0 var(--theme-shadow)' : 'none',
          }}
        >
          <p className="text-[11px] font-mono uppercase tracking-wider">SKIP --configure-later</p>
        </m.button>
      </m.div>

      <div className="flex justify-between pt-[8px]">
        <m.button
          whileHover={{ y: -1 }}
          whileTap={{ y: 1 }}
          onClick={onBack}
          className="px-[12px] py-[8px] border-2 font-mono text-[11px] uppercase tracking-wider flex items-center gap-[6px]"
          style={{ borderRadius: '8px', backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-border)', color: 'var(--theme-foreground)' }}
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
            boxShadow: aiSetupChoice ? '4px 4px 0 var(--theme-shadow)' : 'none',
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

// ═════════════════════════════════════════════════════════════
// STEP: IMPORT (existing; highlights the source picked in intents)
// ═════════════════════════════════════════════════════════════

interface ImportStepProps {
  direction: number
  importChoice: ImportChoice
  highlightedSource: 'linear' | 'jira' | null
  dispatch: React.Dispatch<OnboardingAction>
  onBack: () => void
  onImportComplete: () => void
}

function ImportStep({ direction, importChoice, highlightedSource, dispatch, onBack, onImportComplete }: ImportStepProps) {
  const continueLabel =
    importChoice === 'linear' ? 'GO TO LINEAR IMPORTER' :
    importChoice === 'jira' ? 'GO TO JIRA IMPORTER' :
    importChoice === 'skip' ? 'CONTINUE --fresh' :
    'SELECT_OPTION'

  return (
    <m.div
      key="import-step"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="space-y-[12px]"
    >
      <div
        className="p-[10px] border-2"
        style={{ backgroundColor: 'var(--theme-background-secondary)', borderColor: 'var(--theme-info)' }}
      >
        <div className="flex items-start gap-[6px]">
          <HiOutlineDownload className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--theme-info)' }} />
          <div>
            <h3 className="text-[13px] font-mono uppercase mb-[4px] tracking-wider" style={{ color: 'var(--theme-foreground)' }}>
              {'>'} MIGRATE FROM EXTERNAL PM
            </h3>
            <p className="text-[11px] font-mono" style={{ color: 'var(--theme-foreground-secondary)' }}>
              {highlightedSource
                ? `You mentioned ${highlightedSource.toUpperCase()}. Pull it in now, or skip and migrate later.`
                : 'Coming from Linear or Jira? Pull it in. Or skip.'}
            </p>
          </div>
        </div>
      </div>

      <m.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-[10px]">
        <AIOptionCard
          selected={importChoice === 'linear'}
          recommended={highlightedSource === 'linear'}
          icon={<HiOutlineDownload className="w-4 h-4 flex-shrink-0 mt-[2px]" style={{ color: importChoice === 'linear' ? 'var(--theme-primary)' : 'var(--theme-foreground-secondary)' }} />}
          title="LINEAR_IMPORT"
          description="Pull teams, issues, cycles, and labels from a Linear team."
          details={['Requires a Linear personal API key', '~1–5 min for 1000 issues', 'Idempotent — safe to re-run']}
          onSelect={() => dispatch({ type: 'SET_IMPORT_CHOICE', value: 'linear' })}
        />

        <AIOptionCard
          selected={importChoice === 'jira'}
          recommended={highlightedSource === 'jira'}
          icon={<HiOutlineDownload className="w-4 h-4 flex-shrink-0 mt-[2px]" style={{ color: importChoice === 'jira' ? 'var(--theme-primary)' : 'var(--theme-foreground-secondary)' }} />}
          title="JIRA_IMPORT"
          description="Pull issues, sprints, and labels from a Jira Cloud project."
          details={['Requires Jira host + email + API token', '~5–10 min for 1000 issues', 'Idempotent — safe to re-run']}
          onSelect={() => dispatch({ type: 'SET_IMPORT_CHOICE', value: 'jira' })}
        />

        <m.button
          variants={staggerItem}
          whileHover={{ y: -1 }}
          whileTap={{ y: 0 }}
          onClick={() => dispatch({ type: 'SET_IMPORT_CHOICE', value: 'skip' })}
          className="w-full p-[10px] border-2 text-center transition-colors"
          style={{
            backgroundColor: 'var(--theme-background)',
            borderColor: importChoice === 'skip' ? 'var(--theme-foreground-tertiary)' : 'var(--theme-border)',
            color: 'var(--theme-foreground-tertiary)',
            boxShadow: importChoice === 'skip' ? '4px 4px 0 var(--theme-shadow)' : 'none',
          }}
        >
          <p className="text-[11px] font-mono uppercase tracking-wider">SKIP --fresh-start</p>
        </m.button>
      </m.div>

      <div className="flex justify-between pt-[8px]">
        <m.button
          whileHover={{ y: -1 }}
          whileTap={{ y: 1 }}
          onClick={onBack}
          className="px-[12px] py-[8px] border-2 font-mono text-[11px] uppercase tracking-wider flex items-center gap-[6px]"
          style={{ borderRadius: '8px', backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-border)', color: 'var(--theme-foreground)' }}
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
          BACK
        </m.button>
        <m.button
          whileHover={importChoice ? { y: -2, boxShadow: '6px 6px 0 var(--theme-shadow)' } : {}}
          whileTap={importChoice ? { y: 0, boxShadow: '2px 2px 0 var(--theme-shadow)' } : {}}
          onClick={onImportComplete}
          disabled={!importChoice}
          className="px-[16px] py-[8px] border-2 font-mono text-[12px] uppercase tracking-wider disabled:opacity-50"
          style={{
            borderRadius: '8px',
            backgroundColor: importChoice ? 'var(--theme-success)' : 'var(--theme-background-secondary)',
            borderColor: 'var(--theme-border)',
            color: importChoice ? 'var(--theme-background)' : 'var(--theme-foreground-tertiary)',
            boxShadow: importChoice ? '4px 4px 0 var(--theme-shadow)' : 'none',
          }}
        >
          {continueLabel}
        </m.button>
      </div>
    </m.div>
  )
}

// ═════════════════════════════════════════════════════════════
// STEP: THEME (moved to end, optional)
// ═════════════════════════════════════════════════════════════

interface ThemeStepProps {
  direction: number
  themeName: string
  themeDescription: string
  onThemeComplete: () => void
  onKeepDefault: () => void
}

function ThemeStep({ direction, themeName, themeDescription, onThemeComplete, onKeepDefault }: ThemeStepProps) {
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
      <div
        className="p-[10px] border-2"
        style={{ backgroundColor: 'var(--theme-background-secondary)', borderColor: 'var(--theme-info)' }}
      >
        <div className="flex items-start gap-[6px]">
          <HiOutlineColorSwatch className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--theme-info)' }} />
          <div>
            <h3 className="text-[13px] font-mono uppercase mb-[4px] tracking-wider" style={{ color: 'var(--theme-foreground)' }}>
              {'>'} ONE MORE THING — PICK A VIBE
            </h3>
            <p className="text-[11px] font-mono" style={{ color: 'var(--theme-foreground-secondary)' }}>
              Or skip — the default is already dark + brutalist. Change anytime with Ctrl+Shift+T.
            </p>
          </div>
        </div>
      </div>

      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="py-[8px]"
      >
        <ThemeSwitcher size="xl" variant="grid" showLabel={true} />
      </m.div>

      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="p-[10px] border-2"
        style={{ backgroundColor: 'var(--theme-background-tertiary)', borderColor: 'var(--theme-border)' }}
      >
        <p className="text-[10px] font-mono uppercase mb-[4px] tracking-wider" style={{ color: 'var(--theme-foreground-secondary)' }}>
          ACTIVE_THEME:
        </p>
        <h4 className="text-[13px] font-mono uppercase tracking-wider" style={{ color: 'var(--theme-primary)' }}>
          {themeName}
        </h4>
        <p className="text-[11px] font-mono mt-[4px]" style={{ color: 'var(--theme-foreground-secondary)' }}>
          {themeDescription}
        </p>
      </m.div>

      <div className="flex justify-between pt-[4px]">
        <m.button
          whileHover={{ y: -1 }}
          whileTap={{ y: 1 }}
          onClick={onKeepDefault}
          className="px-[12px] py-[8px] border-2 font-mono text-[11px] uppercase tracking-wider"
          style={{ borderRadius: '8px', backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-border)', color: 'var(--theme-foreground-tertiary)' }}
        >
          KEEP DEFAULT
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
            boxShadow: '4px 4px 0 var(--theme-shadow)',
          }}
        >
          FINALIZE
          <HiOutlineArrowRight className="w-4 h-4" />
        </m.button>
      </div>
    </m.div>
  )
}

// ═════════════════════════════════════════════════════════════
// STATE MACHINE
// ═════════════════════════════════════════════════════════════

type OnboardingState = {
  currentStep: OnboardingStep
  direction: number
  aiSetupChoice: AISetupChoice
  apiKey: string
  isValidating: boolean
  importChoice: ImportChoice
  intents: Array<string>
  teamSize: TeamSize
  bootComplete: Array<number>
  allSystemsGo: boolean
}

const initialOnboardingState: OnboardingState = {
  currentStep: 'aha',
  direction: 1,
  aiSetupChoice: '',
  apiKey: '',
  isValidating: false,
  importChoice: '',
  intents: [],
  teamSize: '',
  bootComplete: [],
  allSystemsGo: false,
}

type OnboardingAction =
  | { type: 'SET_STEP'; step: OnboardingStep; direction: number }
  | { type: 'SET_AI_SETUP_CHOICE'; value: AISetupChoice }
  | { type: 'SET_API_KEY'; value: string }
  | { type: 'SET_IS_VALIDATING'; value: boolean }
  | { type: 'SET_IMPORT_CHOICE'; value: ImportChoice }
  | { type: 'TOGGLE_INTENT'; value: string }
  | { type: 'SET_TEAM_SIZE'; value: TeamSize }
  | { type: 'ADD_BOOT_COMPLETE'; index: number }
  | { type: 'SET_ALL_SYSTEMS_GO'; value: boolean }
  | { type: 'RESET_BOOT' }

function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.step, direction: action.direction }
    case 'SET_AI_SETUP_CHOICE':
      return { ...state, aiSetupChoice: action.value }
    case 'SET_API_KEY':
      return { ...state, apiKey: action.value }
    case 'SET_IS_VALIDATING':
      return { ...state, isValidating: action.value }
    case 'SET_IMPORT_CHOICE':
      return { ...state, importChoice: action.value }
    case 'TOGGLE_INTENT': {
      const has = state.intents.includes(action.value)
      return { ...state, intents: has ? state.intents.filter(i => i !== action.value) : [...state.intents, action.value] }
    }
    case 'SET_TEAM_SIZE':
      return { ...state, teamSize: action.value }
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

// ═════════════════════════════════════════════════════════════
// COMPLETION SCREEN (boot + founder note)
// ═════════════════════════════════════════════════════════════

interface CompletionScreenProps {
  isOpen: boolean
  onComplete: () => void
  bootComplete: Array<number>
  allSystemsGo: boolean
}

function CompletionScreen({ isOpen, onComplete, bootComplete, allSystemsGo }: CompletionScreenProps) {
  return (
    <BrutalModal isOpen={isOpen} onClose={onComplete} title="> SYSTEM_BOOT" size="md" showCloseButton={true}>
      <div className="py-[16px] font-mono space-y-[14px]">
        <m.div className="space-y-[10px]" initial="hidden" animate="show" variants={staggerContainer}>
          {bootLines.map((line, index) => (
            <m.div key={line.label} variants={staggerItem} className="flex items-center gap-[8px] text-[12px] tracking-wider">
              <span style={{ color: 'var(--theme-foreground-tertiary)' }}>{'>'}</span>
              <span style={{ color: 'var(--theme-foreground)' }} className="uppercase">{line.label}</span>
              <span className="flex-1 overflow-hidden" style={{ color: 'var(--theme-foreground-tertiary)' }}>
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
        </m.div>

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
                  style={{ borderColor: 'var(--theme-success)', backgroundColor: 'var(--theme-success)' }}
                >
                  <HiOutlineCheck className="w-3 h-3" style={{ color: 'var(--theme-background)' }} />
                </m.div>
                <span className="text-[13px] uppercase tracking-widest font-bold" style={{ color: 'var(--theme-success)' }}>
                  ALL_SYSTEMS_NOMINAL
                </span>
              </div>
              <p className="text-[11px] mt-[8px] tracking-wider" style={{ color: 'var(--theme-foreground-secondary)' }}>
                {'>'} Launching command center...
              </p>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </BrutalModal>
  )
}

// ═════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════

export default function OnboardingFlow({ isOpen, onComplete }: OnboardingFlowProps) {
  const [state, dispatch] = useReducer(onboardingReducer, initialOnboardingState)
  const { currentStep, direction, aiSetupChoice, apiKey, isValidating, importChoice, intents, teamSize, bootComplete, allSystemsGo } = state
  const { themeName, themeDescription } = useTheme()
  const navigate = useNavigate()

  // @ts-expect-error Convex deep type instantiation on nested preferences validator
  const updatePreferences = useMutation(api.auth.users.updateUserPreferences)
  const setupAICredits = useMutation(api.aiCredits.mutations.setupUserAI)
  const validateApiKey = useAction(api.aiCredits.actions.validateApiKey)
  const saveApiKey = useMutation(api.aiCredits.mutations.saveApiKey)

  // Derived values
  const recommendedTier = useMemo<'free' | 'byok' | null>(() => {
    if (teamSize === 'medium' || teamSize === 'large') return 'byok'
    if (teamSize === 'solo' || teamSize === 'small') return 'free'
    return null
  }, [teamSize])

  const highlightedSource = useMemo<'linear' | 'jira' | null>(() => {
    if (intents.includes('migrate_linear')) return 'linear'
    if (intents.includes('migrate_jira')) return 'jira'
    return null
  }, [intents])

  const projection = useMemo(() => buildProjection(intents, teamSize), [intents, teamSize])

  // Persist intents + teamSize as soon as we leave the projection step
  const persistPersonalization = async () => {
    try {
      await updatePreferences({
        preferences: {
          onboardingIntents: intents,
          teamSize: teamSize || undefined,
        },
      })
    } catch (err) {
      console.error('Failed to persist onboarding personalization', err)
    }
  }

  // ── Navigation handlers ──
  const goNextFrom = (from: OnboardingStep) => {
    const i = STEP_ORDER.indexOf(from as Exclude<OnboardingStep, 'complete'>)
    if (i < 0 || i === STEP_ORDER.length - 1) return
    dispatch({ type: 'SET_STEP', step: STEP_ORDER[i + 1], direction: 1 })
  }

  const goBackFrom = (from: OnboardingStep) => {
    const i = STEP_ORDER.indexOf(from as Exclude<OnboardingStep, 'complete'>)
    if (i <= 0) return
    dispatch({ type: 'SET_STEP', step: STEP_ORDER[i - 1], direction: -1 })
  }

  const handleAhaBegin = () => goNextFrom('aha')
  const handleAhaSkipDemo = () => goNextFrom('aha')
  const handleIntentNext = () => goNextFrom('intent')
  const handleTeamNext = async () => {
    await persistPersonalization()
    goNextFrom('team')
  }
  const handleProjectionNext = () => {
    // Auto-select the recommended AI tier if user hasn't chosen yet
    if (!aiSetupChoice && recommendedTier) {
      dispatch({ type: 'SET_AI_SETUP_CHOICE', value: recommendedTier })
    }
    goNextFrom('projection')
  }

  const handleAIComplete = async () => {
    if (aiSetupChoice === 'skip') {
      goNextFrom('ai')
      return
    }
    if (aiSetupChoice === 'byok' && !apiKey) {
      toast.error('Please enter your Gemini API key')
      return
    }

    dispatch({ type: 'SET_IS_VALIDATING', value: true })
    try {
      if (aiSetupChoice === 'byok') {
        const v = await validateApiKey({ apiKey })
        if (!v.isValid) {
          toast.error(v.error || 'Invalid API key')
          dispatch({ type: 'SET_IS_VALIDATING', value: false })
          return
        }
        await saveApiKey({ apiKey })
        toast.success('API key validated and saved')
      } else if (aiSetupChoice === 'free') {
        await setupAICredits({ tier: 'free', setupType: 'free_credits' })
        toast.success('Free AI credits activated')
      }
      goNextFrom('ai')
    } catch (err) {
      toast.error('Setup failed. Please try again.')
      console.error(err)
    } finally {
      dispatch({ type: 'SET_IS_VALIDATING', value: false })
    }
  }

  const handleImportComplete = () => {
    if (!importChoice) return

    posthog.capture('onboarding_completed', {
      theme: themeName,
      ai_setup: aiSetupChoice || 'skipped',
      import_choice: importChoice,
      intents,
      team_size: teamSize,
    })

    if (importChoice === 'linear' || importChoice === 'jira') {
      navigate(`/import?source=${importChoice}`)
      onComplete()
      return
    }
    goNextFrom('import')
  }

  const handleThemeComplete = () => {
    posthog.capture('onboarding_theme_chosen', { theme: themeName })
    dispatch({ type: 'SET_STEP', step: 'complete', direction: 1 })
  }

  const handleKeepDefault = () => {
    dispatch({ type: 'SET_STEP', step: 'complete', direction: 1 })
  }

  const handleSkipOnboarding = () => {
    onComplete()
  }

  // Boot animation on completion
  useEffect(() => {
    if (currentStep !== 'complete') {
      dispatch({ type: 'RESET_BOOT' })
      return
    }
    const timers = scheduleBootTimers(dispatch, onComplete)
    return () => timers.forEach(clearTimeout)
  }, [currentStep, onComplete])

  // Progress indicator
  const totalSteps = STEP_ORDER.length
  const stepIndex = currentStep === 'complete' ? totalSteps : STEP_ORDER.indexOf(currentStep as Exclude<OnboardingStep, 'complete'>)
  const stepLabel = STEP_LABELS[currentStep]

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
      title={STEP_TITLES[currentStep]}
      size="lg"
      showCloseButton={true}
    >
      <div className="space-y-[12px]">
        <TerminalProgress stepIndex={stepIndex} totalSteps={totalSteps} stepLabel={stepLabel} />

        <AnimatePresence mode="wait" custom={direction}>
          {currentStep === 'aha' && (
            <AhaStep
              direction={direction}
              onBegin={handleAhaBegin}
              onSkipDemo={handleAhaSkipDemo}
            />
          )}

          {currentStep === 'intent' && (
            <IntentStep
              direction={direction}
              intents={intents}
              onToggle={(id) => dispatch({ type: 'TOGGLE_INTENT', value: id })}
              onBack={() => goBackFrom('intent')}
              onNext={handleIntentNext}
            />
          )}

          {currentStep === 'team' && (
            <TeamStep
              direction={direction}
              teamSize={teamSize}
              onSelect={(s) => dispatch({ type: 'SET_TEAM_SIZE', value: s })}
              onBack={() => goBackFrom('team')}
              onNext={handleTeamNext}
            />
          )}

          {currentStep === 'projection' && (
            <ProjectionStep
              direction={direction}
              projection={projection}
              onBack={() => goBackFrom('projection')}
              onNext={handleProjectionNext}
            />
          )}

          {currentStep === 'ai' && (
            <AIStep
              direction={direction}
              aiSetupChoice={aiSetupChoice}
              apiKey={apiKey}
              isValidating={isValidating}
              recommended={recommendedTier}
              dispatch={dispatch}
              onBack={() => goBackFrom('ai')}
              onAIComplete={handleAIComplete}
            />
          )}

          {currentStep === 'import' && (
            <ImportStep
              direction={direction}
              importChoice={importChoice}
              highlightedSource={highlightedSource}
              dispatch={dispatch}
              onBack={() => goBackFrom('import')}
              onImportComplete={handleImportComplete}
            />
          )}

          {currentStep === 'theme' && (
            <ThemeStep
              direction={direction}
              themeName={themeName}
              themeDescription={themeDescription}
              onThemeComplete={handleThemeComplete}
              onKeepDefault={handleKeepDefault}
            />
          )}
        </AnimatePresence>
      </div>
    </BrutalModal>
  )
}
