// NoName Chatter — service worker для системных уведомлений (Windows/Android)
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('notificationclick', function (e) {
    e.notification.close();
    e.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
            for (var i = 0; i < list.length; i++) {
                var c = list[i];
                if (c.url.indexOf(self.location.origin) === 0 && 'focus' in c) return c.focus();
            }
            return self.clients.openWindow('/nnchat.html');
        })
    );
});
