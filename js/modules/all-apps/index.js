/**
 * ALL APPS MODULE
 * Сетка приложений 4x4 (Android-телефон + Мориарти)
 * Версия: 2.0.0
 */

const MORI_ALL_APPS = {
    // Состояние
    state: {
        editMode: false,
        favorites: [],
        apps: [],
        isLoading: true
    },

    // Список всех приложений
    appList: [
        // Ряд 1
        { id: 'portfolio', icon: '📊', name: 'Портфель', description: 'График и цена', category: 'main', access: 'user', route: 'portfolio', new: false },
        { id: 'calculator', icon: '💰', name: 'Калькулятор', description: 'Конвертер валют', category: 'main', access: 'user', route: 'calculator', new: false },
        { id: 'library', icon: '📚', name: 'Библиотека', description: 'Книги и читалка', category: 'main', access: 'user', route: 'library', new: false },
        { id: 'ai-chat', icon: '🧠', name: 'MORI AI', description: 'Чат с нейросетью', category: 'main', access: 'user', route: 'ai-chat', new: false },
        
        // Ряд 2
        { id: 'profile', icon: '👤', name: 'Профиль', description: 'Твои данные', category: 'main', access: 'user', route: 'profile', new: false },
        { id: 'tasks', icon: '✅', name: 'Задания', description: 'Квесты и дейлики', category: 'main', access: 'user', route: 'tasks', new: false },
        { id: 'chat', icon: '💬', name: 'MORIGRAM', description: 'Общение', category: 'main', access: 'user', route: 'chat', new: false },
        { id: 'house', icon: '🏠', name: 'Дом', description: 'Интерактивный дом', category: 'family', access: 'family', route: 'house', new: false },
        
        // Ряд 3
        { id: 'family', icon: '👨‍👩‍👧‍👦', name: 'Семья', description: 'Участники и бюджет', category: 'family', access: 'family', route: 'family', new: false },
        { id: 'calendar', icon: '📅', name: 'Календарь', description: 'События и ДР', category: 'family', access: 'family', route: 'family-calendar', new: false },
        { id: 'budget', icon: '💰', name: 'Бюджет', description: 'Доходы и расходы', category: 'family', access: 'family', route: 'family-budget', new: false },
        { id: 'reminders', icon: '⏰', name: 'Напоминания', description: 'Важные даты', category: 'family', access: 'family', route: 'family-reminders', new: false },
        
        // Ряд 4
        { id: 'durak', icon: '🃏', name: 'Дурак', description: 'Карточная игра', category: 'family', access: 'family', route: 'family-durak', new: true },
        { id: 'demigurge', icon: '👑', name: 'Демиург', description: 'Панель администратора', category: 'admin', access: 'admin', route: 'demigurge', new: false },
        { id: 'empty1', icon: '⬜', name: '', description: '', category: 'empty', access: 'none', route: null, new: false, empty: true },
        { id: 'empty2', icon: '⬜', name: '', description: '', category: 'empty', access: 'none', route: null, new: false, empty: true }
    ],

    // Инициализация
    init: function() {
        console.log('📱 MORI_ALL_APPS инициализация...');
        this.loadFavorites();
        this.simulateLoading();
    
// Скрываем панель навигации
const nav = document.getElementById('dynamic-bottom-nav');
if (nav) {
    nav.style.display = 'none';
}

// Скрываем плавающие кнопки
const leftBtn = document.getElementById('new-floating-left');
const rightBtn = document.getElementById('new-floating-right');
if (leftBtn) leftBtn.style.display = 'none';
if (rightBtn) rightBtn.style.display = 'none';

    },

    // Загрузка с скелетоном
    simulateLoading: function() {
        this.state.isLoading = true;
        this.render();
        
        setTimeout(() => {
            this.state.isLoading = false;
            this.render();
        }, 500);
    },

    // Рендер
    render: function() {
        const content = document.getElementById('all-apps-content');
        if (!content) return;
        
        content.innerHTML = this.getHTML();
        this.attachEvents();
        this.updateBatteryLevel();
    },

    // HTML
    getHTML: function() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        
        return `
            <div class="all-apps-screen">
                <!-- Статус-бар телефона -->
<div class="phone-status-bar">
    <span>${timeStr}</span>
    ${this.isMobile() ? '<span id="status-icons"><span id="network-type">' + this.getNetworkType() + '</span> 🔋 <span id="battery-level">--</span>%</span>' : ''}
</div>
                
                <!-- Шапка -->
                <div class="all-apps-header">
                    <h2>📱 Все приложения</h2>
                </div>
                
                <!-- Сетка приложений -->
                <div class="apps-grid" id="apps-grid">
                    ${this.state.isLoading ? this.renderSkeleton() : this.renderApps()}
                </div>
                
                <!-- Кнопка редактирования (только для админа) -->
                ${this.isAdmin() ? `
                    <button class="edit-apps-btn ${this.state.editMode ? 'active' : ''}" id="edit-apps-btn">
                        ${this.state.editMode ? '✓' : '✎'}
                    </button>
                ` : ''}
<!-- Кнопка выхода -->
<button class="exit-apps-btn" id="exit-apps-btn">Выход</button>
           </div>
        `;
    },

// Проверка, мобильное ли устройство
isMobile: function() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
},

// Иконка батареи в зависимости от заряда
getBatteryIcon: function(level) {
    if (level >= 90) return '🔋';
    if (level >= 70) return '🔋';
    if (level >= 50) return '🔋';
    if (level >= 30) return '🔋';
    if (level >= 15) return '🔋';
    return '🪫';  // разряжена
},

// Определение типа сети
getNetworkType: function() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!connection) return '📶';
    
    const type = connection.effectiveType; // '4g', '3g', '2g', 'slow-2g'
    const types = {
        '4g': '📶 4G',
        '3g': '📶 3G',
        '2g': '📶 2G',
        'slow-2g': '📶 🐌'
    };
    return types[type] || '📶';
},

// Обновление уровня батареи
updateBatteryLevel: function() {
    if (!this.isMobile()) return;
    
    // Обновляем тип сети
    const networkSpan = document.getElementById('network-type');
    if (networkSpan) {
        networkSpan.innerHTML = this.getNetworkType();
    }
    
    if (navigator.getBattery) {
        navigator.getBattery().then((battery) => {
            const level = Math.floor(battery.level * 100);
            const batteryLevelSpan = document.getElementById('battery-level');
            const batteryIconSpan = document.getElementById('battery-icon');
            
            if (batteryLevelSpan) {
                batteryLevelSpan.textContent = level;
            }
            if (batteryIconSpan) {
                batteryIconSpan.textContent = this.getBatteryIcon(level);
            }
        }).catch(() => {
            const batteryLevelSpan = document.getElementById('battery-level');
            if (batteryLevelSpan) batteryLevelSpan.textContent = '85';
        });
    } else {
        const batteryLevelSpan = document.getElementById('battery-level');
        if (batteryLevelSpan) batteryLevelSpan.textContent = '85';
    }
},

    // Скелетон
    renderSkeleton: function() {
        let html = '';
        for (let i = 0; i < 16; i++) {
            html += '<div class="skeleton-card"></div>';
        }
        return html;
    },

    // Рендер приложений
    renderApps: function() {
        const filteredApps = this.filterApps();
        
        if (filteredApps.length === 0) {
            return `
                <div class="empty-apps">
                    <div class="empty-icon">📭</div>
                    <h3>Нет приложений</h3>
                    <p>Доступные приложения появятся здесь</p>
                </div>
            `;
        }
        
        // Заполняем до 16 ячеек (4x4)
        const fullGrid = [...filteredApps];
        const emptyCount = 16 - fullGrid.length;
        for (let i = 0; i < emptyCount; i++) {
            fullGrid.push({ empty: true, icon: '⬜', name: '', description: '' });
        }
        
        return fullGrid.map(app => this.renderAppCard(app)).join('');
    },

    // Карточка приложения
    renderAppCard: function(app) {
        if (app.empty) {
            return `
                <div class="app-card empty">
                    <div class="app-icon">${app.icon}</div>
                    <div class="app-name"></div>
                    <div class="coming-soon">Скоро</div>
                </div>
            `;
        }
        
        const isLocked = !this.canAccess(app);
        const isFavorite = this.state.favorites.includes(app.id);
        const isNew = app.new && !isLocked;
        const hasNotifications = app.id === 'chat' && this.getChatNotifications() > 0;
        
        return `
            <div class="app-card ${isLocked ? 'locked' : ''} ${isNew ? 'new' : ''}" 
                 data-app-id="${app.id}"
                 data-app-route="${app.route || ''}"
                 draggable="${this.state.editMode ? 'true' : 'false'}">
                
                ${!app.empty && !isLocked ? `
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-app-id="${app.id}">
                        ${isFavorite ? '★' : '☆'}
                    </button>
                ` : ''}
                
                ${hasNotifications ? `
                    <div class="notification-badge" id="chat-notification-badge">${this.getChatNotifications()}</div>
                ` : ''}
                
                <div class="app-icon">${app.icon}</div>
                <div class="app-name">${app.name}</div>
                ${app.description ? `<div class="app-description">${app.description}</div>` : ''}
            </div>
        `;
    },

    // Фильтрация приложений (только по правам доступа)
    filterApps: function() {
        let filtered = [...this.appList];
        
        // Убираем пустые ячейки для не-админов
        if (!this.isAdmin()) {
            filtered = filtered.filter(app => !app.empty);
        }
        
        // Фильтр по правам доступа
        filtered = filtered.filter(app => this.canAccess(app));
        
        return filtered;
    },

    // Проверка прав доступа
    canAccess: function(app) {
        if (app.empty) return false;
        if (app.access === 'none') return false;
        
        const userLevel = this.getUserLevel();
        
        if (app.access === 'user') {
            return userLevel === 'user' || userLevel === 'family' || userLevel === 'admin';
        }
        if (app.access === 'family') {
            return userLevel === 'family' || userLevel === 'admin';
        }
        if (app.access === 'admin') {
            return userLevel === 'admin';
        }
        return false;
    },

    // Уровень пользователя
    getUserLevel: function() {
        if (window.MORI_APP && MORI_APP.accessLevel) {
            return MORI_APP.accessLevel;
        }
        if (window.MORI_USER && MORI_USER.current && MORI_USER.current.access_level) {
            return MORI_USER.current.access_level;
        }
        return 'guest';
    },

    // Админ ли пользователь
    isAdmin: function() {
        return this.getUserLevel() === 'admin';
    },

    // Количество уведомлений в чате (заглушка)
    getChatNotifications: function() {
        // TODO: связать с реальными непрочитанными сообщениями
        return 3; // временно 3
    },

    // Загрузка избранного
    loadFavorites: function() {
        try {
            const saved = localStorage.getItem('apps_favorites');
            if (saved) {
                this.state.favorites = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading favorites:', error);
        }
    },

    // Сохранение избранного
    saveFavorites: function() {
        localStorage.setItem('apps_favorites', JSON.stringify(this.state.favorites));
    },

    // Тоггл избранного
    toggleFavorite: function(appId) {
        const index = this.state.favorites.indexOf(appId);
        if (index === -1) {
            this.state.favorites.push(appId);
            this.showGoldSpark();
        } else {
            this.state.favorites.splice(index, 1);
        }
        this.saveFavorites();
        this.render();
    },

    // Эффект золотых искр при добавлении в избранное
    showGoldSpark: function() {
        const spark = document.createElement('div');
        spark.className = 'gold-spark';
        spark.innerHTML = '✨';
        spark.style.position = 'fixed';
        spark.style.top = '50%';
        spark.style.left = '50%';
        spark.style.transform = 'translate(-50%, -50%)';
        spark.style.fontSize = '48px';
        spark.style.pointerEvents = 'none';
        spark.style.zIndex = '10000';
        spark.style.animation = 'sparkFade 0.5s ease-out forwards';
        document.body.appendChild(spark);
        
        setTimeout(() => spark.remove(), 500);
    },

    // Открыть приложение
openApp: function(route) {
    if (route && window.MORI_ROUTER) {
        // Скрываем панель навигации
        const nav = document.getElementById('dynamic-bottom-nav');
        if (nav) {
            nav.style.display = 'none';
        }

// Скрываем плавающие кнопки тоже
const leftBtn = document.getElementById('new-floating-left');
const rightBtn = document.getElementById('new-floating-right');
if (leftBtn) leftBtn.style.display = 'none';
if (rightBtn) rightBtn.style.display = 'none';
        
        // Анимация нажатия
        const card = document.querySelector(`.app-card[data-app-route="${route}"]`);
        if (card) {
            card.style.transform = 'scale(0.95)';
            setTimeout(() => {
                card.style.transform = '';
            }, 150);
        }
        
        MORI_ROUTER.navigate(route);
    }
},

// Восстановить панель навигации
restoreNav: function() {
    const nav = document.getElementById('dynamic-bottom-nav');
    if (nav) {
        nav.style.display = 'flex';
    }
},

    // Обработчики
    attachEvents: function() {
       
// Кнопка выхода
const exitBtn = document.getElementById('exit-apps-btn');
if (exitBtn) {
    exitBtn.addEventListener('click', () => {
        // Показываем панель навигации и плавающие кнопки
        const nav = document.getElementById('dynamic-bottom-nav');
        const leftBtn = document.getElementById('new-floating-left');
        const rightBtn = document.getElementById('new-floating-right');
        
        if (nav) nav.style.setProperty('display', 'flex', 'important');
        if (leftBtn) leftBtn.style.setProperty('display', 'block', 'important');
        if (rightBtn) rightBtn.style.setProperty('display', 'block', 'important');
        
        setTimeout(() => {
            if (window.MORI_ROUTER) {
                MORI_ROUTER.navigate('portfolio');
            }
        }, 50);
    });
}
        // Клик по карточке
        document.querySelectorAll('.app-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('favorite-btn')) return;
                
                const route = card.dataset.appRoute;
                const isLocked = card.classList.contains('locked');
                
                if (!isLocked && route) {
                    this.openApp(route);
                } else if (isLocked) {
                    MORI_APP.showToast('🔒 Приложение заблокировано', 'error');
                }
            });
        });
        
        // Избранное
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const appId = btn.dataset.appId;
                this.toggleFavorite(appId);
            });
        });
        
        // Режим редактирования (админ)
        const editBtn = document.getElementById('edit-apps-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.state.editMode = !this.state.editMode;
                this.render();
            });
        }
        
        // Drag-and-drop для админа
        if (this.state.editMode && this.isAdmin()) {
            this.setupDragAndDrop();
        }
    },

    // Настройка drag-and-drop
    setupDragAndDrop: function() {
        const grid = document.getElementById('apps-grid');
        let draggedItem = null;
        
        document.querySelectorAll('.app-card').forEach(card => {
            card.setAttribute('draggable', 'true');
            
            card.addEventListener('dragstart', (e) => {
                draggedItem = card;
                card.classList.add('dragging');
                e.dataTransfer.setData('text/plain', card.dataset.appId);
                e.dataTransfer.effectAllowed = 'move';
            });
            
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                document.querySelectorAll('.app-card').forEach(c => {
                    c.classList.remove('drag-over');
                });
                draggedItem = null;
            });
            
            card.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (card !== draggedItem && !card.classList.contains('empty')) {
                    card.classList.add('drag-over');
                    e.dataTransfer.dropEffect = 'move';
                }
            });
            
            card.addEventListener('dragleave', () => {
                card.classList.remove('drag-over');
            });
            
            card.addEventListener('drop', (e) => {
                e.preventDefault();
                card.classList.remove('drag-over');
                if (card === draggedItem) return;
                
                // Меняем местами в массиве
                const fromId = draggedItem.dataset.appId;
                const toId = card.dataset.appId;
                
                const fromIndex = this.appList.findIndex(a => a.id === fromId);
                const toIndex = this.appList.findIndex(a => a.id === toId);
                
                if (fromIndex !== -1 && toIndex !== -1) {
                    [this.appList[fromIndex], this.appList[toIndex]] = 
                    [this.appList[toIndex], this.appList[fromIndex]];
                    
                    // Сохраняем порядок
                    localStorage.setItem('apps_order', JSON.stringify(
                        this.appList.filter(a => !a.empty).map(a => a.id)
                    ));
                    
                    this.render();
                }
            });
        });
    }
};

// Экспорт
window.MORI_ALL_APPS = MORI_ALL_APPS;
