// ═══════════════════════════════════════════
//  Service Worker
//  Network First strategy for code files
//  Cache First for static assets (icons)
// ═══════════════════════════════════════════

const CACHE_NAME = 'web-writing-v8';

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
  './figures/fig-1-1-not-dead-v2.svg',
  './figures/fig-1-2-why-now.svg',
  './figures/fig-1-3-paper-vs-web.svg',
  './figures/fig-1-4-three-paths.svg',
  './figures/fig-1-5-how-to-read.svg',
  './figures/fig-2-1-questions.svg',
  './figures/fig-2-2-persona.svg',
  './figures/fig-2-3-how-readers-read.svg',
  './figures/fig-2-4-platforms.svg',
  './figures/fig-2-5-journey.svg',
  './figures/fig-3-1-structure.svg',
  './figures/fig-3-2-prep.svg',
  './figures/fig-3-3-heading-hierarchy.svg',
  './figures/fig-3-4-paragraphs.svg',
  './figures/fig-3-5-lists-tables.svg',
  './figures/fig-3-6-outline.svg',
  './figures/fig-4-1-role.svg',
  './figures/fig-4-2-principles.svg',
  './figures/fig-4-3-lead.svg',
  './figures/fig-4-4-conclusion-first.svg',
  './figures/fig-4-5-improvement.svg',
  './figures/fig-5-1-what-is.svg',
  './figures/fig-5-2-search-engine.svg',
  './figures/fig-5-3-title-meta.svg',
  './figures/fig-5-4-keywords.svg',
  './figures/fig-5-5-links.svg',
  './figures/fig-5-6-do-not.svg',
  './figures/fig-6-1-why-sns.svg',
  './figures/fig-6-2-short-powerful.svg',
  './figures/fig-6-3-visuals.svg',
  './figures/fig-6-4-hashtags.svg',
  './figures/fig-6-5-sns-search.svg',
  './figures/fig-6-6-your-place.svg',
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
