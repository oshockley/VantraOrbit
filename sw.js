const CACHE_NAME = 'solar-system-v1.0.0';
const urlsToCache = [
  './',
  './index.html',
  './js/solar-system.js',
  './js/mobile-optimizations.js',
  './manifest.json',
  './textures/earth.jpg',
  './textures/mars.jpg',
  './textures/jupiter.jpg',
  './textures/saturn.jpg',
  './textures/mercury.jpg',
  './textures/venus.jpg',
  './textures/uranus.jpg',
  './textures/neptune.jpg',
  './textures/sun.jpg',
  './textures/moon.jpg',
  './textures/saturn_rings.png',
  './textures/stars_milky_way_8k.jpg',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          function(response) {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
    );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
