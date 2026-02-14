/**
 * Config commands for the LTF CLI
 * Manages CLI configuration: list, get, set, path
 */

import { Command } from 'commander';
import { config, getConfig, getConfigPath } from '../../lib/config.js';
import output from '../../lib/output.js';

export function registerConfigCommands(program: Command): void {
  const configCmd = program
    .command('config')
    .alias('cfg')
    .description('CLI configuration management');

  // ltf config list
  configCmd
    .command('list')
    .alias('ls')
    .description('Show all configuration')
    .option('--json', 'Output as JSON (default)')
    .action(() => {
      const cfg = getConfig();
      output.json(cfg);
    });

  // ltf config get <key>
  configCmd
    .command('get <key>')
    .description('Get a config value (use dot notation, e.g. preferences.colorOutput)')
    .action((key: string) => {
      const value = config.get(key as never);
      if (value === undefined) {
        output.error(`Key not found: ${key}`);
        process.exit(1);
      }
      if (typeof value === 'object' && value !== null) {
        output.json(value);
      } else {
        output.log(String(value));
      }
    });

  // ltf config set <key> <value>
  configCmd
    .command('set <key> <value>')
    .description('Set a config value (use dot notation, e.g. preferences.colorOutput true)')
    .action((key: string, value: string) => {
      // Parse value types
      let parsedValue: unknown = value;
      if (value === 'true') parsedValue = true;
      else if (value === 'false') parsedValue = false;
      else if (/^\d+$/.test(value)) parsedValue = parseInt(value, 10);

      config.set(key as never, parsedValue as never);
      output.success(`Set ${key} = ${String(parsedValue)}`);
    });

  // ltf config path
  configCmd
    .command('path')
    .description('Show config file location')
    .action(() => {
      output.log(getConfigPath());
    });

  // ltf config reset
  configCmd
    .command('reset')
    .description('Reset all configuration to defaults')
    .option('-f, --force', 'Skip confirmation warning')
    .action((options: { force?: boolean }) => {
      if (!options.force) {
        output.warning('This will reset all CLI configuration to defaults');
        output.log(output.colors.muted('  Re-run with --force to confirm'));
        return;
      }
      config.clear();
      output.success('Configuration reset to defaults');
    });

  // Default: show config list
  configCmd.action(() => {
    const cfg = getConfig();
    output.json(cfg);
  });
}
