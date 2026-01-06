const CACHE_NAME = 'aetheris-final-fixed-v1';

// Sadece ana dosyaları ekle. Eğer bir dosya klasöründe yoksa cache çalışmaz.
const ASSETS = [
    './',
    './index.html',
    './about.html',
    './services.html',
    './contact.html',
    './offline.html',
    './css/style.css',
    './js/app.js',
    './js/api.js',
    './manifest.json'
];

// Kurulum: Dosyaları tek tek deneyerek önbelleğe al
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return Promise.all(
                ASSETS.map(url => {
                    return cache.add(url).catch(err => console.warn('Atlanan dosya:', url));
                })
            );
        })
    );
    self.skipWaiting();
});

// Aktivasyon: Eski cache'leri temizle
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null)
        ))
    );
    self.clients.claim();
});

// Fetch: Sonsuz döngü korumalı strateji
self.addEventListener('fetch', (e) => {
    // Sadece GET isteklerini işle, harici eklentileri (chrome-extension) engelle
    if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) return;

    e.respondWith(
        caches.match(e.request).then(cachedResponse => {
            // 1. Önbellekte varsa döndür
            if (cachedResponse) return cachedResponse;

            // 2. Yoksa ağdan çekmeyi dene
            return fetch(e.request).then(networkResponse => {
                // Başarılıysa cache'e ekle
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(e.request, responseClone));
                }
                return networkResponse;
            }).catch(() => {
                // 3. İNTERNET YOKSA VE ÖNBELLEKTE YOKSA:
                // Sadece sayfa navigasyonları (HTML tıklamaları) için offline.html ver
                if (e.request.mode === 'navigate') {
                    return caches.match('./offline.html');
                }
                
                // Resimler (placeholder vb.) için ASLA offline.html döndürme!
                // Sadece hata döndür, böylece döngü kırılır.
                return new Response('Offline Content Not Available', { status: 404 });
            });
        })
    );
});