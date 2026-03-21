/**
 * MORI AI CHAT MODULE
 * Чат с нейросетью (DeepSeek + локальная модель)
 * Версия: 1.0.0
 */

const MORI_AI_CHAT = {
    // Состояние
    state: {
        messages: [],
        currentModel: 'deepseek', // 'deepseek' или 'local'
        isLoading: false,
        isRecording: false,
        isTyping: false,
        sidebarOpen: false,
        inputText: ''
    },

    // Доступные модели
    models: {
        deepseek: {
            name: 'DeepSeek',
            icon: '🧠',
            description: 'Быстрая, точная, требует интернета',
            maxTokens: 4096
        },
        local: {
            name: 'Локальная',
            icon: '📱',
            description: 'Медленнее, работает офлайн',
            maxTokens: 1024
        }
    },

    // История диалогов
    conversations: [],

    /**
     * Инициализация модуля
     */
    init: async function() {
        console.log('MORI_AI_CHAT инициализация...');
        await this.loadHistory();
        this.addWelcomeMessage();
    },

    /**
     * Рендер модуля
     */
    render: function() {
        const content = document.getElementById('ai-chat-content');
        if (!content) return;

        content.innerHTML = this.getHTML();
        this.attachEvents();
        this.scrollToBottom();
    },

    /**
     * HTML шаблон
     */
    getHTML: function() {
        return `
            <div class="ai-chat-screen">
                <!-- Шапка -->
                <div class="ai-chat-header">
                    <h2>
                        🧠 MORI AI 
                        <span>${this.models[this.state.currentModel].icon}</span>
                    </h2>
                    <select class="ai-model-selector" id="model-selector">
                        <option value="deepseek" ${this.state.currentModel === 'deepseek' ? 'selected' : ''}>
                            DeepSeek (быстрая)
                        </option>
                        <option value="local" ${this.state.currentModel === 'local' ? 'selected' : ''}>
                            Локальная (офлайн)
                        </option>
                    </select>
                </div>

                <!-- Контейнер сообщений -->
                <div class="messages-container" id="messages-container">
                    ${this.renderMessages()}
                </div>

                <!-- Поле ввода -->
                <div class="input-container">
                    <div class="input-wrapper">
                        <textarea 
                            class="message-input" 
                            id="message-input"
                            placeholder="Спроси MORI AI..."
                            rows="1"
                        >${this.state.inputText}</textarea>
                        
                        <div class="input-actions">
                            <button class="input-btn ${this.state.isRecording ? 'record recording' : 'record'}" 
                                    id="voice-btn" 
                                    title="Голосовой ввод">
                                🎤
                            </button>
                            <button class="input-btn" id="history-btn" title="История">
                                📋
                            </button>
                        </div>
                        
                        <button class="send-btn" id="send-btn" 
                                ${this.state.isLoading ? 'disabled' : ''}>
                            📤
                        </button>
                    </div>
                    
                    <!-- Индикатор модели -->
                    <div class="context-indicator">
                        <span>${this.models[this.state.currentModel].icon}</span>
                        ${this.models[this.state.currentModel].description}
                    </div>
                </div>

                <!-- Боковая панель истории -->
                <div class="sidebar ${this.state.sidebarOpen ? 'open' : ''}" id="history-sidebar">
                    <div class="sidebar-header">
                        <h3>📋 История диалогов</h3>
                        <button class="sidebar-close" id="close-sidebar">✕</button>
                    </div>
                    <div class="sidebar-content" id="history-content">
                        ${this.renderHistory()}
                    </div>
                </div>

                <!-- Кнопка открытия истории (когда закрыта) -->
                ${!this.state.sidebarOpen ? `
                    <button class="history-toggle" id="open-sidebar">
                        📋
                    </button>
                ` : ''}
            </div>
        `;
    },

    /**
     * Рендер сообщений
     */
    renderMessages: function() {
        if (this.state.messages.length === 0) {
            return `
                <div class="empty-chat">
                    <div class="empty-chat-icon">🧠</div>
                    <h3>Чат с MORI AI</h3>
                    <p>Задай любой вопрос о крипте, финансах или просто поболтай</p>
                </div>
            `;
        }

        return this.state.messages.map(msg => `
            <div class="message ${msg.role}">
                <div class="message-avatar">
                    ${msg.role === 'user' ? '👤' : '🧠'}
                </div>
                <div class="message-content">
                    ${this.formatMessage(msg.content)}
                    <div class="message-time">${MORI_UTILS.timeAgo(msg.timestamp)}</div>
                </div>
            </div>
        `).join('') + (this.state.isTyping ? this.renderTyping() : '');
    },

    /**
     * Рендер индикатора печатания
     */
    renderTyping: function() {
        return `
            <div class="message bot">
                <div class="message-avatar">🧠</div>
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
    },

    /**
     * Рендер истории
     */
    renderHistory: function() {
        if (this.conversations.length === 0) {
            return '<div class="empty-chat">История пуста</div>';
        }

        return this.conversations.map(conv => `
            <div class="history-item" data-id="${conv.id}">
                <div class="history-preview">${conv.preview}</div>
                <div class="history-date">${MORI_UTILS.formatDate(conv.timestamp, 'short')}</div>
                <button class="history-delete" data-id="${conv.id}">🗑️</button>
            </div>
        `).join('');
    },

    /**
     * Навешивание обработчиков
     */
    attachEvents: function() {
        // Выбор модели
        document.getElementById('model-selector').addEventListener('change', (e) => {
            this.setState({ currentModel: e.target.value });
        });

        // Отправка сообщения
        document.getElementById('send-btn').addEventListener('click', () => {
            this.sendMessage();
        });

        // Ввод текста (Enter для отправки, Shift+Enter для новой строки)
        const input = document.getElementById('message-input');
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        input.addEventListener('input', (e) => {
            this.setState({ inputText: e.target.value });
            this.autoResizeTextarea(e.target);
        });

        // Голосовой ввод
        document.getElementById('voice-btn').addEventListener('click', () => {
            this.toggleVoiceRecording();
        });

        // Открытие/закрытие истории
        document.getElementById('open-sidebar')?.addEventListener('click', () => {
            this.setState({ sidebarOpen: true });
        });

        document.getElementById('close-sidebar').addEventListener('click', () => {
            this.setState({ sidebarOpen: false });
        });

        // Клик по элементу истории
        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('history-delete')) {
                    const id = item.dataset.id;
                    this.loadConversation(id);
                }
            });
        });

        // Удаление из истории
        document.querySelectorAll('.history-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = e.target.dataset.id;
                this.deleteConversation(id);
            });
        });
    },

    /**
     * Отправка сообщения
     */
    sendMessage: async function() {
        const input = document.getElementById('message-input');
        const text = input.value.trim();

        if (!text || this.state.isLoading) return;

        // Добавляем сообщение пользователя
        this.addMessage('user', text);
        
        // Очищаем поле ввода
        input.value = '';
        this.setState({ inputText: '', isTyping: true });
        this.autoResizeTextarea(input);

        try {
            // Получаем ответ от AI
            const response = await this.getAIResponse(text);
            
            // Добавляем ответ AI
            this.addMessage('bot', response);
            
            // Сохраняем диалог в историю
            this.saveConversation(text, response);

        } catch (error) {
            console.error('AI Error:', error);
            this.addMessage('bot', '❌ Ошибка соединения. Попробуй ещё раз.');
        }

        this.setState({ isTyping: false });
    },

    /**
 * Получение ответа от AI
 */
getAIResponse: async function(query) {
    try {
        if (this.state.currentModel === 'deepseek') {
            // Реальный DeepSeek API
            const response = await MORI_API.getAIResponse?.({
                query: query,
                model: 'deepseek'
            });

            if (response && response.answer) {
                return response.answer;
            }
        } else {
            // Локальная модель (через бэкенд)
            const response = await MORI_API.getAIResponse?.({
                query: query,
                model: 'local'
            });

            if (response && response.answer) {
                return response.answer;
            }
        }

        // Если API не ответил
        throw new Error('No response from AI');

    } catch (error) {
        console.error('AI Error:', error);
        throw error; // Пробрасываем дальше для обработки в sendMessage
    }
},

    /**
     * Добавление сообщения
     */
    addMessage: function(role, content) {
        const message = {
            id: MORI_UTILS.generateId('msg_'),
            role: role,
            content: content,
            timestamp: Date.now()
        };

        this.state.messages.push(message);
        this.render();
        this.scrollToBottom();
    },

    /**
     * Добавление приветственного сообщения
     */
    addWelcomeMessage: function() {
        if (this.state.messages.length === 0) {
            this.addMessage('bot', 
                'Привет! Я MORI AI — твой персональный помощник.\n\n' +
                'Я могу:\n' +
                '• Отвечать на вопросы о криптовалютах\n' +
                '• Помогать с финансами\n' +
                '• Объяснять сложные термины\n' +
                '• Просто болтать\n\n' +
                'Чем могу помочь?'
            );
        }
    },

    /**
     * Форматирование сообщения (простой маркдаун)
     */
    formatMessage: function(text) {
        // Экранируем HTML
        let formatted = MORI_UTILS.escapeHtml(text);
        
        // Заменяем переносы строк на <br>
        formatted = formatted.replace(/\n/g, '<br>');
        
        // Простой маркдаун для жирного текста
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Курсив
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        return formatted;
    },

    /**
     * Сохранение диалога в историю
     */
    saveConversation: function(userMessage, botMessage) {
        const conversation = {
            id: MORI_UTILS.generateId('conv_'),
            preview: userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : ''),
            userMessage: userMessage,
            botMessage: botMessage,
            timestamp: Date.now(),
            model: this.state.currentModel
        };

        this.conversations.unshift(conversation);
        
        // Ограничиваем историю 50 диалогами
        if (this.conversations.length > 50) {
            this.conversations = this.conversations.slice(0, 50);
        }

        this.saveHistory();
    },

    /**
     * Загрузка диалога из истории
     */
    loadConversation: function(id) {
        const conv = this.conversations.find(c => c.id === id);
        if (!conv) return;

        // Очищаем текущие сообщения
        this.state.messages = [];

        // Добавляем сохранённый диалог
        this.addMessage('user', conv.userMessage);
        this.addMessage('bot', conv.botMessage);

        // Закрываем историю
        this.setState({ sidebarOpen: false });
    },

    /**
     * Удаление диалога из истории
     */
    deleteConversation: function(id) {
        this.conversations = this.conversations.filter(c => c.id !== id);
        this.saveHistory();
        this.render();
    },

    /**
     * Загрузка истории
     */
    loadHistory: function() {
        try {
            const saved = localStorage.getItem('ai_chat_history');
            if (saved) {
                this.conversations = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading history:', error);
        }
    },

    /**
     * Сохранение истории
     */
    saveHistory: function() {
        try {
            localStorage.setItem('ai_chat_history', JSON.stringify(this.conversations));
        } catch (error) {
            console.error('Error saving history:', error);
        }
    },

    /**
     * Голосовой ввод
     */
    toggleVoiceRecording: function() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            MORI_APP.showToast('Голосовой ввод не поддерживается', 'error');
            return;
        }

        if (this.state.isRecording) {
            this.stopVoiceRecording();
        } else {
            this.startVoiceRecording();
        }
    },

    /**
     * Старт записи голоса
     */
    startVoiceRecording: function() {
        this.setState({ isRecording: true });
        
        // Здесь будет реальная запись голоса
        // Пока просто имитация
        setTimeout(() => {
            this.setState({ isRecording: false });
            document.getElementById('message-input').value = 'Это тестовый голосовой ввод';
            this.autoResizeTextarea(document.getElementById('message-input'));
        }, 3000);
    },

    /**
     * Остановка записи
     */
    stopVoiceRecording: function() {
        this.setState({ isRecording: false });
    },

    /**
     * Автоизменение размера textarea
     */
    autoResizeTextarea: function(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight) + 'px';
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
     * Обновление состояния
     */
    setState: function(newState) {
        this.state = { ...this.state, ...newState };
        this.render();
    },

    /**
     * Очистка при выходе
     */
    destroy: function() {
        this.saveHistory();
    }
};

// Экспорт
window.MORI_AI_CHAT = MORI_AI_CHAT;
