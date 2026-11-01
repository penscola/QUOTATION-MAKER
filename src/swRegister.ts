/**
 * Service Worker Registration and Network Status Tracker
 */

export function registerServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // In production or dev with sw support
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('One Step Solution Service Worker registered successfully:', registration.scope);

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
          console.warn('Service Worker registration failed (this is expected in some sandboxed iframes):', error);
        });
    });
  }
}
