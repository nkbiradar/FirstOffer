// Service worker for "new opportunities added" browser push notifications.
// Registered by components/PushNotificationPrompt.tsx. Deliberately does
// nothing else (no offline caching) — this site isn't a PWA, this file
// exists purely so the Push API has a worker to deliver events to.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "FirstOffer", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "FirstOffer";
  const options = {
    body: data.body || "New opportunities are live — go fast and apply!",
    icon: "/notification-icon.png",
    badge: "/notification-icon.png",
    data: { url: data.url || "/opportunities" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Focuses an already-open FirstOffer tab and navigates it if possible,
// otherwise opens a new one — standard "click a notification" behavior.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data && event.notification.data.url ? event.notification.data.url : "/opportunities";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    }),
  );
});
