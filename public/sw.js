// Findit Harare — Service Worker (Offline Cache & Map Resiliency)
const SHELL_CACHE = 'findit-shell-v4.2.0';
const TILES_CACHE = 'findit-map-tiles-v4';
const API_CACHE = 'findit-api-cache-v4';

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/favicon.png',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/vendor/leaflet.css',
  '/vendor/leaflet.js',
  '/vendor/AgoraRTC_N-4.20.0.js'
];

self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      return cache.addAll(SHELL_ASSETS).catch((err) => {
        console.warn('SW pre-cache warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => {
          if (k !== SHELL_CACHE && k !== TILES_CACHE && k !== API_CACHE) {
            return caches.delete(k);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (evt) => {
  const req = evt.request;
  const url = new URL(req.url);

  // 1. Map Tiles (OpenStreetMap / Carto): Stale-While-Revalidate
  if (url.hostname.includes('tile.openstreetmap.org') || url.hostname.includes('cartocdn.com') || url.pathname.includes('/tile/')) {
    evt.respondWith(
      caches.open(TILES_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const fetchPromise = fetch(req).then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            cache.put(req, networkRes.clone());
          }
          return networkRes;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // 2. State & Suburb API: Network-first with Cache Fallback
  if (url.pathname === '/api/state' || url.pathname.startsWith('/api/suburbs')) {
    evt.respondWith(
      fetch(req).then(async (res) => {
        if (res && res.status === 200) {
          const cache = await caches.open(API_CACHE);
          cache.put(req, res.clone());
        }
        return res;
      }).catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        return new Response(JSON.stringify({ offline: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // 3. App Shell Code (HTML, JS, CSS): Network-First with Cache-Fallback for Instant Code Updates
  const isCodeAsset = url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname === '/' || url.pathname.endsWith('.html') || url.pathname.startsWith('/admin');
  if (req.method === 'GET' && isCodeAsset) {
    evt.respondWith(
      fetch(req).then(async (netRes) => {
        if (netRes && netRes.status === 200) {
          const cache = await caches.open(SHELL_CACHE);
          cache.put(req, netRes.clone());
        }
        return netRes;
      }).catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        if (req.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return null;
      })
    );
    return;
  }

  // 4. Other Static Assets (Images, Icons, Fonts): Cache-first with Network-fallback
  if (req.method === 'GET') {
    evt.respondWith(
      caches.match(req).then((cached) => {
        if (cached) {
          fetch(req).then(async (netRes) => {
            if (netRes && netRes.status === 200) {
              const cache = await caches.open(SHELL_CACHE);
              cache.put(req, netRes);
            }
          }).catch(() => {});
          return cached;
        }
        return fetch(req).then(async (netRes) => {
          if (netRes && netRes.status === 200 && url.origin === location.origin) {
            const cache = await caches.open(SHELL_CACHE);
            cache.put(req, netRes.clone());
          }
          return netRes;
        }).catch(async () => {
          if (req.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return null;
        });
      })
    );
  }
});
