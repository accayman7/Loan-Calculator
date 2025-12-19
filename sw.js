// UPDATED: Incremented cache version to v3.9.23
const CACHE_NAME = 'loan-calc-v3.9.23';

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
  './js/app.js'
];

// Install Event: Cache core files
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activate worker immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRE_CACHE);
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
            console.log('Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch Event: Network First, falling back to Cache
// This ensures that if the server is reachable, the user gets the latest code (fixing "refresh" behavior).
// If offline, it falls back to the cached version.
self.addEventListener('fetch', (event) => {
  // Only handle HTTP/HTTPS requests
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If network fetch is successful, cache the new version and return it
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
          return networkResponse;
        }
        
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return networkResponse;
      })
      .catch(() => {
        // If network fails (Offline), return cached version
        return caches.match(event.request);
      })
  );
});