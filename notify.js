// NoName — глобальные уведомления о новых сообщениях и заявках в друзья.
// Звук — только когда пользователь НЕ смотрит на сайт (вкладка скрыта).
// Если смотрит — всплывающее сообщение на 3 секунды.
(function () {
    var SB_URL = "https://phqorijqnkngxbvsyqli.supabase.co";
    var SB_KEY = "sb_publishable_8WhmMVAwFrADpdKq-Dv9Vw_zhBXi3PC";
    var SOUND = "sounds/unique-02-wood.wav";

    var myId = '';
    var toastEl = null;

    // разрешение на системные уведомления запрашиваем по первому клику (требование Chrome)
    function askNotifPermission() {
        try {
            if (!('Notification' in window)) return;
            if (Notification.permission !== 'default') return;
            Notification.requestPermission();
        } catch (_) {}
    }
    document.addEventListener('click', askNotifPermission, { once: true, capture: true });

    function openAppModal() {
        if (document.getElementById('nn-app-modal')) return;
        var ov = document.createElement('div');
        ov.id = 'nn-app-modal';
        ov.style.cssText = 'position:fixed;inset:0;z-index:99997;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:20px;';
        ov.innerHTML = '<div class="nn-donate-card">'
            + '<h3>NoName Chatter</h3>'
            + '<p>Мессенджер для Android — чат, друзья, группы. Устанавливается как обычное приложение.</p>'
            + '<a class="donate-btn" href="NoNameChatter.apk" download>Скачать NoName Chatter</a>'
            + '<button class="close" id="nn-app-close">Закрыть</button>'
            + '</div>';
        document.body.appendChild(ov);
        document.getElementById('nn-app-close').onclick = function () { ov.remove(); };
        ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    }

    function injectAppButton() {
        var p = (location.pathname || '').toLowerCase();
        if (p.indexOf('nnchat') === -1) return;   // только на странице NoName Chatter (веб)
        if (document.getElementById('nn-app-dl')) return;
        var a = document.createElement('button');
        a.id = 'nn-app-dl';
        a.className = 'nn-app-dl';
        a.title = 'Скачать приложение Android';
        a.innerHTML = '<svg viewBox="0 0 24 24" fill="#ffffff"><path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24a11.5 11.5 0 0 0-8.94 0L5.65 5.67c-.19-.29-.58-.38-.87-.2-.28.18-.37.54-.22.83l1.84 3.18A10.78 10.78 0 0 0 1 18h22a10.78 10.78 0 0 0-5.4-8.52zM7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z"/></svg>';
        a.onclick = openAppModal;
        document.body.appendChild(a);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectAppButton);
    else injectAppButton();

    function openDonateModal() {
        if (document.getElementById('nn-donate-modal')) return;
        var ov = document.createElement('div');
        ov.id = 'nn-donate-modal';
        ov.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:20px;';
        ov.innerHTML = '<div class="nn-donate-card">'
            + '<h3>Поддержи NoName 💜</h3>'
            + '<p>Средства идут на обслуживание серверов и оплату домена — а если просто хочешь сказать спасибо, тоже приятно 💜</p>'
            + '<a class="donate-btn" href="https://www.donationalerts.com/r/nonameprojects" target="_blank" rel="noopener">Поддержать на DonationAlerts</a>'
            + '<button class="close" id="nn-donate-close">Закрыть</button>'
            + '</div>';
        document.body.appendChild(ov);
        document.getElementById('nn-donate-close').onclick = function () { ov.remove(); };
        ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    }

    function injectDonateButton() {
        if (document.getElementById('nn-donate')) return;
        var b = document.createElement('button');
        b.id = 'nn-donate';
        b.className = 'nn-donate';
        b.title = 'Помочь проекту';
        b.innerHTML = '<svg viewBox="0 0 24 24" fill="#ffffff"><path d="M12 21s-6.7-4.3-9.3-8C1.2 10.5 2 7 4.9 5.7c2-.9 4.2-.2 5.6 1.2L12 8l1.5-1.1c1.4-1.4 3.6-2.1 5.6-1.2C22 7 22.8 10.5 21.3 13c-2.6 3.7-9.3 8-9.3 8z"/></svg>';
        b.onclick = openDonateModal;
        document.body.appendChild(b);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectDonateButton);
    else injectDonateButton();

    function readMe() {
        try {
            var raw = localStorage.getItem('steam_user');
            if (raw) {
                var u = JSON.parse(raw);
                myId = (u && (u.id || u.name)) || '';
            }
        } catch (_) {}
        return !!myId;
    }

    function getClient() {
        if (window.__nnSupabaseClient) return window.__nnSupabaseClient;
        if (window.supabase && window.supabase.createClient) return window.supabase.createClient(SB_URL, SB_KEY);
        return null;
    }

    function showToast(text) {
        if (!toastEl) {
            toastEl = document.createElement('div');
            toastEl.className = 'nn-toast';
            document.body.appendChild(toastEl);
        }
        toastEl.textContent = text;
        toastEl.classList.remove('in');
        void toastEl.offsetWidth;
        toastEl.classList.add('in');
        clearTimeout(toastEl._t);
        toastEl._t = setTimeout(function () { toastEl.classList.remove('in'); }, 3000);
    }

    function playSound() {
        try {
            var a = new Audio(SOUND);
            a.volume = 0.9;
            a.play().catch(function () {});
        } catch (_) {}
    }

    var swReg = null;
    function ensureSW() {
        if (!('serviceWorker' in navigator)) return;
        try {
            navigator.serviceWorker.register('nn-sw.js').then(function (r) { swReg = r; }).catch(function () {});
            navigator.serviceWorker.ready.then(function (r) { swReg = r; }).catch(function () {});
        } catch (_) {}
    }

    function systemNotify(text) {
        try {
            if (window.NativeNotify && window.NativeNotify.notify) {
                window.NativeNotify.notify('NoName Chatter', text);
                return;
            }
        } catch (_) {}
        try {
            if (window.Notification && Notification.permission === 'granted') {
                var opts = {
                    body: text,
                    icon: 'mascot.png',
                    badge: 'mascot.png',
                    tag: 'nn-chat',
                    renotify: true,
                    silent: false
                };
                if (swReg && swReg.showNotification) swReg.showNotification('NoName Chatter', opts);
                else new Notification('NoName Chatter', opts);
            }
        } catch (_) {}
    }

    function notify(text) {
        // тост показываем всегда — так видно, что уведомления работают
        showToast(text);
        if (document.hidden || document.visibilityState === 'hidden') {
            systemNotify(text);
            playSound();
        } else {
            // тихий клик звука и когда вкладка открыта — но не громко
            try { if (localStorage.getItem('nn_notif_sound') !== '0') playSound(); } catch (_) {}
        }
    }

    function boot() {
        ensureSW();
        if (!readMe()) { setTimeout(boot, 800); return; }   // ждём логин
        var sb = getClient();
        if (!sb) { setTimeout(boot, 400); return; }

        sb.channel('nn_notify_' + Date.now())
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dm_messages' }, function (p) {
                var m = p.new;
                if (!m || !m.content) return;
                if (m.sender_id === myId) return;                       // своё сообщение
                if (m.conv && m.conv.indexOf(myId) === -1) return;       // не мой диалог
                if (window.__nnChatCurrentConv && m.conv === window.__nnChatCurrentConv) return; // уже открыт в чате
                notify('Новое сообщение от ' + (m.sender_name || m.sender_id || '—'));
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'friend_requests' }, function (p) {
                var r = p.new;
                if (r && r.to_id === myId) notify('Новый запрос в друзья');
            })
            .subscribe();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
