/**
 * The smallest service worker that is still a service worker.
 *
 * It exists for one reason: Chrome wants a fetch handler before it will offer
 * to install a site as an app. It caches nothing, on purpose. This app serves
 * a directory of personal documents, and a cache is a copy
 * of those on disk, outside the app's control, surviving sign-out. The right
 * amount of that is none, so every request goes to the network exactly as it
 * would without a worker here.
 *
 * If offline support is ever wanted, cache the shell (the CSS, the icons) and
 * never a document or an API response.
 */
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {})
