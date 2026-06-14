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

    // Herlaad zodra de nieuwe SW de controle overneemt (na klik op "Bijwerken").
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  });
}
