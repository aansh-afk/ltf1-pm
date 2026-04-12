// LTF1 Push Notification Service Worker

self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body || "",
    icon: data.icon || "/icon-192.png",
    badge: data.badge || "/badge-72.png",
    tag: data.tag || "ltf1",
    data: {
      url: data.url || "https://ltf1.dev",
    },
    // Brutalist styling — no fancy actions, just the notification
    requireInteraction: false,
    silent: false,
  };

  event.waitUntil(self.registration.showNotification(data.title || "LTF1", options));
});

// Open the app when notification is clicked
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "https://ltf1.dev";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes("ltf1") && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Otherwise open new window
      return clients.openWindow(url);
    })
  );
});
