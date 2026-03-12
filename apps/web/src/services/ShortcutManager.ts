import type { 
  Shortcut, 
  KeyCombo, 
  ShortcutStorage, 
  ShortcutConflict,
  ShortcutEvent,
  ShortcutEventType,
  ModifierKey,
  Platform
} from '@/types/shortcuts'
import { SPECIAL_KEYS, MODIFIER_SYMBOLS } from '@/types/shortcuts'
import { defaultShortcuts } from '@/config/defaultShortcuts'

export class ShortcutManager {
  private shortcuts: Map<string, Shortcut> = new Map()
  private keyMap: Map<string, Set<string>> = new Map() // key combo -> shortcut IDs
  private listeners: Map<string, Function[]> = new Map()
  private storage: ShortcutStorage
  private platform: Platform
  private isRecording = false
  private currentContext: string = 'global'
  private disabledShortcuts: Set<string> = new Set()

  constructor() {
    this.platform = this.detectPlatform()
    this.storage = this.loadStorage()
    this.initializeShortcuts()
    this.setupEventListeners()
  }

  private detectPlatform(): Platform {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const isWindows = navigator.platform.toUpperCase().indexOf('WIN') >= 0
    const isLinux = navigator.platform.toUpperCase().indexOf('LINUX') >= 0
    
    return {
      isMac,
      isWindows,
      isLinux,
      modifierKey: isMac ? 'cmd' : 'ctrl',
      modifierSymbol: isMac ? '⌘' : 'Ctrl'
    }
  }

  private loadStorage(): ShortcutStorage {
    const stored = localStorage.getItem('shortcuts')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (e) {
        console.error('Failed to parse shortcuts storage:', e)
      }
    }
    
    return {
      custom: {},
      disabled: [],
      preferences: {
        showHints: true,
        enableSounds: false,
        conflictWarnings: true,
        theme: 'default'
      },
      recent: [],
      pinned: []
    }
  }

  private saveStorage(): void {
    localStorage.setItem('shortcuts', JSON.stringify(this.storage))
  }

  private initializeShortcuts(): void {
    // Load default shortcuts
    defaultShortcuts.forEach(shortcut => {
      const id = shortcut.id
      
      // Check if there's a custom key binding
      if (this.storage.custom[id]) {
        shortcut.customKeys = this.storage.custom[id]
      }
      
      // Check if shortcut is disabled
      if (this.storage.disabled.includes(id)) {
        shortcut.enabled = false
        this.disabledShortcuts.add(id)
      }
      
      this.shortcuts.set(id, shortcut)
      
      if (shortcut.enabled) {
        this.registerKeyCombo(shortcut)
      }
    })
  }

  private registerKeyCombo(shortcut: Shortcut): void {
    const keys = shortcut.customKeys || shortcut.defaultKeys
    const keyString = this.keyComboToString(keys)
    
    if (!this.keyMap.has(keyString)) {
      this.keyMap.set(keyString, new Set())
    }
    
    this.keyMap.get(keyString)!.add(shortcut.id)
  }

  private unregisterKeyCombo(shortcut: Shortcut): void {
    const keys = shortcut.customKeys || shortcut.defaultKeys
    const keyString = this.keyComboToString(keys)
    
    const shortcuts = this.keyMap.get(keyString)
    if (shortcuts) {
      shortcuts.delete(shortcut.id)
      if (shortcuts.size === 0) {
        this.keyMap.delete(keyString)
      }
    }
  }

  private keyComboToString(keys: KeyCombo): string {
    const modifiers = [...keys.modifiers].sort().join('+')
    return modifiers ? `${modifiers}+${keys.key.toLowerCase()}` : keys.key.toLowerCase()
  }

  private eventToKeyCombo(event: KeyboardEvent): KeyCombo {
    const modifiers: ModifierKey[] = []
    
    if (event.ctrlKey) modifiers.push('ctrl')
    if (event.altKey) modifiers.push('alt')
    if (event.shiftKey) modifiers.push('shift')
    if (event.metaKey) modifiers.push('meta')
    
    // Normalize the key
    let key = event.key
    if (key === ' ') key = 'Space'
    
    return {
      modifiers,
      key,
      code: event.code
    }
  }

  private setupEventListeners(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this))
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // Don't handle shortcuts when recording
    if (this.isRecording) return
    
    // Check if we're in an input field and should prevent shortcuts
    const target = event.target as HTMLElement
    const isInputField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
    const isContentEditable = target.contentEditable === 'true'
    
    const keyCombo = this.eventToKeyCombo(event)
    const keyString = this.keyComboToString(keyCombo)
    
    const shortcutIds = this.keyMap.get(keyString)
    if (!shortcutIds || shortcutIds.size === 0) return
    
    // Find applicable shortcuts for current context
    const applicableShortcuts: Shortcut[] = []
    
    shortcutIds.forEach(id => {
      const shortcut = this.shortcuts.get(id)
      if (!shortcut || !shortcut.enabled) return
      
      // Check if shortcut should be prevented in input fields
      if ((isInputField || isContentEditable) && shortcut.preventInInput) return
      
      // Check context
      if (shortcut.global || shortcut.context === this.currentContext || shortcut.context === 'global') {
        applicableShortcuts.push(shortcut)
      }
    })
    
    if (applicableShortcuts.length === 0) return
    
    // Prevent default browser behavior
    event.preventDefault()
    event.stopPropagation()
    
    // Execute shortcuts
    applicableShortcuts.forEach(shortcut => {
      this.executeShortcut(shortcut)
    })
  }

  private executeShortcut(shortcut: Shortcut): void {
    // Emit event
    this.emitEvent({
      type: 'execute',
      shortcutId: shortcut.id,
      keyCombo: shortcut.customKeys || shortcut.defaultKeys,
      timestamp: Date.now()
    })
    
    // Execute action or command
    if (shortcut.action) {
      shortcut.action()
    } else if (shortcut.command) {
      this.executeCommand(shortcut.command)
    }
  }

  private executeCommand(command: string): void {
    // This will be handled by the context provider
    // Emit a custom event that the app can listen to
    window.dispatchEvent(new CustomEvent('shortcut-command', { 
      detail: { command } 
    }))
  }

  // Public API

  public setContext(context: string): void {
    this.currentContext = context
  }

  public getShortcut(id: string): Shortcut | undefined {
    return this.shortcuts.get(id)
  }

  public getAllShortcuts(): Shortcut[] {
    return Array.from(this.shortcuts.values())
  }

  public getShortcutsByCategory(category: string): Shortcut[] {
    return this.getAllShortcuts().filter(s => s.category === category)
  }

  public getShortcutsByContext(context: string): Shortcut[] {
    return this.getAllShortcuts().filter(s => s.context === context || s.global)
  }

  public updateShortcut(id: string, keys: KeyCombo): ShortcutConflict[] {
    const shortcut = this.shortcuts.get(id)
    if (!shortcut) return []
    
    // Check for conflicts
    const conflicts = this.checkConflicts(keys, id)
    if (conflicts.length > 0 && this.storage.preferences.conflictWarnings) {
      return conflicts
    }
    
    // Unregister old key combo
    this.unregisterKeyCombo(shortcut)
    
    // Update shortcut
    shortcut.customKeys = keys
    this.storage.custom[id] = keys
    
    // Register new key combo
    this.registerKeyCombo(shortcut)
    
    // Save to storage
    this.saveStorage()
    
    return []
  }

  public resetShortcut(id: string): void {
    const shortcut = this.shortcuts.get(id)
    if (!shortcut) return
    
    // Unregister current key combo
    this.unregisterKeyCombo(shortcut)
    
    // Reset to default
    delete shortcut.customKeys
    delete this.storage.custom[id]
    
    // Register default key combo
    this.registerKeyCombo(shortcut)
    
    // Save to storage
    this.saveStorage()
  }

  public resetAllShortcuts(): void {
    this.shortcuts.forEach(shortcut => {
      this.unregisterKeyCombo(shortcut)
      delete shortcut.customKeys
    })
    
    this.storage.custom = {}
    this.storage.disabled = []
    this.disabledShortcuts.clear()
    
    this.shortcuts.forEach(shortcut => {
      shortcut.enabled = true
      this.registerKeyCombo(shortcut)
    })
    
    this.saveStorage()
  }

  public enableShortcut(id: string): void {
    const shortcut = this.shortcuts.get(id)
    if (!shortcut) return
    
    shortcut.enabled = true
    this.disabledShortcuts.delete(id)
    this.storage.disabled = this.storage.disabled.filter(sid => sid !== id)
    
    this.registerKeyCombo(shortcut)
    this.saveStorage()
  }

  public disableShortcut(id: string): void {
    const shortcut = this.shortcuts.get(id)
    if (!shortcut) return
    
    shortcut.enabled = false
    this.disabledShortcuts.add(id)
    if (!this.storage.disabled.includes(id)) {
      this.storage.disabled.push(id)
    }
    
    this.unregisterKeyCombo(shortcut)
    this.saveStorage()
  }

  public checkConflicts(keys: KeyCombo, excludeId?: string): ShortcutConflict[] {
    const conflicts: ShortcutConflict[] = []
    const keyString = this.keyComboToString(keys)
    
    const conflictingIds = this.keyMap.get(keyString)
    if (!conflictingIds) return conflicts
    
    conflictingIds.forEach(id => {
      if (id === excludeId) return
      
      const shortcut = this.shortcuts.get(id)
      if (!shortcut || !shortcut.enabled) return
      
      conflicts.push({
        shortcutId1: excludeId || '',
        shortcutId2: id,
        keyCombo: keys,
        severity: shortcut.global ? 'error' : 'warning'
      })
    })
    
    return conflicts
  }

  public startRecording(): void {
    this.isRecording = true
  }

  public stopRecording(): void {
    this.isRecording = false
  }

  public recordKeyCombo(event: KeyboardEvent): KeyCombo {
    return this.eventToKeyCombo(event)
  }

  public formatKeyCombo(keys: KeyCombo): string {
    const symbols = this.platform.isMac ? MODIFIER_SYMBOLS.mac : MODIFIER_SYMBOLS.other
    const parts: string[] = []
    
    // Add modifiers in consistent order
    if (keys.modifiers.includes('meta')) parts.push(symbols.meta)
    if (keys.modifiers.includes('ctrl')) parts.push(symbols.ctrl)
    if (keys.modifiers.includes('alt')) parts.push(symbols.alt)
    if (keys.modifiers.includes('shift')) parts.push(symbols.shift)
    
    // Add the key
    const keyDisplay = SPECIAL_KEYS[keys.key] || keys.key.toUpperCase()
    parts.push(keyDisplay)
    
    return parts.join(this.platform.isMac ? '' : '+')
  }

  // Event handling
  
  public on(event: ShortcutEventType, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  public off(event: ShortcutEventType, callback: Function): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private emitEvent(event: ShortcutEvent): void {
    const callbacks = this.listeners.get(event.type)
    if (callbacks) {
      callbacks.forEach(callback => callback(event))
    }
  }

  // Utility methods
  
  public exportSettings(): string {
    return JSON.stringify(this.storage, null, 2)
  }

  public importSettings(json: string): boolean {
    try {
      const imported = JSON.parse(json) as ShortcutStorage
      
      // Validate structure
      if (!imported.custom || !imported.disabled || !imported.preferences) {
        throw new Error('Invalid settings format')
      }
      
      // Apply imported settings
      this.storage = imported
      this.saveStorage()
      
      // Reinitialize shortcuts
      this.shortcuts.clear()
      this.keyMap.clear()
      this.disabledShortcuts.clear()
      this.initializeShortcuts()
      
      return true
    } catch (e) {
      console.error('Failed to import settings:', e)
      return false
    }
  }

  public destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this))
    this.shortcuts.clear()
    this.keyMap.clear()
    this.listeners.clear()
  }
}

// Singleton instance
let instance: ShortcutManager | null = null

export const getShortcutManager = (): ShortcutManager => {
  if (!instance) {
    instance = new ShortcutManager()
  }
  return instance
}

export const destroyShortcutManager = (): void => {
  if (instance) {
    instance.destroy()
    instance = null
  }
}