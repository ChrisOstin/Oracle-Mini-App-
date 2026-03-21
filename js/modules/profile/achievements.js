/**
 * PROFILE ACHIEVEMENTS
 * Система достижений пользователя
 * Версия: 1.0.0
 */

const MORI_PROFILE_ACHIEVEMENTS = {
    // Список всех достижений
    list: [
        // 📚 КНИЖНЫЕ (5)
        {
            id: 'bookworm',
            category: 'books',
            icon: '📖',
            name: 'Книжный червь',
            description: 'Прочитать 500 страниц',
            requirement: 500,
            type: 'pages',
            reward: { exp: 500, badge: '📖' }
        },
        {
            id: 'bibliophile',
            category: 'books',
            icon: '📚',
            name: 'Библиофил',
            description: 'Прочитать 1000 страниц',
            requirement: 1000,
            type: 'pages',
            reward: { exp: 1000, badge: '📚' }
        },
        {
            id: 'knowledge_keeper',
            category: 'books',
            icon: '📚✨',
            name: 'Хранитель знаний',
            description: 'Прочитать 5000 страниц',
            requirement: 5000,
            type: 'pages',
            reward: { exp: 5000, badge: '📚✨' }
        },
        {
            id: 'reader_of_year',
            category: 'books',
            icon: '📚👑',
            name: 'Читатель года',
            description: 'Прочитать 10000 страниц',
            requirement: 10000,
            type: 'pages',
            reward: { exp: 10000, badge: '📚👑' }
        },
        {
            id: 'book_collector',
            category: 'books',
            icon: '📚🔥',
            name: 'Коллекционер книг',
            description: 'Открыть все 10 книг',
            requirement: 10,
            type: 'books',
            reward: { exp: 2000, badge: '📚🔥' }
        },

        // 💰 ФИНАНСОВЫЕ (5)
        {
            id: 'financier',
            category: 'finance',
            icon: '💰',
            name: 'Финансист',
            description: 'Сделать 500 расчётов',
            requirement: 500,
            type: 'calculations',
            reward: { exp: 500, badge: '💰' }
        },
        {
            id: 'investor',
            category: 'finance',
            icon: '💰✨',
            name: 'Инвестор',
            description: 'Сделать 1000 расчётов',
            requirement: 1000,
            type: 'calculations',
            reward: { exp: 1000, badge: '💰✨' }
        },
        {
            id: 'mathematician',
            category: 'finance',
            icon: '💰👑',
            name: 'Математик',
            description: 'Сделать 5000 расчётов',
            requirement: 5000,
            type: 'calculations',
            reward: { exp: 5000, badge: '💰👑' }
        },
        {
            id: 'whale',
            category: 'finance',
            icon: '🐳',
            name: 'Кит',
            description: 'Накопить 100k MORI',
            requirement: 100000,
            type: 'balance',
            reward: { exp: 2000, badge: '🐳' }
        },
        {
            id: 'millionaire',
            category: 'finance',
            icon: '💎',
            name: 'Миллионер',
            description: 'Накопить 1M MORI',
            requirement: 1000000,
            type: 'balance',
            reward: { exp: 5000, badge: '💎' }
        },

        // 💬 СОЦИАЛЬНЫЕ (4)
        {
            id: 'talker',
            category: 'social',
            icon: '💬',
            name: 'Болтун',
            description: 'Написать 500 сообщений',
            requirement: 500,
            type: 'messages',
            reward: { exp: 500, badge: '💬' }
        },
        {
            id: 'soul_of_party',
            category: 'social',
            icon: '💬✨',
            name: 'Душа компании',
            description: 'Написать 1000 сообщений',
            requirement: 1000,
            type: 'messages',
            reward: { exp: 1000, badge: '💬✨' }
        },
        {
            id: 'chat_legend',
            category: 'social',
            icon: '💬👑',
            name: 'Легенда чата',
            description: 'Написать 5000 сообщений',
            requirement: 5000,
            type: 'messages',
            reward: { exp: 5000, badge: '💬👑' }
        },
        {
            id: 'popular',
            category: 'social',
            icon: '🔥',
            name: 'Популярный',
            description: 'Получить 100 реакций',
            requirement: 100,
            type: 'reactions',
            reward: { exp: 1000, badge: '🔥' }
        },

        // 🧠 MORI AI (3)
        {
            id: 'curious',
            category: 'ai',
            icon: '🤖',
            name: 'Почемучка',
            description: 'Задать 100 вопросов AI',
            requirement: 100,
            type: 'aiQuestions',
            reward: { exp: 500, badge: '🤖' }
        },
        {
            id: 'philosopher',
            category: 'ai',
            icon: '🧠',
            name: 'Философ',
            description: 'Задать 500 вопросов AI',
            requirement: 500,
            type: 'aiQuestions',
            reward: { exp: 1000, badge: '🧠' }
        },
        {
            id: 'sage',
            category: 'ai',
            icon: '🧠👑',
            name: 'Мудрец',
            description: 'Задать 1000 вопросов AI',
            requirement: 1000,
            type: 'aiQuestions',
            reward: { exp: 2000, badge: '🧠👑' }
        },

        // 🎵 МУЗЫКАЛЬНЫЕ (4)
        {
            id: 'meloman',
            category: 'music',
            icon: '🎵',
            name: 'Меломан',
            description: 'Прослушать 100 треков',
            requirement: 100,
            type: 'songsListened',
            reward: { exp: 500, badge: '🎵' }
        },
        {
            id: 'music_fan',
            category: 'music',
            icon: '🎵✨',
            name: 'Музыкальный фанат',
            description: 'Прослушать 500 треков',
            requirement: 500,
            type: 'songsListened',
            reward: { exp: 1000, badge: '🎵✨' }
        },
        {
            id: 'music_genius',
            category: 'music',
            icon: '🎵👑',
            name: 'Музыкальный гений',
            description: 'Прослушать 1000 треков',
            requirement: 1000,
            type: 'songsListened',
            reward: { exp: 2000, badge: '🎵👑' }
        },
        {
            id: 'creator',
            category: 'music',
            icon: '🎶',
            name: 'Создатель',
            description: 'Создать 5 плейлистов',
            requirement: 5,
            type: 'playlists',
            reward: { exp: 1000, badge: '🎶' }
        },

        // 🃏 ИГРОВЫЕ (4)
        {
            id: 'gamer',
            category: 'games',
            icon: '🎮',
            name: 'Игрок',
            description: 'Сыграть 50 партий',
            requirement: 50,
            type: 'gamesPlayed',
            reward: { exp: 500, badge: '🎮' }
        },
        {
            id: 'winner',
            category: 'games',
            icon: '🎮✨',
            name: 'Победитель',
            description: 'Выиграть 100 партий',
            requirement: 100,
            type: 'gamesWon',
            reward: { exp: 1000, badge: '🎮✨' }
        },
        {
            id: 'fool_king',
            category: 'games',
            icon: '👑',
            name: 'Король дураков',
            description: 'Выиграть 500 партий',
            requirement: 500,
            type: 'gamesWon',
            reward: { exp: 2000, badge: '👑' }
        },
        {
            id: 'invincible',
            category: 'games',
            icon: '⚡',
            name: 'Непобедимый',
            description: 'Выиграть 10 партий подряд',
            requirement: 10,
            type: 'winStreak',
            reward: { exp: 3000, badge: '⚡' }
        },

        // 🏠 СЕМЕЙНЫЕ (3)
        {
            id: 'family_man',
            category: 'family',
            icon: '👨‍👩‍👧‍👦',
            name: 'Семьянин',
            description: 'Быть в семье 1 год',
            requirement: 365,
            type: 'daysInFamily',
            reward: { exp: 5000, badge: '👨‍👩‍👧‍👦' }
        },
        {
            id: 'hearth_keeper',
            category: 'family',
            icon: '🏠',
            name: 'Хранитель очага',
            description: 'Украсить дом 100 предметами',
            requirement: 100,
            type: 'decorations',
            reward: { exp: 2000, badge: '🏠' }
        },
        {
            id: 'tea_master',
            category: 'family',
            icon: '🫖',
            name: 'Чайный мастер',
            description: 'Выпить 100 чашек чая',
            requirement: 100,
            type: 'tea',
            reward: { exp: 1000, badge: '🫖' }
        },

        // 🔥 ОСОБЫЕ (2)
        {
            id: 'veteran',
            category: 'special',
            icon: '🔥',
            name: 'Ветеран',
            description: 'Заходить 365 дней подряд',
            requirement: 365,
            type: 'streak',
            reward: { exp: 10000, badge: '🔥' }
        },
        {
            id: 'absolute',
            category: 'special',
            icon: '👑✨',
            name: 'Абсолют',
            description: 'Получить все 30 достижений',
            requirement: 30,
            type: 'achievements',
            reward: { exp: 50000, badge: '👑✨' }
        }
    ],

    // Прогресс пользователя
    userProgress: {},

    /**
     * Загрузка прогресса
     */
    loadProgress: function() {
        try {
            const saved = localStorage.getItem('achievements_progress');
            if (saved) {
                this.userProgress = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading achievements:', error);
        }
    },

    /**
     * Сохранение прогресса
     */
    saveProgress: function() {
        try {
            localStorage.setItem('achievements_progress', JSON.stringify(this.userProgress));
        } catch (error) {
            console.error('Error saving achievements:', error);
        }
    },

    /**
     * Проверка достижений
     */
    checkAchievements: function(type, value) {
        const unlocked = [];

        this.list.forEach(achievement => {
            if (achievement.type === type && !this.isUnlocked(achievement.id)) {
                const progress = this.userProgress[achievement.id] || 0;
                const newProgress = Math.min(value, achievement.requirement);
                
                if (newProgress > progress) {
                    this.userProgress[achievement.id] = newProgress;
                    
                    if (newProgress >= achievement.requirement) {
                        this.unlockAchievement(achievement.id);
                        unlocked.push(achievement);
                    }
                }
            }
        });

        if (unlocked.length > 0) {
            this.saveProgress();
        }

        return unlocked;
    },

    /**
     * Разблокировка достижения
     */
    unlockAchievement: function(achievementId) {
        const achievement = this.getById(achievementId);
        if (!achievement) return;

        // Добавляем в список разблокированных
        if (!this.userProgress.unlocked) {
            this.userProgress.unlocked = [];
        }
        
        if (!this.userProgress.unlocked.includes(achievementId)) {
            this.userProgress.unlocked.push(achievementId);
            
            // Добавляем опыт
            if (MORI_USER.current) {
                MORI_USER.addExperience(achievement.reward.exp);
            }
            
            // Показываем уведомление
            MORI_APP.showToast(
                `🏆 Достижение получено: ${achievement.name}!`, 
                'success', 
                5000
            );
        }
    },

    /**
     * Проверка, разблокировано ли достижение
     */
    isUnlocked: function(achievementId) {
        return this.userProgress.unlocked?.includes(achievementId) || false;
    },

    /**
     * Получение прогресса достижения
     */
    getProgress: function(achievementId) {
        const current = this.userProgress[achievementId] || 0;
        const achievement = this.getById(achievementId);
        
        if (!achievement) return { current: 0, max: 0, percent: 0 };
        
        const percent = Math.floor((current / achievement.requirement) * 100);
        
        return {
            current,
            max: achievement.requirement,
            percent: Math.min(percent, 100)
        };
    },

    /**
     * Получение достижения по ID
     */
    getById: function(id) {
        return this.list.find(a => a.id === id);
    },

    /**
     * Получение всех достижений
     */
    getAll: function() {
        return this.list.map(achievement => ({
            ...achievement,
            unlocked: this.isUnlocked(achievement.id),
            progress: this.getProgress(achievement.id)
        }));
    },

    /**
     * Получение разблокированных
     */
    getUnlocked: function() {
        return this.list
            .filter(a => this.isUnlocked(a.id))
            .map(a => ({
                ...a,
                progress: this.getProgress(a.id)
            }));
    },

    /**
     * Получение последних разблокированных
     */
    getRecent: function(limit = 3) {
        const unlocked = this.getUnlocked();
        return unlocked.slice(-limit).reverse();
    },

    /**
     * Получение статистики
     */
    getStats: function() {
        const total = this.list.length;
        const unlocked = this.userProgress.unlocked?.length || 0;
        
        return {
            total,
            unlocked,
            percent: Math.floor((unlocked / total) * 100)
        };
    },

    /**
     * Сброс прогресса (для тестов)
     */
    reset: function() {
        this.userProgress = {};
        this.saveProgress();
    }
};

// Инициализация
MORI_PROFILE_ACHIEVEMENTS.loadProgress();

// Экспорт
window.MORI_PROFILE_ACHIEVEMENTS = MORI_PROFILE_ACHIEVEMENTS;
