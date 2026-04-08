/**
 * CORE USER — ПОЛЬЗОВАТЕЛЬ
 * Версия: 5.0.0 (30 УРОВНЕЙ, ДОСТИЖЕНИЯ ТОЛЬКО ПОСЛЕ 30)
 */

const MORI_USER = {
    // ========== ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ ==========
    current: null,
    
    // ========== КЭШ ПОЛЬЗОВАТЕЛЕЙ ==========
    userCache: new Map(),
    
    // ========== ДРУЗЬЯ ==========
    friendsCache: new Map(),
    
    // ========== БЛОКИРОВКИ ==========
    blockedUsers: new Set(),
    
    // ========== ИСТОРИЯ АКТИВНОСТИ ==========
    activityLog: [],
    
    // ========== НАСТРОЙКИ ПРИВАТНОСТИ ==========
    privacySettings: {},
    
    // ========== ДОСТИЖЕНИЯ (ТОЛЬКО ДЛЯ 30 УРОВНЯ) ==========
    achievements: [
        { 
            id: 'absolute_power', 
            name: 'Абсолютная власть', 
            description: 'Достичь 30 уровня и стать Абсолютом', 
            exp: 5000, 
            icon: '👑', 
            condition: (u) => (u.level || 1) >= 30 
        },
        { 
            id: 'legendary_status', 
            name: 'Легендарный статус', 
            description: 'Подтвердить своё величие', 
            exp: 5000, 
            icon: '🏆', 
            condition: (u) => (u.level || 1) >= 30 
        },
        { 
            id: 'immortal', 
            name: 'Бессмертный', 
            description: 'Преодолеть все испытания', 
            exp: 5000, 
            icon: '⚡', 
            condition: (u) => (u.level || 1) >= 30 
        },
        { 
            id: 'true_absolute', 
            name: 'Истинный Абсолют', 
            description: 'Доказать своё превосходство', 
            exp: 5000, 
            icon: '🔱', 
            condition: (u) => (u.level || 1) >= 30 && (u.experience || 0) >= 23200 
        }
    ],

    // ========== ТАБЛИЦА УРОВНЕЙ (30 УРОВНЕЙ, 30-Й = 23200 XP) ==========
    levels: [
        { level: 1, name: 'Новичок', exp: 0, icon: '🌱' },
        { level: 2, name: 'Любопытный', exp: 200, icon: '👀' },
        { level: 3, name: 'Читатель', exp: 400, icon: '📖' },
        { level: 4, name: 'Музыкант', exp: 600, icon: '🎵' },
        { level: 5, name: 'Финансист', exp: 900, icon: '💰' },
        { level: 6, name: 'Ценитель', exp: 1200, icon: '🎨' },
        { level: 7, name: 'Игрок', exp: 1600, icon: '🎮' },
        { level: 8, name: 'Семьянин', exp: 2100, icon: '👨‍👩‍👧‍👦' },
        { level: 9, name: 'Мастер', exp: 2700, icon: '🔨' },
        { level: 10, name: 'Легенда', exp: 3400, icon: '🌟' },
        { level: 11, name: 'Тень', exp: 4200, icon: '🌑' },
        { level: 12, name: 'Хранитель', exp: 5100, icon: '🛡️' },
        { level: 13, name: 'Философ', exp: 6100, icon: '🤔' },
        { level: 14, name: 'Мудрец', exp: 7200, icon: '🦉' },
        { level: 15, name: 'Провидец', exp: 8400, icon: '🔮' },
        { level: 16, name: 'Странник', exp: 9700, icon: '🧳' },
        { level: 17, name: 'Искатель', exp: 11100, icon: '🔍' },
        { level: 18, name: 'Творец', exp: 12600, icon: '🎨' },
        { level: 19, name: 'Властелин', exp: 14200, icon: '👑' },
        { level: 20, name: 'Бессмертный', exp: 15900, icon: '⚡' },
        { level: 21, name: 'Мифический', exp: 17700, icon: '🐉' },
        { level: 22, name: 'Легендарный', exp: 19600, icon: '🏆' },
        { level: 23, name: 'Эпический', exp: 21600, icon: '📜' },
        { level: 24, name: 'Божественный', exp: 23700, icon: '✨' },
        { level: 25, name: 'Космический', exp: 25900, icon: '🌌' },
        { level: 26, name: 'Безграничный', exp: 28200, icon: '∞' },
        { level: 27, name: 'Всемогущий', exp: 30600, icon: '⚡' },
        { level: 28, name: 'Вездесущий', exp: 33100, icon: '👁️' },
        { level: 29, name: 'Мориарти', exp: 35700, icon: '🎭' },
        { level: 30, name: 'Абсолют', exp: 38400, icon: '🔱' }
    ],

    // ========== СТАТИСТИКА ПО УМОЛЧАНИЮ ==========
    defaultStats: {
        messages: 0,
        pagesRead: 0,
        calculations: 0,
        aiQuestions: 0,
        booksRead: 0,
        tasksCompleted: 0,
        achievementsUnlocked: 0,
        voiceMessages: 0,
        musicPlayed: 0,
        gamesPlayed: 0,
        friends: 0
    },

    // ========== НАСТРОЙКИ ПО УМОЛЧАНИЮ ==========
    defaultSettings: {
        theme: 'mori-classic',
        notifications: true,
        sound: true,
        vibration: true,
        privacyOnline: true,
        privacyBalance: false,
        language: 'ru',
        fontSize: 'medium'
    },

    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    init: function() {
        console.log('👤 MORI_USER инициализация...');
        
        this.loadFromStorage();
        this.loadBlockedUsers();
        this.loadPrivacySettings();
        this.loadActivityLog();
        this.trackOnlineStatus();
    },

    // ========== ЗАГРУЗКА ИЗ STORAGE ==========
    loadFromStorage: function() {
        try {
            const saved = localStorage.getItem('mori_user');
            if (saved) {
                this.current = JSON.parse(saved);
                console.log('✅ Пользователь загружен:', this.current.nickname);
            }
        } catch (e) {
            console.error('❌ Ошибка загрузки пользователя:', e);
        }
    },

    // ========== СОХРАНЕНИЕ ==========
    save: function() {
        if (this.current) {
            localStorage.setItem('mori_user', JSON.stringify(this.current));
        }
    },

    // ========== УСТАНОВКА ПОЛЬЗОВАТЕЛЯ ==========
    setUser: function(userData) {
        this.current = {
            ...userData,
            stats: userData.stats || { ...this.defaultStats },
            settings: userData.settings || { ...this.defaultSettings },
            achievements: userData.achievements || [],
            lastSync: Date.now()
        };
        this.save();
        sessionStorage.setItem('mori_user', JSON.stringify(this.current));
        this.checkAchievements();
    },

    // ========== КЭШ ПОЛЬЗОВАТЕЛЕЙ ==========
    async fetchUser(userId) {
        if (this.userCache.has(userId)) {
            return this.userCache.get(userId);
        }
        
        try {
            const user = await MORI_API.getUserProfile(userId);
            this.userCache.set(userId, user);
            setTimeout(() => this.userCache.delete(userId), 300000);
            return user;
        } catch (error) {
            console.error('❌ Ошибка загрузки пользователя:', error);
            return null;
        }
    },

    // ========== ОНЛАЙН-СТАТУС ==========
    trackOnlineStatus: function() {
        if (!this.current) return;
        
        const updateStatus = () => {
            MORI_API.updateUser(this.current.id, {
                lastSeen: Date.now(),
                online: true
            }).catch(() => {});
        };
        
        updateStatus();
        setInterval(updateStatus, 60000);
        
        window.addEventListener('beforeunload', () => {
            MORI_API.updateUser(this.current.id, {
                lastSeen: Date.now(),
                online: false
            }).catch(() => {});
        });
    },

    // ========== ДРУЗЬЯ ==========
    async getFriends(userId) {
        if (this.friendsCache.has(userId)) {
            return this.friendsCache.get(userId);
        }
        
        try {
            const friends = await MORI_API.getUserFriends?.(userId) || [];
            this.friendsCache.set(userId, friends);
            return friends;
        } catch (error) {
            console.error('❌ Ошибка загрузки друзей:', error);
            return [];
        }
    },

    async addFriend(friendId) {
        if (!this.current) return false;
        
        try {
            await MORI_API.addFriend?.(this.current.id, friendId);
            this.updateStats('friends', 1);
            MORI_APP.showToast('👥 Друг добавлен', 'success');
            this.friendsCache.delete(this.current.id);
            return true;
        } catch (error) {
            console.error('❌ Ошибка добавления друга:', error);
            MORI_APP.showToast('❌ Ошибка добавления друга', 'error');
            return false;
        }
    },

    async removeFriend(friendId) {
        if (!this.current) return false;
        
        try {
            await MORI_API.removeFriend?.(this.current.id, friendId);
            this.updateStats('friends', -1);
            MORI_APP.showToast('👥 Друг удалён', 'info');
            this.friendsCache.delete(this.current.id);
            return true;
        } catch (error) {
            console.error('❌ Ошибка удаления друга:', error);
            return false;
        }
    },

    // ========== БЛОКИРОВКИ ==========
    loadBlockedUsers: function() {
        try {
            const saved = localStorage.getItem('blocked_users');
            if (saved) {
                this.blockedUsers = new Set(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Ошибка загрузки блокировок:', e);
        }
    },

    saveBlockedUsers: function() {
        localStorage.setItem('blocked_users', JSON.stringify([...this.blockedUsers]));
    },

    blockUser: function(userId) {
        this.blockedUsers.add(userId);
        this.saveBlockedUsers();
        MORI_APP.showToast('🚫 Пользователь заблокирован', 'info');
    },

    unblockUser: function(userId) {
        this.blockedUsers.delete(userId);
        this.saveBlockedUsers();
        MORI_APP.showToast('✅ Блокировка снята', 'info');
    },

    isBlocked: function(userId) {
        return this.blockedUsers.has(userId);
    },

    // ========== ИСТОРИЯ АКТИВНОСТИ ==========
    loadActivityLog: function() {
        try {
            const saved = localStorage.getItem('user_activity');
            if (saved) {
                this.activityLog = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Ошибка загрузки активности:', e);
        }
    },

    logActivity: function(type, data) {
        this.activityLog.push({ type, data, timestamp: Date.now() });
        if (this.activityLog.length > 100) {
            this.activityLog = this.activityLog.slice(-100);
        }
        localStorage.setItem('user_activity', JSON.stringify(this.activityLog));
    },

    getRecentActivity: function(limit = 20) {
        return this.activityLog.slice(-limit);
    },

    // ========== ДОСТИЖЕНИЯ (ТОЛЬКО ПОСЛЕ 30 УРОВНЯ) ==========
    checkAchievements: function() {
        if (!this.current) return;
        
        // Достижения доступны только после 30 уровня
        if ((this.current.level || 1) < 30) return;
        
        if (!this.current.achievements) {
            this.current.achievements = [];
        }
        
        let newAchievements = 0;
        
        this.achievements.forEach(ach => {
            if (!this.current.achievements.includes(ach.id) && ach.condition(this.current)) {
                this.current.achievements.push(ach.id);
                this.addExperience(ach.exp);
                this.updateStats('achievementsUnlocked', 1);
                newAchievements++;
                MORI_APP.showToast(`🏆 Достижение: ${ach.name}`, 'success');
                this.logActivity('achievement', { id: ach.id, name: ach.name });
            }
        });
        
        if (newAchievements > 0) {
            this.save();
        }
    },

    // ========== НАСТРОЙКИ ПРИВАТНОСТИ ==========
    loadPrivacySettings: function() {
        try {
            const saved = localStorage.getItem('privacy');
            if (saved) {
                this.privacySettings = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Ошибка загрузки приватности:', e);
        }
    },

    updatePrivacy: function(setting, value) {
        this.privacySettings[setting] = value;
        localStorage.setItem('privacy', JSON.stringify(this.privacySettings));
        
        if (this.current) {
            MORI_API.updateUser(this.current.id, {
                privacy: this.privacySettings
            }).catch(() => {});
        }
    },

    canView: function(userId, field) {
        if (this.isMe(userId)) return true;
        
        const settings = this.privacySettings;
        if (field === 'balance' && settings.privacyBalance === false) return false;
        if (field === 'lastSeen' && settings.privacyOnline === false) return false;
        
        return true;
    },

    // ========== ЗАГРУЗКА АВАТАРА ==========
    async uploadAvatar(file) {
        if (!this.current) return false;
        
        const formData = new FormData();
        formData.append('avatar', file);
        
        try {
            const response = await fetch(`${MORI_API.baseUrl}/user/${this.current.id}/avatar`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('mori_token')
                },
                body: formData
            });
            
            if (response.ok) {
                const data = await response.json();
                this.current.avatar = data.url;
                this.save();
                MORI_APP.showToast('✅ Аватар обновлён', 'success');
                return true;
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки аватара:', error);
            MORI_APP.showToast('❌ Ошибка загрузки аватара', 'error');
        }
        return false;
    },

    // ========== ДНЕВНЫЕ БОНУСЫ ==========
    dailyBonus: {
        lastClaim: localStorage.getItem('daily_last'),
        streak: parseInt(localStorage.getItem('daily_streak') || '0'),
        
        claim: function() {
            const today = new Date().toDateString();
            
            if (this.lastClaim === today) {
                MORI_APP.showToast('❌ Бонус уже получен сегодня', 'error');
                return false;
            }
            
            const yesterday = new Date(Date.now() - 86400000).toDateString();
            if (this.lastClaim === yesterday) {
                this.streak++;
            } else {
                this.streak = 1;
            }
            
            const baseBonus = 100;
            const streakBonus = 50 * (this.streak - 1);
            const totalBonus = baseBonus + streakBonus;
            
            MORI_USER.current.balance = (MORI_USER.current.balance || 0) + totalBonus;
            MORI_USER.addExperience(25);
            
            this.lastClaim = today;
            localStorage.setItem('daily_last', today);
            localStorage.setItem('daily_streak', this.streak);
            
            MORI_USER.save();
            MORI_USER.logActivity('daily_bonus', { amount: totalBonus, streak: this.streak });
            
            MORI_APP.showToast(`🎁 Бонус ${totalBonus} MORI! Streak: ${this.streak}`, 'success');
            return true;
        },
        
        getTodayBonus: function() {
            const streak = this.streak + (this.lastClaim === new Date().toDateString() ? 0 : 1);
            return 100 + 50 * (streak - 1);
        }
    },

    // ========== ЭКСПОРТ/ИМПОРТ ==========
    exportData: function() {
        if (!this.current) return;
        
        const data = {
            user: this.current,
            stats: this.getStats(),
            settings: this.getSettings(),
            achievements: this.current.achievements || [],
            privacy: this.privacySettings,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mori_user_${this.current.id}_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.logActivity('export', { timestamp: Date.now() });
    },

    async importData(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (!confirm('⚠️ Это заменит все текущие данные. Продолжить?')) {
                return false;
            }
            
            this.current = data.user;
            this.privacySettings = data.privacy || {};
            
            this.save();
            this.saveBlockedUsers();
            localStorage.setItem('privacy', JSON.stringify(this.privacySettings));
            
            MORI_APP.showToast('✅ Данные импортированы', 'success');
            this.logActivity('import', { timestamp: Date.now() });
            
            setTimeout(() => location.reload(), 1000);
            return true;
        } catch (error) {
            console.error('❌ Ошибка импорта:', error);
            MORI_APP.showToast('❌ Ошибка импорта данных', 'error');
            return false;
        }
    },

    // ========== ОБНОВЛЕНИЕ ПОЛЬЗОВАТЕЛЯ ==========
    update: async function(data) {
        if (!this.current) return false;
        
        try {
            const response = await MORI_API.updateUser(this.current.id, data);
            
            if (response && response.success) {
                this.current = { ...this.current, ...data };
                this.save();
                sessionStorage.setItem('mori_user', JSON.stringify(this.current));
                return true;
            }
        } catch (error) {
            console.error('❌ Ошибка обновления:', error);
            MORI_APP.showToast('❌ Ошибка обновления профиля', 'error');
        }
        return false;
    },

    // ========== ПОЛУЧЕНИЕ УРОВНЯ ==========
    getLevelInfo: function(level = null) {
        const userLevel = level || this.current?.level || 1;
        return this.levels.find(l => l.level === userLevel) || this.levels[0];
    },

    // ========== ПОЛУЧЕНИЕ ПРОГРЕССА УРОВНЯ ==========
    getLevelProgress: function() {
        if (!this.current) return { current: 0, required: 100, percent: 0, expNeeded: 100 };
        
        const currentLevel = this.getLevelInfo(this.current.level);
        const nextLevel = this.getLevelInfo(this.current.level + 1) || currentLevel;
        
        const expForCurrent = currentLevel.exp;
        const expForNext = nextLevel.exp;
        const expNeeded = expForNext - expForCurrent;
        const expProgress = this.current.experience - expForCurrent;
        
        return {
            current: this.current.experience,
            required: expForNext,
            expNeeded: expNeeded,
            expProgress: Math.max(0, expProgress),
            percent: Math.min(100, Math.floor((expProgress / expNeeded) * 100)),
            currentLevel: currentLevel,
            nextLevel: nextLevel
        };
    },

    // ========== ДОБАВЛЕНИЕ ОПЫТА ==========
    addExperience: function(amount) {
        if (!this.current) return;
        
        this.current.experience = (this.current.experience || 0) + amount;
        
        let leveledUp = false;
        let nextLevel = this.getLevelInfo(this.current.level + 1);
        
        while (nextLevel && this.current.experience >= nextLevel.exp) {
            this.current.level++;
            leveledUp = true;
            nextLevel = this.getLevelInfo(this.current.level + 1);
        }
        
        if (leveledUp) {
            MORI_APP.showToast(`🎉 Уровень повышен! Уровень ${this.current.level}`, 'success');
            this.logActivity('level_up', { level: this.current.level });
            
            // Проверяем достижения при достижении 30 уровня
            if (this.current.level >= 30) {
                this.checkAchievements();
            }
            
            MORI_API.updateUser(this.current.id, {
                level: this.current.level,
                experience: this.current.experience
            }).catch(() => {});
        }
        
        // Проверка достижений после добавления опыта
if (window.MORI_PROFILE_ACHIEVEMENTS) {
    // Обновляем достижения по типу 'exp' или 'level'
    if (this.current) {
        MORI_PROFILE_ACHIEVEMENTS.checkAchievements('exp', this.current.experience);
        MORI_PROFILE_ACHIEVEMENTS.checkAchievements('level', this.current.level);
    }
}

        this.save();
    },

    // ========== ОБНОВЛЕНИЕ СТАТИСТИКИ ==========
    updateStats: function(stat, value = 1) {
        if (!this.current) return;
        
        if (!this.current.stats) {
            this.current.stats = { ...this.defaultStats };
        }
        
        this.current.stats[stat] = (this.current.stats[stat] || 0) + value;
        
        const expMap = {
            messages: 5,
            pagesRead: 2,
            calculations: 3,
            aiQuestions: 10,
            tasksCompleted: 20,
            achievementsUnlocked: 50,
            voiceMessages: 8,
            musicPlayed: 1,
            gamesPlayed: 15,
            friends: 10
        };
        
        if (expMap[stat]) {
            this.addExperience(expMap[stat] * Math.abs(value));
        }
        
        this.save();
        
        if (value > 0) {
            this.logActivity('stats_update', { stat, value });
        }
        
        MORI_API.updateUser(this.current.id, {
            stats: this.current.stats
        }).catch(() => {});
    },

    // ========== ОБНОВЛЕНИЕ НАСТРОЕК ==========
    updateSettings: async function(settings) {
        if (!this.current) return false;
        
        if (!this.current.settings) {
            this.current.settings = { ...this.defaultSettings };
        }
        
        this.current.settings = { ...this.current.settings, ...settings };
        this.save();
        
        if (settings.theme) {
            document.body.className = `theme-${settings.theme}`;
        }
        
        try {
            await MORI_API.updateUser(this.current.id, {
                settings: this.current.settings
            });
            return true;
        } catch (error) {
            console.error('Ошибка сохранения настроек:', error);
            return false;
        }
    },

    // ========== ПОЛУЧЕНИЕ СТАТИСТИКИ ==========
    getStats: function() {
        if (!this.current) return this.defaultStats;
        return { ...this.defaultStats, ...this.current.stats };
    },

    // ========== ПОЛУЧЕНИЕ НАСТРОЕК ==========
    getSettings: function() {
        if (!this.current) return this.defaultSettings;
        return { ...this.defaultSettings, ...this.current.settings };
    },

    // ========== ПРОВЕРКА, ЯВЛЯЕТСЯ ЛИ ПОЛЬЗОВАТЕЛЬ СОБОЙ ==========
    isMe: function(userId) {
        return this.current && this.current.id === userId;
    },

    // ========== ПОЛУЧЕНИЕ ИМЕНИ УРОВНЯ ==========
    getLevelName: function(level) {
        const levelInfo = this.getLevelInfo(level);
        return levelInfo ? levelInfo.name : `Уровень ${level}`;
    },

    // ========== ПОЛУЧЕНИЕ ИКОНКИ УРОВНЯ ==========
    getLevelIcon: function(level) {
        const levelInfo = this.getLevelInfo(level);
        return levelInfo ? levelInfo.icon : '📊';
    },

    // ========== ПОЛУЧЕНИЕ ИНФОРМАЦИИ О ПОЛЬЗОВАТЕЛЕ ==========
    getUserInfo: function() {
        if (!this.current) return null;
        
        return {
            id: this.current.id,
            nickname: this.current.nickname,
            avatar: this.current.avatar || '👤',
            level: this.current.level || 1,
            experience: this.current.experience || 0,
            accessLevel: this.current.access_level || 'user',
            balance: this.current.balance || 0,
            stats: this.getStats(),
            settings: this.getSettings(),
            achievements: this.current.achievements || [],
            levelInfo: this.getLevelProgress()
        };
    },

    // ========== ОЧИСТКА ДАННЫХ ==========
    clear: function() {
        this.current = null;
        this.userCache.clear();
        this.friendsCache.clear();
        this.blockedUsers.clear();
        this.activityLog = [];
        
        localStorage.removeItem('mori_user');
        localStorage.removeItem('blocked_users');
        localStorage.removeItem('user_activity');
        localStorage.removeItem('daily_last');
        localStorage.removeItem('daily_streak');
        sessionStorage.removeItem('mori_user');
    },

    // ========== ВЫПОЛНЕНИЕ ЗАДАНИЯ ==========
    completeTask: async function(taskId) {
        if (!this.current) return false;
        
        try {
            const response = await MORI_API.completeTask(this.current.id, taskId);
            if (response && response.success) {
                this.updateStats('tasksCompleted');
                if (response.reward) {
                    this.addExperience(response.reward.exp || 0);
                    if (response.reward.balance) {
                        this.current.balance = (this.current.balance || 0) + response.reward.balance;
                        this.save();
                    }
                }
                return true;
            }
        } catch (error) {
            console.error('❌ Ошибка выполнения задания:', error);
        }
        return false;
    },

    // ========== РАЗБЛОКИРОВКА ДОСТИЖЕНИЯ ==========
    unlockAchievement: async function(achievementId) {
        if (!this.current) return false;
        
        // Достижения доступны только после 30 уровня
        if ((this.current.level || 1) < 30) {
            MORI_APP.showToast('❌ Достижения доступны только после 30 уровня', 'error');
            return false;
        }
        
        try {
            const response = await MORI_API.unlockAchievement(this.current.id, achievementId);
            if (response && response.success) {
                this.updateStats('achievementsUnlocked');
                const achievement = this.achievements.find(a => a.id === achievementId);
                MORI_APP.showToast(`🏆 ${achievement?.name || 'Достижение'} разблокировано!`, 'success');
                return true;
            }
        } catch (error) {
            console.error('❌ Ошибка разблокировки достижения:', error);
        }
        return false;
    },

    // ========== ПОЛУЧЕНИЕ БАЛАНСА ==========
    getBalance: function() {
        return this.current?.balance || 0;
    },

    // ========== ИЗМЕНЕНИЕ БАЛАНСА ==========
    addBalance: function(amount) {
        if (!this.current) return false;
        
        this.current.balance = (this.current.balance || 0) + amount;
        this.save();
        this.logActivity('balance_change', { amount });
        
        MORI_API.updateUser(this.current.id, {
            balance: this.current.balance
        }).catch(() => {});
        
        return true;
    }
};

// ========== ЗАПУСК ==========
window.MORI_USER = MORI_USER;

console.log('✅ USER загружен, методов:', Object.keys(MORI_USER).filter(k => typeof MORI_USER[k] === 'function').length);
