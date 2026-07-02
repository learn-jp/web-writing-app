// ═══════════════════════════════════════════
//  Service Worker
//  Network First strategy for code files
//  Cache First for static assets (icons)
// ═══════════════════════════════════════════

const CACHE_NAME = 'web-writing-v1';

const APP_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './auth.js',
  './content.js',
  './manifest.json',
  './favicon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// インストール時：ファイルをキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(APP_ASSETS).catch(err => console.log('Cache addAll error:', err))
    )
  );
  self.skipWaiting();
});

// アクティブ時：古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// fetch戦略：コードファイルは Network First、その他は Cache First
function networkFirst(request) {
  return fetch(request)
    .then(response => {
      const clone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
      return response;
    })
    .catch(() => caches.match(request));
}

function cacheFirst(request) {
  return caches.match(request).then(cached => {
    if (cached) return cached;
    return fetch(request).then(response => {
      const clone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
      return response;
    });
  });
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 外部ドメイン（GAS等）はSWを通さない
  if (url.origin !== self.location.origin) return;

  const path = url.pathname;
  const isNetworkFirst =
    path.endsWith('.html') ||
    path.endsWith('.css')  ||
    path.endsWith('.js')   ||
    path === '/'           ||
    path.endsWith('/');

  event.respondWith(isNetworkFirst ? networkFirst(event.request) : cacheFirst(event.request));
});
