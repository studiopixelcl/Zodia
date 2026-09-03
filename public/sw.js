// Service Worker Cósmico de Zodia para Web Push Notifications y Offline PWA
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Receptor de notificaciones Push del servidor
self.addEventListener('push', (event) => {
  let data = {
    title: 'Zodia • Conexión Cósmica',
    body: 'Tienes una nueva actualización en tu matriz astral.',
    icon: '/zodia/logo.png',
    badge: '/zodia/ico.png',
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
    icon: data.icon || '/zodia/logo.png',
    badge: data.badge || '/zodia/ico.png',
    vibrate: [150, 80, 150],
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
