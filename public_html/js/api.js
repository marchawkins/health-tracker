const API = (() => {
    async function request(method, path, body, signal) {
        const opts = { method, headers: { 'Content-Type': 'application/json' } };
        if (body !== undefined) opts.body = JSON.stringify(body);
        if (signal)             opts.signal = signal;

        const res  = await fetch('/api' + path, opts);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Request failed (' + res.status + ')');
        return data;
    }

    return {
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
            get:  ()     => request('GET', '/profile'),
            save: (data) => request('PUT', '/profile', data),
        },
        OFF: {
            search:  (q, page = 1) => request('GET', '/openfoodfacts?action=search&q=' + encodeURIComponent(q) + '&page=' + page),
            barcode: (barcode)     => request('GET', '/openfoodfacts?action=barcode&barcode=' + encodeURIComponent(barcode)),
        },
    };
})();
