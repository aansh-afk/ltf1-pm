import { useEffect, useMemo, useState } from 'react'
import { useAction } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import {
  HiOutlineChevronDown,
  HiOutlineChevronRight,
  HiOutlineExternalLink,
} from 'react-icons/hi'
import clsx from 'clsx'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface DiffFile {
  filename: string
  status: string
  additions: number
  deletions: number
  changes: number
  patch?: string
  previousFilename?: string
}

interface FetchState {
  kind: 'loading' | 'ok' | 'error'
  files?: DiffFile[]
  truncated?: boolean
  message?: string
}

interface PullRequestDiffViewProps {
  repositoryFullName: string
  prNumber: number
  prUrl: string
  prTitle?: string
}

export default function PullRequestDiffView({
  repositoryFullName,
  prNumber,
  prUrl,
  prTitle,
}: PullRequestDiffViewProps) {
  const getFiles = useAction(api.integrations.github.diffActions.getPullRequestFiles)
  const [state, setState] = useState<FetchState>({ kind: 'loading' })
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    setState({ kind: 'loading' })
    setExpanded(new Set())
    getFiles({ repositoryFullName, prNumber })
      .then((res) => {
        if (cancelled) return
        setState({ kind: 'ok', files: res.files, truncated: res.truncated })
      })
      .catch((err: any) => {
        if (cancelled) return
        setState({ kind: 'error', message: err?.message || 'Failed to load diff' })
      })
    return () => {
      cancelled = true
    }
    // getFiles is a stable Convex action reference
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repositoryFullName, prNumber])

  const toggle = (filename: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(filename)) next.delete(filename)
      else next.add(filename)
      return next
    })
  }

  const totals = useMemo(() => {
    if (state.kind !== 'ok' || !state.files) return { additions: 0, deletions: 0 }
    return state.files.reduce(
      (acc, f) => ({
        additions: acc.additions + f.additions,
        deletions: acc.deletions + f.deletions,
      }),
      { additions: 0, deletions: 0 }
    )
  }, [state])

  return (
    <div>
      <div className="flex items-center justify-between mb-[10px]">
        <div className="flex items-center gap-[8px]">
          <span className="text-brutal-sm font-mono uppercase">
            PR #{prNumber}
          </span>
          {prTitle && (
            <span className="text-brutal-xs font-mono text-[var(--theme-foreground-tertiary)] truncate max-w-[320px]">
              {prTitle}
            </span>
          )}
          {state.kind === 'ok' && state.files && (
            <>
              <span className="text-brutal-xs font-mono text-[var(--theme-foreground-tertiary)]">
                {state.files.length} file{state.files.length === 1 ? '' : 's'}
              </span>
              <span className="text-brutal-xs font-mono text-[var(--theme-success)]">
                +{totals.additions}
              </span>
              <span className="text-brutal-xs font-mono text-[var(--theme-error)]">
                -{totals.deletions}
              </span>
            </>
          )}
        </div>
        <a
          href={prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-[4px] px-[8px] py-[4px] border-2 border-[var(--theme-border)] text-brutal-xs font-mono uppercase hover:bg-[var(--theme-background-secondary)]/10 transition-colors"
        >
          <HiOutlineExternalLink className="w-[12px] h-[12px]" />
          VIEW ON GITHUB
        </a>
      </div>

      {state.kind === 'loading' && (
        <div className="flex items-center justify-center py-[32px]">
          <LoadingSpinner size="sm" />
        </div>
      )}

      {state.kind === 'error' && (
        <div className="p-[12px] border-2 border-[var(--theme-error)] bg-[var(--theme-error)]/5">
          <div className="text-brutal-sm font-mono uppercase text-[var(--theme-error)]">
            FAILED TO LOAD DIFF
          </div>
          <div className="text-brutal-xs text-[var(--theme-foreground-tertiary)] mt-[4px] break-words">
            {state.message}
          </div>
        </div>
      )}

      {state.kind === 'ok' && state.files && state.files.length === 0 && (
        <div className="p-[12px] border-2 border-[var(--theme-border)] text-brutal-xs font-mono text-[var(--theme-foreground-tertiary)] uppercase">
          NO FILE CHANGES IN THIS PR
        </div>
      )}

      {state.kind === 'ok' && state.files && state.files.length > 0 && (
        <div className="border-2 border-[var(--theme-border)]">
          {state.files.map((file) => {
            const isOpen = expanded.has(file.filename)
            return (
              <div
                key={file.filename}
                className="border-b-2 border-[var(--theme-border)] last:border-b-0"
              >
                <button
                  onClick={() => toggle(file.filename)}
                  className="w-full flex items-center gap-[8px] px-[10px] py-[8px] hover:bg-[var(--theme-background-secondary)]/10 transition-colors text-left"
                >
                  {isOpen ? (
                    <HiOutlineChevronDown className="w-[12px] h-[12px] flex-shrink-0" />
                  ) : (
                    <HiOutlineChevronRight className="w-[12px] h-[12px] flex-shrink-0" />
                  )}
                  <StatusBadge status={file.status} />
                  <span className="text-brutal-xs font-mono truncate flex-1">
                    {file.previousFilename
                      ? `${file.previousFilename} → ${file.filename}`
                      : file.filename}
                  </span>
                  <span className="text-brutal-xs font-mono text-[var(--theme-success)] flex-shrink-0">
                    +{file.additions}
                  </span>
                  <span className="text-brutal-xs font-mono text-[var(--theme-error)] flex-shrink-0">
                    -{file.deletions}
                  </span>
                </button>
                {isOpen && (
                  <div>
                    {file.patch ? (
                      <PatchView patch={file.patch} />
                    ) : (
                      <div className="px-[12px] py-[10px] border-t-2 border-[var(--theme-border)] text-brutal-xs font-mono text-[var(--theme-foreground-tertiary)] uppercase">
                        {file.status === 'removed'
                          ? 'FILE REMOVED'
                          : 'BINARY FILE — VIEW ON GITHUB'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {state.kind === 'ok' && state.truncated && (
        <div className="mt-[8px] p-[8px] border-2 border-[var(--theme-warning,#F59E0B)] bg-[var(--theme-warning,#F59E0B)]/5 text-brutal-xs font-mono uppercase">
          SHOWING FIRST 100 FILES. OPEN ON GITHUB FOR THE REST.
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const letter =
    status === 'added'
      ? 'A'
      : status === 'removed'
      ? 'D'
      : status === 'renamed'
      ? 'R'
      : status === 'modified'
      ? 'M'
      : status[0]?.toUpperCase() || '?'
  const color =
    status === 'added'
      ? 'text-[var(--theme-success)] border-[var(--theme-success)]'
      : status === 'removed'
      ? 'text-[var(--theme-error)] border-[var(--theme-error)]'
      : status === 'renamed'
      ? 'text-[var(--theme-info,#06B6D4)] border-[var(--theme-info,#06B6D4)]'
      : 'text-[var(--theme-foreground)] border-[var(--theme-border)]'
  return (
    <span
      className={clsx(
        'inline-block w-[18px] text-center border text-[10px] font-mono font-bold uppercase flex-shrink-0',
        color
      )}
      title={status}
    >
      {letter}
    </span>
  )
}

function PatchView({ patch }: { patch: string }) {
  const lines = patch.split('\n')
  return (
    <pre className="font-mono text-[11px] leading-[1.5] overflow-x-auto bg-[var(--theme-background)] border-t-2 border-[var(--theme-border)] m-0">
      {lines.map((line, i) => {
        const cls =
          line.startsWith('+++') || line.startsWith('---')
            ? 'text-[var(--theme-foreground-tertiary)]'
            : line.startsWith('@@')
            ? 'text-[var(--theme-info,#06B6D4)] bg-[var(--theme-info,#06B6D4)]/5'
            : line.startsWith('+')
            ? 'text-[var(--theme-success)] bg-[var(--theme-success)]/5'
            : line.startsWith('-')
            ? 'text-[var(--theme-error)] bg-[var(--theme-error)]/5'
            : 'text-[var(--theme-foreground)]/70'
        return (
          <div key={i} className={clsx('px-[12px] whitespace-pre', cls)}>
            {line || ' '}
          </div>
        )
      })}
    </pre>
  )
}

interface PullRequestDiffSectionProps {
  prs: Array<{
    _id: string
    number: number
    title: string
    url: string
    state: string
    repositoryFullName: string
  }>
}

export function PullRequestDiffSection({ prs }: PullRequestDiffSectionProps) {
  const [activePrId, setActivePrId] = useState<string>(prs[0]?._id ?? '')
  const activePr = prs.find((p) => p._id === activePrId) ?? prs[0]

  if (!activePr) return null

  return (
    <div className="space-y-[10px]">
      {prs.length > 1 && (
        <div className="flex flex-wrap gap-[4px]">
          {prs.map((pr) => (
            <button
              key={pr._id}
              onClick={() => setActivePrId(pr._id)}
              className={clsx(
                'px-[8px] py-[4px] border-2 text-brutal-xs font-mono uppercase transition-colors',
                pr._id === activePr._id
                  ? 'border-primary-brutalist bg-[var(--theme-background-secondary)]/10 text-primary-brutalist'
                  : 'border-[var(--theme-border)] hover:bg-[var(--theme-background-secondary)]/5'
              )}
              title={pr.title}
            >
              #{pr.number} {pr.state.toUpperCase()}
            </button>
          ))}
        </div>
      )}
      <PullRequestDiffView
        key={activePr._id}
        repositoryFullName={activePr.repositoryFullName}
        prNumber={activePr.number}
        prUrl={activePr.url}
        prTitle={activePr.title}
      />
    </div>
  )
}
