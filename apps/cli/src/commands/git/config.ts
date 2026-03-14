/**
 * Git config command - Manage git workflow configuration
 *
 * Usage:
 *   ltf git config                     - Interactive config editor
 *   ltf git config --show              - Display current config
 *   ltf git config --preset agile      - Apply agile preset
 *   ltf git config --preset kanban     - Apply kanban preset
 *   ltf git config --preset custom     - Custom configuration
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import output from '../../lib/output.js';
import { getErrorMessage } from '../../lib/errors.js';
import { getContext, hasProjectContext, config as confInstance } from '../../lib/config.js';
import { DEFAULT_BRANCH_PATTERN } from '../../lib/git.js';

/**
 * Git workflow configuration stored in the CLI config
 */
interface GitWorkflowConfig {
  branchPattern?: string;
  conventionalCommits?: boolean;
  autoLinkTasks?: boolean;
  autoTransitionOnCommit?: boolean;
  autoTransitionOnMerge?: boolean;
  protectedBranches?: string[];
  defaultBaseBranch?: string;
  prTemplate?: boolean;
}

/**
 * Preset workflow configurations
 */
const PRESETS: Record<string, { name: string; description: string; config: GitWorkflowConfig }> = {
  agile: {
    name: 'Agile',
    description: 'Sprint-based workflow with feature branches and conventional commits',
    config: {
      branchPattern: '(feature|fix|hotfix|bugfix|chore|refactor|release|docs)/[A-Z]+-\\d+.*',
      conventionalCommits: true,
      autoLinkTasks: true,
      autoTransitionOnCommit: true,
      autoTransitionOnMerge: true,
      protectedBranches: ['main', 'master', 'develop', 'staging'],
      defaultBaseBranch: 'develop',
      prTemplate: true,
    },
  },
  kanban: {
    name: 'Kanban',
    description: 'Continuous flow with simpler branch naming',
    config: {
      branchPattern: '(feature|fix|chore)/.*',
      conventionalCommits: true,
      autoLinkTasks: true,
      autoTransitionOnCommit: true,
      autoTransitionOnMerge: true,
      protectedBranches: ['main', 'master'],
      defaultBaseBranch: 'main',
      prTemplate: true,
    },
  },
  custom: {
    name: 'Custom',
    description: 'Start from scratch with your own configuration',
    config: {
      branchPattern: '.*',
      conventionalCommits: false,
      autoLinkTasks: true,
      autoTransitionOnCommit: false,
      autoTransitionOnMerge: false,
      protectedBranches: ['main'],
      defaultBaseBranch: 'main',
      prTemplate: false,
    },
  },
};

/**
 * Get the current git workflow config from CLI config
 */
function getGitWorkflowConfig(): GitWorkflowConfig {
  const stored = confInstance.get('gitWorkflow') as GitWorkflowConfig | undefined;
  return stored || {
    branchPattern: DEFAULT_BRANCH_PATTERN,
    conventionalCommits: true,
    autoLinkTasks: true,
    autoTransitionOnCommit: true,
    autoTransitionOnMerge: true,
    protectedBranches: ['main', 'master', 'develop'],
    defaultBaseBranch: 'main',
    prTemplate: true,
  };
}

/**
 * Save git workflow config
 */
function setGitWorkflowConfig(workflowConfig: GitWorkflowConfig): void {
  confInstance.set('gitWorkflow', workflowConfig);
}

/**
 * Display the current config in a formatted table
 */
function displayConfig(workflowConfig: GitWorkflowConfig): void {
  output.header('Git Workflow Configuration');

  const context = hasProjectContext() ? getContext() : undefined;
  if (context?.projectName) {
    output.keyValue([
      ['Project', output.colors.primary(context.projectName)],
    ]);
    output.newline();
  }

  output.keyValue([
    ['Branch pattern', workflowConfig.branchPattern || 'Any'],
    ['Conventional commits', workflowConfig.conventionalCommits ? output.colors.success('Enabled') : output.colors.muted('Disabled')],
    ['Auto-link tasks', workflowConfig.autoLinkTasks ? output.colors.success('Enabled') : output.colors.muted('Disabled')],
    ['Auto-transition on commit', workflowConfig.autoTransitionOnCommit ? output.colors.success('Enabled') : output.colors.muted('Disabled')],
    ['Auto-transition on merge', workflowConfig.autoTransitionOnMerge ? output.colors.success('Enabled') : output.colors.muted('Disabled')],
    ['Protected branches', workflowConfig.protectedBranches?.join(', ') || 'None'],
    ['Default base branch', workflowConfig.defaultBaseBranch || 'main'],
    ['PR template', workflowConfig.prTemplate ? output.colors.success('Enabled') : output.colors.muted('Disabled')],
  ]);
}

/**
 * Apply a preset configuration
 */
function applyPreset(presetName: string): void {
  const preset = PRESETS[presetName];
  if (!preset) {
    output.error(
      `Unknown preset: ${presetName}`,
      `Available presets: ${Object.keys(PRESETS).join(', ')}`
    );
    process.exit(1);
  }

  setGitWorkflowConfig(preset.config);
  output.success(`Applied '${preset.name}' preset`);
  output.newline();
  displayConfig(preset.config);
}

/**
 * Interactive configuration editor
 */
async function interactiveConfig(): Promise<void> {
  const current = getGitWorkflowConfig();

  output.header('Git Workflow Configuration');
  output.log(output.colors.muted('Configure how LTF integrates with your git workflow'));
  output.newline();

  // Step 1: Choose starting point
  const { startFrom } = await inquirer.prompt([
    {
      type: 'list',
      name: 'startFrom',
      message: 'Start from:',
      choices: [
        { name: 'Current configuration', value: 'current' },
        ...Object.entries(PRESETS).map(([key, preset]) => ({
          name: `${preset.name} — ${preset.description}`,
          value: key,
        })),
      ],
    },
  ]);

  // Determine defaults based on starting point
  const base = startFrom === 'current' ? current : (PRESETS[startFrom]?.config || current);

  // Step 2: Configure individual settings
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'branchPattern',
      message: 'Branch naming pattern (regex):',
      default: base.branchPattern || DEFAULT_BRANCH_PATTERN,
    },
    {
      type: 'confirm',
      name: 'conventionalCommits',
      message: 'Enable conventional commit parsing?',
      default: base.conventionalCommits ?? true,
    },
    {
      type: 'confirm',
      name: 'autoLinkTasks',
      message: 'Auto-link tasks from branch names?',
      default: base.autoLinkTasks ?? true,
    },
    {
      type: 'confirm',
      name: 'autoTransitionOnCommit',
      message: 'Auto-transition task status on commits?',
      default: base.autoTransitionOnCommit ?? true,
    },
    {
      type: 'confirm',
      name: 'autoTransitionOnMerge',
      message: 'Auto-complete tasks on merge to protected branch?',
      default: base.autoTransitionOnMerge ?? true,
    },
    {
      type: 'input',
      name: 'protectedBranches',
      message: 'Protected branches (comma-separated):',
      default: base.protectedBranches?.join(', ') || 'main',
    },
    {
      type: 'input',
      name: 'defaultBaseBranch',
      message: 'Default base branch for PRs:',
      default: base.defaultBaseBranch || 'main',
    },
    {
      type: 'confirm',
      name: 'prTemplate',
      message: 'Enable PR body template generation?',
      default: base.prTemplate ?? true,
    },
  ]);

  const newConfig: GitWorkflowConfig = {
    branchPattern: answers.branchPattern as string,
    conventionalCommits: answers.conventionalCommits as boolean,
    autoLinkTasks: answers.autoLinkTasks as boolean,
    autoTransitionOnCommit: answers.autoTransitionOnCommit as boolean,
    autoTransitionOnMerge: answers.autoTransitionOnMerge as boolean,
    protectedBranches: (answers.protectedBranches as string)
      .split(',')
      .map((b: string) => b.trim())
      .filter(Boolean),
    defaultBaseBranch: answers.defaultBaseBranch as string,
    prTemplate: answers.prTemplate as boolean,
  };

  setGitWorkflowConfig(newConfig);
  output.newline();
  output.success('Git workflow configuration saved');
  output.newline();
  displayConfig(newConfig);
}

/**
 * Git config command handler
 */
async function handleGitConfig(options: { show?: boolean; preset?: string }): Promise<void> {
  try {
    if (options.show) {
      const workflowConfig = getGitWorkflowConfig();
      displayConfig(workflowConfig);
      return;
    }

    if (options.preset) {
      applyPreset(options.preset);
      return;
    }

    // Interactive mode
    await interactiveConfig();

  } catch (err) {
    output.error(getErrorMessage(err));
    process.exit(1);
  }
}

/**
 * Register the config subcommand under git
 */
export function registerGitConfigCommand(parent: Command): void {
  parent
    .command('config')
    .description('Manage git workflow configuration')
    .option('-s, --show', 'Display current git workflow config')
    .option('-p, --preset <preset>', 'Apply a preset: agile, kanban, or custom')
    .action(async (options: { show?: boolean; preset?: string }) => {
      await handleGitConfig(options);
    });
}

export default registerGitConfigCommand;
