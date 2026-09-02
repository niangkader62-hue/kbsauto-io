// Service worker — rend l'app installable en tant que PWA (icône correcte,
// mode standalone) ET gère la réception des notifications push en temps réel.
// Ne met rien en cache (les données Supabase doivent toujours être fraîches).

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

// Réception d'une notification push envoyée par la fonction Supabase
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'KBSAUTO', body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'KBSAUTO';
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/', tabId: data.tabId || '' },
    vibrate: [200, 100, 200],   // Buzz facon WhatsApp
    tag: 'kbsauto',
    renotify: true,             // Re-sonne meme si une notif est deja affichee
  };
  event.waitUntil((async () => {
    await self.registration.showNotification(title, options);
    // Previent l'appli ouverte (pour jouer le son interne + mettre a jour la pastille).
    const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientList) {
      client.postMessage({ type: 'kbs-push', title: title, body: options.body, url: options.data.url, tabId: options.data.tabId });
    }
  })());
});

// Clic sur la notification : ouvre l'appli directement sur le bon onglet
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client) client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
