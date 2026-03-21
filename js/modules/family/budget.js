/**
 * FAMILY BUDGET
 * Управление семейным бюджетом
 * Версия: 1.0.0
 */

const MORI_FAMILY_BUDGET = {
    // Состояние
    state: {
        total: 0,
        income: 0,
        expenses: 0,
        history: [],
        categories: {
            income: ['Зарплата', 'Премия', 'Подарки', 'Инвестиции', 'Другое'],
            expense: ['Продукты', 'Коммунальные', 'Развлечения', 'Транспорт', 'Здоровье', 'Образование', 'Другое']
        },
        monthlyBudget: {},
        goals: []
    },

    /**
     * Инициализация
     */
    init: function() {
        console.log('MORI_FAMILY_BUDGET инициализация...');
        this.loadState();
    },

    /**
 * Загрузка состояния
 */
loadState: async function() {
    try {
        // Пробуем загрузить с сервера
        const budget = await MORI_API.getFamilyBudget();
        if (budget && budget.budget) {
            this.state = { ...this.state, ...budget.budget };
            // Сохраняем в localStorage как кэш
            localStorage.setItem('family_budget', JSON.stringify(this.state));
            return;
        }
    } catch (error) {
        console.log('Сервер недоступен, используем локальный кэш');
    }

    // Если сервер не ответил, пробуем localStorage
    try {
        const saved = localStorage.getItem('family_budget');
        if (saved) {
            this.state = { ...this.state, ...JSON.parse(saved) };
        } else {
            // Только пустые значения, никаких тестовых данных!
            this.state = {
                total: 0,
                income: 0,
                expenses: 0,
                history: [],
                categories: {
                    income: ['Зарплата', 'Премия', 'Подарки', 'Инвестиции', 'Другое'],
                    expense: ['Продукты', 'Коммунальные', 'Развлечения', 'Транспорт', 'Здоровье', 'Образование', 'Другое']
                },
                monthlyBudget: {},
                goals: []
            };
        }
    } catch (error) {
        console.error('Error loading budget:', error);
        this.state = {
            total: 0,
            income: 0,
            expenses: 0,
            history: [],
            categories: {
                income: ['Зарплата', 'Премия', 'Подарки', 'Инвестиции', 'Другое'],
                expense: ['Продукты', 'Коммунальные', 'Развлечения', 'Транспорт', 'Здоровье', 'Образование', 'Другое']
            },
            monthlyBudget: {},
            goals: []
        };
    }
},

    /**
     * Сохранение состояния
     */
    saveState: function() {
        try {
            localStorage.setItem('family_budget', JSON.stringify(this.state));
        } catch (error) {
            console.error('Error saving budget:', error);
        }
    },

    /**
     * Добавить транзакцию
     */
    addTransaction: function(type, data) {
        const transaction = {
            id: Date.now(),
            type,
            timestamp: Date.now(),
            userId: MORI_USER.current?.id,
            userName: MORI_USER.current?.nickname || 'Пользователь',
            ...data
        };

        this.state.history.unshift(transaction);

        if (type === 'income') {
            this.state.income += data.amount;
            this.state.total += data.amount;
        } else {
            this.state.expenses += data.amount;
            this.state.total -= data.amount;
        }

        this.saveState();
        
        // Проверяем цели
        this.checkGoals();
        
        return transaction;
    },

    /**
     * Удалить транзакцию
     */
    removeTransaction: function(id) {
        const transaction = this.state.history.find(t => t.id === id);
        if (!transaction) return false;

        if (transaction.type === 'income') {
            this.state.income -= transaction.amount;
            this.state.total -= transaction.amount;
        } else {
            this.state.expenses -= transaction.amount;
            this.state.total += transaction.amount;
        }

        this.state.history = this.state.history.filter(t => t.id !== id);
        this.saveState();
        return true;
    },

    /**
     * Получить транзакции за период
     */
    getTransactionsByPeriod: function(startDate, endDate) {
        return this.state.history.filter(t => 
            t.timestamp >= startDate && t.timestamp <= endDate
        );
    },

    /**
     * Получить транзакции по категории
     */
    getTransactionsByCategory: function(category) {
        return this.state.history.filter(t => t.category === category);
    },

    /**
     * Получить транзакции по пользователю
     */
    getTransactionsByUser: function(userId) {
        return this.state.history.filter(t => t.userId === userId);
    },

    /**
     * Получить статистику за месяц
     */
    getMonthlyStats: function(year, month) {
        const start = new Date(year, month, 1).getTime();
        const end = new Date(year, month + 1, 0).getTime();

        const monthTransactions = this.getTransactionsByPeriod(start, end);

        const stats = {
            income: 0,
            expenses: 0,
            byCategory: {},
            byUser: {}
        };

        monthTransactions.forEach(t => {
            if (t.type === 'income') {
                stats.income += t.amount;
            } else {
                stats.expenses += t.amount;
            }

            // По категориям
            if (!stats.byCategory[t.category]) {
                stats.byCategory[t.category] = 0;
            }
            stats.byCategory[t.category] += t.amount;

            // По пользователям
            if (!stats.byUser[t.userId]) {
                stats.byUser[t.userId] = { name: t.userName, amount: 0 };
            }
            stats.byUser[t.userId].amount += t.amount;
        });

        stats.balance = stats.income - stats.expenses;
        
        return stats;
    },

    /**
     * Установить месячный бюджет
     */
    setMonthlyBudget: function(year, month, budget) {
        const key = `${year}-${month}`;
        this.state.monthlyBudget[key] = budget;
        this.saveState();
    },

    /**
     * Получить месячный бюджет
     */
    getMonthlyBudget: function(year, month) {
        const key = `${year}-${month}`;
        return this.state.monthlyBudget[key] || 0;
    },

    /**
     * Добавить цель
     */
    addGoal: function(title, target, deadline) {
        const goal = {
            id: Date.now(),
            title,
            target,
            current: 0,
            deadline,
            createdAt: Date.now()
        };

        this.state.goals.push(goal);
        this.saveState();
        return goal;
    },

    /**
     * Обновить прогресс цели
     */
    updateGoalProgress: function(goalId, amount) {
        const goal = this.state.goals.find(g => g.id === goalId);
        if (goal) {
            goal.current += amount;
            this.saveState();
            
            if (goal.current >= goal.target) {
                MORI_APP.showToast(`🎉 Цель "${goal.title}" достигнута!`, 'success');
            }
            
            return true;
        }
        return false;
    },

    /**
     * Проверить цели (автоматически при добавлении дохода)
     */
    checkGoals: function() {
        this.state.goals.forEach(goal => {
            // Можно добавить автораспределение
        });
    },

    /**
     * Удалить цель
     */
    removeGoal: function(goalId) {
        this.state.goals = this.state.goals.filter(g => g.id !== goalId);
        this.saveState();
    },

    /**
     * Получить все цели
     */
    getGoals: function() {
        return this.state.goals;
    },

    /**
     * Получить прогресс цели
     */
    getGoalProgress: function(goalId) {
        const goal = this.state.goals.find(g => g.id === goalId);
        if (!goal) return 0;
        return (goal.current / goal.target) * 100;
    },

    /**
     * Получить общую статистику
     */
    getStats: function() {
        return {
            total: this.state.total,
            income: this.state.income,
            expenses: this.state.expenses,
            transactionsCount: this.state.history.length,
            goalsCount: this.state.goals.length,
            goalsCompleted: this.state.goals.filter(g => g.current >= g.target).length
        };
    },

    /**
     * Получить последние транзакции
     */
    getRecentTransactions: function(limit = 10) {
        return this.state.history.slice(0, limit);
    },

    /**
     * Экспорт бюджета
     */
    exportBudget: function() {
        const data = {
            exportDate: Date.now(),
            total: this.state.total,
            income: this.state.income,
            expenses: this.state.expenses,
            history: this.state.history,
            goals: this.state.goals
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `budget_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    },

    /**
     * Импорт бюджета
     */
    importBudget: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (data.history) {
                        this.state = { ...this.state, ...data };
                        this.saveState();
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
    },

    /**
     * Сброс бюджета (для админа)
     */
    reset: function() {
        if (!MORI_AUTH.isAdmin()) return false;

        this.state = {
            total: 0,
            income: 0,
            expenses: 0,
            history: [],
            categories: {
                income: ['Зарплата', 'Премия', 'Подарки', 'Инвестиции', 'Другое'],
                expense: ['Продукты', 'Коммунальные', 'Развлечения', 'Транспорт', 'Здоровье', 'Образование', 'Другое']
            },
            monthlyBudget: {},
            goals: []
        };
        
        this.saveState();
        return true;
    }
};

// Экспорт
window.MORI_FAMILY_BUDGET = MORI_FAMILY_BUDGET;
