// Service worker minimal — ne met rien en cache (les données Supabase doivent
// toujours être fraîches). Son seul rôle est de rendre l'app installable en
// tant que vraie PWA (icône correcte, mode standalone) sur téléphone.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
