/**
 * CORE AUTH — АВТОРИЗАЦИЯ
 * Версия: 3.1.0 (БЕЗ ГОСТЕВОГО РЕЖИМА)
 */
const MORI_AUTH = {
    // ========== УРОВНИ ДОСТУПА ==========
    levels: {
        ADMIN: 'admin',
        FAMILY: 'family',
        USER: 'user',
        GUEST: 'guest'
    },

    // ========== ПАРОЛИ (для справки) ==========
    passwords: {
        admin: 'MORIADMIN',
        family: 'MORIFAMILY',
        user: 'MORI'
    },

    // ========== СОСТОЯНИЕ ==========
    session: null,
    tokenRefreshTimer: null,
    refreshAttempts: 0,
    maxRefreshAttempts: 3,
    
    // УЛУЧШЕНИЕ 5: Таймер неактивности
    inactivityTimer: null,
    warningTimer: null,
    
    // УЛУЧШЕНИЕ 6: Защита от брутфорса
    loginAttempts: new Map(),

    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    init: function() {
        console.log('🔐 MORI_AUTH инициализация...');
        this.checkSession();
        
        // Слушаем события
        window.addEventListener('online', () => {
            if (localStorage.getItem('mori_token')) {
                this.checkSession();
            }
        });
        
        // УЛУЧШЕНИЕ 5: Запускаем таймер неактивности
        this.startInactivityTimer();
    },

    // ========== ПРОВЕРКА СЕССИИ ==========
    checkSession: async function() {
        const token = localStorage.getItem('mori_token');
        if (!token) {
            console.log('❌ Нет токена');
            return false;
        }

        try {
            const response = await MORI_API.verifyToken(token);
            
            if (response && response.valid) {
                this.session = response.session;
                MORI_APP.currentUser = response.user;
                MORI_APP.accessLevel = response.user.access_level;
                
// Стало
localStorage.setItem('mori_user_session', JSON.stringify(response.user));
localStorage.setItem('mori_level', response.user.access_level);
                
                console.log('✅ Сессия активна:', MORI_APP.accessLevel);
                
                // Запускаем таймер обновления токена
                this.startTokenRefresh();
                
                // УЛУЧШЕНИЕ 9: Синхронизация между устройствами
                this.syncSession();
                
                return true;
            } else {
                console.log('❌ Токен невалиден');
                this.logout(false);
                return false;
            }
        } catch (error) {
            console.error('❌ Ошибка проверки сессии:', error);
            
// Стало
const savedUser = localStorage.getItem('mori_user_session');
const savedLevel = localStorage.getItem('mori_level');
            
            if (savedUser && savedLevel) {
                MORI_APP.currentUser = JSON.parse(savedUser);
                MORI_APP.accessLevel = savedLevel;
                console.log('🔄 Сессия восстановлена из sessionStorage');
                return true;
            }
            
            this.logout(false);
            return false;
        }
    },

    // ========== ВХОД ==========
    login: async function(nickname, password) {
    // УЛУЧШЕНИЕ 6: Проверка на брутфорс
    if (!this.checkBruteForce()) {
        return false;
    }

    // Ищем пользователя в localStorage
    let users = JSON.parse(localStorage.getItem('mori_users') || '[]');
    const user = users.find(u => u.nickname === nickname);

    if (!user) {
        MORI_APP.showToast('❌ Пользователь не найден', 'error');
        this.recordFailedAttempt();
        return false;
    }

    if (user.password !== password) {
        MORI_APP.showToast('❌ Неверный пароль', 'error');
        this.recordFailedAttempt();
        return false;
    }

    // Определяем уровень доступа
    let accessLevel = null;
    if (password === this.passwords.admin) accessLevel = this.levels.ADMIN;
    else if (password === this.passwords.family) accessLevel = this.levels.FAMILY;
    else if (password === this.passwords.user) accessLevel = this.levels.USER;

    // Сохраняем сессию
    this.session = { user: user };
    localStorage.setItem('mori_token', 'token_' + user.id);
    localStorage.setItem('mori_user', JSON.stringify(user));
// Стало
localStorage.setItem('mori_user_session', JSON.stringify(user));
localStorage.setItem('mori_level', accessLevel);
    MORI_APP.currentUser = user;
    MORI_APP.accessLevel = accessLevel;


    // Сохраняем балансы для отображения в профиле
    localStorage.setItem('mori_real_balance', user.real_balance);
    localStorage.setItem('mori_game_balance', user.game_balance || 0);

    // Синхронизируем game_balance с mori_users
    users = JSON.parse(localStorage.getItem('mori_users') || '[]');
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
        const savedGameBalance = localStorage.getItem('mori_game_balance');
        if (savedGameBalance !== null && parseFloat(savedGameBalance) !== users[userIndex].game_balance) {
            users[userIndex].game_balance = parseFloat(savedGameBalance);
            localStorage.setItem('mori_users', JSON.stringify(users));
        }
    }

    // Разблокируем все темы для админа
    if (MORI_APP.accessLevel === 'admin' && window.MORI_THEMES) {
        MORI_THEMES.list.forEach(theme => {
            if (!MORI_THEMES.unlockedThemes.includes(theme.id)) {
                MORI_THEMES.unlockedThemes.push(theme.id);
            }
        });
        MORI_THEMES.save();
        console.log('👑 Админ: все темы разблокированы');
    }

    // Запускаем таймер обновления токена
    this.startTokenRefresh();

    // УЛУЧШЕНИЕ 5: Сбрасываем таймер неактивности
    this.startInactivityTimer();

    // УЛУЧШЕНИЕ 6: Сбрасываем счётчик попыток при успешном входе
    this.resetBruteForce();

    // УЛУЧШЕНИЕ 9: Синхронизация между устройствами
    this.syncSession();

    // Очищаем кэш API
    MORI_API.clearUserCache();

    MORI_APP.showToast(`👋 С возвращением, ${nickname}!`, 'success');

    // Устанавливаем портфель как экран по умолчанию после входа
localStorage.setItem('last_screen', 'portfolio');

// Дублируем в sessionStorage на случай очистки localStorage
sessionStorage.setItem('mori_user_backup', JSON.stringify(user));
sessionStorage.setItem('mori_level_backup', accessLevel);
sessionStorage.setItem('last_screen_backup', 'portfolio');

    MORI_APP.startApp();
    return true;
},

setUserSession: function(user) {
    this.session = { user: user };
    localStorage.setItem('mori_token', 'token_' + user.id);
    localStorage.setItem('mori_user', JSON.stringify(user));
    localStorage.setItem('mori_user_session', JSON.stringify(user));
    localStorage.setItem('mori_level', user.access_level);
    MORI_APP.currentUser = user;
    MORI_APP.accessLevel = user.access_level;

    localStorage.setItem('mori_real_balance', user.real_balance);
    localStorage.setItem('mori_game_balance', user.game_balance || 0);

},

    // ========== УЛУЧШЕНИЕ 6: ЗАЩИТА ОТ БРУТФОРСА ==========
    checkBruteForce: function() {
        const ip = 'client-ip'; // В реальном приложении IP приходит с сервера
        const attempts = this.loginAttempts.get(ip) || { count: 0, time: Date.now() };
        
        if (attempts.count >= 5) {
            const timeLeft = 15 * 60 * 1000 - (Date.now() - attempts.time);
            if (timeLeft > 0) {
                const minutesLeft = Math.ceil(timeLeft / 60000);
                MORI_APP.showToast(`⏰ Слишком много попыток. Подождите ${minutesLeft} мин.`, 'error');
                return false;
            } else {
                this.loginAttempts.delete(ip);
            }
        }
        return true;
    },

    recordFailedAttempt: function() {
        const ip = 'client-ip';
        const attempts = this.loginAttempts.get(ip) || { count: 0, time: Date.now() };
        attempts.count++;
        attempts.time = Date.now();
        this.loginAttempts.set(ip, attempts);
        
        if (attempts.count === 5) {
            MORI_APP.showToast('⚠️ После 5 неудачных попыток вход будет заблокирован на 15 минут', 'warning');
        }
    },

    resetBruteForce: function() {
        const ip = 'client-ip';
        this.loginAttempts.delete(ip);
    },

    // ========== УЛУЧШЕНИЕ 5: ТАЙМЕР НЕАКТИВНОСТИ ==========
    startInactivityTimer: function(timeout = 30 * 60 * 1000) {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
        }
        if (this.warningTimer) {
            clearTimeout(this.warningTimer);
        }

        const resetTimer = () => {
            clearTimeout(this.inactivityTimer);
            clearTimeout(this.warningTimer);
            
            this.inactivityTimer = setTimeout(() => {
                if (this.isAuthenticated()) {
                    MORI_APP.showToast('⏰ Неактивность. Сессия истекает через 1 минуту', 'warning');
                    
                    this.warningTimer = setTimeout(() => {
                        this.logout();
                        MORI_APP.showToast('👋 Сессия завершена из-за неактивности', 'info');
                    }, 60000);
                }
            }, timeout);
        };

        ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'].forEach(e => {
            document.removeEventListener(e, resetTimer);
            document.addEventListener(e, resetTimer);
        });

        resetTimer();
    },

    // ========== УЛУЧШЕНИЕ 9: СИНХРОНИЗАЦИЯ МЕЖДУ УСТРОЙСТВАМИ ==========
    syncSession: async function() {
        if (!this.isAuthenticated()) return;
        
        try {
            const devices = MORI_API.getDevices ? await MORI_API.getDevices() : [];
            
            if (devices.length > 1) {
                MORI_APP.showToast(`📱 Активно устройств: ${devices.length}`, 'info');
                
                // Показываем уведомление о других устройствах
                setTimeout(() => {
                    if (confirm('📱 Обнаружены другие активные сессии. Завершить их?')) {
                        this.terminateOtherSessions();
                    }
                }, 2000);
            }
        } catch (error) {
            console.log('Синхронизация устройств недоступна');
        }
    },

    terminateOtherSessions: async function() {
        try {
            if (MORI_API.terminateOtherSessions) await MORI_API.terminateOtherSessions();
            MORI_APP.showToast('✅ Сессии на других устройствах завершены', 'success');
        } catch (error) {
            console.error('Ошибка завершения сессий:', error);
        }
    },

    // ========== ЗАПУСК ТАЙМЕРА ОБНОВЛЕНИЯ ТОКЕНА ==========
    startTokenRefresh: function() {
        if (this.tokenRefreshTimer) {
            clearInterval(this.tokenRefreshTimer);
        }
        
        // Обновляем токен каждые 50 минут (до истечения 24 часов)
        this.tokenRefreshTimer = setInterval(async () => {
            await this.refreshToken();
        }, 50 * 60 * 1000);
    },

    // ========== ОБНОВЛЕНИЕ ТОКЕНА ==========
    refreshToken: async function() {
        try {
            const response = await MORI_API.refreshToken();
            
            if (response && response.token) {
                localStorage.setItem('mori_token', response.token);
                console.log('✅ Токен обновлён');
                this.refreshAttempts = 0;
                return true;
            }
        } catch (error) {
            console.error('❌ Ошибка обновления токена:', error);
            this.refreshAttempts++;
            
            if (this.refreshAttempts >= this.maxRefreshAttempts) {
                console.log('❌ Превышено число попыток, выход');
                this.logout();
            }
        }
        return false;
    },

    // ========== ВЫХОД ==========
    logout: async function() {
    // Очищаем таймеры
    if (this.tokenRefreshTimer) {
        clearInterval(this.tokenRefreshTimer);
        this.tokenRefreshTimer = null;
    }
    if (this.inactivityTimer) {
        clearTimeout(this.inactivityTimer);
    }
    if (this.warningTimer) {
        clearTimeout(this.warningTimer);
    }

    // Очищаем localStorage
localStorage.removeItem('mori_token');
localStorage.removeItem('last_screen');
localStorage.removeItem('mori_user');
localStorage.removeItem('mori_user_session');
localStorage.removeItem('mori_level');
// Балансы НЕ удаляем

    // Сбрасываем состояние
    this.session = null;
    this.refreshAttempts = 0;

    MORI_APP.currentUser = null;
    MORI_APP.accessLevel = this.levels.GUEST;

    // Очищаем кэш API
    if (MORI_API && MORI_API.clearCache) {
        MORI_API.clearCache();
    }

    console.log('👋 Выход выполнен');

    // Переходим на экран авторизации
    if (MORI_ROUTER) {
        MORI_ROUTER.navigate('auth');
    } else {
        window.location.hash = 'auth';
        location.reload();
    }
},

    // ========== ПРОВЕРКА ПРАВ ==========
    isAdmin: function() {
        return MORI_APP.accessLevel === this.levels.ADMIN;
    },

    isFamily: function() {
        return [this.levels.FAMILY, this.levels.ADMIN].includes(MORI_APP.accessLevel);
    },

    isUser: function() {
        return [this.levels.USER, this.levels.FAMILY, this.levels.ADMIN].includes(MORI_APP.accessLevel);
    },

    isAuthenticated: function() {
        return MORI_APP.accessLevel !== this.levels.GUEST && MORI_APP.currentUser !== null;
    },

    // ========== ПОЛУЧЕНИЕ ИНФОРМАЦИИ ==========
    getUserInfo: function() {
        if (!MORI_APP.currentUser) return null;
        
        return {
            id: MORI_APP.currentUser.id,
            nickname: MORI_APP.currentUser.nickname,
            avatar: MORI_APP.currentUser.avatar,
            level: MORI_APP.currentUser.level,
            accessLevel: MORI_APP.accessLevel
        };
    },

    // ========== ПОЛУЧЕНИЕ ИНФОРМАЦИИ ОБ УСТРОЙСТВЕ ==========
    getDeviceInfo: function() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            online: navigator.onLine,
            timestamp: Date.now()
        };
    },

    // ========== ПОКАЗ ВЫБОРА АВАТАРА ==========
    showAvatarSelector: function(previewElement) {
        const avatars = ['👤', '🦊', '🐱', '🐼', '🐧', '🦉', '🐺', '🐨', '🦁', '🐸', '🐙', '🦄', '🐲', '🦚', '🦜', '🐬'];

        const selector = document.createElement('div');
        selector.className = 'avatar-selector-modal';
        selector.innerHTML = `
            <div class="avatar-selector-header">
                <h3>Выберите аватар</h3>
                <button class="avatar-selector-close">✕</button>
            </div>
            <div class="avatar-selector-grid">
                ${avatars.map(emoji => `
                    <button class="avatar-option">${emoji}</button>
                `).join('')}
            </div>
        `;

        document.body.appendChild(selector);

        selector.querySelectorAll('.avatar-option').forEach(btn => {
            btn.addEventListener('click', () => {
                previewElement.textContent = btn.textContent;
                selector.remove();
            });
        });

        selector.querySelector('.avatar-selector-close').addEventListener('click', () => {
            selector.remove();
        });

        selector.addEventListener('click', (e) => {
            if (e.target === selector) {
                selector.remove();
            }
        });
    },

    // ========== РЕГИСТРАЦИЯ ==========
    registerWithDetails: async function(nickname, password, realBalance, refCode) {
    let accessLevel = null;
    if (password === this.passwords.admin) accessLevel = this.levels.ADMIN;
    else if (password === this.passwords.family) accessLevel = this.levels.FAMILY;
    else if (password === this.passwords.user) accessLevel = this.levels.USER;
    else {
        MORI_APP.showToast('❌ Неверный пароль', 'error');
        return false;
    }

    users = JSON.parse(localStorage.getItem('mori_users') || '[]');
    const existingUser = users.find(u => u.nickname === nickname);

    if (existingUser) {
        MORI_APP.showToast('❌ Пользователь с таким ником уже существует', 'error');
        return false;
    }

    // Проверка Device ID (защита от мультиаккаунтов) — пропускаем, если есть реферальный код
    const deviceId = localStorage.getItem('mori_device_id');
    const existingDevice = users.find(u => u.device_id === deviceId);
    if (existingDevice && !refCode) {
        MORI_APP.showToast('❌ На этом устройстве уже зарегистрирован аккаунт. Используйте реферальный код для создания второго.', 'error');
        return false;
    }

    if (existingDevice && refCode) {
        MORI_APP.showToast('🔓 Реферальный код активирован! Создаём второй аккаунт.', 'info');
    }

    const generateCode = () => Math.random().toString(36).substring(2, 12).toUpperCase();
    const userReferralCode = generateCode();

    const newUser = {
        id: 'user_' + Date.now(),
        nickname: nickname,
        password: password,
        access_level: accessLevel,
        real_balance: realBalance,
        game_balance: 0,
        referral_code: userReferralCode,
        used_referral_code: refCode || null,
        invited_by: null,
        referrals: [],
        referral_count_today: 0,
        referral_last_date: new Date().toDateString(),
        created_at: Date.now(),
        device_id: deviceId,
    };

    let bonusGiven = false;
    let inviter = null;
    if (refCode) {
        inviter = users.find(u => u.referral_code === refCode);
        if (inviter && inviter.nickname !== nickname) {
            const today = new Date().toDateString();
            if (inviter.referral_last_date !== today) {
                inviter.referral_count_today = 0;
                inviter.referral_last_date = today;
            }
            if (inviter.referral_count_today < 3) {
                inviter.game_balance = (inviter.game_balance || 0) + 500;
                inviter.referral_count_today++;
                inviter.referrals.push({ nickname: nickname, date: Date.now(), bonus: 500 });
                newUser.invited_by = inviter.id;
                bonusGiven = true;
                MORI_APP.showToast(`🎉 Пользователь ${inviter.nickname} получил 500 MORI Coin за приглашение!`, 'success');
                const inviterIndex = users.findIndex(u => u.id === inviter.id);
                if (inviterIndex !== -1) users[inviterIndex] = inviter;
            } else {
                MORI_APP.showToast(`❌ У пользователя ${inviter.nickname} лимит приглашений на сегодня (3)`, 'error');
            }
        } else {
            MORI_APP.showToast('❌ Неверный реферальный код', 'error');
        }
    }

    users.push(newUser);
    localStorage.setItem('mori_users', JSON.stringify(users));

    if (bonusGiven || refCode) {
        newUser.game_balance = 500;
        const newUserIndex = users.findIndex(u => u.id === newUser.id);
        if (newUserIndex !== -1) users[newUserIndex] = newUser;
        localStorage.setItem('mori_users', JSON.stringify(users));
        MORI_APP.showToast(`🎉 Поздравляем, ${nickname}! Вам зачислен бонус 500 MORI Coin за регистрацию по реферальному коду!`, 'success', 5000);
    }

    if (bonusGiven && inviter) {
        MORI_NOTIFICATIONS.notifyReferral(inviter.nickname, nickname);
    }

    this.setUserSession(newUser);
MORI_APP.showToast(`✅ Добро пожаловать, ${nickname}!`, 'success');

// Принудительно сохраняем game_balance в localStorage
localStorage.setItem('mori_game_balance', newUser.game_balance);

// Устанавливаем портфель как экран по умолчанию после регистрации
localStorage.setItem('last_screen', 'portfolio');

MORI_APP.startApp();
  
    // Напоминание о бонусе после регистрации
    setTimeout(() => {
        if (window.MORI_NOTIFICATIONS) {
            MORI_NOTIFICATIONS.remindDailyBonus();
        }
    }, 5000);

    return true;
},
};

// ========== ЗАПУСК ==========
window.MORI_AUTH = MORI_AUTH;

console.log('✅ AUTH загружен, методов:', Object.keys(MORI_AUTH).filter(k => typeof MORI_AUTH[k] === 'function').length);
