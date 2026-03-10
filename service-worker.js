// Service Worker for Personal Evolution Lab PWA
const CACHE_NAME = 'pe-lab-v1';
const urlsToCache = [
  './all_in_one_complete_fixed.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('[SW] Cache installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  console.log('[SW] Fetching:', event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          console.log('[SW] Serving from cache:', event.request.url);
          return response;
        }

        // Network request
        console.log('[SW] Fetching from network:', event.request.url);
        return fetch(event.request)
          .then(response => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone response for caching
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                console.log('[SW] Caching new resource:', event.request.url);
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.error('[SW] Network fetch failed:', error);
            
            // Try to serve offline page for HTML requests
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('./all_in_one_complete_fixed.html');
            }
          });
      })
  );
});

// Background sync for offline data (optional)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Handle background sync logic here
  return Promise.resolve();
}

// Push notification handling (optional)
self.addEventListener('push', event => {
  console.log('[SW] Push message received');
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: './manifest.json',
    badge: './manifest.json'
  };
  
  event.waitUntil(
    self.registration.showNotification('Personal Evolution Lab', options)
  );
});
