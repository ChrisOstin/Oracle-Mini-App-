/**
 * LIBRARY MODULE — главный модуль библиотеки
 * Версия: 1.0.0 (с нуля)
 */

const MORI_LIBRARY = {
    // Состояние
    state: {
    view: 'grid',
    filterCategory: 'all',
    filterStatus: 'all',
    searchQuery: '',
    wishlist: [],
    tags: {},
    isLoading: true,
    filterCollapsed: {
        category: false,
        status: false
    }
},

    /**
     * Инициализация
     */
init: function() {
    console.log('📚 MORI_LIBRARY инициализация...');
    this.loadWishlist();
    this.loadTags();
    // Загружаем прогресс, заметки и закладки из library-books
    if (window.MORI_LIBRARY_BOOKS) {
        MORI_LIBRARY_BOOKS.load();
    }
    this.render();
},

    /**
     * Рендер модуля
     */
    render: function() {
    const content = document.getElementById('library-content');
    if (!content) {
        setTimeout(() => this.render(), 100);
        return;
    }
    
    // Показываем скелетон при первой загрузке
    if (this.state.isLoading && MORI_LIBRARY_BOOKS.books.length === 0) {
        content.innerHTML = this.renderSkeleton();
        setTimeout(() => {
            this.state.isLoading = false;
            this.render();
        }, 500);
        return;
    }
    
    content.innerHTML = this.getHTML();
    this.attachEvents();
},

    /**
     * HTML шаблон
     */
    getHTML: function() {
        const books = this.getFilteredBooks();
        const stats = this.getStats();

        return `
            <div class="library-container">
                <!-- Шапка -->
                <div class="library-header">
                     <!-- Цитата дня -->
<div class="daily-quote">
    <div class="quote-icon">📜</div>
    <div class="quote-text">"${MORI_LIBRARY_BOOKS.getDailyQuote().text}"</div>
    <div class="quote-author">— ${MORI_LIBRARY_BOOKS.getDailyQuote().book}</div>
</div>
                    <div class="library-stats">
                        <span>📖 ${stats.total} книг</span>
                        <span>🔓 ${stats.available} доступно</span>
                        <span>⭐ ${this.state.wishlist.length} в вишлисте</span>
                    </div>
                </div>

                <!-- Поиск -->
                <div class="library-search">
                    <div class="search-wrapper">
                        <span class="search-icon">🔍</span>
                        <input type="text"
                               class="search-input"
                               placeholder="Поиск по названию или автору..."
                               value="${this.state.searchQuery}"
                               id="library-search-input">
                        ${this.state.searchQuery ? '<button class="search-clear" id="library-search-clear">✕</button>' : ''}
                    </div>
                </div>

                <!-- Фильтры (сворачиваемые) -->
<div class="library-filters">
    <div class="filter-group">
        <div class="filter-group-header ${this.state.filterCollapsed.category ? 'collapsed' : ''}" data-filter-group="category">
            <span class="filter-label">📂 Категория</span>
            <span class="toggle-icon">▼</span>
        </div>
        <div class="filter-group-content ${this.state.filterCollapsed.category ? 'collapsed' : ''}">
            <div class="filter-buttons">
                <button class="filter-btn ${this.state.filterCategory === 'all' ? 'active' : ''}" data-filter-category="all">Все</button>
                ${Object.entries(MORI_LIBRARY_BOOKS.categories).map(([key, name]) => `
                    <button class="filter-btn ${this.state.filterCategory === key ? 'active' : ''}" data-filter-category="${key}">${name}</button>
                `).join('')}
            </div>
        </div>
    </div>
    <div class="filter-group">
        <div class="filter-group-header ${this.state.filterCollapsed.status ? 'collapsed' : ''}" data-filter-group="status">
            <span class="filter-label">⏳ Статус</span>
            <span class="toggle-icon">▼</span>
        </div>
        <div class="filter-group-content ${this.state.filterCollapsed.status ? 'collapsed' : ''}">
            <div class="filter-buttons">
                <button class="filter-btn ${this.state.filterStatus === 'all' ? 'active' : ''}" data-filter-status="all">Все</button>
                <button class="filter-btn ${this.state.filterStatus === 'available' ? 'active' : ''}" data-filter-status="available">✅ Доступные</button>
                <button class="filter-btn ${this.state.filterStatus === 'locked' ? 'active' : ''}" data-filter-status="locked">🔒 Заблокированные</button>
            </div>
        </div>
    </div>
</div>

                <!-- Переключение вида -->
                <div class="library-view-toggle">
                    <button class="view-btn ${this.state.view === 'grid' ? 'active' : ''}" data-view="grid">🔲 Сетка</button>
                    <button class="view-btn ${this.state.view === 'list' ? 'active' : ''}" data-view="list">📋 Список</button>
                </div>

                <!-- Список книг -->
                <div class="library-books ${this.state.view === 'grid' ? 'books-grid' : 'books-list'}">
                    ${this.renderBooks(books)}
                </div>

                <!-- Вишлист -->
                ${this.renderWishlist()}
                ${this.renderBookmarks()}
                ${this.renderNotes()}
            </div>
        `;
    },

    /**
     * Рендер книг
     */
    renderBooks: function(books) {
        if (books.length === 0) {
            return '<div class="empty-state"><div class="empty-icon">📚</div><div class="empty-text">Книги не найдены</div></div>';
        }

        return books.map(book => this.renderBookCard(book)).join('');
    },

/**
 * Обновление только списка книг (без перерисовки всего модуля)
 */
updateBooksList: function() {
    const booksContainer = document.querySelector('.library-books');
    if (!booksContainer) return;
    
    const filteredBooks = this.getFilteredBooks();
    booksContainer.innerHTML = this.renderBooks(filteredBooks);
    
    // Переподключаем обработчики для кнопок в новых карточках
    this.attachBookEvents();
},

/**
 * Подключение событий к кнопкам книг
 */
attachBookEvents: function() {
    // Кнопки "Читать"
    document.querySelectorAll('.book-read-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const bookId = btn.dataset.bookId;
            const book = MORI_LIBRARY_BOOKS.getById(bookId);
            if (book && book.unlocked) {
                MORI_LIBRARY_READER.open(book);
            }
        };
    });
    
    // Кнопки вишлиста
    document.querySelectorAll('.book-wishlist-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const bookId = btn.dataset.bookId;
            this.toggleWishlist(bookId);
        };
    });
},

    /**
     * Рендер карточки книги
     */
    renderBookCard: function(book) {
        const isLocked = !book.unlocked;
        const inWishlist = this.state.wishlist.includes(book.id);
        const progress = MORI_LIBRARY_BOOKS.getProgress(book.id);
        const progressPercent = (progress.page / book.pages) * 100;
        const categoryName = MORI_LIBRARY_BOOKS.categories[book.category] || book.category;
        const tags = this.getBookTags(book.id);

        return `
            <div class="book-card ${isLocked ? 'locked' : ''}" data-book-id="${book.id}">
                <div class="book-cover">
                    <span class="book-cover-emoji">${book.cover || '📖'}</span>
                    ${inWishlist ? '<span class="book-wishlist-badge">⭐</span>' : ''}
                    ${isLocked ? '<span class="book-lock-badge">🔒</span>' : ''}
                </div>
                <div class="book-info">
                    <div class="book-title">${book.title}</div>
                    <div class="book-author">${book.author}</div>
                    <div class="book-category">${categoryName}</div>
                    <div class="book-meta">
                        <span>📄 ${book.pages} стр.</span>
                    </div>
                    ${progress.page > 1 ? `
                        <div class="book-progress">
                            <div class="book-progress-bar" style="width: ${progressPercent}%"></div>
                            <span class="book-progress-text">${progress.page}/${book.pages}</span>
                        </div>
                    ` : ''}
                    ${tags.length > 0 ? `
                        <div class="book-tags">
                            ${tags.map(tag => `<span class="book-tag" style="background: ${tag.color}20; color: ${tag.color};">${tag.icon} ${tag.name}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="book-actions">
                    ${!isLocked ? `
                        <button class="book-read-btn" data-book-id="${book.id}">📖 Читать</button>
                        <button class="book-wishlist-btn ${inWishlist ? 'active' : ''}" data-book-id="${book.id}">${inWishlist ? '⭐ В вишлисте' : '☆ В вишлист'}</button>
                    ` : `
                        <button class="book-locked-btn" disabled>🔒 Требуется задание</button>
                    `}
                </div>
            </div>
        `;
    },

    /**
     * Рендер вишлиста
     */
    renderWishlist: function() {
        if (this.state.wishlist.length === 0) return '';

        const wishlistBooks = MORI_LIBRARY_BOOKS.books.filter(book => this.state.wishlist.includes(book.id));
        
        return `
            <div class="wishlist-section">
                <div class="wishlist-header">
                    <h3>⭐ Вишлист</h3>
                    <span class="wishlist-count">${wishlistBooks.length}</span>
                </div>
                <div class="wishlist-items">
                    ${wishlistBooks.map(book => `
                        <div class="wishlist-item" data-book-id="${book.id}">
                            <span class="wishlist-cover">${book.cover || '📖'}</span>
                            <div class="wishlist-info">
                                <div class="wishlist-title">${book.title}</div>
                                <div class="wishlist-author">${book.author}</div>
                            </div>
                            <button class="wishlist-remove" data-book-id="${book.id}">🗑️</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

renderBookmarks: function() {
    const bookmarks = MORI_LIBRARY_BOOKS.getBookmarks();
    if (bookmarks.length === 0) return '';
    
    const bookmarkItems = bookmarks.slice(0, 10).map(bm => {
        const book = MORI_LIBRARY_BOOKS.getById(bm.bookId);
        if (!book) return '';
        return `
            <div class="bookmark-item" data-book-id="${bm.bookId}" data-page="${bm.page}">
                <div class="bookmark-icon">🔖</div>
                <div class="bookmark-info">
                    <div class="bookmark-title">${book.title}</div>
                    <div class="bookmark-page">Страница ${bm.page}</div>
                    <div class="bookmark-date">${new Date(bm.date).toLocaleDateString()}</div>
                </div>
                <button class="bookmark-delete" data-bookmark-id="${bm.id}">🗑️</button>
            </div>
        `;
    }).join('');
    
    return `
        <div class="bookmarks-section">
            <div class="bookmarks-header">
                <h3>🔖 Закладки</h3>
                <span class="bookmarks-count">${bookmarks.length}</span>
            </div>
            <div class="bookmarks-list">
                ${bookmarkItems}
            </div>
        </div>
    `;
},

    renderSkeleton: function() {
    return `
        <div class="books-grid">
            ${Array(4).fill(0).map(() => `
                <div class="skeleton-card">
                    <div class="skeleton-cover"></div>
                    <div class="skeleton-title"></div>
                    <div class="skeleton-author"></div>
                </div>
            `).join('')}
        </div>
    `;
},

    /**
     * Получение отфильтрованных книг
     */
    getFilteredBooks: function() {
        let books = [...MORI_LIBRARY_BOOKS.books];

        // Фильтр по категории
        if (this.state.filterCategory !== 'all') {
            books = books.filter(book => book.category === this.state.filterCategory);
        }

        // Фильтр по статусу
        if (this.state.filterStatus === 'available') {
            books = books.filter(book => book.unlocked === true);
        } else if (this.state.filterStatus === 'locked') {
            books = books.filter(book => book.unlocked !== true);
        }

        // Поиск
        if (this.state.searchQuery) {
            const query = this.state.searchQuery.toLowerCase();
            books = books.filter(book =>
                book.title.toLowerCase().includes(query) ||
                book.author.toLowerCase().includes(query)
            );
        }

        return books;
    },

    /**
     * Статистика
     */
    getStats: function() {
        const books = MORI_LIBRARY_BOOKS.books;
        return {
            total: books.length,
            available: books.filter(b => b.unlocked === true).length,
            locked: books.filter(b => b.unlocked !== true).length
        };
    },

    /**
     * Навешивание обработчиков
     */
    attachEvents: function() {
    
       // Сворачиваемые фильтры
document.querySelectorAll('.filter-group-header').forEach(header => {
    header.onclick = () => {
        const group = header.dataset.filterGroup;
        if (group === 'category') {
            this.state.filterCollapsed.category = !this.state.filterCollapsed.category;
        } else if (group === 'status') {
            this.state.filterCollapsed.status = !this.state.filterCollapsed.status;
        }
        this.render();
    };
});
   
       // Фильтры по категории
        document.querySelectorAll('[data-filter-category]').forEach(btn => {
            btn.onclick = () => {
                this.state.filterCategory = btn.dataset.filterCategory;
                this.render();
            };
        });

        // Фильтры по статусу
        document.querySelectorAll('[data-filter-status]').forEach(btn => {
            btn.onclick = () => {
                this.state.filterStatus = btn.dataset.filterStatus;
                this.render();
            };
        });

        // Поиск
        const searchInput = document.getElementById('library-search-input');
if (searchInput) {
    searchInput.oninput = (e) => {
        this.state.searchQuery = e.target.value;
        // Обновляем ТОЛЬКО список книг
        this.updateBooksList();
        
        // Управление кнопкой очистки
        const searchWrapper = document.querySelector('.search-wrapper');
        let clearBtn = document.querySelector('.search-clear');
        
        if (this.state.searchQuery) {
            if (!clearBtn) {
                clearBtn = document.createElement('button');
                clearBtn.className = 'search-clear';
                clearBtn.textContent = '✕';
                clearBtn.onclick = () => {
                    this.state.searchQuery = '';
                    this.render();
                };
                searchWrapper.appendChild(clearBtn);
            }
        } else if (clearBtn) {
            clearBtn.remove();
        }
    };
}

        const searchClear = document.getElementById('library-search-clear');
        if (searchClear) {
            searchClear.onclick = () => {
                this.state.searchQuery = '';
                this.render();
            };
        }

        // Переключение вида
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.onclick = () => {
                this.state.view = btn.dataset.view;
                this.render();
            };
        });

        // Кнопки чтения
        // Подключаем события для кнопок книг
this.attachBookEvents();

        // Закладки — открытие книги на нужной странице
document.querySelectorAll('.bookmark-item').forEach(item => {
    item.onclick = (e) => {
        if (e.target.classList.contains('bookmark-delete')) return;
        const bookId = item.dataset.bookId;
        const page = parseInt(item.dataset.page);
        const book = MORI_LIBRARY_BOOKS.getById(bookId);
        if (book && book.unlocked) {
            // Сохраняем прогресс на нужную страницу
            MORI_LIBRARY_BOOKS.saveProgress(bookId, page);
            MORI_LIBRARY_READER.open(book);
        }
    };
});

// Заметки — открытие книги на нужной странице
document.querySelectorAll('.note-item').forEach(item => {
    item.onclick = (e) => {
        if (e.target.classList.contains('note-delete')) return;
        const bookId = item.dataset.bookId;
        const page = parseInt(item.dataset.page);
        const book = MORI_LIBRARY_BOOKS.getById(bookId);
        if (book && book.unlocked) {
            MORI_LIBRARY_BOOKS.saveProgress(bookId, page);
            MORI_LIBRARY_READER.open(book);
        }
    };
});

// Удаление заметки
document.querySelectorAll('.note-delete').forEach(btn => {
    btn.onclick = (e) => {
        e.stopPropagation();
        const noteId = parseInt(btn.dataset.noteId);
        MORI_LIBRARY_BOOKS.removeNote(noteId);
        this.render();
    };
});

// Удаление закладки
document.querySelectorAll('.bookmark-delete').forEach(btn => {
    btn.onclick = (e) => {
        e.stopPropagation();
        const bookmarkId = parseInt(btn.dataset.bookmarkId);
        MORI_LIBRARY_BOOKS.removeBookmark(bookmarkId);
        this.render();  // Перерисовываем библиотеку
    };
});

        // Удаление из вишлиста
        document.querySelectorAll('.wishlist-remove').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const bookId = btn.dataset.bookId;
                this.removeFromWishlist(bookId);
            };
        });
    },

    /**
     * Добавить/удалить из вишлиста
     */
    toggleWishlist: function(bookId) {
        if (this.state.wishlist.includes(bookId)) {
            this.removeFromWishlist(bookId);
        } else {
            this.addToWishlist(bookId);
        }
    },

    /**
     * Добавить в вишлист
     */
    addToWishlist: function(bookId) {
        if (this.state.wishlist.length >= 50) {
            MORI_APP.showToast('❌ Максимум 50 книг в вишлисте', 'error');
            return;
        }
        if (!this.state.wishlist.includes(bookId)) {
            this.state.wishlist.push(bookId);
            this.saveWishlist();
            this.render();
            MORI_APP.showToast('⭐ Книга добавлена в вишлист', 'success');
        }
    },

    /**
     * Удалить из вишлиста
     */
    removeFromWishlist: function(bookId) {
        this.state.wishlist = this.state.wishlist.filter(id => id !== bookId);
        this.saveWishlist();
        this.render();
        MORI_APP.showToast('🗑️ Книга удалена из вишлиста', 'info');
    },

    /**
     * Загрузка вишлиста
     */
    loadWishlist: function() {
        const saved = localStorage.getItem('library_wishlist');
        if (saved) {
            try {
                this.state.wishlist = JSON.parse(saved);
            } catch(e) {}
        }
    },

    /**
     * Сохранение вишлиста
     */
    saveWishlist: function() {
        localStorage.setItem('library_wishlist', JSON.stringify(this.state.wishlist));
    },

    /**
     * Загрузка меток
     */
    loadTags: function() {
        const saved = localStorage.getItem('library_book_tags');
        if (saved) {
            try {
                this.state.tags = JSON.parse(saved);
            } catch(e) {}
        }
    },

    /**
     * Сохранение меток
     */
    saveTags: function() {
        localStorage.setItem('library_book_tags', JSON.stringify(this.state.tags));
    },

    /**
     * Получение меток книги
     */
    getBookTags: function(bookId) {
        const tagIds = this.state.tags[bookId] || [];
        return tagIds.map(tagId => this.getTagById(tagId)).filter(t => t);
    },

    /**
     * Получение метки по ID
     */
         getTagById: function(tagId) {
        const tags = {
            favorite: { id: 'favorite', name: 'Любимое', icon: '⭐', color: '#ffd700' },
            later: { id: 'later', name: 'Отложенное', icon: '📌', color: '#00aaff' },
            important: { id: 'important', name: 'Важное', icon: '❗', color: '#ff4444' },
            reading: { id: 'reading', name: 'Читаю', icon: '📖', color: '#00ff88' },
            reread: { id: 'reread', name: 'Перечитать', icon: '🔄', color: '#aa80ff' },
            reference: { id: 'reference', name: 'Справочник', icon: '📚', color: '#ffaa00' },
            gift: { id: 'gift', name: 'Подарок', icon: '🎁', color: '#ff69b4' },
            borrowed: { id: 'borrowed', name: 'Взял почитать', icon: '📤', color: '#00cc99' }
        };
        return tags[tagId] || null;
    },

    // ЭТА ФУНКЦИЯ ДОЛЖНА БЫТЬ ВНУТРИ ОБЪЕКТА
    renderNotes: function() {
        const notes = MORI_LIBRARY_BOOKS.getNotes();
        if (notes.length === 0) return '';

        const noteItems = notes.slice(0, 10).map(note => {
            return `
                <div class="note-item" data-book-id="${note.bookId}" data-page="${note.page}">
                    <div class="note-icon">📝</div>
                    <div class="note-info">
                        <div class="note-title">${note.bookTitle}</div>
                        <div class="note-page">Страница ${note.page}</div>
                        <div class="note-text">${note.text.substring(0, 50)}${note.text.length > 50 ? '...' : ''}</div>
                        <div class="note-date">${new Date(note.date).toLocaleDateString()}</div>
                    </div>
                    <button class="note-delete" data-note-id="${note.id}">🗑️</button>
                </div>
            `;
        }).join('');

        return `
            <div class="notes-section">
                <div class="notes-header">
                    <h3>📝 Заметки</h3>
                    <span class="notes-count">${notes.length}</span>
                </div>
                <div class="notes-list">
                    ${noteItems}
                </div>
            </div>
        `;
    },

    // destroy ТОЖЕ ДОЛЖЕН БЫТЬ ВНУТРИ ОБЪЕКТА
    destroy: function() {
        this.saveWishlist();
        this.saveTags();
    }

};  // <--- ЭТО ЗАКРЫТИЕ ОБЪЕКТА MORI_LIBRARY

window.MORI_LIBRARY = MORI_LIBRARY;
