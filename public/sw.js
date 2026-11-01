const CACHE_NAME = 'onestep-solution-quotation-v1';

// Static resources to cache immediately on service worker install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/assets/aistudio/image_6276447f.png',
  '/assets/aistudio/image_dcc52733.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  // Activate updated service worker immediately without waiting for existing tabs to close
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('Pre-cache non-fatal warning during SW install:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  // Take control of all open clients immediately
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests and skip browser extensions or chrome-extension URLs
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  // Handle navigation requests (HTML page): Network first, falling back to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          return (await caches.match('/index.html')) || (await caches.match('/'));
        })
    );
    return;
  }

  // Handle static assets (scripts, styles, images, fonts): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline network error handled gracefully
          return null;
        });

      return cachedResponse || fetchPromise.then((res) => res || caches.match('/'));
    })
  );
});
