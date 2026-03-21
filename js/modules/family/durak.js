/**
 * FAMILY DURAK
 * Карточная игра "Дурак" для семьи
 * Версия: 1.0.0
 */

const MORI_FAMILY_DURAK = {
    // Состояние игры
    state: {
        gameActive: false,
        players: [],
        currentPlayer: null,
        deck: [],
        trump: null,
        table: [],
        attacker: null,
        defender: null,
        gameOver: false,
        winner: null,
        settings: {
            maxPlayers: 9,
            minPlayers: 2,
            cardsPerPlayer: 6,
            allowTransfer: true,
            timePerMove: 30
        }
    },

    // Колода (36 карт) - от 4 до туза
    deckCards: [
        // Пики (4-Т)
        { suit: '♠', rank: '4', value: 4 }, { suit: '♠', rank: '5', value: 5 },
        { suit: '♠', rank: '6', value: 6 }, { suit: '♠', rank: '7', value: 7 },
        { suit: '♠', rank: '8', value: 8 }, { suit: '♠', rank: '9', value: 9 },
        { suit: '♠', rank: '10', value: 10 }, { suit: '♠', rank: 'В', value: 11 },
        { suit: '♠', rank: 'Д', value: 12 }, { suit: '♠', rank: 'К', value: 13 },
        { suit: '♠', rank: 'Т', value: 14 },
        // Трефы (4-Т)
        { suit: '♣', rank: '4', value: 4 }, { suit: '♣', rank: '5', value: 5 },
        { suit: '♣', rank: '6', value: 6 }, { suit: '♣', rank: '7', value: 7 },
        { suit: '♣', rank: '8', value: 8 }, { suit: '♣', rank: '9', value: 9 },
        { suit: '♣', rank: '10', value: 10 }, { suit: '♣', rank: 'В', value: 11 },
        { suit: '♣', rank: 'Д', value: 12 }, { suit: '♣', rank: 'К', value: 13 },
        { suit: '♣', rank: 'Т', value: 14 },
        // Бубны (4-Т)
        { suit: '♦', rank: '4', value: 4 }, { suit: '♦', rank: '5', value: 5 },
        { suit: '♦', rank: '6', value: 6 }, { suit: '♦', rank: '7', value: 7 },
        { suit: '♦', rank: '8', value: 8 }, { suit: '♦', rank: '9', value: 9 },
        { suit: '♦', rank: '10', value: 10 }, { suit: '♦', rank: 'В', value: 11 },
        { suit: '♦', rank: 'Д', value: 12 }, { suit: '♦', rank: 'К', value: 13 },
        { suit: '♦', rank: 'Т', value: 14 },
        // Червы (4-Т)
        { suit: '♥', rank: '4', value: 4 }, { suit: '♥', rank: '5', value: 5 },
        { suit: '♥', rank: '6', value: 6 }, { suit: '♥', rank: '7', value: 7 },
        { suit: '♥', rank: '8', value: 8 }, { suit: '♥', rank: '9', value: 9 },
        { suit: '♥', rank: '10', value: 10 }, { suit: '♥', rank: 'В', value: 11 },
        { suit: '♥', rank: 'Д', value: 12 }, { suit: '♥', rank: 'К', value: 13 },
        { suit: '♥', rank: 'Т', value: 14 }
    ],

    /**
     * Инициализация
     */
    init: function() {
        console.log('MORI_FAMILY_DURAK инициализация...');
    },

    /**
     * Начать новую игру
     */
    startGame: function(playerIds) {
        if (playerIds.length < this.state.settings.minPlayers) {
            MORI_APP.showToast(`Минимум ${this.state.settings.minPlayers} игрока`, 'error');
            return false;
        }

        if (playerIds.length > this.state.settings.maxPlayers) {
            MORI_APP.showToast(`Максимум ${this.state.settings.maxPlayers} игроков`, 'error');
            return false;
        }

        // Загружаем игроков
        this.state.players = playerIds.map(id => {
            const member = MORI_FAMILY?.state?.members?.find(m => m.id === id);
            return {
                id,
                name: member?.nickname || `Игрок ${id}`,
                avatar: member?.avatar || '👤',
                cards: [],
                isActive: true,
                isAttacker: false,
                isDefender: false,
                takenCards: []
            };
        });

        // Перемешиваем колоду
        this.shuffleDeck();

        // Выбираем козырь
        this.state.trump = this.deckCards[Math.floor(Math.random() * this.deckCards.length)].suit;

        // Раздаём карты
        this.dealCards();

        // Определяем первого атакующего (у кого меньший козырь)
        this.determineFirstAttacker();

        this.state.gameActive = true;
        this.state.gameOver = false;

        MORI_APP.showToast('🃏 Игра началась!', 'success');
        
        return true;
    },

    /**
     * Перемешать колоду
     */
    shuffleDeck: function() {
        this.state.deck = [...this.deckCards];
        for (let i = this.state.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.state.deck[i], this.state.deck[j]] = [this.state.deck[j], this.state.deck[i]];
        }
    },

    /**
     * Раздать карты
     */
    dealCards: function() {
        const cardsPerPlayer = this.state.settings.cardsPerPlayer;
        
        this.state.players.forEach(player => {
            player.cards = this.state.deck.splice(0, cardsPerPlayer);
        });
    },

    /**
     * Определить первого атакующего (у кого меньший козырь)
     */
    determineFirstAttacker: function() {
        let minTrumpValue = 15;
        let firstAttackerIndex = 0;

        this.state.players.forEach((player, index) => {
            const trumpCards = player.cards.filter(c => c.suit === this.state.trump);
            if (trumpCards.length > 0) {
                const minValue = Math.min(...trumpCards.map(c => c.value));
                if (minValue < minTrumpValue) {
                    minTrumpValue = minValue;
                    firstAttackerIndex = index;
                }
            }
        });

        this.state.currentPlayer = firstAttackerIndex;
        this.state.attacker = firstAttackerIndex;
        this.state.defender = (firstAttackerIndex + 1) % this.state.players.length;
        this.state.players[firstAttackerIndex].isAttacker = true;
        this.state.players[this.state.defender].isDefender = true;
    },

    /**
     * Сделать ход
     */
    makeMove: function(playerIndex, cardIndex) {
        if (!this.state.gameActive) return false;
        if (playerIndex !== this.state.currentPlayer) return false;

        const player = this.state.players[playerIndex];
        const card = player.cards[cardIndex];

        if (this.state.table.length === 0) {
            // Первый ход в раунде
            return this.firstMove(playerIndex, card);
        } else if (playerIndex === this.state.attacker) {
            // Подкидывание карт
            return this.throwCard(playerIndex, card);
        } else if (playerIndex === this.state.defender) {
            // Отбивание
            return this.defend(playerIndex, card);
        }

        return false;
    },

    /**
     * Первый ход
     */
    firstMove: function(playerIndex, card) {
        const player = this.state.players[playerIndex];
        
        // Убираем карту из руки
        player.cards = player.cards.filter((_, i) => i !== player.cards.indexOf(card));
        
        // Кладём на стол
        this.state.table.push({
            card,
            playerId: player.id,
            beaten: false
        });

        this.state.currentPlayer = this.state.defender;
        
        this.checkDeck();
        return true;
    },

    /**
     * Подкинуть карту
     */
    throwCard: function(playerIndex, card) {
        const player = this.state.players[playerIndex];
        
        // Можно подкинуть только карту того же ранга, что уже есть на столе
        const tableRanks = this.state.table.map(t => t.card.rank);
        if (!tableRanks.includes(card.rank)) {
            MORI_APP.showToast('Нельзя подкинуть эту карту', 'error');
            return false;
        }

        // Нельзя подкинуть больше 6 карт
        if (this.state.table.length >= 6) {
            MORI_APP.showToast('Нельзя подкинуть больше 6 карт', 'error');
            return false;
        }

        player.cards = player.cards.filter((_, i) => i !== player.cards.indexOf(card));
        
        this.state.table.push({
            card,
            playerId: player.id,
            beaten: false
        });

        this.checkDeck();
        return true;
    },

    /**
     * Отбиться
     */
    defend: function(playerIndex, card) {
        const player = this.state.players[playerIndex];
        
        // Находим последнюю неотбитую карту
        const lastUnbeaten = [...this.state.table].reverse().find(t => !t.beaten);
        if (!lastUnbeaten) return false;

        // Проверяем, можно ли побить
        if (!this.canBeat(lastUnbeaten.card, card)) {
            MORI_APP.showToast('Эта карта не может побить', 'error');
            return false;
        }

        player.cards = player.cards.filter((_, i) => i !== player.cards.indexOf(card));
        
        lastUnbeaten.beaten = true;
        this.state.table.push({
            card,
            playerId: player.id,
            beating: true
        });

        // Проверяем, все ли карты отбиты
        const allBeaten = this.state.table.every(t => t.beaten || t.beating);
        
        if (allBeaten) {
            // Раунд окончен, все карты уходят в биту
            this.endRound();
        } else {
            // Можно подкидывать
            this.state.currentPlayer = this.state.attacker;
        }

        this.checkDeck();
        return true;
    },

    /**
     * Проверка, может ли одна карта побить другую
     */
    canBeat: function(attacker, defender) {
        // Если козырь, то бьёт любой не козырь
        if (defender.suit === this.state.trump && attacker.suit !== this.state.trump) {
            return true;
        }
        
        // Если одна масть, сравниваем значения
        if (defender.suit === attacker.suit) {
            return defender.value > attacker.value;
        }
        
        return false;
    },

    /**
     * Взять карты (если не может отбиться)
     */
    takeCards: function(playerIndex) {
        if (playerIndex !== this.state.defender) return false;

        const player = this.state.players[playerIndex];
        
        // Забираем все неотбитые карты
        const unbeatenCards = this.state.table.filter(t => !t.beaten && !t.beating);
        player.cards.push(...unbeatenCards.map(t => t.card));
        player.takenCards.push(...unbeatenCards.map(t => t.card));

        // Очищаем стол
        this.state.table = [];

        // Меняем роли
        this.rotateRoles();

        this.checkDeck();
        this.checkGameOver();
        
        return true;
    },

    /**
     * Закончить раунд (все отбились)
     */
    endRound: function() {
        this.state.table = [];
        this.rotateRoles();
        this.checkGameOver();
    },

    /**
     * Смена ролей
     */
    rotateRoles: function() {
        // Текущий защитник становится следующим атакующим
        const newAttacker = this.state.defender;
        const newDefender = (newAttacker + 1) % this.state.players.length;
        
        this.state.players.forEach(p => {
            p.isAttacker = false;
            p.isDefender = false;
        });

        this.state.attacker = newAttacker;
        this.state.defender = newDefender;
        this.state.players[newAttacker].isAttacker = true;
        this.state.players[newDefender].isDefender = true;
        this.state.currentPlayer = newAttacker;
    },

    /**
     * Проверка колоды (добрать карты)
     */
    checkDeck: function() {
        if (this.state.deck.length === 0) return;

        this.state.players.forEach(player => {
            if (player.cards.length < this.state.settings.cardsPerPlayer) {
                const needed = this.state.settings.cardsPerPlayer - player.cards.length;
                const take = Math.min(needed, this.state.deck.length);
                player.cards.push(...this.state.deck.splice(0, take));
            }
        });
    },

    /**
     * Проверка окончания игры
     */
    checkGameOver: function() {
        if (this.state.deck.length > 0) return;

        const playersWithCards = this.state.players.filter(p => p.cards.length > 0);
        
        if (playersWithCards.length === 1) {
            // Остался один игрок с картами - он дурак
            this.state.gameActive = false;
            this.state.gameOver = true;
            this.state.winner = playersWithCards[0].id;
            
            MORI_APP.showToast(`🃏 Игрок ${playersWithCards[0].name} остался дураком!`, 'info');
        } else if (playersWithCards.length === 0) {
            // Ни у кого нет карт - ничья
            this.state.gameActive = false;
            this.state.gameOver = true;
            MORI_APP.showToast('🃏 Ничья!', 'info');
        }
    },

    /**
     * Рендер игры
     */
    renderGame: function() {
        const currentPlayer = this.state.players[this.state.currentPlayer];
        const myId = MORI_USER.current?.id;
        
        // Находим меня и соперников
        const me = this.state.players.find(p => p.id === myId);
        const opponents = this.state.players.filter(p => p.id !== myId);
        
        // Разделяем соперников на две строки (по 2-3 в ряд)
        const topRow = opponents.slice(0, Math.ceil(opponents.length / 2));
        const middleRow = opponents.slice(Math.ceil(opponents.length / 2));
        
        return `
            <div class="durak-game">
                <!-- Шапка -->
                <div class="game-header">
                    <div class="game-info">
                        <span>🃏 Дурак</span>
                        <span class="trump-card">Козырь: ${this.state.trump}</span>
                        <span>Карт в колоде: ${this.state.deck.length}</span>
                    </div>
                    <div class="turn-indicator">
                        Ход: ${currentPlayer?.name}
                    </div>
                </div>

                <!-- Верхний ряд соперников -->
                <div class="opponents-top">
                    ${topRow.map(opponent => `
                        <div class="opponent-card ${opponent.isAttacker ? 'attacker' : ''} ${opponent.isDefender ? 'defender' : ''}">
                            <div class="opponent-avatar">${opponent.avatar}</div>
                            <div class="opponent-name">${opponent.name}</div>
                            <div class="opponent-cards">
                                ${'🂠 '.repeat(opponent.cards.length)}
                            </div>
                            <div class="opponent-cards-count">${opponent.cards.length}</div>
                        </div>
                    `).join('')}
                </div>

                <!-- СТОЛ -->
                <div class="game-table">
                    <div class="table-cards">
                        ${this.state.table.map(t => `
                            <div class="table-card ${t.beaten ? 'beaten' : ''}">
                                <span class="card-rank">${t.card.rank}</span>
                                <span class="card-suit">${t.card.suit}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Средний ряд соперников -->
                <div class="opponents-middle">
                    ${middleRow.map(opponent => `
                        <div class="opponent-card ${opponent.isAttacker ? 'attacker' : ''} ${opponent.isDefender ? 'defender' : ''}">
                            <div class="opponent-avatar">${opponent.avatar}</div>
                            <div class="opponent-name">${opponent.name}</div>
                            <div class="opponent-cards">
                                ${'🂠 '.repeat(opponent.cards.length)}
                            </div>
                            <div class="opponent-cards-count">${opponent.cards.length}</div>
                        </div>
                    `).join('')}
                </div>

                <!-- МОИ КАРТЫ (ВНИЗУ) -->
                <div class="my-cards">
                    <div class="my-info">
                        <span class="my-avatar">${me?.avatar}</span>
                        <span class="my-name">${me?.name} (ты)</span>
                    </div>
                    <div class="my-hand">
                        ${me?.cards.map((card, i) => `
                            <button class="card" data-card="${i}"
                                    ${this.state.currentPlayer !== this.state.players.indexOf(me) ? 'disabled' : ''}>
                                <span class="card-rank">${card.rank}</span>
                                <span class="card-suit">${card.suit}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Кнопка "Взять" (только для защитника) -->
                <div class="game-actions">
                    <button class="action-btn" id="take-cards" 
                            ${this.state.currentPlayer !== this.state.defender ? 'disabled' : ''}>
                        Взять карты
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Рендер лобби
     */
    renderLobby: function() {
        const familyMembers = MORI_FAMILY?.state?.members || [];
        
        return `
            <div class="durak-lobby">
                <h2>🃏 Игра в дурака</h2>
                
                <div class="lobby-settings">
                    <h3>Настройки</h3>
                    
                    <div class="setting-item">
                        <label>Количество игроков</label>
                        <select id="player-count">
                            ${[2,3,4,5,6,7,8,9].map(n => 
                                `<option value="${n}" ${n === 4 ? 'selected' : ''}>${n}</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="transfer-rule" checked>
                            Переводной дурак
                        </label>
                    </div>
                    
                    <div class="setting-item">
                        <label>Время на ход (сек)</label>
                        <select id="move-time">
                            <option value="15">15</option>
                            <option value="30" selected>30</option>
                            <option value="45">45</option>
                            <option value="60">60</option>
                        </select>
                    </div>
                </div>

                <div class="lobby-players">
                    <h3>Выберите игроков</h3>
                    <div class="players-grid">
                        ${familyMembers.map(member => `
                            <div class="player-select" data-id="${member.id}">
                                <div class="player-avatar">${member.avatar}</div>
                                <div class="player-name">${member.nickname}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <button class="start-game-btn" id="start-durak">Начать игру</button>
            </div>
        `;
    },

    /**
     * Рендер окончания игры
     */
    renderGameOver: function() {
        const winner = this.state.players.find(p => p.id === this.state.winner);
        
        return `
            <div class="durak-game-over">
                <h2>${this.state.winner ? `🎉 Победил ${winner?.name}` : '🤝 Ничья'}</h2>
                <button class="play-again-btn" id="play-again">Играть ещё</button>
            </div>
        `;
    },

    /**
     * Рендер (основной)
     */
    render: function() {
        if (!this.state.gameActive && !this.state.gameOver) {
            return this.renderLobby();
        }

        if (this.state.gameOver) {
            return this.renderGameOver();
        }

        return this.renderGame();
    },

    /**
     * Обработчики
     */
    attachEvents: function() {
        if (!this.state.gameActive) {
            // Лобби
            document.getElementById('start-durak')?.addEventListener('click', () => {
                const selectedPlayers = [];
                document.querySelectorAll('.player-select.selected').forEach(el => {
                    selectedPlayers.push(parseInt(el.dataset.id));
                });
                this.startGame(selectedPlayers);
                this.render();
            });

            document.querySelectorAll('.player-select').forEach(el => {
                el.addEventListener('click', () => {
                    el.classList.toggle('selected');
                });
            });
        } else if (this.state.gameActive && !this.state.gameOver) {
            // Игра
            document.querySelectorAll('.my-hand .card').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const cardIndex = parseInt(e.currentTarget.dataset.card);
                    const myId = MORI_USER.current?.id;
                    const meIndex = this.state.players.findIndex(p => p.id === myId);
                    
                    if (this.makeMove(meIndex, cardIndex)) {
                        this.render();
                    }
                });
            });

            document.getElementById('take-cards')?.addEventListener('click', () => {
                if (this.takeCards(this.state.defender)) {
                    this.render();
                }
            });
        } else if (this.state.gameOver) {
            // Game Over
            document.getElementById('play-again')?.addEventListener('click', () => {
                this.reset();
                this.render();
            });
        }
    },

    /**
     * Сброс игры
     */
    reset: function() {
        this.state = {
            gameActive: false,
            players: [],
            currentPlayer: null,
            deck: [],
            trump: null,
            table: [],
            attacker: null,
            defender: null,
            gameOver: false,
            winner: null,
            settings: {
                maxPlayers: 9,
                minPlayers: 2,
                cardsPerPlayer: 6,
                allowTransfer: true,
                timePerMove: 30
            }
        };
    }
};

// Экспорт
window.MORI_FAMILY_DURAK = MORI_FAMILY_DURAK;
