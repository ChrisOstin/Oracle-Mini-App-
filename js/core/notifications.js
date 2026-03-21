/**
 * CORE NOTIFICATIONS — УВЕДОМЛЕНИЯ
 * Версия: 4.0.0 (СТАБИЛЬНАЯ)
 */

const MORI_NOTIFICATIONS = {
    // ========== СОСТОЯНИЕ ==========
    state: {
        queue: [],
        history: [],
        soundEnabled: true,
        vibrationEnabled: true,
        pushEnabled: false,
        desktopEnabled: false,
        permission: 'default',
        unreadCount: 0,
        lastNotification: null
    },

    // ========== НАСТРОЙКИ ПО УМОЛЧАНИЮ ==========
    defaults: {
        duration: 5000,
        position: 'top-right',
        animation: 'fade',
        sound: null,
        vibration: 50,
        priority: 'normal',
        persistent: false
    },

    // ========== ТИПЫ УВЕДОМЛЕНИЙ ==========
    types: {
        success: { icon: '✅', color: '#10b981', sound: '/assets/sounds/success.mp3' },
        error: { icon: '❌', color: '#ef4444', sound: '/assets/sounds/error.mp3' },
        warning: { icon: '⚠️', color: '#f59e0b', sound: '/assets/sounds/warning.mp3' },
        info: { icon: 'ℹ️', color: '#3b82f6', sound: '/assets/sounds/info.mp3' },
        message: { icon: '💬', color: '#8b5cf6', sound: '/assets/sounds/message.mp3' },
        achievement: { icon: '🏆', color: '#fbbf24', sound: '/assets/sounds/achievement.mp3', duration: 7000 },
        level: { icon: '📈', color: '#6366f1', sound: '/assets/sounds/levelup.mp3', duration: 6000 }
    },

    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    init: function() {
        console.log('🔔 MORI_NOTIFICATIONS инициализация...');
        
        this.loadSettings();
        this.requestPermission();
        this.setupServiceWorker();
        this.startQueueProcessor();
        
        // Загружаем историю
        const savedHistory = MORI_STORAGE?.get('notification_history');
        if (savedHistory && Array.isArray(savedHistory)) {
            this.state.history = savedHistory;
        } else {
            this.state.history = [];
        }
        
        this.updateUnreadCount();
    },

    // ========== ЗАГРУЗКА НАСТРОЕК ==========
    loadSettings: function() {
        const settings = MORI_STORAGE?.get('notification_settings', {});
        this.state.soundEnabled = settings.soundEnabled ?? true;
        this.state.vibrationEnabled = settings.vibrationEnabled ?? true;
        this.state.pushEnabled = settings.pushEnabled ?? false;
        this.state.desktopEnabled = settings.desktopEnabled ?? false;
    },

    // ========== СОХРАНЕНИЕ НАСТРОЕК ==========
    saveSettings: function() {
        MORI_STORAGE?.set('notification_settings', {
            soundEnabled: this.state.soundEnabled,
            vibrationEnabled: this.state.vibrationEnabled,
            pushEnabled: this.state.pushEnabled,
            desktopEnabled: this.state.desktopEnabled
        });
    },

    // ========== ЗАПРОС РАЗРЕШЕНИЙ ==========
    requestPermission: async function() {
        if ('Notification' in window) {
            this.state.permission = Notification.permission;
            
            if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                const permission = await Notification.requestPermission();
                this.state.permission = permission;
            }
        }
    },

    // ========== НАСТРОЙКА SERVICE WORKER ==========
    setupServiceWorker: async function() {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker зарегистрирован');
                this.state.pushEnabled = true;
            } catch (error) {
                console.log('Service Worker не поддерживается');
            }
        }
    },

    // ========== ОСНОВНОЙ МЕТОД ==========
    show: function(message, type = 'info', options = {}) {
        const config = { ...this.types[type] || this.types.info, ...options };
        const duration = options.duration || config.duration || this.defaults.duration;
        const id = 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const notification = {
            id,
            message,
            type,
            icon: config.icon,
            color: config.color,
            duration,
            timestamp: Date.now(),
            read: false,
            ...options
        };
        
        // Добавляем в очередь
        this.state.queue.push(notification);
        
        // Сохраняем в историю
        if (!Array.isArray(this.state.history)) {
            this.state.history = [];
        }
        
        this.state.history.unshift(notification);
        if (this.state.history.length > 100) {
            this.state.history.pop();
        }
        
        MORI_STORAGE?.set('notification_history', this.state.history);
        
        this.state.unreadCount++;
        this.updateUnreadCount();
        
        // Воспроизводим звук
        if (this.state.soundEnabled && config.sound) {
            this.playSound(config.sound);
        }
        
        // Вибрация
        if (this.state.vibrationEnabled) {
            this.vibrate(options.vibration || this.defaults.vibration);
        }
        
        // Показываем в интерфейсе
        this.render(notification);
        
        // Автоматическое скрытие
        if (!options.persistent && !this.defaults.persistent) {
            setTimeout(() => this.hide(id), duration);
        }
        
        return id;
    },

    // ========== УСПЕХ ==========
    success: function(message, options = {}) {
        return this.show(message, 'success', options);
    },

    // ========== ОШИБКА ==========
    error: function(message, options = {}) {
        return this.show(message, 'error', { duration: 7000, ...options });
    },

    // ========== ПРЕДУПРЕЖДЕНИЕ ==========
    warning: function(message, options = {}) {
        return this.show(message, 'warning', options);
    },

    // ========== ИНФОРМАЦИЯ ==========
    info: function(message, options = {}) {
        return this.show(message, 'info', options);
    },

    // ========== СООБЩЕНИЕ ==========
    message: function(message, options = {}) {
        return this.show(message, 'message', { duration: 4000, ...options });
    },

    // ========== ДОСТИЖЕНИЕ ==========
    achievement: function(message, options = {}) {
        return this.show(message, 'achievement', { persistent: true, ...options });
    },

    // ========== ПОВЫШЕНИЕ УРОВНЯ ==========
    levelUp: function(message, options = {}) {
        return this.show(message, 'level', { persistent: true, ...options });
    },

    // ========== СКРЫТИЕ ==========
    hide: function(id) {
        const element = document.getElementById(`notification-${id}`);
        if (element) {
            element.classList.add('notification-hide');
            setTimeout(() => element.remove(), 300);
        }
        
        this.state.queue = this.state.queue.filter(n => n.id !== id);
    },

    // ========== СКРЫТИЕ ВСЕХ ==========
    hideAll: function() {
        this.state.queue.forEach(n => this.hide(n.id));
    },

    // ========== ОТМЕТКА КАК ПРОЧИТАННОЕ ==========
    markAsRead: function(id) {
        const notification = this.state.history.find(n => n.id === id);
        if (notification && !notification.read) {
            notification.read = true;
            this.updateUnreadCount();
            MORI_STORAGE?.set('notification_history', this.state.history);
        }
    },

    // ========== ОТМЕТКА ВСЕХ КАК ПРОЧИТАННЫХ ==========
    markAllAsRead: function() {
        this.state.history.forEach(n => n.read = true);
        this.state.unreadCount = 0;
        MORI_STORAGE?.set('notification_history', this.state.history);
        this.updateUnreadCount();
    },

    // ========== ОБНОВЛЕНИЕ СЧЁТЧИКА ==========
    updateUnreadCount: function() {
        if (!Array.isArray(this.state.history)) {
            this.state.history = [];
        }
        
        this.state.unreadCount = this.state.history.filter(n => !n.read).length;
        
        const badge = document.getElementById('notification-badge');
        if (badge) {
            if (this.state.unreadCount > 0) {
                badge.textContent = this.state.unreadCount > 9 ? '9+' : this.state.unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    },

    // ========== РЕНДЕР ==========
    render: function(notification) {
        const container = this.getContainer(notification.options?.position || this.defaults.position);
        
        const element = document.createElement('div');
        element.id = `notification-${notification.id}`;
        element.className = `notification notification-${notification.type}`;
        element.style.backgroundColor = notification.color + '20';
        element.style.borderLeft = `4px solid ${notification.color}`;
        
        element.innerHTML = `
            <div class="notification-icon">${notification.icon}</div>
            <div class="notification-content">
                <div class="notification-message">${notification.message}</div>
                ${notification.description ? `<div class="notification-description">${notification.description}</div>` : ''}
            </div>
            <button class="notification-close">✕</button>
        `;
        
        element.querySelector('.notification-close').onclick = (e) => {
            e.stopPropagation();
            this.hide(notification.id);
        };
        
        container.appendChild(element);
        setTimeout(() => element.classList.add('notification-show'), 10);
    },

    // ========== КОНТЕЙНЕР ==========
    getContainer: function(position) {
        let container = document.getElementById(`notification-container-${position}`);
        
        if (!container) {
            container = document.createElement('div');
            container.id = `notification-container-${position}`;
            container.className = `notification-container notification-container-${position}`;
            document.body.appendChild(container);
        }
        
        return container;
    },

    // ========== ЗВУК ==========
    playSound: function(soundUrl) {
        if (!soundUrl || !this.state.soundEnabled) return;
        
        const audio = new Audio(soundUrl);
        audio.volume = 0.5;
        audio.play().catch(() => {});
    },

    // ========== ВИБРАЦИЯ ==========
    vibrate: function(pattern) {
        if ('vibrate' in navigator && this.state.vibrationEnabled) {
            navigator.vibrate(pattern);
        }
    },

    // ========== ДЕСКТОПНОЕ УВЕДОМЛЕНИЕ ==========
    showDesktop: function(message, config) {
        if (this.state.permission !== 'granted' || !this.state.desktopEnabled) return;
        
        const notification = new Notification('MORI Oracle', {
            body: message,
            icon: '/assets/icons/icon-192.png',
            badge: '/assets/icons/icon-72.png',
            tag: 'mori-notification'
        });
        
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    },

    // ========== ИСТОРИЯ ==========
    getHistory: function(limit = 50) {
        if (!Array.isArray(this.state.history)) {
            this.state.history = [];
        }
        return this.state.history.slice(0, limit);
    },

    // ========== ОЧИСТКА ИСТОРИИ ==========
    clearHistory: function() {
        this.state.history = [];
        this.state.unreadCount = 0;
        MORI_STORAGE?.remove('notification_history');
        this.updateUnreadCount();
    },

    // ========== ПЕРЕКЛЮЧЕНИЕ ЗВУКА ==========
    toggleSound: function(enabled) {
        this.state.soundEnabled = enabled !== undefined ? enabled : !this.state.soundEnabled;
        this.saveSettings();
    },

    // ========== ПЕРЕКЛЮЧЕНИЕ ВИБРАЦИИ ==========
    toggleVibration: function(enabled) {
        this.state.vibrationEnabled = enabled !== undefined ? enabled : !this.state.vibrationEnabled;
        this.saveSettings();
    },

    // ========== ОБРАБОТКА ОЧЕРЕДИ ==========
    startQueueProcessor: function() {
        setInterval(() => {}, 1000);
    }
};

// ========== CSS ==========
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `...`;
document.head.appendChild(notificationStyle);
style.textContent = `
    .notification-container {
        position: fixed;
        z-index: 9999;
        pointer-events: none;
    }
    
    .notification-container-top-right {
        top: 20px;
        right: 20px;
    }
    
    .notification-container-top-left {
        top: 20px;
        left: 20px;
    }
    
    .notification-container-bottom-right {
        bottom: 20px;
        right: 20px;
    }
    
    .notification-container-bottom-left {
        bottom: 20px;
        left: 20px;
    }
    
    .notification-container-top-center {
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
    }
    
    .notification {
        position: relative;
        width: 320px;
        margin-bottom: 10px;
        padding: 16px;
        border-radius: 12px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        pointer-events: auto;
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s ease;
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255,255,255,0.1);
        cursor: pointer;
    }
    
    .notification-show {
        transform: translateX(0);
        opacity: 1;
    }
    
    .notification-hide {
        transform: translateX(100%);
        opacity: 0;
    }
    
    .notification-icon {
        font-size: 24px;
        line-height: 1;
    }
    
    .notification-content {
        flex: 1;
    }
    
    .notification-message {
        font-weight: 500;
        color: #ffffff;
        margin-bottom: 4px;
    }
    
    .notification-description {
        font-size: 14px;
        color: rgba(255,255,255,0.7);
    }
    
    .notification-close {
        position: absolute;
        top: 12px;
        right: 12px;
        background: none;
        border: none;
        color: rgba(255,255,255,0.5);
        font-size: 16px;
        cursor: pointer;
        padding: 4px;
        transition: color 0.2s;
    }
    
    .notification-close:hover {
        color: #ffffff;
    }
    
    #notification-badge {
        position: absolute;
        top: -5px;
        right: -5px;
        background: #ef4444;
        color: white;
        font-size: 12px;
        min-width: 18px;
        height: 18px;
        border-radius: 9px;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 0 4px;
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
`;

document.head.appendChild(style);

// ========== ЗАПУСК ==========
window.MORI_NOTIFICATIONS = MORI_NOTIFICATIONS;

console.log('✅ NOTIFICATIONS загружен, методов:', Object.keys(MORI_NOTIFICATIONS).filter(k => typeof MORI_NOTIFICATIONS[k] === 'function').length);
