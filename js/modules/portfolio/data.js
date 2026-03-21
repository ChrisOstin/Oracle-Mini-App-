/**
 * PORTFOLIO DATA
 * Работа с данными для портфеля
 * Версия: 2.0.0 (БЕЗ ЗАГЛУШЕК)
 */

const MORI_PORTFOLIO_DATA = {
    // Кэш данных
    cache: {
        price: null,
        history: {},
        whales: null,
        lastUpdate: null
    },

    // Таймауты кэша (в миллисекундах)
    ttl: {
        price: 5000,      // 5 секунд
        history: 60000,   // 1 минута
        whales: 3600000   // 1 час
    },

    /**
     * Получение текущей цены MORI
     */
    getPrice: async function(force = false) {
        // Проверка кэша
        if (!force && this.cache.price && this.cache.lastUpdate) {
            const age = Date.now() - this.cache.lastUpdate;
            if (age < this.ttl.price) {
                return this.cache.price;
            }
        }

        try {
            const data = await MORI_API.getMoriPrice();
            if (data) {
                this.cache.price = data;
                this.cache.lastUpdate = Date.now();
                return data;
            }
        } catch (error) {
            console.error('Ошибка загрузки цены:', error);
            MORI_APP.showToast('❌ Ошибка загрузки цены', 'error');
        }
        return null;
    },

    /**
     * Получение исторических данных для графика
     */
    getHistory: async function(timeframe = '1h', force = false) {
        // Проверка кэша
        if (!force && this.cache.history[timeframe]) {
            return this.cache.history[timeframe];
        }

        try {
            const data = await MORI_API.getMoriHistory(timeframe);
            if (data && data.length) {
                this.cache.history[timeframe] = data;
                return data;
            }
        } catch (error) {
            console.error('Ошибка загрузки истории:', error);
            MORI_APP.showToast('❌ Ошибка загрузки графика', 'error');
        }
        return [];
    },

    /**
     * Получение списка китов
     */
    getWhales: async function(force = false) {
        // Проверка кэша
        if (!force && this.cache.whales) {
            return this.cache.whales;
        }

        try {
            const data = await MORI_API.getWhales();
            if (data && data.length) {
                this.cache.whales = data;
                return data;
            }
        } catch (error) {
            console.error('Ошибка загрузки китов:', error);
        }
        return [];
    },

    /**
     * Количество точек для таймфрейма
     */
    getPointsForTimeframe: function(timeframe) {
        const points = {
            '15m': 15,
            '30m': 30,
            '1h': 60,
            '4h': 48,
            '12h': 72,
            '1d': 24,
            '1w': 168,
            '1m': 30,
            '3m': 90,
            '6m': 180
        };
        return points[timeframe] || 60;
    },

    /**
     * Интервал для таймфрейма (в миллисекундах)
     */
    getIntervalForTimeframe: function(timeframe) {
        const intervals = {
            '15m': 60000,
            '30m': 60000,
            '1h': 60000,
            '4h': 300000,
            '12h': 600000,
            '1d': 3600000,
            '1w': 3600000,
            '1m': 86400000,
            '3m': 86400000,
            '6m': 86400000
        };
        return intervals[timeframe] || 3600000;
    },

    /**
     * Очистка кэша
     */
    clearCache: function() {
        this.cache = {
            price: null,
            history: {},
            whales: null,
            lastUpdate: null
        };
    },

    /**
     * Обновление всех данных
     */
    refreshAll: async function() {
        const [price, whales] = await Promise.all([
            this.getPrice(true),
            this.getWhales(true)
        ]);
        return { price, whales };
    }
};

// Экспорт
window.MORI_PORTFOLIO_DATA = MORI_PORTFOLIO_DATA;
