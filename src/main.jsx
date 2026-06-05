import { createRoot } from 'react-dom/client';
import { setupTokens } from './styles/tokens.js';
import './index.css';
import App from './App.jsx';

setupTokens();

createRoot(document.getElementById('root')).render(<App />);

// Service worker registreren (enkel in productie). Zorgt voor offline openen
// en sneller herladen; updates worden automatisch opgepikt.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => console.error('Service worker registratie mislukt:', err));

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Niet herladen bij de allereerste installatie, en geen herlaad-lus.
      if (!hadController || refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  });
}
