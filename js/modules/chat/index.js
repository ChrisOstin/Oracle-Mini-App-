/**
 * CHAT MODULE
 * Общий чат с сообщениями, реакциями, реплаями
 * Версия: 1.0.0
 */

const MORI_CHAT = {
    // Состояние
    state: {
        activeChat: 'general', // 'general', 'family', 'admin'
        messages: [],
        users: [],
        replyTo: null,
        swipedMessageId: null,
        isTyping: false,
        sidebarOpen: false,
        searchQuery: '',
        searchResults: [],
        searchIndex: -1
    },

    // Константы
    CHAT_TYPES: {
        general: { id: 'general', name: 'Общий чат', icon: '💬' },
        family: { id: 'family', name: 'Семейный чат', icon: '👨‍👩‍👧‍👦' },
        admin: { id: 'admin', name: 'Чат админов', icon: '👑' }
    },

    // Доступные реакции
    reactions: ['👍', '❤️', '😂', '😢', '🔥'],

    /**
     * Инициализация
     */
    init: function() {
        console.log('MORI_CHAT инициализация...');
        this.loadMessages();
        this.loadUsers();
    },

    /**
     * Рендер
     */
    render: function() {
        const content = document.getElementById('chat-content');
        if (!content) return;

        // Проверяем доступ к чатам
        if (!this.checkAccess()) {
            content.innerHTML = this.renderNoAccess();
            return;
        }

        content.innerHTML = this.getHTML();
        this.attachEvents();
        this.scrollToBottom();
    },

    /**
     * Проверка доступа
     */
    checkAccess: function() {
        const user = MORI_USER.current;
        if (!user) return false;

        // Общий чат доступен всем
        if (this.state.activeChat === 'general') return true;

        // Семейный чат
        if (this.state.activeChat === 'family') {
            return MORI_AUTH.isFamily();
        }

        // Админский чат
        if (this.state.activeChat === 'admin') {
            return MORI_AUTH.isAdmin();
        }

        return false;
    },

    /**
     * HTML
     */
    getHTML: function() {
        const chatInfo = this.CHAT_TYPES[this.state.activeChat];
        
        return `
            <div class="chat-screen">
                <!-- Шапка -->
                <div class="chat-header">
                    <h2>${chatInfo.icon} ${chatInfo.name}</h2>
                    <div class="chat-type">
                        ${this.renderChatButtons()}
                    </div>
                </div>

                <!-- Поиск (если активно) -->
                ${this.state.searchQuery ? this.renderSearch() : ''}

                <!-- Сообщения -->
                <div class="messages-container" id="messages-container"
                     @touchstart="handleTouchStart"
                     @touchmove="handleTouchMove"
                     @touchend="handleTouchEnd">
                    ${this.renderMessages()}
                </div>

                <!-- Поле ввода -->
                <div class="input-container">
                    <div class="input-wrapper">
                        <textarea 
                            class="message-input" 
                            id="message-input"
                            placeholder="Сообщение..."
                            rows="1"
                        ></textarea>
                        
                        <div class="input-actions">
                            <button class="input-btn" id="attach-btn" title="Прикрепить">📎</button>
                            <button class="input-btn" id="voice-btn" title="Голосовое">🎤</button>
                            <button class="input-btn" id="search-btn" title="Поиск">🔍</button>
                        </div>
                        
                        <button class="send-btn" id="send-btn">📤</button>
                    </div>
                </div>

                <!-- Поле ответа (выезжает при свайпе) -->
                <div class="reply-input-container ${this.state.replyTo ? 'active' : ''}" id="reply-container">
                    ${this.state.replyTo ? this.renderReplyPreview() : ''}
                    <div class="reply-input-wrapper">
                        <textarea 
                            class="reply-input" 
                            id="reply-input"
                            placeholder="Ответить..."
                            rows="1"
                        ></textarea>
                        <button class="reply-send" id="reply-send">📤</button>
                    </div>
                </div>

                <!-- Затемнение фона -->
                <div class="reply-overlay ${this.state.replyTo ? 'active' : ''}" id="reply-overlay"></div>

                <!-- Боковая панель (участники) -->
                <div class="sidebar ${this.state.sidebarOpen ? 'open' : ''}" id="users-sidebar">
                    <div class="sidebar-header">
                        <h3>👥 Участники</h3>
                        <button class="sidebar-close" id="close-sidebar">✕</button>
                    </div>
                    <div class="sidebar-content" id="users-list">
                        ${this.renderUsers()}
                    </div>
                </div>

                <!-- Кнопка открытия участников -->
                ${!this.state.sidebarOpen ? `
                    <button class="members-toggle" id="open-sidebar">
                        👥
                    </button>
                ` : ''}
            </div>
        `;
    },

    /**
     * Кнопки переключения чатов
     */
    renderChatButtons: function() {
        const buttons = [];
        
        // Общий чат (всегда)
        buttons.push(`
            <button class="chat-type-btn ${this.state.activeChat === 'general' ? 'active' : ''}" 
                    data-chat="general">
                💬
            </button>
        `);

        // Семейный чат (если есть доступ)
        if (MORI_AUTH.isFamily()) {
            buttons.push(`
                <button class="chat-type-btn ${this.state.activeChat === 'family' ? 'active' : ''}" 
                        data-chat="family">
                    👨‍👩‍👧‍👦
                </button>
            `);
        }

        // Админский чат (если есть доступ)
        if (MORI_AUTH.isAdmin()) {
            buttons.push(`
                <button class="chat-type-btn ${this.state.activeChat === 'admin' ? 'active' : ''}" 
                        data-chat="admin">
                    👑
                </button>
            `);
        }

        return buttons.join('');
    },

    /**
     * Рендер сообщений
     */
    renderMessages: function() {
        if (this.state.messages.length === 0) {
            return `
                <div class="empty-chat">
                    <div class="empty-icon">${this.CHAT_TYPES[this.state.activeChat].icon}</div>
                    <h3>${this.CHAT_TYPES[this.state.activeChat].name}</h3>
                    <p>Напишите первое сообщение</p>
                </div>
            `;
        }

        return this.state.messages.map(msg => this.renderMessage(msg)).join('');
    },

    /**
     * Рендер одного сообщения
     */
    renderMessage: function(msg) {
        const isOwn = msg.userId === MORI_USER.current?.id;
        const user = this.state.users.find(u => u.id === msg.userId) || {};
        
        return `
            <div class="message ${isOwn ? 'own' : ''} ${this.state.swipedMessageId === msg.id ? 'reply-mode' : ''}" 
                 data-message-id="${msg.id}"
                 data-touch-start="0"
                 data-swiping="false">
                
                <div class="message-avatar">${user.avatar || '👤'}</div>
                
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-author">${user.nickname || 'Пользователь'}</span>
                        <span class="message-time">${this.formatTime(msg.timestamp)}</span>
                    </div>
                    
                    ${msg.replyTo ? this.renderReplyQuote(msg.replyTo) : ''}
                    
                    <div class="message-text">${this.formatText(msg.text)}</div>
                    
                    ${msg.image ? `<img src="${msg.image}" class="message-image" alt="image">` : ''}
                    
                    ${msg.voice ? this.renderVoiceMessage(msg.voice) : ''}
                    
                    <div class="message-reactions" data-message-id="${msg.id}">
                        ${this.renderReactions(msg)}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Рендер цитаты
     */
    renderReplyQuote: function(replyTo) {
        const originalMsg = this.getMessageById(replyTo.id);
        const user = this.state.users.find(u => u.id === replyTo.userId) || {};
        
        return `
            <div class="message-reply" data-message-id="${replyTo.id}">
                <div class="reply-author">${user.nickname || 'Пользователь'}</div>
                <div class="reply-text">${originalMsg?.text || replyTo.text}</div>
            </div>
        `;
    },

    /**
     * Рендер реакций
     */
    renderReactions: function(msg) {
        if (!msg.reactions) return '';

        return this.reactions.map(reaction => {
            const count = msg.reactions[reaction] || 0;
            const hasUser = msg.reactionsUsers?.[reaction]?.includes(MORI_USER.current?.id);
            
            return count > 0 ? `
                <span class="reaction ${hasUser ? 'active' : ''}" data-reaction="${reaction}">
                    ${reaction} <span class="reaction-count">${count}</span>
                </span>
            ` : '';
        }).join('');
    },

    /**
     * Рендер голосового
     */
    renderVoiceMessage: function(voice) {
        return `
            <div class="voice-message" data-voice-id="${voice.id}">
                <button class="voice-play">▶️</button>
                <div class="voice-wave">
                    <div class="voice-progress" style="width: 0%"></div>
                </div>
                <span class="voice-time">${voice.duration}s</span>
            </div>
        `;
    },

    /**
     * Рендер предпросмотра ответа
     */
    renderReplyPreview: function() {
        const msg = this.state.replyTo;
        const user = this.state.users.find(u => u.id === msg.userId) || {};
        
        return `
            <div class="reply-preview">
                <div class="reply-preview-avatar">${user.avatar || '👤'}</div>
                <div class="reply-preview-content">
                    <div class="reply-preview-author">${user.nickname || 'Пользователь'}</div>
                    <div class="reply-preview-text">${msg.text}</div>
                </div>
                <button class="reply-preview-close" id="cancel-reply">✕</button>
            </div>
        `;
    },

    /**
     * Рендер поиска
     */
    renderSearch: function() {
        const total = this.state.searchResults.length;
        const current = this.state.searchIndex + 1;
        
        return `
            <div class="search-bar">
                <div class="search-wrapper">
                    <input type="text" 
                           class="search-input" 
                           id="search-input"
                           placeholder="Поиск по чату..."
                           value="${this.state.searchQuery}">
                    <div class="search-results">
                        ${total > 0 ? `${current}/${total}` : '0'}
                    </div>
                    <div class="search-nav">
                        <button class="search-nav-btn" id="search-prev" ${total === 0 ? 'disabled' : ''}>▲</button>
                        <button class="search-nav-btn" id="search-next" ${total === 0 ? 'disabled' : ''}>▼</button>
                        <button class="search-nav-btn" id="search-close">✕</button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Рендер пользователей
     */
    renderUsers: function() {
        return this.state.users.map(user => `
            <div class="user-item">
                <div class="user-avatar">${user.avatar || '👤'}</div>
                <div class="user-info">
                    <div class="user-name">${user.nickname || 'Пользователь'}</div>
                    <div class="user-status ${user.online ? 'online' : 'offline'}">
                        ${user.online ? 'в сети' : 'был(а) недавно'}
                    </div>
                </div>
                ${user.accessLevel === 'admin' ? '<span class="user-badge">Admin</span>' : ''}
                ${user.accessLevel === 'family' ? '<span class="user-badge">Family</span>' : ''}
            </div>
        `).join('');
    },

    /**
     * Нет доступа
     */
    renderNoAccess: function() {
        return `
            <div class="empty-chat">
                <div class="empty-icon">🔒</div>
                <h3>Нет доступа</h3>
                <p>У вас нет прав для просмотра этого чата</p>
            </div>
        `;
    },

    /**
     * Обработчики
     */
    attachEvents: function() {
        // Переключение чатов
        document.querySelectorAll('.chat-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const chat = e.target.dataset.chat;
                this.switchChat(chat);
            });
        });

        // Отправка сообщения
        document.getElementById('send-btn').addEventListener('click', () => {
            this.sendMessage();
        });

        // Ввод текста (Enter для отправки)
        const input = document.getElementById('message-input');
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Кнопки
        document.getElementById('attach-btn').addEventListener('click', () => {
            this.attachFile();
        });

        document.getElementById('voice-btn').addEventListener('click', () => {
            this.startVoice();
        });

        document.getElementById('search-btn').addEventListener('click', () => {
            this.toggleSearch();
        });

        // Участники
        document.getElementById('open-sidebar')?.addEventListener('click', () => {
            this.setState({ sidebarOpen: true });
        });

        document.getElementById('close-sidebar').addEventListener('click', () => {
            this.setState({ sidebarOpen: false });
        });

        // Реакции
        document.querySelectorAll('.reaction').forEach(el => {
            el.addEventListener('click', (e) => {
                const reaction = e.currentTarget.dataset.reaction;
                const messageId = e.currentTarget.closest('[data-message-id]').dataset.messageId;
                this.toggleReaction(messageId, reaction);
            });
        });

        // Поиск
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.search(e.target.value);
            });
        }

        document.getElementById('search-prev')?.addEventListener('click', () => {
            this.navigateSearch('prev');
        });

        document.getElementById('search-next')?.addEventListener('click', () => {
            this.navigateSearch('next');
        });

        document.getElementById('search-close')?.addEventListener('click', () => {
            this.setState({ searchQuery: '' });
        });

        // Ответ
        document.getElementById('cancel-reply')?.addEventListener('click', () => {
            this.cancelReply();
        });

        document.getElementById('reply-send')?.addEventListener('click', () => {
            this.sendReply();
        });

        document.getElementById('reply-overlay')?.addEventListener('click', () => {
            this.cancelReply();
        });

        // Свайпы для ответа
        this.setupSwipeListeners();
    },

    /**
     * Настройка свайпов
     */
    setupSwipeListeners: function() {
        const container = document.getElementById('messages-container');
        let touchStart = 0;
        let swipedMessage = null;

        container.addEventListener('touchstart', (e) => {
            const messageEl = e.target.closest('.message');
            if (!messageEl) return;

            touchStart = e.touches[0].clientX;
            messageEl.dataset.touchStart = touchStart;
            messageEl.dataset.swiping = 'false';
        });

        container.addEventListener('touchmove', (e) => {
            const messageEl = e.target.closest('.message');
            if (!messageEl || !messageEl.dataset.touchStart) return;

            const touchMove = e.touches[0].clientX;
            const diff = touchMove - parseFloat(messageEl.dataset.touchStart);

            if (diff < -30) { // Свайп влево
                e.preventDefault();
                messageEl.dataset.swiping = 'true';
                swipedMessage = messageEl;
                
                // Убираем предыдущий свайп
                document.querySelectorAll('.message.reply-mode').forEach(el => {
                    if (el !== messageEl) {
                        el.classList.remove('reply-mode');
                    }
                });
                
                messageEl.classList.add('reply-mode');
            }
        });

        container.addEventListener('touchend', (e) => {
            const messageEl = e.target.closest('.message');
            if (!messageEl) return;

            if (messageEl.dataset.swiping === 'true' && messageEl.classList.contains('reply-mode')) {
                // Открываем поле ответа
                const messageId = messageEl.dataset.messageId;
                this.startReply(messageId);
            }

            // Сбрасываем
            messageEl.classList.remove('reply-mode');
            delete messageEl.dataset.touchStart;
            delete messageEl.dataset.swiping;
        });
    },

    /**
     * Начать ответ
     */
    startReply: function(messageId) {
        const message = this.getMessageById(messageId);
        if (!message) return;

        this.setState({ 
            replyTo: message,
            swipedMessageId: null 
        });

        // Фокус на поле ввода
        setTimeout(() => {
            document.getElementById('reply-input')?.focus();
        }, 300);
    },

    /**
     * Отправить ответ
     */
    sendReply: function() {
        const input = document.getElementById('reply-input');
        const text = input.value.trim();
        
        if (!text || !this.state.replyTo) return;

        this.sendMessage(text, this.state.replyTo);
        this.cancelReply();
    },

    /**
     * Отменить ответ
     */
    cancelReply: function() {
        this.setState({ replyTo: null });
    },

    /**
     * Отправка сообщения
     */
    sendMessage: function(text, replyTo = null) {
        const input = document.getElementById('message-input');
        const messageText = text || input.value.trim();
        
        if (!messageText) return;

        const message = {
            id: this.generateId(),
            userId: MORI_USER.current.id,
            text: messageText,
            timestamp: Date.now(),
            replyTo: replyTo,
            reactions: {},
            reactionsUsers: {}
        };

        this.state.messages.push(message);
        this.saveMessages();
        
        input.value = '';
        this.render();
        this.scrollToBottom();

        // Обновляем статистику
        MORI_USER.updateStats('messages');
    },

    /**
     * Переключение чата
     */
    switchChat: function(chatId) {
        if (!this.CHAT_TYPES[chatId]) return;
        
        this.setState({ 
            activeChat: chatId,
            messages: [],
            searchQuery: '',
            replyTo: null
        });
        
        this.loadMessages();
        this.loadUsers();
    },

    /**
     * Тоггл реакции
     */
    toggleReaction: function(messageId, reaction) {
        const message = this.getMessageById(messageId);
        if (!message) return;

        if (!message.reactions) message.reactions = {};
        if (!message.reactionsUsers) message.reactionsUsers = {};

        const userId = MORI_USER.current.id;
        const users = message.reactionsUsers[reaction] || [];

        if (users.includes(userId)) {
            // Убираем реакцию
            message.reactions[reaction]--;
            message.reactionsUsers[reaction] = users.filter(id => id !== userId);
        } else {
            // Добавляем реакцию
            message.reactions[reaction] = (message.reactions[reaction] || 0) + 1;
            message.reactionsUsers[reaction] = [...users, userId];
        }

        this.saveMessages();
        this.render();
    },

    /**
     * Поиск
     */
    search: function(query) {
        if (!query) {
            this.setState({ searchQuery: '', searchResults: [], searchIndex: -1 });
            return;
        }

        const results = [];
        this.state.messages.forEach((msg, index) => {
            if (msg.text.toLowerCase().includes(query.toLowerCase())) {
                results.push({ index, id: msg.id });
            }
        });

        this.setState({ 
            searchQuery: query,
            searchResults: results,
            searchIndex: results.length > 0 ? 0 : -1
        });

        if (results.length > 0) {
            this.highlightMessage(results[0].id);
        }
    },

    /**
     * Навигация по поиску
     */
    navigateSearch: function(direction) {
        if (this.state.searchResults.length === 0) return;

        let newIndex = this.state.searchIndex;
        
        if (direction === 'next') {
            newIndex = (newIndex + 1) % this.state.searchResults.length;
        } else {
            newIndex = newIndex - 1;
            if (newIndex < 0) newIndex = this.state.searchResults.length - 1;
        }

        this.setState({ searchIndex: newIndex });
        this.highlightMessage(this.state.searchResults[newIndex].id);
    },

    /**
     * Подсветка сообщения
     */
    highlightMessage: function(messageId) {
        const element = document.querySelector(`[data-message-id="${messageId}"]`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.style.animation = 'highlight 1s ease';
            setTimeout(() => {
                element.style.animation = '';
            }, 1000);
        }
    },

    /**
     * Тоггл поиска
     */
    toggleSearch: function() {
        if (this.state.searchQuery) {
            this.setState({ searchQuery: '' });
        } else {
            this.setState({ searchQuery: ' ' }); // временно, чтобы показать поиск
            setTimeout(() => {
                document.getElementById('search-input')?.focus();
            }, 100);
        }
    },

    /**
     * Прикрепить файл
     */
    attachFile: function() {
        MORI_APP.showToast('Загрузка файлов скоро будет', 'info');
    },

    /**
     * Голосовое сообщение
     */
    startVoice: function() {
        MORI_APP.showToast('Голосовые сообщения скоро будут', 'info');
    },

    /**
     * Получить сообщение по ID
     */
    getMessageById: function(id) {
        return this.state.messages.find(m => m.id === id);
    },

    /**
     * Загрузка сообщений
     */
    loadMessages: function() {
        const saved = localStorage.getItem(`chat_${this.state.activeChat}_messages`);
        if (saved) {
            try {
                this.state.messages = JSON.parse(saved);
            } catch (e) {
                console.error('Error loading messages:', e);
            }
        }
    },

    /**
     * Сохранение сообщений
     */
    saveMessages: function() {
        localStorage.setItem(`chat_${this.state.activeChat}_messages`, 
            JSON.stringify(this.state.messages));
    },

    loadUsers: function() {
    MORI_API.getChatUsers()
        .then(users => {
            if (users && users.length) {
                this.state.users = users;
                this.render();
            } else {
                this.state.users = [];
            }
        })
        .catch(error => {
            console.error('Error loading users:', error);
            this.state.users = [];
        });
},

    /**
     * Форматирование времени
     */
    formatTime: function(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    },

    /**
     * Форматирование текста
     */
    formatText: function(text) {
        return text.replace(/\n/g, '<br>');
    },

    /**
     * Скролл вниз
     */
    scrollToBottom: function() {
        setTimeout(() => {
            const container = document.getElementById('messages-container');
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        }, 100);
    },

    /**
     * Генерация ID
     */
    generateId: function() {
        return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Обновление состояния
     */
    setState: function(newState) {
        this.state = { ...this.state, ...newState };
        this.render();
    }
};

// Экспорт
window.MORI_CHAT = MORI_CHAT;
