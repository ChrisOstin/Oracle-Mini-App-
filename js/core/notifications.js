    /**
 * NOTIFICATIONS MODULE — Уведомления в стиле Мориарти
 */

const MORI_NOTIFICATIONS = {
    state: {
        soundEnabled: true,
        vibrationEnabled: true
    },

    init: function() {
        console.log('🔔 MORI_NOTIFICATIONS инициализация...');
        this.loadSettings();
    },

    loadSettings: function() {
        const saved = localStorage.getItem('mori_notifications_settings');
        if (saved) {
            this.state = JSON.parse(saved);
        }
    },

    saveSettings: function() {
        localStorage.setItem('mori_notifications_settings', JSON.stringify(this.state));
    },

    playSound: function(type) {
        if (!this.state.soundEnabled) return;
        // Звуки опционально
    },

    vibrate: function(pattern) {
        if (!this.state.vibrationEnabled) return;
        if (navigator.vibrate) navigator.vibrate(pattern);
    },

4a    show: function(message, type = 'info', options = {}) {
        const duration = options.duration || 8000;
        const onClick = options.onClick || null;
        const moduleToOpen = options.module || null;
        
        // Удаляем старые уведомления
        const oldToast = document.querySelector('.mori-toast');
        if (oldToast) oldToast.remove();
        
        // Создаём новое уведомление
        const toast = document.createElement('div');
        toast.className = `mori-toast ${type}`;
        
        // Текст уведомления
        const textSpan = document.createElement('span');
        textSpan.textContent = message;
        toast.appendChild(textSpan);
        
        // Крестик закрытия
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.className = 'mori-toast-close';
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            this.hideToast(toast);
        };
        toast.appendChild(closeBtn);
        
        // Свайп вверх для закрытия
        let touchStartY = 0;
        toast.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        });
        toast.addEventListener('touchmove', (e) => {
            const deltaY = e.touches[0].clientY - touchStartY;
            if (deltaY < -50) { // Свайп вверх
                e.preventDefault();
                this.hideToast(toast);
            }
        });
        
        // Клик по уведомлению
        toast.onclick = () => {
            if (onClick) onClick();
            if (moduleToOpen && window.MORI_ROUTER) {
                MORI_ROUTER.navigate(moduleToOpen);
            }
            this.hideToast(toast);
        };
        
        document.body.appendChild(toast);
        
        // Автоисчезновение
        let timeoutId = setTimeout(() => {
            this.hideToast(toast);
        }, duration);
        
        // Останавливаем автоисчезновение при наведении
        toast.onmouseenter = () => clearTimeout(timeoutId);
        toast.onmouseleave = () => {
            timeoutId = setTimeout(() => {
                this.hideToast(toast);
            }, duration);
        };
        
        this.vibrate(20);
        this.playSound(type);
    },

    hideToast: function(toast) {
        toast.classList.add('hide');
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    },

    // Уведомление о реферале
    notifyReferral: function(referrerName, newUserName) {
        this.show(
            `🎉 ${referrerName} пригласил(а) ${newUserName}! +500 MORI Coin`,
            'success',
            {
                duration: 8000,
                module: 'profile',
                onClick: () => {
                    if (window.MORI_ROUTER) {
                        MORI_ROUTER.navigate('profile');
                        setTimeout(() => {
                            const referralsTab = document.querySelector('.profile-tab[data-tab="referrals"]');
                            if (referralsTab) referralsTab.click();
                        }, 300);
                    }
                }
            }
        );
    },

    // Напоминание о ежедневном бонусе
    remindDailyBonus: function() {
        const lastClaim = localStorage.getItem('daily_last');
        const today = new Date().toDateString();
        
        if (lastClaim !== today) {
            setTimeout(() => {
                this.show(
                    `🎁 Не забудь перейти в профиль, чтобы забрать ежедневный бонус!`,
                    'warning',
                    {
                        duration: 10000,
                        module: 'profile',
                        onClick: () => {
                            if (window.MORI_ROUTER) {
                                MORI_ROUTER.navigate('profile');
                                setTimeout(() => {
                                    const dailyBtn = document.getElementById('daily-bonus-btn');
                                    if (dailyBtn) dailyBtn.click();
                                }, 300);
                            }
                        }
                    }
                );
            }, 5000);
        }
    },

    // Уведомление о достижении
    notifyAchievement: function(achievementName) {
        this.show(
            `🏆 Достижение "${achievementName}" разблокировано!`,
            'success',
            {
                duration: 8000,
                module: 'profile'
            }
        );
    },

    // Уведомление о новом уровне
    notifyLevelUp: function(level) {
        this.show(
            `🎉 Поздравляем! Вы достигли ${level} уровня!`,
            'success',
            {
                duration: 8000,
                module: 'profile'
            }
        );
    }
};

// Автозапуск напоминания о бонусе
setTimeout(() => {
    if (MORI_NOTIFICATIONS) {
        MORI_NOTIFICATIONS.remindDailyBonus();
    }
}, 3000);

window.MORI_NOTIFICATIONS = MORI_NOTIFICATIONS;

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

console.log('✅ NOTIFICATIONS загружен, методов:', Object.keys(MORI_NOTIFICATIONS).filter(k => typeof MORI_NOTIFICATIONS[k] === 'function').length);
