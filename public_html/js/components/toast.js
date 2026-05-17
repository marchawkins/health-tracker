const Toast = (() => {
    function show(message, type, duration) {
        const container = document.getElementById('toast-container');
        const el = document.createElement('div');
        el.className = 'toast toast-' + (type || 'info');
        el.textContent = message;
        container.appendChild(el);

        setTimeout(() => {
            el.classList.add('toast-fade-out');
            setTimeout(() => el.remove(), 300);
        }, duration || 3000);
    }

    return {
        success: (msg, ms) => show(msg, 'success', ms),
        error:   (msg, ms) => show(msg, 'error',   ms),
        info:    (msg, ms) => show(msg, 'info',     ms),
    };
})();
