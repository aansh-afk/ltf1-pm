/**
 * Manual update command for the LTF CLI
 * Usage: ltf update
 */

import { Command } from "commander";
import output from "../lib/output.js";
import { checkForUpdate, performUpdate } from "../lib/updater.js";

export function registerUpdateCommand(program: Command): void {
  program
    .command("update")
    .description("Check for and install CLI updates")
    .option("--check", "Only check for updates, do not install")
    .action(async (options: { check?: boolean }) => {
      const spin = output.spinner("Checking for updates...");

      const info = await checkForUpdate();
      spin.stop();

      if (!info.available) {
        output.success(`You are on the latest version (${info.current})`);
        return;
      }

      output.info(`Update available: ${output.colors.muted(info.current)} → ${output.colors.success(info.latest)}`);

      if (options.check) {
        output.log(output.colors.muted("Run `ltf update` to install"));
        return;
      }

      const installSpin = output.spinner("Installing update...");
      const ok = await performUpdate();
      installSpin.stop();

      if (ok) {
        output.success(`Updated to v${info.latest}`);
        output.log(output.colors.muted("Restart your terminal to use the new version"));
      } else {
        output.error(
          "Update failed",
          `Try manually: npm install -g @vvg-ltf1/cli@latest`,
        );
        process.exit(1);
      }
    });
}
