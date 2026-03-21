/**
 * CHAT SEARCH
 * Поиск по истории чата
 * Версия: 1.0.0
 */

const MORI_CHAT_SEARCH = {
    // Текущий поиск
    current: {
        query: '',
        results: [],
        index: -1
    },

    // История поиска
    history: [],

    // Настройки
    options: {
        caseSensitive: false,
        wholeWord: false,
        maxResults: 100
    },

    /**
     * Поиск по чату
     */
    search: function(chatId, query, options = {}) {
        this.current.query = query;
        this.current.results = [];
        this.current.index = -1;

        if (!query) return [];

        const messages = MORI_CHAT_MESSAGES.getAll(chatId);
        const searchOptions = { ...this.options, ...options };

        const results = [];
        
        messages.forEach((msg, index) => {
            let text = msg.text;
            let searchTerm = query;

            if (!searchOptions.caseSensitive) {
                text = text.toLowerCase();
                searchTerm = searchTerm.toLowerCase();
            }

            if (searchOptions.wholeWord) {
                const regex = new RegExp(`\\b${searchTerm}\\b`);
                if (regex.test(text)) {
                    results.push({
                        messageId: msg.id,
                        index: index,
                        text: msg.text,
                        userId: msg.userId,
                        timestamp: msg.timestamp,
                        matches: this.findMatches(msg.text, query, searchOptions)
                    });
                }
            } else {
                if (text.includes(searchTerm)) {
                    results.push({
                        messageId: msg.id,
                        index: index,
                        text: msg.text,
                        userId: msg.userId,
                        timestamp: msg.timestamp,
                        matches: this.findMatches(msg.text, query, searchOptions)
                    });
                }
            }
        });

        // Ограничиваем количество результатов
        this.current.results = results.slice(0, searchOptions.maxResults);
        
        if (this.current.results.length > 0) {
            this.current.index = 0;
        }

        // Сохраняем в историю
        this.addToHistory(query);

        return this.current.results;
    },

    /**
     * Поиск совпадений в тексте
     */
    findMatches: function(text, query, options) {
        const matches = [];
        let searchText = text;
        let searchQuery = query;

        if (!options.caseSensitive) {
            searchText = searchText.toLowerCase();
            searchQuery = searchQuery.toLowerCase();
        }

        let pos = 0;
        while (true) {
            const index = searchText.indexOf(searchQuery, pos);
            if (index === -1) break;
            
            matches.push({
                start: index,
                end: index + searchQuery.length
            });
            
            pos = index + 1;
        }

        return matches;
    },

    /**
     * Переход к следующему результату
     */
    next: function() {
        if (this.current.results.length === 0) return null;
        
        this.current.index = (this.current.index + 1) % this.current.results.length;
        return this.current.results[this.current.index];
    },

    /**
     * Переход к предыдущему результату
     */
    prev: function() {
        if (this.current.results.length === 0) return null;
        
        this.current.index = this.current.index - 1;
        if (this.current.index < 0) {
            this.current.index = this.current.results.length - 1;
        }
        return this.current.results[this.current.index];
    },

    /**
     * Получение текущего результата
     */
    getCurrent: function() {
        if (this.current.index === -1) return null;
        return this.current.results[this.current.index];
    },

    /**
     * Подсветка текста
     */
    highlightText: function(text, query) {
        if (!query) return text;

        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark class="search-highlight">$1</mark>');
    },

    /**
     * Фильтрация по дате
     */
    filterByDate: function(chatId, startDate, endDate) {
        const messages = MORI_CHAT_MESSAGES.getAll(chatId);
        
        return messages.filter(msg => {
            return msg.timestamp >= startDate && msg.timestamp <= endDate;
        });
    },

    /**
     * Фильтрация по пользователю
     */
    filterByUser: function(chatId, userId) {
        const messages = MORI_CHAT_MESSAGES.getAll(chatId);
        return messages.filter(msg => msg.userId === userId);
    },

    /**
     * Фильтрация по типу (текст, изображения, голосовые)
     */
    filterByType: function(chatId, type) {
        const messages = MORI_CHAT_MESSAGES.getAll(chatId);
        
        return messages.filter(msg => {
            switch(type) {
                case 'text':
                    return !!msg.text && !msg.image && !msg.voice;
                case 'image':
                    return !!msg.image;
                case 'voice':
                    return !!msg.voice;
                default:
                    return true;
            }
        });
    },

    /**
     * Добавление в историю поиска
     */
    addToHistory: function(query) {
        if (!query) return;

        // Убираем дубликаты
        this.history = this.history.filter(q => q !== query);
        
        // Добавляем в начало
        this.history.unshift(query);
        
        // Ограничиваем историю 20 запросами
        if (this.history.length > 20) {
            this.history = this.history.slice(0, 20);
        }

        this.saveHistory();
    },

    /**
     * Получение истории поиска
     */
    getHistory: function() {
        return this.history;
    },

    /**
     * Очистка истории
     */
    clearHistory: function() {
        this.history = [];
        this.saveHistory();
    },

    /**
     * Сохранение истории
     */
    saveHistory: function() {
        try {
            localStorage.setItem('chat_search_history', JSON.stringify(this.history));
        } catch (error) {
            console.error('Error saving search history:', error);
        }
    },

    /**
     * Загрузка истории
     */
    loadHistory: function() {
        try {
            const saved = localStorage.getItem('chat_search_history');
            if (saved) {
                this.history = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading search history:', error);
        }
    },

    /**
     * Сброс поиска
     */
    reset: function() {
        this.current = {
            query: '',
            results: [],
            index: -1
        };
    },

    /**
     * Получение статистики поиска
     */
    getStats: function() {
        return {
            totalResults: this.current.results.length,
            currentIndex: this.current.index + 1,
            query: this.current.query,
            historyCount: this.history.length
        };
    },

    /**
     * Экспорт результатов
     */
    exportResults: function() {
        if (this.current.results.length === 0) return;

        const data = {
            query: this.current.query,
            timestamp: Date.now(),
            results: this.current.results.map(r => ({
                messageId: r.messageId,
                text: r.text,
                userId: r.userId,
                timestamp: r.timestamp
            }))
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `search_${this.current.query}_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }
};

// Загрузка истории при старте
MORI_CHAT_SEARCH.loadHistory();

// Экспорт
window.MORI_CHAT_SEARCH = MORI_CHAT_SEARCH;
