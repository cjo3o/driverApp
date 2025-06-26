const CACHE_NAME = "driver-app-cache-v1";
const urlsToCache = [
  "/",
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
            // 리다이렉트 응답(3xx)이면 캐시하지 않음
            if (response.ok && !response.redirected) {
              await cache.put(url, response.clone());
              console.log(`✅ 캐시 성공: ${url}`);
            } else {
              console.warn(`⚠️ 캐시 실패 (응답 오류 또는 리다이렉트): ${url} - ${response.status}`);
            }
          } catch (err) {
            console.warn(`❌ 캐시 실패: ${url}`, err);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // 만약 캐시 응답이 리다이렉트면 무시하고 네트워크로 다시 시도
        if (cachedResponse.type === 'opaqueredirect' || (cachedResponse.status >= 300 && cachedResponse.status < 400)) {
          return fetch(event.request, { redirect: 'follow' });
        }
        return cachedResponse;
      }
      // 캐시에 없으면 네트워크 fetch
      return fetch(event.request, { redirect: 'follow' });
    }).catch(() => {
      return new Response("오프라인 상태입니다.", {
        status: 408,
        statusText: "Network Timeout"
      });
    })
  );
});
