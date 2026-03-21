/**
 * DEMIGURGE MULTIACCOUNT
 * Мультиаккаунты для тестирования
 * Версия: 1.0.0
 */

const MORI_DEMIGURGE_MULTIACCOUNT = {
    // Состояние
    state: {
        accounts: [],
        currentAccount: null,
        showAddModal: false,
        showEditModal: false,
        selectedAccount: null,
        editData: {}
    },

    // Шаблоны аккаунтов
    templates: {
        user: {
            nickname: 'Тестовый пользователь',
            avatar: '👤',
            accessLevel: 'user',
            level: 1,
            balance: 1000,
            unlockedFeatures: [],
            stats: { messages: 0, pagesRead: 0, calculations: 0, aiQuestions: 0 }
        },
        family: {
            nickname: 'Тестовая семья',
            avatar: '👨‍👩‍👧‍👦',
            accessLevel: 'family',
            level: 5,
            balance: 10000,
            unlockedFeatures: ['fonts', 'wishlist', 'tags'],
            stats: { messages: 50, pagesRead: 100, calculations: 30, aiQuestions: 10 }
        },
        admin: {
            nickname: 'Тестовый админ',
            avatar: '👑',
            accessLevel: 'admin',
            level: 30,
            balance: 999999,
            unlockedFeatures: [],
            stats: { messages: 999, pagesRead: 999, calculations: 999, aiQuestions: 999 }
        }
    },

    /**
     * Инициализация
     */
    init: function() {
        console.log('MORI_DEMIGURGE_MULTIACCOUNT инициализация...');
        this.loadAccounts();
    },

    /**
     * Рендер
     */
    render: function() {
        const container = document.querySelector('.demigurge-container');
        if (!container) return;

        const panel = document.createElement('div');
        panel.className = 'admin-panel multiaccount-panel';
        panel.innerHTML = this.getHTML();
        
        const oldPanel = document.querySelector('.admin-panel');
        if (oldPanel) oldPanel.remove();
        
        container.appendChild(panel);
        this.attachEvents();
    },

    /**
     * HTML
     */
    getHTML: function() {
        return `
            <div class="multiaccount-header">
                <h3>🔁 Мультиаккаунты для тестирования</h3>
                <span class="multiaccount-badge">${this.state.accounts.length} аккаунтов</span>
            </div>

            <!-- Информация -->
            <div style="background: rgba(0,0,0,0.3); border-radius: var(--radius-lg); padding: var(--spacing-md); margin-bottom: var(--spacing-md);">
                <p style="color: var(--text-secondary); margin-bottom: var(--spacing-xs);">
                    👑 Мультиаккаунты позволяют тестировать приложение от лица разных пользователей.
                </p>
                <p style="color: var(--text-secondary); font-size: 0.9rem;">
                    Вы можете быстро переключаться между аккаунтами, не выходя из системы.
                </p>
            </div>

            <!-- Текущий аккаунт -->
            ${this.state.currentAccount ? this.renderCurrentAccount() : ''}

            <!-- Сетка аккаунтов -->
            <div class="accounts-grid">
                ${this.renderAccounts()}
                <div class="add-account-btn" id="add-account">
                    <div class="add-account-icon">➕</div>
                    <div>Создать тестовый аккаунт</div>
                </div>
            </div>

            <!-- Модальные окна -->
            ${this.state.showAddModal ? this.renderAddModal() : ''}
            ${this.state.showEditModal ? this.renderEditModal() : ''}
        `;
    },

    /**
     * Текущий аккаунт
     */
    renderCurrentAccount: function() {
        const acc = this.state.currentAccount;
        
        return `
            <div style="background: linear-gradient(135deg, rgba(255,215,0,0.2), rgba(0,0,0,0.5)); border-radius: var(--radius-lg); padding: var(--spacing-md); margin-bottom: var(--spacing-md); border: 1px solid var(--accent-primary);">
                <div style="display: flex; align-items: center; gap: var(--spacing-md);">
                    <div style="font-size: 3rem;">${acc.avatar}</div>
                    <div style="flex: 1;">
                        <div style="font-size: 1.25rem; font-weight: 600; color: var(--accent-primary);">${acc.nickname}</div>
                        <div style="display: flex; gap: var(--spacing-sm); margin-top: var(--spacing-xs);">
                            <span class="user-level">LVL ${acc.level}</span>
                            <span class="user-balance">${MORI_UTILS.formatLargeNumber(acc.balance)} MORI</span>
                            <span class="user-badge" style="background: ${this.getRoleColor(acc.accessLevel)};">${acc.accessLevel}</span>
                        </div>
                    </div>
                    <button class="panel-btn" id="exit-multiaccount" style="border-color: #ff4444; color: #ff4444;">🚪 Выйти</button>
                </div>
            </div>
        `;
    },

    /**
     * Рендер аккаунтов
     */
    renderAccounts: function() {
        return this.state.accounts.map(acc => `
            <div class="account-card ${this.state.currentAccount?.id === acc.id ? 'active' : ''}" 
                 data-account-id="${acc.id}">
                <div class="account-avatar">${acc.avatar}</div>
                <div class="account-name">${acc.nickname}</div>
                <div class="account-level">Уровень ${acc.level}</div>
                <div class="account-desc">${acc.description || this.getDefaultDescription(acc)}</div>
                <span class="account-tag" style="background: ${this.getRoleColor(acc.accessLevel)}20; color: ${this.getRoleColor(acc.accessLevel)};">
                    ${acc.accessLevel}
                </span>
                <div style="display: flex; gap: var(--spacing-xs); margin-top: var(--spacing-sm);">
                    <button class="account-use" data-id="${acc.id}" style="flex: 2; background: var(--accent-primary); color: var(--mori-black); border: none; padding: var(--spacing-xs); border-radius: var(--radius-md); cursor: pointer;">
                        🔀 Использовать
                    </button>
                    <button class="account-edit" data-id="${acc.id}" style="flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,215,0,0.3); color: var(--text-secondary); padding: var(--spacing-xs); border-radius: var(--radius-md); cursor: pointer;">
                        ✎
                    </button>
                    <button class="account-delete" data-id="${acc.id}" style="flex: 1; background: rgba(255,68,68,0.1); border: 1px solid #ff4444; color: #ff4444; padding: var(--spacing-xs); border-radius: var(--radius-md); cursor: pointer;">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    },

    /**
     * Модальное окно добавления
     */
    renderAddModal: function() {
        return `
            <div class="admin-modal" id="multi-modal">
                <div class="admin-modal-content">
                    <div class="admin-modal-header">
                        <h3>➕ Создать тестовый аккаунт</h3>
                        <button class="admin-modal-close" id="close-modal">✕</button>
                    </div>

                    <div class="admin-modal-field">
                        <label class="admin-modal-label">Шаблон</label>
                        <select class="admin-modal-select" id="account-template">
                            <option value="user">👤 Обычный пользователь</option>
                            <option value="family">👨‍👩‍👧‍👦 Член семьи</option>
                            <option value="admin">👑 Администратор</option>
                            <option value="custom">🛠️ Свой вариант</option>
                        </select>
                    </div>

                    <div class="admin-modal-field">
                        <label class="admin-modal-label">Никнейм</label>
                        <input type="text" class="admin-modal-input" id="account-nickname" 
                               placeholder="Введите никнейм">
                    </div>

                    <div class="admin-modal-field">
                        <label class="admin-modal-label">Аватар (эмодзи)</label>
                        <input type="text" class="admin-modal-input" id="account-avatar" 
                               value="👤" placeholder="👤">
                    </div>

                    <div class="admin-modal-field">
                        <label class="admin-modal-label">Уровень доступа</label>
                        <select class="admin-modal-select" id="account-level">
                            <option value="user">Обычный пользователь</option>
                            <option value="family">Семья</option>
                            <option value="admin">Админ</option>
                        </select>
                    </div>

                    <div class="admin-modal-field">
                        <label class="admin-modal-label">Уровень (1-30)</label>
                        <input type="number" class="admin-modal-input" id="account-user-level" 
                               value="1" min="1" max="30">
                    </div>

                    <div class="admin-modal-field">
                        <label class="admin-modal-label">Баланс MORI</label>
                        <input type="number" class="admin-modal-input" id="account-balance" 
                               value="1000" min="0" step="1000">
                    </div>

                    <div class="admin-modal-field">
                        <label class="admin-modal-label">Описание (необязательно)</label>
                        <input type="text" class="admin-modal-input" id="account-description" 
                               placeholder="Для чего этот аккаунт">
                    </div>

                    <div class="admin-modal-actions">
                        <button class="admin-modal-btn primary" id="save-account">➕ Создать</button>
                        <button class="admin-modal-btn secondary" id="cancel-modal">Отмена</button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Модальное окно редактирования
     */
    renderEditModal: function() {
        const acc = this.state.selectedAccount;
        if (!acc) return '';

        return `
            <div class="admin-modal" id="multi-modal">
                <div class="admin-modal-content">
                    <div class="admin-modal-header">
                        <h3>✎ Редактирование аккаунта</h3>
                        <button class="admin-modal-close" id="close-modal">✕</button>
                    </div>

                    <div class="admin-modal-field">
                        <label class="admin-modal-label">Никнейм</label>
                        <input type="text" class="admin-modal-input" id="edit-nickname" 
                               value="${acc.nickname || ''}">
                    </div>

                    <div class="admin-modal-field">
                        <label class="admin-modal-label">Аватар</label>
                        <input type="text" class="admin-modal-input" id="edit-avatar" 
                               value="${acc.avatar || '👤'}">
                    </div>

                    <div class="admin-modal-field">
                        <label class="admin-modal-label">Уровень доступа</label>
                        <select class="admin-modal-select" id="edit-level">
                            <option value="user" ${acc.accessLevel === 'user' ? 'selected' : ''}>Обычный</option>
                            <option value="family" ${acc.accessLevel === 'family' ? 'selected' : ''}>Семья</option>
                            <option value="admin" ${acc.accessLevel === 'admin' ? 'selected' : ''}>Админ</option>
                        </select>
                    </div>

                    <div class="admin-modal-field">
                        <label class="admin-modal-label">Уровень</label>
                        <input type="number" class="admin-modal-input" id="edit-user-level" 
                               value="${acc.level || 1}" min="1" max="30">
                    </div>

                    <div class="admin-modal-field">
                        <label class="admin-modal-label">Баланс</label>
                        <input type="number" class="admin-modal-input" id="edit-balance" 
                               value="${acc.balance || 0}" min="0">
                    </div>

                    <div class="admin-modal-field">
                        <label class="admin-modal-label">Описание</label>
                        <input type="text" class="admin-modal-input" id="edit-description" 
                               value="${acc.description || ''}">
                    </div>

                    <div class="admin-modal-actions">
                        <button class="admin-modal-btn primary" id="update-account">💾 Сохранить</button>
                        <button class="admin-modal-btn secondary" id="cancel-modal">Отмена</button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Обработчики
     */
    attachEvents: function() {
        // Добавление аккаунта
        document.getElementById('add-account')?.addEventListener('click', () => {
            this.state.showAddModal = true;
            this.render();
        });

        // Использование аккаунта
        document.querySelectorAll('.account-use').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(e.target.dataset.id);
                this.useAccount(id);
            });
        });

        // Редактирование
        document.querySelectorAll('.account-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(e.target.dataset.id);
                this.editAccount(id);
            });
        });

        // Удаление
        document.querySelectorAll('.account-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(e.target.dataset.id);
                this.deleteAccount(id);
            });
        });

        // Выход из мультиаккаунта
        document.getElementById('exit-multiaccount')?.addEventListener('click', () => {
            this.exitMultiaccount();
        });

        // Модальные окна
        document.getElementById('close-modal')?.addEventListener('click', () => {
            this.closeModals();
        });

        document.getElementById('cancel-modal')?.addEventListener('click', () => {
            this.closeModals();
        });

        document.getElementById('save-account')?.addEventListener('click', () => {
            this.addAccount();
        });

        document.getElementById('update-account')?.addEventListener('click', () => {
            this.updateAccount();
        });

        // Шаблон при добавлении
        document.getElementById('account-template')?.addEventListener('change', (e) => {
            const template = this.templates[e.target.value];
            if (template) {
                document.getElementById('account-nickname').value = template.nickname;
                document.getElementById('account-avatar').value = template.avatar;
                document.getElementById('account-level').value = template.accessLevel;
                document.getElementById('account-user-level').value = template.level;
                document.getElementById('account-balance').value = template.balance;
            }
        });

        // Закрытие по клику вне
        document.getElementById('multi-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'multi-modal') this.closeModals();
        });
    },

    /**
     * Добавление аккаунта
     */
    addAccount: function() {
        const nickname = document.getElementById('account-nickname')?.value;
        if (!nickname) {
            MORI_APP.showToast('Введите никнейм', 'error');
            return;
        }

        const newAccount = {
            id: Date.now(),
            nickname,
            avatar: document.getElementById('account-avatar')?.value || '👤',
            accessLevel: document.getElementById('account-level')?.value || 'user',
            level: parseInt(document.getElementById('account-user-level')?.value) || 1,
            balance: parseInt(document.getElementById('account-balance')?.value) || 0,
            description: document.getElementById('account-description')?.value || '',
            createdAt: Date.now()
        };

        this.state.accounts.push(newAccount);
        this.saveAccounts();
        this.closeModals();
        MORI_APP.showToast(`✅ Аккаунт "${nickname}" создан`, 'success');
    },

    /**
     * Использование аккаунта
     */
    useAccount: function(id) {
        const account = this.state.accounts.find(a => a.id === id);
        if (!account) return;

        // Сохраняем текущий аккаунт
        this.state.currentAccount = account;
        
        // Создаём временного пользователя
        const tempUser = {
            id: `test_${account.id}`,
            nickname: account.nickname,
            avatar: account.avatar,
            accessLevel: account.accessLevel,
            level: account.level,
            balance: account.balance,
            stats: account.stats || { messages: 0, pagesRead: 0, calculations: 0, aiQuestions: 0 }
        };

        // Подменяем текущего пользователя
        MORI_USER.current = tempUser;
        MORI_APP.accessLevel = account.accessLevel;
        
        // Сохраняем в localStorage, что мы в тестовом режиме
        localStorage.setItem('test_mode', 'true');
        localStorage.setItem('test_account', JSON.stringify(account));

        this.render();
        MORI_APP.showToast(`🔀 Теперь вы: ${account.nickname}`, 'success');
        
        // Перезагружаем текущий модуль, чтобы применить новый уровень доступа
        setTimeout(() => {
            location.reload();
        }, 1500);
    },

    /**
     * Выход из мультиаккаунта
     */
    exitMultiaccount: function() {
        this.state.currentAccount = null;
        localStorage.removeItem('test_mode');
        localStorage.removeItem('test_account');
        
        // Возвращаем настоящего пользователя
        MORI_USER.loadFromStorage();
        
        MORI_APP.showToast('🔙 Возврат к основному аккаунту', 'success');
        
        setTimeout(() => {
            location.reload();
        }, 1500);
    },

    /**
     * Редактирование аккаунта
     */
    editAccount: function(id) {
        const account = this.state.accounts.find(a => a.id === id);
        if (account) {
            this.state.selectedAccount = account;
            this.state.showEditModal = true;
            this.render();
        }
    },

    /**
     * Обновление аккаунта
     */
    updateAccount: function() {
        const acc = this.state.selectedAccount;
        if (!acc) return;

        acc.nickname = document.getElementById('edit-nickname')?.value || acc.nickname;
        acc.avatar = document.getElementById('edit-avatar')?.value || acc.avatar;
        acc.accessLevel = document.getElementById('edit-level')?.value || acc.accessLevel;
        acc.level = parseInt(document.getElementById('edit-user-level')?.value) || acc.level;
        acc.balance = parseInt(document.getElementById('edit-balance')?.value) || acc.balance;
        acc.description = document.getElementById('edit-description')?.value || acc.description;

        this.saveAccounts();
        this.closeModals();
        MORI_APP.showToast(`✅ Аккаунт обновлён`, 'success');
    },

    /**
     * Удаление аккаунта
     */
    deleteAccount: function(id) {
        if (!confirm('Удалить тестовый аккаунт?')) return;

        this.state.accounts = this.state.accounts.filter(a => a.id !== id);
        
        if (this.state.currentAccount?.id === id) {
            this.state.currentAccount = null;
            localStorage.removeItem('test_mode');
            localStorage.removeItem('test_account');
        }

        this.saveAccounts();
        this.render();
        MORI_APP.showToast('🗑️ Аккаунт удалён', 'info');
    },

    /**
     * Закрытие модалок
     */
    closeModals: function() {
        this.state.showAddModal = false;
        this.state.showEditModal = false;
        this.state.selectedAccount = null;
        this.render();
    },

    /**
     * Цвет для роли
     */
    getRoleColor: function(role) {
        const colors = {
            user: '#00ff88',
            family: '#ffd700',
            admin: '#ff4444'
        };
        return colors[role] || '#888';
    },

    /**
     * Описание по умолчанию
     */
    getDefaultDescription: function(acc) {
        if (acc.accessLevel === 'admin') return 'Полный доступ ко всему';
        if (acc.accessLevel === 'family') return 'Доступ к семейным функциям';
        return 'Обычный пользователь';
    },

    /**
     * Загрузка аккаунтов
     */
    loadAccounts: function() {
        const saved = localStorage.getItem('test_accounts');
        if (saved) {
            this.state.accounts = JSON.parse(saved);
        } else {
            // Аккаунты по умолчанию
            this.state.accounts = [
                {
                    id: 1,
                    nickname: 'Тестовый пользователь',
                    avatar: '👤',
                    accessLevel: 'user',
                    level: 1,
                    balance: 1000,
                    description: 'Для проверки обычного функционала'
                },
                {
                    id: 2,
                    nickname: 'Тестовая семья',
                    avatar: '👨‍👩‍👧‍👦',
                    accessLevel: 'family',
                    level: 5,
                    balance: 10000,
                    description: 'Доступ к дому и семейным функциям'
                },
                {
                    id: 3,
                    nickname: 'Тестовый админ',
                    avatar: '👑',
                    accessLevel: 'admin',
                    level: 30,
                    balance: 999999,
                    description: 'Полный доступ, все открыто'
                }
            ];
        }

        // Проверяем, не в тестовом ли режиме
        const testAccount = localStorage.getItem('test_account');
        if (testAccount) {
            this.state.currentAccount = JSON.parse(testAccount);
        }
    },

    /**
     * Сохранение аккаунтов
     */
    saveAccounts: function() {
        localStorage.setItem('test_accounts', JSON.stringify(this.state.accounts));
    }
};

// Экспорт
window.MORI_DEMIGURGE_MULTIACCOUNT = MORI_DEMIGURGE_MULTIACCOUNT;
