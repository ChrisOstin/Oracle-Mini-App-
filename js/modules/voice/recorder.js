/**
 * VOICE RECORDER
 * Запись голосовых сообщений
 * Версия: 1.0.0
 */

const MORI_VOICE_RECORDER = {
    // Состояние
    state: {
        isRecording: false,
        isPaused: false,
        hasPermission: false,
        duration: 0,
        volume: 0,
        recordings: [],
        currentRecording: null,
        error: null
    },

    // Web Audio API
    mediaRecorder: null,
    audioContext: null,
    analyser: null,
    source: null,
    stream: null,
    chunks: [],

    // Таймеры
    timer: null,
    volumeTimer: null,

    /**
     * Инициализация
     */
    init: function() {
        console.log('MORI_VOICE_RECORDER инициализация...');
        this.loadRecordings();
        this.checkPermission();
    },

    /**
     * Проверка разрешения на микрофон
     */
    checkPermission: async function() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.state.hasPermission = true;
            this.stream = stream;
            this.setupAudioContext(stream);
            return true;
        } catch (error) {
            console.error('Microphone permission error:', error);
            this.state.hasPermission = false;
            this.state.error = 'Нет доступа к микрофону';
            return false;
        }
    },

    /**
     * Настройка аудиоконтекста
     */
    setupAudioContext: function(stream) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        
        this.source = this.audioContext.createMediaStreamSource(stream);
        this.source.connect(this.analyser);
        
        // Не выводим в динамики (чтобы не было эха)
        this.analyser.connect(this.audioContext.destination);
    },

    /**
     * Запрос разрешения
     */
    requestPermission: async function() {
        return await this.checkPermission();
    },

    /**
     * Начать запись
     */
    startRecording: async function() {
        if (!this.state.hasPermission) {
            const granted = await this.requestPermission();
            if (!granted) return false;
        }

        try {
            // Создаём MediaRecorder
            this.mediaRecorder = new MediaRecorder(this.stream);
            this.chunks = [];

            // Обработка данных
            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    this.chunks.push(e.data);
                }
            };

            // Обработка остановки
            this.mediaRecorder.onstop = () => {
                this.saveRecording();
            };

            // Запускаем запись
            this.mediaRecorder.start(100); // сохранять каждые 100ms
            this.state.isRecording = true;
            this.state.duration = 0;
            
            // Запускаем таймер
            this.startTimer();
            
            // Запускаем анализ громкости
            this.startVolumeAnalysis();

            return true;

        } catch (error) {
            console.error('Start recording error:', error);
            this.state.error = 'Ошибка при записи';
            return false;
        }
    },

    /**
     * Остановить запись
     */
    stopRecording: function() {
        if (this.mediaRecorder && this.state.isRecording) {
            this.mediaRecorder.stop();
            this.state.isRecording = false;
            this.stopTimer();
            this.stopVolumeAnalysis();
        }
    },

    /**
     * Пауза
     */
    pauseRecording: function() {
        if (this.mediaRecorder && this.state.isRecording) {
            this.mediaRecorder.pause();
            this.state.isPaused = true;
            this.stopTimer();
        }
    },

    /**
     * Возобновить
     */
    resumeRecording: function() {
        if (this.mediaRecorder && this.state.isPaused) {
            this.mediaRecorder.resume();
            this.state.isPaused = false;
            this.startTimer();
        }
    },

    /**
     * Сохранить запись
     */
    saveRecording: function() {
        const blob = new Blob(this.chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const duration = this.state.duration;

        const recording = {
            id: Date.now(),
            url: url,
            blob: blob,
            duration: duration,
            size: blob.size,
            name: `Запись ${new Date().toLocaleString()}`,
            createdAt: Date.now()
        };

        this.state.recordings.push(recording);
        this.state.currentRecording = recording;
        this.saveRecordings();

        // Очищаем chunks
        this.chunks = [];
    },

    /**
     * Запуск таймера
     */
    startTimer: function() {
        if (this.timer) clearInterval(this.timer);
        
        this.timer = setInterval(() => {
            this.state.duration++;
        }, 1000);
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
     * Запуск анализа громкости
     */
    startVolumeAnalysis: function() {
        if (!this.analyser) return;

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

        this.volumeTimer = setInterval(() => {
            this.analyser.getByteFrequencyData(dataArray);
            
            // Вычисляем среднюю громкость
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            
            // Нормализуем до 0-100
            this.state.volume = Math.min(100, Math.round(avg));
        }, 50);
    },

    /**
     * Остановка анализа
     */
    stopVolumeAnalysis: function() {
        if (this.volumeTimer) {
            clearInterval(this.volumeTimer);
            this.volumeTimer = null;
        }
        this.state.volume = 0;
    },

    /**
     * Удалить запись
     */
    deleteRecording: function(id) {
        this.state.recordings = this.state.recordings.filter(r => r.id !== id);
        
        if (this.state.currentRecording?.id === id) {
            this.state.currentRecording = null;
        }

        this.saveRecordings();
    },

    /**
     * Очистить все записи
     */
    clearAllRecordings: function() {
        this.state.recordings = [];
        this.state.currentRecording = null;
        this.saveRecordings();
    },

    /**
     * Получить URL для воспроизведения
     */
    getRecordingUrl: function(id) {
        const recording = this.state.recordings.find(r => r.id === id);
        return recording?.url || null;
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
     * Форматирование размера
     */
    formatSize: function(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    },

    /**
     * Сохранение записей
     */
    saveRecordings: function() {
        // Не сохраняем blob'ы, только метаданные
        const recordingsMeta = this.state.recordings.map(r => ({
            id: r.id,
            duration: r.duration,
            size: r.size,
            name: r.name,
            createdAt: r.createdAt
        }));

        localStorage.setItem('voice_recordings', JSON.stringify(recordingsMeta));
    },

    /**
     * Загрузка записей
     */
    loadRecordings: function() {
        const saved = localStorage.getItem('voice_recordings');
        if (saved) {
            const metas = JSON.parse(saved);
            this.state.recordings = metas.map(meta => ({
                ...meta,
                url: null, // URL будет создаваться при воспроизведении
                blob: null
            }));
        }
    },

    /**
     * Получить данные для визуализатора
     */
    getVisualizerData: function() {
        if (!this.analyser || !this.state.isRecording) {
            return new Array(20).fill(0);
        }

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);

        // Сжимаем до 20 значений для визуализации
        const step = Math.floor(dataArray.length / 20);
        const result = [];
        
        for (let i = 0; i < 20; i++) {
            let sum = 0;
            for (let j = 0; j < step; j++) {
                sum += dataArray[i * step + j];
            }
            result.push(sum / step);
        }

        return result;
    },

    /**
     * Очистка ресурсов
     */
    destroy: function() {
        this.stopRecording();
        this.stopTimer();
        this.stopVolumeAnalysis();
        
        if (this.source) {
            this.source.disconnect();
        }
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
    }
};

// Экспорт
window.MORI_VOICE_RECORDER = MORI_VOICE_RECORDER;
