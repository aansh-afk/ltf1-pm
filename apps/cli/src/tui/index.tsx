#!/usr/bin/env node
/**
 * LTF1 TUI Dashboard Entry Point
 * Full-screen terminal application with mouse support
 */

import { render } from 'ink';
import { MouseProvider } from '@zenobius/ink-mouse';
import { App } from './App.js';

// ANSI escape codes for terminal control
const ESC = '\x1b';
const ALTERNATE_SCREEN_ON = `${ESC}[?1049h`;
const ALTERNATE_SCREEN_OFF = `${ESC}[?1049l`;
const CLEAR_SCREEN = `${ESC}[2J`;
const CURSOR_HOME = `${ESC}[H`;
const CURSOR_HIDE = `${ESC}[?25l`;
const CURSOR_SHOW = `${ESC}[?25h`;

// Mouse tracking: SGR extended mode (works in most modern terminals)
const MOUSE_ENABLE = `${ESC}[?1003h${ESC}[?1006h`;
const MOUSE_DISABLE = `${ESC}[?1003l${ESC}[?1006l`;

// Ink's clearTerminal sequence: erase screen + erase scrollback + cursor home.
// When output height >= terminal rows, ink writes this before every frame,
// causing a visible flash of the default background. We replace it with just
// cursor-home so ink overwrites content in-place without clearing first.
const INK_CLEAR_TERMINAL = `${ESC}[2J${ESC}[3J${ESC}[H`;

export async function startDashboard() {
  // Check if we're in a TTY environment
  if (!process.stdin.isTTY) {
    console.error('Dashboard requires an interactive terminal (TTY).');
    console.error('Run this command in a terminal that supports raw mode.');
    process.exit(1);
  }

  // Switch to alternate screen buffer (like vim/htop)
  process.stdout.write(ALTERNATE_SCREEN_ON);
  process.stdout.write(CLEAR_SCREEN);
  process.stdout.write(CURSOR_HOME);
  process.stdout.write(CURSOR_HIDE);

  // Enable mouse tracking
  process.stdout.write(MOUSE_ENABLE);

  // Let Ink's clear sequence run normally — this fixes the ghost text bug
  // where old content stays on screen when the rendered height shrinks.
  const origWrite = process.stdout.write;

  // Cleanup function to restore terminal
  const cleanup = () => {
    process.stdout.write = origWrite;
    process.stdout.write(MOUSE_DISABLE);
    process.stdout.write(CURSOR_SHOW);
    process.stdout.write(ALTERNATE_SCREEN_OFF);
  };

  // Handle various exit signals
  process.on('exit', cleanup);
  process.on('SIGINT', () => {
    cleanup();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    cleanup();
    process.exit(0);
  });

  try {
    const { waitUntilExit } = render(
      <MouseProvider>
        <App />
      </MouseProvider>,
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
