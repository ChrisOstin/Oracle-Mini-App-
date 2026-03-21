/**
 * MUSIC MODULE
 * Поиск и прослушивание музыки
 * Версия: 1.0.0
 */

const MORI_MUSIC = {
    // Состояние
    state: {
        activeTab: 'search', // 'search', 'playlists', 'favorites'
        searchQuery: '',
        searchResults: [],
        playlists: [],
        favorites: [],
        history: [],
        currentTrack: null,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        volume: 80,
        filter: 'all' // 'all', 'tracks', 'albums', 'artists'
    },

    // API ключ (будет заменён на реальный)
    YANDEX_API_KEY: null,

    /**
     * Инициализация
     */
    init: function() {
        console.log('MORI_MUSIC инициализация...');
        this.loadFavorites();
        this.loadPlaylists();
        this.loadHistory();
    },

    /**
     * Рендер
     */
    render: function() {
        const content = document.getElementById('music-content');
        if (!content) return;

        content.innerHTML = this.getHTML();
        this.attachEvents();
    },

    /**
     * HTML
     */
    getHTML: function() {
        return `
            <div class="music-screen">
                <!-- Шапка -->
                <div class="music-header">
                    <h2>🎵 Музыка</h2>
                    ${this.state.currentTrack ? `
                        <div class="music-now-playing" id="now-playing">
                            <span class="now-playing-icon">▶️</span>
                            <span>${this.state.currentTrack.title}</span>
                        </div>
                    ` : ''}
                </div>

                <!-- Вкладки -->
                <div class="music-tabs">
                    <button class="music-tab ${this.state.activeTab === 'search' ? 'active' : ''}" 
                            data-tab="search">
                        🔍 Поиск
                    </button>
                    <button class="music-tab ${this.state.activeTab === 'playlists' ? 'active' : ''}" 
                            data-tab="playlists">
                        📋 Плейлисты
                    </button>
                    <button class="music-tab ${this.state.activeTab === 'favorites' ? 'active' : ''}" 
                            data-tab="favorites">
                        ⭐ Избранное
                    </button>
                </div>

                <!-- Контейнер -->
                <div class="music-container">
                    ${this.renderTabContent()}
                </div>

                <!-- Плеер -->
                ${this.renderPlayer()}
            </div>
        `;
    },

    /**
     * Рендер контента вкладки
     */
    renderTabContent: function() {
        switch(this.state.activeTab) {
            case 'search':
                return this.renderSearch();
            case 'playlists':
                return this.renderPlaylists();
            case 'favorites':
                return this.renderFavorites();
            default:
                return '';
        }
    },

    /**
     * Вкладка поиска
     */
    renderSearch: function() {
        return `
            <div class="search-section">
                <div class="search-wrapper">
                    <input type="text" 
                           class="search-input" 
                           id="music-search"
                           placeholder="🔍 Поиск треков, альбомов, исполнителей..."
                           value="${this.state.searchQuery}">
                    <button class="search-btn" id="search-btn">🔍</button>
                </div>

                <div class="search-filters">
                    <button class="filter-chip ${this.state.filter === 'all' ? 'active' : ''}" 
                            data-filter="all">Все</button>
                    <button class="filter-chip ${this.state.filter === 'tracks' ? 'active' : ''}" 
                            data-filter="tracks">Треки</button>
                    <button class="filter-chip ${this.state.filter === 'albums' ? 'active' : ''}" 
                            data-filter="albums">Альбомы</button>
                    <button class="filter-chip ${this.state.filter === 'artists' ? 'active' : ''}" 
                            data-filter="artists">Исполнители</button>
                </div>

                <div class="search-results" id="search-results">
                    ${this.renderSearchResults()}
                </div>
            </div>
        `;
    },

    /**
     * Результаты поиска
     */
    renderSearchResults: function() {
        if (this.state.searchResults.length === 0) {
            return `
                <div class="empty-apps" style="grid-column: 1/-1;">
                    <div class="empty-icon">🔍</div>
                    <h3>Начните поиск</h3>
                    <p>Найдите свою любимую музыку</p>
                </div>
            `;
        }

        return this.state.searchResults.map(track => this.renderTrackCard(track)).join('');
    },

    /**
     * Карточка трека
     */
    renderTrackCard: function(track) {
        const isFavorite = this.state.favorites.some(f => f.id === track.id);
        
        return `
            <div class="track-card" data-track-id="${track.id}">
                <div class="track-cover">
                    ${track.cover ? `<img src="${track.cover}" alt="${track.title}">` : '🎵'}
                    <span class="track-preview">10s</span>
                </div>
                <div class="track-info">
                    <div class="track-title">${track.title}</div>
                    <div class="track-artist">${track.artist}</div>
                    <div class="track-meta">
                        <span class="track-duration">${this.formatDuration(track.duration)}</span>
                        <span class="track-quality">320kbps</span>
                    </div>
                </div>
                <div class="track-actions">
                    <button class="track-action play-preview" data-track-id="${track.id}">▶️</button>
                    <button class="track-action favorite ${isFavorite ? 'active' : ''}" 
                            data-track-id="${track.id}">
                        ${isFavorite ? '★' : '☆'}
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Вкладка плейлистов
     */
    renderPlaylists: function() {
        return `
            <div class="playlists-section">
                <div class="playlists-header">
                    <h3>📋 Мои плейлисты</h3>
                    <button class="create-playlist-btn" id="create-playlist">
                        ➕ Создать
                    </button>
                </div>

                <div class="playlists-grid">
                    ${this.renderPlaylistsGrid()}
                </div>
            </div>
        `;
    },

    /**
     * Сетка плейлистов
     */
    renderPlaylistsGrid: function() {
        if (this.state.playlists.length === 0) {
            return `
                <div class="empty-apps" style="grid-column: 1/-1;">
                    <div class="empty-icon">📋</div>
                    <h3>Нет плейлистов</h3>
                    <p>Создайте свой первый плейлист</p>
                </div>
            `;
        }

        return this.state.playlists.map(playlist => `
            <div class="playlist-card" data-playlist-id="${playlist.id}">
                <div class="playlist-cover">
                    ${playlist.cover || '📋'}
                </div>
                <div class="playlist-info">
                    <div class="playlist-name">${playlist.name}</div>
                    <div class="playlist-count">${playlist.tracks?.length || 0} треков</div>
                </div>
                <div class="playlist-actions">
                    <button class="playlist-action play" data-playlist-id="${playlist.id}">▶️</button>
                    <button class="playlist-action edit" data-playlist-id="${playlist.id}">✎</button>
                    <button class="playlist-action delete" data-playlist-id="${playlist.id}">🗑️</button>
                </div>
            </div>
        `).join('');
    },

    /**
     * Вкладка избранного
     */
    renderFavorites: function() {
        return `
            <div class="favorites-section">
                <div class="favorites-header">
                    <h3>⭐ Избранные треки</h3>
                </div>

                <div class="favorites-grid">
                    ${this.renderFavoritesGrid()}
                </div>
            </div>
        `;
    },

    /**
     * Сетка избранного
     */
    renderFavoritesGrid: function() {
        if (this.state.favorites.length === 0) {
            return `
                <div class="empty-apps" style="grid-column: 1/-1;">
                    <div class="empty-icon">⭐</div>
                    <h3>Нет избранных</h3>
                    <p>Добавляйте треки в избранное</p>
                </div>
            `;
        }

        return this.state.favorites.map(track => `
            <div class="favorite-item" data-track-id="${track.id}">
                <div class="favorite-cover">
                    ${track.cover ? `<img src="${track.cover}" alt="${track.title}">` : '🎵'}
                </div>
                <div class="favorite-info">
                    <div class="favorite-title">${track.title}</div>
                    <div class="favorite-artist">${track.artist}</div>
                </div>
                <button class="favorite-remove" data-track-id="${track.id}">✕</button>
            </div>
        `).join('');
    },

    /**
     * Плеер
     */
    renderPlayer: function() {
        if (!this.state.currentTrack) return '';

        const progress = this.state.duration > 0 
            ? (this.state.currentTime / this.state.duration) * 100 
            : 0;

        return `
            <div class="player-bar active" id="player-bar">
                <div class="player-cover">
                    ${this.state.currentTrack.cover || '🎵'}
                </div>
                
                <div class="player-info">
                    <div class="player-title">${this.state.currentTrack.title}</div>
                    <div class="player-artist">${this.state.currentTrack.artist}</div>
                </div>

                <div class="player-progress">
                    <span class="progress-time">${this.formatTime(this.state.currentTime)}</span>
                    <div class="progress-bar" id="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                        <div class="progress-handle" style="left: ${progress}%"></div>
                    </div>
                    <span class="progress-time">${this.formatTime(this.state.duration)}</span>
                </div>

                <div class="player-controls">
                    <button class="player-btn" id="prev-track">⏮️</button>
                    <button class="player-btn play" id="play-pause">
                        ${this.state.isPlaying ? '⏸️' : '▶️'}
                    </button>
                    <button class="player-btn" id="next-track">⏭️</button>
                </div>

                <div class="player-controls">
                    <button class="player-btn volume" id="toggle-volume">
                        ${this.state.volume === 0 ? '🔇' : this.state.volume < 50 ? '🔉' : '🔊'}
                    </button>
                    <div class="player-volume" id="volume-bar">
                        <div class="volume-fill" style="width: ${this.state.volume}%"></div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Обработчики
     */
    attachEvents: function() {
        // Переключение вкладок
        document.querySelectorAll('.music-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.setState({ activeTab: tabName });
            });
        });

        // Поиск
        const searchInput = document.getElementById('music-search');
        const searchBtn = document.getElementById('search-btn');

        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.search(searchInput.value);
                }
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.search(searchInput?.value || '');
            });
        }

        // Фильтры
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.setState({ filter });
            });
        });

        // Предпрослушивание
        document.querySelectorAll('.play-preview').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const trackId = e.target.dataset.trackId;
                this.playPreview(trackId);
            });
        });

        // Избранное
        document.querySelectorAll('.track-action.favorite').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const trackId = e.target.dataset.trackId;
                this.toggleFavorite(trackId);
            });
        });

        // Карточки треков
        document.querySelectorAll('.track-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('track-action')) {
                    const trackId = card.dataset.trackId;
                    this.playTrack(trackId);
                }
            });
        });

        // Удаление из избранного
        document.querySelectorAll('.favorite-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const trackId = e.target.dataset.trackId;
                this.removeFromFavorites(trackId);
            });
        });

        // Плеер
        const playBtn = document.getElementById('play-pause');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.togglePlay();
            });
        }

        document.getElementById('prev-track')?.addEventListener('click', () => {
            this.prevTrack();
        });

        document.getElementById('next-track')?.addEventListener('click', () => {
            this.nextTrack();
        });

        // Прогресс-бар
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.addEventListener('click', (e) => {
                const rect = progressBar.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                this.seek(pos * this.state.duration);
            });
        }

        // Громкость
        const volumeBar = document.getElementById('volume-bar');
        if (volumeBar) {
            volumeBar.addEventListener('click', (e) => {
                const rect = volumeBar.getBoundingClientRect();
                const volume = Math.round((e.clientX - rect.left) / rect.width * 100);
                this.setVolume(volume);
            });
        }

        document.getElementById('toggle-volume')?.addEventListener('click', () => {
            this.toggleMute();
        });

        // Создание плейлиста
        document.getElementById('create-playlist')?.addEventListener('click', () => {
            this.createPlaylist();
        });

        // Действия с плейлистами
        document.querySelectorAll('.playlist-action.play').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const playlistId = e.target.dataset.playlistId;
                this.playPlaylist(playlistId);
            });
        });

        document.querySelectorAll('.playlist-action.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const playlistId = e.target.dataset.playlistId;
                this.editPlaylist(playlistId);
            });
        });

        document.querySelectorAll('.playlist-action.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const playlistId = e.target.dataset.playlistId;
                this.deletePlaylist(playlistId);
            });
        });
    },

    /**
 * Поиск музыки
 */
search: async function(query) {
    if (!query) {
        this.setState({ searchResults: [] });
        return;
    }

    this.setState({ searchQuery: query });

    try {
        // Реальный поиск через API
        const results = await MORI_API.searchMusic(query);
        if (results && results.length) {
            this.setState({ searchResults: results });
        } else {
            this.setState({ searchResults: [] });
            MORI_APP.showToast('Ничего не найдено', 'info');
        }
    } catch (error) {
        console.error('Search error:', error);
        MORI_APP.showToast('Ошибка поиска', 'error');
        this.setState({ searchResults: [] });
    }
},

    /**
     * Предпрослушивание (10 секунд)
     */
    playPreview: function(trackId) {
        const track = this.findTrack(trackId);
        if (!track) return;

        MORI_APP.showToast(`🔊 Предпрослушивание: ${track.title} (10 сек)`, 'info');
        
        // TODO: реальное предпрослушивание
        this.addToHistory(track);
    },

    /**
     * Воспроизведение трека
     */
    playTrack: function(trackId) {
        const track = this.findTrack(trackId);
        if (!track) return;

        this.state.currentTrack = track;
        this.state.isPlaying = true;
        this.state.currentTime = 0;
        this.state.duration = track.duration || 180;

        this.addToHistory(track);
        this.render();

        // Имитация воспроизведения
        this.startPlaybackSimulation();
    },

    /**
     * Имитация воспроизведения
     */
    startPlaybackSimulation: function() {
        if (this.playbackInterval) {
            clearInterval(this.playbackInterval);
        }

        this.playbackInterval = setInterval(() => {
            if (this.state.isPlaying && this.state.currentTime < this.state.duration) {
                this.state.currentTime++;
                this.updatePlayerProgress();
            } else if (this.state.currentTime >= this.state.duration) {
                this.nextTrack();
            }
        }, 1000);
    },

    /**
     * Обновление прогресса плеера
     */
    updatePlayerProgress: function() {
        const progressFill = document.querySelector('.progress-fill');
        const progressHandle = document.querySelector('.progress-handle');
        const currentTimeEl = document.querySelector('.progress-time:first-child');
        
        if (progressFill) {
            const progress = (this.state.currentTime / this.state.duration) * 100;
            progressFill.style.width = `${progress}%`;
            if (progressHandle) progressHandle.style.left = `${progress}%`;
        }
        
        if (currentTimeEl) {
            currentTimeEl.textContent = this.formatTime(this.state.currentTime);
        }
    },

    /**
     * Пауза/воспроизведение
     */
    togglePlay: function() {
        this.state.isPlaying = !this.state.isPlaying;
        const playBtn = document.getElementById('play-pause');
        if (playBtn) playBtn.textContent = this.state.isPlaying ? '⏸️' : '▶️';
    },

    /**
     * Предыдущий трек
     */
    prevTrack: function() {
        // TODO: логика предыдущего трека
        MORI_APP.showToast('⏮️ Предыдущий трек', 'info');
    },

    /**
     * Следующий трек
     */
    nextTrack: function() {
        // TODO: логика следующего трека
        MORI_APP.showToast('⏭️ Следующий трек', 'info');
    },

    /**
     * Перемотка
     */
    seek: function(time) {
        this.state.currentTime = Math.min(time, this.state.duration);
        this.updatePlayerProgress();
    },

    /**
     * Установка громкости
     */
    setVolume: function(volume) {
        this.state.volume = Math.min(100, Math.max(0, volume));
        
        const volumeFill = document.querySelector('.volume-fill');
        if (volumeFill) volumeFill.style.width = `${this.state.volume}%`;
        
        const volumeBtn = document.getElementById('toggle-volume');
        if (volumeBtn) {
            volumeBtn.textContent = this.state.volume === 0 ? '🔇' : 
                                   this.state.volume < 50 ? '🔉' : '🔊';
        }
    },

    /**
     * Вкл/выкл звук
     */
    toggleMute: function() {
        if (this.state.volume > 0) {
            this.prevVolume = this.state.volume;
            this.setVolume(0);
        } else {
            this.setVolume(this.prevVolume || 80);
        }
    },

    /**
     * Добавить в избранное
     */
    toggleFavorite: function(trackId) {
        const track = this.findTrack(trackId);
        if (!track) return;

        const index = this.state.favorites.findIndex(f => f.id === trackId);
        
        if (index === -1) {
            this.state.favorites.push(track);
            MORI_APP.showToast(`⭐ Добавлено в избранное`, 'success');
        } else {
            this.state.favorites.splice(index, 1);
            MORI_APP.showToast(`☆ Удалено из избранного`, 'info');
        }

        this.saveFavorites();
        this.render();
    },

    /**
     * Удалить из избранного
     */
    removeFromFavorites: function(trackId) {
        this.state.favorites = this.state.favorites.filter(f => f.id !== trackId);
        this.saveFavorites();
        this.render();
        MORI_APP.showToast('☆ Удалено из избранного', 'info');
    },

    /**
     * Добавить в историю
     */
    addToHistory: function(track) {
        this.state.history.unshift({
            ...track,
            playedAt: Date.now()
        });

        if (this.state.history.length > 50) {
            this.state.history = this.state.history.slice(0, 50);
        }

        this.saveHistory();
    },

    /**
     * Создать плейлист
     */
    createPlaylist: function() {
        const name = prompt('Название плейлиста:');
        if (!name) return;

        const newPlaylist = {
            id: Date.now(),
            name,
            tracks: [],
            createdAt: Date.now()
        };

        this.state.playlists.push(newPlaylist);
        this.savePlaylists();
        this.render();
        MORI_APP.showToast(`✅ Плейлист "${name}" создан`, 'success');
    },

    /**
     * Редактировать плейлист
     */
    editPlaylist: function(playlistId) {
        const playlist = this.state.playlists.find(p => p.id === playlistId);
        if (!playlist) return;

        const newName = prompt('Новое название:', playlist.name);
        if (newName) {
            playlist.name = newName;
            this.savePlaylists();
            this.render();
            MORI_APP.showToast('✅ Плейлист переименован', 'success');
        }
    },

    /**
     * Удалить плейлист
     */
    deletePlaylist: function(playlistId) {
        if (!confirm('Удалить плейлист?')) return;

        this.state.playlists = this.state.playlists.filter(p => p.id !== playlistId);
        this.savePlaylists();
        this.render();
        MORI_APP.showToast('🗑️ Плейлист удалён', 'info');
    },

    /**
     * Воспроизвести плейлист
     */
    playPlaylist: function(playlistId) {
        const playlist = this.state.playlists.find(p => p.id === playlistId);
        if (!playlist || playlist.tracks.length === 0) return;

        this.playTrack(playlist.tracks[0].id);
        MORI_APP.showToast(`▶️ Плейлист "${playlist.name}"`, 'info');
    },

    /**
     * Поиск трека по ID
     */
    findTrack: function(trackId) {
        // Сначала в результатах поиска
        let track = this.state.searchResults.find(t => t.id == trackId);
        
        // Потом в избранном
        if (!track) {
            track = this.state.favorites.find(t => t.id == trackId);
        }
        
        return track;
    },

    /**
     * Форматирование времени
     */
    formatTime: function(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    /**
     * Форматирование длительности
     */
    formatDuration: function(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    /**
     * Сохранение избранного
     */
    saveFavorites: function() {
        localStorage.setItem('music_favorites', JSON.stringify(this.state.favorites));
    },

    /**
     * Загрузка избранного
     */
    loadFavorites: function() {
        const saved = localStorage.getItem('music_favorites');
        if (saved) {
            this.state.favorites = JSON.parse(saved);
        }
    },

    /**
     * Сохранение плейлистов
     */
    savePlaylists: function() {
        localStorage.setItem('music_playlists', JSON.stringify(this.state.playlists));
    },

    /**
     * Загрузка плейлистов
     */
    loadPlaylists: function() {
        const saved = localStorage.getItem('music_playlists');
        if (saved) {
            this.state.playlists = JSON.parse(saved);
        }
    },

    /**
     * Сохранение истории
     */
    saveHistory: function() {
        localStorage.setItem('music_history', JSON.stringify(this.state.history));
    },

    /**
     * Загрузка истории
     */
    loadHistory: function() {
        const saved = localStorage.getItem('music_history');
        if (saved) {
            this.state.history = JSON.parse(saved);
        }
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
window.MORI_MUSIC = MORI_MUSIC;
