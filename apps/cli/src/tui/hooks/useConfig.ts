/**
 * Config/context hook for TUI
 * Reads active workspace/project from Conf storage
 * Only triggers re-render when values actually change
 */

import { useState, useEffect, useRef } from 'react';
import { getContext, hasProjectContext } from '../../lib/config.js';

export interface ConfigState {
  workspaceId: string | undefined;
  workspaceName: string | undefined;
  projectId: string | undefined;
  projectKey: string | undefined;
  projectName: string | undefined;
  hasContext: boolean;
}

function readConfig(): ConfigState {
  const ctx = getContext();
  return {
    workspaceId: ctx?.workspaceId,
    workspaceName: ctx?.workspaceName,
    projectId: ctx?.projectId,
    projectKey: ctx?.projectKey,
    projectName: ctx?.projectName,
    hasContext: hasProjectContext(),
  };
}

export function useConfig(): ConfigState {
  const [state, setState] = useState<ConfigState>(readConfig);
  const keyRef = useRef('');

  useEffect(() => {
    // Serialize for cheap equality check
    keyRef.current = JSON.stringify(state);

    const interval = setInterval(() => {
      const next = readConfig();
      const nextKey = JSON.stringify(next);
      if (nextKey !== keyRef.current) {
        keyRef.current = nextKey;
        setState(next);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return state;
}
