/**
 * ALL APPS GRID
 * Управление сеткой приложений (4x4)
 * Версия: 1.0.0
 */

const MORI_ALL_APPS_GRID = {
    // Размеры сетки
    gridSize: {
        rows: 4,
        cols: 4,
        total: 16
    },

    // Текущий порядок приложений
    order: [],

    // Настройки отображения
    display: {
        showEmpty: true,
        showLocked: true,
        showNew: true,
        showFavorites: false
    },

    /**
     * Инициализация
     */
    init: function() {
        console.log('MORI_ALL_APPS_GRID инициализация...');
        this.loadOrder();
    },

    /**
     * Загрузка порядка из localStorage
     */
    loadOrder: function() {
        try {
            const saved = localStorage.getItem('apps_grid_order');
            if (saved) {
                this.order = JSON.parse(saved);
            } else {
                // Порядок по умолчанию
                this.order = [
                    'portfolio', 'calculator', 'library', 'ai-chat',
                    'profile', 'tasks', 'chat', 'house',
                    'family', 'calendar', 'budget', 'reminders',
                    'durak', 'demigurge', 'empty1', 'empty2'
                ];
            }
        } catch (error) {
            console.error('Error loading grid order:', error);
        }
    },

    /**
     * Сохранение порядка
     */
    saveOrder: function() {
        localStorage.setItem('apps_grid_order', JSON.stringify(this.order));
    },

    /**
     * Получить приложение по позиции
     */
    getAppAtPosition: function(row, col) {
        const index = row * this.gridSize.cols + col;
        const appId = this.order[index];
        return MORI_ALL_APPS.appList.find(a => a.id === appId);
    },

    /**
     * Получить позицию приложения
     */
    getAppPosition: function(appId) {
        const index = this.order.indexOf(appId);
        if (index === -1) return null;
        return {
            row: Math.floor(index / this.gridSize.cols),
            col: index % this.gridSize.cols
        };
    },

    /**
     * Переместить приложение
     */
    moveApp: function(fromIndex, toIndex) {
        if (fromIndex < 0 || fromIndex >= this.order.length ||
            toIndex < 0 || toIndex >= this.order.length) {
            return false;
        }

        // Перемещаем элемент
        const [moved] = this.order.splice(fromIndex, 1);
        this.order.splice(toIndex, 0, moved);
        
        this.saveOrder();
        return true;
    },

    /**
     * Поменять местами два приложения
     */
    swapApps: function(index1, index2) {
        if (index1 < 0 || index1 >= this.order.length ||
            index2 < 0 || index2 >= this.order.length) {
            return false;
        }

        [this.order[index1], this.order[index2]] = 
        [this.order[index2], this.order[index1]];
        
        this.saveOrder();
        return true;
    },

    /**
     * Получить все приложения в порядке сетки
     */
    getGridApps: function() {
        return this.order.map(appId => 
            MORI_ALL_APPS.appList.find(a => a.id === appId)
        ).filter(app => app !== undefined);
    },

    /**
     * Получить доступные приложения для пользователя
     */
    getAvailableApps: function() {
        const allApps = this.getGridApps();
        const userLevel = MORI_USER.current?.accessLevel || 'guest';

        return allApps.map(app => ({
            ...app,
            available: this.isAppAvailable(app, userLevel)
        }));
    },

    /**
     * Проверка доступности приложения
     */
    isAppAvailable: function(app, userLevel) {
        if (app.empty) return false;
        
        if (app.access === 'user') {
            return ['user', 'family', 'admin'].includes(userLevel);
        }
        if (app.access === 'family') {
            return ['family', 'admin'].includes(userLevel);
        }
        if (app.access === 'admin') {
            return userLevel === 'admin';
        }
        return false;
    },

    /**
     * Рендер сетки
     */
    renderGrid: function() {
        const apps = this.getGridApps();
        let html = '<div class="apps-grid">';

        for (let i = 0; i < this.gridSize.total; i++) {
            const app = apps[i];
            if (!app) {
                html += '<div class="app-card empty"></div>';
                continue;
            }

            const available = this.isAppAvailable(app, MORI_USER.current?.accessLevel);
            const isNew = app.new && available;
            
            html += `
                <div class="app-card ${!available ? 'locked' : ''} ${app.empty ? 'empty' : ''} ${isNew ? 'new' : ''}"
                     data-app-id="${app.id}"
                     data-app-route="${app.route || ''}"
                     data-position="${i}">
                    
                    <div class="app-icon">${app.icon}</div>
                    <div class="app-name">${app.name}</div>
                    ${app.description ? `<div class="app-description">${app.description}</div>` : ''}
                    
                    ${app.empty ? '<div class="coming-soon">скоро</div>' : ''}
                </div>
            `;
        }

        html += '</div>';
        return html;
    },

    /**
     * Получить пустые ячейки
     */
    getEmptyCells: function() {
        return this.order
            .map((appId, index) => ({ appId, index }))
            .filter(item => {
                const app = MORI_ALL_APPS.appList.find(a => a.id === item.appId);
                return app && app.empty;
            });
    },

    /**
     * Получить занятые ячейки
     */
    getFilledCells: function() {
        return this.order
            .map((appId, index) => ({ appId, index }))
            .filter(item => {
                const app = MORI_ALL_APPS.appList.find(a => a.id === item.appId);
                return app && !app.empty;
            });
    },

    /**
     * Проверить, все ли ячейки заполнены
     */
    isFull: function() {
        return this.getEmptyCells().length === 0;
    },

    /**
     * Получить статистику сетки
     */
    getStats: function() {
        const apps = this.getGridApps();
        const available = apps.filter(a => 
            this.isAppAvailable(a, MORI_USER.current?.accessLevel)
        ).length;
        
        const locked = apps.filter(a => 
            !this.isAppAvailable(a, MORI_USER.current?.accessLevel) && !a.empty
        ).length;

        const empty = apps.filter(a => a.empty).length;

        return {
            total: this.gridSize.total,
            available,
            locked,
            empty,
            filled: this.gridSize.total - empty
        };
    },

    /**
     * Сброс к порядку по умолчанию
     */
    resetToDefault: function() {
        this.order = [
            'portfolio', 'calculator', 'library', 'ai-chat',
            'profile', 'tasks', 'chat', 'house',
            'family', 'calendar', 'budget', 'reminders',
            'durak', 'demigurge', 'empty1', 'empty2'
        ];
        this.saveOrder();
    },

    /**
     * Экспорт конфигурации сетки
     */
    exportConfig: function() {
        const config = {
            version: '1.0',
            exportDate: Date.now(),
            gridSize: this.gridSize,
            order: this.order,
            display: this.display
        };

        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `apps_grid_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    },

    /**
     * Импорт конфигурации сетки
     */
    importConfig: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (data.order && Array.isArray(data.order) && data.order.length === this.gridSize.total) {
                        this.order = data.order;
                        this.saveOrder();
                        resolve(true);
                    } else {
                        reject(new Error('Неверный формат файла'));
                    }
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }
};

// Экспорт
window.MORI_ALL_APPS_GRID = MORI_ALL_APPS_GRID;
