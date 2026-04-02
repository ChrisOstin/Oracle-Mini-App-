// jQuery UI Редактор — РАБОТАЕТ
(function() {
    let editing = false;
    
    function createButton() {
        const btn = document.createElement('button');
        btn.id = 'edit-btn';
        btn.innerHTML = '✏️';
        btn.style.cssText = `
        position: fixed;
        top: 16px;
        right: 16px;
        width: 52px;
        height: 52px;
        border-radius: 50%;
        background: #d4af37;
        border: none;
        color: black;
        font-size: 24px;
        cursor: pointer;
        z-index: 9999;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;        
        btn.onclick = toggleEdit;
        document.body.appendChild(btn);
    }
    
    function toggleEdit() {
        editing = !editing;
        const btn = document.getElementById('edit-btn');
        
        if (editing) {
            btn.style.background = '#ff4444';
            btn.innerHTML = '✓';
            enableDraggable();
        } else {
            btn.style.background = '#d4af37';
            btn.innerHTML = '✏️';
            disableDraggable();
        }
    }
    
    function enableDraggable() {
        // Делаем блоки перетаскиваемыми
        $('.converter-section, .staking-section, .result-container, .history-section, .chart-container, .calculator-card, .portfolio-card').each(function() {
            $(this).draggable({
                containment: 'body',
                scroll: false,
                start: function() {
                    $(this).css('position', 'relative');
                }
            });
            $(this).resizable({
                alsoResize: $(this),
                handles: 'all'
            });
            $(this).css('border', '2px dashed #d4af37');
        });
        
        alert('Режим редактирования включен! Тяни блоки за заголовок');
    }
    
    function disableDraggable() {
        $('.converter-section, .staking-section, .result-container, .history-section, .chart-container, .calculator-card, .portfolio-card').each(function() {
            if ($(this).draggable('instance')) $(this).draggable('destroy');
            if ($(this).resizable('instance')) $(this).resizable('destroy');
            $(this).css('border', '');
        });
    }
    
    createButton();
})();
