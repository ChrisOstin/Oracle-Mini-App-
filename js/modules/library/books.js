/**
 * LIBRARY BOOKS
 * Управление коллекцией книг
 * Версия: 1.0.0
 */

const MORI_LIBRARY_BOOKS = {
    // Категории книг
    categories: {
        finance: '💰 Финансы',
        philosophy: '🧠 Философия',
        psychology: '🧘 Психология',
        biography: '📜 Биография',
        classic: '🏛️ Классика',
        science: '🔬 Наука',
        selfhelp: '📚 Саморазвитие',
        fiction: '📖 Художественная'
    },

    // Коллекция книг
    books: [],

    // Кэш загруженных книг
    cache: new Map(),

    /**
     * Загрузка всех книг
     */
    loadAll: async function() {
        try {
            // Пробуем загрузить с сервера
            const response = await MORI_API.getBooks?.();
            if (response && response.books) {
                this.books = response.books;
                return this.books;
            }
        } catch (error) {
            console.error('Error loading books from server:', error);
        }

        // Если сервер недоступен, показываем ошибку
        this.books = [];
        MORI_APP.showToast('❌ Ошибка загрузки библиотеки', 'error');
        return [];
    },

    /**
     * Получение книги по ID
     */
    getById: function(bookId) {
        return this.books.find(book => book.id === bookId);
    },

    /**
     * Получение книг по категории
     */
    getByCategory: function(category) {
        return this.books.filter(book => book.category === category);
    },

    /**
     * Получение книг по автору
     */
    getByAuthor: function(author) {
        return this.books.filter(book => 
            book.author.toLowerCase().includes(author.toLowerCase())
        );
    },

    /**
     * Поиск книг
     */
    search: function(query) {
        const searchTerm = query.toLowerCase();
        return this.books.filter(book => 
            book.title.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm) ||
            (book.description && book.description.toLowerCase().includes(searchTerm))
        );
    },

    /**
     * Получение случайной книги
     */
    getRandom: function() {
        const index = Math.floor(Math.random() * this.books.length);
        return this.books[index];
    },

    /**
     * Получение рекомендаций на основе прочитанного
     */
    getRecommendations: function(readBooks) {
        if (!readBooks || readBooks.length === 0) {
            return this.getByCategory('finance').slice(0, 5);
        }

        // Анализируем категории прочитанных книг
        const categories = {};
        readBooks.forEach(bookId => {
            const book = this.getById(bookId);
            if (book && book.category) {
                categories[book.category] = (categories[book.category] || 0) + 1;
            }
        });

        // Находим самую популярную категорию
        const topCategory = Object.entries(categories)
            .sort((a, b) => b[1] - a[1])[0]?.[0];

        // Рекомендуем книги из этой категории
        return topCategory ? 
            this.getByCategory(topCategory).filter(b => !readBooks.includes(b.id)).slice(0, 5) :
            this.getByCategory('finance').slice(0, 5);
    },

    /**
     * Добавление книги (для админа)
     */
    addBook: async function(bookData) {
        // Проверка прав
        if (!MORI_AUTH.isAdmin()) {
            throw new Error('Недостаточно прав');
        }

        const newBook = {
            id: this.generateId(),
            ...bookData,
            addedAt: Date.now(),
            downloads: 0,
            rating: 0,
            ratingCount: 0
        };

        // Отправка на сервер
        try {
            const response = await MORI_API.addBook?.(newBook);
            if (response) {
                this.books.push(newBook);
                return newBook;
            }
        } catch (error) {
            console.error('Error adding book:', error);
            throw error;
        }
    },

    /**
     * Удаление книги (для админа)
     */
    removeBook: async function(bookId) {
        // Проверка прав
        if (!MORI_AUTH.isAdmin()) {
            throw new Error('Недостаточно прав');
        }

        try {
            const response = await MORI_API.removeBook?.(bookId);
            if (response) {
                this.books = this.books.filter(b => b.id !== bookId);
                return true;
            }
        } catch (error) {
            console.error('Error removing book:', error);
            throw error;
        }
    },

    /**
     * Обновление информации о книге
     */
    updateBook: async function(bookId, updates) {
        const book = this.getById(bookId);
        if (!book) throw new Error('Книга не найдена');

        Object.assign(book, updates);

        try {
            await MORI_API.updateBook?.(bookId, updates);
        } catch (error) {
            console.error('Error updating book:', error);
        }

        return book;
    },

    /**
     * Загрузка контента книги
     */
    loadContent: async function(bookId) {
        // Проверяем кэш
        if (this.cache.has(bookId)) {
            return this.cache.get(bookId);
        }

        try {
            // Загрузка с сервера
            const content = await MORI_API.downloadBook?.(bookId);
            if (content) {
                this.cache.set(bookId, content);
                return content;
            }
        } catch (error) {
            console.error('Error loading book content:', error);
        }

        // Если не получилось, показываем ошибку
        MORI_APP.showToast('❌ Не удалось загрузить книгу', 'error');
        return null;
    },

    /**
     * Очистка кэша
     */
    clearCache: function() {
        this.cache.clear();
    },

    /**
     * Получение статистики по книгам
     */
    getStats: function() {
        return {
            total: this.books.length,
            byCategory: this.getStatsByCategory(),
            byAuthor: this.getStatsByAuthor(),
            totalPages: this.books.reduce((sum, b) => sum + (b.pages || 0), 0),
            averageRating: this.getAverageRating()
        };
    },

    /**
     * Статистика по категориям
     */
    getStatsByCategory: function() {
        const stats = {};
        this.books.forEach(book => {
            const cat = book.category || 'other';
            stats[cat] = (stats[cat] || 0) + 1;
        });
        return stats;
    },

    /**
     * Статистика по авторам
     */
    getStatsByAuthor: function() {
        const stats = {};
        this.books.forEach(book => {
            stats[book.author] = (stats[book.author] || 0) + 1;
        });
        return stats;
    },

    /**
     * Средний рейтинг
     */
    getAverageRating: function() {
        const rated = this.books.filter(b => b.rating > 0);
        if (rated.length === 0) return 0;
        return rated.reduce((sum, b) => sum + b.rating, 0) / rated.length;
    },

    /**
     * Генерация ID
     */
    generateId: function() {
        return 'book_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Тестовые книги
     */
    getMockBooks: function() {
        return [
            {
                id: 'book_1',
                title: 'Самый богатый человек в Вавилоне',
                author: 'Джордж Клейсон',
                category: 'finance',
                cover: '📜',
                pages: 120,
                rating: 5,
                ratingCount: 1243,
                year: 1926,
                description: 'Классика финансовой литературы, рассказывающая о принципах накопления богатства через притчи Древнего Вавилона.',
                language: 'ru',
                format: 'txt',
                size: '245 KB'
            },
            {
                id: 'book_2',
                title: 'Богатый папа, бедный папа',
                author: 'Роберт Кийосаки',
                category: 'finance',
                cover: '💰',
                pages: 336,
                rating: 5,
                ratingCount: 2156,
                year: 1997,
                description: 'Что богатые учат своих детей о деньгах — и чему не учат бедные и средний класс!',
                language: 'ru',
                format: 'txt',
                size: '512 KB'
            },
            {
                id: 'book_3',
                title: 'Квадрат денежного потока',
                author: 'Роберт Кийосаки',
                category: 'finance',
                cover: '📊',
                pages: 208,
                rating: 4,
                ratingCount: 876,
                year: 1998,
                description: 'Руководство по достижению финансовой свободы через понимание четырёх категорий людей: Р, С, Б, И.',
                language: 'ru',
                format: 'txt',
                size: '398 KB'
            },
            {
                id: 'book_4',
                title: 'Учебник логики',
                author: 'Георгий Челпанов',
                category: 'philosophy',
                cover: '🧠',
                pages: 256,
                rating: 4,
                ratingCount: 543,
                year: 1915,
                description: 'Классическое пособие по логике, которое до сих пор используется в учебных заведениях.',
                language: 'ru',
                format: 'txt',
                size: '421 KB'
            },
            {
                id: 'book_5',
                title: 'Ледяной человек',
                author: 'Вим Хоф',
                category: 'selfhelp',
                cover: '❄️',
                pages: 224,
                rating: 5,
                ratingCount: 1234,
                year: 2020,
                description: 'Метод Вима Хофа: как контролировать тело и разум с помощью холода и дыхания.',
                language: 'ru',
                format: 'txt',
                size: '367 KB'
            },
            {
                id: 'book_6',
                title: 'Древняя тайна цветка жизни',
                author: 'Друнвало Мельхиседек',
                category: 'philosophy',
                cover: '🌸',
                pages: 528,
                rating: 4,
                ratingCount: 789,
                year: 1999,
                description: 'Сакральная геометрия и духовные практики древних цивилизаций.',
                language: 'ru',
                format: 'txt',
                size: '1.2 MB'
            },
            {
                id: 'book_7',
                title: 'Книга чая',
                author: 'Лу Юй',
                category: 'philosophy',
                cover: '🍵',
                pages: 176,
                rating: 5,
                ratingCount: 345,
                year: 760,
                description: 'Древний китайский трактат о чае, его приготовлении и философии чаепития.',
                language: 'ru',
                format: 'txt',
                size: '289 KB'
            },
            {
                id: 'book_8',
                title: 'Над пропастью во ржи',
                author: 'Джером Сэлинджер',
                category: 'fiction',
                cover: '🌾',
                pages: 288,
                rating: 5,
                ratingCount: 3456,
                year: 1951,
                description: 'Культовый роман о подростковом бунте и поиске себя.',
                language: 'ru',
                format: 'txt',
                size: '456 KB'
            },
            {
                id: 'book_9',
                title: 'Я есть То',
                author: 'Нисаргадатта Махарадж',
                category: 'philosophy',
                cover: '🕉️',
                pages: 512,
                rating: 5,
                ratingCount: 567,
                year: 1973,
                description: 'Беседы о недвойственности и природе реальности.',
                language: 'ru',
                format: 'txt',
                size: '892 KB'
            },
            {
                id: 'book_10',
                title: 'Жизнь и приключения Льюиса Левингстона',
                author: 'Генри Стэнли',
                category: 'biography',
                cover: '🌍',
                pages: 384,
                rating: 4,
                ratingCount: 234,
                year: 1872,
                description: 'История знаменитого исследователя Африки.',
                language: 'ru',
                format: 'txt',
                size: '678 KB'
            }
        ];
    },

    
};

// Экспорт
window.MORI_LIBRARY_BOOKS = MORI_LIBRARY_BOOKS;
