import ErrorBoundary from '@/components/common/ErrorBoundary'
import { useEffect, useState, useRef, useMemo } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { toast } from 'react-hot-toast'
import { Link } from 'react-router-dom'
import PublicNavigation from '@/components/common/PublicNavigation'
import Footer from '@/components/common/Footer'
import WaitlistForm from '@/components/landing/WaitlistForm'
import LoadingSpinner from '@/components/common/LoadingSpinner'

// ── Radar ping component ──
function RadarPing() {
  return (
    <div className="relative w-[200px] h-[200px] sm:w-[260px] sm:h-[260px]">
      {/* Concentric rings */}
      {[1, 2, 3, 4].map((ring) => (
        <div
          key={ring}
          className="absolute inset-0 border border-[var(--theme-primary)]/10 rounded-full"
          style={{
            transform: `scale(${ring * 0.25})`,
          }}
        />
      ))}

      {/* Sweeping arm */}
      <div
        className="absolute top-1/2 left-1/2 w-1/2 h-[1px] origin-left"
        style={{
          background: 'linear-gradient(90deg, var(--theme-primary) 0%, transparent 100%)',
          animation: 'radarSweep 3s linear infinite',
        }}
      />

      {/* Sweep trail */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'conic-gradient(from 0deg, transparent 0deg, rgba(99,102,241,0.06) 0deg, transparent 60deg)',
          animation: 'radarSweep 3s linear infinite',
        }}
      />

      {/* Center dot */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-2 h-2 bg-[var(--theme-primary)] rounded-full" />
        <div className="absolute inset-0 w-2 h-2 bg-[var(--theme-primary)] rounded-full animate-ping opacity-40" />
      </div>

      {/* Blips — fake signals on the radar */}
      {[
        { x: 30, y: 25, delay: 0.5 },
        { x: 70, y: 40, delay: 1.2 },
        { x: 55, y: 75, delay: 2.0 },
        { x: 20, y: 60, delay: 0.8 },
        { x: 80, y: 70, delay: 1.8 },
      ].map((blip) => (
        <div
          key={`${blip.x}-${blip.y}`}
          className="absolute w-1.5 h-1.5 rounded-full bg-[var(--theme-success)]"
          style={{
            left: `${blip.x}%`,
            top: `${blip.y}%`,
            animation: `radarBlip 3s ease-in-out ${blip.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

// ── Progress bar segments ──
function BuildProgress() {
  const stages = [
    { label: 'FOUNDATION', pct: 100, color: 'var(--theme-success)' },
    { label: 'CORE ENGINE', pct: 100, color: 'var(--theme-success)' },
    { label: 'FEATURES', pct: 85, color: 'var(--theme-primary)' },
    { label: 'POLISH', pct: 40, color: 'var(--theme-warning)' },
    { label: 'LAUNCH', pct: 5, color: 'var(--theme-error)' },
  ]

  return (
    <div className="space-y-2.5 w-full">
      {stages.map((stage) => (
        <div key={stage.label}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-foreground-secondary)] uppercase tracking-wider">
              {stage.label}
            </span>
            <span className="font-['IBM_Plex_Mono',monospace] text-[10px]" style={{ color: stage.color }}>
              {stage.pct}%
            </span>
          </div>
          <div className="h-1.5 bg-[var(--theme-background-tertiary)] border border-[var(--theme-border)] overflow-hidden">
            <div
              className="h-full transition-all duration-1000 ease-out"
              style={{
                width: `${stage.pct}%`,
                backgroundColor: stage.color,
                boxShadow: `0 0 8px ${stage.color}40`,
                animation: `progressFill 1.5s ease-out ${i * 0.15}s both`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Live log feed ──
function LiveLog() {
  const [lines, setLines] = useState<Array<{ text: string; color: string; time: string }>>([])
  const logRef = useRef<HTMLDivElement>(null)

  const logMessages = useMemo(() => [
    { text: 'Compiling feature modules...', color: 'var(--theme-foreground-secondary)' },
    { text: '[OK] Dashboard engine initialized', color: 'var(--theme-success)' },
    { text: 'Running integration tests... 847/847 passed', color: 'var(--theme-success)' },
    { text: '[WARN] Launch sequence pending approval', color: 'var(--theme-warning)' },
    { text: 'Optimizing query performance...', color: 'var(--theme-foreground-secondary)' },
    { text: '[OK] Real-time sync layer active', color: 'var(--theme-success)' },
    { text: 'Building sprint analytics module...', color: 'var(--theme-primary)' },
    { text: '[OK] Workspace isolation verified', color: 'var(--theme-success)' },
    { text: 'Deploying collaboration engine...', color: 'var(--theme-foreground-secondary)' },
    { text: '[OK] GitHub integration connected', color: 'var(--theme-success)' },
    { text: '[WARN] Rate limiter calibrating', color: 'var(--theme-warning)' },
    { text: 'Preparing AI task routing...', color: 'var(--theme-primary)' },
    { text: '[OK] Encryption layer verified', color: 'var(--theme-success)' },
    { text: 'Loading team management module...', color: 'var(--theme-foreground-secondary)' },
    { text: '[OK] Permission system initialized', color: 'var(--theme-success)' },
    { text: 'Stress testing concurrent sessions...', color: 'var(--theme-primary)' },
  ], [])

  useEffect(() => {
    let idx = 0
    const interval = setInterval(() => {
      const msg = logMessages[idx % logMessages.length]
      const now = new Date()
      const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`

      setLines((prev) => {
        const next = [...prev, { ...msg, time }]
        return next.length > 8 ? next.slice(-8) : next
      })
      idx++
    }, 2800)

    return () => clearInterval(interval)
  }, [logMessages])

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [lines])

  return (
    <div
      ref={logRef}
      className="h-[180px] overflow-hidden font-['IBM_Plex_Mono',monospace] text-[10px] sm:text-[11px] leading-relaxed space-y-0.5"
    >
      {lines.map((line, i) => (
        <div
          key={`${line.time}-${line.text}`}
          className="flex gap-2"
          style={{
            animation: 'logFadeIn 0.3s ease-out',
            opacity: i < lines.length - 6 ? 0.4 : 1,
          }}
        >
          <span className="text-[var(--theme-foreground-tertiary)]/50 shrink-0">{line.time}</span>
          <span style={{ color: line.color }}>{line.text}</span>
        </div>
      ))}
      <div className="flex items-center gap-1 text-[var(--theme-foreground-tertiary)]/40">
        <span className="inline-block w-1.5 h-3 bg-[var(--theme-primary)] animate-pulse" />
      </div>
    </div>
  )
}

// ── Sub-components ──

interface HeroSectionProps {
  stats: { totalCount: number } | undefined
  handleBoost: () => void
}

function HeroSection({ stats, handleBoost }: HeroSectionProps) {
  return (
    <section className="px-6 pt-20 pb-16 sm:pt-28 sm:pb-20">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left: Text */}
          <div className="flex-1 text-center lg:text-left">
            {/* Status badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)] mb-6">
              <div className="w-1.5 h-1.5 bg-[var(--theme-warning)] animate-pulse" />
              <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-warning)] uppercase tracking-widest font-semibold">
                Building in progress
              </span>
            </div>

            <h1 className="font-['Inter',sans-serif] font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-[var(--theme-foreground)] leading-[1.1] mb-5">
              Something big is
              <br />
              <span className="text-[var(--theme-primary)]">loading</span>
            </h1>

            <p className="font-['Inter',sans-serif] text-base sm:text-lg text-[var(--theme-foreground-secondary)] max-w-md mx-auto lg:mx-0 mb-8 leading-relaxed">
              We&apos;re engineering the next evolution of project management.
              Built by devs, for devs. No fluff, no noise.
            </p>

            {/* Waitlist count */}
            <div className="flex items-center gap-4 justify-center lg:justify-start mb-8">
              <div className="flex items-center gap-2">
                <span className="font-['IBM_Plex_Mono',monospace] text-[28px] sm:text-[36px] font-bold text-[var(--theme-primary)]">
                  {stats ? stats.totalCount.toLocaleString() : '—'}
                </span>
                <div className="text-left">
                  <div className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-foreground-tertiary)] uppercase tracking-wider">
                    developers
                  </div>
                  <div className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-foreground-tertiary)] uppercase tracking-wider">
                    waiting
                  </div>
                </div>
              </div>
              <div className="w-px h-10 bg-[var(--theme-border)]" />
              <button
                onClick={handleBoost}
                className="flex items-center gap-2 px-4 py-2.5 border-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)] hover:border-[var(--theme-border-hover)] hover:bg-[var(--theme-background-tertiary)] transition-all duration-150 group"
              >
                <span className="font-['IBM_Plex_Mono',monospace] text-[18px] group-hover:scale-110 transition-transform duration-150">
                  +1
                </span>
                <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-foreground-secondary)] uppercase tracking-wider group-hover:text-[var(--theme-primary)] transition-colors duration-150">
                  Boost
                </span>
              </button>
            </div>

            {/* Email form */}
            <div className="max-w-md mx-auto lg:mx-0">
              <WaitlistForm source="coming_soon" />
            </div>
          </div>

          {/* Right: Radar */}
          <div className="shrink-0 flex items-center justify-center">
            <RadarPing />
          </div>
        </div>
      </div>
    </section>
  )
}

interface ModuleItem {
  tag: string
  title: string
  desc: string
  status: string
  color: string
}

interface ModulesSectionProps {
  modules: ModuleItem[]
}

function ModulesSection({ modules }: ModulesSectionProps) {
  return (
    <section className="px-6 pb-16 sm:pb-24">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-primary)] uppercase tracking-widest font-semibold">
            Modules
          </span>
          <h2 className="font-['Inter',sans-serif] font-bold text-2xl sm:text-3xl text-[var(--theme-foreground)] mt-2">
            What&apos;s in the pipeline
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {modules.map((item) => (
            <div
              key={item.title}
              className="bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] p-4 hover:border-[var(--theme-border-hover)]/50 transition-colors duration-200 group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-['IBM_Plex_Mono',monospace] text-[9px] text-[var(--theme-foreground-tertiary)] uppercase tracking-widest">
                  {item.tag}
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span
                    className="font-['IBM_Plex_Mono',monospace] text-[9px] uppercase tracking-wider font-semibold"
                    style={{ color: item.color }}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
              <h3 className="font-['Inter',sans-serif] font-semibold text-[15px] text-[var(--theme-foreground)] mb-1.5 group-hover:text-[var(--theme-primary)] transition-colors duration-200">
                {item.title}
              </h3>
              <p className="font-['Inter',sans-serif] text-[13px] text-[var(--theme-foreground-tertiary)] leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function BottomCTASection() {
  return (
    <section className="px-6 pb-20 sm:pb-28">
      <div className="max-w-xl mx-auto text-center">
        <div className="bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] shadow-[4px_4px_0px_rgba(0,0,0,0.5)] p-6 sm:p-8">
          <div className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-primary)] uppercase tracking-widest font-semibold mb-3">
            Don&apos;t miss launch
          </div>
          <h3 className="font-['Inter',sans-serif] font-bold text-xl sm:text-2xl text-[var(--theme-foreground)] mb-2">
            Get early access
          </h3>
          <p className="font-['Inter',sans-serif] text-sm text-[var(--theme-foreground-tertiary)] mb-6">
            First 100 users get Pro free for 3 months.
          </p>

          <div className="max-w-sm mx-auto mb-4">
            <WaitlistForm source="coming_soon" compact />
          </div>

          <div className="flex items-center justify-center gap-4 text-[11px] font-['IBM_Plex_Mono',monospace]">
            <Link
              to="/pricing"
              className="text-[var(--theme-foreground-tertiary)] hover:text-[var(--theme-primary)] transition-colors uppercase tracking-wider"
            >
              Pricing
            </Link>
            <span className="text-[var(--theme-border)]">|</span>
            <Link
              to="/features"
              className="text-[var(--theme-foreground-tertiary)] hover:text-[var(--theme-primary)] transition-colors uppercase tracking-wider"
            >
              Features
            </Link>
            <span className="text-[var(--theme-border)]">|</span>
            <a
              href="https://discord.gg/jWMS6Pcr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--theme-foreground-tertiary)] hover:text-[var(--theme-primary)] transition-colors uppercase tracking-wider"
            >
              Discord
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Main page ──
export default function ComingSoonPage() {
  const stats = useQuery(api.waitlist.getWaitlistStats)
  const addToWishlist = useMutation(api.waitlist.addToWishlist)
  const [fingerprint, setFingerprint] = useState<string>('')

  useEffect(() => {
    let fp = localStorage.getItem('ltf1_fingerprint')
    if (!fp) {
      fp = crypto.randomUUID()
      localStorage.setItem('ltf1_fingerprint', fp)
    }
    setFingerprint(fp)
  }, [])

  if (stats === undefined) {
    return <LoadingSpinner size="lg" />
  }

  const handleBoost = async () => {
    try {
      const success = await addToWishlist({ fingerprint })
      toast.custom(
        () => (
          <div
            className="font-['IBM_Plex_Mono',monospace] text-[12px] px-4 py-3 border-2 shadow-[3px_3px_0px_rgba(0,0,0,0.5)]"
            style={{
              backgroundColor: 'var(--theme-background-secondary)',
              borderColor: success ? 'var(--theme-success)' : 'var(--theme-primary)',
              color: success ? 'var(--theme-success)' : 'var(--theme-primary)',
            }}
          >
            {success ? '> Signal accepted. You are on the radar.' : '> Signal already recorded.'}
          </div>
        ),
        { duration: 3000 }
      )
    } catch {
      // ignore
    }
  }

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-[var(--theme-background)] flex flex-col relative overflow-hidden">
      <PublicNavigation />

      {/* Subtle dot grid background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--theme-primary) 0.5px, transparent 0.5px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="flex-1 relative z-10">
        <HeroSection stats={stats} handleBoost={handleBoost} />

        {/* ── DASHBOARD: Build status + Live log ── */}
        <section className="px-6 pb-16 sm:pb-24">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Build status card */}
              <div className="bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] shadow-[4px_4px_0px_rgba(0,0,0,0.5)]">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--theme-border)]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[var(--theme-primary)]" />
                    <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-foreground-secondary)] uppercase tracking-wider font-semibold">
                      Build Status
                    </span>
                  </div>
                  <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-success)] uppercase tracking-wider">
                    Active
                  </span>
                </div>
                <div className="p-4">
                  <BuildProgress />
                </div>
              </div>

              {/* Live log card */}
              <div className="bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] shadow-[4px_4px_0px_rgba(0,0,0,0.5)]">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--theme-border)]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[var(--theme-success)] animate-pulse" />
                    <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-foreground-secondary)] uppercase tracking-wider font-semibold">
                      Live Build Log
                    </span>
                  </div>
                  <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-foreground-tertiary)] uppercase tracking-wider">
                    stdout
                  </span>
                </div>
                <div className="p-4">
                  <LiveLog />
                </div>
              </div>
            </div>
          </div>
        </section>

        <ModulesSection modules={[
          { tag: 'CORE', title: 'Sprint Engine', desc: 'Velocity tracking, burndown charts, and automated sprint planning.', status: 'live', color: 'var(--theme-success)' },
          { tag: 'CORE', title: 'Real-time Boards', desc: 'Kanban and whiteboard views with live multiplayer cursors.', status: 'live', color: 'var(--theme-success)' },
          { tag: 'AI', title: 'AI Task Routing', desc: 'Intelligent assignment based on skills, capacity, and context.', status: 'beta', color: 'var(--theme-primary)' },
          { tag: 'INTEGRATION', title: 'GitHub Sync', desc: 'Bi-directional issue sync, PR tracking, and commit mapping.', status: 'live', color: 'var(--theme-success)' },
          { tag: 'TEAM', title: 'Team Analytics', desc: 'Workload distribution, bottleneck detection, and health scores.', status: 'building', color: 'var(--theme-warning)' },
          { tag: 'PLATFORM', title: 'CLI & API', desc: 'Full API access and a terminal-native CLI for power users.', status: 'planned', color: 'var(--theme-error)' },
        ]} />

        <BottomCTASection />
      </div>

      <Footer />

      {/* Keyframes */}
      <style>{`
        @keyframes radarSweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes radarBlip {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          15%, 50% { opacity: 1; transform: scale(1); }
          80% { opacity: 0; transform: scale(0.5); }
        }
        @keyframes progressFill {
          from { width: 0%; }
        }
        @keyframes logFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
    </ErrorBoundary>
  )
}
