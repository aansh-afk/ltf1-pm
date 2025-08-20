export type ShortcutCategory = 
  | 'navigation' 
  | 'quick-actions' 
  | 'task-operations' 
  | 'meeting-operations' 
  | 'general'
  | 'custom'

export type ShortcutContext = 'global' | 'modal' | 'page' | 'input' | 'task' | 'meeting'

export type ModifierKey = 'ctrl' | 'alt' | 'shift' | 'meta'

export interface KeyCombo {
  modifiers: ModifierKey[]
  key: string // The actual key (e.g., 'k', 'Enter', 'ArrowUp')
  display?: string // Display string (e.g., "Ctrl+K" or "⌘K")
  code?: string // KeyboardEvent.code for special keys
}

export interface Shortcut {
  id: string
  name: string
  description: string
  category: ShortcutCategory
  defaultKeys: KeyCombo
  customKeys?: KeyCombo
  enabled: boolean
  context: ShortcutContext
  action?: () => void | Promise<void>
  command?: string // For command-based actions
  whenFocused?: string[] // Component IDs where shortcut works
  preventInInput?: boolean // Prevent when typing in input fields
  global?: boolean // Works everywhere except when disabled
}

export interface ShortcutGroup {
  id: string
  name: string
  category: ShortcutCategory
  shortcuts: Shortcut[]
  icon?: string
  description?: string
}

export interface ShortcutPreferences {
  showHints: boolean
  enableSounds: boolean
  conflictWarnings: boolean
  theme: 'default' | 'vim' | 'emacs' | 'custom'
}

export interface ShortcutConflict {
  shortcutId1: string
  shortcutId2: string
  keyCombo: KeyCombo
  severity: 'error' | 'warning' | 'info'
}

// Command palette types
export interface Command {
  id: string
  name: string
  description?: string
  icon?: React.ReactNode
  shortcut?: KeyCombo
  action: () => void | Promise<void>
  category?: string
  keywords?: string[]
  recent?: boolean
  pinned?: boolean
}

export interface CommandGroup {
  id: string
  name: string
  commands: Command[]
}

// Shortcut recording types
export interface RecordingState {
  isRecording: boolean
  keys: KeyCombo | null
  conflicts: ShortcutConflict[]
  error?: string
}

// Storage types
export interface ShortcutStorage {
  custom: Record<string, KeyCombo>
  disabled: string[]
  preferences: ShortcutPreferences
  recent: string[] // Recent command IDs
  pinned: string[] // Pinned command IDs
}

// Event types
export type ShortcutEventType = 'execute' | 'conflict' | 'disabled' | 'error'

export interface ShortcutEvent {
  type: ShortcutEventType
  shortcutId?: string
  keyCombo?: KeyCombo
  error?: string
  timestamp: number
}

// Utility types
export type KeyboardEventHandler = (event: KeyboardEvent) => boolean | void
export type ShortcutHandler = (shortcut: Shortcut) => void | Promise<void>

// Platform detection
export interface Platform {
  isMac: boolean
  isWindows: boolean
  isLinux: boolean
  modifierKey: 'cmd' | 'ctrl'
  modifierSymbol: '⌘' | 'Ctrl'
}

// Export utilities for key codes and names
export const SPECIAL_KEYS: Record<string, string> = {
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  Enter: '↵',
  Escape: 'Esc',
  Backspace: '⌫',
  Delete: 'Del',
  Tab: '⇥',
  Space: '␣',
  PageUp: 'PgUp',
  PageDown: 'PgDn',
  Home: 'Home',
  End: 'End'
}

export const MODIFIER_SYMBOLS: Record<string, Record<ModifierKey, string>> = {
  mac: {
    ctrl: '⌃',
    alt: '⌥',
    shift: '⇧',
    meta: '⌘'
  },
  other: {
    ctrl: 'Ctrl',
    alt: 'Alt',
    shift: 'Shift',
    meta: 'Win'
  }
}