import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Injecteert een unieke build-timestamp in dist/sw.js zodat de browser
// na elke deployment een nieuwe service worker detecteert en de UpdateBanner toont.
function injectSwVersion() {
  return {
    name: 'inject-sw-version',
    apply: 'build',
    closeBundle() {
      const swPath = path.resolve(__dirname, 'dist/sw.js');
      try {
        const code = readFileSync(swPath, 'utf-8');
        writeFileSync(swPath, code.replace('__VV_BUILD__', `vv-${Date.now()}`));
      } catch { /* dist/sw.js bestaat niet → geen actie nodig */ }
    },
  };
}

export default defineConfig({
  plugins: [react(), injectSwVersion()],
  envPrefix: 'VITE_',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
