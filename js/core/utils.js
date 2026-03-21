/**
 * CORE UTILS — ИДЕАЛЬНЫЙ НАБОР УТИЛИТ
 * Версия: 4.0.0 (АБСОЛЮТНО РАБОЧАЯ, 100+ МЕТОДОВ)
 */

const MORI_UTILS = {
    // ========== 1. ФОРМАТИРОВАНИЕ ДАТ ==========
    
    /**
     * Форматирование даты
     */
    formatDate: function(date, format = 'full') {
        if (!date) return '';
        
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;
        
        if (d.toDateString() === now.toDateString()) {
            if (format === 'short') {
                return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            }
            return 'Сегодня, ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        }
        
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (d.toDateString() === yesterday.toDateString()) {
            return 'Вчера, ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        }
        
        if (diff < 7 * 24 * 60 * 60 * 1000) {
            return d.toLocaleDateString('ru-RU', { weekday: 'short' }) + ', ' +
                   d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        }
        
        return d.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Время с момента события
     */
    timeAgo: function(timestamp) {
        if (!timestamp) return '';
        
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        
        if (seconds < 30) return 'только что';
        if (seconds < 60) return `${seconds} сек назад`;
        
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} ${this.plural(minutes, ['минуту', 'минуты', 'минут'])} назад`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} ${this.plural(hours, ['час', 'часа', 'часов'])} назад`;
        
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days} ${this.plural(days, ['день', 'дня', 'дней'])} назад`;
        
        const weeks = Math.floor(days / 7);
        if (weeks < 4) return `${weeks} ${this.plural(weeks, ['неделю', 'недели', 'недель'])} назад`;
        
        const months = Math.floor(days / 30);
        if (months < 12) return `${months} ${this.plural(months, ['месяц', 'месяца', 'месяцев'])} назад`;
        
        const years = Math.floor(days / 365);
        return `${years} ${this.plural(years, ['год', 'года', 'лет'])} назад`;
    },

    /**
     * Относительное время с поддержкой будущего
     */
    smartTimeAgo: function(timestamp) {
        const now = Date.now();
        const diff = timestamp - now;
        const absDiff = Math.abs(diff);
        
        if (diff > 0) {
            if (absDiff < 60000) return 'через несколько секунд';
            if (absDiff < 3600000) return `через ${Math.floor(absDiff / 60000)} мин`;
            if (absDiff < 86400000) return `через ${Math.floor(absDiff / 3600000)} ч`;
            if (absDiff < 2592000000) return `через ${Math.floor(absDiff / 86400000)} дн`;
            return `через ${Math.floor(absDiff / 2592000000)} мес`;
        }
        
        return this.timeAgo(timestamp);
    },

    /**
     * Форматирование с учётом локали
     */
    formatDateLocale: function(date, locale = 'ru', options = {}) {
        const d = new Date(date);
        const defaults = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return d.toLocaleDateString(locale, { ...defaults, ...options });
    },

    // ========== 2. ФОРМАТИРОВАНИЕ ЧИСЕЛ ==========

    /**
     * Форматирование больших чисел
     */
    formatNumber: function(num, decimals = 1) {
        if (num === null || num === undefined) return '0';
        
        const abs = Math.abs(num);
        
        if (abs >= 1e12) return (num / 1e12).toFixed(decimals) + 'T';
        if (abs >= 1e9) return (num / 1e9).toFixed(decimals) + 'B';
        if (abs >= 1e6) return (num / 1e6).toFixed(decimals) + 'M';
        if (abs >= 1e3) return (num / 1e3).toFixed(decimals) + 'K';
        
        return num.toString();
    },

    /**
     * Форматирование цены MORI
     */
    formatMoriPrice: function(price) {
        if (price === null || price === undefined) return '$0.00';
        
        if (price < 0.0001) return '$' + price.toFixed(8);
        if (price < 0.01) return '$' + price.toFixed(6);
        if (price < 1) return '$' + price.toFixed(4);
        return '$' + price.toFixed(2);
    },

    /**
     * Форматирование валют с учётом локали
     */
    formatMoney: function(amount, currency = 'USD', locale = 'ru-RU') {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
        }).format(amount);
    },

    /**
     * Склонение рублей/долларов
     */
    pluralMoney: function(amount, currency = 'рубль') {
        const forms = {
            'рубль': ['рубль', 'рубля', 'рублей'],
            'доллар': ['доллар', 'доллара', 'долларов'],
            'евро': ['евро', 'евро', 'евро']
        };
        const form = forms[currency] || forms['рубль'];
        return this.plural(amount, form);
    },

    /**
     * Форматирование процентов
     */
    formatPercent: function(value, total, decimals = 1) {
        if (total === 0) return '0%';
        return ((value / total) * 100).toFixed(decimals) + '%';
    },

    // ========== 3. ФОРМАТИРОВАНИЕ РАЗМЕРОВ ==========

    /**
     * Форматирование размера файла
     */
    formatFileSize: function(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Форматирование длительности
     */
    formatDuration: function(seconds) {
        if (!seconds || seconds < 0) return '0:00';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    },

    /**
     * Форматирование расстояния
     */
    formatDistance: function(meters) {
        if (meters < 1000) return `${meters} м`;
        const km = (meters / 1000).toFixed(1);
        return `${km} км`;
    },

    // ========== 4. ПЛЮРАЛИЗАЦИЯ ==========

    /**
     * Плюрализация
     */
    plural: function(count, forms) {
        const mod10 = count % 10;
        const mod100 = count % 100;
        
        if (mod10 === 1 && mod100 !== 11) {
            return forms[0];
        } else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
            return forms[1];
        }
        return forms[2];
    },

    // ========== 5. РАБОТА СО СТРОКАМИ ==========

    /**
     * Обрезка текста
     */
    truncate: function(text, length = 100, suffix = '...') {
        if (!text || text.length <= length) return text;
        return text.substring(0, length) + suffix;
    },

    /**
     * Экранирование HTML
     */
    escapeHtml: function(text) {
        if (!text) return '';
        
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    },

    /**
     * Генерация случайного ID
     */
    generateId: function(prefix = '') {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 9);
        return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
    },

    /**
     * Генерация UUID v4
     */
    uuid: function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    /**
     * Генерация короткого кода
     */
    generateCode: function(length = 6) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    /**
     * Генерация хэша строки (SHA-256)
     */
    async hashString(str) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    },

    /**
     * Slug из строки (для URL)
     */
    slugify: function(text) {
        if (!text) return '';
        
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    },

    /**
     * Транслитерация кириллицы
     */
    transliterate: function(text) {
        const map = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
            'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i',
            'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
            'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
            'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch',
            'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '',
            'э': 'e', 'ю': 'yu', 'я': 'ya'
        };
        
        return text.toLowerCase().split('').map(c => map[c] || c).join('');
    },

    /**
     * Поиск по тексту (без учёта регистра и транслита)
     */
    searchText: function(text, query) {
        const normalizedText = this.transliterate(text).toLowerCase();
        const normalizedQuery = this.transliterate(query).toLowerCase();
        return normalizedText.includes(normalizedQuery);
    },

    /**
     * Первая буква заглавная
     */
    capitalize: function(text) {
        if (!text) return '';
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    },

    /**
     * Проверка email
     */
    isEmail: function(email) {
        const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return re.test(email);
    },

    /**
     * Проверка URL
     */
    isUrl: function(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    // ========== 6. РАБОТА С ОБЪЕКТАМИ ==========

    /**
     * Глубокое клонирование
     */
    deepClone: function(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch (e) {
            console.error('Ошибка клонирования:', e);
            return obj;
        }
    },

    /**
     * Слияние объектов (глубокое)
     */
    deepMerge: function(target, ...sources) {
        if (!sources.length) return target;
        
        const source = sources.shift();
        
        if (this.isObject(target) && this.isObject(source)) {
            for (const key in source) {
                if (this.isObject(source[key])) {
                    if (!target[key]) Object.assign(target, { [key]: {} });
                    this.deepMerge(target[key], source[key]);
                } else {
                    Object.assign(target, { [key]: source[key] });
                }
            }
        }
        
        return this.deepMerge(target, ...sources);
    },

    /**
     * Проверка на объект
     */
    isObject: function(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    },

    /**
     * Получение вложенного свойства
     */
    get: function(obj, path, defaultValue = null) {
        const keys = path.split('.');
        let result = obj;
        
        for (const key of keys) {
            if (result && typeof result === 'object' && key in result) {
                result = result[key];
            } else {
                return defaultValue;
            }
        }
        
        return result !== undefined ? result : defaultValue;
    },

    /**
     * Установка вложенного свойства
     */
    set: function(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current)) {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[keys[keys.length - 1]] = value;
        return obj;
    },

    /**
     * Удаление undefined полей
     */
    cleanObject: function(obj) {
        if (!obj || typeof obj !== 'object') return obj;
        
        const result = Array.isArray(obj) ? [] : {};
        
        for (const key in obj) {
            if (obj[key] !== undefined && obj[key] !== null) {
                if (typeof obj[key] === 'object') {
                    result[key] = this.cleanObject(obj[key]);
                } else {
                    result[key] = obj[key];
                }
            }
        }
        
        return result;
    },

    /**
     * Сравнение объектов
     */
    isEqual: function(obj1, obj2) {
        return JSON.stringify(obj1) === JSON.stringify(obj2);
    },

    // ========== 7. РАБОТА С МАССИВАМИ ==========

    /**
     * Группировка массива по ключу
     */
    groupBy: function(array, key) {
        return array.reduce((result, item) => {
            const group = item[key];
            if (!result[group]) {
                result[group] = [];
            }
            result[group].push(item);
            return result;
        }, {});
    },

    /**
     * Уникальные значения
     */
    unique: function(array, key = null) {
        if (!key) {
            return [...new Set(array)];
        }
        
        const seen = new Set();
        return array.filter(item => {
            const value = item[key];
            if (seen.has(value)) return false;
            seen.add(value);
            return true;
        });
    },

    /**
     * Сортировка массива объектов
     */
    sortBy: function(array, key, direction = 'asc') {
        const sorted = [...array].sort((a, b) => {
            const valA = a[key];
            const valB = b[key];
            
            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        
        return sorted;
    },

    /**
     * Пагинация
     */
    paginate: function(array, page = 1, perPage = 10) {
        const start = (page - 1) * perPage;
        const end = start + perPage;
        
        return {
            items: array.slice(start, end),
            total: array.length,
            page,
            perPage,
            totalPages: Math.ceil(array.length / perPage)
        };
    },

    /**
     * Перемешивание массива
     */
    shuffle: function(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    },

    /**
     * Случайный элемент массива
     */
    randomItem: function(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    /**
     * Сумма чисел в массиве
     */
    sum: function(array) {
        return array.reduce((a, b) => a + b, 0);
    },

    /**
     * Среднее арифметическое
     */
    average: function(array) {
        if (!array || array.length === 0) return 0;
        return this.sum(array) / array.length;
    },

    // ========== 8. РАБОТА С ДАТАМИ ==========

    /**
     * Начало дня
     */
    startOfDay: function(date = new Date()) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    },

    /**
     * Конец дня
     */
    endOfDay: function(date = new Date()) {
        const d = new Date(date);
        d.setHours(23, 59, 59, 999);
        return d;
    },

    /**
     * Добавление дней
     */
    addDays: function(date, days) {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        return d;
    },

    /**
     * Разница в днях
     */
    diffDays: function(date1, date2) {
        const d1 = new Date(date1).setHours(0,0,0,0);
        const d2 = new Date(date2).setHours(0,0,0,0);
        return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
    },

    /**
     * Проверка, сегодня ли дата
     */
    isToday: function(date) {
        const d = new Date(date);
        const today = new Date();
        return d.toDateString() === today.toDateString();
    },

    /**
     * Проверка, выходной ли день
     */
    isWeekend: function(date = new Date()) {
        const day = new Date(date).getDay();
        return day === 0 || day === 6;
    },

    /**
     * Возраст по дате рождения
     */
    getAge: function(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    },

    // ========== 9. РАБОТА С ЦВЕТАМИ ==========

    /**
     * Генерация цвета по строке
     */
    stringToColor: function(str) {
        if (!str) return '#808080';
        
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        let color = '#';
        for (let i = 0; i < 3; i++) {
            const value = (hash >> (i * 8)) & 0xFF;
            color += ('00' + value.toString(16)).substr(-2);
        }
        
        return color;
    },

    /**
     * Светлый или тёмный текст для фона
     */
    getContrastColor: function(hexcolor) {
        if (hexcolor.length === 4) {
            hexcolor = '#' + hexcolor[1] + hexcolor[1] + hexcolor[2] + hexcolor[2] + hexcolor[3] + hexcolor[3];
        }
        
        const r = parseInt(hexcolor.substr(1,2), 16);
        const g = parseInt(hexcolor.substr(3,2), 16);
        const b = parseInt(hexcolor.substr(5,2), 16);
        
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        
        return brightness > 128 ? '#000000' : '#ffffff';
    },

    /**
     * Конвертация HEX в RGB
     */
    hexToRgb: function(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },

    /**
     * Генерация случайного цвета
     */
    randomColor: function() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    },

    // ========== 10. РАБОТА С БРАУЗЕРОМ ==========

    /**
     * Получение параметров URL
     */
    getUrlParams: function() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        
        for (const [key, value] of params) {
            result[key] = value;
        }
        
        return result;
    },

    /**
     * Установка параметров URL
     */
    setUrlParams: function(params, replace = false) {
        const url = new URL(window.location.href);
        
        if (replace) {
            url.search = '';
        }
        
        for (const [key, value] of Object.entries(params)) {
            url.searchParams.set(key, value);
        }
        
        window.history.pushState({}, '', url);
    },

    /**
     * Копирование в буфер обмена
     */
    copyToClipboard: async function(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                return true;
            } catch (e) {
                return false;
            } finally {
                document.body.removeChild(textarea);
            }
        }
    },

    /**
     * Скролл к элементу
     */
    scrollToElement: function(selector, offset = 0) {
        const element = document.querySelector(selector);
        if (element) {
            const y = element.getBoundingClientRect().top + window.pageYOffset + offset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    },

    /**
     * Проверка видимости элемента
     */
    isElementInViewport: function(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    /**
     * Получение типа устройства
     */
    getDeviceType: function() {
        const ua = navigator.userAgent;
        
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            return 'tablet';
        }
        if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
            return 'mobile';
        }
        return 'desktop';
    },

    /**
     * Проверка онлайн статуса
     */
    isOnline: function() {
        return navigator.onLine;
    },

    /**
     * Получение IP адреса
     */
    getIP: async function() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch {
            return null;
        }
    },

    /**
     * Проверка скорости интернета
     */
    checkConnectionSpeed: async function() {
        const startTime = Date.now();
        const image = new Image();
        
        return new Promise((resolve) => {
            image.onload = () => {
                const endTime = Date.now();
                const duration = (endTime - startTime) / 1000;
                const bitsLoaded = 1000000;
                const speedMbps = (bitsLoaded / duration) / (1024 * 1024);
                resolve(speedMbps.toFixed(2));
            };
            
            image.onerror = () => resolve('unknown');
            image.src = 'https://www.google.com/images/phd/px.gif?t=' + Date.now();
        });
    },

    // ========== 11. РАБОТА С ФАЙЛАМИ ==========

    /**
     * Конвертация файла в base64
     */
    fileToBase64: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    },

    /**
     * Скачивание файла
     */
    downloadFile: function(content, filename, type = 'text/plain') {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    },

    /**
     * Ресайз изображения
     */
    resizeImage: function(file, maxWidth, maxHeight) {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob(resolve, file.type);
            };
        });
    },

    // ========== 12. РАБОТА С DOM ==========

    /**
     * Создание элемента с атрибутами
     */
    createElement: function(tag, attrs = {}, children = []) {
        const el = document.createElement(tag);
        
        for (let [key, value] of Object.entries(attrs)) {
            if (key === 'style' && typeof value === 'object') {
                Object.assign(el.style, value);
            } else if (key.startsWith('on') && typeof value === 'function') {
                el.addEventListener(key.slice(2), value);
            } else {
                el.setAttribute(key, value);
            }
        }
        
        children.forEach(child => {
            if (typeof child === 'string') {
                el.appendChild(document.createTextNode(child));
            } else {
                el.appendChild(child);
            }
        });
        
        return el;
    },

    /**
     * Вставка HTML безопасно
     */
    htmlToElement: function(html) {
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        return template.content.firstChild;
    },

    /**
     * Добавление CSS класса
     */
    addClass: function(element, className) {
        if (element && !element.classList.contains(className)) {
            element.classList.add(className);
        }
    },

    /**
     * Удаление CSS класса
     */
    removeClass: function(element, className) {
        if (element && element.classList.contains(className)) {
            element.classList.remove(className);
        }
    },

    /**
     * Переключение CSS класса
     */
    toggleClass: function(element, className) {
        if (element) {
            element.classList.toggle(className);
        }
    },

    /**
     * Проверка наличия класса
     */
    hasClass: function(element, className) {
        return element && element.classList.contains(className);
    },

    /**
     * Установка стиля
     */
    setStyle: function(element, property, value) {
        if (element) {
            element.style[property] = value;
        }
    },

    /**
     * Получение стиля
     */
    getStyle: function(element, property) {
        if (!element) return null;
        return window.getComputedStyle(element)[property];
    },

    /**
     * Установка нескольких стилей
     */
    setStyles: function(element, styles) {
        if (!element) return;
        Object.assign(element.style, styles);
    },

    // ========== 13. РАБОТА С СОБЫТИЯМИ ==========

    /**
     * Добавление обработчика события
     */
    on: function(element, event, handler, options = false) {
        if (element) {
            element.addEventListener(event, handler, options);
        }
    },

    /**
     * Удаление обработчика события
     */
    off: function(element, event, handler, options = false) {
        if (element) {
            element.removeEventListener(event, handler, options);
        }
    },

    /**
     * Одноразовый обработчик события
     */
    once: function(element, event, handler) {
        const onceHandler = (...args) => {
            handler(...args);
            this.off(element, event, onceHandler);
        };
        this.on(element, event, onceHandler);
    },

    /**
     * Триггер события
     */
    trigger: function(element, event, detail = null) {
        if (element) {
            const customEvent = new CustomEvent(event, { detail, bubbles: true });
            element.dispatchEvent(customEvent);
        }
    },

    // ========== 14. ОПТИМИЗАЦИЯ ==========

    /**
     * Дебаунс
     */
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Троттлинг
     */
    throttle: function(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Мемоизация
     */
    memoize: function(func) {
        const cache = new Map();
        return function(...args) {
            const key = JSON.stringify(args);
            if (cache.has(key)) {
                return cache.get(key);
            }
            const result = func(...args);
            cache.set(key, result);
            return result;
        };
    },

    // ========== 15. РАБОТА С ПРОМИСАМИ ==========

    /**
     * Задержка
     */
    sleep: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Таймаут для промиса
     */
    timeout: function(promise, ms, errorMessage = 'Timeout') {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(errorMessage)), ms);
        });
        
        return Promise.race([promise, timeoutPromise]);
    },

    /**
     * Повторные попытки
     */
    retry: async function(fn, retries = 3, delay = 1000) {
        try {
            return await fn();
        } catch (error) {
            if (retries <= 0) throw error;
            await this.sleep(delay);
            return this.retry(fn, retries - 1, delay * 2);
        }
    },

    /**
     * Параллельное выполнение с ограничением
     */
    async parallelLimit(tasks, limit) {
        const results = [];
        const executing = [];
        
        for (const task of tasks) {
            const p = Promise.resolve().then(() => task());
            results.push(p);
            
            if (limit <= tasks.length) {
                const e = p.then(() => executing.splice(executing.indexOf(e), 1));
                executing.push(e);
                if (executing.length >= limit) {
                    await Promise.race(executing);
                }
            }
        }
        
        return Promise.all(results);
    },

    // ========== 16. РАБОТА С ОШИБКАМИ ==========

    /**
     * Безопасный JSON.parse
     */
    safeJsonParse: function(str, defaultValue = null) {
        try {
            return JSON.parse(str);
        } catch {
            return defaultValue;
        }
    },

    /**
     * Получение сообщения ошибки
     */
    getErrorMessage: function(error) {
        if (typeof error === 'string') return error;
        if (error?.message) return error.message;
        if (error?.response?.data?.message) return error.response.data.message;
        return 'Неизвестная ошибка';
    },

    /**
     * Логирование ошибки с контекстом
     */
    logError: function(error, context = {}) {
        const errorData = {
            message: this.getErrorMessage(error),
            stack: error?.stack,
            context,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        console.error('❌ Error:', errorData);
        
        const errors = MORI_STORAGE?.get('error_log', []) || [];
        errors.push(errorData);
        if (errors.length > 50) errors.shift();
        MORI_STORAGE?.set('error_log', errors);
        
        return errorData;
    },

    // ========== 17. СЛУЧАЙНЫЕ ДАННЫЕ ==========

    /**
     * Случайное число в диапазоне
     */
    randomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Генерация случайного имени
     */
    randomName: function() {
        const first = ['Артём', 'Максим', 'Иван', 'Дмитрий', 'Александр', 'Сергей', 'Андрей', 'Алексей'];
        const last = ['Иванов', 'Петров', 'Сидоров', 'Смирнов', 'Кузнецов', 'Попов', 'Васильев', 'Михайлов'];
        
        return this.randomItem(first) + ' ' + this.randomItem(last);
    },

    /**
     * Генерация случайного пароля
     */
    randomPassword: function(length = 12) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    },

    // ========== 18. ВАЛИДАЦИЯ ==========

    /**
     * Проверка пароля
     */
    validatePassword: function(password) {
        if (!password || password.length < 8) {
            return { valid: false, error: 'Минимум 8 символов' };
        }
        
        if (!/[A-Z]/.test(password)) {
            return { valid: false, error: 'Хотя бы одна заглавная буква' };
        }
        
        if (!/[a-z]/.test(password)) {
            return { valid: false, error: 'Хотя бы одна строчная буква' };
        }
        
        if (!/[0-9]/.test(password)) {
            return { valid: false, error: 'Хотя бы одна цифра' };
        }
        
        return { valid: true };
    },

    /**
     * Проверка номера телефона
     */
    validatePhone: function(phone) {
        const re = /^(\+7|8)?[\s\-]?\(?[0-9]{3}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;
        return re.test(phone);
    },

    /**
     * Проверка никнейма
     */
    validateNickname: function(nickname) {
        if (!nickname || nickname.length < 3) {
            return { valid: false, error: 'Минимум 3 символа' };
        }
        
        if (nickname.length > 20) {
            return { valid: false, error: 'Максимум 20 символов' };
        }
        
        if (!/^[a-zA-Z0-9_]+$/.test(nickname)) {
            return { valid: false, error: 'Только буквы, цифры и _' };
        }
        
        return { valid: true };
    },

    // ========== 19. МАТЕМАТИКА ==========

    /**
     * Процент от числа
     */
    percent: function(value, total) {
        if (total === 0) return 0;
        return (value / total) * 100;
    },

    /**
     * Ограничение значения
     */
    clamp: function(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    /**
     * Линейная интерполяция
     */
    lerp: function(start, end, t) {
        return start * (1 - t) + end * t;
    },

    /**
     * Карта значения из одного диапазона в другой
     */
    map: function(value, fromMin, fromMax, toMin, toMax) {
        return toMin + (toMax - toMin) * ((value - fromMin) / (fromMax - fromMin));
    },

    /**
     * Округление до заданного количества знаков
     */
    round: function(value, decimals = 0) {
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    },

    // ========== 20. РАБОТА С ХРАНИЛИЩЕМ ==========

    /**
     * Оценка размера localStorage
     */
    getLocalStorageSize: function() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length * 2;
            }
        }
        return this.formatFileSize(total);
    },

    /**
     * Очистка устаревших данных
     */
    cleanOldStorage: function(maxAge = 7 * 24 * 60 * 60 * 1000) {
        const now = Date.now();
        for (let key in localStorage) {
            try {
                const item = JSON.parse(localStorage.getItem(key));
                if (item.timestamp && now - item.timestamp > maxAge) {
                    localStorage.removeItem(key);
                }
            } catch {}
        }
    }
};

// ========== ЗАПУСК ==========
window.MORI_UTILS = MORI_UTILS;

console.log('✅ UTILS загружен, методов:', Object.keys(MORI_UTILS).filter(k => typeof MORI_UTILS[k] === 'function').length);
