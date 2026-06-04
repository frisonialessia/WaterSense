// WaterSense — Service Worker (modo offline)
// Estrategia: network-first con respaldo a caché. Así, una vez visitada,
// la app y sus datos cacheados siguen funcionando sin conexión — clave para
// ranchos de Chihuahua con internet inestable. Los datos del usuario viven en
// localStorage (offline por naturaleza).
const CACHE = "watersense-v1";
const CORE = ["/", "/dashboard"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(CORE))
      .then(() => self.skipWaiting())
      .catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // POST (decision/agent) no se cachea
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // teselas/APIs externas: directo a red

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || caches.match("/dashboard") || caches.match("/"))
      )
  );
});
