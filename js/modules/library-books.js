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
        
        // Принудительно добавляем контент для первой книги
        const book1 = this.books.find(b => b.id === 'book_1');
        if (book1 && !book1.content) {
            const defaultBooks = this.getDefaultBooks();
            const defaultBook1 = defaultBooks.find(b => b.id === 'book_1');
            if (defaultBook1 && defaultBook1.content) {
                book1.content = defaultBook1.content;
                this.save();
            }
        }


        // Загружаем поисковый индекс
        this.loadSearchIndex();
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
            {
    id: 'book_1',
    title: 'Самый богатый человек в Вавилоне',
    author: 'Джордж Клейсон',
    category: 'finance',
    cover: '📜',
    pages: 120,
    description: 'Классика финансовой литературы.',
    unlocked: true,
    taskId: null,
    file: null,
    content: [
        '<p>В древнем Вавилоне жил человек по имени Аркад. Он был самым богатым человеком в городе. Все знали его имя, и к нему приходили за советом.</p>',
        '<p>Однажды к нему пришли два друга — Бансир и Коби. Они сказали: "Аркад, ты богаче всех нас. Расскажи нам свой секрет. Как нам тоже стать богатыми?"</p>',
        '<p>Аркад улыбнулся и ответил: "Секрет богатства прост. Я понял его много лет назад, когда был бедным писцом. Я понял, что часть того, что я зарабатываю, принадлежит мне".</p>',
        '<p>"Что ты имеешь в виду?" — спросили друзья. "Я имею в виду, — сказал Аркад, — что каждый человек должен откладывать десятую часть своего дохода. Это первый шаг к богатству".</p>',
        '<p>Друзья удивились: "Неужели так просто? Откладывать десятую часть?" Аркад кивнул: "Попробуйте сами. Через год вы увидите разницу".</p>'
    ]
},
            { id: 'book_2', title: 'Богатый папа, бедный папа', author: 'Роберт Кийосаки', category: 'finance', cover: '💰', pages: 336, description: 'Что богатые учат своих детей о деньгах.', unlocked: true, taskId: null, file: null },
            { id: 'book_3', title: 'Квадрат денежного потока', author: 'Роберт Кийосаки', category: 'finance', cover: '📊', pages: 208, description: 'Руководство по достижению финансовой свободы.', unlocked: false, taskId: 'unlock_book_3', file: null },
            { id: 'book_4', title: 'Учебник логики', author: 'Георгий Челпанов', category: 'philosophy', cover: '🧠', pages: 256, description: 'Классическое пособие по логике.', unlocked: true, taskId: null, file: null },
            { id: 'book_5', title: 'Ледяной человек', author: 'Вим Хоф', category: 'selfhelp', cover: '❄️', pages: 224, description: 'Метод Вима Хофа.', unlocked: true, taskId: null, file: null },
            { id: 'book_6', title: 'Древняя тайна цветка жизни', author: 'Друнвало Мельхиседек', category: 'philosophy', cover: '🌸', pages: 528, description: 'Сакральная геометрия.', unlocked: false, taskId: 'unlock_book_6', file: null },
            { id: 'book_7', title: 'Книга чая', author: 'Лу Юй', category: 'philosophy', cover: '🍵', pages: 176, description: 'Древний трактат о чае.', unlocked: true, taskId: null, file: null },
            { id: 'book_8', title: 'Над пропастью во ржи', author: 'Джером Сэлинджер', category: 'fiction', cover: '🌾', pages: 288, description: 'Культовый роман.', unlocked: false, taskId: 'unlock_book_8', file: null },
            { id: 'book_9', title: 'Я есть То', author: 'Нисаргадатта Махарадж', category: 'philosophy', cover: '🕉️', pages: 512, description: 'Беседы о недвойственности.', unlocked: true, taskId: null, file: null },
            { id: 'book_10', title: 'Жизнь чайки по имени Джонатан Левингстон', author: 'Генри Стэнли', category: 'biography', cover: '🌍', pages: 384, description: 'История исследователя Африки.', unlocked: true, taskId: null, file: null }
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

// ========== ПОИСК ПО ТЕКСТУ КНИГ ==========
searchIndex: null,

/**
 * Построение поискового индекса (вызывается при загрузке)
 */
buildSearchIndex: function() {
    console.log('🔍 Построение поискового индекса...');
    this.searchIndex = [];
    
    this.books.forEach(book => {
        if (!book.unlocked) return; // пропускаем заблокированные книги
        
        // Получаем содержимое книги
        let content = null;
        
        // Сначала проверяем встроенный контент
        if (book.content && book.content.length) {
            content = book.content;
        } else {
            // Пытаемся загрузить из localStorage
            const saved = localStorage.getItem(`book_content_${book.id}`);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    content = parsed.pages || parsed.content;
                } catch(e) {}
            }
        }
        
        if (!content || !content.length) return;
        
        // Индексируем каждую страницу
        content.forEach((pageHtml, idx) => {
            // Удаляем HTML-теги
            const plainText = pageHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            if (!plainText.length) return;
            
            // Разбиваем на предложения/фрагменты для контекста
            const pageNum = idx + 1;
            
            this.searchIndex.push({
                bookId: book.id,
                bookTitle: book.title,
                page: pageNum,
                text: plainText,
                bookCover: book.cover || '📖'
            });
        });
    });
    
    console.log(`✅ Индекс построен: ${this.searchIndex.length} страниц индексировано`);
    localStorage.setItem('library_search_index', JSON.stringify({
        index: this.searchIndex,
        timestamp: Date.now(),
        bookCount: this.books.length
    }));
},

/**
 * Поиск по тексту книг
 * @param {string} query - поисковый запрос
 * @returns {Array} массив результатов
 */
searchInBooks: function(query) {
    if (!query || query.length < 2) return [];
    if (!this.searchIndex) {
        this.buildSearchIndex();
    }
    
    const lowerQuery = query.toLowerCase();
    const results = [];
    
    this.searchIndex.forEach(item => {
        // Ищем вхождение подстроки (полное совпадение слова или части)
        if (item.text.toLowerCase().includes(lowerQuery)) {
            // Находим контекст (50 символов до и после)
            const text = item.text;
            const pos = text.toLowerCase().indexOf(lowerQuery);
            let context = '';
            
            if (pos !== -1) {
                let start = Math.max(0, pos - 50);
                let end = Math.min(text.length, pos + query.length + 50);
                context = (start > 0 ? '...' : '') + 
                          text.substring(start, end) + 
                          (end < text.length ? '...' : '');
            } else {
                context = text.substring(0, 100) + '...';
            }
            
            results.push({
                bookId: item.bookId,
                bookTitle: item.bookTitle,
                page: item.page,
                context: context,
                bookCover: item.bookCover
            });
        }
    });
    
    // Сортируем по книге и странице
    results.sort((a, b) => {
        if (a.bookTitle !== b.bookTitle) return a.bookTitle.localeCompare(b.bookTitle);
        return a.page - b.page;
    });
    
    return results;
},

/**
 * Получить контент книги для отображения
 */
getBookContent: function(bookId, pageNum) {
    const book = this.getById(bookId);
    if (!book || !book.unlocked) return null;
    
    let content = null;
    if (book.content && book.content.length) {
        content = book.content;
    } else {
        const saved = localStorage.getItem(`book_content_${bookId}`);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                content = parsed.pages || parsed.content;
            } catch(e) {}
        }
    }
    
    if (content && pageNum) {
        return content[pageNum - 1] || null;
    }
    return content;
},

/**
 * Загрузить индекс из кэша или построить заново
 */
loadSearchIndex: function() {
    const cached = localStorage.getItem('library_search_index');
    if (cached) {
        try {
            const data = JSON.parse(cached);
            // Проверяем актуальность кэша (если книги не изменились)
            if (data.bookCount === this.books.length && (Date.now() - data.timestamp) < 86400000) {
                this.searchIndex = data.index;
                console.log(`📦 Индекс загружен из кэша: ${this.searchIndex.length} страниц`);
                return;
            }
        } catch(e) {}
    }
    this.buildSearchIndex();
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
