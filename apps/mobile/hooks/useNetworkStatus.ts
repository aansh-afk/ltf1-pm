import { useState, useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";
import { useConvex } from "convex/react";

interface NetworkStatus {
  /** Device has network connectivity and internet is reachable */
  isConnected: boolean;
  /** Convex WebSocket is connected and subscriptions are active */
  isConvexConnected: boolean;
  /** True when both network and Convex are connected */
  isOnline: boolean;
}

/**
 * Monitor network connectivity and Convex connection status.
 * Combines device-level NetInfo with Convex WebSocket state
 * for an accurate online/offline picture.
 */
export function useNetworkStatus(): NetworkStatus {
  const [isConnected, setIsConnected] = useState(true);
  const convex = useConvex();
  const [isConvexConnected, setIsConvexConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(
        Boolean(state.isConnected && state.isInternetReachable !== false),
      );
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Poll Convex connection state. The connectionState() method is synchronous
    // but we check periodically to keep the status current.
    const checkConnection = () => {
      try {
        const state = (convex as any).connectionState?.();
        setIsConvexConnected(state?.isWebSocketConnected ?? true);
      } catch {
        // If connectionState isn't available, assume connected
        setIsConvexConnected(true);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 3000);
    return () => clearInterval(interval);
  }, [convex]);

  return {
    isConnected,
    isConvexConnected,
    isOnline: isConnected && isConvexConnected,
  };
}
