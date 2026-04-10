/**
 * PROFILE MODULE v2.0
 * Уровни, достижения, настройки, рефералы, лидерборд, кастомизация
 */

const MORI_PROFILE = {
    state: {
        activeTab: 'info',      // info, stats, settings, referrals, leaderboard, customization, privacy, friends,
        adminTab: 'coins',
        user: null,
        level: 1,
        exp: 0,
        nextLevelExp: 500,
        realBalance: 0,
        gameBalance: 0,
        streak: 0,
        lastDailyBonus: null,
        leaderboardData: [],
        leaderboardType: 'level',
        referralLink: '',
        referrals: [],
        availableAvatars: [],
        availableFrames: [],
        availableLevelIcons: [],
        purchasedAvatars: [],
        purchasedFrames: [],
        purchasedLevelIcons: []
    },

    init: function() {
        console.log('👤 MORI_PROFILE инициализация...');
        this.loadUserData();
        this.loadBalances();
        this.loadStreak();
        this.loadReferralLink();
        this.loadPurchasedItems();
        this.render();
    },

    loadUserData: function() {
        if (window.MORI_USER && MORI_USER.current) {
            this.state.user = MORI_USER.current;
            this.state.level = this.state.user.level || 1;
            this.state.exp = this.state.user.experience || 0;
            const progress = MORI_USER.getLevelProgress();
            this.state.nextLevelExp = progress.required || 500;
            this.state.user.access_level = MORI_APP?.accessLevel || 'user';
        } else {
            this.state.user = {
                id: 'user_' + Date.now(),
                nickname: 'MORI Пользователь',
                avatar: '👤',
                level: 1,
                experience: 0,
                access_level: 'user'
            };
        }
    },

    loadBalances: function() {
        // $MORI реальный баланс (ручной ввод)
        const savedReal = localStorage.getItem('mori_real_balance');
        this.state.realBalance = savedReal ? parseFloat(savedReal) : 0;
        
        // MORI Coin игровой баланс
        const savedGame = localStorage.getItem('mori_game_balance');
        this.state.gameBalance = savedGame ? parseFloat(savedGame) : 0;
    },

    loadStreak: function() {
        const last = localStorage.getItem('daily_last');
        const streak = localStorage.getItem('daily_streak');
        const today = new Date().toDateString();
        
        if (last === today) {
            this.state.streak = parseInt(streak) || 0;
        } else {
            const yesterday = new Date(Date.now() - 86400000).toDateString();
            if (last === yesterday) {
                this.state.streak = parseInt(streak) || 1;
            } else {
                this.state.streak = 0;
            }
        }
    },

    loadReferralLink: function() {
        const userId = this.state.user?.id || 'user';
        this.state.referralLink = `https://mori.oracle/ref/${userId}`;
        
        const saved = localStorage.getItem('mori_referrals');
        if (saved) {
            this.state.referrals = JSON.parse(saved);
        }
    },

    loadPurchasedItems: function() {
        const purchased = localStorage.getItem('mori_purchased');
        if (purchased) {
            const data = JSON.parse(purchased);
            this.state.purchasedAvatars = data.avatars || [];
            this.state.purchasedFrames = data.frames || [];
            this.state.purchasedLevelIcons = data.levelIcons || [];
        }
    },

    savePurchasedItems: function() {
        localStorage.setItem('mori_purchased', JSON.stringify({
            avatars: this.state.purchasedAvatars,
            frames: this.state.purchasedFrames,
            levelIcons: this.state.purchasedLevelIcons
        }));
    },

    addGameBalance: function(amount, reason) {
        this.state.gameBalance += amount;
        localStorage.setItem('mori_game_balance', this.state.gameBalance);
        this.addTransaction('game', amount, reason);
        this.renderBalances();
    },

    addTransaction: function(type, amount, reason) {
        const transactions = JSON.parse(localStorage.getItem(`${type}_transactions`) || '[]');
        transactions.unshift({
            amount: amount,
            reason: reason,
            date: Date.now(),
            balance: type === 'real' ? this.state.realBalance : this.state.gameBalance
        });
        if (transactions.length > 50) transactions.pop();
        localStorage.setItem(`${type}_transactions`, JSON.stringify(transactions));
    },

    updateRealBalance: function(amount) {
        const oldBalance = this.state.realBalance;
        this.state.realBalance = amount;
        localStorage.setItem('mori_real_balance', this.state.realBalance);
        this.addTransaction('real', amount - oldBalance, 'Ручное изменение');
        this.renderBalances();
    },

    claimDailyBonus: function() {
        const today = new Date().toDateString();
        if (localStorage.getItem('daily_last') === today) {
            MORI_APP.showToast('❌ Бонус уже получен сегодня', 'error');
            return false;
        }
        
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const lastClaim = localStorage.getItem('daily_last');
        let streak = parseInt(localStorage.getItem('daily_streak') || '0');
        
        if (lastClaim === yesterday) {
            streak++;
        } else {
            streak = 1;
        }
        
        const baseBonus = 50;
        const streakBonus = 25 * (streak - 1);
        const totalBonus = baseBonus + streakBonus;
        
        this.addGameBalance(totalBonus, `Дневной бонус (серия ${streak})`);
        
        localStorage.setItem('daily_last', today);
        localStorage.setItem('daily_streak', streak);
        this.state.streak = streak;
        
        MORI_APP.showToast(`🎁 Получено ${totalBonus} MORI Coin! Серия: ${streak} дней`, 'success');
        this.render();
        return true;
    },

    addReferral: function() {
        const today = new Date().toDateString();
        const referralsToday = this.state.referrals.filter(r => {
            const refDate = new Date(r.date).toDateString();
            return refDate === today;
        }).length;
        
        if (referralsToday >= 3) {
            MORI_APP.showToast('❌ Лимит приглашений на сегодня (3)', 'error');
            return false;
        }
        
        const newRef = {
            id: Date.now(),
            name: `Друг ${this.state.referrals.length + 1}`,
            date: Date.now(),
            bonus: 500
        };
        
        this.state.referrals.unshift(newRef);
        localStorage.setItem('mori_referrals', JSON.stringify(this.state.referrals));
        this.addGameBalance(500, `Реферал: ${newRef.name}`);
        MORI_APP.showToast('✅ +500 MORI Coin за приглашение!', 'success');
        this.render();
        return true;
    },

    changeNickname: function() {
        const lastChange = localStorage.getItem('last_nickname_change');
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        
        if (lastChange && parseInt(lastChange) > weekAgo) {
            const daysLeft = Math.ceil((parseInt(lastChange) + 7 * 24 * 60 * 60 * 1000 - Date.now()) / (24 * 60 * 60 * 1000));
            MORI_APP.showToast(`❌ Сменить имя можно раз в неделю. Осталось ${daysLeft} дней`, 'error');
            return;
        }
        
        const newName = prompt('Введите новое имя:', this.state.user.nickname);
        if (newName && newName.trim()) {
            this.state.user.nickname = newName.trim();
            if (window.MORI_USER) MORI_USER.update({ nickname: newName.trim() });
            localStorage.setItem('last_nickname_change', Date.now());
            this.render();
            MORI_APP.showToast('✅ Имя изменено!', 'success');
        }
    },

    changeAvatar: function(avatar) {
        const price = 100;
        if (this.state.gameBalance < price) {
            MORI_APP.showToast(`❌ Недостаточно MORI Coin. Нужно ${price}`, 'error');
            return;
        }
        
        if (this.state.purchasedAvatars.includes(avatar)) {
            this.state.user.avatar = avatar;
            if (window.MORI_USER) MORI_USER.update({ avatar: avatar });
            this.render();
            MORI_APP.showToast('✅ Аватар изменён!', 'success');
        } else {
            this.addGameBalance(-price, `Покупка аватара: ${avatar}`);
            this.state.purchasedAvatars.push(avatar);
            this.state.user.avatar = avatar;
            this.savePurchasedItems();
            this.render();
            MORI_APP.showToast(`✅ Аватар куплен за ${price} MORI Coin!`, 'success');
        }
    },

    updatePrivacy: function(setting, value) {
        if (window.MORI_USER && MORI_USER.updatePrivacy) {
            MORI_USER.updatePrivacy(setting, value);
        } else {
            localStorage.setItem(`privacy_${setting}`, value);
        }
        MORI_APP.showToast(`🔒 Приватность обновлена`, 'info');
    },

    getPrivacyValue: function(setting) {
        if (window.MORI_USER && MORI_USER.privacySettings) {
            return MORI_USER.privacySettings[setting] || 'public';
        }
        return localStorage.getItem(`privacy_${setting}`) || 'public';
    },

    updateSetting: function(key, value) {
        if (window.MORI_USER) {
            MORI_USER.updateSettings({ [key]: value });
        } else {
            localStorage.setItem(`setting_${key}`, value);
        }
        
        if (key === 'theme') {
            document.body.className = `theme-${value}`;
        }
        
        MORI_APP.showToast(`✅ Настройка сохранена`, 'info');
    },

    getSetting: function(key, defaultValue) {
        if (window.MORI_USER && window.MORI_USER.getSettings) {
            return window.MORI_USER.getSettings()[key] || defaultValue;
        }
        return localStorage.getItem(`setting_${key}`) || defaultValue;
    },

    render: function() {
        const content = document.getElementById('profile-content');
        if (!content) {
            setTimeout(() => this.render(), 100);
            return;
        }
        content.innerHTML = this.getHTML();
        this.attachEvents();
        this.renderLeaderboard();
    },

    getHTML: function() {
        const progressPercent = (this.state.exp / this.state.nextLevelExp) * 100;
        const levelInfo = window.MORI_USER ? MORI_USER.getLevelInfo(this.state.level) : { name: 'Новичок', icon: '🌱' };
        
        return `
            <div class="profile-container">
                <!-- Два баланса всегда вверху -->
                <div class="profile-balances">
                    <div class="balance-card real">
                        <span class="balance-icon">💰</span>
                        <span class="balance-value">$${this.state.realBalance.toFixed(2)}</span>
                        <span class="balance-label">MORI Real</span>
                    </div>
                    <div class="balance-card game">
                        <span class="balance-icon">🎮</span>
                        <span class="balance-value">${this.state.gameBalance.toFixed(0)}</span>
                        <span class="balance-label">MORI Coin</span>
                    </div>
                </div>

                <!-- Вкладки -->
                <div class="profile-tabs">
                    <button class="profile-tab ${this.state.activeTab === 'info' ? 'active' : ''}" data-tab="info">👤 Инфо</button>
                    <button class="profile-tab ${this.state.activeTab === 'stats' ? 'active' : ''}" data-tab="stats">📊 Статистика</button>
                    <button class="profile-tab ${this.state.activeTab === 'achievements' ? 'active' : ''}" data-tab="achievements">🏆 Достижения</button>
                    <button class="profile-tab ${this.state.activeTab === 'settings' ? 'active' : ''}" data-tab="settings">⚙️ Настройки</button>
                    <button class="profile-tab ${this.state.activeTab === 'privacy' ? 'active' : ''}" data-tab="privacy">🔒 Приватность</button>
                    <button class="profile-tab ${this.state.activeTab === 'referrals' ? 'active' : ''}" data-tab="referrals">👥 Рефералы</button>
                    <button class="profile-tab ${this.state.activeTab === 'leaderboard' ? 'active' : ''}" data-tab="leaderboard">🏆 Лидеры</button>
                    <button class="profile-tab ${this.state.activeTab === 'customization' ? 'active' : ''}" data-tab="customization">🎨 Кастомизация</button>
                    <button class="profile-tab ${this.state.activeTab === 'friends' ? 'active' : ''}" data-tab="friends">👥 Друзья</button>
                </div>

                <div class="profile-content">
                    ${this.renderActiveTab()}
                </div>
            </div>
        `;
    },

    renderActiveTab: function() {
        switch(this.state.activeTab) {
            case 'info': return this.renderInfoTab();
            case 'stats': 
            setTimeout(() => this.renderCalendar(), 50);
            return this.renderStatsTab();
            case 'achievements': return this.renderAchievementsTab();
            case 'settings': return this.renderSettingsTab();
            case 'privacy': return this.renderPrivacyTab();
            case 'referrals': return this.renderReferralsTab();
            case 'leaderboard': return this.renderLeaderboardTab();
            case 'customization': return this.renderCustomizationTab();
            case 'friends': return this.renderFriendsTab();
            default: return this.renderInfoTab();
        }
    },

    renderInfoTab: function() {
        const progressPercent = (this.state.exp / this.state.nextLevelExp) * 100;
        const levelInfo = window.MORI_USER ? MORI_USER.getLevelInfo(this.state.level) : { name: 'Новичок', icon: '🌱' };
        
        return `
            <div class="info-tab">
                <div class="profile-avatar-section" onclick="MORI_PROFILE.changeAvatarPrompt()">
                    <div class="profile-avatar-large">${this.state.user.avatar || '👤'}</div>
                    <div class="avatar-change-hint">Нажми для смены</div>
                </div>
                
                <div class="profile-name-section">
                    <div class="profile-name">${this.state.user.nickname}</div>
                    <button class="edit-name-btn" onclick="MORI_PROFILE.changeNickname()">✏️</button>
                </div>
                
                <div class="profile-level-section">
                    <div class="level-icon">${levelInfo.icon}</div>
                    <div class="level-info">
                        <div class="level-name">${levelInfo.name} • Уровень ${this.state.level}</div>
                        <div class="level-progress">
                            <div class="level-progress-bar" style="width: ${progressPercent}%"></div>
                        </div>
                        <div class="level-exp">${this.state.exp} / ${this.state.nextLevelExp} XP</div>
                    </div>
                </div>
                
                <div class="daily-bonus-section">
                    <div class="daily-bonus-header">
                        <span>🎁 Дневной бонус</span>
                        <span class="streak-badge">🔥 Серия: ${this.state.streak} дней</span>
                    </div>
                    <button class="daily-bonus-btn" id="daily-bonus-btn">Забрать бонус</button>
                </div>
                ${(MORI_APP?.accessLevel === 'admin' || this.state.user.access_level === 'admin') ? `
<div class="admin-panel">
    <div class="admin-tabs">
        <button class="admin-tab ${this.state.adminTab === 'coins' ? 'active' : ''}" data-admin-tab="coins">💰 MORI Coin</button>
        <button class="admin-tab ${this.state.adminTab === 'users' ? 'active' : ''}" data-admin-tab="users">👥 Пользователи</button>
        <button class="admin-tab ${this.state.adminTab === 'logs' ? 'active' : ''}" data-admin-tab="logs">📜 Логи</button>
        <button class="admin-tab ${this.state.adminTab === 'whales' ? 'active' : ''}" data-admin-tab="whales">🐋 Киты</button>
    </div>
    <div class="admin-content">
        ${this.renderAdminTab()}
    </div>
</div>
` : ''}

        <button class="logout-btn" id="logout-btn">🚪 Выйти из аккаунта</button>
        <button class="delete-account-btn" id="delete-account-btn">🗑 Удалить аккаунт</button>
    </div>
    

        `;
    },

    renderStatsTab: function() {
        const stats = window.MORI_USER ? MORI_USER.getStats() : { messages: 0, tasksCompleted: 0, achievementsUnlocked: 0, friends: 0 };
        
        return `
            <div class="stats-tab">
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-value">${stats.messages || 0}</div>
                        <div class="stat-label">💬 Сообщений</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stats.tasksCompleted || 0}</div>
                        <div class="stat-label">✅ Заданий</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stats.achievementsUnlocked || 0}</div>
                        <div class="stat-label">🏆 Достижений</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stats.friends || 0}</div>
                        <div class="stat-label">👥 Друзей</div>
                    </div>
                </div>
                
                <div class="activity-calendar">
                    <h4>📅 Активность</h4>
                    <div id="calendar-container"></div>
                    <div class="streak-info" id="streak-info"></div>
                </div>
            </div>
        `;
    },

    renderSettingsTab: function() {
    const soundEnabled = this.getSetting('sound', 'true') === 'true';
    const vibrationEnabled = this.getSetting('vibration', 'true') === 'true';
    
    // Получаем темы из MORI_THEMES
    let themesHtml = '';
    if (window.MORI_THEMES) {
        const categories = MORI_THEMES.getThemesByCategory();
        for (const [key, cat] of Object.entries(categories)) {
            themesHtml += `<div class="theme-category">
                <div class="theme-category-title">${cat.icon} ${cat.name}</div>
                <div class="theme-category-grid">
                    ${cat.themes.map(theme => `
                        <button class="theme-option ${theme.isCurrent ? 'active' : ''} ${!theme.isUnlocked ? 'locked' : ''}" 
                                data-theme="${theme.id}" 
                                ${!theme.isUnlocked ? `data-task="${theme.taskName}"` : ''}>
                            <span class="theme-icon">${theme.icon}</span>
                            <span class="theme-name">${theme.name}</span>
                            ${!theme.isUnlocked ? '<span class="theme-lock">🔒</span>' : ''}
                            ${theme.isCurrent ? '<span class="theme-check">✅</span>' : ''}
                        </button>
                    `).join('')}
                </div>
            </div>`;
        }
    }
    
    return `
        <div class="settings-tab">
            <div class="setting-item">
                <span>🔊 Звук</span>
                <label class="switch">
                    <input type="checkbox" id="setting-sound" ${soundEnabled ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>
            
            <div class="setting-item">
                <span>📳 Вибрация</span>
                <label class="switch">
                    <input type="checkbox" id="setting-vibration" ${vibrationEnabled ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>
            
            <div class="setting-item themes-section">
                <span>Темы оформления</span>
                <div class="themes-container">
                    ${themesHtml || '<div class="empty">Загрузка тем...</div>'}
                </div>
            </div>
        </div>
    `;
},

    renderPrivacyTab: function() {
        const privacyItems = [
            { id: 'online', name: '🟢 Онлайн-статус' },
            { id: 'balance', name: '💰 Баланс' },
            { id: 'level', name: '🏆 Уровень и достижения' },
            { id: 'friendsList', name: '👥 Список друзей' },
            { id: 'history', name: '📜 История активности' }
        ];
        
        const options = [
            { value: 'public', icon: '🌍', label: 'Все' },
            { value: 'friends', icon: '👥', label: 'Друзья' },
            { value: 'private', icon: '🔒', label: 'Никто' }
        ];
        
        return `
            <div class="privacy-tab">
                ${privacyItems.map(item => `
                    <div class="privacy-item">
                        <span class="privacy-label">${item.name}</span>
                        <div class="privacy-options">
                            ${options.map(opt => `
                                <button class="privacy-option ${this.getPrivacyValue(item.id) === opt.value ? 'active' : ''}" 
                                        data-privacy="${item.id}" data-value="${opt.value}">
                                    ${opt.icon} ${opt.label}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderReferralsTab: function() {
    const currentUser = JSON.parse(localStorage.getItem('mori_user'));
    const users = JSON.parse(localStorage.getItem('mori_users') || '[]');
    const myReferrals = users.filter(u => u.used_referral_code === currentUser?.referral_code && u.nickname !== currentUser?.nickname);
    const today = new Date().toDateString();
    const todayReferrals = myReferrals.filter(r => new Date(r.created_at).toDateString() === today).length;
    const referralLink = `https://chrisostin.github.io/Oracle-Mini-App-/?ref=${currentUser?.referral_code || ''}`;
    
    return `
        <div class="referrals-tab">
            <div class="referral-code-section">
                <div class="referral-code-label">🎁 Ваш реферальный код:</div>
                <div class="referral-code-value" id="referral-code">${currentUser?.referral_code || 'Нет кода'}</div>
                <button class="copy-code-btn" id="copy-code-btn">📋 Копировать код</button>
            </div>
            <div class="referral-link-section">
                <div class="referral-link-label">🔗 Ваша реферальная ссылка:</div>
                <button class="copy-link-btn" id="copy-link-btn">📋 Копировать ссылку</button>
            </div>
            <div class="referral-stats">
                <div class="stat">
                    <span>${myReferrals.length}</span>
                    <span>👥 Приглашено всего</span>
                </div>
                <div class="stat">
                    <span>${todayReferrals}/3</span>
                    <span>📅 Сегодня</span>
                </div>
                <div class="stat">
                    <span>1 РЕФЕРАЛ</span>
                    <span>🎁 Бонус: 500 MORI coin</span>
                </div>
            </div>
            <div class="referrals-list">
                <h4>📋 История приглашений</h4>
                ${myReferrals.length === 0 ? '<div class="empty">Нет приглашённых</div>' :
                    myReferrals.map(ref => `
                        <div class="referral-item">
                            <span>👤 ${ref.nickname}</span>
                            <span>📅 ${new Date(ref.created_at).toLocaleDateString()}</span>
                            <span class="bonus">+500</span>
                        </div>
                    `).join('')
                }
            </div>
        </div>
    `;
},

    renderLeaderboardTab: function() {
        const types = [
            { id: 'level', name: '🏆 Уровень' },
            { id: 'exp', name: '⭐ Опыт' },
            { id: 'balance', name: '💰 MORI Coin' },
            { id: 'achievements', name: '🏅 Достижения' }
        ];
        
        return `
            <div class="leaderboard-tab">
                <div class="leaderboard-type-selector">
                    ${types.map(t => `
                        <button class="leaderboard-type ${this.state.leaderboardType === t.id ? 'active' : ''}" data-type="${t.id}">
                            ${t.name}
                        </button>
                    `).join('')}
                </div>
                <div class="leaderboard-list" id="leaderboard-list">
                    <div class="loading">Загрузка рейтинга...</div>
                </div>
            </div>
        `;
    },

    renderCustomizationTab: function() {
        const avatars = ['👤', '🎭', '👑', '🦊', '🐉', '🦅', '🐺', '🦁', '🐉', '🦸', '🦹', '🧙', '🧚', '🧝', '🧞', '🕵️', '👨‍🚀', '👩‍🚀', '🤖', '👻'];
        const price = 100;
        
        return `
            <div class="customization-tab">
                <div class="customization-section">
                    <h4>🎭 Аватары (${price} MORI Coin)</h4>
                    <div class="avatars-grid">
                        ${avatars.map(avatar => `
                            <div class="avatar-item ${this.state.user.avatar === avatar ? 'active' : ''} ${this.state.purchasedAvatars.includes(avatar) || this.state.user.avatar === avatar ? '' : 'locked'}" 
                                 onclick="MORI_PROFILE.changeAvatar('${avatar}')">
                                <div class="avatar-preview">${avatar}</div>
                                ${!this.state.purchasedAvatars.includes(avatar) && this.state.user.avatar !== avatar ? '<div class="avatar-price">💰100</div>' : ''}
                                ${this.state.user.avatar === avatar ? '<div class="avatar-check">✅</div>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    renderFriendsTab: function() {
        return `
            <div class="friends-tab">
                <div class="friends-requests">
                    <h4>📨 Входящие заявки</h4>
                    <div class="requests-list" id="requests-list">
                        <div class="empty">Нет заявок</div>
                    </div>
                </div>
                <div class="friends-list">
                    <h4>👥 Друзья (${this.state.user?.stats?.friends || 0}/100)</h4>
                    <div class="friends-items" id="friends-list">
                        <div class="empty">Нет друзей</div>
                    </div>
                </div>
            </div>
        `;
    },

    renderAchievementsTab: function() {
    if (!window.MORI_PROFILE_ACHIEVEMENTS) {
        return '<div class="empty">Система достижений не загружена</div>';
    }
    
    const achievements = MORI_PROFILE_ACHIEVEMENTS.getAll();
    const stats = MORI_PROFILE_ACHIEVEMENTS.getStats();
    
    return `
        <div class="achievements-stats">
            <div class="achievements-progress">
                <div class="achievements-progress-bar" style="width: ${stats.percent}%"></div>
            </div>
            <div class="achievements-count">${stats.unlocked} / ${stats.total} достижений</div>
        </div>
        <div class="achievements-list">
            ${achievements.map(ach => `
                <div class="achievement-card ${ach.unlocked ? 'unlocked' : 'locked'}">
                    <div class="achievement-icon">${ach.icon}</div>
                    <div class="achievement-info">
                        <div class="achievement-name">${ach.name}</div>
                        <div class="achievement-desc">${ach.description}</div>
                        ${!ach.unlocked ? `<div class="achievement-progress">Прогресс: ${ach.progress.current} / ${ach.progress.max}</div>` : ''}
                    </div>
                    <div class="achievement-badge">${ach.unlocked ? '✅' : '🔒'}</div>
                </div>
            `).join('')}
        </div>
    `;
},

renderAdminTab: function() {
    switch(this.state.adminTab) {
        case 'coins':
            return `
                <div class="admin-coin-input">
                    <input type="text" id="admin-username" placeholder="Ник пользователя">
                    <input type="number" id="admin-amount" placeholder="Сумма MORI Coin">
                    <button id="admin-add-coins">➕ Начислить</button>
                </div>
                <div class="admin-info">💰 Начисление MORI Coin пользователям</div>
            `;
        case 'users':
            return this.renderAdminUsers();
        case 'logs':
            return this.renderAdminLogs();
        case 'whales':
            return this.renderAdminWhales(); 
        default:
            return '';
       
    }
},

renderAdminUsers: function() {
    const users = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key === 'mori_user') {
            try {
                const user = JSON.parse(localStorage.getItem(key));
                users.push(user);
            } catch(e) {}
        }
    }
    if (users.length === 0) return '<div class="admin-info">👥 Нет сохранённых пользователей</div>';
    return `
        <div class="admin-user-list">
            ${users.map(user => `
                <div class="admin-user-item">
                    <div class="admin-user-avatar">${user.avatar || '👤'}</div>
                    <div class="admin-user-info">
                        <div class="admin-user-name">${user.nickname || 'Без имени'}</div>
                        <div class="admin-user-id">${user.id || 'нет ID'}</div>
                    </div>
                    <div class="admin-user-stats">
                        <div>💰 $${(user.balance || 0).toFixed(2)}</div>
                        <div>🎮 ${(user.gameBalance || 0)} Coin</div>
                        <div>🏆 Ур.${user.level || 1} (${user.experience || 0} XP)</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
},

renderAdminLogs: function() {
    const errors = JSON.parse(localStorage.getItem('app_errors') || '[]');
    if (errors.length === 0) return '<div class="admin-info">📜 Нет ошибок в логах</div>';
    return `
        <div class="admin-log-list">
            ${errors.slice(-20).reverse().map(err => `
                <div class="admin-log-item">
                    <div>❌ ${err.context || 'Ошибка'}: ${err.message || err}</div>
                    <div>📅 ${new Date(err.time || Date.now()).toLocaleString()}</div>
                </div>
            `).join('')}
        </div>
    `;
},

    renderAdminWhales: function() {
    const whales = JSON.parse(localStorage.getItem('mori_whales') || '[]');
    
    return `
        <div class="admin-whales">
            <div class="add-whale-form">
                <input type="text" id="whale-address" placeholder="Адрес кошелька" autocomplete="off">
                <input type="number" id="whale-amount" placeholder="Количество MORI" step="any">
                <button id="add-whale-btn">➕ Добавить кита</button>
            </div>
            <div class="whales-list">
                <h4>Крупные держатели</h4>
                ${whales.length === 0 ? '<div class="empty">Нет добавленных китов</div>' :
                    whales.map((whale, i) => `
                        <div class="whale-item-admin">
                            <span class="whale-address">${whale.address}</span>
                            <span class="whale-amount">${whale.amount.toFixed(2)} MORI</span>
                            <button class="delete-whale" data-index="${i}">🗑️</button>
                        </div>
                    `).join('')
                }
            </div>
        </div>
    `;
},

    renderLeaderboard: async function() {
        const container = document.getElementById('leaderboard-list');
        if (!container) return;
        
        container.innerHTML = '<div class="loading">Загрузка...</div>';
        
        // Имитация загрузки данных (позже заменим на API)
        const mockData = [
            { name: 'Абсолют', level: 30, exp: 38400, balance: 10000, achievements: 4 },
            { name: 'Мориарти', level: 29, exp: 35700, balance: 8500, achievements: 3 },
            { name: 'Легенда', level: 20, exp: 15900, balance: 5000, achievements: 2 }
        ];
        
        const sorted = [...mockData].sort((a, b) => {
            switch(this.state.leaderboardType) {
                case 'level': return b.level - a.level;
                case 'exp': return b.exp - a.exp;
                case 'balance': return b.balance - a.balance;
                case 'achievements': return b.achievements - a.achievements;
                default: return b.level - a.level;
            }
        }).slice(0, 50);
        
        container.innerHTML = sorted.map((user, idx) => `
            <div class="leaderboard-item ${idx < 3 ? `top-${idx + 1}` : ''}">
                <div class="leaderboard-rank">${idx + 1}</div>
                <div class="leaderboard-name">${user.name}</div>
                <div class="leaderboard-value">
                    ${this.state.leaderboardType === 'level' ? `${user.level} ур` : 
                      this.state.leaderboardType === 'exp' ? `${user.exp} XP` :
                      this.state.leaderboardType === 'balance' ? `${user.balance} Coin` :
                      `${user.achievements} ач`}
                </div>
            </div>
        `).join('');
    },

   renderCalendar: function() {
    const container = document.getElementById('calendar-container');
    if (!container) return;
    
    const activityLog = JSON.parse(localStorage.getItem('user_activity') || '[]');
    const activeDays = new Set();
    
    activityLog.forEach(log => {
        activeDays.add(new Date(log.timestamp).toDateString());
    });
    
    const today = new Date().toDateString();
    activeDays.add(today);
    
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    
    let html = `<div style="text-align: center; margin-bottom: 12px;">
                <span style="color: #d4af37; font-size: 14px; font-weight: bold;">${monthNames[month]} ${year}</span>
            </div>`;

    html += `<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: 6px;">`;
    weekdays.forEach(day => { html += `<div class="calendar-weekday">${day}</div>`; });
    html += `</div><div class="calendar-grid">`;
    
    for (let i = 0; i < (startDayOfWeek === 0 ? 6 : startDayOfWeek - 1); i++) {
        html += `<div class="calendar-day"></div>`;
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const isActive = activeDays.has(date.toDateString());
        const isToday = date.toDateString() === today;
        html += `<div class="calendar-day ${isActive ? 'active' : ''} ${isToday ? 'today' : ''}">${d}</div>`;
    }
    
    html += `</div>`;
    container.innerHTML = html;
    
    let streak = 0;
    let checkDate = new Date();
    while (activeDays.has(checkDate.toDateString())) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
    }
    
    const streakInfo = document.getElementById('streak-info');
    if (streakInfo) streakInfo.innerHTML = `🔥 Текущая серия: ${streak} ${streak === 1 ? 'день' : (streak < 5 ? 'дня' : 'дней')}`;
},

    attachEvents: function() {
        // Вкладки
        document.querySelectorAll('.profile-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.state.activeTab = tab;
                this.render();
                if (tab === 'stats') {
                    setTimeout(() => this.renderCalendar(), 100);
                }

            });
        });
        
        // Дневной бонус
        const dailyBtn = document.getElementById('daily-bonus-btn');
        if (dailyBtn) dailyBtn.addEventListener('click', () => this.claimDailyBonus());
        
        // Админ-редактирование баланса
        const adminBtn = document.getElementById('admin-edit-balance');
        if (adminBtn) {
            adminBtn.addEventListener('click', () => {
                const newBalance = prompt('Введите новый REAL баланс ($MORI):', this.state.realBalance);
                if (newBalance !== null && !isNaN(parseFloat(newBalance))) {
                    this.updateRealBalance(parseFloat(newBalance));
                }
            });
        }
        
        // Настройки
        const soundToggle = document.getElementById('setting-sound');
        if (soundToggle) {
            soundToggle.addEventListener('change', (e) => this.updateSetting('sound', e.target.checked));
        }
        
        const vibrationToggle = document.getElementById('setting-vibration');
        if (vibrationToggle) {
            vibrationToggle.addEventListener('change', (e) => this.updateSetting('vibration', e.target.checked));
        }
        
        const themeSelect = document.getElementById('setting-theme');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => this.updateSetting('theme', e.target.value));
        }
        
        // Приватность
        document.querySelectorAll('.privacy-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const setting = e.target.dataset.privacy;
                const value = e.target.dataset.value;
                this.updatePrivacy(setting, value);
                this.render();
            });
        });
        
        // Рефералы — копирование кода и ссылки
const copyCodeBtn = document.getElementById('copy-code-btn');
if (copyCodeBtn) {
    copyCodeBtn.addEventListener('click', () => {
        const code = document.getElementById('referral-code')?.textContent;
        if (code) {
            navigator.clipboard.writeText(code);
            MORI_APP.showToast('✅ Реферальный код скопирован!', 'success');
        }
    });
}

// Копирование реферальной ссылки
const copyLinkBtn = document.getElementById('copy-link-btn');
if (copyLinkBtn) {
    copyLinkBtn.onclick = () => {
        const currentUser = JSON.parse(localStorage.getItem('mori_user'));
        const link = `https://chrisostin.github.io/Oracle-Mini-App-/?ref=${currentUser?.referral_code || ''}`;
        navigator.clipboard.writeText(link);
        MORI_APP.showToast('✅ Реферальная ссылка скопирована!', 'success');
    };
}

// Удаляем старую кнопку "Добавить приглашённого", если есть
const addRefBtn = document.getElementById('add-referral-btn');
if (addRefBtn) addRefBtn.remove();
  
        // Админ-панель: переключение вкладок
document.querySelectorAll('.admin-tab').forEach(btn => {
    btn.addEventListener('click', (e) => {
        this.state.adminTab = e.target.dataset.adminTab;
        this.render();
    });
});

// Админ-панель: начисление MORI Coin
const addCoinsBtn = document.getElementById('admin-add-coins');
if (addCoinsBtn) {
    addCoinsBtn.addEventListener('click', () => {
        const username = document.getElementById('admin-username')?.value;
        const amount = parseInt(document.getElementById('admin-amount')?.value);
        if (!username || isNaN(amount) || amount <= 0) {
            MORI_APP.showToast('❌ Введите ник и сумму', 'error');
            return;
        }
        let user = null;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key === 'mori_user') {
                try {
                    const u = JSON.parse(localStorage.getItem(key));
                    if (u.nickname === username) {
                        user = u;
                        break;
                    }
                } catch(e) {}
            }
        }
        if (!user) {
            MORI_APP.showToast(`❌ Пользователь "${username}" не найден`, 'error');
            return;
        }
        user.gameBalance = (user.gameBalance || 0) + amount;
        localStorage.setItem('mori_user', JSON.stringify(user));
        MORI_APP.showToast(`✅ Начислено ${amount} MORI Coin пользователю ${username}`, 'success');
        this.render();
    });
}
        
        // Лидерборд типы
        document.querySelectorAll('.leaderboard-type').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.state.leaderboardType = e.target.dataset.type;
                this.renderLeaderboard();
                this.renderCalendar();
                document.querySelectorAll('.leaderboard-type').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    
    // Выбор темы в настройках
document.querySelectorAll('.theme-option').forEach(btn => {
    btn.addEventListener('click', () => {
        const themeId = btn.dataset.theme;
        const isLocked = btn.classList.contains('locked');
        
        if (isLocked) {
            const taskName = btn.dataset.task;
            MORI_APP.showToast(`🔒 Тема заблокирована. ${taskName}`, 'error');
        } else {
            if (window.MORI_THEMES) {
                MORI_THEMES.applyTheme(themeId);
                this.render();
            }
        }
    });
});

// Кнопка выхода (с задержкой)
setTimeout(() => {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            if (confirm('Вы уверены, что хотите выйти?')) {
                MORI_AUTH.logout();
            }
        };
    } else {
        console.log('Кнопка выхода не найдена');
    }
}, 500);

    
// Кнопка выхода (с задержкой)
setTimeout(() => {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            if (confirm('Вы уверены, что хотите выйти?')) {
                MORI_AUTH.logout();
            }
        };
    } else {
        console.log('Кнопка выхода не найдена');
    }
}, 500);


   // Кнопка удаления аккаунта (без задержки)
   const deleteBtn = document.getElementById('delete-account-btn');
   if (deleteBtn) {
       deleteBtn.onclick = () => {
           if (confirm('⚠️ ВНИМАНИЕ! Вы уверены, что хотите УДАЛИТЬ аккаунт?\n\nВсе данные будут потеряны без возможности восстановления.')) {
               if (confirm('Это действие необратимо. Удалить аккаунт?')) {
                   const currentUser = JSON.parse(localStorage.getItem('mori_user'));
                   const users = JSON.parse(localStorage.getItem('mori_users') || '[]');
                   const updatedUsers = users.filter(u => u.id !== currentUser.id);
                   localStorage.setItem('mori_users', JSON.stringify(updatedUsers));
                   MORI_AUTH.logout();
                   setTimeout(() => location.reload(), 500);
               }
           }
       };
   }


    // Админ-панель: управление китами
const addWhaleBtn = document.getElementById('add-whale-btn');
if (addWhaleBtn) {
    addWhaleBtn.addEventListener('click', () => {
        const address = document.getElementById('whale-address')?.value.trim();
        const amount = parseFloat(document.getElementById('whale-amount')?.value);
        
        if (!address || isNaN(amount) || amount <= 0) {
            MORI_APP.showToast('❌ Введите адрес и сумму', 'error');
            return;
        }
        
        const whales = JSON.parse(localStorage.getItem('mori_whales') || '[]');
        whales.push({ address, amount });
        localStorage.setItem('mori_whales', JSON.stringify(whales));
        
        MORI_APP.showToast('✅ Кит добавлен', 'success');
        this.render();
    });
}

document.querySelectorAll('.delete-whale').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        const whales = JSON.parse(localStorage.getItem('mori_whales') || '[]');
        whales.splice(index, 1);
        localStorage.setItem('mori_whales', JSON.stringify(whales));
        this.render();
        MORI_APP.showToast('🗑️ Кит удалён', 'info');
    });
});

    },

    renderBalances: function() {
        const realEl = document.querySelector('.balance-card.real .balance-value');
        const gameEl = document.querySelector('.balance-card.game .balance-value');
        if (realEl) realEl.textContent = `$${this.state.realBalance.toFixed(2)}`;
        if (gameEl) gameEl.textContent = this.state.gameBalance.toFixed(0);
    },

    changeAvatarPrompt: function() {
        this.state.activeTab = 'customization';
        this.render();
    },

    destroy: function() {
        console.log('👤 MORI_PROFILE уничтожен');
    }
};

window.MORI_PROFILE = MORI_PROFILE;
