const C = "cdc-v2";
const ASSETS = ["index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(C).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()).catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const ehPagina = req.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith("index.html");

  if (ehPagina) {
    e.respondWith(
      fetch(req).then(res => {
        if (res && res.ok) { const cp = res.clone(); caches.open(C).then(c => c.put("index.html", cp)); }
        return res;
      }).catch(() => caches.match("index.html", { ignoreSearch: true }))
    );
    return;
  }

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      if (hit) {
        fetch(req).then(res => {
          if (res && res.ok) caches.open(C).then(c => c.put(req, res.clone()));
        }).catch(() => {});
        return hit;
      }
      return fetch(req).then(res => {
        if (res && res.ok) { const cp = res.clone(); caches.open(C).then(c => c.put(req, cp)); }
        return res;
      }).catch(() => caches.match("index.html", { ignoreSearch: true }));
    })
  );
});
