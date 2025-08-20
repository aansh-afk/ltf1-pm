import type { Command, CommandContext, CommandResult } from '../types'

export const gitCommands: Command[] = [
  {
    name: 'git',
    aliases: ['g'],
    description: 'Git integration commands',
    usage: 'git [status|branch|commit|push|pull|pr] [options]',
    examples: [
      'git status',
      'git branch feature/new-feature',
      'git commit "Fix bug"',
      'git pr "Add new feature"'
    ],
    execute: async (args, context) => {
      const subcommand = args[0]
      
      switch (subcommand) {
        case 'status':
        case 'st':
          return showGitStatus(context)
        case 'branch':
        case 'br':
          return manageBranch(args.slice(1), context)
        case 'commit':
        case 'ci':
          return createCommit(args.slice(1), context)
        case 'push':
          return pushChanges(args.slice(1), context)
        case 'pull':
          return pullChanges(args.slice(1), context)
        case 'pr':
        case 'pull-request':
          return createPullRequest(args.slice(1), context)
        case 'merge':
          return mergeBranch(args.slice(1), context)
        case 'log':
          return showGitLog(context)
        case 'sync':
          return syncWithGitHub(context)
        default:
          return {
            success: false,
            output: `Unknown git command: ${subcommand}\nUsage: ${gitCommands[0].usage}`,
            type: 'error'
          }
      }
    }
  }
]

function showGitStatus(context: CommandContext): CommandResult {
  let output = '╔════════════════════════════════════════════════════════════════╗\n'
  output += '║                       GIT STATUS                              ║\n'
  output += '╚════════════════════════════════════════════════════════════════╝\n\n'
  
  output += 'On branch: main\n'
  output += 'Your branch is up to date with \'origin/main\'.\n\n'
  
  output += 'Changes to be committed:\n'
  output += '  (use "git restore --staged <file>..." to unstage)\n'
  output += '        modified:   src/components/terminal/CommandTerminal.tsx\n'
  output += '        new file:   src/components/terminal/commands/\n\n'
  
  output += 'Changes not staged for commit:\n'
  output += '  (use "git add <file>..." to update what will be committed)\n'
  output += '        modified:   src/hooks/useAuth.ts\n\n'
  
  output += 'Untracked files:\n'
  output += '  (use "git add <file>..." to include in what will be committed)\n'
  output += '        test-convex.html\n'

  return {
    success: true,
    output,
    type: 'output'
  }
}

function manageBranch(args: string[], context: CommandContext): CommandResult {
  const branchName = args[0]
  
  if (!branchName) {
    // List branches
    let output = 'LOCAL BRANCHES:\n'
    output += '─────────────────────────────────────────────────────────────────\n'
    output += '* main\n'
    output += '  feature/command-terminal\n'
    output += '  feature/brutalist-theme\n'
    output += '  bugfix/auth-issues\n\n'
    output += 'REMOTE BRANCHES:\n'
    output += '─────────────────────────────────────────────────────────────────\n'
    output += '  origin/main\n'
    output += '  origin/develop\n'
    output += '  origin/feature/command-terminal'
    
    return {
      success: true,
      output,
      type: 'output'
    }
  }
  
  // Create new branch
  return {
    success: true,
    output: `✓ Branch created and switched to '${branchName}'`,
    type: 'success'
  }
}

function createCommit(args: string[], context: CommandContext): CommandResult {
  const message = args.join(' ').replace(/^["']|["']$/g, '')
  
  if (!message) {
    return {
      success: false,
      output: 'Commit message required\nUsage: git commit "message"',
      type: 'error'
    }
  }

  const amendFlag = context.flags.includes('--amend')
  const noVerifyFlag = context.flags.includes('--no-verify')

  return {
    success: true,
    output: `✓ Changes committed\n` +
            `  Message: ${message}\n` +
            `  Files: 12 changed, 450 insertions(+), 23 deletions(-)\n` +
            `  Hash: ${Math.random().toString(36).substring(2, 9)}\n` +
            (amendFlag ? '  Note: Amended previous commit\n' : '') +
            (noVerifyFlag ? '  Note: Pre-commit hooks skipped\n' : ''),
    type: 'success'
  }
}

function pushChanges(args: string[], context: CommandContext): CommandResult {
  const remote = args[0] || 'origin'
  const branch = args[1] || 'main'
  const forceFlag = context.flags.includes('--force') || context.flags.includes('-f')
  
  return {
    success: true,
    output: `✓ Pushed to ${remote}/${branch}\n` +
            `  Commits: 3\n` +
            `  Files: 12\n` +
            (forceFlag ? '  ⚠️  Force pushed\n' : '') +
            `\n💡 View changes at: https://github.com/yourrepo/pulls`,
    type: 'success'
  }
}

function pullChanges(args: string[], context: CommandContext): CommandResult {
  const remote = args[0] || 'origin'
  const branch = args[1] || 'main'
  
  return {
    success: true,
    output: `✓ Pulled from ${remote}/${branch}\n` +
            `  Fast-forward\n` +
            `  Files changed: 5\n` +
            `  Insertions: 120\n` +
            `  Deletions: 45\n` +
            `\nYour branch is up to date.`,
    type: 'success'
  }
}

function createPullRequest(args: string[], context: CommandContext): CommandResult {
  const title = args.join(' ').replace(/^["']|["']$/g, '')
  
  if (!title) {
    return {
      success: false,
      output: 'PR title required\nUsage: git pr "title"',
      type: 'error'
    }
  }

  const draftFlag = context.flags.includes('--draft')
  const reviewers = context.flags.find(f => f.startsWith('--reviewers='))?.split('=')[1]

  const prNumber = Math.floor(Math.random() * 1000) + 100

  return {
    success: true,
    output: `✓ Pull Request created\n` +
            `  PR #${prNumber}: ${title}\n` +
            `  Base: main ← feature/command-terminal\n` +
            `  Status: ${draftFlag ? 'Draft' : 'Open'}\n` +
            (reviewers ? `  Reviewers: ${reviewers}\n` : '') +
            `  URL: https://github.com/yourrepo/pull/${prNumber}\n` +
            `\n💡 Checks are running...`,
    type: 'success'
  }
}

function mergeBranch(args: string[], context: CommandContext): CommandResult {
  const branch = args[0]
  
  if (!branch) {
    return {
      success: false,
      output: 'Branch name required\nUsage: git merge <branch>',
      type: 'error'
    }
  }

  const squashFlag = context.flags.includes('--squash')
  const noFFFlag = context.flags.includes('--no-ff')

  return {
    success: true,
    output: `✓ Merged '${branch}' into current branch\n` +
            `  Merge strategy: ${squashFlag ? 'Squash' : noFFFlag ? 'No Fast-Forward' : 'Fast-Forward'}\n` +
            `  Files changed: 8\n` +
            `  Conflicts: None\n` +
            `\nAll changes merged successfully.`,
    type: 'success'
  }
}

function showGitLog(context: CommandContext): CommandResult {
  const onelineFlag = context.flags.includes('--oneline')
  const limit = context.flags.find(f => f.startsWith('-'))?.replace('-', '') || '5'
  
  let output = 'COMMIT HISTORY:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  
  if (onelineFlag) {
    output += 'a3f4b2c feat: Add comprehensive command system\n'
    output += '9d8e7f6 fix: Resolve authentication issues\n'
    output += '2c3d4e5 style: Apply brutalist theme\n'
    output += '7b8c9d0 docs: Update README\n'
    output += '1a2b3c4 init: Initial commit'
  } else {
    output += 'commit a3f4b2c1d2e3f4g5h6i7j8k9\n'
    output += 'Author: You <you@example.com>\n'
    output += 'Date:   ' + new Date().toLocaleString() + '\n\n'
    output += '    feat: Add comprehensive command system\n\n'
    output += 'commit 9d8e7f6a5b4c3d2e1f0g9h8i\n'
    output += 'Author: You <you@example.com>\n'
    output += 'Date:   ' + new Date(Date.now() - 86400000).toLocaleString() + '\n\n'
    output += '    fix: Resolve authentication issues\n'
  }

  return {
    success: true,
    output,
    type: 'output'
  }
}

function syncWithGitHub(context: CommandContext): CommandResult {
  let output = '╔════════════════════════════════════════════════════════════════╗\n'
  output += '║                    GITHUB SYNC STATUS                         ║\n'
  output += '╚════════════════════════════════════════════════════════════════╝\n\n'
  
  output += 'SYNCING WITH GITHUB:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  output += '✓ Issues synchronized (12 new, 5 updated)\n'
  output += '✓ Pull requests updated (3 new, 2 merged)\n'
  output += '✓ Actions status checked (all passing)\n'
  output += '✓ Webhooks configured\n\n'
  
  output += 'GITHUB STATS:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  output += 'Open Issues:     23\n'
  output += 'Open PRs:        5\n'
  output += 'Stars:           ⭐ 156\n'
  output += 'Forks:           🍴 42\n'
  output += 'Contributors:    👥 8\n\n'
  
  output += '💡 RECENT ACTIVITY:\n'
  output += '  • PR #102 merged: "Add command terminal"\n'
  output += '  • Issue #45 closed: "Fix authentication"\n'
  output += '  • New issue #103: "Improve performance"'

  return {
    success: true,
    output,
    type: 'info'
  }
}