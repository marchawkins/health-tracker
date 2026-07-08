const CACHE_NAME = 'health-v2';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/offline.html',
    '/manifest.json',
    '/css/app.css',
    '/js/utils.js',
    '/js/api.js',
    '/js/app.js',
    '/js/components/toast.js',
    '/js/components/chart.js',
    '/js/components/scanner.js',
    '/js/views/login.js',
    '/js/views/register.js',
    '/js/views/forgot-password.js',
    '/js/views/reset-password.js',
    '/js/views/verify-email.js',
    '/js/views/dashboard.js',
    '/js/views/food-log.js',
    '/js/views/weight-log.js',
    '/js/views/metric-log.js',
    '/js/views/profile.js',
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

    // API: network-only, return JSON error when offline
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

    // Static assets: network-first so deploys are picked up immediately.
    // Falls back to cache when offline; falls back to offline.html as last resort.
    event.respondWith(
        fetch(event.request)
            .then(res => {
                // Only cache successful same-origin responses
                if (res.ok && url.origin === self.location.origin) {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
                }
                return res;
            })
            .catch(() =>
                caches.match(event.request)
                    .then(cached => cached || caches.match('/offline.html'))
            )
    );
});
