// Layout Editor — ждет загрузки приложения
(function() {
    console.log('🎨 Layout Editor загружается...');
    
    function createButton() {
        if (document.getElementById('mori-edit-btn')) return;
        
        const btn = document.createElement('button');
        btn.id = 'mori-edit-btn';
        btn.innerHTML = '✨';
        btn.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 16px;
            width: 52px;
            height: 52px;
            border-radius: 50%;
            background: linear-gradient(135deg, #d4af37, #b8941f);
            border: none;
            color: #0a0a0a;
            font-size: 26px;
            cursor: pointer;
            z-index: 9999;
            box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);
        `;
        
        let editing = false;
        
        btn.onclick = () => {
            editing = !editing;
            if (editing) {
                btn.style.background = '#ff4444';
                btn.style.transform = 'scale(1.1)';
                alert('✨ Режим редактирования ВКЛЮЧЕН\n\nПеретаскивай элементы!');
                document.querySelectorAll('.converter-section, .staking-section, .result-container, .history-section, .chart-container, .calculator-card, .portfolio-card')
                    .forEach(el => {
                        if (el) {
                            el.style.border = '2px dashed #d4af37';
                            el.style.cursor = 'grab';
                        }
                    });
            } else {
                btn.style.background = 'linear-gradient(135deg, #d4af37, #b8941f)';
                btn.style.transform = 'scale(1)';
                alert('✨ Режим редактирования ВЫКЛЮЧЕН');
                document.querySelectorAll('.converter-section, .staking-section, .result-container, .history-section, .chart-container, .calculator-card, .portfolio-card')
                    .forEach(el => {
                        if (el) {
                            el.style.border = '';
                            el.style.cursor = '';
                        }
                    });
            }
        };
        
        document.body.appendChild(btn);
        console.log('✅ Кнопка редактирования создана');
    }
    
    // Ждем, пока приложение загрузится
    function waitForApp() {
        if (window.MORI_APP && MORI_APP.accessLevel !== 'guest') {
            console.log('✅ Приложение загружено, создаем кнопку');
            createButton();
        } else {
            console.log('⏳ Ждем загрузки приложения...');
            setTimeout(waitForApp, 500);
        }
    }
    
    // Запускаем ожидание
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForApp);
    } else {
        waitForApp();
    }
})();
