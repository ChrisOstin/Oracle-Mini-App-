/**
 * MORI AI VOICE
 * Голосовой ввод и распознавание речи
 * Версия: 1.0.0
 */

const MORI_AI_VOICE = {
    // Поддержка браузером
    isSupported: false,

    // Распознаватель речи
    recognition: null,

    // Состояние
    isRecording: false,
    isPaused: false,
    interimResult: '',
    finalResult: '',

    // Настройки
    config: {
        language: 'ru-RU',
        continuous: true,
        interimResults: true,
        maxAlternatives: 1
    },

    // Колбэки
    onStart: null,
    onResult: null,
    onEnd: null,
    onError: null,

    /**
     * Инициализация
     */
    init: function() {
        // Проверка поддержки
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.isSupported = true;
            this.setupRecognition();
            console.log('Voice recognition initialized');
        } else {
            console.warn('Voice recognition not supported');
            this.isSupported = false;
        }
    },

    /**
     * Настройка распознавателя
     */
    setupRecognition: function() {
        if (!this.recognition) return;

        // Настройки
        this.recognition.lang = this.config.language;
        this.recognition.continuous = this.config.continuous;
        this.recognition.interimResults = this.config.interimResults;
        this.recognition.maxAlternatives = this.config.maxAlternatives;

        // События
        this.recognition.onstart = () => {
            this.isRecording = true;
            this.isPaused = false;
            this.interimResult = '';
            this.finalResult = '';
            
            if (this.onStart) this.onStart();
            
            MORI_APP.showToast('🎤 Говорите...', 'info', 2000);
        };

        this.recognition.onend = () => {
            this.isRecording = false;
            this.isPaused = false;
            
            if (this.onEnd) this.onEnd(this.finalResult);
        };

        this.recognition.onerror = (event) => {
            console.error('Voice recognition error:', event.error);
            
            let message = 'Ошибка распознавания';
            switch (event.error) {
                case 'no-speech':
                    message = 'Не слышно речи';
                    break;
                case 'audio-capture':
                    message = 'Нет доступа к микрофону';
                    break;
                case 'not-allowed':
                    message = 'Доступ к микрофону запрещён';
                    break;
                case 'network':
                    message = 'Ошибка сети';
                    break;
            }
            
            MORI_APP.showToast(message, 'error');
            
            if (this.onError) this.onError(event.error);
            
            this.isRecording = false;
        };

        this.recognition.onresult = (event) => {
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                
                if (event.results[i].isFinal) {
                    final += transcript;
                } else {
                    interim += transcript;
                }
            }

            this.interimResult = interim;
            this.finalResult = final;

            if (this.onResult) {
                this.onResult({
                    interim: interim,
                    final: final,
                    isFinal: event.results[0].isFinal
                });
            }
        };
    },

    /**
     * Старт записи
     */
    start: function() {
        if (!this.isSupported) {
            MORI_APP.showToast('Голосовой ввод не поддерживается', 'error');
            return false;
        }

        if (this.isRecording) {
            return false;
        }

        try {
            this.recognition.start();
            return true;
        } catch (error) {
            console.error('Error starting recognition:', error);
            MORI_APP.showToast('Ошибка запуска', 'error');
            return false;
        }
    },

    /**
     * Остановка записи
     */
    stop: function() {
        if (!this.isSupported || !this.isRecording) return false;

        try {
            this.recognition.stop();
            return true;
        } catch (error) {
            console.error('Error stopping recognition:', error);
            return false;
        }
    },

    /**
     * Пауза (временная остановка)
     */
    pause: function() {
        if (!this.isSupported || !this.isRecording) return false;

        try {
            this.recognition.stop();
            this.isPaused = true;
            return true;
        } catch (error) {
            console.error('Error pausing recognition:', error);
            return false;
        }
    },

    /**
     * Возобновление после паузы
     */
    resume: function() {
        if (!this.isSupported || !this.isPaused) return false;

        try {
            this.recognition.start();
            this.isPaused = false;
            return true;
        } catch (error) {
            console.error('Error resuming recognition:', error);
            return false;
        }
    },

    /**
     * Переключение записи (старт/стоп)
     */
    toggle: function() {
        if (this.isRecording) {
            return this.stop();
        } else {
            return this.start();
        }
    },

    /**
     * Отмена записи (без сохранения результата)
     */
    cancel: function() {
        if (!this.isSupported || !this.isRecording) return false;

        try {
            this.recognition.abort();
            this.isRecording = false;
            this.interimResult = '';
            this.finalResult = '';
            return true;
        } catch (error) {
            console.error('Error canceling recognition:', error);
            return false;
        }
    },

    /**
     * Проверка поддержки микрофона
     */
    checkMicrophonePermission: async function() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasMicrophone = devices.some(device => device.kind === 'audioinput');
            
            if (!hasMicrophone) {
                MORI_APP.showToast('Микрофон не найден', 'error');
                return false;
            }

            // Запрашиваем разрешение
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            
            return true;
        } catch (error) {
            console.error('Microphone permission error:', error);
            MORI_APP.showToast('Нет доступа к микрофону', 'error');
            return false;
        }
    },

    /**
     * Получение списка доступных языков
     */
    getSupportedLanguages: function() {
        return [
            { code: 'ru-RU', name: 'Русский' },
            { code: 'en-US', name: 'English (US)' },
            { code: 'en-GB', name: 'English (UK)' },
            { code: 'de-DE', name: 'Deutsch' },
            { code: 'fr-FR', name: 'Français' },
            { code: 'es-ES', name: 'Español' },
            { code: 'it-IT', name: 'Italiano' },
            { code: 'ja-JP', name: '日本語' },
            { code: 'zh-CN', name: '中文' },
            { code: 'ar-SA', name: 'العربية' }
        ];
    },

    /**
     * Смена языка распознавания
     */
    setLanguage: function(langCode) {
        if (this.recognition) {
            this.config.language = langCode;
            this.recognition.lang = langCode;
            return true;
        }
        return false;
    },

    /**
     * Настройка параметров
     */
    setConfig: function(config) {
        this.config = { ...this.config, ...config };
        
        if (this.recognition) {
            this.recognition.lang = this.config.language;
            this.recognition.continuous = this.config.continuous;
            this.recognition.interimResults = this.config.interimResults;
            this.recognition.maxAlternatives = this.config.maxAlternatives;
        }
    },

    /**
     * Очистка
     */
    destroy: function() {
        if (this.isRecording) {
            this.stop();
        }
        this.recognition = null;
    }
};

// Инициализация при загрузке
MORI_AI_VOICE.init();

// Экспорт
window.MORI_AI_VOICE = MORI_AI_VOICE;
