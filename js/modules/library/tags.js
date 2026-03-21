/**
 * LIBRARY TAGS
 * Управление метками для книг
 * Версия: 1.0.0
 */

const MORI_LIBRARY_TAGS = {
    // Доступные метки (системные)
    predefinedTags: [
        { id: 'favorite', name: '⭐ Любимое', color: '#ffd700' },
        { id: 'later', name: '📌 Отложенное', color: '#00aaff' },
        { id: 'important', name: '❗ Важное', color: '#ff4444' },
        { id: 'reading', name: '📖 Читаю', color: '#00ff88' },
        { id: 'reread', name: '🔄 Перечитать', color: '#aa80ff' },
        { id: 'reference', name: '📚 Справочник', color: '#ffaa00' },
        { id: 'gift', name: '🎁 Подарок', color: '#ff69b4' },
        { id: 'borrowed', name: '📤 Взял почитать', color: '#00cc99' }
    ],

    // Пользовательские метки
    customTags: [],

    // Метки на книгах (bookId -> [tagIds])
    bookTags: {},

    /**
     * Загрузка всех данных
     */
    load: function() {
        this.loadCustomTags();
        this.loadBookTags();
    },

    /**
     * Загрузка пользовательских меток
     */
    loadCustomTags: function() {
        try {
            const saved = localStorage.getItem('library_custom_tags');
            if (saved) {
                this.customTags = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading custom tags:', error);
        }
    },

    /**
     * Сохранение пользовательских меток
     */
    saveCustomTags: function() {
        try {
            localStorage.setItem('library_custom_tags', JSON.stringify(this.customTags));
        } catch (error) {
            console.error('Error saving custom tags:', error);
        }
    },

    /**
     * Загрузка меток на книгах
     */
    loadBookTags: function() {
        try {
            const saved = localStorage.getItem('library_book_tags');
            if (saved) {
                this.bookTags = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading book tags:', error);
        }
    },

    /**
     * Сохранение меток на книгах
     */
    saveBookTags: function() {
        try {
            localStorage.setItem('library_book_tags', JSON.stringify(this.bookTags));
        } catch (error) {
            console.error('Error saving book tags:', error);
        }
    },

    /**
     * Получение всех доступных меток (системные + пользовательские)
     */
    getAllTags: function() {
        return [...this.predefinedTags, ...this.customTags];
    },

    /**
     * Получение метки по ID
     */
    getTagById: function(tagId) {
        return this.getAllTags().find(tag => tag.id === tagId);
    },

    /**
     * Создание пользовательской метки
     */
    createCustomTag: function(name, color = '#00ff88') {
        // Проверка на дубликаты
        if (this.customTags.some(t => t.name === name)) {
            MORI_APP.showToast('Метка с таким названием уже есть', 'error');
            return null;
        }

        const newTag = {
            id: 'tag_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: name,
            color: color,
            createdAt: Date.now()
        };

        this.customTags.push(newTag);
        this.saveCustomTags();
        MORI_APP.showToast('Метка создана', 'success');
        return newTag;
    },

    /**
     * Удаление пользовательской метки
     */
    deleteCustomTag: function(tagId) {
        // Удаляем метку из списка
        this.customTags = this.customTags.filter(t => t.id !== tagId);

        // Удаляем метку со всех книг
        for (const bookId in this.bookTags) {
            this.bookTags[bookId] = this.bookTags[bookId].filter(id => id !== tagId);
        }

        this.saveCustomTags();
        this.saveBookTags();
        MORI_APP.showToast('Метка удалена', 'info');
    },

    /**
     * Добавление метки на книгу
     */
    addTagToBook: function(bookId, tagId) {
        // Проверяем, существует ли метка
        const tag = this.getTagById(tagId);
        if (!tag) {
            MORI_APP.showToast('Метка не найдена', 'error');
            return false;
        }

        // Инициализируем массив для книги
        if (!this.bookTags[bookId]) {
            this.bookTags[bookId] = [];
        }

        // Проверяем лимит (максимум 2 метки на книгу)
        if (this.bookTags[bookId].length >= 2) {
            MORI_APP.showToast('Максимум 2 метки на книгу', 'error');
            return false;
        }

        // Проверяем, нет ли уже такой метки
        if (this.bookTags[bookId].includes(tagId)) {
            MORI_APP.showToast('Метка уже добавлена', 'info');
            return false;
        }

        this.bookTags[bookId].push(tagId);
        this.saveBookTags();

        const book = MORI_LIBRARY_BOOKS.getById(bookId);
        MORI_APP.showToast(`Метка "${tag.name}" добавлена к книге`, 'success');
        return true;
    },

    /**
     * Удаление метки с книги
     */
    removeTagFromBook: function(bookId, tagId) {
        if (this.bookTags[bookId]) {
            this.bookTags[bookId] = this.bookTags[bookId].filter(id => id !== tagId);
            this.saveBookTags();

            const tag = this.getTagById(tagId);
            if (tag) {
                MORI_APP.showToast(`Метка "${tag.name}" удалена`, 'info');
            }
            return true;
        }
        return false;
    },

    /**
     * Получение всех меток книги
     */
    getBookTags: function(bookId) {
        const tagIds = this.bookTags[bookId] || [];
        return tagIds
            .map(id => this.getTagById(id))
            .filter(tag => tag !== undefined);
    },

    /**
     * Получение книг по метке
     */
    getBooksByTag: function(tagId) {
        const books = [];
        for (const [bookId, tags] of Object.entries(this.bookTags)) {
            if (tags.includes(tagId)) {
                const book = MORI_LIBRARY_BOOKS.getById(bookId);
                if (book) {
                    books.push(book);
                }
            }
        }
        return books;
    },

    /**
     * Получение статистики по меткам
     */
    getTagStats: function() {
        const stats = {};

        this.getAllTags().forEach(tag => {
            stats[tag.id] = {
                name: tag.name,
                color: tag.color,
                count: 0
            };
        });

        for (const tags of Object.values(this.bookTags)) {
            tags.forEach(tagId => {
                if (stats[tagId]) {
                    stats[tagId].count++;
                }
            });
        }

        return Object.values(stats).sort((a, b) => b.count - a.count);
    },

    /**
     * Получение популярных меток
     */
    getPopularTags: function(limit = 5) {
        return this.getTagStats().slice(0, limit);
    },

    /**
     * Поиск книг по меткам
     */
    searchByTags: function(tagIds) {
        if (tagIds.length === 0) return [];

        const bookSets = tagIds.map(tagId => {
            const books = this.getBooksByTag(tagId);
            return new Set(books.map(b => b.id));
        });

        // Находим книги, которые есть во всех множествах (пересечение)
        const intersection = new Set();
        const firstSet = bookSets[0];

        firstSet.forEach(bookId => {
            let inAll = true;
            for (let i = 1; i < bookSets.length; i++) {
                if (!bookSets[i].has(bookId)) {
                    inAll = false;
                    break;
                }
            }
            if (inAll) {
                intersection.add(bookId);
            }
        });

        return Array.from(intersection).map(id => MORI_LIBRARY_BOOKS.getById(id));
    },

    /**
     * Рекомендации на основе меток
     */
    getRecommendationsByTags: function(bookId) {
        const bookTags = this.getBookTags(bookId).map(t => t.id);
        if (bookTags.length === 0) return [];

        // Находим другие книги с такими же метками
        const similarBooks = new Map(); // bookId -> score

        for (const [otherBookId, tags] of Object.entries(this.bookTags)) {
            if (otherBookId === bookId) continue;

            // Считаем совпадения меток
            const matches = tags.filter(tagId => bookTags.includes(tagId)).length;
            if (matches > 0) {
                similarBooks.set(otherBookId, matches);
            }
        }

        // Сортируем по количеству совпадений
        const sorted = Array.from(similarBooks.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([id]) => MORI_LIBRARY_BOOKS.getById(id));

        return sorted;
    },

    /**
     * Очистка всех меток (для админа)
     */
    clearAllTags: function() {
        if (!MORI_AUTH.isAdmin()) {
            MORI_APP.showToast('Недостаточно прав', 'error');
            return;
        }

        this.customTags = [];
        this.bookTags = {};
        this.saveCustomTags();
        this.saveBookTags();
        MORI_APP.showToast('Все метки очищены', 'warning');
    },

    /**
     * Экспорт меток
     */
    exportTags: function() {
        const data = {
            exportDate: Date.now(),
            customTags: this.customTags,
            bookTags: this.bookTags
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `tags_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    },

    /**
     * Импорт меток
     */
    importTags: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (data.customTags) {
                        this.customTags = data.customTags;
                    }
                    if (data.bookTags) {
                        this.bookTags = data.bookTags;
                    }

                    this.saveCustomTags();
                    this.saveBookTags();
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }
};

// Экспорт
window.MORI_LIBRARY_TAGS = MORI_LIBRARY_TAGS;
