// Service Worker Cósmico de Zodia para Web Push Notifications y PWA Offline
const CACHE_NAME = 'zodia-cache-v6';
const STATIC_ASSETS = [
  '/zodia/manifest.json',
  '/zodia/assets/logo.png',
  '/zodia/assets/ico.png',
  '/zodia/assets/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

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
    }).then(() => self.clients.claim())
  );
});

// Interceptor de peticiones para soporte PWA rápido (bypassea APIs)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar peticiones API, NextAuth o WebSocket para no interferir con datos en tiempo real
  if (url.pathname.includes('/api/') || request.method !== 'GET') {
    return;
  }

  // Cache First para imágenes y assets estáticos
  if (
    url.pathname.includes('/assets/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        }).catch(() => cachedResponse);
      })
    );
  }
});

// Receptor de notificaciones Web Push del servidor
self.addEventListener('push', (event) => {
  let data = {
    title: 'Zodia • Conexión Cósmica',
    body: 'Tienes una nueva actualización en tu matriz astral.',
    icon: '/zodia/assets/logo.png',
    badge: '/zodia/assets/ico.png',
    url: '/zodia/dashboard'
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/zodia/assets/logo.png',
    badge: data.badge || '/zodia/assets/ico.png',
    vibrate: [150, 80, 150],
    tag: 'zodia-cosmic-notif',
    renotify: true,
    data: {
      url: data.url || '/zodia/dashboard',
      dateOfArrival: Date.now()
    },
    actions: [
      { action: 'open', title: 'Abrir Zodia' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Manejador del toque en la notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/zodia/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si ya hay una pestaña abierta de Zodia, enfocarla y navegar
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.focus();
          if ('navigate' in client) {
            return client.navigate(targetUrl);
          }
          return;
        }
      }
      // Si no hay ventana abierta, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
