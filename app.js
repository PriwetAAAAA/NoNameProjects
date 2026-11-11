// ============================================================
// 1. КОНСТАНТЫ
// ============================================================
// Локальная SVG-заглушка на случай, если сервис аватарок недоступен
const FALLBACK_AVATAR = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" rx="48" fill="#4d4dff"/><text x="48" y="62" font-size="42" text-anchor="middle" fill="#ffffff" font-family="Arial">N?</text></svg>'
);

// ===== КОНФИГУРАЦИЯ SUPABASE (авторизация и чат) =====
const SUPABASE_URL = "https://phqorijqnkngxbvsyqli.supabase.co"; // URL проекта Supabase
const SUPABASE_ANON_KEY = "sb_publishable_8WhmMVAwFrADpdKq-Dv9Vw_zhBXi3PC"; // publishable-ключ (подтверждён в панели)

// ============================================================
// 2. ГЛОБАЛЬНЫЕ ЭЛЕМЕНТЫ DOM
// ============================================================
// Кнопки шапки ищутся на каждой странице сайта. profileBtn объявлен
// через let: на страницах без #profile-btn в разметке он создаётся
// динамически рядом с «Войти» (см. ensureProfileBtn()).
const loginBtn = document.getElementById('login-btn');
let profileBtn = document.getElementById('profile-btn');
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

// Элементы системы друзей (CryptoLayer)
const friendCodeInput = document.getElementById('friend-code-input');
const addFriendBtn = document.getElementById('add-friend-btn');
const myFriendCodeEl = document.getElementById('my-friend-code');
// Элементы управления чатом (CryptoLayer)
const chatContainer = document.querySelector('.chat-messages-container') || document.getElementById('chat');
const messageInput = document.querySelector('.message-input') || document.getElementById('message-text');
const sendButton = document.querySelector('.send-btn') || document.getElementById('send-btn');
const MAX_MESSAGES = 10000;

// ============================================================
// 2.1. ЕДИНАЯ ТОЧКА ПОИСКА КНОПОК ШАПКИ НА ЛЮБОЙ СТРАНИЦЕ
// ============================================================
// На части страниц #profile-btn отсутствует в вёрстке. Чтобы шапка везде
// могла показать ник и аватарку, при необходимости создаём кнопку рядом
// с «Войти». Стили берутся из style.css (без инлайн-стилей).
function ensureProfileBtn() {
    if (profileBtn) return profileBtn;

    // Повторный поиск: кнопка могла появиться в DOM позже
    profileBtn = document.getElementById('profile-btn');
    if (profileBtn) return profileBtn;

    if (!loginBtn || !loginBtn.parentNode) return null;

    const created = document.createElement('div');
    created.id = 'profile-btn';
    created.className = 'nav-link-btn';
    loginBtn.parentNode.insertBefore(created, loginBtn.nextSibling);
    profileBtn = created;
    return created;
}

// ============================================================
// 3. УПРАВЛЕНИЕ ТЕМОЙ
// ============================================================
function applyTheme(theme) {
    if (theme === 'light') {
        body.classList.add('light-theme');
    } else {
        body.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
    updateAuthUI();
}

function toggleTheme() {
    const isLight = body.classList.contains('light-theme');
    applyTheme(isLight ? 'dark' : 'light');
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        applyTheme('dark');
    }
    if (themeToggle) {
        themeToggle.removeEventListener('click', toggleTheme);
        themeToggle.addEventListener('click', toggleTheme);
    }
}

// ============================================================
// 4. ОБНОВЛЕНИЕ UI (без инлайн-стилей кроме display и текста)
// ============================================================
function updateAuthUI() {
    ensureProfileBtn();
    // На странице без кнопок шапки обновлять нечего (защита от падений)
    if (!loginBtn && !profileBtn) return;

    let user = null;
    try {
        const raw = localStorage.getItem('steam_user');
        if (raw) user = JSON.parse(raw);
    } catch (err) {
        console.warn('[updateAuthUI] Не удалось прочитать steam_user из localStorage:', err);
    }

    const isLoggedIn = !!(user && user.id);

    if (isLoggedIn) {
        const displayName = user.name || 'Игрок';
        const displayAvatar = user.avatar || generateAvatar(displayName);

        // ensureProfileBtn() гарантирует наличие #profile-btn на любой
        // странице: прячем «Войти» и показываем ник с аватаркой
        if (profileBtn) {
            if (loginBtn) loginBtn.style.setProperty('display', 'none', 'important');

            profileBtn.style.setProperty('display', 'flex', 'important');
            profileBtn.textContent = ''; // очищаем, чтобы аватарка и ник не задваивались

            const avatarImg = document.createElement('img');
            avatarImg.src = displayAvatar;
            avatarImg.alt = displayName;
            avatarImg.style.cssText = 'width:24px; height:24px; border-radius:50%; margin-right:8px; border:1px solid rgba(138,92,246,0.45); vertical-align:middle;';
            // Если сервис аватарок недоступен — показываем локальную заглушку
            avatarImg.onerror = function() {
                this.onerror = null;
                this.src = FALLBACK_AVATAR;
            };

            const nameSpan = document.createElement('span');
            nameSpan.textContent = displayName; // textContent вместо innerHTML — защита от XSS

            profileBtn.appendChild(avatarImg);
            profileBtn.appendChild(nameSpan);
        }
    } else {
        if (loginBtn) {
            loginBtn.style.setProperty('display', 'inline-block', 'important');
            loginBtn.textContent = 'Войти';
            loginBtn.style.pointerEvents = 'auto';
            loginBtn.style.cursor = 'pointer';
        }
        if (profileBtn) {
            profileBtn.style.setProperty('display', 'none', 'important');
            profileBtn.textContent = '';
        }
    }

    // Принудительная установка цветов для светлой темы (через JS)
    if (body.classList.contains('light-theme')) {
        if (loginBtn) {
            loginBtn.style.setProperty('background-color', '#fdf5e6', 'important');
            loginBtn.style.setProperty('color', '#07080b', 'important');
            loginBtn.style.setProperty('border', '1px solid rgba(0, 0, 0, 0.1)', 'important');
        }
        if (profileBtn) {
            profileBtn.style.setProperty('background-color', '#fdf5e6', 'important');
            profileBtn.style.setProperty('color', '#07080b', 'important');
            profileBtn.style.setProperty('border', '1px solid rgba(0, 0, 0, 0.1)', 'important');
        }
    } else {
        if (loginBtn) {
            loginBtn.style.removeProperty('background-color');
            loginBtn.style.removeProperty('color');
            loginBtn.style.removeProperty('border');
        }
        if (profileBtn) {
            profileBtn.style.removeProperty('background-color');
            profileBtn.style.removeProperty('color');
            profileBtn.style.removeProperty('border');
        }
    }
}

// ============================================================
// 7. АВТОРИЗАЦИЯ (модальное окно + Supabase)
// ============================================================
// Красивая модальная форма входа/регистрации в glassmorphism-стиле
// сайта. Пользователи хранятся в таблице 'users' Supabase (колонки:
// username, password, avatar_url). Ключ 'steam_user' в localStorage
// оставлен намеренно: на него завязан чат CryptoLayer; туда же
// кэшируется пароль, чтобы меню профиля могло показать его без сети.
// ВНИМАНИЕ: пароли хранятся открытым текстом — это демо-схема.
function generateAvatar(login) {
    // DiceBear: случайный seed от 1 до 10000 в стилистике bottts
    const randomSeed = Math.floor(Math.random() * 10000) + 1;
    return `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(login)}-${randomSeed}`;
}

function getSupabaseClient() {
    if (!window.supabase) return null; // SDK не загрузился
    if (!window.__nnSupabaseClient) {
        window.__nnSupabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return window.__nnSupabaseClient;
}

function createAuthModal() {
    if (document.getElementById('auth-modal')) return;

    const style = document.createElement('style');
    style.id = 'auth-modal-styles';
    style.textContent = `
        .auth-modal-overlay {
            position: fixed; inset: 0; z-index: 10000;
            display: none; align-items: center; justify-content: center;
            background: rgba(0, 0, 0, 0.55);
            backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
            padding: 1rem;
        }
        .auth-modal-overlay.open { display: flex; }
        .auth-modal {
            position: relative; width: 100%; max-width: 360px;
            background: rgba(22, 24, 32, 0.85);
            backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(77, 77, 255, 0.35);
            border-radius: 20px; padding: 2rem 1.6rem 1.8rem;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(77, 77, 255, 0.2);
            color: #fff; text-align: center;
        }
        .auth-modal-title {
            margin: 0 0 1.4rem; font-size: 1.4rem; font-weight: 700;
            background: linear-gradient(135deg, #ffffff, #9a9aff);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .auth-modal-close {
            position: absolute; top: 10px; right: 14px;
            background: none; border: none; color: #8a8d98;
            font-size: 1.8rem; line-height: 1; cursor: pointer;
        }
        .auth-modal-close:hover { color: #ff4a4a; }
        .auth-modal-label {
            display: block; text-align: left; font-size: 0.85rem;
            color: #a2a1b6; margin: 0 0 0.3rem 0.2rem;
        }
        .auth-modal-input {
            width: 100%; margin-bottom: 1rem; padding: 0.7rem 0.9rem;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 10px; color: #fff; font-size: 1rem; outline: none;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        .auth-modal-input:focus {
            border-color: #4d4dff;
            box-shadow: 0 0 12px rgba(77, 77, 255, 0.35);
        }
        .auth-modal-error {
            display: none; margin: 0 0 0.8rem; padding: 0.5rem 0.7rem;
            background: rgba(255, 74, 74, 0.12); border: 1px solid rgba(255, 74, 74, 0.4);
            border-radius: 8px; color: #ff8a8a; font-size: 0.85rem;
        }
        .auth-modal-submit {
            width: 100%; padding: 0.75rem; margin-top: 0.2rem;
            background: linear-gradient(135deg, #0072ff, #7000ff);
            border: none; border-radius: 10px; color: #fff;
            font-size: 1rem; font-weight: 600; cursor: pointer;
            transition: transform 0.15s, box-shadow 0.2s;
        }
        .auth-modal-submit:hover { transform: scale(1.02); box-shadow: 0 0 20px rgba(112, 0, 255, 0.4); }
        .auth-modal-submit:active { transform: scale(0.98); }
        body.light-theme .auth-modal {
            background: rgba(255, 255, 255, 0.92); border-color: rgba(0, 0, 0, 0.1);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15); color: #161820;
        }
        body.light-theme .auth-modal-title {
            background: linear-gradient(135deg, #161820, #4a6cf7);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        body.light-theme .auth-modal-label { color: #5a586a; }
        body.light-theme .auth-modal-input {
            background: rgba(0, 0, 0, 0.04); border-color: rgba(0, 0, 0, 0.12); color: #161820;
        }
        body.light-theme .auth-modal-input:focus { border-color: #4a6cf7; box-shadow: 0 0 12px rgba(74, 108, 247, 0.3); }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = 'auth-modal';
    overlay.className = 'auth-modal-overlay';
    overlay.innerHTML = `
        <div class="auth-modal">
            <button type="button" id="auth-close" class="auth-modal-close" title="Закрыть">&times;</button>
            <h2 class="auth-modal-title">Авторизация NoName</h2>
            <label class="auth-modal-label" for="auth-username">Логин</label>
            <input type="text" id="auth-username" class="auth-modal-input" placeholder="Введите логин" autocomplete="username">
            <label class="auth-modal-label" for="auth-password">Пароль</label>
            <input type="password" id="auth-password" class="auth-modal-input" placeholder="Введите пароль" autocomplete="current-password">
            <p id="auth-error" class="auth-modal-error"></p>
            <button type="button" id="auth-submit" class="auth-modal-submit">Подтвердить</button>
        </div>
    `;
    document.body.appendChild(overlay);
}

function openAuthModal() {
    const overlay = document.getElementById('auth-modal');
    if (!overlay) return;
    overlay.classList.add('open');
    const input = document.getElementById('auth-username');
    if (input) setTimeout(() => input.focus(), 50);
}

function closeAuthModal() {
    const overlay = document.getElementById('auth-modal');
    const errorEl = document.getElementById('auth-error');
    if (overlay) overlay.classList.remove('open');
    if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = ''; }
}

function showAuthError(text) {
    const errorEl = document.getElementById('auth-error');
    if (!errorEl) { alert(text); return; }
    errorEl.textContent = text;
    errorEl.style.display = 'block';
}

async function handleAuthSubmit() {
    const usernameInput = document.getElementById('auth-username');
    const passwordInput = document.getElementById('auth-password');

    const username = (usernameInput.value || '').trim();
    const password = (passwordInput.value || '').trim();

    if (!username || !password) {
        showAuthError('Введите логин и пароль!');
        return;
    }

    const client = getSupabaseClient();
    if (!client) {
        showAuthError('База данных недоступна: SDK Supabase не загрузился.');
        return;
    }

    try {
        // Ищем пользователя в таблице users
        const { data: user, error } = await client
            .from('users')
            .select('*')
            .eq('username', username)
            .maybeSingle();

        if (error) {
            throw new Error('Запрос к таблице users: ' + error.message);
        }

        if (!user) {
            // === РЕГИСТРАЦИЯ: пользователь не найден — создаём запись ===
            const avatarUrl = generateAvatar(username);

            const { error: insertError } = await client
                .from('users')
                .insert([{ username, password, avatar_url: avatarUrl }]);

            if (insertError) {
                if (insertError.code === '23505') {
                    showAuthError('Такой логин уже занят — попробуйте войти.');
                    return;
                }
                throw new Error('Создание аккаунта: ' + insertError.message);
            }

            localStorage.setItem('steam_user', JSON.stringify({ id: username, name: username, avatar: avatarUrl, password: password }));
            closeAuthModal();
            updateAuthUI();
            return;
        }

        // === ВХОД: пользователь найден — сверяем пароль ===
        if (user.password !== password) {
            // Жёсткая блокировка: ничего не сохраняем, интерфейс не меняем
            showAuthError('Неверный пароль для этого логина!');
            return;
        }

        localStorage.setItem('steam_user', JSON.stringify({ id: user.username, name: user.username, avatar: user.avatar_url, password: user.password }));
        closeAuthModal();
        updateAuthUI();
    } catch (err) {
        console.error('[initAuth] Ошибка обращения к базе данных:', err);
        showAuthError('Не удалось обратиться к базе данных: ' + (err && err.message ? err.message : err));
    }
}

function initAuth() {
    if (!loginBtn) return;

    createAuthModal();

    loginBtn.addEventListener('click', function() {
        if (loginBtn.textContent !== 'Войти') return; // уже авторизованы
        openAuthModal();
    });

    document.getElementById('auth-submit').addEventListener('click', handleAuthSubmit);
    document.getElementById('auth-close').addEventListener('click', closeAuthModal);

    // Закрытие по клику на затемнение и по клавише Escape
    const overlay = document.getElementById('auth-modal');
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) closeAuthModal();
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeAuthModal();
    });

    // Отправка формы по Enter из полей ввода
    ['auth-username', 'auth-password'].forEach(function(id) {
        const input = document.getElementById(id);
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleAuthSubmit();
            }
        });
    });
}

// ============================================================
// 9. МЕНЮ ПРОФИЛЯ (МОДАЛЬНОЕ ОКНО ВМЕСТО БОКОВОЙ ПАНЕЛИ)
// ============================================================
// Пароль текущего пользователя: подгружается из Supabase при открытии
// меню (фолбэк — кэш пароля в localStorage из steam_user).
let currentUserPassword = null;

function getCurrentUser() {
    try {
        const raw = localStorage.getItem('steam_user');
        return raw ? JSON.parse(raw) : null;
    } catch (err) {
        console.warn('[profile] Не удалось прочитать steam_user из localStorage:', err);
        return null;
    }
}

function createProfileModal() {
    if (document.getElementById('profile-modal')) return;

    // Стили меню профиля — только CSS-классы, без инлайн-стилей.
    // Внешний вид повторяет окно входа (тот же glassmorphism-стиль).
    const style = document.createElement('style');
    style.id = 'profile-modal-styles';
    style.textContent = `
        /* Подложка: плавный блюр и затемнение при открытии/закрытии */
        .profile-modal-overlay {
            position: fixed; inset: 0; z-index: 10001;
            display: flex; align-items: center; justify-content: center;
            padding: 1rem;
            background-color: rgba(0, 0, 0, 0);
            backdrop-filter: blur(0px); -webkit-backdrop-filter: blur(0px);
            opacity: 0;
            pointer-events: none;
            transition: backdrop-filter 0.2s ease-out,
                        -webkit-backdrop-filter 0.2s ease-out,
                        background-color 0.2s ease-out,
                        opacity 0.2s ease-out;
        }
        .profile-modal-overlay.is-active {
            background-color: rgba(0, 0, 0, 0.55);
            backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
            opacity: 1;
            pointer-events: auto;
        }
        /* Само окно: глубокое «стекло» с фиолетовым неоновым отсветом */
        .profile-modal {
            position: relative; width: 100%; max-width: 340px;
            background: rgba(15, 15, 20, 0.75);
            backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(138, 92, 246, 0.2);
            border-radius: 20px; padding: 1.8rem 1.6rem 1.5rem;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5),
                        0 0 30px rgba(138, 92, 246, 0.1);
            color: #fff; text-align: center;
            opacity: 0;
            transform: scale(0.95);
            pointer-events: none;
            transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1),
                        opacity 0.15s ease-out;
        }
        .profile-modal-overlay.is-active .profile-modal {
            opacity: 1;
            transform: scale(1);
            pointer-events: auto;
        }
        .profile-modal-close {
            position: absolute; top: 10px; right: 14px;
            background: none; border: none; color: #8a8d98;
            font-size: 1.8rem; line-height: 1; cursor: pointer;
        }
        .profile-modal-close:hover { color: #ff4a4a; }
        .profile-modal-avatar {
            width: 84px; height: 84px; border-radius: 50%;
            border: 2px solid rgba(138, 92, 246, 0.4);
            background: rgba(255, 255, 255, 0.04);
            box-shadow: 0 0 18px rgba(138, 92, 246, 0.15);
            margin-top: 0.2rem;
        }
        .profile-modal-username {
            margin: 0.9rem 0 1.1rem; font-size: 1.45rem; font-weight: 700;
            word-break: break-word;
            background: linear-gradient(135deg, #ffffff, #b39dfb);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .profile-modal-section {
            width: 100%; box-sizing: border-box;
            background: transparent;
            border: none;
            padding: 0;
        }
        .profile-modal-section-title {
            margin: 0 0 0.65rem; font-size: 0.78rem; font-weight: 600;
            letter-spacing: 1px; text-transform: uppercase;
            color: rgba(138, 92, 246, 0.75);
        }
        /* Строки данных — полупрозрачные неоновые «инпуты» */
        .profile-modal-row {
            display: flex; align-items: center; gap: 8px;
            padding: 0.55rem 0.8rem; font-size: 0.95rem;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(138, 92, 246, 0.12);
            border-radius: 10px;
        }
        .profile-modal-row + .profile-modal-row { margin-top: 0.5rem; }
        .profile-modal-row-label { color: rgba(255, 255, 255, 0.55); white-space: nowrap; }
        .profile-modal-row-value {
            margin-left: auto; color: #fff; font-weight: 500;
            word-break: break-all; text-align: right;
        }
        .profile-modal-row-value.unavailable { color: rgba(255, 255, 255, 0.35); font-weight: 400; }
        /* Глазик: минимализм, полупрозрачный, ярче при наведении */
        .profile-modal-eye {
            flex-shrink: 0; background: transparent; border: none;
            font-size: 0.95rem; line-height: 1; padding: 2px;
            cursor: pointer; opacity: 0.6;
            transition: opacity 0.2s ease-out, transform 0.2s ease-out;
        }
        .profile-modal-eye:hover {
            opacity: 1;
            transform: scale(1.12);
        }
        .profile-modal-eye-off { display: none; }
        .profile-modal-logout {
            width: 100%; margin-top: 1rem; padding: 0.72rem;
            background: transparent;
            border: 1px solid rgba(239, 68, 68, 0.4);
            border-radius: 10px;
            color: rgba(239, 68, 68, 0.9);
            font-size: 0.95rem; font-weight: 600; cursor: pointer;
            transition: background 0.2s ease-out, box-shadow 0.2s ease-out,
                        transform 0.15s;
        }
        .profile-modal-logout:hover {
            background: rgba(239, 68, 68, 0.15);
            box-shadow: 0 0 15px rgba(239, 68, 68, 0.2);
            transform: scale(1.01);
        }
        .profile-modal-logout:active { transform: scale(0.98); }
        /* Светлая тема: светлое стекло с фиолетовым акцентом */
        body.light-theme .profile-modal {
            background: rgba(255, 255, 255, 0.75);
            border-color: rgba(123, 74, 255, 0.25);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15),
                        0 0 30px rgba(123, 74, 255, 0.08);
            color: #161820;
        }
        body.light-theme .profile-modal-username {
            background: linear-gradient(135deg, #161820, #7b4aff);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        body.light-theme .profile-modal-section {
            background: transparent; border: none;
        }
        body.light-theme .profile-modal-section-title { color: rgba(123, 74, 255, 0.8); }
        body.light-theme .profile-modal-row {
            background: rgba(255, 255, 255, 0.45);
            border-color: rgba(123, 74, 255, 0.15);
        }
        body.light-theme .profile-modal-row-label { color: rgba(0, 0, 0, 0.55); }
        body.light-theme .profile-modal-row-value { color: #161820; }
        body.light-theme .profile-modal-eye { opacity: 0.6; }
        body.light-theme .profile-modal-eye:hover { opacity: 1; }
        body.light-theme .profile-modal-logout {
            color: rgba(220, 38, 38, 0.9);
            border-color: rgba(220, 38, 38, 0.4);
        }
        body.light-theme .profile-modal-logout:hover { background: rgba(220, 38, 38, 0.1); }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = 'profile-modal';
    overlay.className = 'profile-modal-overlay';
    overlay.innerHTML = `
        <div class="profile-modal">
            <button type="button" id="profile-modal-close" class="profile-modal-close" title="Закрыть">&times;</button>
            <img id="profile-modal-avatar" class="profile-modal-avatar" src="" alt="Аватар">
            <h2 id="profile-modal-username" class="profile-modal-username"></h2>
            <div class="profile-modal-section">
                <h3 class="profile-modal-section-title">Данные аккаунта</h3>
                <div class="profile-modal-row">
                    <span class="profile-modal-row-label">Логин</span>
                    <span id="profile-modal-login" class="profile-modal-row-value"></span>
                </div>
                <div class="profile-modal-row">
                    <span class="profile-modal-row-label">Пароль</span>
                    <span id="profile-modal-password" class="profile-modal-row-value"></span>
                    <button type="button" id="profile-modal-eye" class="profile-modal-eye" title="Показать пароль" aria-label="Показать пароль">👁️</button>
                </div>
            </div>
            <button type="button" id="profile-modal-logout" class="profile-modal-logout">Выйти из аккаунта</button>
        </div>
    `;
    document.body.appendChild(overlay);
}

function openProfileModal() {
    const overlay = document.getElementById('profile-modal');
    if (!overlay) return;

    const user = getCurrentUser();
    if (!user || !user.id) return; // без активной сессии меню не открываем

    const displayName = user.name || 'Игрок';
    const displayAvatar = user.avatar || generateAvatar(displayName);

    const avatarEl = document.getElementById('profile-modal-avatar');
    avatarEl.src = displayAvatar;
    // Если сервис аватарок недоступен — показываем локальную заглушку
    avatarEl.onerror = function() {
        this.onerror = null;
        this.src = FALLBACK_AVATAR;
    };

    document.getElementById('profile-modal-username').textContent = displayName;
    document.getElementById('profile-modal-login').textContent = user.id;

    // Пока пароль грузится — показываем маску из точек
    const passwordEl = document.getElementById('profile-modal-password');
    const eyeBtn = document.getElementById('profile-modal-eye');
    passwordEl.classList.remove('unavailable', 'revealed');
    passwordEl.textContent = '••••••••';
    eyeBtn.classList.remove('profile-modal-eye-off');
    eyeBtn.textContent = '👁️';
    eyeBtn.title = 'Показать пароль';

    // Показываем меню: класс .is-active запускает CSS-анимации
    // (плавный блюр подложки + всплытие окна со scale)
    overlay.classList.add('is-active');

    // Пароль берём из Supabase; если не вышло — из сессии localStorage
    loadProfilePassword(user.id).then(function(password) {
        renderProfilePassword(password, false);
    });
}

function closeProfileModal() {
    const overlay = document.getElementById('profile-modal');
    if (!overlay) return;
    // Снимаем класс активности: окно плавно гаснет и сжимается (0.15–0.2s),
    // а pointer-events:none сразу отключает клики во время затухания.
    // display не трогаем — CSS сам убирает окно из видимости.
    overlay.classList.remove('is-active');
}

function renderProfilePassword(password, revealed) {
    const passwordEl = document.getElementById('profile-modal-password');
    const eyeBtn = document.getElementById('profile-modal-eye');
    if (!passwordEl) return;

    if (!password) {
        passwordEl.classList.add('unavailable');
        passwordEl.classList.remove('revealed');
        passwordEl.textContent = 'Недоступен';
        if (eyeBtn) eyeBtn.classList.add('profile-modal-eye-off');
        return;
    }

    passwordEl.classList.remove('unavailable');
    passwordEl.classList.toggle('revealed', revealed);
    passwordEl.textContent = revealed ? password : '••••••••';
    if (eyeBtn) {
        eyeBtn.classList.remove('profile-modal-eye-off');
        eyeBtn.textContent = revealed ? '🙈' : '👁️';
        eyeBtn.title = revealed ? 'Скрыть пароль' : 'Показать пароль';
    }
}

function toggleProfilePassword() {
    const passwordEl = document.getElementById('profile-modal-password');
    if (!passwordEl || !currentUserPassword) return;
    renderProfilePassword(currentUserPassword, !passwordEl.classList.contains('revealed'));
}

function loadProfilePassword(username) {
    // 1) Сначала кэш текущей сессии (steam_user.password в localStorage)
    const user = getCurrentUser();
    if (user && typeof user.password === 'string' && user.password) {
        currentUserPassword = user.password;
        return Promise.resolve(currentUserPassword);
    }

    // 2) Затем база Supabase (таблица users)
    const client = getSupabaseClient();
    if (!client) {
        currentUserPassword = null;
        return Promise.resolve(null);
    }
    return client
        .from('users')
        .select('password')
        .eq('username', username)
        .maybeSingle()
        .then(function(res) {
            if (res.error) throw res.error;
            currentUserPassword = (res.data && res.data.password) || null;
            return currentUserPassword;
        })
        .catch(function(err) {
            console.warn('[profile] Не удалось получить пароль из Supabase:', err && err.message ? err.message : err);
            currentUserPassword = null;
            return null;
        });
}

function handleProfileLogout() {
    // Полная очистка сессии и возврат к состоянию «Войти»
    localStorage.removeItem('steam_user');
    closeProfileModal();
    updateAuthUI();
    window.location.reload();
}

function initProfileMenu() {
    ensureProfileBtn();
    if (!profileBtn) return;
    // Защита от повторного навешивания слушателей
    // (на части страниц app.js подключён дважды)
    if (profileBtn.dataset.profileMenuBound === '1') return;
    profileBtn.dataset.profileMenuBound = '1';

    createProfileModal();

    profileBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        openProfileModal();
    });

    document.getElementById('profile-modal-close').addEventListener('click', closeProfileModal);
    document.getElementById('profile-modal-logout').addEventListener('click', handleProfileLogout);
    document.getElementById('profile-modal-eye').addEventListener('click', toggleProfilePassword);

    // Закрытие кликом по затемнению и клавишей Escape
    const overlay = document.getElementById('profile-modal');
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) closeProfileModal();
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeProfileModal();
    });
}

// ============================================================
// 10. ПЛАВНЫЕ ПЕРЕХОДЫ МЕЖДУ СТРАНИЦАМИ
// ============================================================
function initTransitions() {
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#')) return;

        // Скачиваемые файлы (apk/zip/exe и т.п.) НЕ перехватываем —
        // пусть браузер качает файл сразу, без рендера страницы
        if (link.hasAttribute('download') ||
            /\.(apk|zip|exe|msi|dmg|7z|rar|tar|gz|pdf|png|jpg|jpeg|mp4)$/i.test(href)) {
            return;
        }
        
        // Открываем внешние ссылки стандартным переходом браузера
        if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
            window.location.href = href;
            return;
        }

        e.preventDefault();
        document.body.classList.add('page-fade-out');
        setTimeout(() => {
            window.location.href = href;
        }, 350);
    });
}

// ============================================================
// 11. ЗАПУСК ПРИ ЗАГРУЗКЕ ЛЮБОЙ СТРАНИЦЫ ПРОЕКТА
// ============================================================
// Единая точка инициализации для всех страниц. При каждой загрузке
// updateAuthUI() мгновенно проверяет localStorage('steam_user'):
// если запись есть — шапка этой страницы сразу переключается на
// ник и аватарку (иначе показывается кнопка «Войти»).
function bootApp() {
    // Защита от повторного запуска (на некоторых страницах app.js
    // исторически подключался дважды)
    if (window.__nnAppBooted) return;
    window.__nnAppBooted = true;

    initTheme();
    updateAuthUI();
    initAuth();
    initProfileMenu();
    initTransitions();
    initFriendSystem();
    initCryptoLayerChat();

    document.body.classList.add('page-loaded');
}

document.addEventListener('DOMContentLoaded', bootApp);

// Если DOM уже готов к моменту выполнения скрипта — стартуем сразу
if (document.readyState === 'interactive' || document.readyState === 'complete') {
    bootApp();
}

// ============================================================
// 10.2. СИСТЕМА ДРУЗЕЙ ЧЕРЕЗ СУПЕРКОДЫ (Supabase)
// ============================================================

// Получаем или генерируем код друга на основе ID пользователя
function getOrCreateFriendCode(user) {
    if (!user || !user.id) return '000000';
    // Хэш из последних цифр user.id
    const code = String(Math.abs(parseInt(user.id.slice(-6))) || 123456).padStart(6, '0');
    if (myFriendCodeEl) {
        myFriendCodeEl.textContent = code;
    }
    return code;
}

// Добавление друга по его 6-значному коду
async function addFriendByCode() {
    if (!friendCodeInput) return;
    const targetCode = friendCodeInput.value.trim();
    if (targetCode.length !== 6) {
        alert('Код друга должен состоять из 6 цифр!');
        return;
    }

    let currentUser = null;
    try {
        currentUser = JSON.parse(localStorage.getItem('steam_user'));
    } catch(_) {}

    if (!currentUser) {
        alert('Сначала войдите на сайт!');
        return;
    }

    const myCode = getOrCreateFriendCode(currentUser);
    if (targetCode === myCode) {
        alert('Нельзя добавить в друзья самого себя!');
        return;
    }

    // Запись связки в Supabase таблицу 'friends'
    const { error } = await supabase
        .from('friends')
        .insert([
            { 
                user_id: currentUser.id, 
                friend_code: targetCode,
                user_name: currentUser.name
            }
        ]);

    if (error) {
        console.error('Ошибка добавления:', error.message);
        alert('Не удалось добавить друга. Проверьте таблицу в Supabase.');
    } else {
        alert('Друг успешно добавлен в базу!');
        friendCodeInput.value = '';
    }
}

// Запуск слушателей для системы кодов
function initFriendSystem() {
    let currentUser = null;
    try {
        currentUser = JSON.parse(localStorage.getItem('steam_user'));
    } catch(_) {}

    if (currentUser) {
        getOrCreateFriendCode(currentUser);
    }

    if (addFriendBtn) {
        addFriendBtn.addEventListener('click', addFriendByCode);
    }
}

// ============================================================
// 10.1. МЕНЕДЖЕР ЧАТА (Supabase Realtime + DocumentFragment)
// ============================================================
function appendMessages(messagesArray) {
    if (!chatContainer) return;
    const fragment = document.createDocumentFragment();

    messagesArray.forEach(msg => {
        const msgElement = document.createElement('div');
        msgElement.className = 'message-node'; // Glassmorphism-стиль из style.css
        
        const authorSpan = document.createElement('span');
        authorSpan.className = 'message-author';
        authorSpan.textContent = `${msg.sender_id || 'Игрок'}: `;
        
        const textSpan = document.createElement('span');
        textSpan.className = 'message-text';
        textSpan.textContent = msg.content || msg.text;

        msgElement.appendChild(authorSpan);
        msgElement.appendChild(textSpan);
        fragment.appendChild(msgElement);
    });

    chatContainer.appendChild(fragment);

    // Удаляем старые сообщения из DOM, если превышен лимит в 100 штук
    while (chatContainer.children.length > MAX_MESSAGES) {
        chatContainer.removeChild(chatContainer.firstChild);
    }
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Отправка сообщений с моментальным UI-очистителем
async function handleSendMessage() {
    if (!messageInput) return;
    const text = messageInput.value.trim();
    if (!text) return;

    // Моментально чистим поле ввода в интерфейсе (убирает лаг ожидания)
    messageInput.value = '';

    // Извлекаем текущего пользователя для отображения ника
    let currentUserName = 'Аноним';
    try {
        const raw = localStorage.getItem('steam_user');
        if (raw) currentUserName = JSON.parse(raw).name || 'Игрок';
    } catch (_) {}

    // Отправка в Supabase
    const { error } = await supabase
        .from('messages')
        .insert([{ content: text, sender_id: currentUserName }]);

    if (error) console.warn('Ошибка отправки сообщения:', error.message);
}

// Инициализация подписки и слушателей событий чата
function initCryptoLayerChat() {
    if (!chatContainer) return;

    // Подписка на живую трансляцию изменений таблицы public.messages
    supabase
        .channel('public:messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
            appendMessages([payload.new]);
        })
        .subscribe();

    // Слушатели на отправку
    if (sendButton) {
        sendButton.addEventListener('click', handleSendMessage);
    }
    if (messageInput) {
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
    }
}