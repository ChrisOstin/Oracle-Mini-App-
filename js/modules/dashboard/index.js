const MORI_DASHBOARD = {
    init: function() {
        console.log('Dashboard loaded');
        const content = document.getElementById('main-content');
        if (content) {
            content.innerHTML = `
                <div class="dashboard-container">
                    <h1>Добро пожаловать в MORI Oracle</h1>
                    <p>Вы успешно вошли в систему!</p>
                </div>
            `;
        }
    }
};

window.MORI_DASHBOARD = MORI_DASHBOARD;
