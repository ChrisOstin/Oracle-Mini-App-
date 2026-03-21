/**
 * MORI AI MESSAGES
 * Управление сообщениями в чате
 * Версия: 1.0.0
 */

const MORI_AI_MESSAGES = {
    // Максимальное количество сообщений в истории
    maxMessages: 100,

    // Сообщения текущего диалога
    currentDialog: [],

    // Кэш сообщений
    cache: new Map(),

    /**
     * Добавление сообщения
     */
    add: function(role, content, options = {}) {
        const message = {
            id: this.generateId(),
            role: role, // 'user' или 'bot'
            content: content,
            timestamp: Date.now(),
            model: options.model || 'deepseek',
            tokens: options.tokens || 0,
            processingTime: options.processingTime || 0
        };

        this.currentDialog.push(message);

        // Ограничиваем длину диалога
        if (this.currentDialog.length > this.maxMessages) {
            this.currentDialog = this.currentDialog.slice(-this.maxMessages);
        }

        return message;
    },

    /**
     * Получение всех сообщений текущего диалога
     */
    getAll: function() {
        return [...this.currentDialog];
    },

    /**
     * Получение последнего сообщения
     */
    getLast: function() {
        return this.currentDialog[this.currentDialog.length - 1];
    },

    /**
     * Получение сообщения по ID
     */
    getById: function(id) {
        return this.currentDialog.find(msg => msg.id === id);
    },

    /**
     * Удаление сообщения
     */
    remove: function(id) {
        const index = this.currentDialog.findIndex(msg => msg.id === id);
        if (index !== -1) {
            this.currentDialog.splice(index, 1);
            return true;
        }
        return false;
    },

    /**
     * Редактирование сообщения
     */
    edit: function(id, newContent) {
        const message = this.getById(id);
        if (message) {
            message.content = newContent;
            message.edited = true;
            message.editedAt = Date.now();
            return true;
        }
        return false;
    },

    /**
     * Очистка текущего диалога
     */
    clear: function() {
        this.currentDialog = [];
    },

    /**
     * Сохранение диалога в localStorage
     */
    saveDialog: function(dialogId) {
        try {
            const dialog = {
                id: dialogId,
                messages: this.currentDialog,
                savedAt: Date.now()
            };
            
            const saved = localStorage.getItem('ai_saved_dialogs') || '{}';
            const dialogs = JSON.parse(saved);
            dialogs[dialogId] = dialog;
            
            localStorage.setItem('ai_saved_dialogs', JSON.stringify(dialogs));
            return true;
        } catch (error) {
            console.error('Error saving dialog:', error);
            return false;
        }
    },

    /**
     * Загрузка диалога из localStorage
     */
    loadDialog: function(dialogId) {
        try {
            const saved = localStorage.getItem('ai_saved_dialogs') || '{}';
            const dialogs = JSON.parse(saved);
            const dialog = dialogs[dialogId];
            
            if (dialog) {
                this.currentDialog = dialog.messages;
                return true;
            }
        } catch (error) {
            console.error('Error loading dialog:', error);
        }
        return false;
    },

    /**
     * Удаление сохранённого диалога
     */
    deleteDialog: function(dialogId) {
        try {
            const saved = localStorage.getItem('ai_saved_dialogs') || '{}';
            const dialogs = JSON.parse(saved);
            delete dialogs[dialogId];
            localStorage.setItem('ai_saved_dialogs', JSON.stringify(dialogs));
            return true;
        } catch (error) {
            console.error('Error deleting dialog:', error);
            return false;
        }
    },

    /**
     * Получение статистики по сообщениям
     */
    getStats: function() {
        const stats = {
            total: this.currentDialog.length,
            userMessages: 0,
            botMessages: 0,
            totalTokens: 0,
            totalProcessingTime: 0,
            averageResponseTime: 0,
            byModel: {}
        };

        this.currentDialog.forEach(msg => {
            if (msg.role === 'user') {
                stats.userMessages++;
            } else {
                stats.botMessages++;
                stats.totalTokens += msg.tokens || 0;
                stats.totalProcessingTime += msg.processingTime || 0;
                
                if (!stats.byModel[msg.model]) {
                    stats.byModel[msg.model] = 0;
                }
                stats.byModel[msg.model]++;
            }
        });

        if (stats.botMessages > 0) {
            stats.averageResponseTime = stats.totalProcessingTime / stats.botMessages;
        }

        return stats;
    },

    /**
     * Поиск по сообщениям
     */
    search: function(query) {
        const searchTerm = query.toLowerCase();
        return this.currentDialog.filter(msg => 
            msg.content.toLowerCase().includes(searchTerm)
        );
    },

    /**
     * Экспорт диалога
     */
    exportDialog: function(format = 'txt') {
        const dialog = this.currentDialog.map(msg => {
            const role = msg.role === 'user' ? '👤' : '🧠';
            const time = new Date(msg.timestamp).toLocaleString('ru-RU');
            return `${role} [${time}]\n${msg.content}\n`;
        }).join('\n---\n\n');

        if (format === 'txt') {
            const blob = new Blob([dialog], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dialog_${Date.now()}.txt`;
            a.click();
            URL.revokeObjectURL(url);
        } else if (format === 'json') {
            const data = {
                exportDate: Date.now(),
                messages: this.currentDialog
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dialog_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    },

    /**
     * Импорт диалога
     */
    importDialog: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (data.messages && Array.isArray(data.messages)) {
                        this.currentDialog = data.messages;
                        resolve(data.messages.length);
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
     * Форматирование сообщения для отображения
     */
    formatForDisplay: function(message) {
        // Экранируем HTML
        let formatted = MORI_UTILS.escapeHtml(message.content);
        
        // Заменяем переносы строк
        formatted = formatted.replace(/\n/g, '<br>');
        
        // Подсветка кода (```code```)
        formatted = formatted.replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>');
        
        // Подсветка инлайн-кода (`code`)
        formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');
        
        // Жирный текст (**text**)
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Курсив (*text*)
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Списки
        formatted = formatted.replace(/^\s*[-*]\s+(.*?)$/gm, '<li>$1</li>');
        
        return formatted;
    },

    /**
     * Получение контекста для AI (последние N сообщений)
     */
    getContext: function(limit = 10) {
        return this.currentDialog.slice(-limit).map(msg => ({
            role: msg.role,
            content: msg.content
        }));
    },

    /**
     * Проверка на пустой диалог
     */
    isEmpty: function() {
        return this.currentDialog.length === 0;
    },

    /**
     * Подсчёт токенов (приблизительно)
     */
    countTokens: function(text) {
        // Простая эвристика: 1 токен ≈ 4 символа для английского,
        // для русского может быть меньше
        return Math.ceil(text.length / 2);
    },

    /**
     * Генерация ID
     */
    generateId: function() {
        return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
};

// Экспорт
window.MORI_AI_MESSAGES = MORI_AI_MESSAGES;
