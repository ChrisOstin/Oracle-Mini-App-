/**
 * LIBRARY BOOKS — данные и управление книгами
 * Версия: 1.0.0 (с нуля)
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

    // Список книг
    books: [],

    // Цитаты из книг
    quotes: [
        { text: "Богатство — это не количество денег, а количество времени, которое вы можете не работать.", book: "Самый богатый человек в Вавилоне" },
        { text: "Единственная разница между богатым и бедным — это то, как они используют своё время.", book: "Богатый папа, бедный папа" },
        { text: "Логика — это искусство не ошибаться.", book: "Учебник логики" },
        { text: "Холод — это друг, который учит нас быть сильными.", book: "Ледяной человек" },
        { text: "Всё есть энергия. Всё вибрирует.", book: "Древняя тайна цветка жизни" },
        { text: "Чай — это не просто напиток, это философия.", book: "Книга чая" },
        { text: "Настоящий бунтарь — тот, кто не боится быть собой.", book: "Над пропастью во ржи" },
        { text: "Ты есть То, что ты ищешь.", book: "Я есть То" },
        { text: "Знание — это сила, но только если оно применено.", book: "Самый богатый человек в Вавилоне" },
        { text: "Деньги работают на того, кто работает над собой.", book: "Богатый папа, бедный папа" }
    ],

    /**
     * Загрузка книг из localStorage
     */
    load: function() {
        try {
            const saved = localStorage.getItem('library_books');
            if (saved) {
                this.books = JSON.parse(saved);
            } else {
                this.books = this.getDefaultBooks();
                this.save();
            }
        } catch (error) {
            console.error('Ошибка загрузки книг:', error);
            this.books = this.getDefaultBooks();
        }
        return this.books;
    },

    /**
     * Сохранение книг в localStorage
     */
    save: function() {
        localStorage.setItem('library_books', JSON.stringify(this.books));
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
        if (category === 'all') return this.books;
        return this.books.filter(book => book.category === category);
    },

    /**
     * Поиск книг
     */
    search: function(query) {
        if (!query) return this.books;
        const searchTerm = query.toLowerCase();
        return this.books.filter(book =>
            book.title.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm)
        );
    },

    /**
     * Получение доступных (разблокированных) книг
     */
    getAvailable: function() {
        return this.books.filter(book => book.unlocked === true);
    },

    /**
     * Получение заблокированных книг
     */
    getLocked: function() {
        return this.books.filter(book => book.unlocked !== true);
    },

    /**
     * Разблокировка книги по заданию
     */
    unlockByTask: function(taskId) {
        const book = this.books.find(b => b.taskId === taskId);
        if (book && !book.unlocked) {
            book.unlocked = true;
            this.save();
            MORI_APP.showToast(`📖 Книга "${book.title}" разблокирована!`, 'success');
            return true;
        }
        return false;
    },

    /**
     * Стартовые книги (10 штук)
     */
    getDefaultBooks: function() {
        return [
            { id: 'book_1', title: 'Самый богатый человек в Вавилоне', author: 'Джордж Клейсон', category: 'finance', cover: '📜', pages: 120, description: 'Классика финансовой литературы.', unlocked: true, taskId: null, file: null },
            { id: 'book_2', title: 'Богатый папа, бедный папа', author: 'Роберт Кийосаки', category: 'finance', cover: '💰', pages: 336, description: 'Что богатые учат своих детей о деньгах.', unlocked: true, taskId: null, file: null },
            { id: 'book_3', title: 'Квадрат денежного потока', author: 'Роберт Кийосаки', category: 'finance', cover: '📊', pages: 208, description: 'Руководство по достижению финансовой свободы.', unlocked: false, taskId: 'unlock_book_3', file: null },
            { id: 'book_4', title: 'Учебник логики', author: 'Георгий Челпанов', category: 'philosophy', cover: '🧠', pages: 256, description: 'Классическое пособие по логике.', unlocked: true, taskId: null, file: null },
            { id: 'book_5', title: 'Ледяной человек', author: 'Вим Хоф', category: 'selfhelp', cover: '❄️', pages: 224, description: 'Метод Вима Хофа.', unlocked: true, taskId: null, file: null },
            { id: 'book_6', title: 'Древняя тайна цветка жизни', author: 'Друнвало Мельхиседек', category: 'philosophy', cover: '🌸', pages: 528, description: 'Сакральная геометрия.', unlocked: false, taskId: 'unlock_book_6', file: null },
            { id: 'book_7', title: 'Книга чая', author: 'Лу Юй', category: 'philosophy', cover: '🍵', pages: 176, description: 'Древний трактат о чае.', unlocked: true, taskId: null, file: null },
            { id: 'book_8', title: 'Над пропастью во ржи', author: 'Джером Сэлинджер', category: 'fiction', cover: '🌾', pages: 288, description: 'Культовый роман.', unlocked: false, taskId: 'unlock_book_8', file: null },
            { id: 'book_9', title: 'Я есть То', author: 'Нисаргадатта Махарадж', category: 'philosophy', cover: '🕉️', pages: 512, description: 'Беседы о недвойственности.', unlocked: true, taskId: null, file: null },
            { id: 'book_10', title: 'Чайка по имени Джонатан Левингстон', author: 'Генри Стэнли', category: 'biography', cover: '🌍', pages: 384, description: 'История исследователя Африки.', unlocked: true, taskId: null, file: null }
        ];
    },

    /**
     * Добавление книги (через админку)
     */
    addBook: function(bookData, fileContent) {
        const newBook = {
            id: 'book_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            ...bookData,
            unlocked: true,
            taskId: null,
            addedAt: Date.now()
        };
        this.books.push(newBook);
        this.save();

        if (fileContent) {
            localStorage.setItem(`book_content_${newBook.id}`, JSON.stringify({
                content: fileContent,
                pages: this.splitIntoPages(fileContent)
            }));
        }

        MORI_APP.showToast(`✅ Книга "${newBook.title}" добавлена`, 'success');
        return newBook;
    },

    /**
     * Удаление книги
     */
    removeBook: function(bookId) {
        const index = this.books.findIndex(b => b.id === bookId);
        if (index !== -1) {
            const book = this.books[index];
            this.books.splice(index, 1);
            this.save();
            localStorage.removeItem(`book_content_${bookId}`);
            localStorage.removeItem(`reading_progress_${bookId}`);
            MORI_APP.showToast(`🗑️ Книга "${book.title}" удалена`, 'info');
            return true;
        }
        return false;
    },

    /**
     * Разбивка текста на страницы
     */
    splitIntoPages: function(text) {
        const pages = [];
        const pageSize = 2000;
        let start = 0;
        while (start < text.length) {
            let end = start + pageSize;
            if (end < text.length) {
                const searchEnd = Math.min(end + 200, text.length);
                for (let i = end; i < searchEnd; i++) {
                    if (['.', '!', '?', '\n'].includes(text[i])) {
                        end = i + 1;
                        break;
                    }
                }
            } else {
                end = text.length;
            }
            pages.push(text.substring(start, end));
            start = end;
        }
        return pages;
    },

    /**
     * Загрузка содержимого книги
     */
    loadContent: function(bookId) {
        const saved = localStorage.getItem(`book_content_${bookId}`);
        if (saved) {
            return JSON.parse(saved);
        }
        return null;
    },

    /**
     * Сохранение прогресса чтения
     */
    saveProgress: function(bookId, page, timestamp) {
        localStorage.setItem(`reading_progress_${bookId}`, JSON.stringify({
            page: page,
            timestamp: timestamp || Date.now()
        }));
    },

    /**
     * Получение прогресса чтения
     */
    getProgress: function(bookId) {
        const saved = localStorage.getItem(`reading_progress_${bookId}`);
        if (saved) {
            return JSON.parse(saved);
        }
        return { page: 1, timestamp: null };
    },

    /**
     * Получить случайную цитату
     */
    getRandomQuote: function() {
        const randomIndex = Math.floor(Math.random() * this.quotes.length);
        return this.quotes[randomIndex];
    },

    /**
     * Получить цитату дня (меняется раз в сутки)
     */
    getDailyQuote: function() {
        const today = new Date().toDateString();
        const saved = localStorage.getItem('daily_quote');

        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.date === today) {
                    return parsed.quote;
                }
            } catch(e) {}
        }

        const quote = this.getRandomQuote();
        localStorage.setItem('daily_quote', JSON.stringify({
            date: today,
            quote: quote
        }));

        return quote;
    },

    /**
     * Получить все заметки
     */
    getNotes: function(bookId = null) {
        const saved = localStorage.getItem('book_notes');
        const notes = saved ? JSON.parse(saved) : [];

        if (bookId) {
            return notes.filter(n => n.bookId === bookId);
        }
        return notes;
    },

    /**
     * Добавить заметку
     */
    addNote: function(bookId, page, text, bookTitle) {
        const notes = this.getNotes();

        notes.push({
            id: Date.now(),
            bookId: bookId,
            page: page,
            text: text,
            bookTitle: bookTitle,
            date: Date.now()
        });

        localStorage.setItem('book_notes', JSON.stringify(notes));
        MORI_APP.showToast('📝 Заметка добавлена', 'success');
        return true;
    },

    /**
     * Удалить заметку
     */
    removeNote: function(noteId) {
        let notes = this.getNotes();
        notes = notes.filter(n => n.id !== noteId);
        localStorage.setItem('book_notes', JSON.stringify(notes));
        MORI_APP.showToast('🗑️ Заметка удалена', 'info');
    },

    /**
     * Обновить заметку
     */
    updateNote: function(noteId, newText) {
        let notes = this.getNotes();
        const index = notes.findIndex(n => n.id === noteId);
        if (index !== -1) {
            notes[index].text = newText;
            notes[index].date = Date.now();
            localStorage.setItem('book_notes', JSON.stringify(notes));
            MORI_APP.showToast('📝 Заметка обновлена', 'success');
            return true;
        }
        return false;
    },

// ========== ЗАКЛАДКИ ==========
getBookmarks: function(bookId = null) {
    const saved = localStorage.getItem('bookmarks');
    const bookmarks = saved ? JSON.parse(saved) : [];
    
    if (bookId) {
        return bookmarks.filter(b => b.bookId === bookId);
    }
    return bookmarks;
},

addBookmark: function(bookId, page, title) {
    const bookmarks = this.getBookmarks();
    
    const exists = bookmarks.some(b => b.bookId === bookId && b.page === page);
    if (exists) {
        MORI_APP.showToast('🔖 Закладка уже есть на этой странице', 'info');
        return false;
    }
    
    bookmarks.push({
        id: Date.now(),
        bookId: bookId,
        page: page,
        title: title,
        date: Date.now()
    });
    
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    MORI_APP.showToast('🔖 Закладка добавлена', 'success');
    return true;
},

removeBookmark: function(bookmarkId) {
    let bookmarks = this.getBookmarks();
    bookmarks = bookmarks.filter(b => b.id !== bookmarkId);
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    MORI_APP.showToast('🗑️ Закладка удалена', 'info');
},

};  // Конец объекта MORI_LIBRARY_BOOKS

// Автозагрузка
MORI_LIBRARY_BOOKS.load();

window.MORI_LIBRARY_BOOKS = MORI_LIBRARY_BOOKS;
