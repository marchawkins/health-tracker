const App = (() => {
    let currentUser = null;

    const AUTH_VIEWS = new Set(['login', 'register', 'forgot-password', 'reset-password', 'verify-email']);

    const views = {
        dashboard:       DashboardView,
        food:            FoodLogView,
        weight:          WeightLogView,
        steps:           StepsLogView,
        sleep:           SleepLogView,
        profile:         ProfileView,
        login:           LoginView,
        register:        RegisterView,
        'forgot-password': ForgotPasswordView,
        'reset-password':  ResetPasswordView,
        'verify-email':    VerifyEmailView,
    };

    function currentViewName() {
        const hash = window.location.hash.replace('#', '').split('?')[0];
        return views[hash] ? hash : 'dashboard';
    }

    function setNavVisible(visible) {
        const nav  = document.getElementById('app-nav');
        const main = document.getElementById('app-main');
        if (nav)  nav.style.display = visible ? '' : 'none';
        if (main) main.classList.toggle('no-nav', !visible);
    }

    async function navigate() {
        const name    = currentViewName();
        const isAuth  = AUTH_VIEWS.has(name);
        const view    = views[name];

        // Unauthenticated user trying to reach a protected view → send to login.
        if (!currentUser && !isAuth) {
            window.location.hash = '#login';
            return;
        }

        // Authenticated user on an auth view → send to dashboard.
        if (currentUser && isAuth && name !== 'verify-email') {
            window.location.hash = '#dashboard';
            return;
        }

        setNavVisible(!!currentUser);

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

    function setUser(user) {
        currentUser = user;
    }

    async function init() {
        window.addEventListener('hashchange', navigate);
        document.getElementById('page-title').addEventListener('click', () => {
            window.location.hash = currentUser ? '#dashboard' : '#login';
        });

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
        }

        // Check session before first render.
        try {
            currentUser = await API.auth.me();
        } catch (_) {
            currentUser = null;
        }

        navigate();
    }

    return { init, setUser };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
