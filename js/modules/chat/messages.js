/**
 * CHAT MESSAGES
 * Управление сообщениями в чате
 * Версия: 2.0.0 (БЕЗ ЗАГЛУШЕК)
 */

const MORI_CHAT_MESSAGES = {
    // Сообщения по чатам
    messages: {
        general: [],
        family: [],
        admin: []
    },

    // Максимальное количество сообщений в чате
    maxMessages: 1000,

    /**
     * Загрузка сообщений
     */
    load: function(chatId = 'general') {
        try {
            const saved = localStorage.getItem(`chat_${chatId}_messages`);
            if (saved) {
                this.messages[chatId] = JSON.parse(saved);
            } else {
                this.messages[chatId] = [];
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            this.messages[chatId] = [];
        }
        return this.messages[chatId];
    },

    /**
     * Сохранение сообщений
     */
    save: function(chatId = 'general') {
        try {
            // Ограничиваем количество
            if (this.messages[chatId].length > this.maxMessages) {
                this.messages[chatId] = this.messages[chatId].slice(-this.maxMessages);
            }
            localStorage.setItem(`chat_${chatId}_messages`, JSON.stringify(this.messages[chatId]));
        } catch (error) {
            console.error('Error saving messages:', error);
        }
    },

    /**
     * Добавление сообщения
     */
    add: function(chatId, message) {
        const newMessage = {
            id: this.generateId(),
            ...message,
            timestamp: Date.now(),
            reactions: {},
            reactionsUsers: {}
        };

        this.messages[chatId].push(newMessage);
        this.save(chatId);

        return newMessage;
    },

    /**
     * Удаление сообщения
     */
    remove: function(chatId, messageId) {
        const index = this.messages[chatId].findIndex(m => m.id === messageId);
        if (index !== -1) {
            this.messages[chatId].splice(index, 1);
            this.save(chatId);
            return true;
        }
        return false;
    },

    /**
     * Редактирование сообщения
     */
    edit: function(chatId, messageId, newText) {
        const message = this.getById(chatId, messageId);
        if (message) {
            message.text = newText;
            message.edited = true;
            message.editedAt = Date.now();
            this.save(chatId);
            return true;
        }
        return false;
    },

    /**
     * Добавление реакции
     */
    addReaction: function(chatId, messageId, reaction, userId) {
        const message = this.getById(chatId, messageId);
        if (!message) return false;

        if (!message.reactions) message.reactions = {};
        if (!message.reactionsUsers) message.reactionsUsers = {};

        const users = message.reactionsUsers[reaction] || [];

        if (!users.includes(userId)) {
            // Убираем старую реакцию этого пользователя (если была)
            for (const [oldReaction, oldUsers] of Object.entries(message.reactionsUsers)) {
                if (oldUsers.includes(userId)) {
                    message.reactions[oldReaction]--;
                    message.reactionsUsers[oldReaction] = oldUsers.filter(id => id !== userId);
                }
            }

            // Добавляем новую
            message.reactions[reaction] = (message.reactions[reaction] || 0) + 1;
            message.reactionsUsers[reaction] = [...users, userId];

            this.save(chatId);
            return true;
        }

        return false;
    },

    /**
     * Удаление реакции
     */
    removeReaction: function(chatId, messageId, reaction, userId) {
        const message = this.getById(chatId, messageId);
        if (!message) return false;

        const users = message.reactionsUsers?.[reaction] || [];

        if (users.includes(userId)) {
            message.reactions[reaction]--;
            message.reactionsUsers[reaction] = users.filter(id => id !== userId);

            if (message.reactions[reaction] <= 0) {
                delete message.reactions[reaction];
                delete message.reactionsUsers[reaction];
            }

            this.save(chatId);
            return true;
        }

        return false;
    },

    /**
     * Тоггл реакции
     */
    toggleReaction: function(chatId, messageId, reaction, userId) {
        const message = this.getById(chatId, messageId);
        if (!message) return false;

        const users = message.reactionsUsers?.[reaction] || [];

        if (users.includes(userId)) {
            return this.removeReaction(chatId, messageId, reaction, userId);
        } else {
            return this.addReaction(chatId, messageId, reaction, userId);
        }
    },

    /**
     * Получение сообщения по ID
     */
    getById: function(chatId, messageId) {
        return this.messages[chatId]?.find(m => m.id === messageId);
    },

    /**
     * Получение всех сообщений
     */
    getAll: function(chatId, limit = null) {
        const messages = [...(this.messages[chatId] || [])];
        return limit ? messages.slice(-limit) : messages;
    },

    /**
     * Получение сообщений по пользователю
     */
    getByUser: function(chatId, userId) {
        return this.messages[chatId]?.filter(m => m.userId === userId) || [];
    },

    /**
     * Поиск по сообщениям
     */
    search: function(chatId, query) {
        const searchTerm = query.toLowerCase();
        return this.messages[chatId]?.filter(msg =>
            msg.text.toLowerCase().includes(searchTerm)
        ) || [];
    },

    /**
     * Очистка чата
     */
    clear: function(chatId) {
        this.messages[chatId] = [];
        this.save(chatId);
    },

    /**
     * Получение статистики
     */
    getStats: function(chatId) {
        const messages = this.messages[chatId] || [];

        const stats = {
            total: messages.length,
            users: {},
            reactions: {},
            lastMessage: messages[messages.length - 1]?.timestamp || null
        };

        messages.forEach(msg => {
            // По пользователям
            stats.users[msg.userId] = (stats.users[msg.userId] || 0) + 1;

            // По реакциям
            if (msg.reactions) {
                Object.entries(msg.reactions).forEach(([reaction, count]) => {
                    stats.reactions[reaction] = (stats.reactions[reaction] || 0) + count;
                });
            }
        });

        return stats;
    },

    /**
     * Экспорт чата
     */
    export: function(chatId) {
        const messages = this.messages[chatId] || [];
        const chatName = chatId === 'general' ? 'общий' : chatId === 'family' ? 'семейный' : 'админский';

        const text = messages.map(msg => {
            const date = new Date(msg.timestamp).toLocaleString('ru-RU');
            return `[${date}] Пользователь ${msg.userId}: ${msg.text}`;
        }).join('\n\n');

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `chat_${chatName}_${new Date().toISOString().slice(0,10)}.txt`;
        a.click();

        URL.revokeObjectURL(url);
    },

    /**
     * Генерация ID
     */
    generateId: function() {
        return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
};

// Экспорт
window.MORI_CHAT_MESSAGES = MORI_CHAT_MESSAGES;
