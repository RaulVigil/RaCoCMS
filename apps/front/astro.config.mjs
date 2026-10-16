import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Las variables viven en el .env de la raíz del monorepo (igual que la API)
const rootEnv = fileURLToPath(new URL('../../.env', import.meta.url));
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

export default defineConfig({
  // Bajo demanda: lo que se publica en el panel se ve al instante, sin recompilar el sitio
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  server: { port: Number(process.env.FRONT_PORT) || 4321, host: true },
  vite: {
    plugins: [tailwindcss()],
    // Los paquetes del monorepo se distribuyen como TypeScript: Vite los compila junto al sitio
    ssr: { noExternal: ['@raco/blocks', '@raco/shared'] },
    resolve: { dedupe: ['react', 'react-dom'] },
    esbuild: { jsx: 'automatic' },
  },
});
