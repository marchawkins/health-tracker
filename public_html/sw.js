const CACHE_NAME = 'health-tracker-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/offline.html',
    '/css/app.css',
    '/js/api.js',
    '/js/app.js',
    '/js/components/toast.js',
    '/js/components/chart.js',
    '/js/views/dashboard.js',
    '/js/views/food-log.js',
    '/js/views/weight-log.js',
    '/manifest.json',
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // API: network-first, return JSON error when offline
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(event.request).catch(() =>
                new Response(JSON.stringify({ error: 'You are offline' }), {
                    status: 503,
                    headers: { 'Content-Type': 'application/json' },
                })
            )
        );
        return;
    }

    // Static assets: cache-first, fall back to offline page
    event.respondWith(
        caches.match(event.request)
            .then(cached => cached || fetch(event.request)
                .then(res => {
                    // Cache newly fetched static assets
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
                    return res;
                })
                .catch(() => caches.match('/offline.html'))
            )
    );
});
