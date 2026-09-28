/* Rob Control — minimal app-shell service worker */
const CACHE = "rob-control-v2";
const SHELL = [
  "./",
  "./index.html",
  "./boot.js",
  "./styles.css",
  "./manifest.webmanifest",
  "./icon-192.svg",
  "./icon-512.svg",
  "./payload/app.0.b64",
  "./payload/app.1.b64",
  "./payload/app.2.b64",
  "./payload/app.3.b64",
  "./payload/app.4.b64",
  "./payload/seed.0.b64",
  "./payload/seed.1.b64",
  "./payload/seed.2.b64",
  "./payload/seed.3.b64",
  "./payload/seed.4.b64"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
