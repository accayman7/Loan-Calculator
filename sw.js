// sw.js - Service Worker (Local-Only Mode)
// Consumes shared version from js/version.js
importScripts('./js/version.js');

const CACHE_NAME = 'loan-calc-v' + self.APP_VERSION;

// Resources to cache immediately on install
const PRE_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  './chart.js',
  './tailwind.js',
  './js/logic.js',
  './js/ui.js',
  './js/datepicker.js',
  './js/app.js',
  './xlsx.mini.min.js'
];

// Install Event: Cache core files (best-effort - missing files won't break install)
// NOTE: We intentionally do NOT call skipWaiting() here - let the new SW wait
// until user clicks the "Refresh" button, which sends SKIP_WAITING message
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Best-effort caching: cache what exists, log what doesn't
      const results = await Promise.allSettled(
        PRE_CACHE.map(url =>
          cache.add(url).catch(err => {
            console.warn('[SW] Failed to cache:', url, err.message);
            return null; // Don't fail the entire install
          })
        )
      );
      const cached = results.filter(r => r.status === 'fulfilled').length;
      console.log(`[SW] Cached ${cached}/${PRE_CACHE.length} resources`);
    })
  );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch Event: Local-Only Enforcement + Cache-First for performance
self.addEventListener('fetch', (event) => {
  // 1. Ignore non-GET requests (POST, etc.) to prevent cache poisoning
  if (event.request.method !== 'GET') return;

  // 2. Ignore non-http schemes (like chrome-extension://)
  if (!event.request.url.startsWith('http')) return;

  // 3. LOCAL-ONLY ENFORCEMENT: Block all external domain requests
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    console.warn('[SW] Blocked external request:', requestUrl.href);
    event.respondWith(
      new Response('External requests are blocked for compliance.', {
        status: 403,
        statusText: 'Forbidden - Local Only Mode'
      })
    );
    return;
  }

  // 4. Cache-First for same-origin (snappy after install)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version immediately, then update cache in background
        event.waitUntil(
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse.clone());
              });
            }
          }).catch(() => {
            // Network failed, that's fine - we have cache
          })
        );
        return cachedResponse;
      }

      // Not in cache - fetch from network
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          // Offline fallback for navigation
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          // Return simple 503 instead of null to match review recommendation
          return new Response('Offline: Service Unavailable', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        });
    })
  );
});

// Message handler: allow page to trigger immediate activation
self.addEventListener('message', (event) => {
  // Security: Validate the message source is a legitimate client
  // In service workers, event.source is a WindowClient for valid same-origin requests
  if (!event.source || !(event.source instanceof Client)) {
    return; // Ignore messages without a valid client source
  }

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});