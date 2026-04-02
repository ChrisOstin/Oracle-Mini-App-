// Layout Editor — рабочая версия
(function() {
    console.log('🎨 Layout Editor загружается...');
    
    function createButton() {
        const btn = document.createElement('button');
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
                btn.style.transform = 'scale(1.1)';
                btn.style.background = '#ff4444';
                alert('✨ Режим редактирования ВКЛЮЧЕН\n\nТеперь можно перетаскивать элементы!');
                // Делаем элементы перетаскиваемыми
                document.querySelectorAll('.converter-section, .staking-section, .result-container, .history-section, .chart-container, .calculator-card, .portfolio-card')
                    .forEach(el => {
                        el.style.cursor = 'grab';
                        el.style.border = '2px dashed #d4af37';
                        el.setAttribute('draggable', 'true');
                    });
            } else {
                btn.style.transform = 'scale(1)';
                btn.style.background = 'linear-gradient(135deg, #d4af37, #b8941f)';
                alert('✨ Режим редактирования ВЫКЛЮЧЕН');
                document.querySelectorAll('.converter-section, .staking-section, .result-container, .history-section, .chart-container, .calculator-card, .portfolio-card')
                    .forEach(el => {
                        el.style.cursor = '';
                        el.style.border = '';
                        el.removeAttribute('draggable');
                    });
            }
        };
        
        document.body.appendChild(btn);
        console.log('✅ Кнопка редактирования создана');
    }
    
    // Ждем загрузки страницы
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createButton);
    } else {
        createButton();
    }
})();
