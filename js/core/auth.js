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
                
                // Сохраняем в sessionStorage для восстановления
                sessionStorage.setItem('mori_user', JSON.stringify(response.user));
                sessionStorage.setItem('mori_level', response.user.access_level);
                
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
            
            // Если ошибка соединения, пробуем восстановить из sessionStorage
            const savedUser = sessionStorage.getItem('mori_user');
            const savedLevel = sessionStorage.getItem('mori_level');
            
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
    login: async function(password) {
        // УЛУЧШЕНИЕ 6: Проверка на брутфорс
        if (!this.checkBruteForce()) {
            return false;
        }

        // Определяем уровень доступа по паролю (для UI)
        let accessLevel = null;
        if (password === this.passwords.admin) accessLevel = this.levels.ADMIN;
        else if (password === this.passwords.family) accessLevel = this.levels.FAMILY;
        else if (password === this.passwords.user) accessLevel = this.levels.USER;
        else {
            MORI_APP.showToast('❌ Неверный пароль', 'error');
            
            // УЛУЧШЕНИЕ 6: Увеличиваем счётчик попыток
            this.recordFailedAttempt();
            return false;
        }

        try {
            MORI_APP.showToast('🔄 Вход...', 'info');
            
            const response = await MORI_API.login(password);
            
            if (response && response.success) {
                // Сохраняем сессию
                this.session = response.session;
                localStorage.setItem('mori_token', response.token);
                
                // Сохраняем данные пользователя
                MORI_APP.currentUser = response.user;
                MORI_APP.accessLevel = response.user.access_level;
                
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

                // Сохраняем в sessionStorage для восстановления
                sessionStorage.setItem('mori_user', JSON.stringify(response.user));
                sessionStorage.setItem('mori_level', response.user.access_level);
                
                // Очищаем кэш API при смене пользователя
                MORI_API.clearUserCache();
                
                // Запускаем таймер обновления токена
                this.startTokenRefresh();
                
                // УЛУЧШЕНИЕ 5: Сбрасываем таймер неактивности
                this.startInactivityTimer();
                
                // УЛУЧШЕНИЕ 6: Сбрасываем счётчик попыток при успешном входе
                this.resetBruteForce();
                
                // УЛУЧШЕНИЕ 9: Синхронизация между устройствами
                this.syncSession();
                
                MORI_APP.showToast(`✅ Добро пожаловать, ${response.user.nickname}!`, 'success');
                
                // Запускаем приложение
                MORI_APP.startApp();
                
                return true;
            } else {
                MORI_APP.showToast('❌ Ошибка при входе', 'error');
                
                // УЛУЧШЕНИЕ 6: Увеличиваем счётчик попыток
                this.recordFailedAttempt();
                
                return false;
            }
        } catch (error) {
            console.error('❌ Ошибка входа:', error);
            
            // УЛУЧШЕНИЕ 6: Увеличиваем счётчик попыток
            this.recordFailedAttempt();
            
            if (error.message.includes('401')) {
                MORI_APP.showToast('❌ Неверный пароль', 'error');
            } else if (!navigator.onLine) {
                MORI_APP.showToast('📴 Нет интернета', 'warning');
            } else {
                MORI_APP.showToast('❌ Ошибка соединения', 'error');
            }
            
            return false;
        }
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
            const devices = await MORI_API.getDevices?.() || [];
            
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
            await MORI_API.terminateOtherSessions?.();
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
    logout: async function(notifyServer = true) {
        if (notifyServer) {
            try {
                await MORI_API.logout();
            } catch (error) {
                console.error('Ошибка при выходе:', error);
            }
        }
        
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
        
        // Очищаем sessionStorage
        sessionStorage.removeItem('mori_user');
        sessionStorage.removeItem('mori_level');
        
        // Сбрасываем состояние
        this.session = null;
        this.refreshAttempts = 0;
        
        MORI_APP.currentUser = null;
        MORI_APP.accessLevel = this.levels.GUEST;
        
        // Очищаем кэш API
        MORI_API.clearCache();
        
        console.log('👋 Выход выполнен');
        
        // Переходим на экран авторизации
        MORI_ROUTER.navigate('auth');
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

    // ========== ПОКАЗ ЭКРАНА РЕГИСТРАЦИИ ==========
    showRegistration: function(tempUser) {
        const appDiv = document.getElementById('app');
        if (!appDiv) return;

        appDiv.innerHTML = `
            <div class="screen auth-screen">
                <header class="screen-header">
                    <h2>🔮 Регистрация</h2>
                </header>
                <div class="screen-content">
                    <div class="auth-form">
                        <div class="avatar-selector">
                            <div class="current-avatar" id="avatar-preview">👤</div>
                            <button class="change-avatar-btn" id="change-avatar">
                                Выбрать аватар
                            </button>
                        </div>

                        <div class="form-group">
                            <label for="nickname">Никнейм *</label>
                            <input type="text" id="nickname"
                                   placeholder="Введите никнейм"
                                   maxlength="20" required>
                            <small>Минимум 3 символа</small>
                        </div>

                        <div class="form-group">
                            <label for="balance">Баланс MORI (можно указать позже)</label>
                            <input type="number" id="balance"
                                   placeholder="0" min="0" step="100">
                        </div>

                        <div class="form-group">
                            <label for="invite-code">Пригласительный код (если есть)</label>
                            <input type="text" id="invite-code"
                                   placeholder="XXXXXXXX">
                        </div>

                        <button class="register-btn" id="register-btn">
                            Завершить регистрацию
                        </button>

                        <p class="form-note">* — обязательные поля</p>
                    </div>
                </div>
            </div>
        `;

        this.setupRegistrationHandlers(tempUser);
    },

    // ========== НАСТРОЙКА ОБРАБОТЧИКОВ РЕГИСТРАЦИИ ==========
    setupRegistrationHandlers: function(tempUser) {
        const registerBtn = document.getElementById('register-btn');
        const avatarBtn = document.getElementById('change-avatar');
        const avatarPreview = document.getElementById('avatar-preview');
        const nicknameInput = document.getElementById('nickname');

        if (avatarBtn && avatarPreview) {
            avatarBtn.addEventListener('click', () => {
                this.showAvatarSelector(avatarPreview);
            });
        }

        if (registerBtn) {
            registerBtn.addEventListener('click', async () => {
                const nickname = document.getElementById('nickname')?.value.trim();
                
                if (!nickname || nickname.length < 3) {
                    MORI_APP.showToast('❌ Никнейм должен быть минимум 3 символа', 'error');
                    return;
                }

                registerBtn.disabled = true;
                registerBtn.textContent = '⏳ Регистрация...';

                const userData = {
                    ...tempUser,
                    nickname,
                    avatar: avatarPreview?.textContent || '👤',
                    balance: parseFloat(document.getElementById('balance')?.value) || 0,
                    inviteCode: document.getElementById('invite-code')?.value.trim() || null
                };

                const success = await this.register(userData);
                
                if (!success) {
                    registerBtn.disabled = false;
                    registerBtn.textContent = 'Завершить регистрацию';
                }
            });
        }

        if (nicknameInput) {
            nicknameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    registerBtn?.click();
                }
            });
        }
    },

    // ========== РЕГИСТРАЦИЯ ==========
    register: async function(userData) {
        try {
            const response = await MORI_API.register(userData);
            
            if (response && response.success) {
                localStorage.setItem('mori_token', response.token);
                MORI_APP.currentUser = response.user;
                MORI_APP.accessLevel = response.user.access_level;
                
                sessionStorage.setItem('mori_user', JSON.stringify(response.user));
                sessionStorage.setItem('mori_level', response.user.access_level);
                
                MORI_APP.showToast('✅ Регистрация успешна!', 'success');
                MORI_APP.startApp();
                return true;
            }
        } catch (error) {
            console.error('❌ Ошибка регистрации:', error);
            
            if (error.message.includes('409')) {
                MORI_APP.showToast('❌ Пользователь уже существует', 'error');
            } else {
                MORI_APP.showToast('❌ Ошибка регистрации', 'error');
            }
        }
        return false;
    }
};

// ========== ЗАПУСК ==========
window.MORI_AUTH = MORI_AUTH;

console.log('✅ AUTH загружен, методов:', Object.keys(MORI_AUTH).filter(k => typeof MORI_AUTH[k] === 'function').length);
