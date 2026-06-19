import { precacheAndRoute } from 'workbox-precaching';

// Precarga todos los assets del build
precacheAndRoute(self.__WB_MANIFEST);

// Escuchar eventos push desde el servidor
self.addEventListener('push', (event) => {
  let data = { title: 'Gestor de Pickers', body: 'Tienes una nueva notificación' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    vibrate: [300, 150, 400, 150, 300],
    tag: 'pedido-asignado',
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || '/picker',
      dateOfArrival: Date.now(),
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Manejar clic en la notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/picker';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Si ya hay una ventana abierta, enfocarla
      for (const client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no, abrir una nueva
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
