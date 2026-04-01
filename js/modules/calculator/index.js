/**
 * CALCULATOR MODULE
 * Конвертер USD/RUB ↔ MORI + стейкинг
 * Версия: 1.0.0
 */

const MORI_CALCULATOR = {
    // Состояние
    state: {
        activeTab: 'converter',      // converter, dca, target, positions, staking
        currency: 'usd',             // usd, rub, mori
        amount: 100,
        result: 0,
        moriPrice: 0,
        usdRate: 90,
        change24h: 0,
        
        // DCA (усреднение)
        ownedAmount: 0,
        ownedAvgPrice: 0,
        addAmount: 0,
        newAvgPrice: 0,
        totalMori: 0,
        
        // Целевая цена
        targetPrice: 0,
        currentMori: 0,
        targetMori: 0,
        
        // Стейкинг
        stakingAmount: 0,
        stakingTerm: 12,              // 3, 6, 12
        stakingApr: 100,              // 30, 60, 100
        stakingReward: 0,
        stakingTotal: 0,
        
        // Данные
        positions: [],                // сохранённые позиции
        stakings: [],                // активные стейки
        history: [],                 // история (до 50)
        
        isLoading: false
    },
    
    // Таймер обновления цены
    updateTimer: null,
    
    // Инициализация
    init: function() {
        console.log('MORI_CALCULATOR инициализация...');
        this.loadFromStorage();
        this.updateMoriPrice();
        this.startPriceUpdate();
    },
    
    // Загрузка из localStorage
    loadFromStorage: function() {
        try {
            const positions = localStorage.getItem('calc_positions');
            if (positions) this.state.positions = JSON.parse(positions);
            
            const stakings = localStorage.getItem('calc_stakings');
            if (stakings) this.state.stakings = JSON.parse(stakings);
            
            const history = localStorage.getItem('calc_history');
            if (history) this.state.history = JSON.parse(history);
        } catch (e) {
            console.error('Error loading from storage:', e);
        }
    },
    
    // Сохранение в localStorage
    saveToStorage: function() {
        localStorage.setItem('calc_positions', JSON.stringify(this.state.positions));
        localStorage.setItem('calc_stakings', JSON.stringify(this.state.stakings));
        localStorage.setItem('calc_history', JSON.stringify(this.state.history));
    },
    
    // Обновление цены MORI
    updateMoriPrice: async function() {
        try {
            const data = await MORI_API.getMoriPrice();
            if (data && data.price) {
                this.state.moriPrice = data.price;
                this.state.change24h = data.change24h || 0;
                this.calculate();
                this.render();
            }
        } catch (error) {
            console.error('Error updating price:', error);
        }
    },
    
    // Запуск автообновления цены
    startPriceUpdate: function() {
        if (this.updateTimer) clearInterval(this.updateTimer);
        this.updateTimer = setInterval(() => {
            this.updateMoriPrice();
        }, 60000); // каждую минуту
    },
    
    // Остановка автообновления
    stopPriceUpdate: function() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    },
    
    // Основной расчёт конвертера
    calculate: function() {
        const price = this.state.moriPrice;
        const rate = this.state.usdRate;
        
        switch(this.state.currency) {
            case 'usd':
                this.state.result = this.state.amount / price;
                break;
            case 'rub':
                this.state.result = (this.state.amount / rate) / price;
                break;
            case 'mori':
                this.state.result = this.state.amount * price;
                break;
        }
    },
    
    // Расчёт усреднения (DCA)
    calculateDCA: function() {
        const owned = this.state.ownedAmount;
        const avgPrice = this.state.ownedAvgPrice;
        const addUsd = this.state.addAmount;
        const currentPrice = this.state.moriPrice;
        
        if (owned <= 0 || addUsd <= 0) {
            this.state.newAvgPrice = avgPrice;
            this.state.totalMori = owned;
            return;
        }
        
        const addMori = addUsd / currentPrice;
        const totalMori = owned + addMori;
        const totalCost = (owned * avgPrice) + addUsd;
        const newAvgPrice = totalCost / totalMori;
        
        this.state.newAvgPrice = newAvgPrice;
        this.state.totalMori = totalMori;
    },
    
    // Расчёт целевой цены
    calculateTarget: function() {
        const targetPrice = this.state.targetPrice;
        const amount = this.state.amount;
        const currentPrice = this.state.moriPrice;
        
        if (targetPrice <= 0 || amount <= 0) return;
        
        this.state.currentMori = amount / currentPrice;
        this.state.targetMori = amount / targetPrice;
    },
    
    // Расчёт стейкинга
    calculateStaking: function() {
        const amount = this.state.stakingAmount;
        const term = this.state.stakingTerm;
        let apr = 0;
        
        switch(term) {
            case 3: apr = 30; break;
            case 6: apr = 60; break;
            case 12: apr = 100; break;
        }
        
        this.state.stakingApr = apr;
        this.state.stakingReward = amount * (apr / 100);
        this.state.stakingTotal = amount + this.state.stakingReward;
    },
    
    // Сохранение позиции
    savePosition: function() {
        const position = {
            id: Date.now(),
            amount: this.state.result,
            avgPrice: this.state.moriPrice,
            date: Date.now()
        };
        
        this.state.positions.unshift(position);
        if (this.state.positions.length > 50) this.state.positions.pop();
        this.saveToStorage();
        this.render();
        MORI_APP.showToast('✅ Позиция сохранена', 'success');
    },
    
    // Удаление позиции
    deletePosition: function(id) {
        this.state.positions = this.state.positions.filter(p => p.id != id);
        this.saveToStorage();
        this.render();
        MORI_APP.showToast('🗑️ Позиция удалена', 'info');
    },
    
    // Сохранение стейка
    saveStaking: function() {
        const amount = this.state.stakingAmount;
        if (amount <= 0) {
            MORI_APP.showToast('❌ Введите сумму', 'error');
            return;
        }
        
        const now = Date.now();
        const endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + this.state.stakingTerm);
        
        const staking = {
            id: Date.now(),
            amount: amount,
            term: this.state.stakingTerm,
            apr: this.state.stakingApr,
            startDate: now,
            endDate: endDate.getTime(),
            reward: this.state.stakingReward,
            total: this.state.stakingTotal,
            withdrawn: false
        };
        
        this.state.stakings.unshift(staking);
        if (this.state.stakings.length > 50) this.state.stakings.pop();
        this.saveToStorage();
        this.state.stakingAmount = 0;
        this.calculateStaking();
        this.render();
        MORI_APP.showToast(`✅ Застейкано ${amount} MORI на ${this.state.stakingTerm} мес`, 'success');
    },
    
    // Досрочный вывод стейка
    earlyWithdraw: function(id) {
        const staking = this.state.stakings.find(s => s.id == id);
        if (!staking) return;
        
        if (staking.withdrawn) {
            MORI_APP.showToast('❌ Стейк уже выведен', 'error');
            return;
        }
        
        const now = Date.now();
        if (now >= staking.endDate) {
            MORI_APP.showToast('✅ Стейк уже завершён, используйте обычный вывод', 'info');
            return;
        }
        
        const penalty = staking.amount * 0.5;
        const withdrawAmount = staking.amount - penalty;
        
        staking.withdrawn = true;
        staking.withdrawnAmount = withdrawAmount;
        staking.withdrawnDate = now;
        staking.penalty = penalty;
        
        this.saveToStorage();
        this.render();
        MORI_APP.showToast(`⚠️ Досрочный вывод: получено ${withdrawAmount} MORI (штраф ${penalty} MORI)`, 'warning');
    },
    
    // Вывод стейка после срока
    withdrawStaking: function(id) {
        const staking = this.state.stakings.find(s => s.id == id);
        if (!staking) return;
        
        if (staking.withdrawn) {
            MORI_APP.showToast('❌ Стейк уже выведен', 'error');
            return;
        }
        
        const now = Date.now();
        if (now < staking.endDate) {
            MORI_APP.showToast('❌ Срок ещё не закончился', 'error');
            return;
        }
        
        staking.withdrawn = true;
        staking.withdrawnAmount = staking.total;
        staking.withdrawnDate = now;
        
        this.saveToStorage();
        this.render();
        MORI_APP.showToast(`✅ Выведено ${staking.total} MORI`, 'success');
    },
    
    // Добавление в историю
    addToHistory: function(type, data) {
        const entry = {
            id: Date.now(),
            type: type,
            data: data,
            timestamp: Date.now()
        };
        this.state.history.unshift(entry);
        if (this.state.history.length > 50) this.state.history.pop();
        this.saveToStorage();
    },
    
    // Переключение вкладки
    setTab: function(tab) {
        this.state.activeTab = tab;
        this.render();
    },
    
    // Обновление состояния
    setState: function(newState) {
        Object.assign(this.state, newState);
        this.calculate();
        this.calculateDCA();
        this.calculateTarget();
        this.calculateStaking();
        this.render();
    },
    
    // Рендер модуля
    render: function() {
        const content = document.getElementById('calculator-content');
        if (!content) return;
        
        content.innerHTML = this.getHTML();
        this.attachEvents();
    },
    
    // HTML шаблон
    getHTML: function() {
        const price = this.state.moriPrice;
        const change = this.state.change24h;
        const changeClass = change >= 0 ? 'positive' : 'negative';
        const changeSign = change >= 0 ? '+' : '';
        
        return `
    <div class="calculator-container">
        <div class="texture-overlay"></div>
        <div class="inner-glow"></div>
        <div class="calculator-header">
            <div class="calculator-title">🧮 Калькулятор MORI</div>
            <div class="calculator-price">
                Текущая цена: <span class="price-value">$${this.state.moriPrice.toFixed(6)}</span>
                <span class="price-change ${this.state.change24h >= 0 ? 'positive' : 'negative'}">
                    ${this.state.change24h >= 0 ? '+' : ''}${this.state.change24h.toFixed(2)}%
                </span>
            </div>
        </div>
        
        <div class="calculator-tabs">
            <button class="calc-tab ${this.state.activeTab === 'converter' ? 'active' : ''}" data-tab="converter">📊 Конвертер</button>
            <button class="calc-tab ${this.state.activeTab === 'dca' ? 'active' : ''}" data-tab="dca">📈 Усреднение</button>
            <button class="calc-tab ${this.state.activeTab === 'target' ? 'active' : ''}" data-tab="target">🎯 Целевая цена</button>
            <button class="calc-tab ${this.state.activeTab === 'positions' ? 'active' : ''}" data-tab="positions">📁 Позиции</button>
            <button class="calc-tab ${this.state.activeTab === 'staking' ? 'active' : ''}" data-tab="staking">💰 Стейкинг</button>
        </div>
        
        <div class="calculator-content">
            ${this.renderActiveTab()}
        </div>
    </div>
`;
    },
    
    // Рендер активной вкладки
    renderActiveTab: function() {
        switch(this.state.activeTab) {
            case 'converter':
                return this.renderConverter();
            case 'dca':
                return this.renderDCA();
            case 'target':
                return this.renderTarget();
            case 'positions':
                return this.renderPositions();
            case 'staking':
                return this.renderStaking();
            default:
                return this.renderConverter();
        }
    },
    
    // Вкладка конвертера
    renderConverter: function() {
        return `
            <div class="calc-card">
                <div class="calc-currency-selector">
                    <button class="currency-btn ${this.state.currency === 'usd' ? 'active' : ''}" data-currency="usd">🇺🇸 USD</button>
                    <button class="currency-btn ${this.state.currency === 'rub' ? 'active' : ''}" data-currency="rub">🇷🇺 RUB</button>
                    <button class="currency-btn ${this.state.currency === 'mori' ? 'active' : ''}" data-currency="mori">🪙 MORI</button>
                </div>
                
                <div class="calc-input-group">
                    <label>Сумма в ${this.state.currency.toUpperCase()}</label>
                    <input type="number" id="calc-amount" value="${this.state.amount}" step="any" placeholder="0">
                </div>
                
                <div class="calc-result">
                    <div class="result-label">ВЫ ПОЛУЧИТЕ</div>
                    <div class="result-value">${this.formatNumber(this.state.result)} ${this.state.currency === 'mori' ? 'USD' : 'MORI'}</div>
                    <div class="result-sub">≈ ${this.formatNumber(this.state.currency === 'mori' ? this.state.result * this.state.moriPrice : this.state.result)} ${this.state.currency === 'mori' ? 'USD' : 'MORI'}</div>
                </div>
                
                <div class="calc-actions">
                    <button id="calc-save-position" class="calc-btn secondary">💾 Сохранить позицию</button>
                </div>
            </div>
        `;
    },
    
    // Вкладка усреднения (DCA)
    renderDCA: function() {
        return `
            <div class="calc-card">
                <div class="calc-input-group">
                    <label>Уже куплено MORI</label>
                    <input type="number" id="dca-owned" value="${this.state.ownedAmount}" step="any" placeholder="0">
                </div>
                <div class="calc-input-group">
                    <label>Средняя цена покупки ($)</label>
                    <input type="number" id="dca-avg-price" value="${this.state.ownedAvgPrice}" step="0.000001" placeholder="0">
                </div>
                <div class="calc-input-group">
                    <label>Добавить USD</label>
                    <input type="number" id="dca-add" value="${this.state.addAmount}" step="any" placeholder="0">
                </div>
                
                <div class="calc-result">
                    <div class="result-label">НОВАЯ СРЕДНЯЯ ЦЕНА</div>
                    <div class="result-value">$${this.state.newAvgPrice.toFixed(6)}</div>
                    <div class="result-sub">Итого MORI: ${this.formatNumber(this.state.totalMori)}</div>
                    <div class="result-sub">Снижение: ${this.calcReduction()}%</div>
                </div>
            </div>
        `;
    },
    
    // Вкладка целевой цены
    renderTarget: function() {
        const diff = this.state.targetMori - this.state.currentMori;
        const diffPercent = this.state.currentMori ? (diff / this.state.currentMori * 100) : 0;
        
        return `
            <div class="calc-card">
                <div class="calc-input-group">
                    <label>Желаемая цена ($)</label>
                    <input type="number" id="target-price" value="${this.state.targetPrice}" step="0.000001" placeholder="0">
                </div>
                <div class="calc-input-group">
                    <label>Сумма (USD)</label>
                    <input type="number" id="target-amount" value="${this.state.amount}" step="any" placeholder="0">
                </div>
                
                <div class="calc-result">
                    <div class="result-label">СЕЙЧАС</div>
                    <div class="result-value">${this.formatNumber(this.state.currentMori)} MORI</div>
                    <div class="result-label">ПРИ ЦЕЛЕВОЙ ЦЕНЕ</div>
                    <div class="result-value">${this.formatNumber(this.state.targetMori)} MORI</div>
                    <div class="result-sub">Разница: +${this.formatNumber(diff)} MORI (${diffPercent.toFixed(1)}%)</div>
                </div>
            </div>
        `;
    },
    
    // Вкладка позиций
    renderPositions: function() {
        const positionsHtml = this.state.positions.length === 0 
            ? '<div class="empty-state">Нет сохранённых позиций</div>'
            : this.state.positions.map(pos => {
                const currentValue = pos.amount * this.state.moriPrice;
                const profit = currentValue - (pos.amount * pos.avgPrice);
                const profitPercent = (profit / (pos.amount * pos.avgPrice) * 100).toFixed(1);
                const profitClass = profit >= 0 ? 'positive' : 'negative';
                
                return `
                    <div class="position-item" data-id="${pos.id}">
                        <div class="position-date">${new Date(pos.date).toLocaleDateString()}</div>
                        <div class="position-amount">${this.formatNumber(pos.amount)} MORI</div>
                        <div class="position-price">@ $${pos.avgPrice.toFixed(6)}</div>
                        <div class="position-profit ${profitClass}">${profit >= 0 ? '+' : ''}${profitPercent}% ($${profit.toFixed(2)})</div>
                        <button class="position-delete" data-id="${pos.id}">🗑️</button>
                    </div>
                `;
            }).join('');
        
        return `
            <div class="calc-card">
                <div class="positions-header">
                    <h3>Мои позиции</h3>
                    <button id="save-current-position" class="calc-btn small">💾 Сохранить текущую</button>
                </div>
                <div class="positions-list">
                    ${positionsHtml}
                </div>
            </div>
        `;
    },
    
    // Вкладка стейкинга
    renderStaking: function() {
        const stakingsHtml = this.state.stakings.length === 0 
            ? '<div class="empty-state">Нет активных стейков</div>'
            : this.state.stakings.map(stake => {
                const now = Date.now();
                const isFinished = now >= stake.endDate;
                const isWithdrawn = stake.withdrawn;
                const progress = Math.min(100, Math.max(0, (now - stake.startDate) / (stake.endDate - stake.startDate) * 100));
                const endDate = new Date(stake.endDate).toLocaleDateString();
                
                return `
                    <div class="staking-item" data-id="${stake.id}">
                        <div class="staking-amount">${this.formatNumber(stake.amount)} MORI</div>
                        <div class="staking-term">${stake.term} мес | APR ${stake.apr}%</div>
                        <div class="staking-progress">
                            <div class="progress-bar" style="width: ${progress}%"></div>
                        </div>
                        <div class="staking-date">Окончание: ${endDate}</div>
                        ${!isWithdrawn && !isFinished ? `<div class="staking-penalty">⚠️ Досрочный вывод: ${stake.amount * 0.5} MORI (штраф 50%)</div>` : ''}
                        <div class="staking-actions">
                            ${!isWithdrawn && isFinished ? `<button class="staking-withdraw" data-id="${stake.id}">💰 Забрать ${this.formatNumber(stake.total)} MORI</button>` : ''}
                            ${!isWithdrawn && !isFinished ? `<button class="staking-early" data-id="${stake.id}">⚠️ Вывести досрочно</button>` : ''}
                            ${isWithdrawn ? `<div class="staking-withdrawn">✅ Выведено ${this.formatNumber(stake.withdrawnAmount)} MORI</div>` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        
        return `
            <div class="calc-card">
                <div class="staking-info">
                    <div class="staking-balance">Доступно MORI: <span id="staking-balance">0</span></div>
                </div>
                
                <div class="staking-terms">
                    <button class="term-btn ${this.state.stakingTerm === 3 ? 'active' : ''}" data-term="3">3 мес • 30%</button>
                    <button class="term-btn ${this.state.stakingTerm === 6 ? 'active' : ''}" data-term="6">6 мес • 60%</button>
                    <button class="term-btn ${this.state.stakingTerm === 12 ? 'active' : ''}" data-term="12">12 мес • 100%</button>
                </div>
                
                <div class="calc-input-group">
                    <label>Сумма для стейкинга (MORI)</label>
                    <input type="number" id="staking-amount" value="${this.state.stakingAmount}" step="any" placeholder="0">
                </div>
                
                <div class="calc-result">
                    <div class="result-label">НАГРАДА</div>
                    <div class="result-value">+${this.formatNumber(this.state.stakingReward)} MORI</div>
                    <div class="result-sub">Всего через ${this.state.stakingTerm} мес: ${this.formatNumber(this.state.stakingTotal)} MORI</div>
                </div>
                
                <button id="start-staking" class="calc-btn primary">🔒 Застейкать</button>
                
                <div class="staking-list">
                    <h3>Мои стейки</h3>
                    ${stakingsHtml}
                </div>
            </div>
        `;
    },
    
    // Навешивание обработчиков
    attachEvents: function() {
        // Переключение вкладок
        document.querySelectorAll('.calc-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.setTab(tab);
            });
        });
        
        // Конвертер
        const amountInput = document.getElementById('calc-amount');
        if (amountInput) {
            amountInput.addEventListener('input', (e) => {
                this.setState({ amount: parseFloat(e.target.value) || 0 });
            });
        }
        
        document.querySelectorAll('.currency-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const currency = e.target.dataset.currency;
                this.setState({ currency });
            });
        });
        
        // Сохранение позиции
        const saveBtn = document.getElementById('calc-save-position');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.savePosition());
        }
        
        // DCA
        const dcaOwned = document.getElementById('dca-owned');
        if (dcaOwned) {
            dcaOwned.addEventListener('input', (e) => {
                this.setState({ ownedAmount: parseFloat(e.target.value) || 0 });
            });
        }
        
        const dcaAvgPrice = document.getElementById('dca-avg-price');
        if (dcaAvgPrice) {
            dcaAvgPrice.addEventListener('input', (e) => {
                this.setState({ ownedAvgPrice: parseFloat(e.target.value) || 0 });
            });
        }
        
        const dcaAdd = document.getElementById('dca-add');
        if (dcaAdd) {
            dcaAdd.addEventListener('input', (e) => {
                this.setState({ addAmount: parseFloat(e.target.value) || 0 });
            });
        }
        
        // Целевая цена
        const targetPrice = document.getElementById('target-price');
        if (targetPrice) {
            targetPrice.addEventListener('input', (e) => {
                this.setState({ targetPrice: parseFloat(e.target.value) || 0 });
            });
        }
        
        const targetAmount = document.getElementById('target-amount');
        if (targetAmount) {
            targetAmount.addEventListener('input', (e) => {
                this.setState({ amount: parseFloat(e.target.value) || 0 });
            });
        }
        
        // Позиции — удаление
        document.querySelectorAll('.position-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = e.target.dataset.id;
                this.deletePosition(id);
            });
        });
        
        // Сохранение текущей позиции
        const saveCurrentBtn = document.getElementById('save-current-position');
        if (saveCurrentBtn) {
            saveCurrentBtn.addEventListener('click', () => this.savePosition());
        }
        
        // Стейкинг — выбор срока
        document.querySelectorAll('.term-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const term = parseInt(e.target.dataset.term);
                this.setState({ stakingTerm: term });
            });
        });
        
        // Стейкинг — сумма
        const stakingAmount = document.getElementById('staking-amount');
        if (stakingAmount) {
            stakingAmount.addEventListener('input', (e) => {
                this.setState({ stakingAmount: parseFloat(e.target.value) || 0 });
            });
        }
        
        // Начать стейкинг
        const startStaking = document.getElementById('start-staking');
        if (startStaking) {
            startStaking.addEventListener('click', () => this.saveStaking());
        }
        
        // Стейкинг — вывод
        document.querySelectorAll('.staking-withdraw').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.withdrawStaking(id);
            });
        });
        
        document.querySelectorAll('.staking-early').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.earlyWithdraw(id);
            });
        });
    },
    
    // Форматирование чисел
    formatNumber: function(num) {
        if (isNaN(num) || num === 0) return '0';
        return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    },
    
    // Расчёт снижения цены
    calcReduction: function() {
        if (this.state.ownedAvgPrice <= 0 || this.state.newAvgPrice <= 0) return '0.00';
        const reduction = (this.state.ownedAvgPrice - this.state.newAvgPrice) / this.state.ownedAvgPrice * 100;
        return reduction.toFixed(2);
    },
    
    // Очистка при выходе
    destroy: function() {
        this.stopPriceUpdate();
        this.saveToStorage();
    }
};

// Экспорт
window.MORI_CALCULATOR = MORI_CALCULATOR;
