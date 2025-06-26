const CACHE_NAME = "driver-app-cache-v1";
const urlsToCache = [
  "/",
  "/login",
  "/alert",
  // 로그인 없는 경로만 우선 캐시
  "/app.js",
  "/manifest.json",
  "/icons/home.png",
  "/icons/bell.png",
  "/icons/bluearrow.png",
  "/icons/money.png",
  "/icons/backward.png",
  "/icons/logout.png",
  "/icons/next.png",
  "/icons/prev.png",
];

// 설치 단계: 캐시 저장
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        urlsToCache.map(async url => {
          try {
            const response = await fetch(url, { redirect: 'follow' });
            if (response.ok) {
              await cache.put(url, response);
              console.log(`✅ 캐시 성공: ${url}`);
            } else {
              console.warn(`⚠️ 캐시 실패 (응답 오류): ${url} - ${response.status}`);
            }
          } catch (err) {
            console.warn(`❌ 캐시 실패: ${url}`, err);
          }
        })
      );
    })
  );
});

// 요청 가로채기
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request, { redirect: 'follow' });
    }).catch(err => {
      return new Response("오프라인 상태입니다.", {
        status: 408,
        statusText: "Network Timeout"
      });
    })
  );
});
