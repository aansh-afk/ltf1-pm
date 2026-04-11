import { useState } from 'react'
import { m } from 'framer-motion'
import PublicNavigation from '@/components/common/PublicNavigation'
import Footer from '@/components/common/Footer'
import { usePageTitle } from '@/hooks/usePageTitle'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
}

interface Command {
  cmd: string
  desc: string
  flags?: string[]
}

interface Group {
  name: string
  description: string
  accent: string
  commands: Command[]
}

const COMMAND_GROUPS: Group[] = [
  {
    name: 'auth',
    description: 'Authentication and session management',
    accent: '#22C55E',
    commands: [
      { cmd: 'ltf auth login', desc: 'Authenticate via browser OAuth or API token', flags: ['--token <jwt>'] },
      { cmd: 'ltf auth logout', desc: 'Clear stored credentials' },
      { cmd: 'ltf auth status', desc: 'Show current auth state and active project' },
    ],
  },
  {
    name: 'project',
    description: 'Workspace and project context',
    accent: '#06B6D4',
    commands: [
      { cmd: 'ltf project list', desc: 'List projects in current or all workspaces', flags: ['-w <id>', '--all', '--json'] },
      { cmd: 'ltf project select [KEY]', desc: 'Pick the active project' },
      { cmd: 'ltf project info', desc: 'Show details of the active project' },
      { cmd: 'ltf project detect', desc: 'Auto-detect project from git remote', flags: ['--set'] },
    ],
  },
  {
    name: 'task',
    description: 'Create, list, update, and complete tasks',
    accent: '#6366F1',
    commands: [
      { cmd: 'ltf task list', desc: 'List tasks with filters', flags: ['-s status', '-p priority', '-a assignee', '-t type', '--all', '--json'] },
      { cmd: 'ltf task create <title>', desc: 'Create a new task', flags: ['-d desc', '-t type', '-p priority', '-l labels', '-e estimate', '--due-date', '--assign'] },
      { cmd: 'ltf task view <id>', desc: 'Show full task detail' },
      { cmd: 'ltf task update <id>', desc: 'Update task fields', flags: ['--title', '-d', '-s', '-p', '-t', '-l', '-e'] },
      { cmd: 'ltf task done <id>', desc: 'Mark a task as done' },
      { cmd: 'ltf task assign <id>', desc: 'Assign task to user', flags: ['--to me|<userId>', '--clear'] },
      { cmd: 'ltf task delete <id>', desc: 'Delete a task', flags: ['--force'] },
      { cmd: 'ltf task comment <id> "msg"', desc: 'Add a comment to a task' },
      { cmd: 'ltf task mine', desc: 'Show tasks assigned to current user' },
    ],
  },
  {
    name: 'sprint',
    description: 'Sprint planning and tracking',
    accent: '#06B6D4',
    commands: [
      { cmd: 'ltf sprint list', desc: 'List sprints in current project', flags: ['--status'] },
      { cmd: 'ltf sprint status', desc: 'Show active sprint progress' },
      { cmd: 'ltf sprint create <name>', desc: 'Create a new sprint', flags: ['--start', '--end', '--goal'] },
      { cmd: 'ltf sprint add <task-id>', desc: 'Add task to sprint', flags: ['--sprint <id>'] },
      { cmd: 'ltf sprint remove <task-id>', desc: 'Remove task from sprint' },
      { cmd: 'ltf sprint close', desc: 'Close active sprint', flags: ['--force'] },
      { cmd: 'ltf sprint backlog', desc: 'Show backlog tasks' },
    ],
  },
  {
    name: 'agent',
    description: 'AI agent triage and suggestions',
    accent: '#F59E0B',
    commands: [
      { cmd: 'ltf agent triage', desc: 'View AI triage queue with accept/reject' },
      { cmd: 'ltf agent suggest', desc: 'Agent suggestions for next actions' },
      { cmd: 'ltf agent status', desc: 'Show agent activity feed' },
    ],
  },
  {
    name: 'skill',
    description: 'Codified team workflows',
    accent: '#8B5CF6',
    commands: [
      { cmd: 'ltf skill list', desc: 'List available skills' },
      { cmd: 'ltf skill run <id>', desc: 'Execute a skill' },
      { cmd: 'ltf skill create <name>', desc: 'Create a custom skill', flags: ['-d desc', '--trigger'] },
    ],
  },
  {
    name: 'git',
    description: 'Git integration and task linking',
    accent: '#22C55E',
    commands: [
      { cmd: 'ltf git link', desc: 'Link branch/PR to a task', flags: ['--task', '--pr', '--branch'] },
      { cmd: 'ltf git status', desc: 'Show git status with task context' },
      { cmd: 'ltf git sync', desc: 'Sync git activity' },
      { cmd: 'ltf git hooks <action>', desc: 'Install, uninstall, or check git hooks' },
      { cmd: 'ltf git config', desc: 'Configure git integration' },
    ],
  },
  {
    name: 'time',
    description: 'Time tracking',
    accent: '#EC4899',
    commands: [
      { cmd: 'ltf time start <task-id>', desc: 'Start timer on a task', flags: ['-d desc'] },
      { cmd: 'ltf time stop', desc: 'Stop active timer' },
      { cmd: 'ltf time status', desc: 'Show running timer' },
      { cmd: 'ltf time log <task-id>', desc: 'Manually log time', flags: ['-H hours', '-M minutes', '-d date'] },
      { cmd: 'ltf time report', desc: 'Show time tracking report', flags: ['--user', '--period week|month'] },
    ],
  },
  {
    name: 'ai',
    description: 'AI-powered helpers',
    accent: '#F59E0B',
    commands: [
      { cmd: 'ltf ai suggest', desc: 'AI task suggestions from recent activity', flags: ['-n count'] },
      { cmd: 'ltf ai analyze', desc: 'AI analysis of sprint or task', flags: ['-s sprint'] },
      { cmd: 'ltf ai describe <brief>', desc: 'Generate task description', flags: ['--create'] },
    ],
  },
  {
    name: 'daemon',
    description: 'Background watcher process',
    accent: '#10B981',
    commands: [
      { cmd: 'ltf daemon start', desc: 'Start the background daemon', flags: ['-f', '-v'] },
      { cmd: 'ltf daemon stop', desc: 'Stop the daemon', flags: ['-f'] },
      { cmd: 'ltf daemon status', desc: 'Show daemon status' },
      { cmd: 'ltf daemon logs', desc: 'View daemon logs', flags: ['-f', '-n lines', '--clear'] },
    ],
  },
  {
    name: 'search',
    description: 'Global search',
    accent: '#9CA3AF',
    commands: [
      { cmd: 'ltf search <query>', desc: 'Search across tasks, projects, and sprints', flags: ['-t type', '-l limit', '--json'] },
    ],
  },
  {
    name: 'notifications',
    description: 'Notification management',
    accent: '#9CA3AF',
    commands: [
      { cmd: 'ltf notifications list', desc: 'List notifications', flags: ['-u', '--json'] },
      { cmd: 'ltf notifications read <id>', desc: 'Mark notification as read' },
      { cmd: 'ltf notifications clear', desc: 'Mark all notifications as read' },
    ],
  },
  {
    name: 'config',
    description: 'CLI configuration',
    accent: '#9CA3AF',
    commands: [
      { cmd: 'ltf config list', desc: 'Show all config' },
      { cmd: 'ltf config get <key>', desc: 'Get a config value (dot notation)' },
      { cmd: 'ltf config set <key> <value>', desc: 'Set a config value' },
      { cmd: 'ltf config path', desc: 'Show config file path' },
      { cmd: 'ltf config reset', desc: 'Reset config', flags: ['--force'] },
    ],
  },
  {
    name: 'completions',
    description: 'Shell completion scripts',
    accent: '#9CA3AF',
    commands: [
      { cmd: 'ltf completions bash', desc: 'Bash completion script' },
      { cmd: 'ltf completions zsh', desc: 'Zsh completion script' },
      { cmd: 'ltf completions fish', desc: 'Fish completion script' },
      { cmd: 'ltf completions install', desc: 'Show install instructions' },
    ],
  },
  {
    name: 'release',
    description: 'Release notes generation',
    accent: '#9CA3AF',
    commands: [
      { cmd: 'ltf release notes', desc: 'Generate release notes from git commits', flags: ['--version', '--format md|txt'] },
    ],
  },
  {
    name: 'pr',
    description: 'Pull request management',
    accent: '#22C55E',
    commands: [
      { cmd: 'ltf pr create', desc: 'Create a pull request from current branch', flags: ['--title', '--body', '--draft'] },
    ],
  },
  {
    name: 'update',
    description: 'CLI self-update',
    accent: '#9CA3AF',
    commands: [
      { cmd: 'ltf update', desc: 'Check for and install CLI updates', flags: ['--check'] },
    ],
  },
  {
    name: 'dashboard',
    description: 'Launch the interactive TUI',
    accent: '#6366F1',
    commands: [
      { cmd: 'ltf dashboard', desc: 'Launch full-screen TUI (also: ltf -d, or bare ltf)' },
    ],
  },
]

export default function CliPage() {
  usePageTitle('CLI — LTF1')
  const [copied, setCopied] = useState<string | null>(null)

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      <PublicNavigation />

      {/* Hero */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden">
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(#F9FAFB 1px, transparent 1px), linear-gradient(90deg, #F9FAFB 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="max-w-4xl mx-auto px-6 relative">
          <m.div {...fadeUp}>
            <div className="inline-block px-3 py-1 mb-6 text-[10px] font-['IBM_Plex_Mono',monospace] font-medium text-[#9CA3AF] bg-[#111111] border border-[#2E2E35] uppercase tracking-wider">
              CLI &nbsp;·&nbsp; v0.2.1 &nbsp;·&nbsp; @vvg-ltf1/cli
            </div>
            <h1 className="font-['Inter',sans-serif] text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#F9FAFB] leading-[1.05] mb-6">
              The PM tool<br />
              that lives in<br />
              <span className="text-[#6366F1]">your terminal.</span>
            </h1>
            <p className="text-lg md:text-xl text-[#9CA3AF] font-['Inter',sans-serif] mb-10 max-w-2xl leading-relaxed">
              64 commands across 18 groups. One Go binary. Bare <code className="text-[#F9FAFB] font-['IBM_Plex_Mono',monospace] text-base">ltf</code> launches the full-screen TUI. Pass any subcommand to use the CLI.
            </p>
          </m.div>

          {/* Install block */}
          <m.div {...fadeUp} transition={{ duration: 0.5, delay: 0.1 }}>
            <div className="bg-[#0A0A0A] border-2 border-[#2E2E35] mb-4">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#1F1F23]">
                <span className="font-['IBM_Plex_Mono',monospace] text-[10px] uppercase tracking-wider text-[#6B7280]">install</span>
                <button
                  onClick={() => copy('npm install -g @vvg-ltf1/cli')}
                  className="font-['IBM_Plex_Mono',monospace] text-[10px] uppercase tracking-wider text-[#6B7280] hover:text-[#6366F1] transition-colors"
                >
                  {copied === 'npm install -g @vvg-ltf1/cli' ? 'copied' : 'copy'}
                </button>
              </div>
              <pre className="font-['IBM_Plex_Mono',monospace] text-sm text-[#F9FAFB] px-4 py-4 overflow-x-auto">
                <span className="text-[#6B7280]">$ </span>npm install -g @vvg-ltf1/cli
              </pre>
            </div>

            <div className="bg-[#0A0A0A] border-2 border-[#2E2E35]">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#1F1F23]">
                <span className="font-['IBM_Plex_Mono',monospace] text-[10px] uppercase tracking-wider text-[#6B7280]">first run</span>
                <button
                  onClick={() => copy('ltf auth login && ltf project select')}
                  className="font-['IBM_Plex_Mono',monospace] text-[10px] uppercase tracking-wider text-[#6B7280] hover:text-[#6366F1] transition-colors"
                >
                  {copied === 'ltf auth login && ltf project select' ? 'copied' : 'copy'}
                </button>
              </div>
              <pre className="font-['IBM_Plex_Mono',monospace] text-sm text-[#F9FAFB] px-4 py-4 overflow-x-auto whitespace-pre-wrap">
                <span className="text-[#6B7280]">$ </span>ltf auth login{'\n'}
                <span className="text-[#6B7280]">$ </span>ltf project select{'\n'}
                <span className="text-[#6B7280]">$ </span>ltf
              </pre>
            </div>
          </m.div>
        </div>
      </section>

      {/* AI Skill Section */}
      <section className="py-20 md:py-28 border-t border-[#1F1F23]">
        <div className="max-w-4xl mx-auto px-6">
          <m.div {...fadeUp}>
            <div className="inline-block px-3 py-1 mb-4 text-[10px] font-['IBM_Plex_Mono',monospace] font-medium text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/30 uppercase tracking-wider">
              FOR AI AGENTS
            </div>
            <h2 className="font-['Inter',sans-serif] text-3xl md:text-5xl font-bold tracking-tight text-[#F9FAFB] mb-6">
              Install as a Claude skill.
            </h2>
            <p className="text-base md:text-lg text-[#9CA3AF] font-['Inter',sans-serif] mb-8 max-w-2xl leading-relaxed">
              Drop the <code className="text-[#F9FAFB] font-['IBM_Plex_Mono',monospace]">ltf-pm</code> skill into Claude Code, Cursor, Cline, or any agent that supports skills. Your AI will create tasks before it codes, mark them done when it ships, and leave a paper trail of every change in your LTF1 board.
            </p>
          </m.div>

          <m.div {...fadeUp} transition={{ duration: 0.5, delay: 0.1 }}>
            <div className="bg-[#0A0A0A] border-2 border-[#F59E0B]/30 mb-4">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#1F1F23]">
                <span className="font-['IBM_Plex_Mono',monospace] text-[10px] uppercase tracking-wider text-[#F59E0B]">install skill</span>
                <button
                  onClick={() => copy('npx skills add https://github.com/aansh-afk/ltf1-pm --skill ltf-pm')}
                  className="font-['IBM_Plex_Mono',monospace] text-[10px] uppercase tracking-wider text-[#6B7280] hover:text-[#F59E0B] transition-colors"
                >
                  {copied === 'npx skills add https://github.com/aansh-afk/ltf1-pm --skill ltf-pm' ? 'copied' : 'copy'}
                </button>
              </div>
              <pre className="font-['IBM_Plex_Mono',monospace] text-sm text-[#F9FAFB] px-4 py-4 overflow-x-auto">
                <span className="text-[#6B7280]">$ </span>npx skills add https://github.com/aansh-afk/ltf1-pm --skill ltf-pm
              </pre>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-[#111111] border border-[#2E2E35] p-4">
                <div className="font-['IBM_Plex_Mono',monospace] text-[10px] uppercase tracking-wider text-[#F59E0B] mb-2">1. Detect</div>
                <div className="font-['Inter',sans-serif] text-sm text-[#F9FAFB]">Agent reads the skill, knows when LTF1 is in scope.</div>
              </div>
              <div className="bg-[#111111] border border-[#2E2E35] p-4">
                <div className="font-['IBM_Plex_Mono',monospace] text-[10px] uppercase tracking-wider text-[#F59E0B] mb-2">2. Track</div>
                <div className="font-['Inter',sans-serif] text-sm text-[#F9FAFB]">Creates a task before it starts, moves it to in_progress.</div>
              </div>
              <div className="bg-[#111111] border border-[#2E2E35] p-4">
                <div className="font-['IBM_Plex_Mono',monospace] text-[10px] uppercase tracking-wider text-[#F59E0B] mb-2">3. Ship</div>
                <div className="font-['Inter',sans-serif] text-sm text-[#F9FAFB]">Comments with what it did, marks done, your board updates.</div>
              </div>
            </div>
          </m.div>
        </div>
      </section>

      {/* Commands */}
      <section className="py-20 md:py-28 border-t border-[#1F1F23]">
        <div className="max-w-5xl mx-auto px-6">
          <m.div {...fadeUp}>
            <div className="mb-12">
              <div className="inline-block px-3 py-1 mb-4 text-[10px] font-['IBM_Plex_Mono',monospace] font-medium text-[#9CA3AF] bg-[#111111] border border-[#2E2E35] uppercase tracking-wider">
                REFERENCE
              </div>
              <h2 className="font-['Inter',sans-serif] text-3xl md:text-5xl font-bold tracking-tight text-[#F9FAFB] mb-4">
                All 64 commands.
              </h2>
              <p className="text-base text-[#9CA3AF] font-['Inter',sans-serif] max-w-2xl">
                Eighteen command groups. Hover any command to copy.
              </p>
            </div>
          </m.div>

          <div className="space-y-12">
            {COMMAND_GROUPS.map((group, gi) => (
              <m.div
                key={group.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: Math.min(gi * 0.03, 0.3) }}
              >
                <div className="flex items-baseline gap-3 mb-4">
                  <span
                    className="font-['IBM_Plex_Mono',monospace] text-xs uppercase tracking-wider px-2 py-0.5 border"
                    style={{ color: group.accent, borderColor: `${group.accent}40` }}
                  >
                    ltf {group.name}
                  </span>
                  <span className="font-['Inter',sans-serif] text-sm text-[#6B7280]">
                    {group.description}
                  </span>
                </div>

                <div className="bg-[#0A0A0A] border-2 border-[#2E2E35]">
                  {group.commands.map((cmd, ci) => (
                    <div
                      key={cmd.cmd}
                      className={`flex flex-col md:flex-row md:items-start gap-2 md:gap-6 px-4 py-3 group ${
                        ci < group.commands.length - 1 ? 'border-b border-[#1F1F23]' : ''
                      } hover:bg-[#111111] transition-colors cursor-pointer`}
                      onClick={() => copy(cmd.cmd)}
                    >
                      <div className="md:w-2/5 lg:w-1/2 shrink-0">
                        <code className="font-['IBM_Plex_Mono',monospace] text-sm text-[#F9FAFB]">
                          {cmd.cmd}
                        </code>
                        {cmd.flags && cmd.flags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {cmd.flags.map((f) => (
                              <span
                                key={f}
                                className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#6B7280] bg-[#111111] px-1.5 py-0.5"
                              >
                                {f}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="md:flex-1 font-['Inter',sans-serif] text-sm text-[#9CA3AF]">
                        {cmd.desc}
                      </div>
                      <div className="hidden md:block font-['IBM_Plex_Mono',monospace] text-[10px] uppercase text-[#6B7280] opacity-0 group-hover:opacity-100 transition-opacity">
                        {copied === cmd.cmd ? 'copied' : 'copy'}
                      </div>
                    </div>
                  ))}
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 md:py-28 border-t border-[#1F1F23]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <m.div {...fadeUp}>
            <h2 className="font-['Inter',sans-serif] text-3xl md:text-5xl font-bold tracking-tight text-[#F9FAFB] mb-6">
              Stop opening browser tabs<br />to update tickets.
            </h2>
            <p className="text-base md:text-lg text-[#9CA3AF] font-['Inter',sans-serif] mb-10 max-w-2xl mx-auto leading-relaxed">
              Install once. Authenticate once. Then never leave your terminal again.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => copy('npm install -g @vvg-ltf1/cli')}
                className="px-6 py-3 text-sm font-['Inter',sans-serif] font-semibold bg-[#6366F1] hover:bg-[#4F46E5] text-white border-2 border-[#4F46E5] shadow-[3px_3px_0px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all duration-300"
              >
                {copied === 'npm install -g @vvg-ltf1/cli' ? 'COPIED' : 'COPY INSTALL COMMAND'}
              </button>
              <a
                href="https://github.com/aansh-afk/ltf1-pm"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 text-sm font-['Inter',sans-serif] font-medium text-[#9CA3AF] hover:text-[#F9FAFB] border-2 border-[#2E2E35] hover:border-[#6366F1] transition-all duration-300"
              >
                VIEW SOURCE
              </a>
            </div>
          </m.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
