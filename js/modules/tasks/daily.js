/**
 * TASKS DAILY
 * Ежедневные задания и система энергии
 * Версия: 1.0.0
 */

const MORI_TASKS_DAILY = {
    // Текущие ежедневные задания
    tasks: [
        { id: 'd1', title: 'Болтун', description: 'Написать 3 сообщения', type: 'messages', target: 3, reward: 15, energyCost: 1, completed: false, progress: 0, icon: '💬' },
        { id: 'd2', title: 'Читатель', description: 'Прочитать 2 страницы', type: 'pages', target: 2, reward: 10, energyCost: 1, completed: false, progress: 0, icon: '📖' },
        { id: 'd3', title: 'Счётчик', description: 'Сделать 2 расчёта', type: 'calculations', target: 2, reward: 10, energyCost: 1, completed: false, progress: 0, icon: '🧮' },
        { id: 'd4', title: 'Любопытный', description: 'Задать 1 вопрос AI', type: 'ai', target: 1, reward: 10, energyCost: 1, completed: false, progress: 0, icon: '🧠' },
        { id: 'd5', title: 'Гость', description: 'Зайти в приложение', type: 'login', target: 1, reward: 5, energyCost: 1, completed: false, progress: 0, icon: '🔐' }
    ],

    // Энергия
    energy: {
        current: 5,
        max: 5,
        lastReset: null
    },

    // Серия дней
    streak: 0,

    // Бонусы за серию
    streakBonuses: {
        7: { exp: 50, description: '7 дней подряд', icon: '🌱' },
        30: { exp: 200, description: '30 дней подряд', icon: '🌿' },
        90: { exp: 500, description: '90 дней подряд', icon: '🌳' },
        180: { exp: 1000, description: '180 дней подряд', icon: '🏆' },
        365: { exp: 2000, description: '365 дней подряд', icon: '👑' }
    },

    /**
     * Загрузка прогресса
     */
    load: function() {
        try {
            const saved = localStorage.getItem('daily_progress');
            if (saved) {
                const data = JSON.parse(saved);
                
                // Восстанавливаем задания
                if (data.tasks) {
                    data.tasks.forEach((savedTask, i) => {
                        if (this.tasks[i]) {
                            this.tasks[i].progress = savedTask.progress;
                            this.tasks[i].completed = savedTask.completed;
                        }
                    });
                }
                
                this.energy.current = data.energy?.current || 5;
                this.energy.max = data.energy?.max || 5;
                this.energy.lastReset = data.energy?.lastReset;
                this.streak = data.streak || 0;
            }
        } catch (error) {
            console.error('Error loading daily tasks:', error);
        }
        
        this.checkReset();
    },

    /**
     * Сохранение прогресса
     */
    save: function() {
        try {
            const data = {
                tasks: this.tasks.map(t => ({ progress: t.progress, completed: t.completed })),
                energy: this.energy,
                streak: this.streak
            };
            localStorage.setItem('daily_progress', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving daily tasks:', error);
        }
    },

    /**
     * Проверка сброса (каждый день)
     */
    checkReset: function() {
        const now = new Date();
        const lastReset = this.energy.lastReset ? new Date(this.energy.lastReset) : null;
        
        // Если ещё не сбрасывали сегодня
        if (!lastReset || now.toDateString() !== lastReset.toDateString()) {
            this.resetDaily();
        }
    },

    /**
     * Сброс ежедневных заданий
     */
    resetDaily: function() {
        // Сбрасываем задания
        this.tasks.forEach(t => {
            t.completed = false;
            t.progress = 0;
        });
        
        // Восстанавливаем энергию
        this.energy.current = this.energy.max;
        this.energy.lastReset = new Date().toISOString();
        
        this.save();
        
        console.log('Daily tasks reset');
    },

    /**
     * Выполнение задания
     */
    completeTask: function(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        
        if (!task || task.completed) {
            MORI_APP.showToast('Задание уже выполнено', 'info');
            return false;
        }

        if (this.energy.current < task.energyCost) {
            MORI_APP.showToast('Недостаточно энергии', 'error');
            return false;
        }

        // Тратим энергию
        this.energy.current -= task.energyCost;
        
        // Помечаем как выполненное
        task.completed = true;
        task.progress = task.target;

        // Добавляем опыт
        if (MORI_USER.current) {
            MORI_USER.addExperience(task.reward);
        }

        // Показываем уведомление
        this.showReward(task);

        // Проверяем, все ли выполнены
        this.checkAllCompleted();
        
        this.save();
        return true;
    },

    /**
     * Обновление прогресса задания
     */
    updateProgress: function(type, value) {
        this.tasks.forEach(task => {
            if (!task.completed && task.type === type && this.energy.current >= task.energyCost) {
                task.progress = Math.min(task.progress + value, task.target);
                
                if (task.progress >= task.target) {
                    this.completeTask(task.id);
                }
            }
        });
        
        this.save();
    },

    /**
     * Проверка выполнения всех заданий
     */
    checkAllCompleted: function() {
        const allCompleted = this.tasks.every(t => t.completed);
        
        if (allCompleted) {
            this.streak++;
            
            // Проверяем бонус за серию
            const bonus = this.streakBonuses[this.streak];
            if (bonus) {
                MORI_USER.addExperience(bonus.exp);
                this.showStreakBonus(bonus);
            }
            
            MORI_APP.showToast(`🔥 Серия: ${this.streak} дней!`, 'success');
            this.save();
        }
    },

    /**
     * Показ награды за задание
     */
    showReward: function(task) {
        const notification = document.createElement('div');
        notification.className = 'reward-notification';
        notification.innerHTML = `
            <div class="reward-icon">${task.icon}</div>
            <div class="reward-content">
                <div class="reward-title">${task.title}</div>
                <div class="reward-description">+${task.reward} опыта</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    },

    /**
     * Показ бонуса за серию
     */
    showStreakBonus: function(bonus) {
        const notification = document.createElement('div');
        notification.className = 'reward-notification streak';
        notification.innerHTML = `
            <div class="reward-icon">${bonus.icon}</div>
            <div class="reward-content">
                <div class="reward-title">🔥 Бонус за серию!</div>
                <div class="reward-description">${bonus.description}</div>
                <div class="reward-exp">+${bonus.exp} опыта</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    },

    /**
     * Получение следующего бонуса
     */
    getNextBonus: function() {
        const milestones = [7, 30, 90, 180, 365];
        const next = milestones.find(d => d > this.streak);
        
        if (!next) return null;
        
        const prev = milestones.filter(d => d < this.streak).pop() || 0;
        
        return {
            days: next,
            daysLeft: next - this.streak,
            progress: ((this.streak - prev) / (next - prev)) * 100,
            bonus: this.streakBonuses[next]
        };
    },

    /**
     * Получение статистики
     */
    getStats: function() {
        const completed = this.tasks.filter(t => t.completed).length;
        const nextBonus = this.getNextBonus();
        
        return {
            completed,
            total: this.tasks.length,
            percent: (completed / this.tasks.length) * 100,
            energy: this.energy.current,
            maxEnergy: this.energy.max,
            streak: this.streak,
            nextBonus
        };
    },

    /**
     * Сброс прогресса (для теста)
     */
    reset: function() {
        this.tasks.forEach(t => {
            t.completed = false;
            t.progress = 0;
        });
        this.energy.current = this.energy.max;
        this.streak = 0;
        this.save();
    }
};

// Загрузка при старте
MORI_TASKS_DAILY.load();

// Экспорт
window.MORI_TASKS_DAILY = MORI_TASKS_DAILY;
