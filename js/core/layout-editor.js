// ========== ПОЛНЫЙ РЕДАКТОР ИНТЕРФЕЙСА ==========
(function() {
    console.log('🎨 Редактор интерфейса загружен');
    
    // Состояние
    let editing = false;
    let activeElement = null;
    let isDragging = false;
    let dragStart = {};
    let currentMode = 'move';
    
    // 20 режимов редактирования
    const modes = [
        { id: 'move', icon: '✋', name: 'Перемещать', cursor: 'grab', action: 'move' },
        { id: 'resize', icon: '📏', name: 'Размер', cursor: 'se-resize', action: 'resize' },
        { id: 'text', icon: '🔤', name: 'Размер текста', cursor: 'ns-resize', action: 'text' },
        { id: 'rotate', icon: '🔄', name: 'Поворот', cursor: 'ew-resize', action: 'rotate' },
        { id: 'color', icon: '🎨', name: 'Цвет текста', cursor: 'pointer', action: 'color' },
        { id: 'bgcolor', icon: '🖌️', name: 'Цвет фона', cursor: 'pointer', action: 'bgcolor' },
        { id: 'margin', icon: '⬅️➡️', name: 'Отступы', cursor: 'move', action: 'margin' },
        { id: 'padding', icon: '📦', name: 'Внутр. отступ', cursor: 'move', action: 'padding' },
        { id: 'border', icon: '▯', name: 'Рамка', cursor: 'pointer', action: 'border' },
        { id: 'shadow', icon: '🌑', name: 'Тень', cursor: 'pointer', action: 'shadow' },
        { id: 'opacity', icon: '👻', name: 'Прозрачность', cursor: 'ew-resize', action: 'opacity' },
        { id: 'radius', icon: '⭕', name: 'Скругление', cursor: 'ew-resize', action: 'radius' },
        { id: 'gap', icon: '📏', name: 'Расстояние', cursor: 'ew-resize', action: 'gap' },
        { id: 'align', icon: '📐', name: 'Выравнивание', cursor: 'pointer', action: 'align' },
        { id: 'weight', icon: '💪', name: 'Жирность', cursor: 'ew-resize', action: 'weight' },
        { id: 'spacing', icon: '🔡', name: 'Интервал букв', cursor: 'ew-resize', action: 'spacing' },
        { id: 'lineheight', icon: '📝', name: 'Высота строки', cursor: 'ns-resize', action: 'lineheight' }
    ];
    
    // Создание панели инструментов
    function createToolbar() {
        let toolbar = document.getElementById('mori-toolbar');
        if (toolbar) toolbar.remove();
        
        toolbar = document.createElement('div');
        toolbar.id = 'mori-toolbar';
        toolbar.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(10,10,10,0.95);
            backdrop-filter: blur(10px);
            border-radius: 30px;
            padding: 8px 12px;
            z-index: 99999;
            border: 1px solid #d4af37;
            display: flex;
            gap: 6px;
            overflow-x: auto;
            max-width: 85vw;
            white-space: nowrap;
            scrollbar-width: thin;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        `;
        
        // Кнопки режимов
        modes.forEach(mode => {
            const btn = document.createElement('button');
            btn.innerHTML = `${mode.icon}`;
            btn.title = mode.name;
            btn.style.cssText = `
                background: ${currentMode === mode.id ? '#d4af37' : '#333'};
                border: none;
                width: 44px;
                height: 44px;
                border-radius: 30px;
                cursor: pointer;
                color: ${currentMode === mode.id ? '#000' : '#fff'};
                font-size: 20px;
                transition: all 0.2s;
                flex-shrink: 0;
            `;
            btn.onclick = () => setMode(mode.id);
            toolbar.appendChild(btn);
        });
        
        // Кнопка сохранения
        const saveBtn = document.createElement('button');
        saveBtn.innerHTML = '💾';
        saveBtn.title = 'Сохранить';
        saveBtn.style.cssText = `background:#d4af37; border:none; width:44px; height:44px; border-radius:30px; cursor:pointer; color:#000; font-size:20px; flex-shrink:0;`;
        saveBtn.onclick = saveLayout;
        
        // Кнопка сброса
        const resetBtn = document.createElement('button');
        resetBtn.innerHTML = '🗑';
        resetBtn.title = 'Сбросить всё';
        resetBtn.style.cssText = `background:#ff4444; border:none; width:44px; height:44px; border-radius:30px; cursor:pointer; color:#fff; font-size:20px; flex-shrink:0;`;
        resetBtn.onclick = resetLayout;
        
        // Кнопка выхода
        const exitBtn = document.createElement('button');
        exitBtn.innerHTML = '❌';
        exitBtn.title = 'Выйти';
        exitBtn.style.cssText = `background:#666; border:none; width:44px; height:44px; border-radius:30px; cursor:pointer; color:#fff; font-size:20px; flex-shrink:0;`;
        exitBtn.onclick = exitEditMode;
        
        toolbar.appendChild(saveBtn);
        toolbar.appendChild(resetBtn);
        toolbar.appendChild(exitBtn);
        
        document.body.appendChild(toolbar);
        return toolbar;
    }
    
    function setMode(modeId) {
        currentMode = modeId;
        const mode = modes.find(m => m.id === modeId);
        if (mode) document.body.style.cursor = mode.cursor;
        
        // Обновляем стили кнопок
        const toolbar = document.getElementById('mori-toolbar');
        if (toolbar) {
            const btns = toolbar.querySelectorAll('button');
            btns.forEach((btn, idx) => {
                if (idx < modes.length) {
                    const m = modes[idx];
                    if (m.id === modeId) {
                        btn.style.background = '#d4af37';
                        btn.style.color = '#000';
                    } else {
                        btn.style.background = '#333';
                        btn.style.color = '#fff';
                    }
                }
            });
        }
        
        showToast(`Режим: ${mode?.name || modeId}`);
    }
    
    function showToast(msg) {
        let toast = document.getElementById('mori-toast');
        if (toast) toast.remove();
        toast = document.createElement('div');
        toast.id = 'mori-toast';
        toast.textContent = msg;
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.9);
            color: #d4af37;
            padding: 6px 16px;
            border-radius: 30px;
            font-size: 12px;
            z-index: 99999;
            border: 1px solid #d4af37;
            white-space: nowrap;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 1500);
    }
    
    function saveLayout() {
        const layout = {};
        const elements = document.querySelectorAll('.editable-element');
        elements.forEach(el => {
            const id = el.id || `el_${Date.now()}_${Math.random()}`;
            if (!el.id) el.id = id;
            layout[id] = {
                top: el.style.top,
                left: el.style.left,
                width: el.style.width,
                height: el.style.height,
                fontSize: el.style.fontSize,
                color: el.style.color,
                backgroundColor: el.style.backgroundColor,
                borderRadius: el.style.borderRadius,
                opacity: el.style.opacity,
                transform: el.style.transform,
                margin: el.style.margin,
                padding: el.style.padding,
                fontWeight: el.style.fontWeight,
                letterSpacing: el.style.letterSpacing,
                lineHeight: el.style.lineHeight,
                border: el.style.border,
                boxShadow: el.style.boxShadow,
                gap: el.style.gap,
                textAlign: el.style.textAlign
            };
        });
        localStorage.setItem('mori_layout_full', JSON.stringify(layout));
        showToast('✅ Все изменения сохранены!');
    }
    
    function resetLayout() {
        if (confirm('Сбросить все настройки интерфейса?')) {
            localStorage.removeItem('mori_layout_full');
            location.reload();
        }
    }
    
    function loadLayout() {
        const saved = localStorage.getItem('mori_layout_full');
        if (!saved) return;
        const layout = JSON.parse(saved);
        for (let id in layout) {
            const el = document.getElementById(id);
            if (el) {
                const styles = layout[id];
                for (let prop in styles) {
                    if (styles[prop]) el.style[prop] = styles[prop];
                }
            }
        }
        showToast('📦 Сохраненный дизайн загружен');
    }
    
    // Обработка изменений
    function onMouseDown(e) {
        if (!editing) return;
        let target = e.target.closest('.editable-element');
        if (!target) return;
        
        activeElement = target;
        const rect = target.getBoundingClientRect();
        dragStart = {
            x: e.clientX, y: e.clientY,
            width: target.offsetWidth,
            height: target.offsetHeight,
            top: parseInt(target.style.top) || 0,
            left: parseInt(target.style.left) || 0,
            fontSize: parseInt(window.getComputedStyle(target).fontSize) || 16,
            opacity: parseFloat(target.style.opacity) || 1,
            borderRadius: parseInt(target.style.borderRadius) || 0,
            gap: parseInt(target.style.gap) || 0,
            letterSpacing: parseFloat(target.style.letterSpacing) || 0,
            lineHeight: parseFloat(target.style.lineHeight) || 1.4,
            fontWeight: parseInt(target.style.fontWeight) || 400,
            margin: parseInt(target.style.margin) || 0,
            padding: parseInt(target.style.padding) || 0,
            rotation: 0
        };
        
        isDragging = true;
        e.preventDefault();
    }
    
    function onMouseMove(e) {
        if (!isDragging || !activeElement) return;
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        
        switch(currentMode) {
            case 'move':
                activeElement.style.position = 'relative';
                activeElement.style.top = (dragStart.top + deltaY) + 'px';
                activeElement.style.left = (dragStart.left + deltaX) + 'px';
                break;
            case 'resize':
                activeElement.style.width = Math.max(50, dragStart.width + deltaX) + 'px';
                activeElement.style.height = Math.max(30, dragStart.height + deltaY) + 'px';
                break;
            case 'text':
                activeElement.style.fontSize = Math.max(8, dragStart.fontSize + deltaY / 5) + 'px';
                break;
            case 'rotate':
                const rotation = (dragStart.rotation + deltaX) % 360;
                activeElement.style.transform = `rotate(${rotation}deg)`;
                dragStart.rotation = rotation;
                break;
            case 'opacity':
                const opacity = Math.min(1, Math.max(0, dragStart.opacity + deltaY / 200));
                activeElement.style.opacity = opacity;
                break;
            case 'radius':
                const radius = Math.max(0, dragStart.borderRadius + deltaY / 2);
                activeElement.style.borderRadius = radius + 'px';
                break;
            case 'gap':
                const gap = Math.max(0, dragStart.gap + deltaY / 2);
                activeElement.style.gap = gap + 'px';
                break;
            case 'weight':
                const weight = Math.min(900, Math.max(100, dragStart.fontWeight + (deltaY > 0 ? 10 : -10)));
                activeElement.style.fontWeight = weight;
                break;
            case 'spacing':
                const spacing = Math.max(-5, Math.min(10, dragStart.letterSpacing + deltaY / 50));
                activeElement.style.letterSpacing = spacing + 'px';
                break;
            case 'lineheight':
                const lineHeight = Math.max(0.8, Math.min(3, dragStart.lineHeight + deltaY / 100));
                activeElement.style.lineHeight = lineHeight;
                break;
            case 'margin':
                activeElement.style.margin = (dragStart.margin + deltaY) + 'px';
                break;
            case 'padding':
                activeElement.style.padding = (dragStart.padding + deltaY) + 'px';
                break;
        }
    }
    
    function onMouseUp() {
        isDragging = false;
        activeElement = null;
    }
    
    function onClick(e) {
        if (!editing) return;
        let target = e.target.closest('.editable-element');
        if (!target) return;
        
        switch(currentMode) {
            case 'color':
                const color = prompt('Цвет текста (hex, rgb):', '#d4af37');
                if (color) target.style.color = color;
                break;
            case 'bgcolor':
                const bg = prompt('Цвет фона:', '#1a1a2a');
                if (bg) target.style.backgroundColor = bg;
                break;
            case 'border':
                const border = prompt('Рамка:', '1px solid #d4af37');
                if (border) target.style.border = border;
                break;
            case 'shadow':
                const shadow = prompt('Тень:', '0 4px 12px rgba(0,0,0,0.3)');
                if (shadow) target.style.boxShadow = shadow;
                break;
            case 'align':
                const align = prompt('Выравнивание (left,center,right,justify):', 'center');
                if (align) target.style.textAlign = align;
                break;
        }
    }
    
    function startEditing() {
        editing = true;
        createToolbar();
        setMode('move');
        
        // Подсвечиваем все элементы
        document.querySelectorAll('.converter-section, .staking-section, .result-container, .history-section, .chart-container, .calculator-card, .portfolio-card, .module-title, .currency-selector, .calc-input-group, .staking-card, .price-big, .timeframe-btn, .nav-btn, .calc-action-btn, .result-value, h1, h2, h3, p, button, div').forEach(el => {
            el.classList.add('editable-element');
            el.style.outline = '1px dashed rgba(212, 175, 55, 0.4)';
        });
        
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('click', onClick);
        
        showToast('🎨 Режим редактирования включен');
    }
    
    function exitEditMode() {
        editing = false;
        const toolbar = document.getElementById('mori-toolbar');
        if (toolbar) toolbar.remove();
        
        document.querySelectorAll('.editable-element').forEach(el => {
            el.classList.remove('editable-element');
            el.style.outline = '';
        });
        
        document.removeEventListener('mousedown', onMouseDown);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.removeEventListener('click', onClick);
        
        showToast('❌ Режим редактирования выключен');
    }
    
    // Кнопка включения редактора (в правом верхнем углу)
    const toggleBtn = document.createElement('button');
    toggleBtn.innerHTML = '✨';
    toggleBtn.style.cssText = `
        position: fixed;
        top: 16px;
        right: 16px;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: linear-gradient(135deg, #d4af37, #b8941f);
        border: none;
        color: #000;
        font-size: 24px;
        cursor: pointer;
        z-index: 99998;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    
    toggleBtn.onclick = () => {
        if (editing) {
            exitEditMode();
            toggleBtn.style.background = 'linear-gradient(135deg, #d4af37, #b8941f)';
        } else {
            startEditing();
            toggleBtn.style.background = '#ff4444';
        }
    };
    
    // Ждем загрузки страницы
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            document.body.appendChild(toggleBtn);
            setTimeout(loadLayout, 1500);
        });
    } else {
        document.body.appendChild(toggleBtn);
        setTimeout(loadLayout, 1500);
    }
    
    console.log('✅ Полный редактор интерфейса готов');
})();
</script>
