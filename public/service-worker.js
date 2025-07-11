const CACHE_NAME = 'pwa-cache-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// 설치 단계: 캐시 저장
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        urlsToCache.map(url =>
          fetch(url).then(response => {
            if (!response.ok) throw new Error(`Request failed: ${url}`);
            return cache.put(url, response);
          }).catch(err => {
            console.warn(`캐시 실패: ${url}`, err);
          })
        )
      );
    })
  );
});


// 요청 가로채기
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});


///
//self.addEventListener('install', event => {
//  console.log('[Service Worker] Installed');
//  self.skipWaiting(); // 설치 후 즉시 활성화
//});

//self.addEventListener('activate', event => {
//  console.log('[Service Worker] Activated');
//});

//self.addEventListener('fetch', event => {
  // 기본 네트워크 요청 처리
//  event.respondWith(fetch(event.request));
//});
