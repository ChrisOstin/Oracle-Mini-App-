/**
 * MUSIC SEARCH
 * Поиск музыки через Яндекс.Музыка API
 * Версия: 1.0.0
 */

const MORI_MUSIC_SEARCH = {
    // Состояние
    state: {
        query: '',
        results: {
            tracks: [],
            albums: [],
            artists: [],
            playlists: []
        },
        history: [],
        suggestions: [],
        isLoading: false,
        error: null
    },

    // API ключ (будет заменён на реальный)
    YANDEX_API_KEY: null,

    // Таймер для debounce
    searchTimer: null,

    /**
     * Инициализация
     */
    init: function() {
        console.log('MORI_MUSIC_SEARCH инициализация...');
        this.loadHistory();
    },

    /**
     * Поиск с debounce
     */
    search: function(query, type = 'all') {
        this.state.query = query;
        this.state.isLoading = true;

        if (this.searchTimer) {
            clearTimeout(this.searchTimer);
        }

        this.searchTimer = setTimeout(() => {
            this.performSearch(query, type);
        }, 300);
    },

    /**
 * Выполнение поиска
 */
performSearch: async function(query, type) {
    if (!query) {
        this.clearResults();
        return;
    }

    this.state.isLoading = true;

    try {
        // Реальный поиск через API
        const results = await this.searchYandexMusic(query, type);

        this.state.results = results;
        this.state.isLoading = false;
        this.state.error = null;

        this.addToHistory(query);

    } catch (error) {
        console.error('Search error:', error);
        this.state.error = error.message;
        this.state.isLoading = false;
        this.state.results = {
            tracks: [],
            albums: [],
            artists: [],
            playlists: []
        };
        
        // Показываем сообщение об ошибке
        MORI_APP.showToast('❌ Ошибка поиска музыки', 'error');
    }
},

    /**
     * Поиск через Яндекс.Музыка
     */
    searchYandexMusic: async function(query, type) {
        if (!this.YANDEX_API_KEY) {
            throw new Error('API ключ не настроен');
        }

        // TODO: реальный API запрос
        const url = `https://api.music.yandex.ru/search?text=${encodeURIComponent(query)}&type=${type}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `OAuth ${this.YANDEX_API_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error('Ошибка API');
        }

        return await response.json();
    },

    /**
     * Очистка результатов
     */
    clearResults: function() {
        this.state.results = {
            tracks: [],
            albums: [],
            artists: [],
            playlists: []
        };
        this.state.isLoading = false;
    },

    /**
     * Добавление в историю
     */
    addToHistory: function(query) {
        if (!query) return;

        // Убираем дубликаты
        this.state.history = this.state.history.filter(q => q !== query);
        
        // Добавляем в начало
        this.state.history.unshift(query);
        
        // Ограничиваем 20 запросами
        if (this.state.history.length > 20) {
            this.state.history = this.state.history.slice(0, 20);
        }

        this.saveHistory();
    },

    /**
     * Загрузка истории
     */
    loadHistory: function() {
        const saved = localStorage.getItem('music_search_history');
        if (saved) {
            this.state.history = JSON.parse(saved);
        }
    },

    /**
     * Сохранение истории
     */
    saveHistory: function() {
        localStorage.setItem('music_search_history', JSON.stringify(this.state.history));
    },

    /**
     * Очистка истории
     */
    clearHistory: function() {
        this.state.history = [];
        this.saveHistory();
    },

    /**
     * Получение популярных запросов
     */
    getPopularQueries: function() {
        // TODO: загружать с сервера
        return [
            'MORI Family',
            'Electronic',
            'Chill',
            'Workout',
            'Relax'
        ];
    },

    /**
     * Получение рекомендаций
     */
    getSuggestions: function(partial) {
        if (!partial) return [];

        // TODO: загружать с сервера
        const suggestions = [
            `${partial} хиты`,
            `${partial} ремикс`,
            `${partial} акустика`,
            `${partial} инструментал`,
            `${partial} live`
        ];

        return suggestions.filter(s => s.toLowerCase().includes(partial.toLowerCase()));
    },

    /**
     * Фильтрация результатов
     */
    filterResults: function(type, filters = {}) {
        let items = this.state.results[type] || [];

        // Фильтр по году
        if (filters.year) {
            items = items.filter(item => item.year === filters.year);
        }

        // Фильтр по исполнителю
        if (filters.artist) {
            items = items.filter(item => 
                item.artist?.toLowerCase().includes(filters.artist.toLowerCase())
            );
        }

        // Фильтр по явному контенту
        if (filters.explicit !== undefined) {
            items = items.filter(item => item.explicit === filters.explicit);
        }

        // Сортировка
        if (filters.sort) {
            switch(filters.sort) {
                case 'popular':
                    items.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
                    break;
                case 'new':
                    items.sort((a, b) => (b.year || 0) - (a.year || 0));
                    break;
                case 'title':
                    items.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
                    break;
            }
        }

        return items;
    },

    /**
     * Получить трек по ID
     */
    getTrackById: function(id) {
        return this.state.results.tracks.find(t => t.id == id);
    },

    /**
     * Получить альбом по ID
     */
    getAlbumById: function(id) {
        return this.state.results.albums.find(a => a.id == id);
    },

    /**
     * Получить исполнителя по ID
     */
    getArtistById: function(id) {
        return this.state.results.artists.find(a => a.id == id);
    },

    /**
     * Рендер результатов поиска
     */
    renderResults: function() {
        const results = this.state.results;
        
        return `
            <div class="search-results-container">
                ${this.renderSection('Треки', results.tracks, this.renderTrack)}
                ${this.renderSection('Альбомы', results.albums, this.renderAlbum)}
                ${this.renderSection('Исполнители', results.artists, this.renderArtist)}
                ${this.renderSection('Плейлисты', results.playlists, this.renderPlaylist)}
            </div>
        `;
    },

    /**
     * Рендер секции
     */
    renderSection: function(title, items, renderFn) {
        if (!items || items.length === 0) return '';

        return `
            <div class="search-section">
                <h4>${title}</h4>
                <div class="search-results-grid">
                    ${items.map(renderFn).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Рендер трека
     */
    renderTrack: function(track) {
        return `
            <div class="track-item" data-track-id="${track.id}">
                <div class="track-cover">${track.cover ? `<img src="${track.cover}">` : '🎵'}</div>
                <div class="track-info">
                    <div class="track-title">${track.title}</div>
                    <div class="track-artist">${track.artist}</div>
                    <div class="track-meta">
                        <span>${track.album}</span>
                        <span>${track.year}</span>
                        <span>${MORI_MUSIC_PLAYER?.formatTime(track.duration)}</span>
                    </div>
                </div>
                <button class="track-play" data-track-id="${track.id}">▶️</button>
            </div>
        `;
    },

    /**
     * Рендер альбома
     */
    renderAlbum: function(album) {
        return `
            <div class="album-item" data-album-id="${album.id}">
                <div class="album-cover">${album.cover ? `<img src="${album.cover}">` : '💿'}</div>
                <div class="album-info">
                    <div class="album-title">${album.title}</div>
                    <div class="album-artist">${album.artist}</div>
                    <div class="album-meta">
                        <span>${album.year}</span>
                        <span>${album.trackCount} треков</span>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Рендер исполнителя
     */
    renderArtist: function(artist) {
        return `
            <div class="artist-item" data-artist-id="${artist.id}">
                <div class="artist-avatar">${artist.avatar ? `<img src="${artist.avatar}">` : '👤'}</div>
                <div class="artist-info">
                    <div class="artist-name">${artist.name}</div>
                    <div class="artist-meta">
                        <span>${artist.followers} подписчиков</span>
                        <span>${artist.genres.join(', ')}</span>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Рендер плейлиста
     */
    renderPlaylist: function(playlist) {
        return `
            <div class="playlist-item" data-playlist-id="${playlist.id}">
                <div class="playlist-cover">${playlist.cover ? `<img src="${playlist.cover}">` : '📋'}</div>
                <div class="playlist-info">
                    <div class="playlist-title">${playlist.title}</div>
                    <div class="playlist-description">${playlist.description}</div>
                    <div class="playlist-meta">${playlist.trackCount} треков</div>
                </div>
            </div>
        `;
    },

    /**
     * Сброс поиска
     */
    reset: function() {
        this.state.query = '';
        this.clearResults();
        this.state.error = null;
    }
};

// Экспорт
window.MORI_MUSIC_SEARCH = MORI_MUSIC_SEARCH;
