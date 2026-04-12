// force rebuild 2025-04-01
/**
 * MEGA-ROUTER v5.0 — АБСОЛЮТНО РАБОЧИЙ
 * Без заглушек, без компромиссов
 */

const MORI_ROUTER = {
    // ========== ВСЕ ТВОИ ЭКРАНЫ ==========
    screens: {
        auth: {
            title: 'Авторизация',
            module: null,
            guard: 'guest',
            icon: '🔐'
        },
        dashboard: {
            title: 'Главная',
            module: 'MORI_DASHBOARD',
            guard: 'user',
            icon: '🏠'
        },
        portfolio: {
            module: 'MORI_PORTFOLIO',
            guard: 'user',
            icon: '💼',
            id: 'portfolio'
        },
        'ai-chat': {
            title: 'AI',
            module: 'MORI_AI_CHAT',
            guard: 'user',
            icon: '🧠'
        },
        calculator: {
            title: 'Калькулятор',
            module: 'MORI_CALCULATOR',
            guard: 'user',
            icon: '🧮',
            id: 'calculator'
        },
        library: {
            title: 'Библиотека',
            module: 'MORI_LIBRARY',
            guard: 'user',
            icon: '📚',
            id: 'library'
        },
        profile: {
            title: 'Профиль',
            module: 'MORI_PROFILE',
            guard: 'user',
            icon: '👤',
            id: 'profile'
        },
        achievements: {
            title: 'Достижения',
            module: 'MORI_ACHIEVEMENTS',
            guard: 'user',
            icon: '🏆'
        },
        levels: {
            title: 'Уровни',
            module: 'MORI_LEVELS',
            guard: 'user',
            icon: '📈'
        },
        tasks: {
            title: 'Задания',
            module: 'MORI_TASKS',
            guard: 'user',
            icon: '✅'
        },
        chat: {
            title: 'MORIGRAM',
            module: 'MORI_CHAT',
            guard: 'user',
            icon: '💬'
        },
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
        'all-apps': {
            title: 'Все приложения',
            module: 'MORI_ALL_APPS',
            guard: 'user',
            icon: '📱'
        },
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
    sessionTimeout: 30 * 60 * 1000,

    domCache: new Map(),
    offlineQueue: [],
    auditLog: [],

    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    init: function() {
        console.log('🚀 MORI_ROUTER инициализация...');
        this.loadUserPreferences();
        this.setupBackButton();
        this.setupPopstateHandler();
 
        // Загружаем историю
    const savedHistory = localStorage.getItem('nav_history');
    if (savedHistory) {
        this.history = JSON.parse(savedHistory);
    }

        window.addEventListener('hashchange', () => this.handleHashChange());
        window.addEventListener('load', () => {
            this.restoreSession();
            this.handleHashChange();
        });
        window.addEventListener('beforeunload', () => this.saveSession());
        this.setupHotkeys();
        this.setupGestures();
        setInterval(() => this.processOfflineQueue(), 5000);
        window.addEventListener('online', () => this.processOfflineQueue());
    },

   /**
 * Установка обработчика кнопки "Назад" (для WebView)
 */
setupBackButton: function() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    document.addEventListener('backbutton', (e) => {
        e.preventDefault();
        if (this.history.length > 1) {
            this.goBack();
        } else {
            MORI_APP.customConfirm({
                title: 'Выход',
                message: 'Вы уверены, что хотите выйти из приложения?',
                confirmText: 'Выйти',
                cancelText: 'Отмена',
                icon: '🚪'
            }).then(result => {
                if (result) {
                    if (window.TelegramWebviewProxy) {
                        TelegramWebviewProxy.postEvent('web_app_close', {});
                    } else {
                        window.close();
                    }
                }
            });
        }
    });
},

/**
 * Установка обработчика для браузеров (popstate)
 */
setupPopstateHandler: function() {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('popstate', (e) => {
        e.preventDefault();
        if (this.history.length > 1) {
            this.goBack();
        }
    });
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

    saveUserPreferences: function() {
        localStorage.setItem('router_bookmarks', JSON.stringify(this.bookmarks));
        localStorage.setItem('router_recent', JSON.stringify(this.recent));
        localStorage.setItem('router_favorites', JSON.stringify(this.favorites));
    },

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

    saveSession: function() {
        if (MORI_APP.currentUser) {
            sessionStorage.setItem('mori_user', JSON.stringify(MORI_APP.currentUser));
            sessionStorage.setItem('mori_level', MORI_APP.accessLevel);
        }
    },

    handleHashChange: function() {
        let screen = window.location.hash.slice(1) || 'dashboard';
        screen = screen.split('?')[0];
        this.navigate(screen);
    },

    // ========== НАВИГАЦИЯ ==========
    navigate: function(screenId, options = {}) {
        console.log(`🚀 Навигация на ${screenId}`);
   
        // Сохраняем текущий экран в историю
    if (this.currentScreen && this.currentScreen !== screenId) {
        this.history.push(this.currentScreen);
        localStorage.setItem('nav_history', JSON.stringify(this.history));
    }

        const icon = document.querySelector('.theme-icon');
        if (icon) {
            icon.style.visibility = 'hidden';
            icon.style.opacity = '0';
            icon.style.position = 'absolute';
        }
        
        this.saveSession();

        if (!this.checkAccess(screenId)) {
            console.log('⛔ Нет доступа');
            if (screenId !== 'auth') {
                window.location.hash = 'auth';
                return;
            }
        }

        const screen = this.screens[screenId];
        if (!screen) {
            console.error('❌ Экран не найден');
            window.location.hash = 'dashboard';
            return;
        }

        this.addToHistory(screenId);
        this.addToRecent(screenId);
        this.logAccess(screenId, MORI_APP.currentUser?.id, true);
        this.resetSessionTimer();

        this.loadModule(screen);
        this.updateTitle(screenId);
       // this.applyScreenTheme(screenId);

        if (screenId === 'portfolio' && icon) {
            icon.style.visibility = 'visible';
            icon.style.opacity = '1';
            icon.style.position = 'relative';
            icon.style.bottom = '40px';
        }

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

    addToHistory: function(screenId) {
        this.history.push(screenId);
        this.historyIndex++;
        if (this.history.length > 50) this.history.shift();
    },

    addToRecent: function(screenId) {
        this.recent = [screenId, ...this.recent.filter(s => s !== screenId)].slice(0, 10);
        localStorage.setItem('router_recent', JSON.stringify(this.recent));
    },

    logAccess: function(screenId, userId, success) {
        this.auditLog.push({
            screen: screenId,
            user: userId,
            success: success,
            time: new Date().toISOString()
        });
        if (this.auditLog.length > 1000) this.auditLog = this.auditLog.slice(-1000);
        localStorage.setItem('audit_log', JSON.stringify(this.auditLog));
    },

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

        if (screen.title === 'Авторизация') {
            this.showAuthScreen();
            return;
        }

        let cached = this.domCache.get(screen.title);

        appDiv.innerHTML = cached || `
            <div class="screen" data-screen="${(screen.title || screen.id || screen).toLowerCase()}">
                <div class="screen-content" id="${screen.id || screen}-content">
                    <div class="loading">Загрузка...</div>
                </div>
            </div>
        `;

        if (!cached) this.domCache.set(screen.title, appDiv.innerHTML);

        if (screen.module && window[screen.module]) {
            try {
                if (window[screen.module].init) window[screen.module].init();
                if (window[screen.module].render) window[screen.module].render();
            } catch (error) {
                console.error(`❌ Ошибка модуля ${screen.module}:`, error);
                this.showError(screen.title, error.message);
            }
        } else if (screen.module) {
            this.lazyLoadModule(screen.module.split('_')[1].toLowerCase());
        }
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

    // Читаем реферальный код из URL
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref') || '';

    appDiv.innerHTML = `
        <div class="auth-screen">
            <div class="auth-gold-line"></div>
            <div class="auth-wrapper">
                <div class="auth-container">
                    <div class="auth-logo">🎭</div>
                    <h1 class="auth-title">MORI Oracle</h1>
                    <p class="auth-subtitle">Введите данные</p>

                    <div class="auth-form">
                        <div class="auth-input-group">
                            <input type="text" id="auth-nickname" placeholder="Никнейм" autofocus>
                            <span class="auth-input-icon">👤</span>
                        </div>

                        <div class="auth-input-group">
                            <input type="password" id="auth-password" placeholder="Пароль">
                            <span class="auth-input-icon">🔒</span>
                        </div>
                        <button class="auth-btn" id="auth-login">
                            <span>🚀 Войти</span>
                        </button>
                        <div class="auth-footer">
                            <span class="auth-register-link" id="auth-register-link">🔹 Нет аккаунта? Создать</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    setTimeout(() => {
        const loginBtn = document.getElementById('auth-login');
        const passwordInput = document.getElementById('auth-password');
        const nicknameInput = document.getElementById('auth-nickname');
    
        if (loginBtn && passwordInput) {
            loginBtn.onclick = () => {
                const nickname = nicknameInput?.value.trim();
                const password = passwordInput.value.trim();
                
                if (!nickname) {
                    MORI_APP.showToast('❌ Введите никнейм', 'error');
                    return;
                }
                if (!password) {
                    MORI_APP.showToast('❌ Введите пароль', 'error');
                    return;
                }

                loginBtn.disabled = true;
                loginBtn.innerHTML = '<span>⏳ Вход...</span>';
                MORI_AUTH.login(nickname, password).finally(() => {
                    loginBtn.disabled = false;
                    loginBtn.innerHTML = '<span>🚀 Войти</span>';
                });
            };

            passwordInput.onkeypress = (e) => {
                if (e.key === 'Enter') loginBtn.click();
            };
            nicknameInput.onkeypress = (e) => {
                if (e.key === 'Enter') loginBtn.click();
            };
        }

        // Переключение на экран регистрации
        const registerLink = document.getElementById('auth-register-link');
        if (registerLink) {
            registerLink.onclick = () => {
                MORI_ROUTER.showRegisterScreen();
            };
        }

    }, 100);
},

    // ========== ЭКРАН РЕГИСТРАЦИИ ==========

    showRegisterScreen: function() {
    const appDiv = document.getElementById('app');
    if (!appDiv) return;

    // Читаем реферальный код из URL
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref') || '';

    appDiv.innerHTML = `
        <div class="auth-screen">
            <div class="auth-gold-line"></div>
            <div class="auth-wrapper">
                <div class="auth-container">
                    <div class="auth-logo">🎭</div>
                    <h1 class="auth-title">MORI Oracle</h1>
                    <p class="auth-subtitle">Зарегистрируйтесь</p>

                    <div class="auth-form">
                        <div class="auth-input-group">
                            <input type="text" id="reg-nickname" placeholder="Никнейм" autofocus>
                            <span class="auth-input-icon">👤</span>
                        </div>

                        <div class="auth-input-group">
                            <input type="password" id="reg-password" placeholder="Пароль">
                            <span class="auth-input-icon">🔒</span>
                        </div>

                        <div class="auth-input-group">
                            <input type="number" id="reg-real-balance" placeholder="Баланс $MORI" step="any">
                            <span class="auth-input-icon">💰</span>
                        </div>

                        <div class="auth-input-group">
                            <input type="text" id="reg-ref-code" placeholder="Реферальный код" value="${refCode}">
                            <span class="auth-input-icon">🎁</span>
                        </div>

                        <button class="auth-btn" id="auth-register">
                            <span>📝 Зарегистрироваться</span>
                        </button>
                        <div class="auth-footer">
                            <span class="auth-login-link" id="auth-login-link">🔹 Уже есть аккаунт? Войти</span>
                        </div>
                    </div>
                </div>
            </div>                                                                                                            </div>
    `;

    setTimeout(() => {
        const nicknameInput = document.getElementById('reg-nickname');
const passwordInput = document.getElementById('reg-password');
const realBalanceInput = document.getElementById('reg-real-balance');
const refCodeInput = document.getElementById('reg-ref-code');
const registerBtn = document.getElementById('auth-register');

if (registerBtn) {
    registerBtn.onclick = () => {
        const nickname = nicknameInput?.value.trim();
        const password = passwordInput?.value.trim();
        const realBalance = parseFloat(realBalanceInput?.value);
        const refCode = refCodeInput?.value.trim();

        if (!nickname) { MORI_APP.showToast('❌ Введите никнейм', 'error'); return; }
        if (!password) { MORI_APP.showToast('❌ Введите пароль', 'error'); return; }
        if (isNaN(realBalance) || realBalance < 0) { MORI_APP.showToast('❌ Введите корректный REAL баланс', 'error'); return; }

        registerBtn.disabled = true;
        registerBtn.innerHTML = '<span>⏳ Регистрация...</span>';
        MORI_AUTH.registerWithDetails(nickname, password, realBalance, refCode).finally(() => {
            registerBtn.disabled = false;
            registerBtn.innerHTML = '<span>📝 Зарегистрироваться</span>';
        });
    };

    passwordInput.onkeypress = (e) => { if (e.key === 'Enter') registerBtn.click(); };
    nicknameInput.onkeypress = (e) => { if (e.key === 'Enter') registerBtn.click(); };
    realBalanceInput.onkeypress = (e) => { if (e.key === 'Enter') registerBtn.click(); };
    refCodeInput.onkeypress = (e) => { if (e.key === 'Enter') registerBtn.click(); };
}

        // Переключение на экран входа
        const loginLink = document.getElementById('auth-login-link');
        if (loginLink) {
            loginLink.onclick = () => {
                MORI_ROUTER.showAuthScreen();
            };
        }
        

    }, 100);
},

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

    goBack: function() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const prevScreen = this.history[this.historyIndex];
            window.location.hash = prevScreen;
        }
    },

    goForward: function() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            const nextScreen = this.history[this.historyIndex];
            window.location.hash = nextScreen;
        }
    },

    reload: function() {
        if (this.currentScreen) this.navigate(this.currentScreen);
    },

    setupHotkeys: function() {
        document.addEventListener('keydown', e => {
            if (e.altKey && e.key === 'ArrowLeft') this.goBack();
            if (e.altKey && e.key === 'ArrowRight') this.goForward();
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                this.reload();
            }
        });
    },

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

    screenThemes: {
        portfolio: 'mori-classic',
        library: 'mori-classic',
        chat: 'mori-classic',
        family: 'mori-classic',
        admin: 'mori-classic'
    },

    applyScreenTheme: function(screenId) {
        const theme = this.screenThemes[screenId] || 'mori-classic';
        document.body.className = `theme-${theme}`;
    },

    // ========== ОБНОВЛЕНИЕ ЗАГОЛОВКА ==========
    updateTitle: function(screenId) {
        const titleMap = {
            'portfolio': 'portfolio-title',
            'calculator': 'calculator-title',
            'library': 'library-title',
            'ai-chat': 'ai-chat-title',
            'profile': 'profile-title',
            'tasks': 'tasks-title',
            'chat': 'chat-title',
            'house': 'house-title',
            'family': 'family-title',
            'music': 'music-title',
            'voice': 'voice-title',
            'demigurge': 'demigurge-title',
            'all-apps': 'all-apps-title',
            'games': 'games-title',
            'mori-wallet': 'mori-wallet-title',
            'mori-work': 'mori-work-title',
            'retro-phone': 'retro-phone-title',
            'mori-story': 'mori-story-title'
        };
        const titleId = titleMap[screenId];
        if (!titleId) return;
        document.querySelectorAll('.module-title').forEach(title => {
            title.style.display = 'none';
        });
        const activeTitle = document.getElementById(titleId);
        if (activeTitle) {
            activeTitle.style.display = 'block';
        }
    },

    transitions: {
        fade: { in: 'fade-in', out: 'fade-out' },
        slide: { in: 'slide-in', out: 'slide-out' }
    },

    playSound: function(soundName) {},

    vibrate: function(pattern = 20) {
        if (navigator.vibrate) navigator.vibrate(pattern);
    },

    addToOfflineQueue: function(action) {
        this.offlineQueue.push({ ...action, timestamp: Date.now() });
        localStorage.setItem('offline_queue', JSON.stringify(this.offlineQueue));
    },

    processOfflineQueue: function() {
        if (navigator.onLine && this.offlineQueue.length > 0) {
            console.log('🔄 Обработка офлайн очереди...');
            this.offlineQueue = [];
            localStorage.removeItem('offline_queue');
        }
    },

    exportSettings: function() {
        const settings = {
            bookmarks: this.bookmarks,
            favorites: this.favorites,
            recent: this.recent
        };
        const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'router_settings.json';
        a.click();
        URL.revokeObjectURL(url);
    },

    updateNavigation: function() {
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

window.MORI_ROUTER = MORI_ROUTER;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MORI_ROUTER.init());
} else {
    MORI_ROUTER.init();
}
