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

    // Direct GET to Open Food Facts — CORS is supported, no PHP proxy needed.
    async function fetchOFF(url, signal) {
        const opts = { headers: { 'Accept': 'application/json' } };
        if (signal) opts.signal = signal;
        const res = await fetch(url, opts);
        if (!res.ok) throw new Error('OFF API returned ' + res.status);
        return res.json();
    }

    // Retry fn() once after 1 second on any non-abort failure.
    // Checks signal.aborted after the wait so in-flight aborts stay clean.
    async function withRetry(fn, signal) {
        try {
            return await fn();
        } catch (err) {
            if (err.name === 'AbortError') throw err;
            await new Promise(r => setTimeout(r, 1000));
            if (signal && signal.aborted) throw new DOMException('Aborted', 'AbortError');
            return await fn();
        }
    }

    return {
        withRetry,
        auth: {
            me:                ()     => request('GET',  '/auth/me'),
            login:             (data) => request('POST', '/auth/login', data),
            register:          (data) => request('POST', '/auth/register', data),
            logout:            ()     => request('POST', '/auth/logout'),
            forgotPassword:    (data) => request('POST', '/auth/forgot-password', data),
            resetPassword:     (data) => request('POST', '/auth/reset-password', data),
            verifyEmail:       (data) => request('POST', '/auth/verify-email', data),
            verifyEmailChange: (data) => request('POST', '/auth/verify-email-change', data),
        },
        dashboard: {
            get: (date, signal) => request('GET', '/dashboard' + (date ? '?date=' + date : ''), undefined, signal),
        },
        foods: {
            list:         (date, signal) => request('GET',    '/foods?date=' + date, undefined, signal),
            get:          (id,   signal) => request('GET',    '/foods/' + id, undefined, signal),
            autocomplete: (q,    signal) => request('GET',    '/foods/autocomplete?q=' + encodeURIComponent(q), undefined, signal),
            create:       (data)         => request('POST',   '/foods', data),
            update:       (id, data)     => request('PUT',    '/foods/' + id, data),
            remove:       (id)           => request('DELETE', '/foods/' + id),
        },
        weight: {
            list:   (limit, signal) => request('GET',    '/weight?limit=' + (limit || 30), undefined, signal),
            create: (data)          => request('POST',   '/weight', data),
            remove: (id)            => request('DELETE', '/weight/' + id),
        },
        metrics: {
            definitions: (signal)        => request('GET', '/metrics/definitions', undefined, signal),
            list:        (defId, signal) => request('GET', '/metrics' + (defId ? '?definition_id=' + defId : ''), undefined, signal),
            create:      (data)          => request('POST',   '/metrics', data),
            remove:      (id)            => request('DELETE', '/metrics/' + id),
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
            search: (q, page = 1, signal) => fetchOFF(
                'https://world.openfoodfacts.org/cgi/search.pl' +
                '?search_terms=' + encodeURIComponent(q) +
                '&json=true&page_size=20&page=' + page +
                '&sort_by=unique_scans_n' +
                '&fields=product_name,brands,nutriments,serving_size',
                signal
            ),
            barcode: (barcode) => fetchOFF(
                'https://world.openfoodfacts.org/api/v0/product/' + encodeURIComponent(barcode) + '.json'
            ),
        },
    };
})();
