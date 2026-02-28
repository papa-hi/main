const CACHE_NAME = 'papa-hi-v3';
const OFFLINE_URL = '/offline.html';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
];

// Listen for skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache if available, otherwise fetch from network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests entirely (Firebase Auth, Google APIs, etc.)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // NEVER cache API requests - always fetch from network
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.open(CACHE_NAME).then((cache) => {
            return cache.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // For other requests (images, scripts, etc.)
  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request)
          .then((fetchResponse) => {
            // Cache important resources for offline use
            if (
              fetchResponse.status === 200 &&
              (event.request.url.endsWith('.js') ||
                event.request.url.endsWith('.css') ||
                event.request.url.includes('fonts'))
            ) {
              const responseToCache = fetchResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return fetchResponse;
          })
          .catch(() => {
            // For image requests, return a placeholder image if offline
            if (event.request.destination === 'image') {
              return new Response(
                '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="300" fill="#f8f7f3"/><text x="50%" y="50%" font-family="Arial" text-anchor="middle" font-size="20" fill="#4f6f52">Afbeelding niet beschikbaar</text></svg>',
                {
                  headers: { 'Content-Type': 'image/svg+xml' },
                }
              );
            }
            return new Response('Content niet beschikbaar offline');
          })
      );
    })
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'Nieuw bericht van Papa-Hi!',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-192x192.png',
    data: data.data || { url: '/' },
    actions: data.actions || [],
    requireInteraction: true,
    tag: data.data?.type || 'general'
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Papa-Hi Melding',
      options
    )
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const notificationData = event.notification.data;
  let targetUrl = '/';
  
  // Handle action clicks
  if (event.action) {
    switch (event.action) {
      case 'view':
        if (notificationData.type === 'playdate_reminder' || notificationData.type === 'playdate_update') {
          targetUrl = '/playdates';
        }
        break;
      default:
        targetUrl = notificationData.url || '/';
    }
  } else {
    // Handle notification body click
    if (notificationData.type === 'playdate_reminder' || notificationData.type === 'playdate_update') {
      targetUrl = '/playdates';
    } else {
      targetUrl = notificationData.url || '/';
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open with the target URL
      for (const client of clientList) {
        if (client.url.includes(new URL(targetUrl, self.location.origin).pathname) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no suitable window found, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
