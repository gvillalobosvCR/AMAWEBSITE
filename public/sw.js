const CACHE_NAME = 'arenal-waiver-v1'
const ASSETS = [
  '/manifest.json',
  '/logo.png',
  '/favicon.ico',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS)
    })
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (e) => {
  // Do not intercept Next.js dynamic paths or server actions
  if (
    e.request.url.includes('/_next/') ||
    e.request.url.includes('/api/') ||
    e.request.method !== 'GET'
  ) {
    return
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request)
    })
  )
})
