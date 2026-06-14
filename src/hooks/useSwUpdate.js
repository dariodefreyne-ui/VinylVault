import { useState, useEffect } from 'react';

/**
 * Detecteert wanneer een nieuwe service worker in 'waiting' staat staat
 * (d.w.z. er is een nieuwe versie geïnstalleerd maar nog niet actief).
 *
 * Geeft { hasUpdate, applyUpdate } terug:
 *   - hasUpdate: true wanneer er een nieuwe versie klaarstaat
 *   - applyUpdate: stuurt SKIP_WAITING naar de wachtende SW → herlaad volgt
 */
export function useSwUpdate() {
  const [waitingWorker, setWaitingWorker] = useState(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let registration = null;

    function onUpdateFound() {
      const newWorker = registration?.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        // 'installed' + bestaande controller = nieuwe versie klaarstaat voor de gebruiker
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          setWaitingWorker(newWorker);
        }
      });
    }

    navigator.serviceWorker.ready.then((reg) => {
      registration = reg;

      // Al wachtend bij het openen van de pagina (bv. tab heropend na update)
      if (reg.waiting && navigator.serviceWorker.controller) {
        setWaitingWorker(reg.waiting);
      }

      reg.addEventListener('updatefound', onUpdateFound);
    });

    // Controleer elk uur op een nieuwe versie (voor langlopende tabs).
    const interval = setInterval(() => {
      navigator.serviceWorker.ready.then((reg) => reg.update()).catch(() => {});
    }, 60 * 60 * 1000);

    return () => {
      clearInterval(interval);
      if (registration) {
        registration.removeEventListener('updatefound', onUpdateFound);
      }
    };
  }, []);

  function applyUpdate() {
    if (!waitingWorker) return;
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  }

  return { hasUpdate: !!waitingWorker, applyUpdate };
}
