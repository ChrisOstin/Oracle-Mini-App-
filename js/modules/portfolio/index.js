/**
 * PORTFOLIO MODULE
 * Главный экран с графиками и данными MORI
 * Версия: 1.0.0
 */

const MORI_PORTFOLIO = {
    // Текущее состояние
    state: {
        price: 0.006887,
        change24h: 0,
        volume24h: 0,
        liquidity: 0,
        fdv: 0,
        marketCap: 0,
        circulatingSupply: 0,
        timeframe: '1h',
        isLoading: false,
        lastUpdate: null
    },

    // График
    chart: null,
    chartData: [],

    // Таймер обновления
    updateTimer: null,

    /**
     * Инициализация модуля
     */
    init: function() {
        console.log('MORI_PORTFOLIO инициализация...');
        this.loadData();
        this.startAutoUpdate();
    },

    /**
     * Рендер модуля
     */
    render: function() {
        const content = document.getElementById('portfolio-content');
        if (!content) return;

        content.innerHTML = this.getHTML();
        this.attachEvents();
        this.renderChart();
    },

    /**
     * HTML шаблон
     */
    getHTML: function() {
        const changeClass = this.state.change24h >= 0 ? 'positive' : 'negative';
        const changeSign = this.state.change24h >= 0 ? '+' : '';

        return `
            <div class="portfolio-header">
                <div class="portfolio-price">
                    <div class="price-label">MORI / USD</div>
                    <div class="price-value">${MORI_UTILS.formatMoriPrice(this.state.price)}</div>
                    <div class="price-change ${changeClass}">
                        ${changeSign}${this.state.change24h.toFixed(2)}%
                    </div>
                </div>
                <div class="last-update">
                    ${this.state.lastUpdate ? MORI_UTILS.timeAgo(this.state.lastUpdate) : ''}
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Объём 24ч</div>
                    <div class="stat-value">$${MORI_UTILS.formatLargeNumber(this.state.volume24h)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Ликвидность</div>
                    <div class="stat-value">$${MORI_UTILS.formatLargeNumber(this.state.liquidity)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Рыночная капа</div>
                    <div class="stat-value">$${MORI_UTILS.formatLargeNumber(this.state.marketCap)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">FDV</div>
                    <div class="stat-value">$${MORI_UTILS.formatLargeNumber(this.state.fdv)}</div>
                </div>
            </div>

            <div class="timeframe-selector">
                <button class="timeframe-btn ${this.state.timeframe === '15m' ? 'active' : ''}" data-timeframe="15m">15м</button>
                <button class="timeframe-btn ${this.state.timeframe === '30m' ? 'active' : ''}" data-timeframe="30m">30м</button>
                <button class="timeframe-btn ${this.state.timeframe === '1h' ? 'active' : ''}" data-timeframe="1h">1ч</button>
                <button class="timeframe-btn ${this.state.timeframe === '4h' ? 'active' : ''}" data-timeframe="4h">4ч</button>
                <button class="timeframe-btn ${this.state.timeframe === '12h' ? 'active' : ''}" data-timeframe="12h">12ч</button>
                <button class="timeframe-btn ${this.state.timeframe === '1d' ? 'active' : ''}" data-timeframe="1d">1д</button>
                <button class="timeframe-btn ${this.state.timeframe === '1w' ? 'active' : ''}" data-timeframe="1w">1н</button>
                <button class="timeframe-btn ${this.state.timeframe === '1m' ? 'active' : ''}" data-timeframe="1m">1м</button>
                <button class="timeframe-btn ${this.state.timeframe === '3m' ? 'active' : ''}" data-timeframe="3m">3м</button>
                <button class="timeframe-btn ${this.state.timeframe === '6m' ? 'active' : ''}" data-timeframe="6m">6м</button>
            </div>

            <div class="chart-container">
                <canvas id="mori-chart"></canvas>
            </div>

            <div class="about-section">
                <h3>О MORI</h3>
                <div class="about-grid">
                    <div class="about-item">
                        <div class="about-label">Токен</div>
                        <div class="about-value">MORI</div>
                    </div>
                    <div class="about-item">
                        <div class="about-label">Сеть</div>
                        <div class="about-value">Solana</div>
                    </div>
                    <div class="about-item">
                        <div class="about-label">Циркулирующее</div>
                        <div class="about-value">${MORI_UTILS.formatLargeNumber(this.state.circulatingSupply)}</div>
                    </div>
                    <div class="about-item">
                        <div class="about-label">Макс. предложение</div>
                        <div class="about-value">1B</div>
                    </div>
                </div>
            </div>

            <div class="whales-section">
                <h3>Крупные держатели</h3>
                <div id="whales-list" class="whales-list">
                    ${this.renderWhales()}
                </div>
            </div>
        `;
    },

    /**
     * Рендер списка китов
     */
    renderWhales: function() {
        // Пример данных (в реальности будут с сервера)
        const whales = [
            { address: '0x1234...5678', amount: 15000000, percentage: 15 },
            { address: '0x8765...4321', amount: 12000000, percentage: 12 },
            { address: '0xabcd...efgh', amount: 8000000, percentage: 8 },
            { address: '0xefgh...ijkl', amount: 5000000, percentage: 5 },
            { address: '0xijkl...mnop', amount: 3000000, percentage: 3 }
        ];

        return whales.map(whale => `
            <div class="whale-item">
                <span class="whale-address">${whale.address}</span>
                <span class="whale-amount">${MORI_UTILS.formatLargeNumber(whale.amount)} MORI</span>
                <span class="whale-percentage">${whale.percentage}%</span>
            </div>
        `).join('');
    },

    /**
     * Навешивание обработчиков
     */
    attachEvents: function() {
        // Таймфреймы
        document.querySelectorAll('.timeframe-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const timeframe = e.target.dataset.timeframe;
                this.setState({ timeframe });
                this.loadChartData(timeframe);
            });
        });
    },

    /**
     * Загрузка данных
     */
    loadData: async function() {
        this.setState({ isLoading: true });

        try {
            // Загружаем цену
            const priceData = await MORI_API.getMoriPrice();
            if (priceData) {
                this.setState({
                    price: priceData.price,
                    change24h: priceData.change24h,
                    volume24h: priceData.volume24h,
                    liquidity: priceData.liquidity,
                    fdv: priceData.fdv,
                    marketCap: priceData.marketCap,
                    circulatingSupply: priceData.circulatingSupply,
                    lastUpdate: Date.now()
                });
            }

            // Загружаем данные для графика
            await this.loadChartData(this.state.timeframe);

        } catch (error) {
            console.error('Error loading portfolio data:', error);
            MORI_APP.showToast('Ошибка загрузки данных', 'error');
        }

        this.setState({ isLoading: false });
    },

    /**
     * Загрузка данных для графика
     */
    loadChartData: async function(timeframe) {
        try {
            const data = await MORI_API.getMoriHistory(timeframe);
            if (data) {
                this.chartData = data;
                this.updateChart();
            }
        } catch (error) {
            console.error('Error loading chart data:', error);
        }
    },

    /**
     * Рендер графика
     */
    renderChart: function() {
        const ctx = document.getElementById('mori-chart')?.getContext('2d');
        if (!ctx) return;

        // Уничтожаем старый график
        if (this.chart) {
            this.chart.destroy();
        }

        // Создаём градиент для 3D эффекта
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

        // Генерируем данные если их нет
        const data = this.chartData.length ? this.chartData : this.generateMockData();

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'MORI Price',
                    data: data,
                    borderColor: '#ffd700',
                    backgroundColor: gradient,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    pointHoverBackgroundColor: '#ffd700',
                    pointHoverBorderColor: '#ffffff',
                    tension: 0.2,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1a1a1a',
                        titleColor: '#ffffff',
                        bodyColor: '#ffd700',
                        borderColor: '#ffd700',
                        borderWidth: 1,
                        callbacks: {
                            label: (context) => {
                                return `$${context.parsed.y.toFixed(6)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: this.getTimeUnit(this.state.timeframe),
                            displayFormats: {
                                minute: 'HH:mm',
                                hour: 'HH:mm',
                                day: 'dd MMM',
                                week: 'dd MMM',
                                month: 'MMM yyyy'
                            }
                        },
                        grid: { display: false },
                        ticks: { 
                            color: '#888',
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 6
                        }
                    },
                    y: {
                        grid: { 
                            color: 'rgba(255,255,255,0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#888',
                            callback: (value) => '$' + value.toFixed(6)
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                hover: {
                    mode: 'index',
                    intersect: false
                }
            }
        });
    },

    /**
     * Обновление графика
     */
    updateChart: function() {
        if (!this.chart) return;

        this.chart.data.datasets[0].data = this.chartData;
        this.chart.update();
    },

    /**
     * Получение единицы времени для таймфрейма
     */
    getTimeUnit: function(timeframe) {
        const units = {
            '15m': 'minute',
            '30m': 'minute',
            '1h': 'hour',
            '4h': 'hour',
            '12h': 'hour',
            '1d': 'day',
            '1w': 'day',
            '1m': 'month',
            '3m': 'month',
            '6m': 'month'
        };
        return units[timeframe] || 'hour';
    },

    /**
     * Генерация тестовых данных (пока нет сервера)
     */
    generateMockData: function() {
        const data = [];
        const now = Date.now();
        const points = this.getPointsForTimeframe(this.state.timeframe);
        const interval = this.getIntervalForTimeframe(this.state.timeframe);

        for (let i = points; i >= 0; i--) {
            const timestamp = now - (i * interval);
            const randomChange = (Math.random() - 0.5) * 0.0002;
            const price = this.state.price + randomChange;
            data.push({
                x: timestamp,
                y: Math.max(0.006, price)
            });
        }

        return data;
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
            '15m': 900000,   // 15 минут
            '30m': 1800000,  // 30 минут
            '1h': 3600000,   // 1 час
            '4h': 14400000,  // 4 часа
            '12h': 43200000, // 12 часов
            '1d': 86400000,  // 1 день
            '1w': 604800000, // 1 неделя
            '1m': 2592000000, // 1 месяц (30 дней)
            '3m': 7776000000, // 3 месяца
            '6m': 15552000000 // 6 месяцев
        };
        return intervals[timeframe] || 3600000;
    },

    /**
     * Обновление состояния
     */
    setState: function(newState) {
        this.state = { ...this.state, ...newState };
        
        // Если это изменение таймфрейма или данных, обновляем UI
        if (newState.timeframe || newState.price) {
            const content = document.getElementById('portfolio-content');
            if (content) {
                content.innerHTML = this.getHTML();
                this.attachEvents();
                this.renderChart();
            }
        }
    },

    /**
     * Запуск автообновления (каждые 5 секунд)
     */
    startAutoUpdate: function() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }

        this.updateTimer = setInterval(() => {
            this.loadData();
        }, 5000);
    },

    /**
     * Остановка автообновления
     */
    stopAutoUpdate: function() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    },

    /**
     * Очистка при выходе из модуля
     */
    destroy: function() {
        this.stopAutoUpdate();
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }
};

// Экспорт
window.MORI_PORTFOLIO = MORI_PORTFOLIO;
