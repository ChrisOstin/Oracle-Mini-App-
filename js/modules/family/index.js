/**
 * FAMILY MODULE
 * Управление семьёй: участники, бюджет, календарь, напоминания, игры
 * Версия: 2.0.0 (БЕЗ ЗАГЛУШЕК)
 */

const MORI_FAMILY = {
    // Состояние
    state: {
        activeTab: 'members',
        members: [],
        headId: null,
        budget: {
            total: 0,
            income: 0,
            expenses: 0,
            history: []
        },
        calendar: {
            year: new Date().getFullYear(),
            month: new Date().getMonth(),
            events: []
        },
        reminders: [],
        games: []
    },

    // Текущий пользователь
    user: null,

    /**
     * Инициализация
     */
    init: async function() {
        console.log('MORI_FAMILY инициализация...');
        this.user = MORI_USER.current;

        if (!MORI_AUTH.isFamily()) {
            return;
        }

        this.loadState();
        await this.loadMembers();
        await this.loadBudget();
        await this.loadCalendar();
        await this.loadReminders();
    },

    /**
     * Рендер
     */
    render: function() {
        const content = document.getElementById('family-content');
        if (!content) return;

        if (!MORI_AUTH.isFamily()) {
            content.innerHTML = this.renderNoAccess();
            return;
        }

        content.innerHTML = this.getHTML();
        this.attachEvents();
    },

    /**
     * HTML
     */
    getHTML: function() {
        return `
            <div class="family-screen">
                <div class="family-header">
                    <h2>👨‍👩‍👧‍👦 Семья</h2>
                    <div class="family-stats">
                        ${this.state.members.length} участников
                    </div>
                </div>

                <div class="family-tabs">
                    <button class="family-tab ${this.state.activeTab === 'members' ? 'active' : ''}" data-tab="members">
                        👥 Участники
                    </button>
                    <button class="family-tab ${this.state.activeTab === 'budget' ? 'active' : ''}" data-tab="budget">
                        💰 Бюджет
                    </button>
                    <button class="family-tab ${this.state.activeTab === 'calendar' ? 'active' : ''}" data-tab="calendar">
                        📅 Календарь
                    </button>
                    <button class="family-tab ${this.state.activeTab === 'reminders' ? 'active' : ''}" data-tab="reminders">
                        ⏰ Напоминания
                    </button>
                    <button class="family-tab ${this.state.activeTab === 'games' ? 'active' : ''}" data-tab="games">
                        🎮 Игры
                    </button>
                </div>

                <div class="family-container">
                    ${this.renderTabContent()}
                </div>
            </div>
        `;
    },

    /**
     * Рендер контента вкладки
     */
    renderTabContent: function() {
        switch(this.state.activeTab) {
            case 'members': return this.renderMembers();
            case 'budget': return this.renderBudget();
            case 'calendar': return this.renderCalendar();
            case 'reminders': return this.renderReminders();
            case 'games': return this.renderGames();
            default: return '';
        }
    },

    /**
     * Участники
     */
    renderMembers: function() {
        return `
            <div class="members-section">
                <div class="members-header">
                    <h3>👥 Участники семьи</h3>
                    <span class="members-count">${this.state.members.length}</span>
                </div>
                <div class="members-grid">
                    ${this.state.members.map(member => this.renderMember(member)).join('')}
                </div>
                ${this.canManageMembers() ? this.renderAddMember() : ''}
            </div>
        `;
    },

    /**
     * Рендер одного участника
     */
    renderMember: function(member) {
        const isOnline = this.isMemberOnline(member.id);
        const isHead = member.id === this.state.headId;
        const canManage = this.canManageMembers();

        return `
            <div class="member-card" data-member-id="${member.id}">
                <div class="member-avatar">${member.avatar || '👤'}</div>
                <div class="member-info">
                    <div class="member-name">
                        ${member.nickname}
                        ${isHead ? ' 👑' : ''}
                    </div>
                    ${member.role ? `<div class="member-role">${member.role}</div>` : ''}
                    <div class="member-status">
                        <span class="status-dot ${isOnline ? 'online' : ''}"></span>
                        ${isOnline ? 'в сети' : 'был(а) недавно'}
                    </div>
                </div>
                ${canManage && !isHead ? this.renderMemberActions(member) : ''}
            </div>
        `;
    },

    renderMemberActions: function(member) {
        return `
            <div class="member-actions">
                <button class="member-role-btn" data-member-id="${member.id}">🎭 Роль</button>
                <button class="member-remove-btn" data-member-id="${member.id}">✕</button>
            </div>
        `;
    },

    renderAddMember: function() {
        return `
            <div class="add-member">
                <button class="add-member-btn" id="add-member">+ Добавить участника</button>
            </div>
        `;
    },

    /**
     * Бюджет
     */
    renderBudget: function() {
        return `
            <div class="budget-section">
                <div class="budget-header">
                    <h3>💰 Семейный бюджет</h3>
                    <span class="budget-total">${MORI_UTILS.formatLargeNumber(this.state.budget.total)} MORI</span>
                </div>

                <div class="budget-summary">
                    <div class="budget-card income">
                        <div class="budget-label">Доходы</div>
                        <div class="budget-value income">+${MORI_UTILS.formatLargeNumber(this.state.budget.income)}</div>
                    </div>
                    <div class="budget-card expense">
                        <div class="budget-label">Расходы</div>
                        <div class="budget-value expense">-${MORI_UTILS.formatLargeNumber(this.state.budget.expenses)}</div>
                    </div>
                </div>

                <div class="budget-actions">
                    <button class="budget-btn income" id="add-income">+ Доход</button>
                    <button class="budget-btn expense" id="add-expense">- Расход</button>
                </div>

                <div class="budget-history">
                    <h4>История</h4>
                    ${this.renderBudgetHistory()}
                </div>
            </div>
        `;
    },

    renderBudgetHistory: function() {
        if (this.state.budget.history.length === 0) {
            return '<div class="empty-history">Нет операций</div>';
        }

        return this.state.budget.history.map(item => `
            <div class="history-item">
                <div class="history-left">
                    <div class="history-icon ${item.type}">${item.type === 'income' ? '💰' : '💸'}</div>
                    <div class="history-info">
                        <div class="history-title">${item.title}</div>
                        <div class="history-date">${MORI_UTILS.formatDate(item.timestamp, 'short')}</div>
                    </div>
                </div>
                <div class="history-right">
                    <div class="history-amount ${item.type}">${item.type === 'income' ? '+' : '-'}${MORI_UTILS.formatLargeNumber(item.amount)}</div>
                    <div class="history-by">${item.userName}</div>
                </div>
            </div>
        `).join('');
    },

    /**
     * Календарь
     */
    renderCalendar: function() {
        const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                           'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
        const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

        const year = this.state.calendar.year;
        const month = this.state.calendar.month;

        return `
            <div class="calendar-section">
                <div class="calendar-header">
                    <h3>📅 Календарь</h3>
                    <div class="calendar-nav">
                        <button class="calendar-nav-btn" id="prev-month">◀</button>
                        <span>${monthNames[month]} ${year}</span>
                        <button class="calendar-nav-btn" id="next-month">▶</button>
                    </div>
                </div>

                <div class="calendar-weekdays">
                    ${weekDays.map(day => `<div>${day}</div>`).join('')}
                </div>

                <div class="calendar-grid">
                    ${this.renderCalendarDays()}
                </div>

                <div class="events-list">
                    <h4>События</h4>
                    ${this.renderEvents()}
                </div>

                <button class="add-event-btn" id="add-event">+ Добавить событие</button>
            </div>
        `;
    },

    renderCalendarDays: function() {
        const year = this.state.calendar.year;
        const month = this.state.calendar.month;

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startOffset = firstDay === 0 ? 6 : firstDay - 1;

        const days = [];

        for (let i = 0; i < startOffset; i++) {
            days.push('<div class="calendar-day empty"></div>');
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const hasEvent = this.hasEventOnDay(year, month, d);
            const isToday = this.isToday(year, month, d);
            const classes = ['calendar-day'];
            if (hasEvent) classes.push('has-event');
            if (isToday) classes.push('today');

            days.push(`
                <div class="${classes.join(' ')}" data-day="${d}">
                    ${d}
                    ${hasEvent ? '<span class="event-indicator"></span>' : ''}
                </div>
            `);
        }

        return days.join('');
    },

    renderEvents: function() {
        const monthEvents = this.state.calendar.events.filter(event => {
            const date = new Date(event.date);
            return date.getMonth() === this.state.calendar.month &&
                   date.getFullYear() === this.state.calendar.year;
        });

        if (monthEvents.length === 0) {
            return '<div class="empty-events">Нет событий</div>';
        }

        return monthEvents.map(event => `
            <div class="event-item" data-event-id="${event.id}">
                <div class="event-date">${new Date(event.date).getDate()}</div>
                <div class="event-info">
                    <div class="event-title">${event.title}</div>
                    <div class="event-meta">
                        ${event.type === 'birthday' ? '🎂 День рождения' : '📅 Событие'} ·
                        ${MORI_UTILS.formatDate(event.date, 'time')}
                    </div>
                </div>
                <div class="event-actions">
                    <button class="event-btn delete" data-event-id="${event.id}">✕</button>
                </div>
            </div>
        `).join('');
    },

    /**
     * Напоминания
     */
    renderReminders: function() {
        return `
            <div class="reminders-section">
                <div class="reminders-header">
                    <h3>⏰ Напоминания</h3>
                    <button class="add-reminder-btn" id="add-reminder">+</button>
                </div>
                <div class="reminders-list">
                    ${this.renderRemindersList()}
                </div>
            </div>
        `;
    },

    renderRemindersList: function() {
        if (this.state.reminders.length === 0) {
            return '<div class="empty-reminders">Нет напоминаний</div>';
        }

        return this.state.reminders.map(reminder => {
            const daysLeft = this.getDaysUntil(reminder.date);
            const type = reminder.type || 'event';

            return `
                <div class="reminder-item ${type}" data-reminder-id="${reminder.id}">
                    <div class="reminder-icon">${type === 'birthday' ? '🎂' : type === 'event' ? '📅' : '📝'}</div>
                    <div class="reminder-content">
                        <div class="reminder-title">${reminder.title}</div>
                        <div class="reminder-time">
                            ${MORI_UTILS.formatDate(reminder.date, 'full')}
                            ${daysLeft > 0 ? `<span class="reminder-days">через ${daysLeft} дн.</span>` : ''}
                        </div>
                    </div>
                    <div class="reminder-actions">
                        <button class="reminder-done ${reminder.completed ? 'completed' : ''}" data-reminder-id="${reminder.id}">✓</button>
                        <button class="reminder-delete" data-reminder-id="${reminder.id}">✕</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderGames: function() {
        return `
            <div class="games-section">
                <div class="games-header"><h3>🎮 Игры</h3></div>
                <div class="games-grid">
                    <div class="game-card" id="play-durak">
                        <div class="game-icon">🃏</div>
                        <div class="game-name">Дурак</div>
                        <div class="game-players">2-9 игроков</div>
                        <button class="game-btn">Играть</button>
                    </div>
                </div>
            </div>
        `;
    },

    renderNoAccess: function() {
        return `
            <div class="empty-chat">
                <div class="empty-icon">🔒</div>
                <h3>Только для семьи</h3>
                <p>Вступите в семью, чтобы открыть доступ</p>
            </div>
        `;
    },

    canManageMembers: function() {
        return this.user?.id === this.state.headId;
    },

    attachEvents: function() {
        document.querySelectorAll('.family-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.setState({ activeTab: e.target.dataset.tab });
            });
        });

        document.getElementById('add-member')?.addEventListener('click', () => this.showAddMemberModal());
        document.querySelectorAll('.member-role-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.showRoleModal(parseInt(e.target.dataset.memberId)));
        });
        document.querySelectorAll('.member-remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.removeMember(parseInt(e.target.dataset.memberId)));
        });
        document.getElementById('add-income')?.addEventListener('click', () => this.showAddTransactionModal('income'));
        document.getElementById('add-expense')?.addEventListener('click', () => this.showAddTransactionModal('expense'));
        document.getElementById('prev-month')?.addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('next-month')?.addEventListener('click', () => this.changeMonth(1));
        document.getElementById('add-event')?.addEventListener('click', () => this.showAddEventModal());
        document.getElementById('add-reminder')?.addEventListener('click', () => this.showAddReminderModal());
        document.querySelectorAll('.reminder-done').forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleReminder(parseInt(e.target.dataset.reminderId)));
        });
        document.querySelectorAll('.reminder-delete').forEach(btn => {
            btn.addEventListener('click', (e) => this.deleteReminder(parseInt(e.target.dataset.reminderId)));
        });
        document.querySelectorAll('.event-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => this.deleteEvent(parseInt(e.target.dataset.eventId)));
        });
        document.getElementById('play-durak')?.addEventListener('click', () => this.playDurak());
    },

    showAddMemberModal: function() {
        const nickname = prompt('Введите никнейм нового участника:');
        if (!nickname) return;
        const avatar = prompt('Выберите аватар (👤, 🦊, 🐱, 🐼, 🐧):', '👤');
        this.addMember(nickname, avatar || '👤');
    },

    showRoleModal: function(memberId) {
        const role = prompt('Введите название роли:');
        if (!role) return;
        this.assignRole(memberId, role);
    },

    showAddTransactionModal: function(type) {
        const title = prompt(`Название ${type === 'income' ? 'дохода' : 'расхода'}:`);
        if (!title) return;
        const amount = parseFloat(prompt('Сумма в MORI:'));
        if (isNaN(amount) || amount <= 0) return;
        this.addTransaction(type, title, amount);
    },

    showAddEventModal: function() {
        const title = prompt('Название события:');
        if (!title) return;
        const date = prompt('Дата (ГГГГ-ММ-ДД):');
        if (!date) return;
        const type = prompt('Тип (event/birthday):', 'event');
        this.addEvent(title, date, type);
    },

    showAddReminderModal: function() {
        const title = prompt('Напоминание:');
        if (!title) return;
        const date = prompt('Дата (ГГГГ-ММ-ДД):');
        if (!date) return;
        const type = prompt('Тип (event/birthday/task):', 'task');
        this.addReminder(title, date, type);
    },

    addMember: function(nickname, avatar) {
        if (!this.canManageMembers()) {
            MORI_APP.showToast('Только глава семьи может добавлять участников', 'error');
            return;
        }
        this.state.members.push({ id: Date.now(), nickname, avatar, role: null, joinedAt: new Date().toISOString() });
        this.saveMembers();
        this.render();
        MORI_APP.showToast(`Участник ${nickname} добавлен`, 'success');
    },

    assignRole: function(memberId, role) {
        if (!this.canManageMembers()) {
            MORI_APP.showToast('Только глава семьи может назначать роли', 'error');
            return;
        }
        const member = this.state.members.find(m => m.id === memberId);
        if (member) {
            member.role = role;
            this.saveMembers();
            this.render();
            MORI_APP.showToast(`Роль "${role}" назначена`, 'success');
        }
    },

    removeMember: function(memberId) {
        if (!this.canManageMembers()) {
            MORI_APP.showToast('Только глава семьи может удалять участников', 'error');
            return;
        }
        if (memberId === this.state.headId) {
            MORI_APP.showToast('Нельзя удалить главу семьи', 'error');
            return;
        }
        if (!confirm('Удалить участника из семьи?')) return;
        this.state.members = this.state.members.filter(m => m.id !== memberId);
        this.saveMembers();
        this.render();
        MORI_APP.showToast('Участник удалён', 'info');
    },

    addTransaction: function(type, title, amount) {
        const transaction = { id: Date.now(), type, title, amount, timestamp: Date.now(), userName: this.user?.nickname || 'Пользователь' };
        this.state.budget.history.unshift(transaction);
        if (type === 'income') {
            this.state.budget.income += amount;
            this.state.budget.total += amount;
        } else {
            this.state.budget.expenses += amount;
            this.state.budget.total -= amount;
        }
        this.saveBudget();
        this.render();
        MORI_APP.showToast(`${type === 'income' ? 'Доход' : 'Расход'} добавлен`, 'success');
    },

    addEvent: function(title, date, type = 'event') {
        this.state.calendar.events.push({ id: Date.now(), title, date, type });
        this.saveCalendar();
        this.render();
        MORI_APP.showToast('Событие добавлено', 'success');
    },

    addReminder: function(title, date, type = 'task') {
        this.state.reminders.push({ id: Date.now(), title, date, type, completed: false });
        this.saveReminders();
        this.render();
        MORI_APP.showToast('Напоминание добавлено', 'success');
    },

    toggleReminder: function(id) {
        const reminder = this.state.reminders.find(r => r.id === id);
        if (reminder) {
            reminder.completed = !reminder.completed;
            this.saveReminders();
            this.render();
        }
    },

    deleteReminder: function(id) {
        this.state.reminders = this.state.reminders.filter(r => r.id !== id);
        this.saveReminders();
        this.render();
        MORI_APP.showToast('Напоминание удалено', 'info');
    },

    deleteEvent: function(id) {
        this.state.calendar.events = this.state.calendar.events.filter(e => e.id !== id);
        this.saveCalendar();
        this.render();
        MORI_APP.showToast('Событие удалено', 'info');
    },

    changeMonth: function(delta) {
        let newMonth = this.state.calendar.month + delta;
        let newYear = this.state.calendar.year;
        if (newMonth < 0) { newMonth = 11; newYear--; }
        else if (newMonth > 11) { newMonth = 0; newYear++; }
        this.setState({ calendar: { ...this.state.calendar, month: newMonth, year: newYear } });
        this.loadCalendar();
    },

    playDurak: function() {
        MORI_APP.showToast('🃏 Игра в дурака скоро будет!', 'info');
    },

    isMemberOnline: function(memberId) {
        const member = this.state.members.find(m => m.id === memberId);
        if (!member || !member.lastSeen) return false;
        const diff = (Date.now() - new Date(member.lastSeen)) / 1000 / 60;
        return diff < 5;
    },

    hasEventOnDay: function(year, month, day) {
        return this.state.calendar.events.some(event => {
            const date = new Date(event.date);
            return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
        });
    },

    isToday: function(year, month, day) {
        const today = new Date();
        return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
    },

    getDaysUntil: function(date) {
        const target = new Date(date);
        const today = new Date();
        target.setHours(0,0,0,0);
        today.setHours(0,0,0,0);
        return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    },

    loadMembers: async function() {
        try {
            const members = await MORI_API.getFamilyMembers();
            if (members && members.length) {
                this.state.members = members;
                const head = members.find(m => m.isHead);
                if (head) this.state.headId = head.id;
            } else {
                this.state.members = [];
                this.state.headId = null;
            }
        } catch (error) {
            console.error('Error loading family members:', error);
            this.state.members = [];
            this.state.headId = null;
        }
    },

    loadBudget: async function() {
        try {
            const budget = await MORI_API.getFamilyBudget();
            if (budget && budget.budget) {
                this.state.budget = budget.budget;
            } else {
                this.state.budget = { total: 0, income: 0, expenses: 0, history: [] };
            }
        } catch (error) {
            console.error('Error loading budget:', error);
            this.state.budget = { total: 0, income: 0, expenses: 0, history: [] };
        }
    },

    loadCalendar: async function() {
        try {
            const events = await MORI_API.getFamilyCalendar(this.state.calendar.year, this.state.calendar.month + 1);
            if (events && events.events) {
                this.state.calendar.events = events.events;
            } else {
                this.state.calendar.events = [];
            }
        } catch (error) {
            console.error('Error loading calendar:', error);
            this.state.calendar.events = [];
        }
    },

    loadReminders: async function() {
        try {
            const reminders = await MORI_API.getReminders();
            if (reminders && reminders.reminders) {
                this.state.reminders = reminders.reminders;
            } else {
                this.state.reminders = [];
            }
        } catch (error) {
            console.error('Error loading reminders:', error);
            this.state.reminders = [];
        }
    },

    saveMembers: function() {
        localStorage.setItem('family_members', JSON.stringify({ members: this.state.members, headId: this.state.headId }));
    },

    saveBudget: function() {
        localStorage.setItem('family_budget', JSON.stringify(this.state.budget));
    },

    saveReminders: function() {
        localStorage.setItem('family_reminders', JSON.stringify(this.state.reminders));
    },

    saveCalendar: function() {
        localStorage.setItem('family_calendar', JSON.stringify(this.state.calendar.events));
    },

    loadState: function() {
        try {
            const savedMembers = localStorage.getItem('family_members');
            if (savedMembers) {
                const data = JSON.parse(savedMembers);
                this.state.members = data.members || [];
                this.state.headId = data.headId || null;
            }
            const savedBudget = localStorage.getItem('family_budget');
            if (savedBudget) this.state.budget = JSON.parse(savedBudget);
            const savedReminders = localStorage.getItem('family_reminders');
            if (savedReminders) this.state.reminders = JSON.parse(savedReminders);
            const savedCalendar = localStorage.getItem('family_calendar');
            if (savedCalendar) this.state.calendar.events = JSON.parse(savedCalendar);
        } catch (error) {
            console.error('Error loading family state:', error);
        }
    },

    setState: function(newState) {
        this.state = { ...this.state, ...newState };
        this.render();
    }
};

window.MORI_FAMILY = MORI_FAMILY;
