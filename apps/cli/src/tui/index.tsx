#!/usr/bin/env node
/**
 * LTF1 TUI Dashboard Entry Point
 * Full-screen terminal application with synchronized output to eliminate flicker.
 */

import { render } from 'ink';
import { App } from './App.js';

const ESC = '\x1b';
const ALTERNATE_SCREEN_ON = `${ESC}[?1049h`;
const ALTERNATE_SCREEN_OFF = `${ESC}[?1049l`;
const CLEAR_SCREEN = `${ESC}[2J`;
const CURSOR_HOME = `${ESC}[H`;
const CURSOR_HIDE = `${ESC}[?25l`;
const CURSOR_SHOW = `${ESC}[?25h`;

// Synchronized output (DEC mode 2026) — terminal buffers writes, flushes atomically
const BSU = `${ESC}[?2026h`;
const ESU = `${ESC}[?2026l`;

// Mouse tracking
const MOUSE_ENABLE = `${ESC}[?1003h${ESC}[?1006h`;
const MOUSE_DISABLE = `${ESC}[?1003l${ESC}[?1006l`;

// Ink's clear terminal sequence
const INK_CLEAR_TERMINAL = `${ESC}[2J${ESC}[3J${ESC}[H`;

export async function startDashboard() {
  if (!process.stdin.isTTY) {
    console.error('Dashboard requires an interactive terminal (TTY).');
    process.exit(1);
  }

  process.stdout.write(ALTERNATE_SCREEN_ON);
  process.stdout.write(CLEAR_SCREEN);
  process.stdout.write(CURSOR_HOME);
  process.stdout.write(CURSOR_HIDE);
  process.stdout.write(MOUSE_ENABLE);

  const origWrite = process.stdout.write;

  // Intercept Ink's writes: replace destructive clear with cursor-home,
  // wrap in synchronized output to prevent flicker.
  process.stdout.write = function (
    this: NodeJS.WriteStream,
    chunk: unknown,
    ...args: unknown[]
  ): boolean {
    try {
      if (typeof chunk === 'string' && chunk.includes(INK_CLEAR_TERMINAL)) {
        // Replace clear-all with cursor-home (overwrite in place, no flash)
        const output = chunk.replace(INK_CLEAR_TERMINAL, CURSOR_HOME);
        // Wrap in synchronized output
        return (origWrite as Function).call(this, BSU + output + ESU);
      }
      return (origWrite as Function).apply(this, [chunk, ...args]);
    } catch {
      // If write fails, fall through to original
      return (origWrite as Function).apply(this, [chunk, ...args]);
    }
  } as typeof process.stdout.write;

  const cleanup = () => {
    try {
      process.stdout.write = origWrite;
      origWrite.call(process.stdout, MOUSE_DISABLE);
      origWrite.call(process.stdout, CURSOR_SHOW);
      origWrite.call(process.stdout, ALTERNATE_SCREEN_OFF);
    } catch {
      // ignore cleanup errors
    }
  };

  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(0); });
  process.on('SIGTERM', () => { cleanup(); process.exit(0); });

  // Catch uncaught errors so they don't kill the TUI silently
  process.on('uncaughtException', (err) => {
    cleanup();
    console.error('LTF1 TUI crashed:', err.message);
    process.exit(1);
  });

  try {
    const { waitUntilExit } = render(
      <App />,
      {
        patchConsole: false,
      },
    );
    await waitUntilExit();
  } finally {
    cleanup();
  }
}

if (process.argv[1]?.includes('tui')) {
  startDashboard().catch(console.error);
}
