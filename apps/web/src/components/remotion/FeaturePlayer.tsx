import { lazy, Suspense } from 'react'
import { Player } from '@remotion/player'
import type { ComponentType } from 'react'

const compositions: Record<string, {
  component: ComponentType
  durationInFrames: number
  fps: number
}> = {
  'pr-driven-updates': {
    component: lazy(() => import('./features/PRDrivenAnimation')),
    durationInFrames: 300,
    fps: 30,
  },
  'git-based-velocity': {
    component: lazy(() => import('./features/VelocityAnimation')),
    durationInFrames: 300,
    fps: 30,
  },
  'code-complexity-estimates': {
    component: lazy(() => import('./features/ComplexityEstimateAnimation')),
    durationInFrames: 300,
    fps: 30,
  },
  'tech-debt-surfacing': {
    component: lazy(() => import('./features/TechDebtAnimation')),
    durationInFrames: 300,
    fps: 30,
  },
  'sprint-planning': {
    component: lazy(() => import('./features/SprintPlanningAnimation')),
    durationInFrames: 300,
    fps: 30,
  },
  'team-management': {
    component: lazy(() => import('./features/TeamManagementAnimation')),
    durationInFrames: 300,
    fps: 30,
  },
  'terminal-first': {
    component: lazy(() => import('./features/TerminalFirstAnimation')),
    durationInFrames: 300,
    fps: 30,
  },
  'open-source': {
    component: lazy(() => import('./features/OpenSourceAnimation')),
    durationInFrames: 300,
    fps: 30,
  },
}

interface FeaturePlayerProps {
  slug: string
  className?: string
}

export default function FeaturePlayer({ slug, className = '' }: FeaturePlayerProps) {
  const config = compositions[slug]
  if (!config) return null

  return (
    <Suspense
      fallback={
        <div
          className={`bg-[#0A0A0A] border-2 border-[#2E2E35] flex items-center justify-center ${className}`}
          style={{ aspectRatio: '16/9' }}
        >
          <span className="text-[10px] font-mono text-[#6B7280] uppercase tracking-wider animate-pulse">
            Loading...
          </span>
        </div>
      }
    >
      <div className={`border-2 border-[#2E2E35] overflow-hidden ${className}`}>
        <Player
          component={config.component}
          compositionWidth={960}
          compositionHeight={540}
          durationInFrames={config.durationInFrames}
          fps={config.fps}
          loop
          autoPlay
          style={{
            width: '100%',
          }}
          controls={false}
        />
      </div>
    </Suspense>
  )
}
