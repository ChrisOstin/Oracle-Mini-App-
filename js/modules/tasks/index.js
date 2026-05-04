/**
 * TASKS MODULE — задания, ежедневки, аватары, статистика
 * Версия: 2.0.0 (Android-телефон, стиль Профессора Мориарти)
 */

const MORI_TASKS = {
    // Состояние
    state: {
        activeTab: 'main',        // main, daily, avatars, stats
        tasks: [],
        dailyTasks: [],
        streak: 0,
        lastDailyReset: null,
        energy: 5,
        maxEnergy: 5,
        chestOpenedToday: false,
        energyBoughtToday: 0,
        completedTasks: 0,
        totalXP: 0
    },

    // Инициализация
    init: function() {
        console.log('📋 MORI_TASKS инициализация...');
        this.loadData();
        this.checkDailyReset();
        this.updateUnlockedTasks();
        this.calculateStats();
    },

    // Загрузка данных
    loadData: function() {
        // Копируем данные из MORI_TASKS_DATA
        this.state.tasks = JSON.parse(JSON.stringify(MORI_TASKS_DATA.mainTasks));
        this.state.dailyTasks = JSON.parse(JSON.stringify(MORI_TASKS_DATA.dailyTasks));
        
        // Загружаем сохранённый прогресс
        const saved = localStorage.getItem('tasks_progress');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.tasks) {
                    data.tasks.forEach((savedTask, i) => {
                        if (this.state.tasks[i]) {
                            this.state.tasks[i].progress = savedTask.progress;
                            this.state.tasks[i].completed = savedTask.completed;
                            this.state.tasks[i].unlocked = savedTask.unlocked;
                        }
                    });
                }
                if (data.dailyTasks) {
                    data.dailyTasks.forEach((savedTask, i) => {
                        if (this.state.dailyTasks[i]) {
                            this.state.dailyTasks[i].progress = savedTask.progress;
                            this.state.dailyTasks[i].completed = savedTask.completed;
                        }
                    });
                }
                this.state.streak = data.streak || 0;
                this.state.energy = data.energy !== undefined ? data.energy : 5;
                this.state.chestOpenedToday = data.chestOpenedToday || false;
                this.state.energyBoughtToday = data.energyBoughtToday || 0;
                this.state.lastDailyReset = data.lastDailyReset;
            } catch(e) {}
        }
        
        this.updateUnlockedTasks();
        this.saveProgress();
    },

    // Сохранение прогресса
    saveProgress: function() {
        const data = {
            tasks: this.state.tasks.map(t => ({ progress: t.progress, completed: t.completed, unlocked: t.unlocked })),
            dailyTasks: this.state.dailyTasks.map(t => ({ progress: t.progress, completed: t.completed })),
            streak: this.state.streak,
            energy: this.state.energy,
            chestOpenedToday: this.state.chestOpenedToday,
            energyBoughtToday: this.state.energyBoughtToday,
            lastDailyReset: this.state.lastDailyReset
        };
        localStorage.setItem('tasks_progress', JSON.stringify(data));
    },

    // Рендер
    render: function() {
        const content = document.getElementById('tasks-content');
        if (!content) return;
        
        content.innerHTML = this.getHTML();
        this.attachEvents();
    },

    // HTML
    getHTML: function() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        
        return `
            <div class="phone-screen">
                <div class="phone-status-bar">
                    <span>${timeStr}</span>
                    <span>📶 🔋 85%</span>
                </div>
                <button class="phone-back-btn" id="tasks-back-btn">← Все приложения</button>
                
                <div class="phone-tabs">
                    <button class="phone-tab ${this.state.activeTab === 'main' ? 'active' : ''}" data-tab="main">ОСНОВНЫЕ</button>
                    <button class="phone-tab ${this.state.activeTab === 'daily' ? 'active' : ''}" data-tab="daily">ЕЖЕДНЕВНЫЕ</button>
                    <button class="phone-tab ${this.state.activeTab === 'avatars' ? 'active' : ''}" data-tab="avatars">🏆 АВАТАРЫ</button>
                    <button class="phone-tab ${this.state.activeTab === 'stats' ? 'active' : ''}" data-tab="stats">📊 СТАТИСТИКА</button>
                </div>
                
                <div class="phone-content">
                    ${this.renderActiveTab()}
                </div>
            </div>
        `;
    },

    // Рендер активной вкладки
    renderActiveTab: function() {
        switch(this.state.activeTab) {
            case 'main': return this.renderMainTasks();
            case 'daily': return this.renderDailyTasks();
            case 'avatars': return this.renderAvatars();
            case 'stats': return this.renderStats();
            default: return this.renderMainTasks();
        }
    },

    // Вкладка: ОСНОВНЫЕ ЗАДАНИЯ
    renderMainTasks: function() {
        const completedCount = this.state.tasks.filter(t => t.completed).length;
        const totalCount = this.state.tasks.length;
        
        return `
            <div class="tasks-header">
                <span>📋 Прогресс: ${completedCount}/${totalCount}</span>
                <span>🎯 Всего XP: ${this.state.totalXP}</span>
            </div>
            <div class="tasks-list">
                ${this.state.tasks.map(task => this.renderTaskCard(task)).join('')}
            </div>
        `;
    },

    // Карточка задания
    renderTaskCard: function(task) {
        const progressPercent = task.completed ? 100 : Math.floor((task.progress / task.target) * 100);
        const isUnlocked = task.unlocked;
        const routes = MORI_TASKS_DATA.taskRoutes;
        const hasRoute = routes[task.type];
        
        if (!isUnlocked) {
            return `
                <div class="task-card locked">
                    <div class="task-title">🔒 ${task.title}</div>
                    <div class="task-desc">Выполните предыдущее задание</div>
                </div>
            `;
        }
        
        return `
            <div class="task-card ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="task-header">
                    <div class="task-title">
                        <span class="task-icon">${this.getTaskIcon(task.type)}</span>
                        ${task.title}
                    </div>
                    <div class="task-reward">+${task.reward} XP</div>
                </div>
                <div class="task-desc">${task.description}</div>
                ${!task.completed ? `
                    <div class="task-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                        <div class="progress-text">${task.progress}/${task.target}</div>
                    </div>
                ` : `
                    <div class="task-completed-mark">✅ Выполнено!</div>
                `}
                ${task.rewardName && !task.completed ? `
                    <div class="task-reward-info">🎁 Награда: ${task.rewardName}</div>
                ` : ''}
                ${!task.completed ? `
                    <button class="task-go-btn ${!hasRoute ? 'warning' : ''}" data-type="${task.type}">
                        ${hasRoute ? '📖 Перейти' : '⚠️ Добавить ID'}
                    </button>
                ` : ''}
            </div>
        `;
    },

    // Вкладка: ЕЖЕДНЕВНЫЕ ЗАДАНИЯ
    renderDailyTasks: function() {
        const completedDaily = this.state.dailyTasks.filter(t => t.completed).length;
        const totalDaily = this.state.dailyTasks.length;
        const allCompleted = completedDaily === totalDaily;
        const nextBonus = this.getNextStreakBonus();
        const dailyProgressBonus = this.getDailyProgressBonus();
        
        return `
            <div class="daily-header">
                <div class="daily-streak">🔥 Серия: ${this.state.streak} дней</div>
                <div class="daily-energy">⚡ Энергия: ${this.state.energy}/${this.state.maxEnergy}</div>
            </div>
            
            <div class="daily-grid">
                ${this.state.dailyTasks.map(task => `
                    <div class="daily-item ${task.completed ? 'completed' : ''}" data-daily-id="${task.id}">
                        <div class="daily-icon">${task.icon}</div>
                        <div class="daily-reward">+${task.reward}</div>
                        <div class="daily-energy-cost">⚡${task.energyCost}</div>
                    </div>
                `).join('')}
            </div>
            
            <div class="daily-progress-bar">
                <div class="progress-label">Прогресс дня</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(completedDaily / totalDaily) * 100}%"></div>
                </div>
                <div class="progress-bonuses">
                    <span class="${completedDaily >= 1 ? 'achieved' : ''}">1/5: +5 XP</span>
                    <span class="${completedDaily >= 3 ? 'achieved' : ''}">3/5: +10 XP</span>
                    <span class="${completedDaily >= 5 ? 'achieved' : ''}">5/5: +50 MORI Coin</span>
                </div>
            </div>
            
            ${allCompleted && !this.state.chestOpenedToday ? `
                <button class="daily-chest-btn" id="daily-chest-btn">🎁 Открыть сундук</button>
            ` : ''}
            
            <div class="daily-shop">
                <button class="buy-energy-btn" id="buy-energy-btn">⚡ Купить энергию (100 MORI Coin)</button>
                <div class="buy-energy-limit">Сегодня: ${this.state.energyBoughtToday}/3</div>
            </div>
            
            <div class="streak-bonus">
                <div class="streak-title">🔥 Бонус за серию</div>
                <div class="streak-progress">
                    <div class="streak-fill" style="width: ${this.getStreakProgress()}%"></div>
                </div>
                <div class="streak-milestones">
                    ${[7, 30, 90, 180, 365].map(day => `
                        <div class="streak-milestone ${this.state.streak >= day ? 'achieved' : ''}">
                            <span>${day}</span>
                            <span>${this.state.streak >= day ? '✅' : '⏳'}</span>
                        </div>
                    `).join('')}
                </div>
                ${nextBonus ? `<div class="next-bonus">Следующий: +${nextBonus.exp} XP через ${nextBonus.daysLeft} дней</div>` : ''}
            </div>
        `;
    },

    // Вкладка: АВАТАРЫ
    renderAvatars: function() {
        const unlockedAvatars = JSON.parse(localStorage.getItem('unlocked_avatars') || '[]');
        
        return `
            <div class="avatars-header">
                <span>🏆 Редкие аватары за задания</span>
            </div>
            <div class="avatars-grid">
                ${MORI_TASKS_DATA.rareAvatars.map(avatar => {
                    const isUnlocked = unlockedAvatars.includes(avatar.id);
                    const progress = this.getAvatarProgress(avatar);
                    return `
                        <div class="avatar-card ${isUnlocked ? 'unlocked' : 'locked'}" data-avatar-id="${avatar.id}">
                            <div class="avatar-icon">${avatar.icon}</div>
                            <div class="avatar-name">${avatar.name}</div>
                            ${!isUnlocked ? `
                                <div class="avatar-condition">${avatar.condition}</div>
                                <div class="avatar-progress">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${progress.percent}%"></div>
                                    </div>
                                    <div class="progress-text">${progress.current}/${progress.required}</div>
                                </div>
                            ` : '<div class="avatar-unlocked">✅ Получен</div>'}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    // Вкладка: СТАТИСТИКА
    renderStats: function() {
        const completedCount = this.state.tasks.filter(t => t.completed).length;
        const totalCount = this.state.tasks.length;
        const percent = Math.floor((completedCount / totalCount) * 100);
        const categoryProgress = this.getCategoryProgress();
        const nextRewards = this.getNextRewards();
        const closestAchievement = this.getClosestAchievement();
        
        return `
            <div class="stats-container">
                <div class="stats-chart">
                    <div class="chart-circle" data-percent="${percent}">
                        <svg viewBox="0 0 36 36" class="circular-chart">
                            <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path class="circle" stroke-dasharray="${percent}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <text x="18" y="20.35" class="percentage">${percent}%</text>
                        </svg>
                    </div>
                    <div class="chart-label">Выполнено ${completedCount}/${totalCount}</div>
                </div>
                
                <div class="stats-categories">
                    <h4>📂 Прогресс по категориям</h4>
                    ${categoryProgress.map(cat => `
                        <div class="category-item">
                            <span class="category-name">${cat.name}</span>
                            <div class="category-bar">
                                <div class="category-fill" style="width: ${cat.percent}%"></div>
                            </div>
                            <span class="category-value">${cat.completed}/${cat.total}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="stats-rewards">
                    <h4>🎁 Следующие награды</h4>
                    ${nextRewards.map(reward => `
                        <div class="reward-item">
                            <span class="reward-name">${reward.name}</span>
                            <div class="reward-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${reward.percent}%"></div>
                                </div>
                            </div>
                            <span class="reward-left">осталось ${reward.left}</span>
                        </div>
                    `).join('')}
                </div>
                
                ${closestAchievement ? `
                    <div class="stats-achievement">
                        <h4>🏆 Ближайшее достижение</h4>
                        <div class="achievement-item">
                            <div class="achievement-icon">${closestAchievement.icon}</div>
                            <div class="achievement-info">
                                <div class="achievement-name">${closestAchievement.name}</div>
                                <div class="achievement-desc">${closestAchievement.description}</div>
                                <div class="achievement-progress">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${closestAchievement.percent}%"></div>
                                    </div>
                                    <div class="progress-text">${closestAchievement.current}/${closestAchievement.required}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    },

    // Обновление доступности заданий
    updateUnlockedTasks: function() {
        for (let i = 0; i < this.state.tasks.length; i++) {
            if (i === 0) {
                this.state.tasks[i].unlocked = true;
            } else if (this.state.tasks[i-1].completed) {
                this.state.tasks[i].unlocked = true;
            }
        }
    },

    // Обновление прогресса (вызывается из других модулей)
    updateProgress: function(type, value) {
        let changed = false;
        
        // Основные задания
        this.state.tasks.forEach(task => {
            if (!task.completed && task.unlocked && task.type === type) {
                const oldProgress = task.progress;
                task.progress = Math.min(task.progress + value, task.target);
                if (task.progress >= task.target && !task.completed) {
                    task.completed = true;
                    this.completeTask(task);
                    changed = true;
                } else if (task.progress !== oldProgress) {
                    changed = true;
                }
            }
        });
        
        // Ежедневные задания
        this.state.dailyTasks.forEach(task => {
            if (!task.completed && task.type === type && this.state.energy >= task.energyCost) {
                const oldProgress = task.progress;
                task.progress = Math.min(task.progress + value, task.target);
                if (task.progress >= task.target && !task.completed) {
                    task.completed = true;
                    this.completeDailyTask(task);
                    changed = true;
                } else if (task.progress !== oldProgress) {
                    changed = true;
                }
            }
        });
        
        if (changed) {
            this.saveProgress();
            if (this.state.activeTab === 'main') this.renderMainTasksUpdate();
            else this.render();
        }
    },
    
    // Выполнение основного задания
    completeTask: function(task) {
        task.completed = true;
        
        // Добавляем опыт
        if (window.MORI_USER) {
            MORI_USER.addExperience(task.reward);
            this.state.totalXP += task.reward;
        }
        
        // Разблокируем награду
        if (task.rewardType && window.MORI_USER) {
            MORI_USER.current.unlockedFeatures = MORI_USER.current.unlockedFeatures || [];
            if (!MORI_USER.current.unlockedFeatures.includes(task.rewardType)) {
                MORI_USER.current.unlockedFeatures.push(task.rewardType);
                MORI_USER.save();
                MORI_APP.showToast(`🔓 Разблокировано: ${task.rewardName}!`, 'success', 4000);
            }
        }
        
        // Показываем анимацию
        this.showTaskCompleteAnimation(task);
        
        // Обновляем доступность следующих заданий
        this.updateUnlockedTasks();
        this.saveProgress();
        this.calculateStats();
        
        // Проверяем аватары
        this.checkAvatarUnlocks();
    },
    
    // Выполнение ежедневного задания
    completeDailyTask: function(task) {
        if (this.state.energy < task.energyCost) {
            MORI_APP.showToast('⚡ Недостаточно энергии!', 'error');
            return;
        }
        
        this.state.energy -= task.energyCost;
        task.completed = true;
        
        if (window.MORI_USER) {
            MORI_USER.addExperience(task.reward);
            this.state.totalXP += task.reward;
        }
        
        this.showDailyTaskComplete(task);
        
        // Проверяем, все ли ежедневки выполнены
        const allCompleted = this.state.dailyTasks.every(t => t.completed);
        if (allCompleted) {
            this.state.streak++;
            this.saveProgress();
            MORI_APP.showToast(`🔥 Серия: ${this.state.streak} дней!`, 'success');
            this.checkStreakBonus();
        }
        
        this.saveProgress();
        this.render();
    },
    
    // Открытие сундука
    openDailyChest: function() {
        if (this.state.chestOpenedToday) {
            MORI_APP.showToast('Сундук уже открыт сегодня!', 'info');
            return;
        }
        
        const reward = Math.floor(Math.random() * (200 - 50 + 1) + 50);
        if (window.MORI_USER) {
            MORI_USER.addBalance(reward);
        }
        this.state.chestOpenedToday = true;
        this.saveProgress();
        MORI_APP.showToast(`🎁 +${reward} MORI Coin!`, 'success');
        this.render();
    },
    
    // Покупка энергии
    buyEnergy: function() {
        const price = 100;
        const maxDaily = 3;
        
        if (this.state.energyBoughtToday >= maxDaily) {
            MORI_APP.showToast('❌ Лимит покупок на сегодня (3)', 'error');
            return;
        }
        
        if (window.MORI_USER) {
            const balance = MORI_USER.getBalance ? MORI_USER.getBalance() : 0;
            if (balance < price) {
                MORI_APP.showToast('❌ Недостаточно MORI Coin', 'error');
                return;
            }
            MORI_USER.addBalance(-price);
        }
        
        this.state.energy = Math.min(this.state.maxEnergy, this.state.energy + 1);
        this.state.energyBoughtToday++;
        this.saveProgress();
        MORI_APP.showToast('⚡ +1 энергия!', 'success');
        this.render();
    },
    
    // Проверка сброса ежедневных заданий
    checkDailyReset: function() {
        const now = new Date();
        const lastReset = this.state.lastDailyReset ? new Date(this.state.lastDailyReset) : null;
        
        if (!lastReset || now.toDateString() !== lastReset.toDateString()) {
            // Сбрасываем ежедневные задания
            this.state.dailyTasks.forEach(t => {
                t.completed = false;
                t.progress = 0;
            });
            
            // Восстанавливаем энергию
            this.state.energy = this.state.maxEnergy;
            this.state.chestOpenedToday = false;
            this.state.energyBoughtToday = 0;
            this.state.lastDailyReset = now.toISOString();
            
            this.saveProgress();
        }
    },
    
    // Проверка бонуса за серию
    checkStreakBonus: function() {
        const bonus = MORI_TASKS_DATA.streakBonuses[this.state.streak];
        if (bonus && window.MORI_USER) {
            MORI_USER.addExperience(bonus.exp);
            MORI_APP.showToast(`🔥 Бонус за серию ${this.state.streak} дней! +${bonus.exp} XP`, 'success');
        }
    },
    
    // Проверка разблокировки аватаров
    checkAvatarUnlocks: function() {
        const unlocked = JSON.parse(localStorage.getItem('unlocked_avatars') || '[]');
        let changed = false;
        
        // Получаем статистику пользователя
        const stats = window.MORI_USER ? MORI_USER.getStats() : {};
        const completedTasks = this.state.tasks.filter(t => t.completed).length;
        const pagesRead = stats.pagesRead || 0;
        const messages = stats.messages || 0;
        const aiQuestions = stats.aiQuestions || 0;
        const referrals = JSON.parse(localStorage.getItem('mori_referrals') || '[]').length;
        const level = window.MORI_USER ? (MORI_USER.current?.level || 1) : 1;
        
        for (const avatar of MORI_TASKS_DATA.rareAvatars) {
            if (!unlocked.includes(avatar.id)) {
                let isUnlocked = false;
                switch(avatar.type) {
                    case 'tasksCompleted': isUnlocked = completedTasks >= avatar.required; break;
                    case 'streak': isUnlocked = this.state.streak >= avatar.required; break;
                    case 'pagesRead': isUnlocked = pagesRead >= avatar.required; break;
                    case 'messages': isUnlocked = messages >= avatar.required; break;
                    case 'aiQuestions': isUnlocked = aiQuestions >= avatar.required; break;
                    case 'referrals': isUnlocked = referrals >= avatar.required; break;
                    case 'level': isUnlocked = level >= avatar.required; break;
                    case 'allTasks': isUnlocked = completedTasks >= 50; break;
                }
                if (isUnlocked) {
                    unlocked.push(avatar.id);
                    changed = true;
                    MORI_APP.showToast(`🎉 Аватар "${avatar.name}" разблокирован!`, 'success');
                }
            }
        }
        
        if (changed) {
            localStorage.setItem('unlocked_avatars', JSON.stringify(unlocked));
            if (window.MORI_PROFILE && MORI_PROFILE.state) {
                MORI_PROFILE.state.unlockedAvatars = unlocked;
            }
            if (this.state.activeTab === 'avatars') this.render();
        }
    },
    
    // Получение прогресса аватара
    getAvatarProgress: function(avatar) {
        const stats = window.MORI_USER ? MORI_USER.getStats() : {};
        const completedTasks = this.state.tasks.filter(t => t.completed).length;
        
        let current = 0, required = avatar.required;
        switch(avatar.type) {
            case 'tasksCompleted': current = completedTasks; break;
            case 'streak': current = this.state.streak; break;
            case 'pagesRead': current = stats.pagesRead || 0; break;
            case 'messages': current = stats.messages || 0; break;
            case 'aiQuestions': current = stats.aiQuestions || 0; break;
            case 'referrals': current = JSON.parse(localStorage.getItem('mori_referrals') || '[]').length; break;
            case 'level': current = window.MORI_USER ? (MORI_USER.current?.level || 1) : 1; break;
            case 'allTasks': current = completedTasks; break;
            default: current = 0;
        }
        
        const percent = Math.min(100, Math.floor((current / required) * 100));
        return { current, required, percent };
    },
    
    // Получение прогресса по категориям
    getCategoryProgress: function() {
        const categories = [
            { name: 'Знакомство', ids: [1,2,3,4,5] },
            { name: 'Калькулятор', ids: [6,7,8,9,10] },
            { name: 'Библиотека', ids: [11,12,13,14,15,16,17] },
            { name: 'MORI AI', ids: [18,19,20,21,22] },
            { name: 'Темы', ids: [23,24,25,26,27,28,29,30,31,32] },
            { name: 'Музыка', ids: [33,34,35,36,37] },
            { name: 'Активность', ids: [38,39,40,41,42] },
            { name: 'Серии', ids: [43,44,45,46] },
            { name: 'Финал', ids: [47,48,49,50] }
        ];
        
        return categories.map(cat => {
            const tasks = this.state.tasks.filter(t => cat.ids.includes(t.id));
            const completed = tasks.filter(t => t.completed).length;
            const total = tasks.length;
            const percent = Math.floor((completed / total) * 100);
            return { name: cat.name, completed, total, percent };
        });
    },
    
    // Получение следующих наград
    getNextRewards: function() {
        const nextTasks = this.state.tasks.filter(t => !t.completed && t.unlocked).slice(0, 3);
        return nextTasks.map(task => ({
            name: task.rewardName || task.title,
            left: task.target - task.progress,
            percent: Math.floor((task.progress / task.target) * 100)
        }));
    },
    
    // Получение ближайшего достижения
    getClosestAchievement: function() {
        if (!window.MORI_PROFILE_ACHIEVEMENTS) return null;
        
        const achievements = MORI_PROFILE_ACHIEVEMENTS.getAll();
        const closest = achievements.filter(a => !a.unlocked && a.progress && a.progress.percent < 100)
            .sort((a, b) => (b.progress?.percent || 0) - (a.progress?.percent || 0))[0];
        
        if (closest) {
            return {
                icon: closest.icon,
                name: closest.name,
                description: closest.description,
                current: closest.progress?.current || 0,
                required: closest.progress?.max || 0,
                percent: closest.progress?.percent || 0
            };
        }
        return null;
    },
    
    // Получение бонуса за прогресс дня
    getDailyProgressBonus: function() {
        const completed = this.state.dailyTasks.filter(t => t.completed).length;
        if (completed >= 5) return { type: 'chest', value: '50 MORI Coin' };
        if (completed >= 3) return { type: 'xp', value: 10 };
        if (completed >= 1) return { type: 'xp', value: 5 };
        return null;
    },
    
    // Получение следующего бонуса серии
    getNextStreakBonus: function() {
        const milestones = [7, 30, 90, 180, 365];
        const next = milestones.find(d => d > this.state.streak);
        if (!next) return null;
        const bonus = MORI_TASKS_DATA.streakBonuses[next];
        return { days: next, daysLeft: next - this.state.streak, exp: bonus.exp };
    },
    
    // Прогресс до следующего бонуса серии
    getStreakProgress: function() {
        const next = this.getNextStreakBonus();
        if (!next) return 100;
        const prev = [0, 7, 30, 90, 180].filter(d => d < this.state.streak).pop() || 0;
        return Math.min(100, ((this.state.streak - prev) / (next.days - prev)) * 100);
    },
    
    // Иконка для типа задания
    getTaskIcon: function(type) {
        const icons = {
            messages: '💬', pages: '📖', calculations: '🧮', ai: '🧠',
            theme: '🎨', settings: '⚙️', login: '🔐', songs: '🎵',
            likes: '❤️', saves: '💾', playlist: '📋', reactions: '👍',
            themes: '🎭', ratings: '⭐', themeChanges: '🔄', dailyTotal: '📊',
            streak: '🔥', features: '🔓', complete: '⭐'
        };
        return icons[type] || '📌';
    },
    
    // Анимация выполнения задания
    showTaskCompleteAnimation: function(task) {
        const taskCard = document.querySelector(`.task-card[data-task-id="${task.id}"]`);
        if (!taskCard) return;
        
        taskCard.classList.add('task-flash');
        setTimeout(() => taskCard.classList.remove('task-flash'), 500);
        
        // Создаём чек-марк
        const checkmark = document.createElement('div');
        checkmark.className = 'task-checkmark';
        checkmark.innerHTML = '✓';
        taskCard.appendChild(checkmark);
        setTimeout(() => checkmark.remove(), 800);
        
        // Партиклы опыта
        for (let i = 0; i < 15; i++) {
            const xp = document.createElement('div');
            xp.className = 'task-xp-particle';
            xp.innerHTML = `+${task.reward}`;
            xp.style.left = Math.random() * 100 + '%';
            xp.style.top = '50%';
            taskCard.appendChild(xp);
            setTimeout(() => xp.remove(), 1000);
        }
        
        MORI_APP.showToast(`✅ Задание выполнено! +${task.reward} XP`, 'success');
    },
    
    // Анимация выполнения ежедневного задания
    showDailyTaskComplete: function(task) {
        const dailyItem = document.querySelector(`.daily-item[data-daily-id="${task.id}"]`);
        if (dailyItem) {
            dailyItem.classList.add('daily-flash');
            setTimeout(() => dailyItem.classList.remove('daily-flash'), 500);
        }
        MORI_APP.showToast(`✅ ${task.title} +${task.reward} XP`, 'success');
    },
    
    // Переход к месту выполнения
    goToTaskLocation: function(taskType) {
        const route = MORI_TASKS_DATA.taskRoutes[taskType];
        if (route && window.MORI_ROUTER) {
            MORI_ROUTER.navigate(route);
        } else {
            MORI_APP.showToast(`⚠️ Добавьте ID для типа: ${taskType}`, 'warning');
        }
    },
    
    // Рассчёт статистики
    calculateStats: function() {
        const completed = this.state.tasks.filter(t => t.completed).length;
        let totalXP = 0;
        this.state.tasks.forEach(t => { if (t.completed) totalXP += t.reward; });
        this.state.completedTasks = completed;
        this.state.totalXP = totalXP;
    },
    
    // Переход по кнопке назад
    goBack: function() {
        if (window.MORI_ROUTER) {
            MORI_ROUTER.navigate('all-apps');
        }
    },
    
    // Обновление списка основных заданий без перерисовки всей вкладки
    renderMainTasksUpdate: function() {
        const container = document.querySelector('.tasks-list');
        if (container) {
            container.innerHTML = this.state.tasks.map(task => this.renderTaskCard(task)).join('');
            this.attachTaskEvents();
        }
    },
    
    // Прикрепление событий
    attachEvents: function() {
        document.querySelectorAll('.phone-tab').forEach(tab => {
            tab.onclick = (e) => {
                const tabName = e.target.dataset.tab;
                this.state.activeTab = tabName;
                this.render();
            };
        });
        
        const backBtn = document.getElementById('tasks-back-btn');
        if (backBtn) backBtn.onclick = () => this.goBack();
        
        const chestBtn = document.getElementById('daily-chest-btn');
        if (chestBtn) chestBtn.onclick = () => this.openDailyChest();
        
        const energyBtn = document.getElementById('buy-energy-btn');
        if (energyBtn) energyBtn.onclick = () => this.buyEnergy();
        
        this.attachTaskEvents();
        this.attachDailyEvents();
    },
    
    attachTaskEvents: function() {
        document.querySelectorAll('.task-go-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const type = btn.dataset.type;
                this.goToTaskLocation(type);
            };
        });
    },
    
    attachDailyEvents: function() {
        document.querySelectorAll('.daily-item').forEach(item => {
            item.onclick = () => {
                const dailyId = item.dataset.dailyId;
                const task = this.state.dailyTasks.find(t => t.id === dailyId);
                if (task && !task.completed && this.state.energy >= task.energyCost) {
                    this.completeDailyTask(task);
                } else if (task && task.completed) {
                    MORI_APP.showToast('Задание уже выполнено', 'info');
                } else if (this.state.energy < task.energyCost) {
                    MORI_APP.showToast('⚡ Недостаточно энергии!', 'error');
                }
            };
        });
    },
    
    // Получение количества выполненных заданий
    getCompletedCount: function() {
        return this.state.tasks.filter(t => t.completed).length;
    }
};

// Экспорт
window.MORI_TASKS = MORI_TASKS;
