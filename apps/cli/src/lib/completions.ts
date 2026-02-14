/**
 * Shell completion generation for LTF CLI
 * Generates completion scripts for bash, zsh, and fish shells
 */

const COMMANDS = [
  'task', 'sprint', 'project', 'git', 'auth', 'ai', 'daemon',
  'dashboard', 'time', 'search', 'notifications', 'config', 'completions',
];

const TASK_SUBCOMMANDS = ['list', 'create', 'view', 'update', 'done', 'assign', 'delete', 'comment', 'mine'];
const SPRINT_SUBCOMMANDS = ['list', 'status', 'create', 'add', 'close', 'remove', 'backlog'];
const GIT_SUBCOMMANDS = ['link', 'sync', 'hooks', 'status', 'hook'];
const PROJECT_SUBCOMMANDS = ['list', 'info', 'select', 'detect'];
const AUTH_SUBCOMMANDS = ['login', 'logout', 'status'];
const TIME_SUBCOMMANDS = ['start', 'stop', 'log', 'status', 'report'];
const CONFIG_SUBCOMMANDS = ['list', 'get', 'set', 'path'];

const STATUS_VALUES = ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled'];
const PRIORITY_VALUES = ['urgent', 'high', 'medium', 'low'];
const TYPE_VALUES = ['feature', 'bug', 'improvement', 'task', 'epic'];

export function generateBashCompletions(): string {
  return `# LTF CLI bash completions
# Add to ~/.bashrc: eval "$(ltf completions bash)"

_ltf_completions() {
  local cur prev commands
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"

  # Top-level commands
  if [ $COMP_CWORD -eq 1 ]; then
    commands="${COMMANDS.join(' ')}"
    COMPREPLY=( $(compgen -W "$commands" -- "$cur") )
    return 0
  fi

  # Subcommands
  case "\${COMP_WORDS[1]}" in
    task|t)
      if [ $COMP_CWORD -eq 2 ]; then
        COMPREPLY=( $(compgen -W "${TASK_SUBCOMMANDS.join(' ')}" -- "$cur") )
      elif [ "$prev" = "--status" ] || [ "$prev" = "-s" ]; then
        COMPREPLY=( $(compgen -W "${STATUS_VALUES.join(' ')}" -- "$cur") )
      elif [ "$prev" = "--priority" ] || [ "$prev" = "-p" ]; then
        COMPREPLY=( $(compgen -W "${PRIORITY_VALUES.join(' ')}" -- "$cur") )
      elif [ "$prev" = "--type" ] || [ "$prev" = "-t" ]; then
        COMPREPLY=( $(compgen -W "${TYPE_VALUES.join(' ')}" -- "$cur") )
      fi
      ;;
    sprint|s)
      if [ $COMP_CWORD -eq 2 ]; then
        COMPREPLY=( $(compgen -W "${SPRINT_SUBCOMMANDS.join(' ')}" -- "$cur") )
      fi
      ;;
    git|g)
      if [ $COMP_CWORD -eq 2 ]; then
        COMPREPLY=( $(compgen -W "${GIT_SUBCOMMANDS.join(' ')}" -- "$cur") )
      fi
      ;;
    project|p)
      if [ $COMP_CWORD -eq 2 ]; then
        COMPREPLY=( $(compgen -W "${PROJECT_SUBCOMMANDS.join(' ')}" -- "$cur") )
      fi
      ;;
    auth)
      if [ $COMP_CWORD -eq 2 ]; then
        COMPREPLY=( $(compgen -W "${AUTH_SUBCOMMANDS.join(' ')}" -- "$cur") )
      fi
      ;;
    time|tm)
      if [ $COMP_CWORD -eq 2 ]; then
        COMPREPLY=( $(compgen -W "${TIME_SUBCOMMANDS.join(' ')}" -- "$cur") )
      fi
      ;;
    config|cfg)
      if [ $COMP_CWORD -eq 2 ]; then
        COMPREPLY=( $(compgen -W "${CONFIG_SUBCOMMANDS.join(' ')}" -- "$cur") )
      fi
      ;;
    completions)
      if [ $COMP_CWORD -eq 2 ]; then
        COMPREPLY=( $(compgen -W "bash zsh fish install" -- "$cur") )
      fi
      ;;
  esac
  return 0
}

complete -F _ltf_completions ltf`;
}

export function generateZshCompletions(): string {
  return `# LTF CLI zsh completions
# Add to ~/.zshrc: eval "$(ltf completions zsh)"

_ltf() {
  local -a commands task_cmds sprint_cmds git_cmds project_cmds auth_cmds time_cmds config_cmds completions_cmds
  local -a status_values priority_values type_values

  commands=(
    'task:Task management commands'
    'sprint:Sprint management commands'
    'project:Project management commands'
    'git:Git integration commands'
    'auth:Authentication commands'
    'ai:AI assistant commands'
    'daemon:Background daemon commands'
    'dashboard:Launch interactive TUI dashboard'
    'time:Time tracking commands'
    'search:Search across projects'
    'notifications:Notification management'
    'config:Configuration management'
    'completions:Generate shell completions'
  )

  task_cmds=(${TASK_SUBCOMMANDS.map(c => `'${c}'`).join(' ')})
  sprint_cmds=(${SPRINT_SUBCOMMANDS.map(c => `'${c}'`).join(' ')})
  git_cmds=(${GIT_SUBCOMMANDS.map(c => `'${c}'`).join(' ')})
  project_cmds=(${PROJECT_SUBCOMMANDS.map(c => `'${c}'`).join(' ')})
  auth_cmds=(${AUTH_SUBCOMMANDS.map(c => `'${c}'`).join(' ')})
  time_cmds=(${TIME_SUBCOMMANDS.map(c => `'${c}'`).join(' ')})
  config_cmds=(${CONFIG_SUBCOMMANDS.map(c => `'${c}'`).join(' ')})
  completions_cmds=('bash' 'zsh' 'fish' 'install')

  status_values=(${STATUS_VALUES.map(v => `'${v}'`).join(' ')})
  priority_values=(${PRIORITY_VALUES.map(v => `'${v}'`).join(' ')})
  type_values=(${TYPE_VALUES.map(v => `'${v}'`).join(' ')})

  _arguments -C \\
    '1:command:->command' \\
    '*::arg:->args'

  case $state in
    command)
      _describe 'command' commands
      ;;
    args)
      case $words[1] in
        task|t)
          if (( CURRENT == 2 )); then
            _describe 'subcommand' task_cmds
          else
            case $words[CURRENT-1] in
              --status|-s) _describe 'status' status_values ;;
              --priority|-p) _describe 'priority' priority_values ;;
              --type|-t) _describe 'type' type_values ;;
            esac
          fi
          ;;
        sprint|s) _describe 'subcommand' sprint_cmds ;;
        git|g) _describe 'subcommand' git_cmds ;;
        project|p) _describe 'subcommand' project_cmds ;;
        auth) _describe 'subcommand' auth_cmds ;;
        time|tm) _describe 'subcommand' time_cmds ;;
        config|cfg) _describe 'subcommand' config_cmds ;;
        completions) _describe 'subcommand' completions_cmds ;;
      esac
      ;;
  esac
}

compdef _ltf ltf`;
}

export function generateFishCompletions(): string {
  let script = `# LTF CLI fish completions
# Add to fish config: ltf completions fish | source

# Disable file completions by default
complete -c ltf -f

`;

  // Top-level commands
  const commandDescriptions: Record<string, string> = {
    task: 'Task management commands',
    sprint: 'Sprint management commands',
    project: 'Project management commands',
    git: 'Git integration commands',
    auth: 'Authentication commands',
    ai: 'AI assistant commands',
    daemon: 'Background daemon commands',
    dashboard: 'Launch interactive TUI dashboard',
    time: 'Time tracking commands',
    search: 'Search across projects',
    notifications: 'Notification management',
    config: 'Configuration management',
    completions: 'Generate shell completions',
  };

  script += '# Top-level commands\n';
  for (const cmd of COMMANDS) {
    const desc = commandDescriptions[cmd] || `${cmd} commands`;
    script += `complete -c ltf -n '__fish_use_subcommand' -a '${cmd}' -d '${desc}'\n`;
  }

  script += '\n# Task subcommands\n';
  for (const sub of TASK_SUBCOMMANDS) {
    script += `complete -c ltf -n '__fish_seen_subcommand_from task t' -a '${sub}'\n`;
  }

  script += '\n# Sprint subcommands\n';
  for (const sub of SPRINT_SUBCOMMANDS) {
    script += `complete -c ltf -n '__fish_seen_subcommand_from sprint s' -a '${sub}'\n`;
  }

  script += '\n# Git subcommands\n';
  for (const sub of GIT_SUBCOMMANDS) {
    script += `complete -c ltf -n '__fish_seen_subcommand_from git g' -a '${sub}'\n`;
  }

  script += '\n# Project subcommands\n';
  for (const sub of PROJECT_SUBCOMMANDS) {
    script += `complete -c ltf -n '__fish_seen_subcommand_from project p' -a '${sub}'\n`;
  }

  script += '\n# Auth subcommands\n';
  for (const sub of AUTH_SUBCOMMANDS) {
    script += `complete -c ltf -n '__fish_seen_subcommand_from auth' -a '${sub}'\n`;
  }

  script += '\n# Time subcommands\n';
  for (const sub of TIME_SUBCOMMANDS) {
    script += `complete -c ltf -n '__fish_seen_subcommand_from time tm' -a '${sub}'\n`;
  }

  script += '\n# Config subcommands\n';
  for (const sub of CONFIG_SUBCOMMANDS) {
    script += `complete -c ltf -n '__fish_seen_subcommand_from config cfg' -a '${sub}'\n`;
  }

  script += '\n# Completions subcommands\n';
  for (const sub of ['bash', 'zsh', 'fish', 'install']) {
    script += `complete -c ltf -n '__fish_seen_subcommand_from completions' -a '${sub}'\n`;
  }

  script += '\n# Task option values\n';
  for (const val of STATUS_VALUES) {
    script += `complete -c ltf -n '__fish_seen_subcommand_from task t' -l status -a '${val}'\n`;
  }
  for (const val of PRIORITY_VALUES) {
    script += `complete -c ltf -n '__fish_seen_subcommand_from task t' -l priority -a '${val}'\n`;
  }
  for (const val of TYPE_VALUES) {
    script += `complete -c ltf -n '__fish_seen_subcommand_from task t' -l type -a '${val}'\n`;
  }

  return script;
}
