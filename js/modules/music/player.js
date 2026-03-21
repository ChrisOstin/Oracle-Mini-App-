/**
 * MUSIC PLAYER
 * Управление воспроизведением музыки
 * Версия: 1.0.0
 */

const MORI_MUSIC_PLAYER = {
    // Состояние плеера
    state: {
        currentTrack: null,
        queue: [],
        queueIndex: -1,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        volume: 80,
        prevVolume: 80,
        isMuted: false,
        repeat: 'none', // 'none', 'one', 'all'
        shuffle: false,
        playbackRate: 1.0,
        equalizer: {
            bass: 0,
            mid: 0,
            treble: 0
        }
    },

    // Аудио элемент
    audio: null,

    // Таймер обновления
    timer: null,

    /**
     * Инициализация
     */
    init: function() {
        console.log('MORI_MUSIC_PLAYER инициализация...');
        this.audio = new Audio();
        this.setupAudioListeners();
        this.loadState();
    },

    /**
     * Настройка слушателей аудио
     */
    setupAudioListeners: function() {
        this.audio.addEventListener('timeupdate', () => {
            this.state.currentTime = this.audio.currentTime;
            this.onTimeUpdate?.();
        });

        this.audio.addEventListener('loadedmetadata', () => {
            this.state.duration = this.audio.duration;
            this.onLoad?.();
        });

        this.audio.addEventListener('ended', () => {
            this.onTrackEnd();
        });

        this.audio.addEventListener('play', () => {
            this.state.isPlaying = true;
            this.startTimer();
            this.onPlay?.();
        });

        this.audio.addEventListener('pause', () => {
            this.state.isPlaying = false;
            this.stopTimer();
            this.onPause?.();
        });

        this.audio.addEventListener('volumechange', () => {
            this.onVolumeChange?.();
        });
    },

    /**
     * Запуск таймера обновления
     */
    startTimer: function() {
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            this.onTimeUpdate?.();
        }, 100);
    },

    /**
     * Остановка таймера
     */
    stopTimer: function() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    },

    /**
     * Воспроизведение трека
     */
    play: function(track) {
        // Если передан трек, добавляем в очередь
        if (track) {
            this.addToQueue(track);
        }

        // Если есть текущий трек
        if (this.state.currentTrack) {
            this.audio.src = this.state.currentTrack.url || this.getMockUrl(this.state.currentTrack);
            this.audio.play();
            
            // Добавляем в историю
            MORI_MUSIC?.addToHistory(this.state.currentTrack);
            
            return true;
        }

        // Если есть очередь, играем первый
        if (this.state.queue.length > 0) {
            this.state.queueIndex = 0;
            this.state.currentTrack = this.state.queue[0];
            return this.play();
        }

        return false;
    },

    /**
     * Пауза
     */
    pause: function() {
        this.audio.pause();
    },

    /**
     * Возобновление
     */
    resume: function() {
        this.audio.play();
    },

    /**
     * Переключение пауза/плей
     */
    toggle: function() {
        if (this.state.isPlaying) {
            this.pause();
        } else {
            this.resume();
        }
    },

    /**
     * Остановка
     */
    stop: function() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.state.currentTime = 0;
        this.state.isPlaying = false;
    },

    /**
     * Перемотка на позицию
     */
    seek: function(time) {
        this.audio.currentTime = Math.min(time, this.state.duration);
    },

    /**
     * Перемотка вперед/назад
     */
    seekBy: function(seconds) {
        this.seek(this.audio.currentTime + seconds);
    },

    /**
     * Следующий трек
     */
    next: function() {
        if (this.state.shuffle) {
            this.playRandom();
        } else {
            this.playNextInQueue();
        }
    },

    /**
     * Предыдущий трек
     */
    prev: function() {
        if (this.audio.currentTime > 3) {
            // Если прошло больше 3 секунд, перематываем в начало
            this.seek(0);
        } else {
            // Иначе играем предыдущий
            this.playPrevInQueue();
        }
    },

    /**
     * Следующий в очереди
     */
    playNextInQueue: function() {
        if (this.state.queue.length === 0) return;

        if (this.state.repeat === 'one') {
            // Повтор одного трека — переигрываем текущий
            this.seek(0);
            this.play();
            return;
        }

        const nextIndex = this.state.queueIndex + 1;
        
        if (nextIndex >= this.state.queue.length) {
            if (this.state.repeat === 'all') {
                // Зацикливание всего плейлиста
                this.state.queueIndex = 0;
            } else {
                // Конец плейлиста
                this.stop();
                return;
            }
        } else {
            this.state.queueIndex = nextIndex;
        }

        this.state.currentTrack = this.state.queue[this.state.queueIndex];
        this.play();
    },

    /**
     * Предыдущий в очереди
     */
    playPrevInQueue: function() {
        if (this.state.queue.length === 0) return;

        const prevIndex = this.state.queueIndex - 1;
        
        if (prevIndex < 0) {
            this.state.queueIndex = this.state.queue.length - 1;
        } else {
            this.state.queueIndex = prevIndex;
        }

        this.state.currentTrack = this.state.queue[this.state.queueIndex];
        this.play();
    },

    /**
     * Случайный трек
     */
    playRandom: function() {
        if (this.state.queue.length === 0) return;

        const randomIndex = Math.floor(Math.random() * this.state.queue.length);
        this.state.queueIndex = randomIndex;
        this.state.currentTrack = this.state.queue[randomIndex];
        this.play();
    },

    /**
     * Добавить в очередь
     */
    addToQueue: function(track) {
        this.state.queue.push(track);
        
        if (this.state.queue.length === 1) {
            this.state.queueIndex = 0;
            this.state.currentTrack = track;
        }

        this.saveQueue();
    },

    /**
     * Добавить несколько треков
     */
    addMultipleToQueue: function(tracks) {
        this.state.queue.push(...tracks);
        this.saveQueue();
    },

    /**
     * Очистить очередь
     */
    clearQueue: function() {
        this.state.queue = [];
        this.state.queueIndex = -1;
        this.state.currentTrack = null;
        this.stop();
        this.saveQueue();
    },

    /**
     * Удалить из очереди
     */
    removeFromQueue: function(index) {
        if (index < 0 || index >= this.state.queue.length) return;

        this.state.queue.splice(index, 1);
        
        if (index === this.state.queueIndex) {
            // Если удалили текущий трек
            if (this.state.queue.length === 0) {
                this.state.currentTrack = null;
                this.state.queueIndex = -1;
                this.stop();
            } else {
                this.state.queueIndex = Math.min(this.state.queueIndex, this.state.queue.length - 1);
                this.state.currentTrack = this.state.queue[this.state.queueIndex];
            }
        } else if (index < this.state.queueIndex) {
            // Если удалили трек до текущего
            this.state.queueIndex--;
        }

        this.saveQueue();
    },

    /**
     * Перемешать очередь
     */
    shuffleQueue: function() {
        if (this.state.queue.length === 0) return;

        // Сохраняем текущий трек
        const current = this.state.currentTrack;
        
        // Перемешиваем
        for (let i = this.state.queue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.state.queue[i], this.state.queue[j]] = [this.state.queue[j], this.state.queue[i]];
        }

        // Находим новый индекс текущего трека
        this.state.queueIndex = this.state.queue.findIndex(t => t.id === current?.id);
        this.saveQueue();
    },

    /**
     * Переключение повтора
     */
    toggleRepeat: function() {
        const modes = ['none', 'one', 'all'];
        const currentIndex = modes.indexOf(this.state.repeat);
        const nextIndex = (currentIndex + 1) % modes.length;
        this.state.repeat = modes[nextIndex];
        this.saveSettings();
    },

    /**
     * Переключение перемешивания
     */
    toggleShuffle: function() {
        this.state.shuffle = !this.state.shuffle;
        this.saveSettings();
    },

    /**
     * Установка громкости
     */
    setVolume: function(volume) {
        this.state.volume = Math.min(100, Math.max(0, volume));
        this.audio.volume = this.state.volume / 100;
        this.saveSettings();
    },

    /**
     * Вкл/выкл звук
     */
    toggleMute: function() {
        if (this.state.isMuted) {
            this.setVolume(this.state.prevVolume);
            this.state.isMuted = false;
        } else {
            this.state.prevVolume = this.state.volume;
            this.setVolume(0);
            this.state.isMuted = true;
        }
    },

    /**
     * Установка скорости воспроизведения
     */
    setPlaybackRate: function(rate) {
        this.state.playbackRate = rate;
        this.audio.playbackRate = rate;
        this.saveSettings();
    },

    /**
     * Установка эквалайзера
     */
    setEqualizer: function(band, value) {
        this.state.equalizer[band] = value;
        // TODO: применить эквалайзер
        this.saveSettings();
    },

    /**
     * Сброс эквалайзера
     */
    resetEqualizer: function() {
        this.state.equalizer = { bass: 0, mid: 0, treble: 0 };
        // TODO: сбросить эквалайзер
        this.saveSettings();
    },

    /**
     * Получить позицию в процентах
     */
    getProgress: function() {
        if (this.state.duration === 0) return 0;
        return (this.state.currentTime / this.state.duration) * 100;
    },

    /**
     * Получить оставшееся время
     */
    getRemainingTime: function() {
        return this.state.duration - this.state.currentTime;
    },

    /**
     * Форматирование времени
     */
    formatTime: function(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    /**
 * Получить URL для трека
 */
getTrackUrl: async function(track) {
    if (!track || !track.id) return null;

    try {
        // Пробуем получить реальный URL через API
        const response = await MORI_API.getTrackUrl?.(track.id);
        if (response && response.url) {
            return response.url;
        }
    } catch (error) {
        console.error('Error getting track URL:', error);
    }

    // Если нет URL, показываем сообщение
    MORI_APP.showToast('❌ Не удалось загрузить трек', 'error');
    return null;
},

/**
 * Воспроизведение трека
 */
play: async function(track) {
    if (track) {
        this.addToQueue(track);
    }

    if (this.state.currentTrack) {
        const url = await this.getTrackUrl(this.state.currentTrack);
        if (!url) return false;

        this.audio.src = url;
        this.audio.play();

        MORI_MUSIC?.addToHistory(this.state.currentTrack);
        return true;
    }

    if (this.state.queue.length > 0) {
        this.state.queueIndex = 0;
        this.state.currentTrack = this.state.queue[0];
        return this.play();
    }

    return false;
},

    /**
     * Сохранение очереди
     */
    saveQueue: function() {
        localStorage.setItem('music_queue', JSON.stringify({
            queue: this.state.queue.map(t => t.id),
            queueIndex: this.state.queueIndex
        }));
    },

    /**
     * Загрузка очереди
     */
    loadQueue: function() {
        const saved = localStorage.getItem('music_queue');
        if (saved) {
            const data = JSON.parse(saved);
            // TODO: загрузить треки по ID
        }
    },

    /**
     * Сохранение настроек
     */
    saveSettings: function() {
        localStorage.setItem('music_player_settings', JSON.stringify({
            volume: this.state.volume,
            repeat: this.state.repeat,
            shuffle: this.state.shuffle,
            playbackRate: this.state.playbackRate,
            equalizer: this.state.equalizer
        }));
    },

    /**
     * Загрузка настроек
     */
    loadState: function() {
        const saved = localStorage.getItem('music_player_settings');
        if (saved) {
            const settings = JSON.parse(saved);
            this.state.volume = settings.volume || 80;
            this.state.repeat = settings.repeat || 'none';
            this.state.shuffle = settings.shuffle || false;
            this.state.playbackRate = settings.playbackRate || 1.0;
            this.state.equalizer = settings.equalizer || { bass: 0, mid: 0, treble: 0 };
            
            this.audio.volume = this.state.volume / 100;
        }
    },

    /**
     * Обработчик окончания трека
     */
    onTrackEnd: function() {
        if (this.state.repeat === 'one') {
            this.seek(0);
            this.play();
        } else {
            this.next();
        }
    },

    /**
     * Очистка
     */
    destroy: function() {
        this.stop();
        this.stopTimer();
        this.audio = null;
    }
};

// Экспорт
window.MORI_MUSIC_PLAYER = MORI_MUSIC_PLAYER;
