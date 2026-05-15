const Toast = (() => {
    function show(message, type) {
        const container = document.getElementById('toast-container');
        const el = document.createElement('div');
        el.className = 'toast toast-' + (type || 'info');
        el.textContent = message;
        container.appendChild(el);

        setTimeout(() => {
            el.classList.add('toast-fade-out');
            setTimeout(() => el.remove(), 300);
        }, 3000);
    }

    return {
        success: (msg) => show(msg, 'success'),
        error:   (msg) => show(msg, 'error'),
        info:    (msg) => show(msg, 'info'),
    };
})();
