// NoName — глобальные уведомления о новых сообщениях и заявках в друзья.
// Звук — только когда пользователь НЕ смотрит на сайт (вкладка скрыта).
// Если смотрит — всплывающее сообщение на 3 секунды.
(function () {
    var SB_URL = "https://phqorijqnkngxbvsyqli.supabase.co";
    var SB_KEY = "sb_publishable_8WhmMVAwFrADpdKq-Dv9Vw_zhBXi3PC";
    var SOUND = "sounds/unique-02-wood.wav";

    var myId = '';
    var toastEl = null;

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

    function notify(text) {
        if (document.hidden || document.visibilityState === 'hidden') {
            playSound();
        } else {
            showToast(text);
        }
    }

    function boot() {
        if (!readMe()) return;
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
