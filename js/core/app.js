/**
 * CORE APP — ГЛАВНЫЙ ФАЙЛ ПРИЛОЖЕНИЯ
 * Версия: 6.2.0 (СТАБИЛЬНАЯ, ПАРАЛЛЕЛЬНАЯ ЗАГРУЗКА МОДУЛЕЙ)
 */

const MORI_APP = {
    version: '6.2.0',

    states: {
        BOOT: 'boot',
        INIT: 'init',
        READY: 'ready',
        RUNNING: 'running',
        PAUSED: 'paused',
        ERROR: 'error',
        SHUTDOWN: 'shutdown'
    },

    currentState: 'boot',
    currentUser: null,
    accessLevel: 'guest',

    state: {
        initialized: false,
        loading: false,
        offline: false,
        appReady: false,
        startupTime: Date.now()
    },

    metrics: {
        startups: 0,
        errors: 0,
        lastError: null,
        uptime: 0
    },

    loadingProgress: 0,
    moduleCache: new Map(),
    cssCache: new Set(),
    backgroundTasks: new Map(),
    experiments: new Map(),
    checkpoint: null,
    analytics: { events: [], sessions: 0, lastActive: null },
    plugins: new Map(),

    hooks: {
        beforeInit: [],
        afterInit: [],
        beforeStart: [],
        afterStart: [],
        beforeModuleLoad: [],
        afterModuleLoad: [],
        beforeNavigate: [],
        afterNavigate: [],
        stateChange: []
    },

    timers: {
        sessionTimer: null,
        pingTimer: null,
        statsTimer: null,
        syncTimer: null
    },

    animations: {
        fadeIn: function(element, duration = 300) {
            if (!element) return;
            element.style.opacity = '0';
            element.style.display = 'block';

            let start = null;
            function animate(timestamp) {
                if (!start) start = timestamp;
                const progress = Math.min((timestamp - start) / duration, 1);
                element.style.opacity = progress;
                if (progress < 1) requestAnimationFrame(animate);
            }
            requestAnimationFrame(animate);
        },

        fadeOut: function(element, duration = 300) {
            if (!element) return;
            element.style.opacity = '1';

            let start = null;
            function animate(timestamp) {
                if (!start) start = timestamp;
                const progress = Math.min((timestamp - start) / duration, 1);
                element.style.opacity = 1 - progress;
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    element.style.display = 'none';
                }
            }
            requestAnimationFrame(animate);
        },

        // Новая анимация: подпрыгивающее появление
bounceIn: function(element, duration = 400) {
    if (!element) return;
    element.style.opacity = '0';
    element.style.transform = 'scale(0.8)';
    element.style.display = 'block';

    let start = null;
    function animate(timestamp) {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        element.style.opacity = progress;
        element.style.transform = `scale(${0.8 + (0.2 * easeOut)})`;
        if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
},

// Новая анимация: встряска
shake: function(element, intensity = 5, duration = 300) {
    if (!element) return;
    const startTime = performance.now();
    
    function shakeFrame(now) {
        const elapsed = now - startTime;
        if (elapsed < duration) {
            const progress = elapsed / duration;
            const shakeAmount = intensity * (1 - progress);
            const x = Math.sin(progress * Math.PI * 8) * shakeAmount;
            element.style.transform = `translateX(${x}px)`;
            requestAnimationFrame(shakeFrame);
        } else {
            element.style.transform = '';
        }
    }
    requestAnimationFrame(shakeFrame);
},

// Новая анимация: пульсация
pulse: function(element, duration = 1000) {
    if (!element) return;
    let start = null;
    function animate(timestamp) {
        if (!start) start = timestamp;
        const elapsed = timestamp - start;
        const progress = (elapsed % duration) / duration;
        const scale = 1 + Math.sin(progress * Math.PI * 2) * 0.1;
        element.style.transform = `scale(${scale})`;
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
},

        slideIn: function(element, direction = 'left', duration = 300) {
            if (!element) return;
            const start = direction === 'left' ? '-100%' : '100%';
            element.style.transform = `translateX(${start})`;
            element.style.display = 'block';

            let startTime = null;
            function animate(timestamp) {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / duration, 1);
                const x = start === '-100%' ? -100 + (progress * 100) : 100 - (progress * 100);
                element.style.transform = `translateX(${x}%)`;
                if (progress < 1) requestAnimationFrame(animate);
            }
            requestAnimationFrame(animate);
        }
    },

    transition: function(newState) {
        const oldState = this.currentState;
        this.currentState = newState;
        console.log(`🔄 Состояние: ${oldState} → ${newState}`);
        this.runHooks('stateChange', oldState, newState);
        if (newState === 'error') this.handleStateError();
        this.saveCheckpoint();
    },

    init: async function() {
        console.log(`🚀 MORI APP v${this.version} инициализация...`);

        this.runHooks('beforeInit');
        this.transition(this.states.INIT);

        this.metrics.startups++;
        this.state.initialized = false;
        this.state.loading = true;

        try {
            this.showDetailedLoading();
            await this.restoreCheckpoint();
            this.initExperiments();
            await this.initCore();
            await this.loadUser();
            await this.initModules();

            this.setupListeners();
            this.startBackgroundTasks();
            this.startTimers();

            this.state.initialized = true;
            this.state.loading = false;
            this.transition(this.states.READY);

            console.log('✅ MORI APP инициализирован');

            this.animations.fadeOut(document.getElementById('app-loader'), 500);
            this.startApp();

            this.runHooks('afterInit');

        } catch (error) {
            this.transition(this.states.ERROR);
            this.handleError('Инициализация', error);
        }
    },

    showDetailedLoading: function() {
        let loader = document.getElementById('app-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'app-loader';
            document.body.appendChild(loader);
        }

        loader.innerHTML = `
            <div class="loading-detailed">
                <div class="loading-logo">🔮 MORI Oracle</div>
                <div class="loading-bar-container">
                    <div class="loading-bar" id="loading-progress" style="width: 0%"></div>
                </div>
                <div class="loading-text" id="loading-text">Инициализация...</div>
                <div class="loading-details" id="loading-details"></div>
                <div class="loading-version">v${this.version}</div>
            </div>
        `;
        loader.style.display = 'flex';
    },

    updateProgress: function(percent, message, details = '') {
        this.loadingProgress = percent;
        const progressBar = document.getElementById('loading-progress');
        const progressText = document.getElementById('loading-text');
        const detailsEl = document.getElementById('loading-details');

        if (progressBar) progressBar.style.width = percent + '%';
        if (progressText) progressText.textContent = message || `${Math.round(percent)}%`;
        if (detailsEl) detailsEl.textContent = details;

        if (percent === 100) {
            setTimeout(() => {
                this.animations.fadeOut(document.getElementById('app-loader'), 500);
            }, 500);
        }
    },

    initExperiments: function() {
        const userId = this.currentUser?.id || 'anonymous';
        const hash = this.hashCode(userId);
        this.experiments.set('newDashboard', hash % 2 === 0);
        this.experiments.set('betaFeatures', hash % 3 === 0);
        this.experiments.set('earlyAccess', hash % 5 === 0);
        console.log('🧪 Эксперименты:', Object.fromEntries(this.experiments));
    },

    hashCode: function(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    },

    isEnabled: function(experiment) {
        return this.experiments.get(experiment) || false;
    },

    initCore: async function() {
        console.log('⚙️ Инициализация ядра...');
        this.updateProgress(10, 'Загрузка ядра...');

        this.loadMetrics();
        this.state.offline = !navigator.onLine;

        if (window.MORI_STORAGE) await MORI_STORAGE.init();
        this.updateProgress(20, 'Хранилище готово');

        if (window.MORI_API) MORI_API.init();
        this.updateProgress(30, 'API готово');

        if (window.MORI_NOTIFICATIONS) MORI_NOTIFICATIONS.init();
        this.updateProgress(40, 'Уведомления готовы');

        if (window.MORI_AUTH) MORI_AUTH.init();
        this.updateProgress(50, 'Авторизация готова');

        if (window.MORI_USER) MORI_USER.init();
        this.updateProgress(60, 'Пользователь загружен');

        if (window.MORI_ROUTER) MORI_ROUTER.init();
        this.updateProgress(70, 'Навигация готова');
    },

    loadUser: async function() {
        const token = localStorage.getItem('mori_token');

        if (token && window.MORI_AUTH) {
            console.log('👤 Загрузка пользователя...');
            this.updateProgress(75, 'Загрузка пользователя...');
            await MORI_AUTH.checkSession();
        }

        if (window.MORI_USER && MORI_USER.current) {
            this.currentUser = MORI_USER.current;
            this.accessLevel = this.currentUser.access_level || 'user';
            console.log(`✅ Пользователь загружен: ${this.currentUser.nickname}, уровень: ${this.accessLevel}`);
        } else {
            console.log('👤 Пользователь не авторизован');
        }

        this.updateProgress(80, 'Пользователь загружен');
    },

    // ========== ПАРАЛЛЕЛЬНАЯ ЗАГРУЗКА МОДУЛЕЙ (БЫСТРО И СТАБИЛЬНО) ==========
    loadModule: function(moduleName) {
        return new Promise((resolve) => {
            if (this.moduleCache.has(moduleName)) {
                resolve(true);
                return;
            }

            const script = document.createElement('script');
            script.src = `js/modules/${moduleName}/index.js`;
            script.onload = () => {
                this.moduleCache.set(moduleName, true);
                resolve(true);
            };
            script.onerror = () => {
                console.error(`❌ Модуль ${moduleName} не загружен`);
                resolve(false);
            };
            document.head.appendChild(script);
        });
    },

    initModules: async function() {
        console.log('🚀 Параллельная загрузка модулей...');
        const modules = ['portfolio', 'calculator', 'library', 'ai-chat', 'profile', 'tasks', 'chat', 'house', 'family', 'demigurge', 'music', 'voice', 'all-apps'];
        
        const results = await Promise.all(modules.map(m => this.loadModule(m)));
        const loaded = results.filter(Boolean);
        
        console.log(`✅ Загружено модулей: ${loaded.length}/${modules.length}`);
        window.MORI_APP.modules = loaded;
        return loaded;
    },

    // ========== ПРЕДЗАГРУЗКА В ФОНЕ ПОСЛЕ ЗАПУСКА ==========
    preloadAllModules: async function() {
        const modules = ['portfolio', 'calculator', 'library', 'ai-chat', 'profile', 'tasks', 'chat', 'house', 'family', 'demigurge', 'music', 'voice', 'all-apps'];
        for (const moduleName of modules) {
            if (!this.moduleCache.has(moduleName)) {
                await this.loadModule(moduleName);
            }
        }
        console.log('📦 Все модули предзагружены');
    },

    // ========== ЗАГРУЗКА CSS ==========
    async loadCSS(href) {
        if (this.cssCache.has(href)) return Promise.resolve();

        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = () => {
                this.cssCache.add(href);
                resolve();
            };
            link.onerror = reject;
            document.head.appendChild(link);
        });
    },

    async loadTheme(themeName) {
        await this.loadCSS(`css/themes/${themeName}.css`);
        document.body.className = `theme-${themeName}`;
        console.log(`🎨 Тема ${themeName} загружена`);
    },

    setupListeners: function() {
        window.addEventListener('online', () => {
            this.state.offline = false;
            this.showToast('🌐 Соединение восстановлено', 'success');
            this.syncOfflineData();
            this.trackEvent('connection', { status: 'online' });
        });

        window.addEventListener('offline', () => {
            this.state.offline = true;
            this.showToast('📴 Нет интернета', 'warning');
            this.trackEvent('connection', { status: 'offline' });
        });

        window.addEventListener('error', (event) => {
            this.handleError('Глобальная ошибка', event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.handleError('Unhandled Promise', event.reason);
        });

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.onPageVisible();
            } else {
                this.onPageHidden();
            }
        });

        window.addEventListener('beforeunload', () => {
            this.saveCheckpoint();
            this.stopTimers();
            this.saveMetrics();
        });
   
        // Обработчик иконки темы
        setTimeout(() => {
            const themeIcon = document.querySelector('.theme-icon');
            if (themeIcon) {
                themeIcon.addEventListener('click', () => {
                    // Показываем меню выбора тем (временно консоль)
                    console.log('🎨 Меню тем');
                    this.showToast('🎨 Меню выбора тем будет доступно в профиле', 'info', 3000);
                });
            }
        }, 1000);


    startBackgroundTasks: function() {
        this.addBackgroundTask('sync', () => this.syncOfflineData(), 60000);
        this.addBackgroundTask('updates', () => this.checkForUpdates(), 3600000);
        this.addBackgroundTask('metrics', () => this.saveMetrics(), 300000);
        console.log('⏱️ Фоновые задачи запущены');
    },

    addBackgroundTask: function(name, task, interval) {
        const id = setInterval(async () => {
            try {
                await task();
            } catch (error) {
                console.error(`❌ Фоновая задача ${name}:`, error);
            }
        }, interval);
        this.backgroundTasks.set(name, id);
    },

    removeBackgroundTask: function(name) {
        if (this.backgroundTasks.has(name)) {
            clearInterval(this.backgroundTasks.get(name));
            this.backgroundTasks.delete(name);
        }
    },

    startTimers: function() {
        this.timers.sessionTimer = setInterval(() => {
            this.metrics.uptime = Math.floor((Date.now() - this.state.startupTime) / 1000);
        }, 1000);

        this.timers.pingTimer = setInterval(async () => {
            if (window.MORI_API && navigator.onLine) {
                const online = await MORI_API.ping();
                if (!online && !this.state.offline) {
                    this.state.offline = true;
                    this.showToast('📴 Сервер недоступен', 'error');
                }
            }
        }, 30000);

        this.timers.statsTimer = setInterval(() => {
            this.saveMetrics();
        }, 60000);
    },

    stopTimers: function() {
        Object.values(this.timers).forEach(timer => {
            if (timer) clearInterval(timer);
        });
    },

    startApp: function() {
        console.log('▶️ Запуск приложения...');
        this.runHooks('beforeStart');
        this.transition(this.states.RUNNING);
        this.state.appReady = true;

        if (this.accessLevel === 'guest') {
            if (window.MORI_ROUTER) MORI_ROUTER.navigate('auth');
        } else {
            const lastScreen = localStorage.getItem('last_screen') || 'portfolio';
            if (window.MORI_ROUTER) MORI_ROUTER.navigate(lastScreen);
        }

        this.runHooks('afterStart');
        this.trackEvent('app_start', { level: this.accessLevel });

        // Предзагрузка остальных модулей в фоне (через 2 секунды после старта)
        setTimeout(() => {
            this.preloadAllModules();
        }, 2000);
    },

    reload: function() {
        console.log('🔄 Перезагрузка приложения...');
        this.trackEvent('app_reload');
        location.reload();
    },

    logout: async function() {
        this.trackEvent('logout');
        if (window.MORI_AUTH) await MORI_AUTH.logout();
    },

    showToast: function(message, type = 'info', duration = 3000) {
        if (window.MORI_NOTIFICATIONS) {
            MORI_NOTIFICATIONS.show(message, type, { duration });
        } else {
            console.log(`[${type}] ${message}`);
        }
    },

    handleError: function(context, error) {
        this.metrics.errors++;
        this.metrics.lastError = {
            context,
            message: error?.message || String(error),
            stack: error?.stack,
            time: Date.now()
        };

        console.error(`❌ ${context}:`, error);

        try {
            if (window.MORI_STORAGE) {
                let errors = MORI_STORAGE.get('app_errors');
                if (!errors || !Array.isArray(errors)) errors = [];
                errors.push(this.metrics.lastError);
                if (errors.length > 50) errors = errors.slice(-50);
                MORI_STORAGE.set('app_errors', errors);
            }
        } catch (e) {
            console.warn('Не удалось сохранить ошибку в хранилище');
        }

        if (context !== 'Фоновая задача' && context !== 'Пинг сервера') {
            this.showToast(`Ошибка: ${error?.message || 'Неизвестная ошибка'}`, 'error');
        }

        this.saveMetrics();
    },

    handleStateError: function() {
        this.showToast('Критическая ошибка, перезапуск...', 'error');
        setTimeout(() => this.reload(), 3000);
    },

    syncOfflineData: async function() {
        if (!navigator.onLine) return;
        console.log('🔄 Синхронизация офлайн-данных...');
        if (window.MORI_API) await MORI_API.processQueue();
        if (window.MORI_STORAGE) await MORI_STORAGE.processWriteQueue();
        this.trackEvent('sync');
    },

    checkForUpdates: async function() {
        if (!navigator.onLine) return;
        try {
            const response = await fetch('version.json?' + Date.now());
            if (response.ok) {
                const data = await response.json();
                if (data.version && data.version !== this.version) {
                    this.showToast('📦 Доступна новая версия', 'info', 10000);
                    this.trackEvent('update_available', { version: data.version });
                }
            }
        } catch (error) {
            // Файл version.json может отсутствовать — это нормально
            console.log('Проверка обновлений недоступна');
        }
    },

    onPageVisible: function() {
        console.log('👁️ Страница видна');
        this.syncOfflineData();
        this.trackEvent('page_visible');
    },

    onPageHidden: function() {
        console.log('👁️ Страница скрыта');
        this.saveMetrics();
        this.saveCheckpoint();
        this.trackEvent('page_hidden');
    },

    loadMetrics: function() {
        if (!window.MORI_STORAGE) return;
        const saved = MORI_STORAGE.get('app_metrics', {});
        if (saved) this.metrics = { ...this.metrics, ...saved };
        const analytics = MORI_STORAGE.get('analytics', {});
        if (analytics) this.analytics = { ...this.analytics, ...analytics };
    },

    saveMetrics: function() {
        if (!window.MORI_STORAGE) return;
        MORI_STORAGE.set('app_metrics', this.metrics);
        MORI_STORAGE.set('analytics', this.analytics);
    },

    getMetrics: function() {
        return {
            ...this.metrics,
            uptime: this.metrics.uptime,
            online: !this.state.offline,
            user: this.currentUser?.nickname || 'guest',
            accessLevel: this.accessLevel,
            experiments: Object.fromEntries(this.experiments),
            plugins: Array.from(this.plugins.keys())
        };
    },

    trackEvent: function(event, data = {}) {
        const entry = {
            event,
            data,
            timestamp: Date.now(),
            user: this.currentUser?.id,
            url: window.location.href,
            state: this.currentState
        };

        this.analytics.events.push(entry);
        this.analytics.lastActive = Date.now();

        if (navigator.onLine && MORI_API) {
            MORI_API.trackAnalytics?.(entry).catch(() => {});
        }

        if (this.analytics.events.length > 100) {
            this.analytics.events = this.analytics.events.slice(-100);
        }

        this.saveMetrics();
    },

    getEvents: function(type, limit = 50) {
        return this.analytics.events
            .filter(e => !type || e.event === type)
            .slice(-limit);
    },

    saveCheckpoint: function() {
        this.checkpoint = {
            user: this.currentUser,
            state: this.state,
            lastScreen: window.location.hash,
            experiments: Array.from(this.experiments.entries()),
            timestamp: Date.now()
        };
        localStorage.setItem('app_checkpoint', JSON.stringify(this.checkpoint));
    },

    restoreCheckpoint: async function() {
        const saved = localStorage.getItem('app_checkpoint');
        if (!saved) return false;

        try {
            const checkpoint = JSON.parse(saved);
            if (Date.now() - checkpoint.timestamp > 86400000) {
                localStorage.removeItem('app_checkpoint');
                return false;
            }

            this.currentUser = checkpoint.user;
            this.state = { ...this.state, ...checkpoint.state };
            if (checkpoint.experiments) this.experiments = new Map(checkpoint.experiments);
            if (checkpoint.lastScreen && checkpoint.lastScreen !== '#auth') {
                window.location.hash = checkpoint.lastScreen;
            }

            console.log('✅ Восстановлено из чекпоинта');
            return true;
        } catch (error) {
            console.error('❌ Ошибка восстановления:', error);
            return false;
        }
    },

    registerPlugin: function(name, plugin) {
        this.plugins.set(name, plugin);
        console.log(`🔌 Плагин ${name} зарегистрирован`);
    },

    unregisterPlugin: function(name) {
        this.plugins.delete(name);
    },

    getPlugin: function(name) {
        return this.plugins.get(name);
    },

    registerHook: function(hook, callback) {
        if (this.hooks[hook]) this.hooks[hook].push(callback);
    },

    runHooks: function(hook, ...args) {
        if (this.hooks[hook]) {
            this.hooks[hook].forEach(callback => {
                try {
                    callback(...args);
                } catch (error) {
                    console.error(`Ошибка в хуке ${hook}:`, error);
                }
            });
        }
    },

    canAccess: function(requiredLevel) {
        const levels = { guest: 0, user: 1, family: 2, admin: 3 };
        return levels[this.accessLevel] >= levels[requiredLevel];
    },

    getInfo: function() {
        return {
            version: this.version,
            user: this.currentUser?.nickname || null,
            level: this.accessLevel,
            online: !this.state.offline,
            initialized: this.state.initialized,
            uptime: this.metrics.uptime,
            state: this.currentState,
            plugins: Array.from(this.plugins.keys()),
            experiments: Object.fromEntries(this.experiments)
        };
    },

    clearAll: function() {
        if (window.MORI_STORAGE) MORI_STORAGE.clearAll();
        if (window.MORI_AUTH) MORI_AUTH.logout();
        localStorage.clear();
        sessionStorage.clear();
        this.trackEvent('clear_all');
        this.reload();
    },

    exportData: function() {
        const data = {
            version: this.version,
            metrics: this.metrics,
            analytics: this.analytics,
            experiments: Array.from(this.experiments.entries()),
            timestamp: Date.now()
        };

        if (window.MORI_STORAGE) {
            MORI_STORAGE.exportAll();
        } else {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mori_app_backup_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }

        this.trackEvent('export');
    },

    async importData(file) {
        if (window.MORI_STORAGE) {
            const result = await MORI_STORAGE.importAll(file);
            if (result) this.trackEvent('import');
            return result;
        } else {
            this.showToast('❌ Хранилище недоступно', 'error');
            return false;
        }
    }
};

// ========== CSS ДЛЯ ЗАГРУЗЧИКА ==========
const style = document.createElement('style');
style.textContent = `
    #app-loader {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(10px);
        transition: opacity 0.5s ease;
    }

    .loading-detailed {
        text-align: center;
        width: 300px;
    }

    .loading-logo {
        font-size: 32px;
        font-weight: bold;
        margin-bottom: 20px;
        color: #ffd700;
        text-shadow: 0 0 20px rgba(255,215,0,0.5);
        animation: pulse 2s infinite;
    }

    .loading-bar-container {
        width: 100%;
        height: 6px;
        background: rgba(255,255,255,0.1);
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 15px;
    }

    .loading-bar {
        height: 100%;
        background: linear-gradient(90deg, #ffd700, #ffaa00);
        transition: width 0.3s ease;
        box-shadow: 0 0 10px #ffd700;
    }

    .loading-text {
        color: #fff;
        font-size: 16px;
        margin-bottom: 8px;
    }

    .loading-details {
        color: #888;
        font-size: 12px;
    }

    .loading-version {
        color: #444;
        font-size: 11px;
        margin-top: 20px;
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
    }
`;

document.head.appendChild(style);

// ========== ЗАПУСК ==========
window.MORI_APP = MORI_APP;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MORI_APP.init());
} else {
    MORI_APP.init();
}

console.log('✅ APP загружен, методов:', Object.keys(MORI_APP).filter(k => typeof MORI_APP[k] === 'function').length);
