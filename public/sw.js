const CACHE_NAME = 'alumni-connection-v1.0.0';
const STATIC_CACHE = 'static-v1.0.0';
const DYNAMIC_CACHE = 'dynamic-v1.0.0';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/kit_logo.png',
  '/default-avatar.png',
  '/default-group.png',
  '/banner.jpg',
  '/login-banner.jpg',
  '/login-banner2.jpg'
];

// API routes to cache
const API_ROUTES = [
  '/api/posts',
  '/api/users',
  '/api/connections',
  '/api/opportunities',
  '/api/groups'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Static files cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Error caching static files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle different types of requests
  if (request.method === 'GET') {
    // Static assets
    if (request.destination === 'image' || 
        request.destination === 'font' || 
        request.destination === 'style' ||
        request.destination === 'script') {
      event.respondWith(serveFromCache(request, STATIC_CACHE));
      return;
    }

    // API requests
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(serveApiWithCache(request));
      return;
    }

    // Navigation requests (pages)
    if (request.mode === 'navigate') {
      event.respondWith(servePageWithCache(request));
      return;
    }

    // Other requests
    event.respondWith(serveFromCache(request, STATIC_CACHE));
  } else {
    // Non-GET requests (POST, PUT, DELETE)
    event.respondWith(handleNonGetRequest(request));
  }
});

// Serve static files from cache
async function serveFromCache(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }

    // Try to fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      cache.put(request, responseClone);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Error serving from cache:', error);
    return new Response('Network error', { status: 503 });
  }
}

// Serve API requests with cache fallback
async function serveApiWithCache(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const responseClone = networkResponse.clone();
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, responseClone);
      return networkResponse;
    }
    
    // If network fails, try cache
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Error serving API with cache:', error);
    
    // Return cached response if available
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Service unavailable', { status: 503 });
  }
}

// Serve pages with cache fallback
async function servePageWithCache(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful page responses
      const responseClone = networkResponse.clone();
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, responseClone);
      return networkResponse;
    }
    
    // If network fails, try cache
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cached version, return offline page
    return caches.match('/offline.html');
  } catch (error) {
    console.error('Error serving page with cache:', error);
    
    // Return cached response if available
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    return caches.match('/offline.html');
  }
}

// Handle non-GET requests
async function handleNonGetRequest(request) {
  try {
    // For non-GET requests, always try network first
    const response = await fetch(request);
    
    // If successful, update cache if needed
    if (response.ok) {
      // For POST requests to API endpoints, invalidate related caches
      if (request.method === 'POST' && request.url.includes('/api/')) {
        const cache = await caches.open(DYNAMIC_CACHE);
        await cache.delete(request.url);
      }
    }
    
    return response;
  } catch (error) {
    console.error('Error handling non-GET request:', error);
    return new Response('Network error', { status: 503 });
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Background sync implementation
async function doBackgroundSync() {
  try {
    // Get any pending actions from IndexedDB
    // This would be implemented based on your app's offline queue system
    console.log('Performing background sync...');
    
    // Example: sync offline posts, messages, etc.
    // await syncOfflinePosts();
    // await syncOfflineMessages();
    
    console.log('Background sync completed');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'New notification from Alumni Connect',
      icon: '/kit_logo.png',
      badge: '/kit_logo.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        {
          action: 'explore',
          title: 'View',
          icon: '/kit_logo.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/kit_logo.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Alumni Connect', options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('Message received in service worker:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE)
        .then((cache) => {
          return cache.addAll(event.data.urls);
        })
    );
  }
});
