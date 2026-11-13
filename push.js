// NoName Chatter — push-уведомления (FCM). Подключается на страницах чата.
(function () {
    var CFG = {
        apiKey: "AIzaSyAUF83tupFi-fptxsLKNdCgFw4lgInt_zU",
        authDomain: "nnchatter.firebaseapp.com",
        projectId: "nnchatter",
        storageBucket: "nnchatter.firebasestorage.app",
        messagingSenderId: "206028481751",
        appId: "1:206028481751:web:564850d5b46f4c84ce7c92"
    };
    var VAPID_KEY = "BEfjKGzRdgEjzlKpA0YvyvRDbTrthCgsfn5q6B-IV_KOkoMvSfPfZ6zVQGutdLDmRy9Fv4a1Y4-c6SvwZWAgeBA";

    function configured() {
        return CFG.apiKey.indexOf('__') === -1 && VAPID_KEY.indexOf('__') === -1;
    }

    async function requestPermission() {
        try {
            if (!configured()) return null;
            if (!('Notification' in window) || !('serviceWorker' in navigator)) return null;
            var perm = await Notification.requestPermission();
            if (perm !== 'granted') return null;
            return await getToken();
        } catch (_) { return null; }
    }

    async function getToken() {
        try {
            if (!configured()) return null;
            var reg = await navigator.serviceWorker.register('firebase-messaging-sw.js');
            var app = (window.firebase && window.firebase.apps && window.firebase.apps[0])
                ? window.firebase.apps[0]
                : window.firebase.initializeApp(CFG);
            var messaging = window.firebase.messaging();
            return await messaging.getToken({ serviceWorkerRegistration: reg, vapidKey: VAPID_KEY });
        } catch (_) { return null; }
    }

    // в фоне (страница открыта) — показать уведомление
    if (window.firebase && window.firebase.messaging) {
        try {
            window.firebase.messaging().onMessage(function (payload) {
                var n = (payload && payload.notification) || {};
                var title = n.title || 'NoName Chatter';
                var body = n.body || '';
                if (typeof window.showToast === 'function') window.showToast(title + (body ? ': ' + body : ''));
                else if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification(title, { body: body, icon: 'mascot.png' });
                }
            });
        } catch (_) {}
    }

    window.__nnPush = { requestPermission: requestPermission, getToken: getToken, configured: configured };
})();
