/**
 * CALCULATOR MODULE
 * Калькулятор MORI с поддержкой USD/RUB
 * Версия: 1.0.0
 */

const MORI_CALCULATOR = {
    // Состояние
    state: {
        mode: 'buy',           // 'buy' или 'sell'
        currency: 'usd',       // 'usd' или 'rub'
        amount: 100,
        result: 0,
        precision: 2,          // 2, 4 или 6 знаков
        moriPrice: 0.006887,
        rubRate: 90,
        isLoading: false,
        error: null
    },

    // История расчётов
    history: [],

    // Таймер обновления курса
    updateTimer: null,

    /**
     * Инициализация модуля
     */
    init: function() {
        console.log('MORI_CALCULATOR инициализация...');
        this.loadHistory();
        this.startRateUpdate();
    },

    /**
     * Рендер модуля
     */
    render: function() {
        const content = document.getElementById('calculator-content');
        if (!content) return;

        content.innerHTML = this.getHTML();
        this.attachEvents();
        this.calculate();
    },

    /**
     * HTML шаблон
     */
    getHTML: function() {
        return `
            <div class="calculator-card">
                <!-- Вкладки покупка/продажа -->
                <div class="calculator-tabs">
                    <button class="calc-tab ${this.state.mode === 'buy' ? 'active' : ''}" data-mode="buy">
                        🟢 Купить MORI
                    </button>
                    <button class="calc-tab ${this.state.mode === 'sell' ? 'active' : ''}" data-mode="sell">
                        🔴 Продать MORI
                    </button>
                </div>

                <!-- Выбор валюты -->
                <div class="currency-selector">
                    <button class="currency-btn ${this.state.currency === 'usd' ? 'active' : ''}" data-currency="usd">
                        🇺🇸 USD
                    </button>
                    <button class="currency-btn ${this.state.currency === 'rub' ? 'active' : ''}" data-currency="rub">
                        🇷🇺 RUB
                    </button>
                </div>

                <!-- Поле ввода -->
                <div class="calc-input-group">
                    <label class="calc-label">Сумма в ${this.state.currency.toUpperCase()}</label>
                    <div class="calc-input-wrapper">
                        <input type="number" 
                               id="calc-amount" 
                               class="calc-input ${this.state.error ? 'error' : ''}" 
                               value="${this.state.amount}" 
                               min="0" 
                               step="${this.state.currency === 'usd' ? '10' : '100'}">
                        <span class="calc-currency">${this.state.currency.toUpperCase()}</span>
                    </div>
                </div>

                <!-- Результат -->
                <div class="result-container">
                    <div class="result-label">Вы ${this.state.mode === 'buy' ? 'получите' : 'продадите'}</div>
                    <div class="result-value" id="calc-result">${this.formatResult(this.state.result)}</div>
                    <div class="result-sub">MORI</div>
                </div>

                <!-- Дополнительная информация -->
                <div class="calc-info">
                    <div class="info-row">
                        <span class="info-label">Цена MORI</span>
                        <span class="info-value">${MORI_UTILS.formatMoriPrice(this.state.moriPrice)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Курс USD/RUB</span>
                        <span class="info-value">${this.state.rubRate} ₽</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Точность</span>
                        <span class="info-value">
                            <div class="precision-selector">
                                ${[2, 4, 6].map(prec => `
                                    <button class="precision-btn ${this.state.precision === prec ? 'active' : ''}" 
                                            data-precision="${prec}">
                                        ${prec} зн.
                                    </button>
                                `).join('')}
                            </div>
                        </span>
                    </div>
                </div>

                <!-- Кнопка действия -->
                <button class="calc-action-btn" id="calc-action">
                    ${this.state.mode === 'buy' ? '💰 Купить MORI' : '💸 Продать MORI'}
                </button>
            </div>

            <!-- Маленький график -->
            <div class="calc-chart" id="calc-chart">
                <canvas id="calc-mini-chart"></canvas>
            </div>

            <!-- История расчётов -->
            <div class="history-section">
                <div class="history-header">
                    <h3>📜 История расчётов</h3>
                    ${this.history.length > 0 ? 
                        '<button class="history-clear" id="clear-history">Очистить</button>' : ''}
                </div>
                <div class="history-list" id="history-list">
                    ${this.renderHistory()}
                </div>
            </div>
        `;
    },

    /**
     * Рендер истории
     */
    renderHistory: function() {
        if (this.history.length === 0) {
            return '<div class="history-empty">История пуста</div>';
        }

        return this.history.slice().reverse().map(item => `
            <div class="history-item" data-id="${item.id}">
                <div class="history-left">
                    <div class="history-from">
                        ${item.amount} ${item.currency.toUpperCase()} 
                        ${item.mode === 'buy' ? '→' : '←'} 
                        ${this.formatResult(item.result)} MORI
                    </div>
                    <div class="history-time">${MORI_UTILS.timeAgo(item.timestamp)}</div>
                </div>
                <div class="history-right">
                    <button class="history-repeat" data-id="${item.id}">🔄</button>
                    <button class="history-delete" data-id="${item.id}">🗑️</button>
                </div>
            </div>
        `).join('');
    },

    /**
     * Навешивание обработчиков
     */
    attachEvents: function() {
        // Переключение режима (покупка/продажа)
        document.querySelectorAll('.calc-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                this.setState({ mode });
                this.calculate();
            });
        });

        // Переключение валюты
        document.querySelectorAll('.currency-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const currency = e.target.dataset.currency;
                this.setState({ currency });
                this.calculate();
            });
        });

        // Ввод суммы
        const amountInput = document.getElementById('calc-amount');
        if (amountInput) {
            amountInput.addEventListener('input', (e) => {
                const amount = parseFloat(e.target.value) || 0;
                this.setState({ 
                    amount,
                    error: amount < 0 ? 'Сумма не может быть отрицательной' : null
                });
                this.calculate();
            });
        }

        // Выбор точности
        document.querySelectorAll('.precision-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const precision = parseInt(e.target.dataset.precision);
                this.setState({ precision });
                this.calculate();
            });
        });

        // Кнопка действия
        const actionBtn = document.getElementById('calc-action');
        if (actionBtn) {
            actionBtn.addEventListener('click', () => this.executeOrder());
        }

        // Кнопка очистки истории
        const clearBtn = document.getElementById('clear-history');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearHistory());
        }

        // Кнопки в истории
        document.querySelectorAll('.history-repeat').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = e.target.dataset.id;
                this.repeatCalculation(id);
            });
        });

        document.querySelectorAll('.history-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = e.target.dataset.id;
                this.deleteFromHistory(id);
            });
        });

        // Клик на элемент истории (повтор)
        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('history-repeat') && 
                    !e.target.classList.contains('history-delete')) {
                    const id = item.dataset.id;
                    this.repeatCalculation(id);
                }
            });
        });
    },

    /**
     * Расчёт результата
     */
    calculate: function() {
        let result = 0;
        
        if (this.state.currency === 'usd') {
            result = this.state.amount / this.state.moriPrice;
        } else {
            const usdAmount = this.state.amount / this.state.rubRate;
            result = usdAmount / this.state.moriPrice;
        }

        this.setState({ result });
        this.updateMiniChart();
    },

    /**
     * Форматирование результата с учётом точности
     */
    formatResult: function(value) {
        return value.toFixed(this.state.precision);
    },

    /**
     * Выполнение ордера (покупка/продажа)
     */
    executeOrder: function() {
        if (this.state.amount <= 0) {
            MORI_APP.showToast('Введите сумму больше 0', 'error');
            return;
        }

        const order = {
            id: MORI_UTILS.generateId('order_'),
            mode: this.state.mode,
            currency: this.state.currency,
            amount: this.state.amount,
            result: this.state.result,
            price: this.state.moriPrice,
            rubRate: this.state.rubRate,
            timestamp: Date.now()
        };

        // Добавляем в историю
        this.history.push(order);
        this.saveHistory();
        
        // Обновляем UI
        this.render();
        
        // Показываем уведомление
        MORI_APP.showToast(
            `${this.state.mode === 'buy' ? 'Куплено' : 'Продано'} ${this.formatResult(this.state.result)} MORI`, 
            'success'
        );

        // Обновляем статистику пользователя
        if (MORI_USER.current) {
            MORI_USER.updateStats('calculations');
        }
    },

    /**
     * Повтор расчёта из истории
     */
    repeatCalculation: function(id) {
        const item = this.history.find(h => h.id === id);
        if (item) {
            this.setState({
                mode: item.mode,
                currency: item.currency,
                amount: item.amount
            });
            this.calculate();
            
            // Прокрутка к верху
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    },

    /**
     * Удаление из истории
     */
    deleteFromHistory: function(id) {
        this.history = this.history.filter(h => h.id !== id);
        this.saveHistory();
        this.render();
    },

    /**
     * Очистка всей истории
     */
    clearHistory: function() {
        if (this.history.length > 0) {
            this.history = [];
            this.saveHistory();
            this.render();
            MORI_APP.showToast('История очищена', 'info');
        }
    },

    /**
     * Сохранение истории
     */
    saveHistory: function() {
        localStorage.setItem('calc_history', JSON.stringify(this.history));
    },

    /**
     * Загрузка истории
     */
    loadHistory: function() {
        const saved = localStorage.getItem('calc_history');
        if (saved) {
            try {
                this.history = JSON.parse(saved);
            } catch (e) {
                console.error('Error loading history:', e);
            }
        }
    },

    /**
     * Обновление маленького графика
     */
    updateMiniChart: function() {
        const canvas = document.getElementById('calc-mini-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);
        
        // Рисуем простой график изменения цены
        const points = 20;
        const data = [];
        for (let i = 0; i < points; i++) {
            data.push(this.state.moriPrice + (Math.random() - 0.5) * 0.0002);
        }

        ctx.beginPath();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        
        data.forEach((value, i) => {
            const x = (i / (points - 1)) * width;
            const y = height - ((value - Math.min(...data)) / 
                      (Math.max(...data) - Math.min(...data))) * height;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
    },

    /**
     * Обновление курса рубля
     */
    updateRubRate: async function() {
        try {
            // Пробуем получить реальный курс
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const data = await response.json();
            if (data && data.rates && data.rates.RUB) {
                this.setState({ rubRate: data.rates.RUB });
            }
        } catch (error) {
            console.error('Error fetching rub rate:', error);
            // Если не получилось, оставляем старый курс
        }
    },

    /**
     * Обновление цены MORI
     */
    updateMoriPrice: async function() {
        try {
            const data = await MORI_API.getMoriPrice();
            if (data) {
                this.setState({ moriPrice: data.price });
                this.calculate();
            }
        } catch (error) {
            console.error('Error fetching mori price:', error);
        }
    },

    /**
     * Запуск автообновления курса
     */
    startRateUpdate: function() {
        this.updateRubRate();
        this.updateMoriPrice();
        
        this.updateTimer = setInterval(() => {
            this.updateRubRate();
            this.updateMoriPrice();
        }, 60000); // Каждую минуту
    },

    /**
     * Остановка автообновления
     */
    stopRateUpdate: function() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    },

    /**
     * Обновление состояния
     */
    setState: function(newState) {
        this.state = { ...this.state, ...newState };
        
        // Если меняется что-то, что влияет на отображение
        if (newState.mode || newState.currency || newState.amount || newState.precision) {
            const content = document.getElementById('calculator-content');
            if (content) {
                content.innerHTML = this.getHTML();
                this.attachEvents();
            }
        }
    },

    /**
     * Очистка при выходе из модуля
     */
    destroy: function() {
        this.stopRateUpdate();
        this.saveHistory();
    }
};

// Экспорт
window.MORI_CALCULATOR = MORI_CALCULATOR;
