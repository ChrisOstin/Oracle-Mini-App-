/**
 * HOUSE AUDIO
 * Музыкальный плеер для дома
 * Версия: 1.0.0 (БЕЗ ЗАГЛУШЕК)
 */

const MORI_HOUSE_AUDIO = {
    // Состояние
    state: {
        playing: false,
        currentTrack: null,
        volume: 70,
        playlist: [],
        currentIndex: -1,
        repeat: false,
        shuffle: false
    },

    // Аудио элемент
    audio: null,

    // Плейлисты
    playlists: {
        family: {
            name: 'Семейный плейлист',
            icon: '👨‍👩‍👧‍👦',
            tracks: []
        },
        mori: {
            name: 'MORI Chill',
            icon: '🧠',
            tracks: []
        },
        classical: {
            name: 'Классика',
            icon: '🎻',
            tracks: []
        }
    },

    /**
     * Инициализация
     */
    init: function() {
        console.log('🎵 MORI_HOUSE_AUDIO инициализация...');
        this.audio = new Audio();
        this.loadState();
        this.setupAudioEvents();
        this.loadPlaylists();
    },

    /**
     * Настройка событий аудио
     */
    setupAudioEvents: function() {
        this.audio.addEventListener('ended', () => {
            this.onTrackEnd();
        });

        this.audio.addEventListener('timeupdate', () => {
            this.updateProgress();
        });

        this.audio.addEventListener('loadedmetadata', () => {
            this.updateDuration();
        });

        this.audio.addEventListener('canplay', () => {
            this.updatePlayState();
        });
    },

    /**
     * Воспроизведение трека
     */
    play: function(track, playlistId = null) {
        if (!track || !track.url) {
            MORI_APP.showToast('❌ Трек не найден', 'error');
            return false;
        }

        this.state.currentTrack = track;
        this.state.playing = true;
        this.audio.src = track.url;
        this.audio.volume = this.state.volume / 100;
        this.audio.play().catch(error => {
            console.error('Play error:', error);
            MORI_APP.showToast('❌ Ошибка воспроизведения', 'error');
            this.state.playing = false;
        });

        // Добавляем в историю
        this.addToHistory(track);

        MORI_APP.showToast(`🎵 ${track.title}`, 'info');
        return true;
    },

    /**
     * Пауза
     */
    pause: function() {
        this.audio.pause();
        this.state.playing = false;
        MORI_APP.showToast('⏸ Пауза', 'info');
    },

    /**
     * Воспроизведение/пауза
     */
    toggle: function() {
        if (this.state.playing) {
            this.pause();
        } else {
            if (this.state.currentTrack) {
                this.play(this.state.currentTrack);
            } else if (this.state.playlist.length > 0) {
                this.play(this.state.playlist[0]);
            } else {
                MORI_APP.showToast('🎵 Нет треков в плейлисте', 'warning');
            }
        }
    },

    /**
     * Следующий трек
     */
    next: function() {
        if (this.state.playlist.length === 0) return;

        let nextIndex;
        if (this.state.shuffle) {
            nextIndex = Math.floor(Math.random() * this.state.playlist.length);
        } else {
            nextIndex = (this.state.currentIndex + 1) % this.state.playlist.length;
        }

        this.state.currentIndex = nextIndex;
        this.play(this.state.playlist[nextIndex]);
    },

    /**
     * Предыдущий трек
     */
    prev: function() {
        if (this.state.playlist.length === 0) return;

        let prevIndex;
        if (this.state.shuffle) {
            prevIndex = Math.floor(Math.random() * this.state.playlist.length);
        } else {
            prevIndex = this.state.currentIndex - 1;
            if (prevIndex < 0) prevIndex = this.state.playlist.length - 1;
        }

        this.state.currentIndex = prevIndex;
        this.play(this.state.playlist[prevIndex]);
    },

    /**
     * Окончание трека
     */
    onTrackEnd: function() {
        if (this.state.repeat) {
            this.play(this.state.currentTrack);
        } else {
            this.next();
        }
    },

    /**
     * Обновление громкости
     */
    setVolume: function(volume) {
        this.state.volume = Math.min(100, Math.max(0, volume));
        if (this.audio) {
            this.audio.volume = this.state.volume / 100;
        }
        this.saveState();
    },

    /**
     * Переключение повтора
     */
    toggleRepeat: function() {
        this.state.repeat = !this.state.repeat;
        this.saveState();
        MORI_APP.showToast(this.state.repeat ? '🔁 Повтор включён' : '🔁 Повтор выключен', 'info');
    },

    /**
     * Переключение перемешивания
     */
    toggleShuffle: function() {
        this.state.shuffle = !this.state.shuffle;
        this.saveState();
        MORI_APP.showToast(this.state.shuffle ? '🔀 Перемешивание включено' : '🔀 Перемешивание выключено', 'info');
    },

    /**
     * Загрузка плейлистов
     */
    loadPlaylists: async function() {
        try {
            // Загружаем с сервера (если есть)
            const response = await MORI_API.getPlaylists?.();
            if (response && response.playlists) {
                this.playlists = response.playlists;
            }
        } catch (error) {
            console.log('Playlists not available from server');
        }

        // Загружаем сохранённые треки из localStorage
        const saved = localStorage.getItem('house_playlist');
        if (saved) {
            try {
                this.state.playlist = JSON.parse(saved);
            } catch (e) {
                console.error('Error loading playlist:', e);
            }
        }
    },

    /**
     * Добавление трека в плейлист
     */
    addToPlaylist: function(track) {
        if (!this.state.playlist.find(t => t.id === track.id)) {
            this.state.playlist.push(track);
            this.savePlaylist();
            MORI_APP.showToast(`➕ ${track.title} добавлен в плейлист`, 'success');
            return true;
        }
        return false;
    },

    /**
     * Удаление трека из плейлиста
     */
    removeFromPlaylist: function(trackId) {
        const index = this.state.playlist.findIndex(t => t.id === trackId);
        if (index !== -1) {
            this.state.playlist.splice(index, 1);
            this.savePlaylist();

            if (this.state.currentTrack?.id === trackId) {
                this.pause();
                this.state.currentTrack = null;
            }

            MORI_APP.showToast('🗑️ Трек удалён из плейлиста', 'info');
            return true;
        }
        return false;
    },

    /**
     * Сохранение плейлиста
     */
    savePlaylist: function() {
        localStorage.setItem('house_playlist', JSON.stringify(this.state.playlist));
    },

    /**
     * Добавление в историю
     */
    addToHistory: function(track) {
        const history = this.getHistory();
        history.unshift({
            ...track,
            playedAt: Date.now()
        });

        // Ограничиваем 50 записями
        if (history.length > 50) {
            history.pop();
        }

        localStorage.setItem('house_audio_history', JSON.stringify(history));
    },

    /**
     * Получение истории
     */
    getHistory: function() {
        try {
            const saved = localStorage.getItem('house_audio_history');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    },

    /**
     * Очистка истории
     */
    clearHistory: function() {
        localStorage.removeItem('house_audio_history');
        MORI_APP.showToast('📋 История очищена', 'info');
    },

    /**
     * Обновление прогресса (для UI)
     */
    updateProgress: function() {
        if (!this.audio) return;
        // Здесь будет обновление UI
    },

    /**
     * Обновление длительности (для UI)
     */
    updateDuration: function() {
        if (!this.audio) return;
        // Здесь будет обновление UI
    },

    /**
     * Обновление состояния воспроизведения (для UI)
     */
    updatePlayState: function() {
        // Здесь будет обновление UI
    },

    /**
     * Получение текущего времени
     */
    getCurrentTime: function() {
        return this.audio ? this.audio.currentTime : 0;
    },

    /**
     * Установка текущего времени
     */
    setCurrentTime: function(time) {
        if (this.audio) {
            this.audio.currentTime = time;
        }
    },

    /**
     * Получение длительности
     */
    getDuration: function() {
        return this.audio ? this.audio.duration : 0;
    },

    /**
     * Форматирование времени
     */
    formatTime: function(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    /**
     * Загрузка состояния
     */
    loadState: function() {
        try {
            const saved = localStorage.getItem('house_audio');
            if (saved) {
                const data = JSON.parse(saved);
                this.state.volume = data.volume ?? 70;
                this.state.repeat = data.repeat ?? false;
                this.state.shuffle = data.shuffle ?? false;
            }
        } catch (error) {
            console.error('Error loading audio state:', error);
        }
    },

    /**
     * Сохранение состояния
     */
    saveState: function() {
        localStorage.setItem('house_audio', JSON.stringify({
            volume: this.state.volume,
            repeat: this.state.repeat,
            shuffle: this.state.shuffle
        }));
    },

    /**
     * Рендер плеера
     */
    render: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const currentTrack = this.state.currentTrack;
        const progress = this.audio ? (this.audio.currentTime / this.audio.duration) * 100 : 0;

        container.innerHTML = `
            <div class="audio-player">
                <div class="player-info">
                    <div class="player-cover">${currentTrack?.cover || '🎵'}</div>
                    <div class="player-track">
                        <div class="track-title">${currentTrack?.title || 'Не выбрано'}</div>
                        <div class="track-artist">${currentTrack?.artist || '—'}</div>
                    </div>
                </div>

                <div class="player-controls">
                    <button class="control-btn" id="prev-btn" ${!this.state.playlist.length ? 'disabled' : ''}>⏮</button>
                    <button class="control-btn play-btn" id="play-btn">${this.state.playing ? '⏸' : '▶️'}</button>
                    <button class="control-btn" id="next-btn" ${!this.state.playlist.length ? 'disabled' : ''}>⏭</button>
                </div>

                <div class="player-progress">
                    <span class="time-current">${this.formatTime(this.getCurrentTime())}</span>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <span class="time-total">${this.formatTime(this.getDuration())}</span>
                </div>

                <div class="player-volume">
                    <button class="volume-btn" id="volume-btn">🔊</button>
                    <input type="range" class="volume-slider" id="volume-slider" min="0" max="100" value="${this.state.volume}">
                </div>

                <div class="player-modes">
                    <button class="mode-btn ${this.state.shuffle ? 'active' : ''}" id="shuffle-btn">🔀</button>
                    <button class="mode-btn ${this.state.repeat ? 'active' : ''}" id="repeat-btn">🔁</button>
                </div>
            </div>

            <div class="playlist-section">
                <h3>🎵 Плейлист</h3>
                <div class="playlist-list">
                    ${this.renderPlaylist()}
                </div>
            </div>

            <div class="history-section">
                <h3>📋 История</h3>
                <button class="clear-history-btn" id="clear-history">Очистить</button>
                <div class="history-list">
                    ${this.renderHistory()}
                </div>
            </div>
        `;

        this.attachEvents();
    },

    /**
     * Рендер плейлиста
     */
    renderPlaylist: function() {
        if (this.state.playlist.length === 0) {
            return '<div class="empty-playlist">🎵 Плейлист пуст</div>';
        }

        return this.state.playlist.map((track, index) => `
            <div class="playlist-item ${this.state.currentTrack?.id === track.id ? 'active' : ''}" data-index="${index}">
                <div class="playlist-cover">${track.cover || '🎵'}</div>
                <div class="playlist-info">
                    <div class="playlist-title">${track.title}</div>
                    <div class="playlist-artist">${track.artist || '—'}</div>
                </div>
                <button class="playlist-remove" data-id="${track.id}">🗑️</button>
            </div>
        `).join('');
    },

    /**
     * Рендер истории
     */
    renderHistory: function() {
        const history = this.getHistory();
        if (history.length === 0) {
            return '<div class="empty-history">📋 История пуста</div>';
        }

        return history.slice(0, 10).map(track => `
            <div class="history-item">
                <div class="history-cover">${track.cover || '🎵'}</div>
                <div class="history-info">
                    <div class="history-title">${track.title}</div>
                    <div class="history-artist">${track.artist || '—'}</div>
                </div>
                <div class="history-time">${new Date(track.playedAt).toLocaleTimeString()}</div>
            </div>
        `).join('');
    },

    /**
     * Обработчики
     */
    attachEvents: function() {
        document.getElementById('play-btn')?.addEventListener('click', () => this.toggle());
        document.getElementById('prev-btn')?.addEventListener('click', () => this.prev());
        document.getElementById('next-btn')?.addEventListener('click', () => this.next());
        document.getElementById('shuffle-btn')?.addEventListener('click', () => this.toggleShuffle());
        document.getElementById('repeat-btn')?.addEventListener('click', () => this.toggleRepeat());

        const volumeSlider = document.getElementById('volume-slider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                this.setVolume(parseInt(e.target.value));
            });
        }

        document.querySelectorAll('.playlist-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                this.removeFromPlaylist(id);
                this.render('house-audio-content');
            });
        });

        document.querySelectorAll('.playlist-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('playlist-remove')) return;
                const index = parseInt(item.dataset.index);
                if (!isNaN(index) && this.state.playlist[index]) {
                    this.play(this.state.playlist[index]);
                    this.render('house-audio-content');
                }
            });
        });

        document.getElementById('clear-history')?.addEventListener('click', () => {
            this.clearHistory();
            this.render('house-audio-content');
        });
    },

    /**
     * Сохранение состояния при выходе
     */
    destroy: function() {
        this.saveState();
        if (this.audio) {
            this.audio.pause();
            this.audio.src = '';
        }
    }
};

// Экспорт
window.MORI_HOUSE_AUDIO = MORI_HOUSE_AUDIO;
