/**
 * Shell completions command
 * Generates completion scripts for bash, zsh, and fish
 */

import { Command } from 'commander';
import { generateBashCompletions, generateZshCompletions, generateFishCompletions } from '../../lib/completions.js';
import output from '../../lib/output.js';

export function registerCompletionCommands(program: Command): void {
  const completionsCmd = program
    .command('completions')
    .description('Generate shell completions');

  completionsCmd
    .command('bash')
    .description('Generate bash completions')
    .action(() => {
      console.log(generateBashCompletions());
    });

  completionsCmd
    .command('zsh')
    .description('Generate zsh completions')
    .action(() => {
      console.log(generateZshCompletions());
    });

  completionsCmd
    .command('fish')
    .description('Generate fish completions')
    .action(() => {
      console.log(generateFishCompletions());
    });

  completionsCmd
    .command('install')
    .description('Show instructions to install completions for your shell')
    .action(() => {
      const shell = process.env.SHELL || '';
      if (shell.includes('zsh')) {
        output.info('Add to your ~/.zshrc:');
        output.log('  eval "$(ltf completions zsh)"');
      } else if (shell.includes('fish')) {
        output.info('Run:');
        output.log('  ltf completions fish > ~/.config/fish/completions/ltf.fish');
      } else {
        output.info('Add to your ~/.bashrc:');
        output.log('  eval "$(ltf completions bash)"');
      }
    });
}
