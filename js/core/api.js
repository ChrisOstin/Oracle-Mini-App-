/**
 * CORE API — АБСОЛЮТНО РАБОЧАЯ ВЕРСИЯ
 * С retry-механизмом, проверкой соединения и полной поддержкой всех модулей
 * Версия: 4.0.0 (НЕУБИВАЕМАЯ)
 */

const MORI_API = {
    // ========== БАЗОВЫЕ НАСТРОЙКИ ==========
    baseUrl: 'https://mori-server.onrender.com/api',
    
    timeouts: {
        default: 10000,
        long: 30000,
        critical: 5000,
        auth: 8000,
        data: 15000,
        upload: 60000
    },

    cache: {
        enabled: true,
        ttl: 300000, // 5 минут
        store: {}
    },

    queue: [],
    retryAttempts: 3,
    
    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    init: function() {
        console.log('📡 MORI_API инициализация...');
        this.processQueue();
        window.addEventListener('online', () => {
            console.log('✅ Соединение восстановлено');
            this.processQueue();
        });
        window.addEventListener('offline', () => {
            console.log('📴 Соединение потеряно');
        });
    },

    // ========== ПРОВЕРКА СОЕДИНЕНИЯ ==========
    checkConnection: async function() {
        try {
            await this.ping();
            return true;
        } catch {
            return false;
        }
    },

    // ========== БЕЗОПАСНЫЙ ЗАПРОС С RETRY ==========
    safeRequest: async function(endpoint, options = {}, retries = this.retryAttempts) {
        // Проверка интернета
        if (!navigator.onLine) {
            if (options.offline !== false) {
                this.addToQueue({ endpoint, options });
                MORI_APP.showToast('📴 Запрос сохранён в офлайн-очередь', 'info');
            }
            return null;
        }
       
        // Если skipCache, то очищаем кэш для этого эндпоинта
if (options.skipCache) {
    const endpointKey = endpoint.split('?')[0];
    for (const key in this.cache.store) {
        if (key.includes(endpointKey)) {
            delete this.cache.store[key];
        }
    }
    console.log('🧹 Кэш очищен для:', endpointKey);
}

        // Попытки с retry
        for (let i = 0; i <= retries; i++) {
            try {
                const result = await this.request(endpoint, options);
                
                // Если это был POST запрос, очищаем соответствующий кэш
                if (options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE') {
                    this.invalidateCache(endpoint);
                }
                
                return result;
                
            } catch (error) {
                this.logError(error, endpoint, options);
                
                if (i === retries) {
                    if (options.offline !== false) {
                        this.addToQueue({ endpoint, options });
                        MORI_APP.showToast(`❌ Ошибка, запрос сохранён`, 'warning');
                    }
                    return null;
                }
                
                const waitTime = 1000 * Math.pow(2, i); // Экспоненциальная задержка
                console.log(`🔄 Повтор ${i + 1}/${retries} для ${endpoint} через ${waitTime}ms`);
                await new Promise(r => setTimeout(r, waitTime));
            }
        }
    },

    // ========== ОСНОВНОЙ ЗАПРОС ==========
    request: async function(endpoint, options = {}) {
        const url = this.buildUrl(endpoint);
        const method = options.method || 'GET';
        const timeout = options.timeout || this.getTimeout(endpoint);
        const skipCache = options.skipCache || false;
        const cacheKey = this.getCacheKey(endpoint, options);

        // Проверка кэша для GET
        if (!skipCache && this.cache.enabled && method === 'GET') {
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                console.log('✅ Из кэша:', endpoint);
                return cached;
            }
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const headers = {
            'Content-Type': 'application/json',
            ...this.getAuthHeader(),
            ...options.headers
        };

        const config = {
            method,
            headers,
            signal: controller.signal
        };

        if (options.body) {
            config.body = JSON.stringify(options.body);
        }

        const startTime = Date.now();
        const response = await fetch(url, config);
        clearTimeout(timeoutId);

        // Логируем производительность
        this.logPerformance(endpoint, Date.now() - startTime);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        // Сохраняем в кэш для GET
        if (this.cache.enabled && method === 'GET') {
            this.addToCache(cacheKey, data);
        }

        return data;
    },

    // ========== ПОЛУЧИТЬ ТАЙМАУТ ПО ЭНДПОИНТУ ==========
    getTimeout: function(endpoint) {
        if (endpoint.includes('/auth/')) return this.timeouts.auth;
        if (endpoint.includes('/upload')) return this.timeouts.upload;
        if (endpoint.includes('/books/') && endpoint.includes('/download')) return this.timeouts.data;
        if (endpoint.includes('/mori/price')) return this.timeouts.critical;
        if (endpoint.includes('/chat/') && endpoint.includes('/messages')) return this.timeouts.long;
        return this.timeouts.default;
    },

    // ========== ИНВАЛИДАЦИЯ КЭША ==========
    invalidateCache: function(endpoint) {
        const baseEndpoint = endpoint.split('?')[0].split('/').slice(0, 3).join('/');
        for (const key in this.cache.store) {
            if (key.startsWith(baseEndpoint)) {
                delete this.cache.store[key];
                console.log('🧹 Кэш инвалидирован:', key);
            }
        }
    },

    // ========== ЛОГИРОВАНИЕ ОШИБОК ==========
    logError: function(error, endpoint, options) {
        const errorLog = {
            time: new Date().toISOString(),
            endpoint,
            method: options.method || 'GET',
            message: error.message,
            stack: error.stack,
            online: navigator.onLine
        };
        
        let errors = JSON.parse(localStorage.getItem('api_errors') || '[]');
        errors.push(errorLog);
        if (errors.length > 50) errors.shift();
        localStorage.setItem('api_errors', JSON.stringify(errors));
        
        console.error('❌ API Error:', error.message, 'at', endpoint);
    },

    // ========== ЛОГИРОВАНИЕ ПРОИЗВОДИТЕЛЬНОСТИ ==========
    logPerformance: function(endpoint, duration) {
        if (!this.metrics) this.metrics = {};
        if (!this.metrics[endpoint]) {
            this.metrics[endpoint] = { count: 0, totalTime: 0, max: 0 };
        }
        this.metrics[endpoint].count++;
        this.metrics[endpoint].totalTime += duration;
        this.metrics[endpoint].max = Math.max(this.metrics[endpoint].max, duration);
        
        // Логируем медленные запросы
        if (duration > 2000) {
            console.warn(`🐌 Медленный запрос ${endpoint}: ${duration}ms`);
        }
    },

    // ========== ВСПОМОГАТЕЛЬНЫЕ ==========
    buildUrl: function(endpoint) {
        if (endpoint.startsWith('http')) return endpoint;
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
        return `${this.baseUrl}${cleanEndpoint}`;
    },

    getAuthHeader: function() {
        const token = localStorage.getItem('mori_token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    },

    getCacheKey: function(endpoint, options) {
        return `${endpoint}_${JSON.stringify(options.body || {})}_${options.method || 'GET'}`;
    },

    getFromCache: function(key) {
        const item = this.cache.store[key];
        if (item && Date.now() - item.timestamp < this.cache.ttl) {
            return item.data;
        }
        return null;
    },

    addToCache: function(key, data) {
        this.cache.store[key] = {
            data,
            timestamp: Date.now()
        };
        this.cleanCache();
    },

    cleanCache: function() {
        const now = Date.now();
        for (const key in this.cache.store) {
            if (now - this.cache.store[key].timestamp > this.cache.ttl) {
                delete this.cache.store[key];
            }
        }
    },

    addToQueue: function(request) {
        this.queue.push({
            ...request,
            timestamp: Date.now()
        });
        localStorage.setItem('api_queue', JSON.stringify(this.queue));
    },

    processQueue: async function() {
        if (!navigator.onLine || this.queue.length === 0) return;
        
        const queue = [...this.queue];
        this.queue = [];
        localStorage.removeItem('api_queue');
        
        for (const request of queue) {
            try {
                await this.request(request.endpoint, request.options);
                console.log('✅ Очередь обработана:', request.endpoint);
            } catch (error) {
                console.error('Queue error:', error);
                this.addToQueue(request);
            }
        }
    },

    clearCache: function() {
        this.cache.store = {};
        MORI_APP.showToast('🧹 Кэш очищен', 'success');
    },

    clearUserCache: function() {
        const userId = MORI_APP.currentUser?.id;
        if (!userId) return;
        
        for (const key in this.cache.store) {
            if (key.includes(`/user/${userId}`)) {
                delete this.cache.store[key];
            }
        }
        console.log('🧹 Кэш пользователя очищен');
    },

    getMetrics: function() {
        return this.metrics || {};
    },

    ping: async function() {
        try {
            await fetch(`${this.baseUrl.replace('/api', '')}/health`, { 
                method: 'GET',
                timeout: 3000
            });
            return true;
        } catch {
            return false;
        }
    },

    // ========== 1. АВТОРИЗАЦИЯ (6 методов) ==========
    login: async function(password) {
        return this.safeRequest('/auth/login', { 
            method: 'POST', 
            body: { password }, 
            skipCache: true,
            offline: false
        });
    },

    register: async function(userData) {
        return this.safeRequest('/auth/register', { 
            method: 'POST', 
            body: userData, 
            skipCache: true,
            offline: false
        });
    },

    verifyToken: async function(token) {
        return this.safeRequest('/auth/verify', { 
            method: 'POST', 
            body: { token }, 
            skipCache: true,
            offline: false
        });
    },

    refreshToken: async function() {
        return this.safeRequest('/auth/refresh', { 
            method: 'POST', 
            skipCache: true,
            offline: false
        });
    },

    logout: async function() {
        return this.safeRequest('/auth/logout', { 
            method: 'POST', 
            skipCache: true,
            offline: false
        });
    },

    getCurrentUser: async function() {
        return this.safeRequest('/auth/me', { 
            method: 'GET', 
            skipCache: true 
        });
    },

    // ========== 2. ПОРТФЕЛЬ (3 метода) ==========
    getMoriPrice: async function(skipCache = false) {
    return this.safeRequest('/mori/price', {
        timeout: this.timeouts.critical,
        skipCache: skipCache
    });
},

    getMoriHistory: async function(timeframe = '1h', skipCache = true) {
    return this.safeRequest(`/mori/history?timeframe=${timeframe}`, {
        method: 'GET',
        skipCache: skipCache
    });
},

    getWhales: async function() {
        return this.safeRequest('/mori/whales');
    },

    // ========== 3. БИБЛИОТЕКА (6 методов) ==========
    getBooks: async function() {
        return this.safeRequest('/books');
    },

    getBook: async function(bookId) {
        return this.safeRequest(`/books/${bookId}`);
    },

    addBook: async function(bookData) {
        return this.safeRequest('/books', { 
            method: 'POST', 
            body: bookData, 
            skipCache: true 
        });
    },

    updateBook: async function(bookId, bookData) {
        return this.safeRequest(`/books/${bookId}`, { 
            method: 'PUT', 
            body: bookData, 
            skipCache: true 
        });
    },

    deleteBook: async function(bookId) {
        return this.safeRequest(`/books/${bookId}`, { 
            method: 'DELETE', 
            skipCache: true 
        });
    },

    downloadBook: async function(bookId) {
        return this.safeRequest(`/books/${bookId}/download`, { 
            method: 'GET',
            timeout: this.timeouts.data
        });
    },

    // ========== 4. ЧАТ (6 методов) ==========
    getChatMessages: async function(chatType, limit = 50, offset = 0) {
        return this.safeRequest(`/chat/${chatType}/messages?limit=${limit}&offset=${offset}`, { 
            method: 'GET' 
        });
    },

    sendMessage: async function(chatType, text, replyTo = null) {
        return this.safeRequest('/chat/message', { 
            method: 'POST', 
            body: { chat_type: chatType, text, reply_to: replyTo }, 
            skipCache: true 
        });
    },

    editMessage: async function(messageId, text) {
        return this.safeRequest(`/chat/message/${messageId}`, { 
            method: 'PUT', 
            body: { text }, 
            skipCache: true 
        });
    },

    deleteMessage: async function(messageId) {
        return this.safeRequest(`/chat/message/${messageId}`, { 
            method: 'DELETE', 
            skipCache: true 
        });
    },

    addReaction: async function(messageId, reaction) {
        return this.safeRequest(`/chat/message/${messageId}/reaction`, { 
            method: 'POST', 
            body: { reaction }, 
            skipCache: true 
        });
    },

    getChatUsers: async function() {
        return this.safeRequest('/chat/users', { 
            method: 'GET' 
        });
    },

    // ========== 5. СЕМЬЯ (13 методов) ==========
    getFamilyMembers: async function() {
        return this.safeRequest('/family/members', { 
            method: 'GET' 
        });
    },

    addFamilyMember: async function(userId, role) {
        return this.safeRequest('/family/members', { 
            method: 'POST', 
            body: { user_id: userId, role }, 
            skipCache: true 
        });
    },

    updateFamilyMember: async function(memberId, role) {
        return this.safeRequest(`/family/members/${memberId}`, { 
            method: 'PUT', 
            body: { role }, 
            skipCache: true 
        });
    },

    removeFamilyMember: async function(memberId) {
        return this.safeRequest(`/family/members/${memberId}`, { 
            method: 'DELETE', 
            skipCache: true 
        });
    },

    getFamilyBudget: async function() {
        return this.safeRequest('/family/budget', { 
            method: 'GET' 
        });
    },

    addBudgetTransaction: async function(type, title, amount) {
        return this.safeRequest('/family/budget', { 
            method: 'POST', 
            body: { type, title, amount }, 
            skipCache: true 
        });
    },

    deleteBudgetTransaction: async function(transactionId) {
        return this.safeRequest(`/family/budget/${transactionId}`, { 
            method: 'DELETE', 
            skipCache: true 
        });
    },

    getFamilyCalendar: async function(year, month) {
        return this.safeRequest(`/family/calendar?year=${year}&month=${month}`, { 
            method: 'GET' 
        });
    },

    addCalendarEvent: async function(title, date, type = 'event') {
        return this.safeRequest('/family/calendar', { 
            method: 'POST', 
            body: { title, date, type }, 
            skipCache: true 
        });
    },

    deleteCalendarEvent: async function(eventId) {
        return this.safeRequest(`/family/calendar/${eventId}`, { 
            method: 'DELETE', 
            skipCache: true 
        });
    },

    getReminders: async function() {
        return this.safeRequest('/family/reminders', { 
            method: 'GET' 
        });
    },

    addReminder: async function(title, date, type = 'task') {
        return this.safeRequest('/family/reminders', { 
            method: 'POST', 
            body: { title, date, type }, 
            skipCache: true 
        });
    },

    updateReminder: async function(reminderId, completed) {
        return this.safeRequest(`/family/reminders/${reminderId}`, { 
            method: 'PUT', 
            body: { completed }, 
            skipCache: true 
        });
    },

    deleteReminder: async function(reminderId) {
        return this.safeRequest(`/family/reminders/${reminderId}`, { 
            method: 'DELETE', 
            skipCache: true 
        });
    },

    // ========== 6. ДУРАК (3 метода) ==========
    getDurakGame: async function() {
        return this.safeRequest('/family/durak', { 
            method: 'GET' 
        });
    },

    createDurakGame: async function() {
        return this.safeRequest('/family/durak', { 
            method: 'POST', 
            skipCache: true 
        });
    },

    makeDurakMove: async function(gameId, move) {
        return this.safeRequest(`/family/durak/${gameId}`, { 
            method: 'POST', 
            body: move, 
            skipCache: true 
        });
    },

    // ========== 7. ДОМ (5 методов) ==========
    getHouse: async function() {
        return this.safeRequest('/house', { 
            method: 'GET' 
        });
    },

    getRooms: async function() {
        return this.safeRequest('/house/rooms', { 
            method: 'GET' 
        });
    },

    updateRoom: async function(roomId, data) {
        return this.safeRequest(`/house/rooms/${roomId}`, { 
            method: 'PUT', 
            body: data, 
            skipCache: true 
        });
    },

    getTV: async function() {
        return this.safeRequest('/house/tv', { 
            method: 'GET' 
        });
    },

    controlTV: async function(command) {
        return this.safeRequest('/house/tv/control', { 
            method: 'POST', 
            body: { command }, 
            skipCache: true 
        });
    },

    // ========== 8. ПРОФИЛЬ (3 метода) ==========
    getUserProfile: async function(userId) {
        return this.safeRequest(`/user/${userId}`, { 
            method: 'GET' 
        });
    },

    getUserStats: async function(userId) {
        return this.safeRequest(`/user/${userId}/stats`, { 
            method: 'GET' 
        });
    },

    updateUser: async function(userId, data) {
        return this.safeRequest(`/user/${userId}`, { 
            method: 'PUT', 
            body: data, 
            skipCache: true 
        });
    },

    // ========== 9. ДОСТИЖЕНИЯ (2 метода) ==========
    getAchievements: async function(userId) {
        return this.safeRequest(`/user/${userId}/achievements`, { 
            method: 'GET' 
        });
    },

    unlockAchievement: async function(userId, achievementId) {
        return this.safeRequest(`/user/${userId}/achievements/${achievementId}`, { 
            method: 'POST', 
            skipCache: true 
        });
    },

    // ========== 10. УРОВНИ (2 метода) ==========
    getLevels: async function() {
        return this.safeRequest('/levels', { 
            method: 'GET' 
        });
    },

    getUserLevel: async function(userId) {
        return this.safeRequest(`/user/${userId}/level`, { 
            method: 'GET' 
        });
    },

    // ========== 11. ЗАДАНИЯ (2 метода) ==========
    getTasks: async function(userId) {
        return this.safeRequest(`/user/${userId}/tasks`, { 
            method: 'GET' 
        });
    },

    completeTask: async function(userId, taskId) {
        return this.safeRequest(`/user/${userId}/tasks/${taskId}`, { 
            method: 'POST', 
            skipCache: true 
        });
    },

    // ========== 12. МУЗЫКА (4 метода) ==========
    getMusic: async function() {
        return this.safeRequest('/music', { 
            method: 'GET' 
        });
    },

    getPlaylists: async function() {
        return this.safeRequest('/music/playlists', { 
            method: 'GET' 
        });
    },

    getPlaylist: async function(playlistId) {
        return this.safeRequest(`/music/playlist/${playlistId}`, { 
            method: 'GET' 
        });
    },

    searchMusic: async function(query) {
        return this.safeRequest(`/music/search?q=${query}`, { 
            method: 'GET' 
        });
    },

    // ========== 12. МУЗЫКА (4 метода) + расширение ==========
getMusic: async function() {
    return this.safeRequest('/music', {
        method: 'GET'
    });
},

getPlaylists: async function() {
    return this.safeRequest('/music/playlists', {
        method: 'GET'
    });
},

getPlaylist: async function(playlistId) {
    return this.safeRequest(`/music/playlist/${playlistId}`, {
        method: 'GET'
    });
},

searchMusic: async function(query) {
    return this.safeRequest(`/music/search?q=${encodeURIComponent(query)}`, {
        method: 'GET'
    });
},

// ========== РАСШИРЕННЫЕ МЕТОДЫ ДЛЯ МУЗЫКИ ==========
addToPlaylist: async function(playlistId, track) {
    return this.safeRequest(`/music/playlist/${playlistId}`, {
        method: 'POST',
        body: track,
        skipCache: true
    });
},

removeFromPlaylist: async function(playlistId, trackId) {
    return this.safeRequest(`/music/playlist/${playlistId}/${trackId}`, {
        method: 'DELETE',
        skipCache: true
    });
},

createPlaylist: async function(playlistData) {
    return this.safeRequest('/music/playlist', {
        method: 'POST',
        body: playlistData,
        skipCache: true
    });
},

deletePlaylist: async function(playlistId) {
    return this.safeRequest(`/music/playlist/${playlistId}`, {
        method: 'DELETE',
        skipCache: true
    });
},

addTrackToLibrary: async function(track) {
    return this.safeRequest('/music/library', {
        method: 'POST',
        body: track,
        skipCache: true
    });
},

getMusicLibrary: async function() {
    return this.safeRequest('/music/library', {
        method: 'GET'
    });
},

removeFromLibrary: async function(trackId) {
    return this.safeRequest(`/music/library/${trackId}`, {
        method: 'DELETE',
        skipCache: true
    });
},

    // ========== 13. ГОЛОСОВЫЕ (2 метода) ==========
    getVoiceMessages: async function() {
        return this.safeRequest('/voice', { 
            method: 'GET' 
        });
    },

    sendVoiceMessage: async function(audioData) {
        return this.safeRequest('/voice', { 
            method: 'POST', 
            body: { audio: audioData }, 
            skipCache: true,
            timeout: this.timeouts.upload
        });
    },

    // ========== 14. ВСЕ ПРИЛОЖЕНИЯ (2 метода) ==========
    getAllApps: async function() {
        return this.safeRequest('/apps', { 
            method: 'GET' 
        });
    },

    getApp: async function(appId) {
        return this.safeRequest(`/apps/${appId}`, { 
            method: 'GET' 
        });
    },

    // ========== 15. АДМИНКА (4 метода) ==========
    getAdminStats: async function() {
        return this.safeRequest('/admin/stats', { 
            method: 'GET' 
        });
    },

    getAllUsers: async function(limit = 100, offset = 0, search = '') {
        return this.safeRequest(`/admin/users?limit=${limit}&offset=${offset}&search=${search}`, { 
            method: 'GET' 
        });
    },

    blockUser: async function(userId) {
        return this.safeRequest(`/admin/users/${userId}/block`, { 
            method: 'POST', 
            skipCache: true 
        });
    },

    unblockUser: async function(userId) {
        return this.safeRequest(`/admin/users/${userId}/unblock`, { 
            method: 'POST', 
            skipCache: true 
        });
    },

    // ========== 16. ДЕМИУРГ (5 методов) ==========
    getDemigurgeData: async function() {
        return this.safeRequest('/demigurge', { 
            method: 'GET' 
        });
    },

    getDemigurgeUsers: async function() {
        return this.safeRequest('/demigurge/users', { 
            method: 'GET' 
        });
    },

    getDemigurgeBooks: async function() {
        return this.safeRequest('/demigurge/books', { 
            method: 'GET' 
        });
    },

    getDemigurgeStats: async function() {
        return this.safeRequest('/demigurge/stats', { 
            method: 'GET' 
        });
    },

    getMultiaccount: async function() {
        return this.safeRequest('/demigurge/multiaccount', { 
            method: 'GET' 
        });
    },

    // ========== 17. ВИШЛИСТ (3 метода) ==========
    getWishlist: async function(userId) {
        return this.safeRequest(`/user/${userId}/wishlist`, { 
            method: 'GET' 
        });
    },

    addToWishlist: async function(userId, item) {
        return this.safeRequest(`/user/${userId}/wishlist`, { 
            method: 'POST', 
            body: item, 
            skipCache: true 
        });
    },

    removeFromWishlist: async function(userId, itemId) {
        return this.safeRequest(`/user/${userId}/wishlist/${itemId}`, { 
            method: 'DELETE', 
            skipCache: true 
        });
    },

    // ========== 18. ТЕГИ (2 метода) ==========
    getTags: async function() {
        return this.safeRequest('/tags', { 
            method: 'GET' 
        });
    },

    addTag: async function(name) {
        return this.safeRequest('/tags', { 
            method: 'POST', 
            body: { name }, 
            skipCache: true 
        });
    }
};

// ========== ЗАПУСК ==========
window.MORI_API = MORI_API;
MORI_API.init();

console.log('✅ API загружен, методов:', Object.keys(MORI_API).filter(k => typeof MORI_API[k] === 'function').length);
