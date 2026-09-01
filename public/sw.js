// Service worker minimo: solo habilita la instalacion como PWA.
// No cachea nada (V1 sin modo offline).
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Pass-through: dejamos que el navegador maneje cada request normalmente.
});
