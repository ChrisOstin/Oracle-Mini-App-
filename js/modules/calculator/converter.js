/**
 * CALCULATOR CONVERTER
 * Конвертер валют для калькулятора MORI
 * Версия: 1.0.0
 */

const MORI_CALCULATOR_CONVERTER = {
    // Поддерживаемые валюты (только нужные)
    currencies: {
        usd: {
            symbol: '$',
            name: 'USD',
            flag: '🇺🇸',
            decimals: 2
        },
        eur: {
            symbol: '€',
            name: 'EUR',
            flag: '🇪🇺',
            decimals: 2
        },
        rub: {
            symbol: '₽',
            name: 'RUB',
            flag: '🇷🇺',
            decimals: 0
        }
    },

    // Кэш курсов
    rates: {
        usd: 1,
        eur: 0.92,
        rub: 90,
        lastUpdate: null
    },

    // Таймаут обновления (1 час)
    updateInterval: 3600000,

    /**
     * Получение курса для валюты
     */
    getRate: async function(currency) {
        // Если курс в кэше и не устарел
        if (this.rates[currency] && this.rates.lastUpdate) {
            const age = Date.now() - this.rates.lastUpdate;
            if (age < this.updateInterval) {
                return this.rates[currency];
            }
        }

        // Обновляем курсы
        await this.updateRates();
        return this.rates[currency] || 1;
    },

    /**
     * Обновление всех курсов
     */
    updateRates: async function() {
        try {
            // Получаем курсы от бесплатного API
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const data = await response.json();

            if (data && data.rates) {
                this.rates = {
                    usd: 1,
                    eur: data.rates.EUR || 0.92,
                    rub: data.rates.RUB || 90,
                    lastUpdate: Date.now()
                };

                console.log('Currency rates updated:', this.rates);
            }
        } catch (error) {
            console.error('Error updating currency rates:', error);
            
            // Если не получилось, оставляем старые курсы
            this.rates.lastUpdate = Date.now() - this.updateInterval + 60000;
        }
    },

    /**
     * Конвертация из любой валюты в USD
     */
    toUSD: async function(amount, fromCurrency) {
        const rate = await this.getRate(fromCurrency);
        return amount / rate;
    },

    /**
     * Конвертация из USD в любую валюту
     */
    fromUSD: async function(usdAmount, toCurrency) {
        const rate = await this.getRate(toCurrency);
        return usdAmount * rate;
    },

    /**
     * Конвертация между любыми валютами
     */
    convert: async function(amount, fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) return amount;
        
        // Сначала в USD, потом в целевую валюту
        const usdAmount = await this.toUSD(amount, fromCurrency);
        return this.fromUSD(usdAmount, toCurrency);
    },

    /**
     * Конвертация валюты в MORI
     */
    toMori: async function(amount, currency, moriPrice) {
        const usdAmount = await this.toUSD(amount, currency);
        return usdAmount / moriPrice;
    },

    /**
     * Конвертация MORI в валюту
     */
    fromMori: async function(moriAmount, currency, moriPrice) {
        const usdAmount = moriAmount * moriPrice;
        return this.fromUSD(usdAmount, currency);
    },

    /**
     * Получение списка доступных валют
     */
    getCurrencyList: function() {
        return Object.entries(this.currencies).map(([code, data]) => ({
            code,
            ...data
        }));
    },

    /**
     * Форматирование суммы в валюте
     */
    formatAmount: function(amount, currency) {
        const curr = this.currencies[currency] || this.currencies.usd;
        const decimals = curr.decimals;
        const symbol = curr.symbol;
        
        return `${symbol} ${amount.toFixed(decimals)}`;
    },

    /**
     * Парсинг введённой суммы
     */
    parseAmount: function(input) {
        // Убираем всё кроме цифр, точки и минуса
        const cleaned = input.replace(/[^\d.-]/g, '');
        const amount = parseFloat(cleaned);
        return isNaN(amount) ? 0 : amount;
    },

    /**
     * Получение цвета для валюты (для графиков)
     */
    getCurrencyColor: function(currency) {
        const colors = {
            usd: '#00ff88',  // зелёный
            eur: '#003399',  // синий
            rub: '#ff4444'   // красный
        };
        return colors[currency] || '#00ff88';
    },

    /**
     * Проверка, поддерживается ли валюта
     */
    isSupported: function(currency) {
        return !!this.currencies[currency];
    }
};

// Автоматическое обновление курсов при старте
MORI_CALCULATOR_CONVERTER.updateRates();

// Обновление курсов каждый час
setInterval(() => {
    MORI_CALCULATOR_CONVERTER.updateRates();
}, 3600000);

// Экспорт
window.MORI_CALCULATOR_CONVERTER = MORI_CALCULATOR_CONVERTER;
