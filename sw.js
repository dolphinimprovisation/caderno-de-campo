const C = "cdc-v1";
const ASSETS = ["index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()).catch(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => {
      if (hit) {
        fetch(e.request).then(res => { if (res && res.ok) caches.open(C).then(c => c.put(e.request, res.clone())); }).catch(() => {});
        return hit;
      }
      return fetch(e.request).then(res => {
        if (res && res.ok) { const cp = res.clone(); caches.open(C).then(c => c.put(e.request, cp)); }
        return res;
      }).catch(() => caches.match("index.html"));
    })
  );
});
