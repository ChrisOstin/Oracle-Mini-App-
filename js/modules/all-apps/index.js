/**
 * ALL APPS MODULE
 * Меню всех приложений (сетка 4×4)
 * Версия: 1.0.0
 */

const MORI_ALL_APPS = {
    // Состояние
    state: {
        apps: [],
        categories: ['all', 'main', 'family', 'admin'],
        activeCategory: 'all',
        searchQuery: '',
        editMode: false,
        favorites: []
    },

    // Список всех приложений
    appList: [
        // Ряд 1 (основные)
        { id: 'portfolio', icon: '📊', name: 'Портфель', description: 'Графики и цена MORI', category: 'main', access: 'user', route: 'portfolio', new: false },
        { id: 'calculator', icon: '💰', name: 'Калькулятор', description: 'Конвертер валют', category: 'main', access: 'user', route: 'calculator', new: false },
        { id: 'library', icon: '📚', name: 'Библиотека', description: 'Книги и читалка', category: 'main', access: 'user', route: 'library', new: false },
        { id: 'ai-chat', icon: '🧠', name: 'MORI AI', description: 'Чат с нейросетью', category: 'main', access: 'user', route: 'ai-chat', new: false },

        // Ряд 2 (основные)
        { id: 'profile', icon: '👤', name: 'Профиль', description: 'Твои данные', category: 'main', access: 'user', route: 'profile', new: false },
        { id: 'tasks', icon: '🎮', name: 'Задания', description: 'Квесты и дейлики', category: 'main', access: 'user', route: 'tasks', new: false },
        { id: 'chat', icon: '💬', name: 'Чат', description: 'Общение с семьёй', category: 'main', access: 'user', route: 'chat', new: false },
        { id: 'house', icon: '🏠', name: 'Дом', description: 'Интерактивный дом', category: 'family', access: 'family', route: 'house', new: false },

        // Ряд 3 (семейные)
        { id: 'family', icon: '👨‍👩‍👧‍👦', name: 'Семья', description: 'Участники и бюджет', category: 'family', access: 'family', route: 'family', new: false },
        { id: 'calendar', icon: '📅', name: 'Календарь', description: 'События и ДР', category: 'family', access: 'family', route: 'family-calendar', new: false },
        { id: 'budget', icon: '💰', name: 'Бюджет', description: 'Доходы и расходы', category: 'family', access: 'family', route: 'family-budget', new: false },
        { id: 'reminders', icon: '⏰', name: 'Напоминания', description: 'Важные даты', category: 'family', access: 'family', route: 'family-reminders', new: false },

        // Ряд 4 (игры + админка + пустые)
        { id: 'durak', icon: '🃏', name: 'Дурак', description: 'Карточная игра', category: 'family', access: 'family', route: 'family-durak', new: true },
        { id: 'demigurge', icon: '👑', name: 'Демиург', description: 'Панель администратора', category: 'admin', access: 'admin', route: 'demigurge', new: false },
        { id: 'empty1', icon: '⬜', name: '', description: '', category: 'empty', access: 'none', route: null, new: false, empty: true },
        { id: 'empty2', icon: '⬜', name: '', description: '', category: 'empty', access: 'none', route: null, new: false, empty: true }
    ],

    /**
     * Инициализация
     */
    init: function() {
        console.log('MORI_ALL_APPS инициализация...');
        this.loadFavorites();
        this.filterApps();
    },

    /**
     * Рендер
     */
    render: function() {
        const content = document.getElementById('all-apps-content');
        if (!content) return;

        content.innerHTML = this.getHTML();
        this.attachEvents();
    },

    /**
     * HTML
     */
    getHTML: function() {
        return `
            <div class="all-apps-screen">
                <!-- Шапка -->
                <div class="all-apps-header">
                    <h2>🎛️ Все приложения</h2>
                    <div class="all-apps-search">
                        <input type="text" 
                               id="apps-search" 
                               placeholder="🔍 Поиск..."
                               value="${this.state.searchQuery}">
                    </div>
                </div>

                <!-- Категории -->
                <div class="apps-categories">
                    <button class="category-btn ${this.state.activeCategory === 'all' ? 'active' : ''}" 
                            data-category="all">
                        🏠 Все
                    </button>
                    <button class="category-btn ${this.state.activeCategory === 'main' ? 'active' : ''}" 
                            data-category="main">
                        ⭐ Основные
                    </button>
                    <button class="category-btn ${this.state.activeCategory === 'family' ? 'active' : ''}" 
                            data-category="family">
                        👨‍👩‍👧‍👦 Семья
                    </button>
                    <button class="category-btn ${this.state.activeCategory === 'admin' ? 'active' : ''}" 
                            data-category="admin">
                        👑 Админка
                    </button>
                </div>

                <!-- Сетка приложений -->
                <div class="apps-grid ${this.state.editMode ? 'editable' : ''}" id="apps-grid">
                    ${this.renderApps()}
                </div>

                <!-- Кнопка редактирования (только для админа) -->
                ${MORI_AUTH.isAdmin() ? `
                    <button class="edit-apps-btn ${this.state.editMode ? 'active' : ''}" 
                            id="edit-apps-btn">
                        ${this.state.editMode ? '✓' : '✎'}
                    </button>
                ` : ''}
            </div>
        `;
    },

    /**
     * Рендер приложений
     */
    renderApps: function() {
        const filteredApps = this.filterApps();
        
        if (filteredApps.length === 0) {
            return `
                <div class="empty-apps">
                    <div class="empty-icon">🔍</div>
                    <h3>Ничего не найдено</h3>
                    <p>Попробуйте другой запрос</p>
                </div>
            `;
        }

        return filteredApps.map(app => this.renderAppCard(app)).join('');
    },

    /**
     * Рендер карточки приложения
     */
    renderAppCard: function(app) {
        const isLocked = !this.canAccess(app);
        const isFavorite = this.state.favorites.includes(app.id);
        const isNew = app.new && !isLocked;
        
        return `
            <div class="app-card ${isLocked ? 'locked' : ''} ${app.empty ? 'empty' : ''} ${isNew ? 'new' : ''}"
                 data-app-id="${app.id}"
                 data-app-route="${app.route || ''}"
                 draggable="${this.state.editMode ? 'true' : 'false'}">
                
                ${!app.empty && !isLocked ? `
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                            data-app-id="${app.id}">
                        ${isFavorite ? '★' : '☆'}
                    </button>
                ` : ''}
                
                <div class="app-icon">${app.icon}</div>
                <div class="app-name">${app.name}</div>
                ${app.description ? `<div class="app-description">${app.description}</div>` : ''}
                
                ${app.empty ? '<div class="coming-soon">скоро</div>' : ''}
            </div>
        `;
    },

    /**
     * Проверка доступа к приложению
     */
    canAccess: function(app) {
        if (app.empty) return false;
        if (app.access === 'none') return false;
        
        const userLevel = MORI_USER.current?.accessLevel || 'guest';
        
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
     * Фильтрация приложений
     */
    filterApps: function() {
        let filtered = [...this.appList];

        // Фильтр по категории
        if (this.state.activeCategory !== 'all') {
            filtered = filtered.filter(app => app.category === this.state.activeCategory);
        }

        // Поиск по названию и описанию
        if (this.state.searchQuery) {
            const query = this.state.searchQuery.toLowerCase();
            filtered = filtered.filter(app => 
                app.name.toLowerCase().includes(query) ||
                app.description.toLowerCase().includes(query)
            );
        }

        // Убираем пустые ячейки, если не админ
        if (!MORI_AUTH.isAdmin()) {
            filtered = filtered.filter(app => !app.empty);
        }

        return filtered;
    },

    /**
     * Загрузка избранного
     */
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

    /**
     * Сохранение избранного
     */
    saveFavorites: function() {
        localStorage.setItem('apps_favorites', JSON.stringify(this.state.favorites));
    },

    /**
     * Тоггл избранного
     */
    toggleFavorite: function(appId) {
        const index = this.state.favorites.indexOf(appId);
        if (index === -1) {
            this.state.favorites.push(appId);
        } else {
            this.state.favorites.splice(index, 1);
        }
        this.saveFavorites();
        this.render();
    },

    /**
     * Открыть приложение
     */
    openApp: function(route) {
        if (route) {
            MORI_ROUTER.navigate(route);
        }
    },

    /**
     * Обработчики
     */
    attachEvents: function() {
        // Поиск
        const searchInput = document.getElementById('apps-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.state.searchQuery = e.target.value;
                this.render();
            });
        }

        // Категории
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.state.activeCategory = category;
                this.render();
            });
        });

        // Клик по приложению
        document.querySelectorAll('.app-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Не открываем при клике на кнопку избранного
                if (e.target.classList.contains('favorite-btn')) return;
                
                const route = card.dataset.appRoute;
                const isLocked = card.classList.contains('locked');
                
                if (!isLocked && route) {
                    this.openApp(route);
                } else if (isLocked) {
                    MORI_APP.showToast('Приложение заблокировано', 'error');
                }
            });
        });

        // Избранное
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const appId = e.target.dataset.appId;
                this.toggleFavorite(appId);
            });
        });

        // Режим редактирования (для админа)
        const editBtn = document.getElementById('edit-apps-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.state.editMode = !this.state.editMode;
                this.render();
            });
        }

        // Drag and drop (для админа в режиме редактирования)
        if (this.state.editMode) {
            this.setupDragAndDrop();
        }
    },

    /**
     * Настройка drag-and-drop
     */
    setupDragAndDrop: function() {
        const grid = document.getElementById('apps-grid');
        let draggedItem = null;

        document.querySelectorAll('.app-card').forEach(card => {
            card.addEventListener('dragstart', (e) => {
                draggedItem = card;
                card.classList.add('dragging');
                e.dataTransfer.setData('text/plain', card.dataset.appId);
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                document.querySelectorAll('.app-card').forEach(c => {
                    c.classList.remove('drag-over');
                });
            });

            card.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (card !== draggedItem) {
                    card.classList.add('drag-over');
                }
            });

            card.addEventListener('dragleave', () => {
                card.classList.remove('drag-over');
            });

            card.addEventListener('drop', (e) => {
                e.preventDefault();
                card.classList.remove('drag-over');

                if (card === draggedItem) return;

                const fromId = draggedItem.dataset.appId;
                const toId = card.dataset.appId;

                // Меняем местами в массиве
                const fromIndex = this.appList.findIndex(a => a.id === fromId);
                const toIndex = this.appList.findIndex(a => a.id === toId);

                if (fromIndex !== -1 && toIndex !== -1) {
                    [this.appList[fromIndex], this.appList[toIndex]] = 
                    [this.appList[toIndex], this.appList[fromIndex]];
                    
                    // Сохраняем новый порядок
                    localStorage.setItem('apps_order', JSON.stringify(
                        this.appList.map(a => a.id)
                    ));
                    
                    this.render();
                }
            });
        });
    }
};

// Экспорт
window.MORI_ALL_APPS = MORI_ALL_APPS;
