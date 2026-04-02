// ============================================
// РЕДАКТОР ИНТЕРФЕЙСА — 30 ФУНКЦИЙ
// ============================================
(function() {
    console.log('🎨 Редактор интерфейса загружается...');
    
    let editing = false;
    let activeElement = null;
    let isDragging = false;
    let dragStart = {};
    let currentMode = 'move';
    let toolbar = null;
    
    // ========== 30 РЕЖИМОВ РЕДАКТИРОВАНИЯ ==========
    const modes = [
        { id: 'move', icon: '✋', name: 'Перемещать', cursor: 'grab', action: 'move' },
        { id: 'resize', icon: '📏', name: 'Размер', cursor: 'se-resize', action: 'resize' },
        { id: 'text', icon: '🔤', name: 'Размер текста', cursor: 'ns-resize', action: 'text' },
        { id: 'rotate', icon: '🔄', name: 'Поворот', cursor: 'ew-resize', action: 'rotate' },
        { id: 'color', icon: '🎨', name: 'Цвет текста', cursor: 'pointer', action: 'color' },
        { id: 'bgcolor', icon: '🖌️', name: 'Цвет фона', cursor: 'pointer', action: 'bgcolor' },
        { id: 'margin', icon: '⬅️➡️', name: 'Внешний отступ', cursor: 'move', action: 'margin' },
        { id: 'padding', icon: '📦', name: 'Внутр. отступ', cursor: 'move', action: 'padding' },
        { id: 'border', icon: '▯', name: 'Рамка', cursor: 'pointer', action: 'border' },
        { id: 'borderwidth', icon: '📏', name: 'Толщина рамки', cursor: 'ew-resize', action: 'borderwidth' },
        { id: 'shadow', icon: '🌑', name: 'Тень', cursor: 'pointer', action: 'shadow' },
        { id: 'opacity', icon: '👻', name: 'Прозрачность', cursor: 'ew-resize', action: 'opacity' },
        { id: 'radius', icon: '⭕', name: 'Скругление', cursor: 'ew-resize', action: 'radius' },
        { id: 'gap', icon: '📏', name: 'Расстояние', cursor: 'ew-resize', action: 'gap' },
        { id: 'align', icon: '📐', name: 'Выравнивание', cursor: 'pointer', action: 'align' },
        { id: 'weight', icon: '💪', name: 'Жирность', cursor: 'ew-resize', action: 'weight' },
        { id: 'spacing', icon: '🔡', name: 'Интервал букв', cursor: 'ew-resize', action: 'spacing' },
        { id: 'lineheight', icon: '📝', name: 'Высота строки', cursor: 'ns-resize', action: 'lineheight' },
        { id: 'width', icon: '↔️', name: 'Ширина', cursor: 'ew-resize', action: 'width' },
        { id: 'height', icon: '↕️', name: 'Высота', cursor: 'ns-resize', action: 'height' },
        { id: 'bold', icon: 'B', name: 'Жирный', cursor: 'pointer', action: 'bold' },
        { id: 'italic', icon: 'I', name: 'Курсив', cursor: 'pointer', action: 'italic' },
        { id: 'underline', icon: 'U', name: 'Подчёркивание', cursor: 'pointer', action: 'underline' },
        { id: 'strike', icon: 'S', name: 'Зачёркнутый', cursor: 'pointer', action: 'strike' },
        { id: 'uppercase', icon: '🔠', name: 'Верхний регистр', cursor: 'pointer', action: 'uppercase' },
        { id: 'lowercase', icon: '🔡', name: 'Нижний регистр', cursor: 'pointer', action: 'lowercase' },
        { id: 'capitalize', icon: '🔤', name: 'С заглавной', cursor: 'pointer', action: 'capitalize' },
        { id: 'hide', icon: '👁️', name: 'Скрыть', cursor: 'pointer', action: 'hide' },
        { id: 'show', icon: '👁️‍🗨️', name: 'Показать', cursor: 'pointer', action: 'show' },
        { id: 'reset', icon: '🔄', name: 'Сброс элемента', cursor: 'pointer', action: 'reset' }
    ];
    
    // ========== СОЗДАНИЕ ПАНЕЛИ ИНСТРУМЕНТОВ ==========
    function createToolbar() {
        if (toolbar) toolbar.remove();
        
        toolbar = document.createElement('div');
        toolbar.id = 'mori-editor-toolbar';
        toolbar.style.cssText = `
            position: fixed;
            top: 60px;
            left: 0;
            right: 0;
            background: rgba(0,0,0,0.95);
            backdrop-filter: blur(15px);
            padding: 10px 16px;
            z-index: 999999;
            border-bottom: 2px solid #d4af37;
            display: flex;
            gap: 8px;
            overflow-x: auto;
            white-space: nowrap;
            scrollbar-width: thin;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        `;
        
        modes.forEach(mode => {
            const btn = document.createElement('button');
            btn.innerHTML = `${mode.icon}`;
            btn.title = mode.name;
            btn.style.cssText = `
                background: ${currentMode === mode.id ? '#d4af37' : '#333'};
                border: none;
                width: 50px;
                height: 50px;
                border-radius: 25px;
                cursor: pointer;
                color: ${currentMode === mode.id ? '#000' : '#fff'};
                font-size: 22px;
                transition: all 0.2s;
                flex-shrink: 0;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            `;
            btn.onclick = (function(m) { return function() { setMode(m.id); }; })(mode);
            toolbar.appendChild(btn);
        });
        
        // Кнопка сохранения
        const saveBtn = document.createElement('button');
        saveBtn.innerHTML = '💾';
        saveBtn.title = 'Сохранить все изменения';
        saveBtn.style.cssText = `background:#4caf50; border:none; width:50px; height:50px; border-radius:25px; cursor:pointer; color:#fff; font-size:22px; flex-shrink:0;`;
        saveBtn.onclick = saveLayout;
        
        // Кнопка сброса всех
        const resetAllBtn = document.createElement('button');
        resetAllBtn.innerHTML = '🗑';
        resetAllBtn.title = 'Сбросить всё';
        resetAllBtn.style.cssText = `background:#ff4444; border:none; width:50px; height:50px; border-radius:25px; cursor:pointer; color:#fff; font-size:22px; flex-shrink:0;`;
        resetAllBtn.onclick = resetAllLayout;
        
        // Кнопка выхода
        const exitBtn = document.createElement('button');
        exitBtn.innerHTML = '❌';
        exitBtn.title = 'Выйти из режима';
        exitBtn.style.cssText = `background:#666; border:none; width:50px; height:50px; border-radius:25px; cursor:pointer; color:#fff; font-size:22px; flex-shrink:0;`;
        exitBtn.onclick = exitEditMode;
        
        toolbar.appendChild(saveBtn);
        toolbar.appendChild(resetAllBtn);
        toolbar.appendChild(exitBtn);
        
        document.body.appendChild(toolbar);
    }
    
    function setMode(modeId) {
        currentMode = modeId;
        const mode = modes.find(m => m.id === modeId);
        if (mode) document.body.style.cursor = mode.cursor;
        
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
        
        showToast(`🔧 Режим: ${mode?.name || modeId}`);
    }
    
    function showToast(msg, isError = false) {
        let toast = document.getElementById('mori-editor-toast');
        if (toast) toast.remove();
        
        toast = document.createElement('div');
        toast.id = 'mori-editor-toast';
        toast.textContent = msg;
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: ${isError ? '#ff4444' : 'rgba(0,0,0,0.9)'};
            color: ${isError ? '#fff' : '#d4af37'};
            padding: 8px 20px;
            border-radius: 40px;
            font-size: 14px;
            z-index: 999999;
            border: 1px solid #d4af37;
            white-space: nowrap;
            font-weight: bold;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }
    
    // ========== СОХРАНЕНИЕ И ЗАГРУЗКА ==========
    function saveLayout() {
        const layout = {};
        const elements = document.querySelectorAll('.editable-element');
        
        elements.forEach((el, index) => {
            const id = el.id || `element_${index}`;
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
                fontStyle: el.style.fontStyle,
                textDecoration: el.style.textDecoration,
                textTransform: el.style.textTransform,
                letterSpacing: el.style.letterSpacing,
                lineHeight: el.style.lineHeight,
                border: el.style.border,
                borderWidth: el.style.borderWidth,
                boxShadow: el.style.boxShadow,
                gap: el.style.gap,
                textAlign: el.style.textAlign,
                display: el.style.display
            };
        });
        
        localStorage.setItem('mori_editor_layout', JSON.stringify(layout));
        showToast('✅ Все изменения сохранены!');
    }
    
    function loadLayout() {
        const saved = localStorage.getItem('mori_editor_layout');
        if (!saved) return;
        
        try {
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
            showToast('📦 Сохранённый дизайн загружен');
        } catch(e) {
            console.error('Ошибка загрузки:', e);
        }
    }
    
    function resetAllLayout() {
        if (confirm('🗑 Сбросить ВСЕ настройки интерфейса? Отменить будет нельзя.')) {
            localStorage.removeItem('mori_editor_layout');
            showToast('🔄 Дизайн сброшен, обновите страницу');
            setTimeout(() => location.reload(), 1500);
        }
    }
    
    // ========== ПРИМЕНЕНИЕ СТИЛЕЙ ==========
    function applyStyle(element, property, value) {
        if (!element) return;
        element.style[property] = value;
        showToast(`${property}: ${value}`);
    }
    
    // ========== ОБРАБОТЧИКИ СОБЫТИЙ ==========
    function onMouseDown(e) {
        if (!editing) return;
        
        let target = e.target.closest('.editable-element');
        if (!target) return;
        
        activeElement = target;
        const rect = target.getBoundingClientRect();
        const computed = window.getComputedStyle(target);
        
        dragStart = {
            x: e.clientX, y: e.clientY,
            width: target.offsetWidth,
            height: target.offsetHeight,
            top: parseInt(target.style.top) || 0,
            left: parseInt(target.style.left) || 0,
            fontSize: parseInt(computed.fontSize) || 16,
            opacity: parseFloat(computed.opacity) || 1,
            borderRadius: parseInt(computed.borderRadius) || 0,
            gap: parseInt(computed.gap) || 0,
            letterSpacing: parseFloat(computed.letterSpacing) || 0,
            lineHeight: parseFloat(computed.lineHeight) || 1.4,
            fontWeight: parseInt(computed.fontWeight) || 400,
            margin: parseInt(computed.margin) || 0,
            padding: parseInt(computed.padding) || 0,
            borderWidth: parseInt(computed.borderWidth) || 0,
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
            case 'width':
                activeElement.style.width = Math.max(50, dragStart.width + deltaX) + 'px';
                break;
            case 'height':
                activeElement.style.height = Math.max(30, dragStart.height + deltaY) + 'px';
                break;
            case 'borderwidth':
                const bw = Math.max(0, dragStart.borderWidth + deltaY / 2);
                activeElement.style.borderWidth = bw + 'px';
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
                const color = prompt('🎨 Цвет текста (hex, rgb, название):', '#d4af37');
                if (color) target.style.color = color;
                break;
            case 'bgcolor':
                const bg = prompt('🖌️ Цвет фона:', '#1a1a2a');
                if (bg) target.style.backgroundColor = bg;
                break;
            case 'border':
                const border = prompt('▯ Рамка (толщина стиль цвет):', '2px solid #d4af37');
                if (border) target.style.border = border;
                break;
            case 'shadow':
                const shadow = prompt('🌑 Тень:', '0 4px 15px rgba(0,0,0,0.3)');
                if (shadow) target.style.boxShadow = shadow;
                break;
            case 'align':
                const align = prompt('📐 Выравнивание (left, center, right, justify):', 'center');
                if (align) target.style.textAlign = align;
                break;
            case 'bold':
                target.style.fontWeight = target.style.fontWeight === 'bold' ? 'normal' : 'bold';
                showToast(target.style.fontWeight === 'bold' ? 'Жирный включен' : 'Жирный выключен');
                break;
            case 'italic':
                target.style.fontStyle = target.style.fontStyle === 'italic' ? 'normal' : 'italic';
                showToast(target.style.fontStyle === 'italic' ? 'Курсив включен' : 'Курсив выключен');
                break;
            case 'underline':
                target.style.textDecoration = target.style.textDecoration === 'underline' ? 'none' : 'underline';
                showToast(target.style.textDecoration === 'underline' ? 'Подчёркивание включено' : 'Подчёркивание выключено');
                break;
            case 'strike':
                target.style.textDecoration = target.style.textDecoration === 'line-through' ? 'none' : 'line-through';
                showToast(target.style.textDecoration === 'line-through' ? 'Зачёркивание включено' : 'Зачёркивание выключено');
                break;
            case 'uppercase':
                target.style.textTransform = 'uppercase';
                showToast('Текст в верхнем регистре');
                break;
            case 'lowercase':
                target.style.textTransform = 'lowercase';
                showToast('Текст в нижнем регистре');
                break;
            case 'capitalize':
                target.style.textTransform = 'capitalize';
                showToast('Слова с заглавной буквы');
                break;
            case 'hide':
                target.style.display = 'none';
                showToast('👁️ Элемент скрыт');
                break;
            case 'show':
                target.style.display = '';
                showToast('👁️ Элемент показан');
                break;
            case 'reset':
                target.style.cssText = '';
                showToast('🔄 Стиль элемента сброшен');
                break;
        }
    }
    
    // ========== ВКЛЮЧЕНИЕ/ВЫКЛЮЧЕНИЕ РЕЖИМА ==========
    function startEditing() {
        editing = true;
        createToolbar();
        setMode('move');
        
        // Подсвечиваем все интерактивные элементы
        document.querySelectorAll('div, button, section, .converter-section, .staking-section, .result-container, .history-section, .chart-container, .calculator-card, .portfolio-card, .module-title, .currency-selector, .calc-input-group, .staking-card, .price-big, .timeframe-btn, .nav-btn, .calc-action-btn, .result-value, h1, h2, h3, p, span, label, input, select').forEach(el => {
            if (el.id !== 'mori-editor-toolbar' && el.id !== 'mori-edit-btn' && el.tagName !== 'BODY' && el.tagName !== 'HTML') {
                el.classList.add('editable-element');
                el.style.outline = '1px dashed rgba(212, 175, 55, 0.5)';
                el.style.transition = 'all 0.1s';
            }
        });
        
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('click', onClick);
        
        showToast('🎨 Режим редактирования включен. Выбери инструмент на панели');
    }
    
    function exitEditMode() {
        editing = false;
        
        if (toolbar) {
            toolbar.remove();
            toolbar = null;
        }
        
        document.querySelectorAll('.editable-element').forEach(el => {
            el.classList.remove('editable-element');
            el.style.outline = '';
        });
        
        document.removeEventListener('mousedown', onMouseDown);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.removeEventListener('click', onClick);
        
        document.body.style.cursor = '';
        showToast('❌ Режим редактирования выключен');
    }
    
    // ========== КНОПКА ВКЛЮЧЕНИЯ ==========
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'mori-edit-btn';
    toggleBtn.innerHTML = '✨';
    toggleBtn.style.cssText = `
        position: fixed;
        top: 16px;
        right: 16px;
        width: 52px;
        height: 52px;
        border-radius: 50%;
        background: linear-gradient(135deg, #d4af37, #b8941f);
        border: none;
        color: #000;
        font-size: 26px;
        cursor: pointer;
        z-index: 999999;
        box-shadow: 0 4px 15px rgba(212, 175, 55, 0.5);
        transition: all 0.2s;
    `;
    
    toggleBtn.onclick = () => {
        if (editing) {
            exitEditMode();
            toggleBtn.style.background = 'linear-gradient(135deg, #d4af37, #b8941f)';
            toggleBtn.style.transform = 'scale(1)';
        } else {
            startEditing();
            toggleBtn.style.background = '#ff4444';
            toggleBtn.style.transform = 'scale(1.1)';
        }
    };
    
    // Добавляем кнопку на страницу
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            document.body.appendChild(toggleBtn);
            loadLayout();
        });
    } else {
        document.body.appendChild(toggleBtn);
        loadLayout();
    }
    
    console.log('✅ Редактор интерфейса готов — 30 функций');
})();
