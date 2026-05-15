const API = (() => {
    async function request(method, path, body) {
        const opts = { method, headers: { 'Content-Type': 'application/json' } };
        if (body !== undefined) opts.body = JSON.stringify(body);

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
            list:        (date) => request('GET',    '/foods?date=' + date),
            autocomplete: (q)   => request('GET',    '/foods/autocomplete?q=' + encodeURIComponent(q)),
            create:      (data) => request('POST',   '/foods', data),
            remove:       (id)  => request('DELETE', '/foods/' + id),
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
    };
})();
