/**
 * CALCULATOR HISTORY
 * Управление историей расчётов
 * Версия: 1.0.0
 */

const MORI_CALCULATOR_HISTORY = {
    // Максимальное количество записей в истории
    maxItems: 100,

    // Текущая история
    items: [],

    /**
     * Загрузка истории из localStorage
     */
    load: function() {
        try {
            const saved = localStorage.getItem('calc_history');
            if (saved) {
                this.items = JSON.parse(saved);
                console.log(`Loaded ${this.items.length} history items`);
            }
        } catch (error) {
            console.error('Error loading history:', error);
            this.items = [];
        }
        return this.items;
    },

    /**
     * Сохранение истории в localStorage
     */
    save: function() {
        try {
            // Ограничиваем количество записей
            if (this.items.length > this.maxItems) {
                this.items = this.items.slice(-this.maxItems);
            }
            localStorage.setItem('calc_history', JSON.stringify(this.items));
            return true;
        } catch (error) {
            console.error('Error saving history:', error);
            return false;
        }
    },

    /**
     * Добавление новой записи
     */
    add: function(entry) {
        const newEntry = {
            id: this.generateId(),
            timestamp: Date.now(),
            ...entry
        };

        this.items.push(newEntry);
        this.save();
        
        return newEntry;
    },

    /**
     * Удаление записи по ID
     */
    remove: function(id) {
        const index = this.items.findIndex(item => item.id === id);
        if (index !== -1) {
            this.items.splice(index, 1);
            this.save();
            return true;
        }
        return false;
    },

    /**
     * Очистка всей истории
     */
    clear: function() {
        this.items = [];
        this.save();
    },

    /**
     * Получение записи по ID
     */
    get: function(id) {
        return this.items.find(item => item.id === id);
    },

    /**
     * Получение всех записей (отсортированных по дате)
     */
    getAll: function(limit = null) {
        const sorted = [...this.items].sort((a, b) => b.timestamp - a.timestamp);
        return limit ? sorted.slice(0, limit) : sorted;
    },

    /**
     * Получение записей за период
     */
    getByDateRange: function(startDate, endDate) {
        return this.items.filter(item => 
            item.timestamp >= startDate && item.timestamp <= endDate
        ).sort((a, b) => b.timestamp - a.timestamp);
    },

    /**
     * Получение записей по типу (покупка/продажа)
     */
    getByMode: function(mode) {
        return this.items.filter(item => item.mode === mode)
            .sort((a, b) => b.timestamp - a.timestamp);
    },

    /**
     * Получение записей по валюте
     */
    getByCurrency: function(currency) {
        return this.items.filter(item => item.currency === currency)
            .sort((a, b) => b.timestamp - a.timestamp);
    },

    /**
     * Получение статистики по истории
     */
    getStats: function() {
        if (this.items.length === 0) {
            return {
                total: 0,
                buyCount: 0,
                sellCount: 0,
                totalMori: 0,
                averageAmount: 0,
                byCurrency: {}
            };
        }

        const stats = {
            total: this.items.length,
            buyCount: 0,
            sellCount: 0,
            totalMori: 0,
            averageAmount: 0,
            byCurrency: {}
        };

        // Инициализируем счётчики по валютам
        ['usd', 'eur', 'rub'].forEach(curr => {
            stats.byCurrency[curr] = {
                count: 0,
                total: 0,
                totalMori: 0
            };
        });

        this.items.forEach(item => {
            // По типу
            if (item.mode === 'buy') stats.buyCount++;
            else stats.sellCount++;

            // По валюте
            if (stats.byCurrency[item.currency]) {
                stats.byCurrency[item.currency].count++;
                stats.byCurrency[item.currency].total += item.amount;
                stats.byCurrency[item.currency].totalMori += item.result;
            }

            // Общее количество MORI
            stats.totalMori += item.result;
        });

        stats.averageAmount = stats.totalMori / stats.total;

        return stats;
    },

    /**
     * Экспорт истории в JSON
     */
    exportJSON: function() {
        const data = {
            exportDate: Date.now(),
            version: '1.0',
            count: this.items.length,
            items: this.items
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `mori_history_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    },

    /**
     * Импорт истории из JSON
     */
    importJSON: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // Проверка формата
                    if (!data.items || !Array.isArray(data.items)) {
                        reject(new Error('Неверный формат файла'));
                        return;
                    }

                    // Добавляем записи
                    data.items.forEach(item => {
                        // Генерируем новые ID
                        item.id = this.generateId();
                        this.items.push(item);
                    });

                    this.save();
                    resolve(data.items.length);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    },

    /**
     * Поиск по истории
     */
    search: function(query) {
        const searchTerm = query.toLowerCase();
        return this.items.filter(item => 
            item.amount.toString().includes(searchTerm) ||
            item.result.toString().includes(searchTerm) ||
            item.currency.toLowerCase().includes(searchTerm) ||
            (item.mode === 'buy' ? 'покупка' : 'продажа').includes(searchTerm)
        ).sort((a, b) => b.timestamp - a.timestamp);
    },

    /**
     * Удаление старых записей (старше N дней)
     */
    prune: function(days = 30) {
        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
        const oldCount = this.items.length;
        
        this.items = this.items.filter(item => item.timestamp > cutoff);
        this.save();
        
        return oldCount - this.items.length;
    },

    /**
     * Генерация ID
     */
    generateId: function() {
        return 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Форматирование записи для отображения
     */
    formatEntry: function(entry) {
        const date = new Date(entry.timestamp);
        const dateStr = date.toLocaleDateString('ru-RU');
        const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        
        const action = entry.mode === 'buy' ? '🟢 Куплено' : '🔴 Продано';
        const currency = entry.currency.toUpperCase();
        
        return {
            id: entry.id,
            action,
            amount: `${entry.amount} ${currency}`,
            result: `${entry.result.toFixed(2)} MORI`,
            price: `По цене $${entry.price.toFixed(6)}`,
            datetime: `${dateStr} ${timeStr}`,
            full: `${action} ${entry.amount} ${currency} → ${entry.result.toFixed(2)} MORI`
        };
    },

    /**
     * Получение размера истории
     */
    getSize: function() {
        try {
            const json = JSON.stringify(this.items);
            return (json.length * 2) / 1024; // приблизительно в KB
        } catch {
            return 0;
        }
    }
};

// Экспорт
window.MORI_CALCULATOR_HISTORY = MORI_CALCULATOR_HISTORY;
