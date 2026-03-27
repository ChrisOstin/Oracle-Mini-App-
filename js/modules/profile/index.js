/**
 * PROFILE MODULE
 * Профиль пользователя с уровнями, статистикой и настройками
 * Версия: 1.0.0
 */

const MORI_PROFILE = {
    // Состояние
    state: {
        isEditing: false,
        isSaving: false,
        showAvatarSelector: false,
        showAchievements: false,
        editData: {
            nickname: '',
            avatar: '👤',
            balance: 0
        },
        errors: {}
    },

    // Данные пользователя
    user: null,

    /**
     * Инициализация
     */
    init: async function() {
        console.log('MORI_PROFILE инициализация...');
        this.user = MORI_USER.current;
        
        if (!this.user) {
            await MORI_USER.loadFromStorage();
            this.user = MORI_USER.current;
        }
    },

    /**
     * Рендер
     */
    render: function() {
        const content = document.getElementById('profile-content');
        if (!content) return;

        if (!this.user) {
            content.innerHTML = this.renderNotLoggedIn();
            return;
        }

        content.innerHTML = this.getHTML();
        this.attachEvents();
    },

    /**
     * HTML
     */
    getHTML: function() {
        const progress = MORI_USER.getLevelProgress();
        
        return `
            <div class="profile-screen">
                <!-- Шапка -->
                <div class="profile-header">
                    <div class="profile-avatar">
                        <div class="avatar-image" id="profile-avatar">
                            ${this.user.avatar || '👤'}
                        </div>
                        <button class="avatar-edit" id="edit-avatar-btn">✎</button>
                    </div>
                    <h2 class="profile-name">${this.user.nickname || 'Пользователь'}</h2>
                    ${this.user.username ? `<div class="profile-username">@${this.user.username}</div>` : ''}
                    <div class="profile-badge">
                        Уровень ${this.user.level}
                    </div>
                </div>

                <!-- Уровень -->
                <div class="level-section">
                    <div class="level-header">
                        <span class="level-title">Текущий уровень</span>
                        <span class="level-number">${this.user.level}</span>
                    </div>
                    <div class="level-name">${this.getLevelName(this.user.level)}</div>
                    <div class="level-progress">
                        <div class="progress-fill" style="width: ${progress.percent}%"></div>
                    </div>
                    <div class="progress-text">
                        <span>${progress.current} / ${progress.required} опыта</span>
                    </div>
                </div>

                <!-- Статистика -->
                <div class="stats-section">
                    <h3>📊 Статистика</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">${this.user.stats?.messages || 0}</div>
                            <div class="stat-label">Сообщений</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${this.user.stats?.pagesRead || 0}</div>
                            <div class="stat-label">Страниц</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${this.user.stats?.calculations || 0}</div>
                            <div class="stat-label">Расчётов</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${this.user.stats?.aiQuestions || 0}</div>
                            <div class="stat-label">Вопросов AI</div>
                        </div>
                    </div>
                </div>

                <!-- Настройки -->
                <div class="settings-section">
                    <h3>⚙️ Настройки</h3>
                    
                    <div class="settings-item" id="edit-profile">
                        <div class="settings-left">
                            <span class="settings-icon">✎</span>
                            <div class="settings-info">
                                <h4>Редактировать профиль</h4>
                                <p>Никнейм, аватар, баланс</p>
                            </div>
                        </div>
                        <span class="settings-arrow">→</span>
                    </div>

                    <div class="settings-item">
                        <div class="settings-left">
                            <span class="settings-icon">🔔</span>
                            <div class="settings-info">
                                <h4>Уведомления</h4>
                                <p>${this.user.settings?.notifications ? 'Включены' : 'Выключены'}</p>
                            </div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="notifications-toggle" 
                                   ${this.user.settings?.notifications ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>

                    <div class="settings-item" id="logout-btn">
                        <div class="settings-left">
                            <span class="settings-icon">🚪</span>
                            <div class="settings-info">
                                <h4>Выйти</h4>
                                <p>Завершить сеанс</p>
                            </div>
                        </div>
                        <span class="settings-arrow">→</span>
                    </div>
                </div>

                ${this.state.isEditing ? this.renderEditModal() : ''}
                ${this.state.showAvatarSelector ? this.renderAvatarSelector() : ''}
           <div class="profile-skull-switch">
    <h3>Фон с черепом</h3>
    <select id="skull-select">
        <option value="">Без черепа</option>
        <option value="cracks">Трещины</option>
        <option value="tears">Золотые слёзы</option>
        <option value="melted">Расплавленный</option>
        <option value="crown">Корона</option>
        <option value="veins">Золотые вены</option>
        <option value="halo">Нимб</option>
        <option value="smoke">Золотой дым</option>
        <option value="runes">Руны</option>
        <option value="web">Паутина</option>
        <option value="aura">Ореол</option>
    </select>
</div> 
           </div>
        `;
    },

    /**
     * Не авторизован
     */
    renderNotLoggedIn: function() {
        return `
            <div class="profile-screen">
                <div class="empty-state">
                    <div class="empty-icon">👤</div>
                    <h3>Не авторизован</h3>
                    <p>Войдите, чтобы увидеть профиль</p>
                    <button class="login-btn" id="go-to-auth">Войти</button>
                </div>
            </div>
        `;
    },

    /**
     * Редактирование
     */
    renderEditModal: function() {
        return `
            <div class="edit-profile">
                <div class="edit-header">
                    <h3>Редактировать</h3>
                    <button class="edit-close" id="close-edit">✕</button>
                </div>
                <div class="edit-content">
                    <div class="edit-field">
                        <label>Никнейм</label>
                        <input type="text" class="edit-input ${this.state.errors.nickname ? 'error' : ''}" 
                               id="edit-nickname" value="${this.state.editData.nickname || this.user.nickname || ''}">
                        ${this.state.errors.nickname ? 
                            `<small class="error-text">${this.state.errors.nickname}</small>` : ''}
                    </div>

                    <div class="edit-field">
                        <label>Баланс MORI</label>
                        <input type="number" class="edit-input" id="edit-balance" 
                               value="${this.state.editData.balance || this.user.balance || 0}">
                    </div>

                    <div class="edit-field">
                        <label>Аватар</label>
                        <div class="avatar-preview" id="avatar-preview">
                            ${this.state.editData.avatar || this.user.avatar || '👤'}
                        </div>
                        <button class="change-avatar-btn" id="change-avatar-btn">
                            Выбрать
                        </button>
                    </div>

                    <button class="edit-save" id="save-profile" ${this.state.isSaving ? 'disabled' : ''}>
                        ${this.state.isSaving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Выбор аватара
     */
    renderAvatarSelector: function() {
        const avatars = ['👤', '🦊', '🐱', '🐼', '🐧', '🦉', '🐺', '🐨', '🦁', '🐸', '🐙', '🦄'];
        
        return `
            <div class="edit-profile" style="z-index: 1001;">
                <div class="edit-header">
                    <h3>Выберите аватар</h3>
                    <button class="edit-close" id="close-avatar-selector">✕</button>
                </div>
                <div class="edit-content">
                    <div class="avatar-selector">
                        ${avatars.map(emoji => `
                            <div class="avatar-option ${this.state.editData.avatar === emoji ? 'selected' : ''}" 
                                 data-avatar="${emoji}">
                                ${emoji}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Названия уровней (30)
     */
    getLevelName: function(level) {
        const names = {
            1: 'Новичок',
            2: 'Любопытный',
            3: 'Читатель',
            4: 'Музыкант',
            5: 'Финансист',
            6: 'Ценитель',
            7: 'Игрок',
            8: 'Семьянин',
            9: 'Мастер',
            10: 'Легенда',
            11: 'Тень',
            12: 'Хранитель',
            13: 'Философ',
            14: 'Мудрец',
            15: 'Провидец',
            16: 'Странник',
            17: 'Искатель',
            18: 'Творец',
            19: 'Властелин',
            20: 'Бессмертный',
            21: 'Мифический',
            22: 'Легендарный',
            23: 'Эпический',
            24: 'Божественный',
            25: 'Космический',
            26: 'Безграничный',
            27: 'Всемогущий',
            28: 'Вездесущий',
            29: 'Мориарти',
            30: 'Абсолют'
        };
        return names[level] || `Уровень ${level}`;
    },

    /**
     * Обработчики
     */
    attachEvents: function() {
        document.getElementById('edit-profile')?.addEventListener('click', () => {
            this.setState({ 
                isEditing: true,
                editData: {
                    nickname: this.user.nickname || '',
                    avatar: this.user.avatar || '👤',
                    balance: this.user.balance || 0
                }
            });
        });

        document.getElementById('edit-avatar-btn')?.addEventListener('click', () => {
            this.setState({ 
                isEditing: true,
                editData: {
                    nickname: this.user.nickname || '',
                    avatar: this.user.avatar || '👤',
                    balance: this.user.balance || 0
                }
            });
        });

        document.getElementById('close-edit')?.addEventListener('click', () => {
            this.setState({ isEditing: false, errors: {} });
        });

        document.getElementById('change-avatar-btn')?.addEventListener('click', () => {
            this.setState({ showAvatarSelector: true });
        });

        document.getElementById('close-avatar-selector')?.addEventListener('click', () => {
            this.setState({ showAvatarSelector: false });
        });

        document.querySelectorAll('.avatar-option').forEach(opt => {
            opt.addEventListener('click', (e) => {
                const avatar = e.target.dataset.avatar;
                this.setState({ 
                    editData: { ...this.state.editData, avatar },
                    showAvatarSelector: false
                });
                document.getElementById('avatar-preview').textContent = avatar;
            });
        });

        document.getElementById('save-profile')?.addEventListener('click', () => {
            this.saveProfile();
        });

        document.getElementById('notifications-toggle')?.addEventListener('change', (e) => {
            this.toggleNotification(e.target.checked);
        });

        document.getElementById('logout-btn')?.addEventListener('click', () => {
            this.logout();
        });

        document.getElementById('go-to-auth')?.addEventListener('click', () => {
            MORI_ROUTER.navigate('auth');
        });
   
        const skullSelect = document.getElementById('skull-select');
if (skullSelect) {
    const saved = localStorage.getItem('skull_theme') || '';
    skullSelect.value = saved;
    document.body.setAttribute('data-skull', saved);
    
    skullSelect.addEventListener('change', (e) => {
        const value = e.target.value;
        localStorage.setItem('skull_theme', value);
        document.body.setAttribute('data-skull', value);
    });
}

    },

    /**
     * Сохранение
     */
    saveProfile: async function() {
        const nickname = document.getElementById('edit-nickname')?.value.trim();
        const balance = parseFloat(document.getElementById('edit-balance')?.value) || 0;

        if (!nickname || nickname.length < 3) {
            this.setState({ errors: { nickname: 'Минимум 3 символа' } });
            return;
        }

        this.setState({ isSaving: true });

        const updated = await MORI_USER.update({
            nickname: nickname,
            avatar: this.state.editData.avatar || this.user.avatar,
            balance: balance
        });

        if (updated) {
            this.user = MORI_USER.current;
            this.setState({ isEditing: false, isSaving: false, errors: {} });
            MORI_APP.showToast('Профиль обновлён', 'success');
            this.render();
        } else {
            this.setState({ isSaving: false });
            MORI_APP.showToast('Ошибка сохранения', 'error');
        }
    },

    /**
     * Уведомления
     */
    toggleNotification: function(enabled) {
        if (this.user.settings) {
            this.user.settings.notifications = enabled;
            MORI_USER.save();
            MORI_APP.showToast(enabled ? 'Уведомления включены' : 'Уведомления выключены', 'info');
        }
    },

    /**
     * Выход
     */
    logout: function() {
        if (confirm('Выйти из аккаунта?')) {
            MORI_AUTH.logout();
        }
    },

    /**
     * Обновление состояния
     */
    setState: function(newState) {
        this.state = { ...this.state, ...newState };
        this.render();
    },

    /**
     * Очистка
     */
    destroy: function() {
        this.state = {
            isEditing: false,
            isSaving: false,
            showAvatarSelector: false,
            showAchievements: false,
            editData: {},
            errors: {}
        };
    }
};

// Экспорт
window.MORI_PROFILE = MORI_PROFILE;
