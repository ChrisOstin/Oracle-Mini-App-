/**
 * PROFILE LEVELS
 * Система уровней и прогресса
 * Версия: 1.0.0
 */

const MORI_PROFILE_LEVELS = {
    // Таблица уровней (30 штук)
    levels: [
        { level: 1, name: 'Новичок', expRequired: 0, totalExp: 0, rewards: [] },
        { level: 2, name: 'Любопытный', expRequired: 100, totalExp: 100, rewards: [] },
        { level: 3, name: 'Читатель', expRequired: 150, totalExp: 250, rewards: ['fonts'] },
        { level: 4, name: 'Музыкант', expRequired: 200, totalExp: 450, rewards: [] },
        { level: 5, name: 'Финансист', expRequired: 250, totalExp: 700, rewards: ['wishlist'] },
        { level: 6, name: 'Ценитель', expRequired: 300, totalExp: 1000, rewards: [] },
        { level: 7, name: 'Игрок', expRequired: 350, totalExp: 1350, rewards: ['tags'] },
        { level: 8, name: 'Семьянин', expRequired: 400, totalExp: 1750, rewards: [] },
        { level: 9, name: 'Мастер', expRequired: 450, totalExp: 2200, rewards: ['chat-search'] },
        { level: 10, name: 'Легенда', expRequired: 500, totalExp: 2700, rewards: [] },
        { level: 11, name: 'Тень', expRequired: 550, totalExp: 3250, rewards: ['tv'] },
        { level: 12, name: 'Хранитель', expRequired: 600, totalExp: 3850, rewards: [] },
        { level: 13, name: 'Философ', expRequired: 650, totalExp: 4500, rewards: ['budget'] },
        { level: 14, name: 'Мудрец', expRequired: 700, totalExp: 5200, rewards: [] },
        { level: 15, name: 'Провидец', expRequired: 750, totalExp: 5950, rewards: ['calendar'] },
        { level: 16, name: 'Странник', expRequired: 800, totalExp: 6750, rewards: [] },
        { level: 17, name: 'Искатель', expRequired: 850, totalExp: 7600, rewards: ['notes'] },
        { level: 18, name: 'Творец', expRequired: 900, totalExp: 8500, rewards: [] },
        { level: 19, name: 'Властелин', expRequired: 950, totalExp: 9450, rewards: ['reminders'] },
        { level: 20, name: 'Бессмертный', expRequired: 1000, totalExp: 10450, rewards: [] },
        { level: 21, name: 'Мифический', expRequired: 1050, totalExp: 11500, rewards: [] },
        { level: 22, name: 'Легендарный', expRequired: 1100, totalExp: 12600, rewards: [] },
        { level: 23, name: 'Эпический', expRequired: 1150, totalExp: 13750, rewards: [] },
        { level: 24, name: 'Божественный', expRequired: 1200, totalExp: 14950, rewards: [] },
        { level: 25, name: 'Космический', expRequired: 1250, totalExp: 16200, rewards: [] },
        { level: 26, name: 'Безграничный', expRequired: 1300, totalExp: 17500, rewards: [] },
        { level: 27, name: 'Всемогущий', expRequired: 1350, totalExp: 18850, rewards: [] },
        { level: 28, name: 'Вездесущий', expRequired: 1400, totalExp: 20250, rewards: [] },
        { level: 29, name: 'Мориарти', expRequired: 1450, totalExp: 21700, rewards: [] },
        { level: 30, name: 'Абсолют', expRequired: 1500, totalExp: 23200, rewards: ['absolute'] }
    ],

    // Названия уровней (для быстрого доступа)
    names: {
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
    },

    // Награды за уровни
    levelRewards: {
        3: '🔓 Выбор шрифтов',
        5: '🔓 Вишлист книг',
        7: '🔓 Метки для книг',
        9: '🔓 Поиск по чату',
        11: '🔓 Телевизор в доме',
        13: '🔓 Семейный бюджет',
        15: '🔓 Общий календарь',
        17: '🔓 Семейные заметки',
        19: '🔓 Напоминания о ДР',
        30: '👑 Статус Абсолюта'
    },

    /**
     * Получение информации об уровне
     */
    getLevelInfo: function(level) {
        return this.levels.find(l => l.level === level) || this.levels[0];
    },

    /**
     * Получение названия уровня
     */
    getLevelName: function(level) {
        return this.names[level] || `Уровень ${level}`;
    },

    /**
     * Получение прогресса
     */
    getProgress: function(currentExp) {
        // Ищем текущий уровень
        let currentLevel = 1;
        for (let i = this.levels.length - 1; i >= 0; i--) {
            if (currentExp >= this.levels[i].totalExp) {
                currentLevel = this.levels[i].level;
                break;
            }
        }

        // Если максимальный уровень
        if (currentLevel >= 30) {
            return {
                level: 30,
                name: this.names[30],
                currentExp: this.levels[29].totalExp,
                requiredExp: 0,
                nextLevelExp: this.levels[29].totalExp,
                percent: 100,
                isMaxLevel: true
            };
        }

        const current = this.levels[currentLevel - 1];
        const next = this.levels[currentLevel];

        const expInLevel = currentExp - current.totalExp;
        const requiredForNext = next.expRequired;
        const percent = Math.floor((expInLevel / requiredForNext) * 100);

        return {
            level: currentLevel,
            name: current.name,
            currentExp: expInLevel,
            requiredExp: requiredForNext,
            nextLevelExp: next.totalExp,
            percent,
            isMaxLevel: false,
            nextLevelName: next.name,
            rewards: next.rewards
        };
    },

    /**
     * Получение награды за уровень
     */
    getLevelReward: function(level) {
        return this.levelRewards[level] || null;
    },

    /**
     * Получение следующего уровня
     */
    getNextLevel: function(currentLevel) {
        if (currentLevel >= 30) return null;
        return this.levels[currentLevel];
    },

    /**
     * Получение предыдущего уровня
     */
    getPrevLevel: function(currentLevel) {
        if (currentLevel <= 1) return null;
        return this.levels[currentLevel - 2];
    },

    /**
     * Получение диапазона уровней
     */
    getLevelRange: function(start, end) {
        return this.levels.filter(l => l.level >= start && l.level <= end);
    },

    /**
     * Получение топ-уровней
     */
    getTopLevels: function(limit = 5) {
        return this.levels.slice(-limit).reverse();
    },

    /**
     * Проверка, доступен ли уровень
     */
    isLevelUnlocked: function(level, currentExp) {
        const levelInfo = this.getLevelInfo(level);
        return currentExp >= levelInfo.totalExp;
    },

    /**
     * Получение следующей награды
     */
    getNextReward: function(currentLevel) {
        for (let i = currentLevel + 1; i <= 30; i++) {
            const reward = this.getLevelReward(i);
            if (reward) {
                return {
                    level: i,
                    name: this.getLevelName(i),
                    reward
                };
            }
        }
        return null;
    },

    /**
     * Получение всех наград
     */
    getAllRewards: function() {
        const rewards = [];
        for (let i = 1; i <= 30; i++) {
            const reward = this.getLevelReward(i);
            if (reward) {
                rewards.push({
                    level: i,
                    name: this.getLevelName(i),
                    reward
                });
            }
        }
        return rewards;
    },

    /**
     * Расчёт опыта для уровня
     */
    calculateExpForLevel: function(level) {
        if (level < 1) return 0;
        if (level > 30) return this.levels[29].totalExp;
        return this.levels[level - 1].totalExp;
    },

    /**
     * Расчёт уровня по опыту
     */
    calculateLevelFromExp: function(exp) {
        for (let i = this.levels.length - 1; i >= 0; i--) {
            if (exp >= this.levels[i].totalExp) {
                return this.levels[i].level;
            }
        }
        return 1;
    }
};

// Экспорт
window.MORI_PROFILE_LEVELS = MORI_PROFILE_LEVELS;
