import type { Shortcut, ShortcutGroup } from '../types/shortcuts'

// Helper to detect platform
export const getPlatform = () => {
  // Check if we're in a browser environment
  if (typeof navigator === 'undefined') {
    return {
      isMac: false,
      isWindows: false,
      isLinux: false,
      modifierKey: 'ctrl' as const,
      modifierSymbol: 'Ctrl'
    }
  }
  
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const isWindows = navigator.platform.toUpperCase().indexOf('WIN') >= 0
  const isLinux = navigator.platform.toUpperCase().indexOf('LINUX') >= 0
  
  return {
    isMac,
    isWindows,
    isLinux,
    modifierKey: isMac ? 'cmd' as const : 'ctrl' as const,
    modifierSymbol: isMac ? '⌘' : 'Ctrl'
  }
}

// Don't call getPlatform at module initialization time
// Instead, use a getter function
const getPlatformSafe = () => {
  if (typeof navigator === 'undefined') {
    return { isMac: false, modifierSymbol: 'Ctrl' }
  }
  return getPlatform()
}

const platform = getPlatformSafe()
const mod = platform.isMac ? 'meta' as const : 'ctrl' as const

// Navigation shortcuts
export const navigationShortcuts: Shortcut[] = [
  {
    id: 'nav.dashboard',
    name: 'Go to Dashboard',
    description: 'Navigate to the dashboard',
    category: 'navigation',
    defaultKeys: { modifiers: [mod], key: 'd', display: `${platform.modifierSymbol}+D` },
    enabled: true,
    context: 'global',
    command: '/dashboard',
    preventInInput: true
  },
  {
    id: 'nav.projects',
    name: 'Go to Projects',
    description: 'Navigate to projects page',
    category: 'navigation',
    defaultKeys: { modifiers: [mod], key: 'p', display: `${platform.modifierSymbol}+P` },
    enabled: true,
    context: 'global',
    command: '/projects',
    preventInInput: true
  },
  {
    id: 'nav.settings',
    name: 'Go to Settings',
    description: 'Open settings page',
    category: 'navigation',
    defaultKeys: { modifiers: [mod], key: ',', display: `${platform.modifierSymbol}+,` },
    enabled: true,
    context: 'global',
    command: '/settings',
    preventInInput: true
  }
]

// Quick action shortcuts
export const quickActionShortcuts: Shortcut[] = [
  {
    id: 'action.commandPalette',
    name: 'Command Palette',
    description: 'Open command palette',
    category: 'quick-actions',
    defaultKeys: { modifiers: [mod], key: 'k', display: `${platform.modifierSymbol}+K` },
    enabled: true,
    context: 'global',
    command: 'commandPalette',
    preventInInput: true,
    global: true
  }
]

// General shortcuts
export const generalShortcuts: Shortcut[] = [
  {
    id: 'general.help',
    name: 'Show Help',
    description: 'Show keyboard shortcuts help',
    category: 'general',
    defaultKeys: { modifiers: ['shift'], key: '?', display: '?' },
    enabled: true,
    context: 'global',
    command: 'showHelp',
    preventInInput: true,
    global: true
  },
  {
    id: 'general.escape',
    name: 'Close/Cancel',
    description: 'Close modal or cancel action',
    category: 'general',
    defaultKeys: { modifiers: [], key: 'Escape', display: 'Esc' },
    enabled: true,
    context: 'global',
    command: 'escape',
    preventInInput: false,
    global: true
  },
  {
    id: 'general.toggleSidebar',
    name: 'Toggle Sidebar',
    description: 'Show/hide sidebar',
    category: 'general',
    defaultKeys: { modifiers: [mod], key: 'b', display: `${platform.modifierSymbol}+B` },
    enabled: true,
    context: 'global',
    command: 'toggleSidebar',
    preventInInput: true
  }
]

// Project page shortcuts
export const projectPageShortcuts: Shortcut[] = [
  {
    id: 'project.newTask',
    name: 'Create New Task',
    description: 'Open the create task modal',
    category: 'project',
    defaultKeys: { modifiers: [], key: 'n', display: 'N' },
    enabled: true,
    context: 'page',
    preventInInput: true
  },
  {
    id: 'project.toggleMyTasks',
    name: 'Toggle My Tasks',
    description: 'Filter to show only your assigned tasks',
    category: 'project',
    defaultKeys: { modifiers: [], key: 'm', display: 'M' },
    enabled: true,
    context: 'page',
    preventInInput: true
  },
  {
    id: 'project.focusSearch',
    name: 'Focus Search',
    description: 'Focus the task search input',
    category: 'project',
    defaultKeys: { modifiers: [], key: '/', display: '/' },
    enabled: true,
    context: 'page',
    preventInInput: true
  },
  {
    id: 'project.toggleTimer',
    name: 'Toggle Timer',
    description: 'Start or stop timer on selected task',
    category: 'project',
    defaultKeys: { modifiers: [], key: 't', display: 'T' },
    enabled: true,
    context: 'page',
    preventInInput: true
  },
  {
    id: 'project.markBlocked',
    name: 'Mark Blocked',
    description: 'Mark selected task as blocked',
    category: 'project',
    defaultKeys: { modifiers: [], key: 'b', display: 'B' },
    enabled: true,
    context: 'page',
    preventInInput: true
  },
  {
    id: 'project.column1',
    name: 'Focus Backlog Column',
    description: 'Switch focus to the backlog column',
    category: 'project',
    defaultKeys: { modifiers: [], key: '1', display: '1' },
    enabled: true,
    context: 'page',
    preventInInput: true
  },
  {
    id: 'project.column2',
    name: 'Focus Todo Column',
    description: 'Switch focus to the todo column',
    category: 'project',
    defaultKeys: { modifiers: [], key: '2', display: '2' },
    enabled: true,
    context: 'page',
    preventInInput: true
  },
  {
    id: 'project.column3',
    name: 'Focus In Progress Column',
    description: 'Switch focus to the in progress column',
    category: 'project',
    defaultKeys: { modifiers: [], key: '3', display: '3' },
    enabled: true,
    context: 'page',
    preventInInput: true
  },
  {
    id: 'project.column4',
    name: 'Focus In Review Column',
    description: 'Switch focus to the in review column',
    category: 'project',
    defaultKeys: { modifiers: [], key: '4', display: '4' },
    enabled: true,
    context: 'page',
    preventInInput: true
  },
  {
    id: 'project.column5',
    name: 'Focus Done Column',
    description: 'Switch focus to the done column',
    category: 'project',
    defaultKeys: { modifiers: [], key: '5', display: '5' },
    enabled: true,
    context: 'page',
    preventInInput: true
  }
]

// All default shortcuts
export const defaultShortcuts: Shortcut[] = [
  ...navigationShortcuts,
  ...quickActionShortcuts,
  ...generalShortcuts,
  ...projectPageShortcuts
]

// Grouped shortcuts for display
export const defaultShortcutGroups: ShortcutGroup[] = [
  {
    id: 'navigation',
    name: 'Navigation',
    category: 'navigation',
    shortcuts: navigationShortcuts,
    description: 'Navigate between different sections of the app'
  },
  {
    id: 'quick-actions',
    name: 'Quick Actions',
    category: 'quick-actions',
    shortcuts: quickActionShortcuts,
    description: 'Quickly perform common actions'
  },
  {
    id: 'general',
    name: 'General',
    category: 'general',
    shortcuts: generalShortcuts,
    description: 'General application shortcuts'
  },
  {
    id: 'project-page',
    name: 'Project Page',
    category: 'project',
    shortcuts: projectPageShortcuts,
    description: 'Shortcuts available on the project management page'
  }
]