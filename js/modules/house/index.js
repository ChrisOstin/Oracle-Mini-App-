/**
 * HOUSE MODULE
 * Интерактивный дом с комнатами и предметами
 * Версия: 1.0.0
 */

const MORI_HOUSE = {
    // Состояние
    state: {
        currentRoom: 'living',
        paintingImage: null,
        paintingCaption: 'MORI FAMILY',
        fireplaceOn: true,
        tvOn: false,
        radioOn: false,
        teaState: 'idle', // 'idle', 'boiling', 'ready', 'poured'
        teaCups: {},
        flowers: {},
        fishFood: 100,
        catState: 'idle', // 'idle', 'walking', 'sleeping', 'eating'
        catBowlVisible: false,
        starsActive: false
    },

    // Комнаты
    rooms: {
        living: {
            name: 'Гостиная',
            icon: '🏠',
            items: ['painting', 'fireplace', 'sofa', 'bookshelf', 'tv', 'radio', 'cat']
        },
        kitchen: {
            name: 'Кухня',
            icon: '🍽️',
            items: ['tea', 'flowers', 'fridge']
        },
        bedroom: {
            name: 'Спальня',
            icon: '🛏️',
            items: ['bed', 'stars']
        },
        office: {
            name: 'Кабинет',
            icon: '📚',
            items: ['desk', 'computer']
        }
    },

    // Члены семьи (онлайн)
    familyMembers: [],

    /**
     * Инициализация
     */
    init: function() {
        console.log('MORI_HOUSE инициализация...');
        this.loadState();
        this.loadFamilyMembers();
    },

    /**
     * Рендер
     */
    render: function() {
        const content = document.getElementById('house-content');
        if (!content) return;

        // Проверяем доступ (только для семьи и админов)
        if (!MORI_AUTH.isFamily()) {
            content.innerHTML = this.renderNoAccess();
            return;
        }

        content.innerHTML = this.getHTML();
        this.attachEvents();
        this.startAnimations();
    },

    /**
     * HTML
     */
    getHTML: function() {
        const room = this.rooms[this.state.currentRoom];
        
        return `
            <div class="house-screen">
                <!-- Шапка -->
                <div class="house-header">
                    <h2>🏠 Дом</h2>
                    <div class="house-weather">
                        ${this.getWeather()}
                    </div>
                </div>

                <!-- Переключение комнат -->
                <div class="room-tabs">
                    ${Object.entries(this.rooms).map(([id, room]) => `
                        <button class="room-tab ${this.state.currentRoom === id ? 'active' : ''}" 
                                data-room="${id}">
                            ${room.icon} ${room.name}
                        </button>
                    `).join('')}
                </div>

                <!-- Комната -->
                <div class="room-container room-${this.state.currentRoom}">
                    ${this.renderRoom()}
                </div>

                <!-- Звёздное небо -->
                <div class="starry-sky ${this.state.starsActive ? 'active' : ''}" id="starry-sky">
                    ${this.renderStars()}
                </div>
            </div>
        `;
    },

    /**
     * Рендер комнаты
     */
    renderRoom: function() {
        const room = this.rooms[this.state.currentRoom];
        
        switch(this.state.currentRoom) {
            case 'living':
                return this.renderLivingRoom();
            case 'kitchen':
                return this.renderKitchen();
            case 'bedroom':
                return this.renderBedroom();
            case 'office':
                return this.renderOffice();
            default:
                return '';
        }
    },

    /**
     * Гостиная
     */
    renderLivingRoom: function() {
        return `
            <div class="room-items">
                <!-- Картина -->
                <div class="painting-container" id="painting">
                    <div class="painting-frame">
                        <div class="painting-image">
                            ${this.state.paintingImage ? 
                                `<img src="${this.state.paintingImage}" alt="family photo">` : 
                                '🖼️'}
                        </div>
                    </div>
                    <div class="painting-caption">${this.state.paintingCaption}</div>
                </div>

                <!-- Камин -->
                <div class="fireplace" id="fireplace">
                    <div class="fireplace-image">
                        <div class="firewood"></div>
                        ${this.state.fireplaceOn ? `
                            <div class="fire-flames">
                                <div class="flame"></div>
                                <div class="flame"></div>
                                <div class="flame"></div>
                                <div class="flame"></div>
                                <div class="flame"></div>
                            </div>
                        ` : ''}
                    </div>
                    <div class="fireplace-controls">
                        <button class="fireplace-btn" id="toggle-fireplace">
                            ${this.state.fireplaceOn ? '🔥' : '⬤'}
                        </button>
                        <button class="fireplace-btn" id="add-wood">➕</button>
                    </div>
                </div>

                <!-- Диван -->
                <div class="sofa" id="sofa">
                    <div class="sofa-image"></div>
                    <div class="sofa-occupants">
                        ${this.renderSofaOccupants()}
                    </div>
                </div>

                <!-- Книжный шкаф -->
                <div class="bookshelf" id="bookshelf">
                    ${[1,2,3,4,5,6,7,8].map(i => `
                        <div class="bookshelf-book" data-book="${i}">📚</div>
                    `).join('')}
                </div>

                <!-- Телевизор -->
                <div class="tv-container" id="tv">
                    <div class="tv-frame">
                        <div class="tv-screen ${this.state.tvOn ? 'playing' : ''}">
                            ${this.state.tvOn ? '📺' : '⬤'}
                        </div>
                    </div>
                    <div class="tv-controls">
                        <button class="tv-btn" id="toggle-tv">⚡</button>
                        <button class="tv-btn" id="tv-search">🔍</button>
                    </div>
                </div>

                <!-- Радио -->
                <div class="radio-container" id="radio">
                    <div class="radio-image ${this.state.radioOn ? 'playing' : ''}">
                        📻
                    </div>
                    <div class="radio-controls">
                        <button class="tv-btn" id="toggle-radio">🔊</button>
                        <button class="tv-btn" id="radio-playlist">📋</button>
                    </div>
                </div>

                <!-- Кот -->
                <div class="cat ${this.state.catState}" id="cat">
                    <div class="cat-body"></div>
                    <div class="cat-head">
                        <div class="cat-ears">
                            <div class="cat-ear left"></div>
                            <div class="cat-ear right"></div>
                        </div>
                        <div class="cat-eyes">
                            <div class="cat-eye left"></div>
                            <div class="cat-eye right"></div>
                        </div>
                        <div class="cat-nose"></div>
                        <div class="cat-whiskers">
                            <div class="whisker left"></div>
                            <div class="whisker right"></div>
                        </div>
                    </div>
                    <div class="cat-tail"></div>
                    <div class="cat-paw left"></div>
                    <div class="cat-paw right"></div>
                    <div class="cat-bowl ${this.state.catBowlVisible ? 'visible' : ''}"></div>
                </div>
            </div>
        `;
    },

    /**
     * Кухня
     */
    renderKitchen: function() {
        return `
            <div class="room-items">
                <!-- Чай -->
                <div class="tea-set" id="tea-set">
                    <div class="teapot ${this.state.teaState === 'boiling' ? 'boiling' : ''}" 
                         id="teapot">
                    </div>
                    <div class="tea-cups">
                        ${Object.keys(this.familyMembers).map((id, i) => `
                            <div class="tea-cup ${this.state.teaCups[id] ? 'filled' : ''}" 
                                 data-user="${id}">
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Цветы -->
                <div class="flowers" id="flowers">
                    ${[1,2,3].map(i => `
                        <div class="flower-pot" data-flower="${i}">
                            <div class="flower">🌱</div>
                            <div class="flower-progress">
                                <div class="flower-fill" style="width: ${this.state.flowers[i] || 0}%"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Холодильник (для кота) -->
                <div class="fridge" id="fridge">
                    <div class="fridge-icon">🧊</div>
                    <button class="feed-btn" id="feed-cat">🐟 Покормить кота</button>
                </div>
            </div>
        `;
    },

    /**
     * Спальня
     */
    renderBedroom: function() {
        return `
            <div class="room-items">
                <!-- Кровать -->
                <div class="bed" id="bed">
                    <div class="bed-frame">
                        <div class="bed-pillow"></div>
                    </div>
                    <div class="bed-mattress"></div>
                    <div class="bed-blanket"></div>
                    <button class="sleep-btn" id="sleep-btn">😴 Лечь спать</button>
                </div>
            </div>
        `;
    },

    /**
     * Кабинет (пока заглушка)
     */
    renderOffice: function() {
        return `
            <div class="room-items">
                <div class="empty-room">
                    <div class="empty-icon">📚</div>
                    <h3>Кабинет в разработке</h3>
                </div>
            </div>
        `;
    },

    /**
     * Нет доступа
     */
    renderNoAccess: function() {
        return `
            <div class="empty-chat">
                <div class="empty-icon">🔒</div>
                <h3>Дом только для семьи</h3>
                <p>Вступите в семью, чтобы открыть доступ</p>
            </div>
        `;
    },

    /**
     * Аватарки на диване
     */
    renderSofaOccupants: function() {
        const online = this.familyMembers.filter(m => m.online);
        
        return online.map(member => `
            <div class="sofa-avatar" title="${member.nickname}">
                ${member.avatar || '👤'}
            </div>
        `).join('');
    },

    /**
     * Звёзды
     */
    renderStars: function() {
        const stars = [];
        for (let i = 0; i < 50; i++) {
            const top = Math.random() * 100;
            const left = Math.random() * 100;
            const delay = Math.random() * 3;
            stars.push(`<div class="star" style="top: ${top}%; left: ${left}%; animation-delay: ${delay}s">⭐</div>`);
        }
        return stars.join('');
    },

    /**
     * Погода
     */
    getWeather: function() {
        const hours = new Date().getHours();
        if (hours < 6 || hours > 20) return '🌙 Ночь';
        if (hours < 12) return '🌅 Утро';
        if (hours < 18) return '☀️ День';
        return '🌆 Вечер';
    },

    /**
 * Загрузка членов семьи
 */
loadFamilyMembers: async function() {
    try {
        const members = await MORI_API.getFamilyMembers();
        if (members && members.length) {
            this.familyMembers = members;
        } else {
            this.familyMembers = [];
        }
    } catch (error) {
        console.error('Error loading family members:', error);
        this.familyMembers = [];
    }
},

    /**
     * Обработчики
     */
    attachEvents: function() {
        // Переключение комнат
        document.querySelectorAll('.room-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const room = e.target.dataset.room;
                this.switchRoom(room);
            });
        });

        // Картина
        document.getElementById('painting')?.addEventListener('click', () => {
            this.changePainting();
        });

        // Камин
        document.getElementById('toggle-fireplace')?.addEventListener('click', () => {
            this.toggleFireplace();
        });

        document.getElementById('add-wood')?.addEventListener('click', () => {
            this.addWood();
        });

        // Телевизор
        document.getElementById('toggle-tv')?.addEventListener('click', () => {
            this.toggleTV();
        });

        document.getElementById('tv-search')?.addEventListener('click', () => {
            this.searchYouTube();
        });

        // Радио
        document.getElementById('toggle-radio')?.addEventListener('click', () => {
            this.toggleRadio();
        });

        document.getElementById('radio-playlist')?.addEventListener('click', () => {
            this.openPlaylist();
        });

        // Книжный шкаф
        document.querySelectorAll('.bookshelf-book').forEach(book => {
            book.addEventListener('click', () => {
                this.openLibrary();
            });
        });

        // Чай
        document.getElementById('teapot')?.addEventListener('click', () => {
            this.boilTea();
        });

        document.querySelectorAll('.tea-cup').forEach(cup => {
            cup.addEventListener('click', (e) => {
                const userId = e.target.dataset.user;
                this.pourTea(userId);
            });
        });

        // Цветы
        document.querySelectorAll('.flower-pot').forEach(pot => {
            pot.addEventListener('click', (e) => {
                const flowerId = e.currentTarget.dataset.flower;
                this.waterFlower(flowerId);
            });
        });

        // Кот
        document.getElementById('cat')?.addEventListener('click', () => {
            this.petCat();
        });

        document.getElementById('feed-cat')?.addEventListener('click', () => {
            this.feedCat();
        });

        // Кровать
        document.getElementById('sleep-btn')?.addEventListener('click', () => {
            this.sleep();
        });

        // Кот периодически меняет состояние
        setInterval(() => this.randomCatAction(), 10000);
    },

    /**
     * Переключение комнаты
     */
    switchRoom: function(roomId) {
        this.setState({ currentRoom: roomId });
    },

    /**
     * Смена картины
     */
    changePainting: function() {
        // Заглушка, позже будет выбор фото
        MORI_APP.showToast('Выберите фото для картины', 'info');
    },

    /**
     * Тоггл камина
     */
    toggleFireplace: function() {
        this.setState({ fireplaceOn: !this.state.fireplaceOn });
    },

    /**
     * Добавить дрова
     */
    addWood: function() {
        MORI_APP.showToast('🔥 Дрова подброшены', 'success');
        if (!this.state.fireplaceOn) {
            this.setState({ fireplaceOn: true });
        }
    },

    /**
     * Тоггл ТВ
     */
    toggleTV: function() {
        this.setState({ tvOn: !this.state.tvOn });
        MORI_APP.showToast(this.state.tvOn ? '📺 Телевизор включён' : '📺 Телевизор выключен', 'info');
    },

    /**
     * Поиск на YouTube
     */
    searchYouTube: function() {
        MORI_APP.showToast('🔍 Поиск на YouTube', 'info');
        // TODO: открыть поиск YouTube
    },

    /**
     * Тоггл радио
     */
    toggleRadio: function() {
        this.setState({ radioOn: !this.state.radioOn });
        MORI_APP.showToast(this.state.radioOn ? '📻 Радио включено' : '📻 Радио выключено', 'info');
    },

    /**
     * Открыть плейлист
     */
    openPlaylist: function() {
        MORI_APP.showToast('🎵 Семейный плейлист', 'info');
        // TODO: открыть семейный плейлист
    },

    /**
     * Открыть библиотеку
     */
    openLibrary: function() {
        MORI_ROUTER.navigate('library');
    },

    /**
     * Заварить чай
     */
    boilTea: function() {
        this.setState({ teaState: 'boiling' });
        MORI_APP.showToast('🫖 Чай заваривается...', 'info');
        
        setTimeout(() => {
            this.setState({ teaState: 'ready' });
            MORI_APP.showToast('✅ Чай готов!', 'success');
        }, 5000);
    },

    /**
     * Налить чай
     */
    pourTea: function(userId) {
        if (this.state.teaState !== 'ready') {
            MORI_APP.showToast('Сначала заварите чай', 'error');
            return;
        }

        this.setState({ 
            teaCups: { ...this.state.teaCups, [userId]: true },
            teaState: 'poured'
        });
        
        MORI_APP.showToast('🍵 Чай налит', 'success');
        
        // Обновляем статистику
        MORI_USER.updateStats('tea');
    },

    /**
     * Полить цветы
     */
    waterFlower: function(flowerId) {
        const current = this.state.flowers[flowerId] || 0;
        const newValue = Math.min(current + 20, 100);
        
        this.setState({ 
            flowers: { ...this.state.flowers, [flowerId]: newValue }
        });
        
        MORI_APP.showToast('💧 Цветы политы', 'success');
        
        if (newValue === 100) {
            MORI_APP.showToast('🌸 Цветок вырос!', 'success');
        }
    },

    /**
     * Погладить кота
     */
    petCat: function() {
        MORI_APP.showToast('🐱 Мур-мур!', 'success');
        this.setState({ catState: 'idle' });
    },

    /**
     * Покормить кота
     */
    feedCat: function() {
        this.setState({ 
            catState: 'eating',
            catBowlVisible: true 
        });
        
        MORI_APP.showToast('🐟 Кот ест...', 'info');
        
        setTimeout(() => {
            this.setState({ 
                catState: 'idle',
                catBowlVisible: false 
            });
            MORI_APP.showToast('😸 Кот наелся!', 'success');
        }, 3000);
    },

    /**
     * Лечь спать
     */
    sleep: function() {
        this.setState({ starsActive: true });
        MORI_APP.showToast('😴 Спокойной ночи...', 'info');
        
        setTimeout(() => {
            this.setState({ starsActive: false });
            MORI_APP.showToast('🌅 Доброе утро!', 'success');
        }, 5000);
    },

    /**
     * Случайное действие кота
     */
    randomCatAction: function() {
        if (this.state.catState === 'eating') return;
        
        const actions = ['idle', 'walking', 'sleeping'];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        
        this.setState({ catState: randomAction });
    },

    /**
     * Запуск анимаций
     */
    startAnimations: function() {
        // Анимации уже в CSS
    },

    /**
     * Загрузка состояния
     */
    loadState: function() {
        try {
            const saved = localStorage.getItem('house_state');
            if (saved) {
                this.state = { ...this.state, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('Error loading house state:', error);
        }
    },

    /**
     * Сохранение состояния
     */
    saveState: function() {
        try {
            localStorage.setItem('house_state', JSON.stringify(this.state));
        } catch (error) {
            console.error('Error saving house state:', error);
        }
    },

    /**
     * Обновление состояния
     */
    setState: function(newState) {
        this.state = { ...this.state, ...newState };
        this.saveState();
        this.render();
    }
};

// Экспорт
window.MORI_HOUSE = MORI_HOUSE;
