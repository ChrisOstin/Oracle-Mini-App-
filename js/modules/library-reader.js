/**
 * LIBRARY READER — читалка книг с настройками
 * Версия: 1.0.0 (с нуля)
 */

const MORI_LIBRARY_READER = {
    // Состояние читалки
    state: {
        isOpen: false,
        currentBook: null,
        currentPage: 1,
        totalPages: 0,
        content: [],
        fontSize: 18,
        fontFamily: 'Inter, sans-serif',
        lineHeight: 1.5,
        theme: 'dark',
        readingTimer: null,
        timerStart: null,
        pageReadFlag: false,
        searchQuery: '',
        searchResults: [],
        searchCurrentIndex: -1
    },

    // Доступные шрифты
    fonts: [
        { name: 'Inter', value: 'Inter, sans-serif' },
        { name: 'Roboto', value: 'Roboto, sans-serif' },
        { name: 'Arial', value: 'Arial, sans-serif' },
        { name: 'Georgia', value: 'Georgia, serif' },
        { name: 'Courier New', value: 'Courier New, monospace' }
    ],

    // Темы оформления
    themes: {
        dark: {
            background: '#0a0a0a',
            text: '#e5e5e5',
            accent: '#ffd700',
            border: '#333'
        },
        light: {
            background: '#ffffff',
            text: '#000000',
            accent: '#d4af37',
            border: '#e5e5e5'
        },
        sepia: {
            background: '#fbf0d9',
            text: '#5b4636',
            accent: '#b85e00',
            border: '#d9c8b2'
        }
    },

    /**
     * Открыть книгу
     */
    open: async function(book) {
        this.state.currentBook = book;
        this.state.totalPages = book.pages || 1;


        // Сначала проверяем, есть ли встроенный контент в самой книге
if (book.content && book.content.length) {
    this.state.content = book.content;
    this.state.totalPages = book.content.length;
} else {
    const savedContent = MORI_LIBRARY_BOOKS.loadContent(book.id);
    if (savedContent && savedContent.pages) {
        this.state.content = savedContent.pages;
        this.state.totalPages = savedContent.pages.length;
    } else {
        this.state.content = ['<p>Контент книги не загружен</p>'];
    }
}


        const progress = MORI_LIBRARY_BOOKS.getProgress(book.id);
        this.state.currentPage = progress.page || 1;

        this.state.isOpen = true;
        this.renderReader();
    },

    /**
     * Закрыть читалку
     */
    close: function() {
        this.stopReadingTimer();
        this.saveProgress();
        this.state.isOpen = false;
        if (window.MORI_LIBRARY) {
            MORI_LIBRARY.render();
        }
    },

    /**
     * Поиск по тексту книги
     */
    searchInBook: function(query) {
        if (!query || query.trim() === '') {
            this.state.searchResults = [];
            this.state.searchCurrentIndex = -1;
            this.renderReader();
            return;
        }

        const searchTerm = query.toLowerCase();
        const results = [];

        for (let i = 0; i < this.state.content.length; i++) {
            const page = this.state.content[i];
            const text = page.replace(/<[^>]*>/g, ' ');

            if (text.toLowerCase().includes(searchTerm)) {
                const index = text.toLowerCase().indexOf(searchTerm);
                let preview = text.substring(Math.max(0, index - 40), Math.min(text.length, index + searchTerm.length + 40));
                if (index > 40) preview = '...' + preview;
                if (index + searchTerm.length + 40 < text.length) preview = preview + '...';

                results.push({
                    page: i + 1,
                    preview: preview
                });
            }
        }

        this.state.searchQuery = query;
        this.state.searchResults = results;
        this.state.searchCurrentIndex = results.length > 0 ? 0 : -1;

        this.renderReader();

        if (results.length === 0) {
            MORI_APP.showToast('🔍 Ничего не найдено', 'info');
        } else {
            MORI_APP.showToast(`🔍 Найдено ${results.length} страниц`, 'success');
            setTimeout(() => this.goToSearchResult(0), 200);
        }
    },

    /**
     * Перейти к результату поиска
     */
    goToSearchResult: function(index) {
        if (this.state.searchResults.length === 0) return;
        if (index < 0) index = 0;
        if (index >= this.state.searchResults.length) index = this.state.searchResults.length - 1;

        this.state.searchCurrentIndex = index;
        const result = this.state.searchResults[index];
        this.state.currentPage = result.page;
        this.renderReader();

        this.updateSearchNav();
        setTimeout(() => this.highlightSearchTerm(), 100);
    },

    /**
     * Обновить панель навигации поиска
     */
    updateSearchNav: function() {
        const searchNav = document.getElementById('reader-search-nav');
        const counter = document.getElementById('search-counter');
        const searchResultsDiv = document.getElementById('reader-search-results');

        if (!searchNav) return;

        if (this.state.searchResults.length > 0) {
            searchNav.style.display = 'flex';
            if (counter) {
                counter.textContent = `${this.state.searchCurrentIndex + 1}/${this.state.searchResults.length}`;
            }

            if (searchResultsDiv) {
                searchResultsDiv.innerHTML = `
                    <div class="search-results-list">
                        ${this.state.searchResults.map((result, idx) => `
                            <div class="search-result-item ${idx === this.state.searchCurrentIndex ? 'active' : ''}" data-page="${result.page}">
                                <span class="search-result-page">Страница ${result.page}</span>
                                <span class="search-result-preview">${result.preview}</span>
                            </div>
                        `).join('')}
                    </div>
                `;

                document.querySelectorAll('.search-result-item').forEach(item => {
                    item.onclick = () => {
                        const page = parseInt(item.dataset.page);
                        const idx = this.state.searchResults.findIndex(r => r.page === page);
                        if (idx !== -1) {
                            this.goToSearchResult(idx);
                        }
                    };
                });
            }
        } else {
            searchNav.style.display = 'none';
            if (searchResultsDiv && this.state.searchQuery) {
                searchResultsDiv.innerHTML = '<div class="search-no-results">Ничего не найдено</div>';
            }
        }
    },

    /**
     * Подсветка найденного слова на странице
     */
    highlightSearchTerm: function() {
        const content = document.getElementById('reader-content');
        if (!content || !this.state.searchQuery) return;

        const searchTerm = this.state.searchQuery.toLowerCase();

        const walker = document.createTreeWalker(
            content,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    if (node.parentElement?.classList?.contains('search-highlight')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const nodesToReplace = [];
        while (walker.nextNode()) {
            const node = walker.currentNode;
            const text = node.textContent;
            if (text.toLowerCase().includes(searchTerm)) {
                nodesToReplace.push(node);
            }
        }

        nodesToReplace.forEach(node => {
            const span = document.createElement('span');
            const text = node.textContent;
            const regex = new RegExp(`(${this.escapeRegex(searchTerm)})`, 'gi');
            span.innerHTML = text.replace(regex, '<mark class="search-highlight">$1</mark>');
            node.parentNode.replaceChild(span, node);
        });
    },

    /**
     * Экранирование спецсимволов для регулярного выражения
     */
    escapeRegex: function(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },

    /**
     * Закрыть поиск
     */
    closeSearch: function() {
        this.state.searchQuery = '';
        this.state.searchResults = [];
        this.state.searchCurrentIndex = -1;
        this.renderReader();
    },

    /**
     * Рендер читалки
     */
renderReader: function() {
    const appDiv = document.getElementById('app');
    if (!appDiv) return;

    const theme = this.themes[this.state.theme];
    const currentContent = this.state.content[this.state.currentPage - 1] || '<p>Страница не найдена</p>';
    const progressPercent = (this.state.currentPage / this.state.totalPages) * 100;

    appDiv.innerHTML = `
        <div class="reader-mori">
            <div class="reader-mori-container" style="background: ${theme.background}; color: ${theme.text};">
                <div class="reader-mori-header" style="border-bottom: 1px solid ${theme.border};">
                    <button class="reader-mori-back" id="reader-close">← Назад</button>
                    <div class="reader-mori-title">${this.state.currentBook.title}</div>
                    <button class="reader-mori-settings" id="reader-settings">⚙️</button>
                </div>
                <div class="reader-mori-progress">
                    <div class="reader-mori-progress-bar" style="width: ${progressPercent}%; background: ${theme.accent};"></div>
                </div>
                <div class="reader-mori-content" id="reader-content" 
                     style="font-family: ${this.state.fontFamily}; font-size: ${this.state.fontSize}px; line-height: ${this.state.lineHeight};">
                    ${currentContent}
                </div>
                <div class="reader-mori-footer" style="border-top: 1px solid ${theme.border};">
                    <button class="reader-mori-nav" id="reader-prev" ${this.state.currentPage === 1 ? 'disabled' : ''}>◀ Пред.</button>
                    <span class="reader-mori-page">${this.state.currentPage} / ${this.state.totalPages}</span>
                    <button class="reader-mori-nav" id="reader-next" ${this.state.currentPage === this.state.totalPages ? 'disabled' : ''}>След. ▶</button>
                </div>
                <div class="reader-mori-settings-panel" id="settings-panel" style="display: none; background: ${theme.background}; border-top: 1px solid ${theme.border};">
                    <div class="setting-group">
                        <label>Шрифт</label>
                        <select id="reader-font">${this.fonts.map(f => `<option value="${f.value}" ${this.state.fontFamily === f.value ? 'selected' : ''}>${f.name}</option>`).join('')}</select>
                    </div>
                    <div class="setting-group">
                        <label>Размер: ${this.state.fontSize}px</label>
                        <input type="range" id="reader-font-size" min="12" max="32" value="${this.state.fontSize}" step="1">
                    </div>
                    <div class="setting-group">
                        <label>Интервал: ${this.state.lineHeight}</label>
                        <input type="range" id="reader-line-height" min="1" max="2.5" value="${this.state.lineHeight}" step="0.1">
                    </div>
                    <div class="setting-group">
                        <label>Тема</label>
                        <div class="theme-buttons">
                            <button class="theme-btn ${this.state.theme === 'dark' ? 'active' : ''}" data-theme="dark">🌙 Тёмная</button>
                            <button class="theme-btn ${this.state.theme === 'light' ? 'active' : ''}" data-theme="light">☀️ Светлая</button>
                            <button class="theme-btn ${this.state.theme === 'sepia' ? 'active' : ''}" data-theme="sepia">📜 Сепия</button>
                        </div>
                    </div>
                    <button class="settings-close">Закрыть</button>
                </div>
            </div>
        </div>
    `;

    this.attachReaderEvents();
    this.startReadingTimer();
},

    /**
     * Рендер панели настроек
     */
    renderSettings: function() {
        const theme = this.themes[this.state.theme];

        return `
            <div class="settings-group">
                <label>Шрифт</label>
                <select id="reader-font" class="setting-select" style="background: ${theme.background}; color: ${theme.text}; border-color: ${theme.border};">
                    ${this.fonts.map(font => `
                        <option value="${font.value}" ${this.state.fontFamily === font.value ? 'selected' : ''}>
                            ${font.name}
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="settings-group">
                <label>Размер: ${this.state.fontSize}px</label>
                <div class="setting-range">
                    <button id="font-decr" class="range-btn">−</button>
                    <input type="range" id="font-size" min="12" max="32" value="${this.state.fontSize}" step="1">
                    <button id="font-incr" class="range-btn">+</button>
                </div>
            </div>
            <div class="settings-group">
                <label>Интервал: ${this.state.lineHeight}</label>
                <div class="setting-range">
                    <button id="line-decr" class="range-btn">−</button>
                    <input type="range" id="line-height" min="1" max="2.5" value="${this.state.lineHeight}" step="0.1">
                    <button id="line-incr" class="range-btn">+</button>
                </div>
            </div>
            <div class="settings-group">
                <label>Тема</label>
                <div class="theme-buttons">
                    <button class="theme-btn ${this.state.theme === 'dark' ? 'active' : ''}" data-theme="dark">🌙 Тёмная</button>
                    <button class="theme-btn ${this.state.theme === 'light' ? 'active' : ''}" data-theme="light">☀️ Светлая</button>
                    <button class="theme-btn ${this.state.theme === 'sepia' ? 'active' : ''}" data-theme="sepia">📜 Сепия</button>
                </div>
            </div>
            <button id="settings-close" class="settings-close">Закрыть</button>
        `;
    },

    /**
     * Обработчики событий в читалке
     */
    attachReaderEvents: function() {
        const closeBtn = document.getElementById('reader-close');
        if (closeBtn) closeBtn.onclick = () => this.close();

        const prevBtn = document.getElementById('reader-prev');
        if (prevBtn) prevBtn.onclick = () => this.prevPage();

        const nextBtn = document.getElementById('reader-next');
        if (nextBtn) nextBtn.onclick = () => this.nextPage();

        const settingsBtn = document.getElementById('reader-settings');
        const settingsPanel = document.getElementById('settings-panel');
        if (settingsBtn && settingsPanel) {
            settingsBtn.onclick = () => {
                const isVisible = settingsPanel.style.display !== 'none';
                settingsPanel.style.display = isVisible ? 'none' : 'block';
            };
        }

        const settingsClose = document.querySelector('.settings-close');
        if (settingsClose && settingsPanel) {
            settingsClose.onclick = () => {
                settingsPanel.style.display = 'none';
            };
        }

        // ========== ПОИСК ==========
        const searchBtn = document.getElementById('reader-search-btn');
        const searchBar = document.getElementById('reader-search-bar');
        const searchInput = document.getElementById('reader-search-input');
        const searchClose = document.getElementById('reader-search-close');
        const searchPrev = document.getElementById('search-prev');
        const searchNext = document.getElementById('search-next');

        if (searchBtn) {
            searchBtn.onclick = () => {
                searchBar.style.display = 'block';
                setTimeout(() => searchInput?.focus(), 100);
            };
        }

        if (searchClose) {
            searchClose.onclick = () => {
                searchBar.style.display = 'none';
                this.closeSearch();
            };
        }

        if (searchInput) {
            let timeout;
            searchInput.oninput = (e) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    this.searchInBook(e.target.value);
                }, 500);
            };
        }

        if (searchPrev) {
            searchPrev.onclick = () => {
                if (this.state.searchResults.length > 0) {
                    const newIndex = this.state.searchCurrentIndex - 1;
                    this.goToSearchResult(newIndex);
                }
            };
        }

        if (searchNext) {
            searchNext.onclick = () => {
                if (this.state.searchResults.length > 0) {
                    const newIndex = this.state.searchCurrentIndex + 1;
                    this.goToSearchResult(newIndex);
                }
            };
        }

        // Шрифты
        const fontSelect = document.getElementById('reader-font');
        if (fontSelect) {
            fontSelect.onchange = (e) => this.setState({ fontFamily: e.target.value });
        }

        const fontSizeInput = document.getElementById('reader-font-size');
        if (fontSizeInput) {
            fontSizeInput.oninput = (e) => {
                this.state.fontSize = parseInt(e.target.value);
                const contentEl = document.querySelector('.reader-mori-content');
                if (contentEl) contentEl.style.fontSize = this.state.fontSize + 'px';
        };
     
        }

        const fontDecr = document.getElementById('font-decr');
        if (fontDecr) {
            fontDecr.onclick = () => this.setState({ fontSize: Math.max(12, this.state.fontSize - 1) });
        }

        const fontIncr = document.getElementById('font-incr');
        if (fontIncr) {
            fontIncr.onclick = () => this.setState({ fontSize: Math.min(32, this.state.fontSize + 1) });
        }

        const lineHeightInput = document.getElementById('reader-line-height');
        if (lineHeightInput) {
            lineHeightInput.oninput = (e) => {
                this.state.lineHeight = parseFloat(e.target.value);
                const contentEl = document.querySelector('.reader-mori-content');
                if (contentEl) contentEl.style.lineHeight = this.state.lineHeight;
        };
       
        }

        const lineDecr = document.getElementById('line-decr');
        if (lineDecr) {
            lineDecr.onclick = () => this.setState({ lineHeight: Math.max(1, this.state.lineHeight - 0.1) });
        }

        const lineIncr = document.getElementById('line-incr');
        if (lineIncr) {
            lineIncr.onclick = () => this.setState({ lineHeight: Math.min(2.5, this.state.lineHeight + 0.1) });
        }

        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.onclick = () => {
                const theme = btn.dataset.theme;
                this.setState({ theme });
            };
        });

        const bookmarkBtn = document.getElementById('reader-bookmark');
        if (bookmarkBtn) {
            bookmarkBtn.onclick = () => {
                MORI_LIBRARY_BOOKS.addBookmark(
                    this.state.currentBook.id,
                    this.state.currentPage,
                    this.state.currentBook.title
                );
            };
        }

        const noteBtn = document.getElementById('reader-note');
        if (noteBtn) {
            noteBtn.onclick = () => {
                this.showNoteDialog();
            };
        }

        const content = document.getElementById('reader-content');
        if (content) {
            let touchStartX = 0;
            content.ontouchstart = (e) => { touchStartX = e.touches[0].clientX; };
            content.ontouchend = (e) => {
                const diff = e.changedTouches[0].clientX - touchStartX;
                if (Math.abs(diff) > 50) {
                    if (diff > 0) this.prevPage();
                    else this.nextPage();
                }
            };
        }
    },

    /**
     * Предыдущая страница
     */
    prevPage: function() {
        if (this.state.currentPage > 1) {
            this.stopReadingTimer();
            this.state.currentPage--;
            this.startReadingTimer();
            this.renderReader();
        }
    },

    /**
     * Следующая страница
     */
    nextPage: function() {
        if (this.state.currentPage < this.state.totalPages) {
            this.stopReadingTimer();
            this.state.currentPage++;
            this.startReadingTimer();
            this.renderReader();
        }
    },

    /**
     * Запуск таймера чтения страницы (50 секунд)
     */
    startReadingTimer: function() {
        this.stopReadingTimer();
        this.state.pageReadFlag = false;
        this.state.timerStart = Date.now();

        this.state.readingTimer = setTimeout(() => {
            if (!this.state.pageReadFlag && this.state.currentBook) {
                this.state.pageReadFlag = true;
                this.markPageAsRead();
            }
        }, 50000);
    },

    /**
     * Остановка таймера
     */
    stopReadingTimer: function() {
        if (this.state.readingTimer) {
            clearTimeout(this.state.readingTimer);
            this.state.readingTimer = null;
        }
    },

    /**
     * Отметить страницу как прочитанную
     */
    markPageAsRead: function() {
        if (!this.state.currentBook) return;

        this.saveProgress();

        if (window.MORI_USER) {
            MORI_USER.updateStats('pagesRead', 1);
        }

        console.log(`✅ Страница ${this.state.currentPage} книги "${this.state.currentBook.title}" прочитана`);
    },

    /**
     * Сохранение прогресса
     */
    saveProgress: function() {
        if (!this.state.currentBook) return;
        MORI_LIBRARY_BOOKS.saveProgress(
            this.state.currentBook.id,
            this.state.currentPage,
            Date.now()
        );
    },

    /**
     * Обновление состояния и перерисовка
     */
    setState: function(newState) {
        this.state = { ...this.state, ...newState };
        if (this.state.isOpen) {
            this.renderReader();
        }
    },

    /**
     * Показать диалог заметки
     */
    showNoteDialog: function() {
        const notes = MORI_LIBRARY_BOOKS.getNotes(this.state.currentBook.id);
        const existingNote = notes.find(n => n.page === this.state.currentPage);

        const modal = document.createElement('div');
        modal.className = 'note-modal';
        modal.innerHTML = `
            <div class="note-modal-content">
                <div class="note-modal-header">
                    <span>📝 Заметка к странице ${this.state.currentPage}</span>
                    <button class="note-modal-close">✕</button>
                </div>
                <textarea class="note-modal-textarea" placeholder="Введите вашу заметку...">${existingNote ? existingNote.text : ''}</textarea>
                <div class="note-modal-buttons">
                    <button class="note-modal-cancel">Отмена</button>
                    <button class="note-modal-save">Сохранить</button>
                    ${existingNote ? '<button class="note-modal-delete">🗑️ Удалить</button>' : ''}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeBtn = modal.querySelector('.note-modal-close');
        const cancelBtn = modal.querySelector('.note-modal-cancel');
        const saveBtn = modal.querySelector('.note-modal-save');
        const deleteBtn = modal.querySelector('.note-modal-delete');
        const textarea = modal.querySelector('.note-modal-textarea');

        const close = () => modal.remove();

        closeBtn.onclick = close;
        cancelBtn.onclick = close;
        modal.onclick = (e) => { if (e.target === modal) close(); };

        saveBtn.onclick = () => {
            const text = textarea.value.trim();
            if (text) {
                if (existingNote) {
                    MORI_LIBRARY_BOOKS.updateNote(existingNote.id, text);
                } else {
                    MORI_LIBRARY_BOOKS.addNote(
                        this.state.currentBook.id,
                        this.state.currentPage,
                        text,
                        this.state.currentBook.title
                    );
                }
            }
            close();
        };

        if (deleteBtn) {
            deleteBtn.onclick = () => {
                MORI_LIBRARY_BOOKS.removeNote(existingNote.id);
                close();
            };
        }
    },

    /**
     * Очистка при выходе
     */
    destroy: function() {
        this.stopReadingTimer();
        if (this.state.currentBook) {
            this.saveProgress();
        }
    }
};

window.MORI_LIBRARY_READER = MORI_LIBRARY_READER;
