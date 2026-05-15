const App = (() => {
    const views = {
        dashboard: DashboardView,
        food:      FoodLogView,
        weight:    WeightLogView,
    };

    const titles = {
        dashboard: 'Health Tracker',
        food:      'Food Log',
        weight:    'Weight Log',
    };

    function currentView() {
        const hash = window.location.hash.replace('#', '').split('?')[0];
        return views[hash] ? hash : 'dashboard';
    }

    async function navigate() {
        const name = currentView();
        const view = views[name];

        document.getElementById('page-title').textContent = titles[name];

        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.view === name);
        });

        const main = document.getElementById('app-main');
        main.innerHTML = '';
        main.scrollTop = 0;

        try {
            await view.render(main);
        } catch (err) {
            main.innerHTML = `<div class="card"><p class="error">Failed to load: ${err.message}</p></div>`;
        }
    }

    function init() {
        window.addEventListener('hashchange', navigate);

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
        }

        navigate();
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
