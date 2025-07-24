import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

interface UseSettingsStateOptions<T> {
  defaultValue: T
  onSave: (value: T) => Promise<void>
  debounceMs?: number
}

export function useSettingsState<T>({
  defaultValue,
  onSave,
  debounceMs = 2000
}: UseSettingsStateOptions<T>) {
  const [value, setValue] = useState<T>(defaultValue)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const lastSavedValueRef = useRef<string>(JSON.stringify(defaultValue))
  const isInitializedRef = useRef(false)

  // Deep equality check for objects
  const deepEqual = (a: any, b: any): boolean => {
    if (a === b) return true
    if (!a || !b) return false
    if (typeof a !== 'object' || typeof b !== 'object') return false
    
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)
    if (keysA.length !== keysB.length) return false
    
    return keysA.every(key => deepEqual(a[key], b[key]))
  }

  // Handle value changes with debounce
  const handleChange = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue((currentValue) => {
      const actualNewValue = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(currentValue)
        : newValue
      
      // Only proceed if initialized and value actually changed
      if (!isInitializedRef.current) return actualNewValue
      
      const lastSaved = JSON.parse(lastSavedValueRef.current)
      if (deepEqual(actualNewValue, lastSaved)) {
        setHasUnsavedChanges(false)
        return actualNewValue
      }
      
      setHasUnsavedChanges(true)

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // Set new timeout for auto-save
      saveTimeoutRef.current = setTimeout(async () => {
        setIsSaving(true)
        try {
          await onSave(actualNewValue)
          lastSavedValueRef.current = JSON.stringify(actualNewValue)
          setHasUnsavedChanges(false)
          toast.success('SETTINGS SAVED')
        } catch (error: any) {
          console.error('Failed to save settings:', error)
          const errorMessage = error?.message || 'Unknown error'
          toast.error(`FAILED TO SAVE: ${errorMessage.toUpperCase()}`)
        } finally {
          setIsSaving(false)
        }
      }, debounceMs)
      
      return actualNewValue
    })
  }, [onSave, debounceMs])
  
  // Provide a way to set value without triggering save (for initial load)
  const setValueWithoutSave = useCallback((newValue: T) => {
    setValue(newValue)
    lastSavedValueRef.current = JSON.stringify(newValue)
    setHasUnsavedChanges(false)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    // Mark as initialized after first data load
    setTimeout(() => {
      isInitializedRef.current = true
    }, 100)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Handle navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Force save (for immediate save scenarios)
  const forceSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    setIsSaving(true)
    try {
      await onSave(value)
      lastSavedValueRef.current = JSON.stringify(value)
      setHasUnsavedChanges(false)
      toast.success('SETTINGS SAVED')
    } catch (error: any) {
      console.error('Failed to save settings:', error)
      const errorMessage = error?.message || 'Unknown error'
      toast.error(`FAILED TO SAVE: ${errorMessage.toUpperCase()}`)
    } finally {
      setIsSaving(false)
    }
  }, [onSave, value])

  return {
    value,
    setValue: handleChange,
    setValueWithoutSave,
    isSaving,
    hasUnsavedChanges,
    forceSave
  }
}