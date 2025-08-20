import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { 
  Shortcut, 
  KeyCombo, 
  ShortcutConflict,
  Command,
  RecordingState
} from '../types/shortcuts'
import { getShortcutManager, ShortcutManager } from '../services/ShortcutManager'

interface ShortcutContextValue {
  // Shortcut management
  shortcuts: Shortcut[]
  getShortcut: (id: string) => Shortcut | undefined
  updateShortcut: (id: string, keys: KeyCombo) => ShortcutConflict[]
  resetShortcut: (id: string) => void
  resetAllShortcuts: () => void
  enableShortcut: (id: string) => void
  disableShortcut: (id: string) => void
  
  // Recording
  recordingState: RecordingState
  startRecording: () => void
  stopRecording: () => void
  recordKeyCombo: (event: KeyboardEvent) => KeyCombo
  
  // Utilities
  formatKeyCombo: (keys: KeyCombo) => string
  checkConflicts: (keys: KeyCombo, excludeId?: string) => ShortcutConflict[]
  exportSettings: () => string
  importSettings: (json: string) => boolean
  
  // Command palette
  isCommandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
  commands: Command[]
  executeCommand: (command: Command) => void
  
  // Context
  currentContext: string
  setContext: (context: string) => void
  
  // Help
  isHelpOpen: boolean
  setHelpOpen: (open: boolean) => void
}

const ShortcutContext = createContext<ShortcutContextValue | null>(null)

export const useShortcuts = () => {
  const context = useContext(ShortcutContext)
  if (!context) {
    throw new Error('useShortcuts must be used within ShortcutProvider')
  }
  return context
}

interface ShortcutProviderProps {
  children: React.ReactNode
}

export const ShortcutProvider: React.FC<ShortcutProviderProps> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const managerRef = useRef<ShortcutManager>()
  
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([])
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    keys: null,
    conflicts: []
  })
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [isHelpOpen, setHelpOpen] = useState(false)
  const [currentContext, setCurrentContext] = useState('global')
  
  // Initialize shortcut manager
  useEffect(() => {
    managerRef.current = getShortcutManager()
    setShortcuts(managerRef.current.getAllShortcuts())
    
    // Listen for shortcut commands
    const handleCommand = (event: CustomEvent) => {
      const { command } = event.detail
      handleShortcutCommand(command)
    }
    
    window.addEventListener('shortcut-command' as any, handleCommand)
    
    return () => {
      window.removeEventListener('shortcut-command' as any, handleCommand)
    }
  }, [])
  
  // Update context based on current route
  useEffect(() => {
    const path = location.pathname
    if (path.includes('/tasks')) {
      setCurrentContext('task')
    } else if (path.includes('/meetings')) {
      setCurrentContext('meeting')
    } else if (path.includes('/projects')) {
      setCurrentContext('project')
    } else {
      setCurrentContext('global')
    }
    
    if (managerRef.current) {
      managerRef.current.setContext(currentContext)
    }
  }, [location, currentContext])
  
  // Handle shortcut commands
  const handleShortcutCommand = useCallback((command: string) => {
    switch (command) {
      // Navigation
      case '/dashboard':
        navigate('/dashboard')
        break
      case '/projects':
        navigate('/projects')
        break
      case '/tasks':
        navigate('/tasks')
        break
      case '/meetings':
        navigate('/meetings')
        break
      case '/team':
        navigate('/team')
        break
      case '/settings':
        navigate('/settings')
        break
        
      // Quick actions
      case 'commandPalette':
        setCommandPaletteOpen(true)
        break
      case 'terminal':
        // Open terminal
        window.dispatchEvent(new CustomEvent('open-terminal'))
        break
      case 'search':
        // Open search dialog
        setCommandPaletteOpen(true)
        break
      case 'newTask':
        // Open new task modal
        window.dispatchEvent(new CustomEvent('open-new-task'))
        break
      case 'newProject':
        // Open new project modal
        window.dispatchEvent(new CustomEvent('open-new-project'))
        break
      case 'newMeeting':
        // Open new meeting modal
        window.dispatchEvent(new CustomEvent('open-new-meeting'))
        break
      case 'inviteMember':
        // Open invite member modal
        window.dispatchEvent(new CustomEvent('open-invite-member'))
        break
      case 'switchWorkspace':
        // Open workspace switcher
        window.dispatchEvent(new CustomEvent('open-workspace-switcher'))
        break
        
      // General
      case 'showHelp':
        setHelpOpen(true)
        break
      case 'escape':
        // Close any open modals
        setCommandPaletteOpen(false)
        setHelpOpen(false)
        window.dispatchEvent(new CustomEvent('close-modals'))
        break
      case 'save':
        // Trigger save action
        window.dispatchEvent(new CustomEvent('save-current'))
        break
      case 'toggleSidebar':
        // Toggle sidebar
        window.dispatchEvent(new CustomEvent('toggle-sidebar'))
        break
        
      // Task operations
      case 'toggleTaskComplete':
      case 'editTask':
      case 'deleteTask':
      case 'assignTaskToMe':
      case 'setPriorityUrgent':
      case 'setPriorityHigh':
      case 'setPriorityMedium':
      case 'setPriorityLow':
      case 'addTaskLabel':
      case 'setTaskDueDate':
        // These will be handled by the task components
        window.dispatchEvent(new CustomEvent('task-command', { detail: { command } }))
        break
        
      // Meeting operations
      case 'toggleCalendarView':
      case 'calendarToday':
      case 'calendarNext':
      case 'calendarPrevious':
      case 'joinMeeting':
      case 'rsvpMeeting':
        // These will be handled by the meeting components
        window.dispatchEvent(new CustomEvent('meeting-command', { detail: { command } }))
        break
    }
  }, [navigate])
  
  // Generate commands for command palette
  const commands: Command[] = shortcuts.map(shortcut => ({
    id: shortcut.id,
    name: shortcut.name,
    description: shortcut.description,
    shortcut: shortcut.customKeys || shortcut.defaultKeys,
    category: shortcut.category,
    action: () => {
      if (shortcut.command) {
        handleShortcutCommand(shortcut.command)
      } else if (shortcut.action) {
        shortcut.action()
      }
    }
  }))
  
  // Shortcut management methods
  const getShortcut = (id: string) => managerRef.current?.getShortcut(id)
  
  const updateShortcut = (id: string, keys: KeyCombo): ShortcutConflict[] => {
    if (!managerRef.current) return []
    const conflicts = managerRef.current.updateShortcut(id, keys)
    setShortcuts(managerRef.current.getAllShortcuts())
    return conflicts
  }
  
  const resetShortcut = (id: string) => {
    if (!managerRef.current) return
    managerRef.current.resetShortcut(id)
    setShortcuts(managerRef.current.getAllShortcuts())
  }
  
  const resetAllShortcuts = () => {
    if (!managerRef.current) return
    managerRef.current.resetAllShortcuts()
    setShortcuts(managerRef.current.getAllShortcuts())
  }
  
  const enableShortcut = (id: string) => {
    if (!managerRef.current) return
    managerRef.current.enableShortcut(id)
    setShortcuts(managerRef.current.getAllShortcuts())
  }
  
  const disableShortcut = (id: string) => {
    if (!managerRef.current) return
    managerRef.current.disableShortcut(id)
    setShortcuts(managerRef.current.getAllShortcuts())
  }
  
  // Recording methods
  const startRecording = () => {
    if (!managerRef.current) return
    managerRef.current.startRecording()
    setRecordingState({
      isRecording: true,
      keys: null,
      conflicts: []
    })
  }
  
  const stopRecording = () => {
    if (!managerRef.current) return
    managerRef.current.stopRecording()
    setRecordingState({
      isRecording: false,
      keys: null,
      conflicts: []
    })
  }
  
  const recordKeyCombo = (event: KeyboardEvent): KeyCombo => {
    if (!managerRef.current) throw new Error('ShortcutManager not initialized')
    const keys = managerRef.current.recordKeyCombo(event)
    const conflicts = managerRef.current.checkConflicts(keys)
    
    setRecordingState({
      isRecording: true,
      keys,
      conflicts
    })
    
    return keys
  }
  
  // Utility methods
  const formatKeyCombo = (keys: KeyCombo): string => {
    if (!managerRef.current) return ''
    return managerRef.current.formatKeyCombo(keys)
  }
  
  const checkConflicts = (keys: KeyCombo, excludeId?: string): ShortcutConflict[] => {
    if (!managerRef.current) return []
    return managerRef.current.checkConflicts(keys, excludeId)
  }
  
  const exportSettings = (): string => {
    if (!managerRef.current) return '{}'
    return managerRef.current.exportSettings()
  }
  
  const importSettings = (json: string): boolean => {
    if (!managerRef.current) return false
    const success = managerRef.current.importSettings(json)
    if (success) {
      setShortcuts(managerRef.current.getAllShortcuts())
    }
    return success
  }
  
  const executeCommand = (command: Command) => {
    command.action()
    setCommandPaletteOpen(false)
  }
  
  const setContext = (context: string) => {
    setCurrentContext(context)
    if (managerRef.current) {
      managerRef.current.setContext(context)
    }
  }
  
  const value: ShortcutContextValue = {
    shortcuts,
    getShortcut,
    updateShortcut,
    resetShortcut,
    resetAllShortcuts,
    enableShortcut,
    disableShortcut,
    recordingState,
    startRecording,
    stopRecording,
    recordKeyCombo,
    formatKeyCombo,
    checkConflicts,
    exportSettings,
    importSettings,
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    commands,
    executeCommand,
    currentContext,
    setContext,
    isHelpOpen,
    setHelpOpen
  }
  
  return (
    <ShortcutContext.Provider value={value}>
      {children}
    </ShortcutContext.Provider>
  )
}

// Custom hook for using a specific shortcut
export const useShortcut = (shortcutId: string, handler?: () => void) => {
  const { getShortcut } = useShortcuts()
  const shortcut = getShortcut(shortcutId)
  
  useEffect(() => {
    if (!shortcut || !handler) return
    
    const handleShortcut = (event: CustomEvent) => {
      if (event.detail.shortcutId === shortcutId) {
        handler()
      }
    }
    
    window.addEventListener('shortcut-executed' as any, handleShortcut)
    
    return () => {
      window.removeEventListener('shortcut-executed' as any, handleShortcut)
    }
  }, [shortcutId, handler, shortcut])
  
  return shortcut
}

// Custom hook for registering a temporary shortcut
export const useTemporaryShortcut = (
  keys: KeyCombo,
  handler: () => void,
  options?: {
    preventDefault?: boolean
    stopPropagation?: boolean
    enabled?: boolean
  }
) => {
  useEffect(() => {
    if (options?.enabled === false) return
    
    const handleKeyDown = (event: KeyboardEvent) => {
      const matchesModifiers = 
        event.ctrlKey === keys.modifiers.includes('ctrl') &&
        event.altKey === keys.modifiers.includes('alt') &&
        event.shiftKey === keys.modifiers.includes('shift') &&
        event.metaKey === keys.modifiers.includes('meta')
      
      if (matchesModifiers && event.key.toLowerCase() === keys.key.toLowerCase()) {
        if (options?.preventDefault !== false) {
          event.preventDefault()
        }
        if (options?.stopPropagation !== false) {
          event.stopPropagation()
        }
        handler()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [keys, handler, options])
}