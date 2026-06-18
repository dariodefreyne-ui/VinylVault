import { createRoot } from 'react-dom/client';
import { setupTokens } from './styles/tokens.js';
import './index.css';
import App from './App.jsx';

setupTokens();

createRoot(document.getElementById('root')).render(<App />);

// Service worker registreren (enkel in productie).
// De UpdateBanner-component in App.jsx toont een melding wanneer een nieuwe
// versie klaarstaat. Na SKIP_WAITING schakelt de SW over en herlaadt de pagina.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => console.error('Service worker registratie mislukt:', err));

    // Herlaad zodra de nieuwe SW de controle overneemt, maar enkel in de tab
    // waarin de gebruiker zelf op "Bijwerken" klikte (zie useSwUpdate.js).
    // Andere open tabs herladen NIET automatisch — dat zou onopgeslagen
    // formulierdata in die tabs kunnen wissen.
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      if (sessionStorage.getItem('vv-sw-update-requested') !== '1') return;
      sessionStorage.removeItem('vv-sw-update-requested');
      refreshing = true;
      window.location.reload();
    });
  });
}
