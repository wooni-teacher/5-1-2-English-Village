/* 알파벳 마을 service worker (최소 구조)
   - 앱 껍데기(index.html·아이콘)만 캐시해서 인터넷이 느려도 화면이 바로 열려요.
   - Firebase 같은 실시간 통신은 절대 캐시하지 않아요 (항상 네트워크).
   - 새 버전을 배포하면 CACHE 이름의 숫자만 올리면 됩니다. */
const CACHE = 'alphabet-village-v4';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // 실시간 데이터·폰트 CDN·모듈은 네트워크 우선 (캐시하지 않음)
  if (/firebaseio|googleapis|gstatic|firebase/.test(url.hostname)) return;
  if (url.origin !== self.location.origin) return;
  // 앱 껍데기: 네트워크 우선, 실패하면 캐시 (오프라인에서도 열려요)
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
