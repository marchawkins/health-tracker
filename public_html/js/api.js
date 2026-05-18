const API = (() => {
    async function request(method, path, body, signal) {
        const opts = { method, headers: { 'Content-Type': 'application/json' } };
        if (body !== undefined) opts.body = JSON.stringify(body);
        if (signal)             opts.signal = signal;

        const res  = await fetch('/api' + path, opts);
        const data = await res.json();

        if (res.status === 401 && !path.startsWith('/auth')) {
            if (typeof App !== 'undefined') App.setUser(null);
            window.location.hash = '#login';
            throw new Error('Session expired. Please log in.');
        }

        if (!res.ok) throw new Error(data.error || 'Request failed (' + res.status + ')');
        return data;
    }

    return {
        auth: {
            me:             ()     => request('GET',  '/auth/me'),
            login:          (data) => request('POST', '/auth/login', data),
            register:       (data) => request('POST', '/auth/register', data),
            logout:         ()     => request('POST', '/auth/logout'),
            forgotPassword: (data) => request('POST', '/auth/forgot-password', data),
            resetPassword:  (data) => request('POST', '/auth/reset-password', data),
            verifyEmail:       (data) => request('POST', '/auth/verify-email', data),
            verifyEmailChange: (data) => request('POST', '/auth/verify-email-change', data),
        },
        dashboard: {
            get: (date) => request('GET', '/dashboard' + (date ? '?date=' + date : '')),
        },
        foods: {
            list:         (date)     => request('GET',    '/foods?date=' + date),
            get:          (id)       => request('GET',    '/foods/' + id),
            autocomplete: (q)        => request('GET',    '/foods/autocomplete?q=' + encodeURIComponent(q)),
            create:       (data)     => request('POST',   '/foods', data),
            update:       (id, data) => request('PUT',    '/foods/' + id, data),
            remove:       (id)       => request('DELETE', '/foods/' + id),
        },
        weight: {
            list:   (limit) => request('GET',    '/weight?limit=' + (limit || 30)),
            create: (data)  => request('POST',   '/weight', data),
            remove: (id)    => request('DELETE', '/weight/' + id),
        },
        metrics: {
            definitions: ()      => request('GET', '/metrics/definitions'),
            list:        (defId) => request('GET', '/metrics' + (defId ? '?definition_id=' + defId : '')),
            create:      (data)  => request('POST',   '/metrics', data),
            remove:      (id)    => request('DELETE', '/metrics/' + id),
        },
        usda: {
            search: (q, signal) => request('GET', '/usda?q=' + encodeURIComponent(q), undefined, signal),
        },
        profile: {
            get:            ()     => request('GET', '/profile'),
            save:           (data) => request('PUT', '/profile', data),
            changeEmail:    (data) => request('PUT', '/profile/email', data),
            changePassword: (data) => request('PUT', '/profile/password', data),
        },
        OFF: {
            search:  (q, page = 1, signal) => request('GET', '/openfoodfacts?action=search&q=' + encodeURIComponent(q) + '&page=' + page, undefined, signal),
            barcode: (barcode)     => request('GET', '/openfoodfacts?action=barcode&barcode=' + encodeURIComponent(barcode)),
        },
    };
})();
