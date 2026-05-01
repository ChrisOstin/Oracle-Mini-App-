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
        searchCurrentIndex: -1,
        showThumb: false,
        thumbTimeout: null,
        isDragging: false,
        lastTap: 0,
        brightness: 100,
        isBrightnessDragging: false,
        searchNavigationVisible: false
    },

    // Доступные шрифты
   fonts: [
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Inter', value: 'Inter, sans-serif' },
    { name: 'Roboto', value: 'Roboto, sans-serif' },
    { name: 'Courier New', value: 'Courier New, monospace' }
],

    // Темы оформления
    themes: {
        dark: {
            background: '#0a0a0a',
            text: '#e5e5e5',
            accent: '#ffd700',
            border: '#333',
            cardBg: '#1a1a1a'   // для dark
        },
        light: {
            background: '#ffffff',
            text: '#000000',
            accent: '#d4af37',
            border: '#e5e5e5',
            cardBg: '#fff'      // для light
        },
        sepia: {
            background: '#fbf0d9',
            text: '#5b4636',
            accent: '#b85e00',
            border: '#d9c8b2',
            cardBg: '#f5e6d3'   // для sepia
        }
    },

    /**
     * Открыть книгу
     */
open: async function(book, pageNum, searchQuery) {
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
    
    // Если передан номер страницы из поиска — используем его
    if (pageNum && pageNum > 0) {
        this.state.currentPage = pageNum;
    } else {
        this.state.currentPage = progress.page || 1;
    }
    
    // Если передан поисковый запрос — сохраняем его для подсветки
    if (searchQuery) {
        this.state.searchQuery = searchQuery;
        // Ищем результаты в этой книге
        this.searchInBook(searchQuery);
    }

    // Загружаем сохранённую яркость
    this.loadBrightness();
    // Инициализируем свайп для яркости
    this.initBrightnessSwipe();

    this.state.isOpen = true;

// Блокируем обработку backbutton и popstate в читалке
if (window.MORI_ROUTER) {
    this.savedBackButtonHandler = document.onbackbutton;
    this.savedPopstateHandler = window.onpopstate;
    document.onbackbutton = function(e) { e.preventDefault(); };
    window.onpopstate = function(e) { e.preventDefault(); };
}

    this.renderReader();
},

    /**
     * Закрыть читалку
     */
    close: function() {
        this.stopReadingTimer();
        this.saveProgress();
        this.state.isOpen = false;
    
        // Восстанавливаем панель навигации и кнопки
const nav = document.getElementById('dynamic-bottom-nav');
const leftBtn = document.getElementById('new-floating-left');
const rightBtn = document.getElementById('new-floating-right');
const themeIcon = document.querySelector('.theme-icon');

if (nav) {
    nav.style.setProperty('display', 'flex', 'important');
}
if (leftBtn) leftBtn.style.display = 'block';
if (rightBtn) rightBtn.style.display = 'block';
if (themeIcon) themeIcon.style.display = 'flex';

// Восстанавливаем обработку backbutton и popstate
if (window.MORI_ROUTER) {
    document.onbackbutton = this.savedBackButtonHandler;
    window.onpopstate = this.savedPopstateHandler;
}

        // Возвращаемся в библиотеку
        if (window.MORI_ROUTER) {
            MORI_ROUTER.navigate('library');
        } else if (window.MORI_LIBRARY) {
            MORI_LIBRARY.render();
        }

    },

/**
 * Показать ползунок
 */
showProgressThumb: function() {
    var self = this;
    
    if (this.state.thumbTimeout) {
        clearTimeout(this.state.thumbTimeout);
        this.state.thumbTimeout = null;
    }
    
    this.state.showThumb = true;
    this.updateThumbVisibility();
    
    this.state.thumbTimeout = setTimeout(function() {
        self.hideProgressThumb();
    }, 3000);
},

/**
 * Применить яркость к читалке
 */
applyBrightness: function(value) {
    var readerContainer = document.querySelector('.mori-reader-container');
    if (readerContainer) {
        readerContainer.style.filter = 'brightness(' + (value / 100) + ')';
    }
},

/**
 * Показать индикатор яркости
 */
showBrightnessIndicator: function(value) {
    var indicator = document.getElementById('brightness-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'brightness-indicator';
        indicator.className = 'brightness-indicator';
        document.body.appendChild(indicator);
    }
    
    indicator.innerHTML = '☀️ Яркость: ' + Math.round(value) + '%';
    indicator.style.display = 'block';
    indicator.style.opacity = '1';
    
    if (this.brightnessTimeout) clearTimeout(this.brightnessTimeout);
    this.brightnessTimeout = setTimeout(function() {
        var ind = document.getElementById('brightness-indicator');
        if (ind) {
            ind.style.opacity = '0';
            setTimeout(function() { if (ind) ind.style.display = 'none'; }, 300);
        }
    }, 800);
},

/**
 * Инициализация свайпа по левому краю для яркости
 */
initBrightnessSwipe: function() {
    var self = this;
    var startY = 0;
    var startBrightness = 100;
    var touchStarted = false;
    var isLeftEdge = false;
    
    var onTouchStart = function(e) {
        var touchX = e.touches[0].clientX;
        // Проверяем, что свайп по левому краю (первые 50px)
        if (touchX < 50) {
            isLeftEdge = true;
            startY = e.touches[0].clientY;
            startBrightness = self.state.brightness;
            touchStarted = true;
        } else {
            isLeftEdge = false;
        }
    };
    
    var onTouchMove = function(e) {
        if (!isLeftEdge || !touchStarted) return;
        
        var currentY = e.touches[0].clientY;
        var deltaY = startY - currentY; // положительно — вверх, отрицательно — вниз
        
        // Изменяем яркость: движение вверх = увеличение, вниз = уменьшение
        var newBrightness = startBrightness + (deltaY / 3);
        newBrightness = Math.max(10, Math.min(200, newBrightness));
        
        if (newBrightness !== self.state.brightness) {
            self.state.brightness = newBrightness;
            self.applyBrightness(newBrightness);
            self.showBrightnessIndicator(newBrightness);
        }
        
        e.preventDefault();
    };
    
    var onTouchEnd = function(e) {
        if (!isLeftEdge || !touchStarted) return;
        touchStarted = false;
        isLeftEdge = false;
        
        // Сохраняем настройку яркости
        localStorage.setItem('reader_brightness', self.state.brightness);
    };
    
    document.addEventListener('touchstart', onTouchStart);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
},

/**
 * Загрузить сохранённую яркость
 */
loadBrightness: function() {
    var saved = localStorage.getItem('reader_brightness');
    if (saved !== null) {
        this.state.brightness = parseFloat(saved);
        this.applyBrightness(this.state.brightness);
    }
},

/**
 * Скрыть ползунок плавно
 */
hideProgressThumb: function() {
    this.state.showThumb = false;
    this.updateThumbVisibility();
},

/**
 * Обновить видимость ползунка в DOM
 */
updateThumbVisibility: function() {
    var thumb = document.getElementById('progress-thumb');
    if (thumb) {
        thumb.style.display = this.state.showThumb ? 'block' : 'none';
    }
},

/**
 * Обновить прогресс-бар (позиция ползунка)
 */
updateProgressBar: function() {
    var fill = document.querySelector('.mori-reader-progress-fill');
    var thumb = document.getElementById('progress-thumb');
    
    if (!fill) return;
    
    var percent = (this.state.currentPage / this.state.totalPages) * 100;
    fill.style.width = percent + '%';
    
    if (thumb) {
        thumb.style.left = 'calc(' + percent + '% - 8px)';
    }
},

/**
 * Переход на страницу по проценту
 */
goToPageByPercent: function(percent) {
    var page = Math.max(1, Math.min(this.state.totalPages, Math.floor((percent / 100) * this.state.totalPages) + 1));
    if (page !== this.state.currentPage) {
        this.stopReadingTimer();
        this.state.currentPage = page;
        this.startReadingTimer();
        this.renderReader();
    }
    return page;
},

renderSearchNav: function() {
    if (!this.state.searchNavigationVisible) return;
    
    const total = this.state.searchResults.length;
    const current = this.state.searchCurrentIndex + 1;
    
    let navPanel = document.getElementById('search-results-nav-panel');
    if (!navPanel) {
        navPanel = document.createElement('div');
        navPanel.id = 'search-results-nav-panel';
        document.querySelector('.mori-reader').appendChild(navPanel);
    }
    
    navPanel.innerHTML = `
        <div class="search-nav-compact">
            <button class="search-nav-prev" id="search-nav-prev" ${current <= 1 ? 'disabled' : ''}>◀</button>
            <span class="search-nav-counter">${current} / ${total}</span>
            <button class="search-nav-next" id="search-nav-next" ${current >= total ? 'disabled' : ''}>▶</button>
            <button class="search-nav-close" id="search-nav-close">✕</button>
        </div>
    `;
    
    const prevBtn = document.getElementById('search-nav-prev');
    const nextBtn = document.getElementById('search-nav-next');
    const closeBtn = document.getElementById('search-nav-close');
    
    if (prevBtn) {
        prevBtn.onclick = () => {
            if (this.state.searchCurrentIndex > 0) {
                this.goToSearchResult(this.state.searchCurrentIndex - 1);
            }
        };
    }
    
    if (nextBtn) {
        nextBtn.onclick = () => {
            if (this.state.searchCurrentIndex < this.state.searchResults.length - 1) {
                this.goToSearchResult(this.state.searchCurrentIndex + 1);
            }
        };
    }
    
    if (closeBtn) {
        closeBtn.onclick = () => {
            this.hideSearchNav();
        };
    }
},

hideSearchNav: function() {
    this.state.searchNavigationVisible = false;
    const panel = document.getElementById('search-results-nav-panel');
    if (panel) panel.remove();
},

showSearchNav: function() {
    this.state.searchNavigationVisible = true;
    this.renderSearchNav();
},

/**
 * Проверка, есть ли закладка на текущей странице
 */
hasBookmark: function() {
    var bookmarks = MORI_LIBRARY_BOOKS.getBookmarks(this.state.currentBook.id);
    return bookmarks.some(function(b) { return b.page === this.state.currentPage; }.bind(this));
},

/**
 * Добавить или удалить закладку на текущей странице
 */
toggleBookmark: function(selectedText) {
    var bookmarks = MORI_LIBRARY_BOOKS.getBookmarks(this.state.currentBook.id);
    var existing = bookmarks.find(function(b) { return b.page === this.state.currentPage; }.bind(this));
    
    if (existing) {
        // Удаляем закладку
        MORI_LIBRARY_BOOKS.removeBookmark(existing.id);
        MORI_APP.showToast('🔖 Закладка удалена со страницы ' + this.state.currentPage, 'info');
        this.updateBookmarkIcon();
        return false;
    } else {
        // Добавляем закладку
        MORI_LIBRARY_BOOKS.addBookmark(
            this.state.currentBook.id,
            this.state.currentPage,
            this.state.currentBook.title
        );
        
        // Если есть выделенный текст — добавляем заметку
        if (selectedText && selectedText.length > 0) {
            MORI_LIBRARY_BOOKS.addNote(
                this.state.currentBook.id,
                this.state.currentPage,
                selectedText,
                this.state.currentBook.title
            );
            MORI_APP.showToast('📝 Закладка и заметка добавлены на страницу ' + this.state.currentPage, 'success');
        } else {
            MORI_APP.showToast('🔖 Закладка добавлена на страницу ' + this.state.currentPage, 'success');
        }
        
        this.updateBookmarkIcon();
        return true;
    }
},

/**
 * Обновить иконку закладки в углу
 */
updateBookmarkIcon: function() {
    var icon = document.getElementById('bookmark-corner-icon');
    
    if (this.hasBookmark()) {
        // Если закладка есть — создаём иконку или показываем
        if (!icon) {
            var readerDiv = document.querySelector('.mori-reader');
            if (readerDiv) {
                var bookmarkIcon = document.createElement('div');
                bookmarkIcon.id = 'bookmark-corner-icon';
                bookmarkIcon.className = 'bookmark-corner-icon';
                bookmarkIcon.innerHTML = '🔖';
                bookmarkIcon.onclick = function() {
                    MORI_APP.showToast('🔖 Страница ' + this.state.currentPage + ' в закладках', 'info');
                }.bind(this);
                readerDiv.appendChild(bookmarkIcon);
            }
        } else {
            icon.style.display = 'flex';
            icon.style.opacity = '1';
        }
    } else {
        // Если закладки нет — удаляем иконку или скрываем
        if (icon) {
            icon.style.display = 'none';
        }
    }
},

/**
 * Обработчик двойного тапа
 */
onDoubleTap: function(e) {
    console.log('Двойной тап сработал');
    var now = Date.now();
    var diff = now - this.state.lastTap;

    if (diff < 300 && diff > 0) {
        // Останавливаем всплытие и стандартное поведение (чтобы не выделялся текст)
        e.stopPropagation();
        e.preventDefault();

        // Получаем выделенный текст (если есть)
        var selection = window.getSelection();
        var selectedText = selection.toString().trim();

        // Снимаем выделение
        if (selectedText) {
            selection.removeAllRanges();
        }

        // Добавляем или удаляем закладку
        this.toggleBookmark(selectedText);
    }

    // Запоминаем время последнего тапа
    this.state.lastTap = now;
},

/**
 * Показать подсказку с номером страницы
 */
showPageTooltip: function(page, x, y) {
    var tooltip = document.getElementById('page-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'page-tooltip';
        tooltip.className = 'page-tooltip';
        document.body.appendChild(tooltip);
    }
    
    tooltip.innerHTML = '📄 ' + page + ' / ' + this.state.totalPages;
    tooltip.style.left = (x - 30) + 'px';
    tooltip.style.top = (y - 50) + 'px';
    tooltip.style.display = 'block';
    
    if (this.tooltipTimeout) clearTimeout(this.tooltipTimeout);
    this.tooltipTimeout = setTimeout(function() {
        if (tooltip) tooltip.style.display = 'none';
    }, 800);
},

    /**
     * Поиск по тексту книги
     */
searchInBook: function(query) {
    if (!query || query.trim() === '') {
        this.state.searchResults = [];
        this.state.searchCurrentIndex = -1;
        this.updateSearchResults();
        return;
    }

    const results = [];
    const searchLower = query.toLowerCase();

    for (let i = 0; i < this.state.content.length; i++) {
        const pageHtml = this.state.content[i];
        const textOnly = pageHtml.replace(/<[^>]*>/g, ' ');
        const lowerText = textOnly.toLowerCase();

        let start = 0;
        let pos;
        let matchIndexOnPage = 0;
        while ((pos = lowerText.indexOf(searchLower, start)) !== -1) {
            let snippet = textOnly.substring(Math.max(0, pos - 40), Math.min(textOnly.length, pos + query.length + 40));
            if (pos > 40) snippet = '...' + snippet;
            if (pos + query.length + 40 < textOnly.length) snippet = snippet + '...';

            results.push({
                page: i + 1,
                position: pos,
                preview: snippet,
                searchTerm: query,
                matchIndexOnPage: matchIndexOnPage
            });
            matchIndexOnPage++;
            start = pos + query.length;
        }
    }
    this.state.searchQuery = query;
    this.state.searchResults = results;
    this.state.searchCurrentIndex = results.length > 0 ? 0 : -1;
    this.updateSearchResults();
},

/**
 * Обновление результатов поиска без перерисовки всей читалки
 */
updateSearchResults: function() {
    let searchResultsDiv = document.getElementById('reader-search-results');
    let searchNav = document.getElementById('reader-search-nav');
    let counter = document.getElementById('search-counter');
    
    if (!searchResultsDiv) return;
    
    if (searchNav) {
        searchNav.style.display = this.state.searchResults.length > 0 ? 'flex' : 'none';
    }
    
    if (this.state.searchResults.length > 0) {
        if (counter) {
            counter.textContent = `${this.state.searchCurrentIndex + 1}/${this.state.searchResults.length}`;
        }
        
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
    } else if (this.state.searchQuery && this.state.searchQuery.length > 0) {
        searchResultsDiv.innerHTML = '<div class="search-no-results">🔍 Ничего не найдено</div>';
    } else {
        searchResultsDiv.innerHTML = '';
    }
    
    if (this.state.searchCurrentIndex >= 0 && this.state.searchResults.length > 0) {
        const result = this.state.searchResults[this.state.searchCurrentIndex];
        if (result && result.page !== this.state.currentPage) {
            this.state.currentPage = result.page;
            const contentEl = document.getElementById('reader-content');
            if (contentEl) {
                const newContent = this.state.content[result.page - 1] || '<p>Страница не найдена</p>';
                contentEl.innerHTML = newContent;
            }
            const fill = document.querySelector('.mori-reader-progress-fill');
            if (fill) {
                const newPercent = (this.state.currentPage / this.state.totalPages) * 100;
                fill.style.width = newPercent + '%';
            }
            const thumbEl = document.getElementById('progress-thumb');
            if (thumbEl) {
                const newLeft = ((this.state.currentPage / this.state.totalPages) * 100) - 8;
                thumbEl.style.left = 'calc(' + newLeft + '% - 8px)';
            }
            const pageSpan = document.querySelector('.mori-reader-page');
            if (pageSpan) {
                pageSpan.textContent = this.state.currentPage + ' / ' + this.state.totalPages;
            }
        }
    }
    
    setTimeout(() => this.highlightSearchTerm(), 100);
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

    const allMarks = document.querySelectorAll('mark.search-highlight');
    allMarks.forEach(mark => {
        const parent = mark.parentNode;
        if (!parent) return;
        const txt = document.createTextNode(mark.textContent);
        parent.replaceChild(txt, mark);
        if (parent.normalize) parent.normalize();
    });

    if (result.page !== this.state.currentPage) {
        this.state.currentPage = result.page;
        const contentEl = document.getElementById('reader-content');
        if (contentEl) {
            contentEl.innerHTML = this.state.content[result.page - 1] || '<p>Страница не найдена</p>';
        }

        const fill = document.querySelector('.mori-reader-progress-fill');
        if (fill) fill.style.width = ((this.state.currentPage / this.state.totalPages) * 100) + '%';

        const thumbEl = document.getElementById('progress-thumb');
        if (thumbEl) thumbEl.style.left = 'calc(' + ((this.state.currentPage / this.state.totalPages) * 100) + '% - 8px)';

        const pageSpan = document.querySelector('.mori-reader-page');
        if (pageSpan) pageSpan.textContent = this.state.currentPage + ' / ' + this.state.totalPages;
    }

    setTimeout(() => this.scrollToSearchResult(result), 150);

    // Обновляем нижнюю панель (счётчик)
    this.updateSearchNav();

    // Показываем нижнюю панель (если её нет)
    this.showSearchNav();

    // Закрываем верхнюю панель поиска
    const searchBar = document.getElementById('reader-search-bar');
    if (searchBar) searchBar.style.display = 'none';

    // Очищаем поле ввода поиска
    const searchInput = document.getElementById('reader-search-input');
    if (searchInput) {
        searchInput.value = '';
    }

    // Очищаем визуальный список результатов вверху
    const searchResultsDiv = document.getElementById('reader-search-results');
    if (searchResultsDiv) {
        searchResultsDiv.innerHTML = '';
    }

    // Скрываем верхнюю панель навигации поиска
    const searchNav = document.getElementById('reader-search-nav');
    if (searchNav) {
        searchNav.style.display = 'none';
    }

    // НЕ ОЧИЩАЕМ this.state.searchResults и this.state.searchCurrentIndex
    // Они нужны для нижней панели навигации
},

scrollToSearchResult: function(result) {
    const contentEl = document.getElementById('reader-content');
    if (!contentEl) return;

    const oldMarks = contentEl.querySelectorAll('mark.search-highlight');
    oldMarks.forEach(mark => {
        const parent = mark.parentNode;
        if (!parent) return;
        const txt = document.createTextNode(mark.textContent);
        parent.replaceChild(txt, mark);
        if (parent.normalize) parent.normalize();
    });

    const searchTerm = result.searchTerm;
    if (!searchTerm) return;

    const walker = document.createTreeWalker(contentEl, NodeFilter.SHOW_TEXT, null);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    let currentMatchGlobal = 0;
    let targetNode = null;
    let targetOffset = -1;

    for (const node of textNodes) {
        const nodeText = node.textContent;
        const lowerNodeText = nodeText.toLowerCase();
        let searchPos = 0;
        while ((searchPos = lowerNodeText.indexOf(searchTerm.toLowerCase(), searchPos)) !== -1) {
            if (currentMatchGlobal === result.matchIndexOnPage) {
                targetNode = node;
                targetOffset = searchPos;
                break;
            }
            currentMatchGlobal++;
            searchPos += searchTerm.length;
        }
        if (targetNode) break;
    }

    if (targetNode && targetOffset !== -1) {
        const range = document.createRange();
        range.setStart(targetNode, targetOffset);
        range.setEnd(targetNode, targetOffset + searchTerm.length);

        const rect = range.getBoundingClientRect();
        if (rect) {
            contentEl.scrollTo({
                top: rect.top + contentEl.scrollTop - 100,
                behavior: 'smooth'
            });
        }

        try {
            const mark = document.createElement('mark');
            mark.className = 'search-highlight';
            range.surroundContents(mark);
            setTimeout(() => {
                if (mark.parentNode) {
                    mark.style.transition = 'background 0.3s';
                    mark.style.backgroundColor = 'transparent';
                    setTimeout(() => {
                        if (mark.parentNode) {
                            const txt = document.createTextNode(mark.textContent);
                            mark.parentNode.replaceChild(txt, mark);
                        }
                    }, 300);
                }
            }, 5000);
        } catch (err) {}
    }
},

clearHighlight: function() {
    const marks = document.querySelectorAll('mark.search-highlight');
    if (marks.length === 0) return;
    
    // Добавляем класс для плавного исчезновения
    marks.forEach(mark => {
        mark.style.transition = 'background 0.5s ease, color 0.5s ease';
        mark.style.backgroundColor = 'transparent';
        mark.style.color = 'inherit';
    });
    
    // Удаляем элементы после анимации
    setTimeout(() => {
        marks.forEach(mark => {
            if (mark.parentNode) {
                const text = document.createTextNode(mark.textContent);
                mark.parentNode.replaceChild(text, mark);
            }
        });
    }, 500);
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
    // Не очищаем searchQuery, чтобы подсветка работала
    // this.state.searchQuery = '';
    this.state.searchResults = [];
    this.state.searchCurrentIndex = -1;
    
    const searchResultsDiv = document.getElementById('reader-search-results');
    if (searchResultsDiv) {
        searchResultsDiv.innerHTML = '';
    }
    const searchNav = document.getElementById('reader-search-nav');
    if (searchNav) {
        searchNav.style.display = 'none';
    }
    const searchBar = document.getElementById('reader-search-bar');
    if (searchBar) {
        searchBar.style.display = 'none';
    }
    const searchInput = document.getElementById('reader-search-input');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Скрываем панель навигации
    this.hideSearchNav();
},

    /**
     * Рендер читалки
     */
renderReader: function() {
    const appDiv = document.getElementById('app');
    if (!appDiv) return;

    // Скрываем панель навигации и плавающие кнопки
    const nav = document.getElementById('dynamic-bottom-nav');
    const leftBtn = document.getElementById('new-floating-left');
    const rightBtn = document.getElementById('new-floating-right');
    const themeIcon = document.querySelector('.theme-icon');

    if (nav) nav.style.display = 'none';
    if (leftBtn) leftBtn.style.display = 'none';
    if (rightBtn) rightBtn.style.display = 'none';
    if (themeIcon) themeIcon.style.display = 'none';

    const theme = this.themes[this.state.theme];
    const currentContent = this.state.content[this.state.currentPage - 1] || '<p>Страница не найдена</p>';
    const progressPercent = (this.state.currentPage / this.state.totalPages) * 100;

appDiv.innerHTML = `
<div class="mori-reader">
    <div class="mori-reader-container">
        <div class="mori-reader-header" style="border-bottom: 1px solid ${theme.border};">
            <button class="mori-reader-back" id="reader-close">📖 ← Назад</button>
            <div class="mori-reader-title">📚 ${this.state.currentBook.title}</div>
            <div style="display: flex; gap: 8px;">
    <button class="reader-search-btn" id="reader-search-btn" title="Поиск по книге">🔍</button>
    <button class="reader-bookmark-btn" id="reader-bookmark" title="Добавить закладку">🔖</button>
    <button class="reader-note-btn" id="reader-note" title="Добавить заметку">📝</button>
    <button class="mori-reader-settings" id="reader-settings">🔧</button>
</div>
        </div>
        <div class="mori-reader-progress" id="progress-bar-container">
    <div class="mori-reader-progress-fill" style="width: ${progressPercent}%; background: ${theme.accent};"></div>
    <div class="progress-thumb ${this.state.showThumb ? 'visible' : ''}" id="progress-thumb" style="left: calc(${progressPercent}% - 8px); display: ${this.state.showThumb ? 'block' : 'none'};">
        <div class="thumb-circle"></div>
    </div>
</div>
        <div class="mori-reader-content" id="reader-content"
             style="font-family: ${this.state.fontFamily}; font-size: ${this.state.fontSize}px; line-height: ${this.state.lineHeight}; color: ${theme.text};">
            ${currentContent}
        </div>
        <div class="mori-reader-footer" style="border-top: 1px solid ${theme.border};">
            <button class="mori-reader-nav" id="reader-prev" ${this.state.currentPage === 1 ? 'disabled' : ''}>◀ 📖 Пред.</button>
            <span class="mori-reader-page">📄 ${this.state.currentPage} / ${this.state.totalPages}</span>
            <button class="mori-reader-nav" id="reader-next" ${this.state.currentPage === this.state.totalPages ? 'disabled' : ''}>След. 📖 ▶</button>
        </div>
        <div class="mori-reader-settings-panel" id="settings-panel" style="display: none; background: ${theme.cardBg}; border-top: 1px solid ${theme.border};">
            <div class="mori-reader-settings-title">🔮 Настройки чтения</div>
            <div class="mori-reader-setting">
                <label>📝 Шрифт</label>
                <select id="reader-font">${this.fonts.map(f => `<option value="${f.value}" ${this.state.fontFamily === f.value ? 'selected' : ''}>${f.name}</option>`).join('')}</select>
            </div>
            <div class="mori-reader-setting">
                <label>📏 Размер: ${this.state.fontSize}px</label>
                <input type="range" id="reader-font-size" min="12" max="32" value="${this.state.fontSize}" step="1">
            </div>
            <div class="mori-reader-setting">
                <label>📐 Интервал: ${this.state.lineHeight}</label>
                <input type="range" id="reader-line-height" min="1" max="2.5" value="${this.state.lineHeight}" step="0.1">
            </div>
            <div class="mori-reader-setting">
                <label>🎨 Тема</label>
                <div class="mori-reader-themes">
                    <button class="mori-reader-theme ${this.state.theme === 'dark' ? 'active' : ''}" data-theme="dark">🌙 Тёмная</button>
                    <button class="mori-reader-theme ${this.state.theme === 'light' ? 'active' : ''}" data-theme="light">☀️ Светлая</button>
                    <button class="mori-reader-theme ${this.state.theme === 'sepia' ? 'active' : ''}" data-theme="sepia">📜 Сепия</button>
                </div>
            </div>
            <button class="mori-reader-settings-close">🗝️ Закрыть</button>
        </div>
    </div>
</div>
            <!-- Панель поиска -->
<div class="reader-search-bar" id="reader-search-bar" style="display: none;">
    <div class="reader-search-input-wrapper">
        <span class="search-icon">🔍</span>
        <input type="text" class="reader-search-input" id="reader-search-input" placeholder="Поиск по книге...">
        <button class="reader-search-close" id="reader-search-close">✕</button>
    </div>
    <div class="reader-search-nav" id="reader-search-nav" style="display: none;">
        <button class="search-nav-btn" id="search-prev">◀ Пред.</button>
        <span id="search-counter">0/0</span>
        <button class="search-nav-btn" id="search-next">След. ▶</button>
    </div>
    <div id="reader-search-results"></div>
</div>
`;

// Применяем тему через CSS переменные
const readerDiv = document.querySelector('.mori-reader');
if (readerDiv) {
    readerDiv.style.setProperty('--reader-bg', theme.background);
    readerDiv.style.setProperty('--reader-text', theme.text);
    readerDiv.style.setProperty('--reader-accent', theme.accent);
    readerDiv.style.setProperty('--reader-border', theme.border);
    readerDiv.style.setProperty('--reader-card-bg', theme.cardBg);
}

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

        const settingsClose = document.querySelector('.mori-reader-settings-close');
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
        // Очищаем поле ввода без вызова поиска
        if (searchInput) {
            searchInput.value = '';
        }
        // Очищаем состояние поиска
        this.state.searchQuery = '';
        this.state.searchResults = [];
        this.state.searchCurrentIndex = -1;
        // Очищаем панель результатов
        const searchResultsDiv = document.getElementById('reader-search-results');
        if (searchResultsDiv) {
            searchResultsDiv.innerHTML = '';
        }
        // Скрываем панель навигации
        const searchNav = document.getElementById('reader-search-nav');
        if (searchNav) {
            searchNav.style.display = 'none';
        }
        // Скрываем панель поиска
        searchBar.style.display = 'none';
        // Снимаем подсветку
        this.clearHighlight();
    };
}

if (searchInput) {
    let timeout;
    searchInput.oninput = (e) => {
        const value = e.target.value;
        // Если поле пустое — просто очищаем результаты
        if (value.trim() === '') {
            this.state.searchQuery = '';
            this.state.searchResults = [];
            this.state.searchCurrentIndex = -1;
            this.updateSearchResults();
            return;
        }
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            this.searchInBook(value);
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

// Двойной тап по контенту (только touchstart)
var contentArea = document.getElementById('reader-content');
if (contentArea) {
    contentArea.addEventListener('touchstart', this.onDoubleTap.bind(this), { passive: false });
    // click убираем, чтобы не мешал
}

// Обновляем иконку закладки после рендера
setTimeout(function() {
    this.updateBookmarkIcon();
}.bind(this), 100);

// Прогресс-бар и ползунок
var progressContainer = document.getElementById('progress-bar-container');
var thumb = document.getElementById('progress-thumb');
var self = this;
var isDragging = false;

if (progressContainer) {
    // Функция обновления позиции по координатам
function updateFromClientX(clientX) {
    var rect = progressContainer.getBoundingClientRect();
    var percent = (clientX - rect.left) / rect.width;
    percent = Math.max(0, Math.min(1, percent));
    var newPage = Math.floor(percent * self.state.totalPages) + 1;
    newPage = Math.max(1, Math.min(self.state.totalPages, newPage));
    
    if (newPage !== self.state.currentPage) {
        self.state.currentPage = newPage;
        // Обновляем содержимое страницы без полного перерендера
        var contentEl = document.getElementById('reader-content');
        if (contentEl) {
            var newContent = self.state.content[newPage - 1] || '<p>Страница не найдена</p>';
            contentEl.innerHTML = newContent;
        }
        // Обновляем прогресс-бар
        var fill = document.querySelector('.mori-reader-progress-fill');
        if (fill) {
            var newPercent = (newPage / self.state.totalPages) * 100;
            fill.style.width = newPercent + '%';
        }
        // Обновляем позицию ползунка
        var thumbEl = document.getElementById('progress-thumb');
        if (thumbEl) {
            var newLeft = ((newPage / self.state.totalPages) * 100) - 8;
            thumbEl.style.left = 'calc(' + newLeft + '% - 8px)';
        }
        // Обновляем номер страницы в футере
        var pageSpan = document.querySelector('.mori-reader-page');
        if (pageSpan) {
            pageSpan.textContent = newPage + ' / ' + self.state.totalPages;
        }
        // Обновляем прогресс в localStorage
        self.saveProgress();
    }
    self.showPageTooltip(newPage, clientX, rect.top);
}
    
    // Клик по прогресс-бару (показывает ползунок и переходит)
    progressContainer.onclick = function(e) {
        e.stopPropagation();
        var rect = progressContainer.getBoundingClientRect();
        var clientX = e.clientX;
        updateFromClientX(clientX);
        self.showProgressThumb();
    };
    
    // Начало перетаскивания (только на ползунке)
    if (thumb) {
        thumb.addEventListener('mousedown', function(e) {
            e.preventDefault();
            e.stopPropagation();
            isDragging = true;
            self.state.isDragging = true;
            var rect = progressContainer.getBoundingClientRect();
            var clientX = e.clientX;
            updateFromClientX(clientX);
        });
        
        thumb.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            isDragging = true;
            self.state.isDragging = true;
            var rect = progressContainer.getBoundingClientRect();
            var touch = e.touches[0];
            updateFromClientX(touch.clientX);
        });
    }
    
    // Движение мыши/пальца
    window.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        e.preventDefault();
        var clientX = e.clientX;
        updateFromClientX(clientX);
        self.showProgressThumb();
    });
    
    window.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        e.preventDefault();
        var touch = e.touches[0];
        updateFromClientX(touch.clientX);
        self.showProgressThumb();
    });
    
    // Конец перетаскивания
    window.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            self.state.isDragging = false;
            self.showProgressThumb();
        }
    });
    
    window.addEventListener('touchend', function() {
        if (isDragging) {
            isDragging = false;
            self.state.isDragging = false;
            self.showProgressThumb();
        }
    });
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
                const contentEl = document.querySelector('.mori-reader-content');
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
                const contentEl = document.querySelector('.mori-reader-content');
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

       document.querySelectorAll('.mori-reader-theme').forEach(btn => {
    btn.onclick = () => {
        this.state.theme = btn.dataset.theme;
        this.renderReader();
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
        this.showProgressThumb();
        setTimeout(function() { this.updateBookmarkIcon(); }.bind(this), 100);
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
        this.showProgressThumb();
        setTimeout(function() { this.updateBookmarkIcon(); }.bind(this), 100);
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

    MORI_APP.showToast(`📖 Страница ${this.state.currentPage} прочитана`, 'success', 2000);
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
