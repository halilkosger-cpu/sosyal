// isyurtlari.com.tr PWA Service Worker (Store-Ready)
const CACHE_NAME = 'isyurtlari-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/logo.png',
  '/favicon.ico',
];

// 1. Kurulum ve statik varlıkları önbelleğe alma
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('SW static asset cache warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Yeni service worker etkinleştirildiğinde eski önbellekleri temizleme
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. İstek yakalama stratejisi
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Admin rotaları, API istekleri ve ödeme akışları ASLA önbelleğe alınmaz
  if (
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/api') ||
    url.pathname.includes('/checkout') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  // Statik varlıklar (resimler, fontlar): Stale-While-Revalidate
  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/urun/') ||
    url.pathname.match(/\.(png|jpg|jpeg|webp|svg|woff2|css|js)$/)
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Sayfalar (HTML): Network-first (Önce canlı güncel fiyat ve stok, çevrimdışıysa önbellek)
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        const rootCached = await caches.match('/');
        return rootCached || new Response('Çevrimdışı moddasınız', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      })
  );
});
