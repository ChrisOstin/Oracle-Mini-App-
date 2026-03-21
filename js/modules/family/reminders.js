/**
 * FAMILY REMINDERS
 * Система семейных напоминаний
 * Версия: 1.0.0
 */

const MORI_FAMILY_REMINDERS = {
    // Состояние
    state: {
        reminders: [],
        archived: [],
        categories: ['🎂 ДР', '📅 Событие', '📝 Задача', '🛒 Покупки', '🏠 Дом', '💼 Работа', '⚕️ Здоровье'],
        settings: {
            notifyBefore: 24, // часов до события
            defaultCategory: '📝 Задача',
            autoArchive: true // архивировать выполненные через 7 дней
        }
    },

    /**
     * Инициализация
     */
    init: function() {
        console.log('MORI_FAMILY_REMINDERS инициализация...');
        this.loadState();
        this.checkReminders();
        
        // Проверяем каждую минуту
        setInterval(() => this.checkReminders(), 60000);
    },

     /**
 * Загрузка состояния
 */
loadState: async function() {
    try {
        // Пробуем загрузить с сервера
        const reminders = await MORI_API.getReminders();
        if (reminders && reminders.reminders) {
            this.state.reminders = reminders.reminders;
            localStorage.setItem('family_reminders', JSON.stringify(this.state));
            return;
        }
    } catch (error) {
        console.log('Сервер недоступен, используем локальный кэш');
    }

    // Если сервер не ответил, пробуем localStorage
    try {
        const saved = localStorage.getItem('family_reminders');
        if (saved) {
            this.state = { ...this.state, ...JSON.parse(saved) };
        } else {
            // Пустые напоминания, без тестовых данных!
            this.state.reminders = [];
            this.state.archived = [];
        }
    } catch (error) {
        console.error('Error loading reminders:', error);
        this.state.reminders = [];
        this.state.archived = [];
    }
},

    /**
     * Сохранение состояния
     */
    saveState: function() {
        try {
            localStorage.setItem('family_reminders', JSON.stringify(this.state));
        } catch (error) {
            console.error('Error saving reminders:', error);
        }
    },

    /**
     * Добавить напоминание
     */
    addReminder: function(data) {
        const reminder = {
            id: Date.now(),
            createdAt: Date.now(),
            createdBy: MORI_USER.current?.id,
            completed: false,
            notified: false,
            ...data
        };

        this.state.reminders.push(reminder);
        this.saveState();
        
        MORI_APP.showToast('Напоминание добавлено', 'success');
        return reminder;
    },

    /**
     * Редактировать напоминание
     */
    editReminder: function(id, updates) {
        const reminder = this.state.reminders.find(r => r.id === id);
        
        if (reminder && (reminder.createdBy === MORI_USER.current?.id || this.canManageAll())) {
            Object.assign(reminder, updates, { updatedAt: Date.now() });
            this.saveState();
            MORI_APP.showToast('Напоминание обновлено', 'success');
            return true;
        }
        
        MORI_APP.showToast('Нет прав для редактирования', 'error');
        return false;
    },

    /**
     * Удалить напоминание
     */
    removeReminder: function(id) {
        const reminder = this.state.reminders.find(r => r.id === id);
        
        if (reminder && (reminder.createdBy === MORI_USER.current?.id || this.canManageAll())) {
            this.state.reminders = this.state.reminders.filter(r => r.id !== id);
            this.saveState();
            MORI_APP.showToast('Напоминание удалено', 'info');
            return true;
        }
        
        MORI_APP.showToast('Нет прав для удаления', 'error');
        return false;
    },

    /**
     * Отметить как выполненное
     */
    completeReminder: function(id) {
        const reminder = this.state.reminders.find(r => r.id === id);
        
        if (reminder) {
            reminder.completed = true;
            reminder.completedAt = Date.now();
            reminder.completedBy = MORI_USER.current?.id;
            this.saveState();
            
            MORI_APP.showToast(`✅ ${reminder.title} — выполнено!`, 'success');
            
            // Проверяем, нужно ли архивировать
            if (this.state.settings.autoArchive) {
                setTimeout(() => this.archiveReminder(id), 7000);
            }
            
            return true;
        }
        return false;
    },

    /**
     * Архивировать напоминание
     */
    archiveReminder: function(id) {
        const reminder = this.state.reminders.find(r => r.id === id);
        if (reminder && reminder.completed) {
            this.state.reminders = this.state.reminders.filter(r => r.id !== id);
            this.state.archived.push({ ...reminder, archivedAt: Date.now() });
            this.saveState();
        }
    },

    /**
     * Получить активные напоминания
     */
    getActiveReminders: function() {
        return this.state.reminders
            .filter(r => !r.completed)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    },

    /**
     * Получить напоминания для пользователя
     */
    getRemindersForUser: function(userId) {
        return this.state.reminders
            .filter(r => !r.completed && (r.assignedTo?.includes(userId) || !r.assignedTo))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    },

    /**
     * Получить просроченные напоминания
     */
    getOverdueReminders: function() {
        const now = new Date();
        
        return this.state.reminders
            .filter(r => !r.completed && new Date(r.date) < now)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    },

    /**
     * Получить напоминания на сегодня
     */
    getTodayReminders: function() {
        const today = new Date().toISOString().split('T')[0];
        
        return this.state.reminders
            .filter(r => !r.completed && r.date === today)
            .sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
    },

    /**
     * Проверить напоминания (для уведомлений)
     */
    checkReminders: function() {
        const now = new Date();
        const notifyHours = this.state.settings.notifyBefore;
        
        this.state.reminders.forEach(reminder => {
            if (reminder.completed || reminder.notified) return;
            
            const reminderDate = new Date(`${reminder.date}T${reminder.time || '00:00'}`);
            const diffHours = (reminderDate - now) / (1000 * 60 * 60);
            
            // Уведомление за указанное количество часов
            if (diffHours > 0 && diffHours <= notifyHours) {
                this.sendNotification(reminder);
                reminder.notified = true;
                this.saveState();
            }
        });
    },

    /**
     * Отправить уведомление
     */
    sendNotification: function(reminder) {
        // Показываем всплывающее уведомление
        MORI_APP.showToast(
            `⏰ Напоминание: ${reminder.title}`,
            'info',
            10000
        );

        // TODO: добавить push-уведомления
    },

    /**
     * Проверка прав на управление всеми
     */
    canManageAll: function() {
        return MORI_FAMILY?.state?.headId === MORI_USER.current?.id;
    },

    /**
     * Получить цвет для приоритета
     */
    getPriorityColor: function(priority) {
        const colors = {
            high: '#ff4444',
            medium: '#ffaa00',
            low: '#00ff88'
        };
        return colors[priority] || '#888888';
    },

    /**
     * Рендер списка напоминаний
     */
    renderReminders: function() {
        const activeReminders = this.getActiveReminders();
        const overdueReminders = this.getOverdueReminders();
        const todayReminders = this.getTodayReminders();
        
        return `
            <div class="reminders-container">
                ${overdueReminders.length > 0 ? `
                    <div class="reminders-section overdue">
                        <h4>⚠️ Просроченные</h4>
                        ${this.renderReminderList(overdueReminders)}
                    </div>
                ` : ''}

                ${todayReminders.length > 0 ? `
                    <div class="reminders-section today">
                        <h4>📅 Сегодня</h4>
                        ${this.renderReminderList(todayReminders)}
                    </div>
                ` : ''}

                <div class="reminders-section upcoming">
                    <h4>📋 Предстоящие</h4>
                    ${this.renderReminderList(activeReminders.filter(r => !r.notified))}
                </div>
            </div>
        `;
    },

    /**
     * Рендер списка напоминаний
     */
    renderReminderList: function(reminders) {
        if (reminders.length === 0) {
            return '<div class="empty-list">Нет напоминаний</div>';
        }

        return reminders.map(reminder => {
            const isAssigned = !reminder.assignedTo || 
                reminder.assignedTo.includes(MORI_USER.current?.id);
            
            return `
                <div class="reminder-card priority-${reminder.priority}" 
                     data-reminder-id="${reminder.id}"
                     style="border-left-color: ${this.getPriorityColor(reminder.priority)}">
                    
                    <div class="reminder-header">
                        <span class="reminder-category">${reminder.category}</span>
                        <span class="reminder-date">${reminder.date} ${reminder.time || ''}</span>
                    </div>
                    
                    <div class="reminder-title">${reminder.title}</div>
                    
                    ${reminder.description ? `
                        <div class="reminder-description">${reminder.description}</div>
                    ` : ''}
                    
                    <div class="reminder-footer">
                        <div class="reminder-assignees">
                            ${this.renderAssignees(reminder.assignedTo)}
                        </div>
                        
                        <div class="reminder-actions">
                            ${isAssigned ? `
                                <button class="reminder-complete" data-id="${reminder.id}">✅</button>
                            ` : ''}
                            
                            ${(reminder.createdBy === MORI_USER.current?.id || this.canManageAll()) ? `
                                <button class="reminder-edit" data-id="${reminder.id}">✎</button>
                                <button class="reminder-delete" data-id="${reminder.id}">✕</button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * Рендер назначенных
     */
    renderAssignees: function(assignedTo) {
        if (!assignedTo || assignedTo.length === 0) {
            return '<span class="assignee-all">👥 Все</span>';
        }

        return assignedTo.map(userId => {
            const user = MORI_FAMILY?.state?.members?.find(m => m.id === userId);
            return `<span class="assignee" title="${user?.nickname || 'Пользователь'}">${user?.avatar || '👤'}</span>`;
        }).join('');
    },

    /**
     * Экспорт напоминаний
     */
    exportReminders: function() {
        const data = {
            exportDate: Date.now(),
            reminders: this.state.reminders,
            archived: this.state.archived,
            settings: this.state.settings
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `reminders_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    },

    /**
     * Импорт напоминаний
     */
    importReminders: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (data.reminders) {
                        this.state.reminders = data.reminders;
                        if (data.archived) this.state.archived = data.archived;
                        if (data.settings) this.state.settings = data.settings;
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
     * Получить статистику
     */
    getStats: function() {
        const total = this.state.reminders.length;
        const completed = this.state.reminders.filter(r => r.completed).length;
        const active = total - completed;
        const overdue = this.getOverdueReminders().length;
        const today = this.getTodayReminders().length;

        return {
            total,
            completed,
            active,
            overdue,
            today,
            archivedCount: this.state.archived.length
        };
    },

    /**
     * Очистка выполненных (для админа)
     */
    clearCompleted: function() {
        if (!this.canManageAll()) {
            MORI_APP.showToast('Только глава семьи может очищать', 'error');
            return;
        }

        this.state.reminders = this.state.reminders.filter(r => !r.completed);
        this.saveState();
        MORI_APP.showToast('Выполненные напоминания очищены', 'info');
    }
};

// Экспорт
window.MORI_FAMILY_REMINDERS = MORI_FAMILY_REMINDERS;
