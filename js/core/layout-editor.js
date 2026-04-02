/**
 * LAYOUT EDITOR — Drag & Drop + Resize для интерфейса
 */

const MORI_LAYOUT_EDITOR = {
    isEditing: false,
    elements: [],
    resizeHandles: [],
    
    init: function() {
        console.log('🎨 Layout Editor (с изменением размеров) инициализирован');
        this.addEditButton();
        this.loadLayout();
    },
    
    addEditButton: function() {
        const editBtn = document.createElement('button');
        editBtn.id = 'layout-edit-btn';
        editBtn.innerHTML = '✏️';
        editBtn.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 16px;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: #d4af37;
            border: none;
            color: #0a0a0a;
            font-size: 24px;
            font-weight: bold;
            cursor: pointer;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transition: all 0.2s;
        `;
        
        editBtn.onclick = () => this.toggleEditMode();
        document.body.appendChild(editBtn);
    },
    
    toggleEditMode: function() {
        this.isEditing = !this.isEditing;
        
        if (this.isEditing) {
            this.enableEditing();
        } else {
            this.disableEditing();
        }
    },
    
    enableEditing: function() {
        console.log('🎨 Режим редактирования включен');
        
        const containers = document.querySelectorAll('.converter-section, .staking-section, .result-container, .history-section, .chart-container');
        
        containers.forEach((el, index) => {
            el.setAttribute('data-id', index);
            el.style.cursor = 'grab';
            el.style.border = '2px dashed #d4af37';
            el.style.opacity = '0.95';
            el.style.position = 'relative';
            el.style.transition = 'all 0.1s';
            
            // Добавляем перетаскивание
            this.makeDraggable(el);
            
            // Добавляем углы для изменения размера
            this.addResizeHandles(el);
            
            this.elements.push(el);
        });
        
        this.showControlPanel();
    },
    
    disableEditing: function() {
        console.log('🎨 Режим редактирования выключен');
        
        this.elements.forEach(el => {
            el.style.cursor = '';
            el.style.border = '';
            el.style.opacity = '';
            el.style.position = '';
            el.style.top = '';
            el.style.left = '';
            el.style.width = '';
            el.style.height = '';
        });
        
        this.removeResizeHandles();
        this.elements = [];
        this.hideControlPanel();
    },
    
    makeDraggable: function(element) {
        let isDragging = false;
        let startY, startTop;
        
        element.addEventListener('mousedown', (e) => {
            if (!this.isEditing) return;
            if (e.target.classList?.contains('resize-handle')) return;
            
            isDragging = true;
            startY = e.clientY;
            startTop = element.offsetTop;
            element.style.cursor = 'grabbing';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const deltaY = e.clientY - startY;
            element.style.top = (startTop + deltaY) + 'px';
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
            if (element) element.style.cursor = 'grab';
        });
    },
    
    addResizeHandles: function(element) {
        // Создаем углы для изменения размера
        const positions = ['se', 'sw', 'ne', 'nw', 'e', 'w', 'n', 's'];
        
        positions.forEach(pos => {
            const handle = document.createElement('div');
            handle.className = 'resize-handle';
            handle.setAttribute('data-resize', pos);
            handle.style.cssText = `
                position: absolute;
                width: 16px;
                height: 16px;
                background: #d4af37;
                border-radius: 50%;
                cursor: ${this.getCursorForPosition(pos)};
                z-index: 10000;
                border: 2px solid #fff;
                box-shadow: 0 0 4px rgba(0,0,0,0.5);
            `;
            
            // Позиционируем угол
            switch(pos) {
                case 'se':
                    handle.style.bottom = '-8px';
                    handle.style.right = '-8px';
                    break;
                case 'sw':
                    handle.style.bottom = '-8px';
                    handle.style.left = '-8px';
                    break;
                case 'ne':
                    handle.style.top = '-8px';
                    handle.style.right = '-8px';
                    break;
                case 'nw':
                    handle.style.top = '-8px';
                    handle.style.left = '-8px';
                    break;
                case 'e':
                    handle.style.top = '50%';
                    handle.style.right = '-8px';
                    handle.style.transform = 'translateY(-50%)';
                    break;
                case 'w':
                    handle.style.top = '50%';
                    handle.style.left = '-8px';
                    handle.style.transform = 'translateY(-50%)';
                    break;
                case 'n':
                    handle.style.top = '-8px';
                    handle.style.left = '50%';
                    handle.style.transform = 'translateX(-50%)';
                    break;
                case 's':
                    handle.style.bottom = '-8px';
                    handle.style.left = '50%';
                    handle.style.transform = 'translateX(-50%)';
                    break;
            }
            
            this.setupResizeHandle(handle, element, pos);
            element.appendChild(handle);
            this.resizeHandles.push(handle);
        });
    },
    
    getCursorForPosition: function(pos) {
        const cursors = {
            'se': 'se-resize', 'sw': 'sw-resize',
            'ne': 'ne-resize', 'nw': 'nw-resize',
            'e': 'e-resize', 'w': 'w-resize',
            'n': 'n-resize', 's': 's-resize'
        };
        return cursors[pos] || 'default';
    },
    
    setupResizeHandle: function(handle, element, position) {
        let isResizing = false;
        let startX, startY, startWidth, startHeight, startTop, startLeft;
        
        handle.addEventListener('mousedown', (e) => {
            if (!MORI_LAYOUT_EDITOR.isEditing) return;
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = element.offsetWidth;
            startHeight = element.offsetHeight;
            startTop = element.offsetTop;
            startLeft = element.offsetLeft;
            e.preventDefault();
            e.stopPropagation();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            switch(position) {
                case 'se':
                    element.style.width = (startWidth + deltaX) + 'px';
                    element.style.height = (startHeight + deltaY) + 'px';
                    break;
                case 'sw':
                    element.style.width = (startWidth - deltaX) + 'px';
                    element.style.height = (startHeight + deltaY) + 'px';
                    element.style.left = (startLeft + deltaX) + 'px';
                    break;
                case 'ne':
                    element.style.width = (startWidth + deltaX) + 'px';
                    element.style.height = (startHeight - deltaY) + 'px';
                    element.style.top = (startTop + deltaY) + 'px';
                    break;
                case 'nw':
                    element.style.width = (startWidth - deltaX) + 'px';
                    element.style.height = (startHeight - deltaY) + 'px';
                    element.style.top = (startTop + deltaY) + 'px';
                    element.style.left = (startLeft + deltaX) + 'px';
                    break;
                case 'e':
                    element.style.width = (startWidth + deltaX) + 'px';
                    break;
                case 'w':
                    element.style.width = (startWidth - deltaX) + 'px';
                    element.style.left = (startLeft + deltaX) + 'px';
                    break;
                case 's':
                    element.style.height = (startHeight + deltaY) + 'px';
                    break;
                case 'n':
                    element.style.height = (startHeight - deltaY) + 'px';
                    element.style.top = (startTop + deltaY) + 'px';
                    break;
            }
        });
        
        document.addEventListener('mouseup', () => {
            isResizing = false;
        });
    },
    
    removeResizeHandles: function() {
        this.resizeHandles.forEach(handle => {
            if (handle && handle.remove) handle.remove();
        });
        this.resizeHandles = [];
    },
    
    showControlPanel: function() {
        if (this.controlPanel) return;
        
        this.controlPanel = document.createElement('div');
        this.controlPanel.style.cssText = `
            position: fixed;
            bottom: 140px;
            right: 16px;
            background: rgba(10,10,10,0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 12px;
            z-index: 9999;
            border: 1px solid #d4af37;
            display: flex;
            flex-direction: column;
            gap: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        `;
        
        this.controlPanel.innerHTML = `
            <button id="layout-save-btn" style="background:#d4af37; border:none; padding:10px 20px; border-radius:40px; color:#0a0a0a; font-weight:bold; cursor:pointer;">💾 Сохранить расположение</button>
            <button id="layout-reset-btn" style="background:#333; border:none; padding:8px 16px; border-radius:40px; color:#fff; cursor:pointer;">🔄 Сбросить</button>
        `;
        
        document.body.appendChild(this.controlPanel);
        
        document.getElementById('layout-save-btn').onclick = () => this.saveLayout();
        document.getElementById('layout-reset-btn').onclick = () => this.resetLayout();
    },
    
    hideControlPanel: function() {
        if (this.controlPanel) {
            this.controlPanel.remove();
            this.controlPanel = null;
        }
    },
    
    saveLayout: function() {
        const layout = {};
        
        this.elements.forEach((el, index) => {
            layout[index] = {
                order: index,
                top: el.style.top,
                left: el.style.left,
                width: el.style.width,
                height: el.style.height,
                position: el.style.position
            };
        });
        
        localStorage.setItem('mori_layout', JSON.stringify(layout));
        alert('✅ Расположение и размеры сохранены!');
        this.toggleEditMode();
        location.reload();
    },
    
    resetLayout: function() {
        localStorage.removeItem('mori_layout');
        alert('🔄 Расположение сброшено. Обновите страницу.');
        location.reload();
    },
    
    loadLayout: function() {
        const saved = localStorage.getItem('mori_layout');
        if (!saved) return;
        
        const layout = JSON.parse(saved);
        console.log('📦 Загружено сохраненное расположение', layout);
        
        setTimeout(() => {
            const containers = document.querySelectorAll('.converter-section, .staking-section, .result-container, .history-section, .chart-container');
            Object.values(layout).forEach((item, idx) => {
                if (containers[idx]) {
                    if (item.top) containers[idx].style.top = item.top;
                    if (item.left) containers[idx].style.left = item.left;
                    if (item.width) containers[idx].style.width = item.width;
                    if (item.height) containers[idx].style.height = item.height;
                    if (item.position) containers[idx].style.position = item.position;
                }
            });
        }, 500);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MORI_LAYOUT_EDITOR.init());
} else {
    MORI_LAYOUT_EDITOR.init();
}
