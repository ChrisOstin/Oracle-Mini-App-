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
        theme: 'dark', // dark, light, sepia
        readingTimer: null,
        timerStart: null,
        pageReadFlag: false
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
        
        // Загружаем содержимое
        const savedContent = MORI_LIBRARY_BOOKS.loadContent(book.id);
        if (savedContent && savedContent.pages) {
            this.state.content = savedContent.pages;
            this.state.totalPages = savedContent.pages.length;
        } else {
            this.state.content = ['<p>Контент книги не загружен</p>'];
        }
        
        // Загружаем прогресс
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
     * Рендер читалки
     */
    renderReader: function() {
        const appDiv = document.getElementById('app');
        if (!appDiv) return;

        const theme = this.themes[this.state.theme];
        const currentContent = this.state.content[this.state.currentPage - 1] || '<p>Страница не найдена</p>';
        const progressPercent = (this.state.currentPage / this.state.totalPages) * 100;

        appDiv.innerHTML = `
            <div class="reader-overlay">
                <div class="reader-container" style="background: ${theme.background}; color: ${theme.text};">
                    <!-- Шапка -->
                    <div class="reader-header" style="border-bottom: 1px solid ${theme.border};">
                        <button class="reader-back" id="reader-close">← Назад</button>
                         <div class="reader-header" style="border-bottom: 1px solid ${theme.border};">
    <button class="reader-back" id="reader-close">← Назад</button>
    <div class="reader-title">
        <span>${this.state.currentBook.title}</span>
        <span style="font-size: 12px; opacity: 0.7;">${this.state.currentPage}/${this.state.totalPages}</span>
    </div>
    <div style="display: flex; gap: 8px;">
        <button class="reader-bookmark-btn" id="reader-bookmark">🔖</button>
        <button class="reader-settings-btn" id="reader-settings-btn">⚙️</button>
    </div>
</div>
<div style="display: flex; gap: 8px;">
    <button class="reader-note-btn" id="reader-note">📝</button>
    <button class="reader-bookmark-btn" id="reader-bookmark">🔖</button>
    <button class="reader-settings-btn" id="reader-settings-btn">⚙️</button>
</div>
                        <div class="reader-title">
                            <span>${this.state.currentBook.title}</span>
                            <span style="font-size: 12px; opacity: 0.7;">${this.state.currentPage}/${this.state.totalPages}</span>
                        </div>
                        <button class="reader-settings-btn" id="reader-settings-btn">⚙️</button>
                    </div>

                    <!-- Контент -->
                    <div class="reader-content" id="reader-content"
                         style="font-family: ${this.state.fontFamily};
                                font-size: ${this.state.fontSize}px;
                                line-height: ${this.state.lineHeight};
                                color: ${theme.text};">
                        ${currentContent}
                    </div>

                    <!-- Прогресс-бар -->
                    <div class="reader-progress-bar">
                        <div class="reader-progress-fill" style="width: ${progressPercent}%; background: ${theme.accent};"></div>
                    </div>

                    <!-- Навигация -->
                    <div class="reader-footer" style="border-top: 1px solid ${theme.border};">
                        <button class="reader-nav" id="reader-prev" ${this.state.currentPage === 1 ? 'disabled' : ''}>
                            ◀ Пред.
                        </button>
                        <span class="reader-page-num">${this.state.currentPage} / ${this.state.totalPages}</span>
                        <button class="reader-nav" id="reader-next" ${this.state.currentPage === this.state.totalPages ? 'disabled' : ''}>
                            След. ▶
                        </button>
                    </div>

                    <!-- Панель настроек (скрыта) -->
                    <div class="reader-settings-panel" id="reader-settings-panel" style="display: none; background: ${theme.background}; border-top: 1px solid ${theme.border};">
                        ${this.renderSettings()}
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
        // Закрытие
        const closeBtn = document.getElementById('reader-close');
        if (closeBtn) closeBtn.onclick = () => this.close();

        // Навигация
        const prevBtn = document.getElementById('reader-prev');
        if (prevBtn) prevBtn.onclick = () => this.prevPage();
        
        const nextBtn = document.getElementById('reader-next');
        if (nextBtn) nextBtn.onclick = () => this.nextPage();

        // Настройки
        const settingsBtn = document.getElementById('reader-settings-btn');
        const settingsPanel = document.getElementById('reader-settings-panel');
        if (settingsBtn && settingsPanel) {
            settingsBtn.onclick = () => {
                const isVisible = settingsPanel.style.display !== 'none';
                settingsPanel.style.display = isVisible ? 'none' : 'block';
            };
        }

        const settingsClose = document.getElementById('settings-close');
        if (settingsClose && settingsPanel) {
            settingsClose.onclick = () => {
                settingsPanel.style.display = 'none';
            };
        }

        // Шрифты
        const fontSelect = document.getElementById('reader-font');
        if (fontSelect) {
            fontSelect.onchange = (e) => this.setState({ fontFamily: e.target.value });
        }

        // Размер шрифта
        const fontSizeInput = document.getElementById('font-size');
        if (fontSizeInput) {
            fontSizeInput.oninput = (e) => this.setState({ fontSize: parseInt(e.target.value) });
        }
        
        const fontDecr = document.getElementById('font-decr');
        if (fontDecr) {
            fontDecr.onclick = () => this.setState({ fontSize: Math.max(12, this.state.fontSize - 1) });
        }
        
        const fontIncr = document.getElementById('font-incr');
        if (fontIncr) {
            fontIncr.onclick = () => this.setState({ fontSize: Math.min(32, this.state.fontSize + 1) });
        }

        // Межстрочный интервал
        const lineHeightInput = document.getElementById('line-height');
        if (lineHeightInput) {
            lineHeightInput.oninput = (e) => this.setState({ lineHeight: parseFloat(e.target.value) });
        }
        
        const lineDecr = document.getElementById('line-decr');
        if (lineDecr) {
            lineDecr.onclick = () => this.setState({ lineHeight: Math.max(1, this.state.lineHeight - 0.1) });
        }
        
        const lineIncr = document.getElementById('line-incr');
        if (lineIncr) {
            lineIncr.onclick = () => this.setState({ lineHeight: Math.min(2.5, this.state.lineHeight + 0.1) });
        }

        // Темы
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.onclick = () => {
                const theme = btn.dataset.theme;
                this.setState({ theme });
            };
        });

        // Закладка
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

         // Заметка
const noteBtn = document.getElementById('reader-note');
if (noteBtn) {
    noteBtn.onclick = () => {
        this.showNoteDialog();
    };
}

        // Свайпы для телефона
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
        
        // Обновляем прогресс в хранилище
        this.saveProgress();
        
        // Обновляем статистику пользователя для заданий
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
     * Очистка при выходе
     */
    destroy: function() {
        this.stopReadingTimer();
        if (this.state.currentBook) {
            this.saveProgress();
        }
    }
};

showNoteDialog: function() {
    // Проверяем, есть ли уже заметка на этой странице
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

window.MORI_LIBRARY_READER = MORI_LIBRARY_READER;
