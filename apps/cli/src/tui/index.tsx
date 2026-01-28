#!/usr/bin/env node
/**
 * LTF1 TUI Dashboard Entry Point
 * Full-screen terminal application with black background
 */

import React from 'react';
import { render } from 'ink';
import { App } from './App.js';

// ANSI escape codes for terminal control
const ESC = '\x1b';
const ALTERNATE_SCREEN_ON = `${ESC}[?1049h`;
const ALTERNATE_SCREEN_OFF = `${ESC}[?1049l`;
const CLEAR_SCREEN = `${ESC}[2J`;
const CURSOR_HOME = `${ESC}[H`;
const CURSOR_HIDE = `${ESC}[?25l`;
const CURSOR_SHOW = `${ESC}[?25h`;

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

  // Cleanup function to restore terminal
  const cleanup = () => {
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
    const { waitUntilExit } = render(<App />, {
      patchConsole: false,
    });
    await waitUntilExit();
  } finally {
    cleanup();
  }
}

// If run directly
if (process.argv[1]?.includes('tui')) {
  startDashboard().catch(console.error);
}
