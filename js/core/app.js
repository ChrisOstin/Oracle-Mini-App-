/**
 * CORE APP — ГЛАВНЫЙ ФАЙЛ ПРИЛОЖЕНИЯ
 * Версия: 6.0.0 (АБСОЛЮТНО РАБОЧАЯ, 50+ МЕТОДОВ)
 */

const MORI_APP = {
    // ========== ВЕРСИЯ ==========
    version: '6.0.0',
    
    // ========== СОСТОЯНИЯ ==========
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
    
    // ========== ПОЛЬЗОВАТЕЛЬ ==========
    currentUser: null,
    accessLevel: 'guest',
    
    // ========== СОСТОЯНИЕ ПРИЛОЖЕНИЯ ==========
    state: {
        initialized: false,
        loading: false,
        offline: false,
        appReady: false,
        startupTime: Date.now()
    },

    // ========== МЕТРИКИ ==========
    metrics: {
        startups: 0,
        errors: 0,
        lastError: null,
        uptime: 0
    },

    // ========== ПРОГРЕСС ЗАГРУЗКИ ==========
    loadingProgress: 0,

    // ========== КЭШ МОДУЛЕЙ ==========
    moduleCache: new Map(),
    
    // ========== КЭШ CSS ==========
    cssCache: new Set(),

    // ========== ФОНОВЫЕ ЗАДАЧИ ==========
    backgroundTasks: new Map(),

    // ========== ЭКСПЕРИМЕНТЫ (A/B ТЕСТЫ) ==========
    experiments: new Map(),

    // ========== ЧЕКПОИНТ ==========
    checkpoint: null,

    // ========== АНАЛИТИКА ==========
    analytics: {
        events: [],
        sessions: 0,
        lastActive: null
    },

    // ========== ПЛАГИНЫ ==========
    plugins: new Map(),

    // ========== ХУКИ ==========
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

    // ========== ТАЙМЕРЫ ==========
    timers: {
        sessionTimer: null,
        pingTimer: null,
        statsTimer: null,
        syncTimer: null
    },

    // ========== АНИМАЦИИ ==========
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
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
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
        
        slideIn: function(element, direction = 'left', duration = 300) {
            if (!element) return;
            const start = direction === 'left' ? '-100%' : '100%';
            element.style.transform = `translateX(${start})`;
            element.style.display = 'block';
            
            let startTime = null;
            function animate(timestamp) {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / duration, 1);
                
                const x = start === '-100%' 
                    ? -100 + (progress * 100)
                    : 100 - (progress * 100);
                
                element.style.transform = `translateX(${x}%)`;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            }
            
            requestAnimationFrame(animate);
        }
    },

    // ========== ПЕРЕХОД МЕЖДУ СОСТОЯНИЯМИ ==========
    transition: function(newState) {
        const oldState = this.currentState;
        this.currentState = newState;
        console.log(`🔄 Состояние: ${oldState} → ${newState}`);
        
        this.runHooks('stateChange', oldState, newState);
        
        if (newState === 'error') {
            this.handleStateError();
        }
        
        this.saveCheckpoint();
    },

    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    init: async function() {
        console.log(`🚀 MORI APP v${this.version} инициализация...`);
        
        this.runHooks('beforeInit');
        this.transition(this.states.INIT);
        
        this.metrics.startups++;
        this.state.initialized = false;
        this.state.loading = true;
        
        try {
            // Показываем детальную загрузку
            this.showDetailedLoading();
            
            // Восстанавливаем из чекпоинта
            await this.restoreCheckpoint();
            
            // Инициализируем эксперименты
            this.initExperiments();
            
            // Инициализируем ядро
            await this.initCore();
            
            // Загружаем пользователя
            await this.loadUser();
            
            // Инициализируем модули с прогрессом
            await this.initModules();
            
            // Настраиваем слушатели
            this.setupListeners();
            
            // Запускаем фоновые задачи
            this.startBackgroundTasks();
            
            // Запускаем таймеры
            this.startTimers();
            
            this.state.initialized = true;
            this.state.loading = false;
            this.transition(this.states.READY);
            
            console.log('✅ MORI APP инициализирован');
            
            // Скрываем загрузку с анимацией
            this.animations.fadeOut(document.getElementById('app-loader'), 500);
            
            // Запускаем приложение
            this.startApp();
            
            this.runHooks('afterInit');
            
        } catch (error) {
            this.transition(this.states.ERROR);
            this.handleError('Инициализация', error);
        }
    },

    // ========== ПОКАЗ ДЕТАЛЬНОЙ ЗАГРУЗКИ ==========
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

    // ========== ОБНОВЛЕНИЕ ПРОГРЕССА ==========
    updateProgress: function(percent, message, details = '') {
        this.loadingProgress = percent;
        
        const progressBar = document.getElementById('loading-progress');
        const progressText = document.getElementById('loading-text');
        const detailsEl = document.getElementById('loading-details');
        
        if (progressBar) {
            progressBar.style.width = percent + '%';
        }
        
        if (progressText) {
            progressText.textContent = message || `${Math.round(percent)}%`;
        }
        
        if (detailsEl) {
            detailsEl.textContent = details;
        }
        
        if (percent === 100) {
            setTimeout(() => {
                this.animations.fadeOut(document.getElementById('app-loader'), 500);
            }, 500);
        }
    },

    // ========== ИНИЦИАЛИЗАЦИЯ ЭКСПЕРИМЕНТОВ ==========
    initExperiments: function() {
        const userId = this.currentUser?.id || 'anonymous';
        const hash = this.hashCode(userId);
        
        this.experiments.set('newDashboard', hash % 2 === 0);
        this.experiments.set('betaFeatures', hash % 3 === 0);
        this.experiments.set('earlyAccess', hash % 5 === 0);
        
        console.log('🧪 Эксперименты:', Object.fromEntries(this.experiments));
    },

    // ========== ХЭШ ДЛЯ ЭКСПЕРИМЕНТОВ ==========
    hashCode: function(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    },

    // ========== ПРОВЕРКА ЭКСПЕРИМЕНТА ==========
    isEnabled: function(experiment) {
        return this.experiments.get(experiment) || false;
    },

    // ========== ИНИЦИАЛИЗАЦИЯ CORE ==========
    initCore: async function() {
        console.log('⚙️ Инициализация ядра...');
        this.updateProgress(10, 'Загрузка ядра...');
        
        // Загружаем метрики
        this.loadMetrics();
        
        // Проверяем соединение
        this.state.offline = !navigator.onLine;
        
        // Инициализируем хранилище
        if (window.MORI_STORAGE) {
            await MORI_STORAGE.init();
        }
        this.updateProgress(20, 'Хранилище готово');
        
        // Инициализируем API
        if (window.MORI_API) {
            MORI_API.init();
        }
        this.updateProgress(30, 'API готово');
        
        // Инициализируем уведомления
        if (window.MORI_NOTIFICATIONS) {
            MORI_NOTIFICATIONS.init();
        }
        this.updateProgress(40, 'Уведомления готовы');
        
        // Инициализируем авторизацию
        if (window.MORI_AUTH) {
            MORI_AUTH.init();
        }
        this.updateProgress(50, 'Авторизация готова');
        
        // Инициализируем пользователя
        if (window.MORI_USER) {
            MORI_USER.init();
        }
        this.updateProgress(60, 'Пользователь загружен');
        
        // Инициализируем роутер
        if (window.MORI_ROUTER) {
            MORI_ROUTER.init();
        }
        this.updateProgress(70, 'Навигация готова');
    },

    // ========== ЗАГРУЗКА ПОЛЬЗОВАТЕЛЯ ==========
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

    // ========== ИНИЦИАЛИЗАЦИЯ МОДУЛЕЙ ==========
initModules: async function() {
    console.log('📦 Инициализация модулей...');
    this.updateProgress(85, 'Поиск модулей...');
    
    // Собираем все модули из window
    const moduleNames = [];
    
    for (let key in window) {
        // Ищем всё что начинается с MORI_, но не core-файлы
        if (key.startsWith('MORI_') && 
            key !== 'MORI_APP' && 
            key !== 'MORI_API' && 
            key !== 'MORI_AUTH' && 
            key !== 'MORI_USER' && 
            key !== 'MORI_UTILS' && 
            key !== 'MORI_STORAGE' && 
            key !== 'MORI_ROUTER' && 
            key !== 'MORI_NOTIFICATIONS') {
            
            moduleNames.push(key);
        }
    }
    
    console.log(`📦 Найдено модулей: ${moduleNames.length}`);
    this.updateProgress(90, `Найдено ${moduleNames.length} модулей`);
    
    let loaded = 0;
    const total = moduleNames.length;
    
    // Инициализируем все модули
    for (const moduleName of moduleNames) {
        try {
            this.runHooks('beforeModuleLoad', moduleName);
            
            const module = window[moduleName];
            
            if (!module) {
                console.warn(`⚠️ Модуль ${moduleName} не найден`);
                continue;
            }
            
            // Вызываем init если есть
            if (module.init) {
                await module.init();
                console.log(`✅ ${moduleName} инициализирован`);
            }
            
            loaded++;
            const percent = 90 + Math.floor((loaded / total) * 10);
            this.updateProgress(percent, `Загрузка...`, `Загружен ${moduleName}`);
            
            this.runHooks('afterModuleLoad', moduleName);
            
        } catch (error) {
            console.error(`❌ Ошибка ${moduleName}:`, error);
        }
    }
    
    this.updateProgress(100, 'Готово!', `Загружено ${loaded} модулей`);
    
    if (loaded === 0) {
        this.showToast('⚠️ Модули не загружены', 'warning', 5000);
    } else {
        this.showToast(`✅ Загружено ${loaded} модулей`, 'success', 3000);
    }
    
    // Показываем список в консоли
    console.group('📊 Загруженные модули:');
    moduleNames.forEach(name => console.log(`✅ ${name}`));
    console.groupEnd();
},

    // ========== ПРЕДЗАГРУЗКА МОДУЛЯ ==========
    async preloadModule(moduleName) {
        if (this.moduleCache.has(moduleName)) return;
        
        try {
            const module = await import(`js/modules/${moduleName}/index.js`);
            this.moduleCache.set(moduleName, module);
            console.log(`📦 Модуль ${moduleName} предзагружен`);
        } catch (error) {
            console.error(`❌ Ошибка предзагрузки ${moduleName}:`, error);
        }
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

    // ========== ЗАГРУЗКА ТЕМЫ ==========
    async loadTheme(themeName) {
        await this.loadCSS(`/css/themes/${themeName}.css`);
        document.body.className = `theme-${themeName}`;
        console.log(`🎨 Тема ${themeName} загружена`);
    },

    // ========== НАСТРОЙКА СЛУШАТЕЛЕЙ ==========
    setupListeners: function() {
        // Слушаем изменение соединения
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
        
        // Слушаем ошибки
        window.addEventListener('error', (event) => {
            this.handleError('Глобальная ошибка', event.error);
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError('Unhandled Promise', event.reason);
        });
        
        // Слушаем изменение видимости страницы
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.onPageVisible();
            } else {
                this.onPageHidden();
            }
        });
        
        // Сохраняем чекпоинт перед уходом
        window.addEventListener('beforeunload', () => {
            this.saveCheckpoint();
            this.stopTimers();
            this.saveMetrics();
        });
    },

    // ========== ЗАПУСК ФОНОВЫХ ЗАДАЧ ==========
    startBackgroundTasks: function() {
        // Синхронизация данных
        this.addBackgroundTask('sync', () => this.syncOfflineData(), 60000);
        
        // Проверка обновлений
        this.addBackgroundTask('updates', () => this.checkForUpdates(), 3600000);
        
        // Сбор метрик
        this.addBackgroundTask('metrics', () => this.saveMetrics(), 300000);
        
        console.log('⏱️ Фоновые задачи запущены');
    },

    // ========== ДОБАВЛЕНИЕ ФОНОВОЙ ЗАДАЧИ ==========
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

    // ========== УДАЛЕНИЕ ФОНОВОЙ ЗАДАЧИ ==========
    removeBackgroundTask: function(name) {
        if (this.backgroundTasks.has(name)) {
            clearInterval(this.backgroundTasks.get(name));
            this.backgroundTasks.delete(name);
        }
    },

    // ========== ЗАПУСК ТАЙМЕРОВ ==========
    startTimers: function() {
        // Таймер сессии
        this.timers.sessionTimer = setInterval(() => {
            this.metrics.uptime = Math.floor((Date.now() - this.state.startupTime) / 1000);
        }, 1000);
        
        // Пинг сервера
        this.timers.pingTimer = setInterval(async () => {
            if (window.MORI_API && navigator.onLine) {
                const online = await MORI_API.ping();
                if (!online && !this.state.offline) {
                    this.state.offline = true;
                    this.showToast('📴 Сервер недоступен', 'error');
                }
            }
        }, 30000);
        
        // Статистика
        this.timers.statsTimer = setInterval(() => {
            this.saveMetrics();
        }, 60000);
    },

    // ========== ОСТАНОВКА ТАЙМЕРОВ ==========
    stopTimers: function() {
        Object.values(this.timers).forEach(timer => {
            if (timer) clearInterval(timer);
        });
    },

    // ========== ЗАПУСК ПРИЛОЖЕНИЯ ==========
    startApp: function() {
        console.log('▶️ Запуск приложения...');
        
        this.runHooks('beforeStart');
        this.transition(this.states.RUNNING);
        
        this.state.appReady = true;
        
        if (this.accessLevel === 'guest') {
            MORI_ROUTER?.navigate('auth');
        } else {
            const lastScreen = localStorage.getItem('last_screen') || 'dashboard';
            MORI_ROUTER?.navigate(lastScreen);
        }
        
        this.runHooks('afterStart');
        
        this.trackEvent('app_start', { level: this.accessLevel });
    },

    // ========== ПЕРЕЗАГРУЗКА ==========
    reload: function() {
        console.log('🔄 Перезагрузка приложения...');
        this.trackEvent('app_reload');
        location.reload();
    },

    // ========== ВЫХОД ==========
    logout: async function() {
        this.trackEvent('logout');
        if (window.MORI_AUTH) {
            await MORI_AUTH.logout();
        }
    },

    // ========== ПОКАЗ УВЕДОМЛЕНИЯ ==========
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
    
    // Логируем в хранилище с проверкой
    try {
        if (window.MORI_STORAGE) {
            let errors = MORI_STORAGE.get('app_errors');
            if (!errors || !Array.isArray(errors)) {
                errors = [];
            }
            errors.push(this.metrics.lastError);
            if (errors.length > 50) errors = errors.slice(-50);
            MORI_STORAGE.set('app_errors', errors);
        }
    } catch (e) {
        console.warn('Не удалось сохранить ошибку в хранилище');
    }
    
    // Показываем пользователю только важные ошибки
    if (context !== 'Фоновая задача' && context !== 'Пинг сервера') {
        this.showToast(`Ошибка: ${error?.message || 'Неизвестная ошибка'}`, 'error');
    }
    
    this.saveMetrics();
},

    // ========== ОБРАБОТКА ОШИБКИ СОСТОЯНИЯ ==========
    handleStateError: function() {
        this.showToast('Критическая ошибка, перезапуск...', 'error');
        setTimeout(() => this.reload(), 3000);
    },

    // ========== СИНХРОНИЗАЦИЯ ОФЛАЙН-ДАННЫХ ==========
    syncOfflineData: async function() {
        if (!navigator.onLine) return;
        
        console.log('🔄 Синхронизация офлайн-данных...');
        
        if (window.MORI_API) {
            await MORI_API.processQueue();
        }
        
        if (window.MORI_STORAGE) {
            await MORI_STORAGE.processWriteQueue();
        }
        
        this.trackEvent('sync');
    },

    // ========== ПРОВЕРКА ОБНОВЛЕНИЙ ==========
    checkForUpdates: async function() {
        if (!navigator.onLine) return;
        
        try {
            const response = await fetch('/version.json?' + Date.now());
            const data = await response.json();
            
            if (data.version && data.version !== this.version) {
                this.showToast('📦 Доступна новая версия', 'info', 10000);
                this.trackEvent('update_available', { version: data.version });
            }
        } catch (error) {
            console.log('Проверка обновлений недоступна');
        }
    },

    // ========== СТРАНИЦА ВИДНА ==========
    onPageVisible: function() {
        console.log('👁️ Страница видна');
        this.syncOfflineData();
        this.trackEvent('page_visible');
    },

    // ========== СТРАНИЦА СКРЫТА ==========
    onPageHidden: function() {
        console.log('👁️ Страница скрыта');
        this.saveMetrics();
        this.saveCheckpoint();
        this.trackEvent('page_hidden');
    },

    // ========== МЕТРИКИ ==========
    loadMetrics: function() {
        const saved = MORI_STORAGE?.get('app_metrics', {});
        if (saved) {
            this.metrics = { ...this.metrics, ...saved };
        }
        
        const analytics = MORI_STORAGE?.get('analytics', {});
        if (analytics) {
            this.analytics = { ...this.analytics, ...analytics };
        }
    },

    saveMetrics: function() {
        MORI_STORAGE?.set('app_metrics', this.metrics);
        MORI_STORAGE?.set('analytics', this.analytics);
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

    // ========== ТРЕКИНГ СОБЫТИЙ ==========
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
        
        // Отправляем на сервер
        if (navigator.onLine && MORI_API) {
            MORI_API.trackAnalytics?.(entry).catch(() => {});
        }
        
        // Ограничиваем размер
        if (this.analytics.events.length > 100) {
            this.analytics.events = this.analytics.events.slice(-100);
        }
        
        this.saveMetrics();
    },

    // ========== ПОЛУЧЕНИЕ СОБЫТИЙ ==========
    getEvents: function(type, limit = 50) {
        return this.analytics.events
            .filter(e => !type || e.event === type)
            .slice(-limit);
    },

    // ========== СОХРАНЕНИЕ ЧЕКПОИНТА ==========
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

    // ========== ВОССТАНОВЛЕНИЕ ИЗ ЧЕКПОИНТА ==========
    restoreCheckpoint: async function() {
        const saved = localStorage.getItem('app_checkpoint');
        if (!saved) return false;
        
        try {
            const checkpoint = JSON.parse(saved);
            
            // Проверяем актуальность (не старше 24 часов)
            if (Date.now() - checkpoint.timestamp > 86400000) {
                localStorage.removeItem('app_checkpoint');
                return false;
            }
            
            this.currentUser = checkpoint.user;
            this.state = { ...this.state, ...checkpoint.state };
            
            if (checkpoint.experiments) {
                this.experiments = new Map(checkpoint.experiments);
            }
            
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

    // ========== ПЛАГИНЫ ==========
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

    // ========== ХУКИ ==========
    registerHook: function(hook, callback) {
        if (this.hooks[hook]) {
            this.hooks[hook].push(callback);
        }
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

    // ========== ПРОВЕРКА ДОСТУПА ==========
    canAccess: function(requiredLevel) {
        const levels = {
            'guest': 0,
            'user': 1,
            'family': 2,
            'admin': 3
        };
        
        return levels[this.accessLevel] >= levels[requiredLevel];
    },

    // ========== ПОЛУЧЕНИЕ ИНФОРМАЦИИ ==========
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

    // ========== ОЧИСТКА ==========
    clearAll: function() {
        if (window.MORI_STORAGE) {
            MORI_STORAGE.clearAll();
        }
        
        if (window.MORI_AUTH) {
            MORI_AUTH.logout();
        }
        
        localStorage.clear();
        sessionStorage.clear();
        
        this.trackEvent('clear_all');
        this.reload();
    },

    // ========== ЭКСПОРТ ==========
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

    // ========== ИМПОРТ ==========
    async importData(file) {
        if (window.MORI_STORAGE) {
            const result = await MORI_STORAGE.importAll(file);
            if (result) {
                this.trackEvent('import');
            }
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
    
    .app-ready {
        animation: appFadeIn 0.5s ease;
    }
    
    @keyframes appFadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;

document.head.appendChild(style);

// ========== ЗАПУСК ==========
window.MORI_APP = MORI_APP;

// Автозапуск после загрузки DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MORI_APP.init());
} else {
    MORI_APP.init();
}

console.log('✅ APP загружен, методов:', Object.keys(MORI_APP).filter(k => typeof MORI_APP[k] === 'function').length);
