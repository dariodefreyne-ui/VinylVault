/* VinylVault service worker — app-shell offline + snel herladen.
 *
 * Strategie (bewust voorzichtig):
 *   - Navigaties (HTML)         → network-first, val terug op gecachete index.html
 *                                 (zo opent de app ook offline).
 *   - Eigen statische assets    → cache-first (Vite-bestanden zijn hash-immutable).
 *   - Google Fonts              → stale-while-revalidate.
 *   - Al de rest (Firebase,
 *     Firestore, Storage, Auth) → NIET aangeraakt → gewoon naar het netwerk.
 *
 * Firestore/auth-verkeer mag nooit door de SW gecachet worden: dat zou tot
 * verouderde data of auth-problemen leiden. Firestore heeft bovendien zijn
 * eigen offline-laag.
 */

const VERSION = 'vv-v1';
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;
const FONT_CACHE = `${VERSION}-fonts`;

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(['/', '/index.html']))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(SHELL_CACHE);
    cache.put('/index.html', response.clone());
    return response;
  } catch {
    const cache = await caches.open(SHELL_CACHE);
    const cached = (await cache.match('/index.html')) || (await cache.match('/'));
    return cached || Response.error();
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && (response.ok || response.type === 'opaque')) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);
  return cached || network || fetch(request);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // Navigaties → app-shell (offline openbaar maken)
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // Eigen gebouwde assets → cache-first (hash-immutable)
  if (sameOrigin && url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  // Overige eigen statische bestanden (iconen, manifest, favicon)
  if (
    sameOrigin &&
    /\.(png|svg|ico|webmanifest|json|woff2?)$/i.test(url.pathname)
  ) {
    event.respondWith(staleWhileRevalidate(request, ASSET_CACHE));
    return;
  }

  // Google Fonts → stale-while-revalidate
  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request, FONT_CACHE));
    return;
  }

  // Al de rest (Firebase/Firestore/Storage/Auth/...) → niet aanraken.
});
