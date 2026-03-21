/**
 * PROFILE SETTINGS
 * Настройки пользователя
 * Версия: 1.0.0
 */

const MORI_PROFILE_SETTINGS = {
    // Доступные настройки
    options: {
        theme: {
            type: 'select',
            label: 'Тема оформления',
            icon: '🎨',
            values: [
                { value: 'system', label: 'Как в системе' },
                { value: 'dark', label: 'Тёмная' },
                { value: 'light', label: 'Светлая' }
            ]
        },
        notifications: {
            type: 'toggle',
            label: 'Уведомления',
            icon: '🔔',
            description: 'Включить все уведомления'
        },
        sound: {
            type: 'toggle',
            label: 'Звук',
            icon: '🔊',
            description: 'Звуковые эффекты'
        },
        vibration: {
            type: 'toggle',
            label: 'Вибрация',
            icon: '📳',
            description: 'Виброотклик'
        },
        privacy_online: {
            type: 'select',
            label: 'Кто видит онлайн',
            icon: '👁️',
            values: [
                { value: 'all', label: 'Все' },
                { value: 'family', label: 'Только семья' },
                { value: 'none', label: 'Никто' }
            ]
        },
        privacy_balance: {
            type: 'select',
            label: 'Кто видит баланс',
            icon: '💰',
            values: [
                { value: 'all', label: 'Все' },
                { value: 'family', label: 'Только семья' },
                { value: 'none', label: 'Только я' }
            ]
        }
    },

    // Текущие настройки
    settings: {
        theme: 'system',
        notifications: true,
        sound: true,
        vibration: true,
        privacy_online: 'family',
        privacy_balance: 'family'
    },

    /**
     * Загрузка настроек
     */
    load: function() {
        try {
            const saved = localStorage.getItem('user_settings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
        return this.settings;
    },

    /**
     * Сохранение настроек
     */
    save: function() {
        try {
            localStorage.setItem('user_settings', JSON.stringify(this.settings));
            this.applySettings();
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    },

    /**
     * Применение настроек
     */
    applySettings: function() {
        // Применяем тему
        if (this.settings.theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            document.body.dataset.theme = systemTheme;
        } else {
            document.body.dataset.theme = this.settings.theme;
        }

        // Сохраняем в MORI_USER если есть
        if (MORI_USER.current) {
            MORI_USER.current.settings = {
                ...MORI_USER.current.settings,
                notifications: this.settings.notifications,
                sound: this.settings.sound,
                privacy: {
                    showOnline: this.settings.privacy_online !== 'none',
                    showBalance: this.settings.privacy_balance
                }
            };
            MORI_USER.save();
        }
    },

    /**
     * Обновление настройки
     */
    update: function(key, value) {
        if (key in this.settings) {
            const oldValue = this.settings[key];
            this.settings[key] = value;
            this.save();
            
            // Показываем уведомление
            const option = this.options[key];
            MORI_APP.showToast(
                `${option.icon} ${option.label} обновлено`,
                'success'
            );
            
            return true;
        }
        return false;
    },

    /**
     * Сброс настроек
     */
    reset: function() {
        this.settings = {
            theme: 'system',
            notifications: true,
            sound: true,
            vibration: true,
            privacy_online: 'family',
            privacy_balance: 'family'
        };
        this.save();
        MORI_APP.showToast('Настройки сброшены', 'info');
    },

    /**
     * Получение значения настройки
     */
    get: function(key) {
        return this.settings[key];
    },

    /**
     * Получение всех настроек
     */
    getAll: function() {
        return { ...this.settings };
    },

    /**
     * Рендер страницы настроек
     */
    render: function() {
        return `
            <div class="settings-screen">
                <div class="settings-header">
                    <h2>⚙️ Настройки</h2>
                </div>
                
                <div class="settings-section">
                    <h3>🎨 Оформление</h3>
                    ${this.renderSetting('theme')}
                </div>

                <div class="settings-section">
                    <h3>🔔 Уведомления</h3>
                    ${this.renderSetting('notifications')}
                    ${this.renderSetting('sound')}
                    ${this.renderSetting('vibration')}
                </div>

                <div class="settings-section">
                    <h3>👁️ Приватность</h3>
                    ${this.renderSetting('privacy_online')}
                    ${this.renderSetting('privacy_balance')}
                </div>

                <div class="settings-actions">
                    <button class="settings-reset" id="reset-settings">
                        Сбросить настройки
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Рендер одной настройки
     */
    renderSetting: function(key) {
        const option = this.options[key];
        const value = this.settings[key];

        switch (option.type) {
            case 'toggle':
                return `
                    <div class="settings-item">
                        <div class="settings-left">
                            <span class="settings-icon">${option.icon}</span>
                            <div class="settings-info">
                                <h4>${option.label}</h4>
                                ${option.description ? `<p>${option.description}</p>` : ''}
                            </div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" 
                                   id="setting-${key}" 
                                   ${value ? 'checked' : ''}
                                   data-key="${key}">
                            <span class="slider"></span>
                        </label>
                    </div>
                `;

            case 'select':
                return `
                    <div class="settings-item">
                        <div class="settings-left">
                            <span class="settings-icon">${option.icon}</span>
                            <div class="settings-info">
                                <h4>${option.label}</h4>
                            </div>
                        </div>
                        <select class="settings-select" id="setting-${key}" data-key="${key}">
                            ${option.values.map(v => `
                                <option value="${v.value}" ${value === v.value ? 'selected' : ''}>
                                    ${v.label}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                `;

            default:
                return '';
        }
    },

    /**
     * Навешивание обработчиков
     */
    attachEvents: function() {
        // Переключатели
        document.querySelectorAll('input[type="checkbox"][data-key]').forEach(input => {
            input.addEventListener('change', (e) => {
                const key = e.target.dataset.key;
                this.update(key, e.target.checked);
            });
        });

        // Селекты
        document.querySelectorAll('select[data-key]').forEach(select => {
            select.addEventListener('change', (e) => {
                const key = e.target.dataset.key;
                this.update(key, e.target.value);
            });
        });

        // Кнопка сброса
        const resetBtn = document.getElementById('reset-settings');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('Сбросить все настройки?')) {
                    this.reset();
                    // Перерендериваем страницу
                    if (MORI_PROFILE) {
                        MORI_PROFILE.render();
                    }
                }
            });
        }
    },

    /**
     * Экспорт настроек
     */
    exportSettings: function() {
        const data = {
            exportDate: Date.now(),
            version: '1.0',
            settings: this.settings
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `settings_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    },

    /**
     * Импорт настроек
     */
    importSettings: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (data.settings) {
                        this.settings = { ...this.settings, ...data.settings };
                        this.save();
                        resolve(true);
                    } else {
                        reject(new Error('Неверный формат файла'));
                    }
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }
};

// Загрузка настроек при старте
MORI_PROFILE_SETTINGS.load();

// Экспорт
window.MORI_PROFILE_SETTINGS = MORI_PROFILE_SETTINGS;
