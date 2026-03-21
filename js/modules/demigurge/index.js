/**
 * DEMIGURGE MODULE
 * Панель администратора (Демиург)
 * Версия: 1.0.0
 */

const MORI_DEMIGURGE = {
    // Состояние
    state: {
        activeTab: 'users', // 'users', 'books', 'stats', 'notifications', 'multiaccount', 'console'
        users: [],
        books: [],
        notifications: [],
        accounts: [],
        console: {
            lines: [],
            history: [],
            variables: {}
        },
        stats: {
            users: { total: 0, active: 0, new: 0 },
            books: { total: 0, read: 0, added: 0 },
            tasks: { completed: 0, active: 0 },
            performance: []
        }
    },

    // Доступ (только для админов)
    access: 'admin',

    /**
     * Инициализация
     */
    init: function() {
        console.log('👑 MORI_DEMIGURGE инициализация...');
        
        // Проверка доступа
        if (!MORI_AUTH.isAdmin()) {
            MORI_APP.showToast('Доступ только для администраторов', 'error');
            return false;
        }

        this.loadState();
        this.loadUsers();
        this.loadBooks();
        this.loadStats();
        this.loadNotifications();
        this.loadAccounts();
        
        return true;
    },

    /**
     * Рендер
     */
    render: function() {
        const content = document.getElementById('demigurge-content');
        if (!content) return;

        // Проверка доступа
        if (!MORI_AUTH.isAdmin()) {
            content.innerHTML = this.renderNoAccess();
            return;
        }

        content.innerHTML = this.getHTML();
        this.attachEvents();
    },

    /**
     * HTML
     */
    getHTML: function() {
        return `
            <div class="demigurge-screen">
                <!-- Шапка -->
                <div class="demigurge-header">
                    <h2>👑 Демиург</h2>
                    <div class="demigurge-stats">
                        <span class="stat-badge">👥 ${this.state.stats.users.total}</span>
                        <span class="stat-badge">📚 ${this.state.stats.books.total}</span>
                        <span class="stat-badge">⚡ ${this.state.stats.performance.length}%</span>
                    </div>
                </div>

                <!-- Вкладки -->
                <div class="demigurge-tabs">
                    <button class="demigurge-tab ${this.state.activeTab === 'users' ? 'active' : ''}" 
                            data-tab="users">
                        👥 Пользователи
                    </button>
                    <button class="demigurge-tab ${this.state.activeTab === 'books' ? 'active' : ''}" 
                            data-tab="books">
                        📚 Книги
                    </button>
                    <button class="demigurge-tab ${this.state.activeTab === 'stats' ? 'active' : ''}" 
                            data-tab="stats">
                        📊 Статистика
                    </button>
                    <button class="demigurge-tab ${this.state.activeTab === 'notifications' ? 'active' : ''}" 
                            data-tab="notifications">
                        🔔 Рассылка
                    </button>
                    <button class="demigurge-tab ${this.state.activeTab === 'multiaccount' ? 'active' : ''}" 
                            data-tab="multiaccount">
                        🔁 Мультиаккаунты
                    </button>
                    <button class="demigurge-tab ${this.state.activeTab === 'console' ? 'active' : ''}" 
                            data-tab="console">
                        🖥️ Консоль
                    </button>
                </div>

                <!-- Контейнер -->
                <div class="demigurge-container">
                    ${this.renderTabContent()}
                </div>
            </div>
        `;
    },

    /**
     * Рендер контента вкладки
     */
    renderTabContent: function() {
        switch(this.state.activeTab) {
            case 'users':
                return MORI_DEMIGURGE_USERS?.render() || '<div class="admin-panel">Загрузка...</div>';
            case 'books':
                return MORI_DEMIGURGE_BOOKS?.render() || '<div class="admin-panel">Загрузка...</div>';
            case 'stats':
                return MORI_DEMIGURGE_STATS?.render() || '<div class="admin-panel">Загрузка...</div>';
            case 'notifications':
                return this.renderNotifications();
            case 'multiaccount':
                return MORI_DEMIGURGE_MULTIACCOUNT?.render() || '<div class="admin-panel">Загрузка...</div>';
            case 'console':
                return this.renderConsole();
            default:
                return '';
        }
    },

    /**
     * Рендер уведомлений
     */
    renderNotifications: function() {
        return `
            <div class="admin-panel notification-section">
                <div class="panel-header">
                    <h3>🔔 Рассылка уведомлений</h3>
                </div>

                <!-- Предпросмотр -->
                <div class="notification-preview" id="notification-preview">
                    <div class="notification-preview-title" id="preview-title">
                        Заголовок уведомления
                    </div>
                    <div class="notification-preview-text" id="preview-text">
                        Текст уведомления будет выглядеть так...
                    </div>
                    <div class="notification-preview-meta">
                        <span>👥 Всем пользователям</span>
                        <span>📅 ${new Date().toLocaleDateString()}</span>
                    </div>
                </div>

                <!-- Форма -->
                <div class="notification-form">
                    <div class="notification-type">
                        <label class="notification-type-label selected" data-type="info">
                            <input type="radio" name="notify-type" value="info" checked class="notification-type-input">
                            ℹ️ Инфо
                        </label>
                        <label class="notification-type-label" data-type="success">
                            <input type="radio" name="notify-type" value="success" class="notification-type-input">
                            ✅ Успех
                        </label>
                        <label class="notification-type-label" data-type="warning">
                            <input type="radio" name="notify-type" value="warning" class="notification-type-input">
                            ⚠️ Важно
                        </label>
                        <label class="notification-type-label" data-type="danger">
                            <input type="radio" name="notify-type" value="danger" class="notification-type-input">
                            ❌ Ошибка
                        </label>
                    </div>

                    <div class="notification-recipients">
                        <div class="recipient-group">
                            <label>Кому отправляем?</label>
                            <select class="notification-input" id="notify-recipients">
                                <option value="all">👥 Всем пользователям</option>
                                <option value="family">👨‍👩‍👧‍👦 Только семья</option>
                                <option value="admins">👑 Только админы</option>
                                <option value="active">⚡ Активные (сегодня)</option>
                            </select>
                            <div class="recipient-stats" id="recipient-stats">
                                ≈ 1,234 получателя
                            </div>
                        </div>
                    </div>

                    <input type="text" 
                           class="notification-input" 
                           id="notify-title" 
                           placeholder="Заголовок уведомления"
                           maxlength="100">

                    <textarea class="notification-textarea" 
                              id="notify-message" 
                              placeholder="Текст уведомления..."
                              maxlength="500"></textarea>

                    <div class="char-counter" id="char-counter">0/500</div>

                    <div class="notification-actions">
                        <button class="notification-send" id="send-notification">
                            📤 Отправить всем
                        </button>
                        <button class="notification-clear" id="clear-notification">
                            🗑️ Очистить
                        </button>
                    </div>
                </div>

                <!-- История рассылок -->
                <div class="notification-history">
                    <h4>📜 История рассылок</h4>
                    <div id="notification-history-list">
                        ${this.renderNotificationHistory()}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Рендер истории уведомлений
     */
    renderNotificationHistory: function() {
        if (this.state.notifications.length === 0) {
            return '<div class="empty-list">История пуста</div>';
        }

        return this.state.notifications.slice(0, 10).map(n => `
            <div class="history-item" data-id="${n.id}">
                <div class="history-icon ${n.type}">${n.icon}</div>
                <div class="history-content">
                    <div class="history-title">${n.title}</div>
                    <div class="history-meta">
                        <span>${n.date}</span>
                        <span class="history-recipients">
                            👥 ${n.recipients}
                            <span class="history-badge">${n.recipientCount}</span>
                        </span>
                    </div>
                </div>
                <div class="history-actions">
                    <button class="history-resend" data-id="${n.id}">↩️</button>
                    <button class="history-delete" data-id="${n.id}">🗑️</button>
                </div>
            </div>
        `).join('');
    },

    /**
     * Рендер консоли
     */
    renderConsole: function() {
        return `
            <div class="admin-panel console-section">
                <div class="console-header">
                    <h3>>_ Админ-консоль</h3>
                    <div class="console-controls">
                        <button class="console-btn" id="console-clear" title="Очистить">🗑️</button>
                        <button class="console-btn" id="console-copy" title="Копировать">📋</button>
                        <button class="console-btn" id="console-refresh" title="Обновить">🔄</button>
                    </div>
                </div>

                <!-- Вывод консоли -->
                <div class="console-output" id="console-output">
                    ${this.renderConsoleLines()}
                </div>

                <!-- Ввод команд -->
                <div class="console-input-wrapper">
                    <span class="console-prompt">$</span>
                    <input type="text" 
                           class="console-input" 
                           id="console-input" 
                           placeholder="Введите команду..."
                           autocomplete="off">
                    <button class="console-execute" id="console-execute">Выполнить</button>
                </div>

                <!-- Инспектор переменных -->
                <div class="inspector-panel">
                    <div class="inspector-header">
                        <button class="inspector-tab active" data-inspector="vars">📊 Переменные</button>
                        <button class="inspector-tab" data-inspector="funcs">⚙️ Функции</button>
                        <button class="inspector-tab" data-inspector="storage">💾 Хранилище</button>
                    </div>
                    <div class="inspector-content" id="inspector-content">
                        ${this.renderInspector('vars')}
                    </div>
                </div>

                <!-- Профилирование -->
                <div class="profile-stats">
                    <div class="profile-stat">
                        <div class="profile-stat-value">${this.state.stats.performance.length || 0}ms</div>
                        <div class="profile-stat-label">Время ответа</div>
                    </div>
                    <div class="profile-stat">
                        <div class="profile-stat-value">${Object.keys(MORI_USER?.current || {}).length}</div>
                        <div class="profile-stat-label">Переменных</div>
                    </div>
                    <div class="profile-stat">
                        <div class="profile-stat-value">${Object.keys(localStorage).length}</div>
                        <div class="profile-stat-label">localStorage</div>
                    </div>
                    <div class="profile-stat">
                        <div class="profile-stat-value">${navigator.onLine ? '✅' : '❌'}</div>
                        <div class="profile-stat-label">Сеть</div>
                    </div>
                </div>

                <!-- График производительности -->
                <div class="performance-chart" id="performance-chart">
                    ${this.renderPerformanceChart()}
                </div>
            </div>
        `;
    },

    /**
     * Рендер строк консоли
     */
    renderConsoleLines: function() {
        if (this.state.console.lines.length === 0) {
            return '<div class="console-line system">Добро пожаловать в консоль администратора. Введите "help" для списка команд.</div>';
        }

        return this.state.console.lines.map(line => `
            <div class="console-line ${line.type}">
                <span class="timestamp">${line.timestamp}</span>
                <span class="function">${line.function || ''}</span>
                <span class="message">${line.message}</span>
            </div>
        `).join('');
    },

    /**
     * Рендер инспектора
     */
    renderInspector: function(type) {
        switch(type) {
            case 'vars':
                return Object.entries(MORI_USER?.current || {}).map(([key, value]) => `
                    <div class="inspector-item">
                        <span class="inspector-key">${key}</span>
                        <span class="inspector-value ${typeof value}">${JSON.stringify(value)}</span>
                    </div>
                `).join('');
            case 'funcs':
                return Object.entries(MORI_DEMIGURGE).map(([key, value]) => `
                    <div class="inspector-item">
                        <span class="inspector-key">${key}</span>
                        <span class="inspector-value function">${typeof value === 'function' ? 'ƒ()' : typeof value}</span>
                    </div>
                `).join('');
            case 'storage':
                return Object.keys(localStorage).map(key => `
                    <div class="inspector-item">
                        <span class="inspector-key">${key}</span>
                        <span class="inspector-value string">${(localStorage.getItem(key) || '').substring(0, 50)}</span>
                    </div>
                `).join('');
            default:
                return '';
        }
    },

    /**
     * Рендер графика производительности
     */
    renderPerformanceChart: function() {
        const data = this.state.stats.performance.slice(-20);
        if (data.length === 0) return '';

        const max = Math.max(...data, 100);
        
        return data.map(value => `
            <div class="perf-bar" style="height: ${(value / max) * 100}%" 
                 data-value="${value}ms"></div>
        `).join('');
    },

    /**
     * Нет доступа
     */
    renderNoAccess: function() {
        return `
            <div class="empty-chat">
                <div class="empty-icon">👑</div>
                <h3>Доступ запрещён</h3>
                <p>Эта панель только для администраторов</p>
            </div>
        `;
    },

    /**
     * Обработчики
     */
    attachEvents: function() {
        // Переключение вкладок
        document.querySelectorAll('.demigurge-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.setState({ activeTab: tabName });
            });
        });

        // Предпросмотр уведомлений
        const titleInput = document.getElementById('notify-title');
        const messageInput = document.getElementById('notify-message');
        const previewTitle = document.getElementById('preview-title');
        const previewText = document.getElementById('preview-text');
        const charCounter = document.getElementById('char-counter');

        if (titleInput) {
            titleInput.addEventListener('input', (e) => {
                previewTitle.textContent = e.target.value || 'Заголовок уведомления';
            });
        }

        if (messageInput) {
            messageInput.addEventListener('input', (e) => {
                previewText.textContent = e.target.value || 'Текст уведомления будет выглядеть так...';
                if (charCounter) {
                    charCounter.textContent = `${e.target.value.length}/500`;
                    charCounter.className = e.target.value.length > 450 ? 'char-counter warning' : 
                                           e.target.value.length > 480 ? 'char-counter danger' : 'char-counter';
                }
            });
        }

        // Тип уведомления
        document.querySelectorAll('.notification-type-label').forEach(label => {
            label.addEventListener('click', (e) => {
                document.querySelectorAll('.notification-type-label').forEach(l => l.classList.remove('selected'));
                label.classList.add('selected');
                
                const type = label.dataset.type;
                const preview = document.getElementById('notification-preview');
                if (preview) {
                    preview.style.borderLeftColor = 
                        type === 'info' ? '#33b5e5' :
                        type === 'success' ? '#00ff88' :
                        type === 'warning' ? '#ffbb33' : '#ff4444';
                }
            });
        });

        // Получатели
        const recipientsSelect = document.getElementById('notify-recipients');
        const recipientStats = document.getElementById('recipient-stats');
        
        if (recipientsSelect && recipientStats) {
            recipientsSelect.addEventListener('change', (e) => {
                const counts = {
                    'all': '1,234',
                    'family': '456',
                    'admins': '12',
                    'active': '789'
                };
                recipientStats.textContent = `≈ ${counts[e.target.value]} получателей`;
            });
        }

        // Отправка уведомления
        document.getElementById('send-notification')?.addEventListener('click', () => {
            this.sendNotification();
        });

        // Очистка формы
        document.getElementById('clear-notification')?.addEventListener('click', () => {
            if (titleInput) titleInput.value = '';
            if (messageInput) messageInput.value = '';
            if (previewTitle) previewTitle.textContent = 'Заголовок уведомления';
            if (previewText) previewText.textContent = 'Текст уведомления будет выглядеть так...';
            if (charCounter) charCounter.textContent = '0/500';
        });

        // История уведомлений
        document.querySelectorAll('.history-resend').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                this.resendNotification(id);
            });
        });

        document.querySelectorAll('.history-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                this.deleteNotification(id);
            });
        });

        // Консоль
        const consoleInput = document.getElementById('console-input');
        const executeBtn = document.getElementById('console-execute');

        if (consoleInput && executeBtn) {
            const executeCommand = () => {
                const cmd = consoleInput.value.trim();
                if (cmd) {
                    this.executeCommand(cmd);
                    consoleInput.value = '';
                }
            };

            executeBtn.addEventListener('click', executeCommand);
            consoleInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    executeCommand();
                }
            });
        }

        // Очистка консоли
        document.getElementById('console-clear')?.addEventListener('click', () => {
            this.clearConsole();
        });

        // Копирование консоли
        document.getElementById('console-copy')?.addEventListener('click', () => {
            this.copyConsole();
        });

        // Обновление консоли
        document.getElementById('console-refresh')?.addEventListener('click', () => {
            this.refreshConsole();
        });

        // Переключение инспектора
        document.querySelectorAll('.inspector-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.inspector-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const inspectorType = tab.dataset.inspector;
                const inspectorContent = document.getElementById('inspector-content');
                if (inspectorContent) {
                    inspectorContent.innerHTML = this.renderInspector(inspectorType);
                }
            });
        });

        // Обновление графика производительности
        setInterval(() => this.updatePerformance(), 1000);
    },

    /**
     * Отправка уведомления
     */
    sendNotification: function() {
        const title = document.getElementById('notify-title')?.value;
        const message = document.getElementById('notify-message')?.value;
        const type = document.querySelector('input[name="notify-type"]:checked')?.value || 'info';
        const recipients = document.getElementById('notify-recipients')?.value || 'all';

        if (!title || !message) {
            MORI_APP.showToast('Заполните заголовок и текст', 'error');
            return;
        }

        const notification = {
            id: Date.now(),
            title,
            message,
            type,
            recipients,
            date: new Date().toLocaleString(),
            icon: type === 'info' ? 'ℹ️' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '❌',
            recipientCount: recipients === 'all' ? 1234 : recipients === 'family' ? 456 : recipients === 'admins' ? 12 : 789
        };

        this.state.notifications.unshift(notification);
        this.saveNotifications();

        // Показываем индикатор отправки
        const btn = document.getElementById('send-notification');
        btn.classList.add('sending');
        btn.textContent = '⏳ Отправка...';
        btn.disabled = true;

        // Имитация отправки
        setTimeout(() => {
            btn.classList.remove('sending');
            btn.textContent = '📤 Отправить всем';
            btn.disabled = false;

            MORI_APP.showToast(`✅ Уведомление отправлено ${notification.recipientCount} пользователям`, 'success');
            this.renderNotifications();
        }, 2000);
    },

    /**
     * Повторная отправка
     */
    resendNotification: function(id) {
        const notification = this.state.notifications.find(n => n.id == id);
        if (!notification) return;

        MORI_APP.showToast(`↩️ Уведомление "${notification.title}" отправлено повторно`, 'success');
    },

    /**
     * Удаление из истории
     */
    deleteNotification: function(id) {
        this.state.notifications = this.state.notifications.filter(n => n.id != id);
        this.saveNotifications();
        this.renderNotifications();
        MORI_APP.showToast('🗑️ Уведомление удалено из истории', 'info');
    },

    /**
     * Выполнение команды в консоли
     */
    executeCommand: function(cmd) {
        const timestamp = new Date().toLocaleTimeString();
        
        // Добавляем команду в историю
        this.state.console.lines.push({
            type: 'system',
            timestamp,
            function: '>',
            message: cmd
        });

        try {
            let result;
            const lowerCmd = cmd.toLowerCase();

            if (lowerCmd === 'help') {
                result = this.getHelp();
            } else if (lowerCmd === 'clear') {
                this.clearConsole();
                return;
            } else if (lowerCmd === 'stats') {
                result = JSON.stringify(this.state.stats, null, 2);
            } else if (lowerCmd === 'users') {
                result = `Всего пользователей: ${this.state.stats.users.total}\nАктивных: ${this.state.stats.users.active}\nНовых: ${this.state.stats.users.new}`;
            } else if (lowerCmd === 'books') {
                result = `Всего книг: ${this.state.stats.books.total}\nПрочитано: ${this.state.stats.books.read}\nДобавлено: ${this.state.stats.books.added}`;
            } else if (lowerCmd.startsWith('eval ')) {
                const evalCmd = cmd.substring(5);
                result = eval(evalCmd);
            } else {
                result = `Неизвестная команда: ${cmd}`;
            }

            this.state.console.lines.push({
                type: 'success',
                timestamp,
                function: '←',
                message: String(result)
            });

        } catch (error) {
            this.state.console.lines.push({
                type: 'error',
                timestamp,
                function: '!',
                message: error.message
            });
        }

        // Ограничиваем историю
        if (this.state.console.lines.length > 100) {
            this.state.console.lines = this.state.console.lines.slice(-100);
        }

        this.renderConsole();
    },

    /**
     * Справка по командам
     */
    getHelp: function() {
        return `
Доступные команды:
  help     - показать справку
  clear    - очистить консоль
  stats    - статистика системы
  users    - информация о пользователях
  books    - информация о книгах
  eval ... - выполнить JavaScript код
        `;
    },

    /**
     * Очистка консоли
     */
    clearConsole: function() {
        this.state.console.lines = [];
        this.renderConsole();
    },

    /**
     * Копирование консоли
     */
    copyConsole: function() {
        const text = this.state.console.lines.map(l => 
            `[${l.timestamp}] ${l.function} ${l.message}`
        ).join('\n');
        
        MORI_UTILS.copyToClipboard(text);
        MORI_APP.showToast('📋 Консоль скопирована', 'success');
    },

    /**
     * Обновление консоли
     */
    refreshConsole: function() {
        this.state.console.lines.push({
            type: 'system',
            timestamp: new Date().toLocaleTimeString(),
            function: '↻',
            message: 'Консоль обновлена'
        });
        this.renderConsole();
    },

    /**
     * Обновление производительности
     */
    updatePerformance: function() {
        const perf = Math.floor(Math.random() * 100) + 20;
        this.state.stats.performance.push(perf);
        
        if (this.state.stats.performance.length > 20) {
            this.state.stats.performance.shift();
        }

        const chart = document.getElementById('performance-chart');
        if (chart) {
            chart.innerHTML = this.renderPerformanceChart();
        }
    },

    /**
 * Загрузка пользователей
 */
loadUsers: async function() {
    try {
        const users = await MORI_API.getAllUsers();
        if (users && users.users) {
            this.state.users = users.users;
            this.state.stats.users.total = users.total;
            this.state.stats.users.active = users.users.filter(u => u.lastSeen && (Date.now() - new Date(u.lastSeen).getTime()) < 86400000).length;
        } else {
            this.state.users = [];
            this.state.stats.users.total = 0;
            this.state.stats.users.active = 0;
        }
    } catch (error) {
        console.error('Error loading users:', error);
        this.state.users = [];
        this.state.stats.users.total = 0;
        this.state.stats.users.active = 0;
    }
},

    /**
 * Загрузка книг
 */
loadBooks: async function() {
    try {
        const books = await MORI_API.getBooks();
        if (books && books.books) {
            this.state.books = books.books;
            this.state.stats.books.total = books.books.length;
            // TODO: загружать статистику чтения из API
            this.state.stats.books.read = 0;
        } else {
            this.state.books = [];
            this.state.stats.books.total = 0;
            this.state.stats.books.read = 0;
        }
    } catch (error) {
        console.error('Error loading books:', error);
        this.state.books = [];
        this.state.stats.books.total = 0;
        this.state.stats.books.read = 0;
    }
},

    /**
     * Загрузка статистики
     */
    loadStats: function() {
        this.state.stats.tasks.completed = 1234;
        this.state.stats.tasks.active = 567;
        
        for (let i = 0; i < 20; i++) {
            this.state.stats.performance.push(Math.floor(Math.random() * 100) + 20);
        }
    },

    /**
 * Загрузка уведомлений
 */
loadNotifications: function() {
    try {
        const saved = localStorage.getItem('admin_notifications');
        if (saved) {
            this.state.notifications = JSON.parse(saved);
        } else {
            this.state.notifications = [];  // ← только пустой массив!
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
        this.state.notifications = [];
    }
},

    /**
     * Сохранение уведомлений
     */
    saveNotifications: function() {
        localStorage.setItem('admin_notifications', JSON.stringify(this.state.notifications));
    },

    /**
 * Загрузка аккаунтов
 */
loadAccounts: async function() {
    try {
        const accounts = await MORI_API.getMultiaccount?.();
        if (accounts && accounts.accounts) {
            this.state.accounts = accounts.accounts;
        } else {
            this.state.accounts = [];
        }
    } catch (error) {
        console.error('Error loading accounts:', error);
        this.state.accounts = [];
    }
},

    /**
     * Загрузка состояния
     */
    loadState: function() {
        try {
            const saved = localStorage.getItem('demigurge_state');
            if (saved) {
                const data = JSON.parse(saved);
                this.state.activeTab = data.activeTab || 'users';
            }
        } catch (error) {
            console.error('Error loading demigurge state:', error);
        }
    },

    /**
     * Сохранение состояния
     */
    saveState: function() {
        localStorage.setItem('demigurge_state', JSON.stringify({
            activeTab: this.state.activeTab
        }));
    },

    /**
     * Обновление состояния
     */
    setState: function(newState) {
        this.state = { ...this.state, ...newState };
        this.saveState();
        this.render();
    }
};

// Экспорт
window.MORI_DEMIGURGE = MORI_DEMIGURGE;
