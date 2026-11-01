/**
 * Service Worker Registration and Network Status Tracker
 * In dev environments or sandbox iframes, actively unregisters stale service workers
 * to ensure Vite modules never get intercepted.
 */

export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // If in development mode or Vite dev server, unregister all existing service workers
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then((success) => {
          if (success) {
            console.log('Cleaned up stale development service worker:', registration.scope);
          }
        });
      }
    });
    // Also clean up caches that might contain stale Vite chunks
    if ('caches' in window) {
      caches.keys().then((keys) => {
        for (const key of keys) {
          if (key.includes('onestep') || key.includes('quotation')) {
            caches.delete(key);
          }
        }
      });
    }
    return;
  }

  // In production builds, register the service worker for offline asset caching
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('New content available; refresh to update.');
                } else {
                  console.log('Content is cached for offline use.');
                }
              }
            };
          }
        };
      })
      .catch((error) => {
        console.warn('Service Worker registration skipped or failed:', error);
      });
  });
}
