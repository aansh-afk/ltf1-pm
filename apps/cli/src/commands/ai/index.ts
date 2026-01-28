/**
 * AI Commands for the LTF CLI
 * Provides AI-powered suggestions, analysis, and task generation
 */

import { Command } from 'commander';
import { suggestCommand } from './suggest.js';
import { analyzeCommand } from './analyze.js';
import { describeCommand } from './describe.js';

/**
 * Register all AI-related commands
 */
export function registerAICommands(program: Command): void {
  const ai = program
    .command('ai')
    .description('AI-powered features for task management');

  // ltf ai suggest - Get AI suggestions from git activity
  ai.command('suggest')
    .description('Analyze recent git commits and suggest tasks to create')
    .option('-n, --count <number>', 'Number of commits to analyze', '10')
    .option('--json', 'Output in JSON format')
    .action(suggestCommand);

  // ltf ai analyze - Analyze current sprint health
  ai.command('analyze')
    .description('Analyze current sprint health with AI insights')
    .option('-s, --sprint <id>', 'Sprint ID to analyze (defaults to active sprint)')
    .option('--json', 'Output in JSON format')
    .action(analyzeCommand);

  // ltf ai describe - Generate task description from brief input
  ai.command('describe')
    .argument('<brief>', 'Brief description of the task')
    .description('Generate detailed task description from brief input')
    .option('--create', 'Create the task after generating details')
    .option('--json', 'Output in JSON format')
    .action(describeCommand);
}
