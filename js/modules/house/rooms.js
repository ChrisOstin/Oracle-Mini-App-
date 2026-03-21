/**
 * HOUSE ROOMS
 * Управление комнатами и предметами в доме
 * Версия: 1.0.0
 */

const MORI_HOUSE_ROOMS = {
    // Все комнаты
    rooms: {
        living: {
            id: 'living',
            name: 'Гостиная',
            icon: '🏠',
            description: 'Основная комната, где собирается семья',
            background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%)',
            items: ['painting', 'fireplace', 'sofa', 'bookshelf', 'tv', 'radio', 'cat'],
            locked: false,
            requiredLevel: 1
        },
        kitchen: {
            id: 'kitchen',
            name: 'Кухня',
            icon: '🍽️',
            description: 'Здесь готовят еду и пьют чай',
            background: 'linear-gradient(135deg, #2a1f0a 0%, #3d2e12 100%)',
            items: ['tea', 'flowers', 'fridge'],
            locked: false,
            requiredLevel: 5
        },
        bedroom: {
            id: 'bedroom',
            name: 'Спальня',
            icon: '🛏️',
            description: 'Место для отдыха и снов',
            background: 'linear-gradient(135deg, #1a1a2a 0%, #2a2a3a 100%)',
            items: ['bed', 'stars', 'wardrobe'],
            locked: false,
            requiredLevel: 10
        },
        office: {
            id: 'office',
            name: 'Кабинет',
            icon: '📚',
            description: 'Рабочее пространство',
            background: 'linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 100%)',
            items: ['desk', 'computer', 'books'],
            locked: true,
            requiredLevel: 15
        },
        bathroom: {
            id: 'bathroom',
            name: 'Ванная',
            icon: '🛁',
            description: 'Скоро откроется',
            items: [],
            locked: true,
            requiredLevel: 20,
            hidden: true
        },
        garage: {
            id: 'garage',
            name: 'Гараж',
            icon: '🚗',
            description: 'Скоро откроется',
            items: [],
            locked: true,
            requiredLevel: 25,
            hidden: true
        }
    },

    // Предметы в комнатах
    items: {
        // Гостиная
        painting: {
            id: 'painting',
            name: 'Картина',
            icon: '🖼️',
            description: 'Семейное фото над камином',
            room: 'living',
            interactive: true,
            actions: ['view', 'change']
        },
        fireplace: {
            id: 'fireplace',
            name: 'Камин',
            icon: '🔥',
            description: 'Согревает дом',
            room: 'living',
            interactive: true,
            actions: ['toggle', 'addWood']
        },
        sofa: {
            id: 'sofa',
            name: 'Диван',
            icon: '🛋️',
            description: 'Место для отдыха',
            room: 'living',
            interactive: true,
            actions: ['sit']
        },
        bookshelf: {
            id: 'bookshelf',
            name: 'Книжный шкаф',
            icon: '📚',
            description: 'Доступ к библиотеке',
            room: 'living',
            interactive: true,
            actions: ['open']
        },
        tv: {
            id: 'tv',
            name: 'Телевизор',
            icon: '📺',
            description: 'Смотреть YouTube',
            room: 'living',
            interactive: true,
            actions: ['toggle', 'search']
        },
        radio: {
            id: 'radio',
            name: 'Радио',
            icon: '📻',
            description: 'Слушать музыку',
            room: 'living',
            interactive: true,
            actions: ['toggle', 'playlist']
        },
        cat: {
            id: 'cat',
            name: 'Кот',
            icon: '🐱',
            description: 'Домашний питомец',
            room: 'living',
            interactive: true,
            actions: ['pet', 'feed', 'play']
        },

        // Кухня
        tea: {
            id: 'tea',
            name: 'Чай',
            icon: '🫖',
            description: 'Заварить чай',
            room: 'kitchen',
            interactive: true,
            actions: ['boil', 'pour', 'drink']
        },
        flowers: {
            id: 'flowers',
            name: 'Цветы',
            icon: '🌸',
            description: 'Нужно поливать',
            room: 'kitchen',
            interactive: true,
            actions: ['water']
        },
        fridge: {
            id: 'fridge',
            name: 'Холодильник',
            icon: '🧊',
            description: 'Еда для кота',
            room: 'kitchen',
            interactive: true,
            actions: ['open', 'feed']
        },

        // Спальня
        bed: {
            id: 'bed',
            name: 'Кровать',
            icon: '🛏️',
            description: 'Лечь спать',
            room: 'bedroom',
            interactive: true,
            actions: ['sleep']
        },
        stars: {
            id: 'stars',
            name: 'Звёздное небо',
            icon: '⭐',
            description: 'Проектор на потолке',
            room: 'bedroom',
            interactive: true,
            actions: ['toggle']
        },
        wardrobe: {
            id: 'wardrobe',
            name: 'Шкаф',
            icon: '🚪',
            description: 'Скоро...',
            room: 'bedroom',
            interactive: false,
            locked: true
        },

        // Кабинет
        desk: {
            id: 'desk',
            name: 'Письменный стол',
            icon: '📝',
            description: 'Скоро...',
            room: 'office',
            interactive: false,
            locked: true
        },
        computer: {
            id: 'computer',
            name: 'Компьютер',
            icon: '💻',
            description: 'Скоро...',
            room: 'office',
            interactive: false,
            locked: true
        },
        books: {
            id: 'books',
            name: 'Книги',
            icon: '📖',
            description: 'Скоро...',
            room: 'office',
            interactive: false,
            locked: true
        }
    },

    // Состояние предметов
    itemState: {},

    /**
     * Получение всех комнат
     */
    getAllRooms: function() {
        return Object.values(this.rooms).filter(room => !room.hidden);
    },

    /**
     * Получение доступных комнат
     */
    getAvailableRooms: function() {
        const userLevel = MORI_USER.current?.level || 1;
        return Object.values(this.rooms).filter(room => 
            !room.hidden && room.requiredLevel <= userLevel
        );
    },

    /**
     * Получение комнаты по ID
     */
    getRoom: function(roomId) {
        return this.rooms[roomId];
    },

    /**
     * Получение предметов в комнате
     */
    getItemsInRoom: function(roomId) {
        const room = this.rooms[roomId];
        if (!room) return [];

        return room.items
            .map(itemId => this.items[itemId])
            .filter(item => item && !item.locked);
    },

    /**
     * Получение предмета по ID
     */
    getItem: function(itemId) {
        return this.items[itemId];
    },

    /**
     * Проверка, разблокирована ли комната
     */
    isRoomUnlocked: function(roomId) {
        const room = this.rooms[roomId];
        if (!room) return false;
        
        const userLevel = MORI_USER.current?.level || 1;
        return userLevel >= room.requiredLevel;
    },

    /**
     * Получение следующей комнаты для разблокировки
     */
    getNextRoom: function() {
        const userLevel = MORI_USER.current?.level || 1;
        
        return Object.values(this.rooms)
            .filter(room => !room.hidden && room.requiredLevel > userLevel)
            .sort((a, b) => a.requiredLevel - b.requiredLevel)[0];
    },

    /**
     * Взаимодействие с предметом
     */
    interact: function(itemId, action, data = {}) {
        const item = this.items[itemId];
        if (!item) return false;

        // Сохраняем действие в историю
        this.logAction(itemId, action, data);

        return true;
    },

    /**
     * Обновление состояния предмета
     */
    setItemState: function(itemId, state) {
        if (!this.itemState[itemId]) {
            this.itemState[itemId] = {};
        }
        this.itemState[itemId] = { ...this.itemState[itemId], ...state };
        this.saveState();
    },

    /**
     * Получение состояния предмета
     */
    getItemState: function(itemId) {
        return this.itemState[itemId] || {};
    },

    /**
     * Сохранение состояния
     */
    saveState: function() {
        try {
            localStorage.setItem('house_items_state', JSON.stringify(this.itemState));
        } catch (error) {
            console.error('Error saving house items state:', error);
        }
    },

    /**
     * Загрузка состояния
     */
    loadState: function() {
        try {
            const saved = localStorage.getItem('house_items_state');
            if (saved) {
                this.itemState = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading house items state:', error);
        }
    },

    /**
     * Логирование действий
     */
    logAction: function(itemId, action, data) {
        const log = {
            itemId,
            action,
            data,
            timestamp: Date.now(),
            userId: MORI_USER.current?.id
        };

        console.log('House action:', log);
        
        // TODO: отправлять на сервер для статистики
    },

    /**
     * Сброс состояния комнат (для админа)
     */
    resetRooms: function() {
        if (!MORI_AUTH.isAdmin()) return false;

        this.itemState = {};
        this.saveState();
        return true;
    }
};

// Загрузка состояния при старте
MORI_HOUSE_ROOMS.loadState();

// Экспорт
window.MORI_HOUSE_ROOMS = MORI_HOUSE_ROOMS;
