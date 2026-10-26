/* TechNov service worker — caches the app shell so it installs and works offline. */
const CACHE = "technov-v1";
const ASSETS = [
  "./", "./index.html", "./manifest.json",
  "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./icon-180.png", "./favicon-32.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // Cache-first for our own files, falling back to network, then to the app shell when offline.
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(resp => {
      try {
        if (resp && resp.status === 200 && new URL(e.request.url).origin === location.origin) {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
      } catch (_) {}
      return resp;
    }).catch(() => caches.match("./index.html")))
  );
});
