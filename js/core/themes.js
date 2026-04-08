/**
 * THEMES SYSTEM — 29 тем с разблокировкой через задания
 */

const MORI_THEMES = {
    // Список всех тем
    list: [
        // ===== MORI ТЕМЫ (10) =====
        { id: 'mori-classic', name: 'Классическая', icon: '🎭', category: 'mori', locked: false, taskId: null, price: 0 },
        { id: 'mori-gold', name: 'Золотая', icon: '💰', category: 'mori', locked: true, taskId: 'unlock_gold_theme', taskName: 'Накопить 1000 MORI Coin', price: 0 },
        { id: 'mori-cyber', name: 'Кибер', icon: '🤖', category: 'mori', locked: true, taskId: 'unlock_cyber_theme', taskName: 'Написать 30 сообщений', price: 0 },
        { id: 'mori-neon', name: 'Неон', icon: '💚', category: 'mori', locked: true, taskId: 'unlock_neon_theme', taskName: 'Сделать 50 расчётов в калькуляторе', price: 0 },
        { id: 'mori-night', name: 'Ночная', icon: '🌙', category: 'mori', locked: true, taskId: 'unlock_night_theme', taskName: 'Заходить в приложение 7 дней подряд', price: 0 },
        { id: 'mori-royal', name: 'Королевская', icon: '👑', category: 'mori', locked: true, taskId: 'unlock_royal_theme', taskName: 'Достичь 15 уровня', price: 0 },
        { id: 'mori-shadow', name: 'Теневая', icon: '🌑', category: 'mori', locked: true, taskId: 'unlock_shadow_theme', taskName: 'Пригласить 5 друзей', price: 0 },
        { id: 'mori-stealth', name: 'Стелс', icon: '🥷', category: 'mori', locked: true, taskId: 'unlock_stealth_theme', taskName: 'Выполнить 20 заданий', price: 0 },
        { id: 'mori-vintage', name: 'Винтаж', icon: '📜', category: 'mori', locked: true, taskId: 'unlock_vintage_theme', taskName: 'Прочитать 500 страниц в библиотеке', price: 0 },
        { id: 'mori-warm', name: 'Тёплая', icon: '🔥', category: 'mori', locked: true, taskId: 'unlock_warm_theme', taskName: 'Получить 10 реакций в чате', price: 0 },
        
        // ===== ЦВЕТОВЫЕ ТЕМЫ (10) — бесплатные, но через задания =====
        { id: 'color-blue', name: 'Синяя', icon: '💙', category: 'colors', locked: true, taskId: 'unlock_blue_theme', taskName: 'Написать 5 сообщений', price: 0 },
        { id: 'color-brown', name: 'Коричневая', icon: '🤎', category: 'colors', locked: true, taskId: 'unlock_brown_theme', taskName: 'Сыграть 3 игры', price: 0 },
        { id: 'color-cyan', name: 'Бирюзовая', icon: '🩵', category: 'colors', locked: true, taskId: 'unlock_cyan_theme', taskName: 'Сделать 10 расчётов', price: 0 },
        { id: 'color-gray', name: 'Серая', icon: '🩶', category: 'colors', locked: true, taskId: 'unlock_gray_theme', taskName: 'Задать 5 вопросов AI', price: 0 },
        { id: 'color-green', name: 'Зелёная', icon: '💚', category: 'colors', locked: true, taskId: 'unlock_green_theme', taskName: 'Застейкать 100 MORI', price: 0 },
        { id: 'color-orange', name: 'Оранжевая', icon: '🧡', category: 'colors', locked: true, taskId: 'unlock_orange_theme', taskName: 'Достичь 5 уровня', price: 0 },
        { id: 'color-pink', name: 'Розовая', icon: '💓', category: 'colors', locked: true, taskId: 'unlock_pink_theme', taskName: 'Подарить подарок другу', price: 0 },
        { id: 'color-purple', name: 'Фиолетовая', icon: '💜', category: 'colors', locked: true, taskId: 'unlock_purple_theme', taskName: 'Выполнить 3 задания', price: 0 },
        { id: 'color-red', name: 'Красная', icon: '❤️', category: 'colors', locked: true, taskId: 'unlock_red_theme', taskName: 'Написать 10 сообщений', price: 0 },
        { id: 'color-yellow', name: 'Жёлтая', icon: '💛', category: 'colors', locked: true, taskId: 'unlock_yellow_theme', taskName: 'Получить 5 лайков', price: 0 },
        
        // ===== СЕМЕЙНЫЕ ТЕМЫ (9) =====
        { id: 'family-blackfire', name: 'Чёрный огонь', icon: '🔥', category: 'family', locked: true, taskId: 'unlock_blackfire_theme', taskName: 'Создать семью', price: 0 },
        { id: 'family-coder-cat', name: 'Девушка-кодер', icon: '🐱💻', category: 'family', locked: true, taskId: 'unlock_codercat_theme', taskName: 'Написать 50 сообщений', price: 0 },
        { id: 'family-demon', name: 'Демон', icon: '👿', category: 'family', locked: true, taskId: 'unlock_demon_theme', taskName: 'Выиграть 10 игр', price: 0 },
        { id: 'family-fox', name: 'Лис', icon: '🦊', category: 'family', locked: true, taskId: 'unlock_fox_theme', taskName: 'Достичь 10 уровня', price: 0 },
        { id: 'family-ghosts', name: 'Призраки', icon: '👻', category: 'family', locked: true, taskId: 'unlock_ghosts_theme', taskName: 'Задать 30 вопросов AI', price: 0 },
        { id: 'family-oscar', name: 'Оскар', icon: '🏆', category: 'family', locked: true, taskId: 'unlock_oscar_theme', taskName: 'Получить достижение', price: 0 },
        { id: 'family-rabbit', name: 'Чайный Кролик', icon: '🐰', category: 'family', locked: true, taskId: 'unlock_rabbit_theme', taskName: 'Пригласить 3 друзей', price: 0 },
        { id: 'family-scientist', name: 'Бородач', icon: '🧔🏻‍♂️', category: 'family', locked: true, taskId: 'unlock_scientist_theme', taskName: 'Сделать 100 расчётов', price: 0 },
        { id: 'family-skulls', name: 'Черепа', icon: '💀', category: 'family', locked: true, taskId: 'unlock_skulls_theme', taskName: 'Сыграть 50 игр', price: 0 }
    ],

    // Загруженные настройки
    unlockedThemes: [],
    currentTheme: 'mori-classic',

    init: function() {
        this.load();
        this.applyCurrentTheme();
    },

    load: function() {
    // Проверяем, админ ли пользователь
    const isAdmin = window.MORI_APP && MORI_APP.accessLevel === 'admin';
    
    // Загружаем разблокированные темы
    const saved = localStorage.getItem('mori_unlocked_themes');
    if (saved) {
        this.unlockedThemes = JSON.parse(saved);
    } else {
        // По умолчанию разблокирована только классическая
        this.unlockedThemes = ['mori-classic'];
    }
    
       // Если админ — разблокируем все темы
       if (window.MORI_APP && MORI_APP.accessLevel === 'admin') {
           this.list.forEach(theme => {
               if (!this.unlockedThemes.includes(theme.id)) {
                   this.unlockedThemes.push(theme.id);
               }
           });
       }

       this.save();


    // Загружаем текущую тему
    const current = localStorage.getItem('mori_current_theme');
    if (current && this.getThemeById(current)) {
        this.currentTheme = current;
    } else {
        this.currentTheme = 'mori-classic';
    }
},

    save: function() {
        localStorage.setItem('mori_unlocked_themes', JSON.stringify(this.unlockedThemes));
        localStorage.setItem('mori_current_theme', this.currentTheme);
    },

    getThemeById: function(id) {
        return this.list.find(t => t.id === id);
    },

    getAllThemes: function() {
        return this.list.map(theme => ({
            ...theme,
            isUnlocked: this.isUnlocked(theme.id),
            isCurrent: this.currentTheme === theme.id
        }));
    },

    getThemesByCategory: function() {
        const categories = {
            mori: { name: '🎭 MORI', icon: '', themes: [] },
            colors: { name: '🎨 Цветовые', icon: '', themes: [] },
            family: { name: '👨‍👩‍👧‍👦 Семейные', icon: '', themes: [] }
        };
        
        this.list.forEach(theme => {
            if (categories[theme.category]) {
                categories[theme.category].themes.push({
                    ...theme,
                    isUnlocked: this.isUnlocked(theme.id),
                    isCurrent: this.currentTheme === theme.id
                });
            }
        });
        
        return categories;
    },

    isUnlocked: function(themeId) {
        return this.unlockedThemes.includes(themeId);
    },

    unlockTheme: function(themeId) {
        const theme = this.getThemeById(themeId);
        if (!theme) return false;
        
        if (!this.unlockedThemes.includes(themeId)) {
            this.unlockedThemes.push(themeId);
            this.save();
            
            // Показываем уведомление
            MORI_APP.showToast(`🎉 Тема "${theme.name}" разблокирована!`, 'success');
            return true;
        }
        return false;
    },

   applyTheme: function(themeId) {
    const theme = this.getThemeById(themeId);
    if (!theme) return false;
    
    if (!this.isUnlocked(themeId) && themeId !== 'mori-classic') {
        MORI_APP.showToast(`🔒 Тема "${theme.name}" заблокирована. Выполните задание: ${theme.taskName}`, 'error');
        return false;
    }
    
    // Удаляем старые темы
    document.querySelectorAll('link[href*="themes/"]').forEach(link => link.remove());
    
    // Загружаем новую тему
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `css/themes/${themeId}.css`;
    link.onload = () => {
        document.body.className = `theme-${themeId}`;
        this.currentTheme = themeId;
        this.save();
        MORI_APP.showToast(`🎭 Тема "${theme.name}" применена`, 'success');
    };
    link.onerror = () => {
        // Если файла темы нет, применяем классическую
        document.body.className = 'theme-mori-classic';
        MORI_APP.showToast(`⚠️ Тема "${theme.name}" не найдена, применена классическая`, 'error');
    };
    document.head.appendChild(link);
    
    return true;
},

    applyCurrentTheme: function() {
        document.body.className = `theme-${this.currentTheme}`;
    },

    checkAndUnlockByTask: function(taskId) {
        // Находим тему, которая разблокируется этим заданием
        const theme = this.list.find(t => t.taskId === taskId);
        if (theme && !this.isUnlocked(theme.id)) {
            this.unlockTheme(theme.id);
            return true;
        }
        return false;
    },

    // Проверка всех тем на разблокировку (при выполнении задания)
    checkAllTasks: function(completedTasks) {
        let unlocked = false;
        this.list.forEach(theme => {
            if (theme.taskId && completedTasks.includes(theme.taskId) && !this.isUnlocked(theme.id)) {
                this.unlockTheme(theme.id);
                unlocked = true;
            }
        });
        return unlocked;
    },

    getUnlockedCount: function() {
        return this.unlockedThemes.length;
    },

    getLockedCount: function() {
        return this.list.length - this.unlockedThemes.length;
    }

    refreshForAdmin: function() {
    if (window.MORI_APP && window.MORI_APP.accessLevel === 'admin') {
        let changed = false;
        this.list.forEach(theme => {
            if (!this.unlockedThemes.includes(theme.id)) {
                this.unlockedThemes.push(theme.id);
                changed = true;
            }
        });
        if (changed) {
            this.save();
            console.log('👑 Админ: все темы разблокированы');
        }
    }
},

};

// Инициализация
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MORI_THEMES.init());
} else {
    MORI_THEMES.init();
}

window.MORI_THEMES = MORI_THEMES;
