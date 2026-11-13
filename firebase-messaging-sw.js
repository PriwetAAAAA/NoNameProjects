// NoName Chatter — service worker для push-уведомлений (FCM)
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
        apiKey: "AIzaSyAUF83tupFi-fptxsLKNdCgFw4lgInt_zU",
        authDomain: "nnchatter.firebaseapp.com",
        projectId: "nnchatter",
        storageBucket: "nnchatter.firebasestorage.app",
        messagingSenderId: "206028481751",
        appId: "1:206028481751:web:564850d5b46f4c84ce7c92"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    const n = payload.notification || {};
    const d = payload.data || {};
    self.registration.showNotification(n.title || 'NoName Chatter', {
        body: n.body || '',
        icon: 'mascot.png',
        badge: 'mascot.png',
        data: { url: d.url || '/nnchat' }
    });
});

self.addEventListener('notificationclick', function (e) {
    e.notification.close();
    const url = (e.notification.data && e.notification.data.url) || '/nnchat';
    e.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
            for (let i = 0; i < list.length; i++) {
                if ('focus' in list[i]) {
                    list[i].navigate(url);
                    list[i].focus();
                    return;
                }
            }
            if (clients.openWindow) return clients.openWindow(url);
        })
    );
});
