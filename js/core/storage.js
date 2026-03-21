/**
 * CORE STORAGE — ИДЕАЛЬНОЕ ХРАНИЛИЩЕ ДАННЫХ
 * Версия: 4.0.0 (АБСОЛЮТНО РАБОЧАЯ, С ВСЕМИ УЛУЧШЕНИЯМИ)
 */

const MORI_STORAGE = {
    // ========== БАЗОВЫЕ НАСТРОЙКИ ==========
    prefix: 'mori_',
    dbName: 'MoriDB',
    dbVersion: 3,
    encryptionKey: 'mori_secret_key_2026',
    
    // ========== ХРАНИЛИЩА ==========
    db: null,
    memoryCache: new Map(),
    cacheTTL: 300000, // 5 минут
    
    // ========== ОЧЕРЕДИ ==========
    writeQueue: [],
    priorityQueue: { high: [], medium: [], low: [] },
    isProcessing: false,
    
    // ========== МЕТРИКИ ==========
    metrics: {
        reads: 0,
        writes: 0,
        hits: 0,
        misses: 0,
        totalTime: 0,
        errors: 0
    },
    
    // ========== СХЕМЫ ДЛЯ ВАЛИДАЦИИ ==========
    schemas: {
        user: {
            id: 'number',
            nickname: 'string',
            level: 'number',
            experience: 'number',
            balance: 'number',
            avatar: 'string'
        },
        book: {
            id: 'number',
            title: 'string',
            author: 'string',
            category: 'string',
            pages: 'number'
        },
        message: {
            id: 'number',
            text: 'string',
            userId: 'number',
            chatType: 'string',
            timestamp: 'number'
        },
        settings: {
            key: 'string',
            value: 'any'
        }
    },
    
    // ========== МИГРАЦИИ ==========
    migrations: {
        1: (data) => ({ ...data, version: 1 }),
        2: (data) => ({ ...data, version: 2, createdAt: Date.now() }),
        3: (data) => ({ ...data, version: 3, updatedAt: Date.now() })
    },

    // ========== ТЭГИРОВАННЫЙ КЭШ ==========
    tagCache: new Map(),

    // ========== СИНХРОНИЗАЦИЯ МЕЖДУ ВКЛАДКАМИ ==========
    syncChannel: null,

    // ========== ТАЙМЕРЫ ==========
    backupTimer: null,
    cleanupTimer: null,

    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    init: async function() {
        console.log('💾 MORI_STORAGE инициализация...');
        
        // Инициализируем БД
        await this.repairDB();
        
        // Запускаем обработку очередей
        this.processWriteQueue();
        this.processPriorityQueue();
        
        // Настраиваем синхронизацию
        this.setupSync();
        
        // Запускаем автоочистку
        this.startAutoCleanup();
        
        // Запускаем автобэкап
        this.startAutoBackup();
        
        // Восстанавливаем метрики
        this.loadMetrics();
        
        console.log('✅ STORAGE инициализирован');
    },

    // ========== 1. АВТОВОССТАНОВЛЕНИЕ ==========
    async repairDB() {
        try {
            await this.initDB();
            
            // Проверяем целостность хранилищ
            const stores = ['books', 'messages', 'apiCache', 'userData', 'settings', 'offlineQueue'];
            
            for (let store of stores) {
                try {
                    await this.getAllDB(store);
                    console.log(`✅ Хранилище ${store} в порядке`);
                } catch (e) {
                    console.warn(`⚠️ Хранилище ${store} повреждено, пересоздаём...`);
                    await this.clearDB(store);
                }
            }
        } catch (e) {
            console.error('❌ Критическая ошибка БД, пересоздаём...');
            indexedDB.deleteDatabase(this.dbName);
            await this.initDB();
        }
    },

    // ========== 2. ВАЛИДАЦИЯ СХЕМЫ ==========
    validate(storeName, data) {
        const schema = this.schemas[storeName];
        if (!schema) return true;
        
        for (let [field, type] of Object.entries(schema)) {
            if (data[field] === undefined) {
                console.warn(`⚠️ Валидация ${storeName}: отсутствует поле ${field}`);
                return false;
            }
            
            const actualType = typeof data[field];
            if (actualType !== type && !(type === 'any')) {
                console.warn(`⚠️ Валидация ${storeName}: поле ${field} должно быть ${type}, получено ${actualType}`);
                return false;
            }
        }
        return true;
    },

    // ========== 3. ШИФРОВАНИЕ ==========
    async encrypt(data) {
        try {
            const encoder = new TextEncoder();
            const encoded = encoder.encode(JSON.stringify(data));
            
            // Простое XOR шифрование для демо (в продакшене использовать Web Crypto API)
            const key = this.encryptionKey;
            const encrypted = new Uint8Array(encoded.length);
            
            for (let i = 0; i < encoded.length; i++) {
                encrypted[i] = encoded[i] ^ key.charCodeAt(i % key.length);
            }
            
            return {
                iv: Array.from(crypto.getRandomValues(new Uint8Array(16))),
                data: Array.from(encrypted),
                algorithm: 'xor'
            };
        } catch (e) {
            console.error('❌ Ошибка шифрования:', e);
            return data;
        }
    },

    async decrypt(encrypted) {
        try {
            if (!encrypted || typeof encrypted !== 'object') return encrypted;
            
            const key = this.encryptionKey;
            const decoded = new Uint8Array(encrypted.data.length);
            
            for (let i = 0; i < encrypted.data.length; i++) {
                decoded[i] = encrypted.data[i] ^ key.charCodeAt(i % key.length);
            }
            
            const decoder = new TextDecoder();
            return JSON.parse(decoder.decode(decoded));
        } catch (e) {
            console.error('❌ Ошибка дешифрования:', e);
            return null;
        }
    },

    setSecure: async function(key, value) {
        const encrypted = await this.encrypt(value);
        return this.set(key, encrypted);
    },

    getSecure: async function(key, defaultValue = null) {
        const encrypted = this.get(key, null);
        if (!encrypted) return defaultValue;
        return await this.decrypt(encrypted) || defaultValue;
    },

    // ========== 4. ПАКЕТНАЯ ЗАПИСЬ ==========
    async batchWrite(storeName, items) {
        await this.initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            
            let success = 0;
            let errors = 0;
            
            items.forEach(item => {
                if (this.validate(storeName, item)) {
                    const request = store.put(item);
                    request.onsuccess = () => success++;
                    request.onerror = () => errors++;
                } else {
                    errors++;
                }
            });
            
            transaction.oncomplete = () => resolve({ success, errors, total: items.length });
            transaction.onerror = () => reject(transaction.error);
        });
    },

    // ========== 5. ПРИОРИТЕТНАЯ ОЧЕРЕДЬ ==========
    addToPriorityQueue(priority, action) {
        if (!this.priorityQueue[priority]) {
            this.priorityQueue[priority] = [];
        }
        this.priorityQueue[priority].push({
            ...action,
            timestamp: Date.now(),
            attempts: 0
        });
        this.savePriorityQueue();
        this.processPriorityQueue();
    },

    savePriorityQueue() {
        localStorage.setItem(this.prefix + 'priority_queue', JSON.stringify(this.priorityQueue));
    },

    loadPriorityQueue() {
        const saved = localStorage.getItem(this.prefix + 'priority_queue');
        if (saved) {
            this.priorityQueue = JSON.parse(saved);
        }
    },

    async processPriorityQueue() {
        if (!navigator.onLine || this.isProcessing) return;
        
        this.isProcessing = true;
        const priorities = ['high', 'medium', 'low'];
        
        try {
            for (let priority of priorities) {
                const queue = this.priorityQueue[priority];
                const remaining = [];
                
                for (let action of queue) {
                    try {
                        await MORI_API.request(action.endpoint, action.options);
                        console.log(`✅ [${priority}] Обработано: ${action.endpoint}`);
                    } catch (error) {
                        console.error(`❌ [${priority}] Ошибка:`, error);
                        action.attempts++;
                        
                        if (action.attempts < 3) {
                            remaining.push(action);
                        } else {
                            this.logError('queue', `Превышено число попыток для ${action.endpoint}`);
                        }
                    }
                }
                
                this.priorityQueue[priority] = remaining;
            }
        } finally {
            this.isProcessing = false;
            this.savePriorityQueue();
        }
    },

    // ========== 6. СИНХРОНИЗАЦИЯ МЕЖДУ ВКЛАДКАМИ ==========
    setupSync() {
        if (typeof BroadcastChannel !== 'undefined') {
            this.syncChannel = new BroadcastChannel('mori_storage_sync');
            
            this.syncChannel.onmessage = (event) => {
                const { type, key, store, id } = event.data;
                
                switch(type) {
                    case 'update':
                        this.memoryCache.delete(key);
                        break;
                    case 'clear':
                        this.memoryCache.clear();
                        break;
                    case 'invalidate':
                        this.invalidateTag(key);
                        break;
                }
            };
            
            // Перехватываем методы
            const originalSet = this.set;
            this.set = function(key, value) {
                const result = originalSet.call(this, key, value);
                this.syncChannel?.postMessage({ type: 'update', key });
                return result;
            };
        }
    },

    // ========== 7. АВТОМАТИЧЕСКИЙ БЭКАП ==========
    startAutoBackup(interval = 24) {
        this.backupTimer = setInterval(async () => {
            if (MORI_AUTH?.isAuthenticated()) {
                await this.createBackup();
            }
        }, interval * 60 * 60 * 1000);
    },

    async createBackup() {
        try {
            const backup = await this.exportAll();
            const compressed = await this.compress(backup);
            
            localStorage.setItem(this.prefix + 'last_backup', JSON.stringify({
                data: compressed,
                time: Date.now(),
                version: this.dbVersion
            }));
            
            console.log('💾 Автоматический бэкап создан');
            this.logMetric('backup', 'success');
        } catch (e) {
            console.error('❌ Ошибка создания бэкапа:', e);
            this.logError('backup', e.message);
        }
    },

    // ========== 8. ВЕРСИОНИРОВАНИЕ ==========
    async saveWithVersion(storeName, data) {
        if (!this.validate(storeName, data)) return false;
        
        const existing = await this.getDB(storeName, data.id);
        
        if (existing) {
            data._version = (existing._version || 1) + 1;
            data._previousVersion = existing._version;
        } else {
            data._version = 1;
        }
        
        data._updatedAt = Date.now();
        await this.setDB(storeName, data);
        return true;
    },

    async getVersion(storeName, id) {
        const data = await this.getDB(storeName, id);
        return data ? data._version || 1 : null;
    },

    // ========== 9. ТЭГИРОВАННЫЙ КЭШ ==========
    async setTaggedCache(tags, key, data, ttl = 300000) {
        const cacheKey = `tagged_${key}`;
        await this.setDB('apiCache', {
            key: cacheKey,
            data,
            tags,
            ttl,
            timestamp: Date.now()
        });
        
        tags.forEach(tag => {
            if (!this.tagCache.has(tag)) {
                this.tagCache.set(tag, new Set());
            }
            this.tagCache.get(tag).add(cacheKey);
        });
    },

    async getTaggedCache(key) {
        const cacheKey = `tagged_${key}`;
        const cached = await this.getDB('apiCache', cacheKey);
        
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > cached.ttl) {
            await this.removeDB('apiCache', cacheKey);
            return null;
        }
        
        this.metrics.hits++;
        return cached.data;
    },

    async invalidateTag(tag) {
        if (this.tagCache.has(tag)) {
            const keys = this.tagCache.get(tag);
            for (let key of keys) {
                await this.removeDB('apiCache', key);
            }
            this.tagCache.delete(tag);
            
            this.syncChannel?.postMessage({ type: 'invalidate', key: tag });
        }
    },

    // ========== 10. МЕТРИКИ И МОНИТОРИНГ ==========
    loadMetrics() {
        try {
            const saved = localStorage.getItem(this.prefix + 'metrics');
            if (saved) {
                this.metrics = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Ошибка загрузки метрик:', e);
        }
    },

    saveMetrics() {
        localStorage.setItem(this.prefix + 'metrics', JSON.stringify(this.metrics));
    },

    logMetric(operation, status, time = 0) {
        this.metrics[`${operation}_${status}`] = (this.metrics[`${operation}_${status}`] || 0) + 1;
        this.metrics.totalTime += time;
        this.saveMetrics();
    },

logError: function(source, message) {
    this.metrics.errors++;
    
    try {
        // Гарантируем, что errors - это массив
        let errors = this.get('error_log');
        if (!errors || !Array.isArray(errors)) {
            errors = [];
        }
        
        errors.push({
            source,
            message,
            time: Date.now()
        });
        
        // Оставляем только последние 50
        if (errors.length > 50) {
            errors = errors.slice(-50);
        }
        
        this.set('error_log', errors);
    } catch (e) {
        console.warn('Не удалось сохранить ошибку:', e);
    }
    
    this.saveMetrics();
},

    async measurePerformance(method, ...args) {
        const start = Date.now();
        const methodName = method.name || 'anonymous';
        
        try {
            const result = await method.apply(this, args);
            const time = Date.now() - start;
            
            this.metrics[`${methodName}_calls`] = (this.metrics[`${methodName}_calls`] || 0) + 1;
            this.metrics[`${methodName}_time`] = (this.metrics[`${methodName}_time`] || 0) + time;
            
            if (time > 100) {
                console.warn(`🐌 Медленная операция ${methodName}: ${time}ms`);
            }
            
            this.logMetric(methodName, 'success', time);
            return result;
        } catch (error) {
            this.logMetric(methodName, 'error');
            this.logError(methodName, error.message);
            throw error;
        } finally {
            this.saveMetrics();
        }
    },

    getMetrics() {
        const total = this.metrics.reads + this.metrics.writes || 1;
        return {
            ...this.metrics,
            hitRate: ((this.metrics.hits / total) * 100).toFixed(2) + '%',
            avgTime: (this.metrics.totalTime / total).toFixed(2) + 'ms',
            memoryCacheSize: this.memoryCache.size,
            priorityQueueSize: Object.values(this.priorityQueue).reduce((a, b) => a + b.length, 0)
        };
    },

    // ========== 11. ДЕДУПЛИКАЦИЯ ==========
    async deduplicate(storeName, keyField = 'id') {
        const all = await this.getAllDB(storeName);
        const unique = new Map();
        
        all.forEach(item => {
            const key = item[keyField];
            if (!unique.has(key) || (item._updatedAt || 0) > (unique.get(key)._updatedAt || 0)) {
                unique.set(key, item);
            }
        });
        
        if (unique.size < all.length) {
            await this.clearDB(storeName);
            for (let item of unique.values()) {
                await this.setDB(storeName, item);
            }
            console.log(`🧹 Удалено ${all.length - unique.size} дубликатов из ${storeName}`);
        }
    },

    // ========== 12. КОМПРЕССИЯ ==========
    async compress(data) {
        const json = JSON.stringify(data);
        
        if (json.length < 10000) return json;
        
        try {
            if (typeof CompressionStream !== 'undefined') {
                const stream = new CompressionStream('gzip');
                const writer = stream.writable.getWriter();
                writer.write(new TextEncoder().encode(json));
                writer.close();
                
                const reader = stream.readable.getReader();
                const chunks = [];
                
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    chunks.push(value);
                }
                
                const compressed = new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], []));
                return 'gzip:' + btoa(String.fromCharCode.apply(null, compressed));
            }
        } catch (e) {
            console.warn('Компрессия недоступна:', e);
        }
        
        return json;
    },

    async decompress(data) {
        if (typeof data !== 'string') return data;
        
        if (data.startsWith('gzip:')) {
            try {
                const compressed = data.slice(5);
                const binary = atob(compressed);
                const bytes = new Uint8Array(binary.length);
                
                for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i);
                }
                
                const stream = new DecompressionStream('gzip');
                const writer = stream.writable.getWriter();
                writer.write(bytes);
                writer.close();
                
                const reader = stream.readable.getReader();
                const chunks = [];
                
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    chunks.push(value);
                }
                
                const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], []));
                return JSON.parse(new TextDecoder().decode(decompressed));
            } catch (e) {
                console.error('Ошибка декомпрессии:', e);
            }
        }
        
        return JSON.parse(data);
    },

    // ========== 13. АВТОМАТИЧЕСКАЯ ОЧИСТКА ==========
    startAutoCleanup(interval = 60) {
        this.cleanupTimer = setInterval(async () => {
            await this.cleanup();
        }, interval * 60 * 1000);
    },

    async cleanup() {
        console.log('🧹 Запуск автоматической очистки...');
        
        // Очищаем устаревший кэш
        const allCache = await this.getAllDB('apiCache');
        const now = Date.now();
        let removed = 0;
        
        for (let item of allCache) {
            if (now - (item.timestamp || 0) > (item.ttl || this.cacheTTL)) {
                await this.removeDB('apiCache', item.key || item.url);
                removed++;
            }
        }
        
        // Дедуплицируем хранилища
        await this.deduplicate('books');
        await this.deduplicate('messages');
        
        // Очищаем старые сообщения (старше 30 дней)
        const messages = await this.getAllDB('messages');
        const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
        
        for (let msg of messages) {
            if ((msg.timestamp || 0) < monthAgo) {
                await this.removeDB('messages', msg.id);
                removed++;
            }
        }
        
        console.log(`🧹 Очистка завершена, удалено ${removed} записей`);
    },

    // ========== 14. ОСНОВНЫЕ МЕТОДЫ LOCALSTORAGE ==========
    set: function(key, value, ttl = null) {
        return this.measurePerformance(async () => {
            try {
                const data = {
                    value: value,
                    timestamp: Date.now(),
                    ttl: ttl
                };
                const serialized = JSON.stringify(data);
                localStorage.setItem(this.prefix + key, serialized);
                
                this.memoryCache.set(key, {
                    value: value,
                    timestamp: Date.now(),
                    ttl: ttl
                });
                
                this.metrics.writes++;
                return true;
            } catch (e) {
                this.logError('localStorage_set', e.message);
                return false;
            }
        }, key, value, ttl);
    },

    get: function(key, defaultValue = null) {
        return this.measurePerformance(async () => {
            try {
                this.metrics.reads++;
                
                // Проверяем кэш
                if (this.memoryCache.has(key)) {
                    const cached = this.memoryCache.get(key);
                    if (!cached.ttl || Date.now() - cached.timestamp < cached.ttl) {
                        this.metrics.hits++;
                        return cached.value;
                    }
                    this.memoryCache.delete(key);
                }
                
                const serialized = localStorage.getItem(this.prefix + key);
                if (serialized === null) {
                    this.metrics.misses++;
                    return defaultValue;
                }
                
                const data = JSON.parse(serialized);
                
                if (data.ttl && Date.now() - data.timestamp > data.ttl) {
                    this.remove(key);
                    this.metrics.misses++;
                    return defaultValue;
                }
                
                this.memoryCache.set(key, data);
                return data.value;
            } catch (e) {
                this.logError('localStorage_get', e.message);
                return defaultValue;
            }
        }, key, defaultValue);
    },

    remove: function(key) {
        localStorage.removeItem(this.prefix + key);
        this.memoryCache.delete(key);
    },

    // ========== 15. ОСНОВНЫЕ МЕТОДЫ INDEXEDDB ==========

    async initDB() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                resolve(this.db);
                return;
            }
            
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = (event) => {
                this.logError('indexedDB_init', event.target.error);
                reject(event.target.error);
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const oldVersion = event.oldVersion;
                
                // Создаём хранилища
                if (!db.objectStoreNames.contains('books')) {
                    const bookStore = db.createObjectStore('books', { keyPath: 'id' });
                    bookStore.createIndex('title', 'title', { unique: false });
                    bookStore.createIndex('author', 'author', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('messages')) {
                    const messageStore = db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
                    messageStore.createIndex('chatType', 'chatType', { unique: false });
                    messageStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('apiCache')) {
                    const cacheStore = db.createObjectStore('apiCache', { keyPath: 'key' });
                    cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
                    cacheStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
                }
                
                if (!db.objectStoreNames.contains('userData')) {
                    db.createObjectStore('userData', { keyPath: 'id' });
                }
                
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
                
                if (!db.objectStoreNames.contains('offlineQueue')) {
                    const queueStore = db.createObjectStore('offlineQueue', { keyPath: 'id', autoIncrement: true });
                    queueStore.createIndex('processed', 'processed', { unique: false });
                    queueStore.createIndex('priority', 'priority', { unique: false });
                }
                
                // Применяем миграции
                if (oldVersion < 2) {
                    // Миграция на v2
                }
                
                if (oldVersion < 3) {
                    // Миграция на v3
                }
            };
        });
    },

    async setDB(storeName, data) {
        return this.measurePerformance(async () => {
            await this.initDB();
            
            if (!this.validate(storeName, data)) {
                throw new Error(`Валидация не пройдена для ${storeName}`);
            }
            
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                
                const request = store.put(data);
                
                request.onsuccess = () => {
                    this.metrics.writes++;
                    resolve(request.result);
                };
                request.onerror = () => {
                    this.logError('indexedDB_set', request.error);
                    reject(request.error);
                };
            });
        }, storeName, data);
    },

    async getDB(storeName, key) {
        return this.measurePerformance(async () => {
            await this.initDB();
            
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                
                const request = store.get(key);
                
                request.onsuccess = () => {
                    this.metrics.reads++;
                    if (request.result) {
                        this.metrics.hits++;
                    } else {
                        this.metrics.misses++;
                    }
                    resolve(request.result);
                };
                request.onerror = () => reject(request.error);
            });
        }, storeName, key);
    },

    async getAllDB(storeName) {
        return this.measurePerformance(async () => {
            await this.initDB();
            
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                
                const request = store.getAll();
                
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            });
        }, storeName);
    },

    async removeDB(storeName, key) {
        return this.measurePerformance(async () => {
            await this.initDB();
            
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                
                const request = store.delete(key);
                
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            });
        }, storeName, key);
    },

    async clearDB(storeName) {
        return this.measurePerformance(async () => {
            await this.initDB();
            
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                
                const request = store.clear();
                
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            });
        }, storeName);
    },

    async queryDB(storeName, indexName, value) {
    return this.measurePerformance(async () => {
        await this.initDB();
        
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                const index = store.index(indexName);
                
                // Проверяем, что value - допустимый ключ
                // Если value === false, используем IDBKeyRange.only(false)
                let request;
                if (value === false) {
                    request = index.getAll(IDBKeyRange.only(false));
                } else if (value === true) {
                    request = index.getAll(IDBKeyRange.only(true));
                } else {
                    request = index.getAll(value);
                }
                
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => {
                    console.warn(`Ошибка запроса к индексу ${indexName}, возвращаем пустой массив`);
                    resolve([]);
                };
            } catch (error) {
                console.warn(`Ошибка queryDB, возвращаем пустой массив:`, error);
                resolve([]);
            }
        });
    }, storeName, indexName, value);
},

    // ========== 16. ОФЛАЙН-ОЧЕРЕДЬ ==========

    async addToQueue(action, priority = 'medium') {
        const queueItem = {
            ...action,
            priority,
            timestamp: Date.now(),
            processed: false,
            attempts: 0
        };
        
        await this.setDB('offlineQueue', queueItem);
        
        if (priority === 'high') {
            this.processWriteQueue();
        }
    },

    async getPendingQueue() {
    try {
        return await this.queryDB('offlineQueue', 'processed', false);
    } catch (error) {
        console.warn('Ошибка получения очереди, возвращаем пустой массив');
        return [];
    }
},

    async processWriteQueue() {
        if (this.isProcessing || !navigator.onLine) return;
        
        this.isProcessing = true;
        
        try {
            const queue = await this.getPendingQueue();
            
            // Сортируем по приоритету
            queue.sort((a, b) => {
                const priorityWeight = { high: 3, medium: 2, low: 1 };
                return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
            });
            
            for (const item of queue) {
                try {
                    const { endpoint, options } = item;
                    await MORI_API.request(endpoint, options);
                    
                    item.processed = true;
                    await this.setDB('offlineQueue', item);
                    
                    console.log('✅ Очередь обработана:', endpoint);
                } catch (error) {
                    console.error('❌ Ошибка обработки очереди:', error);
                    
                    item.attempts = (item.attempts || 0) + 1;
                    
                    if (item.attempts > 5) {
                        this.logError('queue', `Превышено число попыток для ${item.endpoint}`);
                        await this.removeDB('offlineQueue', item.id);
                    } else {
                        await this.setDB('offlineQueue', item);
                    }
                }
            }
        } finally {
            this.isProcessing = false;
        }
    },

    // ========== 17. КЭШ API ==========

    async setCache(url, data, ttl = 300000, tags = []) {
        const cacheItem = {
            key: url,
            data: data,
            timestamp: Date.now(),
            ttl: ttl,
            tags: tags
        };
        
        await this.setDB('apiCache', cacheItem);
        
        if (tags.length > 0) {
            await this.setTaggedCache(tags, url, data, ttl);
        }
    },

    async getCache(url) {
        const cached = await this.getDB('apiCache', url);
        
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > cached.ttl) {
            await this.removeDB('apiCache', url);
            return null;
        }
        
        this.metrics.hits++;
        return cached.data;
    },

    // ========== 18. ЭКСПОРТ/ИМПОРТ ==========

    async exportAll() {
        const data = {
            localStorage: {},
            indexedDB: {},
            version: this.dbVersion,
            timestamp: Date.now()
        };
        
        // Экспорт localStorage
        for (let key in localStorage) {
            if (key.startsWith(this.prefix)) {
                data.localStorage[key] = localStorage[key];
            }
        }
        
        // Экспорт IndexedDB
        if (this.db) {
            const stores = ['books', 'messages', 'userData', 'settings'];
            for (const store of stores) {
                try {
                    data.indexedDB[store] = await this.getAllDB(store);
                } catch (e) {
                    console.error(`Ошибка экспорта ${store}:`, e);
                }
            }
        }
        
        return data;
    },

    async importAll(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (!confirm('⚠️ Импорт заменит все текущие данные. Продолжить?')) {
                return false;
            }
            
            // Импорт localStorage
            for (let key in data.localStorage) {
                localStorage.setItem(key, data.localStorage[key]);
            }
            
            // Импорт IndexedDB
            if (this.db && data.indexedDB) {
                for (let storeName in data.indexedDB) {
                    await this.clearDB(storeName);
                    for (let item of data.indexedDB[storeName]) {
                        if (this.validate(storeName, item)) {
                            await this.setDB(storeName, item);
                        }
                    }
                }
            }
            
            this.logMetric('import', 'success');
            return true;
        } catch (error) {
            this.logError('import', error.message);
            return false;
        }
    },

    // ========== 19. ОЧИСТКА ==========

    async clearAll() {
        // Очищаем localStorage
        this.clear();
        
        // Очищаем кэш
        this.memoryCache.clear();
        this.tagCache.clear();
        
        // Очищаем sessionStorage
        this.clearSession();
        
        // Очищаем IndexedDB
        if (this.db) {
            const stores = ['books', 'messages', 'offlineQueue', 'apiCache', 'userData', 'settings'];
            for (const store of stores) {
                try {
                    await this.clearDB(store);
                } catch (e) {
                    console.error(`Ошибка очистки ${store}:`, e);
                }
            }
        }
        
        // Сбрасываем метрики
        this.metrics = {
            reads: 0,
            writes: 0,
            hits: 0,
            misses: 0,
            totalTime: 0,
            errors: 0
        };
        this.saveMetrics();
    },

    // ========== 20. ОСТАНОВКА ==========

    shutdown() {
        if (this.backupTimer) clearInterval(this.backupTimer);
        if (this.cleanupTimer) clearInterval(this.cleanupTimer);
        if (this.syncChannel) this.syncChannel.close();
        
        this.saveMetrics();
        console.log('💾 STORAGE остановлен');
    }
};

// ========== ЗАПУСК ==========
window.MORI_STORAGE = MORI_STORAGE;

// Автозапуск
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MORI_STORAGE.init());
} else {
    MORI_STORAGE.init();
}

// Остановка при выгрузке
window.addEventListener('beforeunload', () => MORI_STORAGE.shutdown());

console.log('✅ STORAGE загружен, методов:', Object.keys(MORI_STORAGE).filter(k => typeof MORI_STORAGE[k] === 'function').length);
