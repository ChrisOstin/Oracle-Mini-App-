/**
 * FAMILY CALENDAR
 * Семейный календарь событий и дней рождений
 * Версия: 1.0.0
 */

const MORI_FAMILY_CALENDAR = {
    // Состояние
    state: {
        year: new Date().getFullYear(),
        month: new Date().getMonth(),
        events: [],
        birthdays: [],
        selectedDate: null,
        view: 'month' // 'month', 'week', 'day'
    },

    // Названия месяцев
    monthNames: [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ],

    // Названия дней недели
    weekDays: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],

    /**
     * Инициализация
     */
    init: function() {
        console.log('MORI_FAMILY_CALENDAR инициализация...');
        this.loadState();
        this.loadBirthdays();
    },

    /**
 * Загрузка состояния
 */
loadState: async function() {
    try {
        // Пробуем загрузить с сервера
        const calendar = await MORI_API.getFamilyCalendar(this.state.year, this.state.month + 1);
        if (calendar && calendar.events) {
            this.state.events = calendar.events;
            localStorage.setItem('family_calendar', JSON.stringify(this.state.events));
            return;
        }
    } catch (error) {
        console.log('Сервер недоступен, используем локальный кэш');
    }

    // Если сервер не ответил, пробуем localStorage
    try {
        const saved = localStorage.getItem('family_calendar');
        if (saved) {
            this.state.events = JSON.parse(saved);
        } else {
            this.state.events = [];
        }
    } catch (error) {
        console.error('Error loading calendar:', error);
        this.state.events = [];
    }
},

    /**
 * Загрузка дней рождений (из участников семьи)
 */
loadBirthdays: async function() {
    try {
        // Загружаем участников семьи
        const members = await MORI_API.getFamilyMembers();
        if (members && members.length) {
            // Извлекаем дни рождения (если есть)
            this.state.birthdays = members
                .filter(m => m.birthday)
                .map(m => ({
                    id: m.id,
                    name: m.nickname,
                    date: m.birthday, // формат "MM-DD"
                    avatar: m.avatar || '👤'
                }));
        } else {
            this.state.birthdays = [];
        }
    } catch (error) {
        console.error('Error loading birthdays:', error);
        this.state.birthdays = [];
    }
},
 
    /**
     * Сохранение состояния
     */
    saveState: function() {
        try {
            localStorage.setItem('family_calendar', JSON.stringify(this.state.events));
        } catch (error) {
            console.error('Error saving calendar:', error);
        }
    },

    /**
     * Получить дни в месяце
     */
    getDaysInMonth: function() {
        return new Date(this.state.year, this.state.month + 1, 0).getDate();
    },

    /**
     * Получить первый день месяца (0 = вс, 1 = пн)
     */
    getFirstDay: function() {
        const day = new Date(this.state.year, this.state.month, 1).getDay();
        return day === 0 ? 6 : day - 1; // Преобразуем в понедельник = 0
    },

    /**
     * Получить события на день
     */
    getEventsOnDay: function(day) {
        const dateStr = `${this.state.year}-${String(this.state.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        const dayEvents = this.state.events.filter(e => e.date === dateStr);
        const dayBirthdays = this.state.birthdays.filter(b => {
            const [month, dayNum] = b.date.split('-');
            return parseInt(month) === this.state.month + 1 && parseInt(dayNum) === day;
        });

        return {
            events: dayEvents,
            birthdays: dayBirthdays
        };
    },

    /**
     * Добавить событие
     */
    addEvent: function(eventData) {
        const newEvent = {
            id: Date.now(),
            ...eventData,
            createdBy: MORI_USER.current?.id,
            createdAt: Date.now()
        };

        this.state.events.push(newEvent);
        this.saveState();
        
        MORI_APP.showToast('Событие добавлено', 'success');
        return newEvent;
    },

    /**
     * Удалить событие
     */
    removeEvent: function(eventId) {
        const event = this.state.events.find(e => e.id === eventId);
        
        // Проверяем права (создатель или глава семьи)
        if (event && (event.createdBy === MORI_USER.current?.id || this.canManageAll())) {
            this.state.events = this.state.events.filter(e => e.id !== eventId);
            this.saveState();
            MORI_APP.showToast('Событие удалено', 'info');
            return true;
        }
        
        MORI_APP.showToast('Нет прав для удаления', 'error');
        return false;
    },

    /**
     * Редактировать событие
     */
    editEvent: function(eventId, updates) {
        const event = this.state.events.find(e => e.id === eventId);
        
        if (event && (event.createdBy === MORI_USER.current?.id || this.canManageAll())) {
            Object.assign(event, updates, { updatedAt: Date.now() });
            this.saveState();
            MORI_APP.showToast('Событие обновлено', 'success');
            return true;
        }
        
        MORI_APP.showToast('Нет прав для редактирования', 'error');
        return false;
    },

    /**
     * Проверка прав на управление всеми событиями (глава семьи)
     */
    canManageAll: function() {
        return MORI_FAMILY?.state?.headId === MORI_USER.current?.id;
    },

    /**
     * Перейти к следующему месяцу
     */
    nextMonth: function() {
        if (this.state.month === 11) {
            this.state.month = 0;
            this.state.year++;
        } else {
            this.state.month++;
        }
        this.render();
    },

    /**
     * Перейти к предыдущему месяцу
     */
    prevMonth: function() {
        if (this.state.month === 0) {
            this.state.month = 11;
            this.state.year--;
        } else {
            this.state.month--;
        }
        this.render();
    },

    /**
     * Перейти к сегодня
     */
    goToToday: function() {
        const today = new Date();
        this.state.year = today.getFullYear();
        this.state.month = today.getMonth();
        this.state.selectedDate = today.getDate();
        this.render();
    },

    /**
     * Рендер календаря
     */
    render: function() {
        const daysInMonth = this.getDaysInMonth();
        const firstDay = this.getFirstDay();
        
        let html = `
            <div class="calendar-container">
                <div class="calendar-header">
                    <button class="calendar-nav-btn" id="prev-month">◀</button>
                    <h3>${this.monthNames[this.state.month]} ${this.state.year}</h3>
                    <button class="calendar-nav-btn" id="next-month">▶</button>
                    <button class="calendar-today-btn" id="today-btn">Сегодня</button>
                </div>

                <div class="calendar-weekdays">
                    ${this.weekDays.map(day => `<div>${day}</div>`).join('')}
                </div>

                <div class="calendar-grid">
        `;

        // Пустые ячейки до начала месяца
        for (let i = 0; i < firstDay; i++) {
            html += '<div class="calendar-day empty"></div>';
        }

        // Дни месяца
        for (let day = 1; day <= daysInMonth; day++) {
            const { events, birthdays } = this.getEventsOnDay(day);
            const isToday = this.isToday(day);
            const isSelected = this.state.selectedDate === day;
            
            let dayClass = 'calendar-day';
            if (isToday) dayClass += ' today';
            if (isSelected) dayClass += ' selected';
            if (events.length > 0 || birthdays.length > 0) dayClass += ' has-events';

            html += `
                <div class="${dayClass}" data-day="${day}">
                    <span class="day-number">${day}</span>
                    ${birthdays.length > 0 ? '<span class="event-badge birthday">🎂</span>' : ''}
                    ${events.length > 0 ? '<span class="event-badge event">📅</span>' : ''}
                </div>
            `;
        }

        html += `
                </div>
            </div>

            <div class="events-panel">
                <h4>События</h4>
                ${this.renderEventsList()}
                <button class="add-event-btn" id="add-event">+ Добавить событие</button>
            </div>

            <div class="birthdays-panel">
                <h4>🎂 Дни рождения</h4>
                ${this.renderBirthdaysList()}
            </div>
        `;

        return html;
    },

    /**
     * Рендер списка событий
     */
    renderEventsList: function() {
        const upcomingEvents = this.getUpcomingEvents(10);
        
        if (upcomingEvents.length === 0) {
            return '<div class="empty-list">Нет предстоящих событий</div>';
        }

        return upcomingEvents.map(event => `
            <div class="event-item" data-event-id="${event.id}">
                <div class="event-date">
                    <span class="event-day">${new Date(event.date).getDate()}</span>
                    <span class="event-month">${this.monthNames[new Date(event.date).getMonth()].slice(0,3)}</span>
                </div>
                <div class="event-info">
                    <div class="event-title">${event.title}</div>
                    ${event.time ? `<div class="event-time">${event.time}</div>` : ''}
                    ${event.description ? `<div class="event-desc">${event.description}</div>` : ''}
                </div>
                <div class="event-actions">
                    <button class="event-edit" data-event-id="${event.id}">✎</button>
                    <button class="event-delete" data-event-id="${event.id}">✕</button>
                </div>
            </div>
        `).join('');
    },

    /**
     * Рендер списка дней рождений
     */
    renderBirthdaysList: function() {
        const upcomingBirthdays = this.getUpcomingBirthdays(5);
        
        if (upcomingBirthdays.length === 0) {
            return '<div class="empty-list">Нет ближайших дней рождений</div>';
        }

        return upcomingBirthdays.map(bd => {
            const daysUntil = this.getDaysUntilBirthday(bd.date);
            return `
                <div class="birthday-item">
                    <div class="birthday-avatar">${bd.avatar || '👤'}</div>
                    <div class="birthday-info">
                        <div class="birthday-name">${bd.name}</div>
                        <div class="birthday-date">${bd.date}</div>
                    </div>
                    <div class="birthday-days">
                        ${daysUntil === 0 ? '🎉 СЕГОДНЯ!' : `через ${daysUntil} дн.`}
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * Получить предстоящие события
     */
    getUpcomingEvents: function(limit = 10) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return this.state.events
            .filter(event => new Date(event.date) >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, limit);
    },

    /**
     * Получить ближайшие дни рождения
     */
    getUpcomingBirthdays: function(limit = 5) {
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentDay = today.getDate();

        return this.state.birthdays
            .map(bd => {
                const [month, day] = bd.date.split('-').map(Number);
                let daysUntil = this.getDaysUntilBirthday(bd.date);
                return { ...bd, month, day, daysUntil };
            })
            .filter(bd => bd.daysUntil >= 0)
            .sort((a, b) => a.daysUntil - b.daysUntil)
            .slice(0, limit);
    },

    /**
     * Получить дней до дня рождения
     */
    getDaysUntilBirthday: function(birthdayDate) {
        const today = new Date();
        const [bMonth, bDay] = birthdayDate.split('-').map(Number);
        
        let nextBirthday = new Date(today.getFullYear(), bMonth - 1, bDay);
        
        if (nextBirthday < today) {
            nextBirthday = new Date(today.getFullYear() + 1, bMonth - 1, bDay);
        }
        
        const diff = nextBirthday - today;
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    },

    /**
     * Проверка, сегодня ли
     */
    isToday: function(day) {
        const today = new Date();
        return today.getFullYear() === this.state.year &&
               today.getMonth() === this.state.month &&
               today.getDate() === day;
    },

    /**
     * Получить события на выбранную дату
     */
    getEventsOnSelectedDate: function() {
        if (!this.state.selectedDate) return [];
        
        const { events, birthdays } = this.getEventsOnDay(this.state.selectedDate);
        return [...birthdays.map(b => ({ ...b, type: 'birthday' })), ...events];
    },

    /**
     * Экспорт календаря
     */
    exportCalendar: function() {
        const data = {
            exportDate: Date.now(),
            events: this.state.events,
            birthdays: this.state.birthdays
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `calendar_${this.state.year}-${this.state.month + 1}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    },

    /**
     * Импорт календаря
     */
    importCalendar: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (data.events) {
                        this.state.events = data.events;
                        if (data.birthdays) this.state.birthdays = data.birthdays;
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
     * Обработчики событий
     */
    attachEvents: function() {
        document.getElementById('prev-month')?.addEventListener('click', () => {
            this.prevMonth();
        });

        document.getElementById('next-month')?.addEventListener('click', () => {
            this.nextMonth();
        });

        document.getElementById('today-btn')?.addEventListener('click', () => {
            this.goToToday();
        });

        document.querySelectorAll('.calendar-day:not(.empty)').forEach(day => {
            day.addEventListener('click', (e) => {
                const dayNum = parseInt(e.currentTarget.dataset.day);
                this.state.selectedDate = dayNum;
                this.render();
            });
        });

        document.getElementById('add-event')?.addEventListener('click', () => {
            this.showAddEventModal();
        });

        document.querySelectorAll('.event-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.eventId);
                if (confirm('Удалить событие?')) {
                    this.removeEvent(id);
                    this.render();
                }
            });
        });

        document.querySelectorAll('.event-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.eventId);
                this.showEditEventModal(id);
            });
        });
    },

    /**
     * Показать модалку добавления события
     */
    showAddEventModal: function() {
        // TODO: реализовать модалку
        MORI_APP.showToast('Добавление события скоро будет', 'info');
    },

    /**
     * Показать модалку редактирования
     */
    showEditEventModal: function(eventId) {
        // TODO: реализовать модалку
        MORI_APP.showToast('Редактирование скоро будет', 'info');
    }
};

// Экспорт
window.MORI_FAMILY_CALENDAR = MORI_FAMILY_CALENDAR;
