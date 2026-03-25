/**
 * PORTFOLIO MODULE
 * Главный экран с графиками и данными MORI
 * Версия: 2.0.0 (с панелью навигации)
 */

const MORI_PORTFOLIO = {
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

// Звук
playSound: function(soundName) {
    if (!window.MORI_NOTIFICATIONS || !MORI_NOTIFICATIONS.state.soundEnabled) return;
    const audio = new Audio(`/assets/sounds/${soundName}.mp3`);
    audio.volume = 0.3;
    audio.play().catch(() => {});
},

vibrate: function(pattern = 20) {
    if (!window.MORI_NOTIFICATIONS || !MORI_NOTIFICATIONS.state.vibrationEnabled) return;
    if (navigator.vibrate) navigator.vibrate(pattern);
},

    chart: null,
    chartData: [],
    updateTimer: null,

    init: function() {
        console.log('MORI_PORTFOLIO инициализация...');
        this.loadData();
        this.startAutoUpdate();
        
        // Проверяем, нужно ли убрать чат из панели
        const completedTasks = MORI_TASKS ? MORI_TASKS.getCompletedCount() : 0;
        if (completedTasks >= 50 && MORI_APP.accessLevel === 'user') {
            setTimeout(() => {
                const chatBtn = document.querySelector('.nav-btn[data-module="chat"]');
                if (chatBtn) {
                    MORI_APP.animations.fadeOut(chatBtn, 500);
                    setTimeout(() => {
                        chatBtn.remove();
                        MORI_APP.showToast('✅ Все функции разблокированы! Чат перемещён во "Все приложения".', 'success', 4000);
                    }, 500);
                }
            }, 1000);
        }
    },

    render: function() {
        const content = document.getElementById('portfolio-content');
        if (!content) {
            console.warn('portfolio-content not found, retrying...');
            setTimeout(() => this.render(), 100);
            return;
        }
        content.innerHTML = this.getHTML();
        this.attachEvents();
        this.renderChart();
    },

    getHTML: function() {
        const changeClass = this.state.change24h >= 0 ? 'positive' : 'negative';
        const changeSign = this.state.change24h >= 0 ? '+' : '';

        return `
          
            <div class="chart-container">
                <canvas id="mori-chart"></canvas>
                 <div class="timeframe-selector">
                <button class="timeframe-btn ${this.state.timeframe === '12h' ? 'active' : ''}" data-timeframe="12h">12ч</button>
                <button class="timeframe-btn ${this.state.timeframe === '1d' ? 'active' : ''}" data-timeframe="1d">1д</button>
                <button class="timeframe-btn ${this.state.timeframe === '3d' ? 'active' : ''}" data-timeframe="3d">3д</button>
                <button class="timeframe-btn ${this.state.timeframe === '1m' ? 'active' : ''}" data-timeframe="1m">1м</button>
                <button class="timeframe-btn ${this.state.timeframe === '3m' ? 'active' : ''}" data-timeframe="3m">3м</button>
                <button class="timeframe-btn ${this.state.timeframe === '6m' ? 'active' : ''}" data-timeframe="6m">6м</button>
                <button class="timeframe-btn ${this.state.timeframe === '12m' ? 'active' : ''}" data-timeframe="12m">12м</button>
            </div>
 
           </div>

            <div class="current-price-large">
                <span class="price-big">$${this.state.price.toFixed(6)}</span>
                <span class="price-change ${this.state.change24h >= 0 ? 'positive' : 'negative'}">
                    ${this.state.change24h >= 0 ? '+' : ''}${this.state.change24h.toFixed(2)}%
                </span>
            </div>

            <!-- Сравнение с Solana -->
            <div class="solana-compare">
                <div class="solana-label">Сравнение с Solana</div>
                <div class="solana-value">+2.34% за 24ч</div>
            </div>

            <button class="info-btn" id="toggle-mori-info">🪙 О MORI</button>

            <div id="mori-info-section" class="info-section" style="display: none;">

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

            
            <!-- Панель навигации внизу -->
            <div class="bottom-nav">
                ${this.renderNavButtons()}
            </div>

            <div class="whales-section">
                <h3>Крупные держатели</h3>
                <div id="whales-list" class="whales-list">
                    ${this.renderWhales()}
                </div>
            </div>

            <!-- Плавающие кнопки -->
            <div class="floating-buttons">
                ${this.renderFloatingButtons()}
            </div>
        `;
    },

    renderWhales: function() {
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

    renderNavButtons: function() {
        const level = MORI_APP.accessLevel;
        const completedTasks = MORI_TASKS ? MORI_TASKS.getCompletedCount() : 0;
        const allTasksCompleted = completedTasks >= 50;
        const showChat = (level === 'user' && !allTasksCompleted);
        
        let buttons = [];
        buttons.push({ id: 'portfolio', icon: '💼', label: 'Портфель', locked: false });
        
        const calculatorUnlocked = this.isModuleUnlocked('calculator');
        buttons.push({ id: 'calculator', icon: '🧮', label: 'Калькулятор', locked: !calculatorUnlocked, unlockTask: { id: 5, title: 'Исследователь', desc: 'Написать 10 сообщений' } });
        
        const libraryUnlocked = this.isModuleUnlocked('library');
        buttons.push({ id: 'library', icon: '📚', label: 'Библиотека', locked: !libraryUnlocked, unlockTask: { id: 11, title: 'Читатель', desc: 'Написать 20 сообщений' } });
        
        if (showChat) {
            buttons.push({ id: 'chat', icon: '💬', label: 'Чат', locked: false });
        }
        
        const aiUnlocked = this.isModuleUnlocked('ai-chat');
        buttons.push({ id: 'ai-chat', icon: '🧠', label: 'AI', locked: !aiUnlocked, unlockTask: { id: 18, title: 'Любознательный', desc: 'Написать 30 сообщений' } });
        
        buttons.push({ id: 'profile', icon: '👤', label: 'Профиль', locked: false });
        
        return buttons.map(btn => `
            <button class="nav-btn ${btn.locked ? 'locked' : ''}" 
                    data-module="${btn.id}"
                    ${btn.locked ? `data-unlock-task='${JSON.stringify(btn.unlockTask)}'` : ''}>
                <span class="nav-icon">${btn.icon}</span>
                <span class="nav-label">${btn.label}</span>
                ${btn.locked ? '<span class="lock-icon">🔒</span>' : ''}
            </button>
        `).join('');
    },

    renderFloatingButtons: function() {
        const level = MORI_APP.accessLevel;
        let buttons = '';
        buttons += `<button class="floating-btn apps-btn" data-module="all-apps">📱</button>`;
        if (level === 'family' || level === 'admin') {
            buttons += `<button class="floating-btn house-btn" data-module="house">🏠</button>`;
        }
        return buttons;
    },

    isModuleUnlocked: function(moduleId) {
        if (MORI_APP.accessLevel === 'admin') return true;
        const completedTasks = MORI_TASKS ? MORI_TASKS.getCompletedCount() : 0;
        switch(moduleId) {
            case 'calculator': return completedTasks >= 5;
            case 'library': return completedTasks >= 11;
            case 'ai-chat': return completedTasks >= 18;
            default: return true;
        }
    },

    attachEvents: function() {
        // Таймфреймы
        document.querySelectorAll('.timeframe-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const timeframe = e.target.dataset.timeframe;
                this.playSound('click');
                this.vibrate(20);
                this.setState({ timeframe });
                this.loadChartData(timeframe);
            });
        });

        // Обработчики навигации
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const module = btn.dataset.module;
                const isLocked = btn.classList.contains('locked');
                const unlockTask = btn.dataset.unlockTask ? JSON.parse(btn.dataset.unlockTask) : null;
                
                if (isLocked && unlockTask) {
                    this.playSound('error');
                    this.vibrate([100, 50, 100]);
                    MORI_APP.showToast(
                        `🔒 Функция "${btn.querySelector('.nav-label')?.textContent}" заблокирована.\n✅ Выполните задание №${unlockTask.id}: "${unlockTask.title}" (${unlockTask.desc}) для разблокировки.`,
                        'warning',
                        5000
                    );
                    return;
                }
                
                if (module === 'portfolio') {
                    this.loadData();
                } else if (window.MORI_ROUTER) {
                    this.playSound('click');
                    this.vibrate(20);
                    MORI_ROUTER.navigate(module);
                }
            });
        });
        
        // Обработчики плавающих кнопок
        document.querySelectorAll('.floating-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const module = btn.dataset.module;
                if (window.MORI_ROUTER) {
                    this.playSound('click');
                    this.vibrate(20);
                    MORI_ROUTER.navigate(module);
                }
            });
        });
 
        // Обработчик клика на график и двойной тап
const chartCanvas = document.getElementById('mori-chart');
if (chartCanvas) {
    // Клик — уведомление с ценой
    chartCanvas.addEventListener('click', (e) => {
        if (!this.chart || !this.chart.getElementsAtEvent) return;
        const activePoints = this.chart.getElementsAtEvent(e);
        if (activePoints && activePoints.length) {
            const point = activePoints[0];
            const dataPoint = this.chartData[point.index];
            if (dataPoint) {
                const price = dataPoint.y;
                const time = MORI_UTILS.formatDate(dataPoint.x, 'full');
                MORI_APP.showToast(`💰 Цена: $${price.toFixed(6)}\n📅 ${time}`, 'info', 4000);
            }
        }
    });

    // Двойной тап — сброс к текущей цене
    let lastTap = 0;
    chartCanvas.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTap < 300) {
            this.loadData(true);
            this.loadChartData(this.state.timeframe);
            MORI_APP.showToast('📊 График сброшен к текущей цене', 'info', 2000);
        }
        lastTap = now;
    });
}

        // Кнопка показа/скрытия информации о MORI
        const toggleBtn = document.getElementById('toggle-mori-info');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const section = document.getElementById('mori-info-section');
                if (section) {
                    if (section.style.display === 'none') {
                        section.style.display = 'block';
                        toggleBtn.textContent = '🪙 Скрыть MORI';
                    } else {
                        section.style.display = 'none';
                        toggleBtn.textContent = '🪙 О MORI';
                    }
                }
            });
        }

    // ===== НОВЫЕ ФУНКЦИИ =====

// 1. Пульсация иконки темы при клике
const themeIcon = document.querySelector('.theme-icon');
if (themeIcon) {
    themeIcon.addEventListener('click', () => {
        themeIcon.style.transform = 'scale(1.1)';
        setTimeout(() => {
            themeIcon.style.transform = '';
        }, 200);
    });
}

// 3. Долгий тап по киту — копирование адреса
document.querySelectorAll('.whale-item').forEach(item => {
    let pressTimer;
    item.addEventListener('touchstart', (e) => {
        pressTimer = setTimeout(() => {
            const address = item.querySelector('.whale-address')?.textContent;
            if (address) {
                navigator.clipboard.writeText(address);
                MORI_APP.showToast(`📋 Адрес скопирован: ${address}`, 'success', 2000);
            }
        }, 500);
    });
    item.addEventListener('touchend', () => {
        clearTimeout(pressTimer);
    });
    item.addEventListener('touchmove', () => {
        clearTimeout(pressTimer);
    });
});

// 4. Клик по киту — уведомление с транзакциями
document.querySelectorAll('.whale-item').forEach(item => {
    item.addEventListener('click', (e) => {
        const address = item.querySelector('.whale-address')?.textContent;
        const amount = item.querySelector('.whale-amount')?.textContent;
        if (address) {
            MORI_APP.showToast(`🐋 Кит ${address}\n💰 Баланс: ${amount}\n📊 Транзакции: временно недоступны`, 'info', 4000);
        }
    });
});

    },

    loadData: async function(force = false) {
    this.setState({ isLoading: true });
    
    const cacheKey = `portfolio_data_${this.state.timeframe}`;
    const cached = MORI_STORAGE?.get(cacheKey);
    const cacheAge = cached?.timestamp ? Date.now() - cached.timestamp : Infinity;
    
    if (!force && cached && cacheAge < 30000) {
        this.setState(cached.data);
        this.setState({ isLoading: false });
        return;
    }
    
    try {
        const priceData = await MORI_API.getMoriPrice();
        if (priceData) {
            const newData = {
                price: priceData.price,
                change24h: priceData.change24h,
                volume24h: priceData.volume24h,
                liquidity: priceData.liquidity,
                fdv: priceData.fdv,
                marketCap: priceData.marketCap,
                circulatingSupply: priceData.circulatingSupply,
                lastUpdate: Date.now()
            };
            this.setState(newData);
            
            MORI_STORAGE?.set(cacheKey, {
                data: newData,
                timestamp: Date.now()
            });
        }
        await this.loadChartData(this.state.timeframe);
    } catch (error) {
        console.error('Error loading portfolio data:', error);
        MORI_APP.showToast('Ошибка загрузки данных', 'error');
        this.playSound('error');
        this.vibrate([100, 50, 100]);
    }
    this.setState({ isLoading: false });
},

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

    renderChart: function() {
        const ctx = document.getElementById('mori-chart')?.getContext('2d');
        if (!ctx) return;
        if (this.chart) this.chart.destroy();
        
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        
        const data = this.chartData.length ? this.chartData : this.generateMockData();
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: { datasets: [{ label: 'MORI Price', data: data, borderColor: '#ffd700', backgroundColor: gradient, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, pointHoverBackgroundColor: '#ffd700', pointHoverBorderColor: '#ffffff', tension: 0.2, fill: true }] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1a1a1a', titleColor: '#ffffff', bodyColor: '#ffd700', borderColor: '#ffd700', borderWidth: 1, callbacks: { label: (context) => `$${context.parsed.y.toFixed(6)}` } } },
                scales: { x: { type: 'time', time: { unit: this.getTimeUnit(this.state.timeframe), displayFormats: { minute: 'HH:mm', hour: 'HH:mm', day: 'dd MMM', week: 'dd MMM', month: 'MMM yyyy' } }, grid: { display: false }, ticks: { color: '#888', maxRotation: 0, autoSkip: true, maxTicksLimit: 6 } }, y: { grid: { color: 'rgba(255,255,255,0.1)', drawBorder: false }, ticks: { color: '#888', callback: (value) => '$' + value.toFixed(6) } } },
                animation: { duration: 1000, easing: 'easeOutQuart' },
                hover: { mode: 'index', intersect: false }
            }
        });
   
    setTimeout(() => this.drawPriceLevels(), 100);

    },

    updateChart: function() {
        if (!this.chart) return;
        this.chart.data.datasets[0].data = this.chartData;
        this.chart.update();

    setTimeout(() => this.drawPriceLevels(), 50);

    },

    getTimeUnit: function(timeframe) {
    const units = {
        '12h': 'hour',
        '1d': 'day',
        '3d': 'day',
        '1m': 'month',
        '3m': 'month',
        '6m': 'month',
        '12m': 'year'
    };
    return units[timeframe] || 'day';
},

    drawPriceLevels: function() {
    const ctx = document.getElementById('mori-chart')?.getContext('2d');
    if (!ctx || !this.chart) return;
    
    const canvas = ctx.canvas;
    const yAxis = this.chart.scales.y;
    const ticks = yAxis.ticks;
    
    ctx.save();
    ctx.font = '10px Inter, monospace';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'right';
    ctx.shadowBlur = 0;
    
    ticks.forEach(tick => {
        const y = yAxis.getPixelForValue(tick.value);
        if (y > 10 && y < canvas.height - 10) {
            ctx.fillText('$' + tick.value.toFixed(6), canvas.width - 10, y - 2);
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 0.5;
            ctx.moveTo(40, y);
            ctx.lineTo(canvas.width - 10, y);
            ctx.stroke();
        }
    });
    
    ctx.restore();
},

    generateMockData: function() {
        const data = [];
        const now = Date.now();
        const points = this.getPointsForTimeframe(this.state.timeframe);
        const interval = this.getIntervalForTimeframe(this.state.timeframe);
        for (let i = points; i >= 0; i--) {
            const timestamp = now - (i * interval);
            const randomChange = (Math.random() - 0.5) * 0.0002;
            const price = this.state.price + randomChange;
            data.push({ x: timestamp, y: Math.max(0.006, price) });
        }
        return data;
    },

    getPointsForTimeframe: function(timeframe) {
    const points = {
        '12h': 12,
        '1d': 24,
        '3d': 72,
        '1m': 30,
        '3m': 90,
        '6m': 180,
        '12m': 365
    };
    return points[timeframe] || 24;
},

    getIntervalForTimeframe: function(timeframe) {
    const intervals = {
        '12h': 3600000,   // 1 час
        '1d': 3600000,    // 1 час
        '3d': 86400000,   // 1 день
        '1m': 86400000,   // 1 день
        '3m': 86400000,   // 1 день
        '6m': 86400000,   // 1 день
        '12m': 86400000    // 1 день
    };
    return intervals[timeframe] || 3600000;
},

    setState: function(newState) {
        this.state = { ...this.state, ...newState };
        if (newState.timeframe || newState.price) {
            const content = document.getElementById('portfolio-content');
            if (content) {
                content.innerHTML = this.getHTML();
                this.attachEvents();
                this.renderChart();
            }
        }
    },

    startAutoUpdate: function() {
        if (this.updateTimer) clearInterval(this.updateTimer);
        this.updateTimer = setInterval(() => this.loadData(), 5000);
    },

    stopAutoUpdate: function() {
        if (this.updateTimer) { clearInterval(this.updateTimer); this.updateTimer = null; }
    },

    destroy: function() {
        this.stopAutoUpdate();
        if (this.chart) { this.chart.destroy(); this.chart = null; }
    }
};

window.MORI_PORTFOLIO = MORI_PORTFOLIO;
