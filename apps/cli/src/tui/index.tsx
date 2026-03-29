#!/usr/bin/env node
/**
 * LTF1 TUI Dashboard Entry Point
 * Full-screen terminal application with synchronized output to eliminate flicker.
 *
 * Rendering strategy:
 * 1. Use alternate screen buffer (like vim/htop)
 * 2. Wrap every Ink render frame in DEC mode 2026 synchronized output
 *    (BSU/ESU) so the terminal buffers all writes and flushes atomically
 * 3. Replace Ink's erase-all-lines + rewrite with cursor-home + overwrite
 *    + pad remaining lines to prevent ghost text
 * 4. Enable mouse tracking (SGR extended mode)
 */

import { render } from 'ink';
import { App } from './App.js';

// ANSI escape codes
const ESC = '\x1b';
const ALTERNATE_SCREEN_ON = `${ESC}[?1049h`;
const ALTERNATE_SCREEN_OFF = `${ESC}[?1049l`;
const CLEAR_SCREEN = `${ESC}[2J`;
const CURSOR_HOME = `${ESC}[H`;
const CURSOR_HIDE = `${ESC}[?25l`;
const CURSOR_SHOW = `${ESC}[?25h`;

// Synchronized output (DEC mode 2026) — eliminates flicker
const BSU = `${ESC}[?2026h`; // Begin Synchronized Update
const ESU = `${ESC}[?2026l`; // End Synchronized Update

// Mouse tracking: SGR extended mode
const MOUSE_ENABLE = `${ESC}[?1003h${ESC}[?1006h`;
const MOUSE_DISABLE = `${ESC}[?1003l${ESC}[?1006l`;

// Ink's clear terminal sequence (erase screen + erase scrollback + home)
const INK_CLEAR_TERMINAL = `${ESC}[2J${ESC}[3J${ESC}[H`;

export async function startDashboard() {
  if (!process.stdin.isTTY) {
    console.error('Dashboard requires an interactive terminal (TTY).');
    process.exit(1);
  }

  // Switch to alternate screen buffer
  process.stdout.write(ALTERNATE_SCREEN_ON);
  process.stdout.write(CLEAR_SCREEN);
  process.stdout.write(CURSOR_HOME);
  process.stdout.write(CURSOR_HIDE);
  process.stdout.write(MOUSE_ENABLE);

  // Intercept Ink's writes to:
  // 1. Wrap render frames in synchronized output (BSU/ESU)
  // 2. Replace destructive clear with cursor-home (prevents flash)
  // 3. Pad output to fill terminal height (prevents ghost text from shorter frames)
  const origWrite = process.stdout.write;
  const stdout = process.stdout;
  let lastOutputHeight = 0;

  process.stdout.write = function (
    this: typeof stdout,
    chunk: unknown,
    ...args: unknown[]
  ): boolean {
    if (typeof chunk === 'string') {
      // Detect Ink's render frame (contains the clear sequence)
      if (chunk.includes(INK_CLEAR_TERMINAL)) {
        // Replace clear-all with cursor-home (no flash)
        let output = chunk.replace(INK_CLEAR_TERMINAL, CURSOR_HOME);

        // Count lines in this frame
        const lines = output.split('\n').length;
        const termHeight = process.stdout.rows || 40;

        // Pad with blank lines to fill terminal and overwrite any ghost text
        if (lines < termHeight) {
          const padding = '\n' + `${ESC}[2K`.repeat(termHeight - lines);
          output += padding;
        }

        lastOutputHeight = lines;

        // Wrap entire frame in synchronized output
        return (origWrite as Function).call(this, BSU + output + ESU);
      }
    }
    return (origWrite as Function).apply(this, [chunk, ...args]);
  } as typeof process.stdout.write;

  const cleanup = () => {
    process.stdout.write = origWrite;
    process.stdout.write(MOUSE_DISABLE);
    process.stdout.write(CURSOR_SHOW);
    process.stdout.write(ALTERNATE_SCREEN_OFF);
  };

  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(0); });
  process.on('SIGTERM', () => { cleanup(); process.exit(0); });

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

// If run directly
if (process.argv[1]?.includes('tui')) {
  startDashboard().catch(console.error);
}
