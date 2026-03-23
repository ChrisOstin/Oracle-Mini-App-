/**
 * CORE NOTIFICATIONS — УВЕДОМЛЕНИЯ
 * Версия: 6.0.0 (С ТЕМОЙ, АНИМАЦИЯМИ, СВЕЧЕНИЕМ)
 */

const MORI_NOTIFICATIONS = {
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

    defaults: {
        duration: 10000,
        position: 'top-center',
        animation: 'slide',
        sound: null,
        vibration: 50,
        priority: 'normal',
        persistent: false
    },

    types: {
        success: { icon: '✅', color: '#10b981', sound: '/assets/sounds/success.mp3', animation: 'bounceIn' },
        error: { icon: '❌', color: '#ef4444', sound: '/assets/sounds/error.mp3', animation: 'shake' },
        warning: { icon: '⚠️', color: '#f59e0b', sound: '/assets/sounds/warning.mp3', animation: 'pulse' },
        info: { icon: 'ℹ️', color: '#3b82f6', sound: '/assets/sounds/info.mp3', animation: 'fadeIn' },
        message: { icon: '💬', color: '#8b5cf6', sound: '/assets/sounds/message.mp3', animation: 'slideIn' },
        reply: { icon: '💬', color: '#8b5cf6', sound: '/assets/sounds/message.mp3', duration: 10000, animation: 'slideIn' },
        achievement: { icon: '🏆', color: '#fbbf24', sound: '/assets/sounds/achievement.mp3', duration: 10000, animation: 'bounceIn' },
        level: { icon: '📈', color: '#6366f1', sound: '/assets/sounds/levelup.mp3', duration: 10000, animation: 'pulse' }
    },

    init: function() {
        console.log('🔔 MORI_NOTIFICATIONS инициализация...');
        this.loadSettings();
        this.requestPermission();
        this.setupServiceWorker();
        this.startQueueProcessor();
        const savedHistory = MORI_STORAGE?.get('notification_history');
        this.state.history = (savedHistory && Array.isArray(savedHistory)) ? savedHistory : [];
        this.updateUnreadCount();
    },

    loadSettings: function() {
        const settings = MORI_STORAGE?.get('notification_settings', {});
        this.state.soundEnabled = settings.soundEnabled ?? true;
        this.state.vibrationEnabled = settings.vibrationEnabled ?? true;
        this.state.pushEnabled = settings.pushEnabled ?? false;
        this.state.desktopEnabled = settings.desktopEnabled ?? false;
    },

    saveSettings: function() {
        MORI_STORAGE?.set('notification_settings', {
            soundEnabled: this.state.soundEnabled,
            vibrationEnabled: this.state.vibrationEnabled,
            pushEnabled: this.state.pushEnabled,
            desktopEnabled: this.state.desktopEnabled
        });
    },

    requestPermission: async function() {
        if ('Notification' in window) {
            this.state.permission = Notification.permission;
            if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                this.state.permission = await Notification.requestPermission();
            }
        }
    },

    setupServiceWorker: async function() {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            try {
                await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker зарегистрирован');
                this.state.pushEnabled = true;
            } catch (error) {
                console.log('Service Worker не поддерживается');
            }
        }
    },

    show: function(message, type = 'info', options = {}) {
        const config = { ...this.types[type] || this.types.info, ...options };
        const duration = options.duration || config.duration || this.defaults.duration;
        const id = 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const action = options.action || null;
        const replyable = options.replyable || false;
        const onReply = options.onReply || null;
        const animation = config.animation || this.defaults.animation;

        const notification = {
            id, message, type,
            icon: config.icon,
            color: config.color,
            duration,
            timestamp: Date.now(),
            read: false,
            action,
            replyable,
            onReply,
            animation,
            ...options
        };

        this.state.queue.push(notification);
        this.state.history.unshift(notification);
        if (this.state.history.length > 100) this.state.history.pop();
        MORI_STORAGE?.set('notification_history', this.state.history);
        this.state.unreadCount++;
        this.updateUnreadCount();

        if (this.state.soundEnabled && config.sound) this.playSound(config.sound);
        if (this.state.vibrationEnabled) this.vibrate(options.vibration || this.defaults.vibration);
        this.render(notification);

        if (!options.persistent && !this.defaults.persistent) {
            setTimeout(() => this.hide(id), duration);
        }
        return id;
    },

    success: function(message, options = {}) { return this.show(message, 'success', options); },
    error: function(message, options = {}) { return this.show(message, 'error', { duration: 7000, ...options }); },
    warning: function(message, options = {}) { return this.show(message, 'warning', options); },
    info: function(message, options = {}) { return this.show(message, 'info', options); },
    message: function(message, options = {}) { return this.show(message, 'message', { duration: 4000, ...options }); },
    reply: function(message, options = {}) { return this.show(message, 'reply', { duration: 10000, persistent: true, replyable: true, ...options }); },
    achievement: function(message, options = {}) { return this.show(message, 'achievement', { persistent: true, ...options }); },
    levelUp: function(message, options = {}) { return this.show(message, 'level', { persistent: true, ...options }); },

    hide: function(id) {
        const element = document.getElementById(`notification-${id}`);
        if (element) {
            element.classList.add('notification-hide');
            setTimeout(() => element.remove(), 300);
        }
        this.state.queue = this.state.queue.filter(n => n.id !== id);
    },

    hideAll: function() { this.state.queue.forEach(n => this.hide(n.id)); },

    markAsRead: function(id) {
        const notification = this.state.history.find(n => n.id === id);
        if (notification && !notification.read) {
            notification.read = true;
            this.updateUnreadCount();
            MORI_STORAGE?.set('notification_history', this.state.history);
        }
    },

    markAllAsRead: function() {
        this.state.history.forEach(n => n.read = true);
        this.state.unreadCount = 0;
        MORI_STORAGE?.set('notification_history', this.state.history);
        this.updateUnreadCount();
    },

    updateUnreadCount: function() {
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

    render: function(notification) {
        const container = this.getContainer(notification.options?.position || this.defaults.position);
        const element = document.createElement('div');
        element.id = `notification-${notification.id}`;
        element.className = `notification notification-${notification.type}`;
        element.style.borderLeft = `4px solid ${notification.color}`;
        element.style.backgroundColor = 'var(--bg-card, rgba(0,0,0,0.9))';
        element.style.backdropFilter = 'blur(10px)';

        element.innerHTML = `
            <div class="notification-icon">${notification.icon}</div>
            <div class="notification-content">
                <div class="notification-message">${notification.message}</div>
                ${notification.description ? `<div class="notification-description">${notification.description}</div>` : ''}
            </div>
            <button class="notification-close">✕</button>
        `;

        // Добавляем поле ввода с самолётиком для replyable уведомлений
        if (notification.replyable) {
            const inputContainer = document.createElement('div');
            inputContainer.style.display = 'flex';
            inputContainer.style.gap = '8px';
            inputContainer.style.marginTop = '8px';
            
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Ответить...';
            input.className = 'notification-input';
            input.style.flex = '1';
            input.style.padding = '8px';
            input.style.borderRadius = '8px';
            input.style.border = '1px solid rgba(255,215,0,0.3)';
            input.style.background = 'rgba(0,0,0,0.5)';
            input.style.color = '#fff';
            input.style.fontSize = '14px';
            input.style.outline = 'none';
            input.style.transition = 'all 0.2s';
            
            input.addEventListener('focus', () => {
                input.style.boxShadow = '0 0 8px var(--accent-primary, #ffd700)';
                input.style.borderColor = 'var(--accent-primary, #ffd700)';
            });
            
            input.addEventListener('blur', () => {
                input.style.boxShadow = 'none';
                input.style.borderColor = 'rgba(255,215,0,0.3)';
            });
            
            const sendBtn = document.createElement('button');
            sendBtn.textContent = '📤';
            sendBtn.style.background = 'rgba(255,215,0,0.2)';
            sendBtn.style.border = 'none';
            sendBtn.style.borderRadius = '8px';
            sendBtn.style.padding = '8px 12px';
            sendBtn.style.cursor = 'pointer';
            sendBtn.style.fontSize = '16px';
            sendBtn.style.transition = 'all 0.2s';
            
            sendBtn.onmouseenter = () => {
                sendBtn.style.background = 'rgba(255,215,0,0.4)';
            };
            sendBtn.onmouseleave = () => {
                sendBtn.style.background = 'rgba(255,215,0,0.2)';
            };
            
            const sendMessage = () => {
                if (input.value.trim()) {
                    if (notification.onReply) {
                        notification.onReply(input.value.trim());
                    }
                    this.hide(notification.id);
                }
            };
            
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
            
            sendBtn.addEventListener('click', () => {
                sendMessage();
            });
            
            inputContainer.appendChild(input);
            inputContainer.appendChild(sendBtn);
            element.querySelector('.notification-content').appendChild(inputContainer);
        }

        // Клик по уведомлению — переход в модуль
        element.addEventListener('click', (e) => {
            if (e.target.classList.contains('notification-close')) return;
            if (e.target.classList.contains('notification-input')) return;
            if (e.target.tagName === 'BUTTON') return;
            if (notification.action && window.MORI_ROUTER) {
                this.hide(notification.id);
                MORI_ROUTER.navigate(notification.action);
            }
        });

        // Свайп вверх для закрытия
        let touchStartY = 0;
        element.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        });
        
        element.addEventListener('touchend', (e) => {
            const touchEndY = e.changedTouches[0].clientY;
            if (touchStartY - touchEndY > 50) {
                this.hide(notification.id);
            }
        });

        // Крестик
        element.querySelector('.notification-close').onclick = (e) => {
            e.stopPropagation();
            this.hide(notification.id);
        };

        container.appendChild(element);

        // Применяем анимацию
        if (notification.animation === 'bounceIn' && window.MORI_APP && MORI_APP.animations.bounceIn) {
            MORI_APP.animations.bounceIn(element);
        } else if (notification.animation === 'shake' && window.MORI_APP && MORI_APP.animations.shake) {
            MORI_APP.animations.shake(element);
        } else if (notification.animation === 'pulse' && window.MORI_APP && MORI_APP.animations.pulse) {
            MORI_APP.animations.pulse(element);
        } else if (notification.animation === 'fadeIn' && window.MORI_APP && MORI_APP.animations.fadeIn) {
            MORI_APP.animations.fadeIn(element);
        } else {
            // Стандартная анимация slide
            setTimeout(() => element.classList.add('notification-show'), 10);
        }
    },

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

    playSound: function(soundUrl) {
        if (!soundUrl || !this.state.soundEnabled) return;
        const audio = new Audio(soundUrl);
        audio.volume = 0.5;
        audio.play().catch(() => {});
    },

    vibrate: function(pattern) {
        if ('vibrate' in navigator && this.state.vibrationEnabled) {
            navigator.vibrate(pattern);
        }
    },

    showDesktop: function(message, config) {
        if (this.state.permission !== 'granted' || !this.state.desktopEnabled) return;
        const notification = new Notification('MORI Oracle', {
            body: message,
            icon: '/assets/icons/icon-192.png',
            badge: '/assets/icons/icon-72.png',
            tag: 'mori-notification'
        });
        notification.onclick = () => window.focus();
    },

    getHistory: function(limit = 50) {
        return this.state.history.slice(0, limit);
    },

    clearHistory: function() {
        this.state.history = [];
        this.state.unreadCount = 0;
        MORI_STORAGE?.remove('notification_history');
        this.updateUnreadCount();
    },

    toggleSound: function(enabled) {
        this.state.soundEnabled = enabled !== undefined ? enabled : !this.state.soundEnabled;
        this.saveSettings();
    },

    toggleVibration: function(enabled) {
        this.state.vibrationEnabled = enabled !== undefined ? enabled : !this.state.vibrationEnabled;
        this.saveSettings();
    },

    startQueueProcessor: function() {
        setInterval(() => {}, 1000);
    }
};

// ========== CSS ==========
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
    .notification-container {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        align-items: center;
        pointer-events: none;
    }

    .notification {
        position: relative;
        width: 320px;
        margin-top: 16px;
        padding: 16px;
        padding-right: 40px;
        border-radius: 20px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 215, 0, 0.3);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: flex-start;
        gap: 12px;
        pointer-events: auto;
        cursor: pointer;
    }

    .notification-show {
        transform: translateY(0);
        opacity: 1;
    }

    .notification-hide {
        transform: translateY(-100%);
        opacity: 0;
        transition: transform 0.3s ease, opacity 0.3s ease;
    }

    .notification-icon {
        font-size: 24px;
        line-height: 1;
        flex-shrink: 0;
    }

    .notification-content {
        flex: 1;
    }

    .notification-message {
        font-weight: 500;
        color: #ffffff;
        margin-bottom: 4px;
        font-size: 14px;
    }

    .notification-description {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.7);
    }

    .notification-input {
        width: 100%;
        margin-top: 8px;
        padding: 8px;
        border-radius: 8px;
        border: 1px solid rgba(255, 215, 0, 0.3);
        background: rgba(0, 0, 0, 0.5);
        color: #ffffff;
        font-size: 14px;
        outline: none;
        transition: all 0.2s;
    }

    .notification-input:focus {
        border-color: var(--accent-primary, #ffd700);
        box-shadow: 0 0 8px var(--accent-primary, #ffd700);
    }

    .notification-close {
        position: absolute;
        top: 12px;
        right: 12px;
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.3);
        font-size: 18px;
        cursor: pointer;
        padding: 4px;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 14px;
        transition: all 0.2s;
    }

    .notification-close:hover {
        color: rgba(255, 255, 255, 0.8);
        background: rgba(255, 255, 255, 0.1);
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
document.head.appendChild(notificationStyle);

window.MORI_NOTIFICATIONS = MORI_NOTIFICATIONS;
console.log('✅ NOTIFICATIONS загружен, методов:', Object.keys(MORI_NOTIFICATIONS).filter(k => typeof MORI_NOTIFICATIONS[k] === 'function').length);
