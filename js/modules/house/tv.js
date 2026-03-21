/**
 * HOUSE TV
 * Телевизор с YouTube
 * Версия: 2.0.0 (БЕЗ ЗАГЛУШЕК)
 */

const MORI_HOUSE_TV = {
    // Состояние
    state: {
        on: false,
        currentVideo: null,
        searchQuery: '',
        searchResults: [],
        history: [],
        favorites: []
    },

    // YouTube API ключ (позже добавится)
    API_KEY: null,

    /**
     * Инициализация
     */
    init: function() {
        console.log('MORI_HOUSE_TV инициализация...');
        this.loadState();
    },

    /**
     * Включение/выключение
     */
    toggle: function() {
        this.state.on = !this.state.on;
        this.saveState();

        if (this.state.on) {
            MORI_APP.showToast('📺 Телевизор включён', 'success');
        } else {
            MORI_APP.showToast('📺 Телевизор выключен', 'info');
        }

        return this.state.on;
    },

    /**
     * Поиск на YouTube
     */
    search: async function(query) {
        if (!query) {
            this.state.searchResults = [];
            this.state.searchQuery = '';
            this.saveState();
            return [];
        }

        this.state.searchQuery = query;

        // Добавляем в историю
        this.addToHistory(query);

        // Показываем загрузку
        MORI_APP.showToast('🔍 Ищем на YouTube...', 'info');

        try {
            // Пробуем реальный API (если есть ключ)
            if (this.API_KEY) {
                const results = await this.searchYouTubeAPI(query);
                this.state.searchResults = results;
                this.saveState();
                return results;
            } else {
                // Если API ключа нет, показываем сообщение
                MORI_APP.showToast('⚠️ YouTube API ключ не настроен', 'warning');
                this.state.searchResults = [];
                this.saveState();
                return [];
            }
        } catch (error) {
            console.error('YouTube search error:', error);
            MORI_APP.showToast('Ошибка поиска', 'error');
            return [];
        }
    },

    /**
     * Поиск через YouTube API
     */
    searchYouTubeAPI: async function(query) {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&key=${this.API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        if (!data.items) {
            return [];
        }

        return data.items.map(item => ({
            id: item.id.videoId,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.medium.url,
            url: `https://youtu.be/${item.id.videoId}`
        }));
    },

    /**
     * Открыть видео
     */
    watch: function(video) {
        this.state.currentVideo = video;
        this.saveState();

        // Открываем YouTube в отдельном приложении/браузере
        window.open(video.url, '_blank');

        MORI_APP.showToast(`▶️ ${video.title}`, 'info');
    },

    /**
     * Добавить в избранное
     */
    addToFavorites: function(video) {
        if (!this.state.favorites.find(v => v.id === video.id)) {
            this.state.favorites.push(video);
            this.saveState();
            MORI_APP.showToast('⭐ Добавлено в избранное', 'success');
            return true;
        }
        return false;
    },

    /**
     * Удалить из избранного
     */
    removeFromFavorites: function(videoId) {
        const index = this.state.favorites.findIndex(v => v.id === videoId);
        if (index !== -1) {
            this.state.favorites.splice(index, 1);
            this.saveState();
            MORI_APP.showToast('⭐ Удалено из избранного', 'info');
            return true;
        }
        return false;
    },

    /**
     * Добавить в историю
     */
    addToHistory: function(query) {
        // Убираем дубликаты
        this.state.history = this.state.history.filter(q => q !== query);

        // Добавляем в начало
        this.state.history.unshift(query);

        // Ограничиваем 20 запросами
        if (this.state.history.length > 20) {
            this.state.history = this.state.history.slice(0, 20);
        }

        this.saveState();
    },

    /**
     * Получить историю
     */
    getHistory: function() {
        return this.state.history;
    },

    /**
     * Получить избранное
     */
    getFavorites: function() {
        return this.state.favorites;
    },

    /**
     * Очистить историю
     */
    clearHistory: function() {
        this.state.history = [];
        this.saveState();
        MORI_APP.showToast('История очищена', 'info');
    },

    /**
     * Рендер поиска
     */
    renderSearch: function() {
        return `
            <div class="tv-search">
                <div class="search-wrapper">
                    <input type="text"
                           class="search-input"
                           id="tv-search-input"
                           placeholder="Поиск на YouTube..."
                           value="${this.state.searchQuery}">
                    <button class="search-btn" id="tv-search-btn">🔍</button>
                </div>

                ${this.state.searchResults.length > 0 ? `
                    <div class="search-results">
                        ${this.state.searchResults.map(video => `
                            <div class="video-item" data-video-id="${video.id}">
                                <img src="${video.thumbnail}" alt="${video.title}" class="video-thumb">
                                <div class="video-info">
                                    <div class="video-title">${video.title}</div>
                                    <div class="video-channel">${video.channel}</div>
                                </div>
                                <button class="video-watch" data-video='${JSON.stringify(video)}'>
                                    ▶️
                                </button>
                                <button class="video-favorite" data-video-id="${video.id}">
                                    ⭐
                                </button>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    },

    /**
     * Рендер избранного
     */
    renderFavorites: function() {
        if (this.state.favorites.length === 0) {
            return '<div class="empty-fav">⭐ Нет избранных видео</div>';
        }

        return `
            <div class="favorites-list">
                ${this.state.favorites.map(video => `
                    <div class="favorite-item" data-video-id="${video.id}">
                        <img src="${video.thumbnail}" alt="${video.title}" class="fav-thumb">
                        <div class="fav-info">
                            <div class="fav-title">${video.title}</div>
                            <div class="fav-channel">${video.channel}</div>
                        </div>
                        <button class="fav-watch" data-video='${JSON.stringify(video)}'>▶️</button>
                        <button class="fav-remove" data-video-id="${video.id}">✕</button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * Рендер истории
     */
    renderHistory: function() {
        if (this.state.history.length === 0) {
            return '<div class="empty-history">📋 История пуста</div>';
        }

        return `
            <div class="history-list">
                ${this.state.history.map(query => `
                    <div class="history-item" data-query="${query}">
                        <span class="history-icon">🔍</span>
                        <span class="history-query">${query}</span>
                        <button class="history-search" data-query="${query}">▶️</button>
                        <button class="history-delete" data-query="${query}">✕</button>
                    </div>
                `).join('')}
                <button class="history-clear" id="clear-history">Очистить всё</button>
            </div>
        `;
    },

    /**
     * Обработчики
     */
    attachEvents: function() {
        // Поиск
        const searchBtn = document.getElementById('tv-search-btn');
        const searchInput = document.getElementById('tv-search-input');

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.search(searchInput.value);
            });
        }

        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.search(searchInput.value);
                }
            });
        }

        // Видео
        document.querySelectorAll('.video-watch').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const video = JSON.parse(e.target.dataset.video);
                this.watch(video);
            });
        });

        document.querySelectorAll('.video-favorite').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const videoId = e.target.dataset.videoId;
                const video = this.state.searchResults.find(v => v.id === videoId);
                if (video) {
                    this.addToFavorites(video);
                }
            });
        });

        // Избранное
        document.querySelectorAll('.fav-watch').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const video = JSON.parse(e.target.dataset.video);
                this.watch(video);
            });
        });

        document.querySelectorAll('.fav-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const videoId = e.target.dataset.videoId;
                this.removeFromFavorites(videoId);
                // Перерендериваем
                const container = document.getElementById('tv-content');
                if (container) container.innerHTML = this.renderFavorites();
                this.attachEvents();
            });
        });

        // История
        document.querySelectorAll('.history-search').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const query = e.target.dataset.query;
                this.search(query);
            });
        });

        document.querySelectorAll('.history-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const query = e.target.dataset.query;
                this.state.history = this.state.history.filter(q => q !== query);
                this.saveState();
                // Перерендерим
                const container = document.getElementById('tv-content');
                if (container) container.innerHTML = this.renderHistory();
                this.attachEvents();
            });
        });

        document.getElementById('clear-history')?.addEventListener('click', () => {
            this.clearHistory();
            // Перерендерим
            const container = document.getElementById('tv-content');
            if (container) container.innerHTML = this.renderHistory();
            this.attachEvents();
        });
    },

    /**
     * Загрузка состояния
     */
    loadState: function() {
        try {
            const saved = localStorage.getItem('house_tv');
            if (saved) {
                this.state = { ...this.state, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('Error loading TV state:', error);
        }
    },

    /**
     * Сохранение состояния
     */
    saveState: function() {
        try {
            localStorage.setItem('house_tv', JSON.stringify(this.state));
        } catch (error) {
            console.error('Error saving TV state:', error);
        }
    },

    /**
     * Сброс (для админа)
     */
    reset: function() {
        this.state = {
            on: false,
            currentVideo: null,
            searchQuery: '',
            searchResults: [],
            history: [],
            favorites: []
        };
        this.saveState();
    }
};

// Экспорт
window.MORI_HOUSE_TV = MORI_HOUSE_TV;
