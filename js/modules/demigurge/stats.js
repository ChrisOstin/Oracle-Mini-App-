/**
 * DEMIGURGE STATS
 * Статистика и аналитика
 * Версия: 1.0.0
 */

const MORI_DEMIGURGE_STATS = {
    // Состояние
    state: {
        period: 'day', // 'day', 'week', 'month', 'year'
        users: [],
        books: [],
        tasks: [],
        chat: [],
        performance: [],
        realtime: {
            online: 0,
            active: 0,
            requests: 0
        }
    },

    /**
     * Инициализация
     */
    init: function() {
        console.log('MORI_DEMIGURGE_STATS инициализация...');
        this.loadStats();
        this.startRealtimeUpdates();
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
        
        const oldPanel = document.querySelector('.admin-panel');
        if (oldPanel) oldPanel.remove();
        
        container.appendChild(panel);
        this.attachEvents();
        this.initCharts();
    },

    /**
     * HTML
     */
    getHTML: function() {
        return `
            <div class="panel-header">
                <h3>📊 Статистика и аналитика</h3>
                <div class="panel-actions">
                    <select class="notification-input" id="stats-period" style="width: 120px;">
                        <option value="day" ${this.state.period === 'day' ? 'selected' : ''}>За день</option>
                        <option value="week" ${this.state.period === 'week' ? 'selected' : ''}>За неделю</option>
                        <option value="month" ${this.state.period === 'month' ? 'selected' : ''}>За месяц</option>
                        <option value="year" ${this.state.period === 'year' ? 'selected' : ''}>За год</option>
                    </select>
                    <button class="panel-btn" id="export-stats">📤 Экспорт</button>
                    <button class="panel-btn danger" id="refresh-stats">🔄</button>
                </div>
            </div>

            <!-- Realtime stats -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-md); margin-bottom: var(--spacing-md);">
                <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <div class="stat-number" id="online-count">${this.state.realtime.online}</div>
                    <div class="stat-label">Онлайн сейчас</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⚡</div>
                    <div class="stat-number" id="active-count">${this.state.realtime.active}</div>
                    <div class="stat-label">Активны сегодня</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">📨</div>
                    <div class="stat-number" id="requests-count">${this.state.realtime.requests}</div>
                    <div class="stat-label">Запросов/мин</div>
                </div>
            </div>

            <!-- Графики -->
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md); margin-bottom: var(--spacing-md);">
                <div class="chart-container">
                    <h4 style="margin-bottom: var(--spacing-md);">👥 Пользователи</h4>
                    <canvas id="users-chart" width="400" height="200"></canvas>
                </div>
                <div class="chart-container">
                    <h4 style="margin-bottom: var(--spacing-md);">📚 Книги</h4>
                    <canvas id="books-chart" width="400" height="200"></canvas>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md); margin-bottom: var(--spacing-md);">
                <div class="chart-container">
                    <h4 style="margin-bottom: var(--spacing-md);">🎮 Задания</h4>
                    <canvas id="tasks-chart" width="400" height="200"></canvas>
                </div>
                <div class="chart-container">
                    <h4 style="margin-bottom: var(--spacing-md);">💬 Сообщения</h4>
                    <canvas id="chat-chart" width="400" height="200"></canvas>
                </div>
            </div>

            <!-- Таблицы -->
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md);">
                <div class="admin-panel" style="margin: 0;">
                    <h4 style="margin-bottom: var(--spacing-md);">🏆 Топ пользователей</h4>
                    ${this.renderTopUsers()}
                </div>
                <div class="admin-panel" style="margin: 0;">
                    <h4 style="margin-bottom: var(--spacing-md);">📈 Активность по часам</h4>
                    ${this.renderHourlyActivity()}
                </div>
            </div>

            <!-- Системная информация -->
            <div class="admin-panel" style="margin-top: var(--spacing-md);">
                <h4 style="margin-bottom: var(--spacing-md);">🖥️ Системная информация</h4>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--spacing-md);">
                    <div>
                        <div style="color: var(--text-secondary);">Версия</div>
                        <div style="font-weight: 600;">1.0.0</div>
                    </div>
                    <div>
                        <div style="color: var(--text-secondary);">Последний запуск</div>
                        <div style="font-weight: 600;">${new Date().toLocaleString()}</div>
                    </div>
                    <div>
                        <div style="color: var(--text-secondary);">localStorage</div>
                        <div style="font-weight: 600;">${this.getStorageSize()} MB</div>
                    </div>
                    <div>
                        <div style="color: var(--text-secondary);">Браузер</div>
                        <div style="font-weight: 600;">${this.getBrowserInfo()}</div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Топ пользователей
     */
    renderTopUsers: function() {
        const users = this.getTopUsers();
        
        return `
            <div style="display: flex; flex-direction: column; gap: var(--spacing-xs);">
                ${users.map((user, i) => `
                    <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                        <span style="min-width: 30px; color: ${i < 3 ? 'var(--accent-primary)' : 'var(--text-secondary)'}">
                            ${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                        </span>
                        <span class="user-avatar" style="width: 24px; height: 24px; font-size: 1rem;">${user.avatar}</span>
                        <span style="flex: 1;">${user.name}</span>
                        <span style="color: var(--accent-primary);">${user.value}</span>
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * Активность по часам
     */
    renderHourlyActivity: function() {
        const hours = this.getHourlyActivity();
        
        return `
            <div style="display: flex; align-items: flex-end; gap: 4px; height: 100px;">
                ${hours.map((value, i) => `
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                        <div style="height: ${value}px; width: 100%; background: var(--accent-primary); border-radius: 4px 4px 0 0; transition: height 0.3s;"></div>
                        <div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 4px;">${i}:00</div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * Инициализация графиков
     */
    initCharts: function() {
        // Users chart
        const usersCtx = document.getElementById('users-chart')?.getContext('2d');
        if (usersCtx) {
            new Chart(usersCtx, {
                type: 'line',
                data: {
                    labels: this.getLabels(),
                    datasets: [{
                        label: 'Новые пользователи',
                        data: this.getUsersData(),
                        borderColor: '#00ff88',
                        backgroundColor: 'rgba(0, 255, 136, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        }

        // Books chart
        const booksCtx = document.getElementById('books-chart')?.getContext('2d');
        if (booksCtx) {
            new Chart(booksCtx, {
                type: 'bar',
                data: {
                    labels: this.getLabels(),
                    datasets: [{
                        label: 'Прочтений',
                        data: this.getBooksData(),
                        backgroundColor: '#ffd700',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        }

        // Tasks chart
        const tasksCtx = document.getElementById('tasks-chart')?.getContext('2d');
        if (tasksCtx) {
            new Chart(tasksCtx, {
                type: 'line',
                data: {
                    labels: this.getLabels(),
                    datasets: [
                        {
                            label: 'Выполнено',
                            data: this.getTasksCompletedData(),
                            borderColor: '#00ff88',
                            borderWidth: 2,
                            pointRadius: 0
                        },
                        {
                            label: 'Новые',
                            data: this.getTasksNewData(),
                            borderColor: '#ffd700',
                            borderWidth: 2,
                            pointRadius: 0
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        // Chat chart
        const chatCtx = document.getElementById('chat-chart')?.getContext('2d');
        if (chatCtx) {
            new Chart(chatCtx, {
                type: 'bar',
                data: {
                    labels: ['Общий', 'Семейный', 'Админский'],
                    datasets: [{
                        label: 'Сообщений',
                        data: [this.state.chat.general || 0, this.state.chat.family || 0, this.state.chat.admin || 0],
                        backgroundColor: ['#00ff88', '#ffd700', '#ff4444'],
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        }
    },

    /**
     * Получить метки для графиков
     */
    getLabels: function() {
        switch(this.state.period) {
            case 'day':
                return ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22'];
            case 'week':
                return ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
            case 'month':
                return Array.from({ length: 30 }, (_, i) => i + 1);
            case 'year':
                return ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
        }
    },

    /**
     * Получить данные пользователей
     */
    getUsersData: function() {
        // Заглушка
        return Array.from({ length: this.getLabels().length }, () => 
            Math.floor(Math.random() * 50) + 10
        );
    },

    /**
     * Получить данные книг
     */
    getBooksData: function() {
        // Заглушка
        return Array.from({ length: this.getLabels().length }, () => 
            Math.floor(Math.random() * 100) + 20
        );
    },

    /**
     * Данные выполненных заданий
     */
    getTasksCompletedData: function() {
        // Заглушка
        return Array.from({ length: this.getLabels().length }, () => 
            Math.floor(Math.random() * 200) + 50
        );
    },

    /**
     * Данные новых заданий
     */
    getTasksNewData: function() {
        // Заглушка
        return Array.from({ length: this.getLabels().length }, () => 
            Math.floor(Math.random() * 100) + 20
        );
    },

    /**
     * Топ пользователей
     */
    getTopUsers: function() {
        return [
            { name: 'Бледный', avatar: '👤', value: '30 уровень' },
            { name: 'Мария', avatar: '👩', value: '25 уровень' },
            { name: 'Папа', avatar: '👨', value: '18 уровень' },
            { name: 'Бабушка', avatar: '👵', value: '12 уровень' },
            { name: 'Анна', avatar: '👧', value: '8 уровень' }
        ];
    },

    /**
     * Активность по часам
     */
    getHourlyActivity: function() {
        // Заглушка
        return Array.from({ length: 24 }, () => Math.floor(Math.random() * 80) + 10);
    },

    /**
     * Размер localStorage
     */
    getStorageSize: function() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += (localStorage[key].length || 0);
            }
        }
        return Math.round(total / 1024 / 1024 * 100) / 100;
    },

    /**
     * Информация о браузере
     */
    getBrowserInfo: function() {
        const ua = navigator.userAgent;
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari')) return 'Safari';
        return 'Другой';
    },

    /**
     * Запуск realtime обновлений
     */
    startRealtimeUpdates: function() {
        setInterval(() => {
            this.state.realtime.online = Math.floor(Math.random() * 50) + 20;
            this.state.realtime.active = Math.floor(Math.random() * 200) + 100;
            this.state.realtime.requests = Math.floor(Math.random() * 30) + 10;
            
            document.getElementById('online-count').textContent = this.state.realtime.online;
            document.getElementById('active-count').textContent = this.state.realtime.active;
            document.getElementById('requests-count').textContent = this.state.realtime.requests;
        }, 5000);
    },

    /**
     * Обработчики
     */
    attachEvents: function() {
        document.getElementById('stats-period')?.addEventListener('change', (e) => {
            this.state.period = e.target.value;
            this.render();
        });

        document.getElementById('export-stats')?.addEventListener('click', () => {
            this.exportStats();
        });

        document.getElementById('refresh-stats')?.addEventListener('click', () => {
            this.render();
            MORI_APP.showToast('Статистика обновлена', 'success');
        });
    },

    /**
     * Экспорт статистики
     */
    exportStats: function() {
        const data = {
            exportDate: Date.now(),
            period: this.state.period,
            realtime: this.state.realtime,
            users: this.getUsersData(),
            books: this.getBooksData(),
            tasks: this.state.tasks,
            chat: this.state.chat
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `stats_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        MORI_APP.showToast('📊 Статистика экспортирована', 'success');
    },

    /**
     * Загрузка статистики
     */
    loadStats: function() {
        // Заглушка
        this.state.users = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `User ${i}` }));
        this.state.books = Array.from({ length: 20 }, (_, i) => ({ id: i, title: `Book ${i}` }));
        this.state.chat = {
            general: 1234,
            family: 567,
            admin: 89
        };
    }
};

// Экспорт
window.MORI_DEMIGURGE_STATS = MORI_DEMIGURGE_STATS;
