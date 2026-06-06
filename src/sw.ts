/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { StaleWhileRevalidate, CacheFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

// ---------------------------------------------------------------------------
// App-shell precache (offline-first). The manifest is injected at build time.
// ---------------------------------------------------------------------------
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// SPA navigations -> serve the cached app shell so the app opens offline.
registerRoute(
  new NavigationRoute(
    async ({ event }) => {
      try {
        return await fetch((event as FetchEvent).request);
      } catch {
        const cache = await caches.open("workbox-precache-v2");
        const cached =
          (await cache.match("/index.html")) ?? (await caches.match("/"));
        return (
          cached ??
          new Response("Anda sedang offline.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          })
        );
      }
    },
    { denylist: [/^\/api\//] },
  ),
);

// Map tiles / Nominatim are not cached aggressively (usage policy), but we keep
// a tiny SWR cache for repeated city searches within a session.
registerRoute(
  ({ url }) => url.hostname.endsWith("nominatim.openstreetmap.org"),
  new StaleWhileRevalidate({
    cacheName: "nominatim",
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 86_400 })],
  }),
);

// App icons / static images.
registerRoute(
  ({ request }) => request.destination === "image",
  new CacheFirst({
    cacheName: "images",
    plugins: [
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 86_400 }),
    ],
  }),
);

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
self.addEventListener("install", () => {
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

// ---------------------------------------------------------------------------
// Notifications
//  - `push`: handles future Web Push payloads from the Cloudflare Worker.
//  - `notificationclick`: focus or open the relevant prayer screen.
// ---------------------------------------------------------------------------
self.addEventListener("push", (event) => {
  let payload: {
    title?: string;
    body?: string;
    prayer?: string;
    tag?: string;
  } = {};
  try {
    payload = event.data?.json() ?? {};
  } catch {
    payload = { body: event.data?.text() };
  }

  const title = payload.title ?? "Waktu Sholat";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body ?? "Pengingat waktu sholat.",
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      tag: payload.tag ?? payload.prayer ?? "waqt",
      data: { prayer: payload.prayer },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const prayer = event.notification.data?.prayer as string | undefined;
  const target = prayer ? `/prayer/${prayer}` : "/";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of allClients) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) {
            try {
              await client.navigate(target);
            } catch {
              /* ignore cross-origin navigate */
            }
          }
          return;
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});
