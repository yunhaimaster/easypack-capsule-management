// Easy Health Service Worker
// Version: 3.1.0
// Strategy: Stale-While-Revalidate (always show latest, cache for speed)

const CACHE_NAME = 'easy-health-v3.1.0';
const RUNTIME_CACHE = 'easy-health-runtime-v3.1.0';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/login',
  '/orders',
  '/manifest.json',
  '/images/EasyHealth_Logo_only.svg',
  '/images/EasyHealth_Logo.svg'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching app shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
          })
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip API requests - always fetch fresh, let browser handle
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Skip non-GET requests - can't cache POST, PUT, DELETE, etc.
  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  // Network-First with fast timeout for HTML pages
  // Always try to get latest content, but use cache if network is slow
  if (request.mode === 'navigate') {
    event.respondWith(
      Promise.race([
        // Try network first (with 2 second timeout for fast response)
        fetch(request)
          .then((response) => {
            // Only cache successful, non-redirect responses
            if (response && response.status === 200 && response.type === 'basic') {
              const responseClone = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            // Network fetch failed, will fallback to cache
            return null;
          }),
        // Timeout after 2 seconds
        new Promise((resolve) => {
          setTimeout(() => resolve(null), 2000);
        })
      ])
        .then((networkResponse) => {
          // If network succeeded within timeout, use it
          if (networkResponse && networkResponse.ok) {
            return networkResponse;
          }
          
          // Network failed or timed out, try cache
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                // Return cache but trigger background update
                // This ensures user sees content quickly, but gets fresh version next time
                fetch(request)
                  .then((freshResponse) => {
                    if (freshResponse && freshResponse.ok) {
                      const responseClone = freshResponse.clone();
                      caches.open(RUNTIME_CACHE).then((cache) => {
                        cache.put(request, responseClone);
                      });
                    }
                  })
                  .catch(() => {
                    // Background update failed, cache is still valid
                  });
                return cachedResponse;
              }
              
              // No cache either, return offline page
              return caches.match('/') || new Response('Offline', { 
                status: 503,
                headers: { 'Content-Type': 'text/html' }
              });
            });
        })
    );
    return;
  }

  // Stale-While-Revalidate for static assets (JS, CSS, images)
  // Returns cache immediately, updates in background
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Always fetch fresh version in background
        const fetchPromise = fetch(request)
          .then((response) => {
            // Only cache successful responses
            if (response && response.status === 200) {
              const responseClone = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            // Network failed, cache remains valid
          });

        // Return cached version immediately if available
        if (cachedResponse) {
          // Update cache in background (non-blocking)
          fetchPromise.catch(() => {
            // Silently handle background update failures
          });
          return cachedResponse;
        }

        // No cache, wait for network response
        return fetchPromise
          .catch(() => {
            // Final fallback - return cache even if stale
            return caches.match(request);
          });
      })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

// Background sync for offline form submissions (future feature)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(
      // Sync logic would go here
      console.log('[SW] Background sync:', event.tag)
    );
  }
});

console.log('[SW] Service Worker loaded successfully');

