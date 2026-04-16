import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useRef,
  useReducer,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import type {
  Shortcut,
  KeyCombo,
  ShortcutConflict,
  Command,
  RecordingState,
} from "@/types/shortcuts";
import {
  getShortcutManager,
  ShortcutManager,
} from "@/services/ShortcutManager";

interface ShortcutContextValue {
  // Shortcut management
  shortcuts: Shortcut[];
  getShortcut: (id: string) => Shortcut | undefined;
  updateShortcut: (id: string, keys: KeyCombo) => ShortcutConflict[];
  resetShortcut: (id: string) => void;
  resetAllShortcuts: () => void;
  enableShortcut: (id: string) => void;
  disableShortcut: (id: string) => void;

  // Recording
  recordingState: RecordingState;
  startRecording: () => void;
  stopRecording: () => void;
  recordKeyCombo: (event: KeyboardEvent) => KeyCombo;

  // Utilities
  formatKeyCombo: (keys: KeyCombo) => string;
  checkConflicts: (keys: KeyCombo, excludeId?: string) => ShortcutConflict[];
  exportSettings: () => string;
  importSettings: (json: string) => boolean;

  // Command palette
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  commands: Command[];
  executeCommand: (command: Command) => void;
  // Runtime commands — register transient entries into the palette
  // (e.g. "Run skill: X" when a task detail modal is open). Returns a
  // disposer that removes them. Useful for scoped, context-dependent actions.
  registerRuntimeCommands: (commands: Command[]) => () => void;

  // Context
  currentContext: string;
  setContext: (context: string) => void;

  // Help
  isHelpOpen: boolean;
  setHelpOpen: (open: boolean) => void;
}

const ShortcutContext = createContext<ShortcutContextValue | null>(null);

export const useShortcuts = () => {
  const context = useContext(ShortcutContext);
  if (!context) {
    throw new Error("useShortcuts must be used within ShortcutProvider");
  }
  return context;
};

interface ShortcutProviderProps {
  children: React.ReactNode;
}

type ShortcutProviderState = {
  shortcuts: Shortcut[];
  recordingState: RecordingState;
  isCommandPaletteOpen: boolean;
  isHelpOpen: boolean;
  currentContext: string;
  runtimeCommands: Command[];
};

const shortcutProviderInitialState: ShortcutProviderState = {
  shortcuts: [],
  recordingState: { isRecording: false, keys: null, conflicts: [] },
  isCommandPaletteOpen: false,
  isHelpOpen: false,
  currentContext: "global",
  runtimeCommands: [],
};

type ShortcutProviderAction = {
  type: "UPDATE";
  field: keyof ShortcutProviderState;
  value: unknown;
};

function shortcutProviderReducer(
  state: ShortcutProviderState,
  action: ShortcutProviderAction,
): ShortcutProviderState {
  switch (action.type) {
    case "UPDATE":
      return { ...state, [action.field]: action.value };
    default:
      return state;
  }
}

export const ShortcutProvider: React.FC<ShortcutProviderProps> = ({
  children,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const managerRef = useRef<ShortcutManager>();
  // Ref mirror of runtime commands so register/dispose always see the
  // latest list (avoids stale closures when multiple callers register).
  const runtimeCommandsRef = useRef<Command[]>([]);

  const [providerState, dispatch] = useReducer(
    shortcutProviderReducer,
    shortcutProviderInitialState,
  );
  const {
    shortcuts,
    recordingState,
    isCommandPaletteOpen,
    isHelpOpen,
    currentContext,
    runtimeCommands,
  } = providerState;

  // Initialize shortcut manager
  useEffect(() => {
    managerRef.current = getShortcutManager();
    dispatch({
      type: "UPDATE",
      field: "shortcuts",
      value: managerRef.current.getAllShortcuts(),
    });

    // Listen for shortcut commands
    const handleCommand = (event: CustomEvent) => {
      const { command } = event.detail;
      handleShortcutCommand(command);
    };

    window.addEventListener("shortcut-command", handleCommand as EventListener);

    return () => {
      window.removeEventListener("shortcut-command", handleCommand as EventListener);
    };
  }, []);

  // Update context based on current route
  useEffect(() => {
    dispatch({ type: "UPDATE", field: "currentContext", value: "global" });

    if (managerRef.current) {
      managerRef.current.setContext("global");
    }
  }, [location]);

  // Handle shortcut commands
  const handleShortcutCommand = useCallback(
    (command: string) => {
      switch (command) {
        // Navigation
        case "/dashboard":
          navigate("/dashboard");
          break;
        case "/projects":
          navigate("/projects");
          break;
        case "/settings":
          navigate("/settings");
          break;

        // Quick actions
        case "commandPalette":
          dispatch({
            type: "UPDATE",
            field: "isCommandPaletteOpen",
            value: true,
          });
          break;

        // General
        case "showHelp":
          dispatch({ type: "UPDATE", field: "isHelpOpen", value: true });
          break;
        case "escape":
          dispatch({
            type: "UPDATE",
            field: "isCommandPaletteOpen",
            value: false,
          });
          dispatch({ type: "UPDATE", field: "isHelpOpen", value: false });
          break;
        case "toggleSidebar":
          window.dispatchEvent(new CustomEvent("toggle-sidebar"));
          break;
      }
    },
    [navigate],
  );

  // Generate commands for command palette — static shortcut entries plus
  // any transient entries registered via registerRuntimeCommands(). Runtime
  // commands render first so context-relevant actions ("Run skill…", etc.)
  // sit above global shortcuts.
  const commands: Command[] = [
    ...runtimeCommands,
    ...shortcuts.map((shortcut) => ({
      id: shortcut.id,
      name: shortcut.name,
      description: shortcut.description,
      shortcut: shortcut.customKeys || shortcut.defaultKeys,
      category: shortcut.category,
      action: () => {
        if (shortcut.command) {
          handleShortcutCommand(shortcut.command);
        } else if (shortcut.action) {
          shortcut.action();
        }
      },
    })),
  ];

  const registerRuntimeCommands = useCallback((newCommands: Command[]) => {
    const ids = newCommands.map((c) => c.id);
    runtimeCommandsRef.current = [
      ...runtimeCommandsRef.current.filter((c) => !ids.includes(c.id)),
      ...newCommands,
    ];
    dispatch({
      type: "UPDATE",
      field: "runtimeCommands",
      value: runtimeCommandsRef.current,
    });
    return () => {
      runtimeCommandsRef.current = runtimeCommandsRef.current.filter(
        (c) => !ids.includes(c.id),
      );
      dispatch({
        type: "UPDATE",
        field: "runtimeCommands",
        value: runtimeCommandsRef.current,
      });
    };
  }, []);

  // Shortcut management methods
  const getShortcut = (id: string) => managerRef.current?.getShortcut(id);

  const updateShortcut = (id: string, keys: KeyCombo): ShortcutConflict[] => {
    if (!managerRef.current) return [];
    const conflicts = managerRef.current.updateShortcut(id, keys);
    dispatch({
      type: "UPDATE",
      field: "shortcuts",
      value: managerRef.current.getAllShortcuts(),
    });
    return conflicts;
  };

  const resetShortcut = (id: string) => {
    if (!managerRef.current) return;
    managerRef.current.resetShortcut(id);
    dispatch({
      type: "UPDATE",
      field: "shortcuts",
      value: managerRef.current.getAllShortcuts(),
    });
  };

  const resetAllShortcuts = () => {
    if (!managerRef.current) return;
    managerRef.current.resetAllShortcuts();
    dispatch({
      type: "UPDATE",
      field: "shortcuts",
      value: managerRef.current.getAllShortcuts(),
    });
  };

  const enableShortcut = (id: string) => {
    if (!managerRef.current) return;
    managerRef.current.enableShortcut(id);
    dispatch({
      type: "UPDATE",
      field: "shortcuts",
      value: managerRef.current.getAllShortcuts(),
    });
  };

  const disableShortcut = (id: string) => {
    if (!managerRef.current) return;
    managerRef.current.disableShortcut(id);
    dispatch({
      type: "UPDATE",
      field: "shortcuts",
      value: managerRef.current.getAllShortcuts(),
    });
  };

  // Recording methods
  const startRecording = () => {
    if (!managerRef.current) return;
    managerRef.current.startRecording();
    dispatch({
      type: "UPDATE",
      field: "recordingState",
      value: { isRecording: true, keys: null, conflicts: [] },
    });
  };

  const stopRecording = () => {
    if (!managerRef.current) return;
    managerRef.current.stopRecording();
    dispatch({
      type: "UPDATE",
      field: "recordingState",
      value: { isRecording: false, keys: null, conflicts: [] },
    });
  };

  const recordKeyCombo = (event: KeyboardEvent): KeyCombo => {
    if (!managerRef.current) throw new Error("ShortcutManager not initialized");
    const keys = managerRef.current.recordKeyCombo(event);
    const conflicts = managerRef.current.checkConflicts(keys);

    dispatch({
      type: "UPDATE",
      field: "recordingState",
      value: { isRecording: true, keys, conflicts },
    });

    return keys;
  };

  // Utility methods
  const formatKeyCombo = (keys: KeyCombo): string => {
    if (!managerRef.current) return "";
    return managerRef.current.formatKeyCombo(keys);
  };

  const checkConflicts = (
    keys: KeyCombo,
    excludeId?: string,
  ): ShortcutConflict[] => {
    if (!managerRef.current) return [];
    return managerRef.current.checkConflicts(keys, excludeId);
  };

  const exportSettings = (): string => {
    if (!managerRef.current) return "{}";
    return managerRef.current.exportSettings();
  };

  const importSettings = (json: string): boolean => {
    if (!managerRef.current) return false;
    const success = managerRef.current.importSettings(json);
    if (success) {
      dispatch({
        type: "UPDATE",
        field: "shortcuts",
        value: managerRef.current.getAllShortcuts(),
      });
    }
    return success;
  };

  const executeCommand = (command: Command) => {
    command.action();
    dispatch({ type: "UPDATE", field: "isCommandPaletteOpen", value: false });
  };

  const setContext = (context: string) => {
    dispatch({ type: "UPDATE", field: "currentContext", value: context });
    if (managerRef.current) {
      managerRef.current.setContext(context);
    }
  };

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
    setCommandPaletteOpen: (open: boolean) =>
      dispatch({ type: "UPDATE", field: "isCommandPaletteOpen", value: open }),
    commands,
    executeCommand,
    registerRuntimeCommands,
    currentContext,
    setContext,
    isHelpOpen,
    setHelpOpen: (open: boolean) =>
      dispatch({ type: "UPDATE", field: "isHelpOpen", value: open }),
  };

  return (
    <ShortcutContext.Provider value={value}>
      {children}
    </ShortcutContext.Provider>
  );
};

// Custom hook for using a specific shortcut
export const useShortcut = (shortcutId: string, handler?: () => void) => {
  const { getShortcut } = useShortcuts();
  const shortcut = getShortcut(shortcutId);

  useEffect(() => {
    if (!shortcut || !handler) return;

    const handleShortcut = (event: CustomEvent) => {
      if (event.detail.shortcutId === shortcutId) {
        handler();
      }
    };

    window.addEventListener("shortcut-executed", handleShortcut as EventListener);

    return () => {
      window.removeEventListener("shortcut-executed", handleShortcut as EventListener);
    };
  }, [shortcutId, handler, shortcut]);

  return shortcut;
};

// Custom hook for registering a temporary shortcut
export const useTemporaryShortcut = (
  keys: KeyCombo,
  handler: () => void,
  options?: {
    preventDefault?: boolean;
    stopPropagation?: boolean;
    enabled?: boolean;
  },
) => {
  useEffect(() => {
    if (options?.enabled === false) return;

    const isEditableTarget = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false;
      if (target.isContentEditable) return true;

      return Boolean(
        target.closest(
          'input, textarea, select, [contenteditable="true"], [role="textbox"]',
        ),
      );
    };

    const hasOpenModal = (): boolean => {
      return Boolean(
        document.querySelector('[role="dialog"][aria-modal="true"]'),
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      if (isEditableTarget(event.target)) return;
      if (hasOpenModal()) return;

      const matchesModifiers =
        event.ctrlKey === keys.modifiers.includes("ctrl") &&
        event.altKey === keys.modifiers.includes("alt") &&
        event.shiftKey === keys.modifiers.includes("shift") &&
        event.metaKey === keys.modifiers.includes("meta");

      if (
        matchesModifiers &&
        event.key.toLowerCase() === keys.key.toLowerCase()
      ) {
        if (options?.preventDefault !== false) {
          event.preventDefault();
        }
        if (options?.stopPropagation !== false) {
          event.stopPropagation();
        }
        handler();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [keys, handler, options]);
};
