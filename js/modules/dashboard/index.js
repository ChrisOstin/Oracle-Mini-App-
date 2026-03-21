const MORI_DASHBOARD = {
    init: function() {
        console.log('Dashboard init called');
        const content = document.getElementById('main-content');
        if (content) {
            content.innerHTML = `
                <div class="dashboard-container">
                    <h1>Добро пожаловать в MORI Oracle</h1>
                    <p>Вы успешно вошли в систему!</p>
                </div>
            `;
            console.log('Dashboard rendered');
        } else {
            console.log('main-content not found');
        }
    }
};

window.MORI_DASHBOARD = MORI_DASHBOARD;

// Автоинициализация после загрузки модуля
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MORI_DASHBOARD.init());
} else {
    MORI_DASHBOARD.init();
}
