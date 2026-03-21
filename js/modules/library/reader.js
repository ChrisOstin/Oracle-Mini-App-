/**
 * LIBRARY READER
 * Читалка книг с настройками шрифта, прогрессом и таймером
 * Версия: 1.0.0
 */

const MORI_LIBRARY_READER = {
    // Текущее состояние читалки
    state: {
        isOpen: false,
        currentBook: null,
        currentPage: 1,
        totalPages: 0,
        content: [],
        fontSize: 16,
        fontFamily: 'Inter',
        lineHeight: 1.5,
        theme: 'light', // 'light', 'sepia', 'dark'
        progress: 0,
        isReading: false,
        pageTimer: null,
        timerStart: null
    },

    // Доступные шрифты
    fonts: [
        { name: 'Inter', value: 'Inter, sans-serif' },
        { name: 'Roboto', value: 'Roboto, sans-serif' },
        { name: 'Arial', value: 'Arial, sans-serif' },
        { name: 'Verdana', value: 'Verdana, sans-serif' },
        { name: 'Georgia', value: 'Georgia, serif' },
        { name: 'PT Serif', value: 'PT Serif, serif' },
        { name: 'OpenDyslexic', value: 'OpenDyslexic, sans-serif' },
        { name: 'Courier New', value: 'Courier New, monospace' },
        { name: 'Tahoma', value: 'Tahoma, sans-serif' },
        { name: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif' }
    ],

    // Темы чтения
    themes: {
        light: {
            background: '#ffffff',
            text: '#000000',
            accent: '#ffd700',
            border: '#e5e5e5'
        },
        sepia: {
            background: '#fbf0d9',
            text: '#5b4636',
            accent: '#b85e00',
            border: '#d9c8b2'
        },
        dark: {
            background: '#1a1a1a',
            text: '#e5e5e5',
            accent: '#ffd700',
            border: '#333333'
        }
    },

    /**
     * Открыть книгу
     */
    open: async function(book) {
        this.state.currentBook = book;
        this.state.totalPages = book.pages || 100;
        this.state.currentPage = this.getSavedPage(book.id) || 1;
        this.state.isOpen = true;
        
        await this.loadContent();
        this.renderReader();
        this.startReadingTimer();
    },

    /**
     * Закрыть читалку
     */
    close: function() {
        this.stopReadingTimer();
        this.saveProgress();
        this.state.isOpen = false;
        MORI_LIBRARY.render();
    },

    /**
     * Рендер читалки
     */
    renderReader: function() {
        const appDiv = document.getElementById('app');
        if (!appDiv) return;

        const theme = this.themes[this.state.theme];
        
        appDiv.innerHTML = `
            <div class="reader-container" style="background: ${theme.background}; color: ${theme.text};">
                <!-- Шапка читалки -->
                <div class="reader-header" style="border-bottom-color: ${theme.border};">
                    <button class="reader-back" id="reader-close">←</button>
                    <div class="reader-title">
                        <h3>${this.state.currentBook.title}</h3>
                        <span>${this.state.currentPage}/${this.state.totalPages}</span>
                    </div>
                    <button class="reader-menu-btn" id="reader-menu">⚙️</button>
                </div>

                <!-- Контент -->
                <div class="reader-content" id="reader-content" 
                     style="font-family: ${this.state.fontFamily}; 
                            font-size: ${this.state.fontSize}px; 
                            line-height: ${this.state.lineHeight};">
                    ${this.renderPage()}
                </div>

                <!-- Навигация по страницам -->
                <div class="reader-footer" style="border-top-color: ${theme.border};">
                    <button class="reader-nav" id="reader-prev" ${this.state.currentPage === 1 ? 'disabled' : ''}>
                        ◀
                    </button>
                    <div class="reader-progress">
                        <div class="progress-bar" style="width: ${(this.state.currentPage / this.state.totalPages) * 100}%"></div>
                    </div>
                    <button class="reader-nav" id="reader-next" 
                            ${this.state.currentPage === this.state.totalPages ? 'disabled' : ''}>
                        ▶
                    </button>
                </div>

                <!-- Меню настроек (скрыто по умолчанию) -->
                <div class="reader-settings" id="reader-settings" style="display: none;">
                    ${this.renderSettings()}
                </div>
            </div>
        `;

        this.attachReaderEvents();
    },

    /**
     * Рендер текущей страницы
     */
    renderPage: function() {
        const content = this.state.content[this.state.currentPage - 1];
        if (!content) return '<div class="reader-empty">Загрузка...</div>';

        return `
            <div class="reader-page">
                ${content.paragraphs.map(p => `<p>${p}</p>`).join('')}
            </div>
        `;
    },

    /**
     * Рендер меню настроек
     */
    renderSettings: function() {
        const theme = this.themes[this.state.theme];
        
        return `
            <div class="settings-panel" style="background: ${theme.background}; border-color: ${theme.border};">
                <h4>Настройки чтения</h4>
                
                <!-- Шрифты -->
                <div class="setting-group">
                    <label>Шрифт</label>
                    <select id="reader-font" class="setting-select">
                        ${this.fonts.map(font => `
                            <option value="${font.value}" ${this.state.fontFamily === font.value ? 'selected' : ''}>
                                ${font.name}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <!-- Размер шрифта -->
                <div class="setting-group">
                    <label>Размер шрифта: ${this.state.fontSize}px</label>
                    <div class="setting-range">
                        <button id="font-decrease" class="range-btn">−</button>
                        <input type="range" id="font-size" min="12" max="32" value="${this.state.fontSize}" step="1">
                        <button id="font-increase" class="range-btn">+</button>
                    </div>
                </div>

                <!-- Межстрочный интервал -->
                <div class="setting-group">
                    <label>Интервал: ${this.state.lineHeight}</label>
                    <div class="setting-range">
                        <button id="line-decrease" class="range-btn">−</button>
                        <input type="range" id="line-height" min="1" max="2.5" value="${this.state.lineHeight}" step="0.1">
                        <button id="line-increase" class="range-btn">+</button>
                    </div>
                </div>

                <!-- Тема -->
                <div class="setting-group">
                    <label>Тема</label>
                    <div class="theme-buttons">
                        <button class="theme-btn ${this.state.theme === 'light' ? 'active' : ''}" data-theme="light">
                            ☀️ Светлая
                        </button>
                        <button class="theme-btn ${this.state.theme === 'sepia' ? 'active' : ''}" data-theme="sepia">
                            📜 Сепия
                        </button>
                        <button class="theme-btn ${this.state.theme === 'dark' ? 'active' : ''}" data-theme="dark">
                            🌙 Тёмная
                        </button>
                    </div>
                </div>

                <!-- Статистика чтения -->
                <div class="setting-group">
                    <label>Статистика</label>
                    <div class="reading-stats">
                        <div>Прочитано: ${this.state.currentPage}/${this.state.totalPages} стр.</div>
                        <div>Время чтения: ${this.getReadingTime()}</div>
                    </div>
                </div>

                <!-- Кнопка закрытия -->
                <button class="settings-close" id="settings-close">Закрыть</button>
            </div>
        `;
    },

    /**
     * Навешивание обработчиков в читалке
     */
    attachReaderEvents: function() {
        // Закрытие
        document.getElementById('reader-close').addEventListener('click', () => this.close());

        // Навигация
        document.getElementById('reader-prev').addEventListener('click', () => this.prevPage());
        document.getElementById('reader-next').addEventListener('click', () => this.nextPage());

        // Меню настроек
        const menuBtn = document.getElementById('reader-menu');
        const settingsPanel = document.getElementById('reader-settings');
        
        menuBtn.addEventListener('click', () => {
            const isVisible = settingsPanel.style.display !== 'none';
            settingsPanel.style.display = isVisible ? 'none' : 'block';
        });

        // Закрытие настроек
        document.getElementById('settings-close').addEventListener('click', () => {
            settingsPanel.style.display = 'none';
        });

        // Изменение шрифта
        document.getElementById('reader-font').addEventListener('change', (e) => {
            this.setState({ fontFamily: e.target.value });
        });

        // Размер шрифта
        const fontSizeInput = document.getElementById('font-size');
        fontSizeInput.addEventListener('input', (e) => {
            this.setState({ fontSize: parseInt(e.target.value) });
        });

        document.getElementById('font-decrease').addEventListener('click', () => {
            this.setState({ fontSize: Math.max(12, this.state.fontSize - 1) });
        });

        document.getElementById('font-increase').addEventListener('click', () => {
            this.setState({ fontSize: Math.min(32, this.state.fontSize + 1) });
        });

        // Межстрочный интервал
        const lineHeightInput = document.getElementById('line-height');
        lineHeightInput.addEventListener('input', (e) => {
            this.setState({ lineHeight: parseFloat(e.target.value) });
        });

        document.getElementById('line-decrease').addEventListener('click', () => {
            this.setState({ lineHeight: Math.max(1, this.state.lineHeight - 0.1) });
        });

        document.getElementById('line-increase').addEventListener('click', () => {
            this.setState({ lineHeight: Math.min(2.5, this.state.lineHeight + 0.1) });
        });

        // Смена темы
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = e.target.dataset.theme;
                this.setState({ theme });
            });
        });

        // Свайпы для перелистывания
        const content = document.getElementById('reader-content');
        let touchStartX = 0;
        
        content.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });

        content.addEventListener('touchend', (e) => {
            const diff = e.changedTouches[0].clientX - touchStartX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    this.prevPage();
                } else {
                    this.nextPage();
                }
            }
        });
    },

    /**
 * Загрузка контента книги
 */
loadContent: async function() {
    if (!this.state.currentBook) return;

    try {
        // Пробуем загрузить с сервера
        const content = await MORI_API.downloadBook?.(this.state.currentBook.id);

        if (content && content.pages) {
            this.state.content = content.pages;
            this.state.totalPages = content.pages.length;
        } else {
            // Если контента нет, показываем заглушку "нет контента"
            this.state.content = [{
                page: 1,
                paragraphs: ['Контент книги ещё не загружен']
            }];
            this.state.totalPages = 1;
        }
    } catch (error) {
        console.error('Ошибка загрузки контента:', error);
        MORI_APP.showToast('❌ Ошибка загрузки книги', 'error');

        // Показываем сообщение об ошибке вместо заглушки
        this.state.content = [{
            page: 1,
            paragraphs: ['Не удалось загрузить книгу. Проверьте соединение.']
        }];
        this.state.totalPages = 1;
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
        this.state.timerStart = Date.now();
        
        this.state.pageTimer = setTimeout(() => {
            this.markPageAsRead();
        }, 50000); // 50 секунд
    },

    /**
     * Остановка таймера
     */
    stopReadingTimer: function() {
        if (this.state.pageTimer) {
            clearTimeout(this.state.pageTimer);
            this.state.pageTimer = null;
        }
    },

    /**
     * Отметить страницу как прочитанную
     */
    markPageAsRead: function() {
        if (!this.state.currentBook) return;

        const timeSpent = Math.floor((Date.now() - this.state.timerStart) / 1000);
        console.log(`Page ${this.state.currentPage} read in ${timeSpent}s`);

        // Сохраняем прогресс
        this.saveProgress();

        // Обновляем статистику пользователя
        if (MORI_USER.current) {
            MORI_USER.updateStats('pagesRead');
        }

        MORI_APP.showToast(`Страница ${this.state.currentPage} прочитана`, 'success');
    },

    /**
     * Сохранение прогресса
     */
    saveProgress: function() {
        if (!this.state.currentBook) return;

        const progress = {
            bookId: this.state.currentBook.id,
            page: this.state.currentPage,
            timestamp: Date.now()
        };

        const saved = localStorage.getItem('reading_progress') || '{}';
        const allProgress = JSON.parse(saved);
        allProgress[this.state.currentBook.id] = progress;
        
        localStorage.setItem('reading_progress', JSON.stringify(allProgress));
    },

    /**
     * Получение сохранённой страницы
     */
    getSavedPage: function(bookId) {
        const saved = localStorage.getItem('reading_progress') || '{}';
        const allProgress = JSON.parse(saved);
        return allProgress[bookId]?.page;
    },

    /**
     * Получение времени чтения
     */
    getReadingTime: function() {
        const saved = localStorage.getItem('reading_progress') || '{}';
        const allProgress = JSON.parse(saved);
        const bookProgress = allProgress[this.state.currentBook?.id];
        
        if (!bookProgress) return '0 мин';

        const minutes = Math.floor((Date.now() - bookProgress.timestamp) / 60000);
        return `${minutes} мин`;
    },

    /**
     * Обновление состояния
     */
    setState: function(newState) {
        this.state = { ...this.state, ...newState };
        
        if (this.state.isOpen) {
            this.renderReader();
        }
    }
};

// Экспорт
window.MORI_LIBRARY_READER = MORI_LIBRARY_READER;
