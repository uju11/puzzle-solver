const CACHE_NAME = 'wend-solver-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/solver.js',
  '/manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Cache-first for local assets, network-first for CDN (Tesseract)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) {
    // Network-first for external CDN resources
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }
  // Skip POST requests (share target)
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      return res;
    }))
  );
});

// Handle share target POST
self.addEventListener('fetch', e => {
  if (e.request.method === 'POST' && e.request.url.endsWith('/')) {
    e.respondWith((async () => {
      const formData = await e.request.formData();
      const file = formData.get('screenshot');
      if (file) {
        const client = await self.clients.get(e.clientId) ||
          (await self.clients.matchAll({ type: 'window' }))[0];
        if (client) {
          const ab = await file.arrayBuffer();
          client.postMessage({ type: 'SHARED_IMAGE', buffer: ab, mime: file.type }, [ab]);
        }
      }
      return Response.redirect('/', 303);
    })());
  }
});
