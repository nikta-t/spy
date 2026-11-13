// sw.js — офлайн-кэш «Шпиона» (координатор). Версию подставляет build.mjs.
const V = 'spy-bc44ac0b43';
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== V && k.startsWith('spy-')).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // страница игры: сначала сеть (чтобы приходили обновления), без сети — из кэша
  if (req.mode === 'navigate' || (url.origin === location.origin && /\/$|\.html$/.test(url.pathname))) {
    e.respondWith(
      fetch(req).then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(V).then(c => c.put('./index.html', copy)); }
        return res;
      }).catch(() => caches.match('./index.html').then(m => m || caches.match('./')))
    );
    return;
  }
  // иконки, манифест, шрифты, библиотеки: из кэша, иначе из сети с сохранением
  if (url.origin === location.origin || /(^|\.)fonts\.(googleapis|gstatic)\.com$|(^|\.)unpkg\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(m => m || fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(V).then(c => c.put(req, copy)); }
      return res;
    })));
  }
});
