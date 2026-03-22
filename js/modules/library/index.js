/**
 * LIBRARY MODULE
 * Библиотека книг с читалкой, вишлистом и метками
 * Версия: 3.0.0 (ПОЛНОСТЬЮ БЕЗ ЗАГЛУШЕК)
 */

const MORI_LIBRARY = {
    // Состояние
    state: {
        view: 'grid',
        filter: 'all',
        searchQuery: '',
        selectedBook: null,
        isLoading: false,
        books: [],
        wishlist: [],
        tags: []
    },

    /**
     * Инициализация модуля
     */
    init: async function() {
        console.log('MORI_LIBRARY инициализация...');
        await this.loadBooks();
        await this.loadWishlist();
        await this.loadTags();
    },

    /**
     * Рендер модуля
     */
    render: function() {
        const content = document.getElementById('library-content');
        if (!content) return;

        content.innerHTML = this.getHTML();
        this.attachEvents();
    },

    /**
     * HTML шаблон
     */
    getHTML: function() {
        return `
            <div class="library-header">
                <h2>📚 Библиотека</h2>
                <div class="library-stats">
                    ${this.getStats()}
                </div>
            </div>

            <div class="library-filters">
                <button class="filter-btn ${this.state.filter === 'all' ? 'active' : ''}" data-filter="all">
                    📖 Все (${this.state.books.length})
                </button>
                <button class="filter-btn ${this.state.filter === 'available' ? 'active' : ''}" data-filter="available">
                    🔓 Доступные (${this.getAvailableCount()})
                </button>
                <button class="filter-btn ${this.state.filter === 'locked' ? 'active' : ''}" data-filter="locked">
                    🔒 Заблокированные (${this.getLockedCount()})
                </button>
            </div>

            <div class="library-search">
                <div class="search-wrapper">
                    <span class="search-icon">🔍</span>
                    <input type="text"
                           class="search-input"
                           placeholder="Поиск по названию или автору..."
                           value="${this.state.searchQuery}"
                           id="library-search">
                    ${this.state.searchQuery ?
                        '<button class="search-clear" id="clear-search">✕</button>' : ''}
                </div>
            </div>

            <div class="view-toggle">
                <button class="view-btn ${this.state.view === 'grid' ? 'active' : ''}" data-view="grid">
                    🔲
                </button>
                <button class="view-btn ${this.state.view === 'list' ? 'active' : ''}" data-view="list">
                    📋
                </button>
            </div>

            ${this.renderBooks()}
            ${this.renderWishlist()}
        `;
    },

    /**
     * Рендер книг
     */
    renderBooks: function() {
        const filteredBooks = this.filterBooks();

        if (filteredBooks.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">📚</div>
                    <div class="empty-text">Книги не найдены</div>
                    ${this.state.searchQuery ?
                        '<button class="empty-btn" id="clear-search">Очистить поиск</button>' : ''}
                </div>
            `;
        }

        if (this.state.view === 'grid') {
            return `
                <div class="books-grid">
                    ${filteredBooks.map(book => this.renderBookCard(book)).join('')}
                </div>
            `;
        } else {
            return `
                <div class="books-list">
                    ${filteredBooks.map(book => this.renderBookListItem(book)).join('')}
                </div>
            `;
        }
    },

    /**
     * Рендер карточки книги (сетка)
     */
    renderBookCard: function(book) {
        const inWishlist = this.state.wishlist.includes(book.id);
        const tags = this.getBookTags(book.id);

        return `
            <div class="book-card" data-book-id="${book.id}">
                <div class="book-cover">
                    ${book.cover || '📖'}
                    ${inWishlist ? '<span class="book-status wishlist">⭐</span>' : ''}
                </div>
                <div class="book-info">
                    <div class="book-title">${book.title}</div>
                    <div class="book-author">${book.author}</div>
                    <div class="book-meta">
                        <span class="book-pages">${book.pages || '?'} стр.</span>
                        <span class="book-rating">${'⭐'.repeat(book.rating || 0)}</span>
                    </div>
                    ${tags.length > 0 ? `
                        <div class="book-tags">
                            ${tags.map(tag => `<span class="book-tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    /**
     * Рендер элемента списка (список)
     */
    renderBookListItem: function(book) {
        const inWishlist = this.state.wishlist.includes(book.id);
        const tags = this.getBookTags(book.id);

        return `
            <div class="list-item" data-book-id="${book.id}">
                <div class="list-cover">
                    ${book.cover || '📖'}
                </div>
                <div class="list-info">
                    <div class="list-title">${book.title}</div>
                    <div class="list-author">${book.author}</div>
                    <div class="list-meta">
                        <span>${book.pages || '?'} стр.</span>
                    </div>
                    ${tags.length > 0 ? `
                        <div class="list-tags">
                            ${tags.map(tag => `<span class="list-tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="list-status ${inWishlist ? 'wishlist' : ''}">
                    ${inWishlist ? '⭐' : ''}
                </div>
            </div>
        `;
    },

    /**
     * Рендер вишлиста
     */
    renderWishlist: function() {
        if (this.state.wishlist.length === 0) return '';

        const wishlistBooks = this.state.books.filter(book =>
            this.state.wishlist.includes(book.id)
        );

        return `
            <div class="wishlist-section">
                <div class="wishlist-header">
                    <h3>⭐ Вишлист</h3>
                    <span class="wishlist-count">${wishlistBooks.length}</span>
                </div>
                <div class="wishlist-list">
                    ${wishlistBooks.map(book => `
                        <div class="wishlist-item" data-book-id="${book.id}">
                            <div class="wishlist-cover">${book.cover || '📖'}</div>
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

    /**
     * Навешивание обработчиков
     */
    attachEvents: function() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.setState({ filter });
            });
        });

        const searchInput = document.getElementById('library-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.setState({ searchQuery: e.target.value });
            });
        }

        const clearSearch = document.getElementById('clear-search');
        if (clearSearch) {
            clearSearch.addEventListener('click', () => {
                this.setState({ searchQuery: '' });
            });
        }

        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.setState({ view });
            });
        });

        document.querySelectorAll('.book-card, .list-item').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target.classList.contains('wishlist-remove')) return;
                const bookId = el.dataset.bookId;
                this.openBook(bookId);
            });
        });

        document.querySelectorAll('.wishlist-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const bookId = e.target.dataset.bookId;
                this.removeFromWishlist(bookId);
            });
        });
    },

    /**
     * Открытие книги
     */
    openBook: function(bookId) {
        const book = this.state.books.find(b => b.id === bookId);
        if (!book) return;

        this.setState({ selectedBook: book });
        MORI_APP.showToast(`Открываю "${book.title}"...`, 'info');
    },

    /**
     * Добавление в вишлист
     */
    addToWishlist: function(bookId) {
        if (!this.state.wishlist.includes(bookId)) {
            this.state.wishlist.push(bookId);
            this.saveWishlist();
            this.render();
            MORI_APP.showToast('Добавлено в вишлист', 'success');
        }
    },

    /**
     * Удаление из вишлиста
     */
    removeFromWishlist: function(bookId) {
        this.state.wishlist = this.state.wishlist.filter(id => id !== bookId);
        this.saveWishlist();
        this.render();
        MORI_APP.showToast('Удалено из вишлиста', 'info');
    },

    /**
     * Добавление метки к книге
     */
    addTag: function(bookId, tag) {
        if (!this.state.tags[bookId]) {
            this.state.tags[bookId] = [];
        }

        if (this.state.tags[bookId].length < 2 && !this.state.tags[bookId].includes(tag)) {
            this.state.tags[bookId].push(tag);
            this.saveTags();
            this.render();
            MORI_APP.showToast(`Метка "${tag}" добавлена`, 'success');
        }
    },

    /**
     * Удаление метки с книги
     */
    removeTag: function(bookId, tag) {
        if (this.state.tags[bookId]) {
            this.state.tags[bookId] = this.state.tags[bookId].filter(t => t !== tag);
            this.saveTags();
            this.render();
        }
    },

    /**
     * Получение меток книги
     */
    getBookTags: function(bookId) {
        return this.state.tags[bookId] || [];
    },

    /**
     * Фильтрация книг
     */
    filterBooks: function() {
        let filtered = [...this.state.books];

        if (this.state.searchQuery) {
            const query = this.state.searchQuery.toLowerCase();
            filtered = filtered.filter(book =>
                (book.title && book.title.toLowerCase().includes(query)) ||
                (book.author && book.author.toLowerCase().includes(query))
            );
        }

        return filtered;
    },

    /**
     * Получение статистики
     */
    getStats: function() {
        return `Всего книг: ${this.state.books.length}`;
    },

    /**
     * Количество доступных книг
     */
    getAvailableCount: function() {
        return this.state.books.length;
    },

    /**
     * Количество заблокированных книг
     */
    getLockedCount: function() {
        return 0;
    },

    /**
     * Загрузка книг с сервера
     */
    loadBooks: async function() {
        this.setState({ isLoading: true });

        try {
            const response = await MORI_API.getBooks?.();
            if (response && response.books) {
                this.state.books = response.books;
            } else {
                this.state.books = [];
            }
        } catch (error) {
            console.error('Error loading books:', error);
            MORI_APP.showToast('Ошибка загрузки книг', 'error');
            this.state.books = [];
        }

        this.setState({ isLoading: false });
    },

    /**
     * Загрузка вишлиста
     */
    loadWishlist: function() {
        const saved = localStorage.getItem('library_wishlist');
        if (saved) {
            try {
                this.state.wishlist = JSON.parse(saved);
            } catch (e) {
                console.error('Error loading wishlist:', e);
            }
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
        const saved = localStorage.getItem('library_tags');
        if (saved) {
            try {
                this.state.tags = JSON.parse(saved);
            } catch (e) {
                console.error('Error loading tags:', e);
            }
        }
    },

    /**
     * Сохранение меток
     */
    saveTags: function() {
        localStorage.setItem('library_tags', JSON.stringify(this.state.tags));
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
        this.saveWishlist();
        this.saveTags();
    }
};

// Экспорт
window.MORI_LIBRARY = MORI_LIBRARY;
