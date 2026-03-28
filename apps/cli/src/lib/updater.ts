/**
 * Auto-update system for the LTF CLI
 * Checks npm registry for new versions and handles upgrades
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export interface UpdateInfo {
  available: boolean;
  current: string;
  latest: string;
}

/**
 * Read the current CLI version from package.json
 */
export function getCurrentVersion(): string {
  try {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    // Walk up from lib/ to the package root
    const pkgPath = join(__dirname, "..", "..", "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    return pkg.version || "0.0.0";
  } catch {
    return "0.1.0-beta.3";
  }
}

/**
 * Check the npm registry for a newer version.
 * Non-blocking — swallows errors so it never disrupts normal CLI usage.
 */
export async function checkForUpdate(): Promise<UpdateInfo> {
  const currentVersion = getCurrentVersion();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch("https://registry.npmjs.org/@vvg-ltf1/cli", {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return { available: false, current: currentVersion, latest: currentVersion };
    }

    const data = (await response.json()) as {
      "dist-tags"?: { latest?: string };
    };
    const latest = data["dist-tags"]?.latest || currentVersion;

    return {
      available: latest !== currentVersion,
      current: currentVersion,
      latest,
    };
  } catch {
    return { available: false, current: currentVersion, latest: currentVersion };
  }
}

/**
 * Run the actual npm install to upgrade the CLI in-place.
 * Returns true on success.
 */
export async function performUpdate(): Promise<boolean> {
  try {
    execSync("npm install -g @vvg-ltf1/cli@latest", {
      stdio: "pipe",
      timeout: 60_000,
    });
    return true;
  } catch {
    return false;
  }
}
