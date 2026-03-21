/**
 * LIBRARY WISHLIST
 * Управление вишлистом книг
 * Версия: 1.0.0
 */

const MORI_LIBRARY_WISHLIST = {
    // Список желаемых книг
    items: [],

    // Максимальное количество книг в вишлисте
    maxItems: 50,

    /**
     * Загрузка вишлиста
     */
    load: function() {
        try {
            const saved = localStorage.getItem('library_wishlist');
            if (saved) {
                this.items = JSON.parse(saved);
                console.log(`Загружено ${this.items.length} книг в вишлисте`);
            }
        } catch (error) {
            console.error('Ошибка загрузки вишлиста:', error);
            this.items = [];
        }
        return this.items;
    },

    /**
     * Сохранение вишлиста
     */
    save: function() {
        try {
            localStorage.setItem('library_wishlist', JSON.stringify(this.items));
            return true;
        } catch (error) {
            console.error('Ошибка сохранения вишлиста:', error);
            return false;
        }
    },

    /**
     * Добавление книги в вишлист
     */
    add: function(bookId, note = '') {
        // Проверка лимита
        if (this.items.length >= this.maxItems) {
            MORI_APP.showToast(`Максимум ${this.maxItems} книг в вишлисте`, 'error');
            return false;
        }

        // Проверка, есть ли уже
        if (this.has(bookId)) {
            MORI_APP.showToast('Книга уже в вишлисте', 'info');
            return false;
        }

        const book = MORI_LIBRARY_BOOKS.getById(bookId);
        if (!book) {
            MORI_APP.showToast('Книга не найдена', 'error');
            return false;
        }

        const wishlistItem = {
            id: this.generateId(),
            bookId: bookId,
            title: book.title,
            author: book.author,
            cover: book.cover,
            note: note,
            addedAt: Date.now(),
            priority: 3, // 1-5, где 5 - самый высокий
            tags: []
        };

        this.items.push(wishlistItem);
        this.save();

        MORI_APP.showToast(`"${book.title}" добавлена в вишлист`, 'success');
        return wishlistItem;
    },

    /**
     * Удаление из вишлиста
     */
    remove: function(itemId) {
        const index = this.items.findIndex(item => item.id === itemId);
        if (index !== -1) {
            const item = this.items[index];
            this.items.splice(index, 1);
            this.save();
            MORI_APP.showToast(`"${item.title}" удалена из вишлиста`, 'info');
            return true;
        }
        return false;
    },

    /**
     * Удаление по ID книги
     */
    removeByBookId: function(bookId) {
        const removed = this.items.filter(item => item.bookId === bookId);
        this.items = this.items.filter(item => item.bookId !== bookId);
        if (removed.length > 0) {
            this.save();
            MORI_APP.showToast(`Книга удалена из вишлиста`, 'info');
        }
        return removed.length;
    },

    /**
     * Проверка, есть ли книга в вишлисте
     */
    has: function(bookId) {
        return this.items.some(item => item.bookId === bookId);
    },

    /**
     * Получение всех книг в вишлисте
     */
    getAll: function() {
        return [...this.items].sort((a, b) => {
            // Сначала по приоритету, потом по дате
            if (a.priority !== b.priority) {
                return b.priority - a.priority;
            }
            return b.addedAt - a.addedAt;
        });
    },

    /**
     * Получение книг с определённым приоритетом
     */
    getByPriority: function(priority) {
        return this.items.filter(item => item.priority === priority)
            .sort((a, b) => b.addedAt - a.addedAt);
    },

    /**
     * Изменение приоритета
     */
    setPriority: function(itemId, priority) {
        const item = this.items.find(i => i.id === itemId);
        if (item) {
            item.priority = Math.min(5, Math.max(1, priority));
            this.save();
            return true;
        }
        return false;
    },

    /**
     * Добавление заметки к книге
     */
    addNote: function(itemId, note) {
        const item = this.items.find(i => i.id === itemId);
        if (item) {
            item.note = note;
            this.save();
            return true;
        }
        return false;
    },

    /**
     * Добавление тега к книге
     */
    addTag: function(itemId, tag) {
        const item = this.items.find(i => i.id === itemId);
        if (item && !item.tags.includes(tag)) {
            item.tags.push(tag);
            this.save();
            return true;
        }
        return false;
    },

    /**
     * Удаление тега
     */
    removeTag: function(itemId, tag) {
        const item = this.items.find(i => i.id === itemId);
        if (item) {
            item.tags = item.tags.filter(t => t !== tag);
            this.save();
            return true;
        }
        return false;
    },

    /**
     * Получение статистики по вишлисту
     */
    getStats: function() {
        if (this.items.length === 0) {
            return {
                total: 0,
                byPriority: {},
                byAuthor: {},
                oldest: null,
                newest: null
            };
        }

        const stats = {
            total: this.items.length,
            byPriority: {
                1: 0, 2: 0, 3: 0, 4: 0, 5: 0
            },
            byAuthor: {},
            oldest: Math.min(...this.items.map(i => i.addedAt)),
            newest: Math.max(...this.items.map(i => i.addedAt))
        };

        this.items.forEach(item => {
            // По приоритетам
            stats.byPriority[item.priority]++;

            // По авторам
            stats.byAuthor[item.author] = (stats.byAuthor[item.author] || 0) + 1;
        });

        return stats;
    },

    /**
     * Поиск по вишлисту
     */
    search: function(query) {
        const searchTerm = query.toLowerCase();
        return this.items.filter(item => 
            item.title.toLowerCase().includes(searchTerm) ||
            item.author.toLowerCase().includes(searchTerm) ||
            (item.note && item.note.toLowerCase().includes(searchTerm)) ||
            item.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    },

    /**
     * Очистка вишлиста
     */
    clear: function() {
        if (this.items.length > 0) {
            this.items = [];
            this.save();
            MORI_APP.showToast('Вишлист очищен', 'info');
        }
    },

    /**
     * Получение рекомендаций на основе вишлиста
     */
    getRecommendations: function() {
        if (this.items.length === 0) return [];

        // Собираем авторов из вишлиста
        const favoriteAuthors = {};
        this.items.forEach(item => {
            favoriteAuthors[item.author] = (favoriteAuthors[item.author] || 0) + 1;
        });

        // Находим топ-3 авторов
        const topAuthors = Object.entries(favoriteAuthors)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([author]) => author);

        // Ищем книги этих авторов, которых нет в вишлисте
        const recommendations = [];
        const wishlistBookIds = this.items.map(i => i.bookId);

        topAuthors.forEach(author => {
            const authorBooks = MORI_LIBRARY_BOOKS.getByAuthor(author)
                .filter(book => !wishlistBookIds.includes(book.id))
                .slice(0, 2);
            recommendations.push(...authorBooks);
        });

        return recommendations.slice(0, 5);
    },

    /**
     * Экспорт вишлиста
     */
    exportToJSON: function() {
        const data = {
            exportDate: Date.now(),
            version: '1.0',
            count: this.items.length,
            items: this.items
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `wishlist_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    },

    /**
     * Импорт вишлиста
     */
    importFromJSON: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (!data.items || !Array.isArray(data.items)) {
                        reject(new Error('Неверный формат файла'));
                        return;
                    }

                    // Добавляем новые элементы
                    data.items.forEach(item => {
                        if (!this.has(item.bookId) && this.items.length < this.maxItems) {
                            item.id = this.generateId();
                            this.items.push(item);
                        }
                    });

                    this.save();
                    resolve(data.items.length);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    },

    /**
     * Генерация ID
     */
    generateId: function() {
        return 'wl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
};

// Экспорт
window.MORI_LIBRARY_WISHLIST = MORI_LIBRARY_WISHLIST;
