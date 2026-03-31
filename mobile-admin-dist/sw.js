const CACHE_NAME = 'pos-admin-v11';

// Shell minimal yang wajib ada untuk SPA bisa berjalan offline
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
];

// ─── Install: pre-cache shell app ───────────────────────────
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

// ─── Activate: hapus cache versi lama ───────────────────────
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ─── Fetch: strategi bertingkat ─────────────────────────────
self.addEventListener('fetch', (e) => {
  // Hanya handle GET request
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // 1. API calls — selalu ke network, tidak di-cache
  //    Data bisnis harus selalu fresh dari server
  if (url.pathname.startsWith('/api')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // 2. Vite hashed assets (/assets/) dan icons — Cache-First
  //    File ini punya hash di nama (misal index-Abc123.js), artinya immutable.
  //    Kalau sudah di cache, langsung serve tanpa cek network.
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    e.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(e.request);
        if (cached) return cached;

        // Belum di cache — fetch, simpan, return
        try {
          const response = await fetch(e.request);
          if (response.ok) cache.put(e.request, response.clone());
          return response;
        } catch {
          // Asset belum pernah di-cache dan offline — tidak bisa berbuat banyak
          return new Response('Asset tidak tersedia offline.', { status: 503 });
        }
      })
    );
    return;
  }

  // 3. Semua request lain (HTML, manifest, sw.js) — Stale-While-Revalidate
  //    Serve dari cache segera, fetch di background untuk update.
  //    Jika network gagal dan ada cache → pakai cache.
  //    Jika network gagal dan tidak ada cache → fallback ke index.html (SPA shell).
  e.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(e.request).then((cached) => {
        const fetchPromise = fetch(e.request)
          .then((response) => {
            if (response.ok) cache.put(e.request, response.clone());
            return response;
          })
          .catch(() => {
            // Offline fallback: kembalikan cached version atau SPA shell
            return cached || cache.match('./index.html');
          });

        // Langsung return cached (cepat), fetch jalan di background
        return cached || fetchPromise;
      });
    })
  );
});
