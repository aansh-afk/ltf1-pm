#!/usr/bin/env node
// Thin shim that exec's the platform-specific Go binary.
// The platform binary is resolved from one of @vvg-ltf1/{platform}-{arch} optional deps.

import { spawnSync } from "child_process"
import path from "path"
import os from "os"
import { fileURLToPath } from "url"
import { createRequire } from "module"

const require = createRequire(import.meta.url)

function detectPlatformAndArch() {
  const platformMap = { darwin: "darwin", linux: "linux", win32: "windows" }
  const archMap = { x64: "x64", arm64: "arm64" }
  return {
    platform: platformMap[os.platform()] || os.platform(),
    arch: archMap[os.arch()] || os.arch(),
  }
}

function findBinary() {
  const { platform, arch } = detectPlatformAndArch()
  const packageName = `@vvg-ltf1/${platform}-${arch}`
  const binaryName = platform === "windows" ? "ltf1.exe" : "ltf1"

  try {
    const packageJsonPath = require.resolve(`${packageName}/package.json`)
    const packageDir = path.dirname(packageJsonPath)
    return path.join(packageDir, "bin", binaryName)
  } catch (error) {
    console.error(
      `Could not find package ${packageName}: ${error.message}\n` +
      `Your platform (${os.platform()}/${os.arch()}) may not be supported.`
    )
    process.exit(1)
  }
}

const binaryPath = findBinary()
const result = spawnSync(binaryPath, process.argv.slice(2), {
  stdio: "inherit",
})

if (result.error) {
  console.error(`Failed to execute ltf1: ${result.error.message}`)
  process.exit(1)
}

process.exit(result.status ?? 0)
