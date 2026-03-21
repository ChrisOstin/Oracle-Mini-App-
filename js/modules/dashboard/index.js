const MORI_DASHBOARD = {
    init: async function() {
        console.log('Dashboard init');
        
        // Получаем пользователя
        let userName = 'Гость';
        let userAvatar = '👤';
        let completedTasksCount = 0;
        
        try {
            const user = await MORI_API.getCurrentUser();
            if (user) {
                userName = user.nickname || 'Пользователь';
                userAvatar = user.avatar || '👤';
                completedTasksCount = user.completed_tasks?.length || 0;
            }
        } catch(e) { console.log('Не удалось загрузить пользователя'); }
        
        // Получаем цену MORI
        let price = '...';
        let history = [];
        try {
            const priceData = await MORI_API.getMoriPrice();
            if (priceData && priceData.price) price = priceData.price.toFixed(6);
            history = await MORI_API.getMoriHistory('1h') || [];
        } catch(e) { console.log('Не удалось загрузить данные'); }
        
        // График
        const lastPrices = history.slice(-10).map(p => p.c || p.price || 0);
        const maxPrice = Math.max(...lastPrices, 0.001);
        
        const container = document.getElementById('main-content');
        if (!container) return;
        
        container.innerHTML = `
            <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
                <!-- Шапка -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h1 style="margin: 0;">🔮 MORI Oracle</h1>
                    <div onclick="MORI_ROUTER.navigate('profile')" style="display: flex; align-items: center; gap: 10px; background: #2a2a2a; padding: 8px 15px; border-radius: 30px; cursor: pointer;">
                        <span style="font-size: 24px;">${userAvatar}</span>
                        <span><strong>${userName}</strong></span>
                    </div>
                </div>
                
                <!-- График и цена -->
                <div style="background: #1a1a1a; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <div style="font-size: 24px; margin-bottom: 10px;">💰 MORI: <strong>$${price}</strong></div>
                    <div style="height: 100px; display: flex; align-items: flex-end; gap: 4px;">
                        ${lastPrices.map(p => {
                            const height = Math.max(4, (p / maxPrice) * 80);
                            return `<div style="flex:1; background: #00ff88; height: ${height}px; border-radius: 2px;"></div>`;
                        }).join('')}
                    </div>
                </div>
                
                <!-- Общий чат -->
                <div onclick="MORI_ROUTER.navigate('chat')" 
                     style="background: #2a2a2a; padding: 15px; border-radius: 10px; margin: 20px 0; cursor: pointer; display: flex; align-items: center; gap: 15px;">
                    <span style="font-size: 32px;">💬</span>
                    <div>
                        <div style="font-weight: bold;">Общий чат</div>
                        <div style="font-size: 12px; color: #888;">Общайся с другими пользователями</div>
                    </div>
                    <span style="margin-left: auto;">➡️</span>
                </div>
                
                <!-- Кнопка "Все приложения" -->
                <div style="margin: 20px 0;">
                    <button id="show-apps-btn" style="width: 100%; padding: 15px; background: #2a2a2a; color: #00ff88; border: 1px solid #00ff88; border-radius: 10px; font-size: 18px; cursor: pointer;">
                        📱 ВСЕ ПРИЛОЖЕНИЯ
                    </button>
                </div>
                
                <!-- Панель с приложениями -->
                <div id="apps-panel" style="display: none; background: #0a0a0a; border-radius: 10px; padding: 15px; margin-top: 10px;">
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                        <div onclick="MORI_ROUTER.navigate('portfolio')" style="background: #2a2a2a; padding: 12px; border-radius: 8px; text-align: center; cursor: pointer;">
                            <div style="font-size: 28px;">📈</div>
                            <div>Портфель</div>
                        </div>
                        <div onclick="MORI_ROUTER.navigate('calculator')" style="background: #2a2a2a; padding: 12px; border-radius: 8px; text-align: center; cursor: pointer;">
                            <div style="font-size: 28px;">🔢</div>
                            <div>Калькулятор</div>
                        </div>
                        <div onclick="MORI_ROUTER.navigate('library')" style="background: #2a2a2a; padding: 12px; border-radius: 8px; text-align: center; cursor: pointer;">
                            <div style="font-size: 28px;">📚</div>
                            <div>Библиотека</div>
                        </div>
                        <div onclick="MORI_ROUTER.navigate('ai-chat')" style="background: #2a2a2a; padding: 12px; border-radius: 8px; text-align: center; cursor: pointer;">
                            <div style="font-size: 28px;">🤖</div>
                            <div>AI-чат</div>
                        </div>
                        <div onclick="MORI_ROUTER.navigate('music')" style="background: #2a2a2a; padding: 12px; border-radius: 8px; text-align: center; cursor: pointer;">
                            <div style="font-size: 28px;">🎵</div>
                            <div>Музыка</div>
                        </div>
                        <div onclick="MORI_ROUTER.navigate('tasks')" style="background: #2a2a2a; padding: 12px; border-radius: 8px; text-align: center; cursor: pointer;">
                            <div style="font-size: 28px;">✅</div>
                            <div>Задания</div>
                        </div>
                    </div>
                </div>
                
                <!-- Прогресс заданий -->
                <div onclick="MORI_ROUTER.navigate('tasks')" 
                     style="background: #2a2a2a; padding: 15px; border-radius: 10px; margin: 20px 0; cursor: pointer; text-align: center;">
                    <div style="font-size: 24px;">✅</div>
                    <div>Выполнено заданий: <strong>${completedTasksCount}</strong></div>
                    <div style="font-size: 12px; color: #888;">Нажми, чтобы открыть задания</div>
                </div>
                
                <button onclick="localStorage.clear(); location.reload()" 
                        style="margin-top: 20px; width: 100%; padding: 10px; background: #ff4444; color: white; border: none; border-radius: 5px;">
                    🚪 Выйти
                </button>
            </div>
        `;
        
        // Обработчик кнопки "Все приложения"
        const btn = document.getElementById('show-apps-btn');
        const panel = document.getElementById('apps-panel');
        if (btn && panel) {
            btn.onclick = () => {
                if (panel.style.display === 'none') {
                    panel.style.display = 'block';
                    btn.style.background = '#00ff88';
                    btn.style.color = '#000';
                } else {
                    panel.style.display = 'none';
                    btn.style.background = '#2a2a2a';
                    btn.style.color = '#00ff88';
                }
            };
        }
    }
};

window.MORI_DASHBOARD = MORI_DASHBOARD;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MORI_DASHBOARD.init());
} else {
    MORI_DASHBOARD.init();
                        }
