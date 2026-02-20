import { useReducer } from 'react'
import BrutalButton from '../components/ui/BrutalButton'
import BrutalCard from '../components/ui/BrutalCard'
import BrutalBadge from '../components/ui/BrutalBadge'
import BrutalToggle from '../components/ui/BrutalToggle'
import BrutalAvatar from '../components/ui/BrutalAvatar'
import BrutalCheckbox from '../components/ui/BrutalCheckbox'
import BrutalProgress from '../components/ui/BrutalProgress'
import BrutalSlider from '../components/ui/BrutalSlider'
import BrutalInput from '../components/ui/BrutalInput'
import BrutalSelect from '../components/ui/BrutalSelect'
import BrutalModal from '../components/ui/BrutalModal'
import BrutalTooltip from '../components/ui/BrutalTooltip'
import BrutalNotification from '../components/ui/BrutalNotification'
import BrutalTable from '../components/ui/BrutalTable'
import MultiSelect from '../components/ui/MultiSelect'

// ─────────────────────────────────────────────
// Section heading helper
// ─────────────────────────────────────────────
function SectionHeading({ id, label }: { id: string; label: string }) {
  return (
    <div id={id} className="scroll-mt-6 mb-6">
      <div className="flex items-center gap-3 mb-1">
        <span className="font-mono text-[10px] text-[var(--theme-primary)] uppercase tracking-widest">§</span>
        <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-[var(--theme-foreground)]/40">
          {label}
        </h2>
      </div>
      <div className="h-px bg-[var(--theme-border)]" />
    </div>
  )
}

function SubHeading({ label }: { label: string }) {
  return (
    <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--theme-foreground)]/50 mb-3 mt-6 first:mt-0">
      {label}
    </h3>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--theme-foreground)]/30 block mb-1">
      {children}
    </span>
  )
}

function DemoBlock({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-4 border border-[var(--theme-border)] bg-[var(--theme-background-secondary)]/30 ${className}`}>
      {children}
    </div>
  )
}

function CodeTag({ children }: { children: string }) {
  return (
    <code className="text-[9px] font-mono bg-[var(--theme-background)] border border-[var(--theme-border)] px-1 py-0.5 text-[var(--theme-info)]">
      {children}
    </code>
  )
}

// ─────────────────────────────────────────────
// Sidebar nav
// ─────────────────────────────────────────────
const SECTIONS = [
  { id: 'colors', label: 'Colors' },
  { id: 'typography', label: 'Typography' },
  { id: 'spacing', label: 'Spacing' },
  { id: 'shadows', label: 'Shadows & Borders' },
  { id: 'animations', label: 'Animations' },
  { id: 'buttons', label: 'Buttons' },
  { id: 'inputs', label: 'Inputs' },
  { id: 'select', label: 'Select' },
  { id: 'multiselect', label: 'MultiSelect' },
  { id: 'cards', label: 'Cards' },
  { id: 'badges', label: 'Badges' },
  { id: 'avatars', label: 'Avatars' },
  { id: 'checkboxes', label: 'Checkboxes' },
  { id: 'toggles', label: 'Toggles' },
  { id: 'progress', label: 'Progress' },
  { id: 'sliders', label: 'Sliders' },
  { id: 'table', label: 'Table' },
  { id: 'modals', label: 'Modals' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'tooltips', label: 'Tooltips' },
  { id: 'themes', label: 'Themes' },
]

// ─────────────────────────────────────────────
// Data for Table demo
// ─────────────────────────────────────────────
const TABLE_DATA = [
  { id: '1', name: 'TaskForce Alpha', status: 'ACTIVE', priority: 'HIGH', score: 98 },
  { id: '2', name: 'Operation Beta', status: 'PENDING', priority: 'MEDIUM', score: 72 },
  { id: '3', name: 'Project Gamma', status: 'BLOCKED', priority: 'LOW', score: 41 },
  { id: '4', name: 'Initiative Delta', status: 'DONE', priority: 'HIGH', score: 100 },
]

const TABLE_COLUMNS = [
  { key: 'name', header: 'NAME', accessor: (row: (typeof TABLE_DATA)[0]) => row.name },
  {
    key: 'status', header: 'STATUS', accessor: (row: (typeof TABLE_DATA)[0]) => (
      <span className={`font-mono text-[10px] font-bold ${
        row.status === 'ACTIVE' ? 'text-[var(--theme-success)]' :
        row.status === 'BLOCKED' ? 'text-[var(--theme-error)]' :
        row.status === 'DONE' ? 'text-[var(--theme-info)]' :
        'text-[var(--theme-warning)]'
      }`}>{row.status}</span>
    )
  },
  { key: 'priority', header: 'PRIORITY', accessor: (row: (typeof TABLE_DATA)[0]) => row.priority },
  { key: 'score', header: 'SCORE', accessor: (row: (typeof TABLE_DATA)[0]) => `${row.score}%`, align: 'right' as const },
]

// ─────────────────────────────────────────────
// Color swatches
// ─────────────────────────────────────────────
const COLOR_TOKENS = [
  { name: 'background', var: '--theme-background' },
  { name: 'background-secondary', var: '--theme-background-secondary' },
  { name: 'background-tertiary', var: '--theme-background-tertiary' },
  { name: 'foreground', var: '--theme-foreground' },
  { name: 'foreground/60', var: '--theme-foreground', alpha: '60' },
  { name: 'foreground/30', var: '--theme-foreground', alpha: '30' },
  { name: 'primary', var: '--theme-primary' },
  { name: 'success', var: '--theme-success' },
  { name: 'error', var: '--theme-error' },
  { name: 'warning', var: '--theme-warning' },
  { name: 'info', var: '--theme-info' },
  { name: 'border', var: '--theme-border' },
  { name: 'hover', var: '--theme-hover' },
]

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
type DemoState = {
  toggle1: boolean
  toggle2: boolean
  toggle3: boolean
  check1: boolean
  check2: boolean
  check3: boolean
  sliderVal: number
  modalOpen: boolean
  modalSize: 'sm' | 'md' | 'lg' | 'xl'
  multiVal: string[]
  activeSection: string
}

type DemoAction =
  | { type: 'SET_TOGGLE1'; value: boolean }
  | { type: 'SET_TOGGLE2'; value: boolean }
  | { type: 'SET_TOGGLE3'; value: boolean }
  | { type: 'SET_CHECK1'; value: boolean }
  | { type: 'SET_CHECK2'; value: boolean }
  | { type: 'SET_CHECK3'; value: boolean }
  | { type: 'SET_SLIDER'; value: number }
  | { type: 'OPEN_MODAL'; size: 'sm' | 'md' | 'lg' | 'xl' }
  | { type: 'CLOSE_MODAL' }
  | { type: 'SET_MULTI'; value: string[] }
  | { type: 'SET_SECTION'; value: string }

const initialDemoState: DemoState = {
  toggle1: true, toggle2: false, toggle3: true,
  check1: true, check2: false, check3: true,
  sliderVal: 60,
  modalOpen: false, modalSize: 'md',
  multiVal: ['react', 'typescript'],
  activeSection: 'colors',
}

function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case 'SET_TOGGLE1': return { ...state, toggle1: action.value }
    case 'SET_TOGGLE2': return { ...state, toggle2: action.value }
    case 'SET_TOGGLE3': return { ...state, toggle3: action.value }
    case 'SET_CHECK1': return { ...state, check1: action.value }
    case 'SET_CHECK2': return { ...state, check2: action.value }
    case 'SET_CHECK3': return { ...state, check3: action.value }
    case 'SET_SLIDER': return { ...state, sliderVal: action.value }
    case 'OPEN_MODAL': return { ...state, modalOpen: true, modalSize: action.size }
    case 'CLOSE_MODAL': return { ...state, modalOpen: false }
    case 'SET_MULTI': return { ...state, multiVal: action.value }
    case 'SET_SECTION': return { ...state, activeSection: action.value }
    default: return state
  }
}

export default function DesignReferencePage() {
  const [state, dispatch] = useReducer(demoReducer, initialDemoState)
  const { toggle1, toggle2, toggle3, check1, check2, check3, sliderVal, modalOpen, modalSize, multiVal, activeSection } = state

  const openModal = (size: 'sm' | 'md' | 'lg' | 'xl') => {
    dispatch({ type: 'OPEN_MODAL', size })
  }

  return (
    <div className="flex min-h-screen bg-[var(--theme-background)]">
      {/* ── Sticky Sidebar ─────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-44 shrink-0 sticky top-0 h-screen overflow-y-auto border-r-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)]/50 py-4">
        <div className="px-3 mb-4">
          <div className="font-mono text-[9px] uppercase tracking-widest text-[var(--theme-primary)] font-bold">
            DESIGN MUSEUM
          </div>
          <div className="font-mono text-[9px] text-[var(--theme-foreground)]/30 mt-0.5">
            EVERY COMPONENT
          </div>
        </div>
        <nav className="flex-1 px-2">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={() => dispatch({ type: 'SET_SECTION', value: s.id })}
              className={`block px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                activeSection === s.id
                  ? 'text-[var(--theme-primary)] bg-[var(--theme-primary)]/10'
                  : 'text-[var(--theme-foreground)]/50 hover:text-[var(--theme-foreground)] hover:bg-[var(--theme-hover)]'
              }`}
            >
              {s.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* ── Main Content ───────────────────────────────── */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-8 space-y-16">

        {/* PAGE HEADER */}
        <div className="border-b-4 border-[var(--theme-primary)] pb-6">
          <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--theme-foreground)]/40 mb-2">
            LTF1 / ICEBERG
          </div>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-[var(--theme-foreground)] mb-2">
            Design Museum
          </h1>
          <p className="font-mono text-sm text-[var(--theme-foreground)]/50">
            Every component, every variant, every token — in one place.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <BrutalBadge variant="default" size="xs">IBM PLEX MONO</BrutalBadge>
            <BrutalBadge variant="info" size="xs">CSS VARIABLES</BrutalBadge>
            <BrutalBadge variant="success" size="xs">TAILWIND</BrutalBadge>
            <BrutalBadge variant="warning" size="xs">FRAMER MOTION</BrutalBadge>
            <BrutalBadge variant="error" size="xs">BRUTALIST</BrutalBadge>
          </div>
        </div>

        {/* ═══════════════════════════════════════
            § COLORS
        ═══════════════════════════════════════ */}
        <section>
          <SectionHeading id="colors" label="Color Tokens" />
          <SubHeading label="Semantic Palette" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {COLOR_TOKENS.map((c) => (
              <div key={c.name} className="border border-[var(--theme-border)]">
                <div
                  className="h-12"
                  style={{ backgroundColor: c.alpha ? `rgba(var(--${c.var.slice(2)}), 0.${c.alpha})` : `var(${c.var})` }}
                />
                <div className="p-2 bg-[var(--theme-background-secondary)]">
                  <div className="font-mono text-[9px] text-[var(--theme-foreground)] font-bold">{c.name}</div>
                  <div className="font-mono text-[9px] text-[var(--theme-foreground)]/40">{c.var}</div>
                </div>
              </div>
            ))}
          </div>

          <SubHeading label="Gradient" />
          <DemoBlock>
            <div
              className="h-12 w-full"
              style={{ background: 'var(--theme-gradient)' }}
            />
            <Label>--theme-gradient</Label>
            <CodeTag>linear-gradient(90deg, var(--theme-info), var(--theme-warning), var(--theme-primary))</CodeTag>
          </DemoBlock>

          <SubHeading label="Status Colors" />
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Success', color: 'var(--theme-success)', bg: 'var(--theme-success)' },
              { label: 'Error', color: 'var(--theme-error)', bg: 'var(--theme-error)' },
              { label: 'Warning', color: 'var(--theme-warning)', bg: 'var(--theme-warning)' },
              { label: 'Info', color: 'var(--theme-info)', bg: 'var(--theme-info)' },
              { label: 'Primary', color: 'var(--theme-primary)', bg: 'var(--theme-primary)' },
            ].map((s) => (
              <div key={s.label} className="border-2 border-[var(--theme-border)] p-3 flex items-center gap-2">
                <div className="w-4 h-4 border border-[var(--theme-border)]" style={{ backgroundColor: s.bg }} />
                <span className="font-mono text-xs text-[var(--theme-foreground)]" style={{ color: s.color }}>
                  {s.label.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════
            § TYPOGRAPHY
        ═══════════════════════════════════════ */}
        <section>
          <SectionHeading id="typography" label="Typography" />

          <SubHeading label="Font Family" />
          <DemoBlock>
            <p className="font-mono text-lg text-[var(--theme-foreground)]">
              IBM Plex Mono — The voice of the system.
            </p>
            <p className="font-mono text-sm text-[var(--theme-foreground)]/60 mt-1">
              ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789
            </p>
            <Label>font-mono / --theme-font-family</Label>
          </DemoBlock>

          <SubHeading label="Scale — brutal-xs → brutal-2xl" />
          <DemoBlock className="space-y-2">
            {[
              { cls: 'text-brutal-xs', label: 'brutal-xs (10px)' },
              { cls: 'text-brutal-sm', label: 'brutal-sm (12px)' },
              { cls: 'text-brutal-md', label: 'brutal-md (14px)' },
              { cls: 'text-brutal-lg', label: 'brutal-lg (16px)' },
              { cls: 'text-brutal-xl', label: 'brutal-xl (20px)' },
              { cls: 'text-brutal-2xl', label: 'brutal-2xl (24px)' },
            ].map((t) => (
              <div key={t.cls} className="flex items-baseline gap-4">
                <span className={`font-mono font-bold text-[var(--theme-foreground)] ${t.cls}`}>
                  THE SYSTEM IS ONLINE
                </span>
                <span className="font-mono text-[9px] text-[var(--theme-foreground)]/30">{t.label}</span>
              </div>
            ))}
          </DemoBlock>

          <SubHeading label="Hero Scale" />
          <DemoBlock className="space-y-2 overflow-hidden">
            {[
              { cls: 'text-hero-sm', label: 'hero-sm' },
              { cls: 'text-hero-md', label: 'hero-md' },
              { cls: 'text-hero-lg', label: 'hero-lg' },
            ].map((t) => (
              <div key={t.cls} className="flex items-baseline gap-4">
                <span className={`font-mono font-black text-[var(--theme-foreground)] ${t.cls} leading-none`}>
                  LTF1
                </span>
                <span className="font-mono text-[9px] text-[var(--theme-foreground)]/30">{t.label}</span>
              </div>
            ))}
          </DemoBlock>

          <SubHeading label="Weights & Styles" />
          <DemoBlock className="space-y-2">
            {[
              { weight: 'font-normal', label: 'Normal 400' },
              { weight: 'font-medium', label: 'Medium 500' },
              { weight: 'font-semibold', label: 'Semibold 600' },
              { weight: 'font-bold', label: 'Bold 700' },
              { weight: 'font-black', label: 'Black 900' },
            ].map((w) => (
              <div key={w.weight} className="flex items-center gap-4">
                <span className={`font-mono text-sm text-[var(--theme-foreground)] ${w.weight} w-64`}>
                  EXECUTE PROTOCOL ZERO
                </span>
                <span className="font-mono text-[9px] text-[var(--theme-foreground)]/30">{w.label}</span>
              </div>
            ))}
          </DemoBlock>

          <SubHeading label="Letter Spacing" />
          <DemoBlock className="space-y-3">
            {[
              { cls: 'tracking-tight', label: 'tracking-tight' },
              { cls: 'tracking-normal', label: 'tracking-normal' },
              { cls: 'tracking-wide', label: 'tracking-wide' },
              { cls: 'tracking-wider', label: 'tracking-wider' },
              { cls: 'tracking-widest', label: 'tracking-widest' },
            ].map((t) => (
              <div key={t.cls} className="flex items-center gap-4">
                <span className={`font-mono text-xs text-[var(--theme-foreground)] uppercase ${t.cls} w-64`}>
                  SYSTEM READY
                </span>
                <span className="font-mono text-[9px] text-[var(--theme-foreground)]/30">{t.cls}</span>
              </div>
            ))}
          </DemoBlock>
        </section>

        {/* ═══════════════════════════════════════
            § SPACING
        ═══════════════════════════════════════ */}
        <section>
          <SectionHeading id="spacing" label="Spacing & Grid" />
          <SubHeading label="8px Grid System" />
          <DemoBlock className="space-y-3">
            {[1, 2, 3, 4, 6, 8, 10, 12, 16].map((n) => (
              <div key={n} className="flex items-center gap-3">
                <span className="font-mono text-[9px] text-[var(--theme-foreground)]/40 w-8">{n * 4}px</span>
                <div
                  className="h-4 bg-[var(--theme-primary)]/60 border border-[var(--theme-primary)]/30"
                  style={{ width: `${n * 16}px` }}
                />
                <span className="font-mono text-[9px] text-[var(--theme-foreground)]/30">p-{n} / gap-{n}</span>
              </div>
            ))}
          </DemoBlock>

          <SubHeading label="Layout Containers" />
          <DemoBlock className="space-y-2">
            {[
              { label: 'max-w-sm', w: '24rem' },
              { label: 'max-w-md', w: '28rem' },
              { label: 'max-w-lg', w: '32rem' },
              { label: 'max-w-xl', w: '36rem' },
              { label: 'max-w-2xl', w: '42rem' },
              { label: 'max-w-4xl', w: '56rem' },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-3">
                <span className="font-mono text-[9px] text-[var(--theme-foreground)]/40 w-24">{c.w}</span>
                <div
                  className="h-4 bg-[var(--theme-info)]/20 border border-[var(--theme-info)]/30 max-w-full"
                  style={{ width: c.w }}
                />
                <span className="font-mono text-[9px] text-[var(--theme-foreground)]/30">{c.label}</span>
              </div>
            ))}
          </DemoBlock>
        </section>

        {/* ═══════════════════════════════════════
            § SHADOWS & BORDERS
        ═══════════════════════════════════════ */}
        <section>
          <SectionHeading id="shadows" label="Shadows & Borders" />
          <SubHeading label="Box Shadows" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { cls: 'shadow-brutal-sm', label: 'brutal-sm' },
              { cls: 'shadow-brutal-md', label: 'brutal-md' },
              { cls: 'shadow-brutal-lg', label: 'brutal-lg' },
              { cls: 'shadow-brutal-xl', label: 'brutal-xl' },
            ].map((s) => (
              <div key={s.cls} className={`h-16 bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] ${s.cls} flex items-end p-2`}>
                <span className="font-mono text-[9px] text-[var(--theme-foreground)]/50">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {[
              { cls: 'shadow-[var(--theme-box-shadow)]', label: '--theme-box-shadow' },
              { cls: 'shadow-[var(--theme-box-shadow-hover)]', label: '--theme-box-shadow-hover' },
            ].map((s) => (
              <div key={s.cls} className={`h-16 bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] ${s.cls} flex items-end p-2`}>
                <span className="font-mono text-[9px] text-[var(--theme-foreground)]/50">{s.label}</span>
              </div>
            ))}
          </div>

          <SubHeading label="Border Widths" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 4, 8].map((w) => (
              <div
                key={w}
                className="h-12 bg-[var(--theme-background-secondary)] flex items-center justify-center"
                style={{ border: `${w}px solid var(--theme-border)` }}
              >
                <span className="font-mono text-[9px] text-[var(--theme-foreground)]/50">border-{w}</span>
              </div>
            ))}
          </div>

          <SubHeading label="Glow Borders (CSS utilities)" />
          <div className="flex flex-wrap gap-3">
            {[
              { cls: 'glow-border-primary', label: 'glow-primary' },
              { cls: 'glow-border-success', label: 'glow-success' },
              { cls: 'glow-border-error', label: 'glow-error' },
            ].map((g) => (
              <div
                key={g.cls}
                className={`px-4 py-3 border-2 border-[var(--theme-border)] font-mono text-xs text-[var(--theme-foreground)] ${g.cls}`}
              >
                {g.label}
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════
            § ANIMATIONS
        ═══════════════════════════════════════ */}
        <section>
          <SectionHeading id="animations" label="Animations & Keyframes" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { cls: 'animate-brutal-fade', label: 'brutal-fade', demo: 'FADE IN' },
              { cls: 'animate-brutal-pulse', label: 'brutal-pulse', demo: '■ PULSE' },
              { cls: 'animate-spin', label: 'spin', demo: '↻' },
              { cls: 'animate-pulse', label: 'pulse', demo: 'PULSE' },
              { cls: 'animate-bounce', label: 'bounce', demo: '↕ BOUNCE' },
              { cls: 'animate-glitch', label: 'glitch', demo: 'GLITCH' },
              { cls: 'animate-cursor-blink', label: 'cursor-blink', demo: '█' },
            ].map((a) => (
              <DemoBlock key={a.cls} className="flex flex-col items-center gap-2">
                <div className={`font-mono text-sm font-bold text-[var(--theme-primary)] ${a.cls}`}>
                  {a.demo}
                </div>
                <Label>{a.label}</Label>
              </DemoBlock>
            ))}
          </div>

          <SubHeading label="Transition Timing" />
          <DemoBlock className="space-y-3">
            {[
              { cls: 'transition-all duration-150 ease-in-out', label: '150ms ease-in-out' },
              { cls: 'transition-all duration-200 ease-brutal', label: '200ms ease-brutal' },
              { cls: 'transition-all duration-300 ease-in-out', label: '300ms ease-in-out' },
            ].map((t) => (
              <div key={t.label} className="flex items-center gap-4">
                <div
                  className={`w-8 h-8 bg-[var(--theme-primary)] border-2 border-[var(--theme-border)] ${t.cls} hover:translate-x-8 hover:bg-[var(--theme-success)] cursor-pointer`}
                />
                <span className="font-mono text-[10px] text-[var(--theme-foreground)]/50">{t.label} (hover me)</span>
              </div>
            ))}
          </DemoBlock>
        </section>

        {/* ═══════════════════════════════════════
            § BUTTONS
        ═══════════════════════════════════════ */}
        <section>
          <SectionHeading id="buttons" label="Buttons" />

          <SubHeading label="Variants" />
          <DemoBlock className="flex flex-wrap gap-3">
            <BrutalButton variant="primary">Primary</BrutalButton>
            <BrutalButton variant="secondary">Secondary</BrutalButton>
            <BrutalButton variant="ghost">Ghost</BrutalButton>
            <BrutalButton variant="danger">Danger</BrutalButton>
            <BrutalButton variant="glitch">Glitch</BrutalButton>
            <BrutalButton variant="neon">Neon</BrutalButton>
          </DemoBlock>

          <SubHeading label="Sizes" />
          <DemoBlock className="flex flex-wrap items-end gap-3">
            <div className="text-center">
              <BrutalButton variant="primary" size="sm">Small</BrutalButton>
              <Label>sm</Label>
            </div>
            <div className="text-center">
              <BrutalButton variant="primary" size="md">Medium</BrutalButton>
              <Label>md</Label>
            </div>
            <div className="text-center">
              <BrutalButton variant="primary" size="lg">Large</BrutalButton>
              <Label>lg</Label>
            </div>
            <div className="text-center">
              <BrutalButton variant="primary" size="xl">X-Large</BrutalButton>
              <Label>xl</Label>
            </div>
          </DemoBlock>

          <SubHeading label="States" />
          <DemoBlock className="flex flex-wrap gap-3">
            <BrutalButton variant="primary">Default</BrutalButton>
            <BrutalButton variant="primary" loading>Loading</BrutalButton>
            <BrutalButton variant="primary" disabled>Disabled</BrutalButton>
            <BrutalButton variant="secondary" disabled>Disabled Secondary</BrutalButton>
          </DemoBlock>

          <SubHeading label="Full Width" />
          <DemoBlock>
            <BrutalButton variant="primary" fullWidth>Full Width Button</BrutalButton>
            <div className="mt-2">
              <BrutalButton variant="secondary" fullWidth>Full Width Secondary</BrutalButton>
            </div>
          </DemoBlock>

          <SubHeading label="All Variants × All Sizes Matrix" />
          <DemoBlock className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="font-mono text-[9px] text-[var(--theme-foreground)]/40 uppercase text-left pb-2 pr-3 w-24">Variant</th>
                  {(['sm', 'md', 'lg', 'xl'] as const).map(s => (
                    <th key={s} className="font-mono text-[9px] text-[var(--theme-foreground)]/40 uppercase text-left pb-2 pr-3">{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(['primary', 'secondary', 'ghost', 'danger', 'glitch', 'neon'] as const).map(v => (
                  <tr key={v}>
                    <td className="font-mono text-[9px] text-[var(--theme-foreground)]/50 pr-3 py-2 uppercase">{v}</td>
                    {(['sm', 'md', 'lg', 'xl'] as const).map(s => (
                      <td key={s} className="pr-3 py-1">
                        <BrutalButton variant={v} size={s}>{v.charAt(0).toUpperCase() + v.slice(1)}</BrutalButton>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </DemoBlock>
        </section>

        {/* ═══════════════════════════════════════
            § INPUTS
        ═══════════════════════════════════════ */}
        <section>
          <SectionHeading id="inputs" label="Inputs" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <SubHeading label="Default" />
              <DemoBlock>
                <BrutalInput
                  label="Username"
                  placeholder="Enter username..."
                />
              </DemoBlock>
            </div>
            <div>
              <SubHeading label="With Error" />
              <DemoBlock>
                <BrutalInput
                  label="Email Address"
                  placeholder="email@example.com"
                  error="Invalid email format"
                />
              </DemoBlock>
            </div>
            <div>
              <SubHeading label="With Helper Text" />
              <DemoBlock>
                <BrutalInput
                  label="API Key"
                  placeholder="sk-..."
                  helperText="Your key is stored encrypted"
                />
              </DemoBlock>
            </div>
            <div>
              <SubHeading label="Full Width" />
              <DemoBlock>
                <BrutalInput
                  label="Search Query"
                  placeholder="Type to search..."
                  fullWidth
                />
              </DemoBlock>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            § SELECT
        ═══════════════════════════════════════ */}
        <section>
          <SectionHeading id="select" label="Select" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <SubHeading label="Default" />
              <DemoBlock>
                <BrutalSelect
                  label="Priority"
                  options={[
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                    { value: 'critical', label: 'Critical' },
                  ]}
                />
              </DemoBlock>
            </div>
            <div>
              <SubHeading label="With Error" />
              <DemoBlock>
                <BrutalSelect
                  label="Status"
                  error="Please select a status"
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                    { value: 'pending', label: 'Pending' },
                  ]}
                />
              </DemoBlock>
            </div>
            <div>
              <SubHeading label="With Helper Text" />
              <DemoBlock>
                <BrutalSelect
                  label="Theme"
                  helperText="Applied globally across the app"
                  options={[
                    { value: 'obsidian', label: 'Obsidian' },
                    { value: 'nord', label: 'Nord' },
                    { value: 'dracula', label: 'Dracula' },
                    { value: 'gruvbox', label: 'Gruvbox' },
                    { value: 'monokai', label: 'Monokai' },
                    { value: 'cyberpunk', label: 'Cyberpunk' },
                  ]}
                />
              </DemoBlock>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            § MULTISELECT
        ═══════════════════════════════════════ */}
        <section>
          <SectionHeading id="multiselect" label="MultiSelect" />
          <SubHeading label="Interactive" />
          <DemoBlock className="max-w-md">
            <MultiSelect
              options={[
                { value: 'react', label: 'React' },
                { value: 'typescript', label: 'TypeScript' },
                { value: 'convex', label: 'Convex' },
                { value: 'tailwind', label: 'Tailwind' },
                { value: 'vite', label: 'Vite' },
                { value: 'framer', label: 'Framer Motion' },
              ]}
              value={multiVal}
              onChange={(v) => dispatch({ type: 'SET_MULTI', value: v })}
              placeholder="SELECT TECHNOLOGIES"
            />
            <div className="mt-2 font-mono text-[9px] text-[var(--theme-foreground)]/40">
              Selected: [{multiVal.join(', ')}]
            </div>
          </DemoBlock>
        </section>

        {/* ═══════════════════════════════════════
            § CARDS
        ═══════════════════════════════════════ */}
        <section>
          <SectionHeading id="cards" label="Cards" />

          <SubHeading label="Variants" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(['default', 'bordered', 'elevated', 'glitch', 'neon'] as const).map((v) => (
              <div key={v}>
                <Label>{v}</Label>
                <BrutalCard variant={v}>
                  <div className="font-mono text-xs text-[var(--theme-foreground)] font-bold uppercase">{v} Card</div>
                  <p className="font-mono text-[10px] text-[var(--theme-foreground)]/50 mt-1">
                    variant="{v}" — the workhorse of the design system.
                  </p>
                </BrutalCard>
              </div>
            ))}
          </div>

          <SubHeading label="Padding Variants" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['none', 'sm', 'md', 'lg'] as const).map((p) => (
              <div key={p}>
                <Label>padding="{p}"</Label>
                <BrutalCard padding={p}>
                  <div className="font-mono text-[10px] text-[var(--theme-foreground)] bg-[var(--theme-primary)]/10 border border-[var(--theme-primary)]/20 p-1">
                    CONTENT
                  </div>
                </BrutalCard>
              </div>
            ))}
          </div>

          <SubHeading label="Hoverable" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>hoverable (hover me)</Label>
              <BrutalCard hoverable>
                <div className="font-mono text-xs text-[var(--theme-foreground)]">HOVER STATE</div>
                <p className="font-mono text-[10px] text-[var(--theme-foreground)]/50 mt-1">Translates on hover</p>
              </BrutalCard>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            § BADGES
        ═══════════════════════════════════════ */}
        <section>
          <SectionHeading id="badges" label="Badges" />

          <SubHeading label="Variants × Sizes Matrix" />
          <DemoBlock>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="font-mono text-[9px] text-[var(--theme-foreground)]/40 uppercase text-left pb-3 pr-4">Variant</th>
                  {(['xs', 'sm', 'md', 'lg'] as const).map(s => (
                    <th key={s} className="font-mono text-[9px] text-[var(--theme-foreground)]/40 uppercase text-left pb-3 pr-4">{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(['default', 'error', 'success', 'info', 'warning'] as const).map(v => (
                  <tr key={v}>
                    <td className="font-mono text-[9px] text-[var(--theme-foreground)]/50 pr-4 py-2 uppercase">{v}</td>
                    {(['xs', 'sm', 'md', 'lg'] as const).map(s => (
                      <td key={s} className="pr-4 py-2">
                        <BrutalBadge variant={v} size={s}>{v}</BrutalBadge>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </DemoBlock>

          <SubHeading label="Usage Examples" />
          <DemoBlock className="flex flex-wrap gap-2">
            <BrutalBadge variant="success" size="sm">ACTIVE</BrutalBadge>
            <BrutalBadge variant="error" size="sm">CRITICAL</BrutalBadge>
            <BrutalBadge variant="warning" size="sm">REVIEW</BrutalBadge>
            <BrutalBadge variant="info" size="sm">IN PROGRESS</BrutalBadge>
            <BrutalBadge variant="default" size="sm">CLOSED</BrutalBadge>
            <BrutalBadge variant="success" size="xs">v2.4.0</BrutalBadge>
            <BrutalBadge variant="info" size="xs">BETA</BrutalBadge>
            <BrutalBadge variant="error" size="xs">DEPRECATED</BrutalBadge>
          </DemoBlock>
        </section>

        {/* ═══════════════════════════════════════
            § AVATARS
        ═══════════════════════════════════════ */}
        <section>
          <SectionHeading id="avatars" label="Avatars" />

          <SubHeading label="Sizes — Initials Fallback" />
          <DemoBlock className="flex flex-wrap items-end gap-6">
            {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((s) => (
              <div key={s} className="flex flex-col items-center gap-1">
                <BrutalAvatar size={s} name="Alex Morgan" />
                <Label>{s}</Label>
              </div>
            ))}
          </DemoBlock>

          <SubHeading label="Different Names (auto initials)" />
          <DemoBlock className="flex flex-wrap gap-4">
            {[
              'John Doe', 'Alice Smith', 'Bob Johnson', 'Carol Williams', 'Dave Brown',
              'Eve Davis', 'Frank Wilson', 'Grace Lee',
            ].map((name) => (
              <div key={name} className="flex flex-col items-center gap-1">
                <BrutalAvatar size="md" name={name} />
                <span className="font-mono text-[9px] text-[var(--theme-foreground)]/40">{name.split(' ').map(n => n[0]).join('')}</span>
              </div>
            ))}
          </DemoBlock>
        </section>

        {/* ═══════════════════════════════════════
            § CHECKBOXES
        ═══════════════════════════════════════ */}
        <section>
          <SectionHeading id="checkboxes" label="Checkboxes" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <SubHeading label="Variants" />
              <DemoBlock className="space-y-3">
                <BrutalCheckbox
                  checked={check1}
                  onChange={(v) => dispatch({ type: 'SET_CHECK1', value: v })}
                  label="Default variant"
                  variant="default"
                />
                <BrutalCheckbox
                  checked={check2}
                  onChange={(v) => dispatch({ type: 'SET_CHECK2', value: v })}
                  label="Success variant"
                  variant="success"
                  description="Task completed successfully"
                />
                <BrutalCheckbox
                  checked={check3}
                  onChange={(v) => dispatch({ type: 'SET_CHECK3', value: v })}
                  label="Danger variant"
                  variant="danger"
                  description="Destructive action required"
                />
                <BrutalCheckbox
                  checked={false}
                  onChange={() => {}}
                  label="Warning variant"
                  variant="warning"
                />
              </DemoBlock>
            </div>
            <div>
              <SubHeading label="Sizes" />
              <DemoBlock className="space-y-3">
                {(['sm', 'md', 'lg'] as const).map((s) => (
                  <BrutalCheckbox
                    key={s}
                    checked={true}
                    onChange={() => {}}
                    label={`Size: ${s}`}
                    size={s}
                  />
                ))}
                <BrutalCheckbox
                  checked={false}
                  onChange={() => {}}
                  indeterminate
                  label="Indeterminate state"
                />
              </DemoBlock>
            </div>
            <div>
              <SubHeading label="States" />
              <DemoBlock className="space-y-3">
                <BrutalCheckbox checked={true} onChange={() => {}} label="Checked" />
                <BrutalCheckbox checked={false} onChange={() => {}} label="Unchecked" />
                <BrutalCheckbox checked={false} onChange={() => {}} label="Disabled" disabled />
                <BrutalCheckbox checked={true} onChange={() => {}} label="Checked + Disabled" disabled />
                <BrutalCheckbox
                  checked={false}
                  onChange={() => {}}
                  label="With error message"
                  error="This field is required"
                />
              </DemoBlock>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            § TOGGLES
        ═══════════════════════════════════════ */}
        <section>
          <SectionHeading id="toggles" label="Toggles" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <SubHeading label="Sizes (interactive)" />
              <DemoBlock className="space-y-4">
                <BrutalToggle size="sm" checked={toggle1} onChange={(v) => dispatch({ type: 'SET_TOGGLE1', value: v })} label="Small toggle" />
                <BrutalToggle size="md" checked={toggle2} onChange={(v) => dispatch({ type: 'SET_TOGGLE2', value: v })} label="Medium toggle" />
                <BrutalToggle size="lg" checked={toggle3} onChange={(v) => dispatch({ type: 'SET_TOGGLE3', value: v })} label="Large toggle" />
              </DemoBlock>
            </div>
            <div>
              <SubHeading label="States" />
              <DemoBlock className="space-y-4">
                <BrutalToggle checked={true} onChange={() => {}} label="Enabled — ON" />
                <BrutalToggle checked={false} onChange={() => {}} label="Enabled — OFF" />
                <BrutalToggle checked={true} onChange={() => {}} disabled label="Disabled — ON" />
                <BrutalToggle checked={false} onChange={() => {}} disabled label="Disabled — OFF" />
              </DemoBlock>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            § PROGRESS
        ═══════════════════════════════════════ */}
        <section>
          <SectionHeading id="progress" label="Progress" />

          <SubHeading label="Variants" />
          <DemoBlock className="space-y-6">
            <div>
              <Label>default — 75%</Label>
              <BrutalProgress value={75} showLabel />
            </div>
            <div>
              <Label>default — 40%</Label>
              <BrutalProgress value={40} showLabel />
            </div>
            <div>
              <Label>glitch — 60%</Label>
              <BrutalProgress value={60} variant="glitch" showLabel />
            </div>
            <div>
              <Label>no label — 90%</Label>
              <BrutalProgress value={90} />
            </div>
          </DemoBlock>

          <SubHeading label="Values Gallery" />
          <DemoBlock className="space-y-3">
            {[0, 10, 25, 50, 75, 90, 100].map((v) => (
              <div key={v} className="flex items-center gap-4">
                <span className="font-mono text-[10px] text-[var(--theme-foreground)]/40 w-8">{v}%</span>
                <div className="flex-1">
                  <BrutalProgress value={v} />
                </div>
              </div>
            ))}
          </DemoBlock>
        </section>

        {/* ═══════════════════════════════════════
            § SLIDERS
        ═══════════════════════════════════════ */}
        <section>
          <SectionHeading id="sliders" label="Sliders" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <SubHeading label="Interactive" />
              <DemoBlock>
                <BrutalSlider
                  value={sliderVal}
                  onChange={(v) => dispatch({ type: 'SET_SLIDER', value: v })}
                  min={0}
                  max={100}
                  step={1}
                  label="Volume"
                  unit="%"
                  showValue
                />
              </DemoBlock>
            </div>
            <div>
              <SubHeading label="Without Label" />
              <DemoBlock>
                <BrutalSlider
                  value={sliderVal}
                  onChange={(v) => dispatch({ type: 'SET_SLIDER', value: v })}
                  min={0}
                  max={100}
                  step={5}
                  showValue={false}
                />
              </DemoBlock>
            </div>
            <div>
              <SubHeading label="Disabled" />
              <DemoBlock>
                <BrutalSlider
                  value={65}
                  onChange={() => {}}
                  min={0}
                  max={100}
                  label="Opacity"
                  unit="%"
                  disabled
                />
              </DemoBlock>
            </div>
            <div>
              <SubHeading label="Custom Range (0.1 step)" />
              <DemoBlock>
                <BrutalSlider
                  value={1.5}
                  onChange={() => {}}
                  min={0}
                  max={3}
                  step={0.1}
                  label="Speed"
                  unit="x"
                />
              </DemoBlock>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            § TABLE
        ═══════════════════════════════════════ */}
        <section>
          <SectionHeading id="table" label="Table" />

          <SubHeading label="Default" />
          <BrutalTable
            columns={TABLE_COLUMNS}
            data={TABLE_DATA}
            onRowClick={(row) => console.log('Clicked:', row.name)}
          />

          <SubHeading label="Loading State" />
          <BrutalTable
            columns={TABLE_COLUMNS}
            data={[]}
            isLoading
          />

          <SubHeading label="Empty State" />
          <BrutalTable
            columns={TABLE_COLUMNS}
            data={[]}
            emptyMessage="NO DATA FOUND — SYSTEM OFFLINE"
          />
        </section>

        {/* ═══════════════════════════════════════
            § MODALS
        ═══════════════════════════════════════ */}
        <section>
          <SectionHeading id="modals" label="Modals" />

          <SubHeading label="Sizes (click to open)" />
          <DemoBlock className="flex flex-wrap gap-3">
            {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
              <BrutalButton key={size} variant="secondary" onClick={() => openModal(size)}>
                Open {size.toUpperCase()}
              </BrutalButton>
            ))}
          </DemoBlock>

          <SubHeading label="No Header" />
          <DemoBlock>
            <BrutalButton
              variant="ghost"
              onClick={() => dispatch({ type: 'OPEN_MODAL', size: 'sm' })}
            >
              Open Headerless Modal
            </BrutalButton>
          </DemoBlock>

          <BrutalModal
            isOpen={modalOpen}
            onClose={() => dispatch({ type: 'CLOSE_MODAL' })}
            title={`Modal — Size: ${modalSize.toUpperCase()}`}
            size={modalSize}
          >
            <div className="space-y-4">
              <p className="font-mono text-sm text-[var(--theme-foreground)]/70">
                This is a <strong className="text-[var(--theme-primary)]">{modalSize}</strong> modal.
                Press <kbd className="px-1 py-0.5 border border-[var(--theme-border)] text-xs">ESC</kbd> or
                click the backdrop to close.
              </p>
              <div className="p-3 bg-[var(--theme-background)] border border-[var(--theme-border)]">
                <BrutalProgress value={75} showLabel />
              </div>
              <div className="flex justify-end gap-2">
                <BrutalButton variant="ghost" onClick={() => dispatch({ type: 'CLOSE_MODAL' })}>Cancel</BrutalButton>
                <BrutalButton variant="primary" onClick={() => dispatch({ type: 'CLOSE_MODAL' })}>Confirm</BrutalButton>
              </div>
            </div>
          </BrutalModal>
        </section>

        {/* ═══════════════════════════════════════
            § NOTIFICATIONS
        ═══════════════════════════════════════ */}
        <section>
          <SectionHeading id="notifications" label="Notifications" />

          <SubHeading label="All Types" />
          <div className="space-y-3">
            <BrutalNotification
              type="success"
              title="Deployment Successful"
              message="Version 2.4.0 deployed to production without errors."
            />
            <BrutalNotification
              type="error"
              title="Build Failed"
              message="TypeScript errors detected in 3 files. Check console for details."
            />
            <BrutalNotification
              type="warning"
              title="Rate Limit Approaching"
              message="You've used 85% of your API quota for this billing period."
            />
            <BrutalNotification
              type="info"
              title="System Update Available"
              message="LTF1 Iceberg v3.0.0 is ready to install."
            />
          </div>

          <SubHeading label="With Close Button" />
          <div className="space-y-3">
            <BrutalNotification
              type="success"
              title="Task Completed"
              message="Fix authentication bug has been resolved."
              onClose={() => {}}
            />
            <BrutalNotification
              type="info"
              title="No Message Variant"
              onClose={() => {}}
            />
          </div>
        </section>

        {/* ═══════════════════════════════════════
            § TOOLTIPS
        ═══════════════════════════════════════ */}
        <section>
          <SectionHeading id="tooltips" label="Tooltips" />

          <SubHeading label="Positions" />
          <DemoBlock>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8">
              {(['top', 'bottom', 'left', 'right'] as const).map((pos) => (
                <div key={pos} className="flex justify-center">
                  <BrutalTooltip content={`Tooltip — ${pos}`} position={pos}>
                    <BrutalButton variant="secondary" size="sm">{pos.toUpperCase()}</BrutalButton>
                  </BrutalTooltip>
                </div>
              ))}
            </div>
          </DemoBlock>

          <SubHeading label="Inline Usage" />
          <DemoBlock>
            <p className="font-mono text-sm text-[var(--theme-foreground)]">
              Hover over{' '}
              <BrutalTooltip content="This is an inline tooltip with longer content" position="top">
                <span className="text-[var(--theme-primary)] underline cursor-help">this text</span>
              </BrutalTooltip>{' '}
              to see the tooltip appear.
            </p>
          </DemoBlock>

          <SubHeading label="Custom Delay" />
          <DemoBlock className="flex gap-4">
            <BrutalTooltip content="Instant (0ms)" position="top" delay={0}>
              <BrutalButton variant="ghost" size="sm">Instant</BrutalButton>
            </BrutalTooltip>
            <BrutalTooltip content="Default (200ms)" position="top" delay={200}>
              <BrutalButton variant="ghost" size="sm">200ms</BrutalButton>
            </BrutalTooltip>
            <BrutalTooltip content="Slow (800ms)" position="top" delay={800}>
              <BrutalButton variant="ghost" size="sm">800ms</BrutalButton>
            </BrutalTooltip>
          </DemoBlock>
        </section>

        {/* ═══════════════════════════════════════
            § THEMES
        ═══════════════════════════════════════ */}
        <section>
          <SectionHeading id="themes" label="Themes" />
          <SubHeading label="9 Developer Themes" />
          <p className="font-mono text-xs text-[var(--theme-foreground)]/50 mb-4">
            Change theme from{' '}
            <a href="/settings" className="text-[var(--theme-primary)] underline">Settings → Appearance</a>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'OBSIDIAN', bg: '#0B0B0F', fg: '#E4E4E8', accent: '#6366F1', desc: 'LTF1 signature — deep dark indigo' },
              { name: 'VS CODE', bg: '#1E1E1E', fg: '#D4D4D4', accent: '#569CD6', desc: 'The editor that defined a generation' },
              { name: 'DRACULA', bg: '#282A36', fg: '#F8F8F2', accent: '#BD93F9', desc: 'Nocturnal hacker aesthetic' },
              { name: 'GRUVBOX', bg: '#282828', fg: '#EBDBB2', accent: '#FABD2F', desc: 'Retro groove — warm and timeless' },
              { name: 'NORD', bg: '#2E3440', fg: '#D8DEE9', accent: '#88C0D0', desc: 'Arctic minimal — clean northern light' },
              { name: 'MONOKAI', bg: '#272822', fg: '#F8F8F2', accent: '#A6E22E', desc: 'Sublime Text OG — vivid contrast' },
              { name: 'SOLARIZED', bg: '#002B36', fg: '#839496', accent: '#268BD2', desc: 'Scientific precision — eye comfort' },
              { name: 'CYBERPUNK', bg: '#0D001A', fg: '#FF2D78', accent: '#FF2D78', desc: 'Neural interface — digital dystopia' },
              { name: 'BRUTALIST', bg: '#FFFFFF', fg: '#000000', accent: '#FFFF00', desc: 'Raw brutalism — maximum contrast' },
            ].map((theme) => (
              <div
                key={theme.name}
                className="border-2 overflow-hidden"
                style={{ borderColor: theme.accent + '60' }}
              >
                {/* Preview strip */}
                <div className="h-16 flex items-end p-3" style={{ backgroundColor: theme.bg }}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-none" style={{ backgroundColor: theme.accent }} />
                    <span className="font-mono text-[10px] font-bold" style={{ color: theme.fg }}>
                      {theme.name}
                    </span>
                  </div>
                </div>
                {/* Palette dots */}
                <div className="flex" style={{ backgroundColor: theme.bg }}>
                  {[theme.bg, theme.fg, theme.accent, '#22C55E', '#EF4444'].map((c) => (
                    <div key={c} className="flex-1 h-3" style={{ backgroundColor: c }} />
                  ))}
                </div>
                {/* Description */}
                <div className="p-3 bg-[var(--theme-background-secondary)]">
                  <div className="font-mono text-[9px] text-[var(--theme-foreground)]/40">{theme.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <SubHeading label="Current Theme Preview" />
          <DemoBlock>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-[10px]">
              {[
                { label: 'background', val: 'var(--theme-background)' },
                { label: 'foreground', val: 'var(--theme-foreground)' },
                { label: 'primary', val: 'var(--theme-primary)' },
                { label: 'success', val: 'var(--theme-success)' },
                { label: 'error', val: 'var(--theme-error)' },
                { label: 'warning', val: 'var(--theme-warning)' },
                { label: 'info', val: 'var(--theme-info)' },
                { label: 'border', val: 'var(--theme-border)' },
              ].map((t) => (
                <div key={t.label} className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-[var(--theme-border)] flex-shrink-0" style={{ backgroundColor: t.val }} />
                  <div>
                    <div className="text-[var(--theme-foreground)]">{t.label}</div>
                    <div className="text-[var(--theme-foreground)]/30" style={{ color: t.val }}>{t.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </DemoBlock>
        </section>

        {/* ═══════════════════════════════════════
            § CSS UTILITIES (bonus)
        ═══════════════════════════════════════ */}
        <section>
          <SectionHeading id="utilities" label="CSS Utilities" />

          <SubHeading label="Glass Effect (.brutal-glass)" />
          <DemoBlock>
            <div
              className="brutal-glass p-4 font-mono text-sm text-[var(--theme-foreground)]"
              style={{
                backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              Glass morphism effect — subtle translucency
            </div>
          </DemoBlock>

          <SubHeading label="Scanline Overlay" />
          <DemoBlock className="relative overflow-hidden">
            <div className="p-4 font-mono text-sm text-[var(--theme-success)]">
              SYSTEM STATUS: ONLINE // ALL SYSTEMS NOMINAL
            </div>
          </DemoBlock>

          <SubHeading label="Truncation & Overflow Utilities" />
          <DemoBlock className="max-w-xs space-y-2">
            <div className="truncate font-mono text-xs text-[var(--theme-foreground)] border border-[var(--theme-border)] p-2">
              This text is very long and will be truncated with an ellipsis at the end
            </div>
            <div className="line-clamp-2 font-mono text-xs text-[var(--theme-foreground)] border border-[var(--theme-border)] p-2">
              This text spans multiple lines but is clamped to two lines maximum. Any overflow beyond that is hidden with an ellipsis.
            </div>
          </DemoBlock>
        </section>

        {/* Footer */}
        <div className="border-t-2 border-[var(--theme-border)] pt-8 pb-16">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[10px] text-[var(--theme-foreground)]/30 uppercase tracking-widest">
              LTF1 Iceberg — Design Museum
            </div>
            <div className="flex gap-2">
              <BrutalBadge variant="success" size="xs">16 COMPONENTS</BrutalBadge>
              <BrutalBadge variant="info" size="xs">9 THEMES</BrutalBadge>
              <BrutalBadge variant="default" size="xs">∞ VARIANTS</BrutalBadge>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
