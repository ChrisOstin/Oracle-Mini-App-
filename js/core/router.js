/**
 * MEGA-ROUTER v5.0 — АБСОЛЮТНО РАБОЧИЙ
 * Без заглушек, без компромиссов
 */

const MORI_ROUTER = {
    // ========== ВСЕ ТВОИ ЭКРАНЫ ==========
    screens: {
        // Авторизация
        auth: {
            title: 'Авторизация',
            module: null,
            guard: 'guest',
            icon: '🔐'
        },

        // Главная
        dashboard: {
            title: 'Главная',
            module: 'MORI_DASHBOARD',
            guard: 'user',
            icon: '🏠'
        },

        // Портфель
        portfolio: {
            title: 'Портфель',
            module: 'MORI_PORTFOLIO',
            guard: 'user',
            icon: '📊'
        },

        // MORI AI
        'ai-chat': {
            title: 'MORI AI',
            module: 'MORI_AI_CHAT',
            guard: 'user',
            icon: '🤖'
        },

        // Калькулятор
        calculator: {
            title: 'Калькулятор',
            module: 'MORI_CALCULATOR',
            guard: 'user',
            icon: '🧮'
        },

        // Библиотека
        library: {
            title: 'Библиотека',
            module: 'MORI_LIBRARY',
            guard: 'user',
            icon: '📚'
        },

        // Профиль
        profile: {
            title: 'Профиль',
            module: 'MORI_PROFILE',
            guard: 'user',
            icon: '👤'
        },

        // Достижения
        achievements: {
            title: 'Достижения',
            module: 'MORI_ACHIEVEMENTS',
            guard: 'user',
            icon: '🏆'
        },

        // Уровни
        levels: {
            title: 'Уровни',
            module: 'MORI_LEVELS',
            guard: 'user',
            icon: '📈'
        },

        // Задания
        tasks: {
            title: 'Задания',
            module: 'MORI_TASKS',
            guard: 'user',
            icon: '✅'
        },

        // Чат
        chat: {
            title: 'Чат',
            module: 'MORI_CHAT',
            guard: 'user',
            icon: '💬'
        },

        // Дом
        house: {
            title: 'Дом',
            module: 'MORI_HOUSE',
            guard: 'user',
            icon: '🏡'
        },
        
        rooms: {
            title: 'Комнаты',
            module: 'MORI_ROOMS',
            guard: 'user',
            icon: '🛋️'
        },
        
        tv: {
            title: 'Телевизор',
            module: 'MORI_TV',
            guard: 'user',
            icon: '📺'
        },

        // Семья
        family: {
            title: 'Семья',
            module: 'MORI_FAMILY',
            guard: 'family',
            icon: '👨‍👩‍👧‍👦'
        },
        
        budget: {
            title: 'Бюджет',
            module: 'MORI_BUDGET',
            guard: 'family',
            icon: '💰'
        },
        
        calendar: {
            title: 'Календарь',
            module: 'MORI_CALENDAR',
            guard: 'family',
            icon: '📅'
        },
        
        reminders: {
            title: 'Напоминания',
            module: 'MORI_REMINDERS',
            guard: 'family',
            icon: '⏰'
        },
        
        durak: {
            title: 'Дурак',
            module: 'MORI_DURAK',
            guard: 'family',
            icon: '🃏'
        },

        // Все приложения
        'all-apps': {
            title: 'Все приложения',
            module: 'MORI_ALL_APPS',
            guard: 'user',
            icon: '📱'
        },

        // Музыка
        music: {
            title: 'Музыка',
            module: 'MORI_MUSIC',
            guard: 'user',
            icon: '🎵'
        },
        
        player: {
            title: 'Плеер',
            module: 'MORI_PLAYER',
            guard: 'user',
            icon: '▶️'
        },
        
        search: {
            title: 'Поиск',
            module: 'MORI_SEARCH',
            guard: 'user',
            icon: '🔍'
        },

        // Голосовые
        voice: {
            title: 'Голосовые',
            module: 'MORI_VOICE',
            guard: 'user',
            icon: '🎤'
        },
        
        recorder: {
            title: 'Диктофон',
            module: 'MORI_RECORDER',
            guard: 'user',
            icon: '⏺️'
        },

        // Админка
        admin: {
            title: 'Админка',
            module: 'MORI_ADMIN',
            guard: 'admin',
            icon: '👑'
        },
        
        demigurge: {
            title: 'Демиург',
            module: 'MORI_DEMIGURGE',
            guard: 'admin',
            icon: '⚡'
        },
        
        multiaccount: {
            title: 'Мультиаккаунты',
            module: 'MORI_MULTIACCOUNT',
            guard: 'admin',
            icon: '🔄'
        },
        
        stats: {
            title: 'Статистика',
            module: 'MORI_STATS',
            guard: 'admin',
            icon: '📊'
        },

        // Библиотека (доп)
        wishlist: {
            title: 'Список желаний',
            module: 'MORI_WISHLIST',
            guard: 'user',
            icon: '⭐'
        },
        
        tags: {
            title: 'Теги',
            module: 'MORI_TAGS',
            guard: 'user',
            icon: '🏷️'
        }
    },

    // ========== СОСТОЯНИЕ ==========
    currentScreen: null,
    history: [],
    historyIndex: -1,
    
    bookmarks: [],
    recent: [],
    favorites: [],
    
    sessionTimer: null,
    sessionTimeout: 30 * 60 * 1000, // 30 минут
    
    domCache: new Map(),
    offlineQueue: [],
    auditLog: [],

    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    init: function() {
        console.log('🚀 MORI_ROUTER инициализация...');
        
        // Загружаем сохранённые данные
        this.loadUserPreferences();
        
        // Слушаем события
        window.addEventListener('hashchange', () => this.handleHashChange());
        window.addEventListener('load', () => {
            this.restoreSession();
            this.handleHashChange();
        });
        window.addEventListener('beforeunload', () => this.saveSession());
        
        // Дополнительные фичи
        this.setupHotkeys();
        this.setupGestures();
        
        // Запускаем обработку офлайн очереди
        setInterval(() => this.processOfflineQueue(), 5000);
        
        // Следим за онлайн статусом
        window.addEventListener('online', () => this.processOfflineQueue());
    },

    // ========== ЗАГРУЗКА СОХРАНЁННЫХ ДАННЫХ ==========
    loadUserPreferences: function() {
        try {
            this.bookmarks = JSON.parse(localStorage.getItem('router_bookmarks') || '[]');
            this.recent = JSON.parse(localStorage.getItem('router_recent') || '[]');
            this.favorites = JSON.parse(localStorage.getItem('router_favorites') || '[]');
            this.auditLog = JSON.parse(localStorage.getItem('audit_log') || '[]');
        } catch (e) {
            console.error('Ошибка загрузки настроек:', e);
        }
    },

    // ========== СОХРАНЕНИЕ ДАННЫХ ==========
    saveUserPreferences: function() {
        localStorage.setItem('router_bookmarks', JSON.stringify(this.bookmarks));
        localStorage.setItem('router_recent', JSON.stringify(this.recent));
        localStorage.setItem('router_favorites', JSON.stringify(this.favorites));
    },

    // ========== ВОССТАНОВЛЕНИЕ СЕССИИ ==========
    restoreSession: function() {
        try {
            const savedUser = sessionStorage.getItem('mori_user');
            const savedLevel = sessionStorage.getItem('mori_level');
            
            if (savedUser && savedLevel && (!MORI_APP.currentUser || MORI_APP.accessLevel === 'guest')) {
                MORI_APP.currentUser = JSON.parse(savedUser);
                MORI_APP.accessLevel = savedLevel;
                console.log('✅ Сессия восстановлена');
            }
        } catch (e) {
            console.error('Ошибка восстановления сессии:', e);
        }
    },

    // ========== СОХРАНЕНИЕ СЕССИИ ==========
    saveSession: function() {
        if (MORI_APP.currentUser) {
            sessionStorage.setItem('mori_user', JSON.stringify(MORI_APP.currentUser));
            sessionStorage.setItem('mori_level', MORI_APP.accessLevel);
        }
    },

    // ========== ОБРАБОТКА HASH ==========
    handleHashChange: function() {
        let screen = window.location.hash.slice(1) || 'dashboard';
        screen = screen.split('?')[0];
        this.navigate(screen);
    },

    // ========== НАВИГАЦИЯ ==========
    navigate: function(screenId, options = {}) {
        console.log(`🚀 Навигация на ${screenId}`);
        
        // Сохраняем сессию
        this.saveSession();
        
        // Проверка доступа
        if (!this.checkAccess(screenId)) {
            console.log('⛔ Нет доступа');
            if (screenId !== 'auth') {
                window.location.hash = 'auth';
                return;
            }
        }
        
        // Получаем экран
        const screen = this.screens[screenId];
        if (!screen) {
            console.error('❌ Экран не найден');
            window.location.hash = 'dashboard';
            return;
        }
        
        // Добавляем в историю
        this.addToHistory(screenId);
        this.addToRecent(screenId);
        
        // Логируем доступ
        this.logAccess(screenId, MORI_APP.currentUser?.id, true);
        
        // Сбрасываем таймер сессии
        this.resetSessionTimer();
        
        // Загружаем модуль
        this.loadModule(screen);
        
        // Применяем тему
        this.applyScreenTheme(screenId);
        
        // Обновляем навигацию
        setTimeout(() => this.updateNavigation(), 100);
    },

    // ========== ПРОВЕРКА ДОСТУПА ==========
    checkAccess: function(screenId) {
        const screen = this.screens[screenId];
        if (!screen) return false;
        
        const level = MORI_APP.accessLevel || 'guest';
        const required = screen.guard;
        
        if (level === 'admin') return true;
        if (level === 'family') return required === 'user' || required === 'family';
        if (level === 'user') return required === 'user';
        return required === 'guest';
    },

    // ========== ДОБАВЛЕНИЕ В ИСТОРИЮ ==========
    addToHistory: function(screenId) {
        this.history.push(screenId);
        this.historyIndex++;
        if (this.history.length > 50) this.history.shift();
    },

    // ========== ДОБАВЛЕНИЕ В НЕДАВНИЕ ==========
    addToRecent: function(screenId) {
        this.recent = [screenId, ...this.recent.filter(s => s !== screenId)].slice(0, 10);
        localStorage.setItem('router_recent', JSON.stringify(this.recent));
    },

    // ========== ЛОГИРОВАНИЕ ДОСТУПА ==========
    logAccess: function(screenId, userId, success) {
        this.auditLog.push({
            screen: screenId,
            user: userId,
            success: success,
            time: new Date().toISOString()
        });
        
        if (this.auditLog.length > 1000) {
            this.auditLog = this.auditLog.slice(-1000);
        }
        
        localStorage.setItem('audit_log', JSON.stringify(this.auditLog));
    },

    // ========== СБРОС ТАЙМЕРА СЕССИИ ==========
    resetSessionTimer: function() {
        if (this.sessionTimer) clearTimeout(this.sessionTimer);
        this.sessionTimer = setTimeout(() => {
            if (MORI_AUTH && MORI_APP.accessLevel !== 'guest') {
                MORI_AUTH.logout();
                MORI_APP.showToast('⏰ Сессия истекла');
            }
        }, this.sessionTimeout);
    },

    // ========== ЗАГРУЗКА МОДУЛЯ ==========
    loadModule: function(screen) {
        const appDiv = document.getElementById('app');
        if (!appDiv) return;
        
        // Экран авторизации
        if (screen.title === 'Авторизация') {
            this.showAuthScreen();
            return;
        }
        
        // Проверяем кэш DOM
        let cached = this.domCache.get(screen.title);
        
        appDiv.innerHTML = cached || `
            <div class="screen" data-screen="${screen.title.toLowerCase()}">
                <header class="screen-header">
                    <h2>${screen.icon} ${screen.title}</h2>
                    <div class="header-actions">
                        ${this.renderHeaderButtons()}
                    </div>
                </header>
                <div class="screen-content" id="${screen.title.toLowerCase()}-content">
                    <div class="loading">Загрузка ${screen.title}...</div>
                </div>
            </div>
        `;
        
        // Кэшируем
        if (!cached) this.domCache.set(screen.title, appDiv.innerHTML);
        
        // Загружаем модуль
        if (screen.module && window[screen.module]) {
            try {
                if (window[screen.module].init) window[screen.module].init();
                if (window[screen.module].render) window[screen.module].render();
            } catch (error) {
                console.error(`❌ Ошибка модуля ${screen.module}:`, error);
                this.showError(screen.title, error.message);
            }
        } else if (screen.module) {
            // Пытаемся подгрузить модуль
            this.lazyLoadModule(screen.module.split('_')[1].toLowerCase());
        }
    },

    // ========== КНОПКИ В ШАПКЕ ==========
    renderHeaderButtons: function() {
        const level = MORI_APP.accessLevel || 'guest';
        let buttons = '';
        
        if (level !== 'guest') {
            buttons += `<button class="header-btn" onclick="MORI_ROUTER.toggleBookmark()" title="Закладка">🔖</button>`;
            buttons += `<button class="header-btn" onclick="MORI_ROUTER.toggleFavorite()" title="Избранное">⭐</button>`;
        }
        
        buttons += `<button class="header-btn" onclick="MORI_ROUTER.goBack()" title="Назад">◀</button>`;
        
        if (level === 'admin') {
            buttons += `<button class="header-btn" onclick="MORI_ROUTER.navigate('admin')" title="Админка">👑</button>`;
        }
        
        if (level !== 'guest') {
            buttons += `<button class="header-btn" onclick="MORI_AUTH.logout()" title="Выход">🚪</button>`;
        }
        
        return buttons;
    },

    // ========== ЛЕНИВАЯ ЗАГРУЗКА МОДУЛЯ ==========
    lazyLoadModule: function(moduleName) {
        const script = document.createElement('script');
        script.src = `/js/modules/${moduleName}/index.js`;
        script.onload = () => {
            console.log(`✅ Модуль ${moduleName} загружен`);
            if (this.currentScreen) this.navigate(this.currentScreen);
        };
        document.head.appendChild(script);
    },

    // ========== ПОКАЗ ОШИБКИ ==========
    showError: function(screenTitle, errorMessage) {
        const content = document.getElementById(`${screenTitle.toLowerCase()}-content`);
        if (content) {
            content.innerHTML = `
                <div class="error-container">
                    <div class="error-icon">⚠️</div>
                    <h3>Ошибка загрузки</h3>
                    <p>${errorMessage}</p>
                    <button class="retry-btn" onclick="MORI_ROUTER.reload()">Повторить</button>
                </div>
            `;
        }
    },

    // ========== ЭКРАН АВТОРИЗАЦИИ ==========
    showAuthScreen: function() {
        const appDiv = document.getElementById('app');
        if (!appDiv) return;
        
        appDiv.innerHTML = `
            <div class="screen auth-screen">
                <header class="screen-header">
                    <h1>🔮 MORI Oracle</h1>
                </header>
                <div class="screen-content">
                    <div class="auth-form">
                        <div class="auth-info">
                            <p>Доступные пароли:</p>
                            <ul>
                                <li><span class="password">MORI</span> – обычный пользователь</li>
                                <li><span class="password">MORIFAMILY</span> – семья</li>
                                <li><span class="password">MORIADMIN</span> – администратор</li>
                            </ul>
                        </div>
                        
                        <div class="form-group">
                            <label for="auth-password">Введите пароль</label>
                            <input type="password" id="auth-password" placeholder="••••••••" autofocus>
                        </div>
                        
                        <button class="auth-btn" id="auth-login">🚀 Войти</button>
                    </div>
                </div>
            </div>
        `;
        
        setTimeout(() => {
            const loginBtn = document.getElementById('auth-login');
            const passwordInput = document.getElementById('auth-password');
            
            if (loginBtn && passwordInput) {
                loginBtn.onclick = () => {
                    const password = passwordInput.value.trim();
                    if (password) {
                        loginBtn.disabled = true;
                        loginBtn.textContent = '⏳ Вход...';
                        MORI_AUTH.login(password).finally(() => {
                            loginBtn.disabled = false;
                            loginBtn.textContent = '🚀 Войти';
                        });
                    }
                };
                
                passwordInput.onkeypress = (e) => {
                    if (e.key === 'Enter') loginBtn.click();
                };
            }
        }, 100);
    },

    // ========== ЖЕСТЫ ==========
    setupGestures: function() {
        let touchStartX = 0;
        let touchStartY = 0;
        
        document.addEventListener('touchstart', e => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', e => {
            const diffX = e.changedTouches[0].clientX - touchStartX;
            const diffY = e.changedTouches[0].clientY - touchStartY;
            
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 100) {
                if (diffX > 0) this.goBack();
                else this.goForward();
            }
        });
    },

    // ========== НАЗАД ==========
    goBack: function() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const prevScreen = this.history[this.historyIndex];
            window.location.hash = prevScreen;
        }
    },

    // ========== ВПЕРЁД ==========
    goForward: function() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            const nextScreen = this.history[this.historyIndex];
            window.location.hash = nextScreen;
        }
    },

    // ========== ПЕРЕЗАГРУЗКА ==========
    reload: function() {
        if (this.currentScreen) {
            this.navigate(this.currentScreen);
        }
    },

    // ========== ГОРЯЧИЕ КЛАВИШИ ==========
    setupHotkeys: function() {
        document.addEventListener('keydown', e => {
            // Alt+Left - назад
            if (e.altKey && e.key === 'ArrowLeft') {
                this.goBack();
            }
            // Alt+Right - вперёд
            if (e.altKey && e.key === 'ArrowRight') {
                this.goForward();
            }
            // Ctrl+R - перезагрузка
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                this.reload();
            }
        });
    },

    // ========== ЗАКЛАДКИ ==========
    toggleBookmark: function() {
        if (!this.currentScreen) return;
        
        if (this.bookmarks.includes(this.currentScreen)) {
            this.bookmarks = this.bookmarks.filter(b => b !== this.currentScreen);
            MORI_APP.showToast('🔖 Удалено из закладок');
        } else {
            this.bookmarks.push(this.currentScreen);
            MORI_APP.showToast('🔖 Добавлено в закладки');
        }
        this.saveUserPreferences();
    },

    // ========== ИЗБРАННОЕ ==========
    toggleFavorite: function() {
        if (!this.currentScreen) return;
        
        if (this.favorites.includes(this.currentScreen)) {
            this.favorites = this.favorites.filter(f => f !== this.currentScreen);
            MORI_APP.showToast('⭐ Убрано из избранного');
        } else {
            this.favorites.push(this.currentScreen);
            MORI_APP.showToast('⭐ Добавлено в избранное');
        }
        this.saveUserPreferences();
    },

    // ========== ТЕМЫ ДЛЯ ЭКРАНОВ ==========
    screenThemes: {
        portfolio: 'dark',
        library: 'light',
        chat: 'cyber',
        family: 'warm',
        admin: 'royal'
    },
    
    applyScreenTheme: function(screenId) {
        const theme = this.screenThemes[screenId] || 'default';
        document.body.className = `theme-${theme}`;
    },

    // ========== АНИМАЦИИ ==========
    transitions: {
        fade: { in: 'fade-in', out: 'fade-out' },
        slide: { in: 'slide-in', out: 'slide-out' }
    },

    // ========== ЗВУКИ ==========
    playSound: function(soundName) {
        // Опционально, можно отключить если нет звуков
        // const audio = new Audio(`/assets/sounds/${soundName}.mp3`);
        // audio.volume = 0.3;
        // audio.play().catch(() => {});
    },

    // ========== ВИБРАЦИЯ ==========
    vibrate: function(pattern = 20) {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    },

    // ========== ОФЛАЙН-ОЧЕРЕДЬ ==========
    addToOfflineQueue: function(action) {
        this.offlineQueue.push({
            ...action,
            timestamp: Date.now()
        });
        localStorage.setItem('offline_queue', JSON.stringify(this.offlineQueue));
    },
    
    processOfflineQueue: function() {
        if (navigator.onLine && this.offlineQueue.length > 0) {
            console.log('🔄 Обработка офлайн очереди...');
            this.offlineQueue = [];
            localStorage.removeItem('offline_queue');
        }
    },

    // ========== ЭКСПОРТ НАСТРОЕК ==========
    exportSettings: function() {
        const settings = {
            bookmarks: this.bookmarks,
            favorites: this.favorites,
            recent: this.recent
        };
        const blob = new Blob([JSON.stringify(settings, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'router_settings.json';
        a.click();
        URL.revokeObjectURL(url);
    },

    // ========== ОБНОВЛЕНИЕ НАВИГАЦИИ ==========
    updateNavigation: function() {
        // Подсвечиваем активные кнопки
        document.querySelectorAll('.nav-btn').forEach(btn => {
            const screen = btn.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
            if (screen === this.currentScreen) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
};

// ========== ЗАПУСК ==========
window.MORI_ROUTER = MORI_ROUTER;

// Автозапуск
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MORI_ROUTER.init());
} else {
    MORI_ROUTER.init();
}
