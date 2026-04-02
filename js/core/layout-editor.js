// ПРОСТОЙ РАБОЧИЙ РЕДАКТОР — 3 функции
(function() {
    console.log('✏️ Редактор загружен');
    
    let editing = false;
    let activeElement = null;
    let mode = 'move';
    
    // Создаём кнопку включения
    const btn = document.createElement('button');
    btn.id = 'mori-edit-btn';
    btn.innerHTML = '✏️';
    btn.style.cssText = `
        position: fixed;
        top: 16px;
        right: 16px;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: #d4af37;
        border: none;
        color: #000;
        font-size: 24px;
        cursor: pointer;
        z-index: 999999;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    
    // Создаём панель инструментов
    const toolbar = document.createElement('div');
    toolbar.id = 'mori-toolbar';
    toolbar.style.cssText = `
        position: fixed;
        top: 70px;
        right: 16px;
        background: #1a1a1a;
        border-radius: 40px;
        padding: 8px;
        z-index: 999998;
        display: none;
        gap: 8px;
        border: 1px solid #d4af37;
    `;
    
    // Кнопки режимов
    const moveBtn = document.createElement('button');
    moveBtn.innerHTML = '✋';
    moveBtn.title = 'Перемещать';
    moveBtn.style.cssText = `background:#d4af37; border:none; width:44px; height:44px; border-radius:22px; font-size:20px; cursor:pointer;`;
    
    const resizeBtn = document.createElement('button');
    resizeBtn.innerHTML = '📏';
    resizeBtn.title = 'Размер';
    resizeBtn.style.cssText = `background:#333; border:none; width:44px; height:44px; border-radius:22px; font-size:20px; cursor:pointer; color:#fff;`;
    
    const colorBtn = document.createElement('button');
    colorBtn.innerHTML = '🎨';
    colorBtn.title = 'Цвет текста';
    colorBtn.style.cssText = `background:#333; border:none; width:44px; height:44px; border-radius:22px; font-size:20px; cursor:pointer; color:#fff;`;
    
    const saveBtn = document.createElement('button');
    saveBtn.innerHTML = '💾';
    saveBtn.title = 'Сохранить';
    saveBtn.style.cssText = `background:#4caf50; border:none; width:44px; height:44px; border-radius:22px; font-size:20px; cursor:pointer;`;
    
    const exitBtn = document.createElement('button');
    exitBtn.innerHTML = '❌';
    exitBtn.title = 'Выйти';
    exitBtn.style.cssText = `background:#ff4444; border:none; width:44px; height:44px; border-radius:22px; font-size:20px; cursor:pointer; color:#fff;`;
    
    toolbar.appendChild(moveBtn);
    toolbar.appendChild(resizeBtn);
    toolbar.appendChild(colorBtn);
    toolbar.appendChild(saveBtn);
    toolbar.appendChild(exitBtn);
    document.body.appendChild(toolbar);
    document.body.appendChild(btn);
    
    // Переключение режимов
    moveBtn.onclick = () => {
        mode = 'move';
        moveBtn.style.background = '#d4af37';
        moveBtn.style.color = '#000';
        resizeBtn.style.background = '#333';
        resizeBtn.style.color = '#fff';
        colorBtn.style.background = '#333';
        colorBtn.style.color = '#fff';
        alert('Режим: ПЕРЕМЕЩАТЬ\n\nТяни любой блок за угол');
    };
    
    resizeBtn.onclick = () => {
        mode = 'resize';
        resizeBtn.style.background = '#d4af37';
        resizeBtn.style.color = '#000';
        moveBtn.style.background = '#333';
        moveBtn.style.color = '#fff';
        colorBtn.style.background = '#333';
        colorBtn.style.color = '#fff';
        alert('Режим: ИЗМЕНИТЬ РАЗМЕР\n\nТяни за правый нижний угол блока');
    };
    
    colorBtn.onclick = () => {
        mode = 'color';
        colorBtn.style.background = '#d4af37';
        colorBtn.style.color = '#000';
        moveBtn.style.background = '#333';
        moveBtn.style.color = '#fff';
        resizeBtn.style.background = '#333';
        resizeBtn.style.color = '#fff';
        alert('Режим: ЦВЕТ ТЕКСТА\n\nКликни на блок, введи цвет');
    };
    
    // Сохранение
    saveBtn.onclick = () => {
        const layout = {};
        document.querySelectorAll('.editable').forEach((el, i) => {
            const id = el.id || `el_${i}`;
            if (!el.id) el.id = id;
            layout[id] = {
                top: el.style.top,
                left: el.style.left,
                width: el.style.width,
                height: el.style.height,
                color: el.style.color,
                position: el.style.position
            };
        });
        localStorage.setItem('mori_layout', JSON.stringify(layout));
        alert('✅ Сохранено!');
    };
    
    // Выход
    exitBtn.onclick = () => {
        editing = false;
        toolbar.style.display = 'none';
        btn.style.background = '#d4af37';
        btn.innerHTML = '✏️';
        document.querySelectorAll('.editable').forEach(el => {
            el.style.outline = '';
            el.classList.remove('editable');
        });
        alert('Режим редактирования выключен');
    };
    
    // Перетаскивание
    let dragStart = {};
    
    function onMouseDown(e) {
        if (!editing) return;
        if (e.target.closest('#mori-toolbar')) return;
        if (e.target.closest('#mori-edit-btn')) return;
        
        let target = e.target.closest('.editable');
        if (!target) return;
        
        activeElement = target;
        dragStart = {
            x: e.clientX,
            y: e.clientY,
            top: parseFloat(target.style.top) || 0,
            left: parseFloat(target.style.left) || 0,
            width: target.offsetWidth,
            height: target.offsetHeight
        };
        
        target.style.position = 'relative';
        target.style.cursor = 'grabbing';
        e.preventDefault();
    }
    
    function onMouseMove(e) {
        if (!activeElement) return;
        
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        
        if (mode === 'move') {
            activeElement.style.top = (dragStart.top + dy) + 'px';
            activeElement.style.left = (dragStart.left + dx) + 'px';
        } else if (mode === 'resize') {
            activeElement.style.width = Math.max(50, dragStart.width + dx) + 'px';
            activeElement.style.height = Math.max(30, dragStart.height + dy) + 'px';
        }
    }
    
    function onMouseUp() {
        if (activeElement) {
            activeElement.style.cursor = '';
        }
        activeElement = null;
    }
    
    function onClick(e) {
        if (!editing) return;
        if (mode !== 'color') return;
        if (e.target.closest('#mori-toolbar')) return;
        if (e.target.closest('#mori-edit-btn')) return;
        
        let target = e.target.closest('.editable');
        if (!target) return;
        
        const color = prompt('🎨 Введи цвет (hex, rgb, название):', '#d4af37');
        if (color) target.style.color = color;
    }
    
    // Включение режима
    btn.onclick = () => {
        if (!editing) {
            editing = true;
            toolbar.style.display = 'flex';
            btn.style.background = '#ff4444';
            btn.innerHTML = '✓';
            
            // Делаем блоки редактируемыми
            document.querySelectorAll('.converter-section, .staking-section, .result-container, .history-section, .chart-container, .calculator-card, .portfolio-card, .module-title').forEach(el => {
                el.classList.add('editable');
                el.style.outline = '2px dashed #d4af37';
            });
            
            document.addEventListener('mousedown', onMouseDown);
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            document.addEventListener('click', onClick);
            
            alert('Режим редактирования ВКЛЮЧЕН\n\nВыбери режим в панели');
        } else {
            exitBtn.onclick();
        }
    };
    
    // Загрузка сохранений
    const saved = localStorage.getItem('mori_layout');
    if (saved) {
        try {
            const layout = JSON.parse(saved);
            setTimeout(() => {
                for (let id in layout) {
                    const el = document.getElementById(id);
                    if (el) {
                        if (layout[id].top) el.style.top = layout[id].top;
                        if (layout[id].left) el.style.left = layout[id].left;
                        if (layout[id].width) el.style.width = layout[id].width;
                        if (layout[id].height) el.style.height = layout[id].height;
                        if (layout[id].color) el.style.color = layout[id].color;
                    }
                }
            }, 1000);
        } catch(e) {}
    }
    
    console.log('✅ Редактор готов — 3 рабочие функции');
})();
