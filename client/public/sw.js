/* Service worker for Web Push notifications and PWA installability.
 *
 * Receives push events and displays system notifications. Also implements
 * a minimal `fetch` handler so the browser treats the app as a PWA and
 * surfaces the install prompt. We intentionally pass everything through
 * to the network — the clinic dashboard depends on real-time data, so we
 * don't want stale cached responses. The empty handler is enough to
 * satisfy the install criterion. */

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // No-op handler: required for installability, but we always go to the
  // network so the clinic sees fresh data.
  return;
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch (_) {
    payload = { title: "Hollyhill Dental", body: event.data.text() };
  }

  const title = payload.title || "Hollyhill Dental";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/logo.png",
    badge: payload.badge || "/logo.png",
    tag: payload.tag || "hollyhill",
    data: { url: payload.url || "/" },
    requireInteraction: payload.requireInteraction === true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl =
    (event.notification?.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Focus an existing tab on our origin if one is open.
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            if ("navigate" in client) {
              client.navigate(targetUrl);
            }
            return;
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
