import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// URL pública del sitio (del .env de la raíz) para los botones "Ver en la web"
const rootEnv = loadEnv('', path.resolve(__dirname, '../..'), '');
const siteUrl = rootEnv.SITE_URL || `http://localhost:${rootEnv.FRONT_PORT || 4321}`;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: { __SITE_URL__: JSON.stringify(siteUrl.replace(/\/+$/, '')) },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // @raco/blocks también importa React: una sola copia para que funcionen los hooks
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
    },
  },
});
