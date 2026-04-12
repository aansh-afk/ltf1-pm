import { useState, useEffect, useCallback } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

type PushState = "unsupported" | "default" | "denied" | "granted" | "loading";

export function usePushNotifications() {
  const [state, setState] = useState<PushState>("loading");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const getVapidKey = useAction(api.notifications.config.getVapidPublicKey);
  const subscribeMutation = useMutation(api.notifications.push.subscribe);
  const unsubscribeMutation = useMutation(api.notifications.push.unsubscribe);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }

    // Check current permission state
    setState(Notification.permission as PushState);

    // Check if already subscribed
    navigator.serviceWorker.ready.then((registration) => {
      registration.pushManager.getSubscription().then((sub) => {
        setIsSubscribed(!!sub);
      });
    });
  }, []);

  const subscribe = useCallback(async () => {
    if (state === "unsupported") return false;

    try {
      setState("loading");

      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Request permission
      const permission = await Notification.requestPermission();
      setState(permission as PushState);

      if (permission !== "granted") return false;

      // Get VAPID key from backend
      const vapidKey = await getVapidKey();
      if (!vapidKey) {
        console.error("[PUSH] VAPID key not configured on server");
        return false;
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        console.error("[PUSH] Invalid subscription object");
        return false;
      }

      // Send subscription to backend
      await subscribeMutation({
        endpoint: json.endpoint,
        keys: {
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
        },
        userAgent: navigator.userAgent,
      });

      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error("[PUSH] Subscribe failed:", err);
      setState(Notification.permission as PushState);
      return false;
    }
  }, [state, getVapidKey, subscribeMutation]);

  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await unsubscribeMutation({ endpoint });
      }

      setIsSubscribed(false);
      return true;
    } catch (err) {
      console.error("[PUSH] Unsubscribe failed:", err);
      return false;
    }
  }, [unsubscribeMutation]);

  return {
    state,
    isSubscribed,
    isSupported: state !== "unsupported",
    isDenied: state === "denied",
    subscribe,
    unsubscribe,
  };
}

// Convert VAPID key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
