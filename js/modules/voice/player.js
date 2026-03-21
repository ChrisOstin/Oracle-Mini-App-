/**
 * VOICE PLAYER
 * Воспроизведение голосовых сообщений
 * Версия: 1.0.0
 */

const MORI_VOICE_PLAYER = {
    // Состояние
    state: {
        isPlaying: false,
        currentRecording: null,
        currentTime: 0,
        duration: 0,
        volume: 80,
        playbackRate: 1.0,
        queue: []
    },

    // Аудио элемент
    audio: null,

    // Таймер обновления
    timer: null,

    /**
     * Инициализация
     */
    init: function() {
        console.log('MORI_VOICE_PLAYER инициализация...');
        this.audio = new Audio();
        this.setupAudioListeners();
    },

    /**
     * Настройка слушателей
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
            this.state.isPlaying = false;
            this.stopTimer();
            this.playNext();
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
     * Запуск таймера
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
     * Воспроизвести запись
     */
    play: function(recording) {
        // Если передана запись
        if (recording) {
            // Если это новая запись
            if (this.state.currentRecording?.id !== recording.id) {
                this.state.currentRecording = recording;
                
                if (recording.blob) {
                    // Если есть blob (только что записали)
                    this.audio.src = URL.createObjectURL(recording.blob);
                } else if (recording.url) {
                    // Если есть URL (старая запись)
                    this.audio.src = recording.url;
                } else {
                    console.error('No audio source');
                    return false;
                }
            }
        }

        // Если есть что играть
        if (this.audio.src) {
            this.audio.play();
            return true;
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
     * Возобновить
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
     * Перемотка
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
     * Установка громкости
     */
    setVolume: function(volume) {
        this.state.volume = Math.min(100, Math.max(0, volume));
        this.audio.volume = this.state.volume / 100;
    },

    /**
     * Вкл/выкл звук
     */
    toggleMute: function() {
        this.audio.muted = !this.audio.muted;
    },

    /**
     * Установка скорости
     */
    setPlaybackRate: function(rate) {
        this.state.playbackRate = rate;
        this.audio.playbackRate = rate;
    },

    /**
     * Добавить в очередь
     */
    addToQueue: function(recording) {
        this.state.queue.push(recording);
    },

    /**
     * Добавить несколько в очередь
     */
    addMultipleToQueue: function(recordings) {
        this.state.queue.push(...recordings);
    },

    /**
     * Очистить очередь
     */
    clearQueue: function() {
        this.state.queue = [];
    },

    /**
     * Играть следующий
     */
    playNext: function() {
        if (this.state.queue.length > 0) {
            const next = this.state.queue.shift();
            this.play(next);
        }
    },

    /**
     * Получить прогресс
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
     * Создать волну для визуализации
     */
    createWaveform: function(canvas, recording) {
        if (!recording || !recording.blob) return;

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const reader = new FileReader();

        reader.onload = async (e) => {
            const arrayBuffer = e.target.result;
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            this.drawWaveform(canvas, audioBuffer);
        };

        reader.readAsArrayBuffer(recording.blob);
    },

    /**
     * Нарисовать волну на canvas
     */
    drawWaveform: function(canvas, audioBuffer) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const data = audioBuffer.getChannelData(0); // левый канал
        
        ctx.clearRect(0, 0, width, height);
        ctx.beginPath();
        ctx.strokeStyle = 'var(--accent-primary)';
        ctx.lineWidth = 2;

        const step = Math.ceil(data.length / width);
        const amp = height / 2;

        for (let i = 0; i < width; i++) {
            let min = 1.0;
            let max = -1.0;
            
            for (let j = 0; j < step; j++) {
                const datum = data[i * step + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }

            const y1 = amp * (1 + min);
            const y2 = amp * (1 + max);
            
            ctx.moveTo(i, y1);
            ctx.lineTo(i, y2);
        }

        ctx.stroke();
    },

    /**
     * Очистка
     */
    destroy: function() {
        this.stop();
        this.stopTimer();
        
        if (this.audio) {
            this.audio.pause();
            this.audio.src = '';
            this.audio = null;
        }
    }
};

// Экспорт
window.MORI_VOICE_PLAYER = MORI_VOICE_PLAYER;
