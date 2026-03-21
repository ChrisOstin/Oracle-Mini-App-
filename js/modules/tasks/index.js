/**
 * TASKS MODULE
 * Система заданий и ежедневных квестов
 * Версия: 1.0.0
 */

const MORI_TASKS = {
    // Состояние
    state: {
        activeTab: 'main',      // 'main' или 'daily'
        tasks: [],
        daily: [],
        streak: 0,
        lastDailyReset: null,
        energy: 5,
        maxEnergy: 5
    },

    // Основные задания (50 штук) с наградами
    mainTasks: [
        // БЛОК 1: ЗНАКОМСТВО (1-5)
        { id: 1, title: 'Первые шаги', description: 'Написать 5 сообщений', type: 'messages', target: 5, reward: 120, rewardType: 'settings', rewardName: 'Настройки', completed: false, progress: 0, unlocked: true },
        { id: 2, title: 'Любопытный', description: 'Зайти в настройки', type: 'settings', target: 1, reward: 120, rewardType: 'theme1', rewardName: 'Тема: MORI Classic', completed: false, progress: 0, unlocked: true },
        { id: 3, title: 'Стильный', description: 'Сменить тему', type: 'theme', target: 1, reward: 120, rewardType: 'theme2', rewardName: 'Тема: MORI Night', completed: false, progress: 0, unlocked: true },
        { id: 4, title: 'Коллекционер', description: 'Сменить тему 3 раза', type: 'theme', target: 3, reward: 120, rewardType: 'theme3', rewardName: 'Тема: MORI Gold', completed: false, progress: 0, unlocked: true },
        { id: 5, title: 'Исследователь', description: 'Написать 10 сообщений', type: 'messages', target: 10, reward: 120, rewardType: 'calculator', rewardName: 'Калькулятор', completed: false, progress: 0, unlocked: true },

        // БЛОК 2: КАЛЬКУЛЯТОР (6-10)
        { id: 6, title: 'Считалочка', description: 'Сделать 5 расчётов', type: 'calculations', target: 5, reward: 200, rewardType: 'precision4', rewardName: 'Точность 4 знака', completed: false, progress: 0, unlocked: false },
        { id: 7, title: 'Финансист', description: 'Сделать 15 расчётов', type: 'calculations', target: 15, reward: 200, rewardType: 'currencyRub', rewardName: 'Валюта RUB', completed: false, progress: 0, unlocked: false },
        { id: 8, title: 'Инвестор', description: 'Сделать 30 расчётов', type: 'calculations', target: 30, reward: 200, rewardType: 'calcChart', rewardName: 'График в калькуляторе', completed: false, progress: 0, unlocked: false },
        { id: 9, title: 'Аналитик', description: 'Сделать 50 расчётов', type: 'calculations', target: 50, reward: 200, rewardType: 'calcHistory', rewardName: 'История расчётов', completed: false, progress: 0, unlocked: false },
        { id: 10, title: 'Математик', description: 'Сделать 100 расчётов', type: 'calculations', target: 100, reward: 200, rewardType: 'calcExport', rewardName: 'Экспорт расчётов', completed: false, progress: 0, unlocked: false },

        // БЛОК 3: БИБЛИОТЕКА (11-17)
        { id: 11, title: 'Читатель', description: 'Написать 20 сообщений', type: 'messages', target: 20, reward: 320, rewardType: 'library', rewardName: 'Библиотека', completed: false, progress: 0, unlocked: false },
        { id: 12, title: 'Книжный червь', description: 'Прочитать 5 страниц', type: 'pages', target: 5, reward: 320, rewardType: 'book1', rewardName: 'Книга: Вавилон', completed: false, progress: 0, unlocked: false },
        { id: 13, title: 'Библиофил', description: 'Прочитать 10 страниц', type: 'pages', target: 10, reward: 320, rewardType: 'book2', rewardName: 'Книга: Богатый папа', completed: false, progress: 0, unlocked: false },
        { id: 14, title: 'Эрудит', description: 'Прочитать 15 страниц', type: 'pages', target: 15, reward: 320, rewardType: 'book3', rewardName: 'Книга: Квадрат потока', completed: false, progress: 0, unlocked: false },
        { id: 15, title: 'Профессор', description: 'Прочитать 20 страниц', type: 'pages', target: 20, reward: 320, rewardType: 'book4', rewardName: 'Книга: Челпанов', completed: false, progress: 0, unlocked: false },
        { id: 16, title: 'Мудрец', description: 'Прочитать 30 страниц', type: 'pages', target: 30, reward: 320, rewardType: 'book5', rewardName: 'Книга: Ледяной человек', completed: false, progress: 0, unlocked: false },
        { id: 17, title: 'Хранитель знаний', description: 'Прочитать 50 страниц', type: 'pages', target: 50, reward: 320, rewardType: 'allBooks', rewardName: 'Все остальные книги', completed: false, progress: 0, unlocked: false },

        // БЛОК 4: MORI AI (18-22)
        { id: 18, title: 'Любознательный', description: 'Написать 30 сообщений', type: 'messages', target: 30, reward: 320, rewardType: 'ai', rewardName: 'MORI AI', completed: false, progress: 0, unlocked: false },
        { id: 19, title: 'Почемучка', description: 'Задать 5 вопросов AI', type: 'ai', target: 5, reward: 320, rewardType: 'aiHistory', rewardName: 'История диалога', completed: false, progress: 0, unlocked: false },
        { id: 20, title: 'Исследователь', description: 'Задать 15 вопросов AI', type: 'ai', target: 15, reward: 320, rewardType: 'aiVoice', rewardName: 'Голосовой ввод', completed: false, progress: 0, unlocked: false },
        { id: 21, title: 'Философ', description: 'Задать 30 вопросов AI', type: 'ai', target: 30, reward: 320, rewardType: 'aiSave', rewardName: 'Сохранение диалогов', completed: false, progress: 0, unlocked: false },
        { id: 22, title: 'Мудрец', description: 'Задать 50 вопросов AI', type: 'ai', target: 50, reward: 320, rewardType: 'aiModel', rewardName: 'Выбор модели', completed: false, progress: 0, unlocked: false },

        // БЛОК 5: ТЕМЫ (23-32)
        { id: 23, title: 'Ценитель чёрного', description: 'Сделать 10 расчётов', type: 'calculations', target: 10, reward: 120, rewardType: 'theme4', rewardName: 'Тема: MORI Shadow', completed: false, progress: 0, unlocked: false },
        { id: 24, title: 'Ценитель золота', description: 'Прочитать 10 страниц', type: 'pages', target: 10, reward: 120, rewardType: 'theme5', rewardName: 'Тема: MORI Neon', completed: false, progress: 0, unlocked: false },
        { id: 25, title: 'Ценитель неона', description: 'Задать 5 вопросов AI', type: 'ai', target: 5, reward: 120, rewardType: 'theme6', rewardName: 'Тема: MORI Vintage', completed: false, progress: 0, unlocked: false },
        { id: 26, title: 'Ценитель винтажа', description: 'Написать 20 сообщений', type: 'messages', target: 20, reward: 120, rewardType: 'theme7', rewardName: 'Тема: MORI Royal', completed: false, progress: 0, unlocked: false },
        { id: 27, title: 'Ценитель роскоши', description: 'Сделать 20 расчётов', type: 'calculations', target: 20, reward: 120, rewardType: 'theme8', rewardName: 'Тема: MORI Stealth', completed: false, progress: 0, unlocked: false },
        { id: 28, title: 'Ценитель минимализма', description: 'Прочитать 15 страниц', type: 'pages', target: 15, reward: 120, rewardType: 'theme9', rewardName: 'Тема: MORI Cyber', completed: false, progress: 0, unlocked: false },
        { id: 29, title: 'Ценитель киберпанка', description: 'Задать 10 вопросов AI', type: 'ai', target: 10, reward: 120, rewardType: 'theme10', rewardName: 'Тема: MORI Warm', completed: false, progress: 0, unlocked: false },
        { id: 30, title: 'Ценитель тепла', description: 'Написать 30 сообщений', type: 'messages', target: 30, reward: 120, rewardType: 'theme11', rewardName: 'Тема: Красный', completed: false, progress: 0, unlocked: false },
        { id: 31, title: 'Ценитель страсти', description: 'Сделать 30 расчётов', type: 'calculations', target: 30, reward: 120, rewardType: 'theme12', rewardName: 'Тема: Синий', completed: false, progress: 0, unlocked: false },
        { id: 32, title: 'Ценитель спокойствия', description: 'Прочитать 20 страниц', type: 'pages', target: 20, reward: 120, rewardType: 'theme13', rewardName: 'Тема: Зелёный', completed: false, progress: 0, unlocked: false },

        // БЛОК 6: МУЗЫКА (33-37)
        { id: 33, title: 'Меломан', description: 'Написать 40 сообщений', type: 'messages', target: 40, reward: 320, rewardType: 'music', rewardName: 'Музыка', completed: false, progress: 0, unlocked: false },
        { id: 34, title: 'Слушатель', description: 'Послушать 5 треков', type: 'songs', target: 5, reward: 320, rewardType: 'playlists', rewardName: 'Плейлисты', completed: false, progress: 0, unlocked: false },
        { id: 35, title: 'Критик', description: 'Поставить лайк 10 трекам', type: 'likes', target: 10, reward: 320, rewardType: 'favorites', rewardName: 'Избранное', completed: false, progress: 0, unlocked: false },
        { id: 36, title: 'Коллекционер', description: 'Сохранить 20 треков', type: 'saves', target: 20, reward: 320, rewardType: 'familyPlaylist', rewardName: 'Семейный плейлист', completed: false, progress: 0, unlocked: false },
        { id: 37, title: 'Музыкальный гений', description: 'Создать свой плейлист', type: 'playlist', target: 1, reward: 320, rewardType: 'playlistExport', rewardName: 'Экспорт плейлиста', completed: false, progress: 0, unlocked: false },

        // БЛОК 7: АКТИВНОСТЬ (38-42) - вместо семьи
        { id: 38, title: 'Популярный', description: 'Получить 10 реакций на сообщения', type: 'reactions', target: 10, reward: 320, rewardType: 'reactions', rewardName: 'Реакции в чате', completed: false, progress: 0, unlocked: false },
        { id: 39, title: 'Коллекционер', description: 'Открыть 5 тем оформления', type: 'themes', target: 5, reward: 320, rewardType: 'themeCollector', rewardName: 'Коллекция тем', completed: false, progress: 0, unlocked: false },
        { id: 40, title: 'Ценитель', description: 'Поставить 10 оценок книгам', type: 'ratings', target: 10, reward: 320, rewardType: 'ratings', rewardName: 'Возможность оценивать', completed: false, progress: 0, unlocked: false },
        { id: 41, title: 'Эстет', description: 'Сменить тему 10 раз', type: 'themeChanges', target: 10, reward: 320, rewardType: 'themeMaster', rewardName: 'Мастер тем', completed: false, progress: 0, unlocked: false },
        { id: 42, title: 'Блогер', description: 'Написать 100 сообщений в чат', type: 'messages', target: 100, reward: 320, rewardType: 'blogger', rewardName: 'Статус "Блогер"', completed: false, progress: 0, unlocked: false },

        // БЛОК 8: СЕРИИ (43-46) - вместо игр
        { id: 43, title: 'Энергичный', description: 'Выполнить 10 ежедневных заданий', type: 'dailyTotal', target: 10, reward: 300, rewardType: 'dailyMaster', rewardName: '+1 энергия', completed: false, progress: 0, unlocked: false },
        { id: 44, title: 'Целеустремлённый', description: 'Достичь серии 7 дней', type: 'streak', target: 7, reward: 300, rewardType: 'streak7', rewardName: 'Бонус +50 опыта ежедневно', completed: false, progress: 0, unlocked: false },
        { id: 45, title: 'Настойчивый', description: 'Достичь серии 30 дней', type: 'streak', target: 30, reward: 300, rewardType: 'streak30', rewardName: 'Особая рамка', completed: false, progress: 0, unlocked: false },
        { id: 46, title: 'Легендарный', description: 'Достичь серии 100 дней', type: 'streak', target: 100, reward: 300, rewardType: 'streak100', rewardName: 'Эксклюзивная тема', completed: false, progress: 0, unlocked: false },

        // БЛОК 9: ФИНАЛ (47-50)
        { id: 47, title: 'Ценитель', description: 'Открыть 20 функций', type: 'features', target: 20, reward: 550, rewardType: 'achievements', rewardName: 'Раздел "Достижения"', completed: false, progress: 0, unlocked: false },
        { id: 48, title: 'Коллекционер', description: 'Открыть 30 функций', type: 'features', target: 30, reward: 550, rewardType: 'collectorBadge', rewardName: 'Бейдж "Коллекционер"', completed: false, progress: 0, unlocked: false },
        { id: 49, title: 'Ветеран', description: 'Заходить 30 дней подряд', type: 'streak', target: 30, reward: 550, rewardType: 'veteranFrame', rewardName: 'Рамка "Ветеран"', completed: false, progress: 0, unlocked: false },
        { id: 50, title: 'Легенда', description: 'Выполнить все 50 заданий', type: 'complete', target: 50, reward: 550, rewardType: 'legendRole', rewardName: 'Роль "Легенда" в чате', completed: false, progress: 0, unlocked: false }
    ],

    // Ежедневные задания (5 штук)
    dailyTasks: [
        { id: 'd1', title: 'Болтун', description: 'Написать 3 сообщения', type: 'messages', target: 3, reward: 15, energyCost: 1, completed: false, progress: 0, icon: '💬' },
        { id: 'd2', title: 'Читатель', description: 'Прочитать 2 страницы', type: 'pages', target: 2, reward: 10, energyCost: 1, completed: false, progress: 0, icon: '📖' },
        { id: 'd3', title: 'Счётчик', description: 'Сделать 2 расчёта', type: 'calculations', target: 2, reward: 10, energyCost: 1, completed: false, progress: 0, icon: '🧮' },
        { id: 'd4', title: 'Любопытный', description: 'Задать 1 вопрос AI', type: 'ai', target: 1, reward: 10, energyCost: 1, completed: false, progress: 0, icon: '🧠' },
        { id: 'd5', title: 'Гость', description: 'Зайти в приложение', type: 'login', target: 1, reward: 5, energyCost: 1, completed: false, progress: 0, icon: '🔐' }
    ],

    // Бонусы за серию
    streakBonuses: {
        7: { exp: 50, description: '7 дней подряд' },
        30: { exp: 200, description: '30 дней подряд' },
        90: { exp: 500, description: '90 дней подряд' },
        180: { exp: 1000, description: '180 дней подряд' },
        365: { exp: 2000, description: '365 дней подряд' }
    },

    /**
     * Инициализация
     */
    init: function() {
        console.log('MORI_TASKS инициализация...');
        this.loadProgress();
        this.checkDailyReset();
        this.updateUnlockedTasks();
    },

    /**
     * Рендер
     */
    render: function() {
        const content = document.getElementById('tasks-content');
        if (!content) return;

        // 👑 ЕСЛИ АДМИН - ПОКАЗЫВАЕМ ЗАГЛУШКУ
        if (MORI_AUTH.isAdmin()) {
            content.innerHTML = `
                <div class="admin-message">
                    <div class="admin-icon">👑</div>
                    <h3>Вам доступно всё</h3>
                    <p>Как администратору, все функции открыты сразу</p>
                    <div class="admin-stats">
                        <div class="stat-item">
                            <span class="stat-value">50/50</span>
                            <span class="stat-label">заданий</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">30</span>
                            <span class="stat-label">уровень</span>
                        </div>
                    </div>
                    <button class="admin-reset" id="admin-reset-tasks">🔄 Сбросить прогресс (для теста)</button>
                </div>
            `;

            document.getElementById('admin-reset-tasks')?.addEventListener('click', () => {
                if (confirm('Сбросить прогресс заданий для теста?')) {
                    localStorage.removeItem('tasks_progress');
                    MORI_APP.showToast('Прогресс сброшен', 'success');
                }
            });

            return;
        }

        // Для обычных юзеров и семьи - показываем задания
        content.innerHTML = this.getHTML();
        this.attachEvents();
    },

    /**
     * HTML
     */
    getHTML: function() {
        const filteredTasks = this.state.activeTab === 'main' 
            ? this.mainTasks.filter(t => t.unlocked)
            : this.dailyTasks;

        return `
            <div class="tasks-screen">
                <!-- Шапка -->
                <div class="tasks-header">
                    <h2>🎮 Задания</h2>
                    <div class="tasks-stats">
                        ⚡ ${this.state.energy}/${this.state.maxEnergy}
                    </div>
                </div>

                <!-- Вкладки -->
                <div class="tasks-tabs">
                    <button class="tasks-tab ${this.state.activeTab === 'main' ? 'active' : ''}" 
                            data-tab="main">
                        Основные (${this.getCompletedCount()}/${this.mainTasks.length})
                    </button>
                    <button class="tasks-tab ${this.state.activeTab === 'daily' ? 'active' : ''}" 
                            data-tab="daily">
                        Ежедневные
                    </button>
                </div>

                <!-- Список заданий -->
                <div class="tasks-list">
                    ${this.state.activeTab === 'daily' ? this.renderDailyHeader() : ''}
                    ${filteredTasks.map(task => this.renderTask(task)).join('')}
                    ${this.state.activeTab === 'daily' ? this.renderStreakBonus() : ''}
                </div>
            </div>
        `;
    },

    /**
     * Количество выполненных
     */
    getCompletedCount: function() {
        return this.mainTasks.filter(t => t.completed).length;
    },

    /**
     * Шапка ежедневных
     */
    renderDailyHeader: function() {
        return `
            <div class="daily-section">
                <div class="daily-header">
                    <h3>📅 Ежедневные задания</h3>
                    <div class="daily-streak">
                        🔥 ${this.state.streak} <span>дней</span>
                    </div>
                </div>
                <div class="daily-grid">
                    ${this.dailyTasks.map(task => `
                        <div class="daily-item ${task.completed ? 'completed' : ''}" 
                             data-daily-id="${task.id}">
                            <span class="daily-icon">${task.icon}</span>
                            <span class="daily-value">+${task.reward}</span>
                            <span class="daily-label">⚡${task.energyCost}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Карточка задания
     */
    renderTask: function(task) {
        const progress = task.completed ? 100 : Math.floor((task.progress / task.target) * 100);
        
        return `
            <div class="task-card ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="task-header">
                    <div class="task-title">
                        <span class="task-icon">${this.getTaskIcon(task.type)}</span>
                        ${task.title}
                    </div>
                    <div class="task-reward">
                        +${task.reward} <span>опыта</span>
                    </div>
                </div>
                
                <div class="task-description">
                    ${task.description}
                </div>

                ${!task.completed ? `
                    <div class="task-progress">
                        <div class="progress-header">
                            <span>${task.progress}/${task.target}</span>
                            <span>${progress}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                ` : ''}

                ${task.rewardName && !task.completed ? `
                    <div class="task-reward-info">
                        🎁 Награда: ${task.rewardName}
                    </div>
                ` : ''}
            </div>
        `;
    },

    /**
     * Бонус за серию
     */
    renderStreakBonus: function() {
        const nextBonus = this.getNextStreakBonus();
        
        return `
            <div class="streak-bonus">
                <div class="streak-title">
                    🔥 Бонус за серию
                </div>
                <div class="streak-progress">
                    <div class="streak-fill" style="width: ${this.getStreakProgress()}%"></div>
                </div>
                <div class="streak-milestones">
                    ${[7, 30, 90, 180, 365].map(day => `
                        <div class="streak-milestone">
                            <span class="milestone-value">${day}</span>
                            <span>${this.state.streak >= day ? '✅' : '⏳'}</span>
                        </div>
                    `).join('')}
                </div>
                ${nextBonus ? `
                    <div class="next-bonus">
                        Следующий бонус: +${nextBonus.exp} опыта через ${nextBonus.daysLeft} дней
                    </div>
                ` : ''}
            </div>
        `;
    },

    /**
     * Иконка для типа задания
     */
    getTaskIcon: function(type) {
        const icons = {
            messages: '💬',
            pages: '📖',
            calculations: '🧮',
            ai: '🧠',
            theme: '🎨',
            settings: '⚙️',
            login: '🔐',
            songs: '🎵',
            likes: '❤️',
            saves: '💾',
            playlist: '📋',
            reactions: '👍',
            themes: '🎭',
            ratings: '⭐',
            themeChanges: '🔄',
            dailyTotal: '📊',
            streak: '🔥',
            features: '🔓',
            complete: '⭐'
        };
        return icons[type] || '📌';
    },

    /**
     * Обработчики
     */
    attachEvents: function() {
        // Переключение вкладок
        document.querySelectorAll('.tasks-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.setState({ activeTab: tabName });
            });
        });

        // Клик по иконке в сетке
        document.querySelectorAll('.daily-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const dailyId = e.currentTarget.dataset.dailyId;
                this.completeDailyTask(dailyId);
            });
        });
    },

    /**
     * Выполнение ежедневного задания
     */
    completeDailyTask: function(dailyId) {
        const task = this.dailyTasks.find(t => t.id === dailyId);
        
        if (!task || task.completed) {
            MORI_APP.showToast('Задание уже выполнено', 'info');
            return;
        }

        if (this.state.energy < task.energyCost) {
            MORI_APP.showToast('Недостаточно энергии', 'error');
            return;
        }

        // Отнимаем энергию
        this.state.energy -= task.energyCost;
        
        // Помечаем как выполненное
        task.completed = true;
        task.progress = task.target;

        // Добавляем опыт
        if (MORI_USER.current) {
            MORI_USER.addExperience(task.reward);
        }

        // Показываем уведомление
        this.showRewardNotification({
            title: task.title,
            description: task.description,
            reward: task.reward,
            icon: task.icon
        });

        // Проверяем, все ли выполнены
        this.checkAllDailyCompleted();
        
        this.saveProgress();
        this.render();
    },

    /**
     * Проверка выполнения всех ежедневных
     */
    checkAllDailyCompleted: function() {
        const allCompleted = this.dailyTasks.every(t => t.completed);
        
        if (allCompleted) {
            this.state.streak++;
            this.saveProgress();
            MORI_APP.showToast(`🔥 Серия: ${this.state.streak} дней!`, 'success');
            
            // Проверяем бонусы
            this.checkStreakBonus();
        }
    },

    /**
     * Проверка бонуса за серию
     */
    checkStreakBonus: function() {
        const bonus = this.streakBonuses[this.state.streak];
        if (bonus) {
            MORI_USER.addExperience(bonus.exp);
            this.showRewardNotification({
                title: 'Бонус за серию!',
                description: bonus.description,
                reward: bonus.exp,
                icon: '🔥'
            });
        }
    },

    /**
     * Уведомление о награде
     */
    showRewardNotification: function(data) {
        const notification = document.createElement('div');
        notification.className = 'reward-notification';
        notification.innerHTML = `
            <div class="reward-icon">${data.icon || '🎁'}</div>
            <div class="reward-content">
                <div class="reward-title">${data.title}</div>
                <div class="reward-description">${data.description || ''}</div>
                <div class="reward-exp">+<span>${data.reward}</span> опыта</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    },

    /**
     * Обновление прогресса задания
     */
    updateProgress: function(type, value) {
        // Основные задания
        this.mainTasks.forEach(task => {
            if (!task.completed && task.type === type && task.unlocked) {
                task.progress = Math.min(task.progress + value, task.target);
                
                if (task.progress >= task.target) {
                    this.completeTask(task);
                }
            }
        });

        // Ежедневные задания
        this.dailyTasks.forEach(task => {
            if (!task.completed && task.type === type && this.state.energy >= task.energyCost) {
                task.progress = Math.min(task.progress + value, task.target);
                
                if (task.progress >= task.target) {
                    this.completeDailyTask(task.id);
                }
            }
        });

        this.saveProgress();
    },

    /**
     * Выполнение основного задания
     */
    completeTask: function(task) {
        task.completed = true;
        
        // Добавляем опыт
        if (MORI_USER.current) {
            MORI_USER.addExperience(task.reward);
        }

        // Определяем награду в зависимости от уровня доступа
        let rewardType = task.rewardType;
        let rewardName = task.rewardName;
        
        // Если пользователь из семьи или админ - получают семейные функции
        if (MORI_AUTH.isFamily()) {
            // Переназначаем награды для семьи
            const familyRewards = {
                // БЛОК 7: было для всех, для семьи становится семейным
                'reactions': { type: 'familyChat', name: 'Семейный чат' },
                'themeCollector': { type: 'house', name: 'Дом' },
                'ratings': { type: 'familyBudget', name: 'Семейный бюджет' },
                'themeMaster': { type: 'familyCalendar', name: 'Семейный календарь' },
                'blogger': { type: 'familyNotes', name: 'Семейные заметки' },
                
                // БЛОК 8: для семьи игровые функции
                'dailyMaster': { type: 'games', name: 'Игры' },
                'streak7': { type: 'customDeck', name: 'Своя колода' },
                'streak30': { type: 'gameStats', name: 'Статистика игр' },
                'streak100': { type: 'championTheme', name: 'Тема "Чемпион"' }
            };
            
            if (familyRewards[task.rewardType]) {
                rewardType = familyRewards[task.rewardType].type;
                rewardName = familyRewards[task.rewardType].name;
            }
        }

        // Разблокируем награду
        if (rewardType && MORI_USER.current) {
            MORI_USER.current.unlockedFeatures.push(rewardType);
            MORI_USER.save();
            
            MORI_APP.showToast(`🔓 Разблокировано: ${rewardName}!`, 'success', 4000);
        }

        // Разблокируем следующие задания
        this.updateUnlockedTasks();

        // Показываем уведомление
        this.showRewardNotification({
            title: task.title,
            description: rewardName ? `Награда: ${rewardName}` : '',
            reward: task.reward,
            icon: '🏆'
        });
    },

    /**
     * Обновление доступности заданий
     */
    updateUnlockedTasks: function() {
        // Разблокируем задания по порядку
        for (let i = 0; i < this.mainTasks.length; i++) {
            if (i === 0) {
                this.mainTasks[i].unlocked = true;
            } else if (this.mainTasks[i-1].completed) {
                this.mainTasks[i].unlocked = true;
            }
        }
    },

    /**
     * Получение следующего бонуса
     */
    getNextStreakBonus: function() {
        const nextMilestone = [7, 30, 90, 180, 365].find(d => d > this.state.streak);
        if (!nextMilestone) return null;
        
        return {
            days: nextMilestone,
            daysLeft: nextMilestone - this.state.streak,
            exp: this.streakBonuses[nextMilestone].exp
        };
    },

    /**
     * Прогресс до следующего бонуса
     */
    getStreakProgress: function() {
        const next = this.getNextStreakBonus();
        if (!next) return 100;
        
        const prev = [0, 7, 30, 90, 180].filter(d => d < this.state.streak).pop() || 0;
        const range = next.days - prev;
        const progress = ((this.state.streak - prev) / range) * 100;
        
        return Math.min(progress, 100);
    },

    /**
     * Проверка сброса ежедневных
     */
    checkDailyReset: function() {
        const now = new Date();
        const lastReset = this.state.lastDailyReset ? new Date(this.state.lastDailyReset) : null;
        
        if (!lastReset || now.toDateString() !== lastReset.toDateString()) {
            // Сбрасываем ежедневные задания
            this.dailyTasks.forEach(t => {
                t.completed = false;
                t.progress = 0;
            });
            
            // Восстанавливаем энергию
            this.state.energy = this.state.maxEnergy;
            this.state.lastDailyReset = now.toISOString();
            
            this.saveProgress();
        }
    },

    /**
     * Загрузка прогресса
     */
    loadProgress: function() {
        try {
            const saved = localStorage.getItem('tasks_progress');
            if (saved) {
                const data = JSON.parse(saved);
                
                // Восстанавливаем прогресс заданий
                if (data.mainTasks) {
                    data.mainTasks.forEach((savedTask, i) => {
                        if (this.mainTasks[i]) {
                            this.mainTasks[i].progress = savedTask.progress;
                            this.mainTasks[i].completed = savedTask.completed;
                        }
                    });
                }
                
                if (data.dailyTasks) {
                    data.dailyTasks.forEach((savedTask, i) => {
                        if (this.dailyTasks[i]) {
                            this.dailyTasks[i].progress = savedTask.progress;
                            this.dailyTasks[i].completed = savedTask.completed;
                        }
                    });
                }
                
                this.state.streak = data.streak || 0;
                this.state.energy = data.energy || 5;
                this.state.lastDailyReset = data.lastDailyReset;
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
        
        this.updateUnlockedTasks();
    },

    /**
     * Сохранение прогресса
     */
    saveProgress: function() {
        try {
            const data = {
                mainTasks: this.mainTasks.map(t => ({ progress: t.progress, completed: t.completed })),
                dailyTasks: this.dailyTasks.map(t => ({ progress: t.progress, completed: t.completed })),
                streak: this.state.streak,
                energy: this.state.energy,
                lastDailyReset: this.state.lastDailyReset
            };
            localStorage.setItem('tasks_progress', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving tasks:', error);
        }
    },

    /**
     * Обновление состояния
     */
    setState: function(newState) {
        this.state = { ...this.state, ...newState };
        this.render();
    }
};

// Экспорт
window.MORI_TASKS = MORI_TASKS;
