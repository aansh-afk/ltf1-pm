#!/usr/bin/env node
/**
 * LTF1 TUI Dashboard Entry Point
 */

import React from 'react';
import { render } from 'ink';
import { App } from './App.js';

export function startDashboard() {
  // Check if we're in a TTY environment
  if (!process.stdin.isTTY) {
    console.error('Dashboard requires an interactive terminal (TTY).');
    console.error('Run this command in a terminal that supports raw mode.');
    process.exit(1);
  }

  const { waitUntilExit } = render(<App />);
  return waitUntilExit();
}

// If run directly
if (process.argv[1]?.includes('tui')) {
  startDashboard().catch(console.error);
}
