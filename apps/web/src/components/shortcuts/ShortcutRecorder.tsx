import { useEffect, useRef, useReducer } from 'react'
import type { KeyCombo, ShortcutConflict } from '../../types/shortcuts'
import { useShortcuts } from '../../contexts/ShortcutContext'
import { HiOutlineExclamationCircle, HiOutlineX } from 'react-icons/hi'
import clsx from 'clsx'

interface ShortcutRecorderProps {
  currentKeys?: KeyCombo
  onRecord: (keys: KeyCombo) => void
  onCancel: () => void
  excludeId?: string
  className?: string
}

type RecorderState = {
  isRecording: boolean
  recordedKeys: KeyCombo | null
  conflicts: ShortcutConflict[]
  pressedKeys: Set<string>
}

type RecorderAction =
  | { type: 'START_RECORDING' }
  | { type: 'STOP_RECORDING' }
  | { type: 'KEY_DOWN'; keys: KeyCombo; conflicts: ShortcutConflict[]; pressedKeys: Set<string> }
  | { type: 'KEY_UP' }
  | { type: 'CANCEL' }

const recorderInitialState: RecorderState = {
  isRecording: false,
  recordedKeys: null,
  conflicts: [],
  pressedKeys: new Set(),
}

function recorderReducer(state: RecorderState, action: RecorderAction): RecorderState {
  switch (action.type) {
    case 'START_RECORDING':
      return { isRecording: true, recordedKeys: null, conflicts: [], pressedKeys: new Set() }
    case 'STOP_RECORDING':
      return { ...state, isRecording: false, pressedKeys: new Set() }
    case 'KEY_DOWN':
      return { ...state, recordedKeys: action.keys, conflicts: action.conflicts, pressedKeys: action.pressedKeys }
    case 'KEY_UP':
      return { ...state, pressedKeys: new Set() }
    case 'CANCEL':
      return { isRecording: false, recordedKeys: null, conflicts: [], pressedKeys: new Set() }
    default:
      return state
  }
}

export default function ShortcutRecorder({
  currentKeys,
  onRecord,
  onCancel,
  excludeId,
  className
}: ShortcutRecorderProps) {
  const { formatKeyCombo, checkConflicts, recordKeyCombo } = useShortcuts()
  const [state, dispatch] = useReducer(recorderReducer, recorderInitialState)
  const { isRecording, recordedKeys, conflicts, pressedKeys } = state
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isRecording) return

    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault()
      event.stopPropagation()

      const keys = recordKeyCombo(event)
      const foundConflicts = checkConflicts(keys, excludeId)

      const keySet = new Set<string>()
      if (event.ctrlKey) keySet.add('ctrl')
      if (event.altKey) keySet.add('alt')
      if (event.shiftKey) keySet.add('shift')
      if (event.metaKey) keySet.add('meta')
      keySet.add(event.key.toLowerCase())

      dispatch({ type: 'KEY_DOWN', keys, conflicts: foundConflicts, pressedKeys: keySet })
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      event.preventDefault()
      event.stopPropagation()

      setTimeout(() => {
        dispatch({ type: 'KEY_UP' })
      }, 100)
    }

    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('keyup', handleKeyUp, true)

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('keyup', handleKeyUp, true)
    }
  }, [isRecording, recordKeyCombo, checkConflicts, excludeId])

  const startRecording = () => {
    dispatch({ type: 'START_RECORDING' })
    containerRef.current?.focus()
  }

  const stopRecording = () => {
    dispatch({ type: 'STOP_RECORDING' })
  }

  const handleSave = () => {
    if (recordedKeys) {
      onRecord(recordedKeys)
      stopRecording()
    }
  }

  const handleCancel = () => {
    dispatch({ type: 'CANCEL' })
    onCancel()
  }

  const displayKeys = recordedKeys || currentKeys

  return (
    <div 
      ref={containerRef}
      className={clsx(
        "bg-carbon-plate border-4 border-basalt-border p-[16px]",
        isRecording && "border-primary-brutalist",
        className
      )}
      tabIndex={-1}
    >
      <div className="mb-[8px]">
        <h3 className="font-mono text-brutal-sm uppercase mb-[8px]">
          {isRecording ? 'RECORDING... PRESS KEYS' : 'KEYBOARD SHORTCUT'}
        </h3>
        
        {/* Key Display */}
        <div className={clsx(
          "bg-event-horizon border-2 border-basalt-border p-[10px] min-h-60px flex items-center justify-center",
          isRecording && "border-primary-brutalist animate-pulse"
        )}>
          {displayKeys ? (
            <div className="flex items-center gap-[8px]">
              {displayKeys.modifiers.map(mod => (
                <span
                  key={mod}
                  className={clsx(
                    "px-12px py-8px bg-carbon-plate border-2 font-mono text-brutal-sm uppercase",
                    pressedKeys.has(mod) 
                      ? "border-primary-brutalist bg-primary-brutalist text-event-horizon" 
                      : "border-basalt-border"
                  )}
                >
                  {mod}
                </span>
              ))}
              <span className="text-brutal-sm">+</span>
              <span
                className={clsx(
                  "px-[10px] py-8px bg-carbon-plate border-2 font-mono text-brutal-sm uppercase",
                  pressedKeys.has(displayKeys.key.toLowerCase())
                    ? "border-primary-brutalist bg-primary-brutalist text-event-horizon"
                    : "border-basalt-border"
                )}
              >
                {displayKeys.key}
              </span>
            </div>
          ) : (
            <span className="text-cathode-white/60 font-mono text-brutal-sm uppercase">
              {isRecording ? 'PRESS KEY COMBINATION...' : 'NO SHORTCUT SET'}
            </span>
          )}
        </div>

        {/* Formatted Display */}
        {displayKeys && (
          <div className="mt-8px text-center">
            <span className="font-mono text-brutal-xs text-cathode-white/60">
              {formatKeyCombo(displayKeys)}
            </span>
          </div>
        )}
      </div>

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <div className="mb-[8px]">
          <div className="bg-brutal-error/20 border-2 border-brutal-error p-[10px]">
            <div className="flex items-start gap-[8px]">
              <HiOutlineExclamationCircle className="w-5 h-5 text-brutal-error flex-shrink-0 mt-2px" />
              <div className="flex-1">
                <h4 className="font-mono text-brutal-xs uppercase mb-4px text-brutal-error">
                  CONFLICT DETECTED
                </h4>
                {conflicts.map((conflict) => (
                  <p key={conflict.shortcutId2} className="font-mono text-brutal-xs text-cathode-white/80">
                    This combination is already used by: {conflict.shortcutId2}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-[10px]">
        {!isRecording ? (
          <>
            <button
              onClick={startRecording}
              className="brutal-btn-primary flex-1"
            >
              RECORD NEW
            </button>
            {currentKeys && (
              <button
                onClick={() => onRecord(currentKeys)}
                className="brutal-btn flex-1"
              >
                KEEP CURRENT
              </button>
            )}
            <button
              onClick={handleCancel}
              className="brutal-btn-secondary"
            >
              <HiOutlineX className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleSave}
              disabled={!recordedKeys}
              className={clsx(
                "brutal-btn flex-1",
                conflicts.length > 0 && "bg-brutal-warning border-brutal-warning"
              )}
            >
              {conflicts.length > 0 ? 'SAVE ANYWAY' : 'SAVE'}
            </button>
            <button
              onClick={stopRecording}
              className="brutal-btn-secondary flex-1"
            >
              CANCEL
            </button>
          </>
        )}
      </div>

      {/* Instructions */}
      {isRecording && (
        <div className="mt-[8px] p-[10px] bg-event-horizon border border-basalt-border">
          <p className="font-mono text-brutal-xs text-cathode-white/60 text-center">
            PRESS AND HOLD MODIFIER KEYS (CTRL, ALT, SHIFT) THEN PRESS A LETTER OR NUMBER
          </p>
        </div>
      )}
    </div>
  )
}