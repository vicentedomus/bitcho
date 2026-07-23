// Bitcho service worker — network-first (FR-005/016/017).
// Sirve red primero; ante fallo, el último response cacheado. El app shell se
// precachea para arranque offline. version.json (no-cache) dispara el aviso de
// versión nueva; al cambiar CACHE_VERSION se limpian cachés viejas.

const CACHE_VERSION = 'bitcho-v1';
// App shell con nombres de asset fijos (sin hash) → precacheable para arranque offline.
const SHELL = ['/', '/index.html', '/manifest.json', '/assets/index.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // version.json: siempre red (no cachear), para detectar deploys nuevos.
  if (req.url.includes('/version.json')) return;

  // ignoreVary: los assets de vite preview traen `Vary`, y sin esto caches.match(req)
  // falla y el fallback devolvería index.html (text/html) para /assets/index.js,
  // rompiendo el módulo. Con ignoreVary el JS cacheado se recupera correctamente.
  const fromCache = () =>
    caches.match(req, { ignoreVary: true }).then((c) => c || caches.match('/index.html', { ignoreVary: true }));

  e.respondWith(
    fetch(req)
      .then((res) => {
        // Cachea respuestas buenas (same-origin y datos de Supabase) para el modo offline.
        if (res && res.status === 200 && (req.url.startsWith(self.location.origin) || req.url.includes('supabase.co'))) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(fromCache),
  );
});
