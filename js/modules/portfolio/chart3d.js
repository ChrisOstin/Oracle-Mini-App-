/**
 * PORTFOLIO CHART 3D
 * 3D свечной график для портфеля
 * Версия: 1.0.0
 */

const MORI_PORTFOLIO_CHART = {
    // График
    chart: null,
    ctx: null,
    canvas: null,
    
    // Данные
    data: [],
    timeframe: '1h',
    
    // Настройки
    options: {
        width: 0,
        height: 0,
        candleWidth: 8,
        candleSpacing: 2,
        volumeScale: 0.3,
        shadowIntensity: 0.5,
        rotationAngle: 0.1
    },

    // Анимация
    animationId: null,
    isAnimating: false,

    /**
     * Инициализация
     */
    init: function(canvasId = 'mori-chart') {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return false;

        this.ctx = this.canvas.getContext('2d');
        this.options.width = this.canvas.width;
        this.options.height = this.canvas.height;

        // Настраиваем canvas для ретина дисплеев
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.options.width * dpr;
        this.canvas.height = this.options.height * dpr;
        this.ctx.scale(dpr, dpr);

        // Начинаем анимацию
        this.startAnimation();

        return true;
    },

    /**
     * Установка данных
     */
    setData: function(data, timeframe) {
        this.data = data;
        this.timeframe = timeframe;
        this.options.candleWidth = this.getCandleWidth(timeframe);
        this.draw();
    },

    /**
     * Отрисовка графика
     */
    draw: function() {
        if (!this.ctx || !this.data.length) return;

        this.ctx.clearRect(0, 0, this.options.width, this.options.height);
        
        // Рисуем сетку
        this.drawGrid();
        
        // Рисуем свечи
        this.drawCandles();
        
        // Рисуем тени (3D эффект)
        this.drawShadows();
        
        // Рисуем объём
        this.drawVolume();
        
        // Рисуем ценовые метки
        this.drawPriceLabels();
    },

    /**
     * Отрисовка сетки
     */
    drawGrid: function() {
        const ctx = this.ctx;
        const width = this.options.width;
        const height = this.options.height;

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 0.5;

        // Горизонтальные линии (ценовые уровни)
        const priceSteps = 5;
        for (let i = 0; i <= priceSteps; i++) {
            const y = (height / priceSteps) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Вертикальные линии (временные метки)
        const timeSteps = 8;
        for (let i = 0; i <= timeSteps; i++) {
            const x = (width / timeSteps) * i;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        ctx.restore();
    },

    /**
     * Отрисовка свечей
     */
    drawCandles: function() {
        if (!this.data.length) return;

        const ctx = this.ctx;
        const width = this.options.width;
        const height = this.options.height;
        
        // Находим мин/макс цены
        const prices = this.data.flatMap(d => [d.h, d.l]);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice;

        // Находим мин/макс объёма
        const volumes = this.data.map(d => d.v);
        const maxVolume = Math.max(...volumes);

        const candleWidth = this.options.candleWidth;
        const spacing = this.options.candleSpacing;
        const startX = (width - (this.data.length * (candleWidth + spacing))) / 2;

        this.data.forEach((candle, index) => {
            const x = startX + index * (candleWidth + spacing);
            
            // Нормализуем цены к высоте графика
            const openY = height - ((candle.o - minPrice) / priceRange) * height * 0.8 - height * 0.1;
            const closeY = height - ((candle.c - minPrice) / priceRange) * height * 0.8 - height * 0.1;
            const highY = height - ((candle.h - minPrice) / priceRange) * height * 0.8 - height * 0.1;
            const lowY = height - ((candle.l - minPrice) / priceRange) * height * 0.8 - height * 0.1;

            const isGreen = candle.c >= candle.o;
            const color = isGreen ? 'rgba(0, 255, 136, 1)' : 'rgba(255, 68, 68, 1)';
            const fillColor = isGreen ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 68, 68, 0.3)';

            // Рисуем тень свечи (high-low)
            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + candleWidth / 2, highY);
            ctx.lineTo(x + candleWidth / 2, lowY);
            ctx.stroke();

            // Рисуем тело свечи
            const bodyY = Math.min(openY, closeY);
            const bodyHeight = Math.abs(closeY - openY) || 1;

            // Создаём градиент для 3D эффекта
            const gradient = ctx.createLinearGradient(x, bodyY, x + candleWidth, bodyY + bodyHeight);
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, fillColor);

            ctx.fillStyle = gradient;
            ctx.fillRect(x, bodyY, candleWidth, bodyHeight);

            ctx.restore();

            // Сохраняем позицию свечи для теней
            candle._x = x;
            candle._y = bodyY;
            candle._height = bodyHeight;
            candle._color = color;
        });
    },

    /**
     * Отрисовка теней (3D эффект)
     */
    drawShadows: function() {
        const ctx = this.ctx;
        const intensity = this.options.shadowIntensity;

        this.data.forEach(candle => {
            if (!candle._x) return;

            const x = candle._x;
            const y = candle._y;
            const height = candle._height;
            const width = this.options.candleWidth;

            // Тень справа
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 5;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            
            ctx.fillStyle = candle._color;
            ctx.globalAlpha = intensity * 0.3;
            ctx.fillRect(x + 2, y + 2, width, height);
            
            ctx.restore();
        });
    },

    /**
     * Отрисовка объёма
     */
    drawVolume: function() {
        if (!this.data.length) return;

        const ctx = this.ctx;
        const width = this.options.width;
        const height = this.options.height;
        
        const volumes = this.data.map(d => d.v);
        const maxVolume = Math.max(...volumes);

        const candleWidth = this.options.candleWidth;
        const spacing = this.options.candleSpacing;
        const startX = (width - (this.data.length * (candleWidth + spacing))) / 2;
        const volumeHeight = height * 0.15; // 15% от высоты графика

        this.data.forEach((candle, index) => {
            const x = startX + index * (candleWidth + spacing);
            const volumeRatio = candle.v / maxVolume;
            const barHeight = volumeRatio * volumeHeight;

            const isGreen = candle.c >= candle.o;
            const color = isGreen ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 68, 68, 0.3)';

            ctx.save();
            ctx.fillStyle = color;
            ctx.fillRect(x, height - barHeight, candleWidth, barHeight - 5);
            ctx.restore();
        });
    },

    /**
     * Отрисовка ценовых меток
     */
    drawPriceLabels: function() {
        if (!this.data.length) return;

        const ctx = this.ctx;
        const width = this.options.width;
        const height = this.options.height;
        
        const prices = this.data.flatMap(d => [d.h, d.l]);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '10px Inter, monospace';
        ctx.textAlign = 'right';

        // Текущая цена
        const lastCandle = this.data[this.data.length - 1];
        const currentPrice = lastCandle.c;
        const currentY = height - ((currentPrice - minPrice) / (maxPrice - minPrice)) * height * 0.8 - height * 0.1;

        ctx.fillStyle = 'rgba(255, 215, 0, 1)';
        ctx.fillText(`$${currentPrice.toFixed(6)}`, width - 10, currentY - 5);

        // Максимум
        ctx.fillStyle = 'rgba(0, 255, 136, 1)';
        ctx.fillText(`⬆️ $${maxPrice.toFixed(6)}`, width - 10, 20);

        // Минимум
        ctx.fillStyle = 'rgba(255, 68, 68, 1)';
        ctx.fillText(`⬇️ $${minPrice.toFixed(6)}`, width - 10, height - 20);

        ctx.restore();
    },

    /**
     * Получение ширины свечи в зависимости от таймфрейма
     */
    getCandleWidth: function(timeframe) {
        const widths = {
            '15m': 12,
            '30m': 10,
            '1h': 8,
            '4h': 6,
            '12h': 5,
            '1d': 4,
            '1w': 3,
            '1m': 2,
            '3m': 2,
            '6m': 1
        };
        return widths[timeframe] || 8;
    },

    /**
     * Запуск анимации (вращение)
     */
    startAnimation: function() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.animate();
    },

    /**
     * Остановка анимации
     */
    stopAnimation: function() {
        this.isAnimating = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    },

    /**
     * Анимация (лёгкое вращение)
     */
    animate: function() {
        if (!this.isAnimating) return;

        // Добавляем эффект вращения через трансформацию canvas
        this.ctx.save();
        this.ctx.translate(this.options.width / 2, this.options.height / 2);
        this.ctx.rotate(this.options.rotationAngle * Math.sin(Date.now() * 0.001));
        this.ctx.translate(-this.options.width / 2, -this.options.height / 2);
        
        this.draw();
        
        this.ctx.restore();

        this.animationId = requestAnimationFrame(() => this.animate());
    },

    /**
     * Изменение размера
     */
    resize: function(width, height) {
        this.options.width = width;
        this.options.height = height;
        
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.ctx.scale(dpr, dpr);
        
        this.draw();
    },

    /**
     * Очистка
     */
    destroy: function() {
        this.stopAnimation();
        this.chart = null;
        this.ctx = null;
        this.canvas = null;
        this.data = [];
    }
};

// Экспорт
window.MORI_PORTFOLIO_CHART = MORI_PORTFOLIO_CHART;
