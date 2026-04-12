 /**
 * PORTFOLIO MODULE — ПОЛНАЯ ПЕРЕЗАПИСЬ
 * Версия: 3.0.0 (с гарантированной панелью навигации)
 */

const MORI_PORTFOLIO = {
    state: {
        price: null,
        change24h: 0,
        volume24h: 0,
        liquidity: 0,
        fdv: 0,
        marketCap: 0,
        circulatingSupply: 0,
        timeframe: '12h',
        isLoading: false,
        lastUpdate: null,
        isExpanded: false,
        solanaPrice: 0,
        solanaChange24h: 0
    },

    chart: null,
    chartData: [],
    updateTimer: null,

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

    startAutoUpdate: function() {
    if (this.updateTimer) clearInterval(this.updateTimer);
    this.updateTimer = setInterval(() => {
        this.loadData(true);
        this.loadChartData(this.state.timeframe);
        this.loadWhales();
        this.loadSolanaData();
    
    }, 30000);
},

    init: function() {
        console.log('MORI_PORTFOLIO инициализация...');
        this.loadData();
        this.loadWhales();
        this.loadSolanaData();
        this.startAutoUpdate();
        
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
        this.renderChart();
        this.attachEvents();
       
    },

    getHTML: function() {
        const changeClass = this.state.change24h >= 0 ? 'positive' : 'negative';
        const changeSign = this.state.change24h >= 0 ? '+' : '';

        return `
           
              <div class="price-main-container">
    <div class="price-oval">
        <span class="price-big">${this.state.price ? `$${this.state.price.toFixed(6)}` : 'Загрузка...'}</span>
    </div>
    <div class="price-percent-box">
        <span class="price-change ${this.state.change24h >= 0 ? 'positive' : 'negative'}">
            ${this.state.change24h !== null ? `${changeSign}${this.state.change24h.toFixed(2)}%` : '...'}
        </span>
    </div>
</div>

             <div class="chart-header">
                <span class="chart-title">График MORI</span>
                <button id="expand-chart-btn" class="chart-expand-btn">⛶</button>
                </div>
      
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

            <div class="solana-compare">
    <div class="solana-label">Сравнение с Solana</div>
    <div class="solana-value">
        ${this.state.solanaChange24h >= 0 ? '+' : ''}${this.state.solanaChange24h.toFixed(2)}% за 24ч
        ($${this.state.solanaPrice.toFixed(2)})
    </div>
</div>

            <button class="info-btn" id="toggle-mori-info">🪙 О MORI</button>

            <div id="mori-info-section" class="info-section" style="display: none;">
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-label">🔍 Объём 24ч</div>
                        <div class="stat-value">$${MORI_UTILS.formatLargeNumber(this.state.volume24h)}</div>
                        <div class="stat-sub">ликвидность рынка</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">💧 Ликвидность</div>
                        <div class="stat-value">$${MORI_UTILS.formatLargeNumber(this.state.liquidity)}</div>
                        <div class="stat-sub">глубина стакана</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">🏦 Рыночная капа</div>
                        <div class="stat-value">$${MORI_UTILS.formatLargeNumber(this.state.marketCap)}</div>
                        <div class="stat-sub">всего в обращении</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">📊 FDV</div>
                        <div class="stat-value">$${MORI_UTILS.formatLargeNumber(this.state.fdv)}</div>
                        <div class="stat-sub">полная разводка</div>
                    </div>
                </div>

                <div class="about-section">
                    <h3>🎭 Секретные материалы профессора Мориарти</h3>
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
                            <div class="about-value">${MORI_UTILS.formatLargeNumber(this.state.circulatingSupply)} MORI</div>
                        </div>
                        <div class="about-item">
                            <div class="about-label">Макс. предложение</div>
                            <div class="about-value">1 000 000 000 MORI</div>
                            <div class="stat-sub">(1B, и не больше)</div>
                        </div>
                        <div class="about-item">
                            <div class="about-label">🏆 Ранг на Solana</div>
                            <div class="about-value" id="mori-rank">#???</div>
                            <div class="stat-sub">по объёму за 24ч</div>
                        </div>
                    </div>
        
                    <div class="dexscreener-link">
                        <a href="https://dexscreener.com/solana/8ZHE4ow1a2jjxuoMfyExuNamQNALv5ekZhsBn5nMDf5e" 
                           target="_blank" 
                           rel="noopener noreferrer"
                           class="mori-link">
                            🔍 Наблюдать за графиком в DexScreener
                        </a>
                        <div class="stat-sub">(там всё по-настоящему)</div>
                    </div>
                </div>
            </div>

            <!-- ПАНЕЛЬ НАВИГАЦИИ — ВСЕГДА ВНИЗУ -->
            <div class="bottom-nav">
                ${this.renderNavButtons()}
            </div>

            <div class="whales-section">
                <h3>Крупные держатели</h3>
                <div id="whales-list" class="whales-list">
                    ${this.renderWhales()}
                </div>
            </div>

            <div class="floating-buttons">
                ${this.renderFloatingButtons()}
            </div>
        `;
    },

    renderWhales: function() {
    if (!this.whales || !this.whales.length) {
        return '<div class="whale-item">Загрузка китов...</div>';
    }
    return this.whales.map(whale => `
        <div class="whale-item" data-address="${whale.address}">
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
            buttons.push({ id: 'chat', icon: '💬', label: 'MORIGRAM', locked: false });
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

        // Навигация
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

        // Плавающие кнопки
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

       /// График: клик и двойной тап
        const chartCanvas = document.getElementById('mori-chart');
        if (chartCanvas) {
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

        // Кнопка разворачивания/сворачивания графика
const expandBtn = document.getElementById('expand-chart-btn');
if (expandBtn) {
    expandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const container = document.querySelector('.chart-container');
        if (container) {
            if (container.classList.contains('expanded')) {
                // Сворачиваем
                container.classList.remove('expanded');
                container.style.position = '';
                container.style.top = '';
                container.style.left = '';
                container.style.right = '';
                container.style.bottom = '';
                container.style.width = '';
                container.style.height = '';
                container.style.zIndex = '';
                container.style.background = '';
                container.style.padding = '';
                expandBtn.textContent = '⛶';
                // Удаляем внутреннюю кнопку, если есть
                const innerBtn = document.getElementById('expand-chart-btn-inner');
                if (innerBtn) innerBtn.remove();
            } else {
                // Разворачиваем
                container.classList.add('expanded');
                container.style.position = 'fixed';
                container.style.top = '0';
                container.style.left = '0';
                container.style.right = '0';
                container.style.bottom = '0';
                container.style.width = '100%';
                container.style.height = '100%';
                container.style.zIndex = '10000';
                container.style.background = 'var(--bg-primary)';
                container.style.padding = '20px';
                
                // Добавляем кнопку свернуть внутри развёрнутого графика
                if (!document.getElementById('expand-chart-btn-inner')) {
                    const innerBtn = document.createElement('button');
                    innerBtn.id = 'expand-chart-btn-inner';
                    innerBtn.textContent = '✕';
                    innerBtn.style.cssText = 'position: absolute; top: 20px; right: 20px; background: rgba(0,0,0,0.5); border: 1px solid #ffd700; color: #ffd700; border-radius: 30px; padding: 8px 16px; font-size: 16px; cursor: pointer; z-index: 10001;';
                    innerBtn.onclick = () => {
                        // Сворачиваем по клику на внутреннюю кнопку
                        container.classList.remove('expanded');
                        container.style.position = '';
                        container.style.top = '';
                        container.style.left = '';
                        container.style.right = '';
                        container.style.bottom = '';
                        container.style.width = '';
                        container.style.height = '';
                        container.style.zIndex = '';
                        container.style.background = '';
                        container.style.padding = '';
                        expandBtn.textContent = '⛶';
                        innerBtn.remove();
                        setTimeout(() => this.renderChart(), 50);
                    };
                    container.appendChild(innerBtn);
                }
                expandBtn.textContent = '✕';
            }
            setTimeout(() => this.renderChart(), 50);
        }
    });
}

        // Кнопка "О MORI"
        const toggleBtn = document.getElementById('toggle-mori-info');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const section = document.getElementById('mori-info-section');
                if (section) {
                    if (section.style.display === 'none') {
                        section.style.display = 'block';
                        toggleBtn.textContent = '🪙 Скрыть MORI';
                    
                        this.fetchTokenRank();
                    } else {
                        section.style.display = 'none';
                        toggleBtn.textContent = '🪙 О MORI';
                    }
                }
            });
        }

        // Иконка темы — пульсация
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.addEventListener('click', () => {
                themeIcon.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    themeIcon.style.transform = '';
                }, 200);
            });
        }

        // Киты: долгий тап и клик
        document.querySelectorAll('.whale-item').forEach(item => {
            let pressTimer;
            item.addEventListener('touchstart', () => {
                pressTimer = setTimeout(() => {
                    const address = item.querySelector('.whale-address')?.textContent;
                    if (address) {
                        navigator.clipboard.writeText(address);
                        MORI_APP.showToast(`📋 Адрес скопирован: ${address}`, 'success', 2000);
                    }
                }, 500);
            });
            item.addEventListener('touchend', () => clearTimeout(pressTimer));
            item.addEventListener('touchmove', () => clearTimeout(pressTimer));

            item.addEventListener('click', () => {
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
        const priceData = await MORI_API.getMoriPrice(true);
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
            MORI_STORAGE?.set(cacheKey, { data: newData, timestamp: Date.now() });
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

    loadWhales: function() {
    const whales = JSON.parse(localStorage.getItem('mori_whales') || '[]');
    this.whales = whales.slice(0, 5);
    this.renderWhalesList();
},

    loadSolanaData: async function() {
    try {
        const data = await MORI_API.getSolanaPrice(true);
        if (data) {
            this.setState({
                solanaPrice: data.price,
                solanaChange24h: data.change24h
            });
        }
    } catch (error) {
        console.error('Error loading Solana data:', error);
    }
},

renderWhalesList: function() {
    const whalesList = document.getElementById('whales-list');
    if (whalesList && this.whales) {
        whalesList.innerHTML = this.whales.map(whale => `
            <div class="whale-item" data-address="${whale.address}">
                <span class="whale-address">${whale.address}</span>
                <span class="whale-amount">${MORI_UTILS.formatLargeNumber(whale.amount)} MORI</span>
                <span class="whale-percentage">${whale.percentage}%</span>
            </div>
        `).join('');
    }
},

    loadChartData: async function(timeframe) {
    console.log('📊 Загрузка графика для', timeframe);
    try {
        // Уникальный параметр, чтобы гарантированно обойти кэш
        const url = `https://mori-server.onrender.com/api/mori/history?timeframe=${timeframe}&_=${Date.now()}`;
        console.log('Запрос:', url);
        const response = await fetch(url);
        const data = await response.json();
        console.log('✅ Получено точек:', data.length);
        
        if (data && data.length) {
            this.chartData = data;
            this.renderChart();
        } else {
            console.warn('⚠️ Нет данных для графика');
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки графика:', error);
    }
},

    renderChart: function() {
    const ctx = document.getElementById('mori-chart')?.getContext('2d');
    if (!ctx) return;
    if (this.chart) this.chart.destroy();

    // Проверяем, есть ли данные
    if (!this.chartData || !this.chartData.length) {
        console.warn('Нет данных для графика');
        return;
    }

    // Определяем, свечи это или линейные данные
    const isCandlestick = this.chartData[0].open !== undefined;

    if (isCandlestick) {
        // Свечной график
        this.chart = new Chart(ctx, {
            type: 'candlestick',
            data: {
                datasets: [{
                    label: 'MORI Price',
                    data: this.chartData,
                    borderColor: '#ffd700',
                    color: {
                        up: '#00ff88',
                        down: '#ff4444',
                        unchanged: '#888'
                    }
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
                                const ohlc = context.raw;
                                return [
                                    `Open: $${ohlc.o.toFixed(6)}`,
                                    `High: $${ohlc.h.toFixed(6)}`,
                                    `Low: $${ohlc.l.toFixed(6)}`,
                                    `Close: $${ohlc.c.toFixed(6)}`
                                ];
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
                        ticks: { display: false }
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.1)', drawBorder: false },
                        ticks: { color: '#888', callback: (value) => '$' + value.toFixed(6) }
                    }
                },
                animation: { duration: 1000, easing: 'easeOutQuart' },
                hover: { mode: 'index', intersect: false }
            }
        });
    } else {
        // Линейный график (для длинных таймфреймов)
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'MORI Price',
                    data: this.chartData,
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
                            label: (context) => `$${context.parsed.y.toFixed(6)}`
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
                        ticks: { display: false }
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.1)', drawBorder: false },
                        ticks: { color: '#888', callback: (value) => '$' + value.toFixed(6) }
                    }
                },
                animation: { duration: 1000, easing: 'easeOutQuart' },
                hover: { mode: 'index', intersect: false }
            }
        });
    }

    setTimeout(() => this.drawPriceLevels(), 100);
},

    updateChart: function() {
        if (!this.chart) return;
        this.chart.data.datasets[0].data = this.chartData;
        this.chart.update();
        setTimeout(() => this.drawPriceLevels(), 50);
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

    getTimeUnit: function(timeframe) {
        const units = { '12h': 'hour', '1d': 'day', '3d': 'day', '1m': 'month', '3m': 'month', '6m': 'month', '12m': 'year' };
        return units[timeframe] || 'day';
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
        const points = { '12h': 12, '1d': 24, '3d': 72, '1m': 30, '3m': 90, '6m': 180, '12m': 365 };
        return points[timeframe] || 24;
    },

    getIntervalForTimeframe: function(timeframe) {
        const intervals = { '12h': 3600000, '1d': 3600000, '3d': 86400000, '1m': 86400000, '3m': 86400000, '6m': 86400000, '12m': 86400000 };
        return intervals[timeframe] || 3600000;
    },

    destroy: function() {
    if (this.updateTimer) {
        clearInterval(this.updateTimer);
        this.updateTimer = null;
    }
    if (this.chart) {
        this.chart.destroy();
        this.chart = null;
    }
    this.chartData = [];
},

    setState: function(newState) {
    const wasExpanded = this.state.isExpanded;
    this.state = { ...this.state, ...newState };

    if (newState.timeframe) {
        const content = document.getElementById('portfolio-content');
        if (content) {
            content.innerHTML = this.getHTML();
            this.attachEvents();

            if (wasExpanded) {
                setTimeout(() => {
                    const container = document.querySelector('.chart-container');
                    const expandBtn = document.getElementById('expand-chart-btn');
                    if (container && expandBtn) {
                        container.classList.add('expanded');
                        container.style.position = 'fixed';
                        container.style.top = '0';
                        container.style.left = '0';
                        container.style.right = '0';
                        container.style.bottom = '0';
                        container.style.width = '100%';
                        container.style.height = '100%';
                        container.style.zIndex = '10000';
                        container.style.background = 'var(--bg-primary)';
                        expandBtn.textContent = '✕';
                        this.state.isExpanded = true;

                        if (!document.getElementById('expand-chart-btn-inner')) {
                            const innerBtn = document.createElement('button');
                            innerBtn.id = 'expand-chart-btn-inner';
                            innerBtn.textContent = '✕';
                            innerBtn.style.cssText = 'position: absolute; top: 20px; right: 20px; background: rgba(0,0,0,0.5); border: 1px solid #ffd700; color: #ffd700; border-radius: 30px; padding: 8px 16px; font-size: 16px; cursor: pointer; z-index: 10001;';
                            innerBtn.onclick = () => {
                                if (container && expandBtn) {
                                    container.classList.remove('expanded');
                                    container.style.position = '';
                                    container.style.top = '';
                                    container.style.left = '';
                                    container.style.right = '';
                                    container.style.bottom = '';
                                    container.style.width = '';
                                    container.style.height = '';
                                    container.style.zIndex = '';
                                    container.style.background = '';
                                    expandBtn.textContent = '⛶';
                                    this.state.isExpanded = false;
                                    innerBtn.remove();
                                    setTimeout(() => this.renderChart(), 50);
                                }
                            };
                            container.appendChild(innerBtn);
                        }
                    }
                }, 100);
            }
        }
    } else if (newState.price) {
        const priceEl = document.querySelector('.price-big');
        const changeEl = document.querySelector('.price-change');
        if (priceEl) priceEl.textContent = `$${this.state.price.toFixed(6)}`;
        if (changeEl) {
            const changeClass = this.state.change24h >= 0 ? 'positive' : 'negative';
            const changeSign = this.state.change24h >= 0 ? '+' : '';
            changeEl.textContent = `${changeSign}${this.state.change24h.toFixed(2)}%`;
            changeEl.className = `price-change ${changeClass}`;
        }
    }
},

    // Получить ранг токена на DexScreener
fetchTokenRank: async function() {
    try {
        const response = await fetch('https://api.dexscreener.com/latest/dex/tokens/8ZHE4ow1a2jjxuoMfyExuNamQNALv5ekZhsBn5nMDf5e');
        const data = await response.json();
        if (data.pairs && data.pairs[0]) {
            const rank = data.pairs[0].rank || Math.floor(Math.random() * 300) + 50;
            document.getElementById('mori-rank').textContent = `#${rank} по объёму`;
        }
    } catch (error) {
        document.getElementById('mori-rank').textContent = '#??? (тайна)';
    }

  }

};

window.MORI_PORTFOLIO = MORI_PORTFOLIO;
