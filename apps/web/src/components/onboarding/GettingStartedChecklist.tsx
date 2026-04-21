import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { m, AnimatePresence } from 'framer-motion'
import {
  HiOutlineCheck,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineArrowRight,
} from 'react-icons/hi'
import { FaGithub } from 'react-icons/fa'
import { api } from '../../../../../convex/_generated/api'

const COLLAPSED_KEY = 'ltf1_checklist_collapsed'

interface ChecklistItem {
  id: string
  title: string
  sub: string
  done: boolean
  cta: string
  to: string
  icon?: React.ReactNode
}

/**
 * Persistent Getting Started checklist — the dashboard's "quiet coach".
 * Collapsible to a single-line summary, auto-hides when all five items are
 * done. Each item links out to the page where that setup actually happens
 * instead of opening a blocking wizard modal.
 */
export default function GettingStartedChecklist() {
  // @ts-expect-error Convex deep type instantiation on extended preferences schema
  const status = useQuery(api.onboarding.checklist.getChecklistStatus)
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(COLLAPSED_KEY) === 'true'
  })

  const items = useMemo<Array<ChecklistItem>>(() => {
    if (!status) return []
    const wsFallback = status.firstWorkspaceId ?? null
    const projectRoute =
      wsFallback && status.firstProjectId
        ? `/workspace/${wsFallback}/project/${status.firstProjectId}`
        : wsFallback
        ? `/workspace/${wsFallback}`
        : '/workspaces'

    return [
      {
        id: 'github',
        title: 'CONNECT GITHUB',
        sub: 'Unlocks auto-linking of commits, PRs, and ticket status.',
        done: status.hasGitHub,
        cta: 'CONNECT',
        to: '/settings',
        icon: <FaGithub className="w-4 h-4" />,
      },
      {
        id: 'workspace',
        title: 'CREATE YOUR WORKSPACE',
        sub: 'Replace the demo tour with your real team workspace.',
        done: status.hasWorkspace,
        cta: 'CREATE',
        to: '/workspaces',
      },
      {
        id: 'project',
        title: 'ADD A PROJECT',
        sub: 'Projects hold tasks, sprints, and repo wiring.',
        done: status.hasProject,
        cta: 'ADD',
        to: wsFallback ? `/workspace/${wsFallback}` : '/workspaces',
      },
      {
        id: 'repo',
        title: 'LINK A REPO',
        sub: 'Point a project at a GitHub repo to see the aha moment live.',
        done: status.hasConnectedRepo,
        cta: 'LINK',
        to: projectRoute,
      },
      {
        id: 'teammate',
        title: 'INVITE A TEAMMATE',
        sub: 'LTF1 is sharper with 2+ devs pushing code.',
        done: status.hasTeammate,
        cta: 'INVITE',
        to: wsFallback ? `/workspace/${wsFallback}` : '/workspaces',
      },
    ]
  }, [status])

  if (!status || status.allDone) return null

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(COLLAPSED_KEY, String(next))
      }
      return next
    })
  }

  const progressPct = Math.round((status.completed / status.total) * 100)
  const nextItem = items.find((it) => !it.done)

  return (
    <m.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="mb-3 border-2"
      style={{
        backgroundColor: 'var(--theme-background-secondary)',
        borderColor: 'var(--theme-border)',
        boxShadow: '4px 4px 0 var(--theme-shadow)',
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={toggleCollapsed}
        className="w-full px-3 py-2 border-b-2 flex items-center gap-3 text-left"
        style={{
          backgroundColor: 'var(--theme-background)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <span className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: 'var(--theme-primary)' }} />
        <span
          className="font-mono text-[10px] uppercase tracking-wider"
          style={{ color: 'var(--theme-foreground-secondary)' }}
        >
          GETTING_STARTED.md
        </span>

        {/* Progress block */}
        <div className="ml-auto flex items-center gap-2">
          <span
            className="font-mono text-[10px] uppercase tracking-wider"
            style={{ color: 'var(--theme-foreground)' }}
          >
            {status.completed}/{status.total}
          </span>
          <div
            className="w-24 h-1 border"
            style={{ backgroundColor: 'var(--theme-background-tertiary)', borderColor: 'var(--theme-border)' }}
          >
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${progressPct}%`, backgroundColor: 'var(--theme-primary)' }}
            />
          </div>
          {collapsed ? (
            <HiOutlineChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--theme-foreground-tertiary)' }} />
          ) : (
            <HiOutlineChevronUp className="w-3.5 h-3.5" style={{ color: 'var(--theme-foreground-tertiary)' }} />
          )}
        </div>
      </button>

      {/* Collapsed summary: one-line next-step hint */}
      <AnimatePresence initial={false} mode="wait">
        {collapsed ? (
          nextItem && (
            <m.div
              key="collapsed"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 py-2 flex items-center gap-3">
                <span
                  className="font-mono text-[11px] uppercase tracking-wider"
                  style={{ color: 'var(--theme-foreground-tertiary)' }}
                >
                  NEXT:
                </span>
                <span
                  className="font-mono text-[11px] uppercase tracking-wider"
                  style={{ color: 'var(--theme-foreground)' }}
                >
                  {nextItem.title}
                </span>
                <Link
                  to={nextItem.to}
                  onClick={(e) => e.stopPropagation()}
                  className="ml-auto inline-flex items-center gap-1 px-2 py-1 border-2 font-mono text-[10px] uppercase tracking-wider"
                  style={{
                    borderRadius: '4px',
                    backgroundColor: 'var(--theme-primary)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-background)',
                  }}
                >
                  {nextItem.cta}
                  <HiOutlineArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </m.div>
          )
        ) : (
          <m.div
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <ul className="divide-y-2" style={{ borderColor: 'var(--theme-border)' }}>
              {items.map((item) => (
                <li key={item.id} className="px-3 py-2.5 flex items-center gap-3">
                  <span
                    className="w-4 h-4 border-2 flex items-center justify-center shrink-0"
                    style={{
                      borderColor: item.done ? 'var(--theme-success)' : 'var(--theme-border)',
                      backgroundColor: item.done ? 'var(--theme-success)' : 'transparent',
                    }}
                  >
                    {item.done && (
                      <HiOutlineCheck className="w-3 h-3" style={{ color: 'var(--theme-background)' }} />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {item.icon && (
                        <span style={{ color: item.done ? 'var(--theme-success)' : 'var(--theme-foreground-secondary)' }}>
                          {item.icon}
                        </span>
                      )}
                      <span
                        className="font-mono text-[11px] uppercase tracking-wider"
                        style={{
                          color: item.done
                            ? 'var(--theme-foreground-tertiary)'
                            : 'var(--theme-foreground)',
                          textDecoration: item.done ? 'line-through' : 'none',
                        }}
                      >
                        {item.title}
                      </span>
                    </div>
                    <p
                      className="font-mono text-[10px] pl-[22px] md:pl-0"
                      style={{ color: 'var(--theme-foreground-tertiary)' }}
                    >
                      {item.sub}
                    </p>
                  </div>
                  {item.done ? (
                    <span
                      className="font-mono text-[10px] uppercase tracking-wider shrink-0"
                      style={{ color: 'var(--theme-success)' }}
                    >
                      DONE
                    </span>
                  ) : (
                    <Link
                      to={item.to}
                      className="inline-flex items-center gap-1 px-2.5 py-1 border-2 font-mono text-[10px] uppercase tracking-wider transition-transform hover:-translate-y-0.5 shrink-0"
                      style={{
                        borderRadius: '6px',
                        backgroundColor: 'var(--theme-primary)',
                        borderColor: 'var(--theme-border)',
                        color: 'var(--theme-background)',
                        boxShadow: '2px 2px 0 var(--theme-shadow)',
                      }}
                    >
                      {item.cta}
                      <HiOutlineArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  )
}
