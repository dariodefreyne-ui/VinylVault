import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { setupTokens } from './styles/tokens.js';
import './index.css';
import App from './App.jsx';

setupTokens();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
