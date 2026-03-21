/**
 * DEMIGURGE BOOKS
 * Управление книгами в библиотеке
 * Версия: 1.0.0
 */

const MORI_DEMIGURGE_BOOKS = {
    // Состояние
    state: {
        books: [],
        filteredBooks: [],
        searchQuery: '',
        filter: 'all', // 'all', 'available', 'pending'
        selectedBook: null,
        showAddModal: false,
        showEditModal: false,
        showDeleteConfirm: false,
        showForceModal: false,
        editData: {},
        isLoading: false,
        uploadProgress: 0
    },

    // Категории книг
    categories: [
        'Финансы',
        'Философия',
        'Психология',
        'Биография',
        'Классика',
        'Наука',
        'Саморазвитие',
        'Художественная'
    ],

    /**
     * Инициализация
     */
    init: function() {
        console.log('MORI_DEMIGURGE_BOOKS инициализация...');
        this.loadBooks();
    },

    /**
     * Рендер
     */
    render: function() {
        const container = document.querySelector('.demigurge-container');
        if (!container) return;

        const panel = document.createElement('div');
        panel.className = 'admin-panel';
        panel.innerHTML = this.getHTML();
        
        const oldPanel = document.querySelector('.admin-panel');
        if (oldPanel) oldPanel.remove();
        
        container.appendChild(panel);
        this.attachEvents();
    },

    /**
     * HTML
     */
    getHTML: function() {
        this.filterBooks();
        
        return `
            <div class="panel-header">
                <h3>📚 Управление книгами</h3>
                <div class="panel-actions">
                    <button class="panel-btn" id="add-book">➕ Добавить книгу</button>
                    <button class="panel-btn" id="force-add">⚡ Принудительно всем</button>
                    <button class="panel-btn" id="export-books">📤 Экспорт</button>
                    <button class="panel-btn danger" id="refresh-books">🔄</button>
                </div>
            </div>

            <!-- Поиск и фильтры -->
            <div style="display: flex; gap: var(--spacing-md); margin-bottom: var(--spacing-md);">
                <input type="text" 
                       class="notification-input" 
                       id="search-books" 
                       placeholder="🔍 Поиск по названию, автору..."
                       value="${this.state.searchQuery}"
                       style="flex: 2;">

                <select class="notification-input" id="filter-books" style="flex: 1;">
                    <option value="all" ${this.state.filter === 'all' ? 'selected' : ''}>📋 Все книги</option>
                    <option value="available" ${this.state.filter === 'available' ? 'selected' : ''}>✅ С файлом</option>
                    <option value="pending" ${this.state.filter === 'pending' ? 'selected' : ''}>⏳ Без файла</option>
                </select>
            </div>

            <!-- Статистика -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--spacing-sm); margin-bottom: var(--spacing-md);">
                <div class="stat-card" style="padding: var(--spacing-sm);">
                    <div class="stat-number">${this.state.books.length}</div>
                    <div class="stat-label">Всего книг</div>
                </div>
                <div class="stat-card" style="padding: var(--spacing-sm);">
                    <div class="stat-number">${this.state.books.filter(b => b.file).length}</div>
                    <div class="stat-label">С файлом</div>
                </div>
                <div class="stat-card" style="padding: var(--spacing-sm);">
                    <div class="stat-number">${this.state.books.filter(b => !b.file).length}</div>
                    <div class="stat-label">Без файла</div>
                </div>
                <div class="stat-card" style="padding: var(--spacing-sm);">
                    <div class="stat-number">${this.getTotalSize()} MB</div>
                    <div class="stat-label">Общий размер</div>
                </div>
            </div>

            <!-- Индикатор загрузки -->
            ${this.state.isLoading ? this.renderProgress() : ''}

            <!-- Список книг -->
            <div class="books-admin-grid">
                ${this.renderBooks()}
            </div>

            <!-- Модальные окна -->
            ${this.state.showAddModal ? this.renderAddModal() : ''}
            ${this.state.showEditModal ? this.renderEditModal() : ''}
            ${this.state.showDeleteConfirm ? this.renderDeleteModal() : ''}
            ${this.state.showForceModal ? this.renderForceModal() : ''}
        `;
    },

    /**
     * Прогресс загрузки
     */
    renderProgress: function() {
        return `
            <div style="margin-bottom: var(--spacing-md);">
                <div style="display: flex; justify-content: space-between; margin-bottom: var(--spacing-xs);">
                    <span>Загрузка...</span>
                    <span>${this.state.uploadProgress}%</span>
                </div>
                <div style="height: 4px; background: rgba(255,215,0,0.2); border-radius: 2px;">
                    <div style="width: ${this.state.uploadProgress}%; height: 100%; background: var(--accent-primary); border-radius: 2px; transition: width 0.3s;"></div>
                </div>
            </div>
        `;
    },

    /**
     * Рендер книг
     */
    renderBooks: function() {
        if (this.state.filteredBooks.length === 0) {
            return `
                <div class="empty-apps" style="grid-column: 1/-1;">
                    <div class="empty-icon">📚</div>
                    <h3>Книги не найдены</h3>
                </div>
            `;
        }

        return this.state.filteredBooks.map(book => `
            <div class="book-admin-card" data-book-id="${book.id}">
                <div class="book-admin-cover">
                    ${book.cover ? 
                        `<img src="${book.cover}" alt="cover" style="width: 100%; height: 100%; object-fit: cover;">` : 
                        '<div style="font-size: 3rem;">📖</div>'
                    }
                    <span class="book-admin-status" title="${book.file ? 'Файл загружен' : 'Нужен файл'}">
                        ${book.file ? '✅' : '⏳'}
                    </span>
                </div>
                <div class="book-admin-info">
                    <div class="book-admin-title">${book.title}</div>
                    <div class="book-admin-author">${book.author}</div>
                    <div class="book-admin-meta">
                        <span>📄 ${book.pages} стр.</span>
                        ${book.file ? `<span>💾 ${book.size} MB</span>` : ''}
                        <span>👥 ${book.addedTo || 0} юзеров</span>
                    </div>
                    <div class="book-admin-actions">
                        <button class="book-admin-btn" data-action="edit" data-book-id="${book.id}">✎ Ред</button>
                        <button class="book-admin-btn" data-action="upload" data-book-id="${book.id}">
                            ${book.file ? '📤 Заменить' : '📥 Загрузить'}
                        </button>
                        <button class="book-admin-btn" data-action="force" data-book-id="${book.id}">
                            ⚡ Всем
                        </button>
                        <button class="book-admin-btn" data-action="delete" data-book-id="${book.id}">🗑️ Уд</button>
                    </div>
                    ${book.file ? `
                        <div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: var(--spacing-xs);">
                            📁 ${book.fileName}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    },

    /**
     * Модальное окно добавления
     */
    renderAddModal: function() {
        return `
            <div class="admin-modal" id="book-modal">
                <div class="admin-modal-content">
                    <div class="admin-modal-header">
                        <h3>➕ Добавление книги</h3>
                        <button class="admin-modal-close" id="close-modal">✕</button>
                    </div>

                    <div class="admin-modal-field">
                        <label class="admin-modal-label">Название книги *</label>
                        <input type="text" class="admin-modal-input" id="book-title" 
                               placeholder="Введите название" required>
                    </div>

                    <div class="admin-modal-field">
                        <label class="admin-modal-label">Автор *</label>
                        <input type="text" class="admin-modal-input" id="book-author" 
                               placeholder="Введите автора" required>
                    </div>

                    <div class="admin-modal-field">
                        <label class="admin-modal-label">Категория</label>
                        <select class="admin-modal-select" id="book-category">
                            ${this.categories.map(cat => `
                                <option value="${cat}">${cat}</option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="admin-modal-field">
                        <label class="admin-modal-label">Обложка (изображение)</label>
                        <input type="file" class="admin-modal-input" id="book-cover-file" 
                               accept="image/*">
                        <small style="color: var(--text-secondary);">Рекомендуемый размер: 200x300px</small>
                    </div>

                    <div class="admin-modal-field">
                        <label class="admin-modal-label">Файл книги</label>
                        <input type="file" class="admin-modal-input" id="book-file" 
                               accept=".txt,.pdf,.epub">
                        <small style="color: var(--text-secondary);">Можно загрузить позже</small>
                    </div>

                    <div class="admin-modal-field">
                        <label class="admin-modal-label">Количество страниц</label>
                        <input type="number" class="admin-modal-input" id="book-pages" 
                               value="100" min="1" max="9999">
                    </div>

                    <div class="admin-modal-field">
                        <label class="admin-modal-label">Описание</label>
                        <textarea class="admin-modal-input" id="book-description" 
                                  rows="3" placeholder="Краткое описание книги"></textarea>
                    </div>

                    <div class="admin-modal-actions">
                        <button class="admin-modal-btn primary" id="save-book">💾 Добавить</button>
                        <button class="admin-modal-btn secondary" id="cancel-modal">Отмена</button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Модальное окно редактирования
     */
    renderEditModal: function() {
        const book = this.state.selectedBook;
        if (!book) return '';

        return `
            <div class="admin-modal" id="book-modal">
                <div class="admin-modal-content">
                    <div class="admin-modal-header">
                        <h3>✎ Редактирование</h3>
                        <button class="admin-modal-close" id="close-modal">✕</button>
                    </div>

                    <div class="admin-modal-field">
                        <label class="admin-modal-label">Название книги</label>
                        <input type="text" class="admin-modal-input" id="book-title" 
                               value="${book.title || ''}">
                    </div>

                    <div class="admin-modal-field">
                        <label class="admin-modal-label">Автор</label>
                        <input type="text" class="admin-modal-input" id="book-author" 
                               value="${book.author || ''}">
                    </div>

                    <div class="admin-modal-field">
                        <label class="admin-modal-label">Категория</label>
                        <select class="admin-modal-select" id="book-category">
                            ${this.categories.map(cat => `
                                <option value="${cat}" ${book.category === cat ? 'selected' : ''}>${cat}</option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="admin-modal-field">
                        <label class="admin-modal-label">Обложка</label>
                        ${book.cover ? `
                            <div style="margin-bottom: var(--spacing-xs);">
                                <img src="${book.cover}" style="max-width: 100px; max-height: 150px; border-radius: var(--radius-sm);">
                            </div>
                        ` : ''}
                        <input type="file" class="admin-modal-input" id="book-cover-file" accept="image/*">
                        <small style="color: var(--text-secondary);">Оставьте пустым, чтобы не менять</small>
                    </div>

                    <div class="admin-modal-field">
                        <label class="admin-modal-label">Файл книги</label>
                        ${book.fileName ? `
                            <div style="margin-bottom: var(--spacing-xs); color: var(--text-secondary);">
                                Текущий: ${book.fileName} (${book.size} MB)
                            </div>
                        ` : ''}
                        <input type="file" class="admin-modal-input" id="book-file" 
                               accept=".txt,.pdf,.epub">
                        <small style="color: var(--text-secondary);">Оставьте пустым, чтобы не менять</small>
                    </div>

                    <div class="admin-modal-field">
                        <label class="admin-modal-label">Количество страниц</label>
                        <input type="number" class="admin-modal-input" id="book-pages" 
                               value="${book.pages || 100}" min="1" max="9999">
                    </div>

                    <div class="admin-modal-field">
                        <label class="admin-modal-label">Описание</label>
                        <textarea class="admin-modal-input" id="book-description" 
                                  rows="3">${book.description || ''}</textarea>
                    </div>

                    <div class="admin-modal-actions">
                        <button class="admin-modal-btn primary" id="save-book">💾 Сохранить</button>
                        <button class="admin-modal-btn secondary" id="cancel-modal">Отмена</button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Модальное окно подтверждения удаления
     */
    renderDeleteModal: function() {
        const book = this.state.selectedBook;
        
        return `
            <div class="admin-modal" id="delete-modal">
                <div class="admin-modal-content">
                    <div class="admin-modal-header">
                        <h3>🗑️ Подтверждение удаления</h3>
                        <button class="admin-modal-close" id="close-modal">✕</button>
                    </div>

                    <div style="text-align: center; padding: var(--spacing-lg);">
                        <div style="font-size: 3rem; margin-bottom: var(--spacing-md);">📚</div>
                        <h3 style="margin-bottom: var(--spacing-md);">Удалить книгу?</h3>
                        <p style="color: var(--text-secondary); margin-bottom: var(--spacing-lg);">
                            "${book?.title}" ${book?.author ? `— ${book.author}` : ''}
                        </p>
                        <p style="color: #ff4444; margin-bottom: var(--spacing-lg);">
                            Это действие нельзя отменить. Книга исчезнет у всех пользователей.
                        </p>
                    </div>

                    <div class="admin-modal-actions">
                        <button class="admin-modal-btn danger" id="confirm-delete">🗑️ Удалить</button>
                        <button class="admin-modal-btn secondary" id="cancel-modal">Отмена</button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Модальное окно принудительной отправки
     */
    renderForceModal: function() {
        const book = this.state.selectedBook;
        
        return `
            <div class="admin-modal" id="force-modal">
                <div class="admin-modal-content">
                    <div class="admin-modal-header">
                        <h3>⚡ Принудительная отправка</h3>
                        <button class="admin-modal-close" id="close-modal">✕</button>
                    </div>

                    <div style="padding: var(--spacing-lg);">
                        <p style="margin-bottom: var(--spacing-md);">
                            Книга будет добавлена <strong>всем пользователям</strong> принудительно.
                        </p>
                        
                        <div style="background: rgba(0,0,0,0.3); border-radius: var(--radius-lg); padding: var(--spacing-md); margin-bottom: var(--spacing-md);">
                            <div style="font-weight: 600; margin-bottom: var(--spacing-sm);">${book?.title}</div>
                            <div style="color: var(--text-secondary);">${book?.author}</div>
                        </div>

                        <p style="color: var(--text-secondary); font-size: 0.9rem;">
                            Пользователи получат уведомление о новой книге.
                        </p>
                    </div>

                    <div class="admin-modal-actions">
                        <button class="admin-modal-btn primary" id="confirm-force">⚡ Отправить всем</button>
                        <button class="admin-modal-btn secondary" id="cancel-modal">Отмена</button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Обработчики
     */
    attachEvents: function() {
        // Поиск
        const searchInput = document.getElementById('search-books');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.state.searchQuery = e.target.value;
                this.render();
            });
        }

        // Фильтр
        const filterSelect = document.getElementById('filter-books');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.state.filter = e.target.value;
                this.render();
            });
        }

        // Добавление книги
        document.getElementById('add-book')?.addEventListener('click', () => {
            this.state.showAddModal = true;
            this.render();
        });

        // Принудительное добавление всем
        document.getElementById('force-add')?.addEventListener('click', () => {
            this.state.showForceModal = true;
            this.state.selectedBook = null;
            this.render();
        });

        // Экспорт
        document.getElementById('export-books')?.addEventListener('click', () => {
            this.exportBooks();
        });

        // Обновление
        document.getElementById('refresh-books')?.addEventListener('click', () => {
            this.loadBooks();
            this.render();
            MORI_APP.showToast('Список книг обновлён', 'success');
        });

        // Действия с книгами
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = e.target.dataset.action;
                const bookId = parseInt(e.target.dataset.bookId);
                
                switch(action) {
                    case 'edit':
                        this.editBook(bookId);
                        break;
                    case 'upload':
                        this.uploadBookFile(bookId);
                        break;
                    case 'force':
                        this.forceAddToAll(bookId);
                        break;
                    case 'delete':
                        this.confirmDelete(bookId);
                        break;
                }
            });
        });

        // Модальные окна
        document.getElementById('close-modal')?.addEventListener('click', () => {
            this.closeAllModals();
        });

        document.getElementById('cancel-modal')?.addEventListener('click', () => {
            this.closeAllModals();
        });

        document.getElementById('save-book')?.addEventListener('click', () => {
            if (this.state.showAddModal) {
                this.addBook();
            } else if (this.state.showEditModal) {
                this.updateBook();
            }
        });

        document.getElementById('confirm-delete')?.addEventListener('click', () => {
            this.deleteBook();
        });

        document.getElementById('confirm-force')?.addEventListener('click', () => {
            this.executeForceAdd();
        });

        // Закрытие по клику вне модалки
        document.getElementById('book-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'book-modal') this.closeAllModals();
        });

        document.getElementById('delete-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'delete-modal') this.closeAllModals();
        });

        document.getElementById('force-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'force-modal') this.closeAllModals();
        });
    },

    /**
     * Фильтрация книг
     */
    filterBooks: function() {
        let filtered = [...this.state.books];

        if (this.state.searchQuery) {
            const query = this.state.searchQuery.toLowerCase();
            filtered = filtered.filter(book => 
                book.title.toLowerCase().includes(query) ||
                book.author.toLowerCase().includes(query)
            );
        }

        switch(this.state.filter) {
            case 'available':
                filtered = filtered.filter(book => book.file);
                break;
            case 'pending':
                filtered = filtered.filter(book => !book.file);
                break;
        }

        this.state.filteredBooks = filtered;
    },

    /**
     * Добавление книги
     */
    addBook: async function() {
        const title = document.getElementById('book-title')?.value;
        const author = document.getElementById('book-author')?.value;
        
        if (!title || !author) {
            MORI_APP.showToast('Заполните название и автора', 'error');
            return;
        }

        this.setState({ isLoading: true, uploadProgress: 0 });

        const book = {
            id: Date.now(),
            title,
            author,
            category: document.getElementById('book-category')?.value || 'Другое',
            pages: parseInt(document.getElementById('book-pages')?.value) || 100,
            description: document.getElementById('book-description')?.value || '',
            addedTo: 0,
            createdAt: Date.now()
        };

        // Загрузка обложки
        const coverFile = document.getElementById('book-cover-file')?.files[0];
        if (coverFile) {
            try {
                this.state.uploadProgress = 30;
                this.render();
                
                // TODO: загрузить на сервер
                book.cover = await this.uploadImage(coverFile);
                
                this.state.uploadProgress = 60;
                this.render();
            } catch (error) {
                console.error('Error uploading cover:', error);
            }
        }

        // Загрузка файла книги
        const bookFile = document.getElementById('book-file')?.files[0];
        if (bookFile) {
            try {
                this.state.uploadProgress = 80;
                this.render();
                
                // TODO: загрузить на сервер
                const fileData = await this.uploadFile(bookFile);
                book.file = fileData.url;
                book.fileName = bookFile.name;
                book.size = Math.round(bookFile.size / (1024 * 1024) * 10) / 10;
                
                this.state.uploadProgress = 100;
                this.render();
            } catch (error) {
                console.error('Error uploading file:', error);
            }
        }

        this.state.books.push(book);
        await this.saveBooks();
        
        setTimeout(() => {
            this.setState({ isLoading: false, showAddModal: false });
            MORI_APP.showToast(`✅ Книга "${title}" добавлена`, 'success');
        }, 500);
    },

    /**
     * Редактирование книги
     */
    editBook: function(bookId) {
        const book = this.state.books.find(b => b.id === bookId);
        if (book) {
            this.state.selectedBook = book;
            this.state.showEditModal = true;
            this.render();
        }
    },

    /**
     * Обновление книги
     */
    updateBook: async function() {
        const book = this.state.selectedBook;
        if (!book) return;

        this.setState({ isLoading: true });

        // Обновляем текстовые поля
        book.title = document.getElementById('book-title')?.value || book.title;
        book.author = document.getElementById('book-author')?.value || book.author;
        book.category = document.getElementById('book-category')?.value || book.category;
        book.pages = parseInt(document.getElementById('book-pages')?.value) || book.pages;
        book.description = document.getElementById('book-description')?.value || book.description;

        // Загрузка новой обложки
        const coverFile = document.getElementById('book-cover-file')?.files[0];
        if (coverFile) {
            try {
                // TODO: загрузить на сервер
                book.cover = await this.uploadImage(coverFile);
            } catch (error) {
                console.error('Error uploading cover:', error);
            }
        }

        // Загрузка нового файла
        const bookFile = document.getElementById('book-file')?.files[0];
        if (bookFile) {
            try {
                const fileData = await this.uploadFile(bookFile);
                book.file = fileData.url;
                book.fileName = bookFile.name;
                book.size = Math.round(bookFile.size / (1024 * 1024) * 10) / 10;
            } catch (error) {
                console.error('Error uploading file:', error);
            }
        }

        await this.saveBooks();
        
        this.setState({ isLoading: false, showEditModal: false, selectedBook: null });
        MORI_APP.showToast(`✅ Книга обновлена`, 'success');
    },

    /**
     * Подтверждение удаления
     */
    confirmDelete: function(bookId) {
        const book = this.state.books.find(b => b.id === bookId);
        if (book) {
            this.state.selectedBook = book;
            this.state.showDeleteConfirm = true;
            this.render();
        }
    },

    /**
     * Удаление книги
     */
    deleteBook: async function() {
        const book = this.state.selectedBook;
        if (!book) return;

        this.state.books = this.state.books.filter(b => b.id !== book.id);
        await this.saveBooks();
        
        this.closeAllModals();
        MORI_APP.showToast(`🗑️ Книга "${book.title}" удалена`, 'info');
    },

    /**
     * Принудительное добавление всем
     */
    forceAddToAll: function(bookId) {
        const book = this.state.books.find(b => b.id === bookId);
        if (book) {
            this.state.selectedBook = book;
            this.state.showForceModal = true;
            this.render();
        }
    },

    /**
     * Выполнить принудительное добавление
     */
    executeForceAdd: async function() {
        const book = this.state.selectedBook;
        if (!book) return;

        // Увеличиваем счётчик
        book.addedTo = (book.addedTo || 0) + 1000; // примерно
        
        // Отправляем уведомления
        MORI_APP.showToast(`📢 Книга "${book.title}" отправлена всем пользователям`, 'success');
        
        // TODO: реальная отправка на сервер
        console.log('Force add book to all users:', book);

        this.closeAllModals();
        this.render();
    },

    /**
     * Загрузка файла книги
     */
    uploadBookFile: function(bookId) {
        const book = this.state.books.find(b => b.id === bookId);
        if (!book) return;

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,.pdf,.epub';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            this.setState({ isLoading: true, uploadProgress: 0 });

            try {
                // Имитация загрузки
                for (let i = 0; i <= 100; i += 10) {
                    this.state.uploadProgress = i;
                    this.render();
                    await new Promise(r => setTimeout(r, 100));
                }

                // TODO: реальная загрузка на сервер
                const fileData = await this.uploadFile(file);
                
                book.file = fileData.url;
                book.fileName = file.name;
                book.size = Math.round(file.size / (1024 * 1024) * 10) / 10;

                await this.saveBooks();
                
                MORI_APP.showToast(`📥 Файл "${file.name}" загружен`, 'success');
            } catch (error) {
                MORI_APP.showToast('Ошибка загрузки файла', 'error');
            } finally {
                this.setState({ isLoading: false });
            }
        };

        input.click();
    },

    /**
     * Загрузка изображения (заглушка, потом заменить на реальный API)
     */
    uploadImage: async function(file) {
        // TODO: заменить на реальную загрузку
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    },

    /**
     * Загрузка файла (заглушка, потом заменить на реальный API)
     */
    uploadFile: async function(file) {
        // TODO: заменить на реальную загрузку
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    url: URL.createObjectURL(file),
                    name: file.name
                });
            }, 1000);
        });
    },

    /**
     * Получить общий размер
     */
    getTotalSize: function() {
        const total = this.state.books.reduce((sum, b) => sum + (b.size || 0), 0);
        return Math.round(total * 10) / 10;
    },

    /**
     * Закрыть все модалки
     */
    closeAllModals: function() {
        this.state.showAddModal = false;
        this.state.showEditModal = false;
        this.state.showDeleteConfirm = false;
        this.state.showForceModal = false;
        this.state.selectedBook = null;
        this.render();
    },

    /**
     * Экспорт книг
     */
    exportBooks: function() {
        const data = {
            exportDate: Date.now(),
            count: this.state.books.length,
            books: this.state.books
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `books_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        MORI_APP.showToast('📤 Книги экспортированы', 'success');
    },

    /**
     * Сохранение книг
     */
    saveBooks: function() {
        localStorage.setItem('admin_books', JSON.stringify(this.state.books));
    },

    /**
     * Загрузка книг
     */
    loadBooks: function() {
        const saved = localStorage.getItem('admin_books');
        if (saved) {
            this.state.books = JSON.parse(saved);
        } else {
            this.state.books = [
                {
                    id: 1,
                    title: 'Самый богатый человек в Вавилоне',
                    author: 'Джордж Клейсон',
                    category: 'Финансы',
                    cover: null,
                    pages: 120,
                    description: 'Классика финансовой литературы',
                    file: true,
                    fileName: 'babylon.txt',
                    size: 2.4,
                    addedTo: 1234
                },
                {
                    id: 2,
                    title: 'Богатый папа, бедный папа',
                    author: 'Роберт Кийосаки',
                    category: 'Финансы',
                    cover: null,
                    pages: 336,
                    description: 'Что богатые учат своих детей',
                    file: true,
                    fileName: 'rich_dad.txt',
                    size: 3.1,
                    addedTo: 987
                }
            ];
        }
        this.filterBooks();
    },

    /**
     * Обновление состояния
     */
    setState: function(newState) {
        this.state = { ...this.state, ...newState };
        this.render();
    }
};

// Экспорт
window.MORI_DEMIGURGE_BOOKS = MORI_DEMIGURGE_BOOKS;
