import { useState, useEffect, useCallback } from 'react'

interface StorageValue<T> {
  version: number
  data: T
}

type SetValue<T> = T | ((val: T) => T)

const CURRENT_VERSION = 1

/**
 * Custom hook for managing state in localStorage with React state synchronization.
 * Supports versioning to handle schema changes gracefully.
 * @param key - The localStorage key
 * @param initialValue - The initial value if nothing is in localStorage
 * @param version - Schema version number (bumping this clears stale data)
 * @returns [storedValue, setValue] - Similar to useState
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  version: number = CURRENT_VERSION
): [T, (value: SetValue<T>) => void] {
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      if (!item) return initialValue

      const parsed = JSON.parse(item)

      // Handle versioned values
      if (typeof parsed === 'object' && parsed !== null && 'version' in parsed && 'data' in parsed) {
        if (parsed.version !== version) {
          window.localStorage.removeItem(key)
          return initialValue
        }
        return parsed.data as T
      }

      // Legacy value without version wrapper - migrate it
      return parsed as T
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  }, [initialValue, key, version])

  const [storedValue, setStoredValue] = useState<T>(readValue)

  const setValue = useCallback(
    (value: SetValue<T>) => {
      if (typeof window === 'undefined') return

      try {
        const newValue = value instanceof Function ? value(storedValue) : value
        const wrappedValue: StorageValue<T> = { version, data: newValue }
        window.localStorage.setItem(key, JSON.stringify(wrappedValue))
        setStoredValue(newValue)
        window.dispatchEvent(new Event('local-storage'))
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key, storedValue, version]
  )

  useEffect(() => {
    setStoredValue(readValue())
  }, [readValue])

  useEffect(() => {
    const handleStorageChange = () => setStoredValue(readValue())
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('local-storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('local-storage', handleStorageChange)
    }
  }, [readValue])

  return [storedValue, setValue]
}
