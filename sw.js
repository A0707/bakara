// BAKARA Service Worker
// Cache strategy: stale-while-revalidate for assets, network-first for Supabase
const CACHE = 'bakara-v1';
const SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL).catch(err => console.warn('SW cache failed:', err)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Never cache Supabase calls - always go to network (need fresh data + auth)
  if (url.hostname.includes('supabase.co') || url.hostname.includes('supabase.in')) {
    return; // Let browser handle normally
  }

  // For navigation requests (HTML pages), use network-first with cache fallback
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request).then(r => r || caches.match('/')))
    );
    return;
  }

  // For other GET requests (CDN scripts, icons), use cache-first with network update
  if (e.request.method === 'GET') {
    e.respondWith(
      caches.match(e.request).then(cached => {
        const fetchPromise = fetch(e.request)
          .then(res => {
            if (res && res.status === 200) {
              const copy = res.clone();
              caches.open(CACHE).then(c => c.put(e.request, copy));
            }
            return res;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
