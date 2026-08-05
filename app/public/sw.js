/* Service worker: odbiera powiadomienia, gdy aplikacja jest zamknieta. */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let dane = { tytul: 'Asystent PKB', tresc: 'Odpowiedź jest gotowa.', url: '/' };
  try {
    if (event.data) dane = { ...dane, ...event.data.json() };
  } catch {
    /* powiadomienie bez tresci */
  }

  event.waitUntil(
    self.registration.showNotification(dane.tytul, {
      body: dane.tresc,
      icon: '/logo-pkb.png',
      badge: '/logo-pkb.png',
      tag: 'pkb-odpowiedz',
      renotify: true,
      data: { url: dane.url },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const cel = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((okna) => {
      for (const okno of okna) {
        if ('focus' in okno) {
          okno.navigate(cel);
          return okno.focus();
        }
      }
      return self.clients.openWindow(cel);
    }),
  );
});
