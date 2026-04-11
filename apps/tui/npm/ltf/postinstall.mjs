#!/usr/bin/env node

import fs from "fs"
import path from "path"
import os from "os"
import { fileURLToPath } from "url"
import { createRequire } from "module"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
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
  const binaryName = platform === "windows" ? "ltf.exe" : "ltf"

  try {
    const packageJsonPath = require.resolve(`${packageName}/package.json`)
    const packageDir = path.dirname(packageJsonPath)
    const binaryPath = path.join(packageDir, "bin", binaryName)

    if (!fs.existsSync(binaryPath)) {
      throw new Error(`Binary not found at ${binaryPath}`)
    }

    return { binaryPath, binaryName }
  } catch (error) {
    throw new Error(
      `Could not find package ${packageName}: ${error.message}\n` +
      `Your platform (${os.platform()}/${os.arch()}) may not be supported yet.`
    )
  }
}

async function main() {
  try {
    if (os.platform() === "win32") {
      console.log("Windows: binary setup handled by package manager")
      return
    }

    const { binaryPath } = findBinary()
    const target = path.join(__dirname, "bin", "ltf")

    const binDir = path.join(__dirname, "bin")
    if (!fs.existsSync(binDir)) {
      fs.mkdirSync(binDir, { recursive: true })
    }

    if (fs.existsSync(target)) fs.unlinkSync(target)

    try {
      fs.linkSync(binaryPath, target)
    } catch {
      fs.copyFileSync(binaryPath, target)
    }
    fs.chmodSync(target, 0o755)
    console.log(`ltf binary installed successfully`)
  } catch (error) {
    console.error("Failed to setup ltf binary:", error.message)
    process.exit(1)
  }
}

main()
