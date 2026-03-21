/**
 * DEMIGURGE USERS
 * Управление пользователями
 * Версия: 1.0.0
 */

const MORI_DEMIGURGE_USERS = {
    // Состояние
    state: {
        users: [],
        filteredUsers: [],
        searchQuery: '',
        filter: 'all', // 'all', 'active', 'blocked', 'family', 'admin'
        selectedUser: null,
        showEditModal: false,
        editData: {}
    },

    /**
     * Инициализация
     */
    init: function() {
        console.log('MORI_DEMIGURGE_USERS инициализация...');
        this.loadUsers();
    },

    /**
     * Рендер
     */
    render: function() {
        const container = document.querySelector('.demigurge-container');
        if (!container) return;

        const panel = document.createElement('div');
        panel.className = 'admin-panel';
        panel.innerHTML = this.getHTML();
        
        // Очищаем и добавляем
        const oldPanel = document.querySelector('.admin-panel');
        if (oldPanel) oldPanel.remove();
        
        container.appendChild(panel);
        this.attachEvents();
    },

    /**
     * HTML
     */
    getHTML: function() {
        this.filterUsers();
        
        return `
            <div class="panel-header">
                <h3>👥 Управление пользователями</h3>
                <div class="panel-actions">
                    <button class="panel-btn" id="export-users">📤 Экспорт</button>
                    <button class="panel-btn" id="import-users">📥 Импорт</button>
                    <button class="panel-btn danger" id="refresh-users">🔄</button>
                </div>
            </div>

            <!-- Поиск и фильтры -->
            <div style="display: flex; gap: var(--spacing-md); margin-bottom: var(--spacing-md);">
                <input type="text" 
                       class="notification-input" 
                       id="search-users" 
                       placeholder="🔍 Поиск по имени, нику, ID..."
                       value="${this.state.searchQuery}"
                       style="flex: 2;">

                <select class="notification-input" id="filter-users" style="flex: 1;">
                    <option value="all" ${this.state.filter === 'all' ? 'selected' : ''}>📋 Все</option>
                    <option value="active" ${this.state.filter === 'active' ? 'selected' : ''}>✅ Активные</option>
                    <option value="blocked" ${this.state.filter === 'blocked' ? 'selected' : ''}>🔒 Заблокированные</option>
                    <option value="family" ${this.state.filter === 'family' ? 'selected' : ''}>👨‍👩‍👧‍👦 Семья</option>
                    <option value="admin" ${this.state.filter === 'admin' ? 'selected' : ''}>👑 Админы</option>
                </select>
            </div>

            <!-- Статистика -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--spacing-sm); margin-bottom: var(--spacing-md);">
                <div class="stat-card" style="padding: var(--spacing-sm);">
                    <div class="stat-number">${this.state.users.length}</div>
                    <div class="stat-label">Всего</div>
                </div>
                <div class="stat-card" style="padding: var(--spacing-sm);">
                    <div class="stat-number">${this.state.users.filter(u => u.online).length}</div>
                    <div class="stat-label">Онлайн</div>
                </div>
                <div class="stat-card" style="padding: var(--spacing-sm);">
                    <div class="stat-number">${this.state.users.filter(u => u.accessLevel === 'family').length}</div>
                    <div class="stat-label">Семья</div>
                </div>
                <div class="stat-card" style="padding: var(--spacing-sm);">
                    <div class="stat-number">${this.state.users.filter(u => u.accessLevel === 'admin').length}</div>
                    <div class="stat-label">Админы</div>
                </div>
            </div>

            <!-- Список пользователей -->
            <div class="users-grid">
                ${this.renderUsers()}
            </div>

            <!-- Модальное окно редактирования -->
            ${this.state.showEditModal ? this.renderEditModal() : ''}
        `;
    },

    /**
     * Рендер пользователей
     */
    renderUsers: function() {
        if (this.state.filteredUsers.length === 0) {
            return `
                <div class="empty-apps" style="grid-column: 1/-1;">
                    <div class="empty-icon">👥</div>
                    <h3>Пользователи не найдены</h3>
                </div>
            `;
        }

        return this.state.filteredUsers.map(user => `
            <div class="user-card" data-user-id="${user.id}">
                <div class="user-header">
                    <div class="user-avatar">${user.avatar || '👤'}</div>
                    <div class="user-info">
                        <div class="user-name">${user.nickname || 'Без имени'}</div>
                        <div class="user-nickname">${user.username || '@username'}</div>
                        <div class="user-meta">
                            <span class="user-level">LVL ${user.level || 1}</span>
                            <span class="user-balance">${MORI_UTILS.formatLargeNumber(user.balance || 0)} MORI</span>
                        </div>
                    </div>
                </div>

                <div class="user-stats">
                    <div class="stat-item">
                        <div class="stat-value">${user.stats?.messages || 0}</div>
                        <div class="stat-label">Сообщ</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${user.stats?.pagesRead || 0}</div>
                        <div class="stat-label">Стр</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${user.stats?.calculations || 0}</div>
                        <div class="stat-label">Расч</div>
                    </div>
                </div>

                <div class="user-actions">
                    <button class="user-action" data-action="edit" data-user-id="${user.id}">✎ Ред</button>
                    <button class="user-action" data-action="balance" data-user-id="${user.id}">💰 Баланс</button>
                    <button class="user-action ${user.blocked ? 'warning' : ''}" 
                            data-action="block" 
                            data-user-id="${user.id}">
                        ${user.blocked ? '🔓 Разблок' : '🔒 Блок'}
                    </button>
                    <button class="user-action" data-action="role" data-user-id="${user.id}">👑 Роль</button>
                </div>

                ${user.blocked ? '<div style="color: #ff4444; font-size: 0.75rem; margin-top: var(--spacing-xs);">🔒 Заблокирован</div>' : ''}
                ${user.online ? '<div style="color: #00ff88; font-size: 0.75rem; margin-top: var(--spacing-xs);">✅ В сети</div>' : ''}
            </div>
        `).join('');
    },

    /**
     * Рендер модалки редактирования
     */
    renderEditModal: function() {
        return `
            <div class="admin-modal" id="edit-modal">
                <div class="admin-modal-content">
                    <div class="admin-modal-header">
                        <h3>✎ Редактирование пользователя</h3>
                        <button class="admin-modal-close" id="close-modal">✕</button>
                    </div>

                    <div class="admin-modal-field">
                        <label class="admin-modal-label">Никнейм</label>
                        <input type="text" class="admin-modal-input" id="edit-nickname" 
                               value="${this.state.editData.nickname || ''}">
                    </div>

                    <div class="admin-modal-field">
                        <label class="admin-modal-label">Username</label>
                        <input type="text" class="admin-modal-input" id="edit-username" 
                               value="${this.state.editData.username || ''}">
                    </div>

                    <div class="admin-modal-field">
                        <label class="admin-modal-label">Аватар</label>
                        <input type="text" class="admin-modal-input" id="edit-avatar" 
                               value="${this.state.editData.avatar || '👤'}">
                    </div>

                    <div class="admin-modal-field">
                        <label class="admin-modal-label">Уровень доступа</label>
                        <select class="admin-modal-select" id="edit-access">
                            <option value="user" ${this.state.editData.accessLevel === 'user' ? 'selected' : ''}>Обычный</option>
                            <option value="family" ${this.state.editData.accessLevel === 'family' ? 'selected' : ''}>Семья</option>
                            <option value="admin" ${this.state.editData.accessLevel === 'admin' ? 'selected' : ''}>Админ</option>
                        </select>
                    </div>

                    <div class="admin-modal-field">
                        <label class="admin-modal-label">Баланс MORI</label>
                        <input type="number" class="admin-modal-input" id="edit-balance" 
                               value="${this.state.editData.balance || 0}">
                    </div>

                    <div class="admin-modal-field">
                        <label class="admin-modal-label">Уровень</label>
                        <input type="number" class="admin-modal-input" id="edit-level" 
                               value="${this.state.editData.level || 1}" min="1" max="30">
                    </div>

                    <div class="admin-modal-actions">
                        <button class="admin-modal-btn primary" id="save-user">💾 Сохранить</button>
                        <button class="admin-modal-btn secondary" id="cancel-edit">Отмена</button>
                        <button class="admin-modal-btn danger" id="delete-user">🗑️ Удалить</button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Обработчики
     */
    attachEvents: function() {
        // Поиск
        const searchInput = document.getElementById('search-users');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.state.searchQuery = e.target.value;
                this.render();
            });
        }

        // Фильтр
        const filterSelect = document.getElementById('filter-users');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.state.filter = e.target.value;
                this.render();
            });
        }

        // Экспорт
        document.getElementById('export-users')?.addEventListener('click', () => {
            this.exportUsers();
        });

        // Импорт
        document.getElementById('import-users')?.addEventListener('click', () => {
            this.importUsers();
        });

        // Обновление
        document.getElementById('refresh-users')?.addEventListener('click', () => {
            this.loadUsers();
            this.render();
            MORI_APP.showToast('Список обновлён', 'success');
        });

        // Действия с пользователями
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                const userId = parseInt(e.target.dataset.userId);
                
                switch(action) {
                    case 'edit':
                        this.editUser(userId);
                        break;
                    case 'balance':
                        this.editBalance(userId);
                        break;
                    case 'block':
                        this.toggleBlock(userId);
                        break;
                    case 'role':
                        this.changeRole(userId);
                        break;
                }
            });
        });

        // Модальное окно
        document.getElementById('close-modal')?.addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancel-edit')?.addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('save-user')?.addEventListener('click', () => {
            this.saveUser();
        });

        document.getElementById('delete-user')?.addEventListener('click', () => {
            this.deleteUser();
        });

        // Закрытие по клику вне модалки
        document.getElementById('edit-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'edit-modal') {
                this.closeModal();
            }
        });
    },

    /**
     * Фильтрация пользователей
     */
    filterUsers: function() {
        let filtered = [...this.state.users];

        // Поиск
        if (this.state.searchQuery) {
            const query = this.state.searchQuery.toLowerCase();
            filtered = filtered.filter(u => 
                (u.nickname && u.nickname.toLowerCase().includes(query)) ||
                (u.username && u.username.toLowerCase().includes(query)) ||
                u.id.toString().includes(query)
            );
        }

        // Фильтр
        switch(this.state.filter) {
            case 'active':
                filtered = filtered.filter(u => u.online);
                break;
            case 'blocked':
                filtered = filtered.filter(u => u.blocked);
                break;
            case 'family':
                filtered = filtered.filter(u => u.accessLevel === 'family');
                break;
            case 'admin':
                filtered = filtered.filter(u => u.accessLevel === 'admin');
                break;
        }

        this.state.filteredUsers = filtered;
    },

    /**
     * Редактирование пользователя
     */
    editUser: function(userId) {
        const user = this.state.users.find(u => u.id === userId);
        if (user) {
            this.state.selectedUser = user;
            this.state.editData = { ...user };
            this.state.showEditModal = true;
            this.render();
        }
    },

    /**
     * Редактирование баланса
     */
    editBalance: function(userId) {
        const user = this.state.users.find(u => u.id === userId);
        if (!user) return;

        const amount = prompt(`Введите сумму для пользователя ${user.nickname}:`, user.balance || 0);
        if (amount !== null) {
            const numAmount = parseFloat(amount);
            if (!isNaN(numAmount)) {
                user.balance = numAmount;
                this.saveUsers();
                this.render();
                MORI_APP.showToast(`💰 Баланс обновлён`, 'success');
            }
        }
    },

    /**
     * Блокировка/разблокировка
     */
    toggleBlock: function(userId) {
        const user = this.state.users.find(u => u.id === userId);
        if (user) {
            user.blocked = !user.blocked;
            this.saveUsers();
            this.render();
            MORI_APP.showToast(
                user.blocked ? '🔒 Пользователь заблокирован' : '🔓 Пользователь разблокирован',
                user.blocked ? 'error' : 'success'
            );
        }
    },

    /**
     * Смена роли
     */
    changeRole: function(userId) {
        const user = this.state.users.find(u => u.id === userId);
        if (!user) return;

        const roles = ['user', 'family', 'admin'];
        const currentIndex = roles.indexOf(user.accessLevel || 'user');
        const nextIndex = (currentIndex + 1) % roles.length;
        const newRole = roles[nextIndex];

        if (confirm(`Изменить роль пользователя ${user.nickname} на ${newRole}?`)) {
            user.accessLevel = newRole;
            this.saveUsers();
            this.render();
            MORI_APP.showToast(`👑 Роль изменена на ${newRole}`, 'success');
        }
    },

    /**
     * Сохранение пользователя
     */
    saveUser: function() {
        const user = this.state.selectedUser;
        if (!user) return;

        user.nickname = document.getElementById('edit-nickname')?.value || user.nickname;
        user.username = document.getElementById('edit-username')?.value || user.username;
        user.avatar = document.getElementById('edit-avatar')?.value || user.avatar;
        user.accessLevel = document.getElementById('edit-access')?.value || user.accessLevel;
        user.balance = parseFloat(document.getElementById('edit-balance')?.value) || user.balance;
        user.level = parseInt(document.getElementById('edit-level')?.value) || user.level;

        this.saveUsers();
        this.closeModal();
        MORI_APP.showToast('✅ Пользователь обновлён', 'success');
    },

    /**
     * Удаление пользователя
     */
    deleteUser: function() {
        const user = this.state.selectedUser;
        if (!user) return;

        if (confirm(`Точно удалить пользователя ${user.nickname}? Это действие нельзя отменить.`)) {
            this.state.users = this.state.users.filter(u => u.id !== user.id);
            this.saveUsers();
            this.closeModal();
            MORI_APP.showToast('🗑️ Пользователь удалён', 'info');
        }
    },

    /**
     * Закрытие модалки
     */
    closeModal: function() {
        this.state.showEditModal = false;
        this.state.selectedUser = null;
        this.state.editData = {};
        this.render();
    },

    /**
     * Экспорт пользователей
     */
    exportUsers: function() {
        const data = {
            exportDate: Date.now(),
            count: this.state.users.length,
            users: this.state.users
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        MORI_APP.showToast('📤 Пользователи экспортированы', 'success');
    },

    /**
     * Импорт пользователей
     */
    importUsers: function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.users && Array.isArray(data.users)) {
                        this.state.users = data.users;
                        this.saveUsers();
                        this.render();
                        MORI_APP.showToast(`📥 Импортировано ${data.users.length} пользователей`, 'success');
                    } else {
                        MORI_APP.showToast('Неверный формат файла', 'error');
                    }
                } catch (error) {
                    MORI_APP.showToast('Ошибка импорта', 'error');
                }
            };
            reader.readAsText(file);
        };

        input.click();
    },

     /**
 * Загрузка пользователей
 */
loadUsers: async function() {
    try {
        const response = await MORI_API.getAllUsers(100, 0, '');
        if (response && response.users) {
            this.state.users = response.users.map(user => ({
                ...user,
                online: user.lastSeen && (Date.now() - new Date(user.lastSeen).getTime()) < 300000,
                blocked: user.is_blocked || false,
                stats: user.stats || { messages: 0, pagesRead: 0, calculations: 0 }
            }));
        } else {
            this.state.users = [];
        }
    } catch (error) {
        console.error('Error loading users:', error);
        this.state.users = [];
        MORI_APP.showToast('❌ Ошибка загрузки пользователей', 'error');
    }
    
    this.filterUsers();
},

    /**
     * Сохранение пользователей
     */
    saveUsers: function() {
        localStorage.setItem('admin_users', JSON.stringify(this.state.users));
    }
};

// Экспорт
window.MORI_DEMIGURGE_USERS = MORI_DEMIGURGE_USERS;
